// OrbitaFire website logic.
// Developed by the OrbitaFire team with AI assistance (Claude, Anthropic). See README > "AI assistance".
(() => {
  "use strict";
  let LANG = "en";
  const T = () => I18N[LANG];
  const D = {};                       // loaded data
  const S = { mode: "anom", sel: null };
  const fmt = v => v == null ? "–" : Math.round(v).toLocaleString(LANG === "es" ? "es-PE" : "en-US");
  const fx = v => v == null ? "–" : `${(+v).toFixed(v >= 10 ? 0 : 1)}×`;
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const $ = id => document.getElementById(id);

  // ---------- categories / colors ----------
  const CAT_COLOR = { "very low": "#5598e7", normal: "#0ca30c", high: "#fab219", "very high": "#ec835a", extreme: "#d03b3b", "n/a": "#c3c2b7" };
  const catFromZ = z => z == null || isNaN(z) ? "n/a" : z < -1.5 ? "very low" : z < 1 ? "normal" : z < 2 ? "high" : z < 3.5 ? "very high" : "extreme";
  const badge = cat => `<span class="badge"><i style="background:${CAT_COLOR[cat]}"></i>${esc(T().cat[cat])}</span>`;
  const DIV = ["#184f95", "#3987e5", "#86b6ef", "#f0efec", "#f3b499", "#ec835a", "#b8322f"];
  const SEQ = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"];
  const lerpHex = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b);
    return "#" + A.map((x, i) => Math.round(x + (B[i] - x) * t).toString(16).padStart(2, "0")).join(""); };
  const ramp = (cols, t) => { t = Math.max(0, Math.min(1, t)); const x = t * (cols.length - 1), i = Math.min(cols.length - 2, Math.floor(x)); return lerpHex(cols[i], cols[i + 1], x - i); };
  const colorAnom = r => r == null ? null : ramp(DIV, (Math.max(-3, Math.min(3, Math.log2(r))) + 3) / 6);
  const colorDens = v => v < 1 ? null : ramp(SEQ, Math.log10(v) / Math.log10(3000));

  // ---------- tooltip ----------
  const tip = $("tip");
  const showTip = (html, ev) => { tip.innerHTML = html; tip.hidden = false; moveTip(ev); };
  const moveTip = ev => { const w = tip.offsetWidth; let x = ev.clientX + 14; if (x + w > innerWidth - 8) x = ev.clientX - w - 14; tip.style.left = x + "px"; tip.style.top = (ev.clientY + 14) + "px"; };
  const hideTip = () => { tip.hidden = true; };

  // ---------- tiny SVG chart helpers ----------
  const NS = "http://www.w3.org/2000/svg";
  function svg(el, W, H) { el.innerHTML = ""; const s = document.createElementNS(NS, "svg"); s.setAttribute("viewBox", `0 0 ${W} ${H}`); el.appendChild(s); return s; }
  function add(p, tag, attrs, text) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; p.appendChild(e); return e; }
  const niceMax = v => { if (v <= 0) return 1; const p = 10 ** Math.floor(Math.log10(v)); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; };
  const kfmt = v => v >= 1000 ? `${+(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : `${+v.toFixed(v < 10 && v % 1 ? 1 : 0)}`;
  function yAxis(s, x0, x1, y, max, ticks = 4, f = kfmt) {
    for (let i = 0; i <= ticks; i++) { const v = max * i / ticks, yy = y(v);
      add(s, "line", { x1: x0, x2: x1, y1: yy, y2: yy, stroke: i ? "#e1e0d9" : "#c3c2b7", "stroke-width": i ? .6 : 1 });
      add(s, "text", { x: x0 - 6, y: yy + 3.5, "text-anchor": "end" }, f(v)); }
  }

  // bars: items [{label, value, muted, tip}]
  function bars(el, items, { H = 150, W = 340, color = "#2a78d6", every = 1, refLine = null, ticks = 3, f = kfmt } = {}) {
    const L = 34, R = 6, Tp = 8, B = 20, s = svg(el, W, H);
    const max = niceMax(Math.max(1, ...items.map(d => d.value), refLine || 0)), n = items.length;
    const bw = (W - L - R) / n, y = v => H - B - (H - B - Tp) * v / max;
    yAxis(s, L, W - R, y, max, ticks, f);
    items.forEach((d, i) => {
      const x = L + i * bw, h = Math.max(0, y(0) - y(d.value));
      const r = add(s, "rect", { x: x + bw * .12, y: y(0) - h, width: bw * .76, height: h, rx: Math.min(2, bw * .3), fill: d.muted ? "#9ec5f4" : color });
      const hit = add(s, "rect", { x, y: Tp, width: bw, height: H - B - Tp, fill: "transparent" });
      hit.addEventListener("mousemove", ev => { r.setAttribute("opacity", .8); showTip(d.tip || `${d.label}: <b>${fmt(d.value)}</b>`, ev); });
      hit.addEventListener("mouseleave", () => { r.removeAttribute("opacity"); hideTip(); });
      if (i % every === 0) add(s, "text", { x: x + bw / 2, y: H - 6, "text-anchor": "middle" }, d.short ?? d.label);
    });
    if (refLine != null) { add(s, "line", { x1: L, x2: W - R, y1: y(refLine), y2: y(refLine), stroke: "#52514e", "stroke-dasharray": "3 3", "stroke-width": 1 }); }
  }

  function chartYears() {
    const el = $("chart-years"), t = T(), ys = D.peru.yearly.filter(d => d.full);
    const W = 520, H = 260, L = 40, R = 92, Tp = 14, B = 24, s = svg(el, W, H);
    const x0 = ys[0].y, x1 = ys[ys.length - 1].y, x = v => L + (W - L - R) * (v - x0) / (x1 - x0);
    const max = niceMax(Math.max(...ys.map(d => d.hi))), y = v => H - B - (H - B - Tp) * v / max;
    yAxis(s, L, W - R, y, max, 4);
    const mod = ys.filter(d => d.src.includes("model"));
    add(s, "path", { d: "M" + mod.map(d => `${x(d.y)},${y(d.hi)}`).join("L") + "L" + mod.slice().reverse().map(d => `${x(d.y)},${y(d.lo)}`).join("L") + "Z", fill: "#2a78d6", opacity: .15 });
    const split = x(2011.5);
    add(s, "line", { x1: split, x2: split, y1: Tp, y2: H - B, stroke: "#c3c2b7", "stroke-dasharray": "4 3" });
    add(s, "text", { x: split - 5, y: Tp + 8, "text-anchor": "end" }, `← ${t.ch_reco}`);
    add(s, "text", { x: split + 5, y: Tp + 8 }, `${t.ch_obs} →`);
    const line = (k, c) => add(s, "path", { d: "M" + ys.map(d => `${x(d.y)},${y(d[k])}`).join("L"), fill: "none", stroke: c, "stroke-width": 2, "stroke-linejoin": "round" });
    line("h", "#2a78d6"); line("m", "#eb6834");
    const last = ys[ys.length - 1];
    add(s, "text", { x: x(last.y) + 6, y: y(last.h) + 4, class: "lbl" }, t.ch_harm.split(" (")[0]);
    add(s, "text", { x: x(last.y) + 6, y: y(last.m) + 4, class: "lbl" }, "MODIS");
    [2005, 2010, 2015, 2020, 2025].forEach(v => add(s, "text", { x: x(v), y: H - 6, "text-anchor": "middle" }, v));
    const cross = add(s, "line", { y1: Tp, y2: H - B, stroke: "#52514e", "stroke-width": 1, opacity: 0 });
    const ov = add(s, "rect", { x: L, y: Tp, width: W - L - R, height: H - B - Tp, fill: "transparent" });
    ov.addEventListener("mousemove", ev => {
      const r = s.getBoundingClientRect(), px = (ev.clientX - r.left) * W / r.width;
      const yr = Math.round(x0 + (px - L) / (W - L - R) * (x1 - x0)), d = ys.find(e => e.y === yr); if (!d) return;
      cross.setAttribute("x1", x(yr)); cross.setAttribute("x2", x(yr)); cross.setAttribute("opacity", .5);
      const band = d.src.includes("model") ? `<br>${t.ch_band}: ${fmt(d.lo)}–${fmt(d.hi)}` : "";
      showTip(`<b>${yr}</b><br>${t.ch_harm}: <b>${fmt(d.h)}</b>${band}<br>${t.ch_modis}: ${fmt(d.m)}`, ev);
    });
    ov.addEventListener("mouseleave", () => { cross.setAttribute("opacity", 0); hideTip(); });
  }

  function chartRatio() {
    const el = $("chart-ratio"), t = T();
    const ms = D.peru.monthly.filter(d => d.src === "viirs_snpp" && d.m >= 30 && d.v > 0);
    const W = 520, H = 260, L = 40, R = 12, Tp = 14, B = 34, s = svg(el, W, H);
    const lx0 = Math.log10(20), lx1 = Math.log10(20000), x = v => L + (W - L - R) * (Math.log10(v) - lx0) / (lx1 - lx0);
    const max = 14, y = v => H - B - (H - B - Tp) * v / max;
    yAxis(s, L, W - R, y, max, 7, v => v.toFixed(0));
    [100, 1000, 10000].forEach(v => add(s, "text", { x: x(v), y: H - 18, "text-anchor": "middle" }, kfmt(v)));
    add(s, "text", { x: (L + W - R) / 2, y: H - 3, "text-anchor": "middle" }, t.ch_ratio_x);
    const k = ms.reduce((a, d) => a + d.v, 0) / ms.reduce((a, d) => a + d.m, 0);
    add(s, "line", { x1: L, x2: W - R, y1: y(k), y2: y(k), stroke: "#eb6834", "stroke-width": 2 });
    add(s, "text", { x: W - R, y: y(k) - 6, "text-anchor": "end", class: "lbl" }, `${t.ch_const} = ${k.toFixed(1)}`);
    ms.forEach(d => { const c = add(s, "circle", { cx: x(d.m), cy: y(Math.min(max, d.v / d.m)), r: 3.6, fill: "#2a78d6", "fill-opacity": .7, stroke: "#fcfcfb", "stroke-width": .8 });
      c.addEventListener("mousemove", ev => showTip(`<b>${d.t}</b><br>MODIS ${fmt(d.m)} · VIIRS ${fmt(d.v)}<br>${t.ch_ratio_y} = <b>${(d.v / d.m).toFixed(1)}</b>`, ev));
      c.addEventListener("mouseleave", hideTip); });
  }

  function chartCV() {
    const el = $("chart-cv"), t = T(), rows = D.peru.cv_years;
    const years = [...new Set(rows.map(r => r.y))], get = (y, m) => rows.find(r => r.y === y && r.model === m).err;
    const W = 520, H = 250, L = 40, R = 8, Tp = 26, B = 22, s = svg(el, W, H);
    const lim = 35, y = v => Tp + (H - B - Tp) * (lim - v) / (2 * lim), bw = (W - L - R) / years.length;
    [-30, -15, 0, 15, 30].forEach(v => { add(s, "line", { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: v ? "#e1e0d9" : "#c3c2b7", "stroke-width": v ? .6 : 1 }); add(s, "text", { x: L - 6, y: y(v) + 3.5, "text-anchor": "end" }, `${v}%`); });
    years.forEach((yr, i) => {
      [["ratio_global", "#eb6834", 0], ["poisson_glm", "#2a78d6", 1]].forEach(([m, c, j]) => {
        const v = get(yr, m), x = L + i * bw + bw * (.1 + j * .41), h = Math.abs(y(v) - y(0));
        const r = add(s, "rect", { x, y: v >= 0 ? y(v) : y(0), width: bw * .38, height: h, fill: c, rx: 1.5 });
        r.addEventListener("mousemove", ev => showTip(`<b>${yr}</b> · ${m === "poisson_glm" ? t.ch_ours : t.ch_const}<br>${v > 0 ? "+" : ""}${v}% ${t.ch_err}`, ev));
        r.addEventListener("mouseleave", hideTip);
      });
      if (i % 2 === 0) add(s, "text", { x: L + i * bw + bw / 2, y: H - 6, "text-anchor": "middle" }, yr);
    });
    const cv = D.peru.cv;
    add(s, "rect", { x: L + 4, y: 4, width: 10, height: 10, fill: "#eb6834", rx: 2 }); add(s, "text", { x: L + 18, y: 13 }, `${t.ch_const} (${t.worst} ${cv.ratio_global.worst_year_pct}%)`);
    add(s, "rect", { x: L + 250, y: 4, width: 10, height: 10, fill: "#2a78d6", rx: 2 }); add(s, "text", { x: L + 264, y: 13 }, `${t.ch_ours} (${t.worst} ${cv.poisson_glm.worst_year_pct}%)`);
  }

  function chartCal() {
    const t = T();
    bars($("chart-cal"), D.peru.calendar.map(c => ({ label: t.months[c.mo - 1], value: c.share * 100, muted: ![7, 8, 9, 10, 11].includes(c.mo),
      tip: `${t.months[c.mo - 1]}: <b>${(c.share * 100).toFixed(1)}%</b> (${(c.p10 * 100).toFixed(1)}–${(c.p90 * 100).toFixed(1)}%)` })), { H: 250, W: 520, ticks: 5, f: v => `${v}%` });
  }

  // ---------- status cards ----------
  function status() {
    const t = T(), st = D.status, mo = st.last_complete_month.split("-");
    const monName = `${t.months[+mo[1] - 1]} ${mo[0]}`;
    const amk = D.series["RC03|buffer"], base = [2012, 2013, 2014, 2015, 2016, 2017, 2018].map(y => amk.years[y] || 0);
    const baseMean = base.reduce((a, b) => a + b, 0) / base.length, amk24 = amk.years[2024];
    const amkF = D.areaById["RC03|buffer"].properties;
    const rec = D.peru.years_ranked[0];
    $("status-cards").innerHTML = [
      [t.s_last(monName), fmt(st.last_month.value), t.s_last_d(st.last_month.ratio.toFixed(2)), st.last_month.category],
      [t.s_ytd(st.year_to_date.year), fmt(st.year_to_date.value), t.s_ytd_d(st.year_to_date.ratio.toFixed(2), `${t.months[0]}–${t.months[+mo[1] - 1]}`), st.year_to_date.category],
      [`${t.s_rec} · ${rec.y}`, fmt(rec.h), t.s_rec_d(`${fmt(st.y2005)}; MODIS ${fmt(st.y2005_modis)}`), rec.cat],
      [`${t.s_amk} · 2024`, fmt(amk24), t.s_amk_d(amkF.r2024.toFixed(1), fmt(baseMean)), catFromZ(amkF.z2024)],
    ].map(([k, v, d, c]) => `<div class="card"><div class="k">${esc(k)}</div><div class="v">${v}</div><div class="d">${badge(c)} ${esc(d)}</div></div>`).join("");
    $("status-note").textContent = t.s_note(st.data_through);
  }

  // ---------- geometry ----------
  function inRing(x, y, ring) { let ins = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; }
  function inGeom(x, y, g) { const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
    return polys.some(p => inRing(x, y, p[0]) && !p.slice(1).some(h => inRing(x, y, h))); }
  function bbox(g) { let a = [180, 90, -180, -90]; const walk = c => typeof c[0] === "number" ? (a = [Math.min(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[2], c[0]), Math.max(a[3], c[1])]) : c.forEach(walk); walk(g.coordinates); return a; }

  // ---------- map ----------
  let map, cellLayer, areaLayer, bufLayer, commLayer, baseLayer, selMarker;
  function initMap() {
    map = L.map("leaflet", { preferCanvas: true, minZoom: 4, maxBounds: [[-22, -86], [3, -64]] }).setView([-9.3, -75.3], 5);
    baseLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 12, attribution: "© OpenStreetMap contributors", opacity: .55 }).addTo(map);
    const regLayer = L.geoJSON(D.regions, { style: { color: "#898781", weight: .8, fill: false }, interactive: false }).addTo(map);
    map.fitBounds(regLayer.getBounds(), { padding: [10, 10] });
    cellLayer = L.layerGroup().addTo(map);
    const res = D.cells.res;
    D.cells.cells.forEach(c => {
      c.dens = c.y.slice(D.cells.years.indexOf(2012), D.cells.years.indexOf(2025) + 1).reduce((a, b) => a + b, 0) / 14;
      c.rect = L.rectangle([[c.la - res / 2, c.lo - res / 2], [c.la + res / 2, c.lo + res / 2]], { stroke: false, fillOpacity: .78, interactive: false });
      cellLayer.addLayer(c.rect);
    });
    const style = kind => f => kind === "area" ? { color: "#006300", weight: 1.4, fillColor: "#008300", fillOpacity: .06 } : { color: "#006300", weight: 1, dashArray: "4 3", fill: false };
    areaLayer = L.geoJSON({ type: "FeatureCollection", features: D.areas.features.filter(f => f.properties.kind === "area") }, { style: style("area"), interactive: false }).addTo(map);
    bufLayer = L.geoJSON({ type: "FeatureCollection", features: D.areas.features.filter(f => f.properties.kind === "buffer") }, { style: style("buffer"), interactive: false }).addTo(map);
    commLayer = L.layerGroup(D.comm.map(c => L.circleMarker([c[0], c[1]], { radius: 2.6, color: "#fcfcfb", weight: .6, fillColor: "#6250d6", fillOpacity: .9, interactive: false })));
    map.on("click", e => select(e.latlng.lat, e.latlng.lng));
    $("lyr-areas").onchange = e => e.target.checked ? areaLayer.addTo(map) : map.removeLayer(areaLayer);
    $("lyr-buffers").onchange = e => e.target.checked ? bufLayer.addTo(map) : map.removeLayer(bufLayer);
    $("lyr-comm").onchange = e => e.target.checked ? commLayer.addTo(map) : map.removeLayer(commLayer);
    $("lyr-base").onchange = e => e.target.checked ? baseLayer.addTo(map) : map.removeLayer(baseLayer);
    document.querySelectorAll("#mode button").forEach(b => b.onclick = () => { S.mode = b.dataset.mode; document.querySelectorAll("#mode button").forEach(x => x.classList.toggle("on", x === b)); paintCells(); legend(); });
    paintCells();
  }
  function paintCells() {
    D.cells.cells.forEach(c => { const col = S.mode === "anom" ? ((c.dens >= 2 || (c.y[D.cells.years.indexOf(2024)] >= 10)) ? colorAnom(c.r) : null) : colorDens(c.dens);
      c.rect.setStyle(col ? { fillColor: col, fillOpacity: .78 } : { fillColor: "#e1e0d9", fillOpacity: .35 }); });
  }
  function legend() {
    const t = T(), g = S.mode === "anom" ? `linear-gradient(90deg, ${DIV.join(",")})` : `linear-gradient(90deg, ${SEQ.join(",")})`;
    const ends = S.mode === "anom" ? [`÷8 ${t.lower}`, t.typical, `×8 ${t.higher}`] : ["1", "50", "3,000"];
    $("legend").innerHTML = `<span class="ramp">${esc(S.mode === "anom" ? t.leg_anom : t.leg_dens)}: <small>${ends[0]}</small><b style="background:${g}"></b><small>${ends[2]}</small></span>
      <span><i class="sw" style="background:rgba(0,131,0,.12);border:1.4px solid #006300"></i>${t.leg_area}</span>
      <span><i class="sw" style="border:1px dashed #006300"></i>${t.leg_buffer}</span>
      <span><i class="sw" style="background:#6250d6;border-radius:50%;width:8px;height:8px"></i>${t.leg_comm}</span>`;
  }

  // ---------- selection panel ----------
  function select(lat, lon, prefer) {
    S.sel = { lat, lon, prefer };
    if (selMarker) map.removeLayer(selMarker);
    selMarker = L.circleMarker([lat, lon], { radius: 7, color: "#0b0b0b", weight: 2, fill: false, interactive: false }).addTo(map);
    renderPanel();
  }
  function renderPanel() {
    const t = T(), p = $("panel");
    if (!S.sel) { p.innerHTML = `<h3>${esc(t.p_intro)}</h3><p class="empty">${esc(t.p_intro2)}</p>`; return; }
    const { lat, lon, prefer } = S.sel, res = D.cells.res;
    const key = `${(Math.floor(lat / res) * res + res / 2).toFixed(3)}_${(Math.floor(lon / res) * res + res / 2).toFixed(3)}`;
    const cell = D.cellIdx[key];
    const units = D.areas.features.filter(f => { const b = f.bb; return lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3] && inGeom(lon, lat, f.geometry); });
    let unit = units.find(f => f.properties.kind === "area") || units[0];
    if (prefer) unit = D.areaById[prefer] || unit;
    const region = D.regions.features.find(f => inGeom(lon, lat, f.geometry));
    let h = "";
    const title = unit ? unit.properties.name : (region ? region.properties.name : `${lat.toFixed(2)}, ${lon.toFixed(2)}`);
    h += `<h3>${esc(unit ? `${unit.properties.cat} ${unit.properties.name}` : title)}</h3>`;
    h += `<div class="where">${lat.toFixed(3)}°, ${lon.toFixed(3)}°${region ? ` · ${t.p_region}: ${esc(region.properties.name)}` : ""}</div>`;
    if (unit) {
      const u = unit.properties, ser = D.series[u.id];
      h += `<div class="block"><b>${esc(u.kind === "area" ? t.p_in_area : t.p_in_buffer)}: ${esc(u.name)}</b> ${badge(catFromZ(u.z2024))}`;
      h += `<div class="kv"><span>${t.p_mean}</span><span>${fmt(u.mean)} ${t.hotspots}</span><span>${t.p_2024}</span><span>${fx(u.r2024)}</span>`
        + `<span>${t.p_trend}</span><span>${u.trend > 0 ? "+" : ""}${u.trend ?? "–"} ${t.pct_yr}</span><span>${t.p_peak}</span><span>${u.peak ? t.months[I18N.en.months.indexOf(u.peak)] : "–"}</span>`
        + `<span>${t.p_ytd}</span><span>${fx(u.ytd)}</span><span>${t.p_last}</span><span>${fx(u.last)}</span><span>${t.p_area}</span><span>${fmt(u.km2)} ${t.km2}</span></div>`;
      h += `<div class="small">${esc(t.p_unit_s)}</div><div id="pc-unit" class="chart"></div><div class="small">${t.p_partial}</div>`;
      if (u.peoples) h += `<div style="margin-top:8px"><span class="small">${t.p_peoples}: </span>${u.peoples.split(";").map(x => x.trim()).filter(Boolean).slice(0, 10).map(x => `<span class="tag">${esc(x)}</span>`).join("")}</div>`;
      h += `</div>`;
    } else h += `<div class="block"><span class="empty">${esc(t.p_outside)}</span></div>`;
    if (cell) {
      const cat = (cell.dens >= 2 || cell.y[D.cells.years.indexOf(2024)] >= 10) ? catFromZ(cell.z) : "n/a";
      h += `<div class="block"><b>${t.p_cell}</b><div class="kv"><span>${t.p_anom}</span><span>${cat === "n/a" ? "–" : fx(cell.r)} ${badge(cat)}</span><span>${t.p_mean} (2012–2025)</span><span>${fmt(cell.dens)}</span></div>`
        + `<div class="small">${t.p_cell_s}</div><div id="pc-cell" class="chart"></div>`;
      if (cat === "n/a") h += `<div class="small">${t.p_nodata}</div>`;
      const comm = cell.c.map(i => D.comm[i]);
      h += `</div><div class="block"><b>${t.p_comm}: ${comm.length}</b>`;
      h += comm.length ? `<ul class="small" style="margin:6px 0 0;padding-left:18px">${comm.slice(0, 12).map(c => `<li>${esc(c[2])} <span style="color:#898781">· ${esc(c[3])}</span></li>`).join("")}${comm.length > 12 ? `<li>+${comm.length - 12}</li>` : ""}</ul>` : `<div class="small">${t.p_none}</div>`;
      h += `</div>`;
    }
    p.innerHTML = h;
    if (unit) { const ser = D.series[unit.properties.id] || { years: {} };
      bars($("pc-unit"), Array.from({ length: 15 }, (_, i) => 2012 + i).map(y => ({ label: `${y}`, short: `'${String(y).slice(2)}`, value: ser.years[y] || 0, muted: y === 2026 })), { every: 2, H: 140, color: "#008300" }); }
    if (cell) bars($("pc-cell"), D.cells.years.map((y, i) => ({ label: `${y}`, short: `'${String(y).slice(2)}`, value: cell.y[i], muted: y < 2012 || y === 2026 })), { every: 5, H: 140 });
  }

  // ---------- ranking ----------
  function ranking() {
    const t = T(), rk = D.ranking, maxM = Math.max(...rk.map(r => r.mean || 0));
    const amk = D.series["RC03|buffer"], base = [2012, 2013, 2014, 2015, 2016, 2017, 2018].reduce((a, y) => a + (amk.years[y] || 0), 0) / 7;
    const sira = rk.find(r => r.code === "RC02");
    $("spotlight").innerHTML = `<div class="spot"><h3>${t.sp_amk_t}</h3><p>${esc(t.sp_amk(fmt(base), fmt(amk.years[2024]), D.areaById["RC03|buffer"].properties.r2024.toFixed(1)))}</p><div id="sp-amk" class="chart"></div></div>
      <div class="spot"><h3>${t.sp_sira_t}</h3><p>${esc(t.sp_sira(fmt(sira.mean), fmt(sira.ncomm)))}</p><div id="sp-sira" class="chart"></div></div>`;
    const yrs = Array.from({ length: 14 }, (_, i) => 2012 + i);
    const sum = code => y => (D.series[`${code}|area`]?.years[y] || 0) + (D.series[`${code}|buffer`]?.years[y] || 0);
    bars($("sp-amk"), yrs.map(y => ({ label: `${y}`, short: `'${String(y).slice(2)}`, value: amk.years[y] || 0 })), { every: 2, H: 130, color: "#eb6834", refLine: base });
    bars($("sp-sira"), yrs.map(y => ({ label: `${y}`, short: `'${String(y).slice(2)}`, value: sum("RC02")(y) })), { every: 2, H: 130 });
    $("rank").innerHTML = `<thead><tr><th>${t.t_name}</th><th class="l">${t.t_reg}</th><th>${t.t_mean}</th><th>${t.t_inside}</th><th>${t.t_buffer}</th><th>${t.t_2024}</th><th>${t.t_trend}</th><th>${t.t_comm}</th><th class="l">${t.t_peoples}</th></tr></thead><tbody>`
      + rk.map(r => `<tr data-code="${r.code}"><td><b>${esc(r.name)}</b></td><td class="l">${esc(r.regions)}</td><td><span class="bar-in" style="width:${Math.round(70 * (r.mean || 0) / maxM)}px"></span>${fmt(r.mean)}</td><td>${fmt(r.inside)}</td><td>${fmt(r.buffer)}</td>`
        + `<td>${r.mean >= 5 ? fx(r.r2024) + (r.rank2024 === 1 ? " ★" : "") : "–"}</td><td>${r.mean >= 5 ? `${r.trend > 0 ? "+" : ""}${r.trend}%` : "–"}</td><td>${fmt(r.ncomm)}</td><td class="l small">${esc((r.peoples || "").split(";").slice(0, 3).join(", "))}</td></tr>`).join("") + "</tbody>";
    document.querySelectorAll("#rank tbody tr").forEach(tr => tr.onclick = () => {
      const f = D.areaById[`${tr.dataset.code}|area`]; if (!f) return;
      const b = f.bb, buf = D.areaById[`${tr.dataset.code}|buffer`]?.bb || b;
      map.fitBounds([[Math.min(b[1], buf[1]), Math.min(b[0], buf[0])], [Math.max(b[3], buf[3]), Math.max(b[2], buf[2])]], { padding: [20, 20] });
      const c = L.geoJSON(f).getBounds().getCenter();
      select(c.lat, c.lng, tr.dataset.code === "RC03" ? "RC03|buffer" : `${tr.dataset.code}|area`);
      document.getElementById("map").scrollIntoView({ behavior: "smooth" });
    });
  }

  // ---------- i18n ----------
  function applyLang() {
    document.documentElement.lang = LANG;
    $("lang").textContent = LANG === "en" ? "ES" : "EN";
    document.querySelectorAll("[data-i18n]").forEach(e => { const v = T()[e.dataset.i18n]; if (typeof v === "string") e.textContent = v; });
    document.querySelectorAll("[data-i18n-html]").forEach(e => { const v = T()[e.dataset.i18nHtml]; if (typeof v === "string") e.innerHTML = v; });
    status(); legend(); renderPanel(); ranking(); chartYears(); chartRatio(); chartCV(); chartCal();
  }

  // ---------- boot ----------
  const files = { status: "status.json", peru: "peru.json", cells: "cells.json", areas: "areas.json", series: "areas_series.json", comm: "communities.json", regions: "regions.json", ranking: "ranking.json" };
  Promise.all(Object.entries(files).map(([k, f]) => fetch(`data/${f}`).then(r => r.json()).then(j => D[k] = j))).then(() => {
    D.areaById = {}; D.areas.features.forEach(f => { f.bb = bbox(f.geometry); D.areaById[f.properties.id] = f; });
    D.cellIdx = {}; D.cells.cells.forEach(c => D.cellIdx[`${c.la.toFixed(3)}_${c.lo.toFixed(3)}`] = c);
    try { const saved = localStorage.getItem("orbitafire-lang"); if (saved === "es" || saved === "en") LANG = saved; } catch (e) { /* storage unavailable */ }
    initMap(); applyLang();
    $("lang").onclick = () => { LANG = LANG === "en" ? "es" : "en"; try { localStorage.setItem("orbitafire-lang", LANG); } catch (e) { /* ignore */ } applyLang(); };
  }).catch(err => { $("panel").innerHTML = `<p>Could not load data (${esc(err.message)}). Serve this folder over http(s).</p>`; console.error(err); });
})();
