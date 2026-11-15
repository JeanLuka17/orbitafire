"""Repack existing observatory outputs for map exploration. No model fitting."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
out = ROOT / 'docs/data'
manifest = json.loads((out/'observatory.json').read_text(encoding='utf-8'))
fields = {name:i for i,name in enumerate(manifest['fields'])}
cells = []
for file in sorted({l['file'] for l in manifest['locations'] if l['kind']=='cell'}):
    bundle = json.loads((out/file).read_text(encoding='utf-8'))
    for id_, d in bundle.items():
        lat,lon = map(float,id_.split('|')[1].split('_'))
        cells.append({'id':id_,'lat':lat,'lon':lon,'season':[s[0] for s in d['seasonal']],
                      'v':[r[fields['value']] for r in d['rows']],
                      'o':[r[fields['observed']] if r[fields['complete']] else None for r in d['rows']],
                      'z':[r[fields['z']] for r in d['rows']]})
national=json.loads((out/'observatory/national.json').read_text(encoding='utf-8'))['peru']
activity_max=max(r[0] for r in national['rows'] if r[0] is not None)
payload={'activity_max':activity_max,'months':d['months'],'cells':cells,'data_through':manifest['data_through']}
(out/'control.json').write_text(json.dumps(payload,separators=(',',':'),ensure_ascii=False),encoding='utf-8')
print(f'{len(cells)} cells, {len(d["months"])} monthly values; no fabricated daily records')
