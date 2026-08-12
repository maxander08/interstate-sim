# INTERSTATE GRID — Highway Traffic Simulation Console

A sci-fi HUD simulator for major highway networks, with live agent-based traffic.
Two theaters (switch with the buttons in the title bar or `TAB`):

- **CONUS** — the entire US Interstate System (Alaska & Hawaii excluded)
- **NUSANTARA** — Indonesia's toll roads (jalan tol): Trans-Java, Trans-Sumatra,
  Kalimantan, Sulawesi & Bali corridors

## Run

```bash
cd interstate-sim
python3 tools/server.py     # static files + /api/live-traffic proxy on :8000
# open http://localhost:8000
```

(`python3 -m http.server` also works, but the live layer will report OFFLINE.)

## Live traffic data

`/api/live-traffic` aggregates **real, live measured speeds** from the free
**NYCDOT NBE Speedlink** feed (Socrata `i4gi-tjb9`, no API key), refreshed upstream
every few minutes and cached server-side for 75s. Client-side, segment polylines
are snapped onto the simulated graph (~460 m radius); mapped edges then:

- drive **actual vehicle speeds** (a real 7 mph BQE jam makes the dots crawl)
- get a **speed-ratio skin**: red ▸ orange ▸ yellow ▸ green
- feed the ticker + a "slowest corridors" list in the LIVE UPLINK panel

Coverage: the open feed is NYC-metro only (maps to ~50-60 interstate segments:
BQE, FDR, LIE, Cross Bronx, I-87…). The NUSANTARA theater has no open equivalent —
the panel reports "NO COVERAGE IN THEATER" and the synthetic model takes over, as it
does worldwide wherever no link matched. If the feed is unreachable the sim falls
back to the synthetic model automatically. Default time dilation is **1×** (real time).

## Data sources

| Theater | Roads (simulated) | Backdrop layers |
|---|---|---|
| CONUS (221 routes, 14.2k nodes) | US Census **TIGER 2024 Primary Roads** (`RTTYP = I`) | US/State/named arterials (`RTTYP U/S/M` — 11.5k polylines) · **Census cb 5m state boundaries** · county 500k mesh (3.4k rings) · NE **cities (547, 5 population tiers)** · NE lakes & rivers |
| NUSANTARA (103 toll roads, 7.6k nodes) | **OpenStreetMap** via Overpass (`highway=motorway`) | OSM **national-road mesh via Overpass** (`trunk/primary` — numbered refs + long segments, **21.7k polylines** in 2 classes) · **geoBoundaries IDN ADM1 provinces (34)** · **ADM2 regency mesh (519 kabupaten/kota → 2.0k rings)** · NE **cities (104, 3 tiers) + 271 regency-seat labels** · NE hydro |

All vector, all procedurally rendered on canvas — **no raster/basemap tiles anywhere**.
Totals calibrated: 46,876 mi (US, official) / 2,850 km (Indonesia, ≈ BPJT).

`tools/build_data.py` / `build_data_id.py` / `build_id_extra.py` rebuild `js/data-*.js`;
every source auto-downloads when missing and bulky intermediates self-delete after builds.

## Cities — priority + search

- **Population-ranked tiers** (Google-Maps style): metros always visible → majors at 1.15× →
  cities at 1.75× → towns at 2.6–3.1× → **regency seats (ID)** at 3.8×.
- Labels **declutter by priority** (biggest city wins the collision) and fade in at their zoom gate.
- The scan box searches **routes and cities at once** — including the *other* theater
  (type `jakarta` from CONUS and it offers a cross-theater jump). `ENTER` or click = fly-to lock.

## Layers (telemetry panel)

FLOW · LABELS · CITIES (tiered) · GRATICULE · STATES · **ARTERIES** · **COUNTY** (US mesh) ·
**HYDRO** (lakes/rivers) · FX — plus the LIVE layer toggle.

## Simulation

- Up to **5,600 vehicle agents** route hop-by-hop across the real road graph
  (13,662 edges). At each junction they prefer staying on their current route and
  continuing straight, so flows look organic.
- **Diurnal model**: morning / evening rush-hour waves modulate vehicle count and speed.
- Density presets: CALM / NORMAL / HEAVY / **GRIDLOCK** (avg speed collapses to ~14 mph).
- Time dilation: 1× / 90× / 300× / 900×, pausable. Clock starts at your local time.
- Vehicle colors = heading: cyan E · mint N · amber W · violet S. Big rectangles = trucks.

## Performance

- **Smooth pan/zoom**: while the camera moves, the map stretches the previous base layer
  (Google-Maps-style) and retraces the full vector stack only on settle (~90 ms debounce;
  hard-refresh at most every 0.26 s when idle-ish, 2 s safety cap)
- Backdrop geometry is **viewport-culled** (precomputed world bboxes) and point-decimated at
  coarse zoom; the hover pick-grid rebuilds at most once per frame
- Three-canvas architecture: persistent base (redrawn only on retrace) · trail layer with
  **scissored fade** (only 24 px cells containing trail energy get faded) · transparent FX
  overlay; vehicle dots batched by colour (4 fillStyle switches per frame, not thousands)
- The HUD scanline overlay no longer uses `mix-blend-mode: multiply` (it forced an unfused
  full-viewport blend every single frame — the one-line fix was worth ~2.6× fps alone)
- Measured in software-rendered headless Chromium (worst case; real GPU browsers run far higher):
  sustained CONUS drag **4.3 → 30+ fps (≈7×)** — and pan/wheel frames now cost the same as idle

## Controls

- **Drag** pan · **wheel** zoom (double-click zooms in)
- **Hover** any highway to identify it, **click** to target-lock (fly-to + telemetry card)
- `TAB` switch theater (conus ⇄ nusantara)
- `ESC` release lock · `SPACE` pause · `1–4` time speed · `R` reset view · `/` search routes + cities, `ENTER` fly-to
- Route index (left) — searchable (routes **and** cities, both theaters); click to fly. IDs show island sector tag
- Telemetry (right) — 24 h load curve, density presets, layer toggles, camera

## Files

```
index.html            shell + HUD DOM
css/style.css         sci-fi HUD theme (scanlines, chamfered panels, glow)
js/app.js             renderer + agent simulation (no dependencies)
js/data-routes.js     US network graph + US/State arterial backdrop
js/data-states.js     US detailed boundaries · counties · cities · hydro
js/data-id.js         ID toll-road graph + provinces (NE) + cities
js/data-id-extra.js   ID detail pack: OSM road mesh · regency/province borders · tiered cities · hydro
tools/server.py       static server + NYCDOT live-traffic proxy/cache
tools/build_data.py   pipeline: TIGER + census boundaries + NE → compact JS data
tools/build_data_id.py pipeline: Overpass OSM + Natural Earth → compact JS data
tools/build_id_extra.py pipeline: ID backdrop (Overpass, w/ NE clip fallback)
tools/build_id_detail.py pipeline: ID detail pack (Overpass t/p + geoBoundaries ADM1/ADM2 + NE cities)
tools/verify*.js      Playwright smoke tests (screenshots)
```
