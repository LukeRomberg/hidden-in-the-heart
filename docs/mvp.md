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
   Ashby opens. To be continued."
8. **Full playtest.** A scripted player runs the whole chapter at 60/70/85% accuracy to catch
   dead ends and balance problems. Then Luke plays it on his phone.

Every new section gets a jump in test mode (`?test`, `src/js/dev.js`).

## After the MVP (future iterations, roughly in order)

- Book-order locks on doors (`docs/encounters.md`)
- Real map art: a cave tileset and a walking hero (about 6 PixelLab generations)
- The town as classroom: the Scriptorium shelf of every book, and Amos's sermon before each cave
- The Codex keeps what you've learned, readable at the campfire
- Campfire questions, and sorting the fruit of the Spirit
- Perks for the six fruit still undesigned
- Mission 2: Hatred and Love, in Ashby
- Backend saves
