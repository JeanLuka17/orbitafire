"""Step 4a: build the compact data files used by the website (docs/data/).

Usage:
    python scripts/05_build_web.py --sernanp data/external/sernanp --boundaries data/external/geoboundaries

Inputs: outputs of steps 1-3b, SERNANP layers (see 04_protected_areas.py) and
geoBoundaries Peru ADM1 (public domain; github.com/wmgeolab/geoBoundaries).

Outputs (docs/data/):
    status.json        national "traffic light" + headline numbers
    peru.json          yearly/monthly harmonized series, calendar, validation
    cells.json         0.25 deg cells: yearly harmonized hotspots + 2024 anomaly
    areas.geojson      simplified protected areas and buffer rings + metrics
    areas_series.json  yearly / monthly VIIRS hotspots per protected-area unit
    communities.json   native community locations (centroids), name + people
    regions.geojson    simplified department boundaries
    ranking.json       the 11 Communal Reserves

Developed by the OrbitaFire team with AI assistance (Claude, Anthropic).
See README > "AI assistance".
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import shapely
from shapely.geometry import box, mapping, shape

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from orbitafire import areas as A  # noqa: E402

RES = 0.25


def dump(obj, path):
    path.write_text(json.dumps(obj, separators=(",", ":"), ensure_ascii=False, allow_nan=False))
    print(f"{path.name:20s} {path.stat().st_size / 1024:8.0f} KB")


def clean(v, nd=2):
    if v is None or (isinstance(v, float) and not np.isfinite(v)):
        return None
    if isinstance(v, (float, np.floating)):
        return round(float(v), nd)
    if isinstance(v, np.integer):
        return int(v)
    return v


def rgeom(g, tol):
    g = shapely.simplify(g, tol, preserve_topology=True)
    return json.loads(json.dumps(mapping(shapely.set_precision(g, 1e-4))))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--processed", default="data/processed")
    ap.add_argument("--results", default="results")
    ap.add_argument("--sernanp", default="data/external/sernanp")
    ap.add_argument("--boundaries", default="data/external/geoboundaries")
    ap.add_argument("--out", default="docs/data")
    a = ap.parse_args()
    res, out, sern = Path(a.results), Path(a.out), Path(a.sernanp)
    out.mkdir(parents=True, exist_ok=True)

    yearly = pd.read_csv(res / "peru_yearly_harmonized.csv")
    monthly = pd.read_csv(res / "peru_monthly_harmonized.csv", parse_dates=["month"])
    anom = pd.read_csv(res / "monthly_anomalies.csv", parse_dates=["month"])
    yan = pd.read_csv(res / "yearly_anomalies.csv")
    cal = pd.read_csv(res / "fire_calendar.csv")
    cv = pd.read_csv(res / "cv_modis_to_viirs.csv", index_col=0)
    cvy = pd.read_csv(res / "cv_by_year.csv")
    status = json.loads((res / "current_status.json").read_text())
    rep = json.loads((res / "harmonize_report.json").read_text())
    rank = pd.read_csv(res / "communal_reserves_ranking.csv", index_col=0)
    pa = pd.read_csv(res / "protected_areas_fire.csv")
    pam = pd.read_csv(res / "protected_areas_monthly.csv")

    # ---------------- peru.json
    mm = monthly[~monthly.partial_month]
    peru = {
        "yearly": [{"y": int(r.year), "h": round(r.n_harm), "lo": round(r.lo95), "hi": round(r.hi95),
                    "m": round(r.n_modis), "v": round(r.n_viirs_obs), "src": r.source, "full": bool(r.complete_year)}
                   for r in yearly.itertuples()],
        "monthly": [{"t": r.month.strftime("%Y-%m"), "h": round(r.n_harm), "m": round(r.n_modis),
                     "v": round(r.n_viirs_obs), "src": r.source} for r in mm.itertuples()],
        "anom": [{"t": r.month.strftime("%Y-%m"), "x": round(r.value), "med": clean(r.median, 0),
                  "p10": clean(r.p10, 0), "p90": clean(r.p90, 0), "ratio": clean(r.ratio_to_median),
                  "cat": r.category} for r in anom.itertuples()],
        "calendar": [{"mo": int(r.mo), "share": round(r.median, 4), "p10": round(r.p10, 4), "p90": round(r.p90, 4)}
                     for r in cal.itertuples()],
        "years_ranked": [{"y": int(r.year), "h": round(r.value), "lo": round(r.lo95), "hi": round(r.hi95),
                          "ratio": clean(r.ratio_to_median), "cat": r.category, "rank": int(r.rank)}
                         for r in yan.sort_values("rank").itertuples()],
        "cv": {m: {"worst_year_pct": round(cv.loc[m, "yearly_max_abs_err_pct"], 1),
                   "mean_year_pct": round(cv.loc[m, "yearly_mape_pct"], 1),
                   "spearman": round(cv.loc[m, "cell_year_spearman"], 3)} for m in cv.index},
        "cv_years": [{"y": int(r.year), "model": r.model, "err": round(r.error_pct, 1)}
                     for r in cvy[(cvy.predictor == "modis") & cvy.model.isin(["ratio_global", "poisson_glm"])].itertuples()],
        "noaa20_k": round(rep["noaa20_calibration"]["k"], 3),
        "outage_days": len(rep["snpp_outage_days"]),
    }
    dump(peru, out / "peru.json")

    # ---------------- units (protected areas + buffers)
    units = A.protected_area_units(sern / "sernanp_anp_nacional.geojson", sern / "sernanp_zona_amortiguamiento.geojson")
    pa_idx = pa.set_index(["code", "kind"])
    feats = []
    for u in units.itertuples():
        r = pa_idx.loc[(u.code, u.kind)]
        props = {"id": f"{u.code}|{u.kind}", "code": u.code, "name": u.name, "cat": u.category, "kind": u.kind,
                 "km2": round(u.area_km2), "mean": clean(r.mean_per_year, 1), "y2024": clean(r.hotspots_2024, 0),
                 "r2024": clean(r.ratio_2024), "z2024": clean(r.z_2024, 1), "rank2024": clean(r.rank_2024), "trend": clean(r.trend_pct_per_year, 1),
                 "peak": r.peak_month if isinstance(r.peak_month, str) else None,
                 "ytd": clean(r.ytd_ratio_2026), "last": clean(r.last_month_ratio), "ncomm": clean(r.n_communities, 0),
                 "peoples": r.peoples if isinstance(r.peoples, str) else ""}
        feats.append({"type": "Feature", "properties": props, "geometry": rgeom(u.geometry, 0.004)})
    dump({"type": "FeatureCollection", "features": feats}, out / "areas.geojson")

    pam["year"] = pam.month.str[:4].astype(int)
    series = {}
    for (code, kind), g in pam.groupby(["code", "kind"]):
        yr = g.groupby("year").hotspots.sum()
        mon = g.set_index("month").hotspots
        last12 = pd.period_range("2025-11", "2026-10", freq="M").strftime("%Y-%m")
        clim = g[g.year <= 2025].groupby(g.month.str[5:7].astype(int)).hotspots.sum() / 14
        series[f"{code}|{kind}"] = {
            "years": {int(y): round(v) for y, v in yr.items()},
            "clim": [round(clim.get(m, 0.0), 1) for m in range(1, 13)],
            "last12": [round(mon.get(m, 0.0)) for m in last12]}
    dump(series, out / "areas_series.json")

    # ---------------- communities (centroids; collective, public attributes only)
    comm = A.read_layer(sern / "sernanp_comunidades_nativas.geojson")
    cpts = []
    for c in comm:
        p = c["geometry"].representative_point()
        cpts.append([round(p.y, 4), round(p.x, 4), str(c["nom_comuni"]).strip().title(),
                     str(c["etnia"]).strip().title()])
    dump(cpts, out / "communities.json")

    # ---------------- cells
    panel = pd.read_parquet(Path(a.processed) / "harmonized_panel_0.25deg.parquet",
                            columns=["cell", "cell_lat", "cell_lon", "month", "n_harm"])
    panel["year"] = panel.month.dt.year
    full_months = panel.month <= pd.Timestamp("2026-10-01")
    yr = panel[full_months & (panel.year >= 2001)].pivot_table(index=["cell", "cell_lat", "cell_lon"], columns="year",
                                                                values="n_harm", aggfunc="sum").fillna(0)
    ca = pd.read_csv(res / "cell_anomaly_2024.csv").set_index("cell")
    tree = shapely.STRtree(list(units.geometry))
    cxy = np.array([[c[0], c[1]] for c in cpts])
    cells = []
    for (cell, lat, lon), row in yr.iterrows():
        b = box(lon - RES / 2, lat - RES / 2, lon + RES / 2, lat + RES / 2)
        hit = tree.query(b, predicate="intersects")
        inside = (np.abs(cxy[:, 0] - lat) <= RES / 2) & (np.abs(cxy[:, 1] - lon) <= RES / 2)
        r24 = ca.ratio.get(cell, np.nan)
        cells.append({"la": lat, "lo": lon, "y": [round(v) for v in row.values],
                      "r": clean(r24), "z": clean(ca.z.get(cell, np.nan), 1),
                      "u": [f"{units.code[i]}|{units.kind[i]}" for i in hit], "c": np.flatnonzero(inside).tolist()})
    dump({"years": [int(c) for c in yr.columns], "res": RES, "cells": cells}, out / "cells.json")

    # ---------------- regions
    reg = json.loads((Path(a.boundaries) / "geoBoundaries-PER-ADM1_simplified.geojson").read_text())
    rf = [{"type": "Feature", "properties": {"name": f["properties"]["shapeName"]},
           "geometry": rgeom(shape(f["geometry"]), 0.01)} for f in reg["features"]]
    dump({"type": "FeatureCollection", "features": rf}, out / "regions.geojson")

    # ---------------- ranking + status
    rk = []
    for code, r in rank.iterrows():
        rk.append({"code": code, "name": r["name"], "regions": r.regions, "km2": round(r.area_km2),
                   "mean": clean(r.landscape_mean_per_year, 0), "inside": clean(r.inside_mean_per_year, 1),
                   "buffer": clean(r.buffer_mean_per_year, 0), "y2024": clean(r.landscape_2024, 0),
                   "r2024": clean(r.landscape_ratio_2024), "rank2024": clean(r.landscape_rank_2024),
                   "trend": clean(r.landscape_trend_pct_per_year, 1), "ytd": clean(r.landscape_ytd_ratio_2026),
                   "last": clean(r.landscape_last_month_ratio), "ncomm": clean(r.buffer_communities, 0),
                   "peoples": r.peoples if isinstance(r.peoples, str) else ""})
    dump(rk, out / "ranking.json")
    y = yearly.set_index("year")
    status.update({
        "record_2024": round(y.n_harm[2024]), "y2005": round(y.n_harm[2005]), "y2005_lo": round(y.lo95[2005]),
        "y2005_hi": round(y.hi95[2005]), "y2005_modis": round(y.n_modis[2005]),
        "ratio_range": [round(float(np.nanpercentile(mm.n_viirs_obs[mm.n_modis >= 30] / mm.n_modis[mm.n_modis >= 30], 5)), 1),
                        round(float(np.nanpercentile(mm.n_viirs_obs[mm.n_modis >= 30] / mm.n_modis[mm.n_modis >= 30], 95)), 1)],
        "share_cells_above_2024": round(float((ca.ratio > 1)[(ca.season_total + ca.baseline_median) >= 10].mean()), 2),
        "data_through": "2026-11-12",
    })
    dump(status, out / "status.json")


if __name__ == "__main__":
    main()
