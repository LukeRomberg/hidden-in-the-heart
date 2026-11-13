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
function forgeHTML(){
  const np = nextPlain(); const stock = np ? [np] : [];
  const T = TEXT.forge;
  return `<h1>${T.heading}</h1>${talk('forge', R.firstVisit==='forge' ? T.firstVisit : [T.line],'',false)}
    <h2>${T.forSale}</h2>${stock.length?stock.map(id=>`<button class="wide" ${R.talents<ITEMS[id].price?'disabled':''} onclick="buy('${id}')">${ITEMS[id].name} \u00b7 ${ITEMS[id].price} talents<br><span class="sub">${ITEMS[id].perk}</span></button>`).join(''):`<div class="small mute">${T.soldOut}</div>`}
    <h2 style="margin-top:12px">${T.consecrate}</h2>${consecrateList()}
    <button class="wide" onclick="R.gearFrom='forge';goto('gear')">${T.seeGear}</button>`;
}
function innHTML(){
  const T = TEXT.inn;
  return `<h1>${T.heading}</h1>${talk('inn', R.firstVisit==='inn' ? T.firstVisit : [T.line],'',false)}
    <button class="primary wide" ${R.hp>=R.maxHp?'disabled':''} onclick="R.hp=R.maxHp; saveHero(); toast(TEXT.inn.ate); render()">${R.hp>=R.maxHp?T.rested:T.eat}</button>
`;
}
function trainingHTML(){
  const yard = R.trainFrom!=='church', T = TEXT.training;
  const refs = [...new Set(R.deck.map(c=>c.ref))].sort((a,b)=>sp(b.ref||b).fails-sp(a.ref||a).fails || (sp(a).n*4+sp(a).tier)-(sp(b).n*4+sp(b).tier));
  return `<h1>${yard?T.yardHeading:T.pewsHeading}</h1>${yard?talk('yard', R.firstVisit==='training' ? T.firstVisit : [T.yardLine],'',false):talk('pews',[T.pewsLine],'',false)}
    <div class="panel small">${T.help}${yard?T.helpYard:''}</div>
    ${refs.map(ref=>{ const s=sp(ref); return `<button class="wide" onclick="drill('${ref}',${yard})"><span class="t-${BY_REF[ref].type}">${spellLine(ref)}</span> \u00b7 ${TIER_NAME[s.tier]}<div class="bar mn" style="margin-top:6px"><i style="width:${Math.round(100*s.perf/3)}%"></i></div><span class="sub">${s.tier===3&&s.n>=maxN(ref)?'complete':fill(s.tier<3?T.toLevelUp:T.toGrow,{n:s.perf})}${s.fails?fill(T.slips,{n:s.fails}):''}</span></button>`; }).join('')}
    <div class="dock"><button class="wide" onclick="goto(${yard?"'town'":"'church'"})">Back</button></div>`;
}
function drill(ref, yard){
  openRecall(BY_REF[ref], frac=>{
    const T = TEXT.training, before = sp(ref);
    recordResult(ref, frac); const now = sp(ref);
    if(frac===1){ if(yard) R.talents+=2; toast(yard?T.cleanYard:T.clean); }
    else if(now.tier<before.tier || now.n<before.n) toast(T.dropped);
    else toast(now.fails ? fill(T.shaky,{n:now.fails}) : T.close);
    saveHero(); render();
  }, undefined, yard?TEXT.training.drillTitle:TEXT.training.prayTitle);
}
function scriptoriumHTML(){
  const stock = VERSES.filter(v=>!R.deck.some(c=>c.ref===v.ref) && !v.ref.startsWith('Galatians'));
  const price = v=>10+5*v.cost;
  const T = TEXT.scriptorium;
  return `<h1>${T.heading}</h1>${talk('scriptorium', R.firstVisit==='scriptorium' ? T.firstVisit : [T.line],'',false)}
    ${stock.length?stock.map(v=>`<button class="wide" ${R.talents<price(v)?'disabled':''} onclick="learn('${v.ref}')"><span class="t-${v.type}">${v.ref}</span> \u00b7 ${price(v)} talents<br><span class="sub">${v.text}</span></button>`).join(''):`<div class="small mute">${T.soldOut}</div>`}
`;
}
function learn(ref){ const v=BY_REF[ref], c=10+5*v.cost; if(R.talents<c) return; R.talents-=c; addVerse(ref); saveHero(); toast(fill(TEXT.scriptorium.learned,{ref})); render(); }
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
