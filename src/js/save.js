/* Save/load. localStorage key hidden-in-the-heart-v1, object P; hero lives in P.hero. */
const SAVE_KEY = 'hidden-in-the-heart-v1';
let P = {mastery:{}, casts:{}, fresh:{}, perks:[], hero:null, town:{}, missions:{}};
try{ const s = localStorage.getItem(SAVE_KEY); if(s) P = Object.assign(P, JSON.parse(s)); }catch(e){}
['casts','fresh','town','missions'].forEach(k=>{ if(!P[k]) P[k]={}; });
if(!P.perks) P.perks=[];
function save(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(P)); }catch(e){} }
function saveHero(){ if(!R) return; P.hero={}; KEEP.forEach(k=>P.hero[k]=R[k]); save(); }
function loadHero(){ R = Object.assign(transient(), blankHero(), P.hero||{}); if(R.xp>=xpNeed(R.level)) R.xp=xpNeed(R.level)-1; }
function newGame(){
  P = {mastery:{}, casts:{}, fresh:{}, perks:[], hero:null, town:{}, missions:{}}; save();
  R = Object.assign(transient(), blankHero()); Object.keys(heroCache).forEach(k=>delete heroCache[k]);
  goto('pro1');
}
function continueGame(){ loadHero(); goto('town'); }
