/* Philadelphia (Emberford until 2026-11): town map, church, and the buildings freed enemies reopen. */
const UNLOCKS = {furnace:['forge',TEXT.town.unlocked.furnace], grudge:['inn',TEXT.town.unlocked.grudge], brawler:['training',TEXT.town.unlocked.brawler], slanderer:['scriptorium',TEXT.town.unlocked.slanderer]};
function townUnlock(id){ const u=UNLOCKS[id]; if(u && !P.town[u[0]]){ P.town[u[0]]=true; R.unlockMsg=u[1]; save(); } }
const BUILD = {
  church:{name:TEXT.town.buildings.church, always:true},
  forge:{name:TEXT.town.buildings.forge},
  inn:{name:TEXT.town.buildings.inn},
  training:{name:TEXT.town.buildings.training},
  scriptorium:{name:TEXT.town.buildings.scriptorium},
};
// The town square: forge, church, inn on top; training yard, you (and the road out), scriptorium below.
// The church looks abandoned until the square is cleared the first time.
function townMap(){
  const tap = act => `role="button" tabindex="0" onclick="${act}" onkeydown="if(event.key==='Enter')${act}"`;
  const bld = id => { const usable = BUILD[id].always || P.town[id]; const lit = id==='church' ? !!P.town.church : usable;
    return `<div class="bld ${usable?'':'shut'}" ${tap(`enterBuilding('${id}')`)}><img src="${IMG.town[id][lit?1:0]}" alt="${BUILD[id].name}${usable?'':', boarded up'}"><span class="nm">${usable?BUILD[id].name:TEXT.town.boardedLabel}</span></div>`; };
  return `<div class="town">${bld('forge')}${bld('church')}${bld('inn')}${bld('training')}<div class="bld you" ${tap("goto('world')")}>${sprite('player',0,1)}<span class="nm">${TEXT.town.road}</span></div>${bld('scriptorium')}</div>`;
}
function enterBuilding(id){
  if(!(BUILD[id].always || P.town[id])){ toast(TEXT.town.boarded[id]); return; }
  // the first time you walk into a building you get its introduction (TEXT.<building>.firstVisit)
  R.firstVisit = (!P.met[id] && TEXT[id] && TEXT[id].firstVisit) ? id : null; P.met[id] = true; save();
  if(id==='training') R.trainFrom='yard';
  goto(id==='forge'?'forge':id);
}
function townHTML(){
  saveHero(); R.firstVisit = null;
  const open = ['forge','inn','training','scriptorium'].filter(k=>P.town[k]).length;
  return `<h1>${TEXT.town.heading}</h1><div class="panel scene">${townMap()}</div>
    <div class="small mute" style="margin-bottom:8px">${open===4?TEXT.town.allOpen: open===3?TEXT.town.stillBoardedOne: fill(TEXT.town.stillBoardedMany,{n:4-open})}</div>
    <div class="row">${['forge','inn','training','scriptorium'].map(k=>`<button ${P.town[k]?'':'disabled'} onclick="enterBuilding('${k}')">${BUILD[k].name}</button>`).join('')}<button onclick="goto('world')">Road</button></div>
    <div class="row" style="margin-top:8px"><button onclick="R.codexFrom='town';goto('codex')">Codex</button><button onclick="goto('title')">Title</button></div>`;
}
function churchHTML(){
  const done = allCavesDone(), T = TEXT.church;
  const caves = CAVES.map((c,i)=>{ const open = caveOpen(i), n = P.caves[c.id], C = TEXT.caves[i];
    return `<button class="${open&&!n?'primary ':''}wide" ${open?'':'disabled'} onclick="startCave(${i})">${open?C.name:'???'}${n?fill(T.caveCleared,{n}):''}<br><span class="sub">${open?C.blurb:T.caveLocked}</span></button>`; }).join('');
  return `<h1>${T.heading}</h1>${sceneHTML(IMG.scene.church,[AT_PRIEST('idle')])}${talk('church'+(done?1:0),[done?T.lineAfter:T.lineBefore],'',false)}
    <h2>${T.missions}</h2>${caves}
    <button class="wide" disabled>${done?T.nextOpen:T.nextLocked}</button>
    <button class="wide" onclick="R.tourFrom='church';TW={key:null};goto('tour')">${TEXT.tour.again}</button>
    <h2 style="margin-top:12px">${T.pews}</h2>
    <button class="wide" onclick="R.trainFrom='church';goto('training')">${T.pray}<br><span class="sub">${T.prayBlurb}</span></button>
    ${R.hp<R.maxHp?`<button class="wide" ${R.talents<5?'disabled':''} onclick="R.talents-=5; R.hp=R.maxHp; saveHero(); toast(TEXT.church.restDone); render()">${T.rest}</button>`:''}
`;
}
// ---- Shops: every building shows its whole stock, what each thing does, and its price ----
// Prices and payouts are tuned in docs/mvp.md (Economy): about one meaningful buy per cave.
const VERSE_PRICE = [5, 20, 35, 50];   // by the verse's focus cost: 0, 1, 2, 3
const DRILL_PAY = 2;                   // a clean drill at the yard, once per verse per trip out
function versePrice(v){ return VERSE_PRICE[Math.min(v.cost, VERSE_PRICE.length-1)]; }
// one line of stock: name and price on top, what it does, an optional detail, then its state or a buy button
function ware(o){
  return `<div class="ware ${o.state||''}"><div class="wtop"><span class="wname ${o.cls||''}">${o.name}</span>${o.price!=null?`<span class="wprice">${icon('coin',1.6)} ${o.price}</span>`:''}</div>
    <div class="wdo">${o.does}</div>${o.extra?`<div class="wx">${o.extra}</div>`:''}
    <div class="wfoot"><span class="wnote">${o.note||''}</span>${o.btn||''}</div></div>`;
}
const shortBy = n => fill(TEXT.forge.short, {n});
function forgeStock(){
  const T = TEXT.forge;
  return PLAIN_ORDER.map(id=>{ const it = ITEMS[id], mine = owns(id);
    const gift = !it.price, poor = !gift && R.talents<it.price;   // gifts are never for sale
    const note = mine ? (has(it.up) ? T.ownedUp : T.gifts[id] || T.owned) : gift ? T.notForSale : poor ? shortBy(it.price-R.talents) : '';
    return ware({name:it.name, price:it.price, does:it.perk, state:mine?'own':gift?'locked':poor?'short':'', note,
      btn: mine||gift||poor ? '' : `<button class="wbuy" onclick="buy('${id}')">${T.buy}</button>`}); }).join('');
}
function consecrateStock(){
  const T = TEXT.forge, na = nextArmor();
  return ARMOR_CHAIN.map((a,i)=>{ const up = ITEMS[a.up], from = ITEMS[a.from], done = has(a.up), next = na===a;
    let state = '', note = '', btn = '';
    if(done){ state = 'own'; note = T.consecrated; }
    else if(!next){ state = 'locked'; note = fill(T.after,{prev:ITEMS[ARMOR_CHAIN[i-1].up].name}); }
    else if(!owns(a.from)){ state = 'locked'; note = fill(T.needPlain,{from:from.name}); }
    else if(R.talents<a.price){ state = 'short'; note = shortBy(a.price-R.talents); }
    else btn = `<button class="wbuy" onclick="consecrate()">${T.reciteBtn}</button>`;
    return ware({name:up.name, cls:'t-Patience', price:a.price, does:up.perk, state, note, btn,
      extra:fill(T.recite,{from:from.name, ref:passRef('ARMOR',a.n)})}); }).join('');
}
function forgeHTML(){
  const T = TEXT.forge;
  return `<h1>${T.heading}</h1>${talk('forge', R.firstVisit==='forge' ? T.firstVisit : [T.line],'',false)}
    <h2>${T.forSale}</h2><div class="panel shop">${forgeStock()}</div>
    <h2>${T.consecrate}</h2><div class="panel shop"><div class="small mute shopnote">${T.consecrateNote}</div>${consecrateStock()}</div>
    <div class="dock row"><button onclick="R.gearFrom='forge';goto('gear')">${T.seeGear}</button><button onclick="goto('town')">Back</button></div>`;
}
// Wendell's ledger: the cheapest thing on each open shelf you can't afford yet
function savingFor(){
  const out = [], add = (shop, name, price)=>{ if(price>R.talents) out.push({shop, name, price}); };
  const cheapest = list => list.sort((a,b)=>a.price-b.price)[0];
  if(P.town.forge){
    const f = cheapest(PLAIN_ORDER.filter(id=>!owns(id) && ITEMS[id].price>R.talents).map(id=>({name:ITEMS[id].name, price:ITEMS[id].price})));
    if(f) add(TEXT.town.buildings.forge, f.name, f.price);
    const a = nextArmor(); if(a && owns(a.from)) add(TEXT.town.buildings.forge, ITEMS[a.up].name, a.price);
  }
  if(P.town.scriptorium){
    const v = cheapest(VERSES.filter(v=>!v.ref.startsWith('Galatians') && !R.deck.some(c=>c.ref===v.ref) && versePrice(v)>R.talents).map(v=>({name:v.ref, price:versePrice(v)})));
    if(v) add(TEXT.town.buildings.scriptorium, v.name, v.price);
  }
  return out.sort((a,b)=>a.price-b.price).slice(0,3);
}
function innHTML(){
  const T = TEXT.inn, next = CAVES.find(c=>!P.caves[c.id]), want = savingFor();
  return `<h1>${T.heading}</h1>${talk('inn', R.firstVisit==='inn' ? T.firstVisit : [T.line],'',false)}
    <h2>${T.rumorHeading}</h2><div class="panel"><p class="tline">${T.rumors[next ? next.id : 'done']}</p></div>
    <h2>${T.ledgerHeading}</h2><div class="panel shop"><div class="small mute shopnote">${T.ledgerIntro}</div>
      ${want.length ? want.map(w=>`<div class="stat small"><span>${fill(T.ledgerLine,{name:w.name, shop:w.shop})}</span><span>${fill(T.ledgerShort,{n:w.price-R.talents})}</span></div>`).join('') : `<div class="small">${T.ledgerAll}</div>`}</div>
    <div class="dock row"><button class="primary" ${R.hp>=R.maxHp?'disabled':''} onclick="R.hp=R.maxHp; saveHero(); toast(TEXT.inn.ate); render()">${R.hp>=R.maxHp?T.rested:T.eat}</button><button onclick="goto('town')">Back</button></div>`;
}
// the yard pays for a clean drill once per verse until your next cave is cleared (no grinding one verse for cash)
function trips(){ return Object.values(P.caves||{}).reduce((a,b)=>a+b, 0); }
function drillPaid(ref){ const d = P.drills; return !!(d && d.trip===trips() && d.refs.includes(ref)); }
function payDrill(ref){ if(!P.drills || P.drills.trip!==trips()) P.drills = {trip:trips(), refs:[]}; P.drills.refs.push(ref); R.talents += DRILL_PAY; }
function trainingHTML(){
  const yard = R.trainFrom!=='church', T = TEXT.training;
  const refs = [...new Set(R.deck.map(c=>c.ref))].sort((a,b)=>sp(b.ref||b).fails-sp(a.ref||a).fails || (sp(a).n*4+sp(a).tier)-(sp(b).n*4+sp(b).tier));
  const unpaid = refs.filter(r=>!drillPaid(r)).length;
  return `<h1>${yard?T.yardHeading:T.pewsHeading}</h1>${yard?talk('yard', R.firstVisit==='training' ? T.firstVisit : [T.yardLine],'',false):talk('pews',[T.pewsLine],'',false)}
    <div class="panel small">${T.help}${yard?fill(T.helpYard,{n:DRILL_PAY}):''}</div>
    ${yard?`<div class="small mute shoppay">${fill(T.payLeft,{n:unpaid*DRILL_PAY, k:unpaid})}</div>`:''}
    ${refs.map(ref=>{ const s=sp(ref); return `<button class="wide" onclick="drill('${ref}',${yard})"><span class="t-${BY_REF[ref].type}">${spellLine(ref)}</span> · ${TIER_NAME[s.tier]}<div class="bar mn" style="margin-top:6px"><i style="width:${Math.round(100*s.perf/3)}%"></i></div><span class="sub">${s.tier===3&&s.n>=maxN(ref)?'complete':fill(s.tier<3?T.toLevelUp:T.toGrow,{n:s.perf})}${s.fails?fill(T.slips,{n:s.fails}):''}${yard?' · '+(drillPaid(ref)?T.paid:fill(T.pays,{n:DRILL_PAY})):''}</span></button>`; }).join('')}
    <div class="dock"><button class="wide" onclick="goto(${yard?"'town'":"'church'"})">Back</button></div>`;
}
function drill(ref, yard){
  openRecall(BY_REF[ref], frac=>{
    const T = TEXT.training, before = sp(ref);
    recordResult(ref, frac); const now = sp(ref);
    if(frac===1){ if(yard && !drillPaid(ref)){ payDrill(ref); toast(fill(T.cleanYard,{n:DRILL_PAY})); } else toast(yard?T.cleanUnpaid:T.clean); }
    else if(now.tier<before.tier || now.n<before.n) toast(T.dropped);
    else toast(now.fails ? fill(T.shaky,{n:now.fails}) : T.close);
    saveHero(); render();
  }, undefined, yard?TEXT.training.drillTitle:TEXT.training.prayTitle);
}
function verseDoes(v){
  const T = TEXT.scriptorium, k = v.dmg?'dmg':v.shield?'shield':v.focus?'focus':'heal';
  return `${fill(T.cost,{type:v.type, n:v.cost})} · ${fill(T.effect[k],{n:v[k]})}${T.vsWrath[v.type]?'. '+T.vsWrath[v.type]:'.'}`;
}
function scriptoriumHTML(){
  const T = TEXT.scriptorium, shelf = VERSES.filter(v=>!v.ref.startsWith('Galatians'));
  const mine = v=>R.deck.some(c=>c.ref===v.ref), stock = shelf.filter(v=>!mine(v)).sort((a,b)=>versePrice(a)-versePrice(b));
  return `<h1>${T.heading}</h1>${talk('scriptorium', R.firstVisit==='scriptorium' ? T.firstVisit : [T.line],'',false)}
    <h2>${T.shelf}</h2><div class="panel shop"><div class="small mute shopnote">${T.priceNote}</div>
    ${stock.length ? stock.map(v=>{ const p = versePrice(v), poor = R.talents<p;
      return ware({name:v.ref, cls:'ref t-'+v.type, price:p, does:verseDoes(v), extra:v.text, state:poor?'short':'', note:poor?shortBy(p-R.talents):'',
        btn: poor ? '' : `<button class="wbuy" onclick="learn('${v.ref}')">${T.buy}</button>`}); }).join('') : `<div class="small mute">${T.soldOut}</div>`}
    <div class="small mute shopnote">${fill(T.owned,{refs:shelf.filter(mine).map(v=>v.ref).join(', ')})}</div></div>
    <div class="dock"><button class="wide" onclick="goto('town')">Back</button></div>`;
}
function learn(ref){ const v=BY_REF[ref], c=versePrice(v); if(R.talents<c || R.deck.some(d=>d.ref===ref)) return; R.talents-=c; addVerse(ref); saveHero(); toast(fill(TEXT.scriptorium.learned,{ref})); render(); }
function worldHTML(){
  const cleared = allCavesDone();
  const N = TEXT.world.towns, towns = [[30,70,N.philadelphia,'Wrath',true],[78,52,N.ephesus,'???',false],[112,30,N.sardis,'???',false],[54,22,N.smyrna,'???',false]];
  let s = `<rect width="140" height="100" fill="#3e5a3a"/>`;
  for(let i=0;i<60;i++){ const x=(i*37)%140, y=(i*53)%100; s+=`<rect x="${x}" y="${y}" width="3" height="3" fill="#355030"/>`; }
  s += `<rect x="96" y="60" width="44" height="40" fill="#2f4a6a"/><rect x="0" y="0" width="34" height="18" fill="#5a5a5a"/>`;
  [[0,1],[1,2],[1,3]].forEach(([a,b])=>{ const A=towns[a],B=towns[b]; s+=`<line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" stroke="${cleared||a>0?'#c8a870':'#6e5a40'}" stroke-width="2" stroke-dasharray="${a===0&&cleared?'':'3 2'}"/>`; });
  towns.forEach(([x,y,n,v,here])=>{ s+=`<rect x="${x-5}" y="${y-5}" width="10" height="10" fill="${here?'#f2c45a':'#4a4038'}" stroke="#1b1410"/><text x="${x}" y="${y+11}" font-size="3.4" font-family="'Pixelify Sans',sans-serif" fill="#e8dcc0" text-anchor="middle">${here?n:'???'}</text>`; });
  s += `<g>${heroRects('front',0,22,46,0.2)}</g>`;
  const T = TEXT.world;
  return `<h1>${T.heading}</h1><div class="panel" style="padding:0;overflow:hidden"><svg viewBox="0 0 140 100" width="100%" shape-rendering="crispEdges" role="img" aria-label="World map">${s}</svg></div>
    <div class="panel small">${cleared?T.open:T.blocked}</div>
    <div class="dock"><button class="primary wide" onclick="goto('town')">${T.back}</button></div>`;
}
