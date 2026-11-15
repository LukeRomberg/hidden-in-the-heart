/* Philadelphia as a place you walk (the town screen). Same tap-to-walk engine as the caves (tilemap.js), but
   lit: no fog. Walk into a door to go in (the shop screens in town.js), into someone to talk (a popup over the
   map), into a cave mouth to go down, or out along the road east to the world map.

   Map glyphs:  T tree   # rock   , grass   . cobblestone   = dirt path   O the well   @ where you wake
     l lamp post   k bench   p flower planter (you walk round them)
     C church  F forge  N inn  Y training yard  R scriptorium: a building's footprint (its art covers it)
     + a door: the building is the footprint letter it sits in
     1 2 3 a cave mouth (CAVES[0..2])     E the road east (the world map)
     people, each shown only while they're there:  a Amos (outside the church)   B Bram burning by the well
       b Bram   w Wendell   h Hale   s Silas: each by their door once it's open again
   Tile ids for art (CSS classes on .t-town tiles): gr grass, cb cobblestone, dt dirt, rk rock; objects in TOWN_ART. */
const TOWN = {map:[
  'TTTTTTTTTT###TTTTTTTTTT',
  'T,,,,,,,,,#2#,,,,,,,,,T',
  'TT,CCC,,,T,=,,,,,,,,,TT',
  'T,,CCC,,T,,=,,,,FFF,,,T',
  'T,,CCC,,,,,=,,T,FFF,,,T',
  'T,,C+Ca,,,,=,,,,F+Fb,TT',
  'TT,,.........p......,,T',
  'T,,,...l........l...,,T',
  'TNNN.p.............RRRT',
  'TNNN.....k.OB......RRRT',
  'TN+N..........k...sR+RT',
  'T,,w......@.........,,T',
  'T,,,...l........l...==E',
  'T,,,..............p.,,T',
  '##,,=,,,,,,,,,,=,,,,,,T',
  '#1===,YYY,,,,,,=,,T,,,T',
  '##,,,,YYY,,T,,,=,,,,T,T',
  'T,,,,,Y+Yh,,T,,=,,,,,,T',
  'T,T,T,,,,,,,,,#3#,,,T,T',
  'TTTTTTTTTTTTTT###TTTTTT',
], marks:{
  a:{t:'npc', who:'priest'}, B:{t:'npc', who:'furnace'},
  b:{t:'npc', who:'blacksmith', home:'forge'}, w:{t:'npc', who:'innkeeper', home:'inn'},
  h:{t:'npc', who:'drill', home:'training'}, s:{t:'npc', who:'scribe', home:'scriptorium'},
  1:{t:'cave', i:0}, 2:{t:'cave', i:1}, 3:{t:'cave', i:2}, E:{t:'road'},
}};
const BLD_OF = {C:'church', F:'forge', N:'inn', Y:'training', R:'scriptorium'};
const WALK_ON = ',.=@';
// the parsed town: size, rows, where you wake, markers, and each building's footprint and door
let TOWN_GRID = null;
function townGrid(){
  if(TOWN_GRID) return TOWN_GRID;
  const rows = TOWN.map, H = rows.length, W = rows[0].length, mk = {}, bld = {}; let start = [1,1];
  const at = (x,y)=>(rows[y]||'')[x];
  rows.forEach((row,y)=>Array.from(row).forEach((ch,x)=>{
    if(ch==='@') start = [x,y];
    if(BLD_OF[ch]){ const b = bld[BLD_OF[ch]] = bld[BLD_OF[ch]] || {id:BLD_OF[ch], x0:x, y0:y, x1:x, y1:y};
      b.x0 = Math.min(b.x0,x); b.y0 = Math.min(b.y0,y); b.x1 = Math.max(b.x1,x); b.y1 = Math.max(b.y1,y); }
    if(TOWN.marks[ch]) mk[tid(x,y)] = {...TOWN.marks[ch], id:tid(x,y)};
  }));
  rows.forEach((row,y)=>Array.from(row).forEach((ch,x)=>{ if(ch!=='+') return;
    const b = BLD_OF[at(x,y-1)] || BLD_OF[at(x-1,y)] || BLD_OF[at(x+1,y)];
    mk[tid(x,y)] = {t:'door', b, id:tid(x,y)}; bld[b].door = [x,y]; }));
  return TOWN_GRID = {W, H, rows, start, mk, bld};
}
// where something is on the map: townSpot('door','forge'), townSpot('cave',0), townSpot('npc','furnace'), townSpot('road')
function townSpot(t, id){ const m = Object.values(townGrid().mk).find(m=>m.t===t && (id==null || m.b===id || m.i===id || m.who===id));
  return m ? m.id.split(',').map(Number) : null; }
// the tile you stand on to use it (below it, or beside it if below is blocked)
function frontOf([x,y]){ return [[x,y+1],[x-1,y],[x+1,y],[x,y-1]].find(([a,b])=>townWalkable(a,b)) || [x,y+1]; }

// ---- Who's out ----
// Amos walks beside you from the lid until the Furnace, and on his tour; otherwise he waits outside the church.
function amosWithYou(){ return !!(R && (R.tour || (!P.tutorialDone && R.deck.length))); }
function npcHere(m){
  if(m.who==='furnace') return !P.tutorialDone;
  if(m.who==='priest') return !!P.tutorialDone && !amosWithYou();
  return !!P.town[m.home];
}
function townChar(x,y){ const m = townGrid(); return (y>=0 && y<m.H && x>=0 && x<m.W) ? m.rows[y][x] : 'T'; }
function townMark(x,y){ const m = townGrid().mk[tid(x,y)]; return m && (m.t!=='npc' || npcHere(m)) ? m : null; }
function townWalkable(x,y){ const c = townChar(x,y), m = townGrid().mk[tid(x,y)];
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
}
function townDoor(id){
  const T = TEXT.townMap;
  if(!P.tutorialDone && id==='church'){
    if(!R.deck.length){ goto('pro3'); return; }   // the first time: Amos is inside, sweeping
    talkPop('town-church', T.churchAfterLid); return; }
  if(!P.tutorialDone && id!=='church'){ say(TEXT.town.boarded[id]); return; }
  if(!(BUILD[id].always || P.town[id])){ say(TEXT.town.boarded[id]); return; }
  enterBuilding(id);
}
function townCave(i){
  const T = TEXT.townMap;
  if(!P.tutorialDone){ say(T.notTonight); return; }
  if(!caveOpen(i)){ say(fill(T.caveShut,{name:TEXT.caves[i].name})); return; }
  if(R.hp < R.maxHp*0.3){ say(TEXT.church.tooHurt); return; }
  startCave(i);
}
function townRoad(){ if(!P.tutorialDone){ say(TEXT.townMap.notTonight); return; } goto('world'); }
function townTalk(who){
  const T = TEXT.townMap;
  if(who==='furnace'){
    if(!R.deck.length){ talkPop('town-bram', T.bramShouting); return; }   // nothing in your hands yet: he drives you back
    talkPop('town-bram2', T.bramFight, ()=>startTutorial()); return; }
  if(who==='priest'){ talkPop('town-amos'+(allCavesDone()?1:0), [allCavesDone() ? TEXT.church.lineAfter : TEXT.church.lineBefore]); return; }
  talkPop('town-'+who, T.people[who]);
}
// tapping a building means its door
function townRetarget([x,y]){ const b = Object.values(townGrid().bld).find(b=>x>=b.x0 && x<=b.x1 && y>=b.y0 && y<=b.y1); return b ? b.door : [x,y]; }

// ---- Someone walking with you: one step behind ----
function followPlaced(){
  const M = townSt(), el = document.getElementById('camos'); if(!el) return;
  if(!M.last || M.last[0]!==M.pos[0] || M.last[1]!==M.pos[1]){ if(M.last) M.follow = M.last; M.last = M.pos.slice(); }
  const [x,y] = M.follow || followStart(); el.style.transform = `translate(${x*MAP_T}px,${y*MAP_T}px)`; el.style.zIndex = y*2+1;
}
function followStart(){ const M = townSt(), [x,y] = M.pos;
  return [[x-1,y],[x+1,y],[x,y+1],[x,y-1]].find(([a,b])=>townWalkable(a,b)) || [x,y]; }

// ---- Drawing ----
function townBase(x,y){ const c = townChar(x,y);
  if(c==='.' || c==='@' || c==='O' || c==='B') return 'cb';
  if(c==='=' || c==='E') return 'dt';
  if(c==='#' || '123'.includes(c)) return 'rk';
  if('abwhslkp'.includes(c)) return [[x,y-1],[x+1,y],[x,y+1],[x-1,y]].some(([a,b])=>'.@'.includes(townChar(a,b))) ? 'cb' : 'gr';
  return 'gr'; }
function townTileCls(x,y){ const v = ((x*7+y*13+x*y*3)%4+4)%4; return `tl ${townBase(x,y)} v${v} lit`; }
function townTileInner(x,y){
  const c = townChar(x,y), art = n=>`<img class="mk" src="${townArt()[n]}" alt="">`;
  if(c==='T') return art('tree');
  if(c==='O') return art('well');
  if(c==='l') return art('lamp');
  if(c==='k') return art('bench');
  if(c==='p') return art('planter');
  if('123'.includes(c)) return art('mouth');
  if(c==='E') return art('sign');
  const m = townMark(x,y); if(!m || m.t!=='npc') return '';
  return npcImg(m.who);
}
const NPC_IMG = {blacksmith:'hothead_f', innkeeper:'grudge_f', drill:'brawler_f', scribe:'slanderer_f'};
function npcImg(who){
  if(who==='priest') return `<img class="mk who" src="${IMG.priest.idle}" alt="${TEXT.speakers.priest}">`;
  if(who==='furnace') return `<img class="mk who furnace" src="${ENEMY_IMG.furnace.f[0]}" alt="${TEXT.speakers.blacksmith}">`;
  return `<img class="mk who" src="${ENEMY_IMG[NPC_IMG[who]].f[0]}" alt="${TEXT.speakers[who]}">`;
}
// the buildings over their footprints, with a name plate; Amos walking with you
function townExtra(){
  const g = townGrid();
  const blds = Object.values(g.bld).map(b=>{ const id = b.id, usable = BUILD[id].always || P.town[id], lit = id==='church' ? !!P.town.church : usable;
    const w = (b.x1-b.x0+1)*MAP_T, h = (b.y1-b.y0+1)*MAP_T;
    return `<div class="bldg" style="left:${b.x0*MAP_T}px;top:${b.y0*MAP_T}px;width:${w}px;height:${h}px;z-index:${b.y1*2}"><img src="${IMG.town[id][lit?1:0]}" alt="${BUILD[id].name}">
      <span class="bname ${usable?'':'shut'}">${usable?BUILD[id].name:TEXT.town.boardedLabel}</span></div>`; }).join('');
  if(!amosWithYou()) return blds;
  const [x,y] = townSt().follow || followStart();
  return blds + `<div id="camos" class="chero follow" style="transform:translate(${x*MAP_T}px,${y*MAP_T}px);z-index:${y*2+1}"><img class="hs" src="${IMG.priest.idle}" alt="${TEXT.speakers.priest}"></div>`;
}
// grass, cobblestone, dirt and rock, drawn once into data URIs (placeholder art until a town tileset is approved)
const TOWN_PAL = {gr:['#33572c','#3e6834','#49773b','#578a45','#6c9f55'], cb:['#4a443e','#665d53','#776c60','#887c6e','#a09382'],
  dt:['#5e4329','#6f5233','#7d5e3b','#8d6c45','#a07e54'], rk:['#2a2825','#35322e','#423e39','#524e47']};
function townTiles(){
  if(document.getElementById('tiles-town')) return;
  const C = TOWN_PAL, css = [];
  for(let v=0;v<4;v++){
    const r = rnd(5309+v*131), n = k=>Math.floor(r()*k);
    css.push(`.t-town .gr.v${v}{background-image:url(${pxCanvas(16,16,px=>{ px(0,0,C.gr[2],16,16);
      for(let i=0;i<34;i++) px(n(16), n(16), C.gr[r()<.5?1:3]);
      for(let i=0;i<5;i++){ const x=n(15), y=1+n(14); px(x,y,C.gr[4]); px(x,y-1,C.gr[3]); }
      if(v===2){ px(4,5,'#e8d070'); px(11,10,'#d890b0'); } })})}`);
    css.push(`.t-town .cb.v${v}{background-image:url(${pxCanvas(16,16,px=>{ px(0,0,C.cb[0],16,16);
      for(let row=0;row<4;row++){ const o = (row+v)%2 ? 2 : 0; for(let col=-1;col<4;col++){ const x = col*4+o, y = row*4;
        px(x+1,y+1,C.cb[2],3,3); px(x+1,y+1,C.cb[3],2,1); px(x+3,y+3,C.cb[1],1,1); if(r()<.25) px(x+2,y+2,C.cb[4]); } } })})}`);
    css.push(`.t-town .dt.v${v}{background-image:url(${pxCanvas(16,16,px=>{ px(0,0,C.dt[2],16,16);
      for(let i=0;i<36;i++) px(n(16), n(16), C.dt[r()<.5?1:3]);
      for(let i=0;i<4;i++) px(n(16), n(16), C.dt[4]); for(let i=0;i<6;i++) px(n(16), n(16), C.dt[0]); })})}`);
    css.push(`.t-town .rk.v${v}{background-image:url(${pxCanvas(16,16,px=>{ px(0,0,C.rk[1],16,16);
      for(let i=0;i<30;i++) px(n(16), n(16), C.rk[r()<.5?0:2]);
      for(let i=0;i<3;i++){ const x=n(14), y=n(14); px(x,y,C.rk[3],2,2); px(x+1,y+1,C.rk[0]); } })})}`);
  }
  const st = document.createElement('style'); st.id = 'tiles-town'; st.textContent = css.join('\n'); document.head.appendChild(st);
}
// objects, 16x16 like the cave's ART (same letters, plus e/f/h greens and b/B water)
const TOWN_ART = {
  tree: ['.....kkkkkk.....','...kkfffhhfkk...','..kfffhhhhhffk..','.kffffhhhhfffek.','.kffffhhhffffek.','kefffffffffffffk','keffffffffffffek','keefffffffffeeek',
         '.keeffffffeeeek.','.keeeeffeeeeeek.','..kkeeeeeeeekk..','....kkkddkkk....','.......dd.......','......kddk......','.....xxxxxx.....','................'],
  well: ['................','..kkkkkkkkkkkk..','.kWWWWWWWWWWWWk.','.kkdkkkkkkkkdkk.','...kd......dk...','...kd......dk...','..kkdkkkkkkdkk..','.kSSSSSSSSSSSSk.',
         '.kSbbbbbbbbbbSk.','.kSbBBbbbbBbbSk.','.kSbbbbbbbbbbSk.','.kSSSSSSSSSSSSk.','.ksssssssssssssk','.kttttttttttttk.','..xxxxxxxxxxxx..','................'],
  mouth:['................','.....kkkkkk.....','...kknnnnnnkk...','..knnnnnnnnnnk..','.knnnnnnnnnnnnk.','.knnnnnnnnnnnnk.','knnnnnnnnnnnnnnk','knnnnnnnnnnnnnnk',
         'knnnnnnnnnnnnnnk','knnnnnnnnnnnnnnk','knnnnnnnnnnnnnnk','knnnnnnnnnnnnnnk','knnnnnnnnnnnnnnk','kttnnnnnnnnnnttk','tSttnnnnnnnnttSt','.tSStttttttttSt.'],
  lamp: ['......kkkk......','.....kyYYyk.....','.....kyYYyk.....','......kkkk......','.......jj.......','.......jI.......','.......jI.......','.......jI.......',
         '.......jI.......','.......jI.......','.......jI.......','.......jI.......','......kjIk......','.....kjjIIk.....','.....xxxxxx.....','................'],
  bench:['................','................','................','................','................','..kkkkkkkkkkkk..','..kWWWWWWWWWWk..','..kwwwwwwwwwwk..',
         '..kkkkkkkkkkkk..','..kWWWWWWWWWWk..','..kwwwwwwwwwwk..','..kddddddddddk..','..kdk......kdk..','..kdk......kdk..','..xxx......xxx..','................'],
  planter:['................','................','...h.y.h..o.h...','..hfhyhfhhohfh..','..fhfhfhfhfhfh..','.kkkkkkkkkkkkkk.','.kSSSSSSSSSSSSk.','.kssssssssssssk.',
         '.kssssssssssssk.','.kttttttttttttk.','..xxxxxxxxxxxx..','................','................','................','................','................'],
  sign: ['................','................','..kkkkkkkkkkk...','..kWWWWWWWWWWk..','..kwwwwwwwwwwwk.','..kwddddddddwwwk','..kwwwwwwwwwwwk.','..kkkkkkkkkkkk..',
         '......kdk.......','......kdk.......','......kdk.......','......kdk.......','......kdk.......','.....xkdkx......','................','................'],
};
const townArtCache = {};
function townArt(){ if(!townArtCache.done){ const pal = {...ART_PAL, e:'#2f5a2a', f:'#3f7a34', h:'#5f9e46', b:'#2f4a6a', B:'#5a86b0'};
  Object.entries(TOWN_ART).forEach(([n,rows])=>townArtCache[n]=pxArt(rows, pal)); townArtCache.done = true; } return townArtCache; }

PLACES.town = {grid:townGrid, st:townSt, lit:true, walkable:townWalkable, mark:townMark, closed:()=>false, blocksSight:()=>false,
  trigger:townTrigger, bump:()=>{}, arrive:()=>false, busy:()=>false, noTap:()=>!!(R && R.tour), tileCls:townTileCls, tileInner:townTileInner,
  prep:townTiles, save:townSave, cls:()=>'t-town', viewCls:()=>'tview', name:()=>TEXT.town.heading, extra:townExtra,
  placed:followPlaced, retarget:townRetarget};

// ---- The town screen: the map, a line under it, Codex and Title ----
function townLine(){
  const T = TEXT.townMap;
  if(!P.tutorialDone) return R.deck.length ? T.toTheWell : T.woke;
  const open = ['forge','inn','training','scriptorium'].filter(k=>P.town[k]).length;
  return `${T.walkHint} ${open===4?TEXT.town.allOpen: open===3?TEXT.town.stillBoardedOne: fill(TEXT.town.stillBoardedMany,{n:4-open})}`;
}
function townHTML(){
  if(R.deck.length) saveHero(); R.firstVisit = null;
  const M = townSt();
  return `${mapView(PLACES.town)}<div class="panel cavemsg" id="cavemsg">${M.msg || townLine()}</div>
    <div class="dock row divetools"><button onclick="R.codexFrom='town';goto('codex')">Codex</button><button onclick="goto('title')">Title</button></div>`;
}
// called after every render of the town screen: Amos's tour carries on when nothing else is up
function townAfterRender(){ if(R && R.tour && !R.tour.busy && !modal) setTimeout(tourStep, 360); }

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
