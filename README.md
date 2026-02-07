# FNM Podder (MTG Commander Pod Organizer)

Static SPA (React + TypeScript + Vite) designed for quick local game store Commander pod organization. Handles groups; pairs; and single players. Include the ability to classify players and pods with nearest peers to keep game preference aligned. 

## Requirements satisfied
- Static SPA deployable to Cloudflare Pages
- Persists all state to localStorage 
- Includes Cloudflare Pages SPA redirect: public/_redirects
- Deterministic Auto Pod behavior
- Undo/Redo (20 steps), Export/Import with schema validation

## Run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Test (Auto Pod)
```bash
npm run test
```

## Cloudflare Pages
- Build command: npm run build
- Output directory: dist
- SPA redirect: public/_redirects -> dist/_redirects
