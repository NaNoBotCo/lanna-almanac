#!/usr/bin/env python3
"""Build the widget: inline almanac.js into template.html -> one self-contained file.

Outputs:
  out/almanac.html                     — the widget, committed (it IS the deliverable)
  ~/Desktop/Lanna Almanac.html         — the copy you actually open

Run:  python3 build.py
"""
from __future__ import annotations

import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARK = "/*__ALMANAC_JS__*/"


def main() -> None:
    template = (HERE / "template.html").read_text(encoding="utf-8")
    js = (HERE / "almanac.js").read_text(encoding="utf-8")
    assert MARK in template, f"template lost its {MARK} marker"
    html = template.replace(MARK, js)

    out = HERE / "out" / "almanac.html"
    out.parent.mkdir(exist_ok=True)
    out.write_text(html, encoding="utf-8")

    desktop = Path.home() / "Desktop" / "Lanna Almanac.html"
    shutil.copy2(out, desktop)

    kb = len(html.encode("utf-8")) / 1024
    print(f"built {out}  ({kb:.0f} KB, one file, no network)")
    print(f"copied -> {desktop}")


if __name__ == "__main__":
    main()
