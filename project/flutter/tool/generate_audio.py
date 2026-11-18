"""Generate offline WAV music and effects with Python's standard library."""
import math
import struct
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / 'assets/audio'
ROOT.mkdir(exist_ok=True)


def write(name, notes, step=.14):
    rate = 22050
    samples = []
    for freq in notes:
        for i in range(int(step * rate)):
            t = i / rate
            env = min(1, t / .01) * max(0, 1 - t / step) ** 2
            samples.append(int(9000 * env * (math.sin(2 * math.pi * freq * t)
                                           + .15 * math.sin(4 * math.pi * freq * t))))
    with wave.open(str(ROOT / (name + '.wav')), 'wb') as f:
        f.setparams((1, 2, rate, 0, 'NONE', ''))
        f.writeframes(struct.pack('<' + 'h' * len(samples), *samples))


for name, notes in {'hit': [180, 100, 60], 'pick': [880, 1320],
                    'door': [160, 240, 320], 'stairs': [523, 659, 784],
                    'denied': [120, 90], 'win': [523, 659, 784, 1047, 784, 1047],
                    'buy': [988, 1319]}.items():
    write(name, notes)
for floor in range(51):
    scale = [0, 2, 3, 5, 7, 8, 10]
    root = 110 * 2 ** (((floor * 3) % 12) / 12 + .5)
    notes = [root * 2 ** ((scale[(i * 3 + floor) % 7] + 12 * (i % 3 == 0)) / 12)
             for i in range(32)]
    write('bgm_' + str(floor), notes, .22 if floor and floor % 10 == 0 else .38)
