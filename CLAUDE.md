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
  Furnace, Amos walks you round the town map once, stopping at each place (`startTour` in townmap.js,
  `TEXT.tour.stops`; replayable from the church).
- **The chapter ending** (`chapterEndHTML` in story.js, screen `chapterend`, text `TEXT.chapterEnd`)
  plays once: the first clear that finishes the last cave sends `caveDoneHTML`'s button there
  instead of town. A full church, the bell, a line each from Bram, Wendell, Hale and Silas, then
  Amos reads Revelation 3:8 (the town is named for the church in Revelation 3:7–13) and points
  at the road east. Then chapter stats (souls, who came home, truths from `P.notes` +
  `P.truthsRight`, everyone helped in `P.helpedAll`, Creed pieces, verses by heart, talents) and
  “To be continued.” Leaving sets `P.chapters.philadelphia`. Test jump: “Chapter ending”.
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
- **Editing the text** (Luke): the Philadelphia Script artifact (https://claude.ai/artifact/GPYx53DWfndGnKLH1HA6Ft,
  private) lists every line by section with who says it and when; his edits and notes save in its database
  (`edits`, `progress/scenes`). Rebuild it after text.js changes with `node tools/script_page.mjs` and republish
  `tools/out/script-editor.html` to that URL. To apply: read the `edits` collection with ArtifactData
  (`out_dir`), run `node tools/apply_text_edits.mjs <dir>` (checks each line's path, curls quotes, lists notes),
  then `npm test`, rewrite the noted lines, and clear applied edits from the store.
- **Test mode**: add `?test` to the URL (local `dist/index.html`, `npm run dev`, or the live
  site). A Test button (top right) jumps straight to the tutorial, town, any cave, any cave
  boss, a villager fight, a hurt person, every townsperson in every state, the level-up popup or the Forge with a throwaway hero ("Strong hero"
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
- **Combat**: one action a turn: say one verse, or Charge (tree perk); then the enemies act. No
  Brace (removed 2026-11); only a turn with nothing affordable shows “Catch your breath” to pass. Verses cost **focus** (`BASE_FOCUS` 6, +2 from Peace and from
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
  lunge, knockback, hit-stop and slides. Styles are in the `/* battle feel */` block. The held, the hurt
  and Amos (when he stands with you) breathe: a slow stepped rise and sway on the sprite (`/* battle faces */`
  block, off under reduced motion). The truth villager's and the hurt person's face sits in the box under the arena.
- **The Furnace** (tutorial boss): an ordinary fight until his HP hits 0; then the player says
  Galatians 5:22-23 over him by tapping its pieces in order (Amos hands it over before the fight), and
  that frees him. In the tutorial slips don't count: Amos says it with you. Amos's rules come as popups
  that stop the fight (`TIP_ORDER`, `tutorialFirst()` in story.js), including before the first recall
  and before the Galatians pieces.
- **Provoked** (vex) raises verse costs by 1 for one turn only, then wears off whatever you
  do; otherwise a player at 0 focus could never cast again.
- **The town map** (`TOWN` in townmap.js) replaced the town menu: Philadelphia is a lit tile map on the cave
  engine (tilemap.js). Buildings (`IMG.town` art over their footprints) have a door tile; walk into it to enter
  the building's screen (`enterBuilding`), boarded ones say why under the map. Cave mouths sit on the edges (1 2 3),
  the road east (E) leads to the world map screen. People (Amos, Bram burning by the well before the Furnace,
  each shopkeeper by their door once it's open) talk in a popup over the map (`talkPop`, lines in `TEXT.townMap`).
  The opening plays on it: you wake in the square, walk to the church (prologue scenes), then out to Bram with
  Amos beside you. Where you stand is `P.town.pos` / `P.town.face` (P.town also holds the building flags).
  The art is front-facing (Luke's pick, 2026-11: the facade straight on, roof from above, like the characters):
  the kit from `tools/build_town.py`, drawn at `TSC` 0.85 screen px per art pixel; the ground is one picture made
  from two Wang strips (`townGround`, dual grid: dirt under grass, cobblestone over that).
- **Cottages and townsfolk on the map**: one cottage (`H`, owner in `TOWN.houses`) per person in `TEXT.villagers`
  and `TEXT.living.people`, boarded until they're home: a held villager once freed (`townHome`, called from
  combat.js and encounters.js, kept in `P.home`; `pickFreed` prefers someone still away), a hurt person once
  helped (`P.helpedAll`), and everyone once all three caves are clear. Then they stand beside their door and
  wander a few tiles (`R.folk`, walk cycles in `folkwalk.json`); walk into them or their door to talk
  (`TEXT.townMap.homes`; a boarded door gives the `shut` line).
- **The finale** (townmap.js): the first clear of the last cave sends `caveDoneHTML` to `finaleStart()`, not
  straight to `chapterend`. The bell rings (`TEXT.townMap.finale`), everyone walks out of their door into a line
  from you to the church, Amos says his line, the line walks in, you and Amos last; stepping in at the church
  door plays the chapter ending. `finaleDue()` restarts it from the bell after a reload. Test jump: "Finale".
- **Caves** (`CAVES` in dive.js) are hand-drawn ASCII tile maps (`#` rock, `.` floor, `S` start,
  `B` the held townsperson, `D` boss door, `V` verse door, `L`/`K` levers for `G`/`H` gates,
  digits = that cave's `marks`: fights, chests, campfire; lowercase letters = the encounters in
  `encounters.js`: `scrap`, `truth`, `hurt`). Fog of war: light reaches ~3 tiles
  (blocked by rock and shut doors, not gate bars); seen tiles stay dim. Tap a tile to walk the
  BFS path over tiles you've seen; tap the dark to get as near as you can. Walking into a marker
  stops you in front of it: fights switch to the arena and come back (`clearColumn()` is the
  hand-back combat.js calls), chests and the campfire open a panel under the map, and a cleared
  marker is gone. A verse door opens on any verse you carry said without a slip; the boss door
  stays barred until everyone held on the map is free (fights and truth villagers). The ground is one PixelLab Wang
  tileset per cave drawn once onto a canvas on a dual grid (`caveGround`: each 32px tile straddles four cells and takes rock or
  floor from each, so walls get real faces and corners); the tiles above it carry only fog and objects (`CAVE_ART`, PixelLab). The walking itself (BFS, light, camera, drawing) is `tilemap.js`, shared with the
  town map; a place registers its rules in `PLACES`. `P.caves` counts clears; `P.run` ({v:2, cave, pos, face, seen,
  done, open}) resumes on the map after a reload; an older run restarts at the cave mouth.
- **How the maps feel** (`mapfx.js`, configured per place in `MAPFX` by tile glyph or marker, never by coordinates):
  a fade (not the wipe) between places and the place's name as you arrive (`sceneTitle`, from `goto`); doors that
  swing (`swingDoor` for a building's door in town, `fxOpening` for cave doors and gates); light pools (screen-blended:
  campfires, wall torches, the forge, lamps at dusk); embers, dust motes, the odd leaf, fireflies at dusk; soft shadows;
  `MAPFX.town.dusk` (bool or function) tints the town for dusk. Draw order: row y's tiles at z 2y, people on it at 2y+1,
  then dusk 900, lights 901, particles 902. All motion stops under `prefers-reduced-motion`. Test jump: “Town map at dusk”.
- **The satchel** (`satchel.js`, docs/combat-v2.md section 5): you carry five verses into a cave. With more than five
  known, `startCave` opens the packing screen (screen `pack`, at the cave mouth, or “Pack your satchel” in the church,
  which can switch caves); five or fewer, you carry them all. Fights in a cave and its verse doors use only the packed
  set (`carried()`: `R.satchel` while `R.cave` and `P.run` are set; the tutorial and fights outside a cave use all of
  `R.deck`, which stays the whole collection). Repacking means walking out (the cave keeps its progress). Each cave
  remembers its last satchel (`P.satchel[cave id]`, `P.satchel.last` seeds a new cave); a verse learned inside goes in
  if there's room. `enterCave(i, refs)` skips the screen (test jumps). Amos explains it once (`P.tips.satchel`, lines
  in `TEXT.dive.satchel`). Test jumps: “Satchel: …”.
- **Encounters** (`encounters.js`, plan in `docs/encounters.md`): Amos's **sermon scraps**
  (“You have heard it said, brothers…”) are walked over and picked up (`P.notes`) and teach one
  truth each; **truth villagers** ask “Is it true that…?” from `TEXT.truths.list` (verses in
  `TRUTH_V`, checked by verify). Right frees them; wrong means a fight, and the truth goes in
  `P.retry` and is asked by the next villager. **Someone hurt** (`TEXT.living`): help (6 HP) or
  walk on; everyone helped stands with you at the boss (+5 shield each). The first truth
  villager and the first hurt person ever come with Amos (`P.firstTruth`, `P.firstHurt`); with
  him there you can't fail.
- **Balance**: `npm run playtest` plays the whole chapter at 50/60/70/85/95% recall accuracy,
  with and without buying gear, and reports lowest HP, close calls and defeats
  (`tests/out/playtest.md`). Targets: 50% and 60% fail, 70% scrapes through (with gear), 85% is
  fairly comfortable. Numbers and what set them: `docs/mvp.md`, Balance. Rerun it after any change
  to enemies, damage, healing or prices (about 15 minutes; `node tests/playtest.mjs 0.7 shopper` for one).
- **Reward popups** (`rewards.js`): anything earned shows a “you got…” popup (`reward({kind,…})` queues
  one; render() shows them one at a time, never mid-fight): gear bought or consecrated (hero before and
  after, what it does), a new verse, a verse leveling up, a chest (talents + Creed piece), a sermon note,
  drill pay. Text in `TEXT.reward`.
- **Sermon notes teach the Creed too**: each note ends with the Creed piece the next chest asks for
  (`creedOnNote()` in encounters.js), so you meet it before the chest tests it.
- **Souls level you up** (level N needs N+1 souls). Each level = one fruit on the tree, picked
  in a level-up popup that opens when the fight ends.
- **Chests** hold a scrambled section of the Nicene Creed (ELLC 1988, 8 sections, `creed.json`)
  to put back in order. Tier comes from the cave's `marks`: deeper chests have more pieces, fewer
  allowed mistakes and better loot (`CHEST` in dive.js). Fail and you get nothing. Progress is
  `P.creed`; the Codex shows the Creed so far.
- **The tree**: all nine fruit of the Spirit, bottom-up, hung on a painted PixelLab tree
  (`assets/source/tree/tree.png`, positions in `SOCKET` in tree.js); tapping a fruit opens a sheet
  with its three perks. Patience, Gentleness, Peace are
  open; the rest unlock one per mission going up the trunk. Only those three have perks
  defined (`TREE`); the rest need designing.
- **Gear** follows Ephesians 6:14-17. Plain gear (belt, vest, cap) is bought at the Forge;
  the boots are Bram's gift, the Bible and lid the priest's. Nothing drops after fights. Plain
  gear is consecrated at the Forge into the Armor of God, in order, by reciting Ephesians 6
  cumulatively (6:14, then 6:14-15, ... 6:14-17). Gear is permanent. Prices: `docs/mvp.md`, Economy.
- **Shops** (town.js): each building lists its whole stock with what it does, its price, and
  why it's locked. The Inn adds a rumor about the next uncleared cave and Wendell's ledger
  (what you're saving toward). The yard pays for a clean drill once per verse per cave cleared
  (`P.drills`).
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
- `build_townsfolk.py`: Philadelphia's townsfolk, one PixelLab v3 character per look (5 men, 5 women,
  `assets/source/townsfolk/`, 8 directions), into `townsfolk.json` (`FOLK`): front idle + hop, hurt and
  badly hurt (bandages drawn in code, hand-placed per look in `ANCHORS`), and east/north/west for the town
  map. Each person in `TEXT.villagers` and `TEXT.living.people` has a `look`; held villagers are their own
  sprite under the red CSS tint. All ten looks are done (`LOOKS`); a new look without a sheet falls back to:
- `build_villagers.py`: six recolored townsfolk (`freed.json`, the old placeholders).
- `build_cave_art.py`: the caves' map art from PixelLab (`assets/source/caves/pixellab/`: one standard Wang tileset per
  cave, 32px, transition 0.5, plus seven 32px Pixen objects) into `assets/source/caves/map/`: a 4x4 ground sheet per cave
  indexed by corner mask (NW 8, NE 4, SW 2, SE 1; 1 = rock), colour-graded (`GRADE`), and the objects with their derived
  states (open doors and swinging leaves, raised gate, pulled lever, a second campfire frame).
- `build_folk_walk.py`: the townsfolk's walk cycles (animate_character, template "walking", 6 frames,
  south/north/east/west) into `folkwalk.json` (`FOLK_WALK`); `--fetch` downloads them again from PixelLab.
- `build_town.py`: the town kit from `assets/source/town/raw/` (PixelLab create_map_object, low top-down,
  selective outline; ground from create_topdown_tileset): buildings and cottages open and boarded (the boarded
  one is drawn: planks over the door rect, lit windows put out), props, two ground strips, and `town.json`
  (sizes, door positions).
- `build_ui_frames.py`: the pixel UI kit (wood/parchment 9-slice frames, plank buttons,
  card rims per fruit, portrait frame, name plate, floor tile), used via CSS border-image. Since the
  leather-journal look (2026-11) only the card rim and the name plate are still used; the rest is drawn in CSS.

Style line for all generated art: "Cozy farming-sim pixel art, colored outlines, 3-tone
shading, light from top-left, no text, no UI." Sheets must be real pixel art on a true grid
with transparency; the hero's base row must stay pixel-identical across sheets.

PixelLab MCP: `claude mcp add pixellab https://api.pixellab.ai/mcp -t http -H "Authorization: Bearer YOUR_SECRET"`.
Tool reference: https://api.pixellab.ai/mcp/docs

## Art in the game (assets/source/, listed in src/data/images.js)

Scenes, cave scenes (PixelLab, `assets/source/caves/`), battle backgrounds matched to the place
(`IMG.battle`, picked by `arenaBG()` in art.js: `square_day` for fights in town, `square_night` for the
Furnace, `hollow`/`quarry`/`deep` per cave, cave bosses included), town buildings (boarded/open), priest,
portraits for every speaker in `TEXT.speakers` (48x48; the ten townsfolk in `portraits/folk/` by look, keyed
by name in lowercase; Amos has three faces: `priest` warm, `priestGrave`, `priestGlad`, picked per line by
using that speaker id in `TEXT`; `faceOf(person)` in story.js finds a townsperson's), hero poses,
HUD icons, all nine fruit icons (Joy, Kindness, Faithfulness from PixelLab, cut to 16x16)
seven card frames (six fruit plus Armor, PixelLab, recolored to steel), the fruit tree, and
one icon per gear item (`IMG.gear`, cut from `icons/gear_sheet.png`, shown in the Forge and on the
gear screen) are wired in.
The build inlines them as data URIs via `__IMG__('path')`.

Effects (`assets/source/fx/`, `IMG.fx` = {src, w, h, n}) are one-row sprite sheets from
PixelLab's free vfx_workbench, padded to fixed cells: per-fruit impacts 32x32 x6
(patience, gentleness, selfcontrol, love, peace, goodness x5), bigcast 64x64 x6, freed
64x64 x8, hit 32x32 x4, shield 48x64 x4, levelup 64x64 x6. `fx.js` plays them with CSS
`steps()` (`sheetFX`, `sheetHTML`) on a fixed `#fxtop` layer so a render() mid-effect
doesn't cut them off. Armor and the three locked fruit borrow the Patience star.

## Art still wanted

- Impact effects for Joy, Kindness, Faithfulness (32x32 x6) once those fruit unlock.
- The town (style A, front-facing), the caves' tiles and objects, the townsfolk with walk cycles, the hero's
  side walk, portraits and battle backdrops are all PixelLab art now (2026-11).

## Conventions

- The interface look is a leather journal (Luke picked it from ten options, 2026-11): stitched dark leather for the
  frame of the game (status bar, dialogue, bottom bar, tabs, fight log), lined paper pages with a red margin rule for
  what you read, stitched leather tabs for buttons (green = the main action, grey = can't). Tokens (`--lth`, `--page`,
  `--stitch`, `--btn`, `--go`, `--off`, `--rubric`) and the type scale are at the top of the `UI pass` block in styles.css.
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
4. Done (UI pass, 2026-11): recall popup, after-fight panel, one family of frames/buttons/popups (the `UI pass`
   block in `styles.css`). `node tests/ui_shots.mjs [dir]` (after a build) screenshots every interface screen at 430px.
5. Design Mission 2 (Hatred / Love) and Ephesus.
6. Optional: backend saves so progress follows Luke between phone and laptop.
