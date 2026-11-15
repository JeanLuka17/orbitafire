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

cells = json.loads((data / "cells.json").read_text(encoding="utf-8"))
areas = json.loads((data / "areas.json").read_text(encoding="utf-8"))
regions = json.loads((data / "regions.json").read_text(encoding="utf-8"))
keep = ("name", "cat", "mean", "r2024")
areas["features"] = [{**f, "properties": {k: f["properties"][k] for k in keep}}
                     for f in areas["features"] if f["properties"]["kind"] == "area"]
payload = {"years": cells["years"], "res": cells["res"],
           "cells": [{"la": c["la"], "lo": c["lo"], "y": c["y"]} for c in cells["cells"]],
           "regions": regions, "areas": areas}
# Reuse the monthly grid record, including the real partial 2000 record.
control = json.loads((data / "control.json").read_text(encoding="utf-8"))
payload["years"] = list(range(2000, 2027))
payload["months"] = control["months"]
lookup = {f"{c['lat']:.3f}_{c['lon']:.3f}": c for c in control["cells"]}
for c in payload["cells"]:
    m = lookup[f"{c['la']:.3f}_{c['lo']:.3f}"]["v"]
    c["m"] = m
    c["y"] = [sum(v for date, v in zip(control["months"], m) if date.startswith(str(y)) and date <= "2026-10" and v is not None) for y in payload["years"]]
html = (web / "template.html").read_text(encoding="utf-8")
js = (web / "vendor" / "maplibre-gl.js").read_text(encoding="utf-8").replace("</script", "<\\/script")
html = (html.replace("/*MAPLIBRE_CSS*/", (web / "vendor" / "maplibre-gl.css").read_text(encoding="utf-8"))
            .replace("/*MAPLIBRE_JS*/", js)
            .replace("/*DATA*/", json.dumps(payload, separators=(",", ":"), ensure_ascii=False)))
out = ROOT / "docs" / "3d.html"
out.write_text(html, encoding="utf-8")
print(f"{out} {out.stat().st_size / 1e6:.2f} MB")
