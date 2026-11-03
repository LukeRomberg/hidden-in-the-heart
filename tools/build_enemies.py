"""Cut the enemy sheets into ENEMY_IMG (src/data/enemies.json).

Sheets (in assets/source/), 4 columns each: idle, attack, freed idle, freed wave.
  enemies_freed_48x64.png  rows: hothead, grudge, brawler, slanderer (48x64 cells)
  furnace_96x96.png        one row: the Furnace (96x96 cells)
Each enemy becomes two entries: `name` (idle, attack) and `name_f` (freed idle, freed wave).
"""
from PIL import Image
from _paths import asset, data_uri, write_data, out

SHEETS = [
    ('enemies_freed_48x64.png', 48, 64, ['hothead', 'grudge', 'brawler', 'slanderer']),
    ('furnace_96x96.png', 96, 96, ['furnace']),
]

result = {}
preview_cells = []
for file, w, h, rows in SHEETS:
    sheet = Image.open(asset(file)).convert('RGBA')
    assert sheet.size == (w * 4, h * len(rows)), f'{file}: expected {w*4}x{h*len(rows)}, got {sheet.size}'
    for r, name in enumerate(rows):
        cells = [sheet.crop((c * w, r * h, c * w + w, r * h + h)) for c in range(4)]
        result[name] = {'w': w, 'h': h, 'f': [data_uri(cells[0]), data_uri(cells[1])]}
        result[name + '_f'] = {'w': w, 'h': h, 'f': [data_uri(cells[2]), data_uri(cells[3])]}
        preview_cells.append(cells)

write_data('enemies.json', result)

# preview: one row per enemy, 3x
pw = max(c[0].width for c in preview_cells) * 3
prev = Image.new('RGBA', (pw * 4, sum(c[0].height * 3 for c in preview_cells)), (23, 17, 13, 255))
y = 0
for cells in preview_cells:
    for i, c in enumerate(cells):
        prev.alpha_composite(c.resize((c.width * 3, c.height * 3), Image.NEAREST), (i * pw, y))
    y += cells[0].height * 3
prev.save(out('enemies_preview.png'))
