"""Step 4b: build the self-contained 3D view (docs/3d.html).

Inlines MapLibre GL JS (BSD-3) and the website data into one HTML file, so it
works on GitHub Pages and when opened directly from disk. Imagery (NASA GIBS
Blue Marble) and terrain (AWS Terrain Tiles) load from their public servers.

Usage:  python scripts/06_build_3d.py

Developed by the OrbitaFire team with AI assistance (Claude, Anthropic).
See README > "AI assistance".
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
web, data = ROOT / "web3d", ROOT / "docs" / "data"

cells = json.loads((data / "cells.json").read_text())
areas = json.loads((data / "areas.json").read_text())
regions = json.loads((data / "regions.json").read_text())
keep = ("name", "cat", "mean", "r2024")
areas["features"] = [{**f, "properties": {k: f["properties"][k] for k in keep}}
                     for f in areas["features"] if f["properties"]["kind"] == "area"]
payload = {"years": cells["years"], "res": cells["res"],
           "cells": [{"la": c["la"], "lo": c["lo"], "y": c["y"]} for c in cells["cells"]],
           "regions": regions, "areas": areas}
html = (web / "template.html").read_text()
js = (web / "vendor" / "maplibre-gl.js").read_text().replace("</script", "<\\/script")
html = (html.replace("/*MAPLIBRE_CSS*/", (web / "vendor" / "maplibre-gl.css").read_text())
            .replace("/*MAPLIBRE_JS*/", js)
            .replace("/*DATA*/", json.dumps(payload, separators=(",", ":"), ensure_ascii=False)))
out = ROOT / "docs" / "3d.html"
out.write_text(html)
print(f"{out} {out.stat().st_size / 1e6:.2f} MB")
