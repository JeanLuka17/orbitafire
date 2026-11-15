"""Compact, offline observatory exports from existing results; never fits a model.

GeoJSON display boundaries are a documented approximation for regional grid
assignment. Protected-area counts come only from the existing point-in-polygon CSV.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
import shapely
from scipy.stats import theilslopes
from shapely.geometry import shape

from .seasons import robust_z

FIELDS = ["value", "observed", "source", "complete", "lo95", "hi95", "median",
          "p10", "p90", "z", "ratio", "first", "off_season", "exceptional"]
SOURCES = ["terra_model", "modis_model", "viirs_snpp", "viirs_noaa20", "viirs_reference"]


def native(value):
    if isinstance(value, dict):
        return {str(k): native(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, np.ndarray)):
        return [native(v) for v in value]
    if isinstance(value, (np.bool_, bool)):
        return bool(value)
    if isinstance(value, (np.integer, int)):
        return int(value)
    if isinstance(value, (np.floating, float)):
        return round(float(value), 4) if np.isfinite(value) else None
    return value


def dump(value, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(native(value), ensure_ascii=False, separators=(",", ":"),
                               allow_nan=False), encoding="utf-8")


def analyse(frame):
    """LOYO monthly baselines from full years; first detection from prior observed months.

First-recorded needs >=60 preceding, contiguous, complete observed months with
zero detections. It is relative to this observation record, not an ignition date.
Off-season: baseline monthly median <=10% of peak, z>=2 and positive activity.
Exceptional intensity: robust z>=3.5. These are independent indicators.
"""
    d = frame.sort_index().copy()
    years, mos = d.index.year.to_numpy(), d.index.month.to_numpy()
    valid = d.complete.to_numpy(bool) & d.value.notna().to_numpy()
    full = [y for y in np.unique(years) if valid[years == y].sum() == 12]
    base = valid & np.isin(years, full)
    v = d.value.to_numpy(float)
    medians = np.array([np.median(v[base & (mos == m)]) if (base & (mos == m)).any()
                        else np.nan for m in range(1, 13)])
    # Reuse each year/month baseline rather than recalculate twelve medians per row.
    references, peaks = {}, {}
    for year in np.unique(years):
        for m in range(1, 13):
            references[year, m] = v[base & (mos == m) & (years != year)]
        peaks[year] = max([np.median(references[year, m]) for m in range(1, 13)
                           if len(references[year, m])], default=np.nan)
    rows, prior, seen = [], [], False
    for i, r in enumerate(d.itertuples()):
        b = references[years[i], mos[i]]
        z, med, _ = robust_z(v[i], b) if valid[i] else (np.nan, np.nan, np.nan)
        peak = peaks[years[i]]
        obs = r.observed if "model" not in r.source else np.nan
        if not r.complete or pd.isna(obs):
            prior = []
        first = bool(not seen and len(prior) >= 60 and obs > 0 and r.complete)
        if pd.notna(obs) and obs > 0:
            seen = True  # even a partial month's real positive detection is prior evidence
        if pd.notna(obs) and r.complete:
            prior.append(obs)
        off = bool(valid[i] and v[i] > 0 and np.isfinite(z) and z >= 2
                   and peak > 0 and med <= 0.1 * peak)
        rows.append([v[i], obs, SOURCES.index(r.source), bool(r.complete), getattr(r, "lo95", None),
                     getattr(r, "hi95", None), med, np.quantile(b, .1) if len(b) >= 5 else np.nan,
                     np.quantile(b, .9) if len(b) >= 5 else np.nan, z,
                     v[i] / med if med > 0 else np.nan, first, off, bool(z >= 3.5)])
    seasons = []
    for m in range(1, 13):
        ix = np.flatnonzero(base & (mos == m))
        vals = v[ix]
        eligible = [i for i in ix if np.isfinite(rows[i][9])]
        frequency = np.mean([rows[i][9] >= 2 for i in eligible]) if eligible else np.nan
        seasons.append([medians[m-1], np.quantile(vals, .1) if len(vals) >= 5 else np.nan,
                        np.quantile(vals, .9) if len(vals) >= 5 else np.nan, frequency])
    annual = d[base].groupby(d[base].index.year).value.sum()
    trend = None
    if len(annual) >= 8 and annual.sum() > 0:
        slope, _, low, high = theilslopes(annual.values, annual.index.values)
        trend = {"slope": slope, "low": low, "high": high,
                 "evidence": bool(low > 0 or high < 0), "start": int(annual.index.min()),
                 "end": int(annual.index.max())}
    latest = np.flatnonzero(valid)
    last = int(latest[-1]) if len(latest) else None
    # YTD compares exactly the same months, and only years with every required month.
    ytd = None
    if last is not None:
        end_m, end_y = mos[last], years[last]
        target = valid & (years == end_y) & (mos <= end_m)
        comparable = [v[valid & (years == y) & (mos <= end_m)].sum() for y in full
                      if y != end_y and (valid & (years == y) & (mos <= end_m)).sum() == end_m]
        if target.sum() == end_m and len(comparable) >= 5:
            z, med, _ = robust_z(v[target].sum(), comparable)
            ytd = {"value": v[target].sum(), "median": med, "z": z,
                   "ratio": v[target].sum()/med if med > 0 else None, "months": int(end_m)}
    season_totals = []
    for year in full:
        season_totals.append(v[base & (years == year) & np.isin(mos, [7, 8, 9, 10, 11])].sum())
    elevated = [robust_z(x, season_totals[:i]+season_totals[i+1:])[0] >= 2
                for i, x in enumerate(season_totals)] if len(season_totals) >= 6 else []
    return {"rows": rows, "seasonal": seasons, "full_years": full, "trend": trend,
            "last": last, "mean_year": annual.mean() if len(annual) else None,
            "season_frequency": np.mean(elevated) if elevated else None, "ytd": ytd}


def export(processed, results, out):
    processed, results, out = Path(processed), Path(results), Path(out)
    monthly = pd.read_csv(results / "peru_monthly_harmonized.csv", parse_dates=["month"]).set_index("month")
    panel = pd.read_parquet(processed / "harmonized_panel_0.25deg.parquet").sort_values(["cell", "month"])
    prep = json.loads((processed / "prepare_report.json").read_text(encoding="utf-8"))
    months = pd.DatetimeIndex(sorted(monthly.index))
    source = monthly.source.reindex(months)
    complete = ~monthly.partial_month.reindex(months)
    # S-NPP record starts Jan 20: do not compare its partial first month as complete.
    complete.loc[pd.Timestamp("2012-01-01")] = False
    manifest = {"version": 1, "fields": FIELDS, "sources": SOURCES, "locations": [],
                "data_through": max(prep["last_date_per_satellite"].values()),
                "regional_method": "grid_centers_display_boundaries", "daily_available": (out / "daily.json").exists()}
    national, territories, regions, cells = {}, {}, {}, {}

    def add_location(id_, name, kind, frame, dest, file, **meta):
        data = analyse(frame)
        data["months"] = frame.index.strftime("%Y-%m").tolist()
        dest[id_] = data
        manifest["locations"].append({"id": id_, "name": name, "kind": kind, "file": file,
                                      **meta})

    frame = pd.DataFrame({"value": monthly.n_harm, "observed": monthly.n_viirs_obs.where(~source.str.contains("model")),
                          "source": source, "complete": complete, "lo95": monthly.lo95.where(source.str.contains("model")),
                          "hi95": monthly.hi95.where(source.str.contains("model"))}, index=months)
    add_location("peru", "Peru", "country", frame, national, "observatory/national.json")
    features = json.loads((out / "regions.json").read_text(encoding="utf-8"))["features"]
    centers = panel[["cell", "cell_lat", "cell_lon"]].drop_duplicates("cell").reset_index(drop=True)
    assignments = np.full(len(centers), -1)
    for i, feature in enumerate(features):
        g = shapely.make_valid(shape(feature["geometry"]))
        hit = shapely.intersects_xy(g, centers.cell_lon.to_numpy(), centers.cell_lat.to_numpy())
        assignments[(assignments < 0) & hit] = i  # one cell assigned once, including shared borders
    centers["region"] = assignments
    region_panel = panel.merge(centers[["cell", "region"]], on="cell", validate="many_to_one")
    for i, feature in enumerate(features):
        name = feature["properties"]["name"]
        p = region_panel[region_panel.region == i]
        n = int((assignments == i).sum())
        vals = p.groupby("month")[["n_harm", "n_vref"]].sum().reindex(months)
        f = pd.DataFrame({"value": vals.n_harm, "observed": vals.n_vref.where(~source.str.contains("model")),
                          "source": source, "complete": complete & (n > 0)}, index=months)
        add_location(f"region|{name}", name, "region", f, regions, "observatory/regions.json", cells=n)
    areas = pd.read_csv(results / "protected_areas_fire.csv")
    sparse = pd.read_csv(results / "protected_areas_monthly.csv", parse_dates=["month"])
    if sparse.duplicated(["code", "kind", "month"]).any():
        raise ValueError("Duplicate protected-area monthly records")
    # 04_protected_areas.py explicitly drops zero rows. Recreate its covered interval.
    end = pd.Timestamp(areas.last_month.max())
    unit_months = pd.date_range("2012-01-01", end, freq="MS")
    for u in areas.itertuples():
        selected = sparse[(sparse.code == u.code) & (sparse.kind == u.kind)]
        counts = selected.set_index("month").hotspots.reindex(unit_months, fill_value=0.)
        f = pd.DataFrame({"value": counts, "observed": counts, "source": "viirs_reference",
                          "complete": unit_months != pd.Timestamp("2012-01-01")}, index=unit_months)
        # Check against independent annual metrics produced by step 04.
        assert abs(counts[counts.index.year == 2024].sum() - u.hotspots_2024) < .15
        add_location(f"{u.code}|{u.kind}", u.name, u.kind, f, territories, "observatory/territories.json",
                     code=u.code, km2=u.area_km2, communities=u.n_communities,
                     communal=u.category == "Reserva Comunal")
    for j, (cell, p) in enumerate(panel.groupby("cell", sort=True)):
        p = p.set_index("month").reindex(months)
        f = pd.DataFrame({"value": p.n_harm, "observed": p.n_vref.where(~source.str.contains("model")),
                          "source": source, "complete": complete}, index=months)
        key = f"{p.cell_lat.iloc[0]:.3f}_{p.cell_lon.iloc[0]:.3f}"
        file = f"observatory/cells_{j//50:02d}.json"
        add_location(f"cell|{key}", key, "cell", f, cells, file,
                     lat=p.cell_lat.iloc[0], lon=p.cell_lon.iloc[0])
        if j % 50 == 49:
            dump(cells, out / file)
            cells = {}
    if cells:
        dump(cells, out / file)
    dump(national, out / "observatory/national.json")
    dump(regions, out / "observatory/regions.json")
    dump(territories, out / "observatory/territories.json")
    manifest["validation"] = {"cells": len(centers), "territories": len(territories),
                              "regions": len(regions), "unassigned_cells": int((assignments < 0).sum()),
                              "national_max_difference": float((panel.groupby("month").n_harm.sum() - monthly.n_harm).abs().max())}
    assert manifest["validation"]["national_max_difference"] <= .051
    dump(manifest, out / "observatory.json")
    print(json.dumps(manifest["validation"]))
