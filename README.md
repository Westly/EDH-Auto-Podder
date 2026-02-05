# FNM Podder (MTG Commander Pod Organizer)

Static SPA (React + TypeScript + Vite) designed for quick in-store Commander pod organization.

## Requirements satisfied
- Static SPA deployable to Cloudflare Pages (no backend)
- Persists all state to localStorage key: "fnm_podder_state_v1"
- Includes Cloudflare Pages SPA redirect: public/_redirects
- Deterministic Auto Pod behavior (stable sorting, no random seat assignments)
- Undo/Redo (20 steps), Export/Import with schema validation
- Drag & drop via dnd-kit + accessible fallback actions

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
