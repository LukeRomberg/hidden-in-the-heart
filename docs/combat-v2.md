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
| Keeping score | Grudge | bitterness: 2 damage every turn, stacking, until you say a Love or Peace verse |
| Twisting your words | Slanderer | your next verse does half unless it's perfect |
| Doubt | Grudge, Slanderer | lose 2 focus |
| Heat (body) | Furnace | 1 damage a turn that grows by 1 each turn, cleared by a Gentleness verse |
| Haymaker (body) | Brawler | a big hit every third turn; his windup is the tell (no box, his body shows it) |

That gives shields, heals and cleanses a job, and makes the order you say things in matter.

**Decided (Luke): mind attacks drain focus, and a shield can block them.** Lies cost you your focus, not your
health, so a mind-heavy sin (the Grudge, the Slanderer) starves you of verses while a body-heavy one (the Brawler,
the Furnace) wears your HP down. Shielding (Psalm 37:8, the lid, the Shield of Faith) soaks mind attacks before
they reach your focus. To keep a drained player from stalling: at 0 focus a mind attack spills into HP instead,
and Romans 12:2 (restore focus) matters far more than it does today.

## 3. Gear defends one side

The Armor of God already splits this way in Ephesians 6. Draft:

| Slot | Plain (bought) | Armor of God (consecrated) |
|---|---|---|
| Waist | Leather Belt: mind −1 | Belt of Truth: mind −3; lies can't twist your words |
| Chest | Canvas Vest: body −1, +6 HP | Breastplate of Righteousness: body −3, +6 HP |
| Feet | Work Boots: heal 4 after a fight | Shoes of Peace: heal 4 after a fight; heat and bitterness tick 1 less |
| Off hand | Trash-Can Lid: body −1 the first 2 turns | Shield of Faith: the first mind move each fight is blocked; can't be provoked |
| Head | Ball Cap: crosses off a wrong choice | Helmet of Salvation: mind −2; crosses off a wrong choice; once a cave you hold at 1 HP |
| Hand | Pocket Bible: +1 damage | Sword of the Spirit: +3 damage; by-heart verses +25% |

(“mind −1” = every mind move does 1 less.) Then the Brawler cave asks for the vest and the Breastplate, the
Slanderer cave for the Belt of Truth and the Helmet. You can't afford everything at once, so you choose.

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

Today every verse you know comes into every fight, so you're never caught without the right answer. Pokémon makes
you pick a party. Proposal: **you carry five verses into a cave** (packed at the church or at the cave mouth).
To repack, leave: the cave keeps your progress (built 2026-11-16; campfires are gone). Romans 12:2 takes a slot like any other, so with mind attacks draining
focus, "bring the verse that restores focus, or one more weapon?" is a real choice.

Why I think it's worth it: it makes matchups bite (you prepare for the Slanderer, not for everything); it makes
the Scriptorium and the Inn's rumors matter; and for memorization it's a plus: a cave becomes focused practice
on five verses, while the Training Yard keeps the rest from slipping. The risk is a player who
packs badly and is stuck for a whole cave; leaving to repack without losing progress covers that. Four is tight with Romans taking a slot; six barely bites. Five is my pick.

## 6. The Armor of God across the whole game (Luke, 2026-11-16)

Today you can consecrate all six pieces in Philadelphia, from the gear screen anywhere, and they barely matter.
New shape:

- **One piece per chapter, earned by freeing that town.** After the chapter's last held townsperson is free,
  Amos consecrates the piece **at the church**, as you recite Ephesians 6 up to that piece (6:14 for the first,
  6:14–17 for the last), so the passage grows with the game. Nowhere else: no consecrating from the gear screen
  or the Forge.
- **Order follows Ephesians and the towns:**

  | Chapter | Town | Piece | Defends |
  |---|---|---|---|
  | 1 | Philadelphia (kept His word) | Belt of Truth | mind: lies can't twist your words |
  | 2 | Ephesus | Breastplate of Righteousness | body |
  | 3 | Sardis | Shoes of the Gospel of Peace | lingering harm (heat, bitterness) |
  | 4 | Smyrna | Shield of Faith | mind: blocks lies before they drain focus |
  | 5 | Thyatira | Helmet of Salvation | mind, and once a cave you hold at 1 HP |
  | 6 | Pergamum | Sword of the Spirit | your verses cut deeper |
  | 7 | Laodicea | (the full armor, for the last chapter) | |

- **Each piece is a big deal**, the strongest thing in its slot, so earning one changes how you fight.
- **The Forge sells lesser gear** in every slot, the thing you shop for between caves. Later (not now): two or more
  options per slot (a leather cap for mind, a padded hood for body), each with a perk rolled from a small pool when
  you buy it, so gear is worth checking every visit.
- The lid and Bible (Amos) and the boots (Bram) stay as starting gear.

## Decisions for Luke

1. The matchup table: which truths answer which sin (and which they resist).
2. ~~One HP bar or mind attacks drain focus~~ decided: focus, and shields block them.
3. Whether Galatians 5:22–23 counts as every fruit.
4. New verses for Gentleness and Goodness at the Scriptorium (I'd pull candidates from the BSB for you to pick).
5. The satchel: five verses into a cave, repacked in town?
6. The armor order by town (the table in section 6), and that Philadelphia gives the Belt of Truth.
