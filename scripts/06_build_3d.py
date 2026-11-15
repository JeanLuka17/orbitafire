"""Step 4b: build the self-contained 3D view (docs/3d.html).

Inlines MapLibre GL JS (BSD-3) and the website data into one HTML file, so it
works on GitHub Pages and when opened directly from disk. Imagery (NASA GIBS
Blue Marble; Sentinel-2 cloudless 2016 by EOX, CC BY 4.0, for close-up views) and terrain
(AWS Terrain Tiles) load from their public servers. Marine protected areas are
left out (no wildfire relevance); Communal Reserves get name labels and buffer zones.

Usage:  python scripts/06_build_3d.py

Developed by the OrbitaFire team with AI assistance (Claude, Anthropic).
See README > "AI assistance".
"""
import json
from pathlib import Path

from shapely.geometry import Point, Polygon, mapping, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
web, data = ROOT / "web3d", ROOT / "docs" / "data"

cells = json.loads((data / "cells.json").read_text(encoding="utf-8"))
areas = json.loads((data / "areas.json").read_text(encoding="utf-8"))
regions = json.loads((data / "regions.json").read_text(encoding="utf-8"))

# Approximate Peruvian Amazon (lowland + montane forest east of the Andes), hand-traced along the
# eastern Andean front and clipped to Peru. Used only to focus the view; it is not an official limit.
ANDES_FRONT = [(-79.4, -4.4), (-79.1, -5.6), (-78.6, -6.5), (-77.9, -7.3), (-77.3, -8.3), (-76.6, -9.3),
               (-76.2, -10.2), (-75.6, -10.9), (-75.0, -11.6), (-74.2, -12.3), (-73.3, -12.9), (-72.4, -13.0),
               (-71.6, -13.3), (-70.6, -13.7), (-69.8, -14.1), (-69.0, -14.6)]
EAST = [(-67.5, -14.6), (-67.5, -8), (-70, -2), (-70.5, 0.5), (-75.5, 0.5), (-78.5, -2.5)]
peru = unary_union([shape(f["geometry"]) for f in regions["features"]])
amazon = Polygon(ANDES_FRONT + EAST).intersection(peru).simplify(0.02)
MARINE = ("RN16", "RN18", "RN13")  # Dorsal de Nasca, Mar Tropical de Grau, guano islands: no wildfire relevance
keep = ("name", "cat", "mean", "r2024")
all_features = areas["features"]
areas["features"] = [{**f, "properties": {k: f["properties"][k] for k in keep}}
                     for f in all_features if f["properties"]["kind"] == "area" and not f["properties"]["code"].startswith(MARINE)]
buffers = {"type": "FeatureCollection", "features": [
    {**f, "properties": {"name": f["properties"]["name"]}} for f in all_features
    if f["properties"]["kind"] == "buffer" and f["properties"]["cat"] == "Reserva Comunal"]}
labels = []
for f in all_features:
    if f["properties"]["kind"] == "area" and f["properties"]["cat"] == "Reserva Comunal":
        pt = shape(f["geometry"]).representative_point()
        labels.append({"name": f["properties"]["name"], "lon": round(pt.x, 4), "lat": round(pt.y, 4)})
payload = {"years": cells["years"], "res": cells["res"],
           "cells": [{"la": c["la"], "lo": c["lo"], "y": c["y"], "az": int(amazon.contains(Point(c["lo"], c["la"])))}
                     for c in cells["cells"]],
           "regions": regions, "areas": areas, "buffers": buffers, "labels": labels,
           "amazon": {"type": "Feature", "properties": {}, "geometry": mapping(amazon)}}
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
