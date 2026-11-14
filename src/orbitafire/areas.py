"""Protected areas (SERNANP) and fire hotspots inside them.

Loads SERNANP GeoJSON layers, builds analysis units (each protected area and
the ring of its buffer zone *outside* the area), and counts VIIRS hotspots in
each unit by point-in-polygon tests (no gridding: VIIRS pixels are 375 m, much
finer than most reserves).

AI assistance: drafted with Claude (Anthropic) and reviewed by the OrbitaFire
team; see README "AI assistance".
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
import shapely
from pyproj import Geod
from shapely.geometry import shape

GEOD = Geod(ellps="WGS84")


def area_km2(geom) -> float:
    return abs(GEOD.geometry_area_perimeter(geom)[0]) / 1e6


def read_layer(path: Path) -> list[dict]:
    feats = json.loads(Path(path).read_text(encoding="utf-8"))["features"]
    out = []
    for f in feats:
        g = shape(f["geometry"])
        if not g.is_valid:
            g = shapely.make_valid(g)
        out.append({**f["properties"], "geometry": g})
    return out


def protected_area_units(anp_path: Path, za_path: Path) -> pd.DataFrame:
    """One row per unit: kind = 'area' (the protected area) or 'buffer' (its
    buffer zone minus the area itself). Areas sharing a code (sectors) are merged."""
    anp = pd.DataFrame(read_layer(anp_path))
    za = pd.DataFrame(read_layer(za_path))
    rows = []
    for code, g in anp.groupby("anp_codi"):
        geom = shapely.union_all(list(g.geometry))
        rows.append({"code": code, "name": g.anp_nomb.iloc[0], "category": g.anp_cate.iloc[0],
                     "regions": g.anp_ubpo.iloc[0], "kind": "area", "geometry": geom})
    areas = {r["code"]: r["geometry"] for r in rows}
    for code, g in za.groupby("anp_codi"):
        geom = shapely.union_all(list(g.geometry))
        if code in areas:
            geom = geom.difference(areas[code])
        rows.append({"code": code, "name": g.anp_nomb.iloc[0], "category": g.c_nomb.iloc[0],
                     "regions": None, "kind": "buffer", "geometry": geom})
    units = pd.DataFrame(rows)
    units["area_km2"] = [area_km2(g) for g in units.geometry]
    return units[units.area_km2 > 0].reset_index(drop=True)


def assign_points(lon: np.ndarray, lat: np.ndarray, units: pd.DataFrame) -> dict[int, np.ndarray]:
    """Indices of the points that fall in each unit (bbox prefilter + exact test)."""
    out = {}
    for i, g in enumerate(units.geometry):
        x0, y0, x1, y1 = g.bounds
        cand = np.flatnonzero((lon >= x0) & (lon <= x1) & (lat >= y0) & (lat <= y1))
        if len(cand):
            shapely.prepare(g)
            inside = shapely.contains_xy(g, lon[cand], lat[cand])
            out[i] = cand[inside]
        else:
            out[i] = cand
    return out


def communities_near(units: pd.DataFrame, comm_path: Path) -> pd.DataFrame:
    """Native communities (collective, titled territories) intersecting each unit.
    Only community-level public attributes are kept: name and people (etnia)."""
    comm = pd.DataFrame(read_layer(comm_path))
    tree = shapely.STRtree(list(comm.geometry))
    rows = []
    for i, u in units.iterrows():
        idx = tree.query(u.geometry, predicate="intersects")
        c = comm.iloc[idx]
        peoples = sorted({str(e).strip().title() for e in c.etnia if str(e).strip()})
        rows.append({"unit": i, "n_communities": len(c), "peoples": "; ".join(peoples),
                     "communities": "; ".join(sorted(str(n).strip().title() for n in c.nom_comuni))})
    return pd.DataFrame(rows).set_index("unit")
