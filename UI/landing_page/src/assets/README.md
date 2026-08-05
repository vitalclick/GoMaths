# Landing page assets

## gomaths-logo.png

The GoMaths horizontal wordmark. Source of truth is `UI/Logo-refined.png`
(1804×300); this copy is downscaled to 900×150, which is still 3× the
largest size it renders at (`h-12` in the hero) and roughly halves the
bytes.

To update it, replace this file — `src/components/site.tsx` and
`src/routes/index.tsx` both import it by name and Vite handles the rest.

### Why it is committed rather than referenced

Lovable originally stored the logo in its own R2 bucket and committed only
a pointer, `gomaths-logo.png.asset.json`, holding a `/__l5e/assets-v1/...`
URL. That URL resolves on Lovable's hosting and nowhere else, so every
self-hosted build 404'd the logo.

Watch for this with any future Lovable asset: **a `.asset.json` in the repo
means the actual binary is not in the repo.**

## favicon.png

Lives in `../../public/favicon.png` (referenced as `/favicon.png` from
`src/routes/__root.tsx`). Generated at 256×256 from `UI/App Icon-2.png`.
