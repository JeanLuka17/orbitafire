"""Export the most recent individual hotspots (last 30 days of the record) for the 2D map.

Reads the cleaned detections (same filters as the rest of the pipeline: confident, vegetation
fires, static sources removed) and writes docs/data/recent_points.json with one compact row per
detection: [lat, lon, day offset from the last date, sensor (0 VIIRS, 1 MODIS), FRP in MW].

Usage:  python scripts/10_build_recent_points.py

Developed by the OrbitaFire team with AI assistance (Claude, Anthropic). See README > "AI assistance".
"""
import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DAYS = 30

d = pd.read_parquet(ROOT / "data" / "processed" / "detections_clean.parquet",
                    columns=["lat", "lon", "date", "sensor", "frp"])
d["date"] = pd.to_datetime(d["date"])
last = d["date"].max()
recent = d[d["date"] > last - pd.Timedelta(days=DAYS)].copy()
recent["age"] = (last - recent["date"]).dt.days
rows = [[round(r.lat, 3), round(r.lon, 3), int(r.age), 0 if r.sensor == "VIIRS" else 1,
         None if pd.isna(r.frp) else round(float(r.frp), 1)]
        for r in recent.sort_values(["age", "lat"], ascending=[False, True]).itertuples()]
out = {"last_date": last.strftime("%Y-%m-%d"), "days": DAYS,
       "fields": ["lat", "lon", "days_before_last", "sensor_0viirs_1modis", "frp_mw"],
       "source": "NASA FIRMS (VIIRS 375 m C2 S-NPP/NOAA-20/NOAA-21; MODIS C6.1 Terra/Aqua), cleaned by OrbitaFire",
       "points": rows}
path = ROOT / "docs" / "data" / "recent_points.json"
path.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
print(f"{path} · {len(rows)} hotspots · {(last - pd.Timedelta(days=DAYS - 1)).date()} to {last.date()} · {path.stat().st_size / 1e3:.0f} kB")
