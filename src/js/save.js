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
// ---- Moving a save between browsers: the whole save P as one copy-and-paste code ----
const SAVE_CODE_PREFIX = 'HITH1.';   // bump the number if the code format ever changes
function saveCode(){
  if(R && R.deck && R.deck.length) saveHero(); else save();
  const bytes = new TextEncoder().encode(JSON.stringify(P)); let bin = '';
  bytes.forEach(b=>{ bin += String.fromCharCode(b); });
  return SAVE_CODE_PREFIX + btoa(bin);
}
// returns the save object, or null if the code is not a whole, valid save
function readSaveCode(code){
  code = (code||'').replace(/\s+/g,'');
  if(!code.startsWith(SAVE_CODE_PREFIX)) return null;
  try{ const bin = atob(code.slice(SAVE_CODE_PREFIX.length));
    const o = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c=>c.charCodeAt(0))));
    return (o && typeof o==='object' && o.hero && Array.isArray(o.hero.deck)) ? o : null; }
  catch(e){ return null; }
}
async function copySaveCode(){
  const el = document.getElementById('savecode'); el.value = saveCode(); el.select();
  try{ await navigator.clipboard.writeText(el.value); toast(TEXT.saves.copied); }
  catch(e){ try{ document.execCommand('copy'); toast(TEXT.saves.copied); }catch(e2){ toast(TEXT.saves.copyManual); } }
}
function loadSaveCode(){
  const o = readSaveCode(document.getElementById('loadcode').value);
  if(!o){ toast(TEXT.saves.bad); return; }
  if(P.hero && !confirm(TEXT.saves.confirm)) return;
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(o)); }catch(e){ toast(TEXT.saves.bad); return; }
  location.reload();   // start fresh so the usual loading (and old-save conversions) runs on it
}
function savesHTML(){
  const T = TEXT.saves;
  return `<h1>${T.heading}</h1>
    <div class="panel"><h2>${T.copyHeading}</h2><div class="small" style="margin-bottom:8px">${P.hero?T.copyHelp:T.noSave}</div>
      <textarea id="savecode" class="code" rows="3" readonly aria-label="${T.copyHeading}"></textarea>
      <button class="primary wide" ${P.hero?'':'disabled'} onclick="copySaveCode()">${T.copy}</button></div>
    <div class="panel"><h2>${T.loadHeading}</h2><div class="small" style="margin-bottom:8px">${T.loadHelp}</div>
      <textarea id="loadcode" class="code" rows="3" placeholder="HITH1…" aria-label="${T.loadHeading}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea>
      <button class="wide" onclick="loadSaveCode()">${T.load}</button></div>
    <button class="wide" onclick="goto('title')">Back</button>`;
}
function continueGame(){ loadHero();
  if(!P.tutorialDone){ goto('tutorial'); return; }
  if(P.run){ Object.assign(R, {step:P.run.step, frags:P.run.frags.slice(), node:null, enemies:[], boss:null}); goto('map'); return; }
  goto('town'); }
