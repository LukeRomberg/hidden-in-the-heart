/* Spells are passages that grow: tiers, promotion/demotion, damage multipliers. */
const BY_REF = Object.fromEntries([...VERSES, ...ARMOR_V, ...STORY_V].map(v=>[v.ref,v]));
const OFFENSE = ['Proverbs 15:1','James 1:19','Proverbs 14:29','Proverbs 16:32','Ecclesiastes 7:9'];
const DEFENSE = ['Psalm 37:8','Philippians 4:7'];
const PASS = __DATA__('pass.json');   // generated from the BSB by tools/build_passages.mjs; includes PASS.ARMOR (Ephesians 6:14-17)
const TIER_PCT = [0.25,0.5,0.75,1], TIER_MULT = [1,1.25,1.5,2], TIER_NAME = TEXT.tiers, TIER_GLYPH = ['\u25D4','\u25D1','\u25D5','\u25CF'];
function sp(ref){ return P.spell && P.spell[ref] ? P.spell[ref] : {n:1, tier:0, perf:0, fails:0}; }
function setSp(ref,s){ if(!P.spell) P.spell={}; P.spell[ref]=s; save(); }
function maxN(ref){ return PASS[ref] ? PASS[ref].vs.length : 1; }
function passVerses(ref, n){ return PASS[ref] ? PASS[ref].vs.slice(0,n) : [{v:ref.split(':').pop(), t:BY_REF[ref].text}]; }
function passRef(ref, n){ if(!PASS[ref]) return ref; const P_=PASS[ref], vs=P_.vs.slice(0,n); const a=vs[0].v.split('-')[0], b=vs[vs.length-1].v.split('-').pop(); return `${P_.book} ${P_.ch}:${a===b?a:a+'-'+b}`; }
function glyphs(ref){ const s=sp(ref); return Array.from({length:s.n},(_,i)=>i<s.n-1?TIER_GLYPH[3]:TIER_GLYPH[s.tier]).join(''); }
function spellLine(ref){ const s=sp(ref); return `${passRef(ref,s.n)} ${glyphs(ref)}`; }
function spellMult(ref){ const s=sp(ref); let m=0; for(let i=0;i<s.n;i++) m += TIER_MULT[i<s.n-1?3:s.tier]; return m; }
function spellCost(v){ return v.cost + sp(v.ref).n - 1; }
function spellEff(v){ const m=spellMult(v.ref); return v.dmg?`${Math.round(v.dmg*m)} dmg`: v.shield?`${Math.round(v.shield*m)} shield`:`heal ${Math.round(v.heal*m)}`; }
// Spells slide with your memory. Three perfect casts climb a tier. A cast under SLIP_BELOW is a slip,
// and SLIPS_TO_DROP slips in a row drop a tier (or the newest verse). Anything in between holds steady.
const SLIP_BELOW = 0.75, SLIPS_TO_DROP = 2;
function recordResult(ref, frac){
  const s = {...sp(ref)}; const name = ()=>passRef(ref,s.n);
  if(frac===1){
    s.fails=0; s.perf++;
    if(s.perf>=3){ s.perf=0;
      if(s.tier<3){ s.tier++; toast(fill(TEXT.spells.promoted,{spell:name(), tier:TIER_NAME[s.tier]})); }
      else if(s.n<maxN(ref)){ s.n++; s.tier=0; toast(fill(TEXT.spells.grew,{spell:name()})); }
    }
  } else if(frac>=SLIP_BELOW){
    s.fails=0;
  } else {
    s.fails++; s.perf=0;
    if(s.fails>=SLIPS_TO_DROP){ s.fails=0;
      if(s.tier>0){ s.tier--; toast(fill(TEXT.spells.slipped,{spell:name(), tier:TIER_NAME[s.tier]})); }
      else if(s.n>1){ s.n--; s.tier=3; toast(fill(TEXT.spells.lostVerse,{spell:name()})); }
    }
  }
  setSp(ref, s);
}
function addVerse(ref){ if(!R.deck.some(c=>c.ref===ref)) R.deck.push({ref}); }
