/* Philadelphia as a place you walk (the town screen). Same tap-to-walk engine as the caves (tilemap.js), but
   lit: no fog. Walk into a door to go in (the shop screens in town.js), into a cottage or someone outside to talk
   (a popup over the map), into a cave mouth to go down, or out along the road east to the world map.

   Map glyphs:  T tree   u bush   # rock round a cave mouth   , grass   . cobblestone   = dirt path   O the well
     @ where you wake   l lamp post   k bench   p flower planter   f fence   r barrels   d training dummy
     C church  F forge  N inn  Y training yard  R scriptorium  H a cottage (whose: TOWN.houses, by its top-left)
     + a door: the building it's in is the footprint above it (or beside it)
     1 2 3 a cave mouth (CAVES[0..2])     E the road east (the world map)
     people, each shown only while they're there:  a Amos (outside the church)   B Bram burning by the well
       b Bram   w Wendell   h Hale   s Silas: each by their door once it's open again
   The townsfolk (TEXT.villagers, TEXT.living.people) live in the cottages; once they're home they stand by their
   door and wander a little (R.folk). Art: tools/build_town.py (IMG.town, IMG.house, IMG.prop, IMG.ground). */
const TOWN = {map:[
  'TTTTTTTTTTTTTTTTTTTTTTTTTT',
  'T,,T,,,,,T,###,T,,,,T,,,TT',
  'T,CCC,,,,T,#2#,,TFFF,,,,,T',
  'T,CCCTHHH,,,=,HHHFFF,HHH,T',
  'T,CCC,H+H,,,=,H+HF+FrH+H,T',
  'T,C+C,,=,,,,=,,=,,,b,,=,,T',
  'TT,..a....p....p....u,,,TT',
  'T,,,,,.l..........l.,,RRRT',
  'TNNN,u...k..........,,RRRT',
  'TNNN,,......OB......,,R+RT',
  'TN+N,,..................sT',
  'T......l....@..k..l.,,,,,T',
  'Tw,,u,..............=====E',
  'T,,,,T=,,,,=,,,,,,,,u,,,,T',
  'T###,,=,HHH=,HHH,HHH,HHH,T',
  'T#1#,,=,H+H=,H+H,H+H,H+H,T',
  'T,=====,,=,=,,=,,,=,,,=,TT',
  'T,,,,,,,,u,=,,,uT,,,,,,,,T',
  'TT,,,,HHH,,=,u,,,,HHH,HHHT',
  'T,YYYdH+H,T=,,,,,,H+H,H+HT',
  'T,YYY,d=,,,=###,,,,=,u,=,T',
  'T,Y+Yh,,,,,=#3#,,,,,,,,,,T',
  'T,,===========,,,,,,T,,T,T',
  'Tffff,,,T,,,,,,,T,,,,,,,,T',
  'TTTTTTTTTTTTTTTTTTTTTTTTTT',
], marks:{
  a:{t:'npc', who:'priest'}, B:{t:'npc', who:'furnace'},
  b:{t:'npc', who:'blacksmith', home:'forge'}, w:{t:'npc', who:'innkeeper', home:'inn'},
  h:{t:'npc', who:'drill', home:'training'}, s:{t:'npc', who:'scribe', home:'scriptorium'},
  1:{t:'cave', i:0}, 2:{t:'cave', i:1}, 3:{t:'cave', i:2}, E:{t:'road'},
},
// whose cottage is whose: the top-left of each H footprint -> the look of the person who lives there
houses:{'6,3':'baker', '14,3':'dairymaid', '21,3':'shepherd', '8,14':'washer', '13,14':'grandmother', '17,14':'dyer', '21,14':'farmhand', '6,18':'carpenter', '18,18':'quarryman', '22,18':'girl'},
};
const BLD_OF = {C:'church', F:'forge', N:'inn', Y:'training', R:'scriptorium', H:'house'};
const WALK_ON = ',.=@';
const TOWN_META = __DATA__('town.json');
const TSC = 0.85;   // screen px per art pixel for the town kit (the townsfolk are ~0.72)
const ART_OF = {church:'church', forge:'forge', inn:'inn', training:'training_yard', scriptorium:'scriptorium'};
// the parsed town: size, rows, where you wake, markers, and each building's footprint and door
let TOWN_GRID = null;
function townGrid(){
  if(TOWN_GRID) return TOWN_GRID;
  const rows = TOWN.map, H = rows.length, W = rows[0].length, mk = {}, bld = {}, at = {}; let start = [1,1];
  const ch = (x,y)=>(rows[y]||'')[x];
  rows.forEach((row,y)=>Array.from(row).forEach((c,x)=>{
    if(c==='@') start = [x,y];
    if(TOWN.marks[c]) mk[tid(x,y)] = {...TOWN.marks[c], id:tid(x,y)};
    if(!BLD_OF[c] || at[tid(x,y)]) return;
    // a footprint: every touching tile of the same letter (and its doors)
    const b = {x0:x, y0:y, x1:x, y1:y}, q = [[x,y]]; at[tid(x,y)] = b;
    while(q.length){ const [a,d] = q.shift(); b.x0 = Math.min(b.x0,a); b.y0 = Math.min(b.y0,d); b.x1 = Math.max(b.x1,a); b.y1 = Math.max(b.y1,d);
      [[a+1,d],[a-1,d],[a,d+1],[a,d-1]].forEach(([u,v])=>{ if(ch(u,v)===c && !at[tid(u,v)]){ at[tid(u,v)] = b; q.push([u,v]); } }); }
    if(c==='H'){ b.look = TOWN.houses[tid(b.x0,b.y0)]; b.id = 'house:'+b.look; } else b.id = BLD_OF[c];
    bld[b.id] = b;
  }));
  rows.forEach((row,y)=>Array.from(row).forEach((c,x)=>{ if(c!=='+') return;
    const b = at[tid(x,y-1)] || at[tid(x-1,y)] || at[tid(x+1,y)];
    mk[tid(x,y)] = {t:'door', b:b.id, id:tid(x,y)}; b.door = [x,y]; }));
  return TOWN_GRID = {W, H, rows, start, mk, bld};
}
// where something is on the map: townSpot('door','forge'), townSpot('door','house:baker'), townSpot('cave',0), townSpot('npc','furnace'), townSpot('road')
function townSpot(t, id){ const m = Object.values(townGrid().mk).find(m=>m.t===t && (id==null || m.b===id || m.i===id || m.who===id));
  return m ? m.id.split(',').map(Number) : null; }
// the tile you stand on to use it (below it, or beside it if below is blocked)
function frontOf([x,y]){ return [[x,y+1],[x-1,y],[x+1,y],[x,y-1]].find(([a,b])=>townWalkable(a,b)) || [x,y+1]; }

// ---- Who lives where, and who's home ----
// everyone with a cottage: the held villagers (home once freed) and the hurt (home once helped)
function townsfolk(){ return [...TEXT.villagers.map(v=>({...v, kind:'held'})), ...TEXT.living.people.map(p=>({...p, kind:'hurt'}))]; }
function folkOf(look){ return townsfolk().find(p=>p.look===look); }
// a villager freed in a fight or by the truth: they go home (combat.js, encounters.js call this)
function townHome(e){ const v = e && e.villager && TEXT.villagers[e.fk]; if(!v) return;
  P.home = P.home||[]; if(!P.home.includes(v.look)) P.home.push(v.look); }
function isHome(look){ const p = folkOf(look); if(!p || !P.tutorialDone) return false;
  if(allCavesDone()) return true;   // the last cave brings everyone home
  return p.kind==='held' ? (P.home||[]).includes(look) : (P.helpedAll||[]).includes(p.id); }

// ---- Who's out ----
// Amos walks beside you from the lid until the Furnace, on his tour, and to the church at the end
function amosWithYou(){ return !!(R && (R.tour || R.finale || (!P.tutorialDone && R.deck.length))); }
function npcHere(m){
  if(R && R.finale) return false;   // everyone has gone in to church
  if(m.who==='furnace') return !P.tutorialDone;
  if(m.who==='priest') return !!P.tutorialDone && !amosWithYou();
  return !!P.town[m.home];
}
function townChar(x,y){ const m = townGrid(); return (y>=0 && y<m.H && x>=0 && x<m.W) ? m.rows[y][x] : 'T'; }
function folkAt(x,y){ return R && R.folk && !R.finale ? R.folk.find(f=>f.pos[0]===x && f.pos[1]===y) : null; }
function townMark(x,y){ const f = folkAt(x,y); if(f) return {t:'folk', look:f.look, id:'folk:'+f.look};
  const m = townGrid().mk[tid(x,y)]; return m && (m.t!=='npc' || npcHere(m)) ? m : null; }
function townWalkable(x,y){ if(folkAt(x,y)) return false;
  const c = townChar(x,y), m = townGrid().mk[tid(x,y)];
  if(m) return m.t==='npc' && !npcHere(m);   // someone who isn't there is just ground
  return WALK_ON.includes(c); }

// ---- Walking state: R.tmap, with where you stood saved in P.town.pos / P.town.face ----
function townSt(){
  if(R.tmap) return R.tmap;
  const m = townGrid(), p = P.town && P.town.pos;
  const pos = Array.isArray(p) && townWalkable(p[0],p[1]) ? p.slice() : m.start.slice();
  return R.tmap = {pos, face:(P.town && P.town.face)||'front', seen:new Array(m.W*m.H).fill(1), vis:new Set(), msg:null, walking:false, goal:null};
}
function townSave(){ const M = townSt(); P.town.pos = M.pos.slice(); P.town.face = M.face; if(R.deck.length) saveHero(); else save(); }
// put you somewhere on the map (in front of a door, by the well…) before the town screen opens
function townPlace(pos, face){ const M = townSt(); M.pos = pos.slice(); M.face = face||'front'; M.follow = null; M.goal = null; townSave(); }

// ---- Walking into things ----
function townTrigger(m){
  townSt().msg = null;   // an old line under the map (a boarded door) doesn't follow you in and back out
  if(m.t==='door') townDoor(m.b);
  else if(m.t==='cave') townCave(m.i);
  else if(m.t==='road') townRoad();
  else if(m.t==='npc') townTalk(m.who);
  else if(m.t==='folk') folkTalk(m.look);
}
function townDoor(id){
  const T = TEXT.townMap;
  if(R.finale && id==='church'){ finaleIn(); return; }
  if(id.startsWith('house:')){ houseDoor(id.slice(6)); return; }
  if(!P.tutorialDone && id==='church'){
    if(!R.deck.length){ goto('pro3'); return; }   // the first time: Amos is inside, sweeping
    talkPop('town-church', T.churchAfterLid); return; }
  if(!P.tutorialDone && id!=='church'){ say(TEXT.town.boarded[id]); return; }
  if(!(BUILD[id].always || P.town[id])){ say(TEXT.town.boarded[id]); return; }
  enterBuilding(id);
}
// a cottage: boarded while its people are away; once they're home, knocking brings them to the door
function houseDoor(look){
  const H = TEXT.townMap.homes[look]; if(!H) return;
  if(!isHome(look)){ say(H.shut); return; }
  folkTalk(look);
}
function folkTalk(look){ const H = TEXT.townMap.homes[look]; if(H) talkPop('home-'+look, H.open); }
function townCave(i){
  const T = TEXT.townMap;
  if(!P.tutorialDone){ say(T.notTonight); return; }
  if(R.finale){ say(T.finale.notNow); return; }
  if(!caveOpen(i)){ say(fill(T.caveShut,{name:TEXT.caves[i].name})); return; }
  if(R.hp < R.maxHp*0.3){ say(TEXT.church.tooHurt); return; }
  startCave(i);
}
function townRoad(){ if(!P.tutorialDone){ say(TEXT.townMap.notTonight); return; } if(R.finale){ say(TEXT.townMap.finale.notNow); return; } goto('world'); }
function townTalk(who){
  const T = TEXT.townMap;
  if(who==='furnace'){
    if(!R.deck.length){ talkPop('town-bram', T.bramShouting); return; }   // nothing in your hands yet: he drives you back
    talkPop('town-bram2', T.bramFight, ()=>startTutorial()); return; }
  if(who==='priest'){ talkPop('town-amos'+(allCavesDone()?1:0), [allCavesDone() ? TEXT.church.lineAfter : TEXT.church.lineBefore]); return; }
  talkPop('town-'+who, T.people[who]);
}
// tapping a building (or the roof above a cottage) means its door
function townRetarget([x,y]){ const b = Object.values(townGrid().bld).find(b=>x>=b.x0 && x<=b.x1 && y>=b.y0-(b.look?1:0) && y<=b.y1); return b ? b.door : [x,y]; }

// ---- Someone walking with you: one step behind ----
function followPlaced(){
  const M = townSt(), el = document.getElementById('camos'); if(!el) return;
  if(!M.last || M.last[0]!==M.pos[0] || M.last[1]!==M.pos[1]){ if(M.last) M.follow = M.last; M.last = M.pos.slice(); }
  const [x,y] = M.follow || followStart(); el.style.transform = `translate(${x*MAP_T}px,${y*MAP_T}px)`; el.style.zIndex = y*2+1;
}
function followStart(){ const M = townSt(), [x,y] = M.pos;
  return [[x-1,y],[x+1,y],[x,y+1],[x,y-1]].find(([a,b])=>townWalkable(a,b)) || [x,y]; }

// ---- Drawing ----
// ground: grass, dirt or cobblestone under each tile (people and props stand on what's around them)
function townBase(x,y){ const c = townChar(x,y);
  if(c==='.' || c==='@' || c==='O' || c==='B') return 'cb';
  if(c==='=' || c==='E') return 'dt';
  if(c==='+') return townChar(x,y+1)==='.' ? 'cb' : 'gr';   // a door opens onto the square's stones, or a doorstep of dirt
  if('abwhslkpr'.includes(c)){ const n = [[x,y-1],[x+1,y],[x,y+1],[x-1,y]].map(([a,b])=>townChar(a,b));
    return n.some(t=>'.@'.includes(t)) ? 'cb' : n.some(t=>t==='=') ? 'dt' : 'gr'; }
  return 'gr'; }
function townTileCls(){ return 'tl lit'; }
// a prop from the kit, standing on the bottom of its tile
const PROP_SC = {well:1.2, mouth:1.1};
function propImg(n, cls='', lift=2){ const m = TOWN_META['prop_'+n], w = Math.round(m.w*TSC*(PROP_SC[n]||1));
  return `<img class="mk prop ${cls}" src="${IMG.prop[n]}" style="width:${w}px;height:auto;left:${Math.round((MAP_T-w)/2)}px;top:auto;bottom:${lift}px" alt="">`; }
const PROP_OF = {T:'tree', u:'bush', O:'well', l:'lamp', k:'bench', p:'planter', f:'fence', r:'barrels', d:'dummy', E:'sign'};
function townTileInner(x,y){
  const c = townChar(x,y);
  if(PROP_OF[c]) return propImg(PROP_OF[c], c==='T'?'tree':'', c==='T'||c==='u'?-2:2);
  if('123'.includes(c)) return propImg('mouth', 'mouth', 0);
  const m = townMark(x,y); if(!m || m.t!=='npc') return '';
  return npcImg(m.who);
}
const NPC_IMG = {blacksmith:'hothead_f', innkeeper:'grudge_f', drill:'brawler_f', scribe:'slanderer_f'};
function npcImg(who){
  if(who==='priest') return `<img class="mk who" src="${IMG.priest.idle}" alt="${TEXT.speakers.priest}">`;
  if(who==='furnace') return `<img class="mk who furnace" src="${ENEMY_IMG.furnace.f[0]}" alt="${TEXT.speakers.blacksmith}">`;
  return `<img class="mk who" src="${ENEMY_IMG[NPC_IMG[who]].f[0]}" alt="${TEXT.speakers[who]}">`;
}
// a building's picture over its footprint: its door over the door tile, its foot on the footprint's bottom edge
function bldgHTML(b){
  const house = !!b.look, open = house ? isHome(b.look) : (b.id==='church' ? !!P.town.church : (BUILD[b.id].always || P.town[b.id]));
  const key = house ? 'house_'+b.look : ART_OF[b.id], m = TOWN_META[key+(open?'_open':'_closed')], src = house ? IMG.house[b.look][open?1:0] : IMG.town[b.id][open?1:0];
  const w = Math.round(m.w*TSC), h = Math.round(m.h*TSC), left = Math.round((b.door[0]+.5)*MAP_T - m.door*TSC), top = (b.y1+1)*MAP_T - h + 2;
  const plate = house ? '' : `<span class="bname ${open?'':'shut'}">${open?BUILD[b.id].name:TEXT.town.boardedLabel}</span>`;
  return `<div class="bldg kit ${house?'house':''}" data-b="${b.id}" style="left:${left}px;top:${top}px;width:${w}px;height:${h}px;z-index:${b.y1*2}"><img src="${src}" alt="${house?'':BUILD[b.id].name}">${plate}</div>`;
}
// the ground layer, the buildings, the townsfolk who are out, and Amos walking with you
function townExtra(){
  const g = townGrid();
  const ground = `<div class="tground" id="tground" style="width:${g.W*MAP_T}px;height:${g.H*MAP_T}px;${townGround()?`background-image:url(${townGround()})`:''}"></div>`;
  const blds = Object.values(g.bld).map(bldgHTML).join('');
  let amos = '';
  if(amosWithYou()){ const [x,y] = townSt().follow || followStart();
    amos = `<div id="camos" class="chero follow" style="transform:translate(${x*MAP_T}px,${y*MAP_T}px);z-index:${y*2+1}"><img class="hs" src="${IMG.priest.idle}" alt="${TEXT.speakers.priest}"></div>`; }
  return ground + blds + folkHTML() + walkersHTML() + amos + (R.finale && R.finale.bell ? `<div class="bellring" style="left:${(townGrid().bld.church.door[0]+.5)*MAP_T}px;top:${(townGrid().bld.church.y0-.6)*MAP_T}px"></div>` : '');
}

// ---- Ground: two Wang strips (dirt under grass, cobblestone over that) drawn once into one picture ----
// Dual grid: the tile drawn at each tile corner takes its four corners from the four map tiles that meet there.
let TOWN_GROUND = null, groundBusy = false;
function townGround(){
  if(TOWN_GROUND || groundBusy) return TOWN_GROUND;
  groundBusy = true;
  const load = src=>new Promise(ok=>{ const i = new Image(); i.onload = ()=>ok(i); i.src = src; });
  Promise.all([load(IMG.ground.dirt), load(IMG.ground.cobble)]).then(([dirt, cob])=>{
    const g = townGrid(), T = TOWN_META.ground.tile, c = document.createElement('canvas'); c.width = g.W*T; c.height = g.H*T;
    const x2 = c.getContext('2d'), base = (x,y)=>(x<0||y<0||x>=g.W||y>=g.H) ? 'gr' : townBase(x,y);
    for(const [sheet, isPath] of [[dirt, b=>b!=='gr'], [cob, b=>b==='cb']])
      for(let j=0;j<=g.H;j++) for(let i=0;i<=g.W;i++){
        const n = (isPath(base(i-1,j-1))?8:0) + (isPath(base(i,j-1))?4:0) + (isPath(base(i-1,j))?2:0) + (isPath(base(i,j))?1:0);
        if(sheet===cob && !n) continue;
        x2.drawImage(sheet, n*T, 0, T, T, (i-.5)*T, (j-.5)*T, T, T); }
    // a few flowers and tufts so the grass doesn't repeat so plainly
    const r = rnd(4111), px = (x,y,col)=>{ x2.fillStyle = col; x2.fillRect(x,y,1,1); };
    for(let y=0;y<g.H;y++) for(let x=0;x<g.W;x++){ if(base(x,y)!=='gr' || r()<.55) continue;
      const k = Math.floor(r()*4), ox = x*T+4+Math.floor(r()*(T-8)), oy = y*T+4+Math.floor(r()*(T-8));
      if(k===0){ px(ox,oy,'#f2e27a'); px(ox+1,oy,'#c9a63a'); }
      else if(k===1){ px(ox,oy,'#f4b8d0'); px(ox,oy+1,'#b46a8c'); }
      else { px(ox,oy,'#3f7a2a'); px(ox+1,oy-1,'#3f7a2a'); px(ox+2,oy,'#3f7a2a'); } }
    TOWN_GROUND = c.toDataURL(); groundBusy = false;
    const el = document.getElementById('tground'); if(el) el.style.backgroundImage = `url(${TOWN_GROUND})`;
  });
  return null;
}

// ---- The townsfolk out by their doors (R.folk): they stand, wander a few tiles, and you can walk into them ----
const FOLK_WALK = __DATA__('folkwalk.json');
const FACE_KEY = {front:'s', back:'n', east:'e', west:'w'};
function folkStand(look, face){ const f = FOLK[look]; if(!f) return ''; const k = FACE_KEY[face]||'s'; return k==='s' ? f.f[0] : f.dir[k]; }
function folkWalkStrip(look, face){ const w = FOLK_WALK[look]; return w ? w[FACE_KEY[face]||'s'] : null; }
// where each one stands: beside their front step (not on it, so the door stays free)
function folkHomeSpot(look){ const b = townGrid().bld['house:'+look]; if(!b) return null; const [dx,dy] = b.door, fy = dy+1;
  return [[dx+1,fy],[dx-1,fy],[dx,fy+1],[dx+2,fy],[dx-2,fy]].find(([a,c])=>townWalkable(a,c) && !townGrid().mk[tid(a,c)]) || null; }
function townFolkInit(){
  if(R.finale){ R.folk = []; return; }
  const out = townsfolk().filter(p=>FOLK[p.look] && isHome(p.look)), keep = R.folk || [];
  R.folk = out.map(p=>keep.find(f=>f.look===p.look) || (()=>{ const h = folkHomeSpot(p.look); return h && {look:p.look, home:h, pos:h.slice(), face:'front'}; })()).filter(Boolean);
}
function folkEl(f){ const w = folkWalkStrip(f.look, f.face);
  return `<div class="tfolk" id="folk-${f.look}" style="transform:translate(${f.pos[0]*MAP_T}px,${f.pos[1]*MAP_T}px);z-index:${f.pos[1]*2+1}"><div class="fs" style="--stand:url(${folkStand(f.look,f.face)});${w?`--walk:url(${w})`:''}"></div></div>`; }
function folkHTML(){ townFolkInit(); return R.folk.map(folkEl).join(''); }
// one step for one of them: a free tile next to them, within 3 of home, not next to you
function folkStep(f){
  const M = townSt(), [hx,hy] = M.pos, opts = [[0,-1],[1,0],[0,1],[-1,0]].map(([dx,dy])=>[f.pos[0]+dx, f.pos[1]+dy])
    .filter(([x,y])=>townWalkable(x,y) && !townGrid().mk[tid(x,y)] && Math.abs(x-f.home[0])+Math.abs(y-f.home[1])<=3 && Math.abs(x-hx)+Math.abs(y-hy)>1);
  if(!opts.length) return;
  const to = opts[Math.floor(Math.random()*opts.length)]; folkMove(f, to);
}
function folkMove(f, [x,y], ms=520){
  const [px,py] = f.pos; f.face = y<py?'back':y>py?'front':x<px?'west':'east'; f.pos = [x,y];
  const el = document.getElementById('folk-'+f.look); if(!el) return;
  el.querySelector('.fs').style.setProperty('--stand', `url(${folkStand(f.look,f.face)})`);
  const w = folkWalkStrip(f.look, f.face); if(w) el.querySelector('.fs').style.setProperty('--walk', `url(${w})`);
  el.style.transitionDuration = ms+'ms'; el.classList.add('walking'); el.style.transform = `translate(${x*MAP_T}px,${y*MAP_T}px)`; el.style.zIndex = y*2+1;
  clearTimeout(f.t); f.t = setTimeout(()=>{ el.classList.remove('walking'); }, ms);
}
// every so often one of them takes a step, while you're not walking and nothing is up
let folkTimer = null;
function folkTick(){
  if(screen!=='town' || !R || !R.folk || modal || R.finale || R.tour){ return; }
  const M = townSt(); if(M.walking) return;
  R.folk.forEach(f=>{ if(Math.random()<.3) folkStep(f); else if(Math.random()<.15 && (f.pos[0]!==f.home[0] || f.pos[1]!==f.home[1])) folkStep(f); });
}
function folkStart(){ if(!folkTimer) folkTimer = setInterval(folkTick, 900); }

PLACES.town = {grid:townGrid, st:townSt, lit:true, walkable:townWalkable, mark:townMark, closed:()=>false, blocksSight:()=>false,
  trigger:townTrigger, bump:()=>{}, arrive:()=>false, busy:()=>!!(R && R.finale && R.finale.walking), noTap:()=>!!(R && (R.tour || (R.finale && R.finale.walking))), tileCls:townTileCls, tileInner:townTileInner,
  prep:townGround, save:townSave, cls:()=>'t-town', viewCls:()=>'tview', name:()=>TEXT.town.heading, extra:townExtra,
  placed:followPlaced, retarget:townRetarget};

// ---- The town screen: the map, a line under it, Codex and Title ----
function townLine(){
  const T = TEXT.townMap;
  if(R.finale) return R.finale.walking ? T.finale.walking : T.finale.go;
  if(!P.tutorialDone) return R.deck.length ? T.toTheWell : T.woke;
  const open = ['forge','inn','training','scriptorium'].filter(k=>P.town[k]).length;
  return `${T.walkHint} ${open===4?TEXT.town.allOpen: open===3?TEXT.town.stillBoardedOne: fill(TEXT.town.stillBoardedMany,{n:4-open})}`;
}
function townHTML(){
  if(R.deck.length) saveHero(); R.firstVisit = null; folkStart();
  if(!R.finale && finaleDue()) R.finale = {stage:'bell', bell:true};   // a reload in the middle of it: the bell again
  const M = townSt();
  return `${mapView(PLACES.town)}<div class="panel cavemsg" id="cavemsg">${M.msg || townLine()}</div>
    <div class="dock row divetools"><button onclick="R.codexFrom='town';goto('codex')">Codex</button><button onclick="goto('title')">Title</button></div>`;
}
// called after every render of the town screen: Amos's tour carries on when nothing else is up, and so does the finale
function townAfterRender(){
  if(R && R.tour && !R.tour.busy && !modal) setTimeout(tourStep, 360);
  if(R && R.finale && !R.finale.busy && !modal) setTimeout(finaleStep, 360);
}

// ---- A conversation as a popup over the map: talk() lines, then the map again ----
function talkPop(key, lines, then){ TW = {key:null}; modal = {kind:'talk', key, lines, then}; render(); }
function talkPopHTML(){ const m = modal;
  return `<div class="overlay talkpop" id="talkpop">${talk(m.key, m.lines, `<button class="primary wide" onclick="closeTalk()">${TEXT.townMap.ok}</button>`)}</div>`; }
function closeTalk(){ const then = modal && modal.then; modal = null; if(then) then(); else render(); }

// ---- Amos's tour: he walks you to each stop and says his piece there (TEXT.tour.stops) ----
// from the well right after the Furnace, or from wherever you are when you ask at the church
function startTour(fromWell){ if(fromWell) townPlace(tourAt('well'), 'back'); R.tour = {i:0, busy:false}; P.toured = false; TW = {key:null}; goto('town'); }
function tourAt(at){
  if(at==='well'){ const [x,y] = townSpot('npc','furnace'); return [x,y+1]; }
  const c = CAVES.findIndex(c=>c.id===at); if(c>=0) return frontOf(townSpot('cave',c));
  return frontOf(townSpot('door',at));
}
async function tourStep(){
  const t = R && R.tour; if(!t || t.busy || modal || screen!=='town') return;
  const stop = TEXT.tour.stops[t.i];
  if(!stop){ R.tour = null; P.toured = true; townSt().follow = null; townSave(); say(TEXT.townMap.tourDone); render(); return; }
  t.busy = true;
  const M = townSt(), goal = tourAt(stop.at);
  if(M.pos[0]!==goal[0] || M.pos[1]!==goal[1]){ M.goal = goal; await walkLoop(); }
  if(R.tour!==t || screen!=='town'){ t.busy = false; return; }   // left town mid-tour: carry on when you're back
  face([M.pos[0], M.pos[1]-1]);   // turn to whatever he's showing you
  talkPop('tour'+t.i, stop.lines, ()=>{ t.i++; t.busy = false; render(); });
}

// ---- The finale: the last cave is cleared, the bell rings, and the whole town walks to church ----
// caveDoneHTML (dive.js) sends you here instead of straight to the chapter ending (story.js chapterEndHTML).
// R.finale.stage: 'bell' (the popup) -> 'gather' (everyone out of their doors and into a line on the way to the
// church, you at the back by the well) -> 'amos' (his line) -> 'march' (the line walks in at the church door, you
// and Amos last) -> the chapter ending. A reload starts it over from the bell.
function finaleDue(){ return P.tutorialDone && allCavesDone() && !(P.chapters && P.chapters.philadelphia); }
function finaleStart(){ R.cave = null; R.folk = null; R.finale = {stage:'bell', bell:true}; R.tmap = null; townPlace(tourAt('well'), 'back'); TW = {key:null}; goto('town'); }
async function finaleStep(){
  const F = R && R.finale; if(!F || F.busy || modal || screen!=='town') return;
  if(F.stage==='bell'){ F.busy = true; talkPop('finale-bell', TEXT.townMap.finale.bell, ()=>{ F.stage = 'gather'; F.busy = false; render(); }); return; }
  if(F.stage==='gather'){ F.busy = true; F.walking = true; say(TEXT.townMap.finale.walking); await gather(); F.stage = 'amos'; F.walking = false; F.busy = false; townAfterRender(); return; }
  if(F.stage==='amos'){ F.busy = true; talkPop('finale-amos', TEXT.townMap.finale.amos, ()=>{ F.stage = 'march'; F.busy = false; render(); }); return; }
  if(F.stage==='march'){ F.busy = true; F.walking = true; say(TEXT.townMap.finale.go); await march(); }
}
// stepping into the church at the end
function finaleIn(){ R.finale = null; R.folk = null; R.endStats = false; goto('chapterend'); }
const FIN_STEP = ()=>window.__FAST ? 40 : 300;
// a path over open ground (people don't block each other here)
function openRoute(from, to){
  const ok = (a,b)=>{ const c = townChar(a,b); return WALK_ON.includes(c) || 'abwhsB'.includes(c) || (a===to[0] && b===to[1]); };
  const prev = new Map([[tid(...from), null]]), q = [from];
  while(q.length){ const [x,y] = q.shift(); if(x===to[0] && y===to[1]) break;
    for(const [a,b] of [[x,y-1],[x+1,y],[x,y+1],[x-1,y]]){ if(prev.has(tid(a,b)) || !ok(a,b)) continue; prev.set(tid(a,b), [x,y]); q.push([a,b]); } }
  if(!prev.has(tid(...to))) return [from, to];
  const p = []; for(let n = to; n; n = prev.get(tid(...n))) p.unshift(n); return p;
}
// one of the walkers on the map: a townsperson (walk cycle) or one of the four who keep the shops (they bob along)
const SHOP_OF = {blacksmith:'forge', innkeeper:'inn', drill:'training', scribe:'scriptorium'};
// they're part of the map's drawing (townExtra), so a popup over the map doesn't sweep them away
function walkerStand(w){ return w.look ? folkStand(w.look, w.face||'front') : ENEMY_IMG[NPC_IMG[w.who]].f[0]; }
function walkersHTML(){ const ws = R.finale && R.finale.walkers; if(!ws) return '';
  return ws.filter(w=>w.out && !w.gone).map(w=>`<div class="tfolk proc" id="${w.id}" style="transform:translate(${w.pos[0]*MAP_T+(w.dx||0)}px,${w.pos[1]*MAP_T}px);z-index:${w.pos[1]*2+1}"><div class="fs ${w.look?'':'npc'}" style="--stand:url(${walkerStand(w)})"></div></div>`).join(''); }
function walkerEl(w){ w.out = true;
  const el = document.createElement('div'); el.className = 'tfolk proc'; el.id = w.id;
  el.innerHTML = `<div class="fs ${w.look?'':'npc'}"></div>`; document.getElementById('cmap').appendChild(el); return el; }
function walkerAt(w, [x,y], face){ w.pos = [x,y]; w.face = face;
  const el = document.getElementById(w.id); if(!el) return; const fs = el.querySelector('.fs');
  fs.style.setProperty('--stand', `url(${walkerStand(w)})`); const s = w.look && folkWalkStrip(w.look, face); if(s) fs.style.setProperty('--walk', `url(${s})`); else fs.style.removeProperty('--walk');
  el.style.transform = `translate(${x*MAP_T + (w.dx||0)}px,${y*MAP_T}px)`; el.style.zIndex = y*2+1; }
function walkerCls(w, op, cls){ const el = document.getElementById(w.id); if(el) el.classList[op](cls); }
const faceTo = ([px,py],[x,y])=>y<py?'back':y>py?'front':x<px?'west':'east';
// everyone out of their door and along to their place in the line: the line runs from just ahead of you to the church step
async function gather(){
  const g = townGrid(), M = townSt(), church = g.bld.church.door, front = [church[0], church[1]+1];
  const line = openRoute(M.pos, front); F_LINE = line;   // line[0] is you
  const walkers = [...townsfolk().filter(p=>FOLK[p.look]).map(p=>({id:'w-'+p.look, look:p.look, door:g.bld['house:'+p.look].door})),
    ...Object.entries(SHOP_OF).map(([who,b])=>({id:'w-'+who, who, door:g.bld[b].door}))];
  // the nearest to the church goes first and stands at the front
  const d = ([x,y])=>openRoute([x,y+1], front).length; walkers.sort((a,b)=>d(a.door)-d(b.door));
  const N = line.length-1;
  walkers.forEach((w,k)=>{ w.idx = Math.max(1, N-k); if(N-k<1) w.dx = (k%2?12:-12); });
  R.finale.walkers = walkers; const step = FIN_STEP();
  await Promise.all(walkers.map((w,k)=>new Promise(done=>setTimeout(async ()=>{
    if(!document.getElementById('cmap')) return done();
    const el = walkerEl(w), path = openRoute(w.door, line[w.idx]);
    walkerAt(w, path[0], 'front'); el.style.opacity = 0; void el.offsetWidth; el.style.transitionDuration = step+'ms'; el.style.opacity = 1; el.classList.add('walking');
    for(let i=1;i<path.length;i++){ walkerAt(w, path[i], faceTo(path[i-1], path[i])); await sleep(step); if(screen!=='town') return done(); }
    walkerCls(w, 'remove', 'walking'); walkerAt(w, w.pos, faceTo(w.pos, line[Math.min(w.idx+1, N)])); done();
  }, k*step*1.6))));
}
let F_LINE = null;
// the line walks in: everyone one step along it each beat, in at the church door at the front; you at the back
async function march(){
  const line = F_LINE, N = line.length-1, door = townGrid().bld.church.door, ws = (R.finale.walkers || []).filter(w=>w.out), step = FIN_STEP();
  R.finale.bell = false; document.querySelectorAll('.bellring').forEach(b=>b.remove());
  ws.forEach(w=>{ const el = document.getElementById(w.id); if(el){ el.style.transitionDuration = step+'ms'; el.classList.add('walking'); } });
  for(let t=0; t<=N+ws.length+2 && screen==='town'; t++){
    ws.forEach(w=>{ if(w.gone) return; w.idx++;
      const to = w.idx<=N ? line[w.idx] : door; walkerAt(w, to, faceTo(w.pos, to));
      if(w.idx>N){ const el = document.getElementById(w.id); w.gone = true; if(el){ el.style.opacity = 0; setTimeout(()=>el.remove(), step); } } });
    // you follow once the one ahead has moved on
    const M = townSt(), me = line.findIndex(p=>p[0]===M.pos[0] && p[1]===M.pos[1]), ahead = me+1;
    if(me>=0 && ahead<=N && !ws.some(w=>!w.gone && w.idx===ahead)) stepTo(...line[ahead]);
    else if(me===N && ws.every(w=>w.gone)){ face(door); await sleep(step); finaleIn(); return; }
    await sleep(step);
  }
  if(screen==='town') finaleIn();
}
