/* Cave dives. One view: the tunnel ahead, narration, and "Go left / Go right" when it splits.
   Chests and rest stops open right here under the same scene; fights switch to the arena and come
   back. Each cave ends with a held townsperson whose freeing reopens their building. */
const CAVES = [
  {id:'hollow', boss:'grudge', steps:[
    [{t:'fight',e:['villager']}],
    [{t:'lock',tier:1},{t:'fight',e:['villager']}],
    [{t:'rest'}],
  ]},
  {id:'quarry', boss:'brawler', steps:[
    [{t:'fight',e:['villager']}],
    [{t:'lock',tier:1},{t:'fight',e:['villager','villager']}],
    [{t:'rest'},{t:'fight',e:['villager_strong']}],
    [{t:'lock',tier:2}],
  ]},
  {id:'deep', boss:'slanderer', steps:[
    [{t:'fight',e:['villager']}],
    [{t:'lock',tier:2},{t:'fight',e:['villager_strong']}],
    [{t:'rest'},{t:'lock',tier:2}],
    [{t:'fight',e:['villager_strong','villager']}],
  ]},
];
const FRAGS = [CHUNKS[0]+' '+CHUNKS[1], CHUNKS[2]+' '+CHUNKS[3], CHUNKS[4]+' '+CHUNKS[5], CHUNKS[6]+' '+CHUNKS[7]];   // the Furnace's first fire
function caveSteps(c){ return [...CAVES[c].steps, [{t:'boss', e:[CAVES[c].boss]}]]; }
function caveOpen(i){ return i===0 || !!P.caves[CAVES[i-1].id]; }
function allCavesDone(){ return CAVES.every(c=>P.caves[c.id]); }
function startCave(i){
  if(!caveOpen(i)) return;
  if(R.hp < R.maxHp*0.3){ toast(TEXT.church.tooHurt); return; }
  Object.assign(R, {cave:i, step:0, room:null, node:null, enemies:[], helmUsed:false, boss:null});
  P.run={cave:i, step:0}; saveHero(); goto('caveintro');
}
function caveIntroHTML(){
  const C = TEXT.caves[R.cave];
  return `${caveScene()}${talk('caveintro'+R.cave, C.intro, `<button class="primary wide" onclick="goto('dive')">${TEXT.dive.enter}</button>`)}`;
}
// each cave's scene, with you from behind at the mouth of the tunnel (scene heights in scene pixels)
const CAVE_H = {hollow:160, quarry:160, deep:142};
function caveScene(){ const id = CAVES[R.cave].id, H = CAVE_H[id];
  return sceneHTML(IMG.cave[id], [{html:sprite('back',0,1), x:128, y:H-64, w:64}], H); }
function diveHTML(){
  const C = TEXT.caves[R.cave], D = TEXT.dive, steps = caveSteps(R.cave), opts = steps[R.step];
  const head = `<h1>${C.name}</h1>${caveScene()}<div class="small mute depth">${fill(D.depth,{n:R.step+1, total:steps.length})}</div>`;
  if(R.room==='lock') return head + lockPanel();
  if(R.room==='rest') return head + restPanel();
  const hint = n => D.hints[n.t==='fight' && n.e.length>1 ? 'fightMany' : n.t];
  const boss = opts[0].t==='boss';
  const story = boss ? C.bossLead : opts.length>1 ? D.split : hint(opts[0]);
  const buttons = boss ? `<button class="primary wide" onclick="enterRoom(0)">${D.face}</button>`
    : opts.length>1 ? opts.map((n,i)=>`<button class="primary wide" onclick="enterRoom(${i})">${i?D.right:D.left}<br><span class="sub">${hint(n)}</span></button>`).join('')
    : `<button class="primary wide" onclick="enterRoom(0)">${D.onward}</button>`;
  return `${head}<div class="panel story"><p>${story}</p></div>
    <div class="row divetools"><button onclick="R.gearFrom='dive';goto('gear')">Gear</button><button onclick="R.treeFrom='dive';R.treeSel=null;goto('tree')">Tree</button><button onclick="R.deckFrom='dive';goto('deck')">Deck</button><button onclick="if(confirm(TEXT.dive.leaveConfirm)) retreat()">${D.leave}</button></div>
    <div class="dock">${buttons}</div>`;
}
function enterRoom(i){
  const n0 = caveSteps(R.cave)[R.step][i]; const n = n0.e ? {...n0, e:n0.e.map(standIn)} : n0;
  if(n.t==='boss'){ R.node = {...n, t:'elite', caveBoss:true}; startFight(n.e); return; }
  R.node = n;
  if(n.t==='fight'){ startFight(n.e); return; }
  R.room = n.t; render();
}
// after a fight, chest or rest: on to the next part of the tunnel, or out of the cave after the boss
function clearColumn(){
  R.room=null; R.step++;
  if(R.step >= caveSteps(R.cave).length){ caveDone(); return; }
  P.run={cave:R.cave, step:R.step}; saveHero(); goto('dive');   // mid-cave save: a reload resumes here
}
function caveDone(){
  const id = CAVES[R.cave].id, first = !P.caves[id];
  P.caves[id] = (P.caves[id]||0)+1; P.run = null;
  if(first){ R.talents += 20; }
  R.firstClear = first; saveHero(); goto('cavedone');
}
function caveDoneHTML(){
  const C = TEXT.caves[R.cave];
  return `${caveScene()}${talk('cavedone'+R.cave, C.done, `<button class="primary wide" onclick="R.cave=null;goto('town')">${TEXT.dive.home}</button>`)}`;
}
function rewardHTML(){
  return `<h1>${TEXT.rooms.chestHeading}</h1><h2>${TEXT.rooms.chestTake}</h2><div class="hand">${R.reward.map(ref=>`<div onclick="takeReward('${ref}')">${cardView(BY_REF[ref])}</div>`).join('')}</div>
    <div class="dock"><button class="wide" onclick="clearColumn()">${TEXT.rooms.chestLeave}</button></div>`;
}
function takeReward(ref){ addVerse(ref); clearColumn(); }
function restPanel(){
  return `<div class="panel">${TEXT.rooms.restBody}</div>
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
function lockPanel(){
  const T = TEXT.rooms, spec = CHEST[R.node.tier||1];
  return `<div class="panel"><h2>${T.lockHeading}</h2>${T.lockBody} <span class="mute">${spec.verse?T.lockBig:T.lockSmall}</span></div>
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
