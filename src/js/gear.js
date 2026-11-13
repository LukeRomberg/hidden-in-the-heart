/* Gear and the Armor of God (Ephesians 6:14-17): items, equip, consecration. */
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
// The armor follows Ephesians 6:14-17, so each consecration recites the passage one verse further,
// in this order whatever order the plain pieces were bought in.
const PLAIN_ORDER = ['belt','vest','boots','lid','cap','bible'];   // the Forge's lineup, in armor order
const ARMOR_CHAIN = [{up:'truth',from:'belt',n:1,price:10},{up:'breast',from:'vest',n:1,price:15},{up:'sabatons',from:'boots',n:2,price:25},
  {up:'faith',from:'lid',n:3,price:35},{up:'helm',from:'cap',n:4,price:45},{up:'sword',from:'bible',n:4,price:60}];
function owns(id){ const it=ITEMS[id]; return R.gear[it.slot]===id || (it.up && R.gear[it.slot]===it.up); }
function nextPlain(){ return PLAIN_ORDER.find(id=>!owns(id)) || null; }
function nextArmor(){ return ARMOR_CHAIN.find(a=>!has(a.up)) || null; }
function gearDrop(){ return null; }   // combat.js still asks after every fight; gear is the Forge's now
// The gear screen: the hero between two columns of slots (paper-doll), what the tapped slot holds and
// what it becomes next, then the Armor of God as a row of six pieces in Ephesians' order.
const DOLL = [['head','chest','waist'], ['hand','shield','feet']];
function gearSel(sl){ R.gearSel = sl; render(); }
function slotHTML(sl){ const id=R.gear[sl], it=id?ITEMS[id]:null, sel=(R.gearSel||'head')===sl;
  return `<button class="slot ${it?'':'empty'} ${it&&it.verse?'holy':''} ${sel?'sel':''}" onclick="gearSel('${sl}')" aria-label="${SLOTS[sl]}: ${it?it.name:'empty'}">
    ${it?`<img src="${IMG.gear[id]}" alt="">`:''}<span class="slbl">${SLOTS[sl]}</span></button>`; }
function slotInfo(sl){ const T=TEXT.gear, id=R.gear[sl], it=id?ITEMS[id]:null;
  if(!it){ const plain = PLAIN_ORDER.find(x=>ITEMS[x].slot===sl);
    return `<div class="slotinfo"><div class="sicon empty"></div><div><div class="sname">${fill(T.emptySlot,{slot:SLOTS[sl]})}</div>
      <div class="small">${fill(T.forgeSells,{name:ITEMS[plain].name, n:ITEMS[plain].price})}</div></div></div>`; }
  let next = '';
  if(it.verse) next = `<div class="snext holy">${fill(T.consecratedWith,{ref:it.verse})}</div>`;
  else { const a = ARMOR_CHAIN.find(x=>x.from===id), na = nextArmor(), i = ARMOR_CHAIN.indexOf(a);
    next = `<div class="snext">${na===a ? fill(T.nextConsecrate,{up:ITEMS[a.up].name, n:a.price, ref:passRef('ARMOR',a.n)})
                                        : fill(T.laterConsecrate,{up:ITEMS[a.up].name, prev:ITEMS[ARMOR_CHAIN[i-1].up].name})}</div>`; }
  return `<div class="slotinfo"><img class="sicon" src="${IMG.gear[id]}" alt=""><div><div class="sname ${it.verse?'t-Patience':''}">${it.name}</div>
    <div class="small">${it.perk}</div>${next}</div></div>`; }
function gearHTML(){
  const back = R.gearFrom||'town', na = nextArmor(), sl = R.gearSel||'head';
  const doll = `<div class="panel doll"><div class="dcol">${DOLL[0].map(slotHTML).join('')}</div>
    <div class="dhero">${sprite('player',0,3)}</div><div class="dcol">${DOLL[1].map(slotHTML).join('')}</div></div>`;
  const chain = ARMOR_CHAIN.map(a=>{ const done=has(a.up), next=na&&na.up===a.up;
    return `<div class="apiece ${done?'done':next?'next':''}"><img src="${IMG.gear[a.up]}" alt="${ITEMS[a.up].name}"><span>${passRef('ARMOR',a.n).replace('Ephesians ','')}</span></div>`; }).join('');
  return `<h1>Gear</h1>${doll}<div class="panel">${slotInfo(sl)}</div>
    <div class="panel"><h2>${TEXT.gear.armorHeading}</h2><div class="achain">${chain}</div><div class="small mute" style="margin-top:6px">${TEXT.gear.armorNote}</div></div>
    <div class="dock"><button class="wide" onclick="goto('${back}')">Back</button></div>`;
}
function consecrateList(){
  const a = nextArmor(); if(!a) return `<div class="small t-Patience">${TEXT.gear.allDone}</div>`;
  const up = ITEMS[a.up], ready = owns(a.from), ref = passRef('ARMOR', a.n);
  if(!ready) return `<div class="small mute">${fill(TEXT.gear.needPlain,{up:up.name, from:ITEMS[a.from].name})}</div>`;
  return `<button class="wide" ${R.talents<a.price?'disabled':''} onclick="consecrate()"><span class="t-Patience">${ITEMS[a.from].name} \u2192 ${up.name}</span><br><span class="sub">${fill(TEXT.gear.cost,{ref, n:a.price})}</span></button>`;
}
function consecrate(){
  const a = nextArmor(); if(!a || !owns(a.from) || R.talents<a.price) return;
  openRecall({ref:'ARMOR', type:'Armor', cost:0, text:''}, (frac)=>{
    if(frac===1){ R.talents-=a.price; equip(a.up); saveHero(); Object.keys(heroCache).forEach(k=>delete heroCache[k]); toast(fill(TEXT.gear.fits,{name:ITEMS[a.up].name})); }
    else toast(TEXT.gear.failed);
    render();
  }, 1, TEXT.gear.recallTitle, a.n, 1);
}
function buy(id){ if(!ITEMS[id].price || owns(id) || R.talents<ITEMS[id].price) return; R.talents-=ITEMS[id].price; equip(id); saveHero(); Object.keys(heroCache).forEach(k=>delete heroCache[k]); toast(fill(TEXT.gear.bought,{name:ITEMS[id].name})); render(); }
