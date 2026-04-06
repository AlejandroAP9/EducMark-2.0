#!/usr/bin/env python3
"""
overlay_logo.py — Superpone el logo EducMark en la esquina inferior derecha
de una imagen generada por IA.

Uso:
    python3 overlay_logo.py imagen_base.png imagen_final.png
    python3 overlay_logo.py imagen_base.png imagen_final.png --logo /ruta/logo.png
    python3 overlay_logo.py imagen_base.png imagen_final.png --position bottom-left

Requiere: Pillow (pip install Pillow)

Defaults:
- Logo: public/logo-educmark.png del proyecto saas-factory
- Posicion: bottom-right
- Tamano: 12% del ancho de la imagen base
- Margen: 2% del ancho
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Falta Pillow. Instalar con: pip install Pillow", file=sys.stderr)
    sys.exit(1)


DEFAULT_LOGO_CANDIDATES = [
    # Watermark plano violeta — diseñado para fundirse con carruseles sketch beige
    Path(__file__).resolve().parents[3] / "public" / "images" / "logo-educmark-watermark.png",
    Path(__file__).resolve().parents[4] / "public" / "images" / "logo-educmark-watermark.png",
    # Fallbacks (icon con squircle — solo si no existe el watermark)
    Path(__file__).resolve().parents[3] / "public" / "images" / "logo-educmark-icon.png",
    Path(__file__).resolve().parents[3] / "public" / "images" / "logo.png",
]

POSITIONS = {"bottom-right", "bottom-left", "top-right", "top-left"}


def find_default_logo() -> Path | None:
    for p in DEFAULT_LOGO_CANDIDATES:
        if p.exists():
            return p
    return None


def overlay(base_path: Path, output_path: Path, logo_path: Path,
            position: str = "bottom-right", scale: float = 0.12,
            margin: float = 0.02) -> None:
    base = Image.open(base_path).convert("RGBA")
    logo = Image.open(logo_path).convert("RGBA")

    base_w, base_h = base.size
    target_w = int(base_w * scale)
    ratio = target_w / logo.width
    target_h = int(logo.height * ratio)
    logo = logo.resize((target_w, target_h), Image.LANCZOS)

    margin_px = int(base_w * margin)

    if position == "bottom-right":
        pos = (base_w - target_w - margin_px, base_h - target_h - margin_px)
    elif position == "bottom-left":
        pos = (margin_px, base_h - target_h - margin_px)
    elif position == "top-right":
        pos = (base_w - target_w - margin_px, margin_px)
    else:  # top-left
        pos = (margin_px, margin_px)

    composite = Image.new("RGBA", base.size)
    composite.paste(base, (0, 0))
    composite.paste(logo, pos, logo)

    output_path.parent.mkdir(parents=True, exist_ok=True)

    if output_path.suffix.lower() in {".jpg", ".jpeg"}:
        composite.convert("RGB").save(output_path, quality=95)
    else:
        composite.save(output_path)

    print(f"OK: {output_path}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Superpone logo EducMark en una imagen")
    parser.add_argument("input", type=Path, help="Imagen base (PNG/JPG)")
    parser.add_argument("output", type=Path, help="Imagen de salida")
    parser.add_argument("--logo", type=Path, default=None, help="Ruta al logo (opcional)")
    parser.add_argument("--position", choices=sorted(POSITIONS), default="bottom-right")
    parser.add_argument("--scale", type=float, default=0.12, help="Tamano del logo como fraccion del ancho (default 0.12)")
    parser.add_argument("--margin", type=float, default=0.02, help="Margen como fraccion del ancho (default 0.02)")
    args = parser.parse_args()

    if not args.input.exists():
        print(f"ERROR: no existe {args.input}", file=sys.stderr)
        return 1

    logo_path = args.logo or find_default_logo()
    if logo_path is None or not logo_path.exists():
        print("ERROR: no se encontro el logo. Pasalo con --logo /ruta/logo.png", file=sys.stderr)
        return 1

    overlay(args.input, args.output, logo_path,
            position=args.position, scale=args.scale, margin=args.margin)
    return 0


if __name__ == "__main__":
    sys.exit(main())
