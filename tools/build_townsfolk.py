"""Philadelphia's townsfolk (FOLK, src/data/townsfolk.json): one PixelLab character per look, plus the
hurt and badly-hurt states drawn here in code (generating a state costs 10 generations a character).

Sources: assets/source/townsfolk/<look>.png, one row of eight 64x64 rotations in PixelLab's order
(south, south-east, east, north-east, north, north-west, west, south-west), straight from
create_character (mode v3, view "low top-down", size 64). A look listed in LOOKS without a sheet yet
is skipped; the game falls back to the old placeholder townsfolk for it (freed.json).

Per look this writes:
  f      [idle, hop]  front-facing; the hop (two pixels up) is the freed wave in fights
  hurt   standing, head bandaged, a sticking plaster, a bandaged forearm, a faint bruise
  badly  sunk down to sit on the ground, leaning, both arms bandaged, a little greyer
  dir    {e, n, w}    the other walking directions for the town map (south is f[0])
  sex    'm' or 'f'   so a name only ever gets a look of the right sex

Held (the red tint) is CSS (.sprite.held in styles.css), not drawn here.
Bandage placement is by hand per look (ANCHORS below), read off a 10x zoom of the south frame.
"""
from PIL import Image, ImageEnhance
from _paths import asset, data_uri, write_data, out as out_path

DIRS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west']
CELL = 64

# look: (sex, who in TEXT, PixelLab character id or None, the create_character description).
# Style line on every description: "Cozy farming-sim pixel art, colored outlines, 3-tone shading,
# light from top-left, no text, no UI." outline="single color outline", detail="medium detail".
LOOKS = {
    'baker':     ('m', 'Tomas',  '214c0709-c951-4921-856f-9445546ac786',
                  'young village baker, stocky man in his twenties, fair skin, short ginger hair, flour-dusted white apron over a tan shirt with rolled sleeves, brown trousers, brown boots'),
    'shepherd':  ('m', 'Abel',   '35da2ea8-166a-42db-961d-185e7a7089e5',
                  'old village shepherd, thin elderly man, dark brown skin, short white hair and a short white beard, undyed wool cloak over an olive green tunic, brown trousers, sandals'),
    'farmhand':  ('m', 'Ezra',   'c53b5eb0-979a-446d-977b-6a43f82e2f91',
                  'lanky young village farmhand, teenage man, olive skin, black curly hair under a frayed straw hat, green tunic with a rope belt, patched brown trousers, bare dusty feet in simple shoes'),
    'carpenter': ('m', 'Jonas',  None,
                  'village carpenter, broad middle-aged man, tan skin, short black hair and a full black beard, leather apron with a hammer and tools on the belt, blue-grey shirt, dark trousers, boots'),
    'quarryman': ('m', 'Tobias', None,
                  'old quarryman, heavy-set elderly man, pale weathered skin, bald with grey stubble, stone dust on a faded brown vest over a rough linen shirt, dark trousers, heavy boots'),
    'washer':    ('f', 'Ruth',   '6018414e-4688-4170-b5a4-c560bb1a85cd',
                  'village washerwoman, sturdy middle-aged woman, rosy fair skin, red hair tied up under a faded blue kerchief, long brown skirt, cream blouse with rolled sleeves, grey work apron'),
    'dyer':      ('f', 'Lydia',  'dc4aeea1-cefe-4fba-8b85-cf6965d3266a',
                  'village cloth dyer, tall slender woman in her thirties, warm brown skin, long black hair in a single braid over one shoulder, plum purple dress with a dark sash, purple-stained hands, brown shoes'),
    'grandmother': ('f', 'Mara', None,
                  'village grandmother, small elderly woman, dark brown skin, grey hair in a bun, knitted mustard shawl over a long dark green dress, soft brown shoes'),
    'dairymaid': ('f', 'Naomi',  None,
                  'young village dairymaid, woman in her twenties, freckled fair skin, blonde hair in two braids, sky blue dress with a white apron, wooden clogs'),
    'girl':      ('f', 'Hannah', None,
                  'village girl of about twelve, small and thin, light brown skin, dark brown hair in a loose braid, faded yellow dress, scuffed brown shoes'),
}
# standing relaxed with arms at the sides, full body, is appended to every description

# Hand-placed, in south-frame pixels:
#   band   (y, x0, x1): first row of the head bandage (two rows) and how far it reaches across the
#          head, or None when a hat covers the forehead
#   cheek  where the sticking plaster goes; bruise  a pixel under one eye (the bruise is two pixels)
#   arm    (x0, x1, y): the viewer's-left forearm, three rows down from y; arm2 the other one
#   sit    (top, bottom): rows cut out of the legs so the person sinks down to sit
ANCHORS = {
    'baker':    dict(band=(9, 0, 63),  cheek=(32, 15), bruise=(26, 14), arm=(13, 18, 36), arm2=(43, 48, 37), sit=(46, 53)),
    'washer':   dict(band=(9, 22, 38), cheek=(32, 18), bruise=(25, 16), arm=(16, 21, 35), arm2=(40, 45, 35), sit=(44, 53)),
    'shepherd': dict(band=(7, 0, 63),  cheek=(28, 14), bruise=(36, 13), arm=(17, 21, 40), arm2=(42, 46, 40), sit=(45, 54)),
    'dyer':     dict(band=(8, 25, 39), cheek=(34, 16), bruise=(27, 15), arm=(18, 22, 33), arm2=(41, 45, 33), sit=(43, 52)),
    'farmhand': dict(band=None, cheek=(34, 19), bruise=(27, 18), arm=(16, 21, 40), arm2=(41, 46, 40), sit=(45, 53)),
}

# bandage linen, a sticking plaster, a bruise; outlines are warm dark brown like the art's
LINEN = [(244, 238, 222, 255), (214, 204, 184, 255), (176, 164, 144, 255)]
EDGE = (70, 44, 40, 255)
PLASTER, PLASTER_EDGE = (232, 194, 150, 255), (160, 108, 84, 255)
BRUISE = (128, 96, 150)


def is_edge(c):
    return c[3] and sum(c[:3]) < 150


def row_span(px, y, x0=0, x1=CELL - 1):
    xs = [x for x in range(x0, x1 + 1) if px[x, y][3]]
    return (xs[0], xs[-1]) if xs else None


def head_band(im, y, x0, x1, rows=2, knot=True):
    """A strip of linen around the head at rows y.., x0..x1 at most, the silhouette's outline kept at both ends."""
    px = im.load()
    span = None
    for r in range(rows):
        s = row_span(px, y + r, x0, x1)
        if not s:
            continue
        span = s
        a, b = s
        for x in range(a, b + 1):
            px[x, y + r] = EDGE if x in (a, b) else LINEN[0 if r == 0 else 1] if x < b - 2 else LINEN[min(r + 1, 2)]
    if knot and span:   # two short tails off the viewer's right side
        b = span[1]
        for dx, dy, c in ((1, 1, LINEN[1]), (2, 2, LINEN[1]), (1, 2, LINEN[2]),
                          (2, 1, EDGE), (3, 2, EDGE), (3, 3, EDGE), (2, 3, EDGE), (1, 3, EDGE)):
            x, yy = b + dx, y + dy
            if x < CELL and not (px[x, yy][3] and not is_edge(px[x, yy]) and c == EDGE):
                px[x, yy] = c


def arm_band(im, x0, x1, y):
    """Three rows of linen wrapped round a forearm; outline pixels stay outline."""
    px = im.load()
    for r in range(3):
        xs = [x for x in range(x0, x1 + 1) if px[x, y + r][3]]
        if not xs:
            continue
        a, b = xs[0], xs[-1]
        for x in xs:
            if is_edge(px[x, y + r]) and x in (a, b):
                continue
            px[x, y + r] = LINEN[0] if (r == 0 or x <= a + 1) and x < b else LINEN[1] if r == 1 else LINEN[2]


def plaster(im, x, y):
    px = im.load()
    for dx, dy in ((0, 0), (1, 0), (0, 1), (1, 1)):
        px[x + dx, y + dy] = PLASTER
    px[x + 2, y] = PLASTER_EDGE
    px[x + 2, y + 1] = PLASTER_EDGE


def bruise(im, x, y):
    px = im.load()
    for dx in (0, 1):
        c = px[x + dx, y]
        if c[3] and not is_edge(c):
            px[x + dx, y] = tuple(int(c[k] * 0.55 + BRUISE[k] * 0.45) for k in range(3)) + (255,)


def hurt(src, a):
    im = src.copy()
    if a['band'] is not None:
        head_band(im, *a['band'])
    plaster(im, *a['cheek'])
    bruise(im, *a['bruise'])
    arm_band(im, *a['arm'])
    return im


def sit(src, top, bottom, lean=3, splay=3):
    """Sit them down: cut rows top..bottom out of the legs so the body sinks onto its feet, splay the
    feet apart (legs out in front), lean the upper body, and put a soft shadow under them."""
    h = bottom - top
    im = Image.new('RGBA', (CELL, CELL))
    bb = src.crop((0, bottom, CELL, CELL)).getbbox()
    mid = (bb[0] + bb[2]) // 2
    sy = bb[3] + bottom - 2      # the shadow: a flat dark ellipse at the feet
    for y in range(sy, min(CELL, sy + 3)):
        half = 15 - 3 * abs(y - sy - 1)
        for x in range(mid - half, mid + half):
            im.putpixel((x, y), (20, 12, 10, 90))
    im.alpha_composite(src.crop((0, bottom, mid, CELL)), (-splay, bottom))   # feet stay on the ground, apart
    im.alpha_composite(src.crop((mid, bottom, CELL, CELL)), (mid + splay, bottom))
    body_top = src.getbbox()[1]
    for y in range(body_top, top):   # everything above the cut moves down h rows, leaning more toward the head
        shift = round(lean * (top - y) / max(1, top - body_top))
        im.alpha_composite(src.crop((0, y, CELL, y + 1)), (shift, y + h))
    return im


def badly(src, a):
    im = src.copy()
    if a['band'] is not None:
        head_band(im, *a['band'])
    plaster(im, *a['cheek'])
    bruise(im, *a['bruise'])
    arm_band(im, *a['arm'])
    arm_band(im, *a['arm2'])
    im = sit(im, *a['sit'])
    rgb, alpha = im.convert('RGB'), im.getchannel('A')
    rgb = ImageEnhance.Brightness(ImageEnhance.Color(rgb).enhance(0.8)).enhance(0.93)
    rgb.putalpha(alpha)
    return rgb


def hop(src, up=2):
    im = Image.new('RGBA', (CELL, CELL))
    im.alpha_composite(src.crop((0, up, CELL, CELL)), (0, 0))
    return im


def build():
    folk, rows = {}, []
    for look, (sex, who, cid, _) in LOOKS.items():
        try:
            sheet = Image.open(asset(f'townsfolk/{look}.png')).convert('RGBA')
        except FileNotFoundError:
            print('not yet generated:', look, f'({who})')
            continue
        cells = {d: sheet.crop((i * CELL, 0, i * CELL + CELL, CELL)) for i, d in enumerate(DIRS)}
        s, a = cells['south'], ANCHORS[look]
        states = {'idle': s, 'hop': hop(s), 'hurt': hurt(s, a), 'badly': badly(s, a)}
        folk[look] = {
            'sex': sex,
            'f': [data_uri(states['idle']), data_uri(states['hop'])],
            'hurt': data_uri(states['hurt']),
            'badly': data_uri(states['badly']),
            'dir': {k: data_uri(cells[d]) for k, d in (('e', 'east'), ('n', 'north'), ('w', 'west'))},
        }
        rows.append((look, who, states, cells))
    write_data('townsfolk.json', {'W': CELL, 'H': CELL, 'folk': folk})
    contact_sheet(rows)


def held(im):
    """Roughly what the CSS held tint does (sepia, saturate, hue toward red, darker), for the contact sheet only."""
    rgb, alpha = im.convert('RGB'), im.getchannel('A')
    r, g, b = rgb.split()
    lum = Image.merge('RGB', (r, g, b)).convert('L')
    red = Image.merge('RGB', (lum.point(lambda v: min(255, int(v * 1.05))), lum.point(lambda v: int(v * 0.35)), lum.point(lambda v: int(v * 0.25))))
    red.putalpha(alpha)
    return red


def contact_sheet(rows, z=3):
    """tools/out/townsfolk_sheet.png: every look in every state and direction, 3x, on a cave-ish brown."""
    cols = ['idle', 'held', 'hurt', 'badly', 'east', 'north', 'west']
    W, H = CELL * z, CELL * z
    sheet = Image.new('RGBA', (W * len(cols), H * max(1, len(rows))), (52, 42, 34, 255))
    for r, (look, who, st, cells) in enumerate(rows):
        pics = [st['idle'], held(st['idle']), st['hurt'], st['badly'], cells['east'], cells['north'], cells['west']]
        for c, p in enumerate(pics):
            sheet.alpha_composite(p.resize((W, H), Image.NEAREST), (c * W, r * H))
    sheet.save(out_path('townsfolk_sheet.png'))
    print('preview', out_path('townsfolk_sheet.png'))


if __name__ == '__main__':
    build()
