/* Gear and the Armor of God (Ephesians 6:14-17): items, equip, consecration. */
const ITEMS = {
  cap:{slot:'head', price:15, up:'helm'},
  helm:{slot:'head', verse:'Ephesians 6:17'},
  vest:{slot:'chest', price:15, up:'breast'},
  breast:{slot:'chest', verse:'Ephesians 6:14'},
  belt:{slot:'waist', price:15, up:'truth'},
  truth:{slot:'waist', verse:'Ephesians 6:14'},
  boots:{slot:'feet', price:15, up:'sabatons'},
  sabatons:{slot:'feet', verse:'Ephesians 6:15'},
  lid:{slot:'shield', price:15, up:'faith'},
  faith:{slot:'shield', verse:'Ephesians 6:16'},
  bible:{slot:'hand', price:15, up:'sword'},
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
// Gear comes in a fixed order. The armor follows Ephesians 6:14-17, so each consecration recites the passage one verse further.
const PLAIN_ORDER = ['belt','vest','boots','cap'];
const ARMOR_CHAIN = [{up:'truth',from:'belt',n:1},{up:'breast',from:'vest',n:1},{up:'sabatons',from:'boots',n:2},{up:'faith',from:'lid',n:3},{up:'helm',from:'cap',n:4},{up:'sword',from:'bible',n:4}];
function owns(id){ const it=ITEMS[id]; return R.gear[it.slot]===id || (it.up && R.gear[it.slot]===it.up); }
function nextPlain(){ return PLAIN_ORDER.find(id=>!owns(id)) || null; }
function nextArmor(){ return ARMOR_CHAIN.find(a=>!has(a.up)) || null; }
function gearDrop(){ return nextPlain(); }
function gearHTML(){
  const rows = Object.keys(SLOTS).map(sl=>{ const id=R.gear[sl]; const it=id?ITEMS[id]:null;
    return `<div class="panel"><div class="px ${it&&it.verse?'t-Patience':''}">${SLOTS[sl]} \u00b7 ${it?it.name:'empty'}</div>${it?`<div class="small">${it.perk}</div>`:''}</div>`; }).join('');
  const back = R.gearFrom||'town'; const na = nextArmor();
  const chain = ARMOR_CHAIN.map(a=>{ const done=has(a.up), next=na&&na.up===a.up;
    return `<div class="stat small"><span class="${done?'t-Patience':next?'':'mute'}">${done?'\u2713':next?'\u2192':'\u00b7'} ${ITEMS[a.up].name}</span><span class="mute">${passRef('ARMOR',a.n)}</span></div>`; }).join('');
  return `<h1>Gear</h1><div class="panel row" style="justify-content:center;gap:24px">${sprite('player',0,3)}${sprite('back',0,3)}</div>
    <div class="panel"><h2>${TEXT.gear.armorHeading}</h2>${chain}<div class="small mute" style="margin-top:6px">${TEXT.gear.armorNote}</div></div>${rows}<div class="dock"><button class="wide" onclick="goto('${back}')">Back</button></div>`;
}
function consecrateList(){
  const a = nextArmor(); if(!a) return `<div class="small t-Patience">${TEXT.gear.allDone}</div>`;
  const up = ITEMS[a.up], ready = owns(a.from), ref = passRef('ARMOR', a.n);
  if(!ready) return `<div class="small mute">${fill(TEXT.gear.needPlain,{up:up.name, from:ITEMS[a.from].name})}</div>`;
  return `<button class="wide" ${R.talents<10?'disabled':''} onclick="consecrate()"><span class="t-Patience">${ITEMS[a.from].name} \u2192 ${up.name}</span><br><span class="sub">${fill(TEXT.gear.cost,{ref})}</span></button>`;
}
function consecrate(){
  const a = nextArmor(); if(!a || !owns(a.from) || R.talents<10) return;
  openRecall({ref:'ARMOR', type:'Armor', cost:0, text:''}, (frac)=>{
    if(frac===1){ R.talents-=10; equip(a.up); saveHero(); Object.keys(heroCache).forEach(k=>delete heroCache[k]); toast(fill(TEXT.gear.fits,{name:ITEMS[a.up].name})); }
    else toast(TEXT.gear.failed);
    render();
  }, 1, TEXT.gear.recallTitle, a.n, 1);
}
function buy(id){ if(R.talents<ITEMS[id].price) return; R.talents-=ITEMS[id].price; equip(id); saveHero(); Object.keys(heroCache).forEach(k=>delete heroCache[k]); toast(fill(TEXT.gear.bought,{name:ITEMS[id].name})); render(); }
