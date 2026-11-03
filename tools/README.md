# tools

Scripts that generate the data in `src/data/`. Run them from the repo root. After any
of them, run `npm run build` and `npm run smoke`.

## Scripture (Node, no setup)

The BSB text is downloaded on first use to `tools/data/BSB.json` (gitignored) from the
URL in CLAUDE.md.

| Command | What it does |
|---|---|
| `npm run verify` | Checks every verse in `src/` against the BSB and exits 1 on any mismatch: `VERSES`, `ARMOR_V`, `STORY_V`, the Galatians `CHUNKS`, `pass.json`, and any inline “quote” followed by a reference (e.g. Ephesians 6:12 in the mission intro). |
| `npm run passages` | Regenerates `src/data/pass.json` from the BSB. Each spell verse in `VERSES`/`STORY_V` grows into a passage of up to 5 verses (stopping at the end of the chapter); `ARMOR` is Ephesians 6:14-17. Review the diff before committing. |

To add a verse: add it to `VERSES` in `src/data/scripture.js` with text copied from
`tools/data/BSB.json`, run `npm run passages`, then `npm run verify`.

## Art (Python 3 + Pillow)

One-time setup:

```bash
python3 -m venv .venv && .venv/bin/pip install -r tools/requirements.txt
```

Each script reads `assets/source/`, writes straight into `src/data/`, and drops previews
in `tools/out/` (gitignored).

| Command | Reads | Writes |
|---|---|---|
| `.venv/bin/python tools/build_hero_layers.py` | `hero_starter_sheet.png`, `hero_armor_sheet.png` | `hero.json` (`HERO`), `hero-alpha.json` (`ALPHA`) |
| `.venv/bin/python tools/build_enemies.py` | `enemies_freed_48x64.png`, `furnace_96x96.png` | `enemies.json` (`ENEMY_IMG`) |
| `.venv/bin/python tools/build_villagers.py` | `hero_starter_sheet.png` | `freed.json` (`FREED_IMG`, placeholder townsfolk) |
| `.venv/bin/python tools/build_ui_frames.py` | nothing (drawn in code) | `ui-frames.json` (`__FRAME__(name)` in `styles.css`) |

All four reproduce the shipped art pixel for pixel. The PNG bytes inside the data URIs can
change with the Pillow version, which is harmless.

Sheet layouts:

- Hero sheets: 7 rows x 4 cols of 64x64. Row 0 is the base; each later row adds one gear
  piece. Cols: front idle, front cast, back idle, back cast. The base row must be
  pixel-identical in both sheets.
- Enemy sheets: 4 cols (idle, attack, freed idle, freed wave). `enemies_freed_48x64.png`
  rows are hothead, grudge, brawler, slanderer; `furnace_96x96.png` is one row.

`assets/source/` also holds the scenes, battle backgrounds, town buildings, portraits, cards
and icons. None of these are wired into the game yet.
