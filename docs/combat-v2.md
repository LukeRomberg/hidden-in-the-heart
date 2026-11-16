# Combat v2: matchups and two kinds of attack

Draft for Luke, 2026-11-16. Nothing here is built yet. The problem: at the accuracy the game is built for
(80–90%, since verses step down to what you know), fights are a stroll, the bot wins by always picking the
biggest number, and gear barely matters. The fix, Pokémon's: **accuracy gets you to the table; choices win the
fight.** Two pieces, which work together:

1. **Matchups.** Every sin has truths it can't stand against and truths it shrugs off. Saying the wrong verse
   perfectly is a weak turn.
2. **Body and mind.** Every enemy attack is either a blow (body) or a lie (mind). Gear defends one or the other.
   Walk into the Slanderer dressed for the Brawler and you're in trouble.

## 1. Matchups

Each verse already has a fruit (Patience, Gentleness, Self-control, Peace, Love, Goodness). Each held sin gets
a profile:

- **Weak to** a fruit: ×1.5, and the log says it ("It lands deep. Something gives.").
- **Resists** a fruit: ×0.5 ("It glances off. He's heard that one before.").
- Everything else ×1.

The first time you hit a weakness or a resistance, it's said aloud in the fight; after that it's written in the
Codex under that sin ("What answers what"), so you learn matchups by playing, like types. Amos's notes and the
Inn's rumors hint at the next cave's sin beforehand, so you can prepare (buy the right verse at the
Scriptorium, wear the right gear).

**Draft profiles (Luke: which truth answers which sin is your call):**

| Sin (who) | How it fights | Weak to | Resists | Why (draft) |
|---|---|---|---|---|
| The Furnace (Bram), rage | mostly body: fists, sparks, heat | Gentleness, Patience | Self-control | Proverbs 15:1, a gentle answer; rage isn't argued down by willpower |
| Villagers, anger | mixed, light | Patience, Gentleness | none | as today |
| The Grudge (Wendell), bitterness | mostly mind: keeps score, reads out your failures | Love, Peace | Patience | Romans 12:19, leave vengeance; he can out-wait you |
| The Brawler (Hale), violence | body, heavy, armored | Self-control, Gentleness | Peace | Proverbs 16:32, ruling your spirit; calm words bounce off fists |
| The Slanderer (Silas), lies | mind: twists your words, whispers | Goodness, Self-control | Gentleness | Colossians 3:8, put away slander; soft words get twisted |

Your verses today, by fruit: Patience 5 (Proverbs 14:29, 16:32, 19:11, James 1:19, Galatians 5:22–23),
Self-control 3 (Ephesians 4:26, Ecclesiastes 7:9, Galatians 5:16), Peace 3 (Psalm 37:8 shield, Philippians 4:7
heal, Romans 12:2 focus), Love 2 (Romans 12:19, John 11:35), Gentleness 1 (Proverbs 15:1), Goodness 1
(Colossians 3:8). Gentleness and Goodness would need a verse or two more at the Scriptorium so every weakness
can be answered. Galatians 5:22–23 names every fruit, so it could count as whichever is best ("the whole fruit"),
which makes it the reliable all-rounder.

## 2. Body and mind

Every enemy move is one of two kinds, shown by how it lands (a hit flash vs a dark ripple, and the log line):

- **Body (blows):** fists, rocks, sparks, shoves. Lowers HP. Reduced by body defense.
- **Mind (lies):** accusations, taunts, whispers. Lowers HP and often bends your next turn (see below).
  Reduced by mind defense.

Mind moves with a twist (the sins' signature moves):

| Move | Who | What it does |
|---|---|---|
| Provoke (today's) | Furnace, Brawler, Slanderer | your verses cost 1 more next turn |
| Keeping score | Grudge | bitterness: 10% of your max HP each round (after they act), until you say a Love or Peace verse |
| Twisting your words | Slanderer | your next verse does half unless it's perfect |
| Doubt | Grudge, Slanderer | lose 2 focus |
| Heat (body) | Furnace | 10% of your max HP each round (after they act), cleared by a Gentleness verse |
| Haymaker (body) | Brawler | a big hit every third turn; his windup is the tell (no box, his body shows it) |

That gives shields, heals and cleanses a job, and makes the order you say things in matter.

**Damage scale (Luke, 2026-11-16):** today you have around 58 HP and a lingering effect would tick for 1, which
you'd never notice. Lingering harm (heat, bitterness, anything that ticks) does **10% of your max HP once per round**:
you act, they act, then it ticks. It scales as you level and always matters. Enemy hits get heavier too, or your base HP comes down
(whichever tunes better against the targets in section 4): a normal hit should take roughly a tenth to a sixth of
your health, a big one a quarter or more.

**Decided (Luke): mind attacks drain focus, and a shield can block them.** Lies cost you your focus, not your
health, so a mind-heavy sin (the Grudge, the Slanderer) starves you of verses while a body-heavy one (the Brawler,
the Furnace) wears your HP down. A shield verse (Psalm 37:8) and the Shield of Faith soak mind attacks before
they reach your focus; the lid doesn't. To keep a drained player from stalling: at 0 focus a mind attack spills into HP instead,
and Romans 12:2 (restore focus) matters far more than it does today.

## 3. Gear (Luke, 2026-11-16)

**Basic gear stays as it is** (the Trash-Can Lid and the Pocket Bible from Amos, Bram's Work Boots, and the Leather
Belt, Canvas Vest and Ball Cap from the Forge), with the same perks. **The final goal is the Armor of God** (section
6). **The core unlocks of the game are the fruit tree and new verses**, not gear: no rolled perks, no long list
of shop items. Basic gear keeps its perks exactly; the lid does not block mind attacks.

## 4. Tuning targets (Luke, 2026-11-16)

High accuracy is the normal case, since verses step down to what you know; 80% is the floor. Two bots: **naive**
says the biggest number every turn; **smart** plays the matchups, shields before big hits, cleanses bitterness and
heat, keeps Romans 12:2 for when focus runs low. Each also runs **straight through** (never leaves a cave) and
**leaving to heal** (goes back to town when low, then returns; progress is kept).

| Accuracy | Target |
|---|---|
| 100% | wins, though not every time: a naive run can still lose a cave |
| 90%, smart | wins, barely: close calls, low HP at the bosses |
| 80%, straight through | dies in the second cave (the Old Quarry) |
| 80%, leaving to heal | can get through, slowly, if it plays smart and buys the right gear |

`npm run playtest` reports all of these; balance isn't done until every row holds.

## 5. A satchel: the verses you carry into a cave

**Built 2026-11-16** (`src/js/satchel.js`): five verses, packed at the cave mouth or from the church; each cave
remembers its last satchel; fewer than six known, you carry them all. Amos's first-time popup is a draft
(`TEXT.dive.satchel.tip`).

Today every verse you know comes into every fight, so you're never caught without the right answer. Pokémon makes
you pick a party. Proposal: **you carry five verses into a cave** (packed at the church or at the cave mouth).
To repack, leave: the cave keeps your progress (built 2026-11-16; campfires are gone). Romans 12:2 takes a slot like any other, so with mind attacks draining
focus, "bring the verse that restores focus, or one more weapon?" is a real choice.

Why I think it's worth it: it makes matchups bite (you prepare for the Slanderer, not for everything); it makes
the Scriptorium and the Inn's rumors matter; and for memorization it's a plus: a cave becomes focused practice
on five verses, while the Training Yard keeps the rest from slipping. The risk is a player who
packs badly and is stuck for a whole cave; leaving to repack without losing progress covers that. Four is tight with Romans taking a slot; six barely bites. Five is my pick.

## 6. The Armor of God across the whole game (Luke, 2026-11-16)

Each town has a signature trouble you suffer through. Freeing the town earns the piece that makes that trouble a
non-issue from then on, like a badge that is also a cure. Each new town brings a new trouble, so the challenge
moves on instead of vanishing. Pieces are matched to towns by what each church's letter in Revelation is about,
not by Ephesians order.

| Town (sin) | What you suffer there | Piece you earn | From then on | Tie-in (check against the BSB) |
|---|---|---|---|---|
| Philadelphia (wrath) | provoked into costly verses; heat and bitterness that stack | Shoes of the Gospel of Peace | can't be provoked; heat and bitterness wear off after one turn | the open door (Rev 3:8); feet ready with the gospel of peace (Eph 6:15) |
| Ephesus (hatred) | cold, heavy blows that chill your heart and freeze a verse | Breastplate of Righteousness | body blows halved; your verses can't be frozen | first love abandoned; do the works you did at first (Rev 2:4–5) |
| Sardis (envy) | comparison and doubt that drain your focus | Helmet of Salvation | mind attacks drain half; once a cave you hold at 1 HP | a reputation for being alive, but dead (Rev 3:1) |
| Smyrna (rivalry) | rivals who gang up and hit twice | Shield of Faith | the first two attacks each fight are blocked; combos broken | be faithful even unto death (Rev 2:10) |
| Thyatira (impurity, false teaching) | lies that twist your words and hide what a sin is weak to | Belt of Truth | your words can't be twisted; you see every enemy's weakness | the false teaching of Jezebel (Rev 2:20) |
| Pergamum (idolatry) | sins that resist almost everything | Sword of the Spirit | your verses ignore resistance; by-heart verses +50% | the sharp double-edged sword (Rev 2:12) |
| Laodicea (drunkenness) | the last chapter, in the full armor | | | |

- **Earned at the church only.** After the town's last held person is free, Amos consecrates the piece as you
  recite that piece's verse from Ephesians 6. The last chapter asks for the whole passage, Ephesians 6:10–18.
  No consecrating at the Forge or from the gear screen: the Forge's consecration chain goes away.
- **Each piece is the strongest thing in its slot** and replaces the basic piece there (the Shoes replace the Work
  Boots, and so on).
- Philadelphia's piece is the Shoes of Peace: the chapter ending is where Amos consecrates them.

## Decisions for Luke

1. The matchup table: which truths answer which sin (and which they resist).
2. ~~One HP bar or mind attacks drain focus~~ decided: focus, and shields block them.
3. Whether Galatians 5:22–23 counts as every fruit.
4. New verses for Gentleness and Goodness at the Scriptorium (I'd pull candidates from the BSB for you to pick).
5. The satchel: five verses into a cave, repacked in town?
6. ~~The armor order~~ decided: one piece per town by its letter's theme; Philadelphia gives the Shoes of Peace.
