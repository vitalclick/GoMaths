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

The source screenshots are small (~320x700 px) and not natively 9:16, so each one was:

1. Upscaled with Lanczos resampling to fit within the target canvas without cropping any UI.
2. Centered on a solid-color background sampled from the screenshot's own top corner
   (the app's off-white background), so the pillarbox bars blend in seamlessly.
3. Given a light unsharp-mask pass to offset softness introduced by the upscale.

Because the originals are low-resolution, the exported images are upscaled and won't be as
sharp as a fresh capture straight from a device. For best results, recapture screenshots
directly at 1080x1920 (or higher) and re-run `convert_screenshots.py` in this folder rather
than relying on this upscaled set for production store listings.
