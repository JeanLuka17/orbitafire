"""Step 3: results on the harmonized series - fire calendar, anomalies, figures.

Usage:
    python scripts/03_results.py --processed data/processed --results results --figures figures

Inputs (from scripts/02_harmonize.py):
    results/peru_monthly_harmonized.csv, results/peru_yearly_harmonized.csv,
    results/cv_by_year.csv, data/processed/harmonized_panel_0.25deg.parquet

Outputs:
    results/fire_calendar.csv          typical monthly share of yearly fires
    results/monthly_anomalies.csv      every month vs the same month in other years
    results/yearly_anomalies.csv       every year vs other years, with rank
    results/cell_anomaly_<year>.csv    fire-season anomaly per 0.25 deg cell
    results/current_status.json        latest complete month + year-to-date status
    figures/*.png                      charts for the presentation and README

Developed by the OrbitaFire team with AI assistance (Claude, Anthropic).
See README > "AI assistance".
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from matplotlib.colors import LinearSegmentedColormap, LogNorm, TwoSlopeNorm  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from orbitafire import seasons as S  # noqa: E402

# ---- chart style (reference data-viz palette, light mode) -----------------
INK, INK2, MUTED = "#0b0b0b", "#52514e", "#898781"
GRID, AXIS, SURFACE = "#e1e0d9", "#c3c2b7", "#fcfcfb"
BLUE, ORANGE, AQUA = "#2a78d6", "#eb6834", "#1baf7a"
BLUE_RAMP = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"]
DIVERGING = LinearSegmentedColormap.from_list(
    "bgr", ["#184f95", "#5598e7", "#f0efec", "#ec835a", "#b8322f"])
SOURCE_NOTE = "Data: NASA FIRMS (MODIS C6.1, VIIRS 375 m C2). Analysis: OrbitaFire."
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

plt.rcParams.update({
    "font.family": ["Inter", "DejaVu Sans"], "font.size": 10,
    "axes.edgecolor": AXIS, "axes.labelcolor": INK2, "axes.titlecolor": INK,
    "axes.titlesize": 13, "axes.titleweight": "bold", "axes.titlelocation": "left",
    "axes.spines.top": False, "axes.spines.right": False,
    "axes.grid": True, "grid.color": GRID, "grid.linewidth": 0.6,
    "xtick.color": MUTED, "ytick.color": MUTED, "xtick.labelcolor": INK2, "ytick.labelcolor": INK2,
    "figure.facecolor": SURFACE, "axes.facecolor": SURFACE, "savefig.facecolor": SURFACE,
    "legend.frameon": False, "legend.labelcolor": INK2,
})


def thousands(ax, axis="y"):
    f = matplotlib.ticker.FuncFormatter(lambda v, _: f"{v / 1000:.0f}k" if v >= 1000 else f"{v:.0f}")
    (ax.yaxis if axis == "y" else ax.xaxis).set_major_formatter(f)


def finish(fig, ax, path, subtitle=None, note_offset=-34):
    if subtitle:
        ax.text(0, 1.02, subtitle, transform=ax.transAxes, color=INK2, fontsize=9.5, va="bottom")
    # source note under the axes (below tick labels / x label)
    ax.annotate(SOURCE_NOTE, xy=(0, 0), xycoords="axes fraction", xytext=(0, note_offset),
                textcoords="offset points", color=MUTED, fontsize=7.5, va="top", annotation_clip=False)
    fig.savefig(path, dpi=200, bbox_inches="tight")
    plt.close(fig)


# ---- figures ---------------------------------------------------------------
def fig_before_after(yearly, path):
    y = yearly[yearly.complete_year]
    fig, ax = plt.subplots(figsize=(10, 4.6))
    model = y[y.source.str.contains("model")]
    ax.fill_between(model.year, model.lo95, model.hi95, color=BLUE, alpha=0.15, lw=0,
                    label="95% band (modelled years)")
    ax.plot(y.year, y.n_harm, color=BLUE, lw=2, marker="o", ms=4, label="Harmonized (VIIRS-equivalent)")
    ax.plot(y.year, y.n_modis, color=ORANGE, lw=2, marker="o", ms=4, label="MODIS as recorded")
    ax.axvline(2011.5, color=AXIS, lw=1, ls="--")
    ax.text(2011.6, ax.get_ylim()[1] * 0.97, "VIIRS observed from 2012 →", color=INK2, fontsize=9, va="top")
    ax.text(2011.4, ax.get_ylim()[1] * 0.97, "← reconstructed from MODIS", color=INK2, fontsize=9,
            va="top", ha="right")
    last = y.iloc[-1]
    ax.annotate("Harmonized", (last.year, last.n_harm), xytext=(6, 0), textcoords="offset points",
                color=INK2, va="center", fontsize=9)
    ax.annotate("MODIS raw", (last.year, last.n_modis), xytext=(6, 0), textcoords="offset points",
                color=INK2, va="center", fontsize=9)
    ax.set_ylim(bottom=0)
    ax.set_xlim(y.year.min() - 0.5, y.year.max() + 2)
    ax.set_ylabel("Fire hotspots per year")
    thousands(ax)
    ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.08), ncol=3, fontsize=9)
    ax.set_title("Peru: 25 years of fire on one consistent scale", pad=22)
    finish(fig, ax, path, "Annual active-fire hotspots. MODIS alone undercounts ~5x and hides the true size of 2005, 2010 and 2024.",
           note_offset=-52)


def fig_ratio(monthly, path):
    m = monthly[(monthly.n_viirs_obs > 0) & (monthly.n_modis >= 30) & ~monthly.partial_month
                & (monthly.source == "viirs_snpp")]
    r = m.n_viirs_obs / m.n_modis
    k = m.n_viirs_obs.sum() / m.n_modis.sum()
    fig, ax = plt.subplots(figsize=(8, 4.6))
    ax.scatter(m.n_modis, r, s=22, color=BLUE, alpha=0.75, edgecolor=SURFACE, linewidth=0.6)
    ax.axhline(k, color=ORANGE, lw=2)
    ax.text(m.n_modis.min(), k - 0.25, f"one constant factor = {k:.1f}", color=INK, va="top", ha="left", fontsize=9,
            bbox=dict(facecolor=SURFACE, edgecolor="none", pad=1.5))
    ax.set_xscale("log")
    ax.set_xlabel("MODIS hotspots in the month (log scale)")
    ax.set_ylabel("VIIRS ÷ MODIS")
    ax.set_ylim(0, None)
    ax.set_title("The VIIRS/MODIS ratio is not constant", pad=22)
    finish(fig, ax, path, "Each dot is one month, 2012–2026. In quiet months VIIRS sees up to ~12x more fires than MODIS.",
           note_offset=-42)


def fig_validation(cv_by_year, path):
    d = cv_by_year[cv_by_year.predictor == "modis"]
    piv = d.pivot(index="year", columns="model", values="error_pct")[["ratio_global", "poisson_glm"]]
    fig, ax = plt.subplots(figsize=(10, 4.4))
    x = np.arange(len(piv))
    w = 0.38
    ax.bar(x - w / 2 - 0.01, piv.ratio_global, w, color=ORANGE, label="One constant factor")
    ax.bar(x + w / 2 + 0.01, piv.poisson_glm, w, color=BLUE, label="OrbitaFire model (Poisson GLM)")
    ax.axhline(0, color=AXIS, lw=1)
    ax.set_xticks(x, piv.index)
    ax.set_ylabel("Error in yearly total (%)")
    ax.grid(axis="x", visible=False)
    worst_c, worst_m = piv.ratio_global.abs().max(), piv.poisson_glm.abs().max()
    ax.legend(loc="lower left", fontsize=9)
    ax.set_title("Leave-one-year-out validation", pad=22)
    finish(fig, ax, path, f"Each year predicted by a model that never saw it. Worst year: constant factor "
                          f"{worst_c:.0f}%, our model {worst_m:.0f}%.")


def fig_calendar(monthly, path):
    m = monthly.copy()
    m["year"], m["mo"] = m.month.dt.year, m.month.dt.month
    piv = m.pivot(index="year", columns="mo", values="n_harm")
    piv[m.set_index(["year", "mo"]).partial_month.unstack().fillna(False).astype(bool)] = np.nan
    modelled = m.groupby("year").source.first().str.contains("model")
    fig, ax = plt.subplots(figsize=(8, 8.5))
    cmap = LinearSegmentedColormap.from_list("blue", BLUE_RAMP)
    cmap.set_bad(SURFACE)
    im = ax.imshow(piv.to_numpy(), aspect="auto", cmap=cmap, norm=LogNorm(vmin=100, vmax=piv.max().max()))
    ax.set_xticks(range(12), MONTHS)
    ax.set_yticks(range(len(piv)), [f"{y}*" if modelled[y] else str(y) for y in piv.index], fontsize=8.5)
    ax.grid(False)
    for s in ax.spines.values():
        s.set_visible(False)
    ax.set_xticks(np.arange(-.5, 12, 1), minor=True)
    ax.set_yticks(np.arange(-.5, len(piv), 1), minor=True)
    ax.grid(which="minor", color=SURFACE, linewidth=1.5)
    ax.tick_params(which="minor", length=0)
    cb = fig.colorbar(im, ax=ax, shrink=0.6, pad=0.02)
    cb.set_label("Hotspots in the month (VIIRS-equivalent, log scale)", color=INK2)
    cb.outline.set_visible(False)
    ax.set_title("Peru's fire calendar, 2000–2026", pad=22)
    finish(fig, ax, path, "Fire season = Jul–Nov, peaking in Aug–Sep. * reconstructed from MODIS.")


def fig_2024(anom, year, path):
    a = anom[anom.month.dt.year == year].copy()
    x = a.month.dt.month
    fig, ax = plt.subplots(figsize=(9, 4.6))
    ax.fill_between(x, a.p10, a.p90, color=AXIS, alpha=0.45, lw=0, label="Usual range (10–90% of other years)")
    ax.plot(x, a["median"], color=INK2, lw=1.5, ls="--", label="Typical year (median)")
    ax.plot(x, a.value, color=ORANGE, lw=2.2, marker="o", ms=5, label=str(year))
    big = a.category.isin(["very high", "extreme"]) & (a.value >= 0.1 * a.value.max())
    for _, r in a[big].iterrows():
        ax.annotate(f"{r.ratio_to_median:.1f}× typical", (r.month.month, r.value), xytext=(0, 8),
                    textcoords="offset points", ha="center", color=INK, fontsize=8.5)
    ax.set_xticks(range(1, 13), MONTHS)
    ax.set_ylim(bottom=0)
    ax.set_ylabel("Hotspots per month")
    thousands(ax)
    ax.legend(loc="upper left", fontsize=9)
    tot = a.value.sum()
    ax.set_title(f"{year}: how far from normal?", pad=22)
    finish(fig, ax, path, f"Peru, harmonized series. {year} total: {tot:,.0f} hotspots.")


def fig_cell_map(cells, year, path):
    c = cells[(cells.season_total + cells.baseline_median) >= 10].copy()
    lr = np.log2(c.ratio).clip(-3, 3)
    fig, ax = plt.subplots(figsize=(7, 8.6))
    sc = ax.scatter(c.cell_lon, c.cell_lat, c=lr, cmap=DIVERGING, norm=TwoSlopeNorm(0, -3, 3),
                    s=16, marker="s", linewidth=0)
    ax.set_aspect("equal")
    ax.grid(False)
    for s in ax.spines.values():
        s.set_visible(False)
    ax.set_xticks([])
    ax.set_yticks([])
    cb = fig.colorbar(sc, ax=ax, shrink=0.55, pad=0.01, ticks=[-3, -2, -1, 0, 1, 2, 3])
    cb.ax.set_yticklabels(["÷8", "÷4", "÷2", "typical", "×2", "×4", "×8"])
    cb.outline.set_visible(False)
    cb.set_label(f"Jul–Nov {year} vs typical season", color=INK2)
    ax.set_title(f"Where {year}'s fire season broke the norm", pad=22)
    finish(fig, ax, path, "0.25° cells with ≥10 hotspots. Baseline: median of 2003–2025 (other years).")


# ---- main ------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--processed", default="data/processed")
    ap.add_argument("--results", default="results")
    ap.add_argument("--figures", default="figures")
    ap.add_argument("--year", type=int, default=2024)
    a = ap.parse_args()
    res, figs = Path(a.results), Path(a.figures)
    figs.mkdir(parents=True, exist_ok=True)

    monthly = pd.read_csv(res / "peru_monthly_harmonized.csv", parse_dates=["month"])
    yearly = pd.read_csv(res / "peru_yearly_harmonized.csv")
    cv = pd.read_csv(res / "cv_by_year.csv")
    panel = pd.read_parquet(Path(a.processed) / "harmonized_panel_0.25deg.parquet",
                            columns=["cell", "cell_lat", "cell_lon", "month", "n_harm"])

    cal = S.fire_calendar(monthly)
    anom = S.monthly_anomalies(monthly)
    yan = S.yearly_anomalies(yearly)
    last_full = int(yearly[yearly.complete_year].year.max())
    cells = S.cell_season_anomaly(panel, a.year, first_year=2003, last_year=last_full)

    cal.round(4).to_csv(res / "fire_calendar.csv", index=False)
    anom.round({c: 3 for c in anom.select_dtypes("number").columns}).to_csv(res / "monthly_anomalies.csv", index=False)
    yan.round(3).to_csv(res / "yearly_anomalies.csv", index=False)
    cells.round(3).to_csv(res / f"cell_anomaly_{a.year}.csv", index=False)

    # current status: last complete month and year-to-date vs the same months of other years
    last = anom.iloc[-1]
    cur_year = last.month.year
    ytd_months = range(1, last.month.month + 1)
    mm = monthly[~monthly.partial_month].assign(year=lambda d: d.month.dt.year, mo=lambda d: d.month.dt.month)
    ytd = mm[mm.mo.isin(ytd_months)].groupby("year").n_harm.sum()
    full_years = yearly[yearly.complete_year].year
    z, med, _ = S.robust_z(ytd[cur_year], ytd[ytd.index.isin(full_years) & (ytd.index != cur_year)])
    status = {
        "last_complete_month": last.month.strftime("%Y-%m"),
        "last_month": {"value": round(last.value), "typical": round(last["median"]),
                       "ratio": round(last.ratio_to_median, 2), "z": round(last.z, 2), "category": last.category},
        "year_to_date": {"year": int(cur_year), "months": f"Jan-{MONTHS[last.month.month - 1]}",
                         "value": round(ytd[cur_year]), "typical": round(med),
                         "ratio": round(ytd[cur_year] / med, 2), "z": round(z, 2),
                         "category": S.categorize([z])[0]},
        "peak_months": [MONTHS[i - 1] for i in cal.sort_values("median", ascending=False).mo.head(2)],
        "fire_season_share": round(cal[cal.mo.isin(S.FIRE_SEASON)]["median"].sum(), 3),
        "record_year": int(yan.loc[yan.value.idxmax(), "year"]),
    }
    (res / "current_status.json").write_text(json.dumps(status, indent=2))

    fig_before_after(yearly, figs / "fig1_before_after.png")
    fig_ratio(monthly, figs / "fig2_ratio_not_constant.png")
    fig_validation(cv, figs / "fig3_validation.png")
    fig_calendar(monthly, figs / "fig4_fire_calendar.png")
    fig_2024(anom, a.year, figs / f"fig5_{a.year}_vs_normal.png")
    fig_cell_map(cells, a.year, figs / f"fig6_map_{a.year}.png")

    print(yan.sort_values("rank")[["year", "value", "lo95", "hi95", "ratio_to_median", "z", "category", "rank"]]
          .head(8).round(2).to_string(index=False))
    print(anom[anom.month.dt.year == a.year][["month", "value", "median", "ratio_to_median", "z", "category"]]
          .round({"value": 1, "median": 1, "ratio_to_median": 2, "z": 2}).to_string(index=False))
    print(json.dumps(status, indent=2))


if __name__ == "__main__":
    main()
