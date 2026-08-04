# Landing page assets

## gomaths-logo.png — REPLACE THIS FILE

**The file currently here is a stand-in, not the real logo.**

It is the square GoMaths app icon (`UI/App Icon-2.png`), dropped in so the
build stays green. The intended asset is the **horizontal wordmark** — the
green "GO" with the red check, followed by "MATHS" in dark grey.

To fix: save the wordmark PNG over `gomaths-logo.png`, keeping the
filename. Nothing else needs to change — `src/components/site.tsx` imports
it by name and Vite handles the rest. It renders at `h-7` in the site
header, so roughly 400–600px wide with a transparent background is ample.

### Why the original was missing

Lovable stored the logo in its own R2 bucket and committed only a pointer,
`gomaths-logo.png.asset.json`, holding a `/__l5e/assets-v1/...` URL. That
URL resolves on Lovable's hosting and nowhere else, so every self-hosted
build 404'd the logo. The pointer has been deleted and the import now
resolves to a real bundled file.

Watch for this pattern with any future Lovable asset: a `.asset.json` in
the repo means the actual binary is not in the repo.

## favicon.png

Lives in `../../public/favicon.png` (referenced as `/favicon.png` from
`src/routes/__root.tsx`). Generated at 256×256 from `UI/App Icon-2.png`,
which is the correct icon — no action needed.
