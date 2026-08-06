"""Convert the raw phone screenshots in UI/store/ into Google Play Console's
required phone / 7-inch tablet / 10-inch tablet screenshot sizes.

Usage: python3 convert_screenshots.py   (run from anywhere; paths are relative to this file)

Requires Pillow: pip install pillow
"""
import os
from PIL import Image, ImageFilter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.dirname(SCRIPT_DIR)
OUT_ROOT = SCRIPT_DIR

# (folder, width, height) - all satisfy Google Play's stated ranges:
#  phone / 7" tablet: each side 320-3,840 px
#  10" tablet: each side 1,080-7,680 px
TARGETS = [
    ("phone", 1080, 1920),
    ("tablet-7in", 1080, 1920),
    ("tablet-10in", 1280, 2276),
]

SRC_FILES = [f"Screenshots ({i}).jpeg" for i in range(1, 9)]


# Per-screenshot override for how the vertical crop is split, as the
# fraction taken from the top (status bar side) vs. the bottom (nav/button
# side). Higher = more taken from the top. Tuned by eye per screenshot so
# no header text or button/nav content gets clipped.
TOP_CROP_BIAS = {
    1: 1.0,
    2: 0.9,
    3: 1.0,
    4: 1.0,
    5: 1.0,
    6: 1.0,
    7: 1.0,
    8: 1.0,
}


def process(src_path, target_w, target_h, top_bias):
    im = Image.open(src_path).convert("RGB")

    # Cover-fill: scale up so the image completely fills the target canvas
    # (no side margins), then crop the overflow off the top/bottom.
    scale = max(target_w / im.width, target_h / im.height)
    new_size = (round(im.width * scale), round(im.height * scale))
    fg = im.resize(new_size, Image.LANCZOS)
    # counteract the softness introduced by upscaling small source screenshots
    fg = fg.filter(ImageFilter.UnsharpMask(radius=1.5, percent=60, threshold=2))

    overflow_h = fg.height - target_h
    crop_top = round(overflow_h * top_bias)
    overflow_w = fg.width - target_w
    crop_left = overflow_w // 2

    return fg.crop((crop_left, crop_top, crop_left + target_w, crop_top + target_h))


def main():
    for idx, fname in enumerate(SRC_FILES, start=1):
        src_path = os.path.join(SRC_DIR, fname)
        for folder, w, h in TARGETS:
            out_dir = os.path.join(OUT_ROOT, folder)
            os.makedirs(out_dir, exist_ok=True)
            out_path = os.path.join(out_dir, f"screenshot_{idx}.png")
            result = process(src_path, w, h, TOP_CROP_BIAS[idx])
            result.save(out_path, format="PNG")
            print(f"{fname} -> {out_path} ({result.size[0]}x{result.size[1]})")


if __name__ == "__main__":
    main()
