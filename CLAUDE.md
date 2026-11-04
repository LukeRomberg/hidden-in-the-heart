# Hidden in the Heart

A cozy pixel-art RPG for memorizing Scripture. Verses are spells: you cast them by
reciting them, and they get stronger as you learn them. Owner: Luke. Built for phone first.

Working title comes from Psalm 119:11 ("I have hidden Your word in my heart that I might
not sin against You"), which is also the verse the hero falls asleep studying.

## Story

A regular guy in a hoodie falls asleep trying to memorize verses (the game's whole premise:
memorization is boring, so make it a game). He wakes in Emberford, a village where sin has
become visible. The church is empty; the old priest, Amos, gives him a dented trash-can lid
and asks if he knows the words. A guided tutorial fight frees Bram, the blacksmith, shouting
at his own forge (the Hothead), which opens the Forge before any dungeon. Enemies are people "held" by a sin (Ephesians 6:12: not flesh
and blood). Reciting truth over them frees them, and each freed person reopens part of town.

- Emberford / Mission 1 "Anger in the Square": the Wrath floor. Boss: The Furnace.
- Freeing the Hothead reopens the Forge (Bram, in the tutorial), the Grudge the Inn (old
  innkeeper, male), the Brawler the Training Yard (drill master), the Slanderer the
  Scriptorium (scribe). Named people are freed once; after that their rooms hold held
  villagers (`TEXT.villagers`, men and women, tinted red until freed).
- The world map shows Ashby and two unknown towns. Next missions pair a vice with a fruit
  (Galatians 5): Hatred/Love, Envy/Joy, Rivalry/Kindness, Impurity/Goodness,
  Idolatry/Faithfulness, Drunkenness/Self-control.

## Layout and build

- Source is in `src/`; `npm run build` inlines it into one self-contained `dist/index.html`
  (the file that gets hosted). `npm run dev` rebuilds on save and serves on the LAN for phone
  testing. `npm run smoke` builds, then plays title -> tutorial -> first mission fight headless
  and fails on any console error. `npm test` = verify + smoke. Run it after every change.
  `npm run script` prints the story as a readable script to `tools/out/script.md`.
- `src/js/*.js` are plain scripts sharing one global scope (inline onclick handlers call
  top-level functions by name), concatenated in the `ORDER` list in `scripts/build.mjs`.
- `src/data/`: scripture (`scripture.js`, `pass.json`), art (`hero.json`, `hero-alpha.json`,
  `enemies.json`, `freed.json`, `ui-frames.json`, `pixels.js`). Logic files pull JSON in with
  `__DATA__('file.json')`; `styles.css` pulls frames in with `__FRAME__(name)`.
- `src/data/text.js` (`TEXT`) holds every line of story, dialogue and flavor text, grouped by
  scene. Luke writes it; never put player-facing sentences in `src/js/`. Dialogue is
  `[speaker id, line]`; `{placeholders}` are filled with `fill()`. Short UI labels (Back,
  End turn…) are still inline.

## Core systems

- **Spells are passages that grow.** Each verse climbs 4 tiers of blanks: 25/50/75/100%.
  3 perfect casts promote a tier. At 100% (shown ●) and 3 more perfect casts, the next verse
  is added at 25%. A cast under 75% is a slip; 2 slips in a row drop a tier (or the newest
  verse), so a spell slides to match what you actually remember. 75-99% holds steady. Max 5
  verses per spell, data in `PASS` (generated from the BSB, see below). State: `P.spell[ref]`.
- **Recall UI**: verses at 100% use first-letter typing; the newest verse uses multiple
  choice blanks; the reference (book, chapter, verse) counts as part of the blank pool.
- **Combat**: turn-based, 4-card hand, each spell castable once per fight (deck refreshes
  when all are spent). A card never costs more than max mana (or the deck could never refresh). Damage = verse value x tier multipliers x accuracy. Type advantage:
  Patience x1.5 and Gentleness x1.25 vs wrath.
- **Boss**: three fires; at each third of HP the player assembles Galatians 5:22-23 in order.
- **Souls level you up** (level N needs N+1 souls). Each level = one fruit on the tree, picked
  in a level-up popup that opens when the fight ends.
- **Chests** hold a scrambled section of the Nicene Creed (ELLC 1988, 8 sections, `creed.json`)
  to put back in order. Tier comes from the map (`STEPS`): deeper chests have more pieces, fewer
  allowed mistakes and better loot (`CHEST` in map.js). Fail and you get nothing. Progress is
  `P.creed`; the Codex shows the Creed so far.
- **The tree**: all nine fruit of the Spirit, bottom-up. Patience, Gentleness, Peace are
  open; the rest unlock one per mission going up the trunk. Only those three have perks
  defined (`TREE`); the rest need designing.
- **Gear** arrives in a fixed order and follows Ephesians 6:14-17. Plain gear (belt, vest,
  boots, cap; Bible and lid from the priest) is consecrated at the Forge into the Armor of God
  by reciting Ephesians 6 cumulatively (6:14, then 6:14-15, ... 6:14-17). Gear is permanent.
- **Saves**: localStorage key `hidden-in-the-heart-v1` (object `P`; hero in `P.hero`). A
  mission in progress is `P.run` (step + fragments), so a reload resumes on the map.
  Per-device. Moving saves to a backend is on the list.

## Scripture text

Berean Standard Bible only (public domain since 2023). Never write verse text from memory:
pull it from `https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/BSB.json`
and check it. (That check caught a missing "and" in Galatians 5:23.) ESV is off the table.
`npm run verify` checks every verse in `src/` against that file and fails on any mismatch;
`npm run passages` regenerates `pass.json` from it. See `tools/README.md`.
Credit line on the title screen: "Scripture quotations are from the Berean Standard Bible,
public domain." followed by the ELLC credit for the Creed. The Creed is ELLC's text verbatim
(pinned in `tools/creed_ellc.json`, fetched from englishtexts.org), except "and the Son"
without ELLC's optional brackets; `npm run verify` checks it.

## Art pipeline

Source sheets live in `assets/source/`. The generated art lives in `src/data/`
(see Layout), produced by the scripts in `tools/` (how to run them: `tools/README.md`):

- `build_hero_layers.py`: cuts `hero_starter_sheet.png` and `hero_armor_sheet.png`
  (7 rows x 4 cols, 64x64 cells: base, then one gear piece per row; cols = front idle,
  front cast, back idle, back cast) into a base plus diff layers. Writes `hero.json`
  (`const HERO`) and `hero-alpha.json` (`const ALPHA`). Gear layers stack;
  a later layer's grey hoodie pixels never overwrite an earlier layer's real pixels (`WEAK`).
- `build_enemies.py`: `enemies_freed_48x64.png` (rows hothead, grudge, brawler, slanderer;
  cols idle, attack, freed idle, freed wave) and `furnace_96x96.png` (same 4 columns) become
  `ENEMY_IMG` entries `name` and `name_f` in `enemies.json`.
- `build_villagers.py`: six recolored townsfolk (`freed.json`, placeholder; only shown for
  a freed enemy without its own freed sprite, which no current enemy lacks).
- `build_ui_frames.py`: the pixel UI kit (wood/parchment 9-slice frames, plank buttons,
  card rims per fruit, portrait frame, name plate, floor tile), used via CSS border-image.

Style line for all generated art: "Cozy farming-sim pixel art, colored outlines, 3-tone
shading, light from top-left, no text, no UI." Sheets must be real pixel art on a true grid
with transparency; the hero's base row must stay pixel-identical across sheets.

PixelLab MCP: `claude mcp add pixellab https://api.pixellab.ai/mcp -t http -H "Authorization: Bearer YOUR_SECRET"`.
Tool reference: https://api.pixellab.ai/mcp/docs

## Art in the game (assets/source/, listed in src/data/images.js)

Scenes, battle backgrounds, town buildings (boarded/open), priest, portraits, hero poses,
HUD icons, six fruit icons and six fruit card frames are wired in. The build inlines them
as data URIs via `__IMG__('path')`.

## Art still wanted (exact specs agreed with Luke)

- Spell effects, 6 frames x 32x32 strips per fruit; big-cast starburst 64x64 x6; freed
  smoke 64x64 x8; hit spark 32x32 x4; shield shimmer 48x64 x4; level up 64x64 x6.
- Icons 16x16 for Joy, Kindness, Faithfulness. Card frame 64x88 for Armor (Ephesians 6
  cards still use the generated frame).

## Conventions

- Phone-first. Test at ~430px wide. Safe-area insets are handled; keep them.
- Typography uses curly quotes and apostrophes in all player-facing text.
- Luke prefers short, direct replies with dry humor; no praise. Ask before saving anything
  to memory.

## Next steps

1. Done: split into `src/` modules with a build that inlines back to one file.
2. Done: github.com/LukeRomberg/hidden-in-the-heart, live at
   https://lukeromberg.github.io/hidden-in-the-heart/. Every push to main runs
   `.github/workflows/pages.yml` (verify, build, smoke, deploy). This repo pushes as the
   personal account via a repo-local credential helper; the default SSH key is the work account.
3. Wire PixelLab and replace the placeholder art above.
4. Finish the UI overhaul: recall popup, after-fight panel, dungeon map.
5. Design Mission 2 (Hatred / Love) and Ashby.
6. Optional: backend saves so progress follows Luke between phone and laptop.
