/* Dialogue engine, prologue, intro, mission story beats, and end states. */
// A conversation is a list of [speaker id, text]; speaker null means narration. Text lives in data/text.js.
let TW = {key:null, i:0, typing:false, timer:null};
// The one typing timer. It lives outside TW on purpose: TW is replaced whenever a new conversation starts,
// and a timer whose handle was lost with the old TW kept running forever, killing every later line's typing
// (the blank dialogue after the Furnace, 2026-11).
let typingTimer = null;
function stopTyping(){ clearInterval(typingTimer); typingTimer = null; }
function talk(key, lines, actions, gate=true){
  if(TW.key!==key){ stopTyping(); TW={key, i:0, typing:false, timer:null}; }
  const [who, text] = lines[Math.min(TW.i, lines.length-1)];
  const last = TW.i >= lines.length-1;
  return `<div class="dlg ${who?'':'narr'}" onclick="talkTap(${lines.length})" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ')talkTap(${lines.length})" aria-label="Continue">
    ${who?`<div class="pt">${portrait(who)}</div>`:''}<div class="body">${who?`<div class="who">${TEXT.speakers[who]}</div>`:''}<div class="tw" id="tw" data-full="${text.replace(/"/g,'&quot;')}"></div></div>
    ${lines.length>1?`<span class="step">${TW.i+1}/${lines.length}</span>`:''}<span class="more" id="twmore" style="display:none">\u25BC</span></div>
    <div class="acts ${actions?'dock':''} ${gate&&!last?'hide':''}" id="acts">${actions||''}</div>`;
}
function typeIt(){
  const el=document.getElementById('tw'); if(!el) return; stopTyping();
  const full=el.dataset.full; const quick = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(quick){ el.innerHTML=full; doneTyping(); return; }
  let n=0; TW.typing=true; el.textContent='';
  const id = typingTimer = setInterval(()=>{
    if(id!==typingTimer || !el.isConnected){ clearInterval(id); return; }   // superseded, or its screen is gone
    n+=2; el.innerHTML=full.slice(0,n); if(n>=full.length){ stopTyping(); el.innerHTML=full; doneTyping(); } },22);
}
function doneTyping(){ TW.typing=false; const m=document.getElementById('twmore'); const acts=document.getElementById('acts'); const step=document.querySelector('.dlg .step');
  const total = step? +step.textContent.split('/')[1] : 1;
  if(TW.i < total-1){ if(m) m.style.display='block'; } else { if(acts) acts.classList.remove('hide'); onceTip(); } }
function talkTap(total){
  if(TW.typing){ stopTyping(); const el=document.getElementById('tw'); el.innerHTML=el.dataset.full; doneTyping(); return; }
  if(TW.i < total-1){ TW.i++; render(); }
}
function portrait(who){
  if(IMG.portrait[who]) return `<img src="${IMG.portrait[who]}" width="48" height="48" alt="" style="image-rendering:pixelated">`;
  if(who==='you') return `<svg viewBox="17 1 30 30" width="54" height="54" shape-rendering="crispEdges">${heroRects('front',0,0,0,1)}</svg>`;
  return '';
}
// Which line of a conversation is showing (talk() resets TW only when it runs, after the art).
function lineOf(key){ return TW.key===key ? TW.i : 0; }
const AT_PRIEST = (pose,x=136)=>({src:IMG.priest[pose], x, y:86, w:48});
function pro1HTML(){
  const T = TEXT.prologue.bedroom;
  return `${sceneHTML(lineOf('pro1')>=2 ? IMG.scene.asleep : IMG.scene.bedroom)}${talk('pro1', T.lines,
    `<button class="primary wide" onclick="openRecall(BY_REF['Psalm 119:11'], f=>{ R.proFrac=f; goto('pro2'); }, 0, TEXT.prologue.bedroom.recallTitle)">${T.button}</button>`)}`;
}
function pro2HTML(){
  const T = TEXT.prologue.square, got = R.proFrac===1;
  return `${lineOf('pro2')===0 ? sceneHTML(IMG.scene.asleep) : sceneHTML(IMG.scene.square,[{src:IMG.hero.waking, x:204, y:94, w:64}])}${talk('pro2',
    [[null, got?T.firstRight:T.firstMissed], ...T.lines],
    `<button class="primary wide" onclick="goto('pro3')">${T.button}</button>`)}`;
}
function pro3HTML(){
  const T = TEXT.prologue.church;
  return `${sceneHTML(IMG.scene.church,[AT_PRIEST('idle')])}${talk('pro3', T.lines,
    `<button class="primary wide" onclick="goto('pro4')">${T.button}</button>`)}`;
}
function pro4HTML(){
  const T = TEXT.prologue.lid;
  return `${sceneHTML(IMG.scene.church,[AT_PRIEST('welcome',112), {html:sprite('player',0,1), x:156, y:88, w:64}])}${talk('pro4', T.lines,
    `<button class="primary wide" onclick="if(!R.gear.hand) equip('bible'); if(!R.gear.shield) equip('lid'); Object.keys(heroCache).forEach(k=>delete heroCache[k]); goto('intro')">${T.button}</button>`)}`;
}
function cardPick(ref, group){ const v=BY_REF[ref]; return cardHTML(v,{full:true, cls:R.chosen[group]===ref?'sel':'', click:`chooseOpener('${ref}','${group}')`}); }
function introHTML(){
  const ready = R.chosen.off && R.chosen.def, T = TEXT.prologue.pickVerses;
  return `<h1>${T.heading}</h1>${talk('intro',[T.line],'',false)}<div class="small mute" style="margin-bottom:8px">${T.hint}</div>
    <h2>${T.offense}</h2><div class="hand">${R.pick.map(ref=>cardPick(ref,'off')).join('')}</div>
    <h2>${T.defense}</h2><div class="hand">${DEFENSE.map(ref=>cardPick(ref,'def')).join('')}</div>
    <div class="dock"><button class="primary wide" ${ready?'':'disabled'} onclick="R.deck.push({ref:R.chosen.off},{ref:R.chosen.def}); R.hp=R.maxHp; saveHero(); goto('tutorial')">${T.button}</button></div>`;
}
function chooseOpener(ref, group){ R.chosen[group] = R.chosen[group]===ref ? null : ref; render(); }
// ---- Tutorial: one guided fight in the square before any dungeon ----
function tutorialHTML(){
  const T = TEXT.tutorial;
  return `${sceneHTML(IMG.scene.square,[AT_PRIEST('idle',40), {src:ENEMY_IMG.furnace.f[0], x:206, y:58, w:96}])}${talk('tut', T.lead,
    `<button class="primary wide" onclick="startTutorial()">${T.start}</button>`)}`;
}
// The tutorial is the Furnace: Bram, burning by the well. Amos hands you Galatians 5:22-23 for the fires;
// you start groggy, so you run dry and he hands you Romans 12:2 too.
const TUTORIAL_FOCUS = 3;
const BRAM_GIFT = 'boots';   // what Bram gives you when he is freed (an ITEMS id)
function startTutorial(){ R.tutorial=true; addVerse('Galatians 5:22-23'); R.node={t:'boss'}; startFight(['furnace'], true); log(TEXT.tutorial.groggy); }
// what the priest says over your shoulder, based on where you are in the fight
// Tutorial popups: the first time each rule matters, the fight stops and Amos explains it. Shown once each
// (R.tipsSeen), in this order; render() opens the next one due when nothing else is on screen.
const TIP_ORDER = [
  ['firstCard', ()=>R.turn>=1],
  ['oneMove', ()=>R.turn>=2],
  ['readIntent', ()=>R.turn>=3 || R.spent.length>=2],
  ['gift', ()=>R.gift],
];
function tutorialTip(){
  if(screen!=='fight' || !R.tutorial || R.busy || R.after) return null;
  R.tipsSeen = R.tipsSeen||[];
  const due = TIP_ORDER.find(([k,when])=>!R.tipsSeen.includes(k) && when());
  return due ? due[0] : null;
}
// A popup that stops everything to teach one rule. Tutorial tips come from TEXT.tutorial (Amos); others
// (modal.once) carry their own speaker, title and paragraphs and are shown once per save (P.tips).
function tipHTML(){ const k = modal.key, T = TEXT.tutorial, o = modal.once;
  const body = o ? o.body.map(p=>`<p class="tipbody">${p}</p>`).join('') : `<p class="tipbody">${T.coach[k]}</p>`;
  return `<div class="overlay tip" id="tipov"><div class="panel"><div class="tiphead">${portrait(o?o.who:'priest')}<h2>${o?o.title:T.tips[k]}</h2></div>
    ${body}<button class="primary wide" onclick="closeTip()">${T.tips.ok}</button></div></div>`; }
function closeTip(){
  if(modal.once){ (P.tips=P.tips||{})[modal.key]=true; save(); modal=null; const ov=document.getElementById('tipov'); if(ov) ov.remove(); return; }   // nothing under it changed: leave the screen as it is
  R.tipsSeen.push(modal.key); const then = modal.then; modal=null; if(then) then(); else render(); }
// In the tutorial, Amos stops you before something new opens (the first recall, the first assembly): show his tip
// first, then carry on. Returns true if it stepped in.
function tutorialFirst(k, then){ if(!R.tutorial) return false; R.tipsSeen = R.tipsSeen||[]; if(R.tipsSeen.includes(k)) return false;
  modal = {kind:'tip', key:k, then}; render(); return true; }
// one-time popups that wait for a scene's last line to finish typing: {screen: tip key}
const ONCE_TIPS = {forge:'forge'};
function onceTip(){ const k = ONCE_TIPS[screen]; if(!k || modal || (P.tips&&P.tips[k])) return;
  const t = TEXT[k].tip; modal = {kind:'tip', key:k, once:{who:t.who, title:t.title, body:t.body}};
  document.getElementById('app').insertAdjacentHTML('beforeend', tipHTML()); }
function tutendHTML(){
  const T = TEXT.tutorial;
  return `${sceneHTML(IMG.scene.square,[AT_PRIEST('welcome',40), {src:ENEMY_IMG.hothead_f.f[0], x:236, y:92, w:48}])}${talk('tutend', T.after,
    `<button class="primary wide" onclick="goto('tour')">${T.toTown}</button>`)}`;
}
// Amos shows you the town once, after the Furnace (and again from the church, if you ask)
function tourHTML(){
  const T = TEXT.tour;
  return `${sceneHTML(IMG.scene.square,[AT_PRIEST('welcome',40)])}${talk('tour', T.lines,
    `<button class="primary wide" onclick="P.toured=true;save();goto(R.tourFrom||'town')">${T.button}</button>`)}`;
}
const THANKS = TEXT.thanks;
function victory(){
  // the Furnace is freed: Bram again. This is the end of the tutorial.
  P.run = null;
  const first = !P.missions.wrath;
  P.missions.wrath = (P.missions.wrath||0)+1;
  if(first){ R.maxFocus+=2; addVerse('Galatians 5:16'); addVerse('Romans 12:2'); P.town.church=true; if(!owns(BRAM_GIFT)) equip(BRAM_GIFT); Object.keys(heroCache).forEach(k=>delete heroCache[k]); }
  R.tutorial=false; R.gift=false; P.tutorialDone=true;
  gainXP(first?3:1); R.talents += first?30:15;
  modal=null; R.firstClear=first; saveHero(); goto('victory');
}
function defeat(){
  if(R.tutorial){ R.hp=R.maxHp; modal=null; startFight(['furnace'], true); return; }   // nobody fails the tutorial
  P.run = null;
  const lost = Math.floor(R.talents*0.25); R.talents-=lost; R.lostTalents=lost; R.hp=Math.ceil(R.maxHp/2);
  modal=null; saveHero(); goto('defeat');
}
function retreat(){ R.hp=Math.max(1,R.hp); P.run=null; R.cave=null; saveHero(); goto('town'); }
function victoryHTML(){
  const T = TEXT.victory;
  // what changed: the forge lit and the church bell (town art, open state), not the empty square
  const changed = `<div class="panel scene changed"><figure><img src="${IMG.town.forge[1]}" alt=""><figcaption>${T.forgeLit}</figcaption></figure>
    <figure><img src="${IMG.town.church[1]}" alt=""><figcaption>${T.bellRings}</figcaption></figure></div>`;
  return `<h1>${T.heading}</h1>${changed}<div class="panel story"><p>${T.story}</p>
    ${R.firstClear?`<p>${T.bell}</p>`:''}</div>
    <div class="panel"><h2>Earned</h2><div class="stat"><span>Souls saved</span><span>+${R.firstClear?3:1}</span></div><div class="stat"><span>Talents</span><span>+${R.firstClear?30:15}</span></div>
    ${R.firstClear?`<div class="stat t-Patience"><span>${T.fruit}</span><span>${T.fruitPerk}</span></div><div class="stat t-Self-control"><span>${T.newVerse}</span><span>Galatians 5:16</span></div><div class="stat t-Gentleness"><span>${T.gift}</span><span>${ITEMS[BRAM_GIFT].name}</span></div>`:''}</div>
    <div class="dock"><button class="primary wide" onclick="goto(R.firstClear?'tutend':'town')">${T.button}</button></div>`;
}
// ---- The end of the Philadelphia chapter: once, when the last cave is cleared for the first time ----
// (caveDoneHTML in dive.js sends you here.) A full church, then what you carried home, then the road east.
const HOME = ['blacksmith','innkeeper','drill','scribe'];   // Bram, Wendell, Hale, Silas: speaker ids
function chapterEndHTML(){
  const T = TEXT.chapterEnd;
  if(!R.endStats){
    const at = (spr,x)=>({src:ENEMY_IMG[spr].f[0], x, y:92, w:40});
    return `${sceneHTML(IMG.scene.church,[at('hothead_f',14), at('grudge_f',58), AT_PRIEST(lineOf('chapterend')>=6?'welcome':'idle'), at('brawler_f',222), at('slanderer_f',266)])}${talk('chapterend', T.lines,
      `<button class="primary wide" onclick="R.endStats=true;goto('chapterend')">${T.toStats}</button>`)}`;
  }
  const row = (label, val, cls='')=>`<div class="stat ${cls}"><span>${label}</span><span>${val}</span></div>`;
  const list = names=>`<div class="chnames">${names.join(', ')}</div>`;
  // truths: sermon scraps you read, plus questions you answered right (P.truthsRight, encounters.js)
  const truths = new Set([...(P.notes||[]), ...(P.truthsRight||[])]).size;
  const helped = (P.helpedAll||[]).map(id=>(TEXT.living.people.find(p=>p.id===id)||{}).name).filter(Boolean);
  const refs = [...new Set(R.deck.map(c=>c.ref))], byHeart = refs.filter(r=>sp(r).tier===3).length;
  return `<h1>${T.heading}</h1>${sceneHTML(IMG.scene.square,[{html:sprite('back',0,1), x:128, y:94, w:64}])}
    <div class="panel chend"><div class="px chsub">${T.sub}</div>
      ${row(T.souls, R.souls)}
      ${row(T.home, HOME.length)}${list(HOME.map(id=>TEXT.speakers[id]))}
      ${row(T.truths, fill(T.truthsOf,{n:truths, total:TEXT.truths.list.length}))}
      ${row(T.helped, helped.length)}${list(helped.length?helped:[T.helpedNone])}
      ${row(T.creed, fill(T.creedOf,{n:P.creed||0, total:CREED.sections.length}))}
      ${row(T.mastered, fill(T.masteredOf,{n:byHeart, total:refs.length}))}
      ${row(T.talents, R.talents)}</div>
    <div class="panel story chroad"><p>${T.road}</p><p class="px">${T.continued}</p></div>
    <div class="dock"><button class="primary wide" onclick="R.endStats=false;R.cave=null;P.chapters=Object.assign(P.chapters||{},{philadelphia:1});saveHero();goto('town')">${T.button}</button></div>`;
}
function defeatHTML(){
  const T = TEXT.defeat;
  return `<h1>${T.heading}</h1>${sceneHTML(IMG.scene.church,[AT_PRIEST('idle',214), {src:IMG.hero.waking, x:132, y:96, w:64}])}<div class="panel story"><p>${T.story}</p></div>
    <div class="panel small">${fill(T.summary,{n:R.lostTalents})}</div>
    <div class="dock"><button class="primary wide" onclick="goto('town')">${T.button}</button></div>`;
}
