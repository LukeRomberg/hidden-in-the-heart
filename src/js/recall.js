/* The recall challenge: blanks, multiple choice, first-letter typing. */
function core(w){ return w.toLowerCase().replace(/[^a-z0-9]/g,''); }
const ALL_WORDS = [...new Set([...VERSES,...Object.values(PASS).flatMap(p=>p.vs.map(x=>({text:x.t})))].flatMap(v=>v.text.split(' ')).map(core).filter(w=>w.length>=4 && !/^\d+$/.test(w)))];
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
  return {verse, toks, order, cur:0, n, tier, done:false, label:passRef(verse.ref,n)};
}
function openRecall(verse, onDone, tierOverride, title, nOverride, priorTier){ modal = {kind:'recall', c:makeChallenge(verse,tierOverride,nOverride,priorTier), onDone, title: title||TEXT.recall.castTitle}; render(); }
function curTok(){ const c=modal.c; return c.toks[c.order[c.cur]]; }
function advance(){ const c=modal.c; if(c.cur < c.order.length-1) c.cur++; else c.done=true; }
function answer(val){ const o=curTok(); o.given = o.kind==='word' ? core(val) : String(val).trim().toLowerCase(); advance(); render(); }
function letterInput(el){
  const chars = el.value.toLowerCase().replace(/[^a-z0-9]/g,''); el.value='';
  for(const ch of chars){ if(modal.c.done) break; const o=curTok(); if(o.mode!=='letter') break; o.given=ch; advance(); }
  if(modal.c.done || curTok().mode!=='letter') render(); else { document.getElementById('rv').innerHTML=verseMarkup(); document.getElementById('rp').textContent=progressText(); }
}
function finishRecall(){ const c = modal.c; const right = c.order.filter(i=>c.toks[i].given===c.toks[i].ans).length; const fn = modal.onDone; modal = null; fn(right / c.order.length, c); }
function verseMarkup(){
  const c=modal.c; const curI=c.order[c.cur];
  return c.toks.map((o,i)=>{
    let sepBefore = i===0 ? '' : (o.kind==='vs' ? ':' : ' ');
    if(o.kind==='num') return `${sepBefore}<sup class="mute" style="font-size:.6em">${o.w}</sup>`;
    if(!o.mode) return sepBefore+o.w;
    const lead = o.kind==='word' ? (o.w.match(/^[^A-Za-z0-9]*/)||[''])[0] : ''; const trail = o.kind==='word' ? o.w.replace(/^[^A-Za-z0-9]*[A-Za-z0-9\u2019']*/,'') : '';
    const bare = o.kind==='word' ? o.w.slice(lead.length, o.w.length-trail.length) : o.w;
    if(o.given!==undefined){ const ok=o.given===o.ans;
      if(o.mode==='letter') return `${sepBefore}${lead}<span class="${ok?'t-Gentleness':'t-Goodness'}">${bare}</span>${trail}`;
      return `${sepBefore}${lead}<span class="blank ${ok?'ok':'bad'}">${ok?bare:o.given}</span>${trail}${ok||!c.done?'':`<span class="t-Gentleness"> ${bare}</span>`}`; }
    if(o.mode==='letter') return `${sepBefore}${lead}<span class="ph ${i===curI?'cur':''}">${'_'.repeat(Math.min(bare.length,7))}</span>${trail}`;
    return `${sepBefore}${lead}<span class="blank ${i===curI?'cur':''}">${i===curI?'?':'&nbsp;'}</span>${trail}`;
  }).join('');
}
function progressText(){ const c=modal.c; return `${c.done?c.order.length:c.cur} of ${c.order.length}`; }
function recallHTML(){
  const c = modal.c; const KIND = {word:'word', book:'book', ch:'chapter', vs:'verse'};
  let controls = '';
  if(c.done){ const right = c.order.filter(i=>c.toks[i].given===c.toks[i].ans).length;
    controls = `<div class="small mute">${fill(TEXT.recall.score,{right, total:c.order.length})}${right===c.order.length?TEXT.recall.fullPower:''}</div><button class="primary wide" onclick="finishRecall()">Continue</button>`;
  } else if(curTok().mode==='letter'){
    controls = `<div class="small mute">${TEXT.recall.typeHint}</div>
      <input id="ans" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" oninput="letterInput(this)" style="text-align:center;font-size:28px;letter-spacing:.3em">`;
  } else { const o=curTok(); controls = `<div class="small mute">${fill(TEXT.recall.missing,{kind:KIND[o.kind]})}</div><div class="opts">${o.opts.map(x=>`<button onclick="answer('${x.replace(/'/g,"\\'")}')">${x}</button>`).join('')}</div>`; }
  const s=sp(c.verse.ref);
  const coach = screen==='pro1' ? TEXT.tutorial.coach.firstRecall : (R && R.tutorial && !R.castRefs.length) ? TEXT.tutorial.coach.recall : '';
  return `<div class="overlay"><div class="panel"><h2>${modal.title}</h2>
    <div class="small mute">${glyphs(c.verse.ref)} \u00b7 ${TIER_NAME[c.tier]} \u00b7 <span id="rp">${progressText()}</span></div>
    <div class="verse" id="rv">${verseMarkup()}</div>${coach?`<div class="coach">${coach}</div>`:''}${controls}</div></div>`;
}
