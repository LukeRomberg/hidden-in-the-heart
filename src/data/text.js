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
    priest: 'Priest',
    you: 'You',
    blacksmith: 'Blacksmith',
    innkeeper: 'Innkeeper',
    drill: 'Drill master',
    scribe: 'Scribe',
  },

  // ---------- Prologue ----------
  prologue: {
    bedroom: {
      lines: [
        [null, 'Flashcards. A desk lamp. Your Bible open to the same page it has been open to for three nights.'],
        ['you', '“Psalm one nineteen, eleven. I have hidden… Your… in my…”'],
        [null, 'Your eyes are very heavy.'],
      ],
      recallTitle: 'One more time',
      button: 'Try one more time',
    },
    square: {
      // first line depends on how the Psalm 119:11 recall went
      firstRight: 'You get it right. You are so pleased with yourself that you put your head down for just a second.',
      firstMissed: 'You get about half of it. Your head goes down on the open page.',
      lines: [
        [null, 'Cold stone under your cheek. A village square at dusk. Every door barred, every window dark.'],
        [null, 'Somewhere a man is shouting at nobody. Nobody shouts back.'],
      ],
      button: 'Look for an open door',
    },
    church: {
      lines: [
        [null, 'One door is open. Dusty pews, a cold altar, and an old priest sweeping a floor nobody walks on anymore.'],
        ['priest', '“Nobody comes now. Not since the anger got into the town. Then the grudges. Then worse.”'],
        [null, 'He sees the Bible still in your hand, and stops sweeping.'],
      ],
      button: 'Hold it up',
    },
    lid: {
      lines: [
        ['priest', '“The armor of God was kept here once.” He hands you a dented trash-can lid. “This is what is left. That, and what you are holding. And the words.”'],
        ['priest', '“Do you know the words?”'],
        [null, 'You think about the flashcards.'],
        ['you', '“…Some of them.”'],
      ],
      button: 'Take the lid',
    },
    pickVerses: {
      heading: 'The words you know',
      line: ['priest', '“Tell me two. One to stand against the anger, and one to keep you standing.”'],
      hint: 'Patience hits wrath hardest. Longer verses hit harder and cost more.',
      offense: 'Against wrath',
      defense: 'To keep you standing',
      button: '“Those two.”',
    },
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
      hothead: 'The blacksmith goes home. His forge will be lit when you get back to town.',
      grudge: 'The innkeeper goes home to unbar his doors.',
      brawler: 'The old drill master heads for the training yard.',
      slanderer: 'The scribe hurries back to the scriptorium to fix what he wrote.',
    },
  },
  church: {
    heading: 'The Church',
    lineBefore: ['priest', '“The anger is worst in the square. Start there. Free who you can.”'],
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
    restDone: 'The priest binds your wounds.',
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
    help: 'Three clean recitals level a spell up; three slips in a row knock it back down. A spell known fully by heart grows by adding the next verse. ',
    helpYard: 'A clean drill here also earns 2 talents.',
    toLevelUp: '{n}/3 perfect to level up',
    toGrow: '{n}/3 perfect to add the next verse',
    slips: ' · {n}/3 slips',
    drillTitle: 'Drill',
    prayTitle: 'Pray',
    cleanYard: 'Clean. +2 talents.',
    clean: 'Clean.',
    close: 'Close. {n}/3 slips.',
    closeDropped: 'Close. It slipped a level.',
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
      [null, 'The square again, darker than before. Every door is barred except the ones that have been kicked in.'],
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
      boss: 'The heat reaches you before the sound does.',
      shrine: 'Light under a door. Someone left a lamp burning for you.',
      lock: 'A chest with no key. There are words carved around the lock.',
      rest: 'Ashes, still warm. Whoever rested here left the fire for the next one.',
    },
  },
  enemies: { hothead: 'Hothead', grudge: 'Grudge', brawler: 'Brawler', slanderer: 'Slanderer', furnace: 'The Furnace' },
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
    notEnoughMana: 'Not enough mana',
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
    givesUp: '{name} lowers his fists. He doesn’t want this anymore.',
    freed: '{name} goes still. Something lets go of him.',
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
    slipsWarning: '{n}/3 slips before it drops a level',
    growTree: 'Grow the tree',
    leaveRoom: 'Leave the room',
    moveOn: 'Move on',
  },
  drop: {
    heading: 'Something dropped',
    body: 'The Slanderer leaves a verse behind. Rare, and heavy.',
    take: 'Take it',
  },
  rooms: {
    shrineHeading: 'Shrine',
    shrineNote: 'Read it twice. It is also a spell, and the boss will ask for it in pieces.',
    shrineTake: 'Take it as a spell and go on',
    shrineLearned: 'Learned Galatians 5:22-23',
    restHeading: 'Rest',
    restBody: 'A quiet corner. Choose one.',
    sleep: 'Sleep — heal 12',
    slept: 'Healed 12',
    study: 'Study — practice a verse toward mastery',
    restConsecrate: 'Or consecrate, then go on resting',
    studyHeading: 'Study',
    studyNote: 'A perfect recital counts as one of the three needed to promote the verse.',
    studyMissed: 'Not quite. Rest anyway.',
    lockHeading: 'Lock',
    lockBody: 'The key is a verse you carry, recited one step harder than you know it.',
    pickLock: 'Pick the lock',
    lockHalf: 'It gives, grudgingly. 5 talents.',
    lockHeld: 'It holds. You go around.',
    chestHeading: 'The chest opens',
    chestTake: 'Take one verse',
    chestLeave: 'Leave it',
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
    fruitPerk: '+1 max mana, for good',
    newVerse: 'New verse',
    button: 'Walk back to the church',
  },
  defeat: {
    heading: 'You wake on a pew',
    story: 'The priest found you in the square and carried you back. “The words were right,” he says. “You just ran out of breath to say them.”',
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
      Peace: ['+1 max mana', 'Your first stumble each fight still casts at full power', 'Start every fight with a shield of 5'],
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
    levelUp: 'Level {n}. A new fruit can grow.',
  },
  codex: {
    carried: 'Carried in your head',
    nothingMastered: 'Nothing mastered yet. Three perfect casts at each level.',
  },
};

// Fill {placeholders}: fill('{name} takes {n}.', {name:'Hothead', n:6})
function fill(s, vars = {}) {
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}
