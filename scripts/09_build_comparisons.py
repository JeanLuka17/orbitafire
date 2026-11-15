"""Observed daily series and conservative whole-cell sector membership. No GLM fitting."""
import sys
from pathlib import Path
import json
import numpy as np
import pandas as pd
import shapely
from shapely.geometry import shape, box

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'src'))
from orbitafire import harmonize as H
from orbitafire.grid import add_cells

out=ROOT/'docs/data'
manifest=json.loads((out/'observatory.json').read_text(encoding='utf-8'))
control=json.loads((out/'control.json').read_text(encoding='utf-8'))
locations=manifest['locations']
cells=control['cells']
def dump(obj,path):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(obj,separators=(',',':'),ensure_ascii=False,allow_nan=False),encoding='utf-8')
members={}
for name in ['areas','regions']:
    features=json.loads((out/f'{name}.json').read_text(encoding='utf-8'))['features']
    for f in features:
        key=f['properties'].get('id') or 'region|'+f['properties']['name']
        # Margin protects against small simplification shifts; this is still display geometry.
        g=shapely.make_valid(shape(f['geometry'])).buffer(-.005)
        members[key]=[c['id'] for c in cells if g.covers(box(c['lon']-.125,c['lat']-.125,c['lon']+.125,c['lat']+.125))]
dump({'method':'whole_cells_in_display_polygon_with_0.005deg_margin','members':members},out/'sectors.json')

det=pd.read_parquet(ROOT/'data/processed/detections_clean.parquet')
det['date']=pd.to_datetime(det.date)
k=json.loads((ROOT/'results/harmonize_report.json').read_text())['noaa20_calibration']['k']
outages=H.snpp_outage_days(det)
fill=det.satellite.eq('NOAA20') & (det.date.isin(outages)|(det.date>H.SNPP_END))
pts=det[det.satellite.eq('SNPP')|fill].copy()
pts['w']=np.where(pts.satellite.eq('SNPP'),1.,k)
pts=add_cells(pts)
pts['id']=['cell|'+f'{lat:.3f}_{lon:.3f}' for lat,lon in zip(pts.cell_lat,pts.cell_lon)]
daily=pts.groupby(['id','date']).w.sum()
start,end=pts.date.min(),pts.date.max()
dates=pd.date_range(start,end,freq='D')
ix={d:i for i,d in enumerate(dates)}
meta={'start':str(start.date()),'end':str(end.date()),'last_day_complete':False,
      'source':'Observed S-NPP + calibrated NOAA-20 reference; no model estimates',
      'zero_semantics':'No reference detections recorded within download coverage, not proof of satellite visibility',
      'week_alignment':'Calendar-month blocks: days 1–7, 8–14, 15–21, 22–28, 29–month-end',
      'files':{}}
for block in range((len(cells)+49)//50):
    payload={}
    file=f'daily/cells_{block:02d}.json'
    for c in cells[block*50:(block+1)*50]:
        series=daily.loc[c['id']] if c['id'] in daily.index.get_level_values(0) else pd.Series(dtype=float)
        payload[c['id']]=[[ix[d],round(float(v),4)] for d,v in series.items()]
        meta['files'][c['id']]=file
    dump(payload,out/file)
national=pts.groupby('date').w.sum()
dump({'peru':[[ix[d],round(float(v),4)] for d,v in national.items()]},out/'daily/national.json')
meta['files']['peru']='daily/national.json'
dump(meta,out/'daily.json')
manifest['daily_available']=True
manifest['daily_scope']=['country','cell']
dump(manifest,out/'observatory.json')
print(f'Daily reference: {start.date()} to {end.date()}; {len(daily)} nonzero cell-days; {len(members)} sector memberships')
