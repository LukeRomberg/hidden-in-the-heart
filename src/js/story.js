/* Dialogue engine, prologue, intro, mission story beats, and end states. */
// A conversation is a list of [speaker, text]; speaker null means narration.
let TW = {key:null, i:0, typing:false, timer:null};
function talk(key, lines, actions, gate=true){
  if(TW.key!==key){ TW={key, i:0, typing:false, timer:null}; }
  const [who, text] = lines[Math.min(TW.i, lines.length-1)];
  const last = TW.i >= lines.length-1;
  return `<div class="dlg ${who?'':'narr'}" onclick="talkTap(${lines.length})" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ')talkTap(${lines.length})" aria-label="Continue">
    ${who?`<div class="pt">${portrait(who)}</div>`:''}<div class="body">${who?`<div class="who">${who}</div>`:''}<div class="tw" id="tw" data-full="${text.replace(/"/g,'&quot;')}"></div></div>
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
  if(who==='You') return `<svg viewBox="17 1 30 30" width="54" height="54" shape-rendering="crispEdges">${heroRects('front',0,0,0,1)}</svg>`;
  return '';
}
// Which line of a conversation is showing (talk() resets TW only when it runs, after the art).
function lineOf(key){ return TW.key===key ? TW.i : 0; }
const AT_PRIEST = (pose,x=136)=>({src:IMG.priest[pose], x, y:86, w:48});
function pro1HTML(){
  return `${sceneHTML(lineOf('pro1')>=2 ? IMG.scene.asleep : IMG.scene.bedroom)}${talk('pro1',[
    [null,'Flashcards. A desk lamp. Your Bible open to the same page it has been open to for three nights.'],
    ['You','\u201cPsalm one nineteen, eleven. I have hidden\u2026 Your\u2026 in my\u2026\u201d'],
    [null,'Your eyes are very heavy.']],
    `<button class="primary wide" onclick="openRecall(BY_REF['Psalm 119:11'], f=>{ R.proFrac=f; goto('pro2'); }, 0, 'One more time')">Try one more time</button>`)}`;
}
function pro2HTML(){
  const got = R.proFrac===1;
  return `${lineOf('pro2')===0 ? sceneHTML(IMG.scene.asleep) : sceneHTML(IMG.scene.square,[{src:IMG.hero.waking, x:204, y:94, w:64}])}${talk('pro2',[
    [null, got?'You get it right. You are so pleased with yourself that you put your head down for just a second.':'You get about half of it. Your head goes down on the open page.'],
    [null,'Cold stone under your cheek. A village square at dusk. Every door barred, every window dark.'],
    [null,'Somewhere a man is shouting at nobody. Nobody shouts back.']],
    `<button class="primary wide" onclick="goto('pro3')">Look for an open door</button>`)}`;
}
function pro3HTML(){
  return `${sceneHTML(IMG.scene.church,[AT_PRIEST('idle')])}${talk('pro3',[
    [null,'One door is open. Dusty pews, a cold altar, and an old priest sweeping a floor nobody walks on anymore.'],
    ['Priest','\u201cNobody comes now. Not since the anger got into the town. Then the grudges. Then worse.\u201d'],
    [null,'He sees the Bible still in your hand, and stops sweeping.']],
    `<button class="primary wide" onclick="goto('pro4')">Hold it up</button>`)}`;
}
function pro4HTML(){
  return `${sceneHTML(IMG.scene.church,[AT_PRIEST('welcome',112), {html:sprite('player',0,1), x:156, y:88, w:64}])}${talk('pro4',[
    ['Priest','\u201cThe armor of God was kept here once.\u201d He hands you a dented trash-can lid. \u201cThis is what is left. That, and what you are holding. And the words.\u201d'],
    ['Priest','\u201cDo you know the words?\u201d'],
    [null,'You think about the flashcards.'],
    ['You','\u201c\u2026Some of them.\u201d']],
    `<button class="primary wide" onclick="if(!R.gear.hand) equip('bible'); if(!R.gear.shield) equip('lid'); Object.keys(heroCache).forEach(k=>delete heroCache[k]); goto('intro')">Take the lid</button>`)}`;
}
function cardPick(ref, group){ const v=BY_REF[ref]; return cardHTML(v,{full:true, cls:R.chosen[group]===ref?'sel':'', click:`chooseOpener('${ref}','${group}')`}); }
function introHTML(){
  const ready = R.chosen.off && R.chosen.def;
  return `<h1>The words you know</h1>${talk('intro',[['Priest','“Tell me two. One to stand against the anger, and one to keep you standing.”']],'',false)}<div class="small mute" style="margin-bottom:8px">Patience hits wrath hardest. Longer verses hit harder and cost more.</div>
    <h2>Against wrath</h2><div class="hand">${R.pick.map(ref=>cardPick(ref,'off')).join('')}</div>
    <h2>To keep you standing</h2><div class="hand">${DEFENSE.map(ref=>cardPick(ref,'def')).join('')}</div>
    <button class="primary wide" ${ready?'':'disabled'} onclick="R.deck.push({ref:R.chosen.off},{ref:R.chosen.def}); freshen(R.chosen.off); freshen(R.chosen.def); R.hp=R.maxHp; saveHero(); goto('town')">“Those two.”</button>`;
}
function chooseOpener(ref, group){ R.chosen[group] = R.chosen[group]===ref ? null : ref; render(); }
function mstoryHTML(){
  return `${sceneHTML(IMG.battle.square,[],180)}${talk('mstory',[
    [null,'The square again, darker than before. Every door is barred except the ones that have been kicked in.'],
    [null,'\u201cFor our struggle is not against flesh and blood, but against the rulers, against the authorities, against the powers of this world\u2019s darkness, and against the spiritual forces of evil in the heavenly realms.\u201d Ephesians 6:12'],
    ['Priest','\u201cThe people out there are not your enemies. They are the held. Say the true thing over them, and whatever has them lets go.\u201d']],
    `<button class="primary wide" onclick="goto('map')">Go in</button>`)}`;
}
const LINES = {forge:'Hammering, somewhere ahead. Steady, like someone who has been at it for a very long time.', hothead:'Someone ahead is shouting at the walls. Nobody is answering him.', grudge:'A man sits counting on his fingers. Old debts, by the look of it.', brawler:'The door has been kicked off its hinges. From the inside.', slanderer:'The voice ahead is calm, reasonable, and lying.', boss:'The heat reaches you before the sound does.', shrine:'Light under a door. Someone left a lamp burning for you.', lock:'A chest with no key. There are words carved around the lock.', rest:'Ashes, still warm. Whoever rested here left the fire for the next one.'};
function corridorHTML(){
  const n=R.next.n; const key=n.e?n.e[0]:n.t;
  return `<div class="panel" style="padding:0;overflow:hidden"><svg viewBox="0 0 140 60" width="100%" shape-rendering="crispEdges" aria-hidden="true">${stoneBG(140,60)}<rect y="46" width="140" height="14" fill="var(--room)"/>${pxg(ICON.torch[0],18,12,2)}${pxg(ICON.torch[1],114,12,2)}<g class="walk">${heroRects('front',0,57,17,0.45)}</g></svg></div>
    <div class="story"><p>${LINES[key]}</p></div><button class="primary wide" onclick="proceed()">Go in</button>`;
}
const THANKS = {hothead:'I don’t know what I was so angry about. It’s gone. Thank God, it’s gone.', grudge:'Twelve years I carried that. You said one sentence and I set it down. Praise God.', brawler:'My hands have stopped shaking. Nobody ever told me I could just stop. God is good.', slanderer:'I knew every word of it was a lie. I needed someone to say the true thing out loud. Glory to God.', furnace:'I burned so long I forgot I was a man. Thank you. Thank God.'};
function bossintroHTML(){
  return `<h1>The Furnace</h1>${sceneHTML(IMG.battle.lair,[],180)}${talk('bossintro',[
    [null,'He has three fires in him. Beat him down a third and one goes out, and the room goes quiet enough to speak.'],
    [null,`When it does, say ${PASSAGE_REF} in order, piece by piece. Say it clean and he is dazed and burned. Stumble and the fire flares back.`],
    [null,'When the last fire is out, say it once more without a mistake, and he is free.']],
    `<button class="primary wide" onclick="startFight(['furnace'],true)">Face him</button>`)}`;
}
function carriedHTML(){
  const m = Object.entries(P.mastery).filter(([r,m])=>m.lvl>=3).map(([r])=>r);
  return `<div class="panel"><h2>Carried in your head</h2>${m.length? m.map(r=>`<div>${r}</div>`).join('') : '<div class="mute">Nothing mastered yet. Three perfect casts at each level.</div>'}</div>`;
}
function victory(){
  const first = !P.missions.wrath;
  P.missions.wrath = (P.missions.wrath||0)+1;
  if(first){ R.maxMana++; addVerse('Galatians 5:16'); P.town.church=true; }
  gainXP(first?3:1); R.talents += first?30:15;
  modal=null; R.firstClear=first; saveHero(); goto('victory');
}
function defeat(){
  const lost = Math.floor(R.talents*0.25); R.talents-=lost; R.lostTalents=lost; R.hp=Math.ceil(R.maxHp/2);
  modal=null; saveHero(); goto('defeat');
}
function retreat(){ R.hp=Math.max(1,R.hp); saveHero(); goto('town'); }
function victoryHTML(){
  return `<h1>The Furnace goes out</h1>${sceneHTML(IMG.scene.square)}<div class="panel story"><p>He sits down on the stones of the square, quieter than he has been in years. Someone opens a shutter. Then another.</p>
    ${R.firstClear?'<p>That night the church bell rings for the first time in a long time.</p>':''}</div>
    <div class="panel"><h2>Earned</h2><div class="stat"><span>Souls saved</span><span>+${R.firstClear?3:1}</span></div><div class="stat"><span>Talents</span><span>+${R.firstClear?30:15}</span></div>
    ${R.firstClear?'<div class="stat t-Patience"><span>Fruit: Patience</span><span>+1 max mana, for good</span></div><div class="stat t-Self-control"><span>New verse</span><span>Galatians 5:16</span></div>':''}</div>
    <button class="primary wide" onclick="goto('town')">Walk back to the church</button>`;
}
function defeatHTML(){
  return `<h1>You wake on a pew</h1>${sceneHTML(IMG.scene.church,[AT_PRIEST('idle',214), {src:IMG.hero.waking, x:132, y:96, w:64}])}<div class="panel story"><p>The priest found you in the square and carried you back. \u201cThe words were right,\u201d he says. \u201cYou just ran out of breath to say them.\u201d</p></div>
    <div class="panel small">You keep your level, gear, and verses. The mission starts over, and ${R.lostTalents} talents were lost in the square.</div>
    <button class="primary wide" onclick="goto('town')">Get up</button>`;
}
