/* Sprite rendering: layered hero, enemy/freed images, pixel grids, backdrops. */
const HERO = __DATA__('hero.json');
const GEAR_ORDER = ['vest','breast','belt','truth','boots','sabatons','cap','helm','bible','sword','lid','faith'];   // the lid after the Bible: its arm pose put a hand through the lid
// hats hide the hair beside them: in each row the hat fills (MASK_MIN+ pixels), base pixels outside its outline go
const HAT = new Set(['cap']), MASK_MIN = 10;
const SOLID = new Set(['lid','faith']);   // nothing but the shield in these layers: every pixel wins, so the hand holds it from behind
const WEAK = new Set(HERO.weak);
const heroCache = {};
function heroGrid(view, frame, freed){
  const items = freed ? [] : (R ? Object.values(R.gear||{}).filter(Boolean) : []);
  const key = view+frame+(freed?'F':'')+items.join(',');
  if(heroCache[key]) return heroCache[key];
  const layers = freed ? [HERO.freed[frame]] : [HERO.base[view][frame], ...GEAR_ORDER.filter(i=>items.includes(i)).map(i=>HERO.items[i][view][frame])];
  const g = HERO.base.front[0].map(r=>Array.from(r).fill('.')); const own = g.map(r=>r.map(()=>false));
  const names = freed ? [] : [null, ...GEAR_ORDER.filter(i=>items.includes(i))];
  layers.forEach((L,li)=>L.forEach((row,y)=>{ const cs=Array.from(row); const solid = SOLID.has(names[li]); cs.forEach((c,x)=>{
    if(c==='.') return;
    if(li>0 && own[y][x] && !solid && (c===',' || WEAK.has(c))) return;   // a gear piece's real pixels beat a later piece's stray hoodie pixels
    g[y][x] = c===',' ? '.' : c; if(li>0) own[y][x]=true; }); }));
  if(!freed) items.filter(i=>HAT.has(i)).forEach(i=>HERO.items[i][view][frame].forEach((row,y)=>{
    const xs = Array.from(row).map((c,x)=>c!=='.'&&c!==','?x:-1).filter(x=>x>=0); if(xs.length<MASK_MIN) return;
    const lo = Math.min(...xs), hi = Math.max(...xs);
    g[y].forEach((c,x)=>{ if((x<lo||x>hi) && !own[y][x]) g[y][x]='.'; }); }));
  return heroCache[key]=g;
}
const ALPHA = __DATA__('hero-alpha.json');
// The hero side-on (tools/build_hero_side.py): a 7-frame strip (stand, then the walk) with each piece of gear as
// its own layer. Returned as CSS background layers, top first; the map flips them for west (tilemap.js heroSprite).
const HERO_SIDE = __DATA__('hero-side.json');
function heroSideBG(){
  const worn = R ? Object.values(R.gear||{}).filter(Boolean) : [];
  const on = GEAR_ORDER.filter(i=>worn.includes(i) && HERO_SIDE.items[i]), L = i=>HERO_SIDE.items[i];
  const layers = [...on.filter(i=>L(i).over).reverse().map(i=>L(i).over), on.includes('cap') ? HERO_SIDE.capped : HERO_SIDE.base,
    ...on.filter(i=>L(i).under).map(i=>L(i).under)];
  return layers.map(u=>`url(${u})`).join(',');
}
function heroRects(view, frame, ox, oy, s, freed){
  const g = heroGrid(view, frame, freed); let r='';
  g.forEach((row,y)=>{ let x=0; while(x<row.length){ const c=row[x]; if(c==='.'){x++;continue;} let x2=x; while(x2<row.length&&row[x2]===c) x2++;
    r+=`<rect x="${ox+x*s}" y="${oy+y*s}" width="${(x2-x)*s}" height="${s}" fill="${HERO.pal[ALPHA.indexOf(c)]}"/>`; x=x2; } });
  return r;
}
const ENEMY_IMG = __DATA__('enemies.json');
function enemyK(scale){ return scale*0.28; }
const FREED_IMG = __DATA__('freed.json');
// Philadelphia's townsfolk (tools/build_townsfolk.py): one look each, used held (tinted) and freed in fights,
// hurt in the caves, and on their feet once helped. A look not generated yet falls back to the old
// placeholder of the same name, or of the same sex.
const FOLK = __DATA__('townsfolk.json').folk;
function folkSpr(p){   // a sprite() name for a person in TEXT ({name, look, pronoun})
  if(FOLK[p.look]) return 'folk_'+p.look;
  const keys = Object.keys(FREED_IMG), same = keys.find(k=>FREED_IMG[k].name===p.name);
  return same || keys[p.pronoun==='she' ? 3 : 0];
}
function folkSrc(p, state){   // state: idle, hurt or badly
  const f = FOLK[p.look]; if(f) return state==='idle' ? f.f[0] : f[state];
  return FREED_IMG[folkSpr(p)].f[0];
}
function spriteImg(name){ return name.startsWith('folk_') ? FOLK[name.slice(5)] : FREED_IMG[name]; }
let lastFreed=-1;
// a villager for a fight: someone still away from home if there is anyone (townmap.js townHome), never the last one twice
function pickFreed(){ const n = TEXT.villagers.length, away = [...Array(n).keys()].filter(i=>i!==lastFreed && !(P.home||[]).includes(TEXT.villagers[i].look));
  let k; if(away.length) k = away[Math.floor(Math.random()*away.length)]; else do{ k=Math.floor(Math.random()*n); }while(k===lastFreed);
  lastFreed=k; return k; }
function sprite(name, frame, scale, cls){
  const F = spriteImg(name);
  if(F){ return `<img class="sprite ${cls||''}" src="${F.f[frame]}" width="${Math.round(64*scale)}" height="${Math.round(64*scale)}" alt="" style="image-rendering:pixelated">`; }
  if(ENEMY_IMG[name]){ const E=ENEMY_IMG[name], k=enemyK(scale); return `<img class="sprite ${cls||''}" src="${E.f[frame]}" width="${Math.round(E.w*k)}" height="${Math.round(E.h*k)}" alt="" style="image-rendering:pixelated">`; }
  if(name==='player'||name==='back'||name==='freed'){
    const view = name==='back'?'back':'front';
    return `<svg class="sprite ${cls||''}" viewBox="0 0 ${HERO.W} ${HERO.H}" width="${HERO.W*scale}" height="${HERO.H*scale}" shape-rendering="crispEdges" aria-hidden="true">${heroRects(view,frame,0,0,1,name==='freed')}</svg>`;
  }
  const rows = SPR[name][frame]; const w = rows[0].length, h = rows.length;
  let r = '';
  rows.forEach((row,y)=>{ for(let x=0;x<w;x++){ const c=row[x]; if(c!=='.') r += `<rect x="${x}" y="${y}" width="1" height="1" fill="var(${PAL[c]})"/>`; } });
  return `<svg class="sprite ${cls||''}" viewBox="0 0 ${w} ${h}" width="${w*scale}" height="${h*scale}" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
}
function pxg(rows,x,y,s){ let r=''; rows.forEach((row,yy)=>{ for(let xx=0;xx<row.length;xx++){ const c=row[xx]; if(c!=='.') r+=`<rect x="${x+xx*s}" y="${y+yy*s}" width="${s}" height="${s}" fill="var(${PAL[c]})"/>`; } }); return r; }
function stoneBG(W,H){ let r=`<rect width="${W}" height="${H}" fill="var(--stone)"/>`; for(let y=0;y<H;y+=6) for(let x=0;x<W;x+=6){ const v=(x*7+y*13+x*y)%11; if(v<2) r+=`<rect x="${x}" y="${y}" width="6" height="6" fill="var(--stone2)"/>`; else if(v===5) r+=`<rect x="${x+1}" y="${y+1}" width="4" height="4" fill="var(--stone3)"/>`; } return r; }
// Battle backdrop, matched to the place: the cave you're in (its boss too), the square at night for the Furnace,
// the square by day for any other fight in town.
function arenaBG(){   // (R.enemies decides: the Furnace burns in the square)
  const furnace = R && R.enemies && R.enemies.some(e=>e.id==='furnace');
  const cave = R && R.cave!=null && !furnace && CAVES[R.cave] && IMG.battle[CAVES[R.cave].id];
  return `<img class="abg" src="${cave || (furnace ? IMG.battle.square : IMG.battle.day)}" alt="">`;
}
// A framed 320-wide scene with sprites placed in the scene's own pixel coordinates,
// so they scale with it: layers = [{src|html, x, y, w}].
function sceneHTML(src, layers=[], H=160){
  const W=320, pct=(v,of)=>`${(v/of*100).toFixed(3)}%`;
  return `<div class="panel scene"><div class="scn"><img src="${src}" width="${W}" height="${H}" alt="">${layers.map(l=>`<div class="lay" style="left:${pct(l.x,W)};top:${pct(l.y,H)};width:${pct(l.w,W)}">${l.src?`<img src="${l.src}" alt="">`:l.html}</div>`).join('')}</div></div>`;
}
function pxgIcon(){ return `<svg class="ico" viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">${pxg(LOCK,0,0,1)}</svg>`; }
function icon(n, s=2){ if(IMG.icon[n]){ const px=10*s<24?16:32; return `<img class="ico" src="${IMG.icon[n]}" width="${px}" height="${px}" alt="">`; } const rows=ICONS[n]; return `<svg class="ico" viewBox="0 0 10 10" width="${10*s}" height="${10*s}" shape-rendering="crispEdges" aria-hidden="true">${pxg(rows,0,0,1)}</svg>`; }
