"""Validate observed daily export and safe whole-cell geographic membership."""
import json
from pathlib import Path
import numpy as np
import pandas as pd
import shapely
from shapely.geometry import shape,box

ROOT=Path(__file__).resolve().parents[1]
def read(name):return json.loads((ROOT/'docs/data'/name).read_text(encoding='utf-8'))

def test_observed_daily_cell_sums_match_existing_monthly_reference():
    meta=read('daily.json');months=read('control.json')['months']
    dates=pd.date_range(meta['start'],meta['end'],freq='D')
    expected=pd.read_parquet(ROOT/'data/processed/harmonized_panel_0.25deg.parquet')
    expected['id']=['cell|'+f'{a:.3f}_{b:.3f}' for a,b in zip(expected.cell_lat,expected.cell_lon)]
    expected=expected.set_index(['id','month']).n_vref
    n=0
    for file in sorted(set(meta['files'].values())-{'daily/national.json'}):
        for id_,pairs in read(file).items():
            if not pairs:continue
            ix,v=zip(*pairs);series=pd.Series(v,index=dates[list(ix)])
            for month,total in series.resample('MS').sum().items():
                assert np.isclose(total,expected[id_,month],rtol=0,atol=.004)
                n+=1
    assert n>10000

def test_sector_cells_do_not_cross_display_boundaries():
    sectors=read('sectors.json')['members'];cells={c['id']:c for c in read('control.json')['cells']}
    for name in ['areas','regions']:
        for f in read(name+'.json')['features']:
            key=f['properties'].get('id') or 'region|'+f['properties']['name']
            g=shapely.make_valid(shape(f['geometry']))
            for id_ in sectors[key]:
                c=cells[id_]
                assert g.covers(box(c['lon']-.125,c['lat']-.125,c['lon']+.125,c['lat']+.125))
