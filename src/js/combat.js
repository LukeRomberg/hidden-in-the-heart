/* Turn-based combat, card play, enemy turns, and the Furnace boss assembly. */
const STEADY_DMG = 0.65;   // a cast at least this accurate hits for its accuracy; below it, half that
const ENEMIES = {
  hothead:{hp:24, atk:3, spr:'hothead', pattern:['atk','atk']},   // Bram, the tutorial (you start it groggy, so you run dry)
  grudge:{hp:48, atk:4, spr:'grudge', pattern:['atk','vex']},
  brawler:{hp:60, atk:6, spr:'brawler', pattern:['atk','atk','big']},
  slanderer:{hp:72, atk:5, spr:'slanderer', pattern:['vex','atk','atk']},
  furnace:{hp:28, atk:2, spr:'furnace', freedSpr:'hothead_f', pattern:['atk','vex','atk','big'], boss:true},
  // townsfolk held by anger: stand-ins once the named person in that room has been freed
  villager:{hp:22, atk:4, pattern:['atk','atk'], villager:true},
  villager_strong:{hp:38, atk:5, pattern:['vex','atk','atk'], villager:true},
};
const PRONOUNS = {he:{he:'he', him:'him', his:'his', He:'He'}, she:{he:'she', him:'her', his:'her', He:'She'}};
function makeEnemy(id, i){
  const e = ENEMIES[id], base = {id, hp:e.hp, max:e.hp, atk:e.atk, pattern:e.pattern, step:i%e.pattern.length, freed:false, boss:!!e.boss};
  let en;
  if(e.villager){ const k = pickFreed(), v = TEXT.villagers[k]; en = {...base, villager:true, name:v.name, pron:v.pronoun, spr:'freed'+k, fk:k}; }
  else en = {...base, name:TEXT.enemies[id].name, pron:TEXT.enemies[id].pronoun, spr:e.spr, freedSpr:e.freedSpr};
  en.move = moveFor(en); return en;
}
// a named person is freed once; after that their room holds a villager instead
function standIn(id){ const u = UNLOCKS[id]; if(!u || !P.town[u[0]]) return id; return ENEMIES[id].pattern.length>2 ? 'villager_strong' : 'villager'; }
function thanksFor(e){ return e.villager ? TEXT.villagers[e.fk].thanks : THANKS[e.id]; }
// ---- What the held say, and the lines that tell a fight (all of it in TEXT.foes and TEXT.fight) ----
// the named townsfolk, by the sin that held them (their speaker id, for the freeing beat and the after-fight panel)
const FREED_AS = {furnace:'blacksmith', hothead:'blacksmith', grudge:'innkeeper', brawler:'drill', slanderer:'scribe'};
function freedName(e){ return e.villager ? e.name : TEXT.speakers[FREED_AS[e.id]] || e.name; }
function foe(e){ return TEXT.foes[e.villager ? 'villager' : e.id] || TEXT.foes.villager; }
function foeVars(e){ return {name:e.name, ...PRONOUNS[e.pron]}; }
// a random line from a pool that isn't one of the last couple it gave
const VARY = new WeakMap();
function vary(pool){
  if(!Array.isArray(pool)) return pool; if(pool.length<2) return pool[0];
  const recent = (VARY.get(pool)||[]).slice(-Math.min(2, pool.length-1));
  const opts = pool.map((x,i)=>i).filter(i=>!recent.includes(i)); const i = opts[Math.floor(Math.random()*opts.length)];
  VARY.set(pool, [...recent, i]); return pool[i];
}
function pickLine(pool, vars){ return fill(vary(pool), vars); }
// what the enemy's next move is called, said in the log when it lands
function moveFor(e){ const f = foe(e); return vary(f[e.pattern[e.step]] || f.atk); }
// the sin speaks in its own voice, and changes its tune as it loses its grip
function moodOf(e){ return e.hp<=e.max*0.2 ? 'crack' : e.hp<=e.max*0.5 ? 'waver' : null; }
function tauntFor(e){ const f = foe(e), m = moodOf(e); return vary(m && f[m] || f.taunts); }
function quoted(s){ return s.includes('\u201c') ? s : '\u201c'+s+'\u201d'; }
function openerLine(){
  const O = TEXT.fight.openers, en = R.enemies, e = en[0];
  if(R.boss) return TEXT.fight.bossRoars;
  if(en.length===1 && O[e.id]) return O[e.id];
  if(en.every(x=>x.villager)) return en.length>1 ? pickLine(O.villagerMany,{names:en.map(x=>x.name).join(' and ')}) : pickLine(O.villagerOne, foeVars(e));
  return en.length>1 ? fill(TEXT.fight.blocksMany,{names:en.map(x=>x.name).join(' and ')}) : fill(TEXT.fight.blocksOne,{name:e.name});
}
// a speech bubble over enemy i; it stays until you speak again
function speak(i, text, react){
  R.say = {i, text, turn:R.turn, react:!!react};
  const old = document.getElementById('say'); if(old) old.remove();
  const a = document.getElementById('arena'); if(!a) return;
  a.insertAdjacentHTML('beforeend', sayHTML()); placeSay();
}
function sayHTML(){ const s = R.say; if(!s || !R.enemies[s.i] || R.enemies[s.i].freed) return ''; return `<div class="say" id="say" data-i="${s.i}">${s.text}</div>`; }
// where the speech bubble goes, clear of the enemy's HP box, tail pointing at the speaker:
// above their head if there's room, else beside it if there's room, else over it
function placeSay(){
  const b = document.getElementById('say'), a = document.getElementById('arena'); if(!b || !a) return;
  const en = document.getElementById('en'+b.dataset.i); if(!en) return;
  const ar = a.getBoundingClientRect(), r = en.getBoundingClientRect(), ox = ar.left+a.clientLeft, oy = ar.top+a.clientTop, W = a.clientWidth;
  const box = a.querySelector('.info.e'), clear = box ? box.getBoundingClientRect().right-ox+6 : 6;
  const cx = r.left-ox+r.width/2, vis = r.left-ox+r.width*0.15, gap = vis-10-clear;   // sprites have clear padding at the sides
  if(b.offsetHeight+14 > r.top-oy && gap >= 90){
    b.classList.add('side'); b.style.maxWidth = gap+'px';
    b.style.left = (vis-10-b.offsetWidth)+'px'; b.style.top = Math.max(4, r.top-oy)+'px'; return; }
  const bw = b.offsetWidth, bh = b.offsetHeight;
  const top = Math.max(4, r.top-oy-bh-10), left = Math.max(Math.min(clear, W-bw-6), Math.min(W-bw-6, cx-bw/2));
  b.style.left = left+'px'; b.style.top = top+'px'; b.style.setProperty('--tail', Math.max(10, Math.min(bw-22, cx-left-8))+'px');
}
// the hero's own thoughts: now and then, never two close together (force: always, once)
function think(kind, vars={}, force){
  if(!force && (R.turn-(R.thoughtAt??-9) < 3 || Math.random()<0.5)) return;
  R.thoughtAt = R.turn; log(`<span class="thought">${pickLine(TEXT.fight.thoughts[kind], vars)}</span>`);
}
// after a hit: below half they waver, near the end they crack (said once each, right away)
function reactTo(e, i){
  const m = moodOf(e); if(!m || e.mood===m) return; e.mood = m;
  speak(i, vary(foe(e)[m]), true); if(m==='waver') think('waver', foeVars(e));
}
// the freeing moment: the sin lets go, smoke, the person underneath, and what they say
async function freeBeat(t, ti){
  log(fill(TEXT.fight.freed, foeVars(t))); R.say = null; const b = document.getElementById('say'); if(b) b.remove();
  await freedFX(ti); const th = thanksFor(t);
  await thanksBeat(t, quoted(th)); log(quoted(th));
}
const TYPE_MULT = {Patience:1.5, Gentleness:1.25};
function startFight(ids, boss){
  R.enemies = ids.map(makeEnemy);
  R.boss = boss ? {phase:0} : null; R.after=false; R.earned={souls:0,talents:0,leveled:false}; R.castRefs=[]; R.castLog=[]; R.unlockMsg=null; R.say=null; R.thoughtAt=-9; R.hurtSaid=false;
  R.spent=[]; R.focus = R.tutorial ? Math.min(R.maxFocus, TUTORIAL_FOCUS) : R.maxFocus; R.brace=false; R.turn=0; R.target=0; R.shield=0; R.vexed=false; R.log=[]; R.busy=false;
  newTurn(); R.stumbleUsed=false; R.gentleUsed=false; if(R.tree.Peace>=3) R.shield=5; if(has('lid')||has('faith')) R.shield+=4; R.faithUsed=false; R.gearDropped=null;
  log(openerLine()); if(!R.tutorial) think('start'); goto('fight'); setTimeout(()=>{ if(screen==='fight' && !R.after) turnBanner(TEXT.fight.yourTurn, true); }, 680);
}
// One action a turn: say one verse (costs focus), Brace, or Charge. Then the enemies act.
// Focus does not come back during a fight, except through a verse like Romans 12:2.
function newTurn(){
  R.turn++; R.shield = 0; R.brace = false;
  // each verse works once; when nothing unsaid is affordable, they all come back
  if(R.spent.length && !unsaid().some(ref=>affordable(ref))){ R.spent=[]; log(TEXT.fight.ready); }
  if(R.tutorial && !R.deck.some(c=>c.ref==='Romans 12:2') && !unsaid().some(ref=>affordable(ref))){
    addVerse('Romans 12:2'); R.gift=true; log(TEXT.tutorial.giftLog); }
}
function verseRefs(){ return [...new Set(R.deck.map(c=>c.ref))]; }
function unsaid(){ return verseRefs().filter(ref=>!R.spent.includes(ref)); }
function affordable(ref){ return cardCost(BY_REF[ref]) <= R.focus; }
function infoTarget(){ const t = R.enemies[R.target]; return t && !t.freed ? t : R.enemies.find(e=>!e.freed); }
function playerHPText(){ return `HP ${Math.max(0,R.hp)}/${R.maxHp}${R.shield?' \u00b7 shield '+R.shield:''}`; }
// two layers per bar: the colour drains first, a pale trail follows it down (see /* battle feel */)
const barHTML = (id, pct) => `<b class="lag" id="${id}L" style="width:${pct}%"></b><i id="${id}" style="width:${pct}%"></i>`;
// move the bars to where things stand now without redrawing the screen, so they drain
function barsSync(){
  const set=(id,pct)=>{ for(const k of [id, id+'L']){ const el=document.getElementById(k); if(el) el.style.width=Math.max(0,Math.min(100,pct))+'%'; } };
  const txt=(id,s)=>{ const el=document.getElementById(id); if(el) el.textContent=s; };
  const t = infoTarget(); if(t){ set('ebar', 100*Math.max(0,t.hp)/t.max); txt('ebarn', Math.max(0,t.hp)+'/'+t.max); }
  set('pbar', 100*Math.max(0,R.hp)/R.maxHp); txt('pbarn', playerHPText());
  set('fbar', 100*R.focus/R.maxFocus); txt('fbarn', `${TEXT.fight.focus} ${R.focus}/${R.maxFocus}`);
}
function arenaHTML(mini){
  // the battle scene shrinks on short screens (k = scale) so it, the log and the cards all fit
  const H = mini ? 0 : Math.round(Math.min(260, Math.max(160, (window.innerHeight||800)*0.31))), k = mini ? 1 : H/260;
  const live = R.enemies.filter(e=>!e.freed);
  const boss = R.enemies.find(e=>e.boss);
  const glow = boss ? 0.35 + 0.65*(1 - Math.max(0,boss.hp)/boss.max) : 0.25;
  const embers = mini ? '' : Array.from({length:14},(_,i)=>`<div class="ember" style="left:${8+(i*37)%84}%;animation-duration:${2.2+(i%5)*0.5}s;animation-delay:${(i*0.37)%2.5}s"></div>`).join('');
  const enemies = R.enemies.map((e,i)=>{ const sc = mini ? (e.boss?3.5:3) : (e.boss?6.2:7)*k; const right = mini ? 14 : Math.round((i===0 ? 24 : 128)*k);
    const cls = ['en', e.freed?'wave':'', (!e.freed && e.pattern[e.step]==='big')?'windup':''].join(' ');
    let sn, ssc, top, f0=0, f1=1, held='';
    if(e.villager || (e.freed && !ENEMY_IMG[e.spr+'_f'])){   // townsfolk sprites: same person held (tinted) and freed
      sn = e.villager ? e.spr : 'freed'+(e.fk||0); ssc = mini?0.8:1.6*k; top = mini?11:Math.round(8*k); if(!e.freed){ f1=0; held=' held'; } }
    else { const own = e.freed; sn = own ? (e.freedSpr || e.spr+'_f') : e.spr; ssc = sc; const EI=ENEMY_IMG[sn];
      top = mini ? Math.max(0, 62-Math.round(EI.h*enemyK(sc))) : Math.max(0, Math.round(106*k-EI.h*enemyK(sc))); }
    return `<div class="${cls}" id="en${i}" style="right:${right}px;top:${top}px" onclick="if(!R.busy){R.target=${i};render()}">${sprite(sn,f0,ssc,'f0'+held)}${sprite(sn,f1,ssc,'f1'+held)}</div>`; }).join('');
  const t = infoTarget();
  const info = mini ? '' : `${t?'':'<!--'}<div class="info e"><div>${t?t.name:''}${t&&t.boss&&R.boss?' · fires '+(3-R.boss.phase):''} ${R.enemies.length>1?'<span class="mute">(target)</span>':''}</div><div class="bar hp">${barHTML('ebar', t?100*Math.max(0,t.hp)/t.max:0)}</div><div class="small" id="ebarn">${t?Math.max(0,t.hp)+'/'+t.max:''}</div></div>
    ${t?'':'-->'}<div class="info p"><div>You</div><div class="bar hp">${barHTML('pbar', 100*Math.max(0,R.hp)/R.maxHp)}</div><div class="small" id="pbarn">${playerHPText()}</div><div class="bar mn">${barHTML('fbar', 100*R.focus/R.maxFocus)}</div><div class="small" id="fbarn">${TEXT.fight.focus} ${R.focus}/${R.maxFocus}</div></div>`;
  return `<div class="arena ${mini?'mini':''}" id="arena" ${mini?'':`style="height:${H}px;--k:${k.toFixed(3)}"`}><div class="bg">${arenaBG(!!boss)}<div class="glow" style="opacity:${glow}"></div>${embers}</div>
    <div class="plat e"></div><div class="plat p"></div>${enemies}
    ${R.shield&&!mini?'<div class="barrier"></div>':''}${R.vexed&&!mini?'<div class="vex">#!?</div>':''}
    <div class="pl" id="pl" ${mini?'style="left:14px;bottom:8px"':''}>${sprite('back',0,mini?1:2.2*k,'f0')}${sprite('back',1,mini?1:2.2*k,'f1')}</div>
    ${info}${mini?'':sayHTML()}<div class="fx" id="fx"></div></div>`;
}
// Never more than max focus, so every verse can be said on a full mind.
function cardCost(v){ let c=spellCost(v)+(R.vexed?1:0); if(R.tree.Gentleness>=3 && v.type==='Gentleness' && !R.gentleUsed) c=0; return Math.min(c, R.maxFocus); }
function fightHTML(){
  // ready verses first, then ones you can't afford yet, then ones already said
  const rank = ref => R.spent.includes(ref) ? 2 : cardCost(BY_REF[ref])>R.focus ? 1 : 0;
  const hand = verseRefs().map((ref,i)=>[ref,i]).sort((a,b)=>rank(a[0])-rank(b[0]) || a[1]-b[1]).map(([ref])=>{ const v=BY_REF[ref]; const cost=cardCost(v);
    return cardHTML(v,{cost, cls:R.spent.includes(ref)?'spent':cost>R.focus?'dim':'', click:`playCard('${ref}')`}); }).join('');
  if(R.say) queueMicrotask(placeSay);   // once the arena is on screen
  // the cards ride in the pinned bottom bar as a side-scrolling row, so the battle stays in view
  // the tutorial teaches with popups (tutorialTip, below), not a box in the way
  const bottom = R.after ? afterHTML() : `<div class="dock fightdock">
    <div class="hand hscroll">${hand}</div>
    <button class="wide" onclick="brace()">${TEXT.fight.brace}</button>
    ${R.tree.Patience>=2?`<button class="wide" ${R.charge?'disabled':''} onclick="charge()">${R.charge?TEXT.fight.charged:TEXT.fight.charge}</button>`:''}</div>`;
  // everything that happens, back and forth, in one box under the battle. What they'll do next isn't shown (Luke's call).
  const next = R.after || R.enemies.filter(e=>!e.freed).length<2 ? '' : `<div class="hint">${TEXT.fight.targetHint}</div>`;
  return `${arenaHTML(false)}<div class="textbox"><div id="log">${R.log.map(m=>`<div>${m}</div>`).join('')}</div>${next}</div>${bottom}`;
}
// how a cast went, for the after-fight panel
function castResult(frac){ return frac===1 ? 'perfect' : frac>=SLIP_BELOW ? 'steady' : 'slipped'; }
function afterHTML(){
  const A = TEXT.afterFight, due = treeDue();
  const bar=(pct,cls)=>`<div class="bar ${cls}"><i style="width:${Math.round(Math.min(1,pct)*100)}%"></i></div>`;
  const freed = R.enemies.filter(e=>e.freed).map(freedName).join(', ');
  const spells = (R.castRefs||[]).map(ref=>{ const s=sp(ref); const done=s.tier===3&&s.n>=maxN(ref);
    const casts = (R.castLog||[]).filter(c=>c.ref===ref).map(c=>{ const r=castResult(c.frac); return `<span class="res ${r}">${A.result[r]}</span>`; }).join(' ');
    return `<div class="verse-res"><div class="stat small"><span class="t-${BY_REF[ref].type}">${spellLine(ref)}</span><span>${casts}</span></div>
      <div class="stat small mute"><span>${done?A.complete:TIER_NAME[s.tier]}</span><span>${done?'':s.perf+'/3'}</span></div>${bar(done?1:s.perf/3,'mn')}${s.fails?`<div class="small t-Goodness">${fill(A.slipsWarning,{n:s.fails})}</div>`:''}</div>`; }).join('');
  return `<div class="panel afterfight"><h2>${A.heading}</h2>${freed?`<div class="stat freed"><span>${A.freed}</span><span>${freed}</span></div>`:''}${R.unlockMsg?`<div class="small t-Gentleness">${R.unlockMsg}</div>`:''}
    ${R.boss?'':`<div class="stat"><span>${A.souls}</span><span>+${R.earned.souls}</span></div>`}
    <div class="stat small"><span>${R.earned.leveled?`Level ${R.level}!`:`Level ${R.level}`}</span><span>${R.xp}/${xpNeed(R.level)} to level ${R.level+1}</span></div>${bar(R.xp/xpNeed(R.level),'hp')}
    ${R.boss?'':`<div class="stat"><span>${A.talents}</span><span>+${R.earned.talents} \u00b7 ${R.talents} total</span></div>`}
    ${spells?`<h2 style="margin-top:10px">${A.verses}</h2>${spells}`:''}
    ${due>0?`<div class="stat t-Gentleness"><span>Level ${R.level}</span><span>${A.fruitCanGrow}</span></div>`:''}${R.pendingDrop?`<div class="stat t-Love"><span>Dropped</span><span>${R.pendingDrop}</span></div>`:''}${R.gearDropped?`<div class="stat t-Patience"><span>${A.foundGear}</span><span>${ITEMS[R.gearDropped].name}</span></div><div class="small mute">${ITEMS[R.gearDropped].perk}</div>`:''}${has('boots')||has('sabatons')?`<div class="small mute">${A.bootsHeal}</div>`:''}</div>
    ${R.gearDropped?`<button class="wide" onclick="R.gearFrom='fight';goto('gear')">See your gear</button>`:''}
    ${R.pendingDrop?`<button class="wide" onclick="addVerse(R.pendingDrop);R.pendingDrop=null;render()">Take ${R.pendingDrop}</button>`:''}
    ${due>0?`<button class="wide" onclick="R.treeFrom='fight';R.treeSel=null;goto('tree')">${A.growTree}</button>`:''}
    <div class="dock"><button class="primary wide" onclick="${R.boss?'victory()':'clearColumn()'}">${R.boss?A.leaveRoom:A.moveOn}</button></div>`;
}
function playCard(ref){
  if(R.busy || R.after) return;
  const c = {ref}; const v = BY_REF[ref]; const cost = cardCost(v);
  if(R.spent.includes(ref)){ toast(TEXT.fight.alreadySaid); return; }
  if(cost>R.focus){ toast(TEXT.fight.notEnoughFocus); return; }
  openRecall(v, async (frac)=>{
    R.busy=true; R.focus -= cost; R.vexed = false; R.spent.push(ref); if(!R.castRefs.includes(ref)) R.castRefs.push(ref); R.castLog.push({ref, frac}); R.gift=false;
    if(R.tree.Gentleness>=3 && v.type==='Gentleness' && !R.gentleUsed) R.gentleUsed=true;
    P.casts[c.ref]=(P.casts[c.ref]||0)+1; save();
    let eff = frac; if(frac<1 && R.tree.Peace>=2 && !R.stumbleUsed){ R.stumbleUsed=true; eff=1; }
    // perfect = full; steady (75%+) = as accurate as you were; a slip lands weakly. Tuned so a 50-60% player
    // can't carry the chapter and a 70% one scrapes through (tests/playtest.mjs, docs/mvp.md Balance)
    // (STEADY_DMG is lower than SLIP_BELOW on purpose: a 70% cast still hits properly, but it can still slip a spell's tier)
    let mult = eff===1 ? 1 : R.tutorial ? 0.5+0.5*eff : eff>=STEADY_DMG ? eff : eff*0.5;   // the coached Furnace stays forgiving
    const SM = spellMult(c.ref); if(has('sword') && sp(c.ref).tier===3) mult *= 1.25;
    if(frac===1 && (has('belt')||has('truth'))) R.shield += 2;
    if(frac===1 && has('truth')) mult *= 1.25;
    recordResult(c.ref, frac);
    const weak = eff<1; const tier = v.dmg>=12?3: (v.dmg>=7||v.heal||v.shield)?2:1;
    let t = R.enemies[R.target]; if(!t||t.freed) t = R.enemies.find(e=>!e.freed); const ti = R.enemies.indexOf(t);
    R.say = null;   // the room goes quiet while you speak
    render();
    const pl=document.getElementById('pl'); if(pl) pl.classList.add('cast');
    // one line for what you said; the numbers float up over whoever it lands on
    const C = TEXT.fight.cast, vars = {...foeVars(t), ref:passRef(c.ref,sp(c.ref).n), type:v.type};
    log(pickLine(v.dmg ? (weak?C.halting: tier===3?C.big: TYPE_MULT[v.type]?C.type: C.hit) : v.shield?C.shield: v.heal?C.heal: C.focus, vars));
    if(frac<1&&!weak) log(TEXT.fight.peaceSteadies);
    if(frac<SLIP_BELOW) think('slip'); else if(frac===1 && tier===3) think('perfect');
    await castFX(v.type, tier, weak, center('pl'), v.dmg?center('en'+ti):center('pl'));
    if(pl) pl.classList.remove('cast');
    const F = TEXT.fight.float;
    if(v.dmg){
      const base = v.dmg*SM + (R.tree.Patience>=1 && v.type==='Patience' ? 1 : 0) + (has('bible')?1:0) + (has('sword')?3:0);
      const dmg = Math.round(base*mult*(TYPE_MULT[v.type]||1)*(R.charge?2:1)); if(R.charge){ R.charge=false; log(TEXT.fight.chargedLands); }
      if(R.tree.Gentleness>=1) R.shield += 2;
      const daze = R.tree.Patience>=3 && frac===1 && v.type==='Patience' && !t.boss; if(daze) t.stun=true;
      t.hp -= dmg;
      await strike('en'+ti, String(dmg), TYPE_MULT[v.type]?'crit':'', (tier===3 && !weak) || dmg>=12);
      if(daze) floatText('en'+ti, F.dazed, 'tag', -26);
      await sleep(300);
      if(has('sabatons') && !t.boss && t.hp>0 && t.hp<=t.max*0.15){ log(fill(TEXT.fight.givesUp,foeVars(t))); t.hp=0; }
      if(t.hp<=0){ if(t.boss){ R.busy=false; bossAssembly('final'); return; } t.freed=true; const tal=5+(R.tree.Gentleness>=2?5:0); R.talents+=tal; R.earned.talents+=tal; gainXP(R.node&&R.node.t==='elite'?2:1); townUnlock(t.id); await freeBeat(t, ti); }
      else { if(moodOf(t) && t.mood!==moodOf(t)) await sleep(350); reactTo(t, ti); if(t.boss) checkBossPhase(t); }   // let the number clear first
    } else if(v.shield){ const s=Math.round(v.shield*SM*mult); R.shield+=s; floatText('pl', fill(F.shield,{n:s}), 'shield'); }
    else if(v.heal){ const h=Math.round(v.heal*SM*mult); R.hp=Math.min(R.maxHp,R.hp+h); floatText('pl', fill(F.heal,{n:h}), 'heal'); }
    else if(v.focus){ const f=Math.round(v.focus*SM*mult); R.focus=Math.min(R.maxFocus,R.focus+f); floatText('pl', fill(F.focus,{n:f}), 'focus'); }
    barsSync();
    R.busy=false;
    if(modal){ render(); return; }
    if(R.enemies.every(e=>e.freed)){ fightWon(); return; }
    enemyTurn();
  });
}
function brace(){ if(R.busy || R.after) return; R.brace=true; R.say=null; log(TEXT.fight.braceLog); shieldFX(); enemyTurn(); }
async function enemyTurn(){
  if(R.busy || R.after) return; R.busy=true;
  R.vexed = false;   // being provoked lasts one turn: it wears off whatever you did with it (or you could be stuck at 0 focus)
  turnBanner(TEXT.fight.theirTurn, false); await sleep(CALM()?250:450);
  for(const e of R.enemies){ if(e.freed) continue;
    const i=R.enemies.indexOf(e);
    if(e.stun){ e.stun=false; log(fill(TEXT.fight.standsDazed,foeVars(e))); await sleep(400); continue; }
    const a=e.pattern[e.step], vars={...foeVars(e), move:e.move}; e.step=(e.step+1)%e.pattern.length; e.move=moveFor(e);
    // the sin talks most turns (not if it just reacted to your last verse)
    const reacted = R.say && R.say.i===i && R.say.react && R.say.turn===R.turn;
    if(!reacted && Math.random()<0.75){ speak(i, tauntFor(e)); await sleep(CALM()?200:420); }
    const el=document.getElementById('en'+i); if(el){ el.classList.remove('windup'); if(!CALM()) el.classList.add('lunge'); }
    await sleep(180);   // the lunge reaches you, then the hit lands
    if(a==='vex'){ if(has('faith')) log(fill(TEXT.fight.vexBlocked,vars)); else { R.vexed=true; log(fill(TEXT.fight.vexed,vars)); floatText('pl', TEXT.fight.vexTag, 'tag'); } }
    else if(has('faith') && !R.faithUsed){ R.faithUsed=true; log(fill(TEXT.fight.glances,vars)); floatText('pl', TEXT.fight.float.glance, 'shield'); }
    else { let d = a==='big'? e.atk+3 : e.atk; if(has('breast')) d=Math.max(0,d-2); if(R.brace) d=Math.ceil(d/2); const absorbed=Math.min(R.shield,d); R.shield-=absorbed; d-=absorbed; R.hp-=d;
      log(fill(TEXT.fight.hits, vars));
      if(absorbed) floatText('pl', fill(TEXT.fight.float.blocked,{n:absorbed}), 'shield', d>0?-26:0);
      if(d>0){ hitFX(); await strike('pl', String(d), 'you', a==='big'); } else barsSync(); }
    await sleep(300); if(el) el.classList.remove('lunge');
    if(R.hp<=0 && has('helm') && !R.helmUsed){ R.helmUsed=true; R.hp=1; log(TEXT.fight.helmetHolds); barsSync(); }
    if(R.hp<=0){ R.busy=false; defeat(); return; }
  }
  newTurn(); R.busy=false;
  if(R.hp < R.maxHp*0.4 && !R.hurtSaid){ R.hurtSaid=true; think('hurt', {}, true); }
  render(); turnBanner(TEXT.fight.yourTurn, true);
}
function charge(){ if(R.busy||R.charge||R.after) return; R.charge=true; log(TEXT.fight.chargeLog); enemyTurn(); }
function fightWon(){
  if(R.boss) townUnlock('furnace');   // Bram is free: the forge opens
  R.pendingDrop = (R.node && R.node.t==='elite' && !R.deck.some(c=>c.ref==='Romans 12:19')) ? 'Romans 12:19' : null; R.dropFrom = R.enemies[0] && R.enemies[0].name;
  if(has('boots')||has('sabatons')){ R.hp=Math.min(R.maxHp,R.hp+4); }
  if(!R.boss && !R.tutorial && (R.node && R.node.t==='elite' || Math.random()<0.5)){ const g=gearDrop(); if(g){ equip(g); R.gearDropped=g; } }
  R.after=true; render();
}
function nextAfterFight(){
  if(R.pendingDrop){ screen='drop'; render(); return; }
  clearColumn();
}
function dropHTML(){ const v=BY_REF[R.pendingDrop]; return `<h1>${TEXT.drop.heading}</h1><div class="panel small">${fill(TEXT.drop.body,{name:R.dropFrom||''})}</div><div class="hand">${cardView(v)}</div><div class="dock"><button class="primary wide" onclick="R.deck.push({ref:R.pendingDrop});R.pendingDrop=null;nextAfterFight()">${TEXT.drop.take}</button></div>`; }
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
    if(m.mistakes && R.tutorial) log(TEXT.boss.amosHelps);   // in the tutorial Amos says it with you
    if(m.mistakes===0 || R.tutorial){ R.busy=true; boss.freed=true; render(); await freeBeat(boss, 0); R.busy=false; fightWon(); return; }
    boss.hp = R.tutorial ? 4 : Math.min(12, 4*m.mistakes); log(fill(TEXT.boss.lastFlares,{slips:slips(m.mistakes)}));
    render(); floatText('en0', '+'+boss.hp, 'heal');
  } else {
    R.boss.phase++; R.busy=true;
    // close the popup first, so you see the fire go out (or flare back)
    if(m.mistakes===0){ const was=boss.hp; boss.hp = Math.max(1, boss.hp-8); boss.stun=true; log(fill(TEXT.boss.fireDazed,{n:R.boss.phase})); render(); await strike('en0', String(was-boss.hp), '', true); floatText('en0', TEXT.fight.float.dazed, 'tag', -26); }
    else { const heal=R.tutorial ? 0 : Math.min(8,3*m.mistakes); boss.hp=Math.min(boss.max,boss.hp+heal); log(fill(TEXT.boss.fireFlares,{slips:slips(m.mistakes), n:heal})); render(); if(heal) floatText('en0', '+'+heal, 'heal'); }
    await sleep(500); R.busy=false;
  }
  enemyTurn();
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
    ${R.tutorial?`<div class="coach">${TEXT.tutorial.coach.assembly}</div>`:''}<div class="small mute">${TEXT.boss.assemble}${m.phase==='final'?TEXT.boss.assembleFinal:TEXT.boss.assemblePhase} Mistakes: ${m.mistakes}</div>
    <div class="seq">${placed||'&nbsp;'}</div>
    <div>${chips}</div></div></div>`;
}
