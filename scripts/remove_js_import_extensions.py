#!/usr/bin/env python3
"""
Removes `.js` suffixes from local import/require specifiers inside the `app/` tree.

Examples transformed:
    import Foo from './Foo.js'     -> import Foo from './Foo'
    export * from '../bar.js'      -> export * from '../bar'
    const data = require('./x.js') -> const data = require('./x')

Run from repo root:
    python scripts/remove_js_import_extensions.py
"""
from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
APP_ROOT = REPO_ROOT / "app"

IMPORT_RE = re.compile(r"(from\s+['\"])([^'\"?]+?)(\.js)(['\"])", re.MULTILINE)
EXPORT_RE = re.compile(r"(import\s+[^;]+?\s+from\s+['\"])([^'\"?]+?)(\.js)(['\"])", re.MULTILINE)
REQUIRE_RE = re.compile(r"(require\(\s*['\"])([^'\"?]+?)(\.js)(['\"]\s*\))", re.MULTILINE)
DYNAMIC_IMPORT_RE = re.compile(r"(import\(\s*['\"])([^'\"?]+?)(\.js)(['\"]\s*\))", re.MULTILINE)


def strip_suffix(match: re.Match[str]) -> str:
    return f"{match.group(1)}{match.group(2)}{match.group(4)}"


def process_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if ".js'" not in text and '.js"' not in text:
        return False

    updated = False
    for pattern in (IMPORT_RE, EXPORT_RE, REQUIRE_RE, DYNAMIC_IMPORT_RE):
        new_text, count = pattern.subn(strip_suffix, text)
        if count:
            updated = True
            text = new_text

    if updated:
        path.write_text(text, encoding="utf-8")
    return updated


def main() -> None:
    changed = 0
    for ts_file in APP_ROOT.rglob("*.ts*"):
        if process_file(ts_file):
            changed += 1
    print(f"Updated {changed} files")


if __name__ == "__main__":
    main()
