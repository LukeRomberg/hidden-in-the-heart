/* The walking map: a hand-drawn tile grid you tap to walk on, shared by the caves (dive.js) and the town
   (townmap.js). The engine does the walking (a BFS path over tiles you've seen), the light, the camera
   that keeps you in the middle, and the drawing; each place supplies its own rules.

   A place is registered in PLACES under the screen that shows it ('dive', 'town') and gives:
     grid()            the parsed map: {W, H, rows, start, mk}
     st()              where you are on it: {pos, face, seen[], vis:Set, msg, walking, goal}
     lit               true: no fog, every tile is lit (the town); otherwise light reaches SIGHT tiles
     walkable(x,y)     can you stand there
     mark(x,y)         something you walk into (a fight, a door, a person) or null: a path can end there, never pass it
     closed(x,y)       a shut door you can walk up to and bump;  bump(x,y) what happens then
     blocksSight(x,y)  stops the light (only for places that aren't lit)
     trigger(m)        you walked into marker m;  arrive(fresh, goal) after each step, true to stop there
     busy()            true while something under the map has your attention (taps don't walk)
     tileCls(x,y), tileInner(x,y)   how a tile is drawn;  prep() makes the tile textures once
     cls(), name(), viewCls()       css classes on the map and the view, the name in the corner
     extra()           more html inside the map (buildings, people who move);  overlay  html over the view
     placed()          after the hero moves (someone walking with you follows);  retarget([x,y]) where a tap really means
     save()            remember where you are
     ground()          optional: the whole map's ground as one image (the caves' tilesets, drawn on a dual grid),
                       or null while it's still being drawn; the tiles above it then only carry fog and things
   Light pools, particles, shadows, doors swinging and arrival titles are mapfx.js, configured per place in MAPFX. */
const PLACES = {};
const MAP_T = 40, STEP_MS = 120, SIGHT = 3.3;   // tile size in px, walking speed, how far the light reaches (tiles)
const tid = (x,y)=>x+','+y;
// the place on screen (the cave, unless you're in town)
function here(){ return PLACES[screen] || PLACES.dive; }

// ---- Light: a few tiles around you, cut off by rock ----
function inSight(hx,hy,x,y){
  const pl = here(); if(pl.lit) return true;
  const dx = x-hx, dy = y-hy; if(Math.abs(dx)<=1 && Math.abs(dy)<=1) return true;
  if(dx*dx+dy*dy > SIGHT*SIGHT) return false;
  const n = Math.ceil(Math.hypot(dx,dy)*4);
  for(let s=1;s<n;s++){ const tx = Math.floor(hx+.5+dx*s/n), ty = Math.floor(hy+.5+dy*s/n);
    if((tx!==x || ty!==y) && (tx!==hx || ty!==hy) && pl.blocksSight(tx,ty)) return false; }
  return true;
}
// recompute what's lit; marks it seen, redraws tiles that changed, returns the tiles seen for the first time
function updateSight(){
  const pl = here(); if(pl.lit) return [];
  const M = pl.st(), m = pl.grid(), [hx,hy] = M.pos, r = Math.ceil(SIGHT), vis = new Set(), fresh = [];
  for(let y=hy-r;y<=hy+r;y++) for(let x=hx-r;x<=hx+r;x++){
    if(x<0||y<0||x>=m.W||y>=m.H || !inSight(hx,hy,x,y)) continue;
    const k = y*m.W+x; vis.add(k); if(!M.seen[k]){ M.seen[k]=1; fresh.push(k); } }
  const changed = new Set([...vis].filter(k=>!M.vis.has(k)).concat([...M.vis].filter(k=>!vis.has(k))));
  M.vis = vis; changed.forEach(k=>redrawTile(k)); fxSeen(fresh); return fresh;
}
function redrawTile(k){ const el = document.getElementById('t'+k); if(!el) return; const pl = here(), m = pl.grid(), x = k%m.W, y = (k-x)/m.W;
  el.className = pl.tileCls(x,y); el.innerHTML = pl.tileInner(x,y) + fxTileHTML(pl,x,y); }

// ---- Walking: BFS over tiles you've seen; a marker can end a path but not be walked through ----
function reach(){
  const pl = here(), M = pl.st(), m = pl.grid(), [sx,sy] = M.pos, dist = new Map([[tid(sx,sy),0]]), from = new Map(), q = [[sx,sy]];
  while(q.length){ const [x,y] = q.shift(), d = dist.get(tid(x,y));
    if((x!==sx || y!==sy) && !pl.walkable(x,y)) continue;   // markers are dead ends
    for(const [nx,ny] of [[x,y-1],[x+1,y],[x,y+1],[x-1,y]]){ const id = tid(nx,ny);
      if(dist.has(id) || nx<0||ny<0||nx>=m.W||ny>=m.H || !M.seen[ny*m.W+nx]) continue;
      if(!pl.walkable(nx,ny) && !pl.mark(nx,ny)) continue;
      dist.set(id, d+1); from.set(id, [x,y]); q.push([nx,ny]); } }
  return {dist, path(x,y){ const p = [[x,y]]; let id = tid(x,y); while(from.has(id)){ const f = from.get(id); p.unshift(f); id = tid(...f); } return p; }};
}
// tap a tile: walk there; tap a closed door to walk up to it and try it; tap the dark to go as near as you can
function planTo(goal){
  const pl = here(), [x,y] = pl.retarget ? pl.retarget(goal) : goal, M = pl.st(), m = pl.grid(), Rc = reach(), seen = M.seen[y*m.W+x];
  if(seen && pl.closed(x,y)){
    const next = [[x,y-1],[x+1,y],[x,y+1],[x-1,y]].filter(([a,b])=>Rc.dist.has(tid(a,b)) && pl.walkable(a,b)).sort((a,b)=>Rc.dist.get(tid(...a))-Rc.dist.get(tid(...b)))[0];
    if(next) return {path:Rc.path(...next), then:()=>pl.bump(x,y)};
  }
  if(seen && Rc.dist.has(tid(x,y))) return {path:Rc.path(x,y)};
  let best = null, score = Infinity;
  Rc.dist.forEach((d,id)=>{ const [a,b] = id.split(',').map(Number); if(pl.mark(a,b)) return;
    const s = Math.hypot(a-x,b-y)*1000 + d; if(s<score){ score=s; best=[a,b]; } });
  return best ? {path:Rc.path(...best)} : null;
}
function mapTap(ev){
  const pl = PLACES[screen];
  if(!pl || modal || fxDoorBusy || pl.busy() || (pl.noTap && pl.noTap())) return;
  const r = document.getElementById('cmap').getBoundingClientRect();
  const x = Math.floor((ev.clientX-r.left)/MAP_T), y = Math.floor((ev.clientY-r.top)/MAP_T);
  walkToward([x,y]);
}
// start walking toward a tile (a tap, or a scripted walk like Amos's tour)
function walkToward(goal){
  const M = here().st(), [hx,hy] = M.pos;
  if(goal[0]===hx && goal[1]===hy && !M.walking) return;
  M.goal = goal; if(!M.walking) walkLoop();
}
async function walkLoop(){
  const pl = here(), scr = screen, M = pl.st(); M.walking = true; heroEl('add');
  try{
    while(M.goal && screen===scr && !modal && !pl.busy()){
      const plan = planTo(M.goal); M.goal = null; if(!plan) break;
      let stop = false;
      for(let i=1;i<plan.path.length && !stop;i++){
        const next = plan.path[i], m = pl.mark(...next);
        if(m && m.walkOver){ stepTo(...next); await sleep(STEP_MS); if(screen!==scr || pl.st()!==M) return; pl.trigger(m); stop = true; break; }
        if(m){ face(next); pl.trigger(m); stop = true; break; }   // you stop in front of it, facing it
        const fresh = stepTo(...next); await sleep(STEP_MS);
        if(screen!==scr || pl.st()!==M) return;
        stop = pl.arrive(fresh, plan.path[plan.path.length-1]);
        if(M.goal) break;   // tapped somewhere else mid-walk: replan from here
      }
      if(!stop && !M.goal && plan.then && plan.path.length) plan.then();
    }
  } finally { M.walking = false; heroEl('remove'); }
  if(screen===scr && pl.st()===M) pl.save();
}
function stepTo(x,y){ face([x,y]); here().st().pos = [x,y]; const fresh = updateSight(); placeHero(); return fresh; }
function face([x,y]){ const M = here().st(), [px,py] = M.pos; if(y<py) M.face='back'; else if(y>py) M.face='front'; else if(x<px) M.face='west'; else if(x>px) M.face='east'; placeHero(); }
function say(msg){ here().st().msg = msg; const el = document.getElementById('cavemsg'); if(el) el.innerHTML = msg; }
function heroEl(op){ const h = document.getElementById('chero'); if(h) h.classList[op]('walking'); }
function placeHero(){
  const pl = here(), h = document.getElementById('chero'), mp = document.getElementById('cmap'); if(!h || !mp) return;
  const M = pl.st(), [x,y] = M.pos; h.style.transform = `translate(${x*MAP_T}px,${y*MAP_T}px)`; h.style.zIndex = y*2+1; mp.style.transform = camera();
  if(h.dataset.face!==M.face){ h.dataset.face = M.face; h.querySelector('.hs').innerHTML = heroSprite(); }
  if(pl.placed) pl.placed();
}
// front and back are the layered hero (your gear shows); side-on is the PixelLab walk, which steps while you move
function heroSprite(){ const f = here().st().face, S = IMG.heroSide[f];
  if(S) return `<div class="side" style="--stand:url(${S.stand});--walk:url(${S.walk})"></div>`;
  return sprite(f==='back'?'back':'player',0,0.8); }
function camera(){ const [x,y] = here().st().pos; return `translate(${-(x+.5)*MAP_T}px,${-(y+.5)*MAP_T}px)`; }

// ---- Drawing: every tile, then the place's extras, then you ----
function mapView(pl){
  const M = pl.st(), m = pl.grid(); if(pl.prep) pl.prep();
  M.vis = new Set(); const [hx,hy] = M.pos;
  for(let y=0;y<m.H;y++) for(let x=0;x<m.W;x++) if(inSight(hx,hy,x,y)){ const k=y*m.W+x; M.vis.add(k); M.seen[k]=1; }
  let tiles = '';
  for(let y=0;y<m.H;y++) for(let x=0;x<m.W;x++) tiles += `<div class="${pl.tileCls(x,y)}" id="t${y*m.W+x}" style="left:${x*MAP_T}px;top:${y*MAP_T}px;z-index:${y*2}">${pl.tileInner(x,y)}${fxTileHTML(pl,x,y)}</div>`;
  const hero = `<div id="chero" class="chero" data-face="${M.face}" style="transform:translate(${hx*MAP_T}px,${hy*MAP_T}px);z-index:${hy*2+1}"><div class="hs">${heroSprite()}</div></div>`;
  const g = pl.ground ? pl.ground() : null;
  return `<div class="cave-view ${pl.viewCls()}" onclick="mapTap(event)" role="application" aria-label="${pl.name()}">
    <div id="cmap" class="cmap ${pl.cls()}${pl.ground?' grounded':''}" style="width:${m.W*MAP_T}px;height:${m.H*MAP_T}px;transform:${camera()}${g?`;background-image:url(${g})`:''}">${tiles}${pl.extra?pl.extra():''}${hero}${fxLayersHTML(pl)}</div>
    ${fxViewHTML(pl)}${pl.overlay||''}<div class="cavename">${pl.name()}</div></div>`;
}
// Pixel textures drawn in code, once, into data URIs (the town's placeholder tiles and objects, the caves' wall torch)
function pxCanvas(w,h,draw){ const c = document.createElement('canvas'); c.width=w; c.height=h; const g = c.getContext('2d'); draw((x,y,col,ww=1,hh=1)=>{ g.fillStyle=col; g.fillRect(x,y,ww,hh); }); return c.toDataURL(); }
function rnd(seed){ let s = seed>>>0 || 1; return ()=>((s = (s*1664525+1013904223)>>>0) / 4294967296); }
// a 16x16 grid of palette letters ('.' is clear) as a data URI
function pxArt(rows, pal){ return pxCanvas(rows[0].length, rows.length, px=>rows.forEach((row,y)=>Array.from(row).forEach((c,x)=>{ if(c!=='.') px(x,y,pal[c]); }))); }
