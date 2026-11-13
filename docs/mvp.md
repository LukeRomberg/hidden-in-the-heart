# MVP: Emberford, start to finish

Agreed with Luke, 2026-11-13. The MVP is the Emberford chapter playable from the title screen
to a chapter ending, with a loop worth repeating: **learn in town, explore a cave, face what is
down there, come back stronger, go deeper.** Ship it, play it, then iterate.

## In the MVP

1. **Merge battle feel and the cave map.** Branches `claude/battle-feel-907678` and
   `claude/cave-map-91c68a` (fog-of-war tile maps, tap to walk, verse door, levers and
   gates, boss door).
2. **Amos's town tour.** Plays once, after the Furnace. He shows what each building is for,
   with his line about being equipped before you go out so you aren't overcome, and tells
   you to explore the whole cave before the last fight.
3. **Clue tiles.** Two or three per cave. Finding them makes the true/false questions and
   the boss easier. They're optional: you can go straight through, but you go in blind.
4. **True/false villager** ("the truth will set you free"). Uses the 10 truths in
   `docs/encounters.md`. Amos is with you for the first one. A wrong answer means the lie
   wins: you fight them, and the question comes back later.
5. **Living it out.** Someone hurt in the cave: help them (costs HP or a rest) or walk on.
   Helping pays off later. Amos is with you for the first one. Talk the talk and walk the walk.
6. **Shops worth visiting.** Every building shows what it sells, what each thing does, and
   what you can't afford yet. Economy tuned to about one meaningful buy per cave.
   - Forge: the full gear lineup, and consecration into the Armor of God
   - Scriptorium: new verses
   - Training Yard: drill verses
   - Inn: rest, plus a rumor about the next cave
7. **Chapter ending.** After the third cave: a closing scene, chapter stats, and "The road to
   Ephesus opens. To be continued."
8. **Full playtest.** A scripted player runs the whole chapter at 60/70/85% accuracy to catch
   dead ends and balance problems. Then Luke plays it on his phone.

Every new section gets a jump in test mode (`?test`, `src/js/dev.js`).

## Economy

Talents for one clean pass through Philadelphia (no deaths, no Gentleness perk, every chest
opened, every truth answered right). Each freed villager or cave boss pays 5.

| Source | Talents | Running total |
|---|---|---|
| The Furnace (tutorial, first clear) | 30 | 30 |
| The Hollow: 2 villagers + the Grudge 15, tier-1 chest 10, first clear 20 | 45 | 75 |
| The Old Quarry: 4 villagers + the Brawler 25, tier-1 + tier-2 chests 25, first clear 20 | 70 | 145 |
| The Deep Cave: 4 villagers + the Slanderer 25, two tier-2 chests 30, first clear 20 | 75 | 220 |
| Training Yard drills: 2 per verse, once per verse per cave cleared (opens after the Quarry) | ~25 | ~245 |

Extra, not counted: +5 per wrong truth answer (it turns into a fight), Gentleness 2 doubles
fight pay, cleared caves can be run again. Losses: a defeat costs 25%, a pew rest 5.

| Shop | Price | Opens |
|---|---|---|
| Forge, plain gear: Leather Belt / Canvas Vest / Ball Cap | 25 / 35 / 45 | after the Furnace |
| Forge, consecration: Truth / Breastplate / Shoes / Faith / Helmet / Sword | 10 / 15 / 25 / 35 / 45 / 60 | after the Furnace |
| Scriptorium, a verse by its focus cost 0 / 1 / 2 / 3 | 5 / 20 / 35 / 50 | after the Deep Cave |
| Inn: eat and sleep | free | after the Hollow |
| Training Yard: a clean drill pays | +2 | after the Quarry |

A sample run, one meaningful buy per trip into town:

| In town with | Buys | Left |
|---|---|---|
| 30, before the Hollow | Leather Belt 25 | 5 |
| 50, before the Quarry | Canvas Vest 35 + Belt of Truth 10 | 5 |
| 75 + drills, before the Deep Cave | Ball Cap 45 + Breastplate 15 | ~25 |
| ~100 + drills, chapter end | Shoes 25 + Shield of Faith 35 + one 2-focus verse 35 | ~10 |

Still out of reach at the end: the Helmet of Salvation (45) and the Sword of the Spirit (60),
plus most of Silas's shelf. Consecration also needs Ephesians 6 recited perfectly, so a
player who hasn't memorized 6:14-17 is held back by that before money.

Plain gear no longer drops after fights (`gearDrop()` in gear.js returns null). It used to drop
on half of all fights and every cave boss, which emptied the Forge by the second cave.

## Balance

Targets (Luke): a 50% or 60% player fails the chapter, a 70% player gets through on low
health, an 85% player is fairly comfortable. Measured with `npm run playtest`
(`tests/playtest.mjs`): a bot plays the whole chapter at a given recall accuracy, once never
buying anything (frugal) and once buying gear every trip into town (shopper). It reports the
lowest HP in every fight, close calls (below 25%), and defeats; 3 defeats in one cave means
the run failed.

| Accuracy | Frugal | Shopper | Target |
|---|---|---|---|
| 50% | fails in the Hollow | fails in the Hollow | fail ✓ |
| 60% | fails in the Old Quarry | fails in the Old Quarry | fail ✓ |
| 70% | fails in the Old Quarry | clears, 2 defeats, 19% close calls | low health ✓ (gear decides it) |
| 85% | clears, no defeats, worst HP 60% | clears, no defeats, worst HP 40% | fairly comfortable ✓ |
| 95% | clears, worst HP 79% | clears, worst HP 90% | (reference: easy) |

What set it (2026-11): enemies have about 40% more HP and hit 1–2 harder than before (`ENEMIES`
in combat.js), and a cast below `STEADY_DMG` (65%) hits for half its accuracy; perfect is full,
65%+ is its accuracy. The 75% `SLIP_BELOW` line for dropping a spell's tier is unchanged.
Before this, a 50% player cleared everything without dropping below 65% HP.

## After the MVP (future iterations, roughly in order)

- Book-order locks on doors (`docs/encounters.md`)
- Real map art: a cave tileset and a walking hero (about 6 PixelLab generations)
- The town as classroom: the Scriptorium shelf of every book, and Amos's sermon before each cave
- The Codex keeps what you've learned, readable at the campfire
- Campfire questions, and sorting the fruit of the Spirit
- Perks for the six fruit still undesigned
- Mission 2: Hatred and Love, in Ephesus (the church that lost its first love)
- Backend saves
