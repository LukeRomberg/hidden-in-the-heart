/* Every line of story, dialogue and flavor text in the game, grouped by scene in roughly the
   order a player meets it. Edit freely; nothing else needs to change.

   - A conversation is a list of [speaker, line]. Speaker null is narration. Speaker ids are
     listed in `speakers` (that's also where their display names live).
   - {name}-style placeholders are filled in by the game. Keep them, move them around freely.
   - Use curly quotes and apostrophes: “ ” ‘ ’, and … for an ellipsis.
   - Scripture is NOT here. Verse text lives in scripture.js and is checked against the BSB.
     A quotation followed by its reference (like Ephesians 6:12 in mission1.intro) is also
     checked by `npm run verify`, so quote it exactly or not at all.
   - Short UI labels (Back, End turn, Talents, Gear…) are still in the code. */
const TEXT = {
  speakers: {
    priest: 'Amos',
    oldPriest: 'Old priest',   // Amos, before he introduces himself
    you: 'You',
    blacksmith: 'Bram',
    innkeeper: 'Innkeeper',
    drill: 'Drill master',
    scribe: 'Scribe',
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
        [null, 'You begin to wake to the sound of crickets chirping. Your cheek is cold, as you go to sit back up you realize you are laying down. As you begin to pick yourself up you realize you were laying on a stone street in a place you have never been before.'],
        [null, 'Adrenaline shocks your body awake and you begin to search around you frantically. You are surrounded by vacant buildings. Every door is barred. Every window is dark. The only light comes from a man by the well, and it is coming off him.'],
        [null, 'He is shouting at a door that isn’t answering. Fire dances over his skin and clothes but they do not burn, red smoke rolls off his shoulders like heat off a summer road. Nobody else is out to see it.'],
      ],
      button: 'Try to find someone else to talk to',
    },
    church: {
      lines: [
        [null, 'One door is open. Inside: dusty pews, a cold altar, and an old man sweeping a floor nobody walks on anymore.'],
        ['oldPriest', '“You saw him. Bram, by the well.” He doesn’t look up. “He used to be a kind man, showed up every Sunday for service.”'],
        ['oldPriest', '“The town started skipping morning service and distancing themselves, then they started to change. Anger first. Then the grudges. Then worse. It sits on people until they forget there was ever anything else.”'],
        [null, 'The broom stops. He is looking at the Bible still in your hand.'],
      ],
      button: 'Hold it up',
    },
    lid: {
      lines: [
        ['priest', '“Well. That changes things.” He leans the broom on a pew. “I’m Amos. The armor of God was kept here once. I’m afraid this is what’s left of it.”'],
        [null, 'He hands you a dented trash-can lid. He does it with great dignity.'],
        ['priest', '“This is to help shelter you from attacks. A weapon? Son, you have a weapon that can sever bone from marrow in your hand there.”'],
        [null, 'You look at the Bible in your hand, the words sound familiar but how could a Bible fight monsters?'],
        ['you', '“I am not sure where to begin.”'],
      ],
      button: 'Take the lid',
    },
    pickVerses: {
      heading: 'The words you know',
      line: ['priest', '“Let us start with two. One to say to the anger, and one to keep you from being overwhelmed with it yourself.”'],
      hint: 'Patience cuts through anger. Longer verses hit harder and cost more.',
      offense: 'Against anger',
      defense: 'To keep you standing',
      button: '“Those two.”',
    },
  },

  // ---------- Tutorial: one guided fight with Bram ----------
  tutorial: {
    lead: [
      ['priest', '“Good. Now, Bram.” Amos nods out the door. “He’s the blacksmith. He has been shouting at his own forge for three weeks.”'],
      ['priest', '“The anger isn’t him. Remember that. It’s sitting on him. Say the true thing, and it has to let go.”'],
      ['you', '“And if he swings at me?”'],
      ['priest', '“He will. That’s what the lid is for.”'],
    ],
    start: 'Walk over to Bram',
    // Amos talking you through your first fight
    coach: {
      firstRecall: 'Tap the word that fills each blank. Get them all and the verse is cast at full power.',
      firstCard: 'Each card is a verse you know. The gem is how much focus it takes, and your focus only comes back after the fight. Tap a card to use that verse. It takes your whole turn.',
      recall: 'Fill each blank. The more you get right, the harder it lands. Get them all for full power.',
      oneMove: 'He gets a turn after every verse you say. The line above your cards tells you what he’ll do next. If it’s a big one, Brace.',
      gift: '“Out of focus? Here.” Amos presses a card into your hand. “Romans 12:2. It costs nothing to say, and it gives your mind back what the fight took.”',
      readIntent: 'Each verse works once. When you’ve said all the ones you can afford, they all come back.',
    },
    giftLog: 'Amos hands you Romans 12:2.',
    groggy: 'It is 2 a.m. somewhere. Your focus is already thin.',
    after: [
      [null, 'The red smoke thins, flickers, and goes out. Bram sits down hard on the edge of the well.'],
      ['blacksmith', '“Three weeks. I’ve been yelling at a door for three weeks.” He looks at his hands. “I let the forge go cold.”'],
      ['priest', '“Then go light it.” Amos helps him up. “And the next time this one needs something hammered, you’ll do it for free.”'],
      ['blacksmith', '“For a start.” Bram looks at you properly for the first time. “You have more of those words?”'],
      ['you', '“Some of them.”'],
      ['priest', '“There are more people out there like Bram. Come by the church when you’re ready. We’ll start with the square.”'],
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
      forge: 'Boarded up. Someone in the square used to work here.',
      inn: 'Boarded up. The innkeeper has not been seen in weeks.',
      training: 'Boarded up. Whoever ran this yard left angry.',
      scriptorium: 'Boarded up. A sign in the window has been scratched out.',
    },
    // shown after a fight when you free the person who ran each building
    unlocked: {
      hothead: 'Bram goes home. His forge will be lit when you get back to town.',
      grudge: 'The innkeeper goes home to unbar his doors.',
      brawler: 'The old drill master heads for the training yard.',
      slanderer: 'The scribe hurries back to the scriptorium to fix what he wrote.',
    },
  },
  church: {
    heading: 'The Church',
    lineBefore: ['priest', '“It’s worst in the square after dark. Start there. Free who you can, and come back when you can’t.”'],
    lineAfter: ['priest', '“The bell rang last night. People are coming back.” He nods at the road. “Other towns are worse off than we were.”'],
    missions: 'Missions',
    mission1: 'Anger in the Square',
    mission1Cleared: ' · cleared {n}×',
    mission1Blurb: 'Mission 1. Free the people of Emberford from wrath.',
    nextLocked: '??? · clear the square first',
    nextOpen: 'The Road to Ashby · coming soon',
    pews: 'The pews',
    pray: 'Pray over your verses',
    prayBlurb: 'Level your spells in quiet. The training yard pays 2 talents a drill.',
    rest: 'Rest on a pew · 5 talents, heal fully',
    restDone: 'Amos binds your wounds.',
    tooHurt: 'You can barely stand. Rest first.',
  },
  forge: {
    heading: 'The Forge',
    line: ['blacksmith', '“You gave me my hands back. Bring me plain things and the right words, and I’ll make them holy.”'],
    forSale: 'For sale',
    soldOut: 'He has made you everything plain he can. The rest is up to the words.',
    consecrate: 'Consecrate',
    seeGear: 'See your gear',
  },
  inn: {
    heading: 'The Inn',
    line: ['innkeeper', '“Stew’s on the house. Every time. I stopped keeping that kind of ledger.”'],
    rested: 'You are already rested',
    eat: 'Eat and sleep · heal fully, free',
    ate: 'Fed, warm, and healed.',
  },
  training: {
    yardHeading: 'The Training Yard',
    pewsHeading: 'The Pews',
    yardLine: ['drill', '“Again. Until you can say it in your sleep. Which, I hear, is a problem for you.”'],
    pewsLine: [null, 'Quiet. Candles. Nobody watching.'],
    help: 'Three perfect recitals level a spell up. Two shaky ones in a row (under 75%) knock it back down. A spell known fully by heart grows by adding the next verse. ',
    helpYard: 'A clean drill here also earns 2 talents.',
    toLevelUp: '{n}/3 perfect to level up',
    toGrow: '{n}/3 perfect to add the next verse',
    slips: ' · {n}/2 shaky',
    drillTitle: 'Drill',
    prayTitle: 'Pray',
    cleanYard: 'Clean. +2 talents.',
    clean: 'Clean.',
    close: 'Close enough. It holds.',
    shaky: 'Shaky. {n}/2 before it drops.',
    dropped: 'It slipped a level.',
  },
  scriptorium: {
    heading: 'The Scriptorium',
    line: ['scribe', '“True words, this time. They cost something to copy.”'],
    soldOut: 'You have every verse he has copied so far.',
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
      [null, 'The square again, after dark. Every door is barred, except the ones that have been kicked in. Somewhere ahead, someone is breaking something slowly.'],
      [null, '“For our struggle is not against flesh and blood, but against the rulers, against the authorities, against the powers of this world’s darkness, and against the spiritual forces of evil in the heavenly realms.” Ephesians 6:12'],
      ['priest', '“The people out there are not your enemies. They are the held. Say the true thing over them, and whatever has them lets go.”'],
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
      grudge: 'A man sits counting on his fingers. Old debts, by the look of it.',
      brawler: 'The door has been kicked off its hinges. From the inside.',
      slanderer: 'The voice ahead is calm, reasonable, and lying.',
      villager: ['Someone ahead is kicking a door that isn’t locked.', 'A woman is arguing with an empty street. She is winning.', 'Somebody is breaking crates, one at a time, with care.'],
      boss: 'The heat reaches you before the sound does.',
      shrine: 'Light under a door. Someone left a lamp burning for you.',
      lock: 'A chest with no key. There are words carved around the lock.',
      rest: 'Ashes, still warm. Whoever rested here left the fire for the next one.',
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
    { name: 'Mara', pronoun: 'she', thanks: 'Mara wipes her eyes. “It felt like being right. It was only being angry.”' },
    { name: 'Lydia', pronoun: 'she', thanks: 'Lydia unclenches her fists one finger at a time. “I’m going home. I think I remember where it is.”' },
  ],
  // what each person says once they are freed
  thanks: {
    hothead: 'I don’t know what I was so angry about. It’s gone. Thank God, it’s gone.',
    grudge: 'Twelve years I carried that. You said one sentence and I set it down. Praise God.',
    brawler: 'My hands have stopped shaking. Nobody ever told me I could just stop. God is good.',
    slanderer: 'I knew every word of it was a lie. I needed someone to say the true thing out loud. Glory to God.',
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
    takesType: '{name} takes {n} — {type} cuts through wrath.',
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
    shrineNote: 'Read it twice. It is also a spell, and the boss will ask for it in pieces.',
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
    lockHeld: 'It holds. You go around.',
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
      [null, 'He has three fires in him. Beat him down a third and one goes out, and the room goes quiet enough to speak.'],
      [null, 'When it does, say {passage} in order, piece by piece. Say it clean and he is dazed and burned. Stumble and the fire flares back.'],
      [null, 'When the last fire is out, say it once more without a mistake, and he is free.'],
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
    story: 'He sits down on the stones of the square, quieter than he has been in years. Someone opens a shutter. Then another.',
    bell: 'That night the church bell rings for the first time in a long time.',
    fruit: 'Fruit: Patience',
    fruitPerk: '+2 max focus, for good',
    newVerse: 'New verse',
    button: 'Walk back to the church',
  },
  defeat: {
    heading: 'You wake on a pew',
    story: 'Amos found you in the square and carried you back. “The words were right,” he says. “You just ran out of breath to say them.”',
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
    failed: 'The words slipped. The metal stays cold.',
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
      Patience: ['+1 damage on Patience verses', 'Charge: skip a turn to double your next verse', 'A perfect Patience cast dazes a wrath enemy for a turn'],
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
