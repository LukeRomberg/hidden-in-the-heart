/* Cave encounters beyond fights, chests and campfires (docs/encounters.md):
   - scrap: a scrap of Amos's sermon notes that teaches one truth (P.notes keeps what you found)
   - truth: a held villager asks “Is it true that…?” Right frees them; wrong, the lie wins and you
     fight them, and the question comes back later (P.retry). The first one ever, Amos is with you.
   - hurt: someone hurt. Help them (costs HP) or walk on. Everyone you help stands with you at the
     boss (a shield). The first one ever, Amos is with you.
   Markers come from CAVES[].marks: {t:'scrap', truth}, {t:'truth', truth, amos}, {t:'hurt', who}.
   Scraps open a panel under the map; the truth villager and the hurt person play on the battle screen. */
const TRUTHS = Object.fromEntries(TEXT.truths.list.map(t=>[t.id, t]));
const TRUTH_TEXT = Object.fromEntries(TRUTH_V.map(v=>[v.ref, v.text]));
const HURT_COST = 6, HELP_SHIELD = 5;
function verseBox(id){ const t = TRUTHS[id], v = TRUTH_TEXT[t.ref];   // a verse that opens on a quotation already has its marks
  return `<div class="verse truthverse">${v.startsWith('“') ? v : '“'+v+'”'} <span class="ref">${t.ref}</span></div>`; }
function linesHTML(lines){ return lines.map(([who,text])=>`<p class="tline">${who?`<b>${TEXT.speakers[who]}</b> `:''}${text}</p>`).join(''); }
function oneOf(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// ---- scraps of Amos's notes ----
// Each note also carries, in Amos's hand, the piece of the Creed the next chest will ask for, so you meet
// it before you're tested on it (until you've opened a chest with it; then the next note has the next piece).
function creedOnNote(){ const N = CREED.sections.length; if(P.creed >= N) return '';
  return `<div class="creednote"><p class="small mute">${fill(TEXT.truths.creedLead,{n:P.creed+1, total:N})}</p><p class="creedtext">${CREED.sections[P.creed].join(' ')}</p></div>`; }
function scrapPanel(){ const t = TRUTHS[R.node.truth], T = TEXT.truths;
  return `<div class="panel scrap"><h2>${T.scrapHeading}</h2><p class="scraptext">${t.scrap}</p>${verseBox(t.id)}${creedOnNote()}</div>`; }
function takeScrap(){ const id = R.node.truth; P.notes = P.notes||[]; if(!P.notes.includes(id)){ P.notes.push(id); reward({kind:'note', id}); } save(); clearColumn(); }

// ---- On the battle screen (screen 'meet'): the truth villager and someone hurt stand in the arena like a fight ----
// The arena is combat.js's arenaHTML; the box under it says what's going on; the choices sit in the dock where
// the cards go. The first of each, Amos walks up beside you (R.amos) and says his piece in popups (talkPop).
const MEET_BEAT = window.__FAST ? 60 : 650;   // a breath after the screen comes in, before anyone talks
function meetIn(enemy){
  Object.assign(R, {enemies:[enemy], target:0, after:false, boss:null, say:null, shield:0, vexed:false, brace:false,
    focus:R.maxFocus, log:[], busy:true, amos:false});
  R.room = null; goto('meet');
}
const popup = (key, lines) => new Promise(res=>talkPop(key, lines, ()=>{ render(); res(); }));
function meetHTML(){
  if(R.say) queueMicrotask(placeSay);
  const body = R.tf ? truthBox() : R.hurt ? hurtBox() : '', dock = R.busy ? '' : R.tf ? truthDock() : R.hurt ? hurtDock() : '';
  return `${arenaHTML(false)}<div class="textbox meetbox">${body}</div><div class="dock fightdock meetdock">${dock}</div>`;
}
// the person you're facing, their face beside what's going on (story.js faceOf)
function meetFace(p){ const f = faceOf(p); return f ? `<img class="mface" src="${f}" width="48" height="48" alt="">` : ''; }
// Amos in the arena, just behind you (arenaHTML calls this; k = the arena's scale)
function amosArenaHTML(k){ return R.amos ? `<div class="amosin"><img src="${IMG.priest.idle}" width="${Math.round(48*1.7*k)}" height="${Math.round(64*1.7*k)}" alt="${TEXT.speakers.priest}"></div>` : ''; }

// ---- “Is it true that…?” ----
// Each villager is one fixed person (TEXT.villagers), so the one on the map is the one in the arena and in the fight.
function truthFolk(m){ return ((R.cave||0)*7 + [...String(m.id)].reduce((a,c)=>a+c.charCodeAt(0),0)) % TEXT.villagers.length; }
function heldVillager(k){ const v = TEXT.villagers[k], e = makeEnemy('villager', 0);
  Object.assign(e, {name:v.name, pron:v.pronoun, spr:folkSpr(v), fk:k}); e.move = moveFor(e); return e; }
// The question: something you missed before comes back first; the villager's own question waits its turn.
function startTruth(m){
  P.retry = P.retry||[];
  let q = m.truth; const back = P.retry.find(id=>id!==m.truth);
  if(back){ q = back; P.retry = P.retry.filter(id=>id!==back); if(!P.retry.includes(m.truth)) P.retry.push(m.truth); save(); }
  const first = !P.firstTruth && m.amos;
  R.tf = {q, phase: first ? 'amosArrives' : 'ask', first, amosQ: first ? m.amos : null, result:null, tries:0};
  meetIn(heldVillager(truthFolk(m))); setTimeout(runTruth, 300+MEET_BEAT);
}
async function runTruth(){
  const T = TEXT.truths, tf = R.tf; if(!tf || screen!=='meet') return;
  if(tf.first){
    R.amos = true; await popup('truth-amos', T.amosArrives);   // he walks up as the line says so
    const a = TRUTHS[tf.amosQ]; tf.phase = 'amosQ'; render(); speak(0, a.q); await sleep(MEET_BEAT);
    await popup('truth-amosq', [[null, `${T.amosAnswers} ${a.answer?T.itsTrue:T.itsFalse} ${a.why}`], T.amosYourTurn]);
  }
  askTruth();
}
function askTruth(){ const tf = R.tf; tf.phase = 'ask'; R.busy = false; render(); speak(0, TRUTHS[tf.q].q); }
function truthBox(){
  const T = TEXT.truths, tf = R.tf, t = TRUTHS[tf.q], e = R.enemies[0];
  if(tf.phase==='amosArrives') return `<div>${fill(T.arenaIntro, foeVars(e))}</div>`;
  if(tf.phase==='amosQ'){ const a = TRUTHS[tf.amosQ];
    return `<div class="tq">${a.q}</div><div class="small">${T.amosAnswers} <b>${a.answer?T.itsTrue:T.itsFalse}</b> ${a.why}</div>${verseBox(a.id)}`; }
  const known = (P.notes||[]).includes(t.id) ? `<div class="small mute">${T.remember}</div>` : '';
  if(tf.phase==='ask') return `${meetFace(e)}<div class="th">${T.heading}</div><div class="tq">${t.q}</div>${known}`;
  if(tf.result==='right') return `<div class="small">${t.answer?T.rightTrue:T.rightFalse}</div>${verseBox(t.id)}<div class="small mute">${t.why}</div>${e.freed?`<div>${fill(TEXT.fight.freed, foeVars(e))}</div>`:''}`;
  return `<div>${tf.lost}</div><div class="small mute">${T.lostAfter} ${T.comesBack}</div>`;
}
function truthDock(){
  const T = TEXT.truths, tf = R.tf, go = (label, fn)=>`<button class="primary wide" onclick="${fn}">${label}</button>`;
  if(tf.phase==='ask') return `<div class="row tfbtns"><button class="primary" onclick="answerTruth(true)">${T.trueBtn}</button><button class="primary" onclick="answerTruth(false)">${T.falseBtn}</button></div>`;
  if(tf.result==='right') return go(T.goOn, 'endTruth()');
  if(tf.result==='wrong') return go(T.freeThem, 'truthFight()');
  return '';
}
async function answerTruth(a){ const T = TEXT.truths, tf = R.tf, t = TRUTHS[tf.q], e = R.enemies[0];
  if(R.busy || !tf || tf.phase!=='ask') return; R.busy = true; R.say = null;
  if(a===t.answer){ tf.result='right'; tf.phase='result'; P.retry = (P.retry||[]).filter(id=>id!==t.id);
    if(!(P.truthsRight=P.truthsRight||[]).includes(t.id)) P.truthsRight.push(t.id);   // chapter-end hook: truths answered right, for the stats (story.js)
    save(); render(); await sleep(MEET_BEAT);
    // freed like a fight win: smoke, the person underneath, what they say
    e.freed = true; await freedFX(0); await thanksBeat(e, quoted(oneOf(T.freed)));
    if(tf.first){ await popup('truth-amosbye', [T.amosLeaves]); R.amos = false; }
    R.busy = false; render(); return; }
  if(tf.first){ tf.tries++; render(); await popup('truth-amosfix'+tf.tries, [T.amosCorrects]); askTruth(); return; }   // with Amos there you can't fail: he points you back to it
  tf.result='wrong'; tf.phase='result'; tf.lost = oneOf(T.lost); P.retry = P.retry||[]; if(!P.retry.includes(t.id)) P.retry.push(t.id);
  save(); R.busy = false; render(); speak(0, tauntFor(e));
}
function endTruth(){ if(R.busy) return; if(R.tf.first){ P.firstTruth = true; save(); } R.tf = null; R.amos = false; clearColumn(); }
// the lie won: free them the old way, right here, with the same person. The marker clears when the fight is won, like any fight.
function truthFight(){ if(R.busy) return; const m = R.node, e = R.enemies[0]; R.tf = null; R.amos = false;
  R.node = {...m, t:'fight', e:['villager']}; R.room = null; saveRun(); startFight([e], false, true); }

// ---- living it out ----
// the hurt person as they are now (TEXT.living.people[].look / .hurt), or on their feet once helped
function hurtSrc(id, helped){ const p = TEXT.living.people.find(q=>q.id===id); return folkSrc(p, helped ? 'idle' : p.hurt||'hurt'); }
const HURT_HP = {hurt:7, badly:3}, HURT_MAX = 20;   // only for the bar over their head: how bad it is
function startHurt(){ const p = TEXT.living.people.find(q=>q.id===R.node.who), first = !P.firstHurt;
  R.hurt = {phase: first ? 'amos' : 'ask', first};
  meetIn({id:'hurt', who:p.id, name:p.name, pron:'he', villager:true, spr:folkSpr(p), pic:hurtSrc(p.id), cls:'hurtp '+(p.hurt||'hurt'),
    hp:HURT_HP[p.hurt||'hurt'], max:HURT_MAX, pattern:['atk'], step:0, freed:false});
  setTimeout(runHurt, 300+MEET_BEAT);
}
async function runHurt(){ const h = R.hurt; if(!h || screen!=='meet') return;
  if(h.phase==='amos'){ R.amos = true; await popup('hurt-amos', TEXT.living.amosFirst); h.phase = 'ask'; }
  R.busy = false; render(); }
function hurtBox(){ const L = TEXT.living, who = L.people.find(p=>p.id===R.enemies[0].who), h = R.hurt;
  if(h.phase==='helped') return `<div class="small">${who.helped}</div><div class="small mute">${fill(L.helpedNote,{name:who.name})}</div>`;
  return `${meetFace(who)}<div class="th">${L.heading}</div><div class="small">${who.story}</div>${h.phase==='ask' && R.hp<=HURT_COST?`<div class="small mute">${L.tooHurt}</div>`:''}`; }
function hurtDock(){ const L = TEXT.living, h = R.hurt;
  if(h.phase==='helped') return `<button class="primary wide" onclick="endHurt()">${TEXT.truths.goOn}</button>`;
  if(h.phase!=='ask') return '';
  return `<button class="primary wide" ${R.hp<=HURT_COST?'disabled':''} onclick="helpHurt()">${fill(L.help,{cost:HURT_COST})}</button><button class="wide" onclick="walkOn()">${L.walkOn}</button>`; }
async function helpHurt(){ const e = R.enemies[0];
  if(R.busy || R.hurt.phase!=='ask' || R.hp<=HURT_COST) return; R.busy = true;
  R.hp -= HURT_COST; R.map.helped = R.map.helped||[]; R.map.helped.push(e.who);
  if(!(P.helpedAll=P.helpedAll||[]).includes(e.who)) P.helpedAll.push(e.who);   // chapter-end hook: everyone you ever helped, kept for the stats (story.js)
  saveRun(); render(); floatText('pl', '-'+HURT_COST, 'dmg you'); barsSync(); await sleep(MEET_BEAT);
  // on their feet: the standing sprite, their bar fills
  e.pic = hurtSrc(e.who, true); e.cls = 'hurtp up'; e.hp = e.max; R.hurt.phase = 'helped'; R.busy = false; render(); }
function walkOn(){ if(R.busy) return; toast(TEXT.living.walkedOn); endHurt(); }
function endHurt(){ if(R.busy) return; P.firstHurt = true; save(); R.hurt = null; R.amos = false; clearColumn(); }
// at the boss, everyone you helped on the way down stands with you
function helpersAtBoss(){ const L = TEXT.living, helped = (R.map && R.map.helped) || []; if(!helped.length) return;
  R.shield += HELP_SHIELD*helped.length;
  helped.forEach(id=>log(fill(L.atBoss,{name:L.people.find(p=>p.id===id).name, n:HELP_SHIELD}))); }
