"""Harmonize MODIS and VIIRS active-fire counts into one consistent series.

Idea
----
VIIRS (375 m) sees many small fires that MODIS (1 km) misses, so the two
records cannot be joined by a constant factor: in Peru the VIIRS/MODIS ratio
goes from ~4 in strong fire months to >8 in quiet ones. We therefore learn the
MODIS -> VIIRS relationship cell by cell in the overlap period (2012 onwards)
and use it to express the MODIS-only years (2000-2011) as "VIIRS-equivalent"
hotspot counts.

Pieces
------
* ``viirs_reference``: the VIIRS target. S-NPP is the reference sensor; on days
  when S-NPP is down (and after it was switched off on 2026-11-01) we fill in
  with NOAA-20 scaled by a calibration factor learned on the days both flew.
* Models (all share ``fit(df)`` / ``predict(df)`` on cell-month rows with
  columns ``x`` = predictor count, ``y`` = target count, ``month``):
    - ``RatioModel``          one Peru-wide factor (the naive approach)
    - ``MonthlyRatioModel``   one factor per calendar month
    - ``QuantileMapModel``    seasonal quantile mapping of non-zero counts
    - ``PoissonGLMModel``     log-link GLM on log1p(x), month and the cell's
                               fire regime (non-linear, handles zeros)
    - ``NegBinModel``         same predictors, negative-binomial likelihood
* ``leave_one_year_out``: each year in the overlap is predicted by a model that
  never saw it; metrics are computed on Peru monthly totals and on cell totals.

AI assistance: drafted with Claude (Anthropic) and reviewed by the OrbitaFire
team; see README "AI assistance".
"""
from __future__ import annotations

import gc

import numpy as np
import pandas as pd
import statsmodels.api as sm

from .grid import add_cells

# --------------------------------------------------------------------------
# VIIRS reference series (S-NPP + NOAA-20 gap filling / splice)
# --------------------------------------------------------------------------
SNPP_END = pd.Timestamp("2026-11-01")  # last S-NPP acquisition day in FIRMS


def noaa20_calibration(det: pd.DataFrame, min_day_count: int = 20) -> dict:
    """Factor k so that S-NPP ~= k * NOAA-20, from days both satellites flew.

    Uses Peru daily totals on days where both sensors have >= ``min_day_count``
    detections (avoids dividing tiny numbers). Returns k and diagnostics.
    """
    daily = (det[det.satellite.isin(["SNPP", "NOAA20"])]
             .groupby(["date", "satellite"]).size().unstack(fill_value=0))
    both = daily[(daily.get("SNPP", 0) >= min_day_count)
                 & (daily.get("NOAA20", 0) >= min_day_count)]
    k = both.SNPP.sum() / both.NOAA20.sum()
    log_ratio = np.log(both.SNPP / both.NOAA20)
    yearly = both.groupby(pd.to_datetime(both.index).year).sum()
    return {
        "k": float(k),
        "n_days": int(len(both)),
        "daily_log_ratio_sd": float(log_ratio.std()),
        "k_by_year": (yearly.SNPP / yearly.NOAA20).round(3).to_dict(),
    }


def snpp_outage_days(det: pd.DataFrame, min_noaa20: int = 10) -> pd.DatetimeIndex:
    """Days (before S-NPP shutdown) with no S-NPP detections over Peru while
    NOAA-20 still saw >= ``min_noaa20`` fires: S-NPP was not observing."""
    daily = (det[det.satellite.isin(["SNPP", "NOAA20"])]
             .groupby(["date", "satellite"]).size().unstack(fill_value=0))
    out = daily[(daily.SNPP == 0) & (daily.NOAA20 >= min_noaa20)
                & (pd.to_datetime(daily.index) < SNPP_END)]
    return pd.DatetimeIndex(pd.to_datetime(out.index))


def viirs_reference(det: pd.DataFrame, res: float, k: float):
    """Cell-month VIIRS reference counts ``n_vref`` (S-NPP-equivalent).

    S-NPP detections count 1; NOAA-20 detections on S-NPP outage days and on
    days after the S-NPP shutdown count ``k``. Also returns ``n_vfill`` (the
    filled part) so users can see how much of each month is gap-filled.
    """
    det = det.copy()
    det["date"] = pd.to_datetime(det["date"])
    outage = snpp_outage_days(det)
    is_snpp = det.satellite == "SNPP"
    is_fill = (det.satellite == "NOAA20") & (det.date.isin(outage) | (det.date > SNPP_END))
    sel = det[is_snpp | is_fill].copy()
    sel["w"] = np.where(sel.satellite == "SNPP", 1.0, k)
    sel["wfill"] = np.where(sel.satellite == "SNPP", 0.0, k)
    sel = add_cells(sel, res)
    out = sel.groupby(["cell", "month"]).agg(n_vref=("w", "sum"), n_vfill=("wfill", "sum")).reset_index()
    return out, outage


# --------------------------------------------------------------------------
# Models
# --------------------------------------------------------------------------
class RatioModel:
    """y = k * x with one factor for the whole country."""
    name = "ratio_global"

    def fit(self, df):
        self.k = df.y.sum() / max(df.x.sum(), 1e-9)
        return self

    def predict(self, df):
        return self.k * df.x.to_numpy(float)


class MonthlyRatioModel:
    """y = k[calendar month] * x."""
    name = "ratio_by_month"

    def fit(self, df):
        g = df.groupby(df.month.dt.month)[["x", "y"]].sum()
        self.k = (g.y / g.x.clip(lower=1e-9)).to_dict()
        self.k_all = df.y.sum() / max(df.x.sum(), 1e-9)
        return self

    def predict(self, df):
        k = df.month.dt.month.map(self.k).fillna(self.k_all).to_numpy(float)
        return k * df.x.to_numpy(float)


SEASONS = {12: "DJF", 1: "DJF", 2: "DJF", 3: "MAM", 4: "MAM", 5: "MAM",
           6: "JJA", 7: "JJA", 8: "JJA", 9: "SON", 10: "SON", 11: "SON"}


class QuantileMapModel:
    """Seasonal quantile mapping.

    For x > 0 the x-quantile is mapped to the same quantile of y among the
    cell-months where y > 0 in that season; for x == 0 we predict the mean y
    of cell-months with x == 0 (VIIRS still sees small fires there).
    """
    name = "quantile_map"
    q = np.linspace(0, 1, 201)

    def fit(self, df):
        self.maps, self.zero_mean = {}, {}
        season = df.month.dt.month.map(SEASONS)
        for s, d in df.groupby(season):
            xp, yp = d.x[d.x > 0], d.y[d.y > 0]
            # match the share of positives: keep the top len(xp) values of y
            yp = np.sort(yp.to_numpy())[-len(xp):] if len(yp) >= len(xp) else np.sort(yp.to_numpy())
            self.maps[s] = (np.quantile(xp, self.q), np.quantile(yp, self.q))
            self.zero_mean[s] = d.y[d.x == 0].mean()
        return self

    def predict(self, df):
        out = np.zeros(len(df))
        season = df.month.dt.month.map(SEASONS).to_numpy()
        x = df.x.to_numpy(float)
        for s, (qx, qy) in self.maps.items():
            m = season == s
            pos = m & (x > 0)
            # rank of x within training x-quantiles -> same quantile of y
            u = np.interp(x[pos], qx, self.q)
            out[pos] = np.interp(u, self.q, qy) * np.where(x[pos] > qx[-1], x[pos] / qx[-1], 1.0)
            out[m & (x == 0)] = self.zero_mean[s]
        return out


class PoissonGLMModel:
    """Poisson GLM (log link), quasi-likelihood:

        log E[y] = b0 + b1*log1p(x) + b2*[x==0] + b3*regime
                   + b4*log1p(x)*regime + month-of-year + log1p(x)*month-of-year

    The month terms let the MODIS->VIIRS slope change through the year (in the
    wet season fires are smaller and VIIRS sees relatively more of them).
    ``regime`` is the cell's mean log1p(x) in the training data (how
    fire-prone the cell is), so the same MODIS count can map to more VIIRS
    hotspots in cells dominated by many small fires. With the canonical log
    link the fitted totals match the observed totals, which is what we care
    about for country/region series. Only the coefficients are kept.
    """
    name = "poisson_glm"

    def _design(self, df):
        lx = np.log1p(df.x.to_numpy(float))
        reg = df.cell.map(self.regime).fillna(self.regime_default).to_numpy(float)
        mo = df.month.dt.month.to_numpy()
        cols = [np.ones(len(df)), lx, (df.x.to_numpy() == 0).astype(float), reg, lx * reg]
        cols += [(mo == m).astype(float) for m in range(2, 13)]  # January = baseline
        cols += [lx * (mo == m) for m in range(2, 13)]
        return np.column_stack(cols)

    def fit(self, df):
        self.regime = df.groupby("cell").x.apply(lambda s: np.log1p(s).mean()).to_dict()
        self.regime_default = float(np.mean(list(self.regime.values())))
        X, y = self._design(df), df.y.to_numpy(float)
        res = sm.GLM(y, X, family=sm.families.Poisson()).fit()
        mu = res.mu
        self.alpha = float(max(np.sum((y - mu) ** 2 - mu) / np.sum(mu ** 2), 1e-3))
        if self.name == "negbin_glm":
            res = sm.GLM(y, X, family=sm.families.NegativeBinomial(alpha=self.alpha)).fit()
        self.params = np.asarray(res.params)
        del res
        gc.collect()  # statsmodels results hold reference cycles with big arrays
        return self

    def predict(self, df):
        return np.exp(self._design(df) @ self.params)


class NegBinModel(PoissonGLMModel):
    """Same predictors as ``PoissonGLMModel`` but negative-binomial likelihood
    (over-dispersion alpha estimated by moments from the Poisson fit): gives
    less weight to the biggest cell-months."""
    name = "negbin_glm"


MODELS = [RatioModel, MonthlyRatioModel, QuantileMapModel, PoissonGLMModel, NegBinModel]


# --------------------------------------------------------------------------
# Validation
# --------------------------------------------------------------------------
def _metrics(obs, pred):
    obs, pred = np.asarray(obs, float), np.asarray(pred, float)
    big = obs >= 100
    return {
        "mae": float(np.mean(np.abs(pred - obs))),
        "bias_pct": float(100 * (pred.sum() - obs.sum()) / obs.sum()),
        "r": float(np.corrcoef(obs, pred)[0, 1]),
        "mape_pct": float(100 * np.mean(np.abs(pred[big] - obs[big]) / obs[big])),
    }


def leave_one_year_out(df: pd.DataFrame, model_cls, years=None):
    """Out-of-fold predictions: each year predicted by a model fit on the others.

    ``df`` has cell, month, x, y. Returns the rows of the evaluated years with a
    ``pred`` column added.
    """
    yr = df.month.dt.year
    years = sorted(yr.unique()) if years is None else years
    parts = []
    for Y in years:
        train, test = df[yr != Y], df[yr == Y]
        m = model_cls().fit(train)
        parts.append(test.assign(pred=m.predict(test)))
    return pd.concat(parts)


def evaluate(oof: pd.DataFrame) -> dict:
    """Metrics of out-of-fold predictions at three scales."""
    monthly = oof.groupby("month")[["y", "pred"]].sum()
    yearly = oof.groupby(oof.month.dt.year)[["y", "pred"]].sum()
    cellyear = oof.groupby(["cell", oof.month.dt.year])[["y", "pred"]].sum()
    out = {f"monthly_{k}": v for k, v in _metrics(monthly.y, monthly.pred).items()}
    out["yearly_mape_pct"] = float(100 * np.mean(np.abs(yearly.pred - yearly.y) / yearly.y))
    out["yearly_max_abs_err_pct"] = float(100 * np.max(np.abs(yearly.pred - yearly.y) / yearly.y))
    out["cell_year_spearman"] = float(cellyear.y.rank().corr(cellyear.pred.rank()))
    out["cell_year_mae"] = float(np.mean(np.abs(cellyear.pred - cellyear.y)))
    return out


def compare_models(df, models=MODELS, years=None):
    """Run leave-one-year-out for every model. Returns (table, {name: oof})."""
    rows, oofs = [], {}
    for cls in models:
        oof = leave_one_year_out(df, cls, years)
        oofs[cls.name] = oof
        rows.append({"model": cls.name, **evaluate(oof)})
    return pd.DataFrame(rows).set_index("model"), oofs


def relative_sigma(oof: pd.DataFrame, season_months=(7, 8, 9, 10, 11)) -> dict:
    """Spread of log(pred/obs) for Peru monthly totals, split into fire season
    and the rest; used for the uncertainty band of reconstructed months."""
    m = oof.groupby("month")[["y", "pred"]].sum()
    m = m[(m.y > 0) & (m.pred > 0)]
    lr = np.log(m.pred / m.y)
    fs = m.index.month.isin(season_months)
    return {"fire_season": float(lr[fs].std()), "off_season": float(lr[~fs].std()),
            "bias_log": float(lr.mean())}
