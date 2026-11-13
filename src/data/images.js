/* Art from assets/source/, inlined by the build as data URIs (see the IMG placeholder in scripts/build.mjs). */
const IMG = {
  scene: {
    bedroom: __IMG__('scenes/01_bedroom_2am.png'),
    asleep: __IMG__('scenes/02_asleep_at_desk.png'),
    square: __IMG__('scenes/03_village_square_dusk.png'),
    church: __IMG__('scenes/04_church_interior.png'),
    title: __IMG__('scenes/05_title_emberford.png'),
  },
  battle: {
    square: __IMG__('battle/square_night.png'),
    lair: __IMG__('battle/furnace_lair.png'),
    cave: __IMG__('battle/cave.png'),   // PixelLab
  },
  // one scene per cave (PixelLab), keyed by CAVES[].id
  cave: {
    hollow: __IMG__('caves/hollow.png'),
    quarry: __IMG__('caves/quarry.png'),
    deep: __IMG__('caves/deep.png'),
  },
  hero: {
    asleep: __IMG__('hero/hero_asleep_desk.png'),
    waking: __IMG__('hero/hero_waking.png'),
  },
  priest: {
    idle: __IMG__('town/priest_idle.png'),
    welcome: __IMG__('town/priest_welcome.png'),
  },
  // [boarded, open]
  town: {
    church: [__IMG__('town/church_closed.png'), __IMG__('town/church_open.png')],
    forge: [__IMG__('town/forge_closed.png'), __IMG__('town/forge_open.png')],
    inn: [__IMG__('town/inn_closed.png'), __IMG__('town/inn_open.png')],
    training: [__IMG__('town/training_yard_closed.png'), __IMG__('town/training_yard_open.png')],
    scriptorium: [__IMG__('town/scriptorium_closed.png'), __IMG__('town/scriptorium_open.png')],
  },
  portrait: {
    // keyed by speaker id (see TEXT.speakers)
    priest: __IMG__('portraits/priest.png'),
    oldPriest: __IMG__('portraits/priest.png'),
    blacksmith: __IMG__('portraits/blacksmith.png'),
    innkeeper: __IMG__('portraits/innkeeper.png'),
    drill: __IMG__('portraits/drill.png'),
    scribe: __IMG__('portraits/scribe.png'),
  },
  tree: __IMG__('tree/tree.png'),
  // gear: one icon per item in ITEMS (gear.js), cut from icons/gear_sheet.png
  gear: {belt: __IMG__('icons/gear_belt.png'), vest: __IMG__('icons/gear_vest.png'), cap: __IMG__('icons/gear_cap.png'), boots: __IMG__('icons/gear_boots.png'), lid: __IMG__('icons/gear_lid.png'), bible: __IMG__('icons/gear_bible.png'), truth: __IMG__('icons/gear_truth.png'), breast: __IMG__('icons/gear_breast.png'), sabatons: __IMG__('icons/gear_sabatons.png'), faith: __IMG__('icons/gear_faith.png'), helm: __IMG__('icons/gear_helm.png'), sword: __IMG__('icons/gear_sword.png')},
  icon: {
    heart: __IMG__('icons/hp_heart.png'),
    mana: __IMG__('icons/mana_droplet.png'),
    soul: __IMG__('icons/soul_flame.png'),
    coin: __IMG__('icons/talent_coin.png'),
    Patience: __IMG__('icons/fruit_patience.png'),
    Gentleness: __IMG__('icons/fruit_gentleness.png'),
    'Self-control': __IMG__('icons/fruit_selfcontrol.png'),
    Love: __IMG__('icons/fruit_love.png'),
    Peace: __IMG__('icons/fruit_peace.png'),
    Goodness: __IMG__('icons/fruit_goodness.png'),
    Joy: __IMG__('icons/fruit_joy.png'),
    Kindness: __IMG__('icons/fruit_kindness.png'),
    Faithfulness: __IMG__('icons/fruit_faithfulness.png'),
  },
  // effect sprite sheets (PixelLab vfx_workbench): one row of n frames, each w x h
  fx: {
    patience:    {src:__IMG__('fx/patience.png'),    w:32, h:32, n:6},
    gentleness:  {src:__IMG__('fx/gentleness.png'),  w:32, h:32, n:6},
    selfcontrol: {src:__IMG__('fx/selfcontrol.png'), w:32, h:32, n:6},
    love:        {src:__IMG__('fx/love.png'),        w:32, h:32, n:6},
    peace:       {src:__IMG__('fx/peace.png'),       w:32, h:32, n:6},
    goodness:    {src:__IMG__('fx/goodness.png'),    w:32, h:32, n:5},
    bigcast:     {src:__IMG__('fx/bigcast.png'),     w:64, h:64, n:6},
    freed:       {src:__IMG__('fx/freed.png'),       w:64, h:64, n:8},
    hit:         {src:__IMG__('fx/hit.png'),         w:32, h:32, n:4},
    shield:      {src:__IMG__('fx/shield.png'),      w:48, h:64, n:4},
    levelup:     {src:__IMG__('fx/levelup.png'),     w:64, h:64, n:6},
  },
};
