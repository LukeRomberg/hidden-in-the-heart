"""The hero's side walk with gear (Luke, 2026-11: "make sure the side-walking model shows equipment").

The side-on hero is a PixelLab walk (assets/source/hero/walk/, east; west is its mirror). There is no gear
version of it, so each piece is layered on in code, like the front hero's layers (build_hero_layers.py):
recolours of what's there (boots, the Shoes of Peace, the vest), a band (the belt), a drawn piece anchored to
his eye (the cap, which also trims the hair under and beside it), and the lid edge-on behind him, sticking
out in front of his chest. Seven frames: the stand, then the six walk frames.

Writes src/data/hero-side.json (`HERO_SIDE`): {w, h, n, base, capped, items:{id:{under?, over?}}}, each a PNG
data URI strip of n frames (`capped` is the base with the hair under the cap trimmed); the game stacks them as
CSS background layers (art.js heroSideBG), flipped for west.
Preview: tools/out/hero_side.png (every piece alone, then the plain set and the start).

    .venv/bin/python tools/build_hero_side.py
"""
import colorsys, json, os, sys
from collections import Counter, deque
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from _paths import data_uri, write_data
from _side_common import frames, kind

N, W = 7, 64

# ---- cleanup: PixelLab left holes in the hoodie (frame 5) and a stray dash by his mouth (frame 1) ----
def clean(f):
    f = f.copy(); px = f.load()
    # stray specks: 8-connected bits of fewer than 6 pixels away from the body
    seen = set()
    for y in range(W):
        for x in range(W):
            if px[x, y][3] == 0 or (x, y) in seen: continue
            comp, q = [], deque([(x, y)]); seen.add((x, y))
            while q:
                cx, cy = q.popleft(); comp.append((cx, cy))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < W and 0 <= ny < W and (nx, ny) not in seen and px[nx, ny][3]:
                            seen.add((nx, ny)); q.append((nx, ny))
            if len(comp) < 6:
                for p in comp: px[p] = (0, 0, 0, 0)
    # holes: clear pixels not reachable from the edge get the commonest opaque neighbour
    out = set(); q = deque()
    for i in range(W):
        for p in ((i, 0), (i, W - 1), (0, i), (W - 1, i)):
            if px[p][3] == 0 and p not in out: out.add(p); q.append(p)
    while q:
        cx, cy = q.popleft()
        for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
            if 0 <= nx < W and 0 <= ny < W and (nx, ny) not in out and px[nx, ny][3] == 0:
                out.add((nx, ny)); q.append((nx, ny))
    for _ in range(4):   # holes fill from their rim inwards
        fill = {}
        for y in range(W):
            for x in range(W):
                if px[x, y][3] or (x, y) in out: continue
                nb = [px[nx, ny] for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)) if 0 <= nx < W and 0 <= ny < W and px[nx, ny][3]]
                grey = [c for c in nb if kind(c) == 'g']   # the hoodie, not its outline
                if nb: fill[(x, y)] = Counter(grey or nb).most_common(1)[0][0]
        for p, c in fill.items(): px[p] = c
    # grey specks in front of the face (a dash by his mouth in frame 1)
    for y in range(12, 25):
        ks = [kind(px[x, y]) for x in range(W)]; sx = [x for x in range(W) if ks[x] == 's']
        if sx:
            for x in range(max(sx) + 1, W):
                if ks[x] in 'gw': px[x, y] = (0, 0, 0, 0)
    return f

# ---- what's where, per frame ----
def kinds(f):
    px = f.load(); return [[kind(px[x, y]) for x in range(W)] for y in range(W)]

def hem(K):
    """the hoodie's bottom: the last row with a run of 6+ grey before the jeans start"""
    jeans = min(y for y in range(W) if sum(c == 'b' for c in K[y]) >= 5 and y > 35)
    for y in range(jeans - 1, 20, -1):
        if sum(c == 'g' for c in K[y]) >= 6: return y, jeans
    raise ValueError('no hem')

def torso(K):
    """the hoodie's body (not the near arm): flood over grey from every grey pixel in the back part of the
    torso (fold lines split it into pieces), stopped by outline, so the arm in front stays out"""
    hy, _ = hem(K)
    seeds = set()
    for y in range(hy - 12, hy + 1):
        xs = [x for x in range(W) if K[y][x] != '.']
        if not xs: continue
        back, front = min(xs), max(xs); mid = back + 0.45 * (front - back)
        seeds |= {(x, y) for x in range(back, int(mid) + 1) if K[y][x] == 'g'}
    m, q = set(seeds), deque(seeds)
    while q:
        cx, cy = q.popleft()
        for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
            if 0 <= nx < W and 0 <= ny <= hy and (nx, ny) not in m and K[ny][nx] in 'gw':
                m.add((nx, ny)); q.append((nx, ny))
    return m

def feet(K, jeans):
    """shoe pixels: grey or white below the jeans' top + 6, under the knees"""
    return {(x, y) for y in range(jeans + 6, W) for x in range(W) if K[y][x] in 'gw'}

def eye(K):
    """the eye: the blue pixels in the head (above row 26); returns (x, y) of the topmost-rightmost"""
    bs = [(x, y) for y in range(26) for x in range(W) if K[y][x] == 'b']
    if not bs: bs = [(x, y) for y in range(26) for x in range(W) if K[y][x] == 'w']
    return min(bs, key=lambda p: (p[1], -p[0]))

def ramp(cols):
    """lum 0..255 -> one of cols (dark to light)"""
    return lambda p: cols[min(len(cols) - 1, int((0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]) / 256 * len(cols) * 1.25))]

LEATHER = ramp([(52, 30, 18, 255), (86, 50, 28, 255), (122, 76, 42, 255), (156, 104, 60, 255), (186, 134, 82, 255)])
BOOT = ramp([(48, 28, 18, 255), (84, 48, 26, 255), (120, 72, 38, 255), (150, 98, 54, 255)])
STEEL = ramp([(64, 70, 84, 255), (112, 120, 136, 255), (162, 170, 186, 255), (214, 220, 230, 255)])
GOLD, GOLD_D = (232, 184, 64, 255), (164, 112, 30, 255)
BELT, BELT_D = (92, 54, 30, 255), (54, 30, 16, 255)

# ---- the cap, drawn side-on facing east: r red, d dark red, l light red, o outline, x cut (hair goes) ----
# anchored so the eye sits CAP_EYE below and left of the grid's top-left
CAP = """
.......ooooooo.........
.....oolllrrrrdoo......
....olllrrrrrrrrdo.....
...ollrrrrrrrrrrrdo....
..olrrrrrrrrrrrrrrdo...
..olrrrrrrrrrrrrrrrdo..
.olrrrrrrrrrrrrrrrrdo..
.orrrrrrrrrrrrrrrrrrdoo
.orrrrrrrrrrrrrrrrrrrrdoooo
.oddddddddddddddddrrrrrrrrro
..ooooooooooooooooddddddddo.
..................ooooooooo.
"""
CAP_EYE = (18, 12)   # the eye pixel is this far right and down from the cap grid's top-left
CAP_COL = {'r': (214, 40, 40, 255), 'd': (150, 22, 28, 255), 'l': (240, 92, 84, 255), 'o': (40, 10, 12, 255)}

def build():
    base = [clean(f) for f in frames()]
    items = {k: {} for k in ('boots', 'sabatons', 'vest', 'belt', 'cap', 'lid')}
    strips = {}
    def layer(item, part):
        key = (item, part)
        if key not in strips: strips[key] = Image.new('RGBA', (W * N, W), (0, 0, 0, 0))
        return strips[key]
    cap = [r for r in CAP.strip('\n').split('\n')]
    for i, f in enumerate(base):
        K = kinds(f); px = f.load(); hy, jeans = hem(K); ox = i * W
        # boots: shoes recoloured, plus a cuff over the jeans' last row above them
        ft = feet(K, jeans)
        top = {}
        for x, y in ft: top[x] = min(top.get(x, W), y)
        for x, y in ft:
            layer('boots', 'over').putpixel((ox + x, y), BOOT(px[x, y]))
            c = STEEL(px[x, y]) if y != top[x] else GOLD
            layer('sabatons', 'over').putpixel((ox + x, y), c)
        for x, t in top.items():
            if t - 1 >= 0 and K[t - 1][x] == 'b': layer('boots', 'over').putpixel((ox + x, t - 1), (84, 48, 26, 255))
        # vest: the hoodie's body in leather; the sleeve stays grey
        tm = torso(K)
        for x, y in tm:
            if y >= hy - 16: layer('vest', 'over').putpixel((ox + x, y), LEATHER(px[x, y]))   # the hood above stays grey
        # belt: two rows at the hem across the body, a buckle at the front
        row = [x for x in range(W) if (x, hy) in tm or (x, hy - 1) in tm]
        if row:
            for x in row:
                for y, c in ((hy - 1, BELT), (hy, BELT_D)):
                    if K[y][x] != 'o': layer('belt', 'over').putpixel((ox + x, y), c)
            fx = max(row)
            for dx, dy in ((0, 0), (-1, 0), (0, -1), (-1, -1)):
                layer('belt', 'over').putpixel((ox + fx + dx - 1, hy + dy), GOLD if dy else GOLD_D)
        # cap: anchored to the eye; hair above its brim line and beside it is cut
        ex, ey = eye(K); cx, cy = ex - CAP_EYE[0], ey - CAP_EYE[1]
        brim = cy + len(cap) - 2
        for gy, r in enumerate(cap):
            for gx, ch in enumerate(r):
                if ch in CAP_COL and 0 <= cx + gx < W and 0 <= cy + gy < W:
                    layer('cap', 'over').putpixel((ox + cx + gx, cy + gy), CAP_COL[ch])
        capx = [cx + gx for r in cap for gx, ch in enumerate(r) if ch != '.']
        for y in range(0, min(brim - 2, W)):
            for x in range(W):
                inside = any(cx + gx == x and cy + gy == y and ch != '.' for gy, r in enumerate(cap) for gx, ch in enumerate(r))
                if not inside and K[y][x] in 'hog?' and y < cy + 9:
                    layer('cap', 'cut').putpixel((ox + x, y), (255, 0, 255, 255))
        # the lid: edge-on, behind him, its front edge out past his chest
        chest = max(x for x in range(W) for y in range(hy - 12, hy - 4) if K[y][x] != '.')
        lx, ly = chest - 4, hy - 17
        for y in range(16):
            for x in range(8):
                d = ((x - 3.5) / 4) ** 2 + ((y - 7.5) / 8) ** 2
                if d <= 1:
                    edge = d > 0.68
                    c = (36, 38, 46, 255) if edge else ((196, 200, 208, 255) if (x >= 5 and y < 8) else (150, 156, 166, 255) if x >= 3 else (112, 118, 130, 255))
                    layer('lid', 'under').putpixel((ox + lx + x, ly + y), c)
    bstrip = Image.new('RGBA', (W * N, W), (0, 0, 0, 0))
    for i, f in enumerate(base): bstrip.paste(f, (i * W, 0))
    for (item, part), im in strips.items(): items[item][part] = im
    return bstrip, items

def compose(bstrip, items, gear):
    out = Image.new('RGBA', bstrip.size, (0, 0, 0, 0))
    for g in gear:
        if 'under' in items[g]: out.alpha_composite(items[g]['under'])
    out.alpha_composite(bstrip)
    px = out.load()
    for g in gear:
        if 'cut' in items[g]:
            cp = items[g]['cut'].load()
            for y in range(W):
                for x in range(W * N):
                    if cp[x, y][3]: px[x, y] = (0, 0, 0, 0)
        if 'over' in items[g]: out.alpha_composite(items[g]['over'])
    return out

def preview(bstrip, items, path):
    sets = [[], ['lid'], ['boots'], ['belt'], ['vest'], ['cap'], ['lid', 'boots', 'belt', 'vest', 'cap'], ['lid', 'sabatons', 'belt', 'vest', 'cap']]
    S = 4
    out = Image.new('RGBA', (W * N * S, W * S * len(sets)), (120, 150, 96, 255))   # town grass, roughly
    for r, g in enumerate(sets):
        im = compose(bstrip, items, g).resize((W * N * S, W * S), Image.NEAREST)
        out.alpha_composite(im, (0, r * W * S))
    os.makedirs(os.path.dirname(path), exist_ok=True); out.save(path)

if __name__ == '__main__':
    bstrip, items = build()
    here = os.path.dirname(os.path.abspath(__file__))
    preview(bstrip, items, os.path.join(here, 'out', 'hero_side.png'))
    if '--preview' not in sys.argv:
        capped = compose(bstrip, {'cap': {'cut': items['cap']['cut']}}, ['cap'])
        data = {'w': W, 'h': W, 'n': N, 'base': data_uri(bstrip), 'capped': data_uri(capped),
                'items': {k: {p: data_uri(im) for p, im in v.items() if p != 'cut'} for k, v in items.items()}}
        write_data('hero-side.json', data)
