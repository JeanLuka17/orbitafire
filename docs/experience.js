// Six-level hotspot scale for the 2D map. Breaks are fixed for every place and month so colors compare across Peru.
// They are log-spaced and follow the real distribution of non-zero monthly cell counts (2000–2026): about 58% of
// them are below 5, 87% below 20, 96% below 50 and 99% below 150 (computed from docs/data/control.json).
window.OrbitaLevels={breaks:[5,20,50,150],colors:['#E8EFE9','#F2DB89','#F4AB4C','#EB7138','#CA3039','#681A56'],missing:'#B9BDBA',
  keys:['lv_none','lv_low','lv_mod','lv_high','lv_vhigh','lv_ext'],
  level(v){if(v==null||!Number.isFinite(v))return -1;if(v<=0)return 0;const b=this.breaks;return v<b[0]?1:v<b[1]?2:v<b[2]?3:v<b[3]?4:5;},
  color(v){const i=this.level(v);return i<0?this.missing:this.colors[i];},
  ranges(){const b=this.breaks;return ['0','<'+b[0],b[0]+'–'+(b[1]-1),b[1]+'–'+(b[2]-1),b[2]+'–'+(b[3]-1),b[3]+'+'];}};
window.OrbitaPalette={colors:['#fff9f8','#f6d4ce','#ed9c8d','#d64e41','#831c23'],activity(v,max){if(v==null)return '#b7bab7';if(v===0)return '#ffffff';const k=Math.min(4,Math.log1p(v)/Math.log1p(max||this.max||100)*4),i=Math.min(3,Math.floor(k)),f=k-i;const a=this.colors[i],b=this.colors[i+1];return '#'+[1,3,5].map(j=>Math.round(parseInt(a.slice(j,j+2),16)*(1-f)+parseInt(b.slice(j,j+2),16)*f).toString(16).padStart(2,'0')).join('');}};
// Progressive disclosure shell; reuses the observatory and both existing maps.
const Experience = (()=>{
  const $=id=>document.getElementById(id);
  let ctx,selected,control,view='landing',language='en',frameReady=false,lastData,analysisMode=null,sectors,dailyMeta,dailyCache=new Map();
  const t=()=>I18N[document.documentElement.lang||language];
  const make=(tag,cls)=>{const e=document.createElement(tag);e.className=cls;return e;};
  const landing=make('section','welcome');landing.id='welcome';
  landing.innerHTML='<div class="welcome-hero"><div class="welcome-copy"><p class="eyebrow" data-i18n="lp_eyebrow"></p><h1>OrbitaFire</h1><p class="welcome-tagline" data-i18n="lp_tagline"></p><p class="welcome-lead" data-i18n="lp_lead"></p><button id="enter" class="enter" data-i18n="ux_enter"></button><p class="welcome-source">NASA MODIS + VIIRS · 2000–2026</p><small data-i18n="ux_photo"></small></div><span class="welcome-scroll" aria-hidden="true">⌄</span></div>'
    +'<div class="welcome-more"><h2 data-i18n="lp_users_h"></h2><p class="welcome-users" data-i18n="lp_users"></p><div class="welcome-benefits">'
    +[1,2,3].map(i=>`<div><h3 data-i18n="lp_b${i}_t"></h3><p data-i18n="lp_b${i}"></p></div>`).join('')+'</div></div>';
  document.body.prepend(landing);
  const brand=document.querySelector('.brand'),home=document.createElement('a');home.className='brand';home.href='#landing';home.innerHTML=brand.innerHTML;brand.replaceWith(home);home.onclick=e=>{e.preventDefault();show('landing');};
  const nav=document.querySelector('nav');nav.querySelectorAll('a').forEach(e=>e.remove());
  [['control','ux_control'],['history','ux_history'],['about','ux_about']].forEach(([id,key])=>{const b=make('button','view-tab');b.dataset.view=id;b.dataset.i18n=key;b.onclick=()=>show(id);nav.insertBefore(b,$('lang'));});
  const main=document.querySelector('main');
  const workspace=make('div','workspace');workspace.id='workspace';main.prepend(workspace);
  const mapSection=$('map');workspace.append(mapSection);
  const toolbar=make('div','explore-toolbar');toolbar.innerHTML='<label class="geo-search"><span data-i18n="ux_search"></span><input id="geo-search" list="geo-results" autocomplete="off"><datalist id="geo-results"></datalist></label><label><span data-i18n="fc_month"></span><span id="month-slot"></span></label><label><span data-i18n="ux_year"></span><select id="map-year"></select></label><label><span data-i18n="ux_layer"></span><select id="activity-layer"><option value="historical" data-i18n="ux_historical"></option><option value="observed" data-i18n="ux_observed"></option><option value="anomaly" data-i18n="ob_anomalies_h"></option></select></label>';
  mapSection.prepend(toolbar);$('month-slot').append($('fc-month'));document.querySelector('#fire-calendar [data-i18n=fc_month]').parentElement.remove();
  const layers=make('details','layer-options');layers.innerHTML='<summary data-i18n="ux_layers"></summary>';layers.append(document.querySelector('.map-controls'));toolbar.append(layers);
  const aside=make('aside','context-sheet');aside.id='context-sheet';aside.hidden=true;
  aside.innerHTML='<div class="sheet-toolbar"><button id="close-sheet" class="close-sheet" data-i18n="ux_close"></button></div><div id="selection-summary"></div>';
  workspace.append(aside);
  const actions=make('div','context-actions');actions.innerHTML='<button id="view-details" data-i18n="nx_details"></button>';aside.append(actions);
  const analysis=make('dialog','location-analysis analysis-dialog');analysis.id='location-analysis';analysis.hidden=true;analysis.innerHTML='<header class="analysis-heading"><div><span class="analysis-eyebrow">ORBITAFIRE</span><h2 id="analysis-title"></h2><p id="analysis-subtitle"></p></div></header><button id="collapse-analysis" data-i18n="nx_back"></button><p id="analysis-mode-note"></p><label><span data-i18n="nx_granularity"></span><select id="comparison-granularity"><option value="month" data-i18n="nx_month"></option><option value="day" data-i18n="nx_day"></option><option value="week" data-i18n="nx_week"></option></select></label><label id="day-picker"><span data-i18n="nx_reference_day"></span><input id="reference-day" type="number" min="1" max="31" value="10"></label><p id="daily-availability" class="note"></p><div id="daily-matrix" class="chart"></div>';
  document.body.append(analysis);analysis.append($('fire-calendar'));
  const closeBar=make('div','analysis-close-bar');closeBar.append($('collapse-analysis'));analysis.append(closeBar);
  const scopeLabel=document.createElement('label');scopeLabel.className='analysis-scope';scopeLabel.innerHTML='<span data-i18n="fc_view"></span><select id="analysis-scope"><option value="details" data-i18n="ui_compare_view"></option><option value="history" data-i18n="ui_full_history"></option></select>';analysis.querySelector('#analysis-mode-note').after(scopeLabel);
  $('analysis-scope').onchange=()=>openAnalysis($('analysis-scope').value);

  const reading=make('div','analysis-reading');reading.id='analysis-reading';analysis.querySelector('.analysis-heading').after(reading);
  const monthLabel=document.createElement('label');monthLabel.className='analysis-month';monthLabel.innerHTML='<span data-i18n="fc_month"></span><select id="analysis-month"></select>';analysis.querySelector('#day-picker').before(monthLabel);
  $('analysis-month').onchange=()=>{$('fc-month').value=$('analysis-month').value;Observatory.render();};
  const metadata=make('details','chart-metadata');metadata.innerHTML='<summary data-i18n="ui_data_method"></summary>';
  const calendar=$('fire-calendar');const explanatory=[...calendar.querySelectorAll(':scope > p')];explanatory.forEach(e=>metadata.append(e));calendar.append(metadata);calendar.insertBefore($('daily-matrix'),metadata);
  analysis.addEventListener('cancel',e=>{e.preventDefault();closeAnalysis();});

  $('view-details').onclick=()=>openAnalysis('details');$('collapse-analysis').onclick=closeAnalysis;
  $('comparison-granularity').onchange=renderTemporal;$('reference-day').onchange=renderTemporal;
  for(const [id,key] of [['seasonal','ob_seasonal_h'],['anomalies','ob_anomalies_h']]){const d=make('details','analysis-details');const s=document.createElement('summary');s.dataset.i18n=key;d.append(s,$(id));analysis.append(d);}
  const territorial=make('details','analysis-details territorial-details');territorial.open=true;territorial.innerHTML='<summary data-i18n="ux_territory"></summary>';const tcard=$('territory-card');territorial.append($('panel'),tcard);tcard.hidden=true;analysis.querySelector('.analysis-reading').after(territorial);
  analysis.prepend(document.querySelector('.analysis-close-bar'));{const cal=$('fire-calendar'),ctl=cal.querySelector('.calendar-controls');cal.insertBefore(document.querySelector('.analysis-scope'),ctl);cal.insertBefore(document.querySelector('.analysis-month'),ctl);}const prioritiesBox=make('details','priority-mini');prioritiesBox.innerHTML='<summary><span data-i18n="ux_attention"></span><span id="priority-count" class="priority-count"></span></summary><div id="priority-mini-list"></div>';mapSection.append(prioritiesBox);
  const archive=make('details','archive');archive.innerHTML='<summary data-i18n="ux_all_tables"></summary>';archive.append($('reserves'));workspace.append(archive);
  const history=make('section','history-view');history.id='history-view';history.hidden=true;history.innerHTML='<iframe id="history-frame" title="OrbitaFire Historical Explorer"></iframe>';main.append(history);
  const about=make('section','about-view');about.id='about-view';about.hidden=true;
  // team request: this tab is a short how-to guide; the methodology stays available, collapsed, below it
  const guide=make('div','guide wrap');guide.innerHTML='<h1 data-i18n="gd_h"></h1><p class="guide-lead" data-i18n="gd_lead"></p><ol class="guide-steps">'
    +[1,2,3,4,5,6].map(i=>`<li><b data-i18n="gd_s${i}_t"></b><span data-i18n="gd_s${i}"></span></li>`).join('')
    +'</ol><div class="guide-note"><b data-i18n="gd_note_t"></b><span data-i18n="gd_note"></span></div><button type="button" class="enter guide-go" id="guide-go" data-i18n="gd_go"></button>';
  const methodBox=make('details','guide-method wrap');methodBox.innerHTML='<summary data-i18n="gd_method"></summary>';
  methodBox.append(document.querySelector('.hero'),document.querySelector('.status'),$('method'),$('about-team'));
  about.append(guide,methodBox);main.append(about);
  $('close-sheet').onclick=()=>{aside.hidden=true;workspace.classList.remove('has-selection');window.dispatchEvent(new Event('resize'));};
  $('enter').onclick=()=>show('control');$('geo-search').disabled=true;
  document.addEventListener('click',e=>{if(e.target.id==='guide-go')show('control');});
  function show(next,push=true){if(analysis.open)closeAnalysis();if(!['landing','control','history','about'].includes(next))next='landing';if(push&&location.hash!=='#'+next)window.history.pushState({view:next},'', '#'+next);if(next!=='history'&&frameReady)$('history-frame').contentWindow.postMessage({type:'orbita-pause'},location.origin);view=next;document.body.dataset.view=next;landing.hidden=next!=='landing';workspace.hidden=next!=='control';history.hidden=next!=='history';about.hidden=next!=='about';document.querySelectorAll('.view-tab').forEach(b=>{b.classList.toggle('active',b.dataset.view===next);b.setAttribute('aria-selected',String(b.dataset.view===next));});
    if(next==='history'){const f=$('history-frame');if(!f.src)f.src='3d.html';else sync();}window.dispatchEvent(new Event('resize'));if(next==='control')requestAnimationFrame(()=>window.dispatchEvent(new Event('orbita-enter')));}
  function sync(){if(frameReady)$('history-frame').contentWindow.postMessage({type:'orbita-selection',lang:language,location:selected,month:+$('fc-month').value},location.origin);}
  window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='orbita-choose'&&ctx){const loc=ctx.locations.find(l=>l.id===e.data.id || (l.kind==='area'&&l.name===e.data.name));if(loc)ctx.select(loc.id,true);}if(e.origin===location.origin&&e.data?.type==='orbita-ready'){frameReady=true;sync();}});
  function init(context,payload){ctx=context;control=payload;window.OrbitaPalette.max=payload.activity_max;window.OrbitaPalette.cellMax=payload.cell_max||payload.activity_max;fetch('data/sectors.json').then(r=>r.json()).then(d=>{sectors=d;if(lastData){document.querySelector('.sector-card')?.remove();renderSector();}});fetch('data/daily.json').then(r=>r.json()).then(d=>dailyMeta=d);
    for(let year=2000;year<=2026;year++){const o=document.createElement('option');o.value=year;o.textContent=year;$('map-year').append(o);}const last=new Date(Date.UTC(+payload.data_through.slice(0,4),+payload.data_through.slice(5,7)-2,1));$('map-year').value=String(last.getUTCFullYear());$('fc-month').value=String(last.getUTCMonth()+1);
    const search=[];context.locations.filter(l=>l.kind!=='cell').forEach(l=>search.push({name:l.name+' · '+l.kind,id:l.id}));
    context.D.comm.forEach(p=>{const res=context.D.cells.res,lat=Math.floor(p[0]/res)*res+res/2,lon=Math.floor(p[1]/res)*res+res/2,id=`cell|${lat.toFixed(3)}_${lon.toFixed(3)}`;if(context.locations.some(l=>l.id===id))search.push({name:p[2]+' · '+p[3],id});});
    search.forEach(x=>{const o=document.createElement('option');o.value=x.name;$('geo-results').append(o);});
    $('geo-search').onchange=()=>{const q=$('geo-search').value.toLowerCase();const hit=search.find(x=>x.name.toLowerCase()===q)||search.find(x=>x.name.toLowerCase().includes(q));if(hit){if(hit.id==='peru')ctx.S.countryOpened=true;context.select(hit.id,true);}};
    $('geo-search').onkeydown=e=>{if(e.key==='Enter')$('geo-search').onchange();};
    $('geo-search').oninput=()=>{if(search.some(x=>x.name===$('geo-search').value))$('geo-search').onchange();};
    $('geo-search').disabled=false;$('activity-layer').onchange=paint;$('map-year').onchange=()=>{Observatory.render();paint();};
    $('fc-month').addEventListener('change',()=>{paint();sync();});paint();translate();
  }
  function paint(){if(control)window.dispatchEvent(new CustomEvent('orbita-paint',{detail:{control,month:+$('fc-month').value||9,year:+$('map-year').value,layer:$('activity-layer').value}}));}
  function update(d,loc){selected=loc;if(!ctx)return;
    const open=loc.kind!=='country'||ctx.S.countryOpened;$('context-sheet').hidden=!open;$('workspace').classList.toggle('has-selection',Boolean(open));
    const changed=!lastData || lastData!==d;lastData=d;if(changed){closeAnalysis();}
    const mo=+$('fc-month').value,year=$('map-year').value,time=`${year}-${String(mo).padStart(2,'0')}`,r=d.records.find(r=>r.time===time),last=d.records.filter(r=>r.complete&&r.source>=2&&r.observed!=null).at(-1);
    const state=!r?.complete||r.z==null?'insufficient':r.z>=3.5?'exceptional':r.z>=2?'unusual':'normal';
    const root=$('selection-summary');root.innerHTML='';const h=document.createElement('h2');const regionName=loc.kind==='cell'?Object.entries(sectors?.members||{}).find(([key,ids])=>key.startsWith('region|')&&ids.includes(loc.id))?.[0].slice(7):null;h.textContent=loc.kind==='cell'?t().ob_cell+(regionName?' · '+regionName:''):loc.name;root.append(h);if(['area','buffer'].includes(loc.kind)){const type=document.createElement('div');type.className='location-kind';type.textContent=loc.kind==='area'?t().leg_area:t().ob_buffer;root.append(type);}
    const p=document.createElement('p');p.className='summary-period';p.textContent=`${t().nx_selected}: ${t().months[mo-1]} ${year}`;root.append(p);
    const kpi=make('div','activity-kpi'),kpiLabel=document.createElement('span'),number=document.createElement('strong'),unit=document.createElement('span');
    kpiLabel.className='kpi-label';kpiLabel.textContent=r?.source<2?t().nx_estimated:t().ux_observed;number.textContent=r?.value==null?'–':ctx.fmt(r.value);unit.className='kpi-unit';unit.textContent='hotspots';kpi.append(kpiLabel,number,unit);root.append(kpi);
    if(loc.kind==='region'){const note=document.createElement('small');note.className='spatial-note';note.textContent=t().nx_region_approx;root.append(note);}
    const status=document.createElement('p');status.className='summary-status '+state;status.textContent=t()['nx_'+state];root.append(status);
    const interpretation=document.createElement('p');interpretation.className='summary-interpretation';interpretation.textContent=t()['nx_text_'+state];root.append(interpretation);
    const updated=document.createElement('small');updated.className='summary-updated';updated.textContent=t().nx_latest(last?.time??'–',ctx.fmt(last?.value),control.data_through);root.append(updated);
    if(r?.off_season||r?.first){const tags=document.createElement('p');tags.textContent=[r.off_season?t().ob_offseason:'',r.first?t().ob_first:''].filter(Boolean).join(' · ');root.append(tags);}
    renderSector();if(analysisMode)renderTemporal();if(changed)requestAnimationFrame(()=>{$('context-sheet').scrollTop=0;});
    window.dispatchEvent(new CustomEvent('orbita-highlight',{detail:loc}));sync();paint();window.dispatchEvent(new Event('resize'));
  }
  function renderSector(){
    const root=$('selection-summary');if(!selected||!['region','area','buffer'].includes(selected.kind)){window.dispatchEvent(new CustomEvent('orbita-sector',{detail:null}));return;}
    const card=make('div','sector-card');const h=document.createElement('h3');h.textContent=t().nx_sector;card.append(h);
    const metric={value:ctx.S?.sectorMetric||'observed'};
    const ids=new Set(sectors?.members[selected.id]||[]),period=`${$('map-year').value}-${String($('fc-month').value).padStart(2,'0')}`,idx=control.months.indexOf(period);
    const candidates=control.cells.filter(c=>ids.has(c.id)&&c.o[idx]>0&&(metric.value!=='anomaly'||c.z[idx]>=2)).sort((a,b)=>(metric.value==='anomaly'?b.z[idx]-a.z[idx]:b.o[idx]-a.o[idx])||a.id.localeCompare(b.id));
    const winner=candidates[0],p=document.createElement('p');p.textContent=winner?`${ctx.fmt(winner.o[idx])} hotspots · ${period} · ${t()['nx_'+(winner.z[idx]==null?'insufficient':winner.z[idx]>=3.5?'exceptional':winner.z[idx]>=2?'unusual':'normal')]}`:t().nx_no_sector;card.append(p);
    root.append(card);window.dispatchEvent(new CustomEvent('orbita-sector',{detail:winner||null}));
  }
  function closeAnalysis(){if(analysis.open)analysis.close();analysis.hidden=true;analysisMode=null;}
  function openAnalysis(mode){analysisMode=mode;$('analysis-scope').value=mode;analysis.hidden=false;analysis.dataset.mode=mode;if(!analysis.open)analysis.showModal();Observatory.configureComparison(mode);renderTemporal();analysis.scrollTop=0;}

  function inspectPeriod(r){if(!r)return;$('map-year').value=r.time.slice(0,4);$('fc-month').value=+r.time.slice(5);Observatory.render();}
  async function renderTemporal(){
    if(!analysisMode||!lastData)return;
    $('analysis-title').textContent=t().nx_details;
    $('analysis-subtitle').textContent=selected.kind==='cell'?t().ob_cell:selected.name+(['area','buffer'].includes(selected.kind)?' · '+(selected.kind==='area'?t().leg_area:t().ob_buffer):'');
    const chosen=lastData.records.find(r=>r.time===`${$('map-year').value}-${String($('fc-month').value).padStart(2,'0')}`);
    $('analysis-reading').textContent=chosen?`${t().months[+$('fc-month').value-1]} ${$('map-year').value} · ${ctx.fmt(chosen.value)} hotspots · ${t()['nx_'+(!chosen.complete||chosen.z==null?'insufficient':chosen.z>=3.5?'exceptional':chosen.z>=2?'unusual':'normal')]}`:t().ob_missing;
    $('analysis-month').innerHTML='';t().months.forEach((m,i)=>{const o=document.createElement('option');o.value=i+1;o.textContent=m;$('analysis-month').append(o);});$('analysis-month').value=$('fc-month').value;
    const history=analysisMode==='history';$('comparison-granularity').disabled=history;if(history)$('comparison-granularity').value='month';
    const available=Boolean(dailyMeta?.files[selected.id]);for(const o of $('comparison-granularity').options)if(o.value!=='month')o.disabled=!available;
    if(!available)$('comparison-granularity').value='month';
    const gran=$('comparison-granularity').value;if(gran!=='month')$('analysis-reading').textContent=t().ui_month_summary+': '+$('analysis-reading').textContent;$('daily-availability').textContent=available?t().ui_daily_record(dailyMeta.start,dailyMeta.end):t().ui_daily_unavailable;
    $('analysis-mode-note').textContent=history?t().nx_history_note:t().nx_details_note;
    $('day-picker').hidden=gran==='month';$('fire-calendar').hidden=false;$('fire-calendar-chart').parentElement.hidden=gran!=='month';$('calendar-context').hidden=gran!=='month';$('calendar-detail').hidden=gran!=='month';if($('year-picker'))$('year-picker').hidden=history;$('daily-matrix').hidden=gran==='month';
    if(gran==='month'){
      const mo=+$('fc-month').value,year=$('map-year').value;
      document.querySelectorAll('#fire-calendar-chart [data-time]').forEach(e=>{e.dataset.reference=String(+e.dataset.time.slice(5)===mo);e.dataset.current=String(e.dataset.time===`${year}-${String(mo).padStart(2,'0')}`);});return;
    }
    const id=selected.id,file=dailyMeta.files[id];
    try{
      if(!dailyCache.has(file))dailyCache.set(file,fetch('data/'+file).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}));
      const payload=await dailyCache.get(file);if(selected.id!==id)return;
      const nonzero=new Map(payload[id]),start=Date.parse(dailyMeta.start+'T00:00:00Z'),end=Date.parse(dailyMeta.end+'T00:00:00Z'),day=Math.min(31,Math.max(1,+$('reference-day').value||10)),mo=+$('fc-month').value;
      const from=Math.max(2012,+$('fc-from').value),to=+$('fc-to').value,checked=new Set([...document.querySelectorAll('#year-picker input:checked')].map(e=>+e.value));
      const years=Array.from({length:Math.max(0,to-from+1)},(_,i)=>from+i).filter(y=>checked.has(y));
      const cols=gran==='day'?Array.from({length:7},(_,i)=>day-3+i):[1,8,15,22,29];
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`0 0 560 ${50+years.length*28}`);$('daily-matrix').replaceChildren(svg);
      const add=(tag,attrs,text)=>{const e=document.createElementNS(svg.namespaceURI,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!=null)e.textContent=text;svg.append(e);return e;};
      const count=(year,d)=>{const date=new Date(Date.UTC(year,mo-1,d));if(d<1||date.getUTCMonth()!==mo-1||date.getTime()<start||date.getTime()>=end)return null;return nonzero.get(Math.round((date-start)/86400000))??0;};
      cols.forEach((d,j)=>add('text',{x:65+j*68,y:18,'font-size':11},gran==='day'?d:`${d}–${d===29?'…':d+6}`));
      years.forEach((year,i)=>{add('text',{x:5,y:48+i*28,'font-size':12},year);cols.forEach((d,j)=>{let value=count(year,d);if(gran==='week'){const n=Math.min(d+6,new Date(Date.UTC(year,mo,0)).getUTCDate());const vs=Array.from({length:Math.max(0,n-d+1)},(_,k)=>count(year,d+k));value=vs.length&&vs.every(v=>v!=null)?vs.reduce((a,b)=>a+b,0):null;}
        const ratio=value==null?0:Math.min(1,Math.log1p(value)/Math.log(101));const shade=Math.round(250-150*ratio),color=window.OrbitaPalette.activity(value);
        const rect=add('rect',{x:60+j*68,y:28+i*28,width:64,height:24,fill:color,stroke:gran==='day'?d===day?'#111':'none':day>=d&&day<=d+6?'#111':'none',tabindex:0,role:'button'});
        const label=`${year}-${String(mo).padStart(2,'0')}-${d} · ${value==null?t().ob_missing:value.toFixed(2)+' hotspots'} · ${t().nx_observed_source}`;rect.setAttribute('aria-label',label);const title=document.createElementNS(svg.namespaceURI,'title');title.textContent=label;rect.append(title);
        rect.onclick=()=>{if(value!=null){$('reference-day').value=Math.max(1,d);$('map-year').value=year;Observatory.render();}$('daily-availability').textContent=label;};rect.onkeydown=e=>{if(e.key==='Enter')rect.onclick();};if(value===0)add('circle',{cx:92+j*68,cy:40+i*28,r:2,fill:'#777','pointer-events':'none'});
      });});
      if(gran==='week')$('analysis-mode-note').textContent=t().nx_week_alignment;
    }catch(err){$('daily-availability').textContent=t().nx_no_daily;console.error(err);}
  }
  function priorities(items){const el=$('priority-mini-list');el.innerHTML='';const relevant=items.filter(x=>x.r?.source>=2&&x.z>=2).sort((a,b)=>b.z-a.z).slice(0,4);
    $('priority-count').textContent=relevant.length||'–';if(!relevant.length){el.textContent=t().ux_neutral;return;}
    relevant.forEach(x=>{const b=make('button','attention-link'),name=document.createElement('strong'),note=document.createElement('span');name.textContent=x.loc.name;note.textContent=`${x.r.time} · ${t()[x.z>=3.5?'nx_exceptional':'nx_unusual']}`;b.append(name,note);b.onclick=()=>{$('map-year').value=x.r.time.slice(0,4);$('fc-month').value=+x.r.time.slice(5);ctx.select(x.loc.id,true);};el.append(b);});}
  function translate(){language=document.documentElement.lang||'en';document.querySelectorAll('[data-i18n]').forEach(e=>{if(typeof t()[e.dataset.i18n]==='string')e.textContent=t()[e.dataset.i18n];});
    for(const [id,key,hint]of[['view-details','nx_details','ui_details_hint']]){const b=$(id);b.innerHTML='';const title=document.createElement('strong'),small=document.createElement('small');title.textContent=t()[key];small.textContent=t()[hint];b.append(title,small);}sync();}
  window.addEventListener('popstate',()=>show(location.hash.slice(1)||'landing',false));window.addEventListener('hashchange',()=>show(location.hash.slice(1)||'landing',false));
  show(location.hash.slice(1)||'landing',false);
  return{init,update,priorities,translate,paint,openAnalysis,renderTemporal,inspectPeriod};
})();
