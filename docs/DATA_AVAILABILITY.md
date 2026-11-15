# Geographic inputs and observatory methodology

All work is local. No original geographical inputs were downloaded or reconstructed
from the display geometry. The Poisson GLM is not modified or refitted.

## Missing original inputs

The entire project was searched, including ignored and hidden files, for GeoJSON,
Shapefile, GeoPackage and ZIP copies. No originals or copies were found.
All paths below are relative to `C:\Users\josue\orbitafire`.

| Expected path | Format and required attributes | Origin | Dependent features |
|---|---|---|---|
| `data/external/sernanp/sernanp_anp_nacional.geojson` | GeoJSON FeatureCollection, EPSG:4326 polygons; `anp_codi`, `anp_nomb`, `anp_cate`, `anp_ubpo` | SERNANP download service, layer 1 (ANP Nacional Definitiva) | Recomputing protected-area boundaries, geodesic surface, exact point-in-polygon counts, density and community intersections in step 04; regenerating display geometries in step 05 |
| `data/external/sernanp/sernanp_zona_amortiguamiento.geojson` | GeoJSON FeatureCollection, EPSG:4326 polygons; `anp_codi`, `anp_nomb`, `c_nomb` | SERNANP download service, layer 8 (Zona Amortiguamiento) | Rebuilding buffer rings (buffer minus associated reserve), their counts/surfaces and community intersections in step 04; regenerating outlines in step 05 |
| `data/external/sernanp/sernanp_comunidades_nativas.geojson` | GeoJSON FeatureCollection, EPSG:4326 polygons; `nom_comuni`, `etnia` | SERNANP download service, layer 39 (Comunidades nativas) | Recomputing community/unit intersections and representative points; exact community-territory spatial analysis |
| `data/external/geoboundaries/geoBoundaries-PER-ADM1_simplified.geojson` | GeoJSON FeatureCollection, EPSG:4326 polygons; `shapeName` | geoBoundaries, `wmgeolab/geoBoundaries`, gbOpen/PER/ADM1 | Regenerating department outlines with source attributes and using the source version for regional aggregation |

SERNANP service (layers verified):
https://geoservicios.sernanp.gob.pe/arcgis/rest/services/sernanp_visor/servicio_descarga/MapServer

geoBoundaries provider: https://github.com/wmgeolab/geoBoundaries

The historical version of the original downloads is not recorded in this repository.
A fresh download would need version/date and checksum documentation; it cannot be
assumed to reproduce the original 2026 study boundaries exactly.

## Available real derivatives and what they permit

- `docs/data/areas.json`: 159 simplified SERNANP units (interiors and buffer rings),
  attributes and metrics. Suitable for map selection; not substituted for original
  boundaries when counting new detections.
- `docs/data/regions.json`: 26 simplified geoBoundaries department features.
  Used for **approximate regional aggregation of the existing 0.25° grid by cell
  center**. Each cell is assigned at most once; border ties follow feature order.
  Cells outside these simplified polygons are reported as unassigned, not forced
  into a department. Small departments without cell centers have missing values,
  not zeros. No claim of exact point-in-polygon regional totals or spatial bands.
- `docs/data/communities.json`: public representative points, names and peoples.
  These points cannot recover community polygons or measure damage/exposure.
- `results/protected_areas_monthly.csv`: real VIIRS reference counts already
  calculated by step 04 using the original polygons. Step 04 deliberately saves
  only positive counts (`mon[mon.hotspots > 0]`). Zeros can therefore be restored
  for every unit listed in `protected_areas_fire.csv`, from January 2012 through
  the last reported complete month. Months outside this coverage remain missing.
  Export validates 2024 totals against independent step-04 annual metrics.
- `data/processed/harmonized_panel_0.25deg.parquet`: 1,750 cells, monthly values,
  source and VIIRS reference observations; permits historical cell/regional views.
- `results/peru_monthly_harmonized.csv`: national values and available 95% bands.

This permits the current observatory without rerunning steps 01–04. Recomputing
protected-area counts/community intersections from raw points remains blocked by
the three missing original SERNANP files. Original community polygons cannot be
recovered from their points. No pre-2012 grid predictions are assigned to reserves.

## Export and data contract

```powershell
python scripts/05_build_web.py --observatory-only
python -m pytest -q tests
python -m http.server 8765 --directory docs --bind 127.0.0.1
```

`docs/data/observatory.json` contains the schema (`fields`), source codes,
location metadata, provenance method, export validation summary and shard paths.
`docs/data/observatory/{national,regions,territories}.json` contain monthly records.
Cells load in shards of 50 locations (`cells_00.json`, etc.), so the browser never
loads all monthly grid data at once. Each bundle has explicit `months`, packed
`rows`, full baseline years, monthly statistics, trend and year-to-date results.

Columns: value, observed reference count, source code, month completeness,
available 95% lower/upper bounds, other-year median/P10/P90, robust z, ratio,
First Recorded Detection, off-season activity, exceptional intensity.
Missing values are JSON `null`; recorded zeros are numeric `0`.
VIIRS reference counts include calibrated NOAA-20 gap fills, not duplicated sensors.
Bands are exported only where supplied nationally by the existing pipeline. No
cell, region or reserve uncertainty band is invented.

## Statistical rules

- S-NPP starts on 20 January 2012. That month is marked incomplete. November
  2026 is incomplete according to the national pipeline metadata. These months
  are visible but never contribute to anomalies/comparison statistics.
- Seasonal medians/P10/P90 and annual summaries use only years with all twelve
  complete available months. Monthly robust z reuses `seasons.robust_z` including
  its MAD floor, comparing the same month of other full years (minimum five).
- Exceptional intensity: robust z >= 3.5. Off-season: positive activity, robust
  z >= 2, monthly reference median <= 10% of the peak reference monthly median.
  A high absolute value alone does not automatically produce either flag.
- First Recorded Detection: an observed-source positive reference count after
  at least 60 consecutive complete observed zero months, with no earlier positive
  observation in this comparable VIIRS record. Reconstructed values are excluded.
  Missing/incomplete observation months interrupt the qualifying zero run.
  A real positive detection in an incomplete month still counts as prior evidence
  and prevents a later observation being described as the first recorded detection.
- Historical elevated frequency: proportion of eligible monthly or Jul–Nov
  season totals with leave-one-year-out robust z >= 2. It is descriptive only.
- Trends: Theil–Sen annual slope and 95% slope interval after at least eight
  complete years. Directional evidence is reported only if the interval excludes
  zero. YTD uses the identical month range and requires every included month.
- Period controls filter displayed comparisons/anomaly lists; reference anomaly
  and seasonal statistics retain the full complete-year record, explicitly
  labelled. The orange bar-chart median uses displayed complete months.
- Protected interiors and associated buffer rings remain separate. Units can
  overlap across different reserves, so territorial counts must not be summed
  to produce national totals. Densities use original geodesic surfaces in CSV.

## Observed daily/weekly comparison extension

Run `python scripts/09_build_comparisons.py`. Daily comparisons are now exported
for Peru and individual grid cells from actual cleaned S-NPP observations and
calibrated NOAA-20 fills using the existing reference selection. No GLM values
are disaggregated. Coverage starts 2012-01-20; the latest acquisition day is
excluded in comparisons as potentially incomplete. Numeric zero means no
reference detection recorded within download coverage, not proof of visibility.

Week alignment uses fixed calendar-month blocks: days 1–7, 8–14, 15–21, 22–28,
29–month-end; the final block can be shorter. These are not ISO weeks. The daily
matrix shows seven nearby days, with missing/invalid dates shown as missing.
Dates use the FIRMS acquisition-date calendar, stored as UTC dates.

Original boundaries are still required to export verified daily protected-area
counts. Regional daily comparisons are not exported. Those choices are disabled.
`sectors.json` lists conservative whole-cell candidates completely covered by
available display polygons after an inward 0.005° margin. This approximation
cannot establish a verified ignition location or replace original boundaries.
Cells crossing the available boundary are excluded. A sector marker requires a
positive complete observed reference count; none is fabricated for zero data.
