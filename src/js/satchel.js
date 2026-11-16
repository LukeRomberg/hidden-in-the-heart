/* The satchel (docs/combat-v2.md, section 5): you carry five verses into a cave, packed at the cave mouth or
   from the church. Only packed verses come into the fights (and the verse doors) in there; the tutorial and any
   fight outside a cave use everything you know. To repack you walk back out (the cave keeps your progress,
   P.caveProgress). Each cave remembers what you packed for it last (P.satchel[cave id]; P.satchel.last seeds a
   cave you've never packed for). Five verses or fewer: you carry them all and there's no packing screen.
   R.satchel is the packed set while you're in a cave; R.deck stays the whole collection. */
const SATCHEL = 5;
function knownRefs(){ return [...new Set(R.deck.map(c=>c.ref))]; }
// the verses a fight deals from (combat.js verseRefs) and a verse door offers
function carried(){ const all = knownRefs(); return R.cave!=null && P.run && !R.tutorial && R.satchel ? R.satchel.filter(r=>all.includes(r)) : all; }
function mustPack(){ return knownRefs().length > SATCHEL; }
// what cave i's satchel starts as: what you packed for it last (else last anywhere), topped up in deck order
function satchelFor(i){
  const all = knownRefs(), mem = (P.satchel && (P.satchel[CAVES[i].id] || P.satchel.last)) || [];
  const s = mem.filter(r=>all.includes(r)).slice(0, SATCHEL);
  for(const r of all){ if(s.length>=SATCHEL) break; if(!s.includes(r)) s.push(r); }
  return s;
}
function keepSatchel(i, refs){ P.satchel = Object.assign(P.satchel||{}, {[CAVES[i].id]:refs.slice(), last:refs.slice()}); }
// a verse learned inside a cave (a chest) goes in if there's room (spells.js addVerse)
function satchelAdd(ref){ if(R.cave==null || !R.satchel || R.satchel.includes(ref) || R.satchel.length>=SATCHEL) return; R.satchel.push(ref); keepSatchel(R.cave, R.satchel); }

// ---- The packing screen (screen 'pack'): R.pack = {cave, from:'town'|'church', sel:[refs]} ----
function openPack(i, from){
  R.pack = {cave:i, from, sel:satchelFor(i)};
  const t = TEXT.dive.satchel.tip, first = !(P.tips && P.tips.satchel);   // Amos explains it the first time
  goto('pack', ()=>{ if(first) modal = {kind:'tip', key:'satchel', once:{who:t.who, title:t.title, body:t.body, screen:'pack'}}; });
}
// from the church: the next cave you haven't cleared, else the last one open
function packFromChurch(){ const open = CAVES.map((c,i)=>i).filter(caveOpen); openPack(open.find(i=>!P.caves[CAVES[i].id]) ?? open[open.length-1], 'church'); }
function packCave(i){ if(!caveOpen(i)) return; R.pack.cave = i; R.pack.sel = satchelFor(i); render(); }
function togglePack(ref){
  const k = R.pack, at = k.sel.indexOf(ref);
  if(at>=0) k.sel.splice(at,1);
  else if(k.sel.length>=SATCHEL){ toast(TEXT.dive.satchel.full); return; }
  else k.sel.push(ref);
  keepSatchel(k.cave, k.sel); save(); render();
}
function packGo(){
  const k = R.pack; if(!k || k.sel.length<Math.min(SATCHEL, knownRefs().length)) return;
  if(R.hp < R.maxHp*0.3){ toast(TEXT.church.tooHurt); return; }
  R.pack = null; enterCave(k.cave, k.sel);
}
function packBack(){ const from = R.pack && R.pack.from; R.pack = null; goto(from==='church' ? 'church' : 'town'); }
// a slot is narrow: the usual short names for the long books (a label, not Scripture text)
const BOOK_ABBR = {Proverbs:'Prov', Philippians:'Phil', Galatians:'Gal', Romans:'Rom', Ecclesiastes:'Eccl', Colossians:'Col', Ephesians:'Eph', Psalm:'Ps'};
function shortRef(ref){ const r = passRef(ref, sp(ref).n), m = r.match(/^(.*\S) (\d.*)$/); return m && BOOK_ABBR[m[1]] ? BOOK_ABBR[m[1]]+' '+m[2] : r; }
function packHTML(){
  const S = TEXT.dive.satchel, k = R.pack, sel = k.sel, need = SATCHEL - sel.length;
  // five slots: what's packed, in the order you packed it; tap one to take it out
  const slots = Array.from({length:SATCHEL}, (_,n)=>{ const ref = sel[n]; if(!ref) return `<span class="pslot empty"></span>`;
    const v = BY_REF[ref]; return `<button class="pslot ty-${v.type}" onclick="togglePack('${ref}')" aria-label="${ref}"><i class="gem">${spellCost(v)}</i><span>${shortRef(ref)}</span></button>`; }).join('');
  // every verse you know, in deck order so nothing jumps when you tap
  const cards = knownRefs().map(ref=>{ const v = BY_REF[ref], on = sel.includes(ref);
    return cardHTML(v, {cls:on ? 'sel packed' : need<=0 ? 'dim' : '', click:`togglePack('${ref}')`}); }).join('');
  const caves = k.from==='church' ? `<div class="row packcaves">${CAVES.map((c,i)=>caveOpen(i) ? `<button class="${i===k.cave?'on':''}" onclick="packCave(${i})">${TEXT.caves[i].name}</button>` : '').join('')}</div>` : '';
  return `<h1>${S.heading}</h1>${caves}<div class="panel packhead"><div class="px packsub">${fill(S.sub,{cave:TEXT.caves[k.cave].name})}</div>
    <div class="packslots">${slots}</div><div class="packcount small"><b>${fill(S.count,{n:sel.length, max:SATCHEL})}</b> · ${S.hint}</div></div>
    <div class="hand packhand">${cards}</div>
    <div class="dock row"><button class="wide" onclick="packBack()">${S.back}</button><button class="primary wide" ${need>0?'disabled':''} onclick="packGo()">${need>0 ? fill(S.more,{n:need}) : S.goIn}</button></div>`;
}
