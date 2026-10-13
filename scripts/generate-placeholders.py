"""
Generates neutral placeholder media for the rebuild so the demo runs without
any third-party assets. Replace everything in /public/media with your own work.

Usage:  python3 scripts/generate-placeholders.py
Needs:  Pillow, ffmpeg (for the .webm / .mp4 loops)
"""
from __future__ import annotations

import random
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent / "public" / "media"
random.seed(7)

PALETTES: list[tuple[str, str, str]] = [
    ("#f4f1ea", "#1d1d1b", "#e4572e"),
    ("#0e1116", "#f5f5f5", "#7c5cff"),
    ("#e9eef7", "#0b1f4b", "#042db4"),
    ("#151515", "#efefef", "#c6f432"),
    ("#f7efe6", "#2b1b12", "#b5651d"),
    ("#0b0b0f", "#ffffff", "#ff4d8d"),
    ("#eef3ee", "#14301f", "#2f9e57"),
    ("#121826", "#e6ecff", "#38bdf8"),
]


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for candidate in (
        "/usr/share/fonts/opentype/inter/Inter-Medium.otf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ):
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def mock_site(w: int, h: int, palette: tuple[str, str, str], title: str) -> Image.Image:
    """A fake website screenshot: nav, headline, hero media block, cards."""
    bg, fg, accent = palette
    im = Image.new("RGB", (w, h), bg)
    d = ImageDraw.Draw(im)
    pad = int(w * 0.05)
    # nav
    d.rounded_rectangle([pad, pad * 0.6, pad + w * 0.1, pad * 0.6 + h * 0.035], 6, fill=fg)
    for i in range(4):
        x = w * 0.42 + i * w * 0.07
        d.rounded_rectangle([x, pad * 0.65, x + w * 0.05, pad * 0.65 + h * 0.02], 4, fill=fg)
    d.rounded_rectangle([w - pad - w * 0.1, pad * 0.5, w - pad, pad * 0.5 + h * 0.05], 20, fill=accent)
    # headline
    d.text((pad, h * 0.2), title, font=font(int(h * 0.09)), fill=fg)
    d.rounded_rectangle([pad, h * 0.36, pad + w * 0.32, h * 0.38], 4, fill=fg)
    d.rounded_rectangle([pad, h * 0.4, pad + w * 0.26, h * 0.42], 4, fill=fg)
    d.rounded_rectangle([pad, h * 0.47, pad + w * 0.12, h * 0.52], 20, fill=accent)
    # hero media block
    d.rounded_rectangle([w * 0.52, h * 0.18, w - pad, h * 0.62], 18, fill=accent)
    d.ellipse([w * 0.62, h * 0.26, w * 0.82, h * 0.56], fill=bg)
    # cards
    cw = (w - pad * 2 - 40) / 3
    for i in range(3):
        x = pad + i * (cw + 20)
        d.rounded_rectangle([x, h * 0.7, x + cw, h * 0.95], 14, outline=fg, width=2)
    return im


def write_jpg(im: Image.Image, path: Path, q: int = 82) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "JPEG", quality=q, optimize=True, progressive=True)


def intro_cards() -> list[Image.Image]:
    names = ["Northwind", "Halcyon", "Fintra", "Volta", "Ember", "Neon", "Verdant", "Skyline"]
    out: list[Image.Image] = []
    for i, (palette, name) in enumerate(zip(PALETTES, names)):
        im = mock_site(1200, 750, palette, name)
        write_jpg(im, ROOT / "intro" / f"intro-{i + 1:02d}.jpg")
        out.append(im)
    return out


def tilted_wall(cards: list[Image.Image], w: int, h: int, blur: int, darken: float) -> Image.Image:
    """Grid of screenshots, sheared to fake a 3D wall, then blurred + darkened."""
    wall = Image.new("RGB", (w * 2, h * 2), "#050505")
    cw, ch = 560, 350
    for row in range(8):
        for col in range(8):
            card = cards[(row * 3 + col) % len(cards)].resize((cw, ch))
            x = col * (cw + 36) - (row % 2) * 200
            y = row * (ch + 36)
            wall.paste(card, (x, y))
    wall = wall.transform(
        wall.size, Image.AFFINE, (1, 0.35, -200, -0.12, 1, 260), resample=Image.BICUBIC
    )
    wall = wall.crop((0, 0, w, h)).filter(ImageFilter.GaussianBlur(blur))
    shade = Image.new("RGB", wall.size, "#000000")
    return Image.blend(wall, shade, darken)


def template_scenes(cards: list[Image.Image]) -> None:
    for i in range(5):
        palette = PALETTES[(i * 2 + 1) % len(PALETTES)]
        site = mock_site(1600, 1000, palette, ["Orbit", "Ledger", "Cortex", "Atrium", "Folio"][i])
        # full-bleed "device on a desk" scene
        scene = Image.new("RGB", (2400, 1350), "#0a0a0a")
        g = Image.linear_gradient("L").resize((2400, 1350)).rotate(90 + i * 15)
        tint = Image.new("RGB", (2400, 1350), palette[2])
        scene = Image.composite(tint, scene, g.point(lambda v: int(v * 0.18)))
        screen = site.resize((1500, 940))
        frame = Image.new("RGB", (1540, 980), "#1a1a1a")
        frame.paste(screen, (20, 20))
        frame = frame.rotate(-6 + i * 3, expand=True, fillcolor="#0a0a0a")
        scene.paste(frame, (420, 180))
        scene = scene.filter(ImageFilter.GaussianBlur(2))
        write_jpg(scene, ROOT / "templates" / f"tpl-{i + 1}-bg.jpg", 78)
        # lens image: a sharper, closer crop
        lens = site.resize((1300, 812)).crop((150, 0, 1150, 812)).resize((1000, 1000))
        write_jpg(lens, ROOT / "templates" / f"tpl-{i + 1}-lens.jpg", 82)


def videos() -> None:
    if shutil.which("ffmpeg") is None:
        print("ffmpeg not found - skipping video placeholders")
        return
    clips: list[tuple[str, str, str]] = [
        ("reel", "1280x720", "0x111111,0x042db4,0x7c5cff,0x0b0b0f"),
        ("service-1", "960x1080", "0x0b1f4b,0x042db4,0x38bdf8"),
        ("service-2", "960x1080", "0x1d1d1b,0xe4572e,0xf4f1ea"),
        ("service-3", "960x1080", "0x14301f,0x2f9e57,0xc6f432"),
    ]
    out = ROOT / "video"
    out.mkdir(parents=True, exist_ok=True)
    for name, size, colors in clips:
        c = colors.split(",")
        src = f"gradients=s={size}:d=6:speed=0.03:c0={c[0]}:c1={c[1]}:c2={c[2]}" + (
            f":c3={c[3]}:n=4" if len(c) > 3 else ":n=3"
        )
        common = ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", src, "-an"]
        subprocess.run(common + ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "42", "-row-mt", "1",
                                 "-deadline", "realtime", "-cpu-used", "8", str(out / f"{name}.webm")], check=True)
        subprocess.run(common + ["-c:v", "libx264", "-crf", "30", "-preset", "veryfast", "-pix_fmt", "yuv420p",
                                 "-movflags", "+faststart", str(out / f"{name}.mp4")], check=True)
        # poster frame
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(out / f"{name}.mp4"), "-frames:v", "1",
                        "-q:v", "4", str(out / f"{name}-poster.jpg")], check=True)


def main() -> None:
    cards = intro_cards()
    write_jpg(tilted_wall(cards, 2400, 1350, blur=6, darken=0.45), ROOT / "hero-bg.jpg", 76)
    template_scenes(cards)
    videos()
    print("placeholders written to", ROOT)


if __name__ == "__main__":
    main()
