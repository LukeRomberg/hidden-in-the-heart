# Hidden in the Heart

A cozy pixel-art RPG for memorizing Scripture. Verses are spells: you cast them by
reciting them, and they get stronger as you learn them. Owner: Luke. Built for phone first.

Working title comes from Psalm 119:11 ("I have hidden Your word in my heart that I might
not sin against You"), which is also the verse the hero falls asleep studying.

## Story

A regular guy in a hoodie falls asleep trying to memorize verses (the game's whole premise:
memorization is boring, so make it a game). He wakes in Philadelphia, a village where sin has
become visible. The church is empty; the old priest, Amos, gives him a dented trash-can lid
and asks if he knows Scripture. The first fight is the tutorial and the first boss: Bram, the
blacksmith, burning by the well, has become the Furnace. Freeing him opens the Forge and he
gives you his work boots (`BRAM_GIFT`). The held townsfolk who were in the square flee into
three caves; the church sends you after them one cave at a time. Enemies are people "held" by a sin (Ephesians 6:12: not flesh
and blood). Reciting truth over them frees them, and each freed person reopens part of town.

- **Towns are the seven churches of Revelation 2–3**, one per chapter, named outright
  (Philadelphia was Emberford until 2026-11). Philadelphia is the faithful church (3:7–13:
  little strength, kept His word, an open door) with Amos as its pastor; Ephesus (first love
  lost) is next. Every town follows one template: a boss in the square, then three caves; each
  cave adds one encounter type and the last mixes them. Plan for all seven: `docs/mvp.md`.
- Philadelphia is the Wrath chapter: the Furnace (Bram) in the square, then three caves. Each
  cave ends with a held townsperson whose freeing reopens one building: The Hollow (the
  Grudge, Wendell, Inn), The Old Quarry (the Brawler, Hale, Training Yard), The Deep Cave
  (the Slanderer, Silas, Scriptorium). After all three, the road to Ephesus opens. After the
  Furnace, Amos walks you through town once (`tourHTML`, `TEXT.tour`; replayable from the church).
- Fights along the way are fled villagers (`TEXT.villagers`, men and women, tinted red until
  freed). A cave cleared again has a villager instead of its named boss.
- The world map shows Ephesus, Sardis and Smyrna. Next missions pair a vice with a fruit
  (Galatians 5): Hatred/Love, Envy/Joy, Rivalry/Kindness, Impurity/Goodness,
  Idolatry/Faithfulness, Drunkenness/Self-control.

## Layout and build

- Source is in `src/`; `npm run build` inlines it into one self-contained `dist/index.html`
  (the file that gets hosted). `npm run dev` rebuilds on save and serves on the LAN for phone
  testing. `npm run smoke` builds, then plays title -> tutorial -> the Hollow's map (walks to
  and wins the first fight, opens a chest, verse door, lever, bumps the boss door, reloads)
  headless and fails on any console error. `npm test` = verify + smoke. Run it after every change.
  `npm run script` prints the story as a readable script to `tools/out/script.md`.
- **Test mode**: add `?test` to the URL (local `dist/index.html`, `npm run dev`, or the live
  site). A Test button (top right) jumps straight to the tutorial, town, any cave, any cave
  boss, a villager fight, the level-up popup or the Forge with a throwaway hero ("Strong hero"
  for a late-game one). `src/js/dev.js`; it saves under `hidden-in-the-heart-test`, so the
  real save is never read or written. Add a jump there whenever a new section lands.
- `src/js/*.js` are plain scripts sharing one global scope (inline onclick handlers call
  top-level functions by name), concatenated in the `ORDER` list in `scripts/build.mjs`.
- `src/data/`: scripture (`scripture.js`, `pass.json`), art (`hero.json`, `hero-alpha.json`,
  `enemies.json`, `freed.json`, `ui-frames.json`, `pixels.js`). Logic files pull JSON in with
  `__DATA__('file.json')`; `styles.css` pulls frames in with `__FRAME__(name)`.
- `src/data/text.js` (`TEXT`) holds every line of story, dialogue and flavor text, grouped by
  scene. Luke writes it; never put player-facing sentences in `src/js/`. Dialogue is
  `[speaker id, line]`; `{placeholders}` are filled with `fill()`. Short UI labels (Back,
  End turn…) are still inline. `npm run check-text` (part of `npm test` and CI) catches
  missing commas, unknown speakers and straight quotes in it.

## Core systems

- **Spells are passages that grow.** Each verse climbs 4 tiers of blanks: 25/50/75/100%.
  3 perfect casts promote a tier. At 100% (shown ●) and 3 more perfect casts, the next verse
  is added at 25%. A cast under 75% is a slip; 2 slips in a row drop a tier (or the newest
  verse), so a spell slides to match what you actually remember. 75-99% holds steady. Max 5
  verses per spell, data in `PASS` (generated from the BSB, see below). State: `P.spell[ref]`.
- **Recall UI**: verses at 100% use first-letter typing; the newest verse uses multiple
  choice blanks; the reference (book, chapter, verse) counts as part of the blank pool.
- **Combat**: one action a turn: say one verse, Brace (free, half damage), or Charge (tree
  perk); then the enemies act. Verses cost **focus** (`BASE_FOCUS` 6, +2 from Peace and from
  clearing Mission 1). Focus refills at the start of every fight and never during one, except
  through Romans 12:2 (cost 0, restores focus), which Amos hands you the first time you run
  dry in the tutorial (you start that fight groggy, at 3). Each verse works once; when nothing
  unsaid is affordable, they all come back. A card never costs more than max focus. Damage = verse value x tier multipliers x accuracy. Type advantage:
  Patience x1.5 and Gentleness x1.25 vs wrath.
- **How a fight reads** (presentation only; numbers live in combat.js). The held talk back:
  `TEXT.foes` gives each kind (villagers share one) taunts in the voice of its sin, `waver`
  lines below half HP, `crack` lines near the end, and named moves (`atk`/`big`/`vex`) shown
  in the intent line and again in the log. Taunts are a speech bubble over the speaker
  (`speak()`, kept in `R.say`). The log is one short prose line per action, picked from
  pools (`TEXT.fight.cast`, `openers`, `thoughts`) without repeats (`vary()`); numbers float
  over the target instead (`floatText`). Each turn: a “Your turn” / “Their turn” banner,
  enemies lunge then the hit lands, HP bars drain (`barsSync`), big hits and tier-3 casts
  hit-stop. Freeing is a beat: smoke, freed sprite, their thanks big over the arena
  (`thanksBeat`, tap to skip), then the log. The after-fight panel lists who was freed and
  each cast as perfect / steady / slipped; the level-up popup opens over it. Effects
  live in `#fxtop` so a render() doesn't cut them off. `prefers-reduced-motion` drops the
  lunge, knockback, hit-stop and slides. Styles are in the `/* battle feel */` block.
- **The Furnace** (tutorial boss): three fires; at each third of HP the player assembles
  Galatians 5:22-23 in order (Amos hands it over before the fight). In the tutorial slips
  don't heal him and Amos says the last passage with you, so nobody can get stuck.
- **Provoked** (vex) raises verse costs by 1 for one turn only, then wears off whatever you
  do; otherwise a player at 0 focus could never cast again.
- **Caves** (`CAVES` in dive.js) are hand-drawn ASCII tile maps (`#` rock, `.` floor, `S` start,
  `B` the held townsperson, `D` boss door, `V` verse door, `L`/`K` levers for `G`/`H` gates,
  digits = that cave's `marks`: fights, chests, campfire; lowercase letters = the encounters in
  `encounters.js`: `scrap`, `truth`, `hurt`). Fog of war: light reaches ~3 tiles
  (blocked by rock and shut doors, not gate bars); seen tiles stay dim. Tap a tile to walk the
  BFS path over tiles you've seen; tap the dark to get as near as you can. Walking into a marker
  stops you in front of it: fights switch to the arena and come back (`clearColumn()` is the
  hand-back combat.js calls), chests and the campfire open a panel under the map, and a cleared
  marker is gone. A verse door opens on any verse you carry said without a slip; the boss door
  stays barred until everyone held on the map is free (fights and truth villagers). Placeholder tiles and objects are drawn
  in code (`CAVE_PAL`, `ART`). `P.caves` counts clears; `P.run` ({v:2, cave, pos, face, seen,
  done, open}) resumes on the map after a reload; an older run restarts at the cave mouth.
- **Encounters** (`encounters.js`, plan in `docs/encounters.md`): Amos's **sermon scraps**
  (“You have heard it said, brothers…”) are walked over and picked up (`P.notes`) and teach one
  truth each; **truth villagers** ask “Is it true that…?” from `TEXT.truths.list` (verses in
  `TRUTH_V`, checked by verify). Right frees them; wrong means a fight, and the truth goes in
  `P.retry` and is asked by the next villager. **Someone hurt** (`TEXT.living`): help (6 HP) or
  walk on; everyone helped stands with you at the boss (+5 shield each). The first truth
  villager and the first hurt person ever come with Amos (`P.firstTruth`, `P.firstHurt`); with
  him there you can't fail.
- Balance was tuned with a scripted player at 60/70/85% accuracy over the whole arc.
- **Souls level you up** (level N needs N+1 souls). Each level = one fruit on the tree, picked
  in a level-up popup that opens when the fight ends.
- **Chests** hold a scrambled section of the Nicene Creed (ELLC 1988, 8 sections, `creed.json`)
  to put back in order. Tier comes from the cave's `marks`: deeper chests have more pieces, fewer
  allowed mistakes and better loot (`CHEST` in dive.js). Fail and you get nothing. Progress is
  `P.creed`; the Codex shows the Creed so far.
- **The tree**: all nine fruit of the Spirit, bottom-up. Patience, Gentleness, Peace are
  open; the rest unlock one per mission going up the trunk. Only those three have perks
  defined (`TREE`); the rest need designing.
- **Gear** arrives in a fixed order and follows Ephesians 6:14-17. Plain gear (belt, vest,
  boots, cap; Bible and lid from the priest) is consecrated at the Forge into the Armor of God
  by reciting Ephesians 6 cumulatively (6:14, then 6:14-15, ... 6:14-17). Gear is permanent.
- **Saves**: localStorage key `hidden-in-the-heart-v1` (object `P`; hero in `P.hero`). A
  mission in progress is `P.run` (step + fragments), so a reload resumes on the map.
  Per-browser; "Move your save" on the title screen copies the whole save as a code
  (`HITH1.` + base64 JSON) and loads one pasted from another browser. Moving saves to a backend is on the list.

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

Scenes, battle backgrounds, cave scenes and the cave battle background (PixelLab, in
`assets/source/caves/` and `battle/cave.png`), town buildings (boarded/open), priest, portraits, hero poses,
HUD icons, all nine fruit icons (Joy, Kindness, Faithfulness from PixelLab, cut to 16x16)
and seven card frames (six fruit plus Armor, PixelLab, recolored to steel) are wired in.
The build inlines them as data URIs via `__IMG__('path')`.

Effects (`assets/source/fx/`, `IMG.fx` = {src, w, h, n}) are one-row sprite sheets from
PixelLab's free vfx_workbench, padded to fixed cells: per-fruit impacts 32x32 x6
(patience, gentleness, selfcontrol, love, peace, goodness x5), bigcast 64x64 x6, freed
64x64 x8, hit 32x32 x4, shield 48x64 x4, levelup 64x64 x6. `fx.js` plays them with CSS
`steps()` (`sheetFX`, `sheetHTML`) on a fixed `#fxtop` layer so a render() mid-effect
doesn't cut them off. Armor and the three locked fruit borrow the Patience star.

## Art still wanted

- Impact effects for Joy, Kindness, Faithfulness (32x32 x6) once those fruit unlock.
- Held-villager sprites (today the villagers are tinted townsfolk; on the cave map, red-rimmed shadows).
- Cave map tileset (rock, rock face, floor per cave; doors, gate, lever, chest, campfire) and hero
  walking frames, about 6 PixelLab generations. Waiting for Luke's OK after he tries the
  code-drawn placeholders on his phone.

## Conventions

- Phone-first. Test at ~430px wide. Safe-area insets are handled; keep them.
- A screen's main actions (Back, Next, Go in, Move on, Brace…) go in a `<div class="dock">` as the
  last element: it pins to the bottom of the screen (above the tab bar) while content scrolls.
  Dialogue actions get it automatically from `talk()`. Reading text is Nunito; game chrome is
  Pixelify Sans.
- Typography uses curly quotes and apostrophes in all player-facing text.
- When characters talk about the Bible, use the names it gives itself (Scripture, the word of
  God, truth, wisdom, His law, the sword of the Spirit), never "the words."
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
5. Design Mission 2 (Hatred / Love) and Ephesus.
6. Optional: backend saves so progress follows Luke between phone and laptop.
