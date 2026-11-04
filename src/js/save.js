/* Save/load. localStorage key hidden-in-the-heart-v1, object P; hero lives in P.hero. */
const SAVE_KEY = 'hidden-in-the-heart-v1';
let P = {casts:{}, hero:null, town:{}, missions:{}, met:{}, creed:0, run:null, tutorialDone:false};
try{ const s = localStorage.getItem(SAVE_KEY); if(s){ const o = JSON.parse(s);
  if(o.hero && o.tutorialDone===undefined) o.tutorialDone = true;   // saves from before the tutorial have played past it
  P = Object.assign(P, o); } }catch(e){}
['casts','town','missions','met'].forEach(k=>{ if(!P[k]) P[k]={}; });
delete P.fresh; delete P.mastery; delete P.perks;
function save(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(P)); }catch(e){} }
function saveHero(){ if(!R) return; P.hero={}; KEEP.forEach(k=>P.hero[k]=R[k]); save(); }
function loadHero(){ const h = P.hero||{};
  if(h.maxFocus===undefined && h.maxMana!==undefined){ h.maxFocus = BASE_FOCUS + 2*(h.maxMana-3); delete h.maxMana; }   // saves from the mana days
  R = Object.assign(transient(), blankHero(), h); if(R.xp>=xpNeed(R.level)) R.xp=xpNeed(R.level)-1; }
function newGame(){
  P = {casts:{}, hero:null, town:{}, missions:{}, met:{}, creed:0, run:null, tutorialDone:false}; save();
  R = Object.assign(transient(), blankHero()); Object.keys(heroCache).forEach(k=>delete heroCache[k]);
  goto('pro1');
}
function continueGame(){ loadHero();
  if(!P.tutorialDone){ goto('tutorial'); return; }
  if(P.run){ Object.assign(R, {step:P.run.step, frags:P.run.frags.slice(), node:null, enemies:[], boss:null}); goto('map'); return; }
  goto('town'); }
