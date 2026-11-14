"""Tests for orbitafire.seasons.

Developed by the OrbitaFire team with AI assistance (Claude, Anthropic).
"""
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from orbitafire import seasons as S  # noqa: E402


def monthly(spike_year=2020):
    months = pd.date_range("2010-01-01", "2021-12-01", freq="MS")
    season = np.where(months.month.isin([8, 9]), 1000.0, 100.0)
    v = season * (1 + 0.05 * np.sin(np.arange(len(months))))
    v[(months.year == spike_year) & (months.month == 9)] *= 3
    return pd.DataFrame({"month": months, "n_harm": v, "partial_month": False, "source": "viirs_snpp"})


def test_spike_is_flagged_and_baseline_excludes_itself():
    a = S.monthly_anomalies(monthly())
    sep2020 = a[a.month == "2020-09-01"].iloc[0]
    assert sep2020.category == "extreme"
    assert sep2020["median"] < 1100  # the spike is not part of its own baseline
    normal = a[(a.month.dt.month == 9) & (a.month.dt.year != 2020)]
    assert (normal.category == "normal").all()


def test_fire_calendar_shares_sum_to_about_one():
    cal = S.fire_calendar(monthly())
    assert abs(cal["median"].sum() - 1) < 0.05
    assert set(cal.sort_values("median").mo.tail(2)) == {8, 9}
