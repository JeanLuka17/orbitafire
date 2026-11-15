"""Scientific invariants for observatory statistics and real exported datasets."""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from orbitafire.observatory import analyse, FIELDS
from orbitafire.seasons import robust_z

ROOT = Path(__file__).resolve().parents[1]


def fixture_frame():
    dates = pd.date_range("2012-01-01", "2021-12-01", freq="MS")
    values = np.where(dates.month == 9, 100., 0.)
    return pd.DataFrame({"value": values, "observed": values, "source": "viirs_reference",
                         "complete": True}, index=dates)


def test_partial_month_has_no_anomaly_and_is_not_a_baseline():
    f = fixture_frame()
    f.loc["2021-09-01", ["value", "complete"]] = [10000., False]
    result = analyse(f)
    row = result["rows"][-4]
    assert np.isnan(row[FIELDS.index("z")])
    assert not row[FIELDS.index("exceptional")]
    assert 2021 not in result["full_years"]
    assert result["seasonal"][8][0] == 100


def test_observed_first_detection_never_uses_reconstructed_counts():
    f = fixture_frame()
    f["value"], f["observed"] = 0., 0.
    f.loc["2018-04-01", ["value", "observed"]] = [1., 1.]
    result = analyse(f)
    flags = [row[FIELDS.index("first")] for row in result["rows"]]
    assert sum(flags) == 1
    f["source"], f["observed"] = "modis_model", np.nan
    assert not any(row[FIELDS.index("first")] for row in analyse(f)["rows"])


def test_missing_observation_breaks_first_detection_qualification():
    f = fixture_frame()
    f["value"], f["observed"] = 0., 0.
    f.loc["2018-04-01", ["value", "observed"]] = [1., 1.]
    f.loc["2018-03-01", "observed"] = np.nan
    assert not any(row[FIELDS.index("first")] for row in analyse(f)["rows"])


def test_partial_month_positive_is_still_evidence_of_a_prior_detection():
    f = fixture_frame()
    f["value"], f["observed"] = 0., 0.
    f.loc["2012-01-01", ["value", "observed", "complete"]] = [1., 1., False]
    f.loc["2020-04-01", ["value", "observed"]] = [1., 1.]
    assert not any(row[FIELDS.index("first")] for row in analyse(f)["rows"])


def test_offseason_and_intensity_are_independent_and_use_existing_mad_floor():
    f = fixture_frame()
    f.loc["2020-02-01", ["value", "observed"]] = [3., 3.]
    r = dict(zip(FIELDS, analyse(f)["rows"][f.index.get_loc("2020-02-01")]))
    assert r["z"] == robust_z(3., [0.]*9)[0] == 3
    assert r["off_season"]
    assert not r["exceptional"]
    assert not r["first"]  # earlier observed September positives exist
    assert np.isnan(r["ratio"])  # no fictitious division by a pseudo-count


def test_actual_exports_preserve_counts_sources_and_coverage():
    path = ROOT / "docs/data/observatory.json"
    if not path.exists():
        pytest.skip("Run python scripts/05_build_web.py --observatory-only for data integration checks")
    manifest = json.loads(path.read_text(encoding="utf-8"))
    assert manifest["validation"]["national_max_difference"] <= .051
    fields = manifest["fields"]
    idx = {key: fields.index(key) for key in fields}
    territory = json.loads((ROOT / "docs/data/observatory/territories.json").read_text(encoding="utf-8"))
    sparse = pd.read_csv(ROOT / "results/protected_areas_monthly.csv")
    for id_, d in territory.items():
        code, kind = id_.split("|")
        original = sparse[(sparse.code == code) & (sparse.kind == kind)].set_index("month").hotspots
        for month, row in zip(d["months"], d["rows"]):
            assert row[idx["value"]] == pytest.approx(original.get(month, 0.), abs=.0001)
            assert row[idx["source"]] == 4
            assert row[idx["complete"]] == (month != "2012-01")
    region = json.loads((ROOT / "docs/data/observatory/regions.json").read_text(encoding="utf-8"))
    empty = [l for l in manifest["locations"] if l["kind"] == "region" and l["cells"] == 0]
    for loc in empty:
        assert all(row[idx["value"]] is None for row in region[loc["id"]]["rows"])
    # All cell-month values must match the original panel, including numeric zeros.
    panel_path = ROOT / "data/processed/harmonized_panel_0.25deg.parquet"
    if panel_path.exists():
        panel = pd.read_parquet(panel_path)
        import shapely
        from shapely.geometry import shape
        features = json.loads((ROOT / "docs/data/regions.json").read_text(encoding="utf-8"))["features"]
        footprint = shapely.union_all([shapely.make_valid(shape(f["geometry"])) for f in features])
        covered = shapely.intersects_xy(footprint, panel.cell_lon.to_numpy(), panel.cell_lat.to_numpy())
        expected_region_total = panel[covered].groupby(panel[covered].month.dt.strftime("%Y-%m")).n_harm.sum()
        actual_region_total = pd.Series(dtype=float)
        for series in region.values():
            values = pd.Series([row[idx["value"]] for row in series["rows"]], index=series["months"])
            actual_region_total = actual_region_total.add(values, fill_value=0.)
        assert np.allclose(actual_region_total.loc[expected_region_total.index], expected_region_total, atol=.002)
        original = {(f"cell|{lat:.3f}_{lon:.3f}", m.strftime("%Y-%m")): v
                    for lat, lon, m, v in panel[["cell_lat", "cell_lon", "month", "n_harm"]].itertuples(index=False, name=None)}
        for file in sorted({l["file"] for l in manifest["locations"] if l["kind"] == "cell"}):
            shard = json.loads((ROOT / "docs/data" / file).read_text(encoding="utf-8"))
            for id_, d in shard.items():
                for month, row in zip(d["months"], d["rows"]):
                    assert row[idx["value"]] == pytest.approx(original[id_, month], abs=.00006)
