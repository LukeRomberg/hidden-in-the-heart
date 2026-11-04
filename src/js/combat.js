/* Turn-based combat, card play, enemy turns, and the Furnace boss assembly. */
const ENEMIES = {
  hothead:{hp:12, atk:4, spr:'hothead', pattern:['atk','atk']},
  grudge:{hp:16, atk:3, spr:'grudge', pattern:['atk','vex']},
  brawler:{hp:22, atk:6, spr:'brawler', pattern:['atk','atk','big']},
  slanderer:{hp:30, atk:5, spr:'slanderer', pattern:['vex','atk','atk']},
  furnace:{hp:70, atk:7, spr:'furnace', pattern:['atk','vex','atk','big'], boss:true},
  // townsfolk held by anger: stand-ins once the named person in that room has been freed
  villager:{hp:12, atk:4, pattern:['atk','atk'], villager:true},
  villager_strong:{hp:26, atk:5, pattern:['vex','atk','atk'], villager:true},
};
const PRONOUNS = {he:{he:'he', him:'him', his:'his', He:'He'}, she:{he:'she', him:'her', his:'her', He:'She'}};
function makeEnemy(id, i){
  const e = ENEMIES[id], base = {id, hp:e.hp, max:e.hp, atk:e.atk, pattern:e.pattern, step:i%e.pattern.length, freed:false, boss:!!e.boss};
  if(e.villager){ const k = pickFreed(), v = TEXT.villagers[k]; return {...base, villager:true, name:v.name, pron:v.pronoun, spr:'freed'+k, fk:k}; }
  return {...base, name:TEXT.enemies[id].name, pron:TEXT.enemies[id].pronoun, spr:e.spr};
}
// a named person is freed once; after that their room holds a villager instead
function standIn(id){ const u = UNLOCKS[id]; if(!u || !P.town[u[0]]) return id; return ENEMIES[id].pattern.length>2 ? 'villager_strong' : 'villager'; }
function thanksFor(e){ return e.villager ? TEXT.villagers[e.fk].thanks : THANKS[e.id]; }
const TYPE_MULT = {Patience:1.5, Gentleness:1.25};
function startFight(ids, boss){
  R.enemies = ids.map(makeEnemy);
  R.boss = boss ? {phase:0} : null; R.after=false; R.earned={souls:0,talents:0,leveled:false}; R.castRefs=[]; R.unlockMsg=null;
  R.draw = shuffle(R.deck.slice()); R.hand=[]; R.disc=[]; R.spent=[]; R.turn=0; R.target=0; R.shield=0; R.vexed=false; R.log=[]; R.busy=false;
  newTurn(); R.stumbleUsed=false; R.gentleUsed=false; if(R.tree.Peace>=3) R.shield=5; if(has('lid')||has('faith')) R.shield+=4; R.faithUsed=false; R.gearDropped=null; log(boss? TEXT.fight.bossRoars : R.enemies.length>1 ? fill(TEXT.fight.blocksMany,{names:R.enemies.map(e=>e.name).join(' and ')}) : fill(TEXT.fight.blocksOne,{name:R.enemies[0].name})); goto('fight');
}
function newTurn(){
  R.turn++; R.mana = R.maxMana; R.shield = 0; R.disc.push(...R.hand); R.hand=[]; if(!R.spent) R.spent=[];
  if(!R.draw.length && !R.disc.length && !R.hand.length && R.spent.length){ R.draw=shuffle(R.spent); R.spent=[]; log('You catch your breath. Every verse is ready again.'); }
  for(let i=0;i<4;i++){ if(!R.draw.length){ R.draw = shuffle(R.disc); R.disc=[]; } if(R.draw.length) R.hand.push(R.draw.pop()); }
}
function intentText(e){ const a=e.pattern[e.step]; return a==='atk'?fill(TEXT.fight.intentAttack,{n:e.atk}): a==='big'?fill(TEXT.fight.intentBig,{n:e.atk+3}):TEXT.fight.intentVex; }
function arenaHTML(mini){
  const live = R.enemies.filter(e=>!e.freed);
  const boss = R.enemies.find(e=>e.boss);
  const glow = boss ? 0.35 + 0.65*(1 - Math.max(0,boss.hp)/boss.max) : 0.25;
  const embers = mini ? '' : Array.from({length:14},(_,i)=>`<div class="ember" style="left:${8+(i*37)%84}%;animation-duration:${2.2+(i%5)*0.5}s;animation-delay:${(i*0.37)%2.5}s"></div>`).join('');
  const enemies = R.enemies.map((e,i)=>{ const sc = mini ? (e.boss?3.5:3) : (e.boss?6.2:7); const right = mini ? 14 : (i===0 ? 24 : 128);
    const cls = ['en', e.freed?'wave':'', (!e.freed && e.pattern[e.step]==='big')?'windup':''].join(' ');
    let sn, ssc, top, f0=0, f1=1, held='';
    if(e.villager || (e.freed && !ENEMY_IMG[e.spr+'_f'])){   // townsfolk sprites: same person held (tinted) and freed
      sn = e.villager ? e.spr : 'freed'+(e.fk||0); ssc = mini?0.8:1.6; top = mini?11:8; if(!e.freed){ f1=0; held=' held'; } }
    else { const own = e.freed; sn = own ? e.spr+'_f' : e.spr; ssc = sc; const EI=ENEMY_IMG[sn];
      top = mini ? Math.max(0, 62-Math.round(EI.h*enemyK(sc))) : Math.max(0, 106-Math.round(EI.h*enemyK(sc))); }
    return `<div class="${cls}" id="en${i}" style="right:${right}px;top:${top}px" onclick="if(!R.busy){R.target=${i};render()}">${sprite(sn,f0,ssc,'f0'+held)}${sprite(sn,f1,ssc,'f1'+held)}</div>`; }).join('');
  const t = R.enemies[R.target] && !R.enemies[R.target].freed ? R.enemies[R.target] : live[0];
  const info = mini ? '' : `${t?'':'<!--'}<div class="info e"><div>${t?t.name:''}${t&&t.boss&&R.boss?' · fires '+(3-R.boss.phase):''} ${R.enemies.length>1?'<span class="mute">(target)</span>':''}</div><div class="bar hp"><i style="width:${t?100*Math.max(0,t.hp)/t.max:0}%"></i></div><div class="small">${t?Math.max(0,t.hp)+'/'+t.max:''}</div></div>
    ${t?'':'-->'}<div class="info p"><div>You</div><div class="bar hp"><i style="width:${100*R.hp/R.maxHp}%"></i></div><div class="small">HP ${R.hp}/${R.maxHp}${R.shield?' · shield '+R.shield:''}</div><div class="bar mn"><i style="width:${100*R.mana/R.maxMana}%"></i></div><div class="small">Mana ${R.mana}/${R.maxMana}</div></div>`;
  return `<div class="arena ${mini?'mini':''}" id="arena"><div class="bg">${arenaBG(!!boss)}<div class="glow" style="opacity:${glow}"></div>${embers}</div>
    <div class="plat e"></div><div class="plat p"></div>${enemies}
    ${R.shield&&!mini?'<div class="barrier"></div>':''}${R.vexed&&!mini?'<div class="vex">#!?</div>':''}
    <div class="pl" id="pl" ${mini?'style="left:14px;bottom:8px"':''}>${sprite('back',0,mini?1:2.2,'f0')}${sprite('back',1,mini?1:2.2,'f1')}</div>
    ${info}<div class="fx" id="fx"></div></div>`;
}
// Never more than max mana: an unaffordable card would sit in the hand forever and the deck would never refresh.
function cardCost(v){ let c=spellCost(v)+(R.vexed?1:0); if(R.tree.Gentleness>=3 && v.type==='Gentleness' && !R.gentleUsed) c=0; return Math.min(c, R.maxMana); }
function fightHTML(){
  const hand = R.hand.map((c,i)=>{ const v=BY_REF[c.ref]; const cost=cardCost(v);
    return cardHTML(v,{cost, cls:cost>R.mana?'dim':'', click:`playCard(${i})`}); }).join('');
  const intents = R.enemies.filter(e=>!e.freed).map(e=>`${e.name} ${intentText(e)}`).join('. ');
  const bottom = R.after ? afterHTML() : `${R.tutorial?`<div class="coach">${coachLine()}</div>`:''}<div class="small mute" style="margin-bottom:8px">${intents}.${R.enemies.length>1?TEXT.fight.targetHint:''}</div>
    <div class="hand">${hand}</div>
    <button class="primary wide" onclick="endTurn()">End turn</button>
    ${R.tree.Patience>=2?`<button class="wide" ${R.charge?'disabled':''} onclick="charge()">${R.charge?TEXT.fight.charged:TEXT.fight.charge}</button>`:''}`;
  return `${arenaHTML(false)}<div class="textbox" id="log">${R.log.map(m=>`<div>${m}</div>`).join('')}</div>${bottom}`;
}
function afterHTML(){
  const due = treeDue();
  const bar=(pct,cls)=>`<div class="bar ${cls}"><i style="width:${Math.round(Math.min(1,pct)*100)}%"></i></div>`;
  const spells = (R.castRefs||[]).map(ref=>{ const s=sp(ref); const done=s.tier===3&&s.n>=maxN(ref);
    return `<div class="stat small"><span class="t-${BY_REF[ref].type}">${spellLine(ref)}</span><span>${done?'complete':TIER_NAME[s.tier]+' \u00b7 '+s.perf+'/3'}</span></div>${bar(done?1:s.perf/3,'mn')}${s.fails?`<div class="small t-Goodness">${fill(TEXT.afterFight.slipsWarning,{n:s.fails})}</div>`:''}`; }).join('');
  return `<div class="panel"><h2>Earned</h2>${R.unlockMsg?`<div class="small t-Gentleness">${R.unlockMsg}</div>`:''}
    <div class="stat"><span>Souls saved</span><span>+${R.earned.souls}</span></div>
    <div class="stat small"><span>${R.earned.leveled?`Level ${R.level}!`:`Level ${R.level}`}</span><span>${R.xp}/${xpNeed(R.level)} to level ${R.level+1}</span></div>${bar(R.xp/xpNeed(R.level),'hp')}
    <div class="stat"><span>Talents</span><span>+${R.earned.talents} \u00b7 ${R.talents} total</span></div>
    ${spells?`<h2 style="margin-top:10px">Spells</h2>${spells}`:''}
    ${due>0?`<div class="stat t-Gentleness"><span>Level ${R.level}</span><span>${TEXT.afterFight.fruitCanGrow}</span></div>`:''}${R.pendingDrop?`<div class="stat t-Love"><span>Dropped</span><span>${R.pendingDrop}</span></div>`:''}${R.gearDropped?`<div class="stat t-Patience"><span>${TEXT.afterFight.foundGear}</span><span>${ITEMS[R.gearDropped].name}</span></div><div class="small mute">${ITEMS[R.gearDropped].perk}</div>`:''}${has('boots')||has('sabatons')?`<div class="small mute">${TEXT.afterFight.bootsHeal}</div>`:''}</div>
    ${R.gearDropped?`<button class="wide" onclick="R.gearFrom='fight';goto('gear')">See your gear</button>`:''}
    ${R.pendingDrop?`<button class="wide" onclick="addVerse(R.pendingDrop);R.pendingDrop=null;render()">Take ${R.pendingDrop}</button>`:''}
    ${due>0?`<button class="wide" onclick="R.treeFrom='fight';R.treeSel=null;goto('tree')">${TEXT.afterFight.growTree}</button>`:''}
    <button class="primary wide" onclick="${R.boss?'victory()':R.tutorial?'finishTutorial()':'clearColumn()'}">${R.boss?TEXT.afterFight.leaveRoom:TEXT.afterFight.moveOn}</button>`;
}
function playCard(i){
  if(R.busy || R.after) return;
  const c = R.hand[i]; const v = BY_REF[c.ref]; const cost = cardCost(v);
  if(cost>R.mana){ toast(TEXT.fight.notEnoughMana); return; }
  openRecall(v, async (frac)=>{
    R.busy=true; R.mana -= cost; R.vexed = false; R.hand.splice(i,1); R.spent.push(c); if(!R.castRefs.includes(c.ref)) R.castRefs.push(c.ref);
    if(R.tree.Gentleness>=3 && v.type==='Gentleness' && !R.gentleUsed) R.gentleUsed=true;
    P.casts[c.ref]=(P.casts[c.ref]||0)+1; save();
    let eff = frac; if(frac<1 && R.tree.Peace>=2 && !R.stumbleUsed){ R.stumbleUsed=true; eff=1; }
    let mult = eff===1?1: eff>0? 0.5+0.5*eff : 0.3;
    const SM = spellMult(c.ref); if(has('sword') && sp(c.ref).tier===3) mult *= 1.25;
    if(frac===1 && (has('belt')||has('truth'))) R.shield += 2;
    if(frac===1 && has('truth')) mult *= 1.25;
    recordResult(c.ref, frac);
    const weak = eff<1; const tier = v.dmg>=12?3: (v.dmg>=7||v.heal||v.shield)?2:1;
    let t = R.enemies[R.target]; if(!t||t.freed) t = R.enemies.find(e=>!e.freed); const ti = R.enemies.indexOf(t);
    render();
    const pl=document.getElementById('pl'); if(pl) pl.classList.add('cast');
    log(fill(weak?TEXT.fight.speakHalting:TEXT.fight.speak,{ref:passRef(c.ref,sp(c.ref).n)})); if(frac<1&&!weak) log(TEXT.fight.peaceSteadies);
    await castFX(v.type, tier, weak, center('pl'), v.dmg?center('en'+ti):center('pl'));
    if(pl) pl.classList.remove('cast');
    if(v.dmg){
      const base = v.dmg*SM + (R.tree.Patience>=1 && v.type==='Patience' ? 1 : 0) + (has('bible')?1:0) + (has('sword')?3:0);
      const dmg = Math.round(base*mult*(TYPE_MULT[v.type]||1)*(R.charge?2:1)); if(R.charge){ R.charge=false; log(TEXT.fight.chargedLands); }
      if(R.tree.Gentleness>=1) R.shield += 2;
      if(R.tree.Patience>=3 && frac===1 && v.type==='Patience' && !t.boss){ t.stun=true; log(fill(TEXT.fight.dazed,{name:t.name})); }
      t.hp -= dmg; const el=document.getElementById('en'+ti); if(el){ el.classList.add('hit'); setTimeout(()=>el.classList.remove('hit'),320); }
      log(fill(TYPE_MULT[v.type]?TEXT.fight.takesType:TEXT.fight.takes,{name:t.name, n:dmg, type:v.type})); await sleep(350);
      if(has('sabatons') && !t.boss && t.hp>0 && t.hp<=t.max*0.15){ log(fill(TEXT.fight.givesUp,{name:t.name, ...PRONOUNS[t.pron]})); t.hp=0; }
      if(t.hp<=0){ if(t.boss){ R.busy=false; bossAssembly('final'); return; } t.freed=true; const tal=5+(R.tree.Gentleness>=2?5:0); R.talents+=tal; R.earned.talents+=tal; gainXP(R.node&&R.node.t==='elite'?2:1); townUnlock(t.id); log(fill(TEXT.fight.freed,{name:t.name, ...PRONOUNS[t.pron]})); await freedFX(ti); log(thanksFor(t)); }
      else if(t.boss) checkBossPhase(t);
    } else if(v.shield){ const s=Math.round(v.shield*SM*mult); R.shield+=s; log(fill(TEXT.fight.barrier,{n:s})); }
    else if(v.heal){ const h=Math.round(v.heal*SM*mult); R.hp=Math.min(R.maxHp,R.hp+h); log(fill(TEXT.fight.healed,{n:h})); }
    R.busy=false;
    if(modal){ render(); return; }
    if(R.enemies.every(e=>e.freed)){ fightWon(); return; }
    render();
  });
}
async function endTurn(){
  if(R.busy || R.after) return; R.busy=true;
  for(const e of R.enemies){ if(e.freed) continue;
    if(e.stun){ e.stun=false; log(fill(TEXT.fight.standsDazed,{name:e.name})); await sleep(300); continue; }
    const a=e.pattern[e.step]; e.step=(e.step+1)%e.pattern.length; const i=R.enemies.indexOf(e);
    const el=document.getElementById('en'+i); if(el){ el.classList.remove('windup'); el.classList.add('lunge'); }
    await sleep(200);
    if(a==='vex'){ if(has('faith')) log(fill(TEXT.fight.vexBlocked,{name:e.name})); else { R.vexed=true; log(fill(TEXT.fight.vexed,{name:e.name})); } }
    else if(has('faith') && !R.faithUsed){ R.faithUsed=true; log(fill(TEXT.fight.glances,{name:e.name})); }
    else { let d = a==='big'? e.atk+3 : e.atk; if(has('breast')) d=Math.max(0,d-2); const absorbed=Math.min(R.shield,d); R.shield-=absorbed; d-=absorbed; R.hp-=d;
      const pl=document.getElementById('pl'); if(pl){ pl.classList.add('hit'); setTimeout(()=>pl.classList.remove('hit'),320); }
      log(fill(a==='big'?TEXT.fight.slams:TEXT.fight.strikes,{name:e.name, n:d, absorbed:absorbed?fill(TEXT.fight.absorbed,{n:absorbed}):''})); }
    await sleep(300); if(el) el.classList.remove('lunge');
    if(R.hp<=0 && has('helm') && !R.helmUsed){ R.helmUsed=true; R.hp=1; log(TEXT.fight.helmetHolds); }
    if(R.hp<=0){ R.busy=false; defeat(); return; }
  }
  newTurn(); R.busy=false; render();
}
function charge(){ if(R.busy||R.charge) return; R.charge=true; log(TEXT.fight.chargeLog); endTurn(); }
function fightWon(){
  R.pendingDrop = (R.node && R.node.t==='elite' && !R.deck.some(c=>c.ref==='Romans 12:19')) ? 'Romans 12:19' : null; R.dropFrom = R.enemies[0] && R.enemies[0].name;
  if(has('boots')||has('sabatons')){ R.hp=Math.min(R.maxHp,R.hp+4); }
  if(!R.boss && !R.tutorial && (R.node && R.node.t==='elite' || Math.random()<0.5)){ const g=gearDrop(); if(g){ equip(g); R.gearDropped=g; } }
  R.after=true; render();
}
function nextAfterFight(){
  if(R.pendingDrop){ screen='drop'; render(); return; }
  clearColumn();
}
function dropHTML(){ const v=BY_REF[R.pendingDrop]; return `<h1>${TEXT.drop.heading}</h1><div class="panel small">${fill(TEXT.drop.body,{name:R.dropFrom||''})}</div><div class="hand">${cardView(v)}</div><button class="primary wide" onclick="R.deck.push({ref:R.pendingDrop});R.pendingDrop=null;nextAfterFight()">${TEXT.drop.take}</button>`; }
function enterBoss(){ startFight(['furnace'], true); }
function checkBossPhase(t){
  const th = [Math.floor(t.max*0.66), Math.floor(t.max*0.33)];
  if(R.boss.phase<2 && t.hp<=th[R.boss.phase]){ bossAssembly(R.boss.phase); }
}
function bossAssembly(phase){
  const chunks = phase===0 ? FRAGS : CHUNKS;
  modal = {kind:'assembly', phase, chunks, order:shuffle(chunks.map((c,i)=>i)), next:0, mistakes:0, wrong:null};
  render();
}
function tapChunk(i){
  const m = modal;
  if(i===m.next){ m.next++; m.wrong=null; if(m.next===m.chunks.length){ finishAssembly(); return; } }
  else { m.mistakes++; m.wrong=i; if(m.phase==='chest' && m.mistakes>m.allowed){ finishAssembly(); return; } }
  render();
}
function slips(n){ return `${n} slip${n>1?'s':''}`; }
async function finishAssembly(){
  const m = modal; modal=null; if(m.phase==='chest'){ finishChest(m); return; } const boss = R.enemies[0];
  if(m.phase==='final'){
    if(m.mistakes===0){ R.busy=true; boss.freed=true; render(); await freedFX(0); log(THANKS.furnace); R.busy=false; fightWon(); return; }
    boss.hp = Math.min(24, 6*m.mistakes); log(fill(TEXT.boss.lastFlares,{slips:slips(m.mistakes)}));
  } else {
    R.boss.phase++;
    if(m.mistakes===0){ boss.hp = Math.max(1, boss.hp-8); boss.stun=true; log(fill(TEXT.boss.fireDazed,{n:R.boss.phase})); }
    else { const heal=Math.min(12,4*m.mistakes); boss.hp=Math.min(boss.max,boss.hp+heal); log(fill(TEXT.boss.fireFlares,{slips:slips(m.mistakes), n:heal})); }
  }
  render();
}
function assemblyHTML(){
  const m = modal;
  const placed = m.chunks.slice(0,m.next).join(' ');
  const chips = m.order.map(i=>`<span class="chip ${i<m.next?'placed':''} ${m.wrong===i?'wrong':''}" onclick="tapChunk(${i})">${m.chunks[i]}</span>`).join('');
  if(m.phase==='chest'){ const T=TEXT.rooms;
    return `<div class="overlay"><div class="panel"><h2>${fill(T.chestCreed,{n:m.sec+1, total:CREED.sections.length})}</h2>
      <div class="small mute">${T.chestTap} ${fill(T.chestMistakes,{n:m.mistakes, max:m.allowed})}</div>
      <div class="seq">${placed||'&nbsp;'}</div><div>${chips}</div></div></div>`; }
  const title = m.phase==='final' ? TEXT.boss.lastFire : fill(TEXT.boss.fireOut,{n:m.phase+1});
  return `<div class="overlay"><div class="panel"><h2>${title} — ${PASSAGE_REF}</h2>${arenaHTML(true)}
    <div class="small mute">${TEXT.boss.assemble}${m.phase==='final'?TEXT.boss.assembleFinal:TEXT.boss.assemblePhase} Mistakes: ${m.mistakes}</div>
    <div class="seq">${placed||'&nbsp;'}</div>
    <div>${chips}</div></div></div>`;
}
