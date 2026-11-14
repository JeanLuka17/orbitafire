"""Common spatial grid and monthly counts per satellite.

Developed by the OrbitaFire team with AI assistance (Claude, Anthropic).
See README > "AI assistance".

MODIS (~1 km pixels) and VIIRS (~375 m pixels) cannot be compared point by
point, so both are aggregated to the same regular grid (default 0.25 deg)
and to calendar months. The panel keeps every active cell x month with
zeros, because VIIRS often sees fire where MODIS saw none.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

SATELLITES = ["TERRA", "AQUA", "SNPP", "NOAA20", "NOAA21"]


def add_cells(df: pd.DataFrame, res: float = 0.25) -> pd.DataFrame:
    out = df.copy()
    out["cell_lat"] = (np.floor(out["lat"] / res) * res + res / 2).round(4)
    out["cell_lon"] = (np.floor(out["lon"] / res) * res + res / 2).round(4)
    out["cell"] = out["cell_lat"].astype(str) + "_" + out["cell_lon"].astype(str)
    out["month"] = out["date"].dt.to_period("M").dt.to_timestamp()
    return out


def monthly_panel(df: pd.DataFrame, res: float = 0.25, end: str | None = None) -> pd.DataFrame:
    """Wide panel: one row per (cell, month), one count column and one FRP column per satellite."""
    g = add_cells(df, res)
    counts = g.pivot_table(index=["cell", "cell_lat", "cell_lon", "month"], columns="satellite",
                           values="lat", aggfunc="size", fill_value=0)
    frp = g.pivot_table(index=["cell", "cell_lat", "cell_lon", "month"], columns="satellite",
                        values="frp", aggfunc="sum", fill_value=0.0)
    counts.columns = [f"n_{c.lower()}" for c in counts.columns]
    frp.columns = [f"frp_{c.lower()}" for c in frp.columns]
    wide = counts.join(frp).reset_index()

    cells = wide[["cell", "cell_lat", "cell_lon"]].drop_duplicates()
    m0, m1 = wide["month"].min(), pd.Timestamp(end) if end else wide["month"].max()
    months = pd.DataFrame({"month": pd.date_range(m0, m1, freq="MS")})
    panel = cells.merge(months, how="cross").merge(wide, on=["cell", "cell_lat", "cell_lon", "month"], how="left")
    for s in SATELLITES:
        for p in ("n", "frp"):
            col = f"{p}_{s.lower()}"
            if col not in panel:
                panel[col] = 0.0
            panel[col] = panel[col].fillna(0)
    panel["n_modis"] = panel["n_terra"] + panel["n_aqua"]
    panel["frp_modis"] = panel["frp_terra"] + panel["frp_aqua"]
    return panel.sort_values(["cell", "month"]).reset_index(drop=True)


def in_bbox(panel: pd.DataFrame, min_lat, max_lat, min_lon, max_lon) -> pd.Series:
    return panel["cell_lat"].between(min_lat, max_lat) & panel["cell_lon"].between(min_lon, max_lon)
