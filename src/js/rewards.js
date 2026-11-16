/* “You got…” popups (Luke, 2026-11): every time you earn something, a popup shows it, so nothing just
   happens silently. reward() queues one; render() shows the next when nothing else is on screen, one at a
   time, never in the middle of a fight (they wait for the after-fight panel). Kinds:
     gear   {id, before, how:'bought'|'consecrated'}  the icon, your hero before and after, what it does (consecrated: Amos, at a chapter ending)
     verse  {ref}                                     a new verse card
     spell  {ref, grew}                               a verse you know climbed a tier, or gained a verse
     chest  {talents, creed}                          talents, and the Creed piece if one came with it
     note   {id}                                      one of Amos's sermon notes
     talents{n, line}                                 talents for something else (a clean drill)  */
let REWARDS = [];
function reward(o){ REWARDS.push(o); }
function rewardDue(){ return REWARDS.length>0 && !!R && !R.busy && !(screen==='fight' && !R.after); }
function closeReward(){ modal = null; render(); }
// the hero drawn wearing a given set of gear (heroGrid reads R.gear)
function heroIn(gear, scale){ const was = R.gear; R.gear = gear; const s = sprite('player', 0, scale); R.gear = was; return s; }
function rewardPopupHTML(){
  const r = modal.r, T = TEXT.reward; let kick = '', title = '', art = '', body = '';
  if(r.kind==='gear'){ const it = ITEMS[r.id];
    kick = T[r.how]; title = it.name; body = it.perk;
    art = `<div class="rgear"><figure>${heroIn(r.before, 2)}<figcaption>${T.before}</figcaption></figure><span class="rarrow">→</span>
      <figure>${heroIn(R.gear, 2)}<figcaption>${T.after}</figcaption></figure></div><img class="ricon" src="${IMG.gear[r.id]}" alt="">`; }
  else if(r.kind==='verse'){ kick = T.verse; title = r.ref; art = `<div class="rcard">${cardView(BY_REF[r.ref])}</div>`; body = fill(TEXT.scriptorium.learned,{ref:r.ref}); }
  else if(r.kind==='spell'){ const s = sp(r.ref);
    kick = r.grew ? T.grew : T.tier; title = passRef(r.ref, s.n);
    art = `<div class="rcard">${cardView(BY_REF[r.ref])}</div>`;
    body = r.grew ? fill(T.grewLine,{spell:passRef(r.ref, s.n)}) : fill(T.tierLine,{tier:TIER_NAME[s.tier]}); }
  else if(r.kind==='chest'){ kick = T.chest; title = fill(T.talents,{n:r.talents});
    art = `<div class="rcoin">${icon('coin',4)}</div>`;
    if(r.creed) body = `<b>${fill(T.creedPiece,{n:r.creed, total:CREED.sections.length})}</b><span class="rcreed">${CREED.sections[r.creed-1].join(' ')}</span>`; }
  else if(r.kind==='note'){ const t = TRUTHS[r.id];
    kick = T.note; title = t.q; body = fill(T.notesSoFar,{n:(P.notes||[]).length, total:TEXT.truths.list.length}); }
  else if(r.kind==='talents'){ kick = T.paid; title = fill(T.talents,{n:r.n}); art = `<div class="rcoin">${icon('coin',4)}</div>`; body = r.line||''; }
  return `<div class="overlay reward"><div class="panel"><div class="rkick">${kick}</div><h2>${title}</h2>${art}
    ${body?`<p class="rbody">${body}</p>`:''}<button class="primary wide" onclick="closeReward()">${T.ok}</button></div></div>`;
}
