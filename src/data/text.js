/* Every line of story, dialogue and flavor text in the game, grouped by scene in roughly the
   order a player meets it. Edit freely; nothing else needs to change.

   - A conversation is a list of [speaker, line]. Speaker null is narration. Speaker ids are
     listed in `speakers` (that's also where their display names live).
   - {name}-style placeholders are filled in by the game. Keep them, move them around freely.
   - Use curly quotes and apostrophes: “ ” ‘ ’, and … for an ellipsis.
   - Scripture is NOT here. Verse text lives in scripture.js and is checked against the BSB.
     A quotation followed by its reference (like Ephesians 6:12 in mission1.intro) is also
     checked by `npm run verify`, so quote it exactly or not at all.
   - Short UI labels (Back, End turn, Talents, Gear…) are still in the code.

   When characters talk about the Bible, use the names it gives itself: Scripture, the word of
   God, truth, wisdom, His law, His commands, the sword of the Spirit. Not “the words.”

   Voices (so every character sounds like themselves):
   - Narration: plain and sincere, moves the story step by step. Senses over cleverness.
   - You: an ordinary guy in over his head. Modern, short, honest, uses contractions, asks the
     practical question. Kind. Not a wisecracker.
   - Amos: a gentle, grandfatherly pastor. Unhurried, a little formal, few contractions. Calls you
     “son” or “young man.” Speaks of the Lord plainly. Chuckles quietly. Sees the town’s trouble
     as people pulling away from each other.
   - Bram (blacksmith): gruff and clipped. Drops words. Talks in heat, iron and hammers.
     Grudging warmth; would rather do something for you than say something nice.
   - Wendell (innkeeper): chatty and warm, a little exclamatory. Thinks in ledgers and accounts,
     because he kept a list of grudges for twelve years. Feeds everyone.
   - Hale (drill master): barks. Short imperatives, calls you “recruit.” Tough, fair, and quietly
     proud of you.
   - Silas (scribe): careful and exact. Full sentences, measured, slightly formal. Ashamed of the
     lies he wrote and determined to copy only true things now. */
const TEXT = {
  speakers: {
    priest: 'Amos',
    oldPriest: 'Old priest',   // Amos, before he introduces himself
    you: 'You',
    blacksmith: 'Bram',
    innkeeper: 'Wendell',
    drill: 'Hale',
    scribe: 'Silas',
  },

  // ---------- Prologue ----------
  prologue: {
    bedroom: {
      lines: [
        [null, '2:14 a.m. A desk lamp, a stack of flashcards, and your Bible, open to the same page it has been open to for three hours.'],
        [null, 'Psalm 119:11. Fifteen words. You have read them dozens of times and they still are not memorized.'],
        ['you', '“I have hidden… Your… something. In my heart. Why is this so hard?”'],
        [null, 'The lamp hums. The page swims. One more try, and then bed.'],
      ],
      recallTitle: 'One more try',
      button: 'One more try',
    },
    square: {
      // first line depends on how the Psalm 119:11 recall went
      firstRight: 'Every word. You are so pleased with yourself that you rest your head on the open page. Just for a second.',
      firstMissed: 'About half. Your head drifts down onto the open page. Just for a second.',
      lines: [
        [null, 'You begin to wake to the sound of crickets chirping. Your cheek is cold. As you begin to pick yourself up you realize you were laying on a stone street in a place you have never been before.'],
        [null, 'Adrenaline shocks your body awake and you begin to search around frantically. You are surrounded by vacant buildings. Every door is barred. Every window is dark. The only light comes from a man by the well.'],
        [null, 'He is shouting and pacing around. Fire dances over his skin and clothes but they do not burn, red smoke rolls off his shoulders like heat off a summer road. Nobody else is out to see it.'],
      ],
      button: 'Try to find someone else to talk to',
    },
    church: {
      lines: [
        [null, 'You walk for a bit and see an old church, the door is unlocked. Inside you are greeted with dusty pews, a cold altar, and an old man sweeping a floor nobody walks on anymore.'],
        ['oldPriest', 'He looks up at you, surprised. “Oh, hello. What brings you in, young man?”'],
        ['you', 'You point towards the door. “I am not sure where I am and there is a strange man yelling out there.”'],
        ['oldPriest', '“That is Bram, by the well.” He gives you a sad look. “He used to be a kind man, showed up every Sunday for service.”'],
        ['oldPriest', '“The town started skipping morning service and distancing themselves from one another, then they started to change. Anger first. Then the grudges. Then worse. In isolation there is no one to pull them out of the darkness.”'],
        [null, 'He looks at the Bible still in your hand.'],
      ],
      button: 'Hold it up',
    },
    lid: {
      lines: [
        ['priest', '“Well. Look at that.” He leans the broom on a pew and chuckles to himself quietly. “I’m Amos. It seems that the Lord has answered my prayers. You are here to help.”'],
        ['priest','“You will need to battle in order to free the oppressed, but I am afraid this is all I can offer in terms of protection at the moment.”'],
        [null, 'He hands you a dented trash-can lid. You look at it and give him a questioning look.'],
        ['you','“What about a weapon?”'],
        ['priest', '“This is to help shelter you from attacks. A weapon? Son, the word of God is in your hand there. Sharper than any double-edged sword, it pierces even to dividing soul and spirit, joints and marrow.”'],
        [null, 'You look at the Bible in your hand, the Scripture sounds familiar but how could a Bible fight monsters?'],
        ['you', '“I am not sure where to begin.”'],
      ],
      button: 'Take the lid',
    },
    pickVerses: {
      heading: 'What you have hidden in your heart',
      line: ['priest', '“Let us start with two verses. One to say to the anger, and one to keep you from being overwhelmed with it yourself.”'],
      hint: 'Patience cuts through anger. Longer verses hit harder and cost more.',
      offense: 'Against anger',
      defense: 'To keep you standing',
      button: '“Those two.”',
    },
  },

  // ---------- Tutorial: the Furnace (Bram, burning by the well) ----------
  tutorial: {
    lead: [
      ['priest', '“Good. Now, about Bram.” Amos takes his coat from the peg by the door. “The anger has burned in him so long that it has become a furnace. You saw it.”'],
      ['you', '“The fire on his skin. I thought I was dreaming.”'],
      ['priest', '“Perhaps you are.” He opens his worn Bible and reads aloud.'],
      ['priest', '“For our struggle is not against flesh and blood, but against the rulers, against the authorities, against the powers of this world’s darkness, and against the spiritual forces of evil in the heavenly realms.” Ephesians 6:12'],
      ['priest', '“Bram is not your enemy, son. He is held. Speak the truth over him, and whatever has hold of him must let go.” He presses a worn card into your hand. “Galatians 5:22–23. When his fire goes out, speak it over him.”'],
      ['you', '“And if he swings at me?”'],
      ['priest', 'Amos chuckles quietly. “Then I suppose you will be glad you took the lid.”'],
    ],
    start: 'Walk out to the well with Amos',
    // Amos talking you through your first fight
    coach: {
      firstRecall: 'Tap the word that fills each blank. Get them all and the verse is cast at full power.',
      firstCard: 'Each card is a verse you know. The number in the top left is how much focus it takes. You can regain focus between fights or by using certain scriptures. Tap a card to use that verse. You can use one verse per turn.',
      recall: 'Take your time, son. Fill in each blank. The more you get right, the sharper the sword of the Spirit cuts.',
      oneMove: 'Bram gets his turn after every verse you say, you can forego saying a verse and instead Brace: say nothing and take half the hurt.',
      gift: '“You are running low, aren’t you?” Amos presses a card into your hand. “Romans 12:2. Say it, and let the Lord renew your mind. It costs you nothing.”',
      readIntent: 'Each verse can be said once. When you have said all the ones you have strength for, they will all come back to you.',
      assembly: 'His fire is out. Now, son: say Galatians 5:22–23 over him, piece by piece, in order. Tap the pieces.',
    },
    // the fight stops and Amos teaches one rule, the first time it matters (the coach lines above are the body)
    tips: {
      firstCard: 'One verse a turn',
      oneMove: 'Then he answers',
      readIntent: 'Each verse once',
      gift: 'Out of focus',
      recall: 'Saying a verse',
      assembly: 'Piece by piece',
      ok: 'Got it',
    },
    giftLog: 'Amos hands you Romans 12:2.',
    groggy: 'It is hard to focus with the heat coming off Bram, you start the fight with less focus than normal.',
    after: [
      [null, 'The last of the fire goes out. Where the Furnace stood, Bram slowly sits down on the edge of the well, smoke still rising off his sleeves.'],
      ['blacksmith', '“Three weeks.” He stares at his hands. “Stood out here three weeks, burning. Let the forge go cold.”'],
      ['you', '“Are you okay?”'],
      ['blacksmith', '“Don’t know yet.” He looks at you properly for the first time. “Why did you help me?”'],
      ['you', '“Honestly? I’m not sure. I fell asleep studying, and I woke up here.”'],
      ['priest', '“The Lord brought him, Bram. Same as He brought you back just now.” Amos helps him to his feet. “Go home. Light the forge. People are going to need it.”'],
      ['blacksmith', 'Bram looks down at your sneakers and shakes his head. He unlaces his own work boots and pushes them into your arms. “Here. Where you’re going, you’ll want real boots.”'],
      ['you', '“Where am I going?”'],
      ['priest', '“When the fire went out, the others who were held out here ran. Into the caves outside town, most of them. Wendell. Hale. Silas.” He sighs. “Rest a while, then come and see me at the church. We will go and bring them home.”'],
    ],
    toTown: 'Walk back into town',
  },

  // ---------- Amos walks you through town, once, after the Furnace (and again from the church) ----------
  tour: {
    lines: [
      [null, 'Amos walks you up the main street. Most of the shutters are still nailed shut, but there is smoke coming from the forge chimney.'],
      ['priest', '“Before you go anywhere, son, a word. Nobody walks into a fire in his slippers. Paul told the church in Ephesus: ‘Put on the full armor of God, so that you can make your stand against the devil’s schemes.’ You get equipped here, in town. Then you go out.”'],
      ['you', '“So I get ready here, before every cave.”'],
      ['priest', '“Every time.” He nods at the forge. “Bram makes plain gear, for talents. Bring a piece back and say the right passage over it, and it becomes something more than leather.”'],
      ['priest', '“The inn, the training yard, the scriptorium: all boarded. The people who kept them are out in the caves. Every one you bring home opens a door, and every door has something for you behind it.”'],
      ['priest', '“And the church is always open. Come back hurt, come back tired, come back with nothing to say. That is what it is there for.”'],
      ['you', '“What do I need to know about the caves?”'],
      ['priest', '“Walk the whole cave before you face the one at the end. I preached a long time to those people, and some of them took my notes with them when they ran. You will find scraps that may give insight into their troubles.”'],
      ['priest', '“The ones down there are held by things that sound true and are not.”'],
      ['you','“Why did God choose me?”'],
      ['priest',"‘It is the glory of God to conceal a matter and the glory of kings to search it out.’"],
      ['priest', '“This town has only a little strength, son. But it kept His word. That is enough to start with.”'],
    ],
    button: 'Walk into town',
    again: 'Walk the town with Amos again',
  },

  // ---------- Philadelphia ----------
  title: {
    newGameConfirm: 'Start over? Your current journey will be erased.',
  },
  town: {
    heading: 'Philadelphia',
    buildings: { church: 'Church', forge: 'Forge', inn: 'Inn', training: 'Training Yard', scriptorium: 'Scriptorium' },
    boardedLabel: 'Boarded',
    road: 'Road',
    stillBoardedOne: '1 building is still boarded up. The people who ran them are still out in the square.',
    stillBoardedMany: '{n} buildings are still boarded up. The people who ran them are still out in the square.',
    allOpen: 'Every door in town is open.',
    // shown when you tap a building that is still boarded up
    boarded: {
      forge: 'Boarded up. Soot on the door, but no smoke from the chimney.',
      inn: 'Boarded up. A hand-painted sign in the window reads “Closed until further notice.”',
      training: 'Boarded up. Through the slats you can see practice dummies, knocked flat.',
      scriptorium: 'Boarded up. Someone has scratched the name off the sign.',
    },
    // shown after a fight when you free the person who ran each building
    unlocked: {
      furnace: 'Bram heads home. The forge will be lit when you get back to town.',
      grudge: 'The innkeeper heads home to unbar his doors.',
      brawler: 'The drill master heads back to the training yard.',
      slanderer: 'The scribe hurries back to the scriptorium to set right what he wrote.',
    },
  },
  church: {
    heading: 'The Church',
    lineBefore: ['priest', '“The ones who ran are in the caves outside town, son. Bring them home, one at a time. Come back here when you need rest. The Lord goes with you.”'],
    lineAfter: ['priest', '“Every door in Philadelphia is open again, and people are coming back to service.” He smiles, then nods toward the road. “I have heard there are other towns, though. Worse off than we were.”'],
    missions: 'Missions',
    caveCleared: ' · cleared {n}×',
    caveLocked: 'Bring the last one home first.',
    nextLocked: '??? · bring everyone home first',
    nextOpen: 'The Road to Ephesus · coming soon',
    pews: 'The pews',
    pray: 'Pray over your verses',
    prayBlurb: 'Level your spells in quiet. The training yard pays for clean drills; the pews don’t.',
    rest: 'Rest on a pew · 5 talents, heal fully',
    restDone: 'Amos binds your wounds and says a quiet prayer over you.',
    tooHurt: 'You can barely stand. Rest first.',
  },
  forge: {
    heading: 'The Forge',
    // the first time you walk in; after that, `line`
    firstVisit: [
      [null, 'The forge is roaring again. Bram is at the anvil like he never left it.'],
      ['blacksmith', '“There he is.” Bram sets the hammer down. “Didn’t thank you proper. Thank you.”'],
      ['you', '“You don’t have to—”'],
      ['blacksmith', '“Do. Now listen. Amos says that lid and that Bible are the start of the armor of God. Plain things. Bring me plain gear, say Scripture over it, and I’ll forge it into the real thing.”'],
      ['you', '“You can do that?”'],
      ['blacksmith', '“I can’t. The word of God can. I just hold the hammer.”'],
    ],
    line: ['blacksmith', '“Back again. Good. Everything I make is on the wall. Price is the price.”'],
    forSale: 'Plain gear',
    consecrate: 'Consecrate',
    consecrateNote: 'Bring the plain piece and recite the passage perfectly. Bram holds the hammer; Scripture does the work. One piece at a time, in the order Ephesians gives them.',
    owned: 'Yours.',
    ownedUp: 'Yours, and consecrated.',
    gifts: { boots: 'Yours. Bram wouldn’t take a coin.', lid: 'Yours. Amos gave it to you.', bible: 'Yours. Amos gave it to you.' },
    notForSale: 'Not for sale.',
    short: '{n} talents short.',
    buy: 'Buy',
    recite: 'From the {from}. Recite {ref}.',
    reciteBtn: 'Recite',
    consecrated: 'Consecrated.',
    needPlain: 'Buy the {from} first.',
    after: 'After the {prev}.',
    seeGear: 'See your gear',
    // popup, once, after Bram's first line at the Forge: how consecration works
    tip: {
      who: 'blacksmith',
      title: 'Making the armor of God',
      body: [
        'Every plain piece can become armor. Bring it here, tap Recite, and say the passage perfectly.',
        'It goes in the order Ephesians gives: the Belt of Truth first, with 6:14. Each piece after it adds a verse.',
        'A slip costs nothing. You only pay when the metal takes.',
      ],
    },
  },
  inn: {
    heading: 'The Inn',
    firstVisit: [
      [null, 'The inn smells like bread and woodsmoke. An old man in an apron is wiping down tables that are already clean.'],
      ['innkeeper', '“You! You’re the one who found me out there, counting!” He laughs and shakes his head. “Twelve years I kept a list of every man who ever did me wrong. Had it down to the penny.”'],
      ['you', '“What happened to the list?”'],
      ['innkeeper', '“Burned it in the stove this morning. Best fire I ever lit.” He pulls out a chair for you. “Now you sit. You eat. Nobody in this town pays for a bed tonight, and you least of all.”'],
    ],
    line: ['innkeeper', '“Well, look who it is! Sit, sit. Stew’s on the house. Always will be, for you.”'],
    rested: 'Already rested',
    eat: 'Eat and sleep · free',
    rumorHeading: 'Heard at the bar',
    // what Wendell has heard about the next cave you haven’t cleared (by cave id), or after all three
    rumors: {
      hollow: '“The Hollow! Cold down there, they say, and quiet. Mind the doors. Some of them only open for Scripture said right.”',
      quarry: '“The Old Quarry! Tobias went in after the others and nobody’s seen him since. Bad ankle, that man, always was. And the gate halfway down only lifts from a lever on the far side. Find the lever first!”',
      deep: '“The Deep Cave. The miller’s little Hannah followed her father in, and he came out without her. Keep your ears open. And the folks down there are the angriest of the lot, so don’t go in with your belt unbuckled, if you take my meaning.”',
      done: '“Every cave empty and every bed in town full! Now, travelers say the road east is worse off than we ever were. I’d pack a lunch.”',
    },
    ledgerHeading: 'Wendell’s ledger',
    ledgerIntro: '“I keep accounts again, the good kind. Here’s what you’re saving toward!”',
    ledgerLine: '{name} · {shop}',
    ledgerShort: '{n} to go',
    ledgerAll: 'You can afford everything on every shelf in town. Wendell is impressed, and a little suspicious.',
    ate: 'Wendell refills your bowl twice. You sleep like a stone.',
  },
  training: {
    yardHeading: 'The Training Yard',
    pewsHeading: 'The Pews',
    firstVisit: [
      [null, 'The practice dummies are back on their feet. So is the old drill master, though he moves like his knuckles still hurt.'],
      ['drill', '“You. The one who talked me down.” He looks you over. “You fight with Scripture, they tell me. Fine. Wisdom needs drilling, same as fists.”'],
      ['you', '“I’ve been trying. They just don’t stick.”'],
      ['drill', '“They stick if you do. Every day. Out loud. A clean recital out here earns you two talents. A sloppy one earns you another try.”'],
      ['you', '“Yes, sir.”'],
      ['drill', '“Better.”'],
    ],
    yardLine: ['drill', '“On your feet, recruit. Again. Until you can say it in your sleep.”'],
    pewsLine: [null, 'Quiet. Candles. Nobody watching. A good place to practice.'],
    help: 'Three perfect recitals level a spell up. Two shaky ones in a row (under 75%) knock it back down. A spell known fully by heart grows by adding the next verse. ',
    helpYard: 'The yard pays {n} talents for a clean drill, once per verse until you clear another cave. Hale doesn’t pay twice for the same recital.',
    payLeft: '{n} talents left to earn here this trip ({k} verses).',
    pays: '+{n} if clean',
    paid: 'paid this trip',
    toLevelUp: '{n}/3 perfect to level up',
    toGrow: '{n}/3 perfect to add the next verse',
    slips: ' · {n}/2 shaky',
    drillTitle: 'Drill',
    prayTitle: 'Pray',
    cleanYard: 'Clean. Hale grunts. +{n} talents.',
    cleanUnpaid: 'Clean. Hale nods. Already paid you for that one.',
    clean: 'Clean.',
    close: 'Close enough. It holds.',
    shaky: 'Shaky. {n}/2 before it drops.',
    dropped: 'It slipped a level.',
  },
  scriptorium: {
    heading: 'The Scriptorium',
    firstVisit: [
      [null, 'Ink pots, stacks of paper, and a thin man scraping a page clean with a knife.'],
      ['scribe', '“Ah. You.” He sets the knife down carefully. “I owe you an apology, and this town several hundred. I wrote things about my neighbors that were not true, and I nailed them to every door.”'],
      ['you', '“You’re taking them down?”'],
      ['scribe', '“Each one. And I am copying something true in their place.” He gestures at the shelves. “Scripture, copied carefully. It costs something, because care costs something. It is worth it.”'],
    ],
    line: ['scribe', '“Welcome back. Everything on these shelves is true. I have checked every word twice.”'],
    shelf: 'On the shelves',
    priceNote: '“Each copy is priced by the focus it asks of you in a fight. I do not haggle. I have told enough lies to last a lifetime.”',
    cost: '{type} · {n} focus',
    effect: { dmg: '{n} damage', shield: 'shields you for {n}', heal: 'heals {n}', focus: 'restores {n} focus' },
    // type advantage in Philadelphia, where everyone is held by wrath
    vsWrath: { Patience: 'Hits wrath half again as hard', Gentleness: 'Hits wrath a quarter harder' },
    buy: 'Buy',
    owned: 'Already yours: {refs}.',
    soldOut: 'You have every verse Silas has copied so far.',
    learned: '{ref} is yours.',
  },
  world: {
    heading: 'The Road',
    towns: { philadelphia: 'Philadelphia', ephesus: 'Ephesus', sardis: 'Sardis', smyrna: 'Smyrna' },
    open: 'The road east to Ephesus is open. Nobody in Philadelphia will say what is wrong there. The next town is still being built.',
    blocked: 'The road out of town runs past the caves. Bring everyone home first.',
    back: 'Back to Philadelphia',
  },

  // ---------- The caves: townsfolk who fled when the Furnace went out ----------
  // One cave per building, opened in this order from the church.
  caves: [
    {
      name: 'The Hollow',
      blurb: 'Wendell the innkeeper ran here, still counting.',
      intro: [
        ['priest', '“The Hollow is just past the old mill. Wendell kept the inn. He kept a list, too, of every wrong anyone ever did him. It got heavy.”'],
        ['you', '“How do I find him?”'],
        ['priest', '“Follow the muttering. And bring back anyone you find on the way, son. They are all somebody’s.”'],
      ],
      bossLead: 'At the bottom of the cave an old man sits on a crate in the lamplight, counting on his fingers and muttering names. The anger on him is cold, not hot. It has been there a long time.',
      done: [
        [null, 'Wendell blinks at the cave around him like he has never seen it before.'],
        ['innkeeper', '“Twelve years! Twelve years I carried that list.” He laughs, then wipes his eyes. “Come on, come on. I have an inn to open. Stew’s on the house.”'],
      ],
    },
    {
      name: 'The Old Quarry',
      blurb: 'Hale the drill master is down here, fighting the walls.',
      intro: [
        ['priest', '“Hale ran the training yard. He taught half the young men in Philadelphia how to fight, and then he could not stop. He is somewhere in the old quarry.”'],
        ['you', '“Is he dangerous?”'],
        ['priest', 'Amos chuckles quietly. “He was dangerous before. Bring the lid.”'],
      ],
      bossLead: 'The tunnel opens onto the quarry floor. A broad, gray-haired man is throwing punches at the rock wall, his knuckles bleeding.',
      done: [
        [null, 'Hale lowers his fists and looks at them like they belong to someone else.'],
        ['drill', '“Recruit.” He nods at you, slowly. “Good form. Come by the yard. I owe you a drill or two.”'],
      ],
    },
    {
      name: 'The Deep Cave',
      blurb: 'Silas the scribe went in with a lamp and a stack of paper.',
      intro: [
        ['priest', '“Silas wrote things about his neighbors that were not true, and nailed them to every door. When the fire went out, he ran. Shame does that.”'],
        ['you', '“Will he even want to come back?”'],
        ['priest', '“Tell him the truth, son. The truth is the one thing he has not tried.”'],
      ],
      bossLead: 'Papers are nailed to the cave walls, every one in the same neat hand. At the end of the passage a thin man is reading them aloud to no one: calm, reasonable, and lying.',
      done: [
        [null, 'Silas lets the papers fall from his hands.'],
        ['scribe', '“Every word I wrote was a lie, and I knew it.” He takes a long breath. “I would like to copy something true. Would you walk back with me?”'],
      ],
    },
  ],
  // walking the cave map: lines under the map as you find things, doors and levers
  dive: {
    enter: 'Go in',
    face: 'Step into the light',
    notYet: 'Not yet',
    notNow: 'Not now',
    leave: 'Leave',
    leaveConfirm: 'Leave the cave? You will have to start it over.',
    home: 'Walk back to Philadelphia',
    walkHint: 'It’s dark past arm’s length. Tap where you want to go. Walk up to a door and tap it to try it.',
    resume: 'You pick up where you left off.',
    // something new comes into the light
    hints: {
      fight: 'Someone up ahead is shouting at the dark.',
      fightMany: 'More than one voice up ahead, arguing.',
      lock: 'Something glints in an alcove.',
      rest: 'You smell woodsmoke. Someone left a fire burning.',
    },
    bossDoorSeen: 'A heavy door, barred from the other side. Someone behind it is muttering.',
    bossDoorShut: 'The bar won’t lift. Still held somewhere in this cave: {n}. Free them first.',
    bossDoorOpen: 'The bar lifts on its own, and the door swings in.',
    gateSeen: 'Iron bars across the tunnel. The passage goes on beyond them.',
    gateShut: 'The bars are rusted into the rock. There has to be a lever somewhere.',
    leverSeen: 'An old iron lever sticks out of the rock.',
    leverPulled: 'You haul the lever down. Off in the dark, iron grinds against stone.',
    verseSeen: 'A smooth stone door with no handle. Something is carved across it.',
    verseHeading: 'A stone door',
    verseBody: 'Carved across it, worn almost flat: SPEAK TRUTH HERE. Say a verse you carry. One slip and it stays shut.',
    verseTitle: 'Speak to the door',
    verseOpen: 'The stone sighs and slides back into the wall.',
    verseShut: 'The door doesn’t move. Try again when it’s clearer in your head.',
  },
  // pronoun: 'he' or 'she' (fills {he} {him} {his} {He} in the fight log)
  enemies: {
    hothead: { name: 'Hothead', pronoun: 'he' },
    grudge: { name: 'Grudge', pronoun: 'he' },
    brawler: { name: 'Brawler', pronoun: 'he' },
    slanderer: { name: 'Slanderer', pronoun: 'he' },
    furnace: { name: 'The Furnace', pronoun: 'he' },   // Bram, burning
  },
  // Townsfolk held by anger who fled into the caves. Order matches the six villager sprites.
  villagers: [
    { name: 'Tomas', pronoun: 'he', thanks: 'Tomas sits down on the curb and laughs, a little shaky. “I was going to put my fist through my own window.”' },
    { name: 'Abel', pronoun: 'he', thanks: 'Abel rubs his face like a man waking up. “How long was I standing here?”' },
    { name: 'Ezra', pronoun: 'he', thanks: 'Ezra looks at his hands. “I said things to my brother I can’t take back. I’m going to try anyway.”' },
    { name: 'Ruth', pronoun: 'she', thanks: 'Ruth lets out a breath she seems to have been holding for a month. “Thank you. Thank God.”' },
    { name: 'Mara', pronoun: 'she', thanks: 'Mara wipes her eyes. “I thought I was right. I was only angry. I need to go find my sister.”' },
    { name: 'Lydia', pronoun: 'she', thanks: 'Lydia unclenches her fists one finger at a time. “I’m going home. I think I remember where it is.”' },
  ],
  // what each person says once they are freed
  thanks: {
    hothead: 'I don’t know what I was so angry about. It’s gone. Thank God, it’s gone.',
    grudge: 'Twelve years I carried that list! You said one sentence and I set it down. Praise God!',
    brawler: 'My hands have stopped shaking. Nobody ever told me I could just stop. God is good.',
    slanderer: 'Every word I wrote was a lie, and I knew it. Thank you for saying something true. Glory to God.',
    furnace: 'I burned so long I forgot I was a man. Thank you. Thank God.',
  },
  // What the held say in a fight. The sin talks, not the person (Ephesians 6:12). Each kind has:
  //   taunts: most turns, in the voice of its sin. waver: below half health. crack: nearly free.
  //   atk / big / vex: what each move is called, said in the log when it lands (“Grudge reads
  //   out your failures.”). One is picked at random.
  // Villagers and the stronger villagers share `villager`.
  foes: {
    furnace: {
      taunts: [
        'Hot enough for you?',
        'Nobody comes to the well. Nobody.',
        'Get back. Before you burn.',
        'Everybody left. Let it burn.',
        'Stoke it. Higher.',
      ],
      waver: ['Fire’s… low. Why’s it low?', 'Cold. Something’s gone cold.'],
      crack: ['…what am I burning for?', 'Forge went cold. Why’d I let it?'],
      atk: ['throws a fistful of sparks', 'swings a red-hot fist'],
      big: ['roars up like a bellows', 'swings both fists, white-hot'],
      vex: ['shouts you down', 'blasts smoke in your face'],
    },
    grudge: {
      taunts: [
        'I remember what you did. I wrote it down.',
        'Let’s see. Late. Lazy. Forgot your mother’s birthday. Twice.',
        'Three nights on one verse. I counted.',
        'Everybody owes me. You too, now.',
        'I don’t forgive. I keep accounts.',
        'You fell asleep studying. That’s on the list.',
      ],
      waver: ['I had the page right here. Where’s the page?', 'The numbers don’t add up anymore.'],
      crack: ['…why am I keeping score?', 'Twelve years. What was it all for?'],
      atk: ['reads out your failures', 'recites an old wrong you did', 'tallies up what you owe'],
      vex: ['brings up something you’d rather forget', 'reminds you of the last time you lost your temper'],
    },
    brawler: {
      taunts: [
        'Come on, recruit. Hit me. I dare you.',
        'That’s it? I’ve been hit harder by a door.',
        'Put the book down and fight.',
        'You’re scared. I can see it.',
        'Swing! Why won’t you swing?',
      ],
      waver: ['Stop talking. Just stop talking and fight.', 'Why won’t you hit back?'],
      crack: ['…why am I so angry?', 'My hands. Look at my hands.'],
      atk: ['throws a wild swing', 'jabs at your ribs', 'shoves you hard'],
      big: ['swings a haymaker', 'charges in, head down'],
    },
    slanderer: {
      taunts: [
        'Everyone in town knows about you. I made sure.',
        'You only came down here to look good. Isn’t that right?',
        'I hear you don’t believe half of what you say.',
        'Amos only puts up with you. He told me so.',
        'I’m only saying what people are saying.',
        'They laugh about you after service. Quietly, of course.',
      ],
      waver: ['That’s… not what I wrote.', 'I may have misremembered. Slightly.'],
      crack: ['…why did I write any of it?', 'None of it was true. None of it.'],
      atk: ['whispers a half-truth about you', 'nails a rumor to the wall', 'reads you a page of lies'],
      vex: ['tells you what Amos really thinks of you', 'starts a rumor with your name in it'],
    },
    villager: {
      taunts: [
        'Get away from me!',
        'Everyone’s against me. You too?',
        'I’m not angry. I’m right.',
        'Who asked you?',
        'Don’t you tell me to calm down.',
        'They had it coming. All of them.',
        'Leave me alone!',
      ],
      waver: ['Why is it so quiet?', 'I don’t remember why I came down here.', 'Stop. Stop saying that.'],
      crack: ['…why am I so angry?', 'I want to go home.', 'What am I doing?'],
      atk: ['swings wildly', 'throws a rock', 'shoves you back', 'lashes out'],
      vex: ['screams in your face', 'calls you every name in the book'],
    },
  },
  // the fight log
  fight: {
    blocksOne: '{name} blocks the way.',
    blocksMany: '{names} block the way.',
    bossRoars: 'The Furnace roars. The room is too hot to think in.',
    // the first line of a fight: one per cave boss, a pool for villagers ({he} {him} {his} work)
    openers: {
      grudge: 'Wendell looks up from his fingers. “Another name for the list.”',
      brawler: 'Hale turns from the wall and raises his bleeding fists. “Finally. A recruit.”',
      slanderer: 'Silas lowers his paper and smiles at you. “Ah. I was just reading about you.”',
      villagerOne: [
        '{name} blocks the tunnel, fists clenched.',
        '{name} spins around, red in the face. “What do you want?”',
        '{name} is shouting at the cave wall. Then {he} sees you.',
        '{name} stands in the way, shaking with anger.',
        '{name} kicks a stone at you. “Go back where you came from.”',
      ],
      villagerMany: [
        '{names} are arguing in the dark. Then they both turn on you.',
        '{names} block the way, shoulder to shoulder.',
        '{names} stop shouting at each other and start shouting at you.',
      ],
    },
    yourTurn: 'Your turn',
    theirTurn: 'Their turn',
    vexTag: '+1 cost',
    // what you say, one picked at random. {ref} is the verse, {name} {he} {him} {his} the target.
    cast: {
      hit: [
        'You speak {ref}. It lands.',
        'You say {ref}. {name} hears every word.',
        'You speak {ref}. {name} flinches like {he} heard it.',
        'You speak {ref}, clear and steady.',
        'The truth of {ref} hits home.',
      ],
      type: [
        'You speak {ref}. {type} cuts through the anger.',
        'You speak {ref}. {name} never saw {type} coming.',
        '{type} answers wrath. {ref} hits hard.',
      ],
      big: [
        'You speak {ref}, every word in place. The air rings with it.',
        'You speak {ref} by heart, and it lands like a hammer.',
      ],
      halting: [
        'You stumble through {ref}. Some of it lands.',
        'You lose your place in {ref}, but some truth gets through.',
        '{ref} comes out in pieces.',
      ],
      shield: ['You say {ref}. Something steady settles around you.', 'You say {ref}, and you feel covered.'],
      heal: ['You say {ref} and breathe easier.', 'You say {ref}. The ache eases.'],
      focus: ['You say {ref}. Your head clears.', 'You say {ref}. Your mind settles.'],
    },
    // what happens to you: {move} is from `foes`
    hits: '{name} {move}.',
    // short labels that float up over whoever they happen to
    float: { blocked: '{n} blocked', shield: '+{n} shield', heal: '+{n}', focus: '+{n} focus', dazed: 'dazed', glance: 'glanced off' },
    // your own thoughts, now and then
    thoughts: {
      start: ['Okay. Just say it right.', 'Deep breath. It’s only a verse.', 'I really should have studied more.', 'Please let me remember this.'],
      hurt: ['That one hurt.', 'Note to self: brace more.', 'I’m going to feel that tomorrow. If there is a tomorrow.'],
      slip: ['I knew that one. I knew it.', 'So many flashcards. So little to show for it.', 'Close. Not close enough.'],
      waver: ['It’s working. {name} is listening.', 'Keep going. {He}’s slowing down.'],
      perfect: ['Every word. Huh.', 'I actually know that one.'],
    },
    targetHint: 'Tap an enemy to target it.',
    focus: 'Focus',
    notEnoughFocus: 'Not enough focus',
    alreadySaid: 'You’ve said that one. It comes back once you’ve said the others.',
    ready: 'Your head clears. Every verse is ready again.',
    brace: 'Brace — say nothing, take half damage',
    braceLog: 'You plant your feet and wait for it.',
    charge: 'Charge — skip this turn, double the next',
    charged: 'Charged — next verse hits double',
    chargeLog: 'You hold the word in your mouth.',
    speak: 'You speak {ref}.',
    speakHalting: 'You speak {ref}, haltingly.',
    peaceSteadies: 'Peace steadies your voice.',
    chargedLands: 'The charged word lands.',
    givesUp: '{name} lowers {his} fists. {He} doesn’t want this anymore.',
    freed: '{name} goes still. Something lets go of {him}.',
    standsDazed: '{name} stands dazed.',
    vexBlocked: '{name} {move}. The Shield of Faith holds.',
    vexed: '{name} {move}. Your verses cost 1 more focus this turn.',
    glances: '{name} {move}. It glances off the Shield of Faith.',
    helmetHolds: 'The Helmet of Salvation holds. You are still standing.',
  },
  afterFight: {
    heading: 'After the fight',
    freed: 'Freed',
    souls: 'Souls saved',
    talents: 'Talents',
    verses: 'How your verses went',
    // one word per cast this fight
    result: { perfect: 'perfect', steady: 'steady', slipped: 'slipped' },
    complete: 'complete',
    fruitCanGrow: 'a fruit can grow',
    foundGear: 'Found, and put on',
    bootsHeal: 'Your boots carry you on. Healed 4.',
    slipsWarning: '{n}/2 shaky casts before it drops a level',
    growTree: 'Grow the tree',
    afterBoss: 'Continue',   // after the Furnace
    moveOn: 'Move on',
  },
  drop: {
    heading: 'Something dropped',
    body: '{name} leaves a verse behind. Rare, and heavy.',
    take: 'Take it',
  },
  // ---------- The truth will set you free: held villagers who ask “Is it true that…?” ----------
  // Each truth is asked by a villager in a cave and taught by a scrap of Amos's sermon notes found in
  // that cave. The verse text lives in scripture.js (TRUTH_V) and is checked against the BSB.
  truths: {
    heading: 'Held by a lie',
    trueBtn: 'True',
    falseBtn: 'False',
    itsTrue: 'It’s true.',
    itsFalse: 'It’s false.',
    scrapHeading: 'A scrap of sermon notes',
    scrapFound: 'You found one of Amos’s sermon notes. It goes in your pocket.',
    scrapHint: 'A scrap of paper, weighted down with a stone.',
    villagerHint: 'Someone up ahead is muttering a question to the dark.',
    remember: 'You remember Amos’s note about this.',
    takeIt: 'Pocket it',
    readAgain: 'Amos’s notes',
    // the first one: Amos came along
    amosArrives: [
      [null, 'Footsteps behind you. Amos, out of breath, one hand on the rock wall.'],
      ['priest', '“I said I would walk the first one with you, son, and I am a man of my word. Mostly.” He chuckles. “Listen. This one is not angry at you. This one is asking.”'],
    ],
    amosAnswers: '“I will take this one,” Amos says gently.',
    amosYourTurn: ['priest', '“Now you, son. Take your time. If you are wrong, I am right here.”'],
    amosCorrects: ['priest', '“Not quite. Look again at what Scripture says, and try once more.”'],
    amosLeaves: ['priest', '“Good. That is all it takes: the truth, said plainly.” He pats your shoulder. “I will go back up and put the kettle on. The rest of this cave is yours.”'],
    // after the answer
    rightTrue: '“It’s true,” you say. Their shoulders drop. They have been holding their breath for weeks.',
    rightFalse: '“It’s not true,” you say. “Here’s what is.” They read it twice.',
    freed: ['“Then I don’t have to carry it.”', '“All this time I thought that was in the Bible.”', '“Say it again. Slower.”', '“Huh. I have been living by a saying.”'],
    lost: ['Their eyes go flat. “I knew it.” The lie closes over them like water.', '“That’s what I thought,” they whisper, and the anger comes back up in them.'],
    lostAfter: 'Free them first. The verse will still be there afterward.',
    comesBack: 'You’ll hear this one again.',
    freeThem: 'Free them',
    goOn: 'Go on',
    list: [
      {id:'help', ref:'Romans 5:6', answer:false,
        q:'“Is it true that God helps those who help themselves?”',
        why:'That one is Benjamin Franklin, not Scripture.',
        scrap:'You have heard it said, brothers, that God helps those who help themselves. That is not in Scripture; it is Benjamin Franklin. What is true? God helps the helpless.'},
      {id:'even', ref:'Romans 12:19', answer:false,
        q:'“Is it true that you shouldn’t get mad, you should get even?”',
        why:'Vengeance belongs to the Lord, not to us.',
        scrap:'You have heard it said, brothers, “Don’t get mad, get even.” But that is not true. What is true? Leave the getting even to God.'},
      {id:'handle', ref:'2 Corinthians 1:8–9', answer:false,
        q:'“Is it true that God won’t give you more than you can handle?”',
        why:'People borrow it from 1 Corinthians 10:13, which is about temptation. Paul was given far more than he could handle, so he would lean on God.',
        scrap:'You have heard it said, brothers, that God will not give you more than you can handle. But that is not true. Paul was crushed beyond his strength. What is true? It was so he would stop trusting himself and trust God.'},
      {id:'good', ref:'Ephesians 2:8–9', answer:false,
        q:'“Is it true that if you’re a good enough person, you’ll get into heaven?”',
        why:'We are saved by grace through faith, not by being good enough.',
        scrap:'You have heard it said, brothers, that if you are good enough you will get into heaven. But that is not true. Nobody is good enough. What is true? Grace. A gift.'},
      {id:'money', ref:'1 Timothy 6:10', answer:false,
        q:'“Is it true that money is the root of all evil?”',
        why:'Close. It is the love of money.',
        scrap:'You have heard it said, brothers, that money is the root of all evil. Close, but not true. What is true? It is the love of it.'},
      {id:'heart', ref:'Jeremiah 17:9', answer:false,
        q:'“Is it true that you should always follow your heart?”',
        why:'The heart is the thing that needs leading.',
        scrap:'You have heard it said, brothers, “Follow your heart.” But that is not true. What is true? The heart is the one thing in you that cannot be trusted to lead.'},
      {id:'sun', ref:'Ephesians 4:26', answer:true,
        q:'“Is it true that you shouldn’t let the sun set on your anger?”',
        why:'Be angry, yet do not sin. Settle it before nightfall.',
        scrap:'You have heard it said, brothers, “Do not let the sun set on your anger.” And that one is true. It is Scripture. Make it right before dark.'},
      {id:'pride', ref:'Proverbs 16:18', answer:true,
        q:'“Is it true that pride goes before destruction?”',
        why:'Proverbs says it outright.',
        scrap:'You have heard it said, brothers, that pride goes before a fall. And that one is true. Proverbs says it first.'},
      {id:'gentle', ref:'Proverbs 15:1', answer:true,
        q:'“Is it true that a gentle answer turns away wrath?”',
        why:'A harsh word stirs it up instead.',
        scrap:'You have heard it said, brothers, that a soft answer turns away anger. And that one is true. Try it on the next man who shouts at you.'},
      {id:'account', ref:'1 Corinthians 13:5', answer:true,
        q:'“Is it true that love keeps no account of wrongs?”',
        why:'Love does not keep a ledger.',
        scrap:'You have heard it said, brothers, that love keeps no record of wrongs. And that one is true. Wendell, if you are reading this: burn the list.'},
    ],
  },

  // ---------- Living it out: someone hurt in the cave. Help (it costs you) or walk on ----------
  living: {
    heading: 'Someone hurt',
    hint: 'Somebody up ahead is breathing hard, trying not to make a sound.',
    help: 'Help ({cost} HP)',
    walkOn: 'Walk on',
    tooHurt: 'You’re too hurt to carry anyone. Rest first, or walk on.',
    walkedOn: 'You tell yourself someone else will come along.',
    helpedNote: '{name} will remember.',
    atBoss: '{name} limps in behind you and stands at your back. Shield +{n}.',
    amosFirst: [
      [null, 'Amos catches up with you, lantern swinging.'],
      ['priest', '“I wanted to be here for this one.” He looks at the man on the ground, then at you. “We can talk about Scripture all day, son. He needs his ankle wrapped.”'],
    ],
    people: [
      {id:'tobias', name:'Tobias', story:'An old quarryman sits against the rock, one ankle swollen twice its size. His lantern has gone out. He ran in with the others, fell, and has been sitting in the dark since. He does not ask for anything.',
        helped:'You bind his ankle with your sleeve and get him on his feet. He leans on you all the way to the light. “Didn’t think anyone would stop,” he says. “Nobody stops.”'},
      {id:'hannah', name:'Hannah', story:'A girl of about twelve is curled up in a crack in the wall, scraped knees, shaking. She followed her father in and lost him in the dark.',
        helped:'You clean her knees and give her your water, and you sing her something badly until she laughs. She holds your hand the whole way back to the tunnel. “Will you find my dad?”'},
    ],
  },

  rooms: {
    restHeading: 'Rest',
    restBody: 'A quiet corner. Choose one.',
    sleep: 'Sleep — heal 12',
    slept: 'Healed 12',
    study: 'Study — practice a verse toward mastery',
    restConsecrate: 'Or consecrate, then go on resting',
    studyHeading: 'Study',
    studyNote: 'A perfect recital counts as one of the three needed to promote the verse.',
    studyMissed: 'Not quite. Rest anyway.',
    lockHeading: 'A chest',
    lockBody: 'Words are carved around the lock, scrambled: a piece of the Nicene Creed. Put them back in order and it opens.',
    lockSmall: 'Something light rattles inside.',
    lockBig: 'Something heavy shifts inside.',
    lockRules: '{pieces} pieces. {mistakes} mistakes allowed.',
    lockRulesNone: '{pieces} pieces. No mistakes allowed.',
    pickLock: 'Open it',
    lockHeld: 'The lock holds. You leave it and go on.',
    chestHeading: 'The chest opens',
    chestTake: 'Take one verse',
    chestLeave: 'Leave it',
    chestTalents: 'The chest opens. {n} talents.',
    chestCreed: 'The Nicene Creed, {n} of {total}',
    chestTitle: 'The Nicene Creed',
    chestTap: 'Tap the pieces in order.',
    chestMistakes: 'Mistakes: {n} of {max}',
    creedGained: 'You carry a new piece of the Creed: {n} of {total}.',
  },
  boss: {
    lastFire: 'Say it over him',
    assemble: 'The fire is out and the square goes quiet. Tap the pieces in order. No mistakes, and he is free.',
    // {slips} is “1 slip” or “3 slips”
    lastFlares: '{slips}. The fire flares back.',
    amosHelps: 'You stumble over the words. Amos says them with you, steady and slow, and Bram is free.',
  },
  victory: {
    heading: 'The Furnace goes out',
    story: 'The last fire goes out. Where the Furnace stood is Bram, the blacksmith, blinking like a man stepping out of a dark room. Somewhere behind you, someone opens a shutter. Then another.',
    bell: 'That night, for the first time in a long time, the church bell rings. And people come.',
    fruit: 'A clearer mind',
    fruitPerk: '+2 max focus, for good',
    newVerse: 'New verse',
    gift: 'From Bram',
    button: 'Help Bram up',
  },
  defeat: {
    heading: 'You wake on a pew',
    story: 'Amos found you in the square and carried you back. “The truth was on your lips, son,” he says gently. “You just ran out of breath to speak it. Rest now. We will try again.”',
    summary: 'You keep your level, gear, and verses. The mission starts over, and {n} talents were lost in the square.',
    button: 'Get up',
  },

  // ---------- The end of the Philadelphia chapter: plays once, after the last cave is cleared ----------
  // Philadelphia is named for the church in Revelation 3:7–13: little strength, kept His word, an open door.
  chapterEnd: {
    lines: [
      [null, 'That Sunday the church bell rings, and nobody has to be talked into coming. The pews fill. Then the aisle. Then the doorway.'],
      [null, 'Bram sits in the back row with soot still in his knuckles. Wendell has brought bread for everyone. Hale stands by the door like he is on guard. Silas sits very straight with a clean page in his lap.'],
      ['blacksmith', '“Rang the bell myself. Recast the clapper Tuesday.” He nods once. “Rings true now.”'],
      ['innkeeper', '“Full house! I counted. Heads, mind you, not grudges! Forty-one, and every one of them fed.”'],
      ['drill', '“Eyes front, recruit. Man’s about to preach.” Then, quieter: “You did good down there.”'],
      ['scribe', '“I have copied tonight’s passage for anyone who wants it. I checked it three times. It says exactly what is written, and nothing else.”'],
      [null, 'Amos steps up to the pulpit and looks out at a church that is full for the first time in years. For a while he does not say anything.'],
      ['priest', '“This town was named for a church, long ago. The Lord had a letter written to it, and He had nothing against them. Not one thing.” He opens his worn Bible and reads.'],
      [null, '“I know your deeds. See, I have placed before you an open door, which no one can shut. For you have only a little strength, yet you have kept My word and have not denied My name.” Revelation 3:8'],
      ['priest', '“A little strength. That is us, friends. We ran, and we burned, and we kept lists. But a few of us kept His word, and it was enough to bring the rest of us home.”'],
      ['you', '“I came here because I couldn’t memorize one verse.”'],
      ['priest', 'Amos chuckles quietly. “And now look at you.” He points out the open doors, past the square, to the road east. “That road runs to Ephesus. I have not had a letter from their church in a long time, son. The door is open. No one can shut it. But someone has to walk through it.”'],
    ],
    toStats: 'Step out into the square',
    heading: 'Philadelphia',
    sub: 'Everyone is home.',
    souls: 'Souls freed',
    home: 'Brought home',
    truths: 'Truths learned',
    truthsOf: '{n} of {total}',
    helped: 'People you helped',
    helpedNone: 'No one, this time',
    creed: 'The Nicene Creed',
    creedOf: '{n} of {total} pieces',
    mastered: 'Verses by heart',
    masteredOf: '{n} of {total}',
    talents: 'Talents',
    road: 'The road to Ephesus opens.',
    continued: 'To be continued.',
    button: 'Back to town',
  },

  // ---------- Gear and the Armor of God ----------
  items: {
    cap: { name: 'Ball Cap', perk: 'Keeps your head clear: one wrong choice is crossed off every multiple-choice blank.' },
    helm: { name: 'Helmet of Salvation', perk: 'Crosses off a wrong choice, +10 max HP, and once a cave a blow that would drop you leaves you at 1.' },
    vest: { name: 'Canvas Vest', perk: '+6 max HP.' },
    breast: { name: 'Breastplate of Righteousness', perk: '+6 max HP, and every hit against you lands 2 softer.' },
    belt: { name: 'Leather Belt', perk: 'Every perfect cast also shields you for 2.' },
    truth: { name: 'Belt of Truth', perk: 'Every perfect cast shields you for 2 and hits 25% harder.' },
    boots: { name: 'Work Boots', perk: 'Heal 4 after every fight.' },
    sabatons: { name: 'Shoes of the Gospel of Peace', perk: 'Heal 4 after every fight, and anyone down to 15% gives up and goes free.' },
    lid: { name: 'Trash-Can Lid', perk: 'Start every fight behind a shield of 4.' },
    faith: { name: 'Shield of Faith', perk: 'A shield of 4, the first hit of every fight glances off, and nobody can provoke you.' },
    bible: { name: 'Pocket Bible', perk: '+1 damage on every verse.' },
    sword: { name: 'Sword of the Spirit', perk: '+3 damage on every verse, and spells you know entirely by heart hit 25% harder.' },
  },
  gear: {
    armorHeading: 'The armor of God, in order',
    armorNote: 'Each piece is consecrated by reciting Ephesians 6 one verse further than the last.',
    allDone: 'The whole armor of God. There is nothing left to consecrate.',
    needPlain: 'Next: the {up}. Bring the {from} first.',
    cost: '{n} talents · recite {ref} perfectly',
    recallTitle: 'Consecrate',
    fits: '{name}. It fits.',
    failed: 'The Scripture slipped away from you. The metal stays cold.',
    bought: '{name} on.',
    // the gear screen's slot panel (drafts)
    emptySlot: '{slot}: nothing yet',
    forgeSells: 'Bram sells a {name} at the Forge for {n} talents.',
    nextConsecrate: 'Next: the {up}. {n} talents at the Forge, and recite {ref} perfectly.',
    laterConsecrate: 'Becomes the {up}, after the {prev}.',
    consecratedWith: 'Consecrated with {ref}.',
  },

  // ---------- Spells, recall, the tree ----------
  tiers: ['Glimpsed', 'Familiar', 'Known', 'By heart'],
  spells: {
    promoted: '{spell}: {tier}.',
    grew: 'It grows. {spell}.',
    slipped: '{spell} slips back to {tier}.',
    lostVerse: 'The newest verse slips away. {spell}.',
  },
  recall: {
    castTitle: 'Cast',
    typeHint: 'From memory: type the first letter of each word.',
    missing: 'Missing {kind}',
    score: '{right} of {total} right',
    fullPower: ' — full power',
  },
  tree: {
    heading: 'The tree',
    perks: {
      Patience: ['+1 damage on Patience verses', 'Charge: skip a turn to double your next verse', 'A perfect Patience cast dazes an angry enemy for a turn'],
      Gentleness: ['Every attack also shields you for 2', 'Freed enemies leave 5 extra talents', 'The first Gentleness verse each fight costs nothing'],
      Peace: ['+2 max focus', 'Your first stumble each fight still casts at full power', 'Start every fight with a shield of 5'],
    },
    // when each locked branch opens
    locks: {
      Love: 'Mission 2, Hatred', Joy: 'Mission 3, Envy', Kindness: 'Mission 4, Rivalry',
      Goodness: 'Mission 5, Impurity', Faithfulness: 'Mission 6, Idolatry', 'Self-control': 'Mission 7, Drunkenness',
    },
    tapHint: 'Tap a fruit to see what it does.',
    lockedUntil: 'Unlocked after {lock}.',
    lockedNote: 'This branch can’t grow until then.',
    grown: ' · grown',
    growHere: 'Grow here',
    nextHere: 'Next to grow on this branch.',
    growBelowFirst: 'Grow the fruit below it first.',
    summary: 'Level {level} · {grown} of 27 fruit grown. ',
    waitingOne: '1 growth waiting.',
    waitingMany: '{n} growths waiting.',
    everyLevel: 'Every level grows one fruit.',
  },
  codex: {
    creed: 'The Nicene Creed',
    creedSoFar: '{n} of {total} recovered',
    creedNote: 'The faded lines are still out there, carved around the locks of chests.',
    creedDone: 'You have recovered the whole Creed.',
  },
  // the Move your save screen (title screen), for carrying a save to another browser or device
  saves: {
    heading: 'Move your save',
    copyHeading: 'Copy this browser’s save',
    copyHelp: 'Copy the code, then paste it into “Load a save” on your other browser or device. It carries your whole journey.',
    noSave: 'There is no save on this browser yet.',
    copy: 'Copy save code',
    copied: 'Save code copied.',
    copyManual: 'Couldn’t copy automatically. Select the code and copy it.',
    loadHeading: 'Load a save',
    loadHelp: 'Paste a save code from another browser. It replaces the save on this one.',
    load: 'Load save',
    bad: 'That isn’t a whole save code. Copy it again and paste all of it.',
    confirm: 'Replace the save on this browser with the one you pasted?',
  },
  levelUp: {
    heading: 'Level {n}',
    body: 'Max HP +{hp}. A fruit of the Spirit can grow.',
    bodyMany: 'Max HP +{hp}. {n} fruit can grow.',
    grow: 'Grow {branch}',
    locked: '{branches} grow in later missions.',
    later: 'Later',
  },
};

// Fill {placeholders}: fill('{name} takes {n}.', {name:'Hothead', n:6})
function fill(s, vars = {}) {
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}
