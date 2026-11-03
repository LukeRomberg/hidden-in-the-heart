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
  return `<h1>Hidden in the Heart</h1><div class="panel"><div class="row" style="justify-content:center;align-items:flex-end">${sprite('player',0,2)}${sprite('furnace',0,5)}</div>
    <div class="small mute" style="text-align:center;margin:8px 0">\u201cI have hidden Your word in my heart that I might not sin against You.\u201d Psalm 119:11</div></div>
    ${P.hero?`<button class="primary wide" onclick="continueGame()">Continue</button>`:''}
    <button class="${P.hero?'':'primary '}wide" onclick="if(!P.hero || confirm('Start over? Your current journey will be erased.')) newGame()">New game</button>
    <button class="wide" onclick="R=R||Object.assign(transient(),blankHero()); R.codexFrom='title'; goto('codex')">Codex</button>
    <div class="small mute" style="margin-top:12px">Scripture quotations are from the Berean Standard Bible, public domain.</div>`;
}
function codexHTML(){
  return `<h1>Codex</h1>${[...STORY_V,...VERSES,...ARMOR_V].map(v=>{ const s=sp(v.ref); const vs=passVerses(v.ref,s.n); return `<div class="panel"><div class="px t-${v.type}">${spellLine(v.ref)} · ${v.type}</div><div class="verse" style="font-size:21px">${vs.map(x=>(s.n>1?`<sup class="mute">${x.v}</sup>`:'')+x.t).join(' ')}</div><div class="small mute">${TIER_NAME[s.tier]} · ${s.n} of ${maxN(v.ref)} verses${s.n<maxN(v.ref)?'':' · complete'}</div></div>`;}).join('')}
    <button class="wide" onclick="goto(R&&R.codexFrom||'title')">Back</button>`;
}
function deckHTML(){
  return `<h1>Deck</h1>${R.deck.map(c=>{const v=BY_REF[c.ref]; return `<div class="panel"><div class="px t-${v.type}">${spellLine(c.ref)} · ${v.type}</div><div class="small mute">${TIER_NAME[sp(c.ref).tier]} · ${spellEff(v)} · ${spellCost(v)} mana</div></div>`;}).join('')}
    <button class="wide" onclick="goto(R.deckFrom||'town')">Back</button>`;
}
const HUD_ON = new Set(['town','church','forge','inn','training','scriptorium','world','tree','gear','deck','map','codex','intro']);
const TABS = [['town','Town','town'],['church','Church','church'],['gear','Gear','gear'],['tree','Tree','tree'],['deck','Deck','deck']];
const TAB_ON = new Set(['town','church','forge','inn','training','scriptorium','world','tree','gear','deck','codex']);
function hudHTML(){
  if(!R || !R.deck) return '';
  return `<div class="hud" role="status"><span class="lv">Lv ${R.level}</span>
    <span class="grow"><span class="it tiny">${icon('soul',1.6)} ${R.xp}/${xpNeed(R.level)} souls</span><div class="bar mn"><i style="width:${100*R.xp/xpNeed(R.level)}%"></i></div></span>
    <span class="it">${icon('heart',1.8)} ${R.hp}/${R.maxHp}</span><span class="it">${icon('mana',1.8)} ${R.maxMana}</span><span class="it">${icon('coin',1.8)} ${R.talents}</span></div>`;
}
function tabsHTML(){
  const cur = ['forge','inn','training','scriptorium','world'].includes(screen) ? 'town' : screen;
  return `<nav class="tabs">${TABS.map(([id,label,ic])=>`<button class="${cur===id?'on':''}" onclick="tab('${id}')">${icon(ic,2.2)}${label}${id==='tree'&&treeDue()>0?'<span class="dot"></span>':''}</button>`).join('')}</nav>`;
}
function tab(id){ if(modal) return; R.treeFrom='town'; R.gearFrom='town'; R.deckFrom='town'; R.codexFrom='town'; if(id==='tree') R.treeSel=null; goto(id); }
function render(){
  const S = {town:townHTML, church:churchHTML, inn:innHTML, training:trainingHTML, scriptorium:scriptoriumHTML, world:worldHTML, mstory:mstoryHTML, pro1:pro1HTML, pro2:pro2HTML, pro3:pro3HTML, pro4:pro4HTML, title:titleHTML, codex:codexHTML, intro:introHTML, corridor:corridorHTML, bossintro:bossintroHTML, map:mapHTML, fight:fightHTML, reward:rewardHTML, shrine:shrineHTML, rest:restHTML, forge:forgeHTML, gear:gearHTML, study:studyHTML, tree:treeHTML, drop:dropHTML, lock:lockHTML, victory:victoryHTML, defeat:defeatHTML, deck:deckHTML};
  let html = (S[screen]||titleHTML)();
  if(R && HUD_ON.has(screen) && screen!=='intro') html = hudHTML() + html;
  const tabs = R && R.deck && R.deck.length && TAB_ON.has(screen); document.body.classList.toggle('has-tabs', !!tabs); if(tabs) html += tabsHTML();
  if(modal){ html += modal.kind==='recall'? recallHTML() : assemblyHTML(); }
  document.getElementById('app').innerHTML = html;
  const inp = document.getElementById('ans'); if(inp) inp.focus();
  if(document.getElementById('tw')) typeIt();
}
