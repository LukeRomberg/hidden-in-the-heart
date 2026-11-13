// Scripted playtest bot: plays all of Philadelphia (prologue, the Furnace, Amos's tour, then the Hollow, the Old
// Quarry and the Deep Cave) as a player whose recall accuracy is a parameter, and reports where it got stuck and how
// balanced the chapter felt.
//
// Usage: node tests/playtest.mjs [acc ...] [frugal|shopper]   (default: 0.5 0.6 0.7 0.85 0.95, each frugal and shopper)
//        PLAYTEST_JOBS=n runs n games at once (default 4)
//        npm run playtest                           (builds first)
//        PLAYTEST_TARGET=path/to/index.html         (default dist/index.html)
// Writes tests/out/playtest.md (and a screenshot per stall / console error in tests/out/).
// Exit code is nonzero on any stall, softlock, bot failure or console error. Losing (even failing a cave 3 times) is a balance finding, not a failure.
// Shopping styles: frugal never buys; shopper buys the cheapest affordable plain gear it lacks and consecrates (Ephesians 6 recital at the same accuracy) at every town visit.
//
// The bot is driven by game state (screen, R.room, R.tf, R.hurt, modal, the map's own reach()/markAt()/closedAt()) and by
// dock buttons, not by English labels. Everything it chooses at random (right or wrong answers) uses its own seeded
// generator, and the game's Math.random is seeded too, so a run repeats.
//
// Bot policies (all in one place so they are easy to change):
//   fights:    each turn say the best affordable unsaid verse (a heal when HP < 50%, else the most damage); Brace when
//              nothing is affordable. Never uses Charge. Level-ups take the first fruit on offer.
//   map:       nearest marker first (campfire only when HP < 60% or nothing else is left), then unexplored edges, the
//              boss door once every fight is done, and the boss last.
//   campfire:  sleep if HP < max, otherwise study the shakiest verse.
//   hurt:      help if the HP left afterwards is still >= 40% of max (and the game allows it), else walk on.
//   verse door: say the verse with the fewest blanks, up to 8 tries.
//   town:      between caves (and after a defeat) eat at the inn, or pay the church 5 talents, if hurt. Retries: 2 per cave.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const target = resolve(process.env.PLAYTEST_TARGET || 'dist/index.html');
const OUT = resolve('tests/out'); mkdirSync(OUT, { recursive: true });
const words = process.argv.slice(2).join(',').split(',').filter(Boolean);
const ACCS = words.filter(w => !isNaN(+w)).map(Number).length ? words.filter(w => !isNaN(+w)).map(Number) : [0.5, 0.6, 0.7, 0.85, 0.95];
const STYLES = words.filter(w => w === 'frugal' || w === 'shopper').length ? words.filter(w => w === 'frugal' || w === 'shopper') : ['frugal', 'shopper'];
if (ACCS.some(a => !(a >= 0 && a <= 1)) || words.some(w => isNaN(+w) && !STYLES.includes(w))) { console.error('usage: node tests/playtest.mjs [acc 0..1 ...] [frugal|shopper]'); process.exit(2); }
const JOBS = +process.env.PLAYTEST_JOBS || 4;
const STALL_MS = 60000, MAX_RETRIES = 2, DOOR_TRIES = 8;
const CAVE_NAMES = ['The Hollow', 'The Old Quarry', 'The Deep Cave'];

class Stall extends Error {}
class Softlock extends Error {}
const mulberry = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const f1 = n => (Math.round(n * 10) / 10).toString();
const mmss = ms => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`; };

async function playOne(acc, style) {
  const seed = Math.round(acc * 1000);
  const rng = mulberry(seed * 7919 + 13);
  const tag = `acc${Math.round(acc * 100)}-${style}`;
  const started = Date.now();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 430, height: 800 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await ctx.addInitScript(s0 => { let s = s0; Math.random = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, seed * 31 + 7);
  await ctx.addInitScript(() => { setInterval(() => { try { if (R && R.enemies && screen === 'fight' && !R.after) window.__minPct = Math.min(window.__minPct ?? 9, R.hp / R.maxHp); } catch (e) {} }, 15); });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  const rec = { acc, style, purchases: [], caves: [], issues: [], errors: [], blanks: { right: 0, wrong: 0 }, tutorialTurns: 0, outcome: 'incomplete', final: null, ms: 0 };
  let shotN = 0;
  const shot = async name => { const p = `${OUT}/playtest-${tag}-${String(++shotN).padStart(2, '0')}-${name}.png`; try { await page.screenshot({ path: p }); } catch {} return p; };
  page.on('console', m => { if (m.type() === 'error') { rec.errors.push(m.text()); if (rec.errors.length <= 3) shot('console-error').then(p => rec.issues.push({ kind: 'CONSOLE ERROR', msg: m.text(), shot: p })); } });
  page.on('pageerror', e => { rec.errors.push('pageerror: ' + e.message); if (rec.errors.length <= 3) shot('page-error').then(p => rec.issues.push({ kind: 'PAGE ERROR', msg: e.message, shot: p })); });
  page.on('dialog', d => d.accept());

  // ---- stall guard: any loop that waits calls tick(); no change in the game's state for 60 s is a stall ----
  let lastSig = '', lastAt = Date.now();
  const sigOf = () => page.evaluate(() => { try { return JSON.stringify([screen, document.getElementById('wipe').className, R && [R.hp, R.focus, R.turn, R.busy, R.after, R.levelUps, R.room, R.enemies && R.enemies.map(e => e.hp).join(), R.tf && [R.tf.phase, R.tf.tries], R.hurt && R.hurt.phase, R.map && [R.map.pos, R.map.done.length, R.map.open.length]], modal && [modal.kind, modal.cur, modal.c && modal.c.cur, modal.next, modal.mistakes], TW.i, TW.typing]); } catch (e) { return 'err'; } });
  const tick = async () => { const s = await sigOf(), now = Date.now(); if (s !== lastSig) { lastSig = s; lastAt = now; } else if (now - lastAt > STALL_MS) throw new Stall(`the game state did not change for ${STALL_MS / 1000}s`); };
  const until = async (pred, arg) => { for (;;) { if (await page.evaluate(pred, arg)) return; await tick(); await page.waitForTimeout(40); } };
  const idle = () => until(() => !document.getElementById('wipe').className && !(R && R.map && R.map.walking));
  const waitScreen = s => until(x => screen === x && !document.getElementById('wipe').className, s);
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const describe = () => page.evaluate(() => {
    const T = s => (s || '').replace(/\s+/g, ' ').trim();
    return { screen, room: R && R.room, tf: R && R.tf && { q: R.tf.q, phase: R.tf.phase }, hurt: R && R.hurt && R.hurt.phase, modal: modal && modal.kind, pos: R && R.map && R.map.pos, hp: R && `${R.hp}/${R.maxHp}`,
      focus: R && R.focus, turn: R && R.turn, enemies: R && R.enemies && R.enemies.map(e => `${e.name} ${e.hp}/${e.max}${e.freed ? ' freed' : ''}`), busy: R && R.busy, after: R && R.after,
      text: T(document.getElementById('app').innerText).slice(0, 300), buttons: [...document.querySelectorAll('#app button, .overlay button')].map(b => T(b.innerText)).filter(Boolean).slice(0, 10) };
  }).catch(e => ({ unavailable: String(e).split('\n')[0] }));

  // ---- dialogue and story screens ----
  async function finishDialogue() {
    for (let i = 0; i < 30; i++) {
      if (!(await page.locator('#acts.hide').count()) && !(await ev(() => TW.typing))) return;
      await page.locator('.dlg').first().click(); await page.waitForTimeout(50);
    }
    throw new Stall('dialogue never finished');
  }
  async function levelUp() {
    const lo = page.locator('.overlay.levelup .lvopt');
    if (await lo.count()) { await lo.first().click(); rec.levelups = (rec.levelups || 0) + 1; }
    else await page.locator('.overlay.levelup button').last().click();
    await page.waitForTimeout(40);
  }
  // Click through story screens (dialogue, dock buttons, level-up popups, recalls) until `target` shows.
  async function navigate(targetScreen) {
    for (let i = 0; i < 80; i++) {
      await tick(); await idle();
      const s = await ev(() => ({ screen, modal: modal && modal.kind, dlg: !!document.querySelector('.dlg'), acts: document.querySelectorAll('#acts button').length, dock: document.querySelectorAll('#app .dock button').length }));
      if (s.screen === targetScreen) return;
      if (s.modal === 'levelup') { await levelUp(); continue; }
      if (s.modal === 'recall') { await solveRecall(); continue; }
      if (s.modal === 'assembly') { await solveAssembly(); continue; }
      if (s.dlg) { await finishDialogue(); if (s.acts) await page.locator('#acts button').first().click(); else if (s.dock) await page.locator('#app .dock button').first().click(); }
      else if (s.dock) await page.locator('#app .dock button').first().click();
      else if (await page.locator('#app button.primary').count()) await page.locator('#app button.primary').first().click();
      else { await page.waitForTimeout(150); continue; }
      await page.waitForTimeout(120);
    }
    throw new Stall(`could not navigate to ${targetScreen}`);
  }

  // ---- recall at accuracy acc: every blank is right with probability acc ----
  async function solveRecall() {
    await until(() => modal && modal.kind === 'recall');
    for (let i = 0; i < 400; i++) {
      const st = await ev(() => { if (!modal || modal.kind !== 'recall') return { gone: true }; const c = modal.c; if (c.done) return { done: true }; const o = c.toks[c.order[c.cur]]; return { mode: o.mode, ans: o.ans, opts: o.opts }; });
      if (st.gone) return;
      if (st.done) { await page.locator('.overlay button.primary').click(); return; }
      const right = rng() < acc;
      rec.blanks[right ? 'right' : 'wrong']++;
      if (st.mode === 'letter') {
        let ch = st.ans; if (!right) { const abc = 'abcdefghijklmnopqrstuvwxyz'.replace(st.ans, ''); ch = abc[Math.floor(rng() * abc.length)]; }
        await page.locator('#ans').pressSequentially(ch);
      } else {
        const idx = st.opts.map((o, j) => j); const rightIdx = st.opts.findIndex(o => o.toLowerCase() === st.ans.toLowerCase());
        const wrongIdx = idx.filter(j => j !== rightIdx);
        const j = right || !wrongIdx.length ? rightIdx : wrongIdx[Math.floor(rng() * wrongIdx.length)];
        await page.locator('.overlay .opts button').nth(j).click();
      }
    }
    throw new Stall('recall never finished');
  }
  // ---- ordering puzzles (the Furnace's fires, Creed chests): each piece is right with probability acc ----
  async function solveAssembly() {
    for (let i = 0; i < 100; i++) {
      const st = await ev(() => modal && modal.kind === 'assembly' ? { order: modal.order, next: modal.next } : null);
      if (!st) return;
      const right = rng() < acc, pos = st.order.indexOf(st.next);
      const wrong = st.order.map((c, p) => p).filter(p => st.order[p] > st.next);
      const p = right || !wrong.length ? pos : wrong[Math.floor(rng() * wrong.length)];
      await page.locator('.overlay .chip').nth(p).click(); await page.waitForTimeout(20);
    }
    throw new Stall('assembly never finished');
  }

  // ---- fights ----
  async function pickVerse() {
    return ev(() => {
      const refs = unsaid().filter(affordable); if (!refs.length) return null;
      const score = ref => { const v = BY_REF[ref], m = spellMult(ref);
        if (v.dmg) return v.dmg * m; if (v.heal) return R.hp < R.maxHp * 0.5 ? v.heal * m * 1.5 : 0.2; if (v.shield) return v.shield * m * 0.5; return 0.5; };
      return refs.sort((a, b) => score(b) - score(a))[0];
    });
  }
  // plays the fight on screen to its end: returns {result:'won'|'defeat', ...stats}
  async function fightLoop() {
    const info = await ev(() => ({ names: R.enemies.map(e => e.name), boss: !!(R.node && R.node.caveBoss), tut: !!R.tutorial, hp: R.hp, defeats: window.__defeats || 0 }));
    let defeats0 = info.defeats, stats = null, turnsDone = 0; await ev(() => { window.__minPct = R.hp / R.maxHp; });
    for (;;) {
      await tick();
      const s = await ev(() => ({ screen, after: R.after, busy: R.busy, modal: modal && modal.kind, defeats: window.__defeats || 0, tut: !!R.tutorial, turn: R.turn, hp: R.hp, castLog: (R.castLog || []).map(c => c.frac) }));
      if (s.defeats > defeats0) {
        if (s.tut) { defeats0 = s.defeats; rec.tutorialDefeats = (rec.tutorialDefeats || 0) + 1; await page.waitForTimeout(100); continue; }
        await waitScreen('defeat'); return { result: 'defeat', names: info.names, boss: info.boss, turns: s.turn, hpStart: info.hp, hpEnd: 0, minPct: 0, lost: true };
      }
      if (s.after) {
        if (!stats) stats = { minPct: Math.max(0, Math.min(1, await ev(() => window.__minPct ?? 1))), lost: false, result: 'won', names: info.names, boss: info.boss, tut: info.tut, turns: s.turn, hpStart: info.hp, hpEnd: s.hp, casts: s.castLog.length, slips: s.castLog.filter(f => f < 0.75).length };
        if (s.modal === 'levelup') { await levelUp(); continue; }
        return stats;
      }
      if (s.screen !== 'fight') { if (s.screen === 'dive' || s.screen === 'victory') { await page.waitForTimeout(100); if (s.screen === 'victory') return stats || { result: 'won', names: info.names }; continue; } return stats || { result: 'left', names: info.names }; }
      if (s.modal === 'levelup') { await levelUp(); continue; }
      if (s.modal === 'assembly') { await solveAssembly(); await until(() => !R.busy || R.after || screen !== 'fight'); continue; }
      if (s.modal === 'recall') { await solveRecall(); continue; }
      if (s.busy) { await page.waitForTimeout(60); continue; }
      const ref = await pickVerse();
      if (ref) { await page.locator(`.hand .card[onclick="playCard('${ref}')"]`).click(); await solveRecall(); }
      else await page.locator('.fightdock button[onclick="brace()"]').click();
      turnsDone++;
      await until(() => R.busy || R.after || screen !== 'fight' || (modal && modal.kind !== 'recall') || !modal); // the action has started...
      await page.waitForTimeout(30);
      await until(() => !R.busy || R.after || screen !== 'fight');                                               // ...and finished
    }
  }
  async function afterFight() {
    if (await ev(() => !!R.pendingDrop)) await page.locator('#app button[onclick*="addVerse(R.pendingDrop)"]').click();
    await page.locator('#app .dock button.primary').click();
  }

  // ---- the cave map ----
  const mapState = (skip, hpPolicy) => ev(({ skip }) => {
    const m = caveMap(R.cave), M = R.map, Rc = reach(), W = m.W, seen = (x, y) => !!M.seen[y * W + x], items = [];
    const nb = (x, y) => [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]];
    for (const [id, mk] of Object.entries(m.mk)) {
      if (M.done.includes(id) || skip.includes(id)) continue;
      const [x, y] = id.split(',').map(Number); if (!seen(x, y)) continue;
      const d = Rc.dist.get(id); if (d === undefined) continue;
      items.push({ k: mk.t, x, y, d });
    }
    for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) {
      if (!seen(x, y)) continue; const c = m.rows[y][x], id = x + ',' + y;
      if ((c === 'L' || c === 'K') && !isOpen(x, y) && !skip.includes(id)) { const d = Rc.dist.get(id); if (d !== undefined) items.push({ k: 'lever', x, y, d }); }
      if ((c === 'V' || c === 'D') && !isOpen(x, y) && !skip.includes(id)) {
        if (c === 'D' && fightsLeft() > 0) continue;
        const ds = nb(x, y).filter(([a, b]) => walkable(a, b) && Rc.dist.has(a + ',' + b)).map(([a, b]) => Rc.dist.get(a + ',' + b));
        if (ds.length) items.push({ k: c === 'V' ? 'verse door' : 'boss door', x, y, d: Math.min(...ds) + 1 });
      }
    }
    let front = null;
    Rc.dist.forEach((d, id) => { const [x, y] = id.split(',').map(Number); if (!walkable(x, y) || markAt(x, y) || d === 0) return;
      if (nb(x, y).some(([a, b]) => a >= 0 && b >= 0 && a < m.W && b < m.H && !seen(a, b) && m.rows[b][a] !== '#') && (!front || d < front.d)) front = { k: 'unexplored', x, y, d }; });
    const hurtNow = R.hp < R.maxHp * 0.6;
    const rest = items.filter(i => i.k === 'rest'), boss = items.filter(i => i.k === 'boss'), rest_ = items.filter(i => i.k !== 'rest' && i.k !== 'boss').sort((a, b) => a.d - b.d);
    let pick = null;
    if (hurtNow && rest.length) pick = rest[0];
    else if (rest_.length) pick = rest_[0];
    else if (front) pick = front;
    else if (rest.length) pick = rest[0];
    else if (boss.length) pick = boss[0];
    return { pick, left: fightsLeft(), pos: M.pos };
  }, { skip });
  // from smoke.mjs: tap tiles like a player; each tap goes to the furthest tile of the real route that is lit or remembered and on screen
  async function walkTo(goal) {
    for (let i = 0; i < 80; i++) {
      await idle();
      const s = await ev(([gx, gy]) => {
        if (screen !== 'dive' || R.room || modal || R.node) return { stop: true };
        const [hx, hy] = R.map.pos; if (hx === gx && hy === gy) return { stop: true };
        const m = caveMap(R.cave), prev = new Map([[hx + ',' + hy, null]]), q = [[hx, hy]];
        while (q.length) { const [x, y] = q.shift(); if (x === gx && y === gy) break; if ((x !== hx || y !== hy) && !walkable(x, y)) continue;
          for (const [a, b] of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) { if (prev.has(a + ',' + b) || (!walkable(a, b) && !(a === gx && b === gy) && !markAt(a, b))) continue; prev.set(a + ',' + b, [x, y]); q.push([a, b]); } }
        if (!prev.has(gx + ',' + gy)) return { err: 'no route' };
        const path = []; for (let p = [gx, gy]; p; p = prev.get(p.join(','))) path.unshift(p);
        const r = document.getElementById('cmap').getBoundingClientRect(), v = document.querySelector('.cave-view').getBoundingClientRect();
        let best = null;
        path.slice(1).forEach(([x, y]) => { const sx = r.left + x * 40 + 20, sy = r.top + y * 40 + 20;
          if (R.map.seen[y * m.W + x] && sx > v.left + 4 && sx < v.right - 4 && sy > v.top + 4 && sy < v.bottom - 4) best = { sx, sy, x, y }; });
        return best ? { best } : { err: 'nothing on the route is lit' };
      }, goal);
      if (s.stop) return;
      if (s.err) throw new Error(`walking to ${goal}: ${s.err}`);
      await page.mouse.click(s.best.sx, s.best.sy); await page.waitForTimeout(50);
      if (s.best.x === goal[0] && s.best.y === goal[1] && await ev(([x, y]) => closedAt(x, y), goal)) { await idle(); return; }   // tapped a shut door
    }
    throw new Error(`never got to ${goal}`);
  }

  // ---- what's in a room under the map ----
  const dockPrimary = () => page.locator('#app .dock button.primary').first().click();
  async function handleRoom(room, att) {
    const A = att;
    if (room === 'boss') { await dockPrimary(); return; }
    if (room === 'scrap') { await dockPrimary(); A.scraps++; return; }
    if (room === 'lock') {
      const before = await ev(() => ({ tal: R.talents, tier: R.node.tier || 1, creed: P.creed }));
      await dockPrimary(); await until(() => modal && modal.kind === 'assembly'); await solveAssembly();
      for (let i = 0; i < 40; i++) {
        await tick(); const s = await ev(() => ({ screen, room: R.room, modal: modal && modal.kind }));
        if (s.screen === 'reward') { await page.locator('#app .hand > div').first().click(); await until(() => screen !== 'reward'); continue; }
        if (s.screen === 'dive' && !s.room && !s.modal) break;
        if (s.modal === 'levelup') { await levelUp(); continue; }
        await page.waitForTimeout(80);
      }
      const after = await ev(() => ({ tal: R.talents, creed: P.creed }));
      A.chests.push({ tier: before.tier, ok: after.tal > before.tal, talents: after.tal - before.tal, creed: after.creed - before.creed }); return;
    }
    if (room === 'rest') {
      const hurt = await ev(() => R.hp < R.maxHp);
      if (hurt) { await page.locator('#app .panel button').nth(0).click(); A.slept++; await until(() => screen === 'dive' && !R.room); return; }
      await page.locator('#app .panel button').nth(1).click(); await waitScreen('study');
      const ref = await ev(() => { const refs = [...new Set(R.deck.map(c => c.ref))].sort((a, b) => (sp(a).n * 4 + sp(a).tier) - (sp(b).n * 4 + sp(b).tier)); return refs[0]; });
      await page.locator(`#app button[onclick="studyVerse('${ref}')"]`).click(); await solveRecall(); A.studied++;
      await until(() => screen === 'dive' && !R.room); return;
    }
    if (room === 'truth') {
      for (let i = 0; i < 60; i++) {
        await tick(); const tf = await ev(() => R.tf && { q: R.tf.q, phase: R.tf.phase, ans: TRUTHS[R.tf.q].answer, result: R.tf.result, first: R.tf.first });
        if (!tf) return;
        if (tf.phase === 'ask') {
          const right = rng() < acc; right ? A.truthR++ : A.truthW++;
          const sayTrue = right ? tf.ans : !tf.ans;
          await page.locator('.tfbtns button').nth(sayTrue ? 0 : 1).click(); await page.waitForTimeout(40); continue;
        }
        const wasWrong = tf.phase === 'result' && tf.result === 'wrong';
        await dockPrimary(); if (wasWrong) return;   // free them the old way: a fight starts
        await page.waitForTimeout(60);
        if (!(await ev(() => R.room === 'truth'))) return;
      }
      throw new Stall('truth conversation never ended');
    }
    if (room === 'hurt') {
      for (let i = 0; i < 20; i++) {
        await tick(); const h = await ev(() => R.hurt && { phase: R.hurt.phase, hp: R.hp, max: R.maxHp });
        if (!h) return;
        if (h.phase === 'ask') {
          const help = h.hp > 6 && (h.hp - 6) >= 0.4 * h.max;
          if (help) { await dockPrimary(); A.helped++; } else { await page.locator('#app .dock button:not(.primary)').first().click(); A.walkedOn++; return; }
        } else await dockPrimary();
        await page.waitForTimeout(60);
        if (!(await ev(() => R.room === 'hurt'))) return;
      }
      throw new Stall('hurt-person conversation never ended');
    }
    if (room === 'verse') {
      const door = await ev(() => R.node.door.join(',')); A.doors[door] = (A.doors[door] || 0) + 1;
      const ref = await ev(() => { const refs = [...new Set(R.deck.map(c => c.ref))].sort((a, b) => blankCount(BY_REF[a]) - blankCount(BY_REF[b])); return refs[0]; });
      await page.locator(`#app .panel button[onclick="sayAtDoor('${ref}')"]`).click(); await solveRecall();
      if (A.doors[door] >= DOOR_TRIES && await ev(() => R.room === 'verse')) { await page.locator('#app .dock button').first().click(); A.skip.push(door); }
      return;
    }
    throw new Softlock(`unknown room '${room}'`);
  }

  // ---- one dive into cave i, until the boss is freed or we are beaten ----
  async function dive(att) {
    const fails = {};
    for (;;) {
      await tick(); await until(() => !document.getElementById('wipe').className);
      const st = await ev(() => ({ screen, modal: modal && modal.kind, room: R && R.room, node: !!(R && R.node) }));
      if (st.screen === 'cavedone') return 'cleared';
      if (st.screen === 'defeat') return 'defeat';
      if (st.modal === 'levelup') { await levelUp(); continue; }
      if (st.modal === 'recall') { await solveRecall(); continue; }
      if (st.modal === 'assembly') { await solveAssembly(); continue; }
      if (st.screen === 'fight') {
        const f = await fightLoop(); att.fights.push(f);
        if (f.result === 'defeat') { att.defeated = true; return 'defeat'; }
        await afterFight(); continue;
      }
      if (st.screen === 'reward') { await page.locator('#app .hand > div').first().click(); await until(() => screen !== 'reward'); continue; }
      if (st.screen === 'study') { await page.locator('#app button[onclick^="studyVerse"]').first().click(); await solveRecall(); continue; }
      if (st.screen !== 'dive') { await page.waitForTimeout(100); continue; }
      if (st.room) { await handleRoom(st.room, att); continue; }
      if (st.node) { await page.waitForTimeout(100); continue; }   // a fight is starting
      const skip = [...att.skip, ...Object.keys(fails).filter(k => fails[k] >= 3)];
      const plan = await mapState(skip);
      if (!plan.pick) throw new Softlock(`nothing left to do on the map: no marker, door, lever or unexplored edge is reachable, and the boss is not reachable (${plan.left} fight/truth marker(s) left, hero at ${plan.pos})`);
      const g = [plan.pick.x, plan.pick.y], key = g.join(',');
      try { await walkTo(g); } catch (e) { fails[key] = (fails[key] || 0) + 1; if (fails[key] >= 3) att.notes.push(`could not walk to ${plan.pick.k} at ${key}: ${e.message}`); await page.waitForTimeout(100); }
      const arrived = await ev(([x, y]) => screen === 'dive' && !R.room && !R.node && R.map.pos[0] === x && R.map.pos[1] === y, g);
      if (arrived && plan.pick.k !== 'boss door' && plan.pick.k !== 'verse door' && plan.pick.k !== 'unexplored' && plan.pick.k !== 'lever') fails[key] = (fails[key] || 0) + 1;   // standing on it, nothing happened
    }
  }

  // ---- town ----
  // shopper style: Forge visit. Buy the cheapest affordable plain gear we lack, then consecrate, until nothing more is affordable.
  async function shop(where) {
    if (style !== 'shopper' || !(await ev(() => !!P.town.forge))) return;
    const bought = [];
    for (let i = 0; i < 12; i++) {
      await ev(() => enterBuilding('forge')); await waitScreen('forge');
      const act = await ev(() => {
        const buy = PLAIN_ORDER.filter(id => ITEMS[id].price && !owns(id) && R.talents >= ITEMS[id].price).sort((a, b) => ITEMS[a].price - ITEMS[b].price)[0];
        if (buy) return { buy };
        const a = nextArmor(); if (a && owns(a.from) && R.talents >= a.price) return { cons: a.up, price: a.price };
        return null;
      });
      if (!act) break;
      if (act.buy) { await page.locator(`#app button[onclick="buy('${act.buy}')"]`).click(); bought.push(act.buy); await page.waitForTimeout(80); }
      else {
        await page.locator('#app button[onclick="consecrate()"]').click(); await solveRecall();
        const ok = await ev(id => owns(id) && has(id), act.cons); bought.push(act.cons + (ok ? '' : ' (recital failed)')); await page.waitForTimeout(80);
      }
    }
    if (bought.length) rec.purchases.push(`${where}: ${bought.join(', ')}`);
    await ev(() => goto('town')); await waitScreen('town');
  }
  async function restUp(cave) {
    const s = await ev(() => ({ hp: R.hp, max: R.maxHp, inn: !!P.town.inn, tal: R.talents }));
    if (s.hp >= s.max) return { rested: false };
    if (s.inn) {
      await ev(() => enterBuilding('inn')); await waitScreen('inn');
      await page.locator('#app .dock button.primary').first().click(); await page.waitForTimeout(100);
      return { rested: true, where: 'inn', spent: 0 };
    }
    await ev(() => goto('church')); await waitScreen('church');
    const b = page.locator('#app button[onclick*="R.talents-=5"]');
    if (await b.count() && !(await b.first().isDisabled())) { await b.first().click(); await page.waitForTimeout(100); return { rested: true, where: 'church', spent: 5 }; }
    return { rested: false, stuck: `hurt (${s.hp}/${s.max}) with ${s.tal} talents and no inn: cannot rest` };
  }
  async function startCave(i) {
    await ev(() => goto('church')); await waitScreen('church');
    await page.locator(`#app button[onclick="startCave(${i})"]`).click(); await page.waitForTimeout(700);
    if ((await ev(() => screen)) === 'church') { const d = await describe(); throw new Softlock(`could not start cave ${i}: still in the church (hp ${d.hp}); too hurt to descend?`); }
    await navigate('dive');
  }
  const snapshot = () => ev(() => ({ talents: R.talents, souls: R.souls, level: R.level, xp: R.xp, need: xpNeed(R.level), maxHp: R.maxHp, hp: R.hp, maxFocus: R.maxFocus, tree: { ...R.tree }, creed: P.creed,
    verses: [...new Set(R.deck.map(c => c.ref))].map(ref => `${spellLine(ref)} ${TIER_NAME[sp(ref).tier]}`), gear: Object.values(R.gear).filter(Boolean) }));

  // ================= the playthrough =================
  try {
    await page.goto(pathToFileURL(target).href);
    await page.evaluate(() => localStorage.clear()); await page.reload();
    await page.evaluate(() => { const o = defeat; defeat = function () { window.__defeats = (window.__defeats || 0) + 1; return o.apply(this, arguments); }; });
    await page.locator('#app button[onclick*="newGame"]').click(); await waitScreen('pro1');
    await navigate('intro');                                           // prologue: recall Psalm 119:11, Amos, the lid
    const hands = page.locator('#app .hand');
    await hands.nth(0).locator('.card').first().click(); await hands.nth(1).locator('.card').first().click();
    await page.locator('#app .dock button.primary').click(); await waitScreen('tutorial');
    await navigate('fight');                                           // the Furnace
    const tut = await fightLoop(); rec.tutorialTurns = tut.turns;
    await afterFight(); await navigate('town');                        // victory, Bram, Amos's tour
    const base = await ev(() => ({ forge: P.town.forge, done: P.tutorialDone, gift: owns(BRAM_GIFT) }));
    if (!base.forge || !base.done || !base.gift) rec.issues.push({ kind: 'STATE', msg: 'after the Furnace: ' + JSON.stringify(base) });

    for (let ci = 0; ci < 3; ci++) {
      const cave = { name: CAVE_NAMES[ci], attempts: [], cleared: false, earned: 0, startTal: 0 };
      rec.caves.push(cave);
      let tries = 0;
      while (!cave.cleared && tries <= MAX_RETRIES) {
        await shop(`before ${CAVE_NAMES[ci]}${tries ? ' (retry ' + tries + ')' : ''}`);
        const r = await restUp(ci);
        const startSnap = await snapshot();
        if (tries === 0) cave.startTal = startSnap.talents;
        const att = { n: tries + 1, fights: [], chests: [], truthR: 0, truthW: 0, helped: 0, walkedOn: 0, scraps: 0, slept: 0, studied: 0, doors: {}, skip: [], notes: [], defeated: false, ms: 0, startHp: startSnap.hp, spentRest: r.spent || 0, lost: 0, outcome: '' };
        cave.attempts.push(att); const t0 = Date.now(); if (r.stuck) att.notes.push(r.stuck);
        await startCave(ci);
        const out = await dive(att);
        att.ms = Date.now() - t0; att.outcome = out;
        if (out === 'defeat') { att.lost = await ev(() => R.lostTalents || 0); await navigate('town'); tries++; continue; }
        cave.cleared = true;
        await navigate('town');   // cavedone (and a chapterend screen, if the build has one) lead back to town
      }
      const snap = await snapshot(); cave.end = snap;
      cave.earned = snap.talents - cave.startTal + cave.attempts.reduce((a, x) => a + x.lost + x.spentRest, 0);
      if (!cave.cleared) { rec.outcome = `blocked at ${cave.name}: beaten ${cave.attempts.length} times`; break; }
    }
    if (rec.caves.length === 3 && rec.caves[2].cleared) { rec.outcome = 'cleared all three caves'; }
    rec.final = await snapshot();
    rec.final.caves = await ev(() => ({ ...P.caves })); rec.final.town = await ev(() => ({ ...P.town }));
  } catch (e) {
    const kind = e instanceof Stall ? 'STALL' : e instanceof Softlock ? 'SOFTLOCK' : 'BOT ERROR';
    const state = await describe();
    rec.issues.push({ kind, msg: e.message.split('\n')[0] + (kind === 'BOT ERROR' ? ' @ ' + (e.stack || '').split('\n').filter(l => l.includes('playtest.mjs')).slice(0, 3).map(l => l.trim().replace(/^at /, '').replace(/\(.*[\\/]/, '(')).join(' < ') : ''), state, shot: await shot(kind.toLowerCase().replace(' ', '-')) });
    rec.outcome = `${kind}: ${e.message.split('\n')[0]}`;
    try { rec.final = await snapshot(); } catch {}
  }
  rec.ms = Date.now() - started;
  await browser.close();
  return rec;
}

// ================= the report =================
const TARGETS = [
  [0.5, 'fails', r => !r.allCleared],
  [0.6, 'fails', r => !r.allCleared],
  [0.7, 'gets through on low health, with close calls (some fights below 25% HP)', r => r.allCleared && r.risk.close > 0],
  [0.85, 'fairly comfortable (cleared, at most 1 defeat, under 10% close calls)', r => r.allCleared && r.risk.defeats <= 1 && r.risk.closeShare < 0.1],
  [0.95, 'reference: should win, but not trivially (cleared, and some fight dipped below 50% HP)', r => r.allCleared && r.risk.worst < 0.5],
];
function risk(r) {
  const fights = r.caves.flatMap(c => c.attempts.flatMap(a => a.fights));
  const mins = fights.map(f => f.minPct ?? 1), close = mins.filter(m => m < 0.25).length;
  return { n: fights.length, close, closeShare: fights.length ? close / fights.length : 0, avgMin: mean(mins), worst: mins.length ? Math.min(...mins) : 1,
    defeats: r.caves.reduce((a, c) => a + c.attempts.filter(x => x.defeated).length, 0) };
}
const pct = x => `${Math.round(x * 100)}%`;
function report(runs) {
  const L = [];
  const p = s => L.push(s);
  runs.forEach(r => { r.allCleared = r.caves.length === 3 && r.caves.every(c => c.cleared); r.risk = risk(r); r.target = TARGETS.find(t => t[0] === r.acc); r.met = r.target ? r.target[2](r) : null; });
  p(`# Playtest: Philadelphia (${new Date().toISOString().slice(0, 16).replace('T', ' ')})`);
  p('');
  p(`Bot: recall accuracy per blank / Creed piece / truth question / Ephesians recital; reduced-motion emulation, so times are the bot's own wall time. A cave is abandoned after ${MAX_RETRIES + 1} defeats ("failed at <cave>").`);
  p('Fights are played as: best affordable unsaid verse (heal under 50% HP), else Brace; no Charge. "Lowest HP" is the minimum HP as a % of max seen during a fight; a "close call" is a fight whose lowest HP was under 25% (a defeat counts).');
  p('');
  p('## Targets'); p('');
  p('| Accuracy | Target |'); p('|---|---|');
  TARGETS.forEach(t => p(`| ${Math.round(t[0] * 100)}% | ${t[1]} |`));
  p('');
  p('## Summary'); p('');
  p('| Accuracy | Style | Result | Met target? | Defeats (per cave) | Fights | Close calls | Avg lowest HP | Worst lowest HP | Level / souls | Talents held | Gear pieces worn | Stalls & errors | Time |');
  p('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const r of runs) {
    const k = r.risk, dpc = r.caves.map(c => c.attempts.filter(a => a.defeated).length).join('/') || '-';
    const failedAt = r.caves.find(c => !c.cleared);
    const res = r.issues.length ? 'FAIL: ' + r.issues[0].kind : r.allCleared ? 'cleared' : failedAt ? `failed at ${failedAt.name}` : r.outcome;
    p(`| ${r.acc} | ${r.style} | ${res} | ${r.met === null ? '-' : r.met ? 'yes' : 'NO'} | ${k.defeats} (${dpc}) | ${k.n} | ${k.close} (${pct(k.closeShare)}) | ${pct(k.avgMin)} | ${pct(k.worst)} | ${r.final ? `${r.final.level} / ${r.final.souls}` : '-'} | ${r.final ? r.final.talents : '-'} | ${r.final ? r.final.gear.length : '-'} | ${r.issues.length + r.errors.length} | ${mmss(r.ms)} |`);
  }
  p(''); p('## Frugal vs shopper'); p('');
  for (const a of [...new Set(runs.map(r => r.acc))]) {
    const f = runs.find(r => r.acc === a && r.style === 'frugal'), s = runs.find(r => r.acc === a && r.style === 'shopper');
    if (!f || !s) continue;
    const d = r => `${r.allCleared ? 'cleared' : 'failed at ' + (r.caves.find(c => !c.cleared) || { name: '?' }).name}, ${r.risk.defeats} defeats, ${r.risk.close}/${r.risk.n} close calls, avg lowest HP ${pct(r.risk.avgMin)}`;
    p(`- ${a}: frugal ${d(f)}; shopper ${d(s)}.  Gear changed: ${s.allCleared !== f.allCleared ? 'the outcome' : s.risk.defeats !== f.risk.defeats || Math.abs(s.risk.avgMin - f.risk.avgMin) > 0.05 ? `the danger (defeats ${f.risk.defeats} -> ${s.risk.defeats}, avg lowest HP ${pct(f.risk.avgMin)} -> ${pct(s.risk.avgMin)})` : 'little or nothing'}.`);
  }
  for (const r of runs) {
    p(''); p(`## Accuracy ${r.acc}, ${r.style}`); p('');
    const n = r.blanks.right + r.blanks.wrong;
    p(`Outcome: ${r.outcome}. Target: ${r.target ? r.target[1] : '-'} -> ${r.met === null ? '-' : r.met ? 'met' : 'NOT met'}. Realized recall accuracy ${n ? (100 * r.blanks.right / n).toFixed(1) : '-'}% over ${n} blanks. Furnace ${r.tutorialTurns} turns${r.tutorialDefeats ? ` (${r.tutorialDefeats} restarts)` : ''}. Fruit picks ${r.levelups || 0}.`);
    if (r.purchases.length) p(`Purchases: ${r.purchases.join('; ')}.`);
    p('');
    if (r.caves.length) {
      p('| Cave | Tries | Defeats | Fights won | Turns/fight (avg, min-max) | HP at fight end (avg, min) | Lowest HP in fight (avg, worst) | Close calls | Boss turns / lowest HP | Talents earned / held | Souls (Lvl) | Truths right/wrong | Helped (walked on) | Chests ok/fail | Time |');
      p('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
      for (const c of r.caves) {
        const A = c.attempts, all = A.flatMap(a => a.fights), fights = all.filter(f => f.result === 'won'), reg = fights.filter(f => !f.boss), boss = fights.filter(f => f.boss).slice(-1)[0];
        const turns = reg.map(f => f.turns), hps = reg.map(f => f.hpEnd), mins = all.map(f => f.minPct ?? 1), sum = k => A.reduce((a, x) => a + x[k], 0), ch = A.flatMap(a => a.chests);
        p(`| ${c.name}${c.cleared ? '' : ' (NOT cleared)'} | ${A.length} | ${A.filter(a => a.defeated).length} | ${reg.length}${boss ? ' + boss' : ''} | ${turns.length ? `${f1(mean(turns))} (${Math.min(...turns)}-${Math.max(...turns)})` : '-'} | ${hps.length ? `${f1(mean(hps))}, ${Math.min(...hps)}` : '-'} | ${mins.length ? `${pct(mean(mins))}, ${pct(Math.min(...mins))}` : '-'} | ${mins.filter(m => m < 0.25).length}/${mins.length} | ${boss ? `${boss.turns} / ${pct(boss.minPct)}` : '-'} | ${c.end ? `${c.earned} / ${c.end.talents}` : '-'} | ${c.end ? `${c.end.souls} (${c.end.level})` : '-'} | ${sum('truthR')}/${sum('truthW')} | ${sum('helped')} (${sum('walkedOn')}) | ${ch.filter(x => x.ok).length}/${ch.filter(x => !x.ok).length} | ${mmss(sum('ms'))} |`);
      }
      p('');
      for (const c of r.caves) {
        for (const a of c.attempts) {
          const doors = Object.entries(a.doors).map(([k, v]) => `${k}: ${v} tr${v > 1 ? 'ies' : 'y'}`).join(', ');
          p(`- ${c.name}, try ${a.n}: ${a.outcome}${a.defeated ? ` (lost ${a.lost} talents)` : ''}; start HP ${a.startHp}; scraps ${a.scraps}, slept ${a.slept}, studied ${a.studied}${doors ? `, verse door ${doors}` : ''}.`);
          p(`  fights: ${a.fights.map(f => `${f.names.join('+')}${f.boss ? ' [boss]' : ''} ${f.result === 'won' ? `${f.turns}t, HP ${f.hpStart}->${f.hpEnd}, low ${pct(f.minPct)}, slips ${f.slips}/${f.casts}` : `LOST after ${f.turns}t`}`).join('; ') || 'none'}`);
          if (a.chests.length) p(`  chests: ${a.chests.map(x => `tier ${x.tier} ${x.ok ? `+${x.talents}` : 'held shut'}`).join(', ')}`);
          a.notes.forEach(t => p(`  note: ${t}`));
        }
        if (c.end) { p(`  ${c.name} end: level ${c.end.level}, HP ${c.end.hp}/${c.end.maxHp}, focus ${c.end.maxFocus}, tree ${JSON.stringify(c.end.tree)}, creed ${c.end.creed}/8, gear ${c.end.gear.join(', ')}`); p(`  verses: ${c.end.verses.join('; ')}`); }
      }
    }
  }
  p(''); p('## Stalls, softlocks and errors'); p('');
  const issues = runs.flatMap(r => r.issues.map(i => ({ ...i, acc: r.acc, style: r.style })));
  if (!issues.length) p('None.');
  issues.forEach(i => { p(`- **${i.kind}** at accuracy ${i.acc} (${i.style}): ${i.msg}${i.shot ? ` (screenshot: ${i.shot.replace(process.cwd() + '/', '')})` : ''}`); if (i.state) p('  state: `' + JSON.stringify(i.state) + '`'); });
  return L.join('\n');
}

const jobs = ACCS.flatMap(a => STYLES.map(s => [a, s]));
const runs = new Array(jobs.length);
let next = 0;
await Promise.all(Array.from({ length: Math.min(JOBS, jobs.length) }, async () => {
  while (next < jobs.length) {
    const i = next++, [a, s] = jobs[i];
    console.log(`start ${a} ${s}`);
    const r = await playOne(a, s); runs[i] = r;
    console.log(`done  ${a} ${s}: ${r.outcome} (${mmss(r.ms)}, ${r.issues.length} issue(s))`);
  }
}));
const md = report(runs);
writeFileSync(`${OUT}/playtest.md`, md + '\n');
console.log('\n' + md);
console.log(`\nreport: ${OUT}/playtest.md`);
const bad = runs.some(r => r.issues.length || r.errors.length);
if (bad) { console.log('PLAYTEST FAILED'); process.exit(1); }
console.log('PLAYTEST PASSED');
