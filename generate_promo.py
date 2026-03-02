"""Generate Chrome Web Store promotional images for Auto Refresh & Click extension."""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ICON_PATH = os.path.join(SCRIPT_DIR, "icons", "icon128.png")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "icons")


def draw_rounded_rect(draw, xy, radius, fill):
    """Draw a rounded rectangle."""
    x0, y0, x1, y1 = xy
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    draw.pieslice([x0, y0, x0 + 2 * radius, y0 + 2 * radius], 180, 270, fill=fill)
    draw.pieslice([x1 - 2 * radius, y0, x1, y0 + 2 * radius], 270, 360, fill=fill)
    draw.pieslice([x0, y1 - 2 * radius, x0 + 2 * radius, y1], 90, 180, fill=fill)
    draw.pieslice([x1 - 2 * radius, y1 - 2 * radius, x1, y1], 0, 90, fill=fill)


def create_gradient(width, height, color1, color2, direction="horizontal"):
    """Create a gradient image."""
    img = Image.new("RGB", (width, height))
    for x in range(width):
        for y in range(height):
            if direction == "horizontal":
                ratio = x / width
            elif direction == "vertical":
                ratio = y / height
            else:  # diagonal
                ratio = (x / width + y / height) / 2
            r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
            g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
            b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
            img.putpixel((x, y), (r, g, b))
    return img


def get_font(size, bold=False):
    """Try to load a good font, fallback to default."""
    font_paths = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf",
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            return ImageFont.truetype(fp, size)
    return ImageFont.load_default()


def draw_decorative_circles(draw, width, height, alpha_layer):
    """Draw decorative circles on the alpha layer for visual flair."""
    circle_draw = ImageDraw.Draw(alpha_layer)
    circles = [
        (width * 0.85, height * 0.15, 80, (255, 255, 255, 20)),
        (width * 0.9, height * 0.75, 50, (255, 255, 255, 15)),
        (width * 0.1, height * 0.8, 60, (255, 255, 255, 15)),
        (width * 0.75, height * 0.5, 35, (255, 255, 255, 12)),
    ]
    for cx, cy, r, color in circles:
        circle_draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r], fill=color
        )


def generate_small_promo(output_path):
    """Generate 440x280 small promotional tile."""
    W, H = 440, 280

    # Gradient background: deep blue to teal
    img = create_gradient(W, H, (25, 55, 109), (0, 128, 128), "diagonal")
    draw = ImageDraw.Draw(img)

    # Decorative elements
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_decorative_circles(draw, W, H, overlay)
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    # Add subtle pattern - horizontal lines
    for y in range(0, H, 12):
        draw.line([(0, y), (W, y)], fill=(255, 255, 255, 8) if y % 24 == 0 else (0, 0, 0, 0), width=1)

    # Load and paste icon
    icon = Image.open(ICON_PATH).convert("RGBA")
    icon_size = 80
    icon = icon.resize((icon_size, icon_size), Image.LANCZOS)

    # Center icon horizontally, upper area
    icon_x = (W - icon_size) // 2
    icon_y = 30

    # Draw a subtle glow behind icon
    glow = Image.new("RGBA", (icon_size + 20, icon_size + 20), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([0, 0, icon_size + 20, icon_size + 20], fill=(255, 255, 255, 40))
    glow = glow.filter(ImageFilter.GaussianBlur(10))
    img_rgba = img.convert("RGBA")
    img_rgba.paste(glow, (icon_x - 10, icon_y - 10), glow)
    img_rgba.paste(icon, (icon_x, icon_y), icon)
    img = img_rgba.convert("RGB")
    draw = ImageDraw.Draw(img)

    # Title text
    title_font = get_font(28, bold=True)
    title = "Auto Refresh & Click"
    bbox = draw.textbbox((0, 0), title, font=title_font)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) / 2, icon_y + icon_size + 15), title, fill=(255, 255, 255), font=title_font)

    # Subtitle
    sub_font = get_font(14)
    subtitle = "Auto-refresh pages & monitor links"
    bbox = draw.textbbox((0, 0), subtitle, font=sub_font)
    sw = bbox[2] - bbox[0]
    draw.text(((W - sw) / 2, icon_y + icon_size + 52), subtitle, fill=(200, 220, 255), font=sub_font)

    # Feature pills
    pill_font = get_font(11)
    features = ["? Auto Refresh", "? Smart Match", "? Bookmarks"]
    pill_y = icon_y + icon_size + 80
    total_width = 0
    pill_data = []
    for feat in features:
        bbox = draw.textbbox((0, 0), feat, font=pill_font)
        fw = bbox[2] - bbox[0]
        pill_data.append((feat, fw))
        total_width += fw + 24  # padding

    gap = 10
    total_width += gap * (len(features) - 1)
    start_x = (W - total_width) / 2

    for feat, fw in pill_data:
        pw = fw + 24
        ph = 26
        # Draw pill background
        draw_rounded_rect(draw, (start_x, pill_y, start_x + pw, pill_y + ph), 13, (255, 255, 255, 30))
        # Draw pill border-like overlay
        draw.rounded_rectangle(
            [start_x, pill_y, start_x + pw, pill_y + ph],
            radius=13,
            outline=(255, 255, 255, 60),
            width=1
        )
        draw.text((start_x + 12, pill_y + 5), feat, fill=(255, 255, 255), font=pill_font)
        start_x += pw + gap

    # Bottom tagline
    tag_font = get_font(10)
    tagline = "Chrome Extension ? Manifest V3 ? 17 Languages"
    bbox = draw.textbbox((0, 0), tagline, font=tag_font)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) / 2, H - 28), tagline, fill=(150, 180, 220), font=tag_font)

    img.save(output_path, "PNG")
    print(f"? Small promo tile saved: {output_path} ({W}x{H})")


def generate_large_promo(output_path):
    """Generate 1400x560 large (marquee) promotional tile."""
    W, H = 1400, 560

    # Gradient background
    img = create_gradient(W, H, (20, 45, 95), (0, 110, 120), "diagonal")
    draw = ImageDraw.Draw(img)

    # Decorative elements
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)

    # Draw large decorative circles
    deco_circles = [
        (W * 0.92, H * 0.15, 150, (255, 255, 255, 12)),
        (W * 0.88, H * 0.8, 100, (255, 255, 255, 10)),
        (W * 0.05, H * 0.85, 120, (255, 255, 255, 8)),
        (W * 0.7, H * 0.4, 70, (255, 255, 255, 10)),
        (W * 0.95, H * 0.5, 200, (255, 255, 255, 8)),
    ]
    for cx, cy, r, color in deco_circles:
        overlay_draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)

    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    # Subtle grid pattern
    for x in range(0, W, 40):
        draw.line([(x, 0), (x, H)], fill=(255, 255, 255), width=1)
        # Make lines very subtle by overpainting
    for y in range(0, H, 40):
        draw.line([(0, y), (W, y)], fill=(255, 255, 255), width=1)

    # Re-apply gradient to make grid barely visible
    grid_overlay = create_gradient(W, H, (20, 45, 95), (0, 110, 120), "diagonal")
    img = Image.blend(img, grid_overlay, 0.92)
    draw = ImageDraw.Draw(img)

    # === LEFT SIDE: Icon + Text ===
    left_margin = 120

    # Icon
    icon = Image.open(ICON_PATH).convert("RGBA")
    icon_size = 140
    icon = icon.resize((icon_size, icon_size), Image.LANCZOS)

    # Glow behind icon
    glow = Image.new("RGBA", (icon_size + 40, icon_size + 40), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([0, 0, icon_size + 40, icon_size + 40], fill=(100, 200, 255, 30))
    glow = glow.filter(ImageFilter.GaussianBlur(15))

    icon_x = left_margin
    icon_y = 80
    img_rgba = img.convert("RGBA")
    img_rgba.paste(glow, (icon_x - 20, icon_y - 20), glow)
    img_rgba.paste(icon, (icon_x, icon_y), icon)
    img = img_rgba.convert("RGB")
    draw = ImageDraw.Draw(img)

    # Title
    title_font = get_font(52, bold=True)
    title = "Auto Refresh & Click"
    text_x = icon_x + icon_size + 35
    text_y = icon_y + 15
    # Shadow
    draw.text((text_x + 2, text_y + 2), title, fill=(0, 0, 0, 80), font=title_font)
    draw.text((text_x, text_y), title, fill=(255, 255, 255), font=title_font)

    # Subtitle
    sub_font = get_font(22)
    subtitle = "Smart Page Monitor for Chrome"
    draw.text((text_x, text_y + 65), subtitle, fill=(170, 210, 255), font=sub_font)

    # === Feature cards ===
    card_font = get_font(16, bold=True)
    card_desc_font = get_font(13)
    features = [
        ("? Auto Refresh", "Configurable intervals\nin sec / min / hours"),
        ("? Smart Match", "Wildcards, regex,\ncase & whole-word"),
        ("? Auto Open", "Background tabs with\nrandom delay"),
        ("? Bookmarks", "Auto-organize with\ndedup support"),
    ]

    card_w = 230
    card_h = 110
    card_gap = 20
    total_cards_w = len(features) * card_w + (len(features) - 1) * card_gap
    cards_start_x = (W - total_cards_w) / 2
    cards_y = 300

    for i, (title_text, desc) in enumerate(features):
        cx = cards_start_x + i * (card_w + card_gap)

        # Card background with rounded rectangle
        draw.rounded_rectangle(
            [cx, cards_y, cx + card_w, cards_y + card_h],
            radius=12,
            fill=(255, 255, 255, 18),
            outline=(255, 255, 255, 40),
            width=1,
        )

        # Card title
        draw.text((cx + 18, cards_y + 15), title_text, fill=(255, 255, 255), font=card_font)

        # Card description
        desc_y = cards_y + 42
        for line in desc.split("\n"):
            draw.text((cx + 18, desc_y), line, fill=(180, 200, 230), font=card_desc_font)
            desc_y += 18

    # Bottom bar
    bar_y = H - 60
    draw.line([(left_margin, bar_y), (W - left_margin, bar_y)], fill=(255, 255, 255, 30), width=1)

    bottom_font = get_font(14)
    bottom_texts = [
        "Chrome Extension",
        "Manifest V3",
        "17 Languages",
        "Light & Dark Theme",
        "Open Source",
    ]
    bottom_str = "  ?  ".join(bottom_texts)
    bbox = draw.textbbox((0, 0), bottom_str, font=bottom_font)
    bw = bbox[2] - bbox[0]
    draw.text(((W - bw) / 2, bar_y + 15), bottom_str, fill=(140, 170, 210), font=bottom_font)

    img.save(output_path, "PNG")
    print(f"? Large promo tile saved: {output_path} ({W}x{H})")


if __name__ == "__main__":
    small_path = os.path.join(OUTPUT_DIR, "promo_small_440x280.png")
    large_path = os.path.join(OUTPUT_DIR, "promo_large_1400x560.png")

    generate_small_promo(small_path)
    generate_large_promo(large_path)
    print("\n? All promotional images generated successfully!")
