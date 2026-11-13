/* Scripture used by the game (BSB). Verse text here is checked against the BSB source by tools/verify_scripture.mjs. */
const VERSES = [
  {ref:'Proverbs 15:1', type:'Gentleness', cost:1, dmg:6, text:'A gentle answer turns away wrath, but a harsh word stirs up anger.'},
  {ref:'James 1:19', type:'Patience', cost:2, dmg:9, text:'My beloved brothers, understand this: Everyone should be quick to listen, slow to speak, and slow to anger,'},
  {ref:'Ephesians 4:26', type:'Self-control', cost:1, dmg:6, text:'“Be angry, yet do not sin.” Do not let the sun set upon your anger,'},
  {ref:'Proverbs 16:32', type:'Patience', cost:2, dmg:10, text:'He who is slow to anger is better than a warrior, and he who controls his temper is greater than one who captures a city.'},
  {ref:'Ecclesiastes 7:9', type:'Self-control', cost:1, dmg:7, text:'Do not be quickly provoked in your spirit, for anger settles in the lap of a fool.'},
  {ref:'Colossians 3:8', type:'Goodness', cost:2, dmg:8, text:'But now you must put aside all such things as these: anger, rage, malice, slander, and filthy language from your lips.'},
  {ref:'Proverbs 14:29', type:'Patience', cost:1, dmg:7, text:'A patient man has great understanding, but a quick-tempered man promotes folly.'},
  {ref:'Psalm 37:8', type:'Peace', cost:1, shield:7, text:'Refrain from anger and abandon wrath; do not fret—it can only bring harm.'},
  {ref:'Romans 12:19', type:'Love', cost:3, dmg:14, text:'Do not avenge yourselves, beloved, but leave room for God’s wrath. For it is written: “Vengeance is Mine; I will repay, says the Lord.”'},
  {ref:'Philippians 4:7', type:'Peace', cost:2, heal:8, text:'And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.'},
  {ref:'John 11:35', type:'Love', cost:0, dmg:2, text:'Jesus wept.'},
  {ref:'Proverbs 19:11', type:'Patience', cost:2, dmg:9, text:'A man’s insight gives him patience, and his virtue is to overlook an offense.'},
  {ref:'Galatians 5:22-23', type:'Patience', cost:3, dmg:15, text:'But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control. Against such things there is no law.'},
  {ref:'Galatians 5:16', type:'Self-control', cost:2, dmg:9, text:'So I say, walk by the Spirit, and you will not gratify the desires of the flesh.'},
  // Restores focus instead of dealing damage. Amos gives it the first time you run dry.
  {ref:'Romans 12:2', type:'Peace', cost:0, focus:4, text:'Do not be conformed to this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what is the good, pleasing, and perfect will of God.'},
];
const ARMOR_V = [
  {ref:'Ephesians 6:14', type:'Armor', cost:0, text:'Stand firm then, with the belt of truth buckled around your waist, with the breastplate of righteousness arrayed,'},
  {ref:'Ephesians 6:15', type:'Armor', cost:0, text:'and with your feet fitted with the readiness of the gospel of peace.'},
  {ref:'Ephesians 6:16', type:'Armor', cost:0, text:'In addition to all this, take up the shield of faith, with which you can extinguish all the flaming arrows of the evil one.'},
  {ref:'Ephesians 6:17', type:'Armor', cost:0, text:'And take the helmet of salvation and the sword of the Spirit, which is the word of God.'},
];
const STORY_V = [
  {ref:'Psalm 119:11', type:'Love', cost:1, dmg:5, text:'I have hidden Your word in my heart that I might not sin against You.'},
];
// Verses the truths in TEXT.truths point to (shown after a villager’s question and on Amos’s notes). Copied from the BSB; npm run verify checks them.
const TRUTH_V = [
  {ref:'Romans 5:6', text:'For at just the right time, while we were still powerless, Christ died for the ungodly.'},
  {ref:'Romans 12:19', text:'Do not avenge yourselves, beloved, but leave room for God’s wrath. For it is written: “Vengeance is Mine; I will repay, says the Lord.”'},
  {ref:'2 Corinthians 1:8–9', text:'We do not want you to be unaware, brothers, of the hardships we encountered in the province of Asia. We were under a burden far beyond our ability to endure, so that we despaired even of life. Indeed, we felt we were under the sentence of death, in order that we would not trust in ourselves, but in God, who raises the dead.'},
  {ref:'Ephesians 2:8–9', text:'For it is by grace you have been saved through faith, and this not from yourselves; it is the gift of God, not by works, so that no one can boast.'},
  {ref:'1 Timothy 6:10', text:'For the love of money is the root of all kinds of evil. By craving it, some have wandered away from the faith and pierced themselves with many sorrows.'},
  {ref:'Jeremiah 17:9', text:'The heart is deceitful above all things and beyond cure. Who can understand it?'},
  {ref:'Ephesians 4:26', text:'“Be angry, yet do not sin.” Do not let the sun set upon your anger,'},
  {ref:'Proverbs 16:18', text:'Pride goes before destruction, and a haughty spirit before a fall.'},
  {ref:'Proverbs 15:1', text:'A gentle answer turns away wrath, but a harsh word stirs up anger.'},
  {ref:'1 Corinthians 13:5', text:'It is not rude, it is not self-seeking, it is not easily angered, it keeps no account of wrongs.'},
];
const PASSAGE_REF = 'Galatians 5:22–23';
const CHUNKS = ['But the fruit','of the Spirit','is love, joy, peace,','patience, kindness, goodness,','faithfulness, gentleness, and self-control.','Against such things','there is','no law.'];
