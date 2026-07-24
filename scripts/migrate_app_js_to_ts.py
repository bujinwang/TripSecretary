#!/usr/bin/env python3
"""
Utility script to batch-rename every `app/**/*.js` file to `.ts` or `.tsx`.

Heuristics:
  * Files living under components/screens/templates always become `.tsx`.
  * Other files become `.tsx` only if we detect JSX-like syntax.
  * All converted files receive a leading `// @ts-nocheck` banner unless one exists already.

Run from the project root:
    python scripts/migrate_app_js_to_ts.py [--dry-run]
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
APP_ROOT = REPO_ROOT / "app"

# Directory segments that should always be treated as JSX-heavy.
FORCE_TSX_SEGMENTS = {
    "components",
    "screens",
    "templates",
}

# Regexes that signal JSX syntax (not just generic `<T>` tokens).
JSX_SNIPPETS = [
    re.compile(r"</\s*[A-Za-z][A-Za-z0-9]*(\s|>)"),  # closing tags e.g. </View>
    re.compile(r"<\s*[A-Za-z][A-Za-z0-9]*(\s[^>]*?)?/>"),  # self-closing tags e.g. <Text />
    re.compile(r"<\s*[A-Za-z][A-Za-z0-9]*\s[^>]*>"),  # opening tags with props e.g. <Item foo=\"bar\">
]

TS_NOCHECK_BANNER = "// @ts-nocheck\n\n"


def gather_js_files() -> list[Path]:
    return sorted(APP_ROOT.rglob("*.js"))


def should_force_tsx(path: Path) -> bool:
    segments = set(path.relative_to(APP_ROOT).parts)
    return bool(FORCE_TSX_SEGMENTS & segments)


def contains_jsx(text: str) -> bool:
    return any(regex.search(text) for regex in JSX_SNIPPETS)


def target_extension(path: Path, text: str) -> str:
    if should_force_tsx(path):
        return ".tsx"
    if contains_jsx(text):
        return ".tsx"
    return ".ts"


def ensure_banner(text: str) -> str:
    stripped = text.lstrip()
    if stripped.startswith("// @ts-nocheck") or stripped.startswith("/* @ts-nocheck"):
        return text
    return TS_NOCHECK_BANNER + text


def convert_file(path: Path, dry_run: bool = False) -> tuple[Path, Path] | None:
    text = path.read_text(encoding="utf-8")
    new_suffix = target_extension(path, text)
    new_path = path.with_suffix(new_suffix)

    if new_path.exists():
        rel = new_path.relative_to(REPO_ROOT)
        print(f"⚠️  Skip (target exists): {rel}")
        return None

    updated_text = ensure_banner(text)
    rel_old = path.relative_to(REPO_ROOT)
    rel_new = new_path.relative_to(REPO_ROOT)

    if dry_run:
        print(f"DRY-RUN would rename {rel_old} → {rel_new}")
        return rel_old, rel_new  # type: ignore[return-value]

    new_path.write_text(updated_text, encoding="utf-8")
    path.unlink()
    print(f"Renamed {rel_old} → {rel_new}")
    return rel_old, rel_new  # type: ignore[return-value]


def main() -> int:
    parser = argparse.ArgumentParser(description="Batch convert app/**/*.js files to TypeScript.")
    parser.add_argument("--dry-run", action="store_true", help="Only report actions without modifying files.")
    args = parser.parse_args()

    if not APP_ROOT.exists():
        print(f"App folder not found at {APP_ROOT}")
        return 1

    conversions = 0
    skipped = 0
    for js_file in gather_js_files():
        # Skip non-source artifacts (e.g., *.js.backup_old)
        if not js_file.name.endswith(".js"):
            continue
        result = convert_file(js_file, dry_run=args.dry_run)
        if result is None:
            skipped += 1
            continue
        conversions += 1

    print("\nSummary:")
    print(f"  Converted: {conversions}")
    print(f"  Skipped (existing target): {skipped}")
    if args.dry_run:
        print("  Mode: dry-run (no files changed)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
