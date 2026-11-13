/* Shared UI: cards, title, codex, deck, HUD, tabs, and the render loop. */
function cardHTML(v, o={}){
  const s=sp(v.ref); const cost = o.cost!==undefined ? o.cost : spellCost(v);
  const txt = o.full ? passVerses(v.ref,s.n).map(x=>x.t).join(' ') : v.text.split(' ').slice(0,7).join(' ')+'\u2026';
  return `<div class="card ty-${v.type} ${o.cls||''}" ${o.click?`onclick="${o.click}" role="button" tabindex="0"`:''}><div class="gem">${cost}</div>
    <div class="ref">${passRef(v.ref,s.n)}</div><div class="type">${v.type}</div><div class="txt">${txt}</div>
    <div class="foot"><span>${spellEff(v)}</span><span class="glyphs" title="${TIER_NAME[s.tier]}">${glyphs(v.ref)}</span></div></div>`;
}
function cardView(v){ return cardHTML(v,{full:true}); }
function titleHTML(){
  return `<h1>Hidden in the Heart</h1>${sceneHTML(IMG.scene.title,[{src:IMG.hero.asleep, x:6, y:94, w:64}])}<div class="panel">
    <div class="small mute" style="text-align:center;margin:8px 0">\u201cI have hidden Your word in my heart that I might not sin against You.\u201d Psalm 119:11</div></div>
    ${P.hero?`<button class="primary wide" onclick="continueGame()">Continue</button>`:''}
    <button class="${P.hero?'':'primary '}wide" onclick="if(!P.hero || confirm(TEXT.title.newGameConfirm)) newGame()">New game</button>
    <button class="wide" onclick="R=R||Object.assign(transient(),blankHero()); R.codexFrom='title'; goto('codex')">Codex</button>
    <button class="wide" onclick="goto('saves')">${TEXT.saves.heading}</button>
    <div class="small mute" style="margin-top:12px">Scripture quotations are from the Berean Standard Bible, public domain. ${CREED.credit}</div>`;
}
function codexHTML(){
  // the whole Creed, so it can be studied; sections recovered from chests are full color, the rest faded
  const C = TEXT.codex, got = P.creed||0, N = CREED.sections.length;
  const creed = CREED.sections.map((sec,i)=>`<span class="${i<got?'':'faded'}">${sec.join(' ')}</span>`).join(' ');
  return `<h1>Codex</h1><div class="panel"><div class="px">${C.creed} · ${fill(C.creedSoFar,{n:got, total:N})}</div>
    <div class="verse creed">${creed}</div><div class="small mute">${got<N?C.creedNote:C.creedDone}</div>
    <div class="small mute" style="font-size:13px;margin-top:6px">${CREED.credit}</div></div>${[...STORY_V,...VERSES,...ARMOR_V].map(v=>{ const s=sp(v.ref); const vs=passVerses(v.ref,s.n); return `<div class="panel"><div class="px t-${v.type}">${spellLine(v.ref)} · ${v.type}</div><div class="verse" style="font-size:21px">${vs.map(x=>(s.n>1?`<sup class="mute">${x.v}</sup>`:'')+x.t).join(' ')}</div><div class="small mute">${TIER_NAME[s.tier]} · ${s.n} of ${maxN(v.ref)} verses${s.n<maxN(v.ref)?'':' · complete'}</div></div>`;}).join('')}
    <div class="dock"><button class="wide" onclick="goto(R&&R.codexFrom||'title')">Back</button></div>`;
}
function deckHTML(){
  return `<h1>Deck</h1>${R.deck.map(c=>{const v=BY_REF[c.ref]; return `<div class="panel"><div class="px t-${v.type}">${spellLine(c.ref)} · ${v.type}</div><div class="small mute">${TIER_NAME[sp(c.ref).tier]} · ${spellEff(v)} · ${spellCost(v)} ${TEXT.fight.focus.toLowerCase()}</div></div>`;}).join('')}
    <div class="dock"><button class="wide" onclick="goto(R.deckFrom||'town')">Back</button></div>`;
}
const HUD_ON = new Set(['town','church','forge','inn','training','scriptorium','world','tree','gear','deck','dive','codex','intro']);
const TABS = [['town','Town','town'],['church','Church','church'],['gear','Gear','gear'],['tree','Tree','tree'],['deck','Deck','deck']];
const TAB_ON = new Set(['town','church','forge','inn','training','scriptorium','world','tree','gear','deck','codex']);
function hudHTML(){
  if(!R || !R.deck) return '';
  return `<div class="hud" role="status"><span class="lv">Lv ${R.level}</span>
    <span class="grow"><span class="it tiny">${icon('soul',1.6)} ${R.xp}/${xpNeed(R.level)} souls</span><div class="bar mn"><i style="width:${100*R.xp/xpNeed(R.level)}%"></i></div></span>
    <span class="it">${icon('heart',1.8)} ${R.hp}/${R.maxHp}</span><span class="it" title="${TEXT.fight.focus}">${icon('mana',1.8)} ${R.maxFocus}</span><span class="it">${icon('coin',1.8)} ${R.talents}</span></div>`;
}
function tabsHTML(){
  const cur = ['forge','inn','training','scriptorium','world'].includes(screen) ? 'town' : screen;
  return `<nav class="tabs">${TABS.map(([id,label,ic])=>`<button class="${cur===id?'on':''}" onclick="tab('${id}')">${icon(ic,2.2)}${label}${id==='tree'&&treeDue()>0?'<span class="dot"></span>':''}</button>`).join('')}</nav>`;
}
function tab(id){ if(modal) return; R.treeFrom='town'; R.gearFrom='town'; R.deckFrom='town'; R.codexFrom='town'; if(id==='tree') R.treeSel=null; goto(id); }
function render(){
  const S = {tour:tourHTML, town:townHTML, church:churchHTML, inn:innHTML, training:trainingHTML, scriptorium:scriptoriumHTML, world:worldHTML, pro1:pro1HTML, pro2:pro2HTML, pro3:pro3HTML, pro4:pro4HTML, title:titleHTML, codex:codexHTML, intro:introHTML, dive:diveHTML, caveintro:caveIntroHTML, cavedone:caveDoneHTML, chapterend:chapterEndHTML, fight:fightHTML, tutorial:tutorialHTML, tutend:tutendHTML, saves:savesHTML, reward:rewardHTML, forge:forgeHTML, gear:gearHTML, study:studyHTML, tree:treeHTML, drop:dropHTML, victory:victoryHTML, defeat:defeatHTML, deck:deckHTML};
  let html = (S[screen]||titleHTML)();
  if(R && HUD_ON.has(screen) && screen!=='intro') html = hudHTML() + html;
  const tabs = R && R.deck && R.deck.length && TAB_ON.has(screen); document.body.classList.toggle('has-tabs', !!tabs); if(tabs) html += tabsHTML();
  if(!modal && levelUpDue()) modal = {kind:'levelup'};
  if(!modal){ const tip = tutorialTip(); if(tip) modal = {kind:'tip', key:tip}; }
  if(modal){ html += modal.kind==='recall'? recallHTML() : modal.kind==='levelup'? levelUpHTML() : modal.kind==='tip'? tipHTML() : assemblyHTML(); }
  document.getElementById('app').innerHTML = html;
  // pinned buttons sit just above the tab bar when it shows
  const nav = document.querySelector('.tabs'); document.body.style.setProperty('--dock-bottom', (tabs && nav ? nav.offsetHeight : 0) + 'px');
  const inp = document.getElementById('ans'); if(inp) inp.focus();
  if(document.getElementById('tw')) typeIt();
}
