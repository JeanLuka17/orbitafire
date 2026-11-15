// Compact territorial card ("Territorial context"). Presentation only: every number comes from the
// observatory records already exported by the Python pipeline for the selected unit and period.
// Developed by the OrbitaFire team with AI assistance (Claude, Anthropic). See README > "AI assistance".
const TerritoryCard = (() => {
  "use strict";
  let k;                                   // context from app.js: D, T, fmt, esc, inGeom, openHistory
  const $ = id => document.getElementById(id);
  const finite = v => typeof v === "number" && Number.isFinite(v);
  const stateOf = r => !r || !r.complete || !finite(r.value) || !finite(r.z) ? "insufficient" : r.z >= 3.5 ? "exceptional" : r.z >= 2 ? "unusual" : "normal";
  const memo = new Map();                  // geometry lookups are cached per unit

  function init(context) { k = context; }

  function departments(loc) {
    if (memo.has("dep|" + loc.id)) return memo.get("dep|" + loc.id);
    const { D, inGeom } = k; let out = [];
    if (loc.kind === "region") out = [loc.name];
    else if (loc.kind === "cell") { const f = D.regions.features.find(f => inGeom(loc.lon, loc.lat, f.geometry)); out = f ? [f.properties.name] : []; }
    else if (loc.kind === "area" || loc.kind === "buffer") {
      const rk = D.ranking.find(r => r.code === loc.code);
      if (rk?.regions) out = rk.regions.split(/,| y | and /).map(s => s.trim()).filter(Boolean);
      else {                               // sample the boundary vertices; keep departments holding >=10% of them
        const f = D.areaById[loc.id], pts = []; const walk = c => typeof c[0] === "number" ? pts.push(c) : c.forEach(walk);
        if (f) walk(f.geometry.coordinates);
        const step = Math.max(1, Math.floor(pts.length / 200)), hits = new Map(); let n = 0;
        for (let i = 0; i < pts.length; i += step) { n++; const r = D.regions.features.find(g => inGeom(pts[i][0], pts[i][1], g.geometry)); if (r) hits.set(r.properties.name, (hits.get(r.properties.name) || 0) + 1); }
        out = [...hits].filter(([, v]) => v / n >= 0.1).sort((a, b) => b[1] - a[1]).map(([name]) => name);
      }
    }
    memo.set("dep|" + loc.id, out); return out;
  }

  function communities(loc) {
    if (memo.has("com|" + loc.id)) return memo.get("com|" + loc.id);
    const { D, inGeom } = k; let list = [];
    if (loc.kind === "cell") { const c = D.cellIdx[`${loc.lat.toFixed(3)}_${loc.lon.toFixed(3)}`]; list = c ? c.c.map(i => D.comm[i]) : []; }
    else if (loc.kind === "area" || loc.kind === "buffer") {
      const feats = [D.areaById[loc.id]].filter(Boolean);
      list = D.comm.filter(p => feats.some(f => p[1] >= f.bb[0] && p[1] <= f.bb[2] && p[0] >= f.bb[1] && p[0] <= f.bb[3] && inGeom(p[1], p[0], f.geometry)));
    }
    const seen = new Set(); list = list.filter(c => { const key = c[2] + "|" + c[3]; if (seen.has(key)) return false; seen.add(key); return true; });
    memo.set("com|" + loc.id, list); return list;
  }

  function overlap(loc) {                  // protected area a cell's centre falls in (relation only, counts are never combined)
    const { D, inGeom } = k;
    return D.areas.features.find(f => f.properties.kind === "area" && loc.lon >= f.bb[0] && loc.lon <= f.bb[2] && loc.lat >= f.bb[1] && loc.lat <= f.bb[3] && inGeom(loc.lon, loc.lat, f.geometry));
  }

  function render(loc, current, data) {
    const el = $("panel"); if (!el || !k) return;
    const t = k.T(), fmt = k.fmt, esc = k.esc, D = k.D;
    if (!loc || !current) { el.innerHTML = `<p class="empty">${esc(t.p_intro2)}</p>`; return; }
    const year = $("map-year")?.value, mo = +$("fc-month").value, time = `${year}-${String(mo).padStart(2, "0")}`, period = `${t.tc_months[mo - 1]} ${year}`;
    const rec = id => data[id]?.records.find(r => r.time === time);
    const r = current.records.find(x => x.time === time), state = stateOf(r);
    const area = loc.code ? D.areaById[`${loc.code}|area`] : null, cat = area?.properties.cat || "";
    const deps = departments(loc);
    const title = loc.kind === "country" ? t.fc_peru : loc.kind === "area" ? `${cat} ${loc.name}`.trim() : loc.kind === "buffer" ? `${cat} ${loc.name}`.trim() : loc.kind === "cell" ? t.tc_cell_title : loc.name;
    const kind = { area: cat || t.leg_area, buffer: t.tc_buffer, cell: t.tc_cell, region: t.tc_region, country: t.tc_country }[loc.kind];
    const insideWord = /^Reserva/.test(cat) ? t.tc_inside_reserve : t.tc_inside_area;
    const value = x => !x || !finite(x.value) ? `<span class="tc-nodata">${esc(t.tc_nodata)}</span>` : `${fmt(x.value)} <small>${esc(t.tc_hotspots(x.value))}</small>`;
    const tag = x => { const s = stateOf(x); return `<span class="tc-tag ${s}">${esc(t["nx_" + s])}</span>`; };
    const pin = '<svg class="tc-pin" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>';
    const unit = (name, desc, x, on) => {
      const s = stateOf(x), n = x && finite(x.value) ? x.value : null;
      return `<section class="tc-unit${on ? " on" : ""}"><div class="tc-head">${pin}<div><b>${esc(name)}</b><p>${esc(desc)}</p></div></div>`
        + `<div class="tc-row"><span>${esc(periodLong)}</span><span class="tc-tag ${s}">${esc(t["tc_badge_" + s])}</span></div>`
        + `<div class="tc-big">${n == null ? `<span class="tc-nodata">${esc(t.tc_nodata)}</span>` : `${fmt(n)} <small>${esc(t.tc_hotspots(n))}</small>`}</div>`
        + (n == null ? "" : `<p class="tc-text">${esc(t.tc_reading({ state: s, month: t.tc_months[mo - 1], median: x && finite(x.median) ? fmt(x.median) : null, medianN: x?.median, incomplete: x && !x.complete, estimated: x?.source < 2 }))}</p>`)
        + `</section>`;
    };
    const periodLong = t.tc_period(t.tc_months[mo - 1], year);
    let h = `<div class="tc"><h3>${esc(title)}</h3><div class="tc-sub">${esc([deps.join(", "), loc.kind === "buffer" ? cat : kind].filter(Boolean).join(" · "))}</div>`;
    if (loc.kind === "area" || loc.kind === "buffer") {
      const inside = loc.kind === "area" ? r : rec(`${loc.code}|area`), ring = loc.kind === "buffer" ? r : rec(`${loc.code}|buffer`);
      const blocks = [[insideWord, /^Reserva/.test(cat) ? t.tc_desc_reserve : t.tc_desc_area, inside, loc.kind === "area"]];
      if (data[`${loc.code}|buffer`]) blocks.push([t.tc_buffer, t.tc_desc_buffer, ring, loc.kind === "buffer"]);
      if (loc.kind === "buffer") blocks.reverse();
      h += blocks.map(b => unit(...b)).join("");
    } else {
      h += unit(loc.kind === "cell" ? t.tc_cell_title : loc.kind === "region" ? loc.name : t.fc_peru, loc.kind === "cell" ? t.tc_desc_cell : loc.kind === "region" ? t.tc_desc_region : t.tc_desc_country, r, true);
      if (loc.kind === "cell") { const a = overlap(loc); if (a) h += `<p class="tc-note">${esc(t.tc_overlap(`${a.properties.cat} ${a.properties.name}`))}</p>`; }
    }
    h += `<p class="tc-foot"><span aria-hidden="true">ⓘ</span> ${esc(t.tc_hotspot_def)}</p>`;
    // territory information, collapsed
    const info = [];
    if (loc.km2 != null && (loc.kind === "area" || loc.kind === "buffer")) info.push([t.tc_surface, `${fmt(loc.km2)} km²`]);
    if (deps.length) info.push([deps.length > 1 ? t.tc_departments : t.tc_department, deps.join(", ")]);
    if (loc.kind === "region" && loc.cells) info.push([t.tc_cells, fmt(loc.cells)]);
    if (loc.kind === "cell") info.push([t.tc_coords, `${loc.lat.toFixed(3)}°, ${loc.lon.toFixed(3)}° (± 0.125°)`]);
    const com = communities(loc);
    if (loc.kind === "area" || loc.kind === "buffer" || loc.kind === "cell") info.push([t.tc_communities, com.length ? `${fmt(com.length)}: ${com.slice(0, 10).map(c => c[2]).join(", ")}${com.length > 10 ? ` (+${com.length - 10})` : ""}` : t.p_none]);
    const peoples = [...new Set([...(area?.properties.peoples || "").split(";"), ...com.map(c => c[3] || "")].map(s => s.trim()).filter(Boolean))];
    if (peoples.length) info.push([t.tc_peoples, peoples.slice(0, 10).join(", ")]);
    info.push([t.tc_source, loc.kind === "cell" ? t.tc_src_cell : loc.kind === "region" || loc.kind === "country" ? t.tc_src_region : t.tc_src_area]);
    h += `<details class="tc-info"><summary>${esc(t.tc_info)}</summary><dl>${info.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("")}</dl>`
      + `${com.length || peoples.length ? `<p class="tc-note">${esc(t.tc_relation_note)}</p>` : ""}</details></div>`;
    el.innerHTML = h;
  }
  return { init, render };
})();
