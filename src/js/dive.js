/* Cave maps. Each cave is a small hand-drawn tile map you walk in the dark: the light around you
   reveals a few tiles, what you've seen stays dimly drawn, and nothing ahead shows until you get
   there. Tap a tile to walk to it. Stepping onto a fight, chest, campfire or the held townsperson
   opens it; chests and the campfire open right here under the map, fights switch to the arena
   and come back. Puzzles: verse doors (say a verse you carry, no slip), levers that open gates,
   and the boss door, which stays barred until everyone else in the cave is free.
   Walking, light, camera and drawing are the shared map engine in tilemap.js; this file is the cave's rules.

   Map glyphs:  # rock   . floor   S start   B the held townsperson (CAVES[].boss)
     D boss door, opens once every fight on the map is cleared
     V verse door, opens when you say a verse you carry without a slip
     L lever, opens every G gate      K lever, opens every H gate
     1-9 a marker from that cave's marks: {t:'fight', e:[enemy ids]}, {t:'lock', tier}, {t:'rest'}
     a-z (lowercase) the encounters in encounters.js: {t:'scrap', truth}, {t:'truth', truth, amos}, {t:'hurt', who} */
const CAVES = [
  {id:'hollow', boss:'grudge', marks:{1:{t:'fight',e:['villager']}, 2:{t:'fight',e:['villager']}, 3:{t:'lock',tier:1}, 4:{t:'rest'}, a:{t:'scrap',truth:'even'}, b:{t:'scrap',truth:'account'}, c:{t:'scrap',truth:'sun'},
    t:{t:'truth',truth:'account',amos:'even'}, u:{t:'truth',truth:'sun'}}, map:[
    '##############',
    '#####...######',
    '#####.B.######',
    '#####...######',
    '######D#######',
    '###c....4#...#',
    '###2.....#L#.#',
    '####....u###.#',
    '######G#####.#',
    '######.#####V#',
    '##..3#.#####t#',
    '##.###.#####.#',
    '#............#',
    '#.####1#####.#',
    '#.####.###...#',
    '#.a###.###b###',
    '######S#######',
    '##############',
  ]},
  {id:'quarry', boss:'brawler', marks:{1:{t:'fight',e:['villager']}, 2:{t:'fight',e:['villager','villager']}, 3:{t:'fight',e:['villager_strong']},
    4:{t:'rest'}, 5:{t:'lock',tier:1}, 6:{t:'lock',tier:2}, h:{t:'hurt',who:'tobias'},
    a:{t:'scrap',truth:'gentle'}, b:{t:'scrap',truth:'help'}, c:{t:'scrap',truth:'pride'}, t:{t:'truth',truth:'gentle'}, u:{t:'truth',truth:'help'}, w:{t:'truth',truth:'pride'}}, map:[
    '###############',
    '######...######',
    '######.B.######',
    '######...######',
    '#######D#######',
    '##4........w###',
    '##..#..3..#.c##',
    '##.u.........##',
    '#######H#######',
    '#6#......t..###',
    '#.#b.#...#..#K#',
    '#V#.........2.#',
    '#...#...#...#5#',
    '###.###.###.###',
    '#a..###1###.h##',
    '#######.#######',
    '#######S#######',
    '###############',
  ]},
  {id:'deep', boss:'slanderer', marks:{1:{t:'fight',e:['villager']}, 2:{t:'fight',e:['villager_strong']}, 3:{t:'fight',e:['villager_strong','villager']},
    4:{t:'rest'}, 5:{t:'lock',tier:2}, 6:{t:'lock',tier:2}, h:{t:'hurt',who:'hannah'},
    a:{t:'scrap',truth:'money'}, b:{t:'scrap',truth:'good'}, c:{t:'scrap',truth:'heart'}, d:{t:'scrap',truth:'handle'},
    t:{t:'truth',truth:'good'}, u:{t:'truth',truth:'handle'}, w:{t:'truth',truth:'heart'}, x:{t:'truth',truth:'money'}}, map:[
    '################',
    '#######...######',
    '#######.B.######',
    '#######...######',
    '########D#######',
    '###4......u..###',
    '###.3.......d###',
    '#########H######',
    '###.w...#.######',
    '###.###.#.######',
    '###.#...#.##6###',
    '###.#c###.##.###',
    '###.#.2..K##b###',
    '###.########.###',
    '###..t.......###',
    '#######V########',
    '#.xG...........#',
    '#a####.#.####.##',
    '#5####.1h####.##',
    '#######.#####.L#',
    '#######S########',
    '################',
  ]},
];
const LEVERS = {L:'G', K:'H'};      // lever glyph -> the gates it opens

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
    if(mk[x+','+y] && mk[x+','+y].t==='scrap') mk[x+','+y].walkOver = true;   // a scrap of paper on the floor: walk over it and pick it up
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
function freshMap(i){ const m = caveMap(i); return {pos:m.start.slice(), face:'back', seen:new Array(m.W*m.H).fill(0), done:[], open:[], helped:[], msg:null, vis:new Set()}; }
// P.run = {v:2, cave, pos, face, seen:'0110…', done:[marker ids], open:[door and lever ids], helped:[who]}
function saveRun(){
  const M = R.map; if(!M || R.cave==null) return;
  P.run = {v:2, cave:R.cave, pos:M.pos.slice(), face:M.face, seen:M.seen.join(''), done:M.done.slice(), open:M.open.slice(), helped:(M.helped||[]).slice()};
  saveHero();
}
// back on the map after a reload; anything that no longer fits the map (it was redrawn) starts over
function resumeCave(run){
  const i = run.cave, m = caveMap(i), M = freshMap(i);
  Object.assign(R, {cave:i, room:null, node:null, enemies:[], boss:null}); R.map = M;
  if(typeof run.seen==='string' && run.seen.length===m.W*m.H){
    M.seen = Array.from(run.seen, Number);
    M.done = (run.done||[]).filter(id=>m.mk[id]); M.open = (run.open||[]).slice(); M.helped = (run.helped||[]).slice();
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
  const mk = caveMap(R.cave).mk[tid(x,y)];
  if(mk) return isDone(x,y) || mk.t==='scrap';   // a scrap of paper on the floor: walk over it and pick it up
  return true; }
function blocksSight(x,y){ const c = tileAt(x,y); return c==='#' || ((c==='D' || c==='V') && !isOpen(x,y)); }   // you can see through a gate's bars
// everyone still held on this floor: fights and the villagers asking “Is it true…?”
function fightsLeft(){ return Object.values(caveMap(R.cave).mk).filter(m=>(m.t==='fight'||m.t==='truth') && !R.map.done.includes(m.id)).length; }

// after each step: a lever underfoot gets pulled; something new in the light gets a line
function caveArrive(fresh, goal){
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
  if(m.t==='scrap') return TEXT.truths.scrapHint;
  if(m.t==='truth') return TEXT.truths.villagerHint;
  if(m.t==='hurt') return TEXT.living.hint;
  return D.hints[m.t==='fight' && m.e.length>1 ? 'fightMany' : m.t]; }
// ---- Markers, doors and levers ----
function trigger(m){
  R.node = m;
  if(m.t==='fight'){ R.node = {...m, e:m.e.map(standIn)}; saveRun(); startFight(R.node.e); return; }
  if(m.t==='truth'){ startTruth(m); return; }   // these two happen in the arena, like a fight (encounters.js)
  if(m.t==='hurt'){ startHurt(); return; }
  R.room = m.t; render();   // lock, rest, boss, scrap: a panel under the map
}
function notNow(){ R.room=null; R.node=null; render(); }
function faceBoss(){ const n = R.node; R.node = {...n, t:'elite', caveBoss:true, e:n.e.map(standIn)}; R.room=null; saveRun(); startFight(R.node.e); helpersAtBoss(); }
function bump(x,y){ const c = tileAt(x,y), D = TEXT.dive;
  if(c==='D'){ const n = fightsLeft();
    if(n){ say(fill(D.bossDoorShut,{n})); return; }
    R.map.open.push(tid(x,y)); fxOpening(R.map, tid(x,y)); say(D.bossDoorOpen); updateSight(); redrawTile(y*caveMap(R.cave).W+x); saveRun(); return; }
  if(c==='V'){ R.room='verse'; R.node={door:[x,y]}; render(); return; }
  say(D.gateShut);
}
function pullLever(x,y){ const m = caveMap(R.cave), gate = LEVERS[tileAt(x,y)];
  R.map.open.push(tid(x,y)); say(TEXT.dive.leverPulled);
  m.rows.forEach((row,gy)=>Array.from(row).forEach((c,gx)=>{ if(c===gate){ fxOpening(R.map, tid(gx,gy)); redrawTile(gy*m.W+gx); } }));
  redrawTile(y*m.W+x); updateSight(); saveRun(); }
function sayAtDoor(ref){
  const [x,y] = R.node.door, D = TEXT.dive;
  openRecall(BY_REF[ref], frac=>{ recordResult(ref,frac);
    if(frac>=SLIP_BELOW){ R.map.open.push(tid(x,y)); fxOpening(R.map, tid(x,y)); R.room=null; R.node=null; R.map.msg = D.verseOpen; saveRun(); }
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
  // chapter ending hook: the first clear that finishes the last cave goes to the closing scene (story.js), not town
  const next = R.firstClear && allCavesDone() ? "R.endStats=false;goto('chapterend')" : "R.cave=null;goto('town')";
  return `${caveScene()}${talk('cavedone'+R.cave, C.done, `<button class="primary wide" onclick="${next}">${TEXT.dive.home}</button>`)}`;
}

// the cave as a place to walk (tilemap.js)
PLACES.dive = {grid:()=>caveMap(R.cave), st:()=>R.map, lit:false, walkable, mark:markAt, closed:closedAt, blocksSight,
  trigger, bump, arrive:caveArrive, busy:()=>!!(R.room || R.node), tileCls, tileInner, ground:caveGround, save:saveRun,
  cls:()=>'c-'+CAVES[R.cave].id, viewCls:()=>R.room?'short':'', name:()=>TEXT.caves[R.cave].name, overlay:'<div class="torch"></div>'};

// ---- Drawing the map ----
// The ground is one image per cave (caveGround, below); each tile on top only carries the fog and what's on it.
// The classes say what the tile is (rk rock, rf a wall facing the floor, rs re/rw a wall seen side-on, fl floor)
// for anything that wants to style by them.
function baseOf(x,y){
  const c = tileAt(x,y), solid = (a,b)=>{ const t = tileAt(a,b); return t==='#' || t==='D' || t==='V'; };
  if(c==='#'){ if(!solid(x,y+1)) return 'rf';
    const open = (a,b)=>{ const t = tileAt(a,b); return t && t!=='#'; };
    if(open(x+1,y)) return 'rs re'; if(open(x-1,y)) return 'rs rw';
    return 'rk'; }
  if(c==='D' || c==='V') return 'rf';
  return 'fl';
}
function tileCls(x,y){
  const M = R.map, m = caveMap(R.cave), k = y*m.W+x, v = ((x*7+y*13+x*y*3)%4+4)%4;
  return `tl ${baseOf(x,y)} v${v} ${!M.seen[k]?'u':M.vis.has(k)?'lit':'dim'}`;
}
function tileInner(x,y){
  const M = R.map, m = caveMap(R.cave); if(!M.seen[y*m.W+x]) return '';
  const c = tileAt(x,y), A = CAVE_ART, art = (n,cls='')=>`<img class="mk ${cls}" src="${A[n]}" alt="">`, id = tid(x,y), moving = fxOpeningNow(M, id);
  // doors: open, the leaf swinging in as it opens; the verse door glows while it's shut
  if(c==='D') return isOpen(x,y) ? art('door_open') + (moving ? art('door_leaf','leaf door') : '') : art('door');
  if(c==='V') return isOpen(x,y) ? art('verse_open') + (moving ? art('verse_leaf','leaf verse') : '') : art('verse')+'<i class="glow"></i>';
  if(LEVERS[c]) return art(isOpen(x,y)?'lever_down':'lever_up','prop');
  if(leverFor(c)) return closedAt(x,y) ? art('gate') : art('gate_up') + (moving ? art('gate','rise') : '');
  const mk = markAt(x,y); if(!mk) return '';
  if(mk.t==='lock') return art('chest','prop');
  if(mk.t==='scrap') return art('note','prop');
  if(mk.t==='hurt') return `<img class="mk who hurt" src="${hurtSrc(mk.who)}" alt="">`;
  if(mk.t==='rest') return art('fire','prop fire') + art('fire2','fire f2');
  // people: still held, so a shadow with an angry glow; the named townsperson is drawn as themselves
  if(mk.t==='truth') return `<img class="mk who shade" src="${folkSrc(TEXT.villagers[truthFolk(mk)],'idle')}" alt="">`;   // the same person you meet in the arena
  if(mk.t==='boss' && standIn(mk.e[0])===mk.e[0]){ const E = ENEMY_IMG[mk.e[0]]; return `<img class="mk who boss" src="${E.f[0]}" alt="">`; }
  return mk.e.map((e,i)=>`<img class="mk who shade n${mk.e.length}-${i}" src="${FREED_IMG['freed'+((x+y+i*3)%6)].f[0]}" alt="">`).join('');
}
// what a cave tile gives off (mapfx.js): the campfire's glow and embers, and here and there a torch on a wall face
function caveFxAt(x,y){
  const mk = markAt(x,y);
  if(mk && mk.t==='rest') return {light:'fire', emit:'embers'};
  if(sconces().has(tid(x,y))) return {light:'torch', emit:'sparks', sconce:true};
  return null;
}
// wall torches: on plain floor tiles right under a flat stretch of wall face, spread out, the same every visit
const SCONCES = {};
function sconces(){
  const i = R.cave; if(SCONCES[i]) return SCONCES[i];
  const m = caveMap(i), got = [], plain = (x,y)=>tileAt(x,y)==='.';
  for(let y=1;y<m.H;y++) for(let x=1;x<m.W-1;x++){
    if(!plain(x,y) || m.mk[tid(x,y)] || tileAt(x,y-1)!=='#' || tileAt(x-1,y-1)!=='#' || tileAt(x+1,y-1)!=='#') continue;
    if(((x*37+y*61+i*13)%5)!==0 || got.some(([a,b])=>Math.abs(a-x)+Math.abs(b-y)<5)) continue;
    got.push([x,y]); }
  return SCONCES[i] = new Set(got.map(p=>tid(...p)));
}
function mapHTML(){ return mapView(PLACES.dive); }
function diveHTML(){
  const D = TEXT.dive, T = TEXT.rooms;
  if(!R.map) R.map = freshMap(R.cave);
  const tools = `<div class="row divetools"><button onclick="R.gearFrom='dive';goto('gear')">Gear</button><button onclick="R.treeFrom='dive';R.treeSel=null;goto('tree')">Tree</button><button onclick="R.deckFrom='dive';goto('deck')">Deck</button><button onclick="if(confirm(TEXT.dive.leaveConfirm)) retreat()">${D.leave}</button></div>`;
  const back = label=>`<button class="wide" onclick="notNow()">${label}</button>`;
  let body, dock;
  if(R.room==='lock'){ body = lockPanel(); dock = `<button class="primary wide" onclick="pickLock()">${T.pickLock}</button>${back(D.notNow)}`; }
  else if(R.room==='rest'){ body = restPanel(); dock = back(D.notNow); }
  else if(R.room==='boss'){ body = `<div class="panel cavemsg">${TEXT.caves[R.cave].bossLead}</div>`; dock = `<button class="primary wide" onclick="faceBoss()">${D.face}</button>${back(D.notYet)}`; }
  else if(R.room==='scrap'){ body = scrapPanel(); dock = `<button class="primary wide" onclick="takeScrap()">${TEXT.truths.takeIt}</button>`; }
  else if(R.room==='verse'){ body = versePanel(); dock = `<button class="wide" onclick="R.room=null;R.node=null;render()">${D.notNow}</button>`; }
  else { body = `<div class="panel cavemsg" id="cavemsg">${R.map.msg || D.walkHint}</div>`; dock = tools; }
  return `${mapHTML()}${body}<div class="dock">${dock}</div>`;
}
function versePanel(){
  const D = TEXT.dive, refs = [...new Set(R.deck.map(c=>c.ref))];
  return `<div class="panel"><h2>${D.verseHeading}</h2><p class="small">${D.verseBody}</p>
    ${refs.map(ref=>`<button class="wide" onclick="sayAtDoor('${ref}')">${spellLine(ref)} · ${TIER_NAME[sp(ref).tier]}</button>`).join('')}</div>`;
}

// Cave art (PixelLab; tools/build_cave_art.py makes these from assets/source/caves/pixellab/).
// Ground: a 4x4 sheet of 32px Wang tiles per cave, the tile for corners NW,NE,SW,SE (1 = rock) at index NW*8+NE*4+SW*2+SE.
const CAVE_GROUND = {hollow:__IMG__('caves/map/hollow_ground.png'), quarry:__IMG__('caves/map/quarry_ground.png'), deep:__IMG__('caves/map/deep_ground.png')};
const CAVE_ART = {
  door:__IMG__('caves/map/door.png'), door_open:__IMG__('caves/map/door_open.png'), door_leaf:__IMG__('caves/map/door_leaf.png'),
  verse:__IMG__('caves/map/verse.png'), verse_open:__IMG__('caves/map/verse_open.png'), verse_leaf:__IMG__('caves/map/verse_leaf.png'),
  gate:__IMG__('caves/map/gate.png'), gate_up:__IMG__('caves/map/gate_up.png'), lever_up:__IMG__('caves/map/lever_up.png'), lever_down:__IMG__('caves/map/lever_down.png'),
  chest:__IMG__('caves/map/chest.png'), fire:__IMG__('caves/map/fire.png'), fire2:__IMG__('caves/map/fire2.png'), note:__IMG__('caves/map/note.png'),
};
// The ground of cave i drawn once, on a dual grid: each 32px tile sits over the corner where four map cells meet
// and takes rock or floor from each of them, so walls get real edges, faces and corners. Doors, gates and
// levers stand on floor. Returns a data URI, or null the first time (the sheet is still loading); the map gets it then.
const GROUND = {};
function caveGround(){
  const i = R.cave, id = CAVES[i].id; if(GROUND[id] && GROUND[id]!=='…') return GROUND[id];
  if(!GROUND[id]){ GROUND[id] = '…'; const img = new Image();
    img.onload = ()=>{ GROUND[id] = drawGround(img, i); const el = document.getElementById('cmap');
      if(el && screen==='dive' && R.cave===i) el.style.backgroundImage = `url(${GROUND[id]})`; };
    img.src = CAVE_GROUND[id]; }
  return null;
}
function drawGround(img, i){
  const m = caveMap(i), T = 32, c = document.createElement('canvas'), g = c.getContext('2d'), r = rnd(i*7919+3);
  c.width = m.W*T; c.height = m.H*T;
  const rock = (x,y)=>x<0 || y<0 || x>=m.W || y>=m.H || m.rows[y][x]==='#';
  for(let y=0;y<=m.H;y++) for(let x=0;x<=m.W;x++){
    const k = rock(x-1,y-1)<<3 | rock(x,y-1)<<2 | rock(x-1,y)<<1 | rock(x,y), flip = (k===0 || k===15) && r()<.5;
    g.save(); g.translate(x*T-T/2 + (flip?T:0), y*T-T/2); if(flip) g.scale(-1,1);   // plain floor and plain rock: mirrored now and then, so it doesn't read as a grid
    g.drawImage(img, (k%4)*T, (k>>2)*T, T, T, 0, 0, T, T); g.restore(); }
  return c.toDataURL();
}
// pixel palette for small things drawn in code (the town's placeholder objects use it, and the caves' wall torch):
// k outline, w wood, W light wood, d dark wood, g gold, G dark gold, i iron, I light iron, j dark iron, s stone,
// S light stone, t dark stone, r ember, o flame, y yellow, Y white-hot, x shadow, n black
const ART_PAL = {k:'#1e140c', w:'#8a5a2e', W:'#b07a40', d:'#5e3a1c', g:'#f2c84a', G:'#a67a12', i:'#4a4c54', I:'#7c808a', j:'#2a2b30',
  s:'#8a8272', S:'#aaa290', t:'#5a5448', r:'#c8502a', o:'#e8903a', y:'#f2d25a', Y:'#fff4c0', x:'rgba(0,0,0,.35)', n:'#0b0806'};

// ---- Rooms that open under the map ----
function rewardHTML(){
  return `<h1>${TEXT.rooms.chestHeading}</h1><h2>${TEXT.rooms.chestTake}</h2><div class="hand">${R.reward.map(ref=>`<div onclick="takeReward('${ref}')">${cardView(BY_REF[ref])}</div>`).join('')}</div>
    <div class="dock"><button class="wide" onclick="clearColumn()">${TEXT.rooms.chestLeave}</button></div>`;
}
function takeReward(ref){ if(!R.reward) return; R.reward = null; addVerse(ref); clearColumn(); }   // once, even on a double tap
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
  R.talents += spec.talents; let creed = 0;
  if(m.sec===P.creed && P.creed < CREED.sections.length){ P.creed++; creed = P.creed; }
  reward({kind:'chest', talents:spec.talents, creed}); saveHero();
  if(spec.verse){ R.reward = pick(VERSES.filter(x=>!x.ref.startsWith('Galatians') && !R.deck.some(d=>d.ref===x.ref)).map(x=>x.ref),3); if(R.reward.length){ screen='reward'; render(); return; } }
  clearColumn();
}
