# Store screenshots

`Screenshots (1-8).jpeg` are the raw phone screenshots. `convert_screenshots.py` converts
them into the exact sizes required by Google Play Console and App Store Connect:

| Folder | Store / device | Size | Treatment |
|---|---|---|---|
| `google-play/phone/` | Google Play, phone | 1080x1920 (9:16) | full-bleed crop, zero margin |
| `google-play/tablet-7in/` | Google Play, 7" tablet | 1080x1920 (9:16) | full-bleed crop, zero margin |
| `google-play/tablet-10in/` | Google Play, 10" tablet | 1280x2276 (9:16) | full-bleed crop, zero margin |
| `apple/iphone-6.5in/` | App Store Connect, iPhone 6.5" Display | 1284x2778 | full-bleed crop, zero margin |
| `apple/ipad-13in/` | App Store Connect, iPad 13" Display | 2064x2752 | letterboxed, no crop |

All files are 24-bit PNG (no alpha channel), well under each store's size limit.

## How they were made

The source screenshots are small (~320x700 px) and shot on a taller-than-16:9 phone (roughly
19.5:9). Each target is handled one of two ways, set per-target in `convert_screenshots.py`:

- **`cover`** (Google Play sizes, iPhone 6.5"): the image is upscaled to completely fill the
  target canvas, then the overflow is cropped away - no side margins. The crop is biased
  toward the top (status bar/header space, which is disposable) rather than the bottom, since
  these designs run edge-to-edge at the bottom with nav bars/CTA buttons that have almost no
  safe margin. `TOP_CROP_BIAS` holds a per-screenshot value tuned by eye so no heading, button,
  or nav bar is clipped. The iPhone 6.5" target (1284x2778, ratio 0.462) is a near-exact match
  for the source screenshots' own ratio (~0.45-0.49), so its crop is negligible (0-3% of the
  height) - effectively no content is lost.
- **`contain`** (iPad 13"): the iPad target ratio (0.75, i.e. ~3:4) is dramatically different
  from these phone screenshots (~0.46) - cropping to fill it would cut away roughly 40% of
  every screenshot's content, which isn't an acceptable trade. Instead the image is scaled to
  fit entirely within the canvas and letterboxed with a color sampled from the screenshot's own
  background, so nothing is cropped.

Every upscale gets a light unsharp-mask pass to offset the softness introduced by scaling up
such small originals.

Because the originals are low-resolution, the exported images are upscaled and won't be as
sharp as a fresh capture straight from a device. For best results:
- Recapture phone screenshots directly at a higher resolution (1080x1920 or higher) and re-run
  `convert_screenshots.py` rather than relying on this upscaled/cropped set for production
  store listings.
- For the iPad slot specifically, a screenshot captured on an actual iPad (showing the app's
  real tablet layout, if it has one) will look far better than a letterboxed phone screenshot -
  treat `apple/ipad-13in/` as a placeholder until one is available.
