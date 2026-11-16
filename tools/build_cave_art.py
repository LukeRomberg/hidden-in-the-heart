"""Cave map art: PixelLab tilesets and objects (assets/source/caves/pixellab/) -> the game's map art
(assets/source/caves/map/), inlined by dive.js through __IMG__.

Ground: one Wang tileset per cave (create_topdown_tileset, standard, 32px, floor = lower, rock = upper,
transition 0.5 = the wall face). Rewritten as a 4x4 sheet where the tile at index
k = NW<<3 | NE<<2 | SW<<1 | SE (1 = rock) sits at (k % 4, k // 4). dive.js draws it on a dual grid:
each drawn tile straddles four map cells and takes its corners from them.

Objects (create_image_pixen, 32x32): door, verse door, gate, lever, chest, campfire, sermon note. Derived here:
the doors' open state (the leaf cut out, a dark doorway behind) and the leaf on its own (it swings open in CSS),
the gate raised, the lever pulled (mirrored), a second campfire frame (the flame mirrored).

Run: .venv/bin/python tools/build_cave_art.py   (preview: tools/out/cave_art.png)
"""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets/source/caves/pixellab'
OUT = ROOT / 'assets/source/caves/map'
PREVIEW = ROOT / 'tools/out'
CAVES = ['hollow', 'quarry', 'deep']
# per-cave colour grade on the ground (multiply r, g, b; then contrast around mid-grey): the Deep Cave goes blue-black
GRADE = {'hollow': None, 'quarry': ((0.68, 0.68, 0.72), 1.1), 'deep': ((0.66, 0.70, 0.80), 1.12)}
DOORWAY = [(11, 8, 6), (22, 15, 11), (32, 22, 16)]   # the dark behind an open door: deepest at the top


def grade(im, g):
    if not g: return im
    (mr, mg, mb), c = g
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, gg, b, a = px[x, y]
            f = lambda v, m: max(0, min(255, round((v * m - 96) * c + 96)))
            px[x, y] = (f(r, mr), f(gg, mg), f(b, mb), a)
    return im


def ground(cave):
    meta = json.loads((SRC / f'ts_{cave}.json').read_text())
    sheet = Image.open(SRC / f'ts_{cave}.png').convert('RGBA')
    out = Image.new('RGBA', (128, 128))
    seen = set()
    for t in meta['tiles']:
        c = t['corners']
        k = sum((c[q] == 'upper') << b for q, b in (('NW', 3), ('NE', 2), ('SW', 1), ('SE', 0)))
        bb = t['bounding_box']
        out.paste(sheet.crop((bb['x'], bb['y'], bb['x'] + 32, bb['y'] + 32)), ((k % 4) * 32, (k // 4) * 32))
        seen.add(k)
    assert seen == set(range(16)), f'{cave}: corner masks missing {set(range(16)) - seen}'
    return grade(out, GRADE[cave])


def hue_sat(r, g, b):
    mx, mn = max(r, g, b), min(r, g, b)
    if mx == mn: return 0, 0
    d = mx - mn
    h = (60 * ((g - b) / d) % 360) if mx == r else (60 * ((b - r) / d) + 120) if mx == g else (60 * ((r - g) / d) + 240)
    return h, d / mx


def strip_fringe(im):
    """Clear stray greens and cyans (grass tufts, a halo) from the edge of a cave object."""
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            h, s = hue_sat(r, g, b)
            if a and s > 0.35 and 75 <= h <= 215: px[x, y] = (0, 0, 0, 0)
    return im


# where each door's leaf sits inside its arch (placed by hand from the art): columns x0..x1, rows y0..y1,
# the top two rows drawn in by 2 and 1 pixels for the arch's curve
LEAF = {'door': (9, 20, 7, 25), 'verse': (11, 18, 10, 25)}


def leaf_mask(im, box):
    x0, x1, y0, y1 = box; px = im.load()
    return {(x, y) for y in range(y0, y1 + 1) for x in range(x0 + max(0, 2 - (y - y0)), x1 + 1 - max(0, 2 - (y - y0)))
            if px[x, y][3] >= 128}


def split_door(im, box):
    """(open doorway, the leaf alone) from a closed door."""
    mask = leaf_mask(im, box)
    ys = [y for _, y in mask]; y0, y1 = min(ys), max(ys)
    opened, leaf = im.copy(), Image.new('RGBA', im.size)
    po, pl, pi = opened.load(), leaf.load(), im.load()
    for x, y in mask:
        pl[x, y] = pi[x, y]
        band = min(2, (y - y0) * 3 // max(1, y1 - y0 + 1))
        po[x, y] = (*DOORWAY[band], 255)
    return opened, leaf


def raised_gate(im, sill=3, tips=4):
    """The gate drawn up into the ceiling: its sill stays on the floor, the bars' feet show at the top of the tile."""
    bb = im.getbbox(); out = Image.new('RGBA', im.size)
    out.paste(im.crop((bb[0], bb[3] - sill, bb[2], bb[3])), (bb[0], bb[3] - sill))
    bars = bb[3] - sill - 1   # the bars' last row, above the gap over the sill
    while bars > bb[1] and not any(im.getpixel((x, bars))[3] for x in range(bb[0], bb[2])): bars -= 1
    out.paste(im.crop((bb[0], bars - tips + 1, bb[2], bars + 1)), (bb[0], 0))
    return out


def flicker(im):
    """A second campfire frame: the flame (bright warm pixels in the upper part) mirrored about its own middle."""
    px = im.load(); W, H = im.size
    flame = [(x, y) for y in range(H * 2 // 3) for x in range(W)
             if px[x, y][3] and px[x, y][0] > 200 and px[x, y][1] > 70 and px[x, y][2] < 140]
    if not flame: return im.copy()
    xs = [x for x, _ in flame]; mid = min(xs) + max(xs)
    out = im.copy(); po = out.load()
    for x, y in flame: po[x, y] = (0, 0, 0, 0)
    for x, y in flame:
        if 0 <= mid - x < W: po[mid - x, y] = px[x, y]
    # anything the old flame covered that the mirrored one doesn't: the logs behind show through as dark
    for x, y in flame:
        if po[x, y][3] == 0 and y > min(y for _, y in flame) + 4: po[x, y] = (60, 30, 20, 255)
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True); PREVIEW.mkdir(parents=True, exist_ok=True)
    made = {}
    for c in CAVES:
        made[f'{c}_ground'] = ground(c)
    load = lambda n: Image.open(SRC / f'{n}.png').convert('RGBA')
    door = strip_fringe(load('door'))
    made['door'] = door
    made['door_open'], made['door_leaf'] = split_door(door, LEAF['door'])
    verse = strip_fringe(load('verse'))
    made['verse'] = verse
    made['verse_open'], made['verse_leaf'] = split_door(verse, LEAF['verse'])
    gate = load('gate')
    made['gate'], made['gate_up'] = gate, raised_gate(gate)
    lever = load('lever')
    made['lever_up'], made['lever_down'] = lever, lever.transpose(Image.FLIP_LEFT_RIGHT)
    made['chest'] = load('chest')
    fire = load('fire')
    made['fire'], made['fire2'] = fire, flicker(fire)
    made['note'] = load('note')
    for n, im in made.items(): im.save(OUT / f'{n}.png')
    # preview: grounds, then objects, at 4x
    objs = [k for k in made if not k.endswith('_ground')]
    pv = Image.new('RGBA', (max(3 * 136, len(objs) * 36) * 4, (128 + 40) * 4), (40, 32, 26, 255))
    for i, c in enumerate(CAVES): pv.alpha_composite(made[f'{c}_ground'].resize((512, 512), Image.NEAREST), (i * 136 * 4, 0))
    for i, n in enumerate(objs): pv.alpha_composite(made[n].resize((128, 128), Image.NEAREST), (i * 36 * 4, 132 * 4))
    pv.save(PREVIEW / 'cave_art.png')
    print('wrote', ', '.join(sorted(made)), '->', OUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
