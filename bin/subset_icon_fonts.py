#!/usr/bin/env python
"""Shrink the Font Awesome web fonts in a built site to the icons it uses.

Run after `jekyll build`: scans the site's HTML and JavaScript for `fa-*`
class names, looks up their code points in the built main.css, and subsets
assets/webfonts/fa-*.woff2 to those glyphs. Adding an icon to the site
needs nothing extra; the next build keeps it.

Usage: python bin/subset_icon_fonts.py [_site]
"""

import re
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

site = Path(sys.argv[1] if len(sys.argv) > 1 else "_site")

# class name -> code point, e.g. .fa-github{--fa:""}
css = (site / "assets/css/main.css").read_text(encoding="utf-8")
codepoints = {}
for selectors, value in re.findall(r"([^{}]+)\{--fa:\"(.)\"", css):
    for name in re.findall(r"\.fa-([a-z0-9-]+)", selectors):
        codepoints[name] = ord(value)

used = set()
for path in list(site.rglob("*.html")) + list(site.rglob("*.js")):
    used.update(re.findall(r"fa-([a-z0-9-]+)", path.read_text(encoding="utf-8", errors="ignore")))
wanted = sorted({codepoints[name] for name in used if name in codepoints})
if not wanted:
    sys.exit("no Font Awesome icons found; leaving the fonts untouched")

for font_path in sorted((site / "assets/webfonts").glob("fa-*.woff2")):
    before = font_path.stat().st_size
    font = TTFont(font_path)
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=wanted)
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(font_path)
    print(f"{font_path.name}: {before // 1024} KiB -> {font_path.stat().st_size // 1024} KiB")
print(f"kept {len(wanted)} icons")
