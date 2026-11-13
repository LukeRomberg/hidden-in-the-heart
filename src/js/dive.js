/* Cave maps. Each cave is a small hand-drawn tile map you walk in the dark: the light around you
   reveals a few tiles, what you've seen stays dimly drawn, and nothing ahead shows until you get
   there. Tap a tile to walk to it. Stepping onto a fight, chest, campfire or the held townsperson
   opens it; chests and the campfire open right here under the map, fights switch to the arena
   and come back. Puzzles: verse doors (say a verse you carry, no slip), levers that open gates,
   and the boss door, which stays barred until everyone else in the cave is free.

   Map glyphs:  # rock   . floor   S start   B the held townsperson (CAVES[].boss)
     D boss door, opens once every fight on the map is cleared
     V verse door, opens when you say a verse you carry without a slip
     L lever, opens every G gate      K lever, opens every H gate
     1-9 a marker from that cave's marks: {t:'fight', e:[enemy ids]}, {t:'lock', tier}, {t:'rest'} */
const CAVES = [
  {id:'hollow', boss:'grudge', marks:{1:{t:'fight',e:['villager']}, 2:{t:'fight',e:['villager']}, 3:{t:'lock',tier:1}, 4:{t:'rest'}}, map:[
    '##############',
    '#####...######',
    '#####.B.######',
    '#####...######',
    '######D#######',
    '###.....4#...#',
    '###2.....#L#.#',
    '####.....###.#',
    '######G#####.#',
    '######.#####V#',
    '##..3#.#####.#',
    '##.###.#####.#',
    '#............#',
    '#.####1#####.#',
    '#.####.###...#',
    '#..###.###.###',
    '######S#######',
    '##############',
  ]},
  {id:'quarry', boss:'brawler', marks:{1:{t:'fight',e:['villager']}, 2:{t:'fight',e:['villager','villager']}, 3:{t:'fight',e:['villager_strong']},
    4:{t:'rest'}, 5:{t:'lock',tier:1}, 6:{t:'lock',tier:2}}, map:[
    '###############',
    '######...######',
    '######.B.######',
    '######...######',
    '#######D#######',
    '##4.........###',
    '##..#..3..#..##',
    '##...........##',
    '#######H#######',
    '#6#.........###',
    '#.#..#...#..#K#',
    '#V#.........2.#',
    '#...#...#...#5#',
    '###.###.###.###',
    '#...###1###..##',
    '#######.#######',
    '#######S#######',
    '###############',
  ]},
  {id:'deep', boss:'slanderer', marks:{1:{t:'fight',e:['villager']}, 2:{t:'fight',e:['villager_strong']}, 3:{t:'fight',e:['villager_strong','villager']},
    4:{t:'rest'}, 5:{t:'lock',tier:2}, 6:{t:'lock',tier:2}}, map:[
    '################',
    '#######...######',
    '#######.B.######',
    '#######...######',
    '########D#######',
    '###4.........###',
    '###.3........###',
    '#########H######',
    '###.....#.######',
    '###.###.#.######',
    '###.#...#.##6###',
    '###.#.###.##.###',
    '###.#.2..K##.###',
    '###.########.###',
    '###..........###',
    '#######V########',
    '#..G...........#',
    '#.####.#.####.##',
    '#5####.1.####.##',
    '#######.#####.L#',
    '#######S########',
    '################',
  ]},
];
const FRAGS = [CHUNKS[0]+' '+CHUNKS[1], CHUNKS[2]+' '+CHUNKS[3], CHUNKS[4]+' '+CHUNKS[5], CHUNKS[6]+' '+CHUNKS[7]];   // the Furnace's first fire
const LEVERS = {L:'G', K:'H'};      // lever glyph -> the gates it opens
const MAP_T = 40, STEP_MS = 120, SIGHT = 3.3;   // tile size in px, walking speed, how far the light reaches (tiles)

function caveOpen(i){ return i===0 || !!P.caves[CAVES[i-1].id]; }
function allCavesDone(){ return CAVES.every(c=>P.caves[c.id]); }
// the parsed map of cave i: size, rows, start, and the marker spec on every marker tile
const MAPS = {};
function caveMap(i){
  if(MAPS[i]) return MAPS[i];
  const c = CAVES[i], rows = c.map, H = rows.length, W = rows[0].length, mk = {}; let start = [1,1];
  rows.forEach((row,y)=>Array.from(row).forEach((ch,x)=>{
    if(ch==='S') start=[x,y];
    if(ch==='B') mk[x+','+y] = {t:'boss', e:[c.boss]};
    if(c.marks[ch]) mk[x+','+y] = {...c.marks[ch]};
  }));
  Object.entries(mk).forEach(([id,m])=>m.id=id);
  return MAPS[i] = {W, H, rows, start, mk};
}

// ---- Entering, leaving, saving ----
function startCave(i){
  if(!caveOpen(i)) return;
  if(R.hp < R.maxHp*0.3){ toast(TEXT.church.tooHurt); return; }
  Object.assign(R, {cave:i, room:null, node:null, enemies:[], helmUsed:false, boss:null});
  R.map = freshMap(i); R.map.msg = TEXT.dive.walkHint;
  saveRun(); goto('caveintro');
}
function freshMap(i){ const m = caveMap(i); return {pos:m.start.slice(), face:'back', seen:new Array(m.W*m.H).fill(0), done:[], open:[], msg:null, vis:new Set()}; }
// P.run = {v:2, cave, pos, face, seen:'0110…', done:[marker ids], open:[door and lever ids]}
function saveRun(){
  const M = R.map; if(!M || R.cave==null) return;
  P.run = {v:2, cave:R.cave, pos:M.pos.slice(), face:M.face, seen:M.seen.join(''), done:M.done.slice(), open:M.open.slice()};
  saveHero();
}
// back on the map after a reload; anything that no longer fits the map (it was redrawn) starts over
function resumeCave(run){
  const i = run.cave, m = caveMap(i), M = freshMap(i);
  Object.assign(R, {cave:i, room:null, node:null, enemies:[], boss:null}); R.map = M;
  if(typeof run.seen==='string' && run.seen.length===m.W*m.H){
    M.seen = Array.from(run.seen, Number);
    M.done = (run.done||[]).filter(id=>m.mk[id]); M.open = (run.open||[]).slice();
    if(Array.isArray(run.pos) && walkable(run.pos[0], run.pos[1])) M.pos = run.pos.slice();
    if(run.face==='front') M.face = 'front';
  }
  M.msg = TEXT.dive.resume; goto('dive');
}
function caveIntroHTML(){
  const C = TEXT.caves[R.cave];
  return `${caveScene()}${talk('caveintro'+R.cave, C.intro, `<button class="primary wide" onclick="goto('dive')">${TEXT.dive.enter}</button>`)}`;
}
// each cave's scene, with you from behind at the mouth of the tunnel (scene heights in scene pixels)
const CAVE_H = {hollow:160, quarry:160, deep:142};
function caveScene(){ const id = CAVES[R.cave].id, H = CAVE_H[id];
  return sceneHTML(IMG.cave[id], [{html:sprite('back',0,1), x:128, y:H-64, w:64}], H); }

// ---- What's on a tile ----
function tileAt(x,y){ const m = caveMap(R.cave); return (y>=0 && y<m.H && x>=0 && x<m.W) ? m.rows[y][x] : '#'; }
const tid = (x,y)=>x+','+y;
function isDone(x,y){ return R.map.done.includes(tid(x,y)); }
function isOpen(x,y){ return R.map.open.includes(tid(x,y)); }
function leverFor(gate){ return Object.keys(LEVERS).find(l=>LEVERS[l]===gate); }
function leverPulled(lever){ const m = caveMap(R.cave); return R.map.open.some(id=>{ const [x,y]=id.split(',').map(Number); return m.rows[y] && m.rows[y][x]===lever; }); }
// an uncleared marker (fight, chest, campfire, the held townsperson) or null
function markAt(x,y){ const m = caveMap(R.cave).mk[tid(x,y)]; return m && !isDone(x,y) ? m : null; }
function closedAt(x,y){ const c = tileAt(x,y);
  if(c==='D' || c==='V') return !isOpen(x,y);
  if(LEVERS[leverFor(c)]===c) return !leverPulled(leverFor(c));
  return false; }
function walkable(x,y){ const c = tileAt(x,y);
  if(c==='#') return false;
  if(c==='D' || c==='V' || leverFor(c)) return !closedAt(x,y);
  if(caveMap(R.cave).mk[tid(x,y)]) return isDone(x,y);
  return true; }
function blocksSight(x,y){ const c = tileAt(x,y); return c==='#' || ((c==='D' || c==='V') && !isOpen(x,y)); }   // you can see through a gate's bars
function fightsLeft(){ return Object.values(caveMap(R.cave).mk).filter(m=>m.t==='fight' && !R.map.done.includes(m.id)).length; }

// ---- Light: a few tiles around you, cut off by rock ----
function inSight(hx,hy,x,y){
  const dx = x-hx, dy = y-hy; if(Math.abs(dx)<=1 && Math.abs(dy)<=1) return true;
  if(dx*dx+dy*dy > SIGHT*SIGHT) return false;
  const n = Math.ceil(Math.hypot(dx,dy)*4);
  for(let s=1;s<n;s++){ const tx = Math.floor(hx+.5+dx*s/n), ty = Math.floor(hy+.5+dy*s/n);
    if((tx!==x || ty!==y) && (tx!==hx || ty!==hy) && blocksSight(tx,ty)) return false; }
  return true;
}
// recompute what's lit; marks it seen, redraws tiles that changed, returns the tiles seen for the first time
function updateSight(){
  const M = R.map, m = caveMap(R.cave), [hx,hy] = M.pos, r = Math.ceil(SIGHT), vis = new Set(), fresh = [];
  for(let y=hy-r;y<=hy+r;y++) for(let x=hx-r;x<=hx+r;x++){
    if(x<0||y<0||x>=m.W||y>=m.H || !inSight(hx,hy,x,y)) continue;
    const k = y*m.W+x; vis.add(k); if(!M.seen[k]){ M.seen[k]=1; fresh.push(k); } }
  const changed = new Set([...vis].filter(k=>!M.vis.has(k)).concat([...M.vis].filter(k=>!vis.has(k))));
  M.vis = vis; changed.forEach(k=>redrawTile(k)); return fresh;
}
function redrawTile(k){ const el = document.getElementById('t'+k); if(!el) return; const m = caveMap(R.cave), x = k%m.W, y = (k-x)/m.W;
  el.className = tileCls(x,y); el.innerHTML = tileInner(x,y); }

// ---- Walking: BFS over tiles you've seen; a marker can end a path but not be walked through ----
function reach(){
  const M = R.map, m = caveMap(R.cave), [sx,sy] = M.pos, dist = new Map([[tid(sx,sy),0]]), from = new Map(), q = [[sx,sy]];
  while(q.length){ const [x,y] = q.shift(), d = dist.get(tid(x,y));
    if((x!==sx || y!==sy) && !walkable(x,y)) continue;   // markers are dead ends
    for(const [nx,ny] of [[x,y-1],[x+1,y],[x,y+1],[x-1,y]]){ const id = tid(nx,ny);
      if(dist.has(id) || nx<0||ny<0||nx>=m.W||ny>=m.H || !M.seen[ny*m.W+nx]) continue;
      if(!walkable(nx,ny) && !markAt(nx,ny)) continue;
      dist.set(id, d+1); from.set(id, [x,y]); q.push([nx,ny]); } }
  return {dist, path(x,y){ const p = [[x,y]]; let id = tid(x,y); while(from.has(id)){ const f = from.get(id); p.unshift(f); id = tid(...f); } return p; }};
}
// tap a tile: walk there; tap a closed door to walk up to it and try it; tap the dark to go as near as you can
function planTo([x,y]){
  const M = R.map, m = caveMap(R.cave), Rc = reach(), seen = M.seen[y*m.W+x];
  if(seen && closedAt(x,y)){
    const next = [[x,y-1],[x+1,y],[x,y+1],[x-1,y]].filter(([a,b])=>Rc.dist.has(tid(a,b)) && walkable(a,b)).sort((a,b)=>Rc.dist.get(tid(...a))-Rc.dist.get(tid(...b)))[0];
    if(next) return {path:Rc.path(...next), then:()=>bump(x,y)};
  }
  if(seen && Rc.dist.has(tid(x,y))) return {path:Rc.path(x,y)};
  let best = null, score = Infinity;
  Rc.dist.forEach((d,id)=>{ const [a,b] = id.split(',').map(Number); if(markAt(a,b)) return;
    const s = Math.hypot(a-x,b-y)*1000 + d; if(s<score){ score=s; best=[a,b]; } });
  return best ? {path:Rc.path(...best)} : null;
}
function mapTap(ev){
  if(modal || R.room || R.node || screen!=='dive') return;   // R.node: a fight is starting
  const r = document.getElementById('cmap').getBoundingClientRect();
  const x = Math.floor((ev.clientX-r.left)/MAP_T), y = Math.floor((ev.clientY-r.top)/MAP_T);
  const [hx,hy] = R.map.pos;
  if(x===hx && y===hy && !R.map.walking) return;
  R.map.goal = [x,y]; if(!R.map.walking) walkLoop();
}
async function walkLoop(){
  const M = R.map; M.walking = true; heroEl('add');
  try{
    while(M.goal && screen==='dive' && !modal && !R.room){
      const plan = planTo(M.goal); M.goal = null; if(!plan) break;
      let stop = false;
      for(let i=1;i<plan.path.length && !stop;i++){
        const next = plan.path[i], m = markAt(...next);
        if(m){ face(next); trigger(m); stop = true; break; }   // you stop in front of it, facing it
        const fresh = stepTo(...next); await sleep(STEP_MS);
        if(screen!=='dive' || R.map!==M) return;
        stop = arrive(fresh, plan.path[plan.path.length-1]);
        if(M.goal) break;   // tapped somewhere else mid-walk: replan from here
      }
      if(!stop && !M.goal && plan.then && plan.path.length) plan.then();
    }
  } finally { M.walking = false; heroEl('remove'); }
  if(screen==='dive' && R.map===M) saveRun();
}
function stepTo(x,y){ face([x,y]); R.map.pos = [x,y]; const fresh = updateSight(); placeHero(); return fresh; }
// only back and front frames exist, so a sideways step keeps the last up/down facing
function face([x,y]){ const M = R.map, py = M.pos[1]; if(y<py) M.face='back'; else if(y>py) M.face='front'; placeHero(); }
// after each step: a lever underfoot gets pulled; something new in the light gets a line
function arrive(fresh, goal){
  const M = R.map, [x,y] = M.pos, c = tileAt(x,y);
  if(LEVERS[c] && !isOpen(x,y)){ pullLever(x,y); return true; }
  const m2 = caveMap(R.cave), spots = fresh.map(k=>[k%m2.W, Math.floor(k/m2.W)]);
  const mark = spots.map(p=>markAt(...p)).find(Boolean);
  if(mark){ say(markHint(mark)); return mark.id!==tid(...goal) && tid(x,y)!==tid(...goal); }   // stop to look at it, unless you were headed there anyway
  const seenThing = spots.map(p=>tileAt(...p)).find(t=>'DVLK'.includes(t) || leverFor(t));
  if(seenThing) say(TEXT.dive[seenThing==='D'?'bossDoorSeen' : seenThing==='V'?'verseSeen' : LEVERS[seenThing]?'leverSeen' : 'gateSeen']);
  return false;
}
function markHint(m){ const D = TEXT.dive;
  if(m.t==='boss') return TEXT.caves[R.cave].bossLead;
  return D.hints[m.t==='fight' && m.e.length>1 ? 'fightMany' : m.t]; }
function say(msg){ R.map.msg = msg; const el = document.getElementById('cavemsg'); if(el) el.innerHTML = msg; }
function heroEl(op){ const h = document.getElementById('chero'); if(h) h.classList[op]('walking'); }
function placeHero(){
  const h = document.getElementById('chero'), mp = document.getElementById('cmap'); if(!h || !mp) return;
  const [x,y] = R.map.pos; h.style.transform = `translate(${x*MAP_T}px,${y*MAP_T}px)`; h.style.zIndex = y*2+1; mp.style.transform = camera();
  if(h.dataset.face!==R.map.face){ h.dataset.face = R.map.face; h.querySelector('.hs').innerHTML = heroSprite(); }
}
function heroSprite(){ return sprite(R.map.face==='back'?'back':'player',0,0.8); }
function camera(){ const [x,y] = R.map.pos; return `translate(${-(x+.5)*MAP_T}px,${-(y+.5)*MAP_T}px)`; }

// ---- Markers, doors and levers ----
function trigger(m){
  R.node = m;
  if(m.t==='fight'){ R.node = {...m, e:m.e.map(standIn)}; saveRun(); startFight(R.node.e); return; }
  R.room = m.t; render();   // lock, rest, boss: a panel under the map
}
function notNow(){ R.room=null; R.node=null; render(); }
function faceBoss(){ const n = R.node; R.node = {...n, t:'elite', caveBoss:true, e:n.e.map(standIn)}; R.room=null; saveRun(); startFight(R.node.e); }
function bump(x,y){ const c = tileAt(x,y), D = TEXT.dive;
  if(c==='D'){ const n = fightsLeft();
    if(n){ say(fill(D.bossDoorShut,{n})); return; }
    R.map.open.push(tid(x,y)); say(D.bossDoorOpen); updateSight(); redrawTile(y*caveMap(R.cave).W+x); saveRun(); return; }
  if(c==='V'){ R.room='verse'; R.node={door:[x,y]}; render(); return; }
  say(D.gateShut);
}
function pullLever(x,y){ const m = caveMap(R.cave), gate = LEVERS[tileAt(x,y)];
  R.map.open.push(tid(x,y)); say(TEXT.dive.leverPulled);
  m.rows.forEach((row,gy)=>Array.from(row).forEach((c,gx)=>{ if(c===gate) redrawTile(gy*m.W+gx); }));
  redrawTile(y*m.W+x); updateSight(); saveRun(); }
function sayAtDoor(ref){
  const [x,y] = R.node.door, D = TEXT.dive;
  openRecall(BY_REF[ref], frac=>{ recordResult(ref,frac);
    if(frac>=SLIP_BELOW){ R.map.open.push(tid(x,y)); R.room=null; R.node=null; R.map.msg = D.verseOpen; saveRun(); }
    else toast(D.verseShut);
    render(); }, undefined, D.verseTitle);
}
// After a fight, chest or campfire: back on the map with that marker gone for good, or out of the cave
// after the boss. (The name is from the old column map; combat.js calls it when a fight is over.)
function clearColumn(){
  const n = R.node; R.room=null; R.node=null;
  if(n && n.caveBoss){ caveDone(); return; }
  if(n && n.id && !R.map.done.includes(n.id)) R.map.done.push(n.id);
  R.map.msg = null; saveRun(); goto('dive');
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

// ---- Drawing the map: tiles drawn in code (placeholder art until a tileset is approved) ----
// base look of a tile: rock top, rock face (rock with open ground below it), floor, floor in a wall's shadow
function baseOf(x,y){
  const c = tileAt(x,y), solid = (a,b)=>{ const t = tileAt(a,b); return t==='#' || t==='D' || t==='V'; };
  if(c==='#') return solid(x,y+1) ? 'rk' : 'rf';
  if(c==='D' || c==='V') return 'rf';
  return solid(x,y-1) ? 'fl sh' : 'fl';
}
function tileCls(x,y){
  const M = R.map, m = caveMap(R.cave), k = y*m.W+x, v = ((x*7+y*13+x*y*3)%4+4)%4;
  return `tl ${baseOf(x,y)} v${v} ${!M.seen[k]?'u':M.vis.has(k)?'lit':'dim'}`;
}
function tileInner(x,y){
  const M = R.map, m = caveMap(R.cave); if(!M.seen[y*m.W+x]) return '';
  const c = tileAt(x,y), art = n=>`<img class="mk" src="${caveArt()[n]}" alt="">`;
  if(c==='D') return art(isOpen(x,y)?'doorOpen':'door');
  if(c==='V') return art(isOpen(x,y)?'doorOpen':'verseDoor') + (isOpen(x,y)?'':'<i class="glow"></i>');
  if(LEVERS[c]) return art(isOpen(x,y)?'leverDown':'leverUp');
  if(leverFor(c)) return art(closedAt(x,y)?'gate':'gateUp');
  const mk = markAt(x,y); if(!mk) return '';
  if(mk.t==='lock') return art('chest');
  if(mk.t==='rest') return art('logs')+`<img class="mk flame" src="${caveArt().flame}" alt="">`;
  // people: still held, so a shadow with an angry glow; the named townsperson is drawn as themselves
  if(mk.t==='boss' && standIn(mk.e[0])===mk.e[0]){ const E = ENEMY_IMG[mk.e[0]]; return `<img class="mk who boss" src="${E.f[0]}" alt="">`; }
  return mk.e.map((e,i)=>`<img class="mk who shade n${mk.e.length}-${i}" src="${FREED_IMG['freed'+((x+y+i*3)%6)].f[0]}" alt="">`).join('');
}
function mapHTML(){
  const M = R.map, m = caveMap(R.cave), C = TEXT.caves[R.cave]; caveTiles();
  M.vis = new Set(); const [hx,hy] = M.pos;
  for(let y=0;y<m.H;y++) for(let x=0;x<m.W;x++) if(inSight(hx,hy,x,y)){ const k=y*m.W+x; M.vis.add(k); M.seen[k]=1; }
  let tiles = '';
  for(let y=0;y<m.H;y++) for(let x=0;x<m.W;x++) tiles += `<div class="${tileCls(x,y)}" id="t${y*m.W+x}" style="left:${x*MAP_T}px;top:${y*MAP_T}px;z-index:${y*2}">${tileInner(x,y)}</div>`;
  const hero = `<div id="chero" class="chero" data-face="${M.face}" style="transform:translate(${hx*MAP_T}px,${hy*MAP_T}px);z-index:${hy*2+1}"><div class="hs">${heroSprite()}</div></div>`;
  return `<div class="cave-view ${R.room?'short':''}" onclick="mapTap(event)" role="application" aria-label="${C.name}">
    <div id="cmap" class="cmap c-${CAVES[R.cave].id}" style="width:${m.W*MAP_T}px;height:${m.H*MAP_T}px;transform:${camera()}">${tiles}${hero}</div>
    <div class="torch"></div><div class="cavename">${C.name}</div></div>`;
}
function diveHTML(){
  const D = TEXT.dive, T = TEXT.rooms;
  if(!R.map) R.map = freshMap(R.cave);
  const tools = `<div class="row divetools"><button onclick="R.gearFrom='dive';goto('gear')">Gear</button><button onclick="R.treeFrom='dive';R.treeSel=null;goto('tree')">Tree</button><button onclick="R.deckFrom='dive';goto('deck')">Deck</button><button onclick="if(confirm(TEXT.dive.leaveConfirm)) retreat()">${D.leave}</button></div>`;
  const back = label=>`<button class="wide" onclick="notNow()">${label}</button>`;
  let body, dock;
  if(R.room==='lock'){ body = lockPanel(); dock = `<button class="primary wide" onclick="pickLock()">${T.pickLock}</button>${back(D.notNow)}`; }
  else if(R.room==='rest'){ body = restPanel(); dock = back(D.notNow); }
  else if(R.room==='boss'){ body = `<div class="panel cavemsg">${TEXT.caves[R.cave].bossLead}</div>`; dock = `<button class="primary wide" onclick="faceBoss()">${D.face}</button>${back(D.notYet)}`; }
  else if(R.room==='verse'){ body = versePanel(); dock = `<button class="wide" onclick="R.room=null;R.node=null;render()">${D.notNow}</button>`; }
  else { body = `<div class="panel cavemsg" id="cavemsg">${R.map.msg || D.walkHint}</div>`; dock = tools; }
  return `${mapHTML()}${body}<div class="dock">${dock}</div>`;
}
function versePanel(){
  const D = TEXT.dive, refs = [...new Set(R.deck.map(c=>c.ref))];
  return `<div class="panel"><h2>${D.verseHeading}</h2><p class="small">${D.verseBody}</p>
    ${refs.map(ref=>`<button class="wide" onclick="sayAtDoor('${ref}')">${spellLine(ref)} · ${TIER_NAME[sp(ref).tier]}</button>`).join('')}</div>`;
}

// Pixel textures for the map, drawn once per cave into data URIs: rock, rock face, floor, and the
// objects on top. Colors per cave: the Hollow warm earth, the Quarry grey stone, the Deep Cave blue-black.
const CAVE_PAL = {
  hollow:{fl:['#5e422a','#6e4e32','#7a5638','#8a6440','#9c7650'], rk:['#2e231b','#3a2c22','#47372a'], rf:['#2a1f18','#45342a','#56412f','#6a523e','#82684c']},
  quarry:{fl:['#554b3f','#62584a','#6e6352','#7c705e','#91846e'], rk:['#2a2825','#35322e','#423e39'], rf:['#262420','#403d38','#524e47','#67625a','#827c71']},
  deep:  {fl:['#3a3430','#443d37','#4e463e','#5a5148','#6a6054'], rk:['#1d2027','#262a33','#31353f'], rf:['#16181e','#2a2d36','#383c48','#4a4f5e','#606678']},
};
const artCache = {};
function pxCanvas(w,h,draw){ const c = document.createElement('canvas'); c.width=w; c.height=h; const g = c.getContext('2d'); draw((x,y,col,ww=1,hh=1)=>{ g.fillStyle=col; g.fillRect(x,y,ww,hh); }); return c.toDataURL(); }
function rnd(seed){ let s = seed>>>0 || 1; return ()=>((s = (s*1664525+1013904223)>>>0) / 4294967296); }
function caveTiles(){
  const id = CAVES[R.cave].id; if(document.getElementById('tiles-'+id)) return;
  const P_ = CAVE_PAL[id], css = [];
  for(let v=0;v<4;v++){
    const r = rnd(id.length*977+v*131+7);
    css.push(`.c-${id} .fl.v${v}{background-image:url(${pxCanvas(16,16,px=>{ px(0,0,P_.fl[2],16,16);
      for(let i=0;i<40;i++) px(Math.floor(r()*16), Math.floor(r()*16), P_.fl[r()<.5?1:3]);
      for(let i=0;i<10;i++) px(Math.floor(r()*16), Math.floor(r()*16), P_.fl[0]);
      for(let i=0;i<2;i++){ const x=Math.floor(r()*13), y=Math.floor(r()*13); px(x,y,P_.fl[4],2,1); px(x,y+1,P_.fl[0],2,1); } })})}`);
    css.push(`.c-${id} .rk.v${v}{background-image:url(${pxCanvas(16,16,px=>{ px(0,0,P_.rk[1],16,16);
      for(let i=0;i<30;i++) px(Math.floor(r()*16), Math.floor(r()*16), P_.rk[r()<.5?0:2]);
      for(let i=0;i<3;i++){ const x=Math.floor(r()*14), y=Math.floor(r()*14); px(x,y,P_.rk[2],2,2); px(x+1,y+1,P_.rk[0]); } })})}`);
    css.push(`.c-${id} .rf.v${v}{background-image:url(${pxCanvas(16,16,px=>{ px(0,0,P_.rf[2],16,16); px(0,0,P_.rf[4],16,1); px(0,1,P_.rf[3],16,1);
      const o = v%2 ? 4 : 0;
      [5,10].forEach((y,j)=>{ px(0,y,P_.rf[1],16,1); px(0,y+1,P_.rf[3],16,1); for(let x=(o+j*5)%8;x<16;x+=8) px(x,j?y+1:2,P_.rf[1],1,j?4:3); });
      for(let i=0;i<14;i++) px(Math.floor(r()*16), 2+Math.floor(r()*12), P_.rf[r()<.5?1:3]);
      px(0,14,P_.rf[1],16,1); px(0,15,P_.rf[0],16,1); })})}`);
  }
  const st = document.createElement('style'); st.id = 'tiles-'+id; st.textContent = css.join('\n'); document.head.appendChild(st);
}
// objects on the map, 16x16 pixel grids: k outline, w wood, W light wood, d dark wood, g gold, G dark gold,
// i iron, I light iron, j dark iron, s stone, S light stone, t dark stone, r ember, o flame, y yellow, Y white-hot, x shadow
const ART_PAL = {k:'#1e140c', w:'#8a5a2e', W:'#b07a40', d:'#5e3a1c', g:'#f2c84a', G:'#a67a12', i:'#4a4c54', I:'#7c808a', j:'#2a2b30',
  s:'#8a8272', S:'#aaa290', t:'#5a5448', r:'#c8502a', o:'#e8903a', y:'#f2d25a', Y:'#fff4c0', x:'rgba(0,0,0,.35)', n:'#0b0806'};
const ART = {
  chest:['................','................','................','...kkkkkkkkkk...','..kWWWWWWWWWWk..','..kwwwwwwwwwwk..','..kwwwwggwwwwk..','..kkkkkgGkkkkk..',
         '..kdddwgGwdddk..','..kwwwwggwwwwk..','..kwwwwwwwwwwk..','..kddddddddddk..','..kkkkkkkkkkkk..','...xxxxxxxxxx...','................','................'],
  logs: ['................','................','................','................','................','................','................','................',
         '................','................','...kdk....kdk...','..kWwwdkkdwwWk..','..kdwwwWWwwwdk..','.tSkkkkkkkkkkSt.','..tSt.tSt.tSt...','................'],
  flame:['................','................','.......y........','......yo........','......ooy.......','.....oyyo.......','.....ryyor......','....royYyo......',
         '....royYYor.....','.....roYyr......','......ror.......','................','................','................','................','................'],
  leverUp:  ['................','................','...kk...........','..krrk..........','..krrk..........','...kkI..........','.....Ij.........','......Ij........',
             '.......Ij.......','........Ij......','......kkkkk.....','.....ktttttk....','.....kssssSk....','.....kkkkkkk....','......xxxxx.....','................'],
  leverDown:['................','................','...........kk...','..........krrk..','..........krrk..','..........Ikk...','.........jI.....','........jI......',
             '.......jI.......','......jI........','......kkkkk.....','.....ktttttk....','.....kssssSk....','.....kkkkkkk....','......xxxxx.....','................'],
  gate:  ['jIjjIjjIjjIjjIjj','jIj.jIj.jIj.jIj.','jIj.jIj.jIj.jIj.','jjjjjjjjjjjjjjjj','IIIIIIIIIIIIIIII','jIj.jIj.jIj.jIj.','jIj.jIj.jIj.jIj.','jIj.jIj.jIj.jIj.',
          'jIj.jIj.jIj.jIj.','jIj.jIj.jIj.jIj.','jjjjjjjjjjjjjjjj','IIIIIIIIIIIIIIII','jIj.jIj.jIj.jIj.','jIj.jIj.jIj.jIj.','jIj.jIj.jIj.jIj.','jyj.jyj.jyj.jyj.'],
  gateUp:['jIjjIjjIjjIjjIjj','jjjjjjjjjjjjjjjj','jIj.jIj.jIj.jIj.','.x...x...x...x..','................','................','................','................',
          '................','................','................','................','................','................','................','................'],
  door:  ['..kkkkkkkkkkkk..','.kdWwwdWwwdWwdk.','.kdWwwdWwwdWwdk.','.kdwwwdwwwdwwdk.','.kjjjjjjjjjjjjk.','.kdWwwdWwwdWwdk.','.kdwwwdwwwdwwdk.','.kkkkkkkkkkkkkk.',
          '.kGggggggggggGk.','.kkkkkkkkkkkkkk.','.kdwwwdwwwdwwdk.','.kdwwwdwgwdwwdk.','.kjjjjjjjjjjjjk.','.kdwwwdwwwdwwdk.','.kdwwwdwwwdwwdk.','kkkkkkkkkkkkkkkk'],
  verseDoor:['..kkkkkkkkkkkk..','.ktSSSSSSSSSSSk.','.ktsssssssssssk.','.kts.gg.g.ggssk.','.ktsssssssssssk.','.kts.g.ggg.g.sk.','.ktsssssssssssk.','.kts.ggg.gg.ssk.',
             '.ktsssssssssssk.','.kts.gg.gggg.sk.','.ktsssssssssssk.','.ktsssssssssssk.','.kttttttttttttk.','.ktsssssssssssk.','.kttttttttttttk.','kkkkkkkkkkkkkkkk'],
  doorOpen:['..kkkkkkkkkkkk..','.knnnnnnnnnnnnk.','.knnnnnnnnnnnnk.','.knnnnnnnnnnnnk.','.knnnnnnnnnnnnk.','.knnnnnnnnnnnnk.','.knnnnnnnnnnnnk.','.knnnnnnnnnnnnk.',
            '.knnnnnnnnnnnnk.','.knnnnnnnnnnnnk.','.knnnnnnnnnnnnk.','.knnnnnnnnnnnnk.','.knnnnnnnnnnnnk.','.knnnnnnnnnnnnk.','.knnnnnnnnnnnnk.','.knnnnnnnnnnnnk.'],
};
function caveArt(){ if(!artCache.done){ Object.entries(ART).forEach(([n,rows])=>artCache[n]=pxCanvas(16,16,px=>rows.forEach((row,y)=>Array.from(row).forEach((c,x)=>{ if(c!=='.') px(x,y,ART_PAL[c]); })))); artCache.done=true; } return artCache; }

// ---- Rooms that open under the map ----
function rewardHTML(){
  return `<h1>${TEXT.rooms.chestHeading}</h1><h2>${TEXT.rooms.chestTake}</h2><div class="hand">${R.reward.map(ref=>`<div onclick="takeReward('${ref}')">${cardView(BY_REF[ref])}</div>`).join('')}</div>
    <div class="dock"><button class="wide" onclick="clearColumn()">${TEXT.rooms.chestLeave}</button></div>`;
}
function takeReward(ref){ addVerse(ref); clearColumn(); }
function restPanel(){
  return `<div class="panel">${TEXT.rooms.restBody}
    <button class="wide" onclick="R.hp=Math.min(R.maxHp,R.hp+12);toast(TEXT.rooms.slept);clearColumn()">${TEXT.rooms.sleep}</button>
    <button class="wide" onclick="screen='study';render()">${TEXT.rooms.study}</button></div>
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
  return `<div class="panel"><h2>${T.lockHeading}</h2>${T.lockBody} <span class="mute">${spec.verse?T.lockBig:T.lockSmall}</span>
    <div class="small mute" style="margin-top:8px">${fill(spec.mistakes?T.lockRules:T.lockRulesNone,{pieces:spec.pieces, mistakes:spec.mistakes})}</div></div>`;
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
