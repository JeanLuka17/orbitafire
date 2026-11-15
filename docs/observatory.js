// Monthly observatory. All statistical results are exported by Python from real pipeline data.
const Observatory = (() => {
  "use strict";
  let c, manifest, locations, data = {}, cache = new Map(), current, serial = 0;
  const $ = id => document.getElementById(id);
  const t = () => c.T();
  const fmt = v => c.fmt(v);
  const esc = v => c.esc(v);
  const finite = v => typeof v === "number" && Number.isFinite(v);
  const percent = v => finite(v) ? `${(v * 100).toFixed(1)}%` : "–";
  const ratio = v => finite(v) ? `${v.toFixed(2)}×` : "–";
  const source = r => t().ob_sources[r.source];
  const label = loc => loc.kind === "country" ? t().fc_peru : loc.kind === "area" || loc.kind === "buffer" ? `${loc.name} · ${t()[`ob_${loc.kind}`]}` : loc.kind === "cell" ? `${t().ob_cell} ${loc.name}` : loc.name;
  function option(select, value, text) { const o = document.createElement("option"); o.value = value; o.textContent = text; select.appendChild(o); }
  async function fetchJSON(file) {
    const r = await fetch(`data/${file}`);
    if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
    return r.json();
  }
  function decode(bundle) {
    for (const [id, d] of Object.entries(bundle)) {
      d.records = d.rows.map((row, i) => Object.fromEntries([["time", d.months[i]], ...manifest.fields.map((field, j) => [field, row[j]])]));
      data[id] = d;
    }
  }
  async function select(id, focus = false) {
    const loc = locations?.get(id);
    if (!loc) {
      if (!c) return;
      ++serial; current = null;
      ["fire-calendar-chart", "seasonal-chart", "anomaly-table", "calendar-detail", "observed-advisory", "territory-card", "seasonal-trend", "anomaly-context"].forEach(key => $(key).textContent = "");
      $("calendar-context").textContent = t().fc_empty;
      $("seasonal-note").textContent = t().ob_season_empty;
      return;
    }
    const request = ++serial;
    c.S.calendarLoc = id;
    current = null;
    ["fire-calendar-chart", "seasonal-chart", "calendar-detail", "seasonal-note", "observed-advisory", "anomaly-table", "territory-card"].forEach(key => $(key).textContent = "");
    const control = $("fc-location");
    if (![...control.options].some(o => o.value === id)) option(control, id, label(loc));
    control.value = id;
    $("calendar-context").textContent = `${label(loc)} · ${t().ob_loading}`;
    try {
      if (!data[id]) {
        if (!cache.has(loc.file)) cache.set(loc.file, fetchJSON(loc.file).then(decode).catch(err => {cache.delete(loc.file); throw err;}));
        await cache.get(loc.file);
      }
      if (request !== serial) return;
      current = data[id];
      const years = [...new Set(current.months.map(m => m.slice(0, 4)))];
      for (const name of ["fc-from", "fc-to"]) {
        $(name).innerHTML = ""; years.forEach(y => option($(name), y, y));
      }
      $("fc-to").value = years.at(-1);
      c.S.compareYears=null;
      let picker=document.getElementById('year-picker');if(!picker){picker=document.createElement('details');picker.id='year-picker';document.getElementById('fire-calendar').append(picker);}
      picker.innerHTML='<summary>'+t().ux_years+'</summary>';
      years.forEach(y=>{const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=true;input.value=y;input.onchange=()=>{c.S.compareYears=new Set([...picker.querySelectorAll('input:checked')].map(e=>e.value));render();};label.append(input,document.createTextNode(y));picker.append(label);});
      document.querySelector('#fire-calendar .calendar-controls').after(picker);
      c.S.detailTime = null;
      render();
      if (focus) c.focus(loc);
    } catch (err) { $("calendar-context").textContent = `${label(loc)} · ${t().fc_empty} (${err.message})`; console.error(err); }
  }
  async function init(context) {
    c = context;
    manifest = await fetchJSON("observatory.json"); locations = new Map(manifest.locations.map(l => [l.id, l]));
    const control = $("fc-location"); control.innerHTML = "";
    manifest.locations.filter(l => l.kind !== "cell").forEach(l => option(control, l.id, label(l)));
    for (let m = 1; m <= 12; m++) option($("fc-month"), m, t().months[m-1]);
    $("fc-month").value = "9";
    $("fc-location").onchange = () => {if(control.value==='peru')c.S.countryOpened=true;select(control.value, true);};
    ["fc-month", "fc-view", "fc-mode", "fc-from", "fc-to"].forEach(id => $(id).onchange = () => {
      if (+$("fc-from").value > +$("fc-to").value) $("fc-to").value = $("fc-from").value;
      c.S.detailTime = null; render();
    });
    $("priority-sort").onchange = priority;
    decode(await fetchJSON("observatory/territories.json"));
    Experience.init({locations:manifest.locations,D:c.D,S:c.S,select,fmt}, await fetchJSON("control.json"));
    await select("peru");
    document.getElementById("context-sheet").hidden=true;document.getElementById("workspace").classList.remove("has-selection");
  }
  function records() {
    const from = +$("fc-from").value, to = +$("fc-to").value;
    return current.records.filter(r => +r.time.slice(0, 4) >= from && +r.time.slice(0, 4) <= to && (!c.S.compareYears || c.S.compareYears.has(r.time.slice(0,4))));
  }
  function detail(r) {
    if (!r || !finite(r.value)) return `${r?.time ?? ""} · ${t().ob_missing}`;
    return `${r.time} · ${fmt(r.value)} ${t().hotspots} · ${source(r)} · ${r.complete ? t().ob_complete : t().ob_partial}` +
      ` · ${t().fc_median}: ${fmt(r.median)} · P10–P90: ${fmt(r.p10)}–${fmt(r.p90)} · ${t().ob_ratio}: ${ratio(r.ratio)}` +
      ` · z: ${finite(r.z) ? r.z.toFixed(2) : "–"} · ${r.lo95 == null ? t().ob_no_band : `${t().ch_band}: ${fmt(r.lo95)}–${fmt(r.hi95)}`}`;
  }
  function showDetail(r) { c.S.detailTime = r.time; $("calendar-detail").textContent = detail(r); }
  function attach(target, r) {
    target.dataset.time=r.time; target.setAttribute("tabindex", "0"); target.setAttribute("role", "button"); target.setAttribute("aria-label", detail(r));
    target.addEventListener("mousemove", e => c.showTip(esc(detail(r)), e));
    target.addEventListener("mouseleave", c.hideTip);
    target.addEventListener("click", () => {showDetail(r);Experience.inspectPeriod(r);});
    target.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") {e.preventDefault(); showDetail(r);Experience.inspectPeriod(r);} });
    target.addEventListener("focus", () => showDetail(r));
  }
  function render() {
    if (!current) return;
    c.S.analysisPeriod = {from:+$("fc-from").value,to:+$("fc-to").value,month:+$("fc-month").value};
    for (const o of $("fc-location").options) { const loc = locations.get(o.value); if (loc) o.textContent = label(loc); }
    [...$("fc-month").options].forEach((o, i) => o.textContent = t().months[i]);
    const sort = $("priority-sort").value || "z";
    $("priority-sort").innerHTML = "";
    ["z", "recent", "mean", "trend", "frequency", "density"].forEach(k => option($("priority-sort"), k, t()[`ob_sort_${k}`]));
    $("priority-sort").value = sort;
    const loc = locations.get(c.S.calendarLoc);
    $("calendar-context").textContent = `${label(loc)} · ${manifest.data_through} · ${loc.kind === "region" ? t().ob_spatial : t().ob_baseline}`;
    const all = records(), mo = +$("fc-month").value;
    const rows = all.filter(r => +r.time.slice(5) === mo);
    const view = $("fc-view").value, W = 900, H = view === "bars" ? 290 : Math.max(260, 23 * (1 + +$("fc-to").value - +$("fc-from").value));
    const L = 60, R = 20, top = 32, bottom = 34;
    const s = c.svg($("fire-calendar-chart"), W, H);
    s.setAttribute("aria-label", `${t().fc_h}: ${label(loc)}, ${t().months[mo-1]}`);
    const missing = c.add(s, "defs", {});
    const pattern = c.add(missing, "pattern", {id:"incomplete", width:6, height:6, patternUnits:"userSpaceOnUse"});
    c.add(pattern,"rect",{width:6,height:6,fill:"#dce7f4"}); c.add(pattern,"path",{d:"M0 6L6 0",stroke:"#6a7990"});
    const vals = rows.filter(r => r.complete && finite(r.value)).map(r => r.value).sort((a,b) => a-b);
    const median = vals.length ? (vals[Math.floor((vals.length-1)/2)] + vals[Math.floor(vals.length/2)])/2 : null;
    if (view === "bars") {
      const max = c.niceMax(Math.max(1, ...rows.map(r => r.hi95 ?? r.value ?? 0), median ?? 0));
      const y = v => H-bottom-(H-bottom-top)*v/max, width = (W-L-R)/Math.max(1,rows.length);
      c.yAxis(s,L,W-R,y,max);
      c.add(s,"text",{x:L,y:16},t().ob_axis);
      rows.forEach((r,i) => {
        const x=L+i*width;
        if (finite(r.value)) {
          c.add(s,"rect",{x:x+width*.14,y:y(r.value),width:width*.72,height:Math.max(1,y(0)-y(r.value)),fill:!r.complete?"url(#incomplete)":r.source<2?"#90b9e8":"#2a78d6"});
          if (r.lo95 != null && r.hi95 != null) {
            c.add(s,"line",{x1:x+width/2,x2:x+width/2,y1:y(r.lo95),y2:y(r.hi95),stroke:"#52514e"});
            [r.lo95,r.hi95].forEach(v=>c.add(s,"line",{x1:x+width*.3,x2:x+width*.7,y1:y(v),y2:y(v),stroke:"#52514e"}));
          }
        } else {
          c.add(s,"rect",{x:x+width*.14,y:y(0)-5,width:width*.72,height:5,fill:"#c9c9c3"});
        }
        if(i%Math.ceil(rows.length/14)===0)c.add(s,"text",{x:x+width/2,y:H-12,"text-anchor":"middle"},r.time.slice(0,4));
        const hit=c.add(s,"rect",{x,y:top,width,height:H-bottom-top,fill:"transparent"}); attach(hit,r);
      });
      if (median != null) c.add(s,"line",{x1:L,x2:W-R,y1:y(median),y2:y(median),stroke:"#eb6834","stroke-dasharray":"5 4"});
      $("calendar-detail").textContent = `${t().fc_median}: ${fmt(median)} · ${t().ob_compare_note}`;
    } else {
      const index = new Map(all.map(r=>[r.time,r])), from=+$("fc-from").value, to=+$("fc-to").value;
      const shown=Array.from({length:to-from+1},(_,i)=>from+i).filter(y=>!c.S.compareYears||c.S.compareYears.has(String(y)));
      const cw=(W-L-R)/12, ch=(H-bottom-top)/Math.max(1,shown.length), max=Math.max(1,...all.map(r=>r.value??0));
      for(const [yi,year] of shown.entries()) {
        c.add(s,"text",{x:12,y:top+(yi+.7)*ch},year);
        for(let m=1;m<=12;m++) {
          const r=index.get(`${year}-${String(m).padStart(2,"0")}`), x=L+(m-1)*cw, y=top+yi*ch;
          let fill="#c9c9c3";
          if(r && finite(r.value)) fill=!r.complete?"url(#incomplete)":$("fc-mode").value==="anomaly" ? (finite(r.z)?c.ramp(c.DIV,(Math.max(-3.5,Math.min(3.5,r.z))+3.5)/7):"#c9c9c3") : window.OrbitaPalette.activity(r.value);
          const rect=c.add(s,"rect",{x:x+1,y:y+1,width:cw-2,height:ch-2,fill,rx:2});
          attach(rect,r ?? {time:`${year}-${String(m).padStart(2,"0")}`,value:null});
          if(r?.value===0)c.add(s,"circle",{cx:x+cw/2,cy:y+ch/2,r:2.5,fill:"white",stroke:"#52514e","pointer-events":"none"});
        }
      }
      t().months.forEach((m,i)=>c.add(s,"text",{x:L+(i+.5)*cw,y:20,"text-anchor":"middle"},m));
      $("calendar-detail").textContent=t().ob_heat_help;
    }
    if(c.S.detailTime) $("calendar-detail").textContent=detail(current.records.find(r=>r.time===c.S.detailTime));
    seasonal(); priority(); anomalies(all,mo); territory(loc); if(typeof TerritoryCard!=="undefined")TerritoryCard.render(loc,current,data);
    Experience.update(current,loc);
  }
  function seasonal() {
    const stats=current.seasonal, ranked=stats.map((s,i)=>({m:i,value:s[0]})).filter(x=>finite(x.value)).sort((a,b)=>b.value-a.value);
    const peaks=ranked.slice(0,2).filter(x=>x.value>0).map(x=>t().months[x.m]);
    $("seasonal-note").textContent=peaks.length?t().ob_advisory(peaks.join(", "),current.full_years.length):t().ob_season_empty;
    const observed = current.records.filter(r => r.complete && r.source >= 2 && finite(r.value) && r.time.slice(0,4) <= $("fc-to").value && +r.time.slice(5) === +$("fc-month").value).at(-1);
    $("observed-advisory").textContent = observed ? t().ob_observed(observed.time,fmt(observed.value),ratio(observed.ratio),observed.z >= 2) : t().ob_observed_empty;
    const W=900,H=210,L=55,R=15,top=22,bottom=30,s=c.svg($("seasonal-chart"),W,H);
    const max=c.niceMax(Math.max(1,...stats.map(r=>r[2]??r[0]??0))),y=v=>H-bottom-(H-top-bottom)*v/max,bw=(W-L-R)/12;
    c.yAxis(s,L,W-R,y,max);
    stats.forEach((r,i)=>{
      const x=L+(i+.5)*bw;
      if(finite(r[0]))c.add(s,"rect",{x:x-bw*.3,y:y(r[0]),width:bw*.6,height:Math.max(1,y(0)-y(r[0])),fill:"#2a78d6"});
      if(finite(r[1])&&finite(r[2]))c.add(s,"line",{x1:x,x2:x,y1:y(r[1]),y2:y(r[2]),stroke:"#52514e"});
      c.add(s,"text",{x,y:H-10,"text-anchor":"middle"},t().months[i]);
      const hit=c.add(s,"rect",{x:x-bw/2,y:top,width:bw,height:H-top-bottom,fill:"transparent"});
      hit.addEventListener("mousemove",e=>c.showTip(esc(`${t().months[i]} · ${t().fc_median}: ${fmt(r[0])} · P10–P90: ${fmt(r[1])}–${fmt(r[2])} · ${t().ob_frequency}: ${percent(r[3])}`),e));hit.addEventListener("mouseleave",c.hideTip);
    });
    const tr=current.trend;
    $("seasonal-trend").textContent=`${t().ob_statistics_note} ${tr ? t().ob_trend(tr.slope.toFixed(2),tr.low.toFixed(2),tr.high.toFixed(2),tr.start,tr.end,tr.evidence):t().ob_trend_empty}`;
  }
  function territory(loc) {
    const el=$("territory-card");
    if(!["area","buffer"].includes(loc.kind)){el.textContent=t().ob_select_territory;return;}
    const r=current.records.filter(r=>r.complete && +r.time.slice(5)===+$("fc-month").value && r.time.slice(0,4)<=$("fc-to").value).at(-1);
    const counterpart=data[`${loc.code}|${loc.kind==="area"?"buffer":"area"}`];
    const paired=counterpart?.records.find(q=>q.time===r?.time);
    const values = loc.kind === "area" ? [r?.value,paired?.value] : [paired?.value,r?.value];
    el.innerHTML=`<h3>${esc(label(loc))}</h3><p>${esc(r?detail(r):t().ob_missing)}</p><p>${esc(t().ob_pair(fmt(values[0]),fmt(values[1]),fmt(loc.communities)))}</p><p>${esc(t().ob_reason(ratio(r?.ratio),percent(current.season_frequency)))}</p>`;
  }
  function priority() {
    if(!current)return;
    const month=+$("fc-month").value,year=+$("map-year").value,sort=$("priority-sort").value;
    const candidates=manifest.locations.filter(l=>l.communal).map(loc=>{
      const d=data[loc.id],r=d.records.filter(r=>r.complete && finite(r.value)&&+r.time.slice(5)===month&&+r.time.slice(0,4)<=year).at(-1);
      return {loc,d,r,z:r?.z??null,recent:r?.value??null,mean:d.mean_year,trend:d.trend?.evidence?d.trend.slope:null,frequency:d.season_frequency,density:loc.km2>0&&d.mean_year!=null?d.mean_year*100/loc.km2:null};
    }).sort((a,b)=>(b[sort]??-Infinity)-(a[sort]??-Infinity)||a.loc.id.localeCompare(b.loc.id));
    Experience.priorities(candidates);
    $("priority-period").textContent=t().ob_priority_period(t().months[month-1],year);
    const headers=[t().t_name,t().ob_recent,t().fc_median,t().ob_sort_z,t().ob_sort_mean,t().ob_sort_trend,t().ob_sort_frequency,t().ob_sort_density];
    $("priority-table").innerHTML=`<thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${candidates.map(x=>`<tr><td><button class="territory-link" data-location="${esc(x.loc.id)}">${esc(label(x.loc))}</button></td><td>${fmt(x.recent)}<br><small>${x.r?.time??"–"}</small></td><td>${fmt(x.r?.median)}</td><td>${finite(x.z)?x.z.toFixed(2):"–"}</td><td>${fmt(x.mean)}</td><td>${finite(x.trend)?x.trend.toFixed(2):"–"}</td><td>${percent(x.frequency)}</td><td>${finite(x.density)?x.density.toFixed(2):"–"}</td></tr>`).join("")}</tbody>`;
    $("priority-table").querySelectorAll("button[data-location]").forEach(b=>b.onclick=()=>select(b.dataset.location,true));
  }
  function anomalies(all,month) {
    const rows=all.filter(r=>(+r.time.slice(5)===month || r.first || r.off_season || r.exceptional)&&finite(r.value)).slice().reverse().slice(0,40);
    $("anomaly-context").textContent=t().ob_anomaly_context;
    const headers=[t().ob_period,t().ob_activity,t().fc_median,t().ob_ratio,"z",t().ob_category,t().ob_intensity,t().ob_offseason,t().ob_first,t().ob_source];
    const category=r=>!finite(r.z)?"n/a":r.z < -1.5?"very low":r.z < 1?"normal":r.z < 2?"high":r.z < 3.5?"very high":"extreme";
    $("anomaly-table").innerHTML=`<thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr><td>${r.time}${r.complete?"":"*"}</td><td>${fmt(r.value)}</td><td>${fmt(r.median)}</td><td>${ratio(r.ratio)}</td><td>${finite(r.z)?r.z.toFixed(2):"–"}</td><td>${c.badge(category(r))}</td><td>${r.exceptional?t().ob_yes:"–"}</td><td>${r.off_season?t().ob_yes:"–"}</td><td>${r.first?t().ob_yes:"–"}</td><td>${esc(source(r))}${r.source<2?"*":""}</td></tr>`).join("")}</tbody>`;
  }
  function configureComparison(mode){
    $("fc-view").value='heat';$("fc-mode").value='value';
    if(mode==='history'){c.S.compareYears=null;$("fc-from").selectedIndex=0;$("fc-to").selectedIndex=$("fc-to").options.length-1;document.querySelectorAll('#year-picker input').forEach(e=>e.checked=true);}
    render();
  }
  function refreshCard(){const loc=locations?.get(c?.S.calendarLoc);if(loc&&current&&typeof TerritoryCard!=="undefined")TerritoryCard.render(loc,current,data);}
  return {init,select,render,configureComparison,refreshCard};
})();
