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
  return `<div class="overlay levelup"><div class="panel"><div class="lvglow"></div><h2>${fill(T.heading,{n:R.level})}</h2>
    <div class="lvbody">${due>1?fill(T.bodyMany,{hp:R.levelHp, n:due}):fill(T.body,{hp:R.levelHp})}</div>${opts}
    <div class="small mute" style="margin:6px 0 10px">${fill(T.locked,{branches:locked.join(', ')})}</div>
    <button class="wide" onclick="closeLevelUp()">${T.later}</button></div></div>`;
}
function growFromPopup(b){ modal=null; R.levelUps=Math.max(0, Math.min(R.levelUps-1, treeDue()-1)); if(!R.levelUps) R.levelHp=0; pickBranch(b); saveHero(); }
function closeLevelUp(){ R.levelUps=0; R.levelHp=0; modal=null; render(); }
function treeDue(){ return (R.level-1) - R.rank; }
const TREE = TEXT.tree.perks;
// All nine fruit of the Spirit, grown from the ground up: the three from Emberford first, then one branch per mission.
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
const TW_=176, TH_=270, TX=88;
function branchY(k){ return 236 - k*25; }
function side(k){ return k%2 ? 1 : -1; }
function fruitPos(k,t){ const s=side(k); return [TX + s*(26 + t*21), branchY(k) - 4 - t*4]; }
function treeSVG(){
  let s = `<rect width="${TW_}" height="${TH_}" fill="#f3e2b6"/>`;
  // ground and roots
  s += `<rect y="${TH_-14}" width="${TW_}" height="14" fill="#b89a6a"/><rect y="${TH_-14}" width="${TW_}" height="2" fill="#8a6a48"/>`;
  s += `<polygon points="${TX-16},${TH_-12} ${TX-5},${TH_-26} ${TX+5},${TH_-26} ${TX+16},${TH_-12}" fill="#5a3c22"/>`;
  // canopy glow behind the grown part of the tree
  const top = FRUIT.findIndex(f=>f.lock); const reach = top<0 ? FRUIT.length : top;
  for(let k=0;k<reach;k++){ const y=branchY(k); s+=`<ellipse cx="${TX+side(k)*44}" cy="${y-8}" rx="44" ry="15" fill="#9cc46e" opacity=".22"/>`; }
  // trunk, tapering as it rises
  for(let y=TH_-26; y>branchY(8)-14; y-=2){ const w = 4 + (y-(branchY(8)-14))/(TH_-26-(branchY(8)-14))*7; s+=`<rect x="${TX-w}" y="${y-2}" width="${w*2}" height="2.2" fill="#6a4a2e"/><rect x="${TX-w}" y="${y-2}" width="1.4" height="2.2" fill="#8a6440"/>`; }
  // boughs
  FRUIT.forEach((f,k)=>{ const open=!f.lock; const g=open?(R.tree[f.b]||0):0; const sd=side(k); const y=branchY(k);
    const tip=fruitPos(k,2); s+=`<line x1="${TX}" y1="${y}" x2="${tip[0]+sd*8}" y2="${tip[1]-3}" stroke="${open?'#6a4a2e':'#b8a07a'}" stroke-width="${open?3:2}"/>`;
    for(let t=0;t<3;t++){ const [x,yy]=fruitPos(k,t); s+=`<line x1="${x}" y1="${yy+2}" x2="${x}" y2="${yy+5}" stroke="${open?'#6a4a2e':'#b8a07a'}" stroke-width="1"/>`; }
    if(open) for(let t=0;t<3;t++){ const [x,yy]=fruitPos(k,t); s+=`<ellipse cx="${x+sd*7}" cy="${yy-1}" rx="4" ry="2.4" fill="#5a8a3a"/><ellipse cx="${x-sd*7}" cy="${yy+1}" rx="3" ry="2" fill="#6e9a48"/>`; }
  });
  // fruit
  FRUIT.forEach((f,k)=>{ const open=!f.lock; const g=open?(R.tree[f.b]||0):0;
    for(let t=0;t<3;t++){ const [x,y]=fruitPos(k,t); const on=open&&g>t, next=open&&g===t, sel=R.treeSel&&R.treeSel.b===f.b&&R.treeSel.t===t; const c=f.col, sz=10;
      s+=`<g class="roomclick" role="button" tabindex="0" aria-label="${f.b} ${t+1}${f.lock?', locked':''}" onclick="treeSel('${f.b}',${t})" onkeydown="if(event.key==='Enter')treeSel('${f.b}',${t})">`;
      if(sel) s+=`<rect x="${x-sz/2-3}" y="${y-sz/2-3}" width="${sz+6}" height="${sz+6}" fill="${open?c:'#9a8a70'}" opacity=".3"/><rect x="${x-sz/2-2}" y="${y-sz/2-2}" width="${sz+4}" height="${sz+4}" fill="none" stroke="${open?c:'#9a8a70'}" stroke-width="1.2"/>`;
      if(!open){ s+=`<rect x="${x-sz/2}" y="${y-sz/2}" width="${sz}" height="${sz}" fill="#e2d2ac" stroke="#c0aa82" stroke-width="1"/>`; if(t===1) s+=pxg(LOCK,x-3.6,y-3.6,0.9); }
      else if(on && IMG.icon[f.b]){ const z=sz+4; s+=`<image href="${IMG.icon[f.b]}" x="${x-z/2}" y="${y-z/2}" width="${z}" height="${z}" style="image-rendering:pixelated"/>`; }
      else if(on){ s+=`<rect x="${x-sz/2}" y="${y-sz/2}" width="${sz}" height="${sz}" fill="${c}" stroke="#2a160c" stroke-width="1"/><rect x="${x-sz/2+1.5}" y="${y-sz/2+1.5}" width="3" height="3" fill="#fff" opacity=".7"/>`; }
      else s+=`<rect x="${x-sz/2}" y="${y-sz/2}" width="${sz}" height="${sz}" fill="#3a2616" stroke="${next?c:'#6a4a2e'}" stroke-width="${next?1.8:1}"/>`;
      s+=`</g>`; }
    const sd=side(k); const lx = TX + sd*46, ly = branchY(k) - 17;
    s+=`<text x="${lx}" y="${ly}" font-size="6" font-weight="700" font-family="'Pixelify Sans',sans-serif" fill="${f.lock?'#a8987a':f.col}" text-anchor="middle">${f.b}${open?` <tspan font-weight="500" fill="#8a6a48">${R.tree[f.b]||0}/3</tspan>`:''}</text>`;
  });
  return `<svg viewBox="0 0 ${TW_} ${TH_}" width="100%" shape-rendering="crispEdges" role="img" aria-label="The fruit of the Spirit">${s}</svg>`;
}
function treeHTML(){
  const due = treeDue(); const sel=R.treeSel; const T = TEXT.tree; let detail = `<div class="mute">${T.tapHint}</div>`;
  if(sel){ const f=FRUIT.find(x=>x.b===sel.b);
    if(f.lock) detail = `<div class="px" style="color:${f.col}">${f.b}</div><div style="margin:6px 0">${pxgIcon()} ${fill(T.lockedUntil,{lock:f.lock})}</div><div class="small mute">${T.lockedNote}</div>`;
    else { const g=R.tree[f.b]||0, on=g>sel.t, next=g===sel.t;
      detail = `<div class="px" style="color:${f.col}">${f.b} ${sel.t+1}${on?T.grown:''}</div><div style="margin:6px 0">${TREE[f.b][sel.t]}</div>${next&&due>0?`<button class="primary wide" onclick="pickBranch('${f.b}')">${T.growHere}</button>`: next?`<div class="small mute">${T.nextHere}</div>`: on?'':`<div class="small mute">${T.growBelowFirst}</div>`}`; } }
  const grown = FRUIT.filter(f=>!f.lock).reduce((n,f)=>n+(R.tree[f.b]||0),0);
  return `<h1>${T.heading}</h1><div class="panel small">${fill(T.summary,{level:R.level, grown})}${due>0?`<b>${due>1?fill(T.waitingMany,{n:due}):T.waitingOne}</b>`:T.everyLevel}</div>
    <div class="panel" style="padding:0;overflow:hidden">${treeSVG()}</div><div class="panel">${detail}</div>
    <button class="wide" onclick="saveHero(); goto(R.treeFrom||'town')">Back</button>`;
}
function treeSel(b,t){ R.treeSel={b,t}; render(); }
function pickBranch(b){ R.tree[b]++; R.rank++; if(b==='Peace' && R.tree.Peace===1) R.maxFocus+=2; R.treeSel={b, t:R.tree[b]-1}; render(); }
