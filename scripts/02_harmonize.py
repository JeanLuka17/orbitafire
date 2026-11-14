"""Step 2: harmonize MODIS and VIIRS into one VIIRS-equivalent series (Peru).

Usage:
    python scripts/02_harmonize.py --processed data/processed --results results

Inputs (from scripts/01_prepare_data.py):
    detections_clean.parquet, panel_0.25deg.parquet

Outputs:
    data/processed/harmonized_panel_0.25deg.parquet   cell x month, n_harm + source
    data/processed/oof_<model>.parquet                out-of-fold cell-month predictions
    results/peru_monthly_harmonized.csv               Peru monthly series + 95% band
    results/peru_yearly_harmonized.csv                Peru yearly series + 95% band
    results/cv_modis_to_viirs.csv                     model comparison (leave-one-year-out)
    results/cv_terra_to_viirs.csv                     same, Terra-only predictor
    results/cv_by_year.csv                            yearly error of every model
    results/harmonize_report.json                     calibration, outages, chosen models

Developed by the OrbitaFire team with AI assistance (Claude, Anthropic).
See README > "AI assistance".
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from orbitafire import harmonize as H  # noqa: E402

RES = 0.25
OVERLAP = ("2012-01-01", "2026-10-01")      # S-NPP + MODIS, complete months
TERRA_TRAIN = ("2012-01-01", "2019-12-01")  # Terra before its orbit drift
AQUA_START = pd.Timestamp("2002-08-01")     # first full month with Aqua
PARTIAL_FROM = pd.Timestamp("2026-11-01")   # data end mid-November 2026
CHOSEN = "poisson_glm"


def yearly_errors(oofs: dict, label: str) -> pd.DataFrame:
    rows = []
    for name, o in oofs.items():
        y = o.groupby(o.month.dt.year)[["y", "pred"]].sum()
        for yr, r in y.iterrows():
            rows.append({"predictor": label, "model": name, "year": yr, "observed": r.y,
                         "predicted": r.pred, "error_pct": 100 * (r.pred / r.y - 1)})
    return pd.DataFrame(rows)


def band(df, sig, col="n_harm"):
    """95% band from the out-of-fold log spread (fire season vs off season)."""
    fs = df.month.dt.month.isin([7, 8, 9, 10, 11])
    s = np.where(fs, sig["fire_season"], sig["off_season"])
    return df[col] * np.exp(-1.96 * s), df[col] * np.exp(1.96 * s)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--processed", default="data/processed")
    ap.add_argument("--results", default="results")
    a = ap.parse_args()
    proc, res_dir = Path(a.processed), Path(a.results)
    res_dir.mkdir(parents=True, exist_ok=True)
    t0 = time.time()

    det = pd.read_parquet(proc / "detections_clean.parquet")
    det["date"] = pd.to_datetime(det["date"])
    panel = pd.read_parquet(proc / f"panel_{RES}deg.parquet")

    # 1. VIIRS reference: S-NPP, gaps and post-shutdown filled with NOAA-20
    cal = H.noaa20_calibration(det)
    vref, outage = H.viirs_reference(det, RES, cal["k"])
    del det
    panel = panel.merge(vref, on=["cell", "month"], how="left").fillna({"n_vref": 0.0, "n_vfill": 0.0})
    print(f"NOAA-20 -> S-NPP factor k = {cal['k']:.3f} ({cal['n_days']} paired days); "
          f"{len(outage)} S-NPP outage days filled")

    # 2. MODIS (Terra+Aqua) -> VIIRS, leave-one-year-out over the overlap
    ov = panel[panel.month.between(*OVERLAP)]
    d_modis = ov.assign(x=ov.n_modis, y=ov.n_vref)[["cell", "month", "x", "y"]].reset_index(drop=True)
    cv_m, oof_m = H.compare_models(d_modis)
    cv_m.round(4).to_csv(res_dir / "cv_modis_to_viirs.csv")
    print("\nMODIS -> VIIRS (leave-one-year-out, 2012-2026):\n", cv_m.round(3).T.to_string())

    # 3. Terra only -> VIIRS (for Nov 2000 - Jul 2002), trained before Terra drift
    tv = panel[panel.month.between(*TERRA_TRAIN)]
    d_terra = tv.assign(x=tv.n_terra, y=tv.n_vref)[["cell", "month", "x", "y"]].reset_index(drop=True)
    cv_t, oof_t = H.compare_models(d_terra)
    cv_t.round(4).to_csv(res_dir / "cv_terra_to_viirs.csv")
    print("\nTerra -> VIIRS (leave-one-year-out, 2012-2019):\n", cv_t.round(3).T.to_string())

    pd.concat([yearly_errors(oof_m, "modis"), yearly_errors(oof_t, "terra")]).round(3).to_csv(
        res_dir / "cv_by_year.csv", index=False)
    for name, o in oof_m.items():
        o.to_parquet(proc / f"oof_modis_{name}.parquet", index=False)
    oof_t[CHOSEN].to_parquet(proc / f"oof_terra_{CHOSEN}.parquet", index=False)

    sig_m = H.relative_sigma(oof_m[CHOSEN])
    sig_t = H.relative_sigma(oof_t[CHOSEN])

    # 4. Final fits on all training data and reconstruction
    model_cls = {c.name: c for c in H.MODELS}[CHOSEN]
    fit_m = model_cls().fit(d_modis)
    fit_t = model_cls().fit(d_terra)

    p = panel[["cell", "cell_lat", "cell_lon", "month", "n_terra", "n_aqua", "n_modis",
               "n_snpp", "n_noaa20", "n_noaa21", "n_vref", "n_vfill"]].copy()
    is_terra = p.month < AQUA_START
    is_modis = (p.month >= AQUA_START) & (p.month < pd.Timestamp(OVERLAP[0]))
    p["n_harm"] = p.n_vref
    p.loc[is_modis, "n_harm"] = fit_m.predict(p[is_modis].assign(x=p.n_modis))
    p.loc[is_terra, "n_harm"] = fit_t.predict(p[is_terra].assign(x=p.n_terra))
    p["source"] = np.select(
        [is_terra, is_modis, p.month >= H.SNPP_END],
        ["terra_model", "modis_model", "viirs_noaa20"], default="viirs_snpp")
    p.to_parquet(proc / f"harmonized_panel_{RES}deg.parquet", index=False)

    # 5. Peru series with uncertainty
    m = p.groupby("month").agg(n_modis=("n_modis", "sum"), n_terra=("n_terra", "sum"),
                               n_viirs_obs=("n_vref", "sum"), n_viirs_filled=("n_vfill", "sum"),
                               n_harm=("n_harm", "sum"), source=("source", "first")).reset_index()
    lo, hi = np.array(m.n_harm, float), np.array(m.n_harm, float)
    for src, sig in (("modis_model", sig_m), ("terra_model", sig_t)):
        sel = m.source == src
        lo[sel], hi[sel] = band(m[sel], sig)
    m["lo95"], m["hi95"] = lo, hi
    m["partial_month"] = m.month >= PARTIAL_FROM
    m.round({c: 1 for c in m.select_dtypes("number").columns}).to_csv(
        res_dir / "peru_monthly_harmonized.csv", index=False)

    # yearly: errors of months in a year are correlated, so use the yearly CV spread
    def yearly_sigma(oof):
        y = oof.groupby(oof.month.dt.year)[["y", "pred"]].sum()
        return float(np.log(y.pred / y.y).std())
    ys = {"modis_model": yearly_sigma(oof_m[CHOSEN]), "terra_model": yearly_sigma(oof_t[CHOSEN])}
    y = m.groupby(m.month.dt.year).agg(n_modis=("n_modis", "sum"), n_viirs_obs=("n_viirs_obs", "sum"),
                                        n_harm=("n_harm", "sum"),
                                        source=("source", lambda v: "+".join(dict.fromkeys(v))),
                                        months=("month", "size")).reset_index().rename(columns={"month": "year"})
    # a year containing any modelled month gets that model's yearly spread
    s = np.array([max([ys.get(src, 0.0) for src in v.split("+")]) for v in y.source])
    y["lo95"], y["hi95"] = y.n_harm * np.exp(-1.96 * s), y.n_harm * np.exp(1.96 * s)
    y["complete_year"] = y.months == 12
    y.round(1).to_csv(res_dir / "peru_yearly_harmonized.csv", index=False)

    report = {
        "grid_deg": RES,
        "noaa20_calibration": cal,
        "snpp_outage_days": [d.strftime("%Y-%m-%d") for d in outage],
        "overlap_months": list(OVERLAP),
        "terra_training_months": list(TERRA_TRAIN),
        "chosen_model": CHOSEN,
        "cv_modis_to_viirs": cv_m.round(4).to_dict(orient="index"),
        "cv_terra_to_viirs": cv_t.round(4).to_dict(orient="index"),
        "relative_sigma_monthly": {"modis_model": sig_m, "terra_model": sig_t},
        "relative_sigma_yearly": ys,
        "viirs_over_modis_by_year": (y.set_index("year").n_viirs_obs / y.set_index("year").n_modis)
        .replace([np.inf, 0], np.nan).dropna().round(3).to_dict(),
        "notes": [
            "Nov 2026 is a partial month (data to mid-November).",
            "Nov 2000 has an unusual Terra cluster (1,093 detections, 2-14 Nov, northern Peru) right "
            "at the start of the record; kept but flagged for review.",
        ],
        "runtime_s": round(time.time() - t0, 1),
    }
    (res_dir / "harmonize_report.json").write_text(json.dumps(report, indent=2, default=str))
    print(f"\nDone in {report['runtime_s']} s")


if __name__ == "__main__":
    main()
