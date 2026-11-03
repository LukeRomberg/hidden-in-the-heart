/* Emberford: town map, church, and the buildings freed enemies reopen. */
const UNLOCKS = {hothead:['forge','The blacksmith goes home. His forge will be lit when you get back to town.'], grudge:['inn','The innkeeper goes home to unbar his doors.'], brawler:['training','The old drill master heads for the training yard.'], slanderer:['scriptorium','The scribe hurries back to the scriptorium to fix what he wrote.']};
function townUnlock(id){ const u=UNLOCKS[id]; if(u && !P.town[u[0]]){ P.town[u[0]]=true; R.unlockMsg=u[1]; save(); } }
const BUILD = {
  church:{name:'Church', x:52, w:36, roof:'#5a4a6a', wall:'#8a7a6a', always:true},
  forge:{name:'Forge', x:6, w:30, roof:'#4a3a30', wall:'#7a6050'},
  inn:{name:'Inn', x:104, w:30, roof:'#6a3a2a', wall:'#9a7a5a'},
  training:{name:'Training Yard', x:14, w:30, roof:'#3a4a30', wall:'#7a7a5a', row:2},
  scriptorium:{name:'Scriptorium', x:96, w:30, roof:'#3a3a5a', wall:'#8a8aa0', row:2},
};
function townSVG(){
  let s = `<rect width="140" height="100" fill="#4a3448"/><rect width="140" height="22" fill="#6a4458"/><rect y="22" width="140" height="8" fill="#5a3c50"/>`;
  s += `<rect x="0" y="60" width="140" height="40" fill="#3a2e28"/>`;
  for(let x=0;x<140;x+=8) for(let y=62;y<100;y+=6) if((x+y)%3===0) s+=`<rect x="${x}" y="${y}" width="5" height="2" fill="#463830"/>`;
  s += `<rect x="62" y="84" width="16" height="16" fill="#2b2320"/><rect x="66" y="96" width="8" height="4" fill="#4a3a2c"/>`;
  Object.entries(BUILD).forEach(([id,b])=>{
    const open = b.always || P.town[id]; const y = b.row===2 ? 66 : 30; const hgt = id==='church'?34:24;
    const by = id==='church' ? 18 : y; const click = `class="roomclick" role="button" tabindex="0" onclick="enterBuilding('${id}')" onkeydown="if(event.key==='Enter')enterBuilding('${id}')"`;
    s += `<g ${click}><rect x="${b.x}" y="${by}" width="${b.w}" height="${hgt}" fill="${b.wall}" opacity="${open?1:.55}"/>`;
    s += `<polygon points="${b.x-3},${by} ${b.x+b.w/2},${by-10} ${b.x+b.w+3},${by}" fill="${b.roof}" opacity="${open?1:.55}"/>`;
    if(id==='church') s += `<rect x="${b.x+b.w/2-1}" y="${by-18}" width="2" height="8" fill="#f2d25a"/><rect x="${b.x+b.w/2-4}" y="${by-15}" width="8" height="2" fill="#f2d25a"/>`;
    const win = open ? '#f2c45a' : '#1a1210';
    s += `<rect x="${b.x+4}" y="${by+5}" width="6" height="6" fill="${win}"/><rect x="${b.x+b.w-10}" y="${by+5}" width="6" height="6" fill="${win}"/>`;
    s += `<rect x="${b.x+b.w/2-3}" y="${by+hgt-10}" width="6" height="10" fill="${open?'#3a2618':'#1a1210'}"/>`;
    if(!open) s += `<rect x="${b.x+2}" y="${by+hgt/2-1}" width="${b.w-4}" height="2" fill="#5a4030"/><rect x="${b.x+2}" y="${by+hgt/2+4}" width="${b.w-4}" height="2" fill="#5a4030"/>`;
    if(id==='forge' && open) s += `<rect x="${b.x+b.w-7}" y="${by-12}" width="4" height="8" fill="#4a3a30"/><rect x="${b.x+b.w-7}" y="${by-16}" width="4" height="3" fill="#e8903a" class="fa"/>`;
    s += `<text x="${b.x+b.w/2}" y="${by+hgt+5}" font-size="3.2" font-family="'Pixelify Sans',sans-serif" fill="#e8dcc0" text-anchor="middle">${open?b.name:'Boarded'}</text></g>`;
  });
  s += `<g class="roomclick" role="button" tabindex="0" onclick="goto('world')" onkeydown="if(event.key==='Enter')goto('world')"><rect x="58" y="84" width="24" height="3" fill="#6e4a2a"/><text x="70" y="93" font-size="3.2" font-family="'Pixelify Sans',sans-serif" fill="#e8dcc0" text-anchor="middle">Road</text></g>`;
  s += `<g>${heroRects('front',0,44,60,0.36)}</g>`;
  return `<svg viewBox="0 0 140 100" width="100%" shape-rendering="crispEdges" role="img" aria-label="Emberford">${s}</svg>`;
}
function enterBuilding(id){
  if(!(BUILD[id].always || P.town[id])){ toast({forge:'Boarded up. Someone in the square used to work here.', inn:'Boarded up. The innkeeper has not been seen in weeks.', training:'Boarded up. Whoever ran this yard left angry.', scriptorium:'Boarded up. A sign in the window has been scratched out.'}[id]); return; }
  goto(id==='forge'?'forge':id);
}
function townHTML(){
  saveHero();
  const open = ['forge','inn','training','scriptorium'].filter(k=>P.town[k]).length;
  return `<h1>Emberford</h1><div class="panel" style="padding:0;overflow:hidden">${townSVG()}</div>${statusHTML()}
    <div class="small mute" style="margin-bottom:8px">${open<4?`${4-open} building${4-open>1?'s are':' is'} still boarded up. The people who ran them are still out in the square.`:'Every door in town is open.'}</div>
    <div class="row">${['forge','inn','training','scriptorium'].map(k=>`<button ${P.town[k]?'':'disabled'} onclick="enterBuilding('${k}')">${BUILD[k].name}</button>`).join('')}<button onclick="goto('world')">Road</button></div>
    <div class="row" style="margin-top:8px"><button onclick="R.codexFrom='town';goto('codex')">Codex</button><button onclick="goto('title')">Title</button></div>`;
}
function churchHTML(){
  const cleared = P.missions.wrath;
  const line = !cleared ? '\u201cThe anger is worst in the square. Start there. Free who you can.\u201d'
    : '\u201cThe bell rang last night. People are coming back.\u201d He nods at the road. \u201cOther towns are worse off than we were.\u201d';
  return `<h1>The Church</h1>${talk('church'+(cleared?1:0),[['Priest',line]],'',false)}
    <h2>Missions</h2>
    <button class="primary wide" onclick="startMission()">Anger in the Square${cleared?' \u00b7 cleared '+cleared+'\u00d7':''}<br><span style="font-family:'Pixelify Sans',sans-serif;font-size:20px">Mission 1. Free the people of Emberford from wrath.</span></button>
    <button class="wide" disabled>${cleared?'The Road to Ashby \u00b7 coming soon':'??? \u00b7 clear the square first'}</button>
    <h2 style="margin-top:12px">The pews</h2>
    <button class="wide" onclick="R.trainFrom='church';goto('training')">Pray over your verses<br><span style="font-family:'Pixelify Sans',sans-serif;font-size:20px">Level your spells in quiet. The training yard pays 2 talents a drill.</span></button>
    ${R.hp<R.maxHp?`<button class="wide" ${R.talents<5?'disabled':''} onclick="R.talents-=5; R.hp=R.maxHp; saveHero(); toast('The priest binds your wounds.'); render()">Rest on a pew \u00b7 5 talents, heal fully</button>`:''}
`;
}
function startMission(){
  if(R.hp < R.maxHp*0.3){ toast('You can barely stand. Rest first.'); return; }
  Object.assign(R, {step:0, frags:[], node:null, enemies:[], helmUsed:false, boss:null});
  goto('mstory');
}
function forgeHTML(){
  const np = nextPlain(); const stock = np ? [np] : [];
  return `<h1>The Forge</h1>${talk('forge',[['Blacksmith','\u201cYou gave me my hands back. Bring me plain things and the right words, and I\u2019ll make them holy.\u201d']],'',false)}
    <h2>For sale</h2>${stock.length?stock.map(id=>`<button class="wide" ${R.talents<ITEMS[id].price?'disabled':''} onclick="buy('${id}')">${ITEMS[id].name} \u00b7 ${ITEMS[id].price} talents<br><span style="font-family:'Pixelify Sans',sans-serif;font-size:20px">${ITEMS[id].perk}</span></button>`).join(''):'<div class="small mute">He has made you everything plain he can. The rest is up to the words.</div>'}
    <h2 style="margin-top:12px">Consecrate</h2>${consecrateList()}
    <button class="wide" onclick="R.gearFrom='forge';goto('gear')">See your gear</button>`;
}
function innHTML(){
  return `<h1>The Inn</h1>${talk('inn',[['Innkeeper','\u201cStew\u2019s on the house. Every time. I stopped keeping that kind of ledger.\u201d']],'',false)}
    <button class="primary wide" ${R.hp>=R.maxHp?'disabled':''} onclick="R.hp=R.maxHp; saveHero(); toast('Fed, warm, and healed.'); render()">${R.hp>=R.maxHp?'You are already rested':'Eat and sleep \u00b7 heal fully, free'}</button>
`;
}
function trainingHTML(){
  const yard = R.trainFrom!=='church';
  const refs = [...new Set(R.deck.map(c=>c.ref))].sort((a,b)=>sp(b.ref||b).fails-sp(a.ref||a).fails || (sp(a).n*4+sp(a).tier)-(sp(b).n*4+sp(b).tier));
  return `<h1>${yard?'The Training Yard':'The Pews'}</h1>${yard?talk('yard',[['Drill master','\u201cAgain. Until you can say it in your sleep. Which, I hear, is a problem for you.\u201d']],'',false):talk('pews',[[null,'Quiet. Candles. Nobody watching.']],'',false)}
    <div class="panel small">Three clean recitals level a spell up; three slips in a row knock it back down. A spell known fully by heart grows by adding the next verse. ${yard?'A clean drill here also earns 2 talents.':''}</div>
    ${refs.map(ref=>{ const s=sp(ref); return `<button class="wide" onclick="drill('${ref}',${yard})"><span class="t-${BY_REF[ref].type}">${spellLine(ref)}</span> \u00b7 ${TIER_NAME[s.tier]}<div class="bar mn" style="margin-top:6px"><i style="width:${Math.round(100*s.perf/3)}%"></i></div><span style="font-family:'Pixelify Sans',sans-serif;font-size:18px">${s.tier===3&&s.n>=maxN(ref)?'complete':`${s.perf}/3 perfect to ${s.tier<3?'level up':'add the next verse'}`}${s.fails?` \u00b7 ${s.fails}/3 slips`:''}</span></button>`; }).join('')}
    <button class="wide" onclick="goto(${yard?"'town'":"'church'"})">Back</button>`;
}
function drill(ref, yard){
  openRecall(BY_REF[ref], frac=>{
    recordResult(ref, frac);
    if(frac===1){ if(yard) R.talents+=2; toast(yard?'Clean. +2 talents.':'Clean.'); }
    else toast(sp(ref).fails?`Close. ${sp(ref).fails}/3 slips.`:'Close. It slipped a level.');
    saveHero(); render();
  }, undefined, yard?'Drill':'Pray');
}
function scriptoriumHTML(){
  const stock = VERSES.filter(v=>!R.deck.some(c=>c.ref===v.ref) && !v.ref.startsWith('Galatians'));
  const price = v=>10+5*v.cost;
  return `<h1>The Scriptorium</h1>${talk('scriptorium',[['Scribe','\u201cTrue words, this time. They cost something to copy.\u201d']],'',false)}
    ${stock.length?stock.map(v=>`<button class="wide" ${R.talents<price(v)?'disabled':''} onclick="learn('${v.ref}')"><span class="t-${v.type}">${v.ref}</span> \u00b7 ${price(v)} talents<br><span style="font-family:'Pixelify Sans',sans-serif;font-size:20px">${v.text}</span></button>`).join(''):'<div class="small mute">You have every verse he has copied so far.</div>'}
`;
}
function learn(ref){ const v=BY_REF[ref], c=10+5*v.cost; if(R.talents<c) return; R.talents-=c; addVerse(ref); saveHero(); toast(ref+' is yours.'); render(); }
function worldHTML(){
  const cleared = P.missions.wrath;
  const towns = [[30,70,'Emberford','Wrath',true],[78,52,'Ashby','???',false],[112,30,'Fennmarsh','???',false],[54,22,'Greyhollow','???',false]];
  let s = `<rect width="140" height="100" fill="#3e5a3a"/>`;
  for(let i=0;i<60;i++){ const x=(i*37)%140, y=(i*53)%100; s+=`<rect x="${x}" y="${y}" width="3" height="3" fill="#355030"/>`; }
  s += `<rect x="96" y="60" width="44" height="40" fill="#2f4a6a"/><rect x="0" y="0" width="34" height="18" fill="#5a5a5a"/>`;
  [[0,1],[1,2],[1,3]].forEach(([a,b])=>{ const A=towns[a],B=towns[b]; s+=`<line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" stroke="${cleared||a>0?'#c8a870':'#6e5a40'}" stroke-width="2" stroke-dasharray="${a===0&&cleared?'':'3 2'}"/>`; });
  towns.forEach(([x,y,n,v,here])=>{ s+=`<rect x="${x-5}" y="${y-5}" width="10" height="10" fill="${here?'#f2c45a':'#4a4038'}" stroke="#1b1410"/><text x="${x}" y="${y+11}" font-size="3.4" font-family="'Pixelify Sans',sans-serif" fill="#e8dcc0" text-anchor="middle">${here?n:'???'}</text>`; });
  s += `<g>${heroRects('front',0,22,46,0.2)}</g>`;
  return `<h1>The Road</h1><div class="panel" style="padding:0;overflow:hidden"><svg viewBox="0 0 140 100" width="100%" shape-rendering="crispEdges" role="img" aria-label="World map">${s}</svg></div>
    <div class="panel small">${cleared?'The road east to Ashby is open. Nobody in Emberford will say what is wrong there. The next town is still being built.':'The road out of town is blocked by the anger in the square. Clear it first.'}</div>
    <button class="primary wide" onclick="goto('town')">Back to Emberford</button>`;
}
