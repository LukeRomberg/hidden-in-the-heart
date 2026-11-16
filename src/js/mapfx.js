/* How the maps feel. tilemap.js walks and draws the maps; this dresses them, the same way for the caves and the
   town: a fade and the place's name as you arrive, doors that swing open as you walk in, light pools (lamps, the
   forge, torches, campfires), small motion (embers, dust, fireflies, the odd leaf), soft shadows, a dusk tint.
   Nothing here is tied to a map's coordinates: each place says, by tile glyph or marker, what's where.

   MAPFX[screen] for a place in PLACES:
     at(x,y)   what that tile gives off, or null: {light:'fire'|'torch'|'lamp'|'forge', emit:'embers'|'sparks',
               sconce:true (a torch on the wall face), shadow:true (a soft shadow under whatever stands there)}.
               Lamps only light at dusk. In a fogged place a tile's things show once it has been seen.
     dust      motes drifting in your light (caves)
     trees     glyphs a leaf can drift down from now and then
     dusk      true, or a function: the place at dusk (a cool tint, lamps lit, fireflies by the trees).
               The town session turns this on for the town (MAPFX.town.dusk = ()=>…).
   Draw order on a map (z-index): tile row y at 2y, whoever stands on row y at 2y+1, so anything drawn taller than its
   tile covers someone standing behind it; then the dusk tint (900), the light pools (901), the particles (902).
   Everything moving stops under prefers-reduced-motion. */
const MAPFX = {
  dive: {dust:true, at:(x,y)=>caveFxAt(x,y)},
  town: {dusk:false, trees:'T', at:(x,y)=>townFxAt(x,y)},
};
// the town, by its glyphs (townmap.js): lamps, the forge's door once Bram is home, Bram burning by the well, props with shadows
function townFxAt(x,y){
  const c = townChar(x,y), m = townGrid().mk[tid(x,y)];
  if(c==='l') return {light:'lamp', shadow:true};
  if(m && m.t==='door' && m.b==='forge' && P.town.forge) return {light:'forge', emit:'embers'};
  if(m && m.t==='npc' && m.who==='furnace' && npcHere(m)) return {light:'forge', emit:'embers'};
  if('TOkp'.includes(c)) return {shadow:true};
  return null;
}

function fxKey(pl){ return Object.keys(PLACES).find(k=>PLACES[k]===pl); }
function fxCfg(pl){ return MAPFX[fxKey(pl)]; }
function fxDusk(c){ return !!(c && (typeof c.dusk==='function' ? c.dusk() : c.dusk)); }
function fxSeenAt(pl,x,y){ return pl.lit || pl.st().seen[y*pl.grid().W+x]; }

// ---- On a tile: shadows and wall torches (tilemap.js adds this after the place's own tile art) ----
function fxTileHTML(pl,x,y){
  const c = fxCfg(pl), f = c && c.at && fxSeenAt(pl,x,y) && c.at(x,y); if(!f) return '';
  return (f.shadow ? '<i class="shd"></i>' : '') + (f.sconce ? `<img class="sconce" src="${sconceArt().base}" alt=""><img class="sconce flame" src="${sconceArt().flame}" alt="">` : '');
}
// a little iron wall torch, in the cave objects' pixel size (32 to a tile)
let SCONCE = null;
function sconceArt(){
  if(SCONCE) return SCONCE;
  const pal = {...ART_PAL, w:'#6a4424'};
  SCONCE = {
    base: pxArt(['........','........','........','........','........','.kjjjjk.','.kiIIik.','..kjjk..','...ji...','...ji...','..kjik..','.kiIIik.','..kjjk..','........'], pal),
    flame: pxArt(['...y....','..yy....','..yYy...','.oyYyo..','.oYYYo..','..roor..','........','........','........','........','........','........','........','........'], pal),
  };
  return SCONCE;
}

// ---- Light pools and particles: layers over the whole map ----
const LIGHT_PX = {fire:150, torch:110, lamp:120, forge:170};   // how wide each pool is, in map px
function lightHTML(f,x,y,dusk){
  if(!f.light || (f.light==='lamp' && !dusk)) return '';
  const cx = x*MAP_T+MAP_T/2, cy = y*MAP_T+(f.sconce ? 10 : MAP_T/2), s = LIGHT_PX[f.light];
  return `<i class="lt ${f.light}" style="left:${cx-s/2}px;top:${cy-s/2}px;width:${s}px;height:${s}px;--d:${-((x*7+y*3)%10)/7}s"></i>`;
}
// a few particles rising from a point, each on its own loop (CSS), started at scattered moments
function emitHTML(kind, cx, cy, n, seed){
  const r = rnd(seed); let b = '';
  for(let i=0;i<n;i++){ const t = kind==='leaf' ? 9+r()*7 : kind==='ffly' ? 5+r()*4 : 1.4+r()*1.2;
    b += `<b style="--t:${t.toFixed(2)}s;--d:${(-r()*t*(kind==='leaf'?3:1)).toFixed(2)}s;--x:${Math.round((r()-.5)*(kind==='leaf'?50:kind==='ffly'?36:18))}px;--y:${Math.round((r()-.5)*24)}px;left:${Math.round((r()-.5)*(kind==='ffly'?30:12))}px"></b>`; }
  return `<i class="em ${kind}" style="left:${cx}px;top:${cy}px">${b}</i>`;
}
function tileEmitHTML(f,x,y){
  if(!f.emit) return '';
  const cx = x*MAP_T+MAP_T/2, n = f.emit==='embers' ? 7 : 3;
  return emitHTML('embers', cx, f.sconce ? y*MAP_T+6 : y*MAP_T+MAP_T*0.55, n, x*131+y*17+1);
}
// the layers, as html inside the map (tilemap.js mapView)
function fxLayersHTML(pl){
  const c = fxCfg(pl); if(!c) return '';
  const m = pl.grid(), dusk = fxDusk(c); let lights = '', parts = '';
  for(let y=0;y<m.H;y++) for(let x=0;x<m.W;x++){
    if(!fxSeenAt(pl,x,y)) continue; const f = c.at && c.at(x,y); if(!f) continue;
    lights += lightHTML(f,x,y,dusk); parts += tileEmitHTML(f,x,y); }
  if(c.trees) parts += treeFX(pl, c, dusk);
  return `${dusk?'<div class="mdusk"></div>':''}<div class="mlights" id="mlights">${lights}</div><div class="mparts" id="mparts">${parts}</div>`;
}
// leaves now and then from a handful of trees; fireflies near them at dusk
function treeFX(pl, c, dusk){
  const m = pl.grid(), trees = [];
  for(let y=0;y<m.H;y++) for(let x=0;x<m.W;x++) if(c.trees.includes(m.rows[y][x])) trees.push([x,y]);
  const r = rnd(trees.length*977+13), pick = n=>Array.from({length:Math.min(n,trees.length)}, ()=>trees[Math.floor(r()*trees.length)]);
  let h = pick(7).map(([x,y],i)=>emitHTML('leaf', x*MAP_T+MAP_T/2, y*MAP_T+12, 1, x*31+y*7+i)).join('');
  if(dusk) h += pick(9).map(([x,y],i)=>emitHTML('ffly', x*MAP_T+MAP_T/2+(r()-.5)*40, y*MAP_T+MAP_T*(.8+r()*.8), 2, x*53+y*11+i)).join('');
  return h;
}
// newly seen tiles in a fogged place: their lights, torches and embers come into view (tilemap.js updateSight)
function fxSeen(fresh){
  const pl = here(), c = fxCfg(pl); if(!c || !c.at || !fresh.length) return;
  const m = pl.grid(), L = document.getElementById('mlights'), Pa = document.getElementById('mparts'), dusk = fxDusk(c);
  fresh.forEach(k=>{ const x = k%m.W, y = (k-x)/m.W, f = c.at(x,y); if(!f) return;
    if(L) L.insertAdjacentHTML('beforeend', lightHTML(f,x,y,dusk)); if(Pa) Pa.insertAdjacentHTML('beforeend', tileEmitHTML(f,x,y)); });
}
// over the view (not the map): dust motes hanging in your light
function fxViewHTML(pl){
  const c = fxCfg(pl); if(!c || !c.dust) return '';
  const r = rnd(7); let b = '';
  for(let i=0;i<16;i++){ const t = 7+r()*7; b += `<b style="left:${(8+r()*84).toFixed(1)}%;top:${(10+r()*80).toFixed(1)}%;--t:${t.toFixed(1)}s;--d:${(-r()*t).toFixed(1)}s;--x:${Math.round((r()-.5)*40)}px;--y:${Math.round(-10-r()*30)}px"></b>`; }
  return `<div class="motes" aria-hidden="true">${b}</div>`;
}

// ---- Doors: the leaf swings in, the dark (or a warm room) behind it, then you're through ----
// For a door that's part of a building's art (the town): drawn over door tile [x,y]; `then` runs once it has swung.
let fxDoorBusy = false;
function swingDoor([x,y], then){
  const mp = document.getElementById('cmap');
  if(!mp || CALM()){ then(); return; }
  const d = document.createElement('div'); d.className = 'doorfx';
  d.style.cssText = `left:${x*MAP_T}px;top:${y*MAP_T}px;z-index:${y*2+1}`;
  d.innerHTML = '<i class="room"></i><i class="leaf"></i>';
  mp.appendChild(d); fxDoorBusy = true;
  setTimeout(()=>{ fxDoorBusy = false; then(); }, 260);
}
// a cave door or gate that has just opened swings (or rises) when its tile is next drawn
function fxOpening(M, id){ (M.anim = M.anim || {})[id] = Date.now() + 700; }
function fxOpeningNow(M, id){ return !!(M.anim && M.anim[id] > Date.now()); }

// ---- Arriving: a fade between places, and the place's name ----
const FX_PLACES = new Set(['dive','town','caveintro','cavedone','church','forge','inn','training','scriptorium','world','chapterend']);
const FX_BUILDINGS = ['church','forge','inn','training','scriptorium'];
function fadeBetween(from, to){ return FX_PLACES.has(from) && FX_PLACES.has(to) && (!!PLACES[from] || !!PLACES[to]); }
let fxLastPlace = null;
function placeTitle(s){
  if(s==='dive' && R && R.cave!=null) return {key:'cave'+R.cave, name:TEXT.caves[R.cave].name};
  if(s==='town') return {key:'town', name:TEXT.town.heading};
  if(FX_BUILDINGS.includes(s)) return {key:s, name:TEXT.town.buildings[s]};
  return null;
}
function sceneTitle(s){
  const t = placeTitle(s); if(!t) return;
  const was = fxLastPlace; fxLastPlace = t.key;
  if(was===t.key || (t.key==='town' && FX_BUILDINGS.includes(was))) return;   // back out of a shop into the square: you never left town
  const old = document.querySelector('#fxtop .sctitle'); if(old) old.remove();
  const d = document.createElement('div'); d.className = 'sctitle'; d.setAttribute('aria-hidden','true');
  d.innerHTML = `<span>${t.name}</span>`; fxTop().appendChild(d); setTimeout(()=>d.remove(), 2100);
}
