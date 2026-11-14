"""Fire calendar and anomaly detection on the harmonized series.

* ``fire_calendar``: typical share of the yearly fires that falls in each
  calendar month (median over complete years) and the peak months.
* ``monthly_anomalies``: each month is compared with the SAME calendar month of
  all other complete years (the month itself is left out of its own baseline),
  using a robust z-score  z = (x - median) / (1.4826 * MAD).
* ``yearly_anomalies``: the same for yearly totals.
* ``cell_season_anomaly``: per grid cell, one fire season compared with the
  same season of other years (for maps).

Robust statistics (median/MAD) are used so one extreme year such as 2024 does
not inflate the baseline it is judged against.

AI assistance: drafted with Claude (Anthropic) and reviewed by the OrbitaFire
team; see README "AI assistance".
"""
from __future__ import annotations

import numpy as np
import pandas as pd

MAD_K = 1.4826
FIRE_SEASON = (7, 8, 9, 10, 11)

# z-score thresholds -> category (upper bounds, inclusive of lower bound)
CATEGORIES = [(-np.inf, -1.5, "very low"), (-1.5, 1.0, "normal"), (1.0, 2.0, "high"),
              (2.0, 3.5, "very high"), (3.5, np.inf, "extreme")]


def categorize(z):
    z = np.asarray(z, float)
    out = np.full(z.shape, "normal", dtype=object)
    for lo, hi, name in CATEGORIES:
        out[(z >= lo) & (z < hi)] = name
    out[np.isnan(z)] = "n/a"
    return out


def robust_z(x, baseline):
    b = np.asarray(baseline, float)
    b = b[~np.isnan(b)]
    if len(b) < 5:
        return np.nan, np.nan, np.nan
    med = np.median(b)
    mad = MAD_K * np.median(np.abs(b - med))
    mad = max(mad, 0.1 * med, 1.0)  # floor: avoid huge z in near-constant months
    return (x - med) / mad, med, mad


def fire_calendar(monthly: pd.DataFrame, value="n_harm") -> pd.DataFrame:
    """Median and inter-quantile range of each month's share of the yearly total."""
    m = monthly[~monthly.partial_month].copy()
    m["year"], m["mo"] = m.month.dt.year, m.month.dt.month
    full = m.groupby("year").mo.transform("size") == 12
    m = m[full]
    m["share"] = m[value] / m.groupby("year")[value].transform("sum")
    cal = m.groupby("mo").share.agg(median="median", p10=lambda s: s.quantile(.1),
                                    p90=lambda s: s.quantile(.9)).reset_index()
    cal["typical_count"] = m.groupby("mo")[value].median().to_numpy()
    return cal


def monthly_anomalies(monthly: pd.DataFrame, value="n_harm") -> pd.DataFrame:
    m = monthly[~monthly.partial_month].copy()
    m["year"], m["mo"] = m.month.dt.year, m.month.dt.month
    rows = []
    for _, r in m.iterrows():
        base = m[(m.mo == r.mo) & (m.year != r.year)][value]
        z, med, mad = robust_z(r[value], base)
        p10, p90 = (base.quantile(.1), base.quantile(.9)) if len(base) else (np.nan, np.nan)
        rows.append({"month": r.month, "value": r[value], "median": med, "p10": p10, "p90": p90,
                     "ratio_to_median": r[value] / med if med else np.nan, "z": z,
                     "source": r.source})
    out = pd.DataFrame(rows)
    out["category"] = categorize(out.z)
    return out


def yearly_anomalies(yearly: pd.DataFrame, value="n_harm") -> pd.DataFrame:
    y = yearly[yearly.complete_year].copy()
    rows = []
    for _, r in y.iterrows():
        z, med, _ = robust_z(r[value], y[y.year != r.year][value])
        rows.append({"year": r.year, "value": r[value], "lo95": r.lo95, "hi95": r.hi95,
                     "median_other_years": med, "ratio_to_median": r[value] / med, "z": z,
                     "rank": None, "source": r.source})
    out = pd.DataFrame(rows)
    out["rank"] = out.value.rank(ascending=False).astype(int)
    out["category"] = categorize(out.z)
    return out


def cell_season_anomaly(panel: pd.DataFrame, year: int, value="n_harm",
                        months=FIRE_SEASON, first_year=2003, last_year=None,
                        prior=5.0) -> pd.DataFrame:
    """Fire-season total of ``year`` per cell vs the same season in the other
    complete years ``first_year..last_year``.

    ``ratio`` = (x + prior) / (median + prior) shrinks noisy ratios in cells
    with few fires; ``z`` is the robust z-score.
    """
    p = panel[panel.month.dt.month.isin(months)]
    p = p.assign(year=p.month.dt.year)
    last_year = last_year or year
    s = p[p.year.between(first_year, last_year)].groupby(["cell", "cell_lat", "cell_lon", "year"])[value].sum()
    s = s.unstack("year").fillna(0.0)
    base = s.drop(columns=[year])
    med = base.median(axis=1)
    mad = (MAD_K * base.sub(med, axis=0).abs().median(axis=1)).clip(lower=1.0)
    out = pd.DataFrame({"season_total": s[year], "baseline_median": med,
                        "ratio": (s[year] + prior) / (med + prior),
                        "z": (s[year] - med) / np.maximum(mad, 0.1 * med)}).reset_index()
    out["category"] = categorize(out.z)
    return out
