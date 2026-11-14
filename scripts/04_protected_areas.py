"""Step 3b: fire in Peru's protected areas and their buffer zones (SERNANP).

Usage:
    python scripts/04_protected_areas.py --sernanp data/external/sernanp

Inputs:
    data/processed/detections_clean.parquet          (step 1)
    results/harmonize_report.json                    (step 2: NOAA-20 factor)
    data/external/sernanp/sernanp_anp_nacional.geojson
    data/external/sernanp/sernanp_zona_amortiguamiento.geojson
    data/external/sernanp/sernanp_comunidades_nativas.geojson
      (downloaded from SERNANP's public download service,
       geoservicios.sernanp.gob.pe .../sernanp_visor/servicio_descarga/MapServer,
       layers 1, 8 and 39; geometry simplified to ~200 m)

Hotspots are VIIRS 375 m (S-NPP, with NOAA-20 on S-NPP outage days and after
its shutdown, scaled by the step-2 factor), counted by point-in-polygon.

Outputs:
    results/protected_areas_fire.csv        one row per unit (area / buffer ring)
    results/protected_areas_monthly.csv     monthly hotspots per unit (website)
    results/communal_reserves_ranking.csv   the 11 Communal Reserves, ranked

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
from scipy.stats import theilslopes

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from orbitafire import areas as A  # noqa: E402
from orbitafire import harmonize as H  # noqa: E402
from orbitafire import seasons as S  # noqa: E402

FIRST, LAST_FULL = 2012, 2025
YEAR = 2024
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def viirs_points(det: pd.DataFrame, k: float) -> pd.DataFrame:
    det = det[det.satellite.isin(["SNPP", "NOAA20"])].copy()
    det["date"] = pd.to_datetime(det.date)
    outage = H.snpp_outage_days(det)
    fill = (det.satellite == "NOAA20") & (det.date.isin(outage) | (det.date > H.SNPP_END))
    pts = det[(det.satellite == "SNPP") | fill]
    pts = pts.assign(w=np.where(pts.satellite == "SNPP", 1.0, k),
                     month=pts.date.dt.to_period("M").dt.to_timestamp())
    return pts[["lon", "lat", "month", "w"]].reset_index(drop=True)


def unit_metrics(monthly: pd.Series) -> dict:
    """monthly: hotspots indexed by month (complete months only)."""
    y = monthly.groupby(monthly.index.year).sum()
    full = y.loc[FIRST:LAST_FULL]
    out = {"mean_per_year": full.mean(), f"hotspots_{YEAR}": full.get(YEAR, 0.0)}
    others = full.drop(YEAR, errors="ignore")
    z, med, _ = S.robust_z(out[f"hotspots_{YEAR}"], others) if len(others) >= 5 else (np.nan, np.nan, 0)
    out.update({"median_other_years": med, f"ratio_{YEAR}": (out[f"hotspots_{YEAR}"] + 1) / (med + 1),
                f"z_{YEAR}": z, f"rank_{YEAR}": int(full.rank(ascending=False).get(YEAR, np.nan))
                if YEAR in full else np.nan, "record_year": int(full.idxmax()) if full.sum() > 0 else np.nan})
    slope = theilslopes(full.values, full.index.values)[0] if full.sum() > 0 else 0.0
    out["trend_pct_per_year"] = 100 * slope / max(full.median(), 1)
    clim = monthly[monthly.index.year <= LAST_FULL].groupby(monthly.index.month[monthly.index.year <= LAST_FULL]).sum()
    out["peak_month"] = MONTHS[int(clim.idxmax()) - 1] if clim.sum() > 0 else None
    out["fire_season_share"] = clim[clim.index.isin(S.FIRE_SEASON)].sum() / max(clim.sum(), 1)
    # current year-to-date vs the same months in other years
    last = monthly.index.max()
    ytd = monthly[monthly.index.month <= last.month]
    ytd_y = ytd.groupby(ytd.index.year).sum()
    base = ytd_y.loc[FIRST:LAST_FULL]
    out[f"ytd_{last.year}"] = ytd_y.get(last.year, 0.0)
    out[f"ytd_ratio_{last.year}"] = (out[f"ytd_{last.year}"] + 1) / (base.median() + 1)
    lm = monthly[monthly.index.month == last.month]
    lm_base = lm[(lm.index.year >= FIRST) & (lm.index.year <= LAST_FULL)]
    out["last_month"] = last.strftime("%Y-%m")
    out["last_month_hotspots"] = monthly.get(last, 0.0)
    out["last_month_ratio"] = (out["last_month_hotspots"] + 1) / (lm_base.median() + 1)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--processed", default="data/processed")
    ap.add_argument("--results", default="results")
    ap.add_argument("--sernanp", default="data/external/sernanp")
    a = ap.parse_args()
    res, sern = Path(a.results), Path(a.sernanp)

    k = json.loads((res / "harmonize_report.json").read_text())["noaa20_calibration"]["k"]
    det = pd.read_parquet(Path(a.processed) / "detections_clean.parquet")
    pts = viirs_points(det, k)
    del det
    last_complete = pd.Timestamp("2026-10-01")
    pts = pts[pts.month <= last_complete]

    units = A.protected_area_units(sern / "sernanp_anp_nacional.geojson",
                                   sern / "sernanp_zona_amortiguamiento.geojson")
    print(f"{len(units)} units ({(units.kind == 'area').sum()} areas, {(units.kind == 'buffer').sum()} buffer rings); "
          f"{len(pts):,} VIIRS hotspots")
    idx = A.assign_points(pts.lon.to_numpy(), pts.lat.to_numpy(), units)
    comm = A.communities_near(units, sern / "sernanp_comunidades_nativas.geojson")

    months = pd.date_range(f"{FIRST}-01-01", last_complete, freq="MS")
    rows, monthly_rows = [], []
    for i, u in units.iterrows():
        p = pts.iloc[idx[i]]
        m = p.groupby("month").w.sum().reindex(months, fill_value=0.0)
        rows.append({"code": u.code, "name": u["name"], "category": u.category, "kind": u.kind,
                     "regions": u.regions, "area_km2": u.area_km2, **unit_metrics(m),
                     "n_communities": comm.loc[i, "n_communities"], "peoples": comm.loc[i, "peoples"],
                     "communities": comm.loc[i, "communities"]})
        monthly_rows.append(pd.DataFrame({"code": u.code, "kind": u.kind, "month": months, "hotspots": m.values}))
    t = pd.DataFrame(rows)
    t["density_per_100km2_yr"] = 100 * t.mean_per_year / t.area_km2
    t.round(3).to_csv(res / "protected_areas_fire.csv", index=False)
    mon = pd.concat(monthly_rows)
    mon[mon.hotspots > 0].assign(month=lambda d: d.month.dt.strftime("%Y-%m")).round(2).to_csv(
        res / "protected_areas_monthly.csv", index=False)

    # Communal Reserves: area + buffer side by side, ranked by 2024 anomaly in the whole landscape
    rc = t[t.category == "Reserva Comunal"]
    a_ = rc[rc.kind == "area"].set_index("code")
    b_ = rc[rc.kind == "buffer"].set_index("code")
    mon_rc = mon[mon.code.isin(a_.index)]
    land = []
    for code in a_.index:
        m = mon_rc[mon_rc.code == code].groupby("month").hotspots.sum()
        lm = unit_metrics(m)
        land.append({"code": code, "landscape_mean_per_year": lm["mean_per_year"],
                     f"landscape_{YEAR}": lm[f"hotspots_{YEAR}"], f"landscape_ratio_{YEAR}": lm[f"ratio_{YEAR}"],
                     f"landscape_rank_{YEAR}": lm[f"rank_{YEAR}"], "landscape_trend_pct_per_year": lm["trend_pct_per_year"],
                     "landscape_ytd_ratio_2026": lm["ytd_ratio_2026"], "landscape_last_month_ratio": lm["last_month_ratio"],
                     "peak_month": lm["peak_month"]})
    land = pd.DataFrame(land).set_index("code")
    rank = pd.DataFrame({
        "name": a_["name"], "regions": a_.regions, "area_km2": a_.area_km2,
        "inside_mean_per_year": a_.mean_per_year, "inside_density_per_100km2_yr": a_.density_per_100km2_yr,
        f"inside_{YEAR}": a_[f"hotspots_{YEAR}"], f"inside_ratio_{YEAR}": a_[f"ratio_{YEAR}"],
        "buffer_area_km2": b_.area_km2, "buffer_mean_per_year": b_.mean_per_year,
        "buffer_density_per_100km2_yr": b_.density_per_100km2_yr,
        f"buffer_{YEAR}": b_[f"hotspots_{YEAR}"], f"buffer_ratio_{YEAR}": b_[f"ratio_{YEAR}"],
        "buffer_communities": b_.n_communities, "inside_communities": a_.n_communities,
        "peoples": (a_.peoples.fillna("") + "; " + b_.peoples.reindex(a_.index).fillna("")).map(
            lambda s: "; ".join(sorted({x.strip() for x in s.split(";") if x.strip()}))),
    }).join(land)
    rank = rank.sort_values(f"landscape_{YEAR}", ascending=False)
    rank.round(3).to_csv(res / "communal_reserves_ranking.csv")

    pd.set_option("display.width", 250)
    cols = ["name", "area_km2", "inside_mean_per_year", f"inside_{YEAR}", "buffer_mean_per_year", f"buffer_{YEAR}",
            f"landscape_ratio_{YEAR}", f"landscape_rank_{YEAR}", "landscape_trend_pct_per_year",
            "landscape_ytd_ratio_2026", "landscape_last_month_ratio", "peak_month", "buffer_communities"]
    print(rank[cols].round(2).to_string())
    print("\nAll protected areas, top 12 by hotspots inside in", YEAR)
    print(t[t.kind == "area"].sort_values(f"hotspots_{YEAR}", ascending=False)
          [["name", "category", "area_km2", "mean_per_year", f"hotspots_{YEAR}", f"ratio_{YEAR}", "peak_month"]]
          .head(12).round(2).to_string(index=False))


if __name__ == "__main__":
    main()
