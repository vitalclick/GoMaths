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


def process(src_path, target_w, target_h):
    im = Image.open(src_path).convert("RGB")

    # sample the screenshot's own background color (top-left corner, just
    # inside the status bar) so the pillarbox bars blend in seamlessly
    fill = im.getpixel((2, 2))

    canvas = Image.new("RGB", (target_w, target_h), fill)

    fg = im.copy()
    fg.thumbnail((target_w, target_h), Image.LANCZOS)
    # counteract the softness introduced by upscaling small source screenshots
    fg = fg.filter(ImageFilter.UnsharpMask(radius=1.5, percent=60, threshold=2))

    paste_x = (target_w - fg.width) // 2
    paste_y = (target_h - fg.height) // 2
    canvas.paste(fg, (paste_x, paste_y))
    return canvas


def main():
    for idx, fname in enumerate(SRC_FILES, start=1):
        src_path = os.path.join(SRC_DIR, fname)
        for folder, w, h in TARGETS:
            out_dir = os.path.join(OUT_ROOT, folder)
            os.makedirs(out_dir, exist_ok=True)
            out_path = os.path.join(out_dir, f"screenshot_{idx}.png")
            result = process(src_path, w, h)
            result.save(out_path, format="PNG")
            print(f"{fname} -> {out_path} ({result.size[0]}x{result.size[1]})")


if __name__ == "__main__":
    main()
