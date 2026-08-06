"""Generate the Google Play feature graphic (1024x500, 24-bit PNG, no alpha).

Draws the GoMaths brand banner from scratch: brand-green gradient background,
the Maxi mascot (ported from packages/ui/src/Maxi.tsx's geometry), the
official wordmark (UI/Logo-refined.png, recolored for a dark background),
and a short tagline.

Usage: python3 generate_feature_graphic.py
Requires Pillow: pip install pillow
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
LOGO_PATH = os.path.join(REPO_ROOT, "UI", "Logo-refined.png")
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
OUT_PATH = os.path.join(SCRIPT_DIR, "google-play", "feature-graphic.png")

W, H = 1024, 500

# Brand greens sampled from UI/App Icon-2.png
TOP_GREEN = (13, 176, 74)
BOTTOM_GREEN = (3, 88, 40)


def make_background():
    grad = np.zeros((H, W, 3), dtype=np.uint8)
    for y in range(H):
        t = y / (H - 1)
        color = tuple(round(TOP_GREEN[c] + (BOTTOM_GREEN[c] - TOP_GREEN[c]) * t) for c in range(3))
        grad[y, :, :] = color
    return Image.fromarray(grad, "RGB")


def draw_blob(canvas, cx, cy, r, color, opacity):
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(*color, opacity))
    layer = layer.filter(ImageFilter.GaussianBlur(r * 0.15))
    canvas.paste(Image.alpha_composite(canvas.convert("RGBA"), layer).convert("RGB"), (0, 0))


def draw_maxi(canvas, cx, cy, size, mood="happy"):
    pad = int(size * 0.3)
    layer = Image.new("RGBA", (size + pad * 2, size + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    ox = oy = pad

    # soft drop shadow
    shadow = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        [ox, oy + size * 0.05, ox + size, oy + size + size * 0.05],
        radius=size * 0.38,
        fill=(0, 60, 25, 130),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(size * 0.05))
    layer = Image.alpha_composite(layer, shadow)
    d = ImageDraw.Draw(layer)

    # body (vertical gradient rounded square, matches app icon greens)
    body = np.zeros((size, size, 3), dtype=np.uint8)
    body_top = (34, 176, 92)
    body_bottom = (3, 106, 48)
    for y in range(size):
        t = y / (size - 1)
        color = tuple(round(body_top[c] + (body_bottom[c] - body_top[c]) * t) for c in range(3))
        body[y, :, :] = color
    body_img = Image.fromarray(body, "RGB").convert("RGBA")
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=size * 0.38, fill=255)
    body_img.putalpha(mask)
    layer.alpha_composite(body_img, (ox, oy))
    d = ImageDraw.Draw(layer)

    # cheek highlight - drawn on its own layer and alpha-composited so it
    # blends with the green body instead of overwriting it outright
    cheek = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    ImageDraw.Draw(cheek).ellipse(
        [ox + size * 0.18, oy + size * 0.2, ox + size * 0.18 + size * 0.28, oy + size * 0.2 + size * 0.22],
        fill=(255, 255, 255, 90),
    )
    layer = Image.alpha_composite(layer, cheek)
    d = ImageDraw.Draw(layer)

    eye_size = size * 0.14
    eye_y = oy + size * 0.38
    eye_offset = size * 0.18
    for eye_x in (ox + eye_offset, ox + size - eye_offset - eye_size):
        d.ellipse([eye_x, eye_y, eye_x + eye_size, eye_y + eye_size], fill=(10, 20, 15, 255))
        hs = eye_size * 0.4
        d.ellipse(
            [eye_x + eye_size * 0.15, eye_y + eye_size * 0.15, eye_x + eye_size * 0.15 + hs, eye_y + eye_size * 0.15 + hs],
            fill=(255, 255, 255, 255),
        )

    if mood == "happy":
        mw = size * 0.34
        mx = ox + (size - mw) / 2
        my = oy + size * 0.56
        thick = max(2, int(size * 0.045))
        d.arc([mx, my, mx + mw, my + size * 0.22], start=10, end=170, fill=(10, 20, 15, 255), width=thick)

    layer = layer.filter(ImageFilter.SMOOTH_MORE)
    canvas.paste(layer, (int(cx - layer.width / 2), int(cy - layer.height / 2)), layer)


def load_recolored_wordmark():
    logo = Image.open(LOGO_PATH).convert("RGBA")
    arr = np.array(logo).astype(np.int16)
    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]

    is_red = (r - g > 40) & (r - b > 40)
    white = np.ones_like(r) * 255

    out = arr.copy()
    out[..., 0] = np.where(is_red, r, white)
    out[..., 1] = np.where(is_red, g, white)
    out[..., 2] = np.where(is_red, b, white)
    out = out.astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def draw_bubble(canvas, cx, cy, text, text_color, font, pad_x=18, pad_y=10, rotate=0):
    tmp = Image.new("RGBA", (10, 10), (0, 0, 0, 0))
    d = ImageDraw.Draw(tmp)
    bbox = d.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    bw, bh = int(tw + pad_x * 2), int(th + pad_y * 2)

    bubble = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bubble)
    bd.rounded_rectangle([0, 0, bw - 1, bh - 1], radius=bh / 2, fill=(255, 255, 255, 235))
    bd.text((pad_x - bbox[0], pad_y - bbox[1]), text, font=font, fill=text_color)

    if rotate:
        bubble = bubble.rotate(rotate, expand=True, resample=Image.BICUBIC)

    canvas.paste(bubble, (int(cx - bubble.width / 2), int(cy - bubble.height / 2)), bubble)


def main():
    canvas = make_background().convert("RGB")

    # soft glow behind the mascot so it pops off the gradient
    draw_blob(canvas, 300, 250, 230, (255, 255, 255), 30)

    draw_maxi(canvas, 290, 260, 300, mood="happy")

    small_font = ImageFont.truetype(FONT_BOLD, 30)
    draw_bubble(canvas, 130, 90, "x²+2x", (0, 130, 60, 255), small_font, rotate=-8)
    draw_bubble(canvas, 130, 430, "√169", (190, 20, 20, 255), small_font, rotate=6)

    right_col_x = 500
    right_col_w = W - right_col_x - 40  # leave a margin to the canvas edge

    wordmark = load_recolored_wordmark()
    ww = min(480, right_col_w)
    wh = int(wordmark.height * (ww / wordmark.width))
    wordmark = wordmark.resize((ww, wh), Image.LANCZOS)
    wx, wy = right_col_x, 168
    canvas.paste(wordmark, (wx, wy), wordmark)

    tagline = "Your AI math buddy"
    canvas_draw = ImageDraw.Draw(canvas)
    font_size = 36
    while font_size > 18:
        tagline_font = ImageFont.truetype(FONT_BOLD, font_size)
        tw = canvas_draw.textbbox((0, 0), tagline, font=tagline_font)[2]
        if tw <= right_col_w:
            break
        font_size -= 2
    canvas_draw.text((wx + 6, wy + wh + 34), tagline, font=tagline_font, fill=(255, 255, 255, 235))

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    canvas.save(OUT_PATH, format="PNG")
    print(f"-> {OUT_PATH} ({canvas.size[0]}x{canvas.size[1]})")


if __name__ == "__main__":
    main()
