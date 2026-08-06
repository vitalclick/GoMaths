# Google Play screenshots

Generated from the raw screenshots in `UI/store/Screenshots (1-8).jpeg`, converted to meet
Google Play Console's asset requirements:

| Folder | Device | Size | Spec |
|---|---|---|---|
| `phone/` | Phone | 1080x1920 (9:16) | each side 320-3,840 px |
| `tablet-7in/` | 7-inch tablet | 1080x1920 (9:16) | each side 320-3,840 px |
| `tablet-10in/` | 10-inch tablet | 1280x2276 (9:16) | each side 1,080-7,680 px |

All files are 24-bit PNG (no alpha channel), well under the 8 MB limit.

## How they were made

The source screenshots are small (~320x700 px) and shot on a taller-than-16:9 phone
(roughly 19.5:9), which is narrower than the 9:16 floor Google Play requires. To get full-bleed,
zero-margin images (no pillarbox bars) each one was:

1. Upscaled with Lanczos resampling to completely cover the target canvas (scaled by width, so
   there's no empty space on the sides).
2. Cropped vertically to the exact target height. The crop is biased toward the top of the
   shot (`TOP_CROP_BIAS` per screenshot in `convert_screenshots.py`) since the status bar and
   decorative header space there is disposable, whereas the bottom of these designs is edge-to-
   edge with nav bars/buttons and has almost no safe margin. Each bias was tuned by eye so no
   heading, button, or nav bar is clipped.
3. Given a light unsharp-mask pass to offset softness introduced by the upscale.

Because the originals are low-resolution, the exported images are upscaled and won't be as
sharp as a fresh capture straight from a device. For best results, recapture screenshots
directly at 1080x1920 (or higher) on a 9:16 device/simulator and re-run
`convert_screenshots.py` in this folder rather than relying on this upscaled/cropped set for
production store listings.
