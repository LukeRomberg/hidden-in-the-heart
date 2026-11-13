/* Test mode: open the game with ?test in the URL. A "Test" button jumps straight to any section with a
   throwaway hero. Everything saves under a separate key, so the real save is never read or written. */
const TEST_MODE = /[?&]test\b/.test(location.search);
const TEST_KEY = 'hidden-in-the-heart-test';
if(TEST_MODE){
  // send every write of the real save to the test key instead, and start from the test save
  const realSet = Storage.prototype.setItem;
  Storage.prototype.setItem = function(k, v){ return realSet.call(this, k===SAVE_KEY ? TEST_KEY : k, v); };
  P = {casts:{}, hero:null, town:{}, missions:{}, met:{}, caves:{}, creed:0, run:null, tutorialDone:false};
  try{ const s = localStorage.getItem(TEST_KEY); if(s) P = Object.assign(P, JSON.parse(s)); }catch(e){}
}
let testStrong = false;
// a hero who has just picked their two verses (before the tutorial), or one who has come out of it
function testHero(afterTutorial){
  P = {casts:{}, hero:null, town:{}, missions:{}, met:{}, caves:{}, creed:0, run:null, tutorialDone:false};
  R = Object.assign(transient(), blankHero()); Object.keys(heroCache).forEach(k=>delete heroCache[k]);
  addVerse('Proverbs 14:29'); addVerse('Philippians 4:7');
  equip('bible'); equip('lid');   // Amos hands both over in the prologue
  if(afterTutorial){
    R.maxFocus += 2; addVerse('Galatians 5:22-23'); addVerse('Galatians 5:16'); addVerse('Romans 12:2');
    P.town.church = true; P.town.forge = true; P.missions.wrath = 1; P.tutorialDone = true; equip(BRAM_GIFT);
    R.level = 2; R.talents = 30;
  }
  if(testStrong){ R.level = 6; R.maxHp = R.hp = 70; R.maxFocus += 4; R.talents = 200; R.tree = {Patience:2, Gentleness:2, Peace:2};
    ['Proverbs 16:32','Romans 12:19'].forEach(addVerse); ['cap','belt','vest'].forEach(id=>{ if(ITEMS[id] && !owns(id)) equip(id); }); }
  Object.keys(heroCache).forEach(k=>delete heroCache[k]); saveHero();
}
const TEST_JUMPS = [
  ['Tutorial: the Furnace', ()=>{ testHero(false); startTutorial(); }],
  ['Amos’s town tour', ()=>{ testHero(true); R.tourFrom='town'; goto('tour'); }],
  ['Town, after the tutorial', ()=>{ testHero(true); goto('town'); }],
  ['The Hollow', ()=>{ testHero(true); startCave(0); }],
  ['The Old Quarry', ()=>{ testHero(true); P.caves.hollow = 1; startCave(1); }],
  ['The Deep Cave', ()=>{ testHero(true); P.caves.hollow = P.caves.quarry = 1; startCave(2); }],
  ['Boss: the Grudge', ()=>testBoss(0)],
  ['Boss: the Brawler', ()=>testBoss(1)],
  ['Boss: the Slanderer', ()=>testBoss(2)],
  ['Villager fight', ()=>{ testHero(true); R.node = {t:'fight'}; startFight(['villager','villager'], false); }],
  ['Level-up popup', ()=>{ testHero(true); goto('town', ()=>gainXP(xpNeed(R.level))); }],
  // shops, at the point in the chapter each one opens: tick "Strong hero" for a rich one (200 talents)
  ['Shop: the Forge', ()=>testShop('forge', 0, 30)],
  ['Shop: the Inn', ()=>testShop('inn', 1, 20)],
  ['Shop: the Training Yard', ()=>testShop('training', 2, 40)],
  ['Shop: the Scriptorium', ()=>testShop('scriptorium', 3, 30)],
  ['Chapter ending', testChapterEnd],
];
// a hero who has cleared the first `caves` caves (so those buildings are open) with `talents` to spend
function testShop(id, caves, talents){
  testHero(true); CAVES.slice(0, caves).forEach(c=>{ P.caves[c.id] = 1; townUnlock(c.boss); }); R.unlockMsg = null;
  if(!testStrong) R.talents = talents;
  P.met[id] = true; saveHero(); enterBuilding(id);
}
// Silas has just been freed: all three caves cleared for the first time, so the Deep Cave's goodbye leads to the ending
function testChapterEnd(){
  testHero(true); R.level = 7; R.souls = 31; R.maxHp = R.hp = 64; R.talents = 87;
  ['Proverbs 16:32','Romans 12:19'].forEach(addVerse);
  ['Proverbs 14:29','Galatians 5:22-23','Romans 12:2'].forEach(r=>setSp(r,{n:1, tier:3, perf:0, fails:0}));
  P.town = {church:true, forge:true, inn:true, training:true, scriptorium:true};
  CAVES.forEach(c=>P.caves[c.id] = 1); P.creed = 5;
  P.notes = TEXT.truths.list.slice(0,4).map(t=>t.id); P.truthsRight = TEXT.truths.list.slice(2,6).map(t=>t.id); P.helpedAll = ['tobias'];
  R.cave = 2; R.firstClear = true; TW = {key:null}; saveHero(); goto('cavedone');
}
function testBoss(i){
  testHero(true); for(let k=0;k<i;k++) P.caves[CAVES[k].id] = 1;
  startCave(i); setTimeout(()=>{ R.node = {t:'elite', caveBoss:true}; startFight([CAVES[i].boss], false); }, 400);
}
function testJump(n){ document.getElementById('testpanel').classList.remove('open'); modal = null; TEST_JUMPS[n][1](); }
function testPanel(){
  const el = document.createElement('div'); el.id = 'testpanel';
  el.innerHTML = `<button class="testbtn" onclick="this.parentNode.classList.toggle('open')">Test</button>
    <div class="testlist"><div class="small">Test mode: your real save is untouched.</div>
    <label class="small"><input type="checkbox" onchange="testStrong=this.checked"> Strong hero (level 6, gear, more verses)</label>
    ${TEST_JUMPS.map((j,i)=>`<button class="wide" onclick="testJump(${i})">${j[0]}</button>`).join('')}
    <button class="wide" onclick="location.search=''">Leave test mode</button></div>`;
  document.body.appendChild(el);
}
if(TEST_MODE) testPanel();
