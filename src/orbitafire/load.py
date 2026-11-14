"""Load and clean NASA FIRMS active-fire downloads (archive + near-real-time).

Developed by the OrbitaFire team with AI assistance (Claude, Anthropic).
See README > "AI assistance".

FIRMS delivers one folder per satellite source, each with an archive file
(standard processing, has the ``type`` column) and an NRT file (recent
months, no ``type`` column). This module:

1. reads both files for every source and tags the satellite;
2. keeps confident detections only
   - MODIS: confidence >= 30 (nominal + high)
   - VIIRS: confidence in {n, h}
3. keeps presumed vegetation fires only
   - archive: ``type == 0``
   - NRT has no ``type``: we drop detections falling in "static cells",
     i.e. small cells where the archive is dominated by volcanoes, other
     static land sources (gas flares, industry) or offshore detections.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

# folder name -> (sensor, default satellite label)
SOURCES = {
    "modis": "MODIS",
    "snpp": "VIIRS",
    "noaa20": "VIIRS",
    "noaa21": "VIIRS",
}
VIIRS_SAT = {"N": "SNPP", "SNPP": "SNPP", "N20": "NOAA20", "1": "NOAA20", "N21": "NOAA21", "2": "NOAA21"}
MODIS_SAT = {"Terra": "TERRA", "T": "TERRA", "Aqua": "AQUA", "A": "AQUA"}

MODIS_MIN_CONF = 30
VIIRS_OK_CONF = {"n", "h", "nominal", "high"}
STATIC_CELL_DEG = 0.02          # ~2 km cells to flag static sources
STATIC_MIN_DETECTIONS = 5       # flag a cell if it has >= this many non-vegetation archive detections
STATIC_MIN_SHARE = 0.5          # ... and they are at least this share of the cell's archive detections

COLUMNS = ["lat", "lon", "date", "acq_time", "sensor", "satellite", "confidence",
           "frp", "daynight", "type", "processing"]


def _read_one(path: Path, sensor: str) -> pd.DataFrame:
    raw = pd.read_csv(path, low_memory=False, dtype={"confidence": str, "satellite": str, "version": str})
    sat_map = MODIS_SAT if sensor == "MODIS" else VIIRS_SAT
    df = pd.DataFrame({
        "lat": raw["latitude"].astype("float64"),
        "lon": raw["longitude"].astype("float64"),
        "date": pd.to_datetime(raw["acq_date"]),
        "acq_time": pd.to_numeric(raw["acq_time"], errors="coerce").astype("Int32"),
        "sensor": sensor,
        "satellite": raw["satellite"].astype(str).str.strip().map(sat_map).fillna(raw["satellite"].astype(str)),
        "confidence": raw["confidence"].astype(str).str.strip().str.lower(),
        "frp": pd.to_numeric(raw["frp"], errors="coerce"),
        "daynight": raw.get("daynight", pd.Series(pd.NA, index=raw.index)),
        "type": pd.to_numeric(raw["type"], errors="coerce").astype("Int8") if "type" in raw else pd.Series(pd.NA, index=raw.index, dtype="Int8"),
        "processing": "archive" if "archive" in path.name else "nrt",
    })
    return df[COLUMNS]


def read_firms_folder(root: str | Path) -> pd.DataFrame:
    """Read every source folder under ``root`` (modis/, snpp/, noaa20/, noaa21/)."""
    root = Path(root)
    frames = []
    for folder, sensor in SOURCES.items():
        for path in sorted((root / folder).glob("*.csv")):
            frames.append(_read_one(path, sensor))
    if not frames:
        raise FileNotFoundError(f"No FIRMS CSV files found under {root}")
    df = pd.concat(frames, ignore_index=True)
    # archive and NRT never overlap in FIRMS downloads, but be safe
    df = df.drop_duplicates(subset=["lat", "lon", "date", "acq_time", "satellite"])
    return df.reset_index(drop=True)


def _cell_key(lat: pd.Series, lon: pd.Series, deg: float) -> pd.Series:
    return (np.floor(lat / deg).astype(int).astype(str) + "_" + np.floor(lon / deg).astype(int).astype(str))


def static_cells(df: pd.DataFrame, deg: float = STATIC_CELL_DEG) -> set[str]:
    """Small cells where archive detections are mostly non-vegetation (type 1, 2 or 3)."""
    arch = df[(df["processing"] == "archive") & df["type"].notna()]
    key = _cell_key(arch["lat"], arch["lon"], deg)
    stats = pd.DataFrame({"key": key, "nonveg": arch["type"].ne(0).astype(int)}).groupby("key")["nonveg"].agg(["sum", "count"])
    flagged = stats[(stats["sum"] >= STATIC_MIN_DETECTIONS) & (stats["sum"] / stats["count"] >= STATIC_MIN_SHARE)]
    return set(flagged.index)


def clean(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """Apply confidence and vegetation filters. Returns cleaned data and a filter report."""
    report = {"input": len(df)}
    is_modis = df["sensor"].eq("MODIS")
    conf_num = pd.to_numeric(df["confidence"], errors="coerce")
    ok_conf = (is_modis & conf_num.ge(MODIS_MIN_CONF)) | (~is_modis & df["confidence"].isin(VIIRS_OK_CONF))
    report["dropped_low_confidence"] = int((~ok_conf).sum())
    df = df[ok_conf]

    is_arch = df["processing"].eq("archive")
    nonveg_arch = is_arch & df["type"].fillna(0).ne(0)
    report["dropped_nonvegetation_archive"] = int(nonveg_arch.sum())

    cells = static_cells(df)
    in_static = (~is_arch) & _cell_key(df["lat"], df["lon"], STATIC_CELL_DEG).isin(cells)
    report["static_cells"] = len(cells)
    report["dropped_static_nrt"] = int(in_static.sum())

    out = df[~nonveg_arch & ~in_static].reset_index(drop=True)
    report["output"] = len(out)
    return out, report
