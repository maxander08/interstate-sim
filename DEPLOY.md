# Deploying INTERSTATE GRID

The whole app is **static** — no build step, no backend required.

## What you deploy
Upload the contents of `dist/` (this folder):

```
index.html
css/style.css
js/app.js + js/data-*.js
```

## How live traffic works when hosted statically
The app first tries `api/live-traffic` (the Python proxy used during development).
On a static host that URL is absent, so the app automatically switches to calling
the NYCDOT Socrata open-data API **directly from the browser** (the API is CORS-open).
No keys, no config — it just works. If the feed is unreachable, the HUD degrades
to the synthetic traffic model and says so.

## Host options (all free tiers)

### Netlify Drop — fastest, ~30 seconds
1. Go to https://app.netlify.com/drop (free login)
2. Drag the **`dist` folder** onto the page
3. You get `https://<random-name>.netlify.app` immediately; rename in Site settings

### Vercel
```sh
npm i -g vercel
cd dist
vercel deploy --prod        # answer prompts, pick "Other" preset, no build
```

### GitHub Pages
```sh
git init && git add . && git commit -m "interstate grid"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
# then repo → Settings → Pages → Source: main branch, / (root)
```
Site appears at `https://<you>.github.io/<repo>/` (subpath-safe: all asset URLs are relative).

### Cloudflare Pages
Dashboard → Pages → "Upload assets" → drag the `dist` folder.

### Any web server / NAS / S3
Copy `dist/` somewhere that serves static files. For S3-style bucket hosting,
`aws s3 sync dist s3://<bucket>` and enable static website hosting.

## Optional: running WITH the proxy (fresher live data, cached)
`tools/server.py` serves the app + `/api/live-traffic` (75 s cache, stale-serve).
Useful on a VM or `python3 -m http.server` replacement; for any plain static host
you don't need it — the direct-browser fallback covers it.
