/* Gear and the Armor of God (Ephesians 6:14-17): items, equip, consecration. */
const ITEMS = {
  cap:{slot:'head', name:'Ball Cap', perk:'One wrong option is crossed off every multiple-choice blank.', price:15, up:'helm'},
  helm:{slot:'head', name:'Helmet of Salvation', perk:'Crosses off a wrong option, +10 max HP, and once per run a killing blow leaves you at 1.', verse:'Ephesians 6:17'},
  vest:{slot:'chest', name:'Canvas Vest', perk:'+6 max HP.', price:15, up:'breast'},
  breast:{slot:'chest', name:'Breastplate of Righteousness', perk:'+6 max HP and every hit against you is 2 weaker.', verse:'Ephesians 6:14'},
  belt:{slot:'waist', name:'Leather Belt', perk:'Perfect casts also shield you for 2.', price:15, up:'truth'},
  truth:{slot:'waist', name:'Belt of Truth', perk:'Perfect casts shield you for 2 and hit 25% harder.', verse:'Ephesians 6:14'},
  boots:{slot:'feet', name:'Work Boots', perk:'Heal 4 after every fight.', price:15, up:'sabatons'},
  sabatons:{slot:'feet', name:'Shoes of the Gospel of Peace', perk:'Heal 4 after fights, and enemies at 15% health give up and are freed.', verse:'Ephesians 6:15'},
  lid:{slot:'shield', name:'Trash-Can Lid', perk:'Start every fight with a shield of 4.', price:15, up:'faith'},
  faith:{slot:'shield', name:'Shield of Faith', perk:'Start with a shield of 4, the first hit each fight is blocked, and provoking no longer works on you.', verse:'Ephesians 6:16'},
  bible:{slot:'hand', name:'Pocket Bible', perk:'+1 damage on every verse.', price:15, up:'sword'},
  sword:{slot:'hand', name:'Sword of the Spirit', perk:'+3 damage on every verse, and spells you know entirely by heart hit 25% harder.', verse:'Ephesians 6:17'},
};
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
    <div class="panel"><h2>The armor of God, in order</h2>${chain}<div class="small mute" style="margin-top:6px">Each piece is consecrated by reciting Ephesians 6 one verse further than the last.</div></div>${rows}<button class="wide" onclick="goto('${back}')">Back</button>`;
}
function consecrateList(){
  const a = nextArmor(); if(!a) return '<div class="small t-Patience">The whole armor of God. There is nothing left to consecrate.</div>';
  const up = ITEMS[a.up], ready = owns(a.from), ref = passRef('ARMOR', a.n);
  if(!ready) return `<div class="small mute">Next: the ${up.name}. Bring the ${ITEMS[a.from].name} first.</div>`;
  return `<button class="wide" ${R.talents<10?'disabled':''} onclick="consecrate()"><span class="t-Patience">${ITEMS[a.from].name} \u2192 ${up.name}</span><br><span style="font-family:'Pixelify Sans',sans-serif;font-size:20px">10 talents \u00b7 recite ${ref} perfectly</span></button>`;
}
function consecrate(){
  const a = nextArmor(); if(!a || !owns(a.from) || R.talents<10) return;
  openRecall({ref:'ARMOR', type:'Armor', cost:0, text:''}, (frac)=>{
    if(frac===1){ R.talents-=10; equip(a.up); saveHero(); Object.keys(heroCache).forEach(k=>delete heroCache[k]); toast(ITEMS[a.up].name+'. It fits.'); }
    else toast('The words slipped. The metal stays cold.');
    render();
  }, 1, 'Consecrate', a.n, 1);
}
function buy(id){ if(R.talents<ITEMS[id].price) return; R.talents-=ITEMS[id].price; equip(id); saveHero(); Object.keys(heroCache).forEach(k=>delete heroCache[k]); toast(ITEMS[id].name+' on.'); render(); }
