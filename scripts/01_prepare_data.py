"""Step 1: read FIRMS downloads, clean them and build the monthly grid panel.

Developed by the OrbitaFire team with AI assistance (Claude, Anthropic).
See README > "AI assistance".

Usage:
    python scripts/01_prepare_data.py --raw data/raw --out data/processed --res 0.25
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from orbitafire import grid, load  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", default="data/raw")
    ap.add_argument("--out", default="data/processed")
    ap.add_argument("--res", type=float, default=0.25)
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)

    raw = load.read_firms_folder(a.raw)
    det, report = load.clean(raw)
    det.to_parquet(out / "detections_clean.parquet", index=False)

    panel = grid.monthly_panel(det, a.res)
    panel.to_parquet(out / f"panel_{a.res}deg.parquet", index=False)

    yearly = (det.assign(year=det["date"].dt.year)
                 .pivot_table(index="year", columns="satellite", values="lat", aggfunc="size", fill_value=0))
    yearly.to_csv(out / "detections_per_year.csv")

    report.update({
        "resolution_deg": a.res,
        "cells": int(panel["cell"].nunique()),
        "months": int(panel["month"].nunique()),
        "first_month": str(panel["month"].min().date()),
        "last_month": str(panel["month"].max().date()),
        "last_date_per_satellite": {s: str(d.date()) for s, d in det.groupby("satellite")["date"].max().items()},
    })
    (out / "prepare_report.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))
    print(yearly.to_string())


if __name__ == "__main__":
    main()
