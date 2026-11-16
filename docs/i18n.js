// OrbitaFire UI strings (EN / ES). Developed with AI assistance (Claude, Anthropic).
const I18N = {
  en: {
    nav_map: "Map", nav_reserves: "Communal Reserves", nav_method: "Method", nav_about: "About", nav_3d: "3D view",
    eyebrow: "NASA Space Apps Challenge 2026 · Harmonization of MODIS and VIIRS Hot Spots",
    h1: "25 years of fire in Peru, on one consistent scale",
    lead: "NASA's two fire sensors count fires differently: VIIRS sees <b>4–8×</b> more hotspots than MODIS. We harmonized both into a single, validated 2000–2026 record and use it to warn the people who protect the Amazon's <b>Communal Reserves</b> when a fire season is out of the ordinary.",
    status_h: "Current fire status",
    map_h: "Explore the map",
    map_sub: "Click anywhere to see its fire history, the protected area or buffer zone it belongs to, and the native communities nearby.",
    color_by: "Color cells by", mode_anom: "2024 vs typical season", mode_dens: "Average fire per year",
    lyr_areas: "Protected areas", lyr_buffers: "Buffer zones", lyr_comm: "Native communities", lyr_base: "Basemap",
    res_h: "Peru's 11 Communal Reserves",
    res_sub: "Communal Reserves are protected areas <b>co-managed</b> by SERNANP and the Indigenous organizations of the native communities around them. VIIRS hotspots (2012–Oct 2026) inside each reserve and its buffer zone. Click a row to see it on the map.",
    method_h: "Why harmonize, and how",
    c1_t: "Before and after harmonization", c1_s: "Annual hotspots in Peru. The shaded band is the 95% uncertainty of the reconstructed years.",
    c2_t: "The VIIRS/MODIS ratio is not constant", c2_s: "Each dot is a month (2012–2026). In quiet months VIIRS sees far more small fires than MODIS.",
    c3_t: "Validated year by year", c3_s: "Error in each year's total when that year is hidden from the model.",
    c4_t: "Peru's fire calendar", c4_s: "Typical share of the year's fires in each month.",
    m1: "<b>Clean & grid.</b> NASA FIRMS hotspots from MODIS (Terra, Aqua) and VIIRS (S-NPP, NOAA-20, NOAA-21) over Peru, 2000–2026: confident detections only, vegetation fires only, aggregated to a common 0.25° × month grid.",
    m2: "<b>One VIIRS reference.</b> S-NPP is the reference; on days S-NPP was not observing and after it was switched off (1 Nov 2026), NOAA-20 fills in. The two agree within 1%.",
    m3: "<b>Learn MODIS → VIIRS.</b> A Poisson GLM learns, cell by cell, how many hotspots VIIRS sees for a given MODIS count, month and local fire regime, in the 2012–2026 overlap. Five models were compared with leave-one-year-out validation.",
    m4: "<b>Reconstruct & alert.</b> 2000–2011 are expressed as VIIRS-equivalent with a 95% band. Every month, year, cell and protected area is compared with its own history (robust z-score) to flag anomalous fire seasons.",
    team_h: "Team OrbitaFire · Lima, Peru", role1: "Technical & data lead", role2: "Interactive map & local context", role3: "Communication & delivery",
    ai_h: "Use of AI",
    ai_p: "Claude (Anthropic) assisted the team in writing and reviewing code, designing the validation and drafting documentation. The idea, decisions and review are the team's. Files written with AI assistance carry a note in their header.",
    data_h: "Data & credits",
    cr1: "We acknowledge the use of data and imagery from <b>NASA's Fire Information for Resource Management System (FIRMS)</b> (https://earthdata.nasa.gov/firms), part of NASA's Earth Science Data and Information System (ESDIS): MODIS Collection 6.1 and VIIRS 375 m Collection 2 active fire products.",
    cr2: "Protected areas, buffer zones and native communities: <b>SERNANP</b> (MINAM, Peru), public download service. Simplified for display.",
    cr3: "Department boundaries: <b>geoBoundaries</b> (public domain). Basemap: © <b>OpenStreetMap</b> contributors. Map library: Leaflet (BSD-2).",
    cr4: "Algorithms: Giglio et al. 2016, doi:10.1016/j.rse.2016.02.054 (MODIS C6); Schroeder et al. 2014, doi:10.1016/j.rse.2013.12.008 (VIIRS 375 m).",
    cr5: "Code: <a href=\"https://github.com/JeanLuka17/orbitafire\">github.com/JeanLuka17/orbitafire</a> · MIT License. Not endorsed by NASA.",
    foot: "Hotspot counts measure detected active fire, not burned area. Reconstructed years (2000–2011) carry wider uncertainty. Data through 12 Nov 2026.",
    // dynamic
    cat: { "very low": "Very low", "normal": "Normal", "high": "High", "very high": "Very high", "extreme": "Extreme", "n/a": "No data" },
    s_last: m => `Peru · ${m}`, s_last_d: (r) => `${r}× a typical month`,
    s_ytd: y => `Peru · ${y} so far`, s_ytd_d: (r, mo) => `${r}× the usual ${mo}`,
    s_rec: "Record year", s_rec_d: (r2005) => `2005 was close (${r2005}), but MODIS alone showed only a fraction`,
    s_amk: "Amarakaeri buffer zone", s_amk_d: (r, base) => `${r}× a typical year (record; ~${base}/yr in 2012–2018)`,
    s_note: d => `Hotspots = VIIRS-equivalent active-fire detections. Compared with the same months in 2012–2025 (robust z-score). Data through ${d}.`,
    hotspots: "hotspots", per_year: "per year",
    p_intro: "Click on the map to explore a place.",
    p_intro2: "Tip: try the Amarakaeri or El Sira Communal Reserves in the table below.",
    p_cell: "Fire in this 25 km cell", p_cell_s: "Hotspots per year, VIIRS-equivalent. Lighter bars: reconstructed from MODIS.",
    p_in_area: "Inside", p_in_buffer: "Buffer zone of", p_outside: "Outside protected areas",
    p_unit_s: "VIIRS hotspots per year in this unit (2012–2026*).",
    p_2024: "2024 vs typical year", p_trend: "Trend 2012–2025", p_peak: "Peak month", p_ytd: "2026 so far vs usual",
    p_last: "Oct 2026 vs usual Oct", p_mean: "Average per year", p_area: "Area",
    p_comm: "Native communities in this cell", p_none: "None recorded in this cell.",
    p_peoples: "Peoples", p_region: "Department", p_partial: "*2026: Jan–Oct",
    p_anom: "2024 fire season (Jul–Nov) vs typical", p_nodata: "Too few fires here for a reliable comparison.",
    km2: "km²", pct_yr: "%/yr",
    t_name: "Communal Reserve", t_reg: "Departments", t_mean: "Hotspots/yr (reserve + buffer)", t_inside: "Inside", t_buffer: "Buffer",
    t_2024: "2024 vs typical", t_trend: "Trend", t_comm: "Communities in buffer", t_peoples: "Peoples",
    sp_amk_t: "Amarakaeri: fire is closing in",
    sp_amk: (a, b, r) => `Almost no fire inside the reserve, but its buffer zone went from ~${a} hotspots a year (2012–2018) to ${b} in 2024 — a record, ${r}× a typical year. The reserve is co-managed by the Harakbut, Yine and Matsigenka communities through ECA Amarakaeri.`,
    sp_sira_t: "El Sira: the most fire",
    sp_sira: (m, c) => `About ${m} hotspots a year in the reserve and its buffer zone — more than all other Communal Reserves combined — with ${c} native communities in the buffer zone.`,
    leg_anom: "Jul–Nov 2024 vs typical season", leg_dens: "Average hotspots per year (2012–2025)",
    leg_area: "Protected area", leg_buffer: "Buffer zone", leg_comm: "Native community",
    lower: "less", higher: "more", typical: "typical",
    ch_harm: "Harmonized (VIIRS-equivalent)", ch_modis: "MODIS as recorded", ch_band: "95% band",
    ch_const: "One constant factor", ch_ours: "OrbitaFire model", ch_reco: "reconstructed", ch_obs: "VIIRS observed",
    ch_ratio_y: "VIIRS ÷ MODIS", ch_ratio_x: "MODIS hotspots in the month (log)", ch_err: "error in yearly total", worst: "worst year",
    fc_h:"Fire Activity Calendar",fc_sub:"Monthly VIIRS-equivalent activity. Pre-2012 values are model reconstructions; protected-area series use observed VIIRS only.",fc_location:"Location",fc_peru:"All Peru",fc_month:"Month",fc_view:"View",fc_mode:"Color",fc_median:"Historical median",fc_reconstructed:"Blue-gray bars are reconstructed; blue bars are observed",fc_empty:"No monthly series is available for this location.",fc_season:"Historically busiest months",fc_caution:"Historical hotspot activity can guide monitoring; it is not a forecast or confirmation of fire.",
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  },
  es: {
    nav_map: "Mapa", nav_reserves: "Reservas Comunales", nav_method: "Método", nav_about: "Equipo", nav_3d: "Vista 3D",
    eyebrow: "NASA Space Apps Challenge 2026 · Armonización de focos de calor MODIS y VIIRS",
    h1: "25 años de incendios en el Perú, en una sola escala",
    lead: "Los dos sensores de incendios de la NASA cuentan distinto: VIIRS ve <b>4 a 8 veces</b> más focos que MODIS. Armonizamos ambos en un solo registro validado 2000–2026 y lo usamos para alertar a quienes protegen las <b>Reservas Comunales</b> de la Amazonía cuando una temporada de fuego sale de lo normal.",
    status_h: "Estado actual del fuego",
    map_h: "Explora el mapa",
    map_sub: "Haz clic en cualquier lugar para ver su historia de incendios, el área protegida o zona de amortiguamiento a la que pertenece y las comunidades nativas cercanas.",
    color_by: "Colorear celdas por", mode_anom: "2024 frente a una temporada típica", mode_dens: "Fuego promedio por año",
    lyr_areas: "Áreas protegidas", lyr_buffers: "Zonas de amortiguamiento", lyr_comm: "Comunidades nativas", lyr_base: "Mapa base",
    res_h: "Las 11 Reservas Comunales del Perú",
    res_sub: "Las Reservas Comunales son áreas protegidas <b>cogestionadas</b> por SERNANP y las organizaciones indígenas de las comunidades nativas que las rodean. Focos VIIRS (2012–oct 2026) dentro de cada reserva y su zona de amortiguamiento. Haz clic en una fila para verla en el mapa.",
    method_h: "Por qué armonizar y cómo",
    c1_t: "Antes y después de armonizar", c1_s: "Focos por año en el Perú. La franja es la incertidumbre del 95% de los años reconstruidos.",
    c2_t: "La razón VIIRS/MODIS no es constante", c2_s: "Cada punto es un mes (2012–2026). En meses tranquilos VIIRS ve muchos más fuegos pequeños que MODIS.",
    c3_t: "Validado año por año", c3_s: "Error en el total de cada año cuando ese año se oculta al modelo.",
    c4_t: "Calendario del fuego en el Perú", c4_s: "Parte típica de los incendios del año en cada mes.",
    m1: "<b>Limpiar y agrupar.</b> Focos NASA FIRMS de MODIS (Terra, Aqua) y VIIRS (S-NPP, NOAA-20, NOAA-21) sobre el Perú, 2000–2026: solo detecciones confiables y de vegetación, agrupadas en una grilla común de 0,25° × mes.",
    m2: "<b>Una sola referencia VIIRS.</b> S-NPP es la referencia; los días en que S-NPP no observó y tras su apagado (1 nov 2026), completa NOAA-20. Ambos coinciden con menos de 1% de diferencia.",
    m3: "<b>Aprender MODIS → VIIRS.</b> Un GLM de Poisson aprende, celda por celda, cuántos focos ve VIIRS según el conteo de MODIS, el mes y el régimen de fuego local, en el periodo común 2012–2026. Se compararon cinco modelos validando con un año fuera.",
    m4: "<b>Reconstruir y alertar.</b> 2000–2011 se expresan en equivalente VIIRS con banda del 95%. Cada mes, año, celda y área protegida se compara con su propia historia (z robusto) para detectar temporadas anómalas.",
    team_h: "Equipo OrbitaFire · Lima, Perú", role1: "Líder técnico y de datos", role2: "Mapa interactivo y contexto local", role3: "Comunicación y entrega",
    ai_h: "Uso de IA",
    ai_p: "Claude (Anthropic) ayudó al equipo a escribir y revisar código, diseñar la validación y redactar documentación. La idea, las decisiones y la revisión son del equipo. Los archivos hechos con ayuda de IA lo indican en su encabezado.",
    data_h: "Datos y créditos",
    cr1: "Reconocemos el uso de datos e imágenes del <b>Fire Information for Resource Management System (FIRMS) de la NASA</b> (https://earthdata.nasa.gov/firms), parte del Earth Science Data and Information System (ESDIS): productos de fuego activo MODIS Colección 6.1 y VIIRS 375 m Colección 2.",
    cr2: "Áreas protegidas, zonas de amortiguamiento y comunidades nativas: <b>SERNANP</b> (MINAM, Perú), servicio público de descarga. Simplificadas para visualización.",
    cr3: "Límites departamentales: <b>geoBoundaries</b> (dominio público). Mapa base: © colaboradores de <b>OpenStreetMap</b>. Librería de mapas: Leaflet (BSD-2).",
    cr4: "Algoritmos: Giglio et al. 2016, doi:10.1016/j.rse.2016.02.054 (MODIS C6); Schroeder et al. 2014, doi:10.1016/j.rse.2013.12.008 (VIIRS 375 m).",
    cr5: "Código: <a href=\"https://github.com/JeanLuka17/orbitafire\">github.com/JeanLuka17/orbitafire</a> · Licencia MIT. Sin respaldo oficial de la NASA.",
    foot: "Los focos miden fuego activo detectado, no área quemada. Los años reconstruidos (2000–2011) tienen mayor incertidumbre. Datos hasta el 12 nov 2026.",
    cat: { "very low": "Muy bajo", "normal": "Normal", "high": "Alto", "very high": "Muy alto", "extreme": "Extremo", "n/a": "Sin datos" },
    s_last: m => `Perú · ${m}`, s_last_d: (r) => `${r}× un mes típico`,
    s_ytd: y => `Perú · ${y} hasta ahora`, s_ytd_d: (r, mo) => `${r}× lo usual en ${mo}`,
    s_rec: "Año récord", s_rec_d: (r2005) => `2005 fue cercano (${r2005}), pero MODIS solo mostraba una fracción`,
    s_amk: "Zona de amortiguamiento de Amarakaeri", s_amk_d: (r, base) => `${r}× un año típico (récord; ~${base}/año en 2012–2018)`,
    s_note: d => `Focos = detecciones de fuego activo en equivalente VIIRS. Comparado con los mismos meses de 2012–2025 (z robusto). Datos hasta ${d}.`,
    hotspots: "focos", per_year: "por año",
    p_intro: "Haz clic en el mapa para explorar un lugar.",
    p_intro2: "Sugerencia: prueba las Reservas Comunales Amarakaeri o El Sira en la tabla de abajo.",
    p_cell: "Fuego en esta celda de 25 km", p_cell_s: "Focos por año, equivalente VIIRS. Barras claras: reconstruidas desde MODIS.",
    p_in_area: "Dentro de", p_in_buffer: "Zona de amortiguamiento de", p_outside: "Fuera de áreas protegidas",
    p_unit_s: "Focos VIIRS por año en esta unidad (2012–2026*).",
    p_2024: "2024 frente a un año típico", p_trend: "Tendencia 2012–2025", p_peak: "Mes pico", p_ytd: "2026 hasta ahora vs lo usual",
    p_last: "Oct 2026 vs un octubre usual", p_mean: "Promedio por año", p_area: "Área",
    p_comm: "Comunidades nativas en esta celda", p_none: "No hay registradas en esta celda.",
    p_peoples: "Pueblos", p_region: "Departamento", p_partial: "*2026: ene–oct",
    p_anom: "Temporada 2024 (jul–nov) vs una típica", p_nodata: "Muy pocos fuegos aquí para una comparación confiable.",
    km2: "km²", pct_yr: "%/año",
    t_name: "Reserva Comunal", t_reg: "Departamentos", t_mean: "Focos/año (reserva + amortiguamiento)", t_inside: "Dentro", t_buffer: "Amortiguamiento",
    t_2024: "2024 vs típico", t_trend: "Tendencia", t_comm: "Comunidades en amortiguamiento", t_peoples: "Pueblos",
    sp_amk_t: "Amarakaeri: el fuego se acerca",
    sp_amk: (a, b, r) => `Casi no hay fuego dentro de la reserva, pero su zona de amortiguamiento pasó de ~${a} focos al año (2012–2018) a ${b} en 2024: un récord, ${r}× un año típico. La reserva la cogestionan las comunidades harakbut, yine y matsigenka a través del ECA Amarakaeri.`,
    sp_sira_t: "El Sira: la que más fuego tiene",
    sp_sira: (m, c) => `Unos ${m} focos al año en la reserva y su zona de amortiguamiento —más que todas las demás Reservas Comunales juntas— con ${c} comunidades nativas en la zona de amortiguamiento.`,
    leg_anom: "Jul–nov 2024 vs una temporada típica", leg_dens: "Focos promedio por año (2012–2025)",
    leg_area: "Área protegida", leg_buffer: "Zona de amortiguamiento", leg_comm: "Comunidad nativa",
    lower: "menos", higher: "más", typical: "típico",
    ch_harm: "Armonizado (equivalente VIIRS)", ch_modis: "MODIS tal como se registró", ch_band: "Banda 95%",
    ch_const: "Un factor constante", ch_ours: "Modelo OrbitaFire", ch_reco: "reconstruido", ch_obs: "VIIRS observado",
    ch_ratio_y: "VIIRS ÷ MODIS", ch_ratio_x: "Focos MODIS en el mes (log)", ch_err: "error en el total anual", worst: "peor año",
    fc_h:"Calendario de actividad de fuego",fc_sub:"Actividad mensual equivalente a VIIRS. Antes de 2012 son reconstrucciones del modelo; las series de áreas protegidas usan observaciones VIIRS.",fc_location:"Ubicación",fc_peru:"Todo el Perú",fc_month:"Mes",fc_view:"Vista",fc_mode:"Color",fc_median:"Mediana histórica",fc_reconstructed:"Barras azul grisáceas: reconstruidas; azules: observadas",fc_empty:"No hay una serie mensual disponible para esta ubicación.",fc_season:"Meses históricamente más activos",fc_caution:"La actividad histórica de hotspots orienta la vigilancia; no es un pronóstico ni confirma incendios.",
    months: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  },
};

Object.assign(I18N.en, {
  ob_category:"Category", ob_observed_empty:"No comparable complete observed month is available in this selection.",
  ob_observed:(date,value,ratio,high)=>`${high?"Observed Activity Anomaly":"Observed activity"}: ${date}, ${value} hotspots (${ratio} relative to the same month in other complete years). ${high?"Activity is historically elevated; intensify observation. This is not confirmation of a fire.":"No elevated observed-activity advisory at z ≥ 2 for this month."}`,
  ob_map_scope:"Map selection", ob_auto:"Protected area or cell", ob_region:"Department", ob_cell:"Grid cell",
  ob_area:"Inside reserve", ob_buffer:"Buffer ring", ob_from:"From year", ob_to:"To year", ob_bars:"Bars", ob_heat:"Heatmap",
  ob_activity:"Hotspot activity", ob_anomaly:"Robust anomaly", ob_loading:"Loading monthly record…",
  ob_missing:"Missing record", ob_complete:"Complete month", ob_partial:"Incomplete month — excluded from comparisons",
  ob_ratio:"Relative to other years", ob_no_band:"Uncertainty band unavailable", ob_axis:"Hotspots (VIIRS-equivalent)",
  ob_legend:"Blue: observed. Pale blue: reconstructed. Hatched: incomplete. Grey: missing or insufficient baseline. White dot: zero. Orange line: median. Whiskers: available 95% band.",
  ob_baseline:"Monthly anomalies compare the same calendar month in other complete years; full-year statistics exclude incomplete years.",
  ob_spatial:"Approximate regional totals: whole 0.25° cells assigned by center using simplified geoBoundaries. Border cells and small regions have spatial uncertainty; regions with no cell centers have missing values. No regional uncertainty band is available.",
  ob_compare_note:"Orange line: median of complete months in the selected range. Tooltips use other complete years in the full record. Select a bar for details.",
  ob_heat_help:"Select a month-year square for value, other-year baseline, deviation, source and available uncertainty.",
  ob_seasonal_h:"Seasonal Fire Activity", ob_territories_h:"Territories Requiring Attention", ob_anomalies_h:"Activity anomalies",
  ob_advisory:(months,n)=>`Seasonal Advisory: ${months} have the highest typical hotspot activity across ${n} complete years. Intensify monitoring during these months. Historical frequency is descriptive, not a calibrated fire probability.`,
  ob_season_empty:"There is insufficient or no typical positive activity to identify a seasonal peak.",
  ob_statistics_note:"Bars: monthly median; whiskers: P10–P90 across complete years. Historical elevated activity means robust z ≥ 2 (each year excluded from its own baseline).",
  ob_trend:(s,l,h,a,b,e)=>`Annual Theil–Sen trend ${a}–${b}: ${s} hotspots/year (95% slope interval ${l} to ${h}). ${e?"The interval excludes zero.":"The interval includes zero: no clear directional evidence."}`,
  ob_trend_empty:"At least eight complete years with positive total activity are needed to report a trend.",
  ob_frequency:"Frequency of historically elevated months", ob_sort:"Order by", ob_sort_z:"Monthly anomaly (z)", ob_sort_recent:"Recent activity",
  ob_sort_mean:"Historical hotspots/year", ob_sort_trend:"Trend with evidence (hotspots/year)", ob_sort_frequency:"Elevated seasons (%)", ob_sort_density:"Hotspots/100 km²/year",
  ob_priority_sub:"Communal Reserve interiors and buffer rings are counted separately from the existing SERNANP point-in-polygon results. Sorting guides monitoring attention and is not a damage assessment. Overlapping units must not be summed nationally.",
  ob_priority_period:(m,y)=>`Latest complete ${m} at or before ${y}. Historical means, trends and season frequencies use the full record of complete years. Density uses geodesic unit area.`,
  ob_select_territory:"Select an interior or buffer ring in the table or map to inspect its indicators and nearby community context.",
  ob_pair:(inside,buffer,n)=>`Same selected month: ${inside} hotspots inside; ${buffer} in the buffer ring. ${n} communities intersect this selected unit (existing SERNANP result).`,
  ob_reason:(r,f)=>`Monitoring context: ${r} relative to the same month in other years; ${f} of comparable Jul–Nov seasons had robust z ≥ 2. Community intersection does not establish exposure to damage.`,
  ob_anomaly_rules:"Exceptional intensity: robust z ≥ 3.5. Off-season: z ≥ 2 and monthly baseline ≤ 10% of the seasonal peak. First Recorded Detection uses only observed counts after at least 60 consecutive complete months without detections. Flags are independent.",
  ob_limits:"Hotspots do not establish burned area, damage to communities or biodiversity loss. An anomaly does not confirm a fire. First Recorded Detection refers to this observation record; it does not establish that fire never occurred before.",
  ob_daily:"Daily anomalies are not exported yet. They require observed detections grouped by date and territory, observation coverage and a comparable daily baseline. Monthly reconstructions cannot be divided into daily events.",
  ob_anomaly_context:"Up to 40 latest records in the selected range: the selected calendar month plus any flagged months. Asterisks mark incomplete months or model estimates. Observed Activity Anomaly applies only to observed-source records. No flags are computed for incomplete months; missing reference statistics appear as dashes.",
  ob_period:"Period", ob_recent:"Recent hotspots", ob_intensity:"Exceptional intensity", ob_offseason:"Off-season", ob_first:"First Recorded Detection", ob_source:"Source", ob_yes:"Yes",
  ob_sources:["Terra → VIIRS model estimate","MODIS → VIIRS model estimate","S-NPP observed + calibrated NOAA-20 gap fill","Calibrated NOAA-20 observations","VIIRS reference observations (S-NPP / NOAA-20 gap fill)"]
});
Object.assign(I18N.es, {
  ob_category:"Categoría", ob_observed_empty:"No hay un mes observado completo y comparable en esta selección.",
  ob_observed:(date,value,ratio,high)=>`${high?"Anomalía de actividad observada":"Actividad observada"}: ${date}, ${value} hotspots (${ratio} respecto al mismo mes en otros años completos). ${high?"La actividad es históricamente elevada; intensificar la observación. Esto no confirma un incendio.":"Sin aviso de actividad observada elevada con z ≥ 2 para este mes."}`,
  ob_map_scope:"Selección del mapa", ob_auto:"Área protegida o celda", ob_region:"Departamento", ob_cell:"Celda geográfica",
  ob_area:"Dentro de la reserva", ob_buffer:"Anillo de amortiguamiento", ob_from:"Desde el año", ob_to:"Hasta el año", ob_bars:"Barras", ob_heat:"Calendario de calor",
  ob_activity:"Actividad de hotspots", ob_anomaly:"Anomalía robusta", ob_loading:"Cargando registro mensual…",
  ob_missing:"Dato faltante", ob_complete:"Mes completo", ob_partial:"Mes incompleto — excluido de comparaciones",
  ob_ratio:"Respecto a otros años", ob_no_band:"Banda de incertidumbre no disponible", ob_axis:"Hotspots (equivalentes a VIIRS)",
  ob_legend:"Azul: observado. Azul claro: reconstruido. Rayado: incompleto. Gris: dato faltante o referencia insuficiente. Punto blanco: cero. Línea naranja: mediana. Líneas verticales: banda del 95% disponible.",
  ob_baseline:"Las anomalías comparan el mismo mes en otros años completos; las estadísticas anuales excluyen años incompletos.",
  ob_spatial:"Totales regionales aproximados: celdas enteras de 0,25° asignadas por su centro con límites simplificados de geoBoundaries. Hay incertidumbre espacial en bordes y regiones pequeñas; sin centros de celdas, los datos se consideran faltantes. No hay banda regional de incertidumbre.",
  ob_compare_note:"Línea naranja: mediana de meses completos del rango elegido. Los detalles usan otros años completos del registro. Selecciona una barra para verlos.",
  ob_heat_help:"Selecciona una celda mes-año para ver cantidad, referencia de otros años, desviación, fuente e incertidumbre disponible.",
  ob_seasonal_h:"Actividad estacional de fuego", ob_territories_h:"Territorios que requieren atención", ob_anomalies_h:"Anomalías de actividad",
  ob_advisory:(months,n)=>`Aviso estacional: ${months} presentan la mayor actividad típica de hotspots en ${n} años completos. Intensificar la vigilancia durante estos meses. La frecuencia histórica es descriptiva; no es una probabilidad calibrada de incendio.`,
  ob_season_empty:"La actividad típica positiva es nula o insuficiente para identificar un pico estacional.",
  ob_statistics_note:"Barras: mediana mensual; líneas verticales: P10–P90 de años completos. La frecuencia de actividad elevada usa z robusto ≥ 2, excluyendo cada año de su propia referencia.",
  ob_trend:(s,l,h,a,b,e)=>`Tendencia anual Theil–Sen ${a}–${b}: ${s} hotspots/año (intervalo del 95% de la pendiente: ${l} a ${h}). ${e?"El intervalo excluye cero.":"El intervalo incluye cero: no hay evidencia direccional clara."}`,
  ob_trend_empty:"Se requieren al menos ocho años completos con actividad total positiva para informar una tendencia.",
  ob_frequency:"Frecuencia de meses históricamente elevados", ob_sort:"Ordenar por", ob_sort_z:"Anomalía mensual (z)", ob_sort_recent:"Actividad reciente",
  ob_sort_mean:"Hotspots históricos/año", ob_sort_trend:"Tendencia con evidencia (hotspots/año)", ob_sort_frequency:"Temporadas elevadas (%)", ob_sort_density:"Hotspots/100 km²/año",
  ob_priority_sub:"Los interiores y anillos de amortiguamiento usan los resultados existentes de puntos en polígonos SERNANP y se muestran separados. El orden orienta la vigilancia y no evalúa daños. Las unidades superpuestas no deben sumarse para obtener un total nacional.",
  ob_priority_period:(m,y)=>`Último ${m} completo hasta ${y}. Promedios, tendencias y frecuencias estacionales usan todos los años completos del registro. La densidad usa superficie geodésica.`,
  ob_select_territory:"Selecciona un interior o anillo en la tabla o el mapa para revisar sus indicadores y el contexto de comunidades cercanas.",
  ob_pair:(inside,buffer,n)=>`Mismo mes seleccionado: ${inside} hotspots dentro; ${buffer} en el anillo. ${n} comunidades intersectan esta unidad según el resultado SERNANP existente.`,
  ob_reason:(r,f)=>`Contexto de vigilancia: ${r} respecto al mismo mes de otros años; ${f} de las temporadas comparables de jul–nov tuvieron z robusto ≥ 2. La intersección con comunidades no demuestra exposición a daños.`,
  ob_anomaly_rules:"Intensidad excepcional: z robusto ≥ 3,5. Fuera de temporada: z ≥ 2 y mediana mensual ≤ 10% del pico estacional. Primera detección registrada: solo observaciones tras al menos 60 meses completos consecutivos sin detecciones. Los indicadores son independientes.",
  ob_limits:"Los hotspots no demuestran superficie quemada, daños a comunidades ni pérdida de biodiversidad. Una anomalía no confirma un incendio. Primera detección registrada se refiere a este registro observado; no demuestra que nunca hubo fuego antes.",
  ob_daily:"Las anomalías diarias aún no están exportadas. Requieren observaciones agrupadas por fecha y territorio, cobertura y una referencia diaria comparable. No se pueden dividir reconstrucciones mensuales en eventos diarios.",
  ob_anomaly_context:"Hasta 40 registros recientes del rango: el mes elegido y cualquier mes con indicador. Asteriscos: meses incompletos o estimaciones. Anomalía de actividad observada solo corresponde a fuentes observadas. No se calculan indicadores en meses incompletos; las referencias faltantes aparecen con guion.",
  ob_period:"Periodo", ob_recent:"Hotspots recientes", ob_intensity:"Intensidad excepcional", ob_offseason:"Fuera de temporada", ob_first:"Primera detección registrada", ob_source:"Fuente", ob_yes:"Sí",
  ob_sources:["Estimación Terra → VIIRS","Estimación MODIS → VIIRS","S-NPP observado + relleno NOAA-20 calibrado","Observaciones NOAA-20 calibradas","Observaciones de referencia VIIRS (S-NPP / relleno NOAA-20)"]
});

Object.assign(I18N.en,{ux_intro:"Understand satellite fire activity. Prepare for critical seasons.",ux_enter:"Let's stop them.",ux_photo:"Illustrative photo: USDA Forest Service / Henny Jungemann · Public domain · Minnesota, 2020",ux_control:"Control",ux_history:"Historical Explorer",ux_about:"About / Methodology",ux_search:"Find a territory or community",ux_year:"Year",ux_layer:"Activity layer",ux_historical:"Historical Activity",ux_observed:"Observed Activity",ux_layers:"Map layers",ux_close:"Close",ux_territory:"Territorial context",ux_attention:"Areas Requiring Attention",ux_all_tables:"All territorial tables",ux_years:"Choose comparison years",ux_neutral:"No relevant observed anomalies for the selected month and available record.",ux_above:"Above baseline",ux_map_legend:"Pale → red: typical hotspot counts, 0 → 100+; anomaly: blue → red; grey: insufficient data. Not a fire probability.",ux_summary:(m,v,d,n)=>`${m}: typical activity ${v} hotspots. Latest complete observation: ${d}, ${n} hotspots.`,ux_play:"Play",ux_pause:"Pause",ux_annual:"Annual",ux_partial:"Partial period — no full-year comparison",ux_total:"Harmonized hotspots",ux_typical:"Relative to typical year",ux_peak:"Most active cell",ux_speed:"Speed"});
Object.assign(I18N.es,{ux_intro:"Comprende la actividad satelital de fuego. Prepárate para las temporadas críticas.",ux_enter:"Detengamos los incendios",ux_photo:"Foto ilustrativa: USDA Forest Service / Henny Jungemann · Dominio público · Minnesota, 2020",ux_control:"Control",ux_history:"Explorador histórico",ux_about:"Acerca de / Método",ux_search:"Busca un territorio o comunidad",ux_year:"Año",ux_layer:"Capa de actividad",ux_historical:"Actividad histórica",ux_observed:"Actividad observada",ux_layers:"Capas del mapa",ux_close:"Cerrar",ux_territory:"Contexto territorial",ux_attention:"Zonas que requieren atención",ux_all_tables:"Todas las tablas territoriales",ux_years:"Elegir años de comparación",ux_neutral:"Sin anomalías observadas relevantes para el mes y registro disponible.",ux_above:"Sobre la referencia",ux_map_legend:"Claro → rojo: conteos típicos, 0 → 100+; anomalía: azul → rojo; gris: información insuficiente. No es probabilidad de incendio.",ux_summary:(m,v,d,n)=>`${m}: actividad típica de ${v} hotspots. Última observación completa: ${d}, ${n} hotspots.`,ux_play:"Reproducir",ux_pause:"Pausar",ux_annual:"Anual",ux_partial:"Periodo parcial — sin comparación anual completa",ux_total:"Hotspots armonizados",ux_typical:"Respecto a un año típico",ux_peak:"Celda más activa",ux_speed:"Velocidad"});

Object.assign(I18N.en,{ux_3d_intro:"Explore satellite detection counts through time. Columns show intensity, not physical fire spread. 2026 is a partial year (Jan–Oct).",ux_previous:"Previous year",ux_next:"Next year"});
Object.assign(I18N.es,{ux_3d_intro:"Explora conteos satelitales en el tiempo. Las columnas muestran intensidad, no propagación física del fuego. 2026 es un año parcial (ene–oct).",ux_previous:"Año anterior",ux_next:"Año siguiente"});

Object.assign(I18N.en,{nx_details:"View Details",nx_history:"View History",nx_back:"Back to summary",nx_granularity:"Compare by",nx_month:"Month",nx_day:"Day",nx_week:"Week",nx_reference_day:"Reference day",nx_selected:"Selected period",nx_estimated:"Reconstructed activity",nx_normal:"Normal",nx_unusual:"Unusual Activity",nx_exceptional:"Exceptional Activity",nx_insufficient:"Insufficient Data",nx_text_normal:"Activity is within the usual range for this season.",nx_text_unusual:"Activity is higher than usual for this season.",nx_text_exceptional:"Activity is exceptional relative to this record. Verify the area.",nx_text_insufficient:"There is not enough complete comparable data to classify this period.",nx_latest:(d,n,u)=>`Latest complete observed period: ${d} · ${n} hotspots. Data updated through ${u}.`,nx_science:"Source and statistical details",nx_sector:"Most Active Sector",nx_sector_metric:"Sector criterion",nx_no_sector:"No positive observed sector can be identified with the available spatial precision.",nx_sector_precision:"Approximate sector: only whole cells inside the available display boundary, with a conservative margin. Original polygons remain unavailable; this is not verified fire location or risk.",nx_on_map:"View on Map",nx_no_daily:"Daily/weekly comparisons are unavailable for this territory. Original polygons are needed for a verified spatial aggregation. Monthly comparison remains available.",nx_daily_coverage:(a,b)=>`Observed reference record: ${a}–${b}. The last day is excluded as potentially incomplete. Zero means no reference detections recorded, not proof of satellite visibility.`,nx_observed_source:"Observed S-NPP / calibrated NOAA-20",nx_history_note:"Full monthly record. Outlined column: selected month. Dark outline: selected period. Missing months are grey; white dots mean zero.",nx_details_note:"Compare the selected month across chosen years. Month values use one fixed count scale across locations; 100+ saturates the darkest red.",nx_week_alignment:"Weeks are fixed calendar-month blocks: 1–7, 8–14, 15–21, 22–28, 29–month-end. The final block may be shorter. These are not ISO week numbers and never cross month/year boundaries.",nx_fire_activity:"Fire Activity",nx_grey:"Grey: missing"});
Object.assign(I18N.es,{nx_details:"Ver detalles",nx_history:"Ver historial",nx_back:"Volver al resumen",nx_granularity:"Comparar por",nx_month:"Mes",nx_day:"Día",nx_week:"Semana",nx_reference_day:"Día de referencia",nx_selected:"Periodo seleccionado",nx_estimated:"Actividad reconstruida",nx_normal:"Normal",nx_unusual:"Actividad inusual",nx_exceptional:"Actividad excepcional",nx_insufficient:"Datos insuficientes",nx_text_normal:"La actividad está dentro de lo habitual para esta época.",nx_text_unusual:"Se registra más actividad de la habitual para esta época.",nx_text_exceptional:"Actividad excepcional respecto al registro. Conviene verificar la zona.",nx_text_insufficient:"No hay suficientes datos completos y comparables para clasificar este periodo.",nx_latest:(d,n,u)=>`Último periodo observado completo: ${d} · ${n} hotspots. Datos actualizados hasta ${u}.`,nx_science:"Fuente y detalles estadísticos",nx_sector:"Sector con mayor actividad",nx_sector_metric:"Criterio del sector",nx_no_sector:"No se identifica un sector con actividad observada positiva con la precisión espacial disponible.",nx_sector_precision:"Sector aproximado: solo celdas completas contenidas en el contorno disponible, con margen conservador. Faltan los polígonos originales; no representa una ubicación de incendio ni riesgo verificados.",nx_on_map:"Ver en el mapa",nx_no_daily:"Comparaciones diarias/semanales no disponibles para este territorio. Se requieren los polígonos originales para una agregación espacial verificada. La comparación mensual sigue disponible.",nx_daily_coverage:(a,b)=>`Registro observado de referencia: ${a}–${b}. Se excluye el último día por posible incompletitud. Cero significa ausencia registrada de detecciones, no prueba de visibilidad satelital.`,nx_observed_source:"S-NPP observado / NOAA-20 calibrado",nx_history_note:"Historial mensual completo. Columna delineada: mes seleccionado. Borde oscuro: periodo seleccionado. Gris: mes faltante; punto blanco: cero.",nx_details_note:"Compara el mes seleccionado en los años elegidos. La escala de conteos es fija entre ubicaciones; 100 o más alcanza el rojo más oscuro.",nx_week_alignment:"Semanas por bloques del mes: 1–7, 8–14, 15–21, 22–28, 29–fin de mes. El último bloque puede ser más corto. No son semanas ISO y nunca atraviesan límites de mes/año.",nx_fire_activity:"Actividad de fuego",nx_grey:"Gris: dato faltante"});

I18N.en.nx_precision='Spatial precision';I18N.es.nx_precision='Precisión espacial';

I18N.en.nx_region_approx='Approximate regional totals by grid-cell center.';I18N.es.nx_region_approx='Totales regionales aproximados por centro de celda.';

I18N.en.ob_daily='Daily and weekly observed comparisons are available for Peru and grid cells in View Details. Verified territorial daily aggregates still require the original boundaries.';I18N.es.ob_daily='Las comparaciones diarias y semanales observadas están disponibles para Perú y celdas en Ver detalles. Los agregados territoriales diarios verificados aún requieren los límites originales.';

I18N.en.nx_details_note='Compare the selected month across chosen years. All locations use a single logarithmic count scale up to the actual maximum of the harmonized record.';I18N.es.nx_details_note='Compara el mes seleccionado en los años elegidos. Todas las ubicaciones usan una escala logarítmica común hasta el máximo real del registro armonizado.';

I18N.en.nx_sector='Most Active Sector · approximate';I18N.es.nx_sector='Sector con mayor actividad · aproximado';

Object.assign(I18N.en,{ui_data_method:'Data, source and methodology',ui_details_hint:'Compare selected years',ui_history_hint:'See the complete monthly record',nx_back:'Close analysis',nx_sector:'Most active sector',nx_precision:'Spatial precision · approximate',nx_no_sector:'No observed sector can be identified with sufficient precision.'});
Object.assign(I18N.es,{ui_data_method:'Datos, fuente y metodología',ui_details_hint:'Compara los años que elijas',ui_history_hint:'Explora todo el registro mensual',nx_back:'Cerrar análisis',nx_sector:'Sector con mayor actividad',nx_precision:'Precisión espacial · aproximada',nx_no_sector:'No se identifica un sector observado con precisión suficiente.'});

Object.assign(I18N.en,{ui_daily_unavailable:'Monthly comparison available. Daily/weekly coverage is not exported for this territory.',ui_daily_record:(a,b)=>`Observed daily record: ${a}–${b}. Latest day excluded.`});
Object.assign(I18N.es,{ui_daily_unavailable:'Comparación mensual disponible. Este territorio no tiene exportación diaria/semanal.',ui_daily_record:(a,b)=>`Registro diario observado: ${a}–${b}. Se excluye el último día.`});

I18N.en.ui_month_summary='Monthly context';I18N.es.ui_month_summary='Contexto mensual';

Object.assign(I18N.en,{ui_compare_view:'Period comparison',ui_full_history:'Complete monthly history'});
Object.assign(I18N.es,{ui_compare_view:'Comparación de periodos',ui_full_history:'Historial mensual completo'});

Object.assign(I18N.en,{x3_count:"Hotspots",x3_anom:"vs typical",x3_leg_anom:"Period vs typical (median of other years)",x3_la:["÷4 less","typical","×4 more"],x3_leg_area:"Protected areas (SERNANP)",x3_leg_buf:"Communal Reserve buffer zones",x3_typ:"Typical (median of other years)",x3_vs:"vs typical",x3_area:"VIIRS hotspots/yr inside",x3_2024:"2024 vs typical",x3_few:"Almost no fire inside: see its buffer zone",x3_peru:"Peru",x3_andes:"Andes & Amazon"});
Object.assign(I18N.es,{x3_count:"Focos",x3_anom:"vs típico",x3_leg_anom:"Periodo vs típico (mediana de los otros años)",x3_la:["÷4 menos","típico","×4 más"],x3_leg_area:"Áreas protegidas (SERNANP)",x3_leg_buf:"Zonas de amortiguamiento de Reservas Comunales",x3_typ:"Típico (mediana de los otros años)",x3_vs:"vs típico",x3_area:"Focos VIIRS/año dentro",x3_2024:"2024 vs típico",x3_few:"Casi no hay fuego dentro: mira su zona de amortiguamiento",x3_peru:"Perú",x3_andes:"Andes y Amazonía"});
Object.assign(I18N.en,{x3_leg_count:"Hotspots per cell (satellite fire detections)",x3_leg_anom:"Red = more hotspots than usual for that cell",x3_note:"Colors count satellite fire detections. They are not temperature or an infrared index.",x3_amz:"Amazon",x3_all:"All Peru",x3_cols:"Columns",x3_heat:"Smooth",x3_both:"Both",x3_leg_az:"Amazon (approximate limit)",x3_leg_al:"Alert: ≥2× its typical fire",x3_al1:"Alert: at least 2× its typical fire",x3_al2:"Extreme: at least 4× its typical fire",x3_out:"Outside the Amazon: often agricultural or pasture burning.",
x3_alert:(n,x,f)=>`⚠ <b>${n}</b> cells${f?" in the Amazon":""} with at least 2× their typical fire${x?` (<b>${x}</b> extreme, ≥4×)`:""}. Click to go to them.`,x3_alert_none:f=>`No cells${f?" in the Amazon":""} with at least 2× their typical fire in this period.`,x3_alert_partial:"Partial period: no alerts (it can't be compared with complete years)."});
Object.assign(I18N.es,{x3_leg_count:"Focos por celda (detecciones satelitales de fuego)",x3_leg_anom:"Rojo = más focos de lo normal para esa celda",x3_note:"Los colores cuentan detecciones satelitales de fuego. No son temperatura ni un índice infrarrojo.",x3_amz:"Amazonía",x3_all:"Todo el Perú",x3_cols:"Columnas",x3_heat:"Suavizado",x3_both:"Ambos",x3_leg_az:"Amazonía (límite aproximado)",x3_leg_al:"Alerta: ≥2× su fuego típico",x3_al1:"Alerta: al menos 2× su fuego típico",x3_al2:"Extremo: al menos 4× su fuego típico",x3_out:"Fuera de la Amazonía: a menudo quemas agrícolas o de pastos.",
x3_alert:(n,x,f)=>`⚠ <b>${n}</b> celdas${f?" de la Amazonía":""} con al menos 2× su fuego típico${x?` (<b>${x}</b> extremas, ≥4×)`:""}. Haz clic para ir a ellas.`,x3_alert_none:f=>`Ninguna celda${f?" de la Amazonía":""} con al menos 2× su fuego típico en este periodo.`,x3_alert_partial:"Periodo parcial: sin alertas (no se puede comparar con años completos)."});
Object.assign(I18N.en,{ux_map_legend:"Colors count satellite fire detections (hotspots), not temperature. Pale → red: 0 → 100+ hotspots; anomaly: blue = less than usual, red = more than usual; grey: insufficient data. Not a fire probability."});
Object.assign(I18N.es,{ux_map_legend:"Los colores cuentan detecciones satelitales de fuego (focos), no temperatura. Claro → rojo: 0 → 100+ focos; anomalía: azul = menos de lo normal, rojo = más de lo normal; gris: información insuficiente. No es probabilidad de incendio."});
// Compact territorial card (territory.js)
Object.assign(I18N.en,{tc_months:["January","February","March","April","May","June","July","August","September","October","November","December"],
tc_cell_title:"25 km grid cell",tc_buffer:"Buffer zone",tc_cell:"Grid cell (0.25°)",tc_region:"Department",tc_country:"Country",tc_inside_reserve:"Inside the reserve",tc_inside_area:"Inside the protected area",
tc_nodata:"No data",tc_hotspots:n=>Math.round(n)===1?"hotspot":"hotspots",tc_status:"Status",tc_pair_note:"Inside and buffer zone are counted separately; they are different areas and are not added together.",
tc_period_activity:"Activity in the period",tc_estimated:"Estimated (reconstructed from MODIS)",tc_overlap:n=>`This cell overlaps ${n}. Its count is the cell's own and is not mixed with the protected area.`,
tc_where_buffer:"in the buffer zone",tc_where_cell:"in this 25 km cell",tc_where_region:n=>`in ${n}`,tc_where_country:"in Peru",
tc_text:o=>{if(o.value==null)return `There is no data for ${o.period} ${o.where}.`;const n=Math.round(o.n);let s=n===0?`In ${o.period}, no hotspots were detected ${o.where}.`:`In ${o.period}, ${o.estimated?"an estimated ":""}${o.value} hotspot${n===1?" was":"s were"} detected ${o.where}${o.estimated?" (reconstructed from MODIS)":""}.`;const m=o.median!=null?` (typical for this month: ${o.median})`:"";
 return s+(o.incomplete?" The month is not complete yet, so it cannot be compared.":o.state==="insufficient"?" There is not enough comparable history to say whether this is usual.":o.state==="normal"?` This is within the usual range for this month${m}.`:o.state==="unusual"?` This is unusual for this time of year${m}.`:` This is exceptional for this time of year${m}; it is worth reviewing where the detections are.`);},
tc_hotspot_def:"A hotspot is a satellite fire detection, not a confirmed or separate fire.",tc_history:"View history",tc_info:"Territory information",tc_surface:"Surface",tc_department:"Department",tc_departments:"Departments",tc_cells:"Grid cells",
tc_coords:"Reference coordinates (cell centre)",tc_communities:"Related native communities",tc_peoples:"Related Indigenous peoples",tc_source:"Boundary source",tc_src_cell:"OrbitaFire 0.25° grid (≈25 km)",tc_src_region:"geoBoundaries (department boundaries)",tc_src_area:"SERNANP (protected areas, buffer zones and native communities)",
tc_relation_note:"Communities and peoples are listed by location only. This is not evidence of damage or of exposure to a fire.",p_none:"None recorded."});
Object.assign(I18N.es,{tc_months:["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"],
tc_cell_title:"Celda de 25 km",tc_buffer:"Zona de amortiguamiento",tc_cell:"Celda (0,25°)",tc_region:"Departamento",tc_country:"País",tc_inside_reserve:"Dentro de la reserva",tc_inside_area:"Dentro del área protegida",
tc_nodata:"Sin datos",tc_hotspots:n=>Math.round(n)===1?"punto de calor":"puntos de calor",tc_status:"Estado",tc_pair_note:"El interior y la zona de amortiguamiento se cuentan por separado; son superficies distintas y no se suman.",
tc_period_activity:"Actividad del periodo",tc_estimated:"Estimado (reconstruido desde MODIS)",tc_overlap:n=>`Esta celda se superpone con ${n}. Su conteo es el de la celda y no se mezcla con el del área protegida.`,
tc_where_buffer:"en la zona de amortiguamiento",tc_where_cell:"en esta celda de 25 km",tc_where_region:n=>`en ${n}`,tc_where_country:"en el Perú",
tc_text:o=>{if(o.value==null)return `No hay datos para ${o.period} ${o.where}.`;const n=Math.round(o.n);let s=n===0?`En ${o.period} no se detectaron puntos de calor ${o.where}.`:`En ${o.period} ${o.estimated?(n===1?"se estima":"se estiman"):(n===1?"se detectó":"se detectaron")} ${o.value} punto${n===1?"":"s"} de calor ${o.where}${o.estimated?" (reconstruido desde MODIS)":""}.`;const m=o.median!=null?` (lo típico en este mes: ${o.median})`:"";
 return s+(o.incomplete?" El mes aún no está completo, así que no se puede comparar.":o.state==="insufficient"?" No hay suficiente historial comparable para saber si es habitual.":o.state==="normal"?` Está dentro de lo habitual para este mes${m}.`:o.state==="unusual"?` Es una actividad poco habitual para esta época${m}.`:` Es una actividad excepcional para esta época${m}; conviene revisar dónde están las detecciones.`);},
tc_hotspot_def:"Un punto de calor es una detección satelital de fuego, no un incendio confirmado ni distinto.",tc_history:"Ver historial",tc_info:"Información del territorio",tc_surface:"Superficie",tc_department:"Departamento",tc_departments:"Departamentos",tc_cells:"Celdas",
tc_coords:"Coordenadas de referencia (centro de celda)",tc_communities:"Comunidades nativas relacionadas",tc_peoples:"Pueblos indígenas relacionados",tc_source:"Fuente de los límites",tc_src_cell:"Grilla OrbitaFire de 0,25° (≈25 km)",tc_src_region:"geoBoundaries (límites departamentales)",tc_src_area:"SERNANP (áreas protegidas, zonas de amortiguamiento y comunidades nativas)",
tc_relation_note:"Las comunidades y pueblos se listan solo por ubicación. No es evidencia de daños ni de exposición a un incendio.",p_none:"Ninguna registrada."});
Object.assign(I18N.en,{lv_title:"Hotspots per cell in the month",lv_none:"No detections",lv_low:"Low",lv_mod:"Moderate",lv_high:"High",lv_vhigh:"Very high",lv_ext:"Extreme",lv_missing:"Missing or insufficient data",lv_anom_help:"Blue = less than usual · Red = more than usual for that cell (robust z, not a count)."});
Object.assign(I18N.es,{lv_title:"Puntos de calor por celda en el mes",lv_none:"Sin detecciones",lv_low:"Baja",lv_mod:"Moderada",lv_high:"Alta",lv_vhigh:"Muy alta",lv_ext:"Extrema",lv_missing:"Datos faltantes o insuficientes",lv_anom_help:"Azul = menos de lo normal · Rojo = más de lo normal para esa celda (z robusto, no es un conteo)."});
Object.assign(I18N.en,{tc_badge_normal:"Normal",tc_badge_unusual:"Unusual",tc_badge_exceptional:"Exceptional",tc_badge_insufficient:"Not comparable",tc_period:(m,y)=>`${m} ${y}`,
tc_desc_reserve:"Protected area delimited by SERNANP.",tc_desc_area:"Protected area delimited by SERNANP.",tc_desc_buffer:"Area around the reserve that helps protect it from outside impacts.",tc_desc_cell:"Square of about 25 × 25 km used to group the detections.",tc_desc_region:"Department (approximate total by grid-cell centre).",tc_desc_country:"All of Peru.",
tc_reading:o=>{if(o.incomplete)return "The month is not over yet, so it cannot be compared.";const base=o.median!=null?`For ${o.month} it is usual to record ${o.median} ${Math.round(o.medianN)===1?"hotspot":"hotspots"}. `:"";
 return base+(o.state==="exceptional"?"This activity is much higher than normal and should be checked.":o.state==="unusual"?"This activity is higher than normal.":o.state==="normal"?"This activity is within the normal range.":"There is not enough history to compare it.")+(o.estimated?" (Estimated from MODIS.)":"");},
tc_hotspot_def:"These detections indicate possible fire activity, but they are not confirmed fires."});
Object.assign(I18N.es,{tc_badge_normal:"Normal",tc_badge_unusual:"Inusual",tc_badge_exceptional:"Excepcional",tc_badge_insufficient:"Sin comparación",tc_period:(m,y)=>`${m[0].toUpperCase()+m.slice(1)} de ${y}`,
tc_desc_reserve:"Área protegida delimitada por SERNANP.",tc_desc_area:"Área protegida delimitada por SERNANP.",tc_desc_buffer:"Área alrededor de la reserva que ayuda a protegerla de impactos externos.",tc_desc_cell:"Cuadrícula de unos 25 × 25 km que agrupa las detecciones.",tc_desc_region:"Departamento (total aproximado por centro de celda).",tc_desc_country:"Todo el Perú.",
tc_reading:o=>{if(o.incomplete)return "El mes aún no termina, así que todavía no se puede comparar.";const base=o.median!=null?`Lo habitual para ${o.month} es registrar ${o.median} ${Math.round(o.medianN)===1?"punto":"puntos"} de calor. `:"";
 return base+(o.state==="exceptional"?"Esta actividad es mucho mayor de lo normal y conviene verificarla.":o.state==="unusual"?"Esta actividad es mayor de lo normal.":o.state==="normal"?"Esta actividad está dentro de lo normal.":"No hay suficiente historial para compararla.")+(o.estimated?" (Estimado a partir de MODIS.)":"");},
tc_hotspot_def:"Estas detecciones indican posible actividad de fuego, pero no equivalen a incendios confirmados."});
Object.assign(I18N.es,{fc_h:"Calendario de actividad de incendios"});
// Landing (home) copy
Object.assign(I18N.en,{lp_eyebrow:"NASA SPACE APPS CHALLENGE 2026 · PERU",lp_tagline:"Know the past to protect the future.",
lp_lead:"We analyze 25 years of satellite observations to identify critical seasons, detect unusual activity and support the monitoring of Peru's forests.",
lp_users_h:"Satellite technology for those who protect our forests",
lp_users:"OrbitaFire is designed to support park rangers, community brigades and forest monitoring teams in Peru, making it easier to identify areas with unusual fire activity and to plan ahead.",
lp_b1_t:"See where to pay attention",lp_b1:"Explore protected areas and spot sectors with high fire activity.",
lp_b2_t:"Anticipate critical seasons",lp_b2:"Find out in which months fire activity has historically concentrated.",
lp_b3_t:"Recognize unusual activity",lp_b3:"Compare current detections with past records and find areas that deserve checking."});
Object.assign(I18N.es,{lp_eyebrow:"NASA SPACE APPS CHALLENGE 2026 · PERÚ",lp_tagline:"Conocer el pasado para proteger el futuro.",
lp_lead:"Analizamos 25 años de observaciones satelitales para identificar temporadas críticas, detectar actividad inusual y apoyar la vigilancia de los bosques del Perú.",
lp_users_h:"Tecnología satelital al servicio de quienes protegen nuestros bosques",
lp_users:"OrbitaFire está diseñado para apoyar a guardaparques, brigadas comunitarias y responsables de vigilancia forestal en el Perú, facilitando la identificación de zonas con actividad de fuego inusual y la planificación preventiva.",
lp_b1_t:"Identifica dónde prestar atención",lp_b1:"Explora reservas naturales y reconoce sectores con actividad de fuego elevada.",
lp_b2_t:"Anticipa temporadas críticas",lp_b2:"Descubre en qué meses se concentra históricamente la actividad de fuego.",
lp_b3_t:"Reconoce actividad fuera de lo habitual",lp_b3:"Compara las detecciones actuales con registros anteriores y localiza zonas que merecen verificación."});
// Right layer panel (2D map)
Object.assign(I18N.en,{ly_title:"Layers",ly_points_h:"Fire hotspots",ly_points:"Show individual hotspots",ly_1d:"Last day",ly_7d:"7 days",ly_30d:"30 days",ly_points_note:"Most recent detections in our record (last 30 days).",ly_count:(n,p)=>`${n} hotspots · ${p}`,
ly_cells_h:"Activity by cell",ly_cells:"Colored 25 km cells",ly_terr_h:"Territory",ly_base_h:"Background",ly_sat:"Satellite (NASA Blue Marble)",ly_osm:"Streets (OpenStreetMap)",ly_none:"No background"});
Object.assign(I18N.es,{ly_title:"Capas",ly_points_h:"Focos de calor",ly_points:"Mostrar focos individuales",ly_1d:"Último día",ly_7d:"7 días",ly_30d:"30 días",ly_points_note:"Detecciones más recientes de nuestro registro (últimos 30 días).",ly_count:(n,p)=>`${n} focos · ${p}`,
ly_cells_h:"Actividad por celda",ly_cells:"Celdas de 25 km coloreadas",ly_terr_h:"Territorio",ly_base_h:"Fondo",ly_sat:"Satélite (NASA Blue Marble)",ly_osm:"Calles (OpenStreetMap)",ly_none:"Sin fondo"});
// 3D: plain-language labels (team request: each control says what it does)
Object.assign(I18N.en,{ux_3d_intro:"Each column is a 25 km zone. The taller and redder it is, the more fire hotspots it had. 2026 only covers Jan–Oct.",
x3_lbl_show:"What to show",x3_lbl_area:"Where",x3_lbl_view:"How to draw it",x3_count:"Number of hotspots",x3_anom:"Compared with normal",x3_amz:"Amazon only",x3_all:"All Peru",x3_cols:"3D columns",x3_heat:"Heat patches",x3_both:"Both",
x3_tip_count:"Height and color = how many hotspots each zone had",x3_tip_anom:"Red = more fire than usual for that zone, blue = less",x3_tip_amz:"Grey out the coast and the Andes",x3_tip_all:"Show every zone in Peru",x3_tip_cols:"One column per 25 km zone",x3_tip_heat:"Smooth patches instead of columns",x3_tip_both:"Columns with the patches underneath",
x3_leg_count:"Hotspots per zone in the period",x3_leg_anom:"Red = more hotspots than usual for that zone",x3_la:["4× less","normal","4× more"],x3_leg_buf:"Communal Reserve buffer zones",x3_leg_az:"Amazon boundary (approximate)",x3_leg_al:"Alert: twice its normal fire or more",
x3_alert:(n,x,f)=>`⚠ <b>${n}</b> zones${f?" in the Amazon":""} have twice their normal fire or more${x?` (<b>${x}</b> with 4 times or more)`:""}. Click to see them.`,x3_alert_none:f=>`No zone${f?" in the Amazon":""} has twice its normal fire in this period.`,x3_alert_partial:"Incomplete period: no alerts, because it can't be compared with full years.",
x3_stats:(n,r,c,m)=>`Total hotspots${m?" in "+m:" in the year"}: ${n}${r?` · ${r} times a normal ${m?"month":"year"}`:""} · Zone with most fire: ${c}`});
Object.assign(I18N.es,{ux_3d_intro:"Cada columna es una zona de 25 km. Mientras más alta y roja, más focos de calor tuvo. 2026 solo llega hasta octubre.",
x3_lbl_show:"Qué mostrar",x3_lbl_area:"Dónde",x3_lbl_view:"Cómo dibujarlo",x3_count:"Cantidad de focos",x3_anom:"Comparado con lo normal",x3_amz:"Solo Amazonía",x3_all:"Todo el Perú",x3_cols:"Columnas 3D",x3_heat:"Manchas de calor",x3_both:"Ambos",
x3_tip_count:"Altura y color = cuántos focos tuvo cada zona",x3_tip_anom:"Rojo = más fuego de lo normal para esa zona, azul = menos",x3_tip_amz:"Atenúa la costa y la sierra",x3_tip_all:"Muestra todas las zonas del Perú",x3_tip_cols:"Una columna por cada zona de 25 km",x3_tip_heat:"Manchas suaves en lugar de columnas",x3_tip_both:"Columnas con las manchas debajo",
x3_leg_count:"Focos por zona en el periodo",x3_leg_anom:"Rojo = más focos de lo normal para esa zona",x3_la:["4 veces menos","normal","4 veces más"],x3_leg_buf:"Zonas de amortiguamiento de las Reservas Comunales",x3_leg_az:"Límite de la Amazonía (aproximado)",x3_leg_al:"Alerta: el doble o más de su fuego normal",
x3_alert:(n,x,f)=>`⚠ <b>${n}</b> zonas${f?" de la Amazonía":""} tienen el doble o más de su fuego normal${x?` (<b>${x}</b> con 4 veces o más)`:""}. Haz clic para verlas.`,x3_alert_none:f=>`Ninguna zona${f?" de la Amazonía":""} tiene el doble de su fuego normal en este periodo.`,x3_alert_partial:"Periodo incompleto: sin alertas, porque no se puede comparar con años completos.",
x3_stats:(n,r,c,m)=>`Focos en total${m?" en "+m:" en el año"}: ${n}${r?` · ${r} veces un ${m?"mes":"año"} normal`:""} · Zona con más fuego: ${c}`});
// How-to guide (About tab)
Object.assign(I18N.en,{ux_about:"How to use",gd_h:"How to use OrbitaFire",gd_lead:"OrbitaFire shows where and when Peru has more fire than usual, using 25 years of NASA satellites. Six steps:",
gd_s1_t:"1. Pick the month and year.",gd_s1:"In Control, choose them at the top. Each square on the map is a zone of about 25 km; its color shows how many fire hotspots it had, from yellow (few) to purple (very many).",
gd_s2_t:"2. Choose what the colors mean.",gd_s2:"In “Activity layer”: Historical = what is normal for that month; Observed = what happened that month and year; Anomalies = red if there was more fire than usual, blue if less.",
gd_s3_t:"3. Choose a place.",gd_s3:"Type the name of a reserve or community, or click on the map. On the right you will see its hotspots and its status: Normal, Unusual or Exceptional.",
gd_s4_t:"4. Open “View details”.",gd_s4:"You will see the reserve and its buffer zone separately, and the Fire Activity Calendar to compare the same month across years.",
gd_s5_t:"5. Check what needs attention.",gd_s5:"Bottom left: “Areas requiring attention” lists places with unusual activity. The “Territory” panel on the right turns protected areas, buffer zones and communities on or off.",
gd_s6_t:"6. Travel through time in 3D.",gd_s6:"In “Historical Explorer”, move the year bar or press Play to see 25 years of fire. Zones outlined in red have at least twice their normal fire.",
gd_note_t:"Keep in mind: ",gd_note:"a hotspot is a satellite detection, not a confirmed fire. Values before 2012 are estimated from MODIS. Data up to 12 November 2026.",gd_go:"Go to the map",gd_method:"Data, method and validation (for reviewers)"});
Object.assign(I18N.es,{ux_about:"Cómo usar",gd_h:"Cómo usar OrbitaFire",gd_lead:"OrbitaFire muestra dónde y cuándo hay más fuego de lo normal en el Perú, usando 25 años de satélites de la NASA. Seis pasos:",
gd_s1_t:"1. Elige el mes y el año.",gd_s1:"En Control, arriba. Cada cuadro del mapa es una zona de unos 25 km; su color indica cuántos focos de calor tuvo, de amarillo (pocos) a morado (muchísimos).",
gd_s2_t:"2. Elige qué significan los colores.",gd_s2:"En “Capa de actividad”: Histórica = lo normal para ese mes; Observada = lo que pasó ese mes y año; Anomalías = rojo si hubo más fuego de lo habitual, azul si menos.",
gd_s3_t:"3. Elige un lugar.",gd_s3:"Escribe el nombre de una reserva o comunidad, o haz clic en el mapa. A la derecha verás sus focos y su estado: Normal, Inusual o Excepcional.",
gd_s4_t:"4. Abre “Ver detalles”.",gd_s4:"Verás la reserva y su zona de amortiguamiento por separado, y el Calendario de actividad de incendios para comparar el mismo mes en otros años.",
gd_s5_t:"5. Revisa lo que requiere atención.",gd_s5:"Abajo a la izquierda, “Zonas que requieren atención” lista los lugares con actividad inusual. El panel “Territorio” de la derecha enciende o apaga áreas protegidas, zonas de amortiguamiento y comunidades.",
gd_s6_t:"6. Recorre el tiempo en 3D.",gd_s6:"En “Explorador histórico”, mueve la barra de años o pulsa Reproducir para ver 25 años de fuego. Las zonas con borde rojo tienen el doble o más de su fuego normal.",
gd_note_t:"Ten en cuenta: ",gd_note:"un foco de calor es una detección satelital, no un incendio confirmado. Los valores antes de 2012 son estimados a partir de MODIS. Datos hasta el 12 de noviembre de 2026.",gd_go:"Ir al mapa",gd_method:"Datos, método y validación (para evaluadores)"});
// Detailed how-to guide (team request)
Object.assign(I18N.es,{gd_lead:"OrbitaFire muestra dónde y cuándo hay más fuego de lo normal en el Perú. Une 25 años de dos satélites de la NASA (MODIS y VIIRS) en una sola serie comparable, para que guardaparques y comunidades sepan si su territorio está ardiendo más de lo habitual. La web tiene dos vistas: el mapa de Control y el Explorador histórico en 3D.",
gd2_h:"El mapa de Control",
gd_s1_t:"1. Elige el mes y el año",gd_s1:"Arriba del mapa están los selectores Mes y Año. Todo lo que ves (colores, alertas y la ficha de cada lugar) se calcula para ese periodo. Cada cuadro del mapa es una zona de unos 25 × 25 km. Su color indica cuántos focos de calor tuvo: sin color = ninguno, amarillo = pocos (menos de 5), naranja y rojo = muchos, morado = extremo (150 o más). La leyenda de abajo a la izquierda muestra los rangos.",
gd_s2_t:"2. Elige qué significan los colores",gd_s2:"En “Capa de actividad” hay tres opciones. Actividad histórica: lo que normalmente pasa en ese mes (no cambia con el año). Actividad observada: lo que realmente se detectó ese mes y año. Anomalías: compara ambas; rojo = más fuego de lo habitual para esa zona, azul = menos, blanco = normal. Las anomalías son las más útiles para saber dónde mirar.",
gd_s3_t:"3. Elige un lugar",gd_s3:"Escribe el nombre de una reserva, un departamento o una comunidad en el buscador, o haz clic directamente en el mapa. A la derecha aparece un resumen con los focos del periodo y su estado: Normal (dentro de lo habitual), Inusual (bastante más que lo habitual) o Excepcional (muchísimo más; conviene verificar).",
gd_s4_t:"4. Abre “Ver detalles”",gd_s4:"Muestra una ficha por zona: dentro de la reserva y su zona de amortiguamiento (el área de alrededor que la protege), cada una con sus focos, su estado y una frase como “lo habitual para octubre es 51 focos”. Debajo está el Calendario de actividad de incendios: cada fila es un año y cada columna un mes, así puedes comparar el mismo mes entre años. Cierra con el botón de arriba a la derecha.",
gd_s5_t:"5. Revisa lo que requiere atención",gd_s5:"Abajo a la izquierda, “Zonas que requieren atención” lista las áreas protegidas con actividad inusual o excepcional en el periodo; haz clic para ir a ellas. En el panel “Territorio” de la derecha puedes encender o apagar las áreas protegidas (borde verde), sus zonas de amortiguamiento (borde punteado) y las comunidades nativas (puntos morados).",
gd_s6_t:"6. Cambia de idioma",gd_s6:"El botón EN / ES de arriba a la derecha cambia toda la web entre inglés y español, incluido el 3D.",
gd3_h:"El Explorador histórico (3D)",gd3_lead:"Muestra 25 años de fuego sobre una imagen satelital de la Tierra. Cada columna es una zona de 25 km: mientras más alta y roja, más focos tuvo en el periodo. Arrastra para girar, rueda del mouse para acercar y clic derecho (o dos dedos) para inclinar.",
gd3_s1_t:"Barra de tiempo (abajo)",gd3_s1:"Mueve la barra o usa las flechas ← → para cambiar de año. “Reproducir” anima los años uno tras otro y 1× / 2× cambia la velocidad. En “Anual” puedes elegir un mes para ver solo ese mes de cada año.",
gd3_s2_t:"Qué mostrar",gd3_s2:"Cantidad de focos: altura y color según cuántos focos hubo. Comparado con lo normal: rojo si esa zona tuvo más fuego que en un año típico, azul si menos.",
gd3_s3_t:"Dónde",gd3_s3:"Solo Amazonía (por defecto) atenúa la costa y la sierra, donde muchos focos son quemas agrícolas o de pastos. Todo el Perú muestra todas las zonas.",
gd3_s4_t:"Cómo dibujarlo",gd3_s4:"Columnas 3D: una columna por zona. Manchas de calor: el fuego como manchas suaves, para ver regiones. Ambos: columnas con las manchas debajo.",
gd3_s5_t:"Alertas",gd3_s5:"El recuadro rojo dice cuántas zonas tienen el doble o más de su fuego normal en ese año; esas zonas se pintan en rojo intenso. Haz clic en el recuadro y el mapa vuela a ellas una por una. En años incompletos (como 2026) no hay alertas.",
gd3_s6_t:"Atajos y detalles",gd3_s6:"Los botones de la derecha vuelan a Perú, Amarakaeri, El Sira o a la vista de Andes y Amazonía. Pasa el mouse sobre una columna o una reserva para ver sus focos, y lo normal para comparar."});
Object.assign(I18N.en,{gd_lead:"OrbitaFire shows where and when Peru has more fire than usual. It joins 25 years from two NASA satellites (MODIS and VIIRS) into one comparable record, so park rangers and communities can tell whether their territory is burning more than usual. The site has two views: the Control map and the 3D Historical Explorer.",
gd2_h:"The Control map",
gd_s1_t:"1. Pick the month and year",gd_s1:"The Month and Year selectors are above the map. Everything you see (colors, alerts and each place's card) is computed for that period. Each square is a zone of about 25 × 25 km. Its color shows how many fire hotspots it had: no color = none, yellow = few (under 5), orange and red = many, purple = extreme (150 or more). The legend at the bottom left shows the ranges.",
gd_s2_t:"2. Choose what the colors mean",gd_s2:"“Activity layer” has three options. Historical activity: what normally happens in that month (it does not change with the year). Observed activity: what was actually detected that month and year. Anomalies: compares both; red = more fire than usual for that zone, blue = less, white = normal. Anomalies are the most useful to know where to look.",
gd_s3_t:"3. Choose a place",gd_s3:"Type the name of a reserve, department or community in the search box, or click on the map. A summary appears on the right with the period's hotspots and status: Normal (within the usual range), Unusual (well above usual) or Exceptional (far above usual; worth checking).",
gd_s4_t:"4. Open “View details”",gd_s4:"Shows one card per zone: inside the reserve and its buffer zone (the surrounding area that protects it), each with its hotspots, status and a sentence such as “usual for October is 51 hotspots”. Below is the Fire Activity Calendar: each row is a year and each column a month, so you can compare the same month across years. Close it with the button at the top right.",
gd_s5_t:"5. Check what needs attention",gd_s5:"Bottom left, “Areas requiring attention” lists protected areas with unusual or exceptional activity in the period; click to go to them. In the “Territory” panel on the right you can turn on or off protected areas (green outline), their buffer zones (dashed outline) and native communities (purple dots).",
gd_s6_t:"6. Change language",gd_s6:"The EN / ES button at the top right switches the whole site between English and Spanish, including the 3D view.",
gd3_h:"The Historical Explorer (3D)",gd3_lead:"Shows 25 years of fire over a satellite image of the Earth. Each column is a 25 km zone: the taller and redder, the more hotspots in the period. Drag to rotate, scroll to zoom and right-click (or two fingers) to tilt.",
gd3_s1_t:"Time bar (bottom)",gd3_s1:"Move the bar or use the ← → arrows to change year. “Play” animates the years one after another and 1× / 2× changes the speed. In “Annual” you can pick a month to see only that month of each year.",
gd3_s2_t:"What to show",gd3_s2:"Number of hotspots: height and color by how many hotspots there were. Compared with normal: red if that zone had more fire than in a typical year, blue if less.",
gd3_s3_t:"Where",gd3_s3:"Amazon only (default) dims the coast and the Andes, where many hotspots are agricultural or pasture burning. All Peru shows every zone.",
gd3_s4_t:"How to draw it",gd3_s4:"3D columns: one column per zone. Heat patches: fire as smooth patches, to see regions. Both: columns with the patches underneath.",
gd3_s5_t:"Alerts",gd3_s5:"The red box says how many zones have twice their normal fire or more that year; those zones are painted bright red. Click the box and the map flies to them one by one. Incomplete years (such as 2026) have no alerts.",
gd3_s6_t:"Shortcuts and details",gd3_s6:"The buttons on the right fly to Peru, Amarakaeri, El Sira or the Andes & Amazon view. Hover over a column or a reserve to see its hotspots and the usual value for comparison."});
