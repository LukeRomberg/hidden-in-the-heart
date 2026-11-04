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
        [null, '2:14 a.m. A desk lamp, a stack of flashcards, and your Bible, open to the same page it has been open to for three nights.'],
        [null, 'Psalm 119:11. Fifteen words. You have read them dozens of times and they still are not memorized.'],
        ['you', '“I have hidden… Your… something. In my heart. I have hidden Your something in my heart.”'],
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
        [null, 'You point towards the door. “I am not sure where I am and there is a strange man yelling out there.”'],
        ['oldPriest', '“That is Bram, by the well.” He gives you a sad look. “He used to be a kind man, showed up every Sunday for service.”'],
        ['oldPriest', '“The town started skipping morning service and distancing themselves from one another, then they started to change. Anger first. Then the grudges. Then worse. In isolation there is no one to pull them out of the darkness.”'],
        [null, 'He looks at the Bible still in your hand.'],
      ],
      button: 'Hold it up',
    },
    lid: {
      lines: [
        ['priest', '“Well. That changes things.” He leans the broom on a pew and chuckles to himself quietly. “I’m Amos. It seems that the Lord has answered my prayers. You are here to help, but I am afraid this is all I can offer in terms of protection at the moment.”'],
        [null, 'He hands you a dented trash-can lid. You look at it and give him a questioning look. “What about a weapon?”'],
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

  // ---------- Tutorial: one guided fight with Bram ----------
  tutorial: {
    lead: [
      ['priest', '“Good. Now, let us go and see about Bram.” Amos takes his coat from the peg by the door. “He is the town’s blacksmith. He has been out by that well for three weeks, shouting at a door that will not answer him.”'],
      ['you', '“Three weeks? Hasn’t anyone tried to help him?”'],
      ['priest', '“They are all behind their own doors, son. That is the trouble.” He sighs. “Remember this: the anger is not Bram. It is sitting on him. Speak the truth over him, and it has to let go.”'],
      ['you', '“And if he swings at me?”'],
      ['priest', 'Amos chuckles quietly. “Then I suppose you will be glad you took the lid.”'],
    ],
    start: 'Walk out to the well with Amos',
    // Amos talking you through your first fight
    coach: {
      firstRecall: 'Tap the word that fills each blank. Get them all and the verse is cast at full power.',
      firstCard: 'Each card is a verse you know. The gem is how much focus it takes, and your focus only comes back after the fight. Tap a card to use that verse. It takes your whole turn.',
      recall: 'Take your time, son. Fill in each blank. The more you get right, the sharper the sword of the Spirit cuts.',
      oneMove: 'Bram gets his turn after every verse you say. The line above your cards tells you what he means to do. If he is winding up for something big, Brace.',
      gift: '“You are running low, aren’t you?” Amos presses a card into your hand. “Romans 12:2. Say it, and let the Lord renew your mind. It costs you nothing.”',
      readIntent: 'Each verse can be said once. When you have said all the ones you have strength for, they will all come back to you.',
    },
    giftLog: 'Amos hands you Romans 12:2.',
    groggy: 'You have been awake since yesterday. Your focus is already thin.',
    after: [
      [null, 'The red smoke thins, flickers, and goes out. The fire on his skin dies with it. Bram sits down hard on the edge of the well.'],
      ['blacksmith', '“Three weeks.” He stares at his hands. “Stood out here three weeks, yelling at a door. Let the forge go cold.”'],
      ['you', '“Are you okay?”'],
      ['blacksmith', '“Don’t know yet.” He looks at you properly for the first time. “Who are you?”'],
      ['you', '“Honestly? I’m not sure. I fell asleep studying, and I woke up here.”'],
      ['priest', '“The Lord brought him, Bram. Same as He brought you back just now.” Amos helps him to his feet. “Go home. Light the forge. People are going to need it.”'],
      ['blacksmith', '“Right.” Bram nods at you. “You come by. Whatever you need hammered, it’s yours.”'],
      ['priest', '“There are many more out there like Bram. Rest a while, then come and see me at the church. We will start with the square.”'],
    ],
    toTown: 'Walk back into town',
  },

  // ---------- Emberford ----------
  title: {
    newGameConfirm: 'Start over? Your current journey will be erased.',
  },
  town: {
    heading: 'Emberford',
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
      hothead: 'Bram heads home. The forge will be lit when you get back to town.',
      grudge: 'The innkeeper heads home to unbar his doors.',
      brawler: 'The drill master heads back to the training yard.',
      slanderer: 'The scribe hurries back to the scriptorium to set right what he wrote.',
    },
  },
  church: {
    heading: 'The Church',
    lineBefore: ['priest', '“The square is the worst of it, especially after dark. Start there. Free whoever you can, and come back here when you need rest. The Lord goes with you, son.”'],
    lineAfter: ['priest', '“Did you hear the bell last night? People are coming back to service.” He smiles, then nods toward the road. “I have heard there are other towns, though. Worse off than we were.”'],
    missions: 'Missions',
    mission1: 'Anger in the Square',
    mission1Cleared: ' · cleared {n}×',
    mission1Blurb: 'Mission 1. Free the people of Emberford from their anger.',
    nextLocked: '??? · clear the square first',
    nextOpen: 'The Road to Ashby · coming soon',
    pews: 'The pews',
    pray: 'Pray over your verses',
    prayBlurb: 'Level your spells in quiet. The training yard pays 2 talents a drill.',
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
    line: ['blacksmith', '“Back again. Good. Bring me plain things and the right Scripture, and I’ll make them holy.”'],
    forSale: 'For sale',
    soldOut: 'He has made you everything plain he can. The rest is up to the word of God.',
    consecrate: 'Consecrate',
    seeGear: 'See your gear',
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
    rested: 'You are already rested',
    eat: 'Eat and sleep · heal fully, free',
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
    helpYard: 'A clean drill here also earns 2 talents.',
    toLevelUp: '{n}/3 perfect to level up',
    toGrow: '{n}/3 perfect to add the next verse',
    slips: ' · {n}/2 shaky',
    drillTitle: 'Drill',
    prayTitle: 'Pray',
    cleanYard: 'Clean. Hale grunts. +2 talents.',
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
    soldOut: 'You have every verse Silas has copied so far.',
    learned: '{ref} is yours.',
  },
  world: {
    heading: 'The Road',
    towns: { emberford: 'Emberford', ashby: 'Ashby', fennmarsh: 'Fennmarsh', greyhollow: 'Greyhollow' },
    open: 'The road east to Ashby is open. Nobody in Emberford will say what is wrong there. The next town is still being built.',
    blocked: 'The road out of town is blocked by the anger in the square. Clear it first.',
    back: 'Back to Emberford',
  },

  // ---------- Mission 1: Anger in the Square ----------
  mission1: {
    intro: [
      [null, 'The square again, after dark. Every door is barred, except the ones that have been kicked in. Somewhere ahead, someone is smashing something, slowly.'],
      ['you', '“There are so many of them.”'],
      ['priest', '“Then remember who they are.” Amos opens his worn Bible and reads aloud.'],
      [null, '“For our struggle is not against flesh and blood, but against the rulers, against the authorities, against the powers of this world’s darkness, and against the spiritual forces of evil in the heavenly realms.” Ephesians 6:12'],
      ['priest', '“The people out there are not your enemies, son. They are held. Speak the truth over them, and whatever has hold of them must let go.”'],
      ['you', '“Okay.” You take a breath. “Okay.”'],
    ],
    goIn: 'Go in',
    mapHeading: 'The Square',
    mapHint: 'Tap the lit room to enter it.',
    bossLocked: 'The boss room opens when the passage is whole.',
    retreatConfirm: 'Retreat to town? This mission starts over.',
    // the line you read in the corridor before each room
    corridor: {
      forge: 'Hammering, somewhere ahead. Steady, like someone who has been at it for a very long time.',
      hothead: 'Someone ahead is shouting at the walls. Nobody is answering him.',
      grudge: 'An old man sits on an overturned crate ahead, counting on his fingers and muttering names.',
      brawler: 'The door ahead has been kicked off its hinges. From the inside.',
      slanderer: 'Papers are nailed to every door on this street. A calm voice ahead is reading them aloud.',
      villager: ['Someone ahead is kicking a door that isn’t even locked.', 'A woman ahead is shouting at an empty street.', 'Someone ahead is smashing crates, one at a time.'],
      boss: 'The heat reaches you before the sound does. The stones under your feet are warm.',
      shrine: 'Light under a door. Someone left a lamp burning.',
      lock: 'A chest sits in an alcove. There are words carved around the lock.',
      rest: 'Ashes, still warm. Whoever rested here left the fire going for the next person.',
    },
  },
  // pronoun: 'he' or 'she' (fills {he} {him} {his} {He} in the fight log)
  enemies: {
    hothead: { name: 'Hothead', pronoun: 'he' },
    grudge: { name: 'Grudge', pronoun: 'he' },
    brawler: { name: 'Brawler', pronoun: 'he' },
    slanderer: { name: 'Slanderer', pronoun: 'he' },
    furnace: { name: 'The Furnace', pronoun: 'he' },
  },
  // Townsfolk held by anger. Once a named person is freed, later fights (and retries) are
  // against these instead. Order matches the six villager sprites.
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
  // the fight log
  fight: {
    blocksOne: '{name} blocks the way.',
    blocksMany: '{names} block the way.',
    bossRoars: 'The Furnace roars. The room is too hot to think in.',
    intentAttack: 'attacks for {n}',
    intentBig: 'winds up for {n}',
    intentVex: 'provokes you',
    targetHint: ' Tap an enemy to target it.',
    focus: 'Focus',
    notEnoughFocus: 'Not enough focus',
    alreadySaid: 'You’ve said that one. It comes back once you’ve said the others.',
    ready: 'Your head clears. Every verse is ready again.',
    refocused: 'Your mind clears. +{n} focus.',
    brace: 'Brace — say nothing, take half damage',
    braceLog: 'You plant your feet and wait for it.',
    charge: 'Charge — skip this turn, double the next',
    charged: 'Charged — next verse hits double',
    chargeLog: 'You hold the word in your mouth.',
    speak: 'You speak {ref}.',
    speakHalting: 'You speak {ref}, haltingly.',
    peaceSteadies: 'Peace steadies your voice.',
    chargedLands: 'The charged word lands.',
    dazed: '{name} is dazed.',
    takes: '{name} takes {n}.',
    takesType: '{name} takes {n} — {type} cuts through the anger.',
    givesUp: '{name} lowers {his} fists. {He} doesn’t want this anymore.',
    freed: '{name} goes still. Something lets go of {him}.',
    barrier: 'A barrier of {n} rises.',
    healed: 'You breathe. Healed {n}.',
    standsDazed: '{name} stands dazed.',
    vexBlocked: '{name} tries to provoke you. The Shield of Faith holds.',
    vexed: '{name} provokes you. Your next verse costs more.',
    glances: '{name}’s blow glances off the Shield of Faith.',
    strikes: '{name} strikes for {n}{absorbed}.',
    slams: '{name} slams for {n}{absorbed}.',
    absorbed: ' ({n} absorbed)',
    helmetHolds: 'The Helmet of Salvation holds. You are still standing.',
  },
  afterFight: {
    fruitCanGrow: 'a fruit can grow',
    foundGear: 'Found, and put on',
    bootsHeal: 'Your boots carry you on. Healed 4.',
    slipsWarning: '{n}/2 shaky casts before it drops a level',
    growTree: 'Grow the tree',
    leaveRoom: 'Leave the room',
    moveOn: 'Move on',
  },
  drop: {
    heading: 'Something dropped',
    body: '{name} leaves a verse behind. Rare, and heavy.',
    take: 'Take it',
  },
  rooms: {
    shrineHeading: 'Shrine',
    shrineNote: 'Read it slowly. It is also a verse you can use, and the Furnace will ask you for it in pieces.',
    shrineTake: 'Take it as a spell and go on',
    shrineLearned: 'Learned Galatians 5:22-23',
    shrineKnown: 'You know this one. Read it again anyway, and go on.',
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
    heading: 'The Furnace',
    intro: [
      [null, 'The heat is coming from a man so wrapped in fire you can barely see him. Bram’s anger was a spark. This is a furnace.'],
      ['you', '“Amos, how do I even get close to him?”'],
      ['priest', '“Three fires burn in him. Each time you wear one down, the room will go quiet. Use that quiet to say {passage}, piece by piece, in order.”'],
      ['priest', '“Say it cleanly and the fire goes out. Stumble, and it flares back. When the last fire is out, say it once more without a mistake, and he will be free.”'],
      ['you', '“Okay. I can do this.”'],
    ],
    face: 'Face him',
    fireOut: 'Fire {n} of 3 goes out',
    lastFire: 'The last fire',
    assemble: 'The room goes quiet. Tap the pieces in order.',
    assembleFinal: ' No mistakes, and he is free.',
    assemblePhase: ' No mistakes, and he is dazed.',
    // {slips} is “1 slip” or “3 slips”
    fireDazed: 'Fire {n} of 3 goes out. He is dazed and burned for 8.',
    fireFlares: '{slips}. The fire flares back and he heals {n}.',
    lastFlares: '{slips}. The last fire flares back.',
  },
  victory: {
    heading: 'The Furnace goes out',
    story: 'The last fire goes out. Where the Furnace stood, a tired man sits down on the stones of the square, quieter than he has been in years. Somewhere behind you, someone opens a shutter. Then another.',
    bell: 'That night, for the first time in a long time, the church bell rings. And people come.',
    fruit: 'Fruit: Patience',
    fruitPerk: '+2 max focus, for good',
    newVerse: 'New verse',
    button: 'Walk back to the church',
  },
  defeat: {
    heading: 'You wake on a pew',
    story: 'Amos found you in the square and carried you back. “The truth was on your lips, son,” he says gently. “You just ran out of breath to speak it. Rest now. We will try again.”',
    summary: 'You keep your level, gear, and verses. The mission starts over, and {n} talents were lost in the square.',
    button: 'Get up',
  },

  // ---------- Gear and the Armor of God ----------
  items: {
    cap: { name: 'Ball Cap', perk: 'One wrong option is crossed off every multiple-choice blank.' },
    helm: { name: 'Helmet of Salvation', perk: 'Crosses off a wrong option, +10 max HP, and once per run a killing blow leaves you at 1.' },
    vest: { name: 'Canvas Vest', perk: '+6 max HP.' },
    breast: { name: 'Breastplate of Righteousness', perk: '+6 max HP and every hit against you is 2 weaker.' },
    belt: { name: 'Leather Belt', perk: 'Perfect casts also shield you for 2.' },
    truth: { name: 'Belt of Truth', perk: 'Perfect casts shield you for 2 and hit 25% harder.' },
    boots: { name: 'Work Boots', perk: 'Heal 4 after every fight.' },
    sabatons: { name: 'Shoes of the Gospel of Peace', perk: 'Heal 4 after fights, and enemies at 15% health give up and are freed.' },
    lid: { name: 'Trash-Can Lid', perk: 'Start every fight with a shield of 4.' },
    faith: { name: 'Shield of Faith', perk: 'Start with a shield of 4, the first hit each fight is blocked, and provoking no longer works on you.' },
    bible: { name: 'Pocket Bible', perk: '+1 damage on every verse.' },
    sword: { name: 'Sword of the Spirit', perk: '+3 damage on every verse, and spells you know entirely by heart hit 25% harder.' },
  },
  gear: {
    armorHeading: 'The armor of God, in order',
    armorNote: 'Each piece is consecrated by reciting Ephesians 6 one verse further than the last.',
    allDone: 'The whole armor of God. There is nothing left to consecrate.',
    needPlain: 'Next: the {up}. Bring the {from} first.',
    cost: '10 talents · recite {ref} perfectly',
    recallTitle: 'Consecrate',
    fits: '{name}. It fits.',
    failed: 'The Scripture slipped away from you. The metal stays cold.',
    bought: '{name} on.',
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
    creedNone: 'Chests in the square hold pieces of it.',
    creedSoFar: '{n} of {total} pieces.',
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
