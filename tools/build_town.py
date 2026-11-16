"""Philadelphia's town kit: buildings, cottages, props and ground for the town map (townmap.js).

Sources: assets/source/town/raw/, straight from PixelLab (create_map_object, view "low top-down",
outline "selective outline", medium shading/detail; the ground from create_topdown_tileset, standard,
32px). Every description ends with the style line ("…no text, cozy farming-sim pixel art, colored
outlines, 3-tone shading, light from top-left"); the prompts are in RAW below.

Writes, into assets/source/town/ (images.js inlines them):
  <building>_open.png / _closed.png   church (closed = candles out), forge, inn, training_yard, scriptorium
  house_<look>_open.png / _closed.png one cottage per townsperson (TEXT.villagers, TEXT.living.people)
  prop_<name>.png                     tree, bush, well, lamp, bench, fence, planter, sign, barrels, dummy, mouth
  ground_dirt.png, ground_cobble.png  16 Wang tiles each, 32px, in corner order (see below)
and src/data/town.json: each picture's size and where its door is (x of the door's middle, in art pixels).

Closed is drawn here, not generated: the open picture with its lit windows put out, planks nailed
across the door, and the colour drained a little. So a building's two states always match.

Ground: tile i of a strip has corners NW,NE,SW,SE = bits 8,4,2,1 of i (1 = the path, 0 = grass).
ground_cobble has its grass cut away (transparent) so it lays over the dirt strip.
"""
import json
from collections import deque
from PIL import Image, ImageDraw, ImageEnhance
from _paths import asset, write_data

RAW = 'town/raw/'
# name: (raw file, door rect in the raw canvas (x0,y0,x1,y1) or None, extra cleanups)
# prompts (PixelLab create_map_object, see the docstring for the shared settings):
#   church       small old village stone church seen straight from the front, symmetrical facade, square bell tower
#                with a bronze bell above an arched wooden double door, steep gray slate roof, round rose window,
#                warm candlelight in the windows (192x192)
#   forge        village blacksmith forge seen straight from the front, symmetrical facade, slanted gray slate roof,
#                stone base and timber walls, wide open doorway with glowing orange forge fire and anvil, brick chimney (160)
#   inn          two-storey village inn, timber-framed facade, brown tiled roof, wooden front door in the middle,
#                warm lit windows with flower boxes, a blank hanging wooden sign, chimney (160)
#   training2    wide low timber drill hall with a covered porch and a wide open doorway, green shingle roof,
#                weapon rack with staves, sandbags (160)
#   scriptorium  pale stone facade, dark blue slate roof, arched door, tall arched windows with candlelight and
#                bookshelves, a carved scroll above the door (160)
#   cot1..cot10  small village cottages seen straight from the front (128): thatched whitewashed; timber-framed red
#                tile; fieldstone slate; blue planks shingle; ochre mossy round door; brick and timber two-storey;
#                pink dyer's with cloth drying; baker's with a bread oven; washerwoman's with a washing line;
#                carpenter's log cottage with planks and a chopping block
BUILDINGS = {
    'church':        ('church',      (84, 128, 108, 170)),
    'forge':         ('forge',       (60, 104, 100, 148)),
    'inn':           ('inn',         (66, 106, 93, 146)),
    'training_yard': ('training2',   (60, 72, 98, 110)),
    'scriptorium':   ('scriptorium', (67, 104, 92, 140)),
}
# where the light is (windows, the forge fire): put out when the building is shut
GLOW = {
    'church': [(44, 126, 64, 160), (128, 126, 148, 160)],
    'forge': [(62, 104, 98, 140)],
    'inn': [(36, 70, 58, 98), (100, 70, 122, 98), (36, 106, 58, 134), (100, 106, 122, 134), (70, 108, 90, 124)],
    'scriptorium': [(27, 62, 49, 106), (112, 62, 134, 106)],
}
# look -> cottage (who lives there: TEXT.villagers / TEXT.living.people)
HOUSES = {
    'shepherd':    ('cot1',  (54, 80, 72, 111)),    # Abel: thatch, whitewash
    'dairymaid':   ('cot2',  (53, 77, 72, 106)),    # Naomi: timber frame, red tiles
    'quarryman':   ('cot3',  (55, 72, 74, 104)),    # Tobias: fieldstone
    'farmhand':    ('cot4',  (55, 75, 73, 107)),    # Ezra: blue planks
    'grandmother': ('cot5',  (52, 82, 76, 110)),    # Mara: round door, mossy roof
    'girl':        ('cot6',  (50, 82, 76, 111)),    # Hannah: brick and timber
    'dyer':        ('cot7',  (50, 68, 67, 99)),     # Lydia: cloth drying
    'baker':       ('cot8',  (50, 79, 70, 108)),    # Tomas: bread oven
    'washer':      ('cot9',  (54, 73, 70, 110)),    # Ruth: washing line
    'carpenter':   ('cot10', (48, 52, 80, 104)),    # Jonas: planks, chopping block
}
# made-up lettering PixelLab painted anyway: (raw file, rect) filled with the sign's own wood colour
BLANK = {'cot8': [(49, 68, 76, 73)]}
PROPS = {'tree': 'tree', 'bush': 'bush', 'well': 'well', 'lamp': 'lamp', 'bench': 'bench', 'fence': 'fence',
         'planter': 'planter', 'sign': 'sign', 'barrels': 'barrels', 'dummy': 'dummy', 'mouth': 'mouth2'}
KEEP_GRASS = {'tree', 'bush', 'mouth', 'planter'}   # their green is leaves, or a hillside on grass anyway


def load(name):
    return Image.open(asset(RAW + name + '.png')).convert('RGBA')


def greenish(p):
    return p[3] and p[1] > p[0] + 10 and p[1] >= p[2]


def strip_fringe(im, rows=16):
    """Grass PixelLab paints at a building's foot: green pixels joined to the outside, in the bottom rows."""
    W, H = im.size; px = im.load(); bb = im.getbbox(); y0 = bb[3] - rows
    q = deque((x, y) for y in range(H) for x in range(W) if px[x, y][3] == 0); seen = set(q)
    while q:
        x, y = q.popleft()
        for a, b in ((x-1, y), (x+1, y), (x, y-1), (x, y+1)):
            if 0 <= a < W and y0 <= b < H and (a, b) not in seen and greenish(px[a, b]):
                seen.add((a, b)); px[a, b] = (0, 0, 0, 0); q.append((a, b))
    return im


def lit(p):
    """Candle or fire light: warm, bright, saturated."""
    r, g, b, a = p
    return a and r > 180 and g > 100 and r - b > 60


def put_out(im, rects, keep=0.0):
    """Lit windows (and the forge fire) inside rects go dark blue glass (keep>0 leaves a dim glow)."""
    px = im.load()
    for x0, y0, x1, y1 in rects:
      for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            p = px[x, y]
            if lit(p):
                v = (p[0] + p[1] + p[2]) / 765
                dark = (int(30 + 40 * v), int(32 + 40 * v), int(58 + 50 * v))
                px[x, y] = tuple(int(d + (c - d) * keep) for c, d in zip(p[:3], dark)) + (255,)
    return im


def planks(im, rect):
    """Two boards nailed across the door, a third on the slant."""
    x0, y0, x1, y1 = rect; d = ImageDraw.Draw(im)
    OUT, MID, HI, NAIL = (42, 20, 10, 255), (122, 82, 46, 255), (160, 114, 66, 255), (200, 196, 180, 255)
    def board(ya, yb, slope=0):
        w = x1 - x0 + 6
        for i in range(w):
            x = x0 - 3 + i; o = round(slope * i)
            d.line([(x, ya + o), (x, yb + o)], fill=MID)
            d.point((x, ya + o), fill=HI); d.point((x, ya + o - 1), fill=OUT); d.point((x, yb + o + 1), fill=OUT)
        d.line([(x0 - 4, ya - 1), (x0 - 4, yb + 1)], fill=OUT); d.line([(x0 - 3 + w, ya - 1 + round(slope * w)), (x0 - 3 + w, yb + 1 + round(slope * w))], fill=OUT)
        for x in (x0 - 1, x1 + 1): d.point((x, (ya + yb) // 2 + round(slope * (x - x0 + 3))), fill=NAIL)
    h = y1 - y0
    board(y0 + h // 5, y0 + h // 5 + 3)
    board(y0 + h * 3 // 5, y0 + h * 3 // 5 + 3)
    board(y0 + h // 5 + 6, y0 + h // 5 + 9, slope=(h * 2 // 5 - 6) / max(1, x1 - x0 + 6))
    return im


def shut(im, rect, glow):
    im = put_out(im.copy(), glow)
    if rect: im = planks(im, rect)
    im = ImageEnhance.Color(im).enhance(0.72)
    return ImageEnhance.Brightness(im).enhance(0.9)


def find_door(im):
    """Middle of the darkest tall column-run near the bottom centre (only for art without a measured rect)."""
    bb = im.getbbox(); cx = (bb[0] + bb[2]) // 2; px = im.load()
    best = None
    for x in range(cx - 14, cx + 15):
        run = 0
        for y in range(bb[3] - 1, bb[3] - 40, -1):
            p = px[x, y]
            if p[3] and sum(p[:3]) < 330: run += 1
        if best is None or run > best[0]: best = (run, x)
    x = best[1]; return (x - 8, bb[3] - 32, x + 8, bb[3] - 3)


def blank(im, rects):
    px = im.load()
    for x0, y0, x1, y1 in rects:
        c = px[x0 - 1, (y0 + y1) // 2]
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): px[x, y] = c
    return im


meta = {}


def save(name, im, door=None):
    bb = im.getbbox(); im = im.crop(bb)
    im.save(asset('town/' + name + '.png'), optimize=True)
    m = {'w': im.width, 'h': im.height}
    if door: m['door'] = round((door[0] + door[2]) / 2 - bb[0], 1)
    meta[name] = m


def building(out, raw, rect, closed_keep=None, glow=()):
    im = strip_fringe(load(raw))
    if raw in BLANK: blank(im, BLANK[raw])
    rect = rect or find_door(im)
    save(out + '_open', im, rect)
    if closed_keep is not None: c = ImageEnhance.Color(put_out(im.copy(), glow, closed_keep)).enhance(0.85)
    else: c = shut(im, rect, glow)
    save(out + '_closed', c, rect)


for out, (raw, rect) in BUILDINGS.items():
    building(out, raw, rect, closed_keep=0.25 if out == 'church' else None, glow=GLOW.get(out, ()))
for look, (raw, rect) in HOUSES.items():
    building('house_' + look, raw, rect)
for out, raw in PROPS.items():
    im = load(raw)
    if out not in KEEP_GRASS: im = strip_fringe(im, rows=12)
    save('prop_' + out, im)


# ---- ground: two Wang sheets into 16-tile strips in corner order ----
def strip(sheet, js, cut_grass):
    im = Image.open(asset(RAW + sheet)).convert('RGBA'); md = json.load(open(asset(RAW + js)))
    tiles = md['tileset_data']['tiles']; T = tiles[0]['bounding_box']['width']
    out = Image.new('RGBA', (16 * T, T))
    for t in tiles:
        c = t['corners']; i = sum(8 >> k for k, n in enumerate(('NW', 'NE', 'SW', 'SE')) if c[n] == 'lower')
        b = t['bounding_box']; out.paste(im.crop((b['x'], b['y'], b['x'] + b['width'], b['y'] + b['height'])), (i * T, 0))
    if cut_grass:
        px = out.load()
        for y in range(out.height):
            for x in range(out.width):
                p = px[x, y]
                if p[1] > p[0] + 18 and p[1] > p[2] + 18: px[x, y] = (0, 0, 0, 0)
    return out


strip('ts_dirt.png', 'ts_dirt.json', False).save(asset('town/ground_dirt.png'), optimize=True)
ImageEnhance.Brightness(strip('ts_cobble.png', 'ts_cobble.json', True)).enhance(1.2).save(asset('town/ground_cobble.png'), optimize=True)
meta['ground'] = {'tile': 32}
write_data('town.json', meta, separators=(',', ':'))
