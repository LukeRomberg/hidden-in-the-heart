# Cave encounters: plan

Agreed with Luke, 2026-11-13. These build on the walking fog-of-war cave map (branch
`cave-map`). Verse text below is pulled from the BSB (`tools/bsb.mjs`); recheck with
`npm run verify` once it lands in `src/`.

## Teaching before testing

Every encounter is pass/fail. Nothing is tested before it has been taught.

1. **Amos walks you through the first of each.** The first true/false villager, the first
   book lock, the first “living it out” moment: Amos is there, says the first answer out
   loud and lets you do the second. The first one can’t be failed.
2. **The cave teaches before it tests.** Before a lock or a villager, the map places a
   teaching tile you walk past: a fallen shelf with the books in order on their spines, a
   scrap of sermon on the wall with the verse that answers the lie. Found by exploring.
4. **Wrong answers teach, then come back.** A miss shows the right answer and why, and
   that item returns later in the same cave or the next (a retry pool in the save, like
   spell slips).

Roadmap, not built yet:

3. **Town is where you learn.** Amos walks the hero through it before the first cave, with a
   line about being equipped before you go out so you aren’t overcome (Ephesians 6:11
   territory; pull the text from the BSB). The Scriptorium shelf shows every book of the
   Bible in order and by section; Amos gives a short sermon before each cave covering the
   truths found in it.
5. **The Codex keeps what you’ve learned** (truths, book lists, later the timeline) and
   can be read at a campfire before going deeper.

## True/false room: “the truth will set you free”

A held villager asks “Is it true that …?” You answer True or False.

- **Right:** they’re freed on the spot, and the verse is shown.
- **Wrong:** the lie closes over them and they become a held villager you fight to free. The
  verse is still shown after, and the item joins the retry pool.

Approved pool (Luke, as-is). Six false and four true, so sounding churchy doesn’t give
the answer away.

| # | Question | Answer | Note | Verse (BSB) |
|---|---|---|---|---|
| 1 | “Is it true that God helps those who help themselves?” | False | Benjamin Franklin. | Romans 5:6 — “For at just the right time, while we were still powerless, Christ died for the ungodly.” |
| 2 | “Is it true that you shouldn’t get mad, you should get even?” | False | | Romans 12:19 — “Do not avenge yourselves, beloved, but leave room for God’s wrath. For it is written: ‘Vengeance is Mine; I will repay, says the Lord.’” |
| 3 | “Is it true that God won’t give you more than you can handle?” | False | Borrowed from 1 Corinthians 10:13, which is about temptation. | 2 Corinthians 1:8–9 — “…We were under a burden far beyond our ability to endure, so that we despaired even of life. Indeed, we felt we were under the sentence of death, in order that we would not trust in ourselves, but in God, who raises the dead.” |
| 4 | “Is it true that if you’re a good enough person, you’ll get into heaven?” | False | | Ephesians 2:8–9 — “For it is by grace you have been saved through faith, and this not from yourselves; it is the gift of God, not by works, so that no one can boast.” |
| 5 | “Is it true that money is the root of all evil?” | False | Close: it’s the love of money. | 1 Timothy 6:10 — “For the love of money is the root of all kinds of evil.” |
| 6 | “Is it true that you should always follow your heart?” | False | | Jeremiah 17:9 — “The heart is deceitful above all things and beyond cure. Who can understand it?” |
| 7 | “Is it true that you shouldn’t let the sun set on your anger?” | True | | Ephesians 4:26 — “‘Be angry, yet do not sin.’ Do not let the sun set upon your anger,” |
| 8 | “Is it true that pride goes before destruction?” | True | | Proverbs 16:18 — “Pride goes before destruction, and a haughty spirit before a fall.” |
| 9 | “Is it true that a gentle answer turns away wrath?” | True | | Proverbs 15:1 — “A gentle answer turns away wrath, but a harsh word stirs up anger.” |
| 10 | “Is it true that love keeps no account of wrongs?” | True | The Hollow (Wendell’s cave). | 1 Corinthians 13:5 — “…it is not easily angered, it keeps no account of wrongs.” |

Sample result lines (draft): right, “He lets out a breath. ‘Then I don’t have to carry
it.’”; wrong, “His eyes go flat. ‘I knew it.’ The lie closes over him.” Each villager gets
their own pair in their voice.

## Book-order lock

Guards doors (shortcuts, side rooms). Chests keep the Creed. Put the books in order;
pass/fail.

| Cave | Books | Mistakes allowed |
|---|---|---|
| The Hollow | Genesis, Exodus, Leviticus, Numbers, Deuteronomy (the Law) | 2 |
| The Old Quarry | Matthew, Mark, Luke, John, Acts | 1 |
| The Deep Cave | Romans, 1 Corinthians, 2 Corinthians, Galatians, Ephesians, Philippians | 0 |

Later chapters: History, Wisdom, the Prophets, the general letters; then mixed locks where
books are sorted into sections and ordered.

## Living it out

Talk the talk and walk the walk; no quiz.

- **Someone hurt:** help them (costs HP or a rest) or walk on. Helping pays off later.
- **Campfire questions** (later chapters): a traveler asks something hard; reward listening
  before preaching (James 1:19). No single right answer.
- **Sorting the fruit:** sort Galatians 5 into works of the flesh and fruit of the Spirit.

## Cave stories (narration on the map)

- **The Hollow:** pages of Wendell’s list scattered through the cave, pettier the deeper you go.
- **The Old Quarry:** Hale’s fist marks and broken training dummies; one with his own face.
- **The Deep Cave:** Silas’s lies about freed townsfolk nailed to the walls; read one, then
  refute it to tear it down.

## Guardrails

- Quizzes stay on ground Christians broadly share (roughly the Nicene Creed): nothing that
  takes sides on baptism, predestination or the end times.
- Never write verse text from memory; pull it from the BSB.
