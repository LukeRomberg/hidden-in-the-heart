/* Dialogue engine, prologue, intro, mission story beats, and end states. */
// A conversation is a list of [speaker id, text]; speaker null means narration. Text lives in data/text.js.
let TW = {key:null, i:0, typing:false, timer:null};
function talk(key, lines, actions, gate=true){
  if(TW.key!==key){ TW={key, i:0, typing:false, timer:null}; }
  const [who, text] = lines[Math.min(TW.i, lines.length-1)];
  const last = TW.i >= lines.length-1;
  return `<div class="dlg ${who?'':'narr'}" onclick="talkTap(${lines.length})" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ')talkTap(${lines.length})" aria-label="Continue">
    ${who?`<div class="pt">${portrait(who)}</div>`:''}<div class="body">${who?`<div class="who">${TEXT.speakers[who]}</div>`:''}<div class="tw" id="tw" data-full="${text.replace(/"/g,'&quot;')}"></div></div>
    ${lines.length>1?`<span class="step">${TW.i+1}/${lines.length}</span>`:''}<span class="more" id="twmore" style="display:none">\u25BC</span></div>
    <div class="acts ${gate&&!last?'hide':''}" id="acts">${actions||''}</div>`;
}
function typeIt(){
  const el=document.getElementById('tw'); if(!el) return; clearInterval(TW.timer);
  const full=el.dataset.full; const quick = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(quick){ el.innerHTML=full; doneTyping(); return; }
  let n=0; TW.typing=true; el.textContent='';
  TW.timer=setInterval(()=>{ n+=2; el.innerHTML=full.slice(0,n); if(n>=full.length){ clearInterval(TW.timer); el.innerHTML=full; doneTyping(); } },22);
}
function doneTyping(){ TW.typing=false; const m=document.getElementById('twmore'); const acts=document.getElementById('acts'); const step=document.querySelector('.dlg .step');
  const total = step? +step.textContent.split('/')[1] : 1;
  if(TW.i < total-1){ if(m) m.style.display='block'; } else if(acts) acts.classList.remove('hide'); }
function talkTap(total){
  if(TW.typing){ clearInterval(TW.timer); const el=document.getElementById('tw'); el.innerHTML=el.dataset.full; doneTyping(); return; }
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
    <button class="primary wide" ${ready?'':'disabled'} onclick="R.deck.push({ref:R.chosen.off},{ref:R.chosen.def}); R.hp=R.maxHp; saveHero(); goto('tutorial')">${T.button}</button>`;
}
function chooseOpener(ref, group){ R.chosen[group] = R.chosen[group]===ref ? null : ref; render(); }
// ---- Tutorial: one guided fight in the square before any dungeon ----
function tutorialHTML(){
  const T = TEXT.tutorial;
  return `${sceneHTML(IMG.scene.square,[AT_PRIEST('idle',40), {src:ENEMY_IMG.hothead.f[0], x:236, y:92, w:48}])}${talk('tut', T.lead,
    `<button class="primary wide" onclick="startTutorial()">${T.start}</button>`)}`;
}
function startTutorial(){ R.tutorial=true; R.node={t:'fight', e:['hothead']}; startFight(['hothead']); }
// what the priest says over your shoulder, based on where you are in the fight
function coachLine(){
  const C = TEXT.tutorial.coach, casts = R.castRefs.length, canCast = R.hand.some(c=>cardCost(BY_REF[c.ref])<=R.mana);
  if(R.turn===1 && casts===0) return C.firstCard;
  if(R.turn===1 && canCast) return C.anotherCard;
  if(!canCast) return C.endTurn;
  return C.readIntent;
}
function finishTutorial(){ R.tutorial=false; P.tutorialDone=true; R.unlockMsg=null; saveHero(); goto('tutend'); }
function tutendHTML(){
  const T = TEXT.tutorial;
  return `${sceneHTML(IMG.scene.square,[AT_PRIEST('welcome',40), {src:ENEMY_IMG.hothead_f.f[0], x:236, y:92, w:48}])}${talk('tutend', T.after,
    `<button class="primary wide" onclick="goto('town')">${T.toTown}</button>`)}`;
}
function mstoryHTML(){
  return `${sceneHTML(IMG.battle.square,[],180)}${talk('mstory', TEXT.mission1.intro,
    `<button class="primary wide" onclick="goto('map')">${TEXT.mission1.goIn}</button>`)}`;
}
const LINES = TEXT.mission1.corridor;
function corridorHTML(){
  const n=R.next.n; const key=n.e?n.e[0].replace('_strong',''):n.t;
  return `${sceneHTML(n.t==='boss'?IMG.battle.lair:IMG.battle.square,[{html:sprite('back',0,1), x:128, y:110, w:64}],180)}
    <div class="story"><p>${Array.isArray(LINES[key]) ? LINES[key][R.step % LINES[key].length] : LINES[key]}</p></div><button class="primary wide" onclick="proceed()">${TEXT.mission1.goIn}</button>`;
}
const THANKS = TEXT.thanks;
function bossintroHTML(){
  const T = TEXT.boss;
  return `<h1>${T.heading}</h1>${sceneHTML(IMG.battle.lair,[],180)}${talk('bossintro', T.intro.map(([w,t])=>[w, fill(t,{passage:PASSAGE_REF})]),
    `<button class="primary wide" onclick="startFight(['furnace'],true)">${T.face}</button>`)}`;
}
function victory(){
  P.run = null;
  const first = !P.missions.wrath;
  P.missions.wrath = (P.missions.wrath||0)+1;
  if(first){ R.maxMana++; addVerse('Galatians 5:16'); P.town.church=true; }
  gainXP(first?3:1); R.talents += first?30:15;
  modal=null; R.firstClear=first; saveHero(); goto('victory');
}
function defeat(){
  if(R.tutorial){ R.hp=R.maxHp; modal=null; startFight(['hothead']); return; }   // nobody fails the tutorial
  P.run = null;
  const lost = Math.floor(R.talents*0.25); R.talents-=lost; R.lostTalents=lost; R.hp=Math.ceil(R.maxHp/2);
  modal=null; saveHero(); goto('defeat');
}
function retreat(){ R.hp=Math.max(1,R.hp); P.run=null; saveHero(); goto('town'); }
function victoryHTML(){
  const T = TEXT.victory;
  return `<h1>${T.heading}</h1>${sceneHTML(IMG.scene.square)}<div class="panel story"><p>${T.story}</p>
    ${R.firstClear?`<p>${T.bell}</p>`:''}</div>
    <div class="panel"><h2>Earned</h2><div class="stat"><span>Souls saved</span><span>+${R.firstClear?3:1}</span></div><div class="stat"><span>Talents</span><span>+${R.firstClear?30:15}</span></div>
    ${R.firstClear?`<div class="stat t-Patience"><span>${T.fruit}</span><span>${T.fruitPerk}</span></div><div class="stat t-Self-control"><span>${T.newVerse}</span><span>Galatians 5:16</span></div>`:''}</div>
    <button class="primary wide" onclick="goto('town')">${T.button}</button>`;
}
function defeatHTML(){
  const T = TEXT.defeat;
  return `<h1>${T.heading}</h1>${sceneHTML(IMG.scene.church,[AT_PRIEST('idle',214), {src:IMG.hero.waking, x:132, y:96, w:64}])}<div class="panel story"><p>${T.story}</p></div>
    <div class="panel small">${fill(T.summary,{n:R.lostTalents})}</div>
    <button class="primary wide" onclick="goto('town')">${T.button}</button>`;
}
