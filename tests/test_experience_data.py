"""Check that the interactive map's compact series exactly reuse the real exports."""
import json
from pathlib import Path

def test_control_maps_preserve_original_observatory_values():
    root = Path(__file__).resolve().parents[1] / "docs/data"
    m = json.loads((root / "observatory.json").read_text(encoding="utf-8"))
    control = json.loads((root / "control.json").read_text(encoding="utf-8"))
    cells = {c["id"]: c for c in control["cells"]}
    assert len(cells) == 1750
    national=json.loads((root / 'observatory/national.json').read_text(encoding='utf-8'))['peru']
    assert control['activity_max'] == max(r[0] for r in national['rows'] if r[0] is not None)
    for file in {l["file"] for l in m["locations"] if l["kind"] == "cell"}:
        shard = json.loads((root / file).read_text(encoding="utf-8"))
        for key,d in shard.items():
            assert control["months"] == d["months"]
            assert cells[key]["season"] == [s[0] for s in d["seasonal"]]
            assert cells[key]["v"] == [r[0] for r in d["rows"]]
            assert cells[key]["o"] == [r[1] if r[3] else None for r in d["rows"]]
            assert cells[key]["z"] == [r[9] for r in d["rows"]]
