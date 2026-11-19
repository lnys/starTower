"""Create the local Chinese fallback for Flutter Web (requires fontTools).

Usage: python3 tool/subset_web_font.py /path/to/NotoSansCJKsc-Regular.otf
Source: notofonts/noto-cjk, Sans2.004, Simplified Chinese.
"""
import sys
from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parents[1]
inputs = list((ROOT / 'lib').rglob('*.dart')) + [ROOT / 'assets/data/game.json']
chars = set(''.join(p.read_text(encoding='utf-8') for p in inputs))
chars.update(map(chr, range(32, 127)))
options = subset.Options()
options.layout_features = ['*']
options.name_IDs = ['*']
font = subset.load_font(sys.argv[1], options)
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=''.join(sorted(chars)))
subsetter.subset(font)
# Give the modified font its own name rather than using any reserved font name.
for record in font['name'].names:
    if record.nameID in (1, 3, 4, 6, 16, 18, 20):
        record.string = 'Tower Chinese' if record.nameID not in (3, 6) else 'TowerChinese-Regular'
if 'CFF ' in font:
    cff = font['CFF '].cff
    cff.fontNames[0] = 'TowerChinese-Regular'
    cff.topDictIndex[0].FullName = 'Tower Chinese'
    cff.topDictIndex[0].FamilyName = 'Tower Chinese'
output = ROOT / 'assets/fonts/tower-chinese.otf'
output.parent.mkdir(parents=True, exist_ok=True)
subset.save_font(font, str(output), options)
