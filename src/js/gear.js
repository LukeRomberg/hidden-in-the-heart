/* Gear and the Armor of God (Ephesians 6:14-17): items, equip, and the armor Amos gives one town at a time. */
const ITEMS = {
  cap:{slot:'head', price:45, up:'helm'},
  helm:{slot:'head', verse:'Ephesians 6:17'},
  vest:{slot:'chest', price:35, up:'breast'},
  breast:{slot:'chest', verse:'Ephesians 6:14'},
  belt:{slot:'waist', price:25, up:'truth'},
  truth:{slot:'waist', verse:'Ephesians 6:14'},
  boots:{slot:'feet', up:'sabatons'},      // Bram's gift (BRAM_GIFT)
  sabatons:{slot:'feet', verse:'Ephesians 6:15'},
  lid:{slot:'shield', up:'faith'},        // from Amos in the prologue
  faith:{slot:'shield', verse:'Ephesians 6:16'},
  bible:{slot:'hand', up:'sword'},        // from Amos in the prologue
  sword:{slot:'hand', verse:'Ephesians 6:17'},
};
for(const id in ITEMS) Object.assign(ITEMS[id], TEXT.items[id]);   // name and perk text
const SLOTS = {head:'Head', chest:'Chest', waist:'Waist', feet:'Feet', shield:'Off hand', hand:'Hand'};
function has(id){ return R && Object.values(R.gear).includes(id); }
function equip(id){
  const it=ITEMS[id]; const old=R.gear[it.slot];
  if(old==='vest'||old==='breast'){ R.maxHp-=6; R.hp=Math.max(1,R.hp-6); }
  if(old==='helm'){ R.maxHp-=10; R.hp=Math.max(1,R.hp-10); }
  R.gear[it.slot]=id;
  if(id==='vest'||id==='breast'){ R.maxHp+=6; R.hp+=6; }
  if(id==='helm'){ R.maxHp+=10; R.hp+=10; }
}
// Plain gear is bought at the Forge (the lid and Bible come from Amos, the boots from Bram); it no
// longer drops after fights, so the Forge is worth saving for. Prices and the economy: docs/mvp.md.
const PLAIN_ORDER = ['belt','vest','boots','lid','cap','bible'];   // the Forge's lineup, in Ephesians' order
// The Armor of God (docs/combat-v2.md, section 6): one piece per town, never bought or forged. When a town's
// last held person is free and everyone is back in church, Amos consecrates that town's piece as you recite
// its verse (story.js, chapterEndHTML). Each piece cures the trouble that town made you suffer.
const ARMOR_OF = {philadelphia:'sabatons'};   // the rest come with their chapters: ephesus breast, sardis helm, smyrna faith, thyatira truth, pergamum sword
const ARMOR_CURES = {sabatons:['provoke','linger']};   // can't be provoked; heat and bitterness wear off after one round
// For combat.js: armorHas('sabatons') is true once the Shoes are on; armorCures('provoke') / armorCures('linger')
// asks whether anything you wear makes that trouble a non-issue.
function armorHas(id){ return !!(ITEMS[id] && ITEMS[id].verse && has(id)); }
function armorCures(trouble){ return Object.keys(ARMOR_CURES).some(id=>armorHas(id) && ARMOR_CURES[id].includes(trouble)); }
function owns(id){ const it=ITEMS[id]; return R.gear[it.slot]===id || (it.up && R.gear[it.slot]===it.up); }
function nextPlain(){ return PLAIN_ORDER.find(id=>!owns(id)) || null; }
function gearDrop(){ return null; }   // combat.js still asks after every fight; gear is the Forge's now
// The gear screen: the hero between two columns of slots (paper-doll), then what the tapped slot holds and
// what it becomes one day.
const DOLL = [['head','chest','waist'], ['hand','shield','feet']];
function gearSel(sl){ R.gearSel = sl; render(); }
function slotHTML(sl){ const id=R.gear[sl], it=id?ITEMS[id]:null, sel=(R.gearSel||'head')===sl;
  return `<button class="slot ${it?'':'empty'} ${it&&it.verse?'holy':''} ${sel?'sel':''}" onclick="gearSel('${sl}')" aria-label="${SLOTS[sl]}: ${it?it.name:'empty'}">
    ${it?`<img src="${IMG.gear[id]}" alt="">`:''}<span class="slbl">${SLOTS[sl]}</span></button>`; }
function slotInfo(sl){ const T=TEXT.gear, id=R.gear[sl], it=id?ITEMS[id]:null;
  if(!it){ const plain = PLAIN_ORDER.find(x=>ITEMS[x].slot===sl);
    return `<div class="slotinfo"><div class="sicon empty"></div><div><div class="sname">${fill(T.emptySlot,{slot:SLOTS[sl]})}</div>
      <div class="small">${fill(T.forgeSells,{name:ITEMS[plain].name, n:ITEMS[plain].price})}</div></div></div>`; }
  const here = Object.values(ARMOR_OF).includes(it.up);   // this town's piece: Amos gives it when everyone is home
  const next = it.verse ? `<div class="snext holy">${fill(T.consecratedWith,{ref:it.verse})}</div>`
    : `<div class="snext">${fill(here ? T.armorHere : T.armorSomeday, {up:ITEMS[it.up].name})}</div>`;
  return `<div class="slotinfo"><img class="sicon" src="${IMG.gear[id]}" alt=""><div><div class="sname ${it.verse?'t-Patience':''}">${it.name}</div>
    <div class="small">${it.perk}</div>${next}</div></div>`; }
function gearHTML(){
  const back = R.gearFrom||'town', sl = R.gearSel||'head';
  const doll = `<div class="panel doll"><div class="dcol">${DOLL[0].map(slotHTML).join('')}</div>
    <div class="dhero">${sprite('player',0,3)}</div><div class="dcol">${DOLL[1].map(slotHTML).join('')}</div></div>`;
  return `<h1>Gear</h1>${doll}<div class="panel">${slotInfo(sl)}</div>
    <div class="dock"><button class="wide" onclick="goto('${back}')">Back</button></div>`;
}
// Amos consecrates a town's piece at the chapter ending: it replaces the plain piece in its slot. Whatever the
// recital, it is given (the popup says so); `perfect` only changes what is said. Returns false if it's already yours.
function bestowArmor(id){
  if(has(id)) return false;
  const before = {...R.gear}; equip(id); saveHero(); reward({kind:'gear', id, before, how:'consecrated'}); return true;
}
function buy(id){ if(!ITEMS[id].price || owns(id) || R.talents<ITEMS[id].price) return; const before={...R.gear}; R.talents-=ITEMS[id].price; equip(id); saveHero(); reward({kind:'gear', id, before, how:'bought'}); render(); }
