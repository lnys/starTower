"""Generate native mobile icons and splash artwork. Requires Pillow.
Run: python3 flutter/tool/generate_branding.py
The checked-in icon source is shared with the desktop game's branding.
"""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BG = '#0d0b16'
source = Image.open(ROOT / 'tool/branding/icon-source.png').convert('RGBA')
icon = Image.new('RGB', source.size, BG)
icon.paste(source, mask=source.getchannel('A'))

def save(image, path, size):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.resize((size, size), Image.Resampling.LANCZOS).save(path)

catalog = ROOT / 'ios/Runner/Assets.xcassets/AppIcon.appiconset'
for entry in json.loads((catalog / 'Contents.json').read_text())['images']:
    size = round(float(entry['size'].split('x')[0]) * float(entry['scale'][:-1]))
    save(icon, catalog / entry['filename'], size)
res = ROOT / 'android/app/src/main/res'
for density, scale in [('mdpi', 1), ('hdpi', 1.5), ('xhdpi', 2), ('xxhdpi', 3), ('xxxhdpi', 4)]:
    save(icon, res / f'mipmap-{density}/ic_launcher.png', round(48 * scale))
    # Keep artwork inside the adaptive icon mask's safe area.
    adaptive = Image.new('RGBA', (1080, 1080))
    adaptive.alpha_composite(source.resize((620, 620), Image.Resampling.LANCZOS), (230, 230))
    save(adaptive, res / f'drawable-{density}/ic_launcher_foreground.png', round(108 * scale))
    save(source, res / f'drawable-{density}/launch_logo.png', round(160 * scale))
    # Android 12 splash images are masked; reserve transparent space around the tower.
    splash = Image.new('RGBA', (1152, 1152))
    splash.alpha_composite(source.resize((640, 640), Image.Resampling.LANCZOS), (256, 256))
    save(splash, res / f'drawable-{density}/splash_icon.png', round(288 * scale))
launch = ROOT / 'ios/Runner/Assets.xcassets/TowerLaunch.imageset'
for scale, name in [(1, 'LaunchImage.png'), (2, 'LaunchImage@2x.png'), (3, 'LaunchImage@3x.png')]:
    save(source, launch / name, 160 * scale)
print('Generated iOS and Android icons, adaptive icons and launch images.')
