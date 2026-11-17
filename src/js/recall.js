/* The recall challenge: blanks, multiple choice, first-letter typing. */
function core(w){ return w.toLowerCase().replace(/[^a-z0-9]/g,''); }
const ALL_TEXT = [...VERSES,...Object.values(PASS).flatMap(p=>p.vs.map(x=>({text:x.t})))].flatMap(v=>words(v));   // same split as the blanks (an em dash separates words)
const ALL_WORDS = [...new Set(ALL_TEXT.map(core).filter(w=>w.length>=4 && !/^\d+$/.test(w)))];
// Blanks are compared by core() (no case, no punctuation), but a choice shows the word as Scripture spells it:
// “quick-tempered”, not “quicktempered”; “God’s”, not “gods”.
const WORD_FORM = {}; ALL_TEXT.forEach(w=>{ const k=core(w), f=w.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g,''); if(k && !(k in WORD_FORM)) WORD_FORM[k]=f; });
const wordForm = x => WORD_FORM[x] || x;
const bareOf = w => w.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g,'');   // a word without its outer punctuation
function words(verse){ return verse.text.replace(/\u2014/g,' \u2014 ').split(' ').filter(Boolean); }
function refParts(verse){ const m = verse.ref.match(/^(.+) (\d+):(\S+)$/); return {book:m[1], ch:m[2], vs:m[3]}; }
function shiftVs(vs, d){ if(/^\d+$/.test(vs)) return String(Math.max(1,+vs+d)); const [a,b]=vs.split('-').map(Number); return `${Math.max(1,a+d)}-${Math.max(2,b+d)}`; }
function refDistractors(kind, r){
  if(kind==='book'){ const books=[...new Set([...VERSES,...ARMOR_V].map(v=>refParts(v).book))].filter(b=>b!==r.book); return pick(books,3); }
  if(kind==='ch'){ const c=+r.ch; return [String(c+1), String(c>1?c-1:c+2), String(c+2)]; }
  return [shiftVs(r.vs,1), shiftVs(r.vs,-1), shiftVs(r.vs,2)];
}
function blankCount(v){ const s=sp(v.ref); const w=words({text:passVerses(v.ref,s.n).slice(-1)[0].t}).filter(x=>core(x)).length; return s.tier===3 ? w : Math.max(1,Math.ceil(w*TIER_PCT[s.tier])); }
function makeChallenge(verse, tierOverride, nOverride, priorTier){
  const s = sp(verse.ref); const n = nOverride||s.n; const tier = tierOverride!==undefined ? tierOverride : s.tier; const prior = priorTier!==undefined ? priorTier : 3;
  const vs = passVerses(verse.ref, n); const toks=[];
  vs.forEach((x,i)=>{ const t = i<n-1 ? prior : tier;
    if(n>1) toks.push({w:x.v.split('-')[0], kind:'num'});
    const ws = words({text:x.t}).map(w=>({w, kind:'word', vi:i}));
    if(t===3) ws.forEach(o=>{ if(core(o.w)) o.mode='letter'; });
    else { let cand = ws.map((o,j)=>j).filter(j=>core(ws[j].w).length>=3); if(!cand.length) cand=ws.map((o,j)=>j).filter(j=>core(ws[j].w));
      const k=Math.max(1,Math.ceil(ws.filter(o=>core(o.w)).length*TIER_PCT[t])); pick(cand,Math.min(k,cand.length)).forEach(j=>ws[j].mode='choice'); }
    toks.push(...ws);
  });
  const r = PASS[verse.ref] ? {book:PASS[verse.ref].book, ch:String(PASS[verse.ref].ch), vs:passRef(verse.ref,n).split(':').pop()} : refParts(verse);
  toks.push({w:'\u2014', kind:'sep'});
  [['book',r.book],['ch',r.ch],['vs',r.vs]].forEach(([k,w])=>{ const o={w, kind:k}; if(tier===3 || Math.random()<TIER_PCT[tier]) o.mode='choice'; toks.push(o); });
  const inVerse = new Set(toks.map(o=>core(o.w)));
  toks.forEach(o=>{ if(o.mode!=='choice') return;
    const ans = o.kind==='word' ? core(o.w) : o.w.toLowerCase(); o.ans=ans;
    let d = o.kind==='word' ? pick(ALL_WORDS.filter(w=>!inVerse.has(w) && Math.abs(w.length-ans.length)<=3),3) : refDistractors(o.kind, r).map(x=>x.toLowerCase());
    d = d.filter(x=>x!==ans); if(R && (has('cap')||has('helm'))) d = d.slice(0, Math.max(1,d.length-1));
    o.opts = shuffle([ans, ...d]); });
  toks.forEach(o=>{ if(o.mode==='letter') o.ans = core(o.w)[0]; });
  const order = toks.map((o,i)=>i).filter(i=>toks[i].mode);
  // a verse you've never seen whole is read through once before the blanks (one cast before P.read existed counts as read)
  const readN = (P.read||{})[verse.ref] ?? ((P.casts||{})[verse.ref] ? s.n : 0);
  return {verse, toks, order, cur:0, n, tier, done:false, label:passRef(verse.ref,n), reading:readN<n, readN};
}
// "I've read it": the blanks come up, and this verse (this many of the passage) won't be shown whole again
function readDone(){ const c = modal.c; P.read = P.read||{}; P.read[c.verse.ref] = Math.max(P.read[c.verse.ref]||0, c.n); save(); c.reading = false; render(); }
function openRecall(verse, onDone, tierOverride, title, nOverride, priorTier){ modal = {kind:'recall', c:makeChallenge(verse,tierOverride,nOverride,priorTier), onDone, title: title||TEXT.recall.castTitle}; render(); }
function curTok(){ const c=modal.c; return c.toks[c.order[c.cur]]; }
function advance(){ const c=modal.c; if(c.cur < c.order.length-1) c.cur++; else c.done=true; }
function answer(val){ const o=curTok(); o.given = o.kind==='word' ? core(val) : String(val).trim().toLowerCase(); advance(); render(); }
function letterInput(el){
  const chars = el.value.toLowerCase().replace(/[^a-z0-9]/g,''); el.value='';
  for(const ch of chars){ if(modal.c.done) break; const o=curTok(); if(o.mode!=='letter') break; o.given=ch; advance(); }
  if(modal.c.done || curTok().mode!=='letter') render(); else { document.getElementById('rv').innerHTML=verseMarkup(); document.getElementById('rp').innerHTML=progressHTML(); }
}
function finishRecall(){ const c = modal.c; const right = c.order.filter(i=>c.toks[i].given===c.toks[i].ans).length; const fn = modal.onDone; modal = null; fn(right / c.order.length, c); }
function verseMarkup(){
  const c=modal.c; const curI=c.order[c.cur];
  const parts = c.toks.map((o,i)=>{
    let sepBefore = i===0 ? '' : (o.kind==='vs' ? ':' : ' ');
    if(o.kind==='num') return `${sepBefore}<sup class="vn">${o.w}</sup>`;
    if(o.kind==='sep') return '';   // the reference gets its own line instead of a dash
    if(c.reading){ const w = o.kind==='book' ? o.w : sepBefore+o.w;   // the whole verse; in a growing passage the new verse is marked
      return c.readN && o.vi>=c.readN ? `<span class="rnew">${w}</span>` : w; }
    if(!o.mode) return o.kind==='book' ? o.w : sepBefore+o.w;
    // the blank is the whole word, hyphens and apostrophes inside it included; only outer punctuation stays visible
    const lead = o.kind==='word' ? (o.w.match(/^[^A-Za-z0-9]*/)||[''])[0] : ''; const trail = o.kind==='word' ? (o.w.slice(lead.length).match(/[^A-Za-z0-9]*$/)||[''])[0] : '';
    const bare = o.kind==='word' ? o.w.slice(lead.length, o.w.length-trail.length) : o.w;
    if(o.kind==='book') sepBefore = '';
    if(o.given!==undefined){ const ok=o.given===o.ans;
      if(o.mode==='letter') return `${sepBefore}${lead}<span class="lw ${ok?'ok':'bad'}">${bare}</span>${trail}`;
      return `${sepBefore}${lead}<span class="blank ${ok?'ok':'bad'}">${ok?bare:(o.kind==='word'?wordForm(o.given):o.given)}</span>${ok||!c.done?'':` <span class="fix">${bare}</span>`}${trail}`; }   // the right word goes before the comma or full stop
    if(o.mode==='letter') return `${sepBefore}${lead}<span class="ph ${i===curI?'cur':''}" style="--n:${Math.min(bare.length,9)}"></span>${trail}`;
    return `${sepBefore}${lead}<span class="blank ${i===curI?'cur':''}">${i===curI?'?':'&nbsp;'}</span>${trail}`;
  });
  const si = c.toks.findIndex(o=>o.kind==='sep');
  return `<span class="rtext">${parts.slice(0,si).join('')}</span><span class="rref">${parts.slice(si+1).join('')}</span>`;
}
function progressText(){ const c=modal.c; return `${c.done?c.order.length:c.cur} of ${c.order.length}`; }
// one pip per blank: right, wrong, the one you're on, still to come
function progressHTML(){ const c=modal.c;
  const pips = c.order.map((ti,k)=>{ const o=c.toks[ti]; return `<i class="${o.given!==undefined ? (o.given===o.ans?'ok':'bad') : (k===c.cur&&!c.done?'cur':'')}"></i>`; }).join('');
  return `<span class="pips ${c.order.length>28?'tight':''}" aria-hidden="true">${pips}</span><span class="rcount">${progressText()}</span>`; }
function recallHTML(){
  const c = modal.c; const KIND = {word:'word', book:'book', ch:'chapter', vs:'verse'};
  let controls = '';
  if(c.reading){
    controls = `<div class="small mute">${c.readN ? TEXT.recall.readNew : TEXT.recall.readHint}</div><button class="primary wide" onclick="readDone()">${TEXT.recall.readButton}</button>`;
  } else if(c.done){ const right = c.order.filter(i=>c.toks[i].given===c.toks[i].ans).length;
    const res = castResult(right/c.order.length);   // perfect / steady / slipped, the same words as the after-fight panel
    controls = `<div class="rresult ${res}" role="status"><div class="stamp">${TEXT.afterFight.result[res]}</div><div class="rline">${TEXT.recall.verdict[res]}</div>
      <div class="small mute">${fill(TEXT.recall.score,{right, total:c.order.length})}${right===c.order.length?TEXT.recall.fullPower:''}</div></div><button class="primary wide" onclick="finishRecall()">Continue</button>`;
  } else if(curTok().mode==='letter'){
    controls = `<div class="small mute">${TEXT.recall.typeHint}</div>
      <input id="ans" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" oninput="letterInput(this)" style="text-align:center;font-size:28px;letter-spacing:.3em">`;
  } else { const o=curTok(); controls = `<div class="small mute">${fill(TEXT.recall.missing,{kind:KIND[o.kind]})}</div><div class="opts ${o.kind==='word'?'':'refopts'}">${o.opts.map(x=>`<button onclick="answer('${x.replace(/'/g,"\\'")}')">${o.kind!=='word'?x: x===o.ans?bareOf(o.w):wordForm(x)}</button>`).join('')}</div>`; }
  const s=sp(c.verse.ref);
  const coach = screen==='pro1' && !c.reading ? TEXT.tutorial.coach.firstRecall : '';   // in the Furnace fight Amos says it in a popup first (tutorialFirst)
  return `<div class="overlay recall"><div class="panel ${c.done?'done':''}"><div class="rhead"><h2>${modal.title}</h2><span class="rtier">${glyphs(c.verse.ref)} ${TIER_NAME[c.tier]}</span></div>
    <div class="rprog" id="rp" ${c.reading?'style="visibility:hidden"':''}>${progressHTML()}</div>
    <div class="verse rverse" id="rv">${verseMarkup()}</div>${coach?`<div class="coach">${coach}</div>`:''}<div class="dock">${controls}</div></div></div>`;
}
