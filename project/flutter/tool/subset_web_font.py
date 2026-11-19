"""Create the offline CJK font subsets (requires fontTools).

Usage: python3 tool/subset_web_font.py /path/to/NotoSansCJKsc-Regular.otf
For Japanese: python3 tool/subset_web_font.py /path/to/NotoSansCJKjp-Regular.otf ja
Source: notofonts/noto-cjk, Sans2.004.
"""
import json
import sys
from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parents[1]
inputs = list((ROOT / 'lib').rglob('*.dart')) + [ROOT / 'assets/data/game.json']
catalog = json.loads((ROOT / 'assets/data/translations.json').read_text(encoding='utf-8'))
japanese = len(sys.argv) > 2 and sys.argv[2] == 'ja'
family = 'Tower Japanese' if japanese else 'Tower Chinese'
postscript = family.replace(' ', '') + '-Regular'
if japanese:
    chars = set(''.join(row[1] for row in catalog.values()) + '日本語')
else:
    chars = set(''.join(p.read_text(encoding='utf-8') for p in inputs))
    chars.update(''.join(catalog))
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
        record.string = family if record.nameID not in (3, 6) else postscript
if 'CFF ' in font:
    cff = font['CFF '].cff
    cff.fontNames[0] = postscript
    cff.topDictIndex[0].FullName = family
    cff.topDictIndex[0].FamilyName = family
output = ROOT / 'assets/fonts' / ('tower-japanese.otf' if japanese else 'tower-chinese.otf')
output.parent.mkdir(parents=True, exist_ok=True)
subset.save_font(font, str(output), options)
