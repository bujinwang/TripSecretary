const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOTS = [
  path.join(__dirname, '..', 'app', 'screens'),
  path.join(__dirname, '..', 'app', 'components'),
];

const TARGET_EXTS = new Set(['.ts', '.tsx', '.jsx', '.js']);
const TEXT_COMPONENT_NAMES = new Set(['Text']);
const STRING_PROPS = new Set(['title', 'label', 'placeholder', 'aria-label', 'alt', 'headerTitle']);

function collectFiles(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      collectFiles(full, out);
    } else if (TARGET_EXTS.has(path.extname(e.name))) {
      out.push(full);
    }
  }
}

function isNonTrivialString(text) {
  const t = text.trim();
  if (!t) return false;
  if (/^\{.*\}$/.test(t)) return false; // already expression
  // Allow small symbols
  if (/^[•★☆✓✕✖—…()%›🛂🎫🏨👤⚙️✈️🗣️🆘⚠️✅]+$/.test(t)) return false;
  return true;
}

function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const source = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const issues = [];

  function visit(node) {
    // JSX Text children
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const open = ts.isJsxElement(node) ? node.openingElement : node;
      const nameNode = open.tagName;
      const tagName = ts.isIdentifier(nameNode) ? nameNode.text : undefined;

      // Check string props
      const props = open.attributes?.properties || [];
      for (const prop of props) {
        if (ts.isJsxAttribute(prop)) {
          const propName = prop.name.text;
          if (STRING_PROPS.has(propName) && prop.initializer && ts.isStringLiteral(prop.initializer)) {
            const { line, character } = source.getLineAndCharacterOfPosition(prop.initializer.getStart());
            issues.push({
              type: 'prop',
              prop: propName,
              value: prop.initializer.text,
              file: filePath,
              line: line + 1,
              col: character + 1,
              suggestionNamespace: 'common',
            });
          }
        }
      }

      // Check children literals
      if (ts.isJsxElement(node)) {
        for (const child of node.children) {
          if (ts.isJsxText(child)) {
            const text = child.getText();
            if (isNonTrivialString(text)) {
              const { line, character } = source.getLineAndCharacterOfPosition(child.getStart());
              issues.push({
                type: 'text',
                tag: tagName,
                value: text.trim(),
                file: filePath,
                line: line + 1,
                col: character + 1,
                suggestionNamespace: 'common',
              });
            }
          }
        }
      }
    }

    // Navigation options object: title: '...'
    if (ts.isPropertyAssignment(node)) {
      const name = node.name;
      if (ts.isIdentifier(name) && name.text === 'title') {
        const init = node.initializer;
        if (init && ts.isStringLiteral(init)) {
          const { line, character } = source.getLineAndCharacterOfPosition(init.getStart());
          issues.push({
            type: 'navTitle',
            value: init.text,
            file: filePath,
            line: line + 1,
            col: character + 1,
            suggestionNamespace: 'screenTitles',
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(source);
  return issues;
}

function main() {
  const files = [];
  for (const root of ROOTS) {
    if (fs.existsSync(root)) collectFiles(root, files);
  }
  const results = [];
  for (const f of files) {
    try {
      const issues = auditFile(f);
      if (issues.length) results.push(...issues);
    } catch (e) {
      // skip parse errors
    }
  }
  const outPath = path.join(__dirname, '..', 'i18n-audit-report.json');
  fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), count: results.length, results }, null, 2));
  console.log(`i18n audit complete: ${results.length} issues. Report: ${outPath}`);
}

main();