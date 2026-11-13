/* Souls, levels, and the fruit-of-the-Spirit tree. */
function xpNeed(l){ return l+1; }
function gainXP(n){ R.souls+=n; R.xp+=n; if(R.earned) R.earned.souls=(R.earned.souls||0)+n; let up=0;
  while(R.xp>=xpNeed(R.level)){ R.xp-=xpNeed(R.level); R.level++; R.maxHp+=4; R.hp+=4; up++; }
  if(up){ R.levelUps=(R.levelUps||0)+up; R.levelHp=(R.levelHp||0)+4*up; if(R.earned) R.earned.leveled=true; } }   // render() opens the popup
// ---- Level-up popup: shows when a fight is over (or right away outside one) ----
function levelUpDue(){ return R && R.levelUps>0 && treeDue()>0 && (screen!=='fight' || R.after); }
function levelUpHTML(){
  const T = TEXT.levelUp, due = treeDue();
  const opts = FRUIT.filter(f=>!f.lock && (R.tree[f.b]||0)<3).map(f=>{ const g=R.tree[f.b]||0;
    return `<button class="wide lvopt" onclick="growFromPopup('${f.b}')">${IMG.icon[f.b]?`<img class="ico" src="${IMG.icon[f.b]}" width="32" height="32" alt="">`:''}<span><b>${fill(T.grow,{branch:f.b})} · ${g+1}/3</b><br><span class="sub">${TREE[f.b][g]}</span></span></button>`; }).join('');
  const locked = FRUIT.filter(f=>f.lock).map(f=>f.b);
  return `<div class="overlay levelup"><div class="panel"><div class="lvglow"></div><div class="lvfx">${sheetHTML('levelup', 0, 64, 2.4)}</div><h2>${fill(T.heading,{n:R.level})}</h2>
    <div class="lvbody">${due>1?fill(T.bodyMany,{hp:R.levelHp, n:due}):fill(T.body,{hp:R.levelHp})}</div>${opts}
    <div class="small mute" style="margin:6px 0 10px">${fill(T.locked,{branches:locked.join(', ')})}</div>
    <button class="wide" onclick="closeLevelUp()">${T.later}</button></div></div>`;
}
function growFromPopup(b){ modal=null; R.levelUps=Math.max(0, Math.min(R.levelUps-1, treeDue()-1)); if(!R.levelUps) R.levelHp=0; pickBranch(b); saveHero(); }
function closeLevelUp(){ R.levelUps=0; R.levelHp=0; modal=null; render(); }
function treeDue(){ return (R.level-1) - R.rank; }
const TREE = TEXT.tree.perks;
// All nine fruit of the Spirit, grown from the ground up: the three from Philadelphia first, then one branch per mission.
const FRUIT = [
  {b:'Patience',     col:'#c8961a'},
  {b:'Gentleness',   col:'#4f8a2a'},
  {b:'Peace',        col:'#4a9ad8'},
  {b:'Love',         col:'#c8507a', lock:TEXT.tree.locks.Love},
  {b:'Joy',          col:'#e8903a', lock:TEXT.tree.locks.Joy},
  {b:'Kindness',     col:'#2e9a8a', lock:TEXT.tree.locks.Kindness},
  {b:'Goodness',     col:'#c8502a', lock:TEXT.tree.locks.Goodness},
  {b:'Faithfulness', col:'#7a4d9a', lock:TEXT.tree.locks.Faithfulness},
  {b:'Self-control', col:'#2e5a8a', lock:TEXT.tree.locks['Self-control']},
];
// Where each fruit hangs on the painted tree (assets/source/tree/tree.png, 104x104), in tree pixels:
// three tiers of canopy, bottom-up in FRUIT order, so the tree fills in from the ground as missions open.
const SOCKET = [[30,68],[64,60],[98,66], [32,46],[64,42],[94,44], [40,26],[64,18],[88,28]].map(([x,y])=>[x-12,y-12]);
function fruitHTML(f,k){ const g=f.lock?0:(R.tree[f.b]||0), [x,y]=SOCKET[k], sel=R.treeSel&&R.treeSel.b===f.b, due=!f.lock&&g<3&&treeDue()>0;
  const pips = f.lock ? '' : `<span class="pips">${[0,1,2].map(t=>`<i class="${t<g?'on':''}" style="--c:${f.col}"></i>`).join('')}</span>`;
  const ico = f.lock ? `<span class="lockb">${pxgIcon()}</span>` : `<img src="${IMG.icon[f.b]}" alt="">`;
  return `<button class="fruit ${f.lock?'locked':''} ${g?'grown':''} ${sel?'sel':''} ${due?'due':''}" style="left:${(x/104*100-5.75).toFixed(2)}%;top:${(y/104*100-5.75).toFixed(2)}%;--c:${f.col}"
    onclick="treeSel('${f.b}')" aria-label="${f.b}${f.lock?', locked':`, ${g} of 3`}">${ico}${pips}</button>`; }
function treeSheet(){ const sel=R.treeSel; if(!sel) return ''; const f=FRUIT.find(x=>x.b===sel.b), T=TEXT.tree, due=treeDue();
  let body;
  if(f.lock) body = `<p>${fill(T.lockedUntil,{lock:f.lock})}</p><p class="small mute">${T.lockedNote}</p>`;
  else { const g=R.tree[f.b]||0;
    body = TREE[f.b].map((perk,t)=>{ const on=t<g, next=t===g;
      return `<div class="perk ${on?'on':next?'next':'later'}" style="--c:${f.col}"><span class="pip">${on?'✓':t+1}</span><div><div>${perk}</div>
        ${next&&due>0?`<button class="primary wide" onclick="pickBranch('${f.b}')">${T.growHere}</button>`: next?`<div class="small mute">${T.nextHere}</div>`: on?'':`<div class="small mute">${T.growBelowFirst}</div>`}</div></div>`; }).join(''); }
  const g = f.lock ? '' : ` <span class="mute">${R.tree[f.b]||0}/3</span>`;
  return `<div class="treesheet" onclick="if(event.target===this)treeSel(null)"><div class="panel">
    <div class="sheethead">${f.lock?pxgIcon():`<img src="${IMG.icon[f.b]}" width="32" height="32" alt="">`}<h2 style="color:${f.col}">${f.b}${g}</h2></div>${body}
    <button class="wide" onclick="treeSel(null)">Close</button></div></div>`; }
function treeHTML(){
  const due = treeDue(), T = TEXT.tree;
  const grown = FRUIT.filter(f=>!f.lock).reduce((n,f)=>n+(R.tree[f.b]||0),0);
  return `<h1>${T.heading}</h1><div class="panel small">${fill(T.summary,{level:R.level, grown})}${due>0?`<b>${due>1?fill(T.waitingMany,{n:due}):T.waitingOne}</b>`:T.everyLevel}</div>
    <div class="treebox"><div class="treeart"><img class="treeimg" src="${IMG.tree}" alt="The fruit of the Spirit">${FRUIT.map(fruitHTML).join('')}</div>
    <div class="small mute treehint">${T.tapHint}</div></div>${treeSheet()}
    <div class="dock"><button class="wide" onclick="saveHero(); goto(R.treeFrom||'town')">Back</button></div>`;
}
function treeSel(b){ R.treeSel = b ? {b} : null; render(); }
function pickBranch(b){ R.tree[b]++; R.rank++; if(b==='Peace' && R.tree.Peace===1) R.maxFocus+=2; R.treeSel={b}; render(); }
