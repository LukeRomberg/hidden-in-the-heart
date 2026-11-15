# Walk everywhere: scope

Luke, 2026-11-15, after a full play-through: the cave map (tap to walk) is the best part, so make it
the whole game. Drop the town menu; Philadelphia becomes a place you walk around. Alongside it:
encounters on the battle screen, more townsfolk, and a popup whenever you earn something.

## The four pieces

### 1. A walkable Philadelphia (the big one)

The cave engine (`dive.js`: tile maps, tap-to-walk BFS, fog, markers) already does most of this. Work:

- **Pull the map engine out of dive.js** into its own file so caves and town share it: tiles, walking,
  camera, drawing. Caves keep fog; the town is lit.
- **A town map**, hand-drawn in ASCII like the caves: the square with the well in the middle, the
  church, Forge, Inn, Training Yard, Scriptorium around it, the road east, the three cave mouths at
  the edges (or off the road).
- **People on the map.** Amos outside the church, Bram burning by the well until he's freed,
  townsfolk who come home as you clear caves, each shopkeeper by their door. Walk into someone to talk
  (dialogue as a popup over the map).
- **Doors.** Walk into a building's door to go in. Boarded doors say so. Inside, the current shop
  screens stay as they are (see the questions).
- **The opening on the map.** After the bedroom, you wake in the square. Bram is shouting by the
  well; you walk to the church, Amos gives you the lid, and you walk back out to the well for the
  fight. The tour becomes Amos walking beside you, stopping at each door.
- **Where you are is saved** (`P.town = {pos, face}`), so a reload puts you back on the map.
- The Town tab goes away (the map is the town); Gear, Tree, Deck and Codex stay as tabs/buttons.
- Smoke test and playtest bot learn to walk the town; test mode gets "Town map" jumps.

Rough size: the biggest change since the cave map. Several days of work in steps that each keep the
game playable: engine split → town map with doors → people → the opening → the tour.

### 2. Encounters on the battle screen

The truth villager and the hurt person move from the panel under the map into the arena, so every
encounter looks the same as a fight:

- **Truth villager:** they stand in the arena (held tint); the question is a popup or the box under
  the arena; True / False sit where the cards go. Right: the freed beat plays like a fight win.
  Wrong: the fight starts right there.
- **Someone hurt:** they're on the ground in the arena, hurt (see the art below). Help / Walk on in
  the dock; helping shows them on their feet.
- **Amos** appears in the arena for the first of each, beside you.
- More of the talking moves to popups, as you asked (scraps, Amos's lines, shop greetings).

Size: about a day once the character art exists.

### 3. Townsfolk: 5 men, 5 women

- Ten people in the house style, used everywhere: on the town map, as held villagers in fights,
  in the hurt encounters, and freed.
- **One PixelLab character each, front-facing low top-down**, which works as the battle sprite and
  gives four walking directions for the map. One set serves both.
- **States drawn by us, not generated:** held = the red tint we already use; hurt and badly hurt =
  bandage, bruise and torn-sleeve overlays drawn with the free pixel tools. Generating each state
  costs 10 generations per character (600 for all of them), so code is the way.
- Names already exist (`TEXT.villagers`); each name gets a fixed look.

### 4. A popup for everything you earn

One shared "You got…" popup, with OK (and Equip where it applies):

- **Buying gear:** the item's icon, your hero before and after wearing it, and what it does.
  Same for consecrating, with the Armor of God piece.
- Souls and leveling up (the level-up popup already exists; souls and talents get a small one).
- A new verse (Scriptorium, drops), a Creed piece from a chest, a sermon scrap, talents from a drill.
- Shown one at a time when several land together (after a fight).

Size: half a day to a day, code only, no art needed. Can start right away.

## Art to gather (PixelLab)

| What | Tool | Generations |
|---|---|---|
| 10 townsfolk, low top-down, 4 directions | create_character (v3) | ~20 |
| Hero as a PixelLab character from our hero art, then a 4-direction walk | create_character + animate_character | ~6 |
| Town ground: grass/cobblestone, grass/dirt road | create_topdown_tileset | ~2–3 |
| Town buildings, top-down, boarded and open (church, Forge, Inn, Yard, Scriptorium) | create_map_object, or a building kit | ~10–25 |
| Town props: well, fences, benches, barrels, trees, lamp posts | create_map_object | ~6–8 |
| Cave ground: rock/floor per cave (the art that was already waiting on your OK) | create_topdown_tileset | ~3 |
| Cave objects: doors, gate, lever, chest, campfire | create_map_object | ~7 |
| **Total** | | **~55–75** |

The account is on the free daily allowance: 20 a day (10 left today), so that's about 3–4 days free.
An extra $1–2 does it in one go: PixelLab quotes typical small generations at under a cent each, so
$2 should cover all of it with room for retries. Hurt states, held tint and the first round of fixes
cost nothing (drawn in code).

## Order

1. **Reward popups** (code only, starts now).
2. **Art, generated over a few days** (or at once with $1–2): townsfolk first, then the town kit,
   then the cave kit and hero walk.
3. **Walkable town**, in the steps above; the code-drawn placeholders work until the art lands, the
   same way the caves did.
4. **Encounters on the battle screen**, once the townsfolk exist.

## Questions for Luke

- **Inside buildings:** keep today's shop screens when you walk in (recommended; fast, already
  tuned), or make the interiors walkable too (each one a small map with the shopkeeper)?
- **Cave mouths:** on the edges of the town map, or out along the road on the world map?
- **The world map** (Ephesus, Sardis, Smyrna): keep it as the screen at the end of the road, or make
  it walkable later?
- **PixelLab:** free over a few days, or add $1–2 and do it all at once?
