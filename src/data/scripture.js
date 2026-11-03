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
const PASSAGE_REF = 'Galatians 5:22–23';
const CHUNKS = ['But the fruit','of the Spirit','is love, joy, peace,','patience, kindness, goodness,','faithfulness, gentleness, and self-control.','Against such things','there is','no law.'];
