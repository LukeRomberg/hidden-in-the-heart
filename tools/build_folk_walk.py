"""Walk cycles for Philadelphia's townsfolk on the town map (FOLK_WALK, src/data/folkwalk.json).

Sources: assets/source/townsfolk/walk/<look>_<dir>.png, one row of 64x64 frames (dir: s, n, e, w), from PixelLab
animate_character, template "walking" (6 frames, 1 generation per direction), animation name "town_walk", on the
characters in tools/build_townsfolk.py LOOKS. `--fetch` downloads them again from PixelLab (no key needed: the
character id is the key) and rebuilds the strips.

Writes folkwalk.json: {look: {s, n, e, w}} as data URIs, each a strip of 6 frames. A look with no strips is left
out and stands still on the map (townmap.js falls back to its standing frame).
"""
import io, os, sys, urllib.request, zipfile
from PIL import Image
from _paths import asset, data_uri, write_data

IDS = {
    'baker': '214c0709-c951-4921-856f-9445546ac786', 'shepherd': '35da2ea8-166a-42db-961d-185e7a7089e5',
    'farmhand': 'c53b5eb0-979a-446d-977b-6a43f82e2f91', 'carpenter': 'f7775922-575e-426c-bdde-cb5b162458b9',
    'quarryman': 'ba489e85-7cd6-4f8c-bf81-60a6e6b3dfb4', 'washer': '6018414e-4688-4170-b5a4-c560bb1a85cd',
    'dyer': 'dc4aeea1-cefe-4fba-8b85-cf6965d3266a', 'grandmother': '2194e092-95b2-4c75-9132-b68105fb4fae',
    'dairymaid': 'bb8f227a-bc29-4247-840c-37ccf4fe902e', 'girl': 'e7b1fb69-fc91-4dac-80c3-2d2c3289ddc1',
}
DIRS = {'s': 'south', 'n': 'north', 'e': 'east', 'w': 'west'}
WALK = asset('townsfolk/walk')


def fetch(look, cid):
    url = f'https://api.pixellab.ai/mcp/characters/{cid}/download'
    try: z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(url, timeout=60).read()))
    except Exception as e: print(look, 'download failed:', e); return
    names = z.namelist()
    for k, d in DIRS.items():
        fr = sorted(n for n in names if f'/animations/town_walk/{d}/frame_' in n)
        if not fr: print(look, d, 'no frames yet'); continue
        ims = [Image.open(io.BytesIO(z.read(n))).convert('RGBA') for n in fr]
        strip = Image.new('RGBA', (64 * len(ims), 64))
        for i, im in enumerate(ims): strip.paste(im, (i * 64 + (64 - im.width) // 2, 64 - im.height))
        strip.save(os.path.join(WALK, f'{look}_{k}.png'), optimize=True)


if '--fetch' in sys.argv:
    os.makedirs(WALK, exist_ok=True)
    for look, cid in IDS.items(): fetch(look, cid)

out = {}
for look in IDS:
    strips = {k: os.path.join(WALK, f'{look}_{k}.png') for k in DIRS}
    if all(os.path.exists(p) for p in strips.values()):
        out[look] = {k: data_uri(Image.open(p)) for k, p in strips.items()}
print('walk cycles for', ', '.join(out) or 'nobody yet')
write_data('folkwalk.json', out, separators=(',', ':'))
