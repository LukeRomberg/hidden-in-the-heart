/* The dungeon map (the Square) and its non-fight rooms. */
const STEPS = [
  {rooms:[{t:'fight',e:['hothead']}]},
  {rooms:[{t:'shrine'}], frag:0},
  {rooms:[{t:'lock'},{t:'fight',e:['grudge']}], frag:1},
  {rooms:[{t:'fight',e:['brawler']}], frag:2},
  {rooms:[{t:'rest'},{t:'lock'}]},
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
  return `<h1>The Square</h1>${statusHTML()}
    <div class="panel" style="padding:0;overflow:hidden"><svg class="dmap" viewBox="0 0 ${MW} ${H}" width="100%" shape-rendering="crispEdges" role="img" aria-label="Dungeon map">${svg}</svg></div>
    <div class="small mute">Tap the lit room to enter it.</div>
    <div class="panel"><h2>${PASSAGE_REF}</h2>${FRAGS.map((f,i)=>`<div class="frag ${R.frags.includes(i)?'have':''}">${R.frags.includes(i)?f:'· · · · · ·'}</div>`).join('')}
    <div class="small mute" style="margin-top:8px">The boss room opens when the passage is whole.</div></div>
    <button onclick="R.gearFrom='map';goto('gear')">Gear</button><button onclick="R.treeFrom='map';R.treeSel=null;goto('tree')">Tree</button><button onclick="R.deckFrom='map';goto('deck')">Deck</button><button onclick="if(confirm('Retreat to town? This mission starts over.')) retreat()">Retreat</button>`;
}
function statusHTML(){ return ''; }
function enterNode(s,i){
  const n = s===-1 ? {t:'boss'} : STEPS[s].rooms[i]; R.node = n; R.next = {n}; goto('corridor');
}
function clearColumn(){ const st=STEPS[R.step]; if(st && st.frag!==undefined && !R.frags.includes(st.frag)) R.frags.push(st.frag); R.step++; goto('map'); }
function proceed(){ const n=R.next.n; if(n.t==='fight'||n.t==='elite') startFight(n.e); else if(n.t==='boss') goto('bossintro'); else goto(n.t); }
function rewardHTML(){
  return `<h1>The chest opens</h1><h2>Take one verse</h2><div class="hand">${R.reward.map(ref=>`<div onclick="takeReward('${ref}')">${cardView(BY_REF[ref])}</div>`).join('')}</div>
    <button class="wide" onclick="clearColumn()">Leave it</button>`;
}
function takeReward(ref){ addVerse(ref); clearColumn(); }
function shrineHTML(){
  return `<h1>Shrine</h1><div class="panel"><h2>${PASSAGE_REF}</h2><div class="verse">${CHUNKS.join(' ')}</div>
    <div class="small mute">Read it twice. It is also a spell, and the boss will ask for it in pieces.</div></div>
    <button class="primary wide" onclick="addVerse('Galatians 5:22-23');R.hp=Math.min(R.maxHp,R.hp+5);toast('Learned Galatians 5:22-23');clearColumn()">Take it as a spell and go on</button>`;
}
function restHTML(){
  return `<h1>Rest</h1><div class="panel">A quiet corner. Choose one.</div>
    <button class="wide" onclick="R.hp=Math.min(R.maxHp,R.hp+12);toast('Healed 12');clearColumn()">Sleep — heal 12</button>
    <button class="wide" onclick="screen='study';render()">Study — practice a verse toward mastery</button>
    <h2 style="margin-top:12px">Or consecrate, then go on resting</h2>${consecrateList()}`;
}
function studyHTML(){
  const refs=[...new Set(R.deck.map(c=>c.ref))];
  return `<h1>Study</h1><div class="panel small mute">A perfect recital counts as one of the three needed to promote the verse.</div>
    ${refs.map(ref=>`<button class="wide" onclick="studyVerse('${ref}')">${spellLine(ref)} · ${TIER_NAME[sp(ref).tier]}</button>`).join('')}`;
}
function studyVerse(ref){ openRecall(BY_REF[ref], (frac)=>{ recordResult(ref,frac); if(frac<1) toast('Not quite. Rest anyway.'); clearColumn(); }, undefined, 'Study'); }
function lockHTML(){
  return `<h1>Lock</h1><div class="panel">The key is a verse you carry, recited one step harder than you know it.</div>
    <button class="primary wide" onclick="pickLock()">Pick the lock</button>`;
}
function pickLock(){
  const c = R.deck[Math.floor(Math.random()*R.deck.length)]; const v=BY_REF[c.ref]; const lvl=Math.min(3, sp(c.ref).tier+1);
  openRecall(v, (frac)=>{ if(frac===1){ R.talents+=15; recordPerfect(c.ref); R.reward=pick(VERSES.filter(x=>!x.ref.startsWith('Galatians') && !R.deck.some(d=>d.ref===x.ref)).map(x=>x.ref),3); screen='reward'; render(); return; } else if(frac>0){ R.talents+=5; toast('It gives, grudgingly. 5 talents.'); } else toast('It holds. You go around.'); clearColumn(); }, lvl, 'Lock');
}
