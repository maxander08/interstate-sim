/* ════════════════════════════════════════════════════════════════
   INTERSTATE GRID — traffic simulation console
   Theaters: CONUS (US interstate system, Census TIGER 2024)
             NUSANTARA (Indonesian toll roads, OpenStreetMap)
   Graph-based vehicle routing over ~21k segments
   ════════════════════════════════════════════════════════════════ */
(() => {
'use strict';

/* ── 0 · utils ──────────────────────────────────────────────── */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const $ = id => document.getElementById(id);
const fmtInt = n => Math.round(n).toLocaleString('en-US');
const pad2 = n => String(n).padStart(2, '0');

/* ── 1 · theaters ───────────────────────────────────────────── */
const CITIES_US_FALLBACK = [
  ['Seattle', -122.33, 47.61], ['Portland', -122.68, 45.52], ['San Francisco', -122.42, 37.77],
  ['Los Angeles', -118.24, 34.05], ['San Diego', -117.16, 32.72], ['Sacramento', -121.49, 38.58],
  ['Las Vegas', -115.14, 36.17], ['Phoenix', -112.07, 33.45], ['Tucson', -110.97, 32.22],
  ['El Paso', -106.49, 31.76], ['Salt Lake City', -111.89, 40.76], ['Boise', -116.2, 43.62],
  ['Denver', -104.99, 39.74], ['Billings', -108.5, 45.78], ['Fargo', -96.79, 46.88],
  ['Minneapolis', -93.27, 44.98], ['Des Moines', -93.61, 41.59], ['Omaha', -95.94, 41.26],
  ['Kansas City', -94.58, 39.1], ['St. Louis', -90.2, 38.63], ['Oklahoma City', -97.52, 35.47],
  ['Dallas', -96.8, 32.78], ['Fort Worth', -97.33, 32.76], ['Austin', -97.74, 30.27],
  ['San Antonio', -98.49, 29.42], ['Houston', -95.37, 29.76], ['New Orleans', -90.07, 29.95],
  ['Little Rock', -92.29, 34.75], ['Memphis', -90.05, 35.15], ['Jackson', -90.18, 32.3],
  ['Birmingham', -86.81, 33.52], ['Atlanta', -84.39, 33.75], ['Nashville', -86.78, 36.16],
  ['Louisville', -85.76, 38.25], ['Indianapolis', -86.16, 39.77], ['Chicago', -87.63, 41.88],
  ['Milwaukee', -87.91, 43.04], ['Detroit', -83.05, 42.33], ['Cleveland', -81.69, 41.5],
  ['Columbus', -83, 39.96], ['Cincinnati', -84.51, 39.1], ['Pittsburgh', -79.99, 40.44],
  ['Buffalo', -78.88, 42.89], ['Boston', -71.06, 42.36], ['New York', -74.01, 40.71],
  ['Philadelphia', -75.17, 39.95], ['Baltimore', -76.61, 39.29], ['Washington', -77.04, 38.9],
  ['Richmond', -77.44, 37.54], ['Charlotte', -80.84, 35.23], ['Raleigh', -78.64, 35.78],
  ['Columbia', -81.03, 34.0], ['Savannah', -81.1, 32.08], ['Jacksonville', -81.66, 30.33],
  ['Miami', -80.19, 25.76], ['Tampa', -82.46, 27.95], ['Orlando', -81.38, 28.54],
  ['Albuquerque', -106.65, 35.08], ['Providence', -71.41, 41.82], ['Hartford', -72.68, 41.76],
  ['Charleston', -81.63, 38.35], ['Huntsville', -86.59, 34.73], ['Mobile', -88.04, 30.69],
  ['Sioux Falls', -96.73, 43.55], ['Wichita', -97.34, 37.69], ['Topeka', -95.68, 39.05]
];

const THEATERS = {
  CONUS: {
    key: 'CONUS', net: NET, states: STATES,
    cities: (typeof CITIES_US2 !== 'undefined' && CITIES_US2) || (typeof CITIES_US !== 'undefined' && CITIES_US) || CITIES_US_FALLBACK,
    art: (typeof ARTERIALS_US !== 'undefined' && ARTERIALS_US) || null,
    hydro: (typeof HYDRO_US !== 'undefined' && HYDRO_US) || null,
    counties: (typeof COUNTIES_US !== 'undefined' && COUNTIES_US) || null,
    proj: { p1: 29.5, p2: 45.5, lat0: 38, lon0: -96 },
    grat: { lons: [-125, -65, 5], lats: [25, 50, 5] },
    sub: 'CONUS NETWORK · LIVE SIM', unit: 'MI', agency: 'FHWA', style: 'US',
    warn: 'ALASKA / HAWAII SECTORS EXCLUDED FROM THEATER',
    core: 'rgba(34,214,255,0.63)', glow: 'rgba(24,224,255,0.13)',
    labelCol: 'rgba(24,224,255,0.75)', labelTxt: '#aef3ff',
    tickMid: ['DENSITY RISING — URBAN CORRIDORS SATURATING', 'MERCURY UNITS HOLDING 62 MPH MEAN',
      'HEAVY VOLUME: I-95 / I-10 / I-5 CORRIDORS', 'RUSH PEAK IN PROGRESS — MONITORING']
  },
  NUSANTARA: {
    key: 'NUSANTARA', net: NET_ID,
    states: (typeof STATES_ID2 !== 'undefined' && STATES_ID2) || STATES_ID,
    cities: (typeof CITIES_ID3 !== 'undefined' && CITIES_ID3) || (typeof CITIES_ID2 !== 'undefined' && CITIES_ID2) || CITIES_ID,
    art: (typeof ARTERIALS_ID !== 'undefined' && ARTERIALS_ID) || null,
    hydro: (typeof HYDRO_ID !== 'undefined' && HYDRO_ID) || null,
    counties: (typeof REGENCIES_ID !== 'undefined' && REGENCIES_ID) || null,
    proj: { p1: -8, p2: 3, lat0: -2.5, lon0: 110.5 },
    grat: { lons: [90, 135, 5], lats: [-12, 8, 4] },
    sub: 'NUSANTARA ARCHIPELAGO · LIVE SIM', unit: 'KM', agency: 'BPJT', style: 'ID',
    warn: 'INTER-ISLAND FERRY LINKS EXCLUDED — MAINLINE TOLL ONLY',
    core: 'rgba(72,255,178,0.55)', glow: 'rgba(56,255,178,0.11)',
    labelCol: 'rgba(56,255,178,0.75)', labelTxt: '#beffd9',
    tickMid: ['DENSITY RISING — JAVA CORRIDORS SATURATING', 'GARUDA UNITS HOLDING 99 KM/H MEAN',
      'HEAVY VOLUME: TRANS JAWA / MERAK / TRANS SUMATRA', 'PEAK LOAD ON JAKARTA RING — MONITORING']
  }
};

/* mutable network state (rebuilt per theater) */
let NETW = null;
let N, E, ROUTES, NN = 0, NE = 0, NR = 0;
let lonN, latN, eA, eB, eR, eAux, eLen, adjStart, adjList, routeEdges;
let AN = 0, AC = 0, RHO0 = 0;
let wx, wy, sx, sy;
let WXMIN = 0, WXMAX = 0, WYMIN = 0, WYMAX = 0;
let STATES_W = [], routeAnchor = [], GRAT = [], CITIES_W = [];
let geoGrid = null, edgeLive = null;
let labelW = null, labelNum = null;   // cached route-shield text widths (per theater)
let HYDRO_W = { L: [], R: [] }, COUNTY_W = [], ART_W = [];

function albers(lon, lat) {
  const rho = Math.sqrt(Math.max(1e-9, AC - 2 * AN * Math.sin(lat * Math.PI / 180))) / AN;
  const th = AN * (lon * Math.PI / 180 - NETW._lon0);
  return [rho * Math.sin(th), RHO0 - rho * Math.cos(th)];
}
function albersInv(x, y) {
  const rho = Math.sqrt(x * x + (RHO0 - y) ** 2);
  const th = Math.atan2(x, RHO0 - y);
  const lat = Math.asin(clamp((AC - (rho * AN) ** 2) / (2 * AN), -1, 1)) * 180 / Math.PI;
  return [NETW._lon0d + th / AN * 180 / Math.PI, lat];
}
function buildTheater(key) {
  const T = THEATERS[key]; NETW = T;
  const P = T.proj;
  const phi1 = P.p1 * Math.PI / 180, phi2 = P.p2 * Math.PI / 180;
  AN = 0.5 * (Math.sin(phi1) + Math.sin(phi2));
  AC = Math.cos(phi1) ** 2 + 2 * AN * Math.sin(phi1);
  RHO0 = Math.sqrt(AC - 2 * AN * Math.sin(P.lat0 * Math.PI / 180)) / AN;
  T._lon0 = P.lon0 * Math.PI / 180; T._lon0d = P.lon0;

  const net = T.net;
  N = net.NODES; E = net.EDGES; ROUTES = net.ROUTES;
  NN = N.length; NE = E.length; NR = ROUTES.length;
  lonN = new Float64Array(NN); latN = new Float64Array(NN);
  for (let i = 0; i < NN; i++) { lonN[i] = N[i][0] / 1e4; latN[i] = N[i][1] / 1e4; }
  eA = new Int32Array(NE); eB = new Int32Array(NE); eR = new Int32Array(NE);
  eAux = new Uint8Array(NE); eLen = new Float32Array(NE);
  for (let i = 0; i < NE; i++) {
    const a = E[i][0], b = E[i][1], r = E[i][2];
    eA[i] = a; eB[i] = b; eR[i] = r;
    eAux[i] = ROUTES[r].aux;
    eLen[i] = Math.max(0.005, hav(lonN[a], latN[a], lonN[b], latN[b]));
  }
  const deg = new Int32Array(NN + 1);
  for (let i = 0; i < NE; i++) { deg[eA[i]]++; deg[eB[i]]++; }
  adjStart = new Int32Array(NN + 1);
  for (let i = 0; i < NN; i++) adjStart[i + 1] = adjStart[i] + deg[i];
  adjList = new Int32Array(adjStart[NN]);
  const cur = adjStart.slice();
  for (let i = 0; i < NE; i++) { adjList[cur[eA[i]]++] = i; adjList[cur[eB[i]]++] = i; }
  routeEdges = Array.from({ length: NR }, () => []);
  for (let i = 0; i < NE; i++) routeEdges[eR[i]].push(i);
  /* degree-space grid for snapping live feed segments to edges */
  edgeLive = new Float32Array(NE);
  geoGrid = new Map();
  for (let i = 0; i < NE; i++) {
    const ax = lonN[eA[i]], ay = latN[eA[i]], bx = lonN[eB[i]], by = latN[eB[i]];
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 0.04));
    for (let s = 0; s <= steps; s++) {
      const gx = Math.floor((ax + (bx - ax) * s / steps) / 0.05);
      const gy = Math.floor((ay + (by - ay) * s / steps) / 0.05);
      const k = gx + gy * 10000;
      let arr = geoGrid.get(k); if (!arr) geoGrid.set(k, arr = []);
      if (arr[arr.length - 1] !== i) arr.push(i);
    }
  }

  wx = new Float32Array(NN); wy = new Float32Array(NN);
  sx = new Float32Array(NN); sy = new Float32Array(NN);
  WXMIN = 9; WXMAX = -9; WYMIN = 9; WYMAX = -9;
  for (let i = 0; i < NN; i++) {
    const p = albers(lonN[i], latN[i]); wx[i] = p[0]; wy[i] = p[1];
    if (p[0] < WXMIN) WXMIN = p[0]; if (p[0] > WXMAX) WXMAX = p[0];
    if (p[1] < WYMIN) WYMIN = p[1]; if (p[1] > WYMAX) WYMAX = p[1];
  }
  STATES_W = T.states.map(s => ({
    n: s.n,
    r: s.r.map(ring => {
      const a = new Float32Array(ring.length * 2);
      for (let i = 0; i < ring.length; i++) {
        const p = albers(ring[i][0], ring[i][1]);
        a[i * 2] = p[0]; a[i * 2 + 1] = p[1];
      }
      return [a, bboxOf(a)];
    })
  }));
  routeAnchor = ROUTES.map(r => {
    const b = r.b, p = albers((b[0] + b[2]) / 2, (b[1] + b[3]) / 2);
    return { x: p[0], y: p[1] };
  });
  /* backdrop world coords (data stored as deg*1e3 ints) */
  const toWF = pts => Float32Array.from(pts.flatMap(p => albers(p[0] / 1e3, p[1] / 1e3)));
  HYDRO_W = { L: [], R: [] };
  if (T.hydro) {
    for (const ring of T.hydro.L) { const a = toWF(ring); HYDRO_W.L.push([a, bboxOf(a)]); }
    for (const ln of T.hydro.R) { const a = toWF(ln); HYDRO_W.R.push([a, bboxOf(a)]); }
  }
  COUNTY_W = [];
  if (T.counties) for (const ring of T.counties) { const a = toWF(ring); COUNTY_W.push([a, bboxOf(a)]); }
  ART_W = [];
  if (T.art) for (const a of T.art) { const f = toWF(a.pts); ART_W.push([a.c, f, bboxOf(f)]); }
  GRAT = [];
  const [lo0, lo1, loS] = T.grat.lons, [la0, la1, laS] = T.grat.lats;
  for (let lo = lo0; lo <= lo1; lo += loS)
    GRAT.push([albers(lo, la0 - 1), albers(lo, la1 + 1), Math.abs(lo) + '°' + (lo < 0 ? 'W' : 'E'), true]);
  for (let la = la0; la <= la1; la += laS)
    GRAT.push([albers(lo0 - 1, la), albers(lo1 + 1, la), Math.abs(la) + '°' + (la < 0 ? 'S' : 'N'), false]);
  CITIES_W = T.cities.map(c => { const p = albers(c[1], c[2]); return [c[0].split(',')[0].toUpperCase(), p[0], p[1], c[3] || 1.5, -1]; });
}
function bboxOf(a) {
  let x0 = 9e9, y0 = 9e9, x1 = -9e9, y1 = -9e9;
  for (let i = 0; i < a.length; i += 2) {
    if (a[i] < x0) x0 = a[i]; if (a[i] > x1) x1 = a[i];
    if (a[i + 1] < y0) y0 = a[i + 1]; if (a[i + 1] > y1) y1 = a[i + 1];
  }
  return [x0, y0, x1, y1];
}
const hav = (lo1, la1, lo2, la2) => {
  const r1 = la1 * Math.PI / 180, r2 = la2 * Math.PI / 180;
  const h = Math.sin((r2 - r1) / 2) ** 2 +
    Math.cos(r1) * Math.cos(r2) * Math.sin((lo2 - lo1) * Math.PI / 360) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(h));
};

/* ── 3 · camera & layers ────────────────────────────────────── */
const mapCv = $('map'), vehCv = $('veh'), fxCv = $('fxc');
const ctx = mapCv.getContext('2d');
const vctx = vehCv.getContext('2d');
const fctx = fxCv.getContext('2d');
const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
let VW = 0, VH = 0;
const cam = { cx: 0, cy: 0, z: 1, zFit: 1 };
const base = document.createElement('canvas'), bctx = base.getContext('2d');
// while the camera moves we don't retrace the whole vector stack per frame —
// frame() stretches the previous base (Google-Maps-style) and we retrace on settle
let baseStale = false, camMovedAt = 0, lastRetrace = 0, rtrT = 0, wheelT = 0, gridDirty = false, vehDirty = false;
const prevCam = { cx: 0, cy: 0, z: 1 };

const L = { traffic: true, labels: true, cities: true, grid: false, states: true, fx: true, art: true, cty: true, hydro: true };

function resize() {
  VW = window.innerWidth; VH = window.innerHeight;
  for (const c of [mapCv, vehCv, fxCv, base]) {
    c.width = VW * DPR; c.height = VH * DPR;
  }
  mapCv.getContext('2d').setTransform(DPR, 0, 0, DPR, 0, 0);
  vehCv.getContext('2d').setTransform(DPR, 0, 0, DPR, 0, 0);
  fctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  bctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  cam.zFit = Math.min(VW / (WXMAX - WXMIN), VH / (WYMAX - WYMIN)) * 0.86;
  cameraChanged(); retraceBaseNow();
}
function worldToScreen(u, v) { return [(u - cam.cx) * cam.z + VW / 2, VH / 2 - (v - cam.cy) * cam.z]; }
function cameraChanged() {
  for (let i = 0; i < NN; i++) {
    sx[i] = (wx[i] - cam.cx) * cam.z + VW / 2;
    sy[i] = VH / 2 - (wy[i] - cam.cy) * cam.z;
  }
  if (!baseStale) camMovedAt = performance.now();
  baseStale = true;
  clearTimeout(rtrT); rtrT = setTimeout(retraceBaseNow, 90);
  gridDirty = true; vehDirty = true;
  if (selRoute >= 0) updateSelBbox();
}
/* stretch of the stale base under the current camera (pure bitblit, ~free) */
function blitBase() {
  if (!baseStale || !lastRetrace) { ctx.drawImage(base, 0, 0, VW, VH); return; }
  const k = cam.z / prevCam.z;
  const dx = VW / 2 * (1 - k) + (prevCam.cx - cam.cx) * cam.z;
  const dy = VH / 2 * (1 - k) - (prevCam.cy - cam.cy) * cam.z;
  ctx.fillStyle = '#010308'; ctx.fillRect(0, 0, VW, VH);
  ctx.drawImage(base, dx, dy, VW * k, VH * k);
}
function retraceBaseNow() {
  clearTimeout(rtrT);
  baseStale = false; lastRetrace = performance.now();
  prevCam.cx = cam.cx; prevCam.cy = cam.cy; prevCam.z = cam.z;
  if (gridDirty) { gridDirty = false; buildPickGrid(); }
  drawBase();
  blitBase();   // push the fresh base to the persistent map canvas
}
function updateSelBbox() {
  let X0 = 9e9, Y0 = 9e9, X1 = -9e9, Y1 = -9e9;
  for (const e of routeEdges[selRoute]) {
    for (const nd of [eA[e], eB[e]]) {
      if (sx[nd] < X0) X0 = sx[nd]; if (sx[nd] > X1) X1 = sx[nd];
      if (sy[nd] < Y0) Y0 = sy[nd]; if (sy[nd] > Y1) Y1 = sy[nd];
    }
  }
  selBbox = [X0 - 16, Y0 - 16, X1 + 16, Y1 + 16];
}
function fitView() {
  cam.cx = (WXMIN + WXMAX) / 2; cam.cy = (WYMIN + WYMAX) / 2 + (WYMAX - WYMIN) * 0.02;
  cam.z = cam.zFit; cameraChanged();
}
function clearVeh() { vctx.save(); vctx.globalCompositeOperation = 'source-over'; vctx.clearRect(0, 0, VW, VH); vctx.restore(); }

/* ── 4 · base layer render ──────────────────────────────────── */
function drawBase() {
  bctx.clearRect(0, 0, VW, VH);
  const g = bctx.createRadialGradient(VW / 2, VH * 0.42, 40, VW / 2, VH * 0.5, Math.max(VW, VH) * 0.75);
  g.addColorStop(0, '#030b14'); g.addColorStop(1, '#010308');
  bctx.fillStyle = g; bctx.fillRect(0, 0, VW, VH);

  bctx.lineJoin = 'round'; bctx.lineCap = 'round';

  /* view-rect culling (skip polylines fully offscreen) + coarse-zoom decimation */
  const zm = 80 / cam.z;
  const vu0 = cam.cx - VW / 2 / cam.z - zm, vu1 = cam.cx + VW / 2 / cam.z + zm;
  const vv0 = cam.cy - VH / 2 / cam.z - zm, vv1 = cam.cy + VH / 2 / cam.z + zm;
  const inView = bb => bb[0] < vu1 && bb[2] > vu0 && bb[1] < vv1 && bb[3] > vv0;
  const pStride = cam.z / cam.zFit < 1.15 ? 3 : cam.z / cam.zFit < 2.2 ? 2 : 1;
  const traceArr = (arr, close, st = 1) => {
    // never decimate sparse rings: skipping corners of an already DP-minimal
    // polygon draws chords across its interior (rectangular states!)
    if (arr.length / 2 < 40) st = 1;
    for (let i = 0; i < arr.length; i += 2 * st) {
      const p = worldToScreen(arr[i], arr[i + 1]);
      i ? bctx.lineTo(p[0], p[1]) : bctx.moveTo(p[0], p[1]);
    }
    if (st > 1 && (arr.length - 2) % (2 * st)) {
      const p = worldToScreen(arr[arr.length - 2], arr[arr.length - 1]);
      bctx.lineTo(p[0], p[1]);
    }
    if (close) bctx.closePath();
  };

  if (L.grid) {
    bctx.strokeStyle = 'rgba(24,224,255,0.07)'; bctx.lineWidth = 1;
    bctx.beginPath();
    for (const [p1, p2] of GRAT) {
      const a = worldToScreen(p1[0], p1[1]), b = worldToScreen(p2[0], p2[1]);
      bctx.moveTo(a[0], a[1]); bctx.lineTo(b[0], b[1]);
    }
    bctx.stroke();
  }

  if (L.states) {
    bctx.strokeStyle = 'rgba(52,142,172,0.58)'; bctx.lineWidth = 1;
    bctx.fillStyle = 'rgba(8,26,38,0.5)';
    bctx.beginPath();
    for (const st of STATES_W) for (const [ring, bb] of st.r) {
      if (!inView(bb)) continue;
      traceArr(ring, true);   // state/province outlines are the visual skeleton: full fidelity
    }
    bctx.fill(); bctx.stroke();
  }

  /* hydro backdrop: lakes fill + stroke, rivers thin */
  if (L.hydro && (HYDRO_W.L.length || HYDRO_W.R.length)) {
    bctx.fillStyle = 'rgba(13,48,64,0.55)';
    bctx.strokeStyle = 'rgba(36,118,150,0.45)'; bctx.lineWidth = 0.8;
    bctx.beginPath();
    for (const [ring, bb] of HYDRO_W.L) { if (inView(bb)) traceArr(ring, true, pStride); }
    bctx.fill(); bctx.stroke();
    bctx.strokeStyle = 'rgba(32,112,142,0.30)'; bctx.lineWidth = 0.7;
    bctx.beginPath();
    for (const [ln, bb] of HYDRO_W.R) { if (inView(bb)) traceArr(ln, false, pStride); }
    bctx.stroke();
  }

  /* county mesh (US) / regency mesh (ID) */
  if (L.cty && COUNTY_W.length && cam.z / cam.zFit > (NETW.style === 'ID' ? 0.8 : 0.42)) {
    bctx.strokeStyle = 'rgba(48,126,154,0.18)'; bctx.lineWidth = 0.6;
    bctx.beginPath();
    for (const [ring, bb] of COUNTY_W) { if (inView(bb)) traceArr(ring, true, pStride); }
    bctx.stroke();
  }

  /* backdrop arterials (US hwy / state routes · nat. trunk/primary) */
  if (L.art && ART_W.length) {
    const zf2 = cam.z / cam.zFit;
    const styles = [null, ['rgba(126,196,255,0.23)', 0.9], ['rgba(140,175,235,0.17)', 0.75], ['rgba(150,180,220,0.12)', 0.6]];
    for (let cls = 1; cls <= 3; cls++) {
      if (cls === 3 && zf2 < 1.7) continue;
      bctx.strokeStyle = styles[cls][0]; bctx.lineWidth = styles[cls][1];
      bctx.beginPath();
      for (const [c, arr, bb] of ART_W) { if (c === cls && inView(bb)) traceArr(arr, false, pStride); }
      bctx.stroke();
    }
  }

  /* network — fake glow pass + core pass */
  const wCore = clamp(cam.z / cam.zFit, 0.55, 3.4);
  const zoomF = cam.z / cam.zFit;
  const mL = -60, mT = -60, mR = VW + 60, mB = VH + 60;
  for (const pass of [0, 1]) {
    for (const cls of [0, 1]) {
      bctx.beginPath();
      for (let i = 0; i < NE; i++) {
        if (eAux[i] !== cls) continue;
        if (cls === 1 && zoomF < 0.55) continue;
        const ax = sx[eA[i]], ay = sy[eA[i]], bx = sx[eB[i]], by = sy[eB[i]];
        if ((ax < mL && bx < mL) || (ax > mR && bx > mR) || (ay < mT && by < mT) || (ay > mB && by > mB)) continue;
        bctx.moveTo(ax, ay); bctx.lineTo(bx, by);
      }
      if (pass === 0) {
        bctx.strokeStyle = cls ? 'rgba(255,150,40,0.10)' : NETW.glow;
        bctx.lineWidth = wCore * 3.6;
      } else {
        bctx.strokeStyle = cls ? 'rgba(255,158,44,0.62)' : NETW.core;
        bctx.lineWidth = wCore * (cls ? 0.9 : 1.1);
      }
      bctx.stroke();
    }
  }

  /* live measured-speed skin */
  if (LIVE.on && LIVE.mapped > 0) {
    const lw = clamp(cam.z / cam.zFit, 0.8, 3);
    const buck = [[], [], [], []];
    for (let i = 0; i < NE; i++) {
      const mph = edgeLive[i]; if (mph <= 0) continue;
      const ax = sx[eA[i]], ay = sy[eA[i]], bx = sx[eB[i]], by = sy[eB[i]];
      if ((ax < mL && bx < mL) || (ax > mR && bx > mR) || (ay < mT && by < mT) || (ay > mB && by > mB)) continue;
      const r = mph / 62;
      buck[r < 0.2 ? 0 : r < 0.45 ? 1 : r < 0.72 ? 2 : 3].push(ax, ay, bx, by);
    }
    const cols = ['255,45,77', '255,142,43', '255,213,74', '77,255,166'];
    for (let b = 0; b < 4; b++) {
      if (!buck[b].length) continue;
      bctx.beginPath();
      for (let j = 0; j < buck[b].length; j += 4) { bctx.moveTo(buck[b][j], buck[b][j + 1]); bctx.lineTo(buck[b][j + 2], buck[b][j + 3]); }
      bctx.strokeStyle = `rgba(${cols[b]},0.30)`; bctx.lineWidth = lw * 3.4; bctx.stroke();
      bctx.strokeStyle = `rgba(${cols[b]},0.9)`; bctx.lineWidth = lw * 1.35; bctx.stroke();
    }
  }

  if (L.grid) {
    bctx.fillStyle = 'rgba(24,224,255,0.34)'; bctx.font = '9px "Share Tech Mono", monospace';
    for (const [p1, p2, tag, vert] of GRAT) {
      const a = worldToScreen(p1[0], p1[1]);
      if (vert) { if (a[0] > -20 && a[0] < VW + 20) bctx.fillText(tag, clamp(a[0], 4, VW - 30), 88); }
      else { if (a[1] > 80 && a[1] < VH + 20) bctx.fillText(tag, VW - 40, clamp(a[1], 96, VH - 8)); }
    }
  }
}

/* ── 5 · picking (spatial grid on screen coords) ────────────── */
const CELL = 26, GOFF = 1000, GW = 8192;
let pickGrid = new Map();
function buildPickGrid() {
  pickGrid = new Map();
  for (let i = 0; i < NE; i++) {
    const ax = sx[eA[i]], ay = sy[eA[i]], bx = sx[eB[i]], by = sy[eB[i]];
    const x0 = Math.floor(Math.min(ax, bx) / CELL), x1 = Math.floor(Math.max(ax, bx) / CELL);
    const y0 = Math.floor(Math.min(ay, by) / CELL), y1 = Math.floor(Math.max(ay, by) / CELL);
    if (x1 < -GOFF || y1 < -GOFF || x0 > 5000 || y0 > 5000) continue;
    for (let gx = Math.max(x0, -GOFF); gx <= Math.min(x1, 5000); gx++)
      for (let gy = Math.max(y0, -GOFF); gy <= Math.min(y1, 5000); gy++) {
        const k = gx + GOFF + (gy + GOFF) * GW;
        let arr = pickGrid.get(k);
        if (!arr) pickGrid.set(k, arr = []);
        arr.push(i);
      }
  }
}
function pickEdge(mx, my) {
  let best = -1, bestD = 9;
  if (!pickGrid) return -1;
  const R = 2;
  const cgx = Math.floor(mx / CELL), cgy = Math.floor(my / CELL);
  for (let gx = cgx - R; gx <= cgx + R; gx++) for (let gy = cgy - R; gy <= cgy + R; gy++) {
    const arr = pickGrid.get(gx + GOFF + (gy + GOFF) * GW);
    if (!arr) continue;
    for (const i of arr) {
      const ax = sx[eA[i]], ay = sy[eA[i]], bx = sx[eB[i]], by = sy[eB[i]];
      const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-9;
      const t = clamp(((mx - ax) * dx + (my - ay) * dy) / L2, 0, 1);
      const d = Math.hypot(ax + dx * t - mx, ay + dy * t - my);
      if (d < bestD) { bestD = d; best = i; }
    }
  }
  return best;
}

/* ── 6 · traffic simulation ─────────────────────────────────── */
const CAP = 5600;
const vEdge = new Int32Array(CAP), vDir = new Int8Array(CAP);
const vT = new Float32Array(CAP), vBase = new Float32Array(CAP);
const vBear = new Uint8Array(CAP), vTruck = new Uint8Array(CAP);
let vN = 0;
let densMult = 0.7, timeScale = 1, paused = false;
let simSec = (() => { const d = new Date(); return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds(); })();
let simDay = 1;

const G = (x, m, s) => { const dd = Math.min(Math.abs(x - m), 24 - Math.abs(x - m)); return Math.exp(-(dd * dd) / (2 * s * s)); };
const densityFn = h => 0.16 + 0.80 * G(h, 8.2, 1.5) + 0.88 * G(h, 17.6, 1.75) + 0.30 * G(h, 12.9, 3.2);
const simHour = () => (simSec / 3600) % 24;
const densEff = () => clamp(densityFn(simHour()) * densMult, 0.03, 2.2);
const congestion = d => clamp(1 - 0.62 * (d - 0.55), 0.09, 1);

function bearingOf(e, dir) {
  const a = eA[e], b = eB[e];
  const dx = (wx[b] - wx[a]) * dir, dy = (wy[b] - wy[a]) * dir;
  const ang = Math.atan2(dy, dx) * 180 / Math.PI;
  return Math.abs(ang) <= 45 ? 0 : ang > 45 && ang < 135 ? 1 : Math.abs(ang) >= 135 ? 2 : 3;
}
function spawn() {
  if (vN >= CAP) return;
  const e = (Math.random() * NE) | 0;
  vEdge[vN] = e;
  vT[vN] = Math.random();
  vDir[vN] = Math.random() < 0.5 ? 1 : -1;
  const truck = Math.random() < 0.18 ? 1 : 0;
  vTruck[vN] = truck;
  const r = ROUTES[eR[e]];
  vBase[vN] = r.aux ? 48 + Math.random() * 18 : (truck ? 52 + Math.random() * 12 : 60 + Math.random() * 20);
  vBear[vN] = bearingOf(e, vDir[vN]);
  vN++;
}
function despawn(i) {
  vN--;
  vEdge[i] = vEdge[vN]; vT[i] = vT[vN]; vDir[i] = vDir[vN];
  vBase[i] = vBase[vN]; vBear[i] = vBear[vN]; vTruck[i] = vTruck[vN];
}
function hop(i) {
  const e = vEdge[i], dir = vDir[i];
  const node = dir > 0 ? eB[e] : eA[e];
  const inX = (wx[eB[e]] - wx[eA[e]]) * dir, inY = (wy[eB[e]] - wy[eA[e]]) * dir;
  const s0 = adjStart[node], s1 = adjStart[node + 1];
  let bestEdge = -1, bestT = 0, bestScore = -9;
  const r0 = eR[e];
  for (let s = s0; s < s1; s++) {
    const cand = adjList[s];
    if (cand === e) continue;
    const out = eA[cand] === node ? eB[cand] : eA[cand];
    const ovx = wx[out] - wx[node], ovy = wy[out] - wy[node];
    const dot = (ovx * inX + ovy * inY) / (Math.hypot(ovx, ovy) * Math.hypot(inX, inY) || 1);
    let score = dot * 1.6 + (eR[cand] === r0 ? 2.6 : 0) + Math.random() * 0.5;
    if (score > bestScore) {
      bestScore = score; bestEdge = cand;
      bestT = eA[cand] === node ? 0 : 1;
    }
  }
  if (bestEdge < 0) { vDir[i] = -dir; vT[i] = dir > 0 ? 1 : 0; vBear[i] = bearingOf(e, -dir); return; }
  vEdge[i] = bestEdge; vT[i] = bestT;
  vDir[i] = bestT === 0 ? 1 : -1;
  vBear[i] = bearingOf(bestEdge, vDir[i]);
}
function stepSim(dtReal) {
  if (paused) return;
  const dtSimH = dtReal * timeScale / 3600;
  simSec += dtReal * timeScale;
  if (simSec >= 86400) { simSec -= 86400; simDay++; }
  const d = densEff();
  const target = Math.round(2600 * d);
  if (vN < target) { const n = Math.min(46, target - vN); for (let k = 0; k < n; k++) spawn(); }
  else if (vN > target) { const n = Math.min(46, vN - target); for (let k = 0; k < n; k++) despawn(vN - 1); }
  const c = congestion(d);
  for (let i = 0; i < vN; i++) {
    const jitter = 0.86 + 0.28 * (0.5 + 0.5 * Math.sin(i * 12.9898 + simSec * 0.9));
    let miles = 0, first = true, hops = 0;
    while (hops++ < 8) {
      const e = vEdge[i], len = eLen[e];
      const lv = LIVE.on ? edgeLive[e] : 0;          // real measured speed, mph
      const spd = lv > 0
        ? clamp(lv * (0.94 + 0.12 * (0.5 + 0.5 * Math.sin(i * 7.7 + simSec * 0.35))), 2, 80)
        : vBase[i] * c * jitter;
      if (first) { miles = spd * dtSimH; first = false; }
      const move = miles / len;
      let t = vT[i] + move * vDir[i];
      if (t >= 0 && t <= 1) { vT[i] = t; break; }
      miles = (vDir[i] > 0 ? t - 1 : -t) * len;
      hop(i);
      if (hops >= 8) vT[i] = clamp(vT[i], 0, 1);
    }
  }
}

/* ── 7 · render loop ────────────────────────────────────────── */
const BEAR_COL = ['#49c8ff', '#38ffb2', '#ffb03a', '#c77dff'];
/* scissored trail fade: per-cell trail-energy stamps (24 px cells, 256-stride grid) */
const FCELL = 24;
const cellT = new Uint16Array(256 * 256);
let fStamp = 1;
function fadeTrails() {
  vctx.globalCompositeOperation = 'destination-out';
  vctx.fillStyle = 'rgba(0,0,0,0.30)';
  const gw = (VW / FCELL | 0) + 1, gh = (VH / FCELL | 0) + 1;
  for (let cy = 0; cy < gh; cy++) {
    const row = cy * 256;
    for (let cx = 0; cx < gw; cx++)
      if (((fStamp - cellT[row + cx]) & 0xFFFF) < 22)
        vctx.fillRect(cx * FCELL, cy * FCELL, FCELL, FCELL);
  }
  vctx.globalCompositeOperation = 'lighter';
}
/* per-frame dot batches: 4 fillStyle switches instead of up to 5,600 */
const bkX = [new Float32Array(6000), new Float32Array(6000), new Float32Array(6000), new Float32Array(6000)];
const bkY = [new Float32Array(6000), new Float32Array(6000), new Float32Array(6000), new Float32Array(6000)];
const bkS = [new Float32Array(6000), new Float32Array(6000), new Float32Array(6000), new Float32Array(6000)];
const pings = [];
let lastT = performance.now(), hudT = 0, tickerT = 0, pingT = 0, frameN = 0;
let avgSpeed = 0;
let routeVehCount = new Int32Array(0), routeSpdSum = new Float32Array(0);

function frame(now) {
  const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
  if (vehDirty) { vehDirty = false; clearVeh(); }
  // retrace policy: never mid-drag (blit is pixel-exact while panning), never mid-wheel-storm;
  // during fly-to tweens at a slower cadence; on settle the 90 ms debounce handles it.
  if (baseStale && !dragging && now - wheelT > 120 && now - camMovedAt > 200 &&
      now - lastRetrace > (tween ? 420 : 130))
    retraceBaseNow();
  stepSim(dt);

  // map canvas is PERSISTENT — untouched unless the camera moved this frame
  if (baseStale) blitBase();

  fctx.clearRect(0, 0, VW, VH);
  const hotR = hoverEdge >= 0 ? eR[hoverEdge] : -1;
  if (hotR >= 0 && hotR !== selRoute) drawRouteGlow(hotR, 'rgba(24,224,255,0.55)', 2.2);
  if (selRoute >= 0) {
    const pulse = 0.72 + 0.28 * Math.sin(now * 0.005);
    drawRouteGlow(selRoute, `rgba(255,196,80,${pulse})`, 3.0);
    drawSelectionBrackets(now);
  }

  if (L.traffic && vN > 0) {
    fadeTrails();
    routeVehCount.fill(0); routeSpdSum.fill(0);
    let spd = 0;
    const c = congestion(densEff());
    const bkN = [0, 0, 0, 0];
    for (let idx = 0; idx < vN; idx++) {
      const e = vEdge[idx], t = vT[idx];
      const a = eA[e], b = eB[e];
      const x = sx[a] + (sx[b] - sx[a]) * t, y = sy[a] + (sy[b] - sy[a]) * t;
      const lv = LIVE.on ? edgeLive[e] : 0;          // same source as movement
      const r = eR[e], v = lv > 0 ? lv * 0.97 : vBase[idx] * c;
      routeVehCount[r]++; routeSpdSum[r] += v; spd += v;
      if (x < -4 || x > VW + 4 || y < -4 || y > VH + 4) continue;   // skip pixels only
      const bi = vBear[idx], n = bkN[bi];
      bkX[bi][n] = x; bkY[bi][n] = y; bkS[bi][n] = vTruck[idx] ? 3.2 : 2.2; bkN[bi]++;
      cellT[((x / FCELL) | 0) + ((y / FCELL) | 0) * 256] = fStamp;
    }
    for (let bi = 0; bi < 4; bi++) {
      const n = bkN[bi];
      if (!n) continue;
      vctx.fillStyle = BEAR_COL[bi];
      const xs = bkX[bi], ys = bkY[bi], ss = bkS[bi];
      let lastAl = -1;
      for (let j = 0; j < n; j++) {
        const s = ss[j], al = s > 3 ? 0.85 : 0.95;
        if (al !== lastAl) { vctx.globalAlpha = al; lastAl = al; }
        vctx.fillRect(xs[j] - s / 2, ys[j] - s / 2, s, s);
      }
    }
    vctx.globalAlpha = 1;
    avgSpeed = vN ? spd / vN : 0;
    fStamp = (fStamp + 1) & 0xFFFF;
  }

  if (L.fx) {
    pingT -= dt;
    if (pingT <= 0) { pingT = 0.55 + Math.random() * 0.9; pings.push({ n: (Math.random() * NN) | 0, r: 1 }); }
    for (let i = pings.length - 1; i >= 0; i--) {
      const p = pings[i]; p.r += dt * 42;
      const al = 1 - p.r / 60;
      if (al <= 0) { pings.splice(i, 1); continue; }
      const x = sx[p.n], y = sy[p.n];
      if (x < -60 || x > VW + 60 || y < -60 || y > VH + 60) continue;
      fctx.strokeStyle = `rgba(56,255,178,${al * 0.5})`;
      fctx.lineWidth = 1.2;
      fctx.beginPath(); fctx.arc(x, y, p.r, 0, 6.2832); fctx.stroke();
    }
  }

  if (L.labels) drawLabels();
  if (L.cities) drawCities();

  hudT -= dt;
  if (hudT <= 0) { hudT = 0.25; updateHUD(); }
  tickerT -= dt;
  if (tickerT <= 0) { tickerT = 6.5; updateTicker(); }

  stepTween(now);
  requestAnimationFrame(frame);
}

function drawRouteGlow(ri, color, width) {
  fctx.strokeStyle = color;
  const edgesList = routeEdges[ri];
  fctx.lineCap = 'round';
  fctx.globalAlpha = 0.3; fctx.lineWidth = width * 3;
  fctx.beginPath();
  for (const e of edgesList) { fctx.moveTo(sx[eA[e]], sy[eA[e]]); fctx.lineTo(sx[eB[e]], sy[eB[e]]); }
  fctx.stroke();
  fctx.globalAlpha = 1; fctx.lineWidth = width;
  fctx.beginPath();
  for (const e of edgesList) { fctx.moveTo(sx[eA[e]], sy[eA[e]]); fctx.lineTo(sx[eB[e]], sy[eB[e]]); }
  fctx.stroke();
}
let selBbox = null;
function drawSelectionBrackets(now) {
  if (!selBbox) return;
  const [x0, y0, x1, y1] = selBbox, s = 13;
  const o = 2 * Math.sin(now * 0.004);
  fctx.strokeStyle = 'rgba(255,176,58,0.9)'; fctx.lineWidth = 1.6;
  fctx.beginPath();
  fctx.moveTo(x0 - o, y0 + s); fctx.lineTo(x0 - o, y0 - o); fctx.lineTo(x0 + s, y0 - o);
  fctx.moveTo(x1 - s, y0 - o); fctx.lineTo(x1 + o, y0 - o); fctx.lineTo(x1 + o, y0 + s);
  fctx.moveTo(x1 + o, y1 - s); fctx.lineTo(x1 + o, y1 + o); fctx.lineTo(x1 - s, y1 + o);
  fctx.moveTo(x0 + s, y1 + o); fctx.lineTo(x0 - o, y1 + o); fctx.lineTo(x0 - o, y1 - s);
  fctx.stroke();
}

function drawLabels() {
  const zoomF = cam.z / cam.zFit;
  fctx.textAlign = 'center'; fctx.textBaseline = 'middle';
  const placed = [];
  for (let i = 0; i < NR; i++) {
    const r = ROUTES[i];
    if (r.aux && zoomF < 2.0) continue;
    if (!r.aux && zoomF < 0.5 && i % 2) continue;
    const p = worldToScreen(routeAnchor[i].x, routeAnchor[i].y);
    if (p[0] < -30 || p[0] > VW + 30 || p[1] < -30 || p[1] > VH + 30) continue;
    if (!labelW || labelW.length !== NR) {
      labelW = new Float32Array(NR).fill(-1);
      labelNum = ROUTES.map(rr => NETW.style === 'ID' ? rr.n : (rr.n.slice(2).length ? rr.n.slice(2) : rr.n));
    }
    const num = labelNum[i];
    let wTxt = labelW[i];
    if (wTxt < 0) {
      fctx.font = '700 9.5px Orbitron, sans-serif';
      wTxt = labelW[i] = fctx.measureText(num).width + 10;
    }
    fctx.font = (r.aux ? '600 8.5px' : '700 9.5px') + ' Orbitron, sans-serif';
    if (r.aux) wTxt *= 0.92;
    let clash = false;
    for (const q of placed)
      if (Math.abs(q[0] - p[0]) < (q[2] + wTxt) / 2 + 4 && Math.abs(q[1] - p[1]) < 18) { clash = true; break; }
    if (clash) continue;
    placed.push([p[0], p[1], wTxt]);
    fctx.fillStyle = 'rgba(1,10,16,0.85)';
    fctx.strokeStyle = r.aux ? 'rgba(255,158,44,0.75)' : NETW.labelCol;
    fctx.lineWidth = 1;
    roundRect(fctx, p[0] - wTxt / 2, p[1] - 8, wTxt, 16, 3); fctx.fill(); fctx.stroke();
    fctx.fillStyle = r.aux ? '#ffb03a' : NETW.labelTxt;
    fctx.fillText(num, p[0], p[1] + 0.5);
  }
}
function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

/* Google-Maps-style priority reveal: metros always visible, towns fade in as you zoom.
   CITIES_W is pre-sorted by population rank so big cities win label collisions.
   Tiers: 1 metro · 2 major · 3 city · 4 town · 5 small town · 6 ID regency seat */
function cityGate(t) {
  return t >= 5.5 ? 3.8 : t >= 4.5 ? 3.1 : t >= 3.5 ? 2.6 : t >= 2.5 ? 1.75 : t >= 1.9 ? 1.15 : 0;
}
function drawCities() {
  const zoomF = cam.z / cam.zFit;
  fctx.textAlign = 'left'; fctx.textBaseline = 'middle';
  const placed = [];
  let shown = 0;
  for (const c of CITIES_W) {
    const [name, u, v, tier] = c;
    const gate = cityGate(tier);
    if (zoomF < gate) continue;
    const p = worldToScreen(u, v);
    if (p[0] < -60 || p[0] > VW + 60 || p[1] < -40 || p[1] > VH + 40) continue;
    const deep = tier >= 5.5;
    const nm = name;
    fctx.font = (tier < 1.5 ? '700 10px' : tier < 2.5 ? '600 9px' : deep ? '600 8px' : '600 8.5px') + ' "Share Tech Mono", monospace';
    if (c[4] < 0) c[4] = fctx.measureText(nm).width;   // constant per city — measure once
    const w = c[4];
    const bx = p[0] + 6, by = p[1] - 7, bw = w + 7, bh = 12;
    let clash = shown > 260;
    if (!clash)
      for (const q of placed)
        if (bx < q[0] + q[2] && bx + bw > q[0] && by < q[1] + q[3] && by + bh > q[1]) { clash = true; break; }
    if (clash) continue;
    placed.push([bx, by, bw, bh]); shown++;
    const fade = gate === 0 ? 1 : clamp((zoomF - gate) / 0.5, 0.15, 1);
    const s = (zoomF > 2.4 ? 3.2 : 2.4) *
      (deep ? 0.6 : tier >= 4.5 ? 0.7 : tier >= 3.5 ? 0.8 : tier >= 2.5 ? 0.9 : tier >= 1.9 ? 1 : 1.2);
    fctx.strokeStyle = deep ? `rgba(150,205,220,${0.42 * fade})`
      : `rgba(160,240,255,${(tier < 1.5 ? 0.95 : tier < 2.5 ? 0.85 : 0.6) * fade})`;
    fctx.lineWidth = 1;
    fctx.beginPath();
    fctx.moveTo(p[0], p[1] - s); fctx.lineTo(p[0] + s, p[1]); fctx.lineTo(p[0], p[1] + s); fctx.lineTo(p[0] - s, p[1]);
    fctx.closePath(); fctx.stroke();
    fctx.fillStyle = deep ? `rgba(150,205,220,${0.5 * fade})`
      : `rgba(160,240,255,${(tier < 2.5 ? 0.9 : 0.7) * fade})`;
    fctx.fillText(nm, p[0] + 7, p[1] - 1);
  }
}

/* ── 8 · HUD ────────────────────────────────────────────────── */
let selRoute = -1, hoverEdge = -1;
const spark = $('spark'), sctx = spark.getContext('2d');
const SW = spark.width, SH = spark.height;

function updateHUD() {
  const s = Math.floor(simSec) % 86400;
  $('clock').textContent = `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor(s / 60) % 60)}:${pad2(s % 60)}`;
  $('clock').style.color = paused ? '#ff3860' : '';
  $('stat-veh').textContent = fmtInt(vN);
  $('stat-spd').textContent = (NETW.unit === 'KM' ? avgSpeed * 1.60934 : avgSpeed).toFixed(1);
  drawSpark();
  if (selRoute >= 0) updateRouteCardLive();
  if (LIVE.fetchedAt && !LIVE.err) {
    const age = Math.round(LIVE.age0 + (Date.now() - LIVE.fetchedAt) / 1000);
    const el = $('live-age');
    el.textContent = age < 60 ? age + 's AGO' : Math.floor(age / 60) + 'm ' + (age % 60) + 's AGO';
    el.style.color = age < 420 ? '' : 'var(--amber)';        // feed batches can lag — flag staleness
  }
}
function drawSpark() {
  sctx.clearRect(0, 0, SW, SH);
  sctx.strokeStyle = 'rgba(24,224,255,0.12)';
  sctx.beginPath(); for (let x = 0; x <= SW; x += 41) { sctx.moveTo(x, 0); sctx.lineTo(x, SH); } sctx.stroke();
  sctx.beginPath();
  for (let px = 0; px <= SW; px++) {
    const h = px / SW * 24, v = densityFn(h) / 1.35;
    const y = SH - 4 - v * (SH - 12);
    px ? sctx.lineTo(px, y) : sctx.moveTo(px, y);
  }
  sctx.strokeStyle = 'rgba(56,255,178,0.9)'; sctx.lineWidth = 1.4; sctx.stroke();
  sctx.fillStyle = 'rgba(56,255,178,0.08)'; sctx.lineTo(SW, SH); sctx.lineTo(0, SH); sctx.fill();
  const cx2 = simHour() / 24 * SW;
  sctx.strokeStyle = '#ffb03a'; sctx.lineWidth = 1;
  sctx.beginPath(); sctx.moveTo(cx2, 0); sctx.lineTo(cx2, SH); sctx.stroke();
  sctx.fillStyle = 'rgba(93,147,166,0.9)'; sctx.font = '8px "Share Tech Mono", monospace';
  sctx.fillText('00', 2, SH - 3); sctx.fillText('12', SW / 2 - 6, SH - 3); sctx.fillText('24', SW - 14, SH - 3);
}
const TICKER_OK = ['FLOW NOMINAL — ALL SECTORS TRACKED', 'SENSOR FUSION ACTIVE · NETWORK SYNCED',
  'CORRIDOR SCAN COMPLETE · NO ANOMALIES', 'AFTER-HOURS LOAD · MINIMUM FLOW'];
function updateTicker() {
  if (LIVE.on && !LIVE.err && LIVE.slowest.length && Math.random() < 0.45) {
    const [n, v] = LIVE.slowest[(Math.random() * LIVE.slowest.length) | 0];
    $('ticker').textContent = `LIVE ▸ ${n} · ${v.toFixed(0)} MPH`;
    $('ticker').style.color = v < 18 ? '#ff3860' : '#ffb03a';
    return;
  }
  const d = densEff();
  const pool = d > 1.25
    ? ['⚠ CONGESTION EVENT — MULTI-SECTOR SLOWDOWN', '⚠ GRIDLOCK PROTOCOL — THROUGHPUT DEGRADED',
       '⚠ UNIT VELOCITY BELOW THRESHOLD ON 200+ SEGMENTS']
    : d > 0.6 ? NETW.tickMid : TICKER_OK;
  $('ticker').textContent = pool[(Math.random() * pool.length) | 0];
  $('ticker').style.color = d > 1.25 ? '#ff3860' : d > 0.6 ? '#ffb03a' : '';
}
function teleLog(msg, cls) {
  const el = document.createElement('div');
  if (cls) el.className = cls;
  const s = Math.floor(simSec) % 86400;
  el.textContent = `[${pad2(Math.floor(s / 3600))}:${pad2(Math.floor(s / 60) % 60)}] ${msg}`;
  const log = $('tele-log'); log.appendChild(el);
  while (log.children.length > 9) log.removeChild(log.firstChild);
}

/* ── live traffic uplink ────────────────────────────────────── */
const LIVE = { on: true, ts: '', n: 0, mapped: 0, fetchedAt: 0, age0: 0, err: false, slowest: [], lastSegs: null };
const liveNames = new Map();

function matchLive(segs) {
  edgeLive.fill(0); liveNames.clear();
  if (!segs || !segs.length) return 0;
  const sum = new Float32Array(NE), cnt = new Int32Array(NE);
  for (const s of segs) {
    for (const [lo, la] of s.pts) {
      const cosl = Math.cos(la * Math.PI / 180);
      const gx = Math.floor(lo / 0.05), gy = Math.floor(la / 0.05);
      let best = -1, bd = 0.0042;                       // ≈ 460 m snap radius
      for (let x = gx - 1; x <= gx + 1; x++) for (let y = gy - 1; y <= gy + 1; y++) {
        const arr = geoGrid.get(x + y * 10000); if (!arr) continue;
        for (const ei of arr) {
          const ax = lonN[eA[ei]], ay = latN[eA[ei]];
          const dx = (lonN[eB[ei]] - ax) * cosl, dy = latN[eB[ei]] - ay;
          const L2 = dx * dx + dy * dy || 1e-9;
          let t = (((lo - ax) * cosl) * dx + (la - ay) * dy) / L2;
          t = clamp(t, 0, 1);
          const px = ax + (lonN[eB[ei]] - ax) * t, py = ay + (latN[eB[ei]] - ay) * t;
          const d = Math.hypot((px - lo) * cosl, py - la);
          if (d < bd) { bd = d; best = ei; }
        }
      }
      if (best >= 0) { sum[best] += s.mph; cnt[best]++; liveNames.set(best, s.name); }
    }
  }
  let m = 0;
  for (let i = 0; i < NE; i++) if (cnt[i]) { edgeLive[i] = sum[i] / cnt[i]; m++; }
  const seen = new Map();
  for (const [ei, name] of liveNames) {
    const mph = edgeLive[ei];
    if (!seen.has(name) || mph < seen.get(name)) seen.set(name, mph);
  }
  LIVE.slowest = [...seen.entries()].filter(([, v]) => v < 34).sort((a, b) => a[1] - b[1]).slice(0, 4);
  return m;
}
function renderLiveSlow() {
  $('live-slow').innerHTML = LIVE.slowest.map(([n, v]) =>
    `<div>▸ ${n} <span style="float:right">${v.toFixed(0)} MPH</span></div>`).join('');
}
/* Direct-from-Socrata fallback (static hosting: GitHub Pages/Netlify/… where there
   is no /api proxy). Socrata sends Access-Control-Allow-Origin:* so browsers can
   call it cross-origin. Mirrors server.py normalization: 12-min rolling window,
   0-mph sensor dropouts discarded, "lat,lon lat,lon…" → [lon,lat] pairs. */
const SOCRATA_URL = 'https://data.cityofnewyork.us/resource/i4gi-tjb9.json';
async function fetchLiveDirect() {
  const res = await fetch(SOCRATA_URL + '?$limit=4000&$order=data_as_of%20DESC', { cache: 'no-store' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const rows = await res.json();
  if (!rows || !rows.length) throw new Error('empty response');
  const newest = rows.reduce((m, it) => (it.data_as_of || '') > m ? (it.data_as_of || '') : m, '');
  const cutoff = Date.parse(newest.replace(' ', 'T')) - 12 * 60000;
  const segs = [];
  for (const it of rows) {
    if (Date.parse((it.data_as_of || '').replace(' ', 'T')) < cutoff) continue;
    const mph = parseFloat(it.speed);
    if (!(mph > 0)) continue;
    const pts = [];
    for (const tok of (it.link_points || '').split(' ')) {
      const i = tok.indexOf(',');
      if (i < 1) continue;
      const la = +tok.slice(0, i), lo = +tok.slice(i + 1);
      if (isFinite(la) && isFinite(lo)) pts.push([+lo.toFixed(4), +la.toFixed(4)]);
    }
    if (pts.length >= 2)
      segs.push({ pts, mph: +mph.toFixed(1), name: (it.link_name || '').slice(0, 46), boro: (it.borough || '').slice(0, 2) });
  }
  if (!segs.length) throw new Error('no fresh segments');
  return { ok: true, src: 'NYCDOT NBE SPEEDLINK · DIRECT', ts: newest, n: segs.length, segs };
}
async function refreshLive(first) {
  const st = $('live-status');
  if (first) st.textContent = 'SYNCING…';
  try {
    let d = null;
    if (!LIVE.directOnly) {
      try {
        const res = await fetch('api/live-traffic', { cache: 'no-store' });
        const j = await res.json();
        if (j && j.ok) d = j; else LIVE.directOnly = true;
      } catch (_) { LIVE.directOnly = true; }
    }
    if (!d) d = await fetchLiveDirect();
    LIVE.ts = d.ts; LIVE.n = d.n; LIVE.fetchedAt = Date.now(); LIVE.err = false; LIVE.lastSegs = d.segs;
    LIVE.age0 = Math.max(0, (Date.now() - Date.parse(d.ts.replace(' ', 'T') + '-04:00')) / 1000);
    LIVE.mapped = matchLive(d.segs);
    $('live-src').textContent = d.src;
    st.textContent = 'ONLINE ✓'; st.style.color = 'var(--mint)';
    $('live-map').textContent = LIVE.mapped
      ? `${fmtInt(LIVE.n)} / ${fmtInt(LIVE.mapped)} SEGS`
      : 'NO COVERAGE IN THEATER';
    renderLiveSlow();
    retraceBaseNow();
    if (LIVE._mlog !== LIVE.mapped) {
      LIVE._mlog = LIVE.mapped;
      teleLog(`LIVE SYNC ${d.src} — ${d.n} LINKS · ${LIVE.mapped} SEGS MAPPED`, LIVE.mapped ? 'ok' : 'warn');
    }
  } catch (e) {
    LIVE.err = true;
    st.textContent = 'OFFLINE — SYNTHETIC MODEL'; st.style.color = 'var(--magenta)';
    $('live-src').textContent = 'UNREACHABLE';
    $('live-map').textContent = '—'; $('live-age').textContent = '—';
    $('live-slow').innerHTML = '';
    if (!LIVE._elog) { LIVE._elog = true; teleLog('LIVE FEED UNREACHABLE — FALLBACK: SYNTHETIC MODEL', 'alert'); }
  }
}
$('live-toggle').addEventListener('click', () => {
  LIVE.on = !LIVE.on;
  const b = $('live-toggle');
  b.classList.toggle('active', LIVE.on);
  b.textContent = LIVE.on ? 'LIVE LAYER · ON' : 'LIVE LAYER · OFF';
  teleLog(LIVE.on ? 'LIVE LAYER ENGAGED — MEASURED SPEEDS APPLIED' : 'LIVE LAYER BYPASSED — SYNTHETIC MODEL', LIVE.on ? 'ok' : 'warn');
  cameraChanged();
});

/* route index list */
const listEl = $('route-list');
function fmtDist(r) { return NETW.unit === 'KM' ? `${fmtInt(r.km)} KM` : `${fmtInt(r.mi)} MI`; }
function buildRouteList() {
  listEl.innerHTML = '';
  const idStyle = NETW.style === 'ID';
  ROUTES.forEach((r, i) => {
    const row = document.createElement('div');
    row.className = 'rt-row'; row.dataset.i = i;
    row.dataset.q = (r.n + ' ' + (r.dn || '')).toUpperCase();
    if (idStyle) {
      row.innerHTML = `<span class="rt-name">${r.n}</span>` +
        `<span class="rt-mi wide">${(r.dn || '').toUpperCase()} · ${fmtInt(r.km)} KM</span>` +
        `<span class="rt-axis">${r.isl || ''}</span>`;
    } else {
      row.innerHTML = `<span class="rt-name${r.aux ? ' aux' : ''}">${r.n}</span>` +
        `<span class="rt-mi">${fmtInt(r.mi)} MI</span><span class="rt-axis">${r.axis}</span>`;
    }
    row.addEventListener('click', () => selectRoute(i, true));
    listEl.appendChild(row);
  });
  $('route-count').textContent = `· ${NR} TRACKED`;
  $('route-search').value = '';
}
$('route-search').addEventListener('input', ev => {
  const q = ev.target.value.trim().toUpperCase().replace(/^I-/, '');
  for (const row of listEl.children)
    row.style.display = !q || row.dataset.q.includes(q) ? '' : 'none';
  renderHits(q);
});

/* ── city search: routes filter above doubles as a city finder ── */
const _cityIdxCache = {};
function cityIndex(key) {
  if (!_cityIdxCache[key])
    _cityIdxCache[key] = THEATERS[key].cities.map(c =>
      ({ name: c[0], q: c[0].toUpperCase(), lon: c[1], lat: c[2], tier: c[3] || 1.5, th: key }));
  return _cityIdxCache[key];
}
const hitsEl = $('city-hits');
let cityHits = [];
function renderHits(q) {
  cityHits = [];
  if (q.length < 2) { hitsEl.classList.remove('on'); hitsEl.innerHTML = ''; return; }
  const cur = [], other = [];
  for (const c of cityIndex(NETW.key)) if (c.q.includes(q)) cur.push(c);
  const nextKey = NETW.key === 'CONUS' ? 'NUSANTARA' : 'CONUS';
  for (const c of cityIndex(nextKey)) if (c.q.includes(q)) other.push(c);
  const rank = (a, b) => a.tier - b.tier || a.name.localeCompare(b.name);
  cur.sort(rank); other.sort(rank);
  cityHits = cur.slice(0, 6).concat(other.slice(0, 2));
  if (!cityHits.length) { hitsEl.classList.remove('on'); hitsEl.innerHTML = ''; return; }
  hitsEl.innerHTML = '';
  for (const c of cityHits) {
    const d = document.createElement('div');
    d.className = 'chit';
    const cross = c.th !== NETW.key;
    const tag = cross ? c.th + ' ▸' : c.tier >= 5.5 ? 'REGENCY' : c.tier < 1.5 ? 'METRO' : 'CITY·T' + Math.ceil(c.tier);
    d.innerHTML = `<span class="ch-d t${Math.min(6, Math.ceil(c.tier))}">◆</span>` +
      `<span class="ch-n">${c.name}</span><span class="ch-t">${tag}</span>`;
    d.addEventListener('mousedown', ev2 => { ev2.preventDefault(); flyToCity(c); });
    hitsEl.appendChild(d);
  }
  hitsEl.classList.add('on');
}
function hideHits() { hitsEl.classList.remove('on'); }
function flyToCity(c) {
  if (c.th !== NETW.key) switchTheater(c.th, true);
  const p = albers(c.lon, c.lat);
  const z = cam.zFit * (c.tier >= 5.5 ? 11 : c.tier >= 3.5 ? 9 : c.tier >= 2.5 ? 7.5 : c.tier >= 1.9 ? 6 : 4.6);
  flyTo(p[0], p[1], z, 1100);
  clearSelection();
  hideHits();
  teleLog(`TARGET LOCK → ${c.name.toUpperCase()} SECTOR`, 'ok');
}
$('route-search').addEventListener('focus', () => {
  const q = $('route-search').value.trim().toUpperCase().replace(/^I-/, '');
  if (q.length >= 2) renderHits(q);
});
$('route-search').addEventListener('keydown', ev => {
  if (ev.key === 'Enter') {
    if (cityHits.length) { flyToCity(cityHits[0]); ev.target.blur(); }
    else {
      const r = [...listEl.children].find(x => x.style.display !== 'none');
      if (r) { r.click(); ev.target.blur(); }
    }
  } else if (ev.key === 'Escape') {
    ev.target.value = ''; ev.target.dispatchEvent(new Event('input')); ev.target.blur();
  }
});
$('route-search').addEventListener('blur', () => setTimeout(hideHits, 120));

function shieldSVG(text, idStyle) {
  const body = idStyle ? '#0c5d36' : '#0a2470';
  const band = idStyle ? '#8a1f2d' : '#b31942';
  const bandTxt = idStyle ? 'T O L' : 'INTERSTATE';
  const rim = idStyle ? '#7dffc8' : '#dfe9ff';
  const tl = text.length;
  const fs = tl <= 1 ? 34 : tl === 2 ? 30 : tl === 3 ? 24 : tl === 4 ? 19 : 16;
  return `<svg viewBox="0 0 96 110">
    <path d="M48 5 L90 13 V54 C90 82 70 99 48 105 C26 99 6 82 6 54 V13 Z" fill="${body}"/>
    <path d="M48 5 L90 13 V33 H6 V13 Z" fill="${band}"/>
    <text x="48" y="27" text-anchor="middle" font-family="Orbitron,sans-serif" font-size="8.5"
      fill="#fff" letter-spacing="1.5" font-weight="700">${bandTxt}</text>
    <text x="48" y="${tl > 3 ? 79 : 83}" text-anchor="middle" font-family="Orbitron,sans-serif"
      font-size="${fs}" fill="#fff" font-weight="900">${text}</text>
    <path d="M48 5 L90 13 V54 C90 82 70 99 48 105 C26 99 6 82 6 54 V13 Z"
      fill="none" stroke="${rim}" stroke-width="3"/>
  </svg>`;
}
function nearestCity(lon, lat) {
  let best = null, bd = 1e9;
  for (const c of NETW.cities) {
    const d = hav(lon, lat, c[1], c[2]);
    if (d < bd) { bd = d; best = c[0]; }
  }
  return bd < 42 ? '≈ ' + best.toUpperCase() : bd < 110 ? 'NR ' + best.toUpperCase() : 'REMOTE SECTOR';
}
function fmtCoord(lon, lat) {
  return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
}

function selectRoute(i, fly) {
  selRoute = i;
  const r = ROUTES[i];
  const idStyle = NETW.style === 'ID';
  document.querySelectorAll('.rt-row.active').forEach(el => el.classList.remove('active'));
  const row = listEl.querySelector(`[data-i="${i}"]`);
  if (row) { row.classList.add('active'); row.scrollIntoView({ block: 'nearest' }); }
  $('rc-shield').innerHTML = shieldSVG(idStyle ? r.n : r.n.slice(2), idStyle);
  const nameEl = $('rc-name');
  nameEl.textContent = idStyle ? (r.dn || r.n) : r.n;
  nameEl.style.fontSize = idStyle && nameEl.textContent.length > 14 ? '16px' : '';
  $('rc-class').textContent = idStyle
    ? `JALAN TOL · ${r.isl} SECTOR`
    : (r.aux ? 'AUXILIARY · INTRASTATE LOOP' : 'PRIMARY · EISENHOWER SYSTEM');
  $('rc-mi').textContent = fmtDist(r);
  $('rc-axis').textContent = r.axis === 'EW' ? 'EAST–WEST' : 'NORTH–SOUTH';
  const t1 = r.axis === 'EW' ? 'WEST TERMINUS' : 'SOUTH TERMINUS';
  const t2 = r.axis === 'EW' ? 'EAST TERMINUS' : 'NORTH TERMINUS';
  $('rc-t1').innerHTML = `<span class="td">${t1}</span><br>${nearestCity(r.e[0][0], r.e[0][1])}<br><span class="td">${fmtCoord(r.e[0][0], r.e[0][1])}</span>`;
  $('rc-t2').innerHTML = `<span class="td">${t2}</span><br>${nearestCity(r.e[1][0], r.e[1][1])}<br><span class="td">${fmtCoord(r.e[1][0], r.e[1][1])}</span>`;
  $('route-card').classList.remove('hidden');
  teleLog(`TARGET LOCK ${r.dn || r.n} — ${fmtDist(r)} CORRIDOR`, 'warn');
  flashFX();
  if (fly) flyToRoute(i);
}
function updateRouteCardLive() {
  const vc = L.traffic ? routeVehCount[selRoute] : 0;
  $('rc-veh').textContent = L.traffic ? fmtInt(vc) : 'OFFLINE';
  const rs = vc ? routeSpdSum[selRoute] / vc : 0;
  $('rc-spd').textContent = vc ? (NETW.unit === 'KM' ? rs * 1.60934 : rs).toFixed(1) : '—';
  const d = densEff(), st = $('rc-status');
  if (d > 1.25) { st.textContent = 'FLOW: GRIDLOCK ⚠'; st.className = 'rc-status jam'; }
  else if (d > 0.85) { st.textContent = 'FLOW: HEAVY'; st.className = 'rc-status heavy'; }
  else if (d > 0.5) { st.textContent = 'FLOW: MODERATE'; st.className = 'rc-status heavy'; }
  else { st.textContent = 'FLOW: FREE'; st.className = 'rc-status'; }
}
function clearSelection() {
  selRoute = -1; selBbox = null;
  $('route-card').classList.add('hidden');
  document.querySelectorAll('.rt-row.active').forEach(el => el.classList.remove('active'));
}

/* fly-to tween */
let tween = null;
function flyTo(cx, cy, z, dur) { tween = { t0: performance.now(), dur, f: { ...cam }, t: { cx, cy, z } }; }
function flyToRoute(i) {
  const b = ROUTES[i].b;
  const p1 = albers(b[0], b[1]), p2 = albers(b[2], b[3]);
  const x0 = Math.min(p1[0], p2[0]), x1 = Math.max(p1[0], p2[0]);
  const y0 = Math.min(p1[1], p2[1]), y1 = Math.max(p1[1], p2[1]);
  const pad = 0.35 * Math.max(x1 - x0, y1 - y0, 0.02);
  const z = clamp(Math.min(VW / (x1 - x0 + 2 * pad), VH / (y1 - y0 + 2 * pad)), cam.zFit * 0.5, cam.zFit * 34);
  flyTo((x0 + x1) / 2, (y0 + y1) / 2, z, 950);
  updateSelBbox();
}
function stepTween(now) {
  if (!tween) return;
  const k = clamp((now - tween.t0) / tween.dur, 0, 1);
  const e = 1 - Math.pow(1 - k, 3);
  cam.cx = lerp(tween.f.cx, tween.t.cx, e);
  cam.cy = lerp(tween.f.cy, tween.t.cy, e);
  cam.z = lerp(tween.f.z, tween.t.z, e);
  cameraChanged();
  if (k >= 1) tween = null;
}
function flashFX() { const f = $('fx-flash'); f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 70); }

/* ── theater switching ──────────────────────────────────────── */
function updateTheaterChrome() {
  $('tb-sub').textContent = NETW.sub;
  $('stat-net-label').textContent = NETW.unit === 'KM' ? 'NET KM' : 'NET MI';
  $('stat-spd-label').textContent = NETW.unit === 'KM' ? 'AVG KM/H' : 'AVG MPH';
  $('rc-spd-label').textContent = NETW.unit === 'KM' ? 'ROUTE AVG KM/H' : 'ROUTE AVG MPH';
  $('stat-mi').textContent = fmtInt(NETW.unit === 'KM' ? NETW.net.STATS.km : NETW.net.STATS.miles);
  $('stat-rt').textContent = NETW.net.STATS.routes;
}
function switchTheater(key, silent) {
  if (NETW.key === key) return;
  buildTheater(key);
  routeVehCount = new Int32Array(NR); routeSpdSum = new Float32Array(NR);
  vN = 0; hoverEdge = -1;
  if (LIVE.lastSegs) LIVE.mapped = matchLive(LIVE.lastSegs);
  if (LIVE.fetchedAt && !LIVE.err)
    $('live-map').textContent = LIVE.mapped ? `${fmtInt(LIVE.n)} / ${fmtInt(LIVE.mapped)} SEGS` : 'NO COVERAGE IN THEATER';
  clearSelection(); clearVeh();
  buildRouteList(); updateTheaterChrome();
  resize(); fitView(); retraceBaseNow();
  document.querySelectorAll('#theater-seg button').forEach(b =>
    b.classList.toggle('active', b.dataset.theater === key));
  if (!silent) {
    quickBoot(key);
    teleLog(`THEATER RETARGET → ${key} SECTOR NET`, 'warn');
  }
}
for (const b of document.querySelectorAll('#theater-seg button'))
  b.addEventListener('click', () => switchTheater(b.dataset.theater));

/* controls */
for (const b of document.querySelectorAll('.tbtn.spd')) {
  b.addEventListener('click', () => {
    document.querySelectorAll('.tbtn.spd').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    timeScale = +b.dataset.spd; paused = false;
    $('btn-pause').textContent = '⏸';
    teleLog(`TIME DILATION SET ${timeScale}×`, 'ok');
  });
}
$('btn-pause').addEventListener('click', togglePause);
function togglePause() {
  paused = !paused;
  $('btn-pause').textContent = paused ? '▶' : '⏸';
  teleLog(paused ? 'SIMULATION HELD' : 'SIMULATION RESUMED', paused ? 'alert' : 'ok');
}
for (const b of document.querySelectorAll('#density-seg button')) {
  b.addEventListener('click', () => {
    document.querySelectorAll('#density-seg button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    densMult = +b.dataset.d;
    teleLog(`DENSITY PRESET ${b.textContent}`, 'ok');
  });
}
for (const b of document.querySelectorAll('#layer-seg button')) {
  b.addEventListener('click', () => {
    b.classList.toggle('active');
    L[b.dataset.layer] = b.classList.contains('active');
    for (const id of ['fx-scan', 'fx-vignette', 'fx-sweep'])
      $(id).style.display = L.fx ? '' : 'none';
    cameraChanged(); retraceBaseNow();
  });
}
$('zoom-in').addEventListener('click', () => { cam.z = clamp(cam.z * 1.45, cam.zFit * 0.4, cam.zFit * 60); cameraChanged(); });
$('zoom-out').addEventListener('click', () => { cam.z = clamp(cam.z / 1.45, cam.zFit * 0.4, cam.zFit * 60); cameraChanged(); });
$('zoom-reset').addEventListener('click', () => { fitView(); teleLog('CAMERA RESET TO THEATER VIEW', 'ok'); });
for (const h of document.querySelectorAll('.panel-head')) {
  h.addEventListener('click', () => {
    const body = $(h.dataset.collapse);
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : '';
    h.querySelector('.ph-tick').textContent = open ? '▾' : '▸';
  });
}

/* ── 9 · pointer / keyboard ─────────────────────────────────── */
const chip = $('hover-chip');
let dragging = false, dragMoved = 0, lastMX = 0, lastMY = 0;
mapCv.addEventListener('mousedown', e => { dragging = true; dragMoved = 0; lastMX = e.clientX; lastMY = e.clientY; document.body.classList.add('panning'); });
window.addEventListener('mouseup', () => { dragging = false; document.body.classList.remove('panning'); });
window.addEventListener('mousemove', e => {
  if (dragging) {
    const dx = e.clientX - lastMX, dy = e.clientY - lastMY;
    dragMoved += Math.abs(dx) + Math.abs(dy);
    cam.cx -= dx / cam.z; cam.cy += dy / cam.z;
    lastMX = e.clientX; lastMY = e.clientY;
    cameraChanged();
  }
  hoverEdge = (e.target === mapCv && !dragging) ? pickEdge(e.clientX, e.clientY) : -1;
  if (hoverEdge >= 0) {
    const r = ROUTES[eR[hoverEdge]];
    chip.classList.remove('hidden');
    chip.classList.toggle('aux', !!r.aux);
    chip.innerHTML = `${r.n} <small>· ${fmtDist(r)} · CLICK TO LOCK</small>`;
    chip.style.left = Math.min(e.clientX + 16, VW - 190) + 'px';
    chip.style.top = Math.max(e.clientY - 34, 84) + 'px';
  } else chip.classList.add('hidden');
  const w = [(e.clientX - VW / 2) / cam.z + cam.cx, cam.cy - (e.clientY - VH / 2) / cam.z];
  const ll = albersInv(w[0], w[1]);
  $('cursor-read').textContent = `CURSOR ${fmtCoord(ll[0], ll[1])} · ZOOM ${(cam.z / cam.zFit).toFixed(1)}× · DAY ${simDay}`;
});
mapCv.addEventListener('click', () => {
  hideHits();
  if (dragMoved > 6) return;
  if (hoverEdge >= 0) selectRoute(eR[hoverEdge], true);
  else clearSelection();
});
mapCv.addEventListener('wheel', e => {
  e.preventDefault();
  wheelT = performance.now();
  const f = e.deltaY < 0 ? 1.16 : 1 / 1.16;
  const nz = clamp(cam.z * f, cam.zFit * 0.4, cam.zFit * 60);
  const u = (e.clientX - VW / 2), v = (VH / 2 - e.clientY);
  cam.cx += u / cam.z - u / nz; cam.cy += v / cam.z - v / nz;
  cam.z = nz; cameraChanged();
}, { passive: false });
window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') { e.preventDefault(); togglePause(); }
  else if (e.key === 'Escape') clearSelection();
  else if (e.key === '/') { e.preventDefault(); $('route-search').focus(); }
  else if (e.key === 'r') fitView();
  else if (e.key === 'Tab') { e.preventDefault(); switchTheater(NETW.key === 'CONUS' ? 'NUSANTARA' : 'CONUS'); }
  else if ('1234'.includes(e.key)) document.querySelectorAll('.tbtn.spd')[+e.key - 1].click();
});
window.addEventListener('resize', resize);
mapCv.addEventListener('dblclick', e => {
  const nz = clamp(cam.z * 2.0, cam.zFit * 0.4, cam.zFit * 60);
  const u = (e.clientX - VW / 2), v = (VH / 2 - e.clientY);
  cam.cx += u / cam.z - u / nz; cam.cy += v / cam.z - v / nz;
  cam.z = nz; cameraChanged();
});

/* ── 10 · boot & start ──────────────────────────────────────── */
function bootLines(key) {
  const T = THEATERS[key], st = T.net.STATS;
  return [
    [`ESTABLISHING UPLINK TO ${T.agency} SENSOR MESH ......... OK`, 'ok'],
    [`THEATER: ${key} — ${T.sub.toLowerCase()}`, ''],
    [`LOADING NETWORK GRAPH · ${fmtInt(st.nodes)} NODES / ${fmtInt(st.edges)} SEGMENTS`, 'ok'],
    [`PARSING ${st.routes} ROUTE DESIGNATIONS ............... OK`, ''],
    ['CALIBRATING DIURNAL TRAFFIC MODEL .............. OK', ''],
    ['ARMING VEHICLE AGENTS · MAX 5,600 UNITS ........ OK', ''],
    ['SUBSCRIBING NYCDOT SPEEDLINK FEED ............ LIVE', 'ok'],
    [`GEO-PROJECTION ALBERS ${key} LOCKED ............ OK`, ''],
    [`WARNING: ${T.warn}`, 'warn'],
    ['ALL SYSTEMS NOMINAL — NETWORK LIVE', 'ok']
  ];
}
function runBoot(key, fast) {
  const boot = $('boot'), log = $('boot-log'), fill = $('boot-fill');
  const lines = bootLines(key);
  boot.classList.remove('done');
  log.innerHTML = ''; fill.style.width = '0%';
  let step = 0;
  const tick = () => {
    if (step < lines.length) {
      const [txt, cls] = lines[step];
      if (!fast || cls !== '' || step === lines.length - 1) {
        const d = document.createElement('div');
        if (cls === 'warn') d.className = 'warn';
        d.textContent = '> ' + txt;
        log.appendChild(d);
      }
      fill.style.width = ((step + 1) / lines.length * 100) + '%';
      step++;
      setTimeout(tick, fast ? 80 : 180 + Math.random() * 140);
    } else {
      setTimeout(() => { boot.classList.add('done'); }, fast ? 500 : 650);
    }
  };
  tick();
}
function quickBoot(key) { runBoot(key, true); }

/* init */
buildTheater('CONUS');
routeVehCount = new Int32Array(NR); routeSpdSum = new Float32Array(NR);
buildRouteList(); updateTheaterChrome();
resize();
fitView();
runBoot('CONUS', false);
refreshLive(true);
setInterval(refreshLive, 76000);
setTimeout(() => {
  document.querySelectorAll('.hud-hidden').forEach((el, i) =>
    setTimeout(() => el.classList.remove('hud-hidden'), 120 + i * 90));
  teleLog('NETWORK ONLINE — TRACKING ALL CORRIDORS', 'ok');
}, 2400);
requestAnimationFrame(frame);
})();
