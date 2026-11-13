/* Cave encounters beyond fights, chests and campfires (docs/encounters.md):
   - scrap: a scrap of Amos's sermon notes that teaches one truth (P.notes keeps what you found)
   - truth: a held villager asks “Is it true that…?” Right frees them; wrong, the lie wins and you
     fight them, and the question comes back later (P.retry). The first one ever, Amos is with you.
   - hurt: someone hurt. Help them (costs HP) or walk on. Everyone you help stands with you at the
     boss (a shield). The first one ever, Amos is with you.
   Markers come from CAVES[].marks: {t:'scrap', truth}, {t:'truth', truth, amos}, {t:'hurt', who}. */
const TRUTHS = Object.fromEntries(TEXT.truths.list.map(t=>[t.id, t]));
const TRUTH_TEXT = Object.fromEntries(TRUTH_V.map(v=>[v.ref, v.text]));
const HURT_COST = 6, HELP_SHIELD = 5;
function verseBox(id){ const t = TRUTHS[id]; return `<div class="verse truthverse">“${TRUTH_TEXT[t.ref]}” <span class="ref">${t.ref}</span></div>`; }
function linesHTML(lines){ return lines.map(([who,text])=>`<p class="tline">${who?`<b>${TEXT.speakers[who]}</b> `:''}${text}</p>`).join(''); }
function oneOf(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// ---- scraps of Amos's notes ----
function scrapPanel(){ const t = TRUTHS[R.node.truth], T = TEXT.truths;
  return `<div class="panel scrap"><h2>${T.scrapHeading}</h2><p class="scraptext">${t.scrap}</p>${verseBox(t.id)}</div>`; }
function takeScrap(){ const id = R.node.truth; P.notes = P.notes||[]; if(!P.notes.includes(id)) P.notes.push(id); save(); toast(TEXT.truths.scrapFound); clearColumn(); }

// ---- “Is it true that…?” ----
// The question: something you missed before comes back first; the villager's own question waits its turn.
function startTruth(m){
  P.retry = P.retry||[];
  let q = m.truth; const back = P.retry.find(id=>id!==m.truth);
  if(back){ q = back; P.retry = P.retry.filter(id=>id!==back); if(!P.retry.includes(m.truth)) P.retry.push(m.truth); save(); }
  const first = !P.firstTruth && m.amos;
  R.tf = {q, phase: first ? 'amosArrives' : 'ask', first, amosQ: first ? m.amos : null, result:null, tries:0};
}
function truthPanel(){
  const T = TEXT.truths, tf = R.tf, t = TRUTHS[tf.q];
  if(tf.phase==='amosArrives') return `<div class="panel truth">${linesHTML(T.amosArrives)}</div>`;
  if(tf.phase==='amosQ'){ const a = TRUTHS[tf.amosQ];
    return `<div class="panel truth"><p class="q">${a.q}</p><p class="tline">${T.amosAnswers} <b>${a.answer?T.itsTrue:T.itsFalse}</b> ${a.why}</p>${verseBox(a.id)}${linesHTML([T.amosYourTurn])}</div>`; }
  const known = (P.notes||[]).includes(t.id) ? `<p class="small mute">${T.remember}</p>` : '';
  if(tf.phase==='ask') return `<div class="panel truth"><h2>${T.heading}</h2><p class="q">${t.q}</p>${known}
    ${tf.tries && tf.first ? linesHTML([T.amosCorrects]) : ''}</div>`;
  // result
  if(tf.result==='right') return `<div class="panel truth"><p class="tline">${t.answer?T.rightTrue:T.rightFalse}</p>${verseBox(t.id)}
    <p class="small mute">${t.why}</p><p class="tline"><i>${oneOf(T.freed)}</i></p>${tf.first?linesHTML([T.amosLeaves]):''}</div>`;
  return `<div class="panel truth"><p class="tline">${oneOf(T.lost)}</p><p class="small mute">${T.lostAfter} ${T.comesBack}</p></div>`;
}
function truthDock(){
  const T = TEXT.truths, tf = R.tf, go = (label, fn)=>`<button class="primary wide" onclick="${fn}">${label}</button>`;
  if(tf.phase==='amosArrives') return go(TEXT.truths.goOn, "R.tf.phase='amosQ';render()");
  if(tf.phase==='amosQ') return go(TEXT.truths.goOn, "R.tf.phase='ask';render()");
  if(tf.phase==='ask') return `<div class="row tfbtns"><button class="primary" onclick="answerTruth(true)">${T.trueBtn}</button><button class="primary" onclick="answerTruth(false)">${T.falseBtn}</button></div>`;
  if(tf.result==='right') return go(TEXT.truths.goOn, 'endTruth()');
  return go(T.freeThem, 'truthFight()');
}
function answerTruth(a){ const tf = R.tf, t = TRUTHS[tf.q];
  if(a===t.answer){ tf.result='right'; tf.phase='result'; P.retry = (P.retry||[]).filter(id=>id!==t.id); }
  else if(tf.first){ tf.tries++; render(); return; }   // with Amos there you can't fail: he points you back to it
  else { tf.result='wrong'; tf.phase='result'; P.retry = P.retry||[]; if(!P.retry.includes(t.id)) P.retry.push(t.id); }
  save(); render();
}
function endTruth(){ if(R.tf.first){ P.firstTruth = true; save(); } R.tf = null; clearColumn(); }
// the lie won: free them the old way. The marker clears when the fight is won, like any fight.
function truthFight(){ const m = R.node; R.tf = null; R.node = {...m, t:'fight', e:['villager']}; R.room = null; saveRun(); startFight(R.node.e); }

// ---- living it out ----
function hurtPanel(){ const L = TEXT.living, who = L.people.find(p=>p.id===R.node.who), h = R.hurt||{};
  if(h.phase==='amos') return `<div class="panel hurt">${linesHTML(L.amosFirst)}</div>`;
  if(h.phase==='helped') return `<div class="panel hurt"><p class="tline">${who.helped}</p><p class="small mute">${fill(L.helpedNote,{name:who.name})}</p></div>`;
  return `<div class="panel hurt"><h2>${L.heading}</h2><p class="tline">${who.story}</p>${R.hp<=HURT_COST?`<p class="small mute">${L.tooHurt}</p>`:''}</div>`; }
function hurtDock(){ const L = TEXT.living, h = R.hurt||{};
  if(h.phase==='amos') return `<button class="primary wide" onclick="R.hurt.phase='ask';render()">${TEXT.truths.goOn}</button>`;
  if(h.phase==='helped') return `<button class="primary wide" onclick="endHurt()">${TEXT.truths.goOn}</button>`;
  return `<button class="primary wide" ${R.hp<=HURT_COST?'disabled':''} onclick="helpHurt()">${fill(L.help,{cost:HURT_COST})}</button><button class="wide" onclick="walkOn()">${L.walkOn}</button>`; }
function startHurt(){ R.hurt = {phase: P.firstHurt ? 'ask' : 'amos'}; }
function helpHurt(){ if(R.hp<=HURT_COST) return; R.hp -= HURT_COST; R.map.helped = R.map.helped||[]; R.map.helped.push(R.node.who); R.hurt.phase='helped'; saveRun(); render(); }
function walkOn(){ toast(TEXT.living.walkedOn); endHurt(); }
function endHurt(){ P.firstHurt = true; save(); R.hurt = null; clearColumn(); }
// at the boss, everyone you helped on the way down stands with you
function helpersAtBoss(){ const L = TEXT.living, helped = (R.map && R.map.helped) || []; if(!helped.length) return;
  R.shield += HELP_SHIELD*helped.length;
  helped.forEach(id=>log(fill(L.atBoss,{name:L.people.find(p=>p.id===id).name, n:HELP_SHIELD}))); }
