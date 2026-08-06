"""Convert the raw phone screenshots in UI/store/ into the screenshot sizes required by
Google Play Console and App Store Connect.

Usage: python3 convert_screenshots.py   (run from anywhere; paths are relative to this file)

Requires Pillow: pip install pillow
"""
import os
from PIL import Image, ImageFilter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = SCRIPT_DIR
OUT_ROOT = SCRIPT_DIR

# (folder, width, height) - every target is scaled to fill the canvas
# completely and cropped to size, for zero side margin. Google Play (each
# side 320-3,840 px for phone/7" tablet, 1,080-7,680 px for 10" tablet) and
# App Store Connect (iPhone 6.5" / iPad 13" Display) sizes:
TARGETS = [
    ("google-play/phone", 1080, 1920),
    ("google-play/tablet-7in", 1080, 1920),
    ("google-play/tablet-10in", 1280, 2276),
    ("apple/iphone-6.5in", 1284, 2778),
    ("apple/ipad-13in", 2064, 2752),
]

SRC_FILES = [f"Screenshots ({i}).jpeg" for i in range(1, 9)]


# Per-screenshot override for how the vertical crop is split, as the
# fraction taken from the top (status bar side) vs. the bottom (nav/button
# side). Higher = more taken from the top. Tuned by eye per screenshot so
# no header text or button/nav content gets clipped. Keyed per-target
# because the iPad 13" canvas (~3:4) needs a much bigger crop than the
# phone-ratio targets (~9:16), so it needs its own tuning.
TOP_CROP_BIAS = {
    "google-play/phone": {1: 1.0, 2: 0.9, 3: 1.0, 4: 1.0, 5: 1.0, 6: 1.0, 7: 1.0, 8: 1.0},
    "google-play/tablet-7in": {1: 1.0, 2: 0.9, 3: 1.0, 4: 1.0, 5: 1.0, 6: 1.0, 7: 1.0, 8: 1.0},
    "google-play/tablet-10in": {1: 1.0, 2: 0.9, 3: 1.0, 4: 1.0, 5: 1.0, 6: 1.0, 7: 1.0, 8: 1.0},
    "apple/iphone-6.5in": {1: 1.0, 2: 0.9, 3: 1.0, 4: 1.0, 5: 1.0, 6: 1.0, 7: 1.0, 8: 1.0},
    "apple/ipad-13in": {1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.0, 6: 1.0, 7: 1.0, 8: 1.0},
}


def _upscale(im, new_size):
    fg = im.resize(new_size, Image.LANCZOS)
    # counteract the softness introduced by upscaling small source screenshots
    return fg.filter(ImageFilter.UnsharpMask(radius=1.5, percent=60, threshold=2))


def process(im, target_w, target_h, top_bias):
    # Cover-fill: scale up so the image completely fills the target canvas
    # (no side margins), then crop the overflow off the top/bottom.
    scale = max(target_w / im.width, target_h / im.height)
    fg = _upscale(im, (round(im.width * scale), round(im.height * scale)))

    overflow_h = fg.height - target_h
    crop_top = round(overflow_h * top_bias)
    overflow_w = fg.width - target_w
    crop_left = overflow_w // 2

    return fg.crop((crop_left, crop_top, crop_left + target_w, crop_top + target_h))


def main():
    for idx, fname in enumerate(SRC_FILES, start=1):
        src_path = os.path.join(SRC_DIR, fname)
        im = Image.open(src_path).convert("RGB")
        for folder, w, h in TARGETS:
            out_dir = os.path.join(OUT_ROOT, folder)
            os.makedirs(out_dir, exist_ok=True)
            out_path = os.path.join(out_dir, f"screenshot_{idx}.png")
            result = process(im, w, h, TOP_CROP_BIAS[folder][idx])
            result.save(out_path, format="PNG")
            print(f"{fname} -> {out_path} ({result.size[0]}x{result.size[1]})")


if __name__ == "__main__":
    main()
