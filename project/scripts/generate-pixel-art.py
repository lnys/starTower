"""Render the game's existing board sprites as low-resolution pixel art.

Requires rsvg-convert and Pillow. Run from any directory.
"""
from io import BytesIO
from pathlib import Path
import shutil
import subprocess

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
for folder in ('hero', 'items', 'monsters', 'tiles'):
    src = ROOT / 'images' / folder
    dest = ROOT / 'images' / 'pixel' / folder
    dest.mkdir(parents=True, exist_ok=True)
    for art in sorted(src.glob('*.svg')):
        # Large figures retain a few extra pixels for their silhouette.
        size = '32' if art.stem == 'endLord' else '20'
        raw = subprocess.check_output([
            'rsvg-convert', '--width', size, '--height', size, str(art)
        ])
        image = Image.open(BytesIO(raw)).convert('RGBA')
        # Snap the raster antialiasing to a deliberately small color palette.
        image = image.quantize(colors=24, method=Image.Quantize.FASTOCTREE,
                               dither=Image.Dither.NONE)
        image.save(dest / art.with_suffix('.png').name, optimize=True)
    shutil.copytree(dest, ROOT / 'flutter/assets/images/pixel' / folder,
                    dirs_exist_ok=True)
