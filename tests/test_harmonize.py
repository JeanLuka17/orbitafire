"""Tests for orbitafire.harmonize on synthetic data.

Developed by the OrbitaFire team with AI assistance (Claude, Anthropic).
"""
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from orbitafire import harmonize as H  # noqa: E402


def synthetic(n_cells=40, years=range(2012, 2018), seed=0):
    """VIIRS = non-linear function of MODIS: ratio higher when MODIS is low."""
    rng = np.random.default_rng(seed)
    rows = []
    for c in range(n_cells):
        base = rng.gamma(1.0, 2.0)
        for y in years:
            for mo in range(1, 13):
                lam = base * (6 if mo in (8, 9) else 0.5) * rng.lognormal(0, 0.3)
                x = rng.poisson(lam)
                y_ = rng.poisson(np.exp(1.0 + 0.8 * np.log1p(x)) + 2 * lam)
                rows.append((f"c{c}", pd.Timestamp(y, mo, 1), x, y_))
    return pd.DataFrame(rows, columns=["cell", "month", "x", "y"])


def test_ratio_model_preserves_totals():
    df = synthetic()
    m = H.RatioModel().fit(df)
    assert np.isclose(m.predict(df).sum(), df.y.sum())


def test_glm_preserves_totals_and_beats_ratio():
    df = synthetic()
    tab, oofs = H.compare_models(df, [H.RatioModel, H.PoissonGLMModel])
    fit = H.PoissonGLMModel().fit(df)
    assert abs(fit.predict(df).sum() / df.y.sum() - 1) < 1e-6  # canonical link
    assert tab.loc["poisson_glm", "monthly_mae"] < tab.loc["ratio_global", "monthly_mae"]


def test_leave_one_year_out_never_trains_on_test_year():
    df = synthetic(years=range(2012, 2015))
    seen = []

    class Spy(H.RatioModel):
        def fit(self, d):
            seen.append(set(d.month.dt.year))
            return super().fit(d)

    oof = H.leave_one_year_out(df, Spy)
    assert len(oof) == len(df)
    for yrs, test_year in zip(seen, [2012, 2013, 2014]):
        assert test_year not in yrs
