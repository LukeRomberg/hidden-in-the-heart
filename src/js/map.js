/* The dungeon map (the Square) and its non-fight rooms. */
const STEPS = [
  {rooms:[{t:'fight',e:['hothead']}]},
  {rooms:[{t:'shrine'}], frag:0},
  {rooms:[{t:'lock', tier:1},{t:'fight',e:['grudge']}], frag:1},
  {rooms:[{t:'fight',e:['brawler']}], frag:2},
  {rooms:[{t:'rest'},{t:'lock', tier:2}]},
  {rooms:[{t:'elite',e:['slanderer']},{t:'fight',e:['hothead']}], frag:3},
];
const NODE_LABEL = {fight:'Fight', elite:'Elite', shrine:'Shrine', lock:'Lock', rest:'Rest', forge:'Forge'};
const FRAGS = [CHUNKS[0]+' '+CHUNKS[1], CHUNKS[2]+' '+CHUNKS[3], CHUNKS[4]+' '+CHUNKS[5], CHUNKS[6]+' '+CHUNKS[7]];
const MW=140, RH=30, RW=28, RHT=24;
function roomX(n,i){ return n===1?56:(i===0?20:92); }
function mapHTML(){
  const H = 6+(STEPS.length+1)*RH;
  const ry = s => 3 + (STEPS.length - s)*RH;
  let svg = stoneBG(MW,H);
  for(let s=0;s<STEPS.length;s++){
    const a = STEPS[s].rooms.map((r,i)=>roomX(STEPS[s].rooms.length,i)+RW/2);
    const nb = s+1<STEPS.length? STEPS[s+1].rooms.length:1;
    const b = Array.from({length:nb},(_,i)=>roomX(nb,i)+RW/2);
    const y1=ry(s), y2=ry(s+1)+RHT, mid=(y1+y2)/2;
    a.forEach(x1=>b.forEach(x2=>{ svg+=`<polyline points="${x1},${y1} ${x1},${mid} ${x2},${mid} ${x2},${y2}" fill="none" stroke="var(--path)" stroke-width="5"/>`; }));
  }
  for(let s=0;s<=STEPS.length;s++){ const y=ry(s)+1; [2,MW-6].forEach((x,i)=>{ svg+=`<g class="${i?'fb':'fa'}">${pxg(ICON.torch[0],x,y,1)}</g><g class="${i?'fa':'fb'}">${pxg(ICON.torch[1],x,y,1)}</g>`; }); }
  const room=(x,y,type,state,label,s,i)=>{
    const click = state==='cur' ? `class="roomclick" role="button" tabindex="0" onclick="enterNode(${s},${i})" onkeydown="if(event.key==='Enter')enterNode(${s},${i})"` : '';
    const op = state==='done'?.35: state==='future'?.6:1; const wall = state==='cur'?'var(--gold)':'var(--line)';
    return `<g ${click} opacity="${op}"><rect x="${x}" y="${y}" width="${RW}" height="${RHT}" fill="${wall}"/>
      <rect x="${x+2}" y="${y+2}" width="${RW-4}" height="${RHT-2}" fill="var(--room)"/>
      <rect x="${x+2}" y="${y+2}" width="2" height="2" fill="${wall}"/><rect x="${x+RW-4}" y="${y+2}" width="2" height="2" fill="${wall}"/>
      ${pxg(ICON[type],x+6,y+3,2)}
      <text x="${x+RW/2}" y="${y+22.5}" font-size="3" font-family="'Pixelify Sans',sans-serif" fill="#e8dcc0" text-anchor="middle">${label}</text></g>`;
  };
  STEPS.forEach((st,s)=>{ const state = s<R.step?'done': s>R.step?'future':'cur';
    st.rooms.forEach((r,i)=>{ svg+=room(roomX(st.rooms.length,i), ry(s), r.t, state, NODE_LABEL[r.t]+(r.e&&r.e.length>1?' '+r.e.length:''), s, i); }); });
  svg += room(56, ry(STEPS.length), 'boss', R.step===STEPS.length?'cur':'future', 'Boss', -1, 0);
  svg += heroRects('front',0, 0, ry(Math.min(R.step,STEPS.length))+1, 0.36);
  return `<h1>${TEXT.mission1.mapHeading}</h1>
    <div class="panel" style="padding:0;overflow:hidden"><svg class="dmap" viewBox="0 0 ${MW} ${H}" width="100%" shape-rendering="crispEdges" role="img" aria-label="Dungeon map">${svg}</svg></div>
    <div class="small mute">${TEXT.mission1.mapHint}</div>
    <div class="panel"><h2>${PASSAGE_REF}</h2>${FRAGS.map((f,i)=>`<div class="frag ${R.frags.includes(i)?'have':''}">${R.frags.includes(i)?f:'· · · · · ·'}</div>`).join('')}
    <div class="small mute" style="margin-top:8px">${TEXT.mission1.bossLocked}</div></div>
    <div class="dock row"><button onclick="R.gearFrom='map';goto('gear')">Gear</button><button onclick="R.treeFrom='map';R.treeSel=null;goto('tree')">Tree</button><button onclick="R.deckFrom='map';goto('deck')">Deck</button><button onclick="if(confirm(TEXT.mission1.retreatConfirm)) retreat()">Retreat</button></div>`;
}
function enterNode(s,i){
  const n0 = s===-1 ? {t:'boss'} : STEPS[s].rooms[i]; const n = n0.e ? {...n0, e:n0.e.map(standIn)} : n0;
  R.node = n; R.next = {n}; goto('corridor');
}
function clearColumn(){ const st=STEPS[R.step]; if(st && st.frag!==undefined && !R.frags.includes(st.frag)) R.frags.push(st.frag); R.step++;
  P.run={step:R.step, frags:R.frags.slice()}; saveHero(); goto('map'); }   // mid-mission save: a reload resumes on the map
function proceed(){ const n=R.next.n; if(n.t==='fight'||n.t==='elite') startFight(n.e); else if(n.t==='boss') goto('bossintro'); else goto(n.t); }
function rewardHTML(){
  return `<h1>${TEXT.rooms.chestHeading}</h1><h2>${TEXT.rooms.chestTake}</h2><div class="hand">${R.reward.map(ref=>`<div onclick="takeReward('${ref}')">${cardView(BY_REF[ref])}</div>`).join('')}</div>
    <div class="dock"><button class="wide" onclick="clearColumn()">${TEXT.rooms.chestLeave}</button></div>`;
}
function takeReward(ref){ addVerse(ref); clearColumn(); }
function shrineHTML(){
  return `<h1>${TEXT.rooms.shrineHeading}</h1><div class="panel"><h2>${PASSAGE_REF}</h2><div class="verse">${CHUNKS.join(' ')}</div>
    <div class="small mute">${TEXT.rooms.shrineNote}</div></div>
    <div class="dock">${R.deck.some(c=>c.ref==='Galatians 5:22-23')
      ? `<button class="primary wide" onclick="R.hp=Math.min(R.maxHp,R.hp+5);clearColumn()">${TEXT.rooms.shrineKnown}</button>`
      : `<button class="primary wide" onclick="addVerse('Galatians 5:22-23');R.hp=Math.min(R.maxHp,R.hp+5);toast(TEXT.rooms.shrineLearned);clearColumn()">${TEXT.rooms.shrineTake}</button>`}</div>`;
}
function restHTML(){
  return `<h1>${TEXT.rooms.restHeading}</h1><div class="panel">${TEXT.rooms.restBody}</div>
    <button class="wide" onclick="R.hp=Math.min(R.maxHp,R.hp+12);toast(TEXT.rooms.slept);clearColumn()">${TEXT.rooms.sleep}</button>
    <button class="wide" onclick="screen='study';render()">${TEXT.rooms.study}</button>
    <h2 style="margin-top:12px">${TEXT.rooms.restConsecrate}</h2>${consecrateList()}`;
}
function studyHTML(){
  const refs=[...new Set(R.deck.map(c=>c.ref))];
  return `<h1>${TEXT.rooms.studyHeading}</h1><div class="panel small mute">${TEXT.rooms.studyNote}</div>
    ${refs.map(ref=>`<button class="wide" onclick="studyVerse('${ref}')">${spellLine(ref)} · ${TIER_NAME[sp(ref).tier]}</button>`).join('')}`;
}
function studyVerse(ref){ openRecall(BY_REF[ref], (frac)=>{ recordResult(ref,frac); if(frac<1) toast(TEXT.rooms.studyMissed); clearColumn(); }, undefined, TEXT.rooms.studyHeading); }
// ---- Chests: put a scrambled piece of the Nicene Creed back in order ----
// Deeper chests are harder and hold better loot. Fail and you get nothing.
const CREED = __DATA__('creed.json');
const CHEST = {
  1: {pieces:4, mistakes:2, talents:10, verse:false},
  2: {pieces:6, mistakes:1, talents:15, verse:true},
  3: {pieces:8, mistakes:0, talents:25, verse:true},
};
// split a section into n pieces of similar length, cutting after punctuation where it can
function creedPieces(text, n){
  const w = text.split(' '); n = Math.min(n, w.length); const cuts = [];
  for(let k=1;k<n;k++){ const prev = cuts.length ? cuts[cuts.length-1] : 0; let c = Math.round(k*w.length/n);
    for(const d of [0,1,-1,2,-2]){ const j=c+d; if(j>prev && j<w.length && /[,;.:]$/.test(w[j-1])){ c=j; break; } }
    cuts.push(Math.min(w.length-(n-k), Math.max(c, prev+1))); }
  return [...cuts, w.length].map((c,i,a)=>w.slice(i?a[i-1]:0, c).join(' '));
}
function lockHTML(){
  const T = TEXT.rooms, spec = CHEST[R.node.tier||1];
  return `<h1>${T.lockHeading}</h1><div class="panel">${T.lockBody} <span class="mute">${spec.verse?T.lockBig:T.lockSmall}</span></div>
    <div class="small mute" style="margin-bottom:8px">${fill(spec.mistakes?T.lockRules:T.lockRulesNone,{pieces:spec.pieces, mistakes:spec.mistakes})}</div>
    <div class="dock"><button class="primary wide" onclick="pickLock()">${T.pickLock}</button></div>`;
}
function pickLock(){
  const tier = R.node.tier||1, spec = CHEST[tier], N = CREED.sections.length;
  const sec = P.creed < N ? P.creed : Math.floor(Math.random()*N);   // the next piece, then any piece once you have them all
  const chunks = creedPieces(CREED.sections[sec].join(' '), spec.pieces);
  modal = {kind:'assembly', phase:'chest', tier, sec, allowed:spec.mistakes, chunks, order:shuffle(chunks.map((c,i)=>i)), next:0, mistakes:0, wrong:null};
  render();
}
function finishChest(m){
  const T = TEXT.rooms, spec = CHEST[m.tier];
  if(m.mistakes > m.allowed){ toast(T.lockHeld); clearColumn(); return; }
  R.talents += spec.talents; let msg = fill(T.chestTalents,{n:spec.talents});
  if(m.sec===P.creed && P.creed < CREED.sections.length){ P.creed++; msg += ' ' + fill(T.creedGained,{n:P.creed, total:CREED.sections.length}); }
  toast(msg); saveHero();
  if(spec.verse){ R.reward = pick(VERSES.filter(x=>!x.ref.startsWith('Galatians') && !R.deck.some(d=>d.ref===x.ref)).map(x=>x.ref),3); if(R.reward.length){ screen='reward'; render(); return; } }
  clearColumn();
}
