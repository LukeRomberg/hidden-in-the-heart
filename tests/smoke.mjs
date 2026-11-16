// Headless click-through: title -> New game -> prologue -> wake on the town map, bump into Bram, walk to the church ->
// Amos, the lid, pick two verses -> walk out to Bram and fight the Furnace (tutorial) -> Amos's tour on the map ->
// walk into the Forge and out, a boarded door, reload on the town map -> walk to the Hollow's mouth -> the Hollow's map: walk to the first fight and win it, open a chest, say a verse at the
// truth villager on the battle screen (Amos's first), verse door, pull the lever, bump the boss door -> reload and resume on the map -> move the save to a fresh browser
// -> in test mode: walk into a townsperson at home, then the finale (the bell, everyone walks to church) into the chapter ending.
// Fails on any console error or page error.
// Usage: node tests/smoke.mjs [path/to/index.html]   (default: dist/index.html; npm run smoke builds first)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const target = resolve(process.argv[2] || 'dist/index.html');
const shots = resolve('tests/out'); mkdirSync(shots, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.addInitScript(() => { window.__FAST = true; });   // the fights' pauses for reading (combat.js TURN_BEAT) shrink to a blink
const errors = [], warnings = [], netFails = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); else if (m.type() === 'warning') warnings.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('requestfailed', r => netFails.push(`${r.url()} (${r.failure()?.errorText})`));
page.on('dialog', d => d.accept());

const steps = [];
const step = async (name, fn) => {
  try { await fn(); steps.push(`ok   ${name}`); }
  catch (e) { steps.push(`FAIL ${name}: ${e.message.split('\n')[0]}`); await page.screenshot({ path: `${shots}/fail.png` }); throw e; }
  await page.screenshot({ path: `${shots}/${String(steps.length).padStart(2, '0')}-${name.replace(/\W+/g, '_')}.png` });
};
const screen = () => page.evaluate(() => screen);
const waitScreen = s => page.waitForFunction(x => screen === x && !document.getElementById('wipe').className, s, { timeout: 5000 });
const btn = text => page.locator('#app button', { hasText: text }).first();
// the main button under a scene's dialogue, whatever it says (so rewording text.js doesn't break the test)
const act = () => page.locator('#acts button').first();

// Tap through a dialogue box until its action buttons are revealed.
async function finishDialogue() {
  for (let i = 0; i < 60; i++) {   // two taps a line (finish typing, then next), so this covers ~30 lines
    if (!(await page.locator('#acts.hide').count()) && !(await page.evaluate(() => TW.typing))) return;
    await page.locator('.dlg').first().click(); await page.waitForTimeout(60);
  }
  throw new Error('dialogue never finished');
}

// Tap OK on any “you got…” popups (rewards.js) that are showing, one at a time.
async function dismissRewards() {
  for (let i = 0; i < 10 && await page.evaluate(() => modal && modal.kind === 'reward'); i++) { await page.locator('.overlay.reward button').click(); await page.waitForTimeout(80); }
}
// Answer an open recall modal correctly by clicking the right option / typing first letters.
async function solveRecall() {
  await page.waitForSelector('.overlay');
  for (let i = 0; i < 300; i++) {
    const st = await page.evaluate(() => {
      if (!modal || modal.kind !== 'recall') return { gone: true };
      const c = modal.c; if (c.done) return { done: true };
      const o = c.toks[c.order[c.cur]]; return { mode: o.mode, ans: o.ans, at: o.opts ? o.opts.indexOf(o.ans) : -1 };
    });
    if (st.gone) return;
    if (st.done) { await page.locator('.overlay button', { hasText: 'Continue' }).click(); return; }
    if (st.mode === 'letter') await page.locator('#ans').pressSequentially(st.ans);
    else await page.locator('.overlay .opts button').nth(st.at).click();   // by position: a choice shows the word as spelled (self-control), the answer is its key (selfcontrol)
  }
  throw new Error('recall never finished');
}


// Play cards (answering correctly) until the fight is won.
async function winFight() {
  for (let turn = 0; turn < 80; turn++) {
    const s = await page.evaluate(() => ({ after: R.after, screen, asm: modal && modal.kind === 'assembly', tip: modal && modal.kind === 'tip' }));
    if (s.after || s.screen !== 'fight') break;
    if (s.tip) { await page.locator('.overlay.tip button').click(); continue; }   // the tutorial stops to teach a rule
    if (s.asm) {   // a fire went out: tap the Galatians pieces in order
      while (await page.evaluate(() => modal && modal.kind === 'assembly')) {
        const i = await page.evaluate(() => modal.order.indexOf(modal.next));
        await page.locator('.overlay .chip').nth(i).click();
      }
      await page.waitForFunction(() => !R.busy, null, { timeout: 15000 }); continue;
    }
    const card = page.locator('#app .hand .card:not(.dim):not(.spent)').first();
    if (await card.count()) {
      await card.click();
      const tip = await page.evaluate(() => modal && modal.kind === 'tip' ? modal.key : null);
      if (tip) await page.locator('.overlay.tip button').click();
      if (tip && tip !== 'recall') continue;   // a popup that was due took the tap: choose again
      await solveRecall();   // (Amos's 'recall' popup opens the recall when it closes)
    }
    else await btn('Brace').click();
    await page.waitForFunction(() => !R.busy, null, { timeout: 15000 });
  }
  await page.waitForFunction(() => R.after, null, { timeout: 15000 });
  await dismissRewards();   // a verse that leveled up during the fight
  await page.evaluate(() => { if (modal && modal.kind === 'levelup') closeLevelUp(); });
}

// ---- Walking maps (caves and the town): walking is done by tapping the screen, like a player ----
// tile [x,y] of the first map glyph g (S, D, V, L, a marker digit…) in the current cave
const findGlyph = g => page.evaluate(g => { const m = caveMap(R.cave); for (let y = 0; y < m.H; y++) { const x = m.rows[y].indexOf(g); if (x >= 0) return [x, y]; } return null; }, g);
// a marker on the town map: spot('door', 'forge'), spot('cave', 0), spot('npc', 'furnace'), spot('road')
const spot = (t, id) => page.evaluate(([t, id]) => townSpot(t, id), [t, id]);
const mapIdle = () => page.waitForFunction(() => !document.getElementById('wipe').className && !(PLACES[screen] && PLACES[screen].st().walking), null, { timeout: 15000 });
// Walk to a tile (or up to a closed door, which also taps it). Each tap goes to the furthest tile of the real route
// that is already lit or remembered and on screen, so fog and the tap-to-walk path are exercised for real.
async function walkTo(goal) {
  let tappedGoal = false;   // the last tap was on the goal itself, not just the nearest tile on screen
  for (let i = 0; i < 80; i++) {
    await mapIdle(); await dismissRewards();   // a sermon note picked up on the way
    const s = await page.evaluate(([[gx, gy], tapped]) => {
      const pl = PLACES[screen]; if (!pl || pl.busy() || modal) return { stop: true };
      const M = pl.st(), [hx, hy] = M.pos; if (hx === gx && hy === gy) return { stop: true };
      if (tapped && pl.mark(gx, gy) && Math.abs(hx - gx) + Math.abs(hy - gy) === 1) return { stop: true };   // walked into it and stayed (a boarded door)
      const m = pl.grid(), prev = new Map([[hx + ',' + hy, null]]), q = [[hx, hy]];
      while (q.length) { const [x, y] = q.shift(); if (x === gx && y === gy) break; if ((x !== hx || y !== hy) && !pl.walkable(x, y)) continue;
        for (const [a, b] of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) { if (prev.has(a + ',' + b) || (!pl.walkable(a, b) && !(a === gx && b === gy) && !pl.mark(a, b))) continue; prev.set(a + ',' + b, [x, y]); q.push([a, b]); } }
      if (!prev.has(gx + ',' + gy)) return { err: 'no route' };
      const path = []; for (let p = [gx, gy]; p; p = prev.get(p.join(','))) path.unshift(p);
      const r = document.getElementById('cmap').getBoundingClientRect(), v = document.querySelector('.cave-view').getBoundingClientRect();
      let best = null;
      path.slice(1).forEach(([x, y]) => { const sx = r.left + x * 40 + 20, sy = r.top + y * 40 + 20;
        if (M.seen[y * m.W + x] && sx > v.left + 4 && sx < v.right - 4 && sy > v.top + 4 && sy < v.bottom - 4) best = { sx, sy, x, y }; });
      return best ? { best } : { err: 'nothing on the route is lit' };
    }, [goal, tappedGoal]);
    if (s.stop) return;
    if (s.err) throw new Error(`walking to ${goal}: ${s.err}`);
    await page.mouse.click(s.best.sx, s.best.sy); await page.waitForTimeout(50);
    tappedGoal = s.best.x === goal[0] && s.best.y === goal[1];
    if (s.best.x === goal[0] && s.best.y === goal[1] && await page.evaluate(([x, y]) => here().closed(x, y), goal)) { await mapIdle(); return; }   // tapped a shut door
  }
  throw new Error(`never got to ${goal}`);
}

let result = 'pass';
try {
  await step('load title', async () => {
    await page.goto(pathToFileURL(target).href);
    await page.evaluate(() => localStorage.clear()); await page.reload();
    await btn('New game').waitFor();
  });
  await step('new game -> pro1', async () => { await btn('New game').click(); await waitScreen('pro1'); });
  await step('pro1 recall Psalm 119:11', async () => {
    await finishDialogue(); await act().click(); await solveRecall(); await waitScreen('pro2');
  });
  await step('pro2: wake in the square', async () => {
    await finishDialogue(); await act().click(); await waitScreen('town');
    const s = await page.evaluate(() => ({ hud: !!document.querySelector('.hud'), bram: !!townMark(...townSpot('npc', 'furnace')), amos: !!townMark(...townSpot('npc', 'priest')) }));
    if (s.hud || !s.bram || s.amos) throw new Error('waking in the square: ' + JSON.stringify(s));
  });
  await step('town: Bram drives you back', async () => {
    await walkTo(await spot('npc', 'furnace')); await page.waitForSelector('#talkpop');
    await finishDialogue(); await act().click(); await mapIdle();
    if (await page.evaluate(() => screen !== 'town' || !!modal)) throw new Error('walking into Bram unarmed should only talk');
  });
  await step('town: walk to the church', async () => { await walkTo(await spot('door', 'church')); await waitScreen('pro3'); });
  await step('pro3', async () => { await finishDialogue(); await act().click(); await waitScreen('pro4'); });
  await step('pro4', async () => { await finishDialogue(); await act().click(); await waitScreen('intro'); });
  await step('pick two verses', async () => {
    const hands = page.locator('#app .hand');
    await hands.nth(0).locator('.card').first().click();
    await hands.nth(1).locator('.card').first().click();
    await btn('Those two').click(); await waitScreen('tutorial');
  });
  await step('town: out to the well with Amos', async () => {
    await finishDialogue(); await act().click(); await waitScreen('town');
    if (!(await page.locator('#camos').count())) throw new Error('Amos is not walking with you');
    if (await page.locator('.tabs').count()) throw new Error('the tab bar shows before Bram is free');
    await walkTo(await spot('npc', 'furnace')); await page.waitForSelector('#talkpop');
    await finishDialogue(); await act().click(); await waitScreen('fight');
  });
  await step('tutorial: the Furnace', async () => {
    await page.waitForSelector('.overlay.tip', { timeout: 5000 }).catch(() => { throw new Error('no tutorial popup shown'); });
    if (!(await page.evaluate(() => R.boss && R.enemies[0].id === 'furnace'))) throw new Error('the tutorial is not the Furnace');
    await winFight();
    await page.evaluate(() => TEXT.afterFight.afterBoss).then(t => btn(t).click()); await waitScreen('victory');
    await dismissRewards();
    if (await page.locator('.overlay.levelup').count()) await page.locator('.overlay .lvopt').first().click();   // grow a fruit
    await page.locator('.dock button').first().click(); await waitScreen('tutend');
    await finishDialogue(); await act().click(); await waitScreen('town');
    const s = await page.evaluate(() => ({ forge: P.town.forge, done: P.tutorialDone, gift: owns(BRAM_GIFT), romans: R.deck.some(c => c.ref === 'Romans 12:2') }));
    if (!s.forge || !s.done || !s.gift || !s.romans) throw new Error('after the Furnace: ' + JSON.stringify(s));
  });
  await step('town: Amos’s tour', async () => {
    const stops = [];
    for (let i = 0; i < 400 && await page.evaluate(() => !!R.tour); i++) {
      if (await page.locator('#talkpop').count()) { stops.push(await page.evaluate(() => R.tmap.pos.join(','))); await finishDialogue(); await act().click(); }
      await page.waitForTimeout(60);
    }
    const s = await page.evaluate(() => ({ tour: !!R.tour, toured: P.toured, amos: !!townMark(...townSpot('npc', 'priest')), follow: !!document.getElementById('camos') }));
    const want = await page.evaluate(() => TEXT.tour.stops.length);
    if (!(await page.locator('.tabs').count())) throw new Error('no tab bar on the town map after the Furnace');
    if (s.tour || !s.toured || !s.amos || s.follow || new Set(stops).size !== want) throw new Error('after the tour: ' + JSON.stringify({ ...s, stops }));
  });
  await step('town: in and out of the Forge', async () => {
    const door = await spot('door', 'forge');
    await walkTo(door); await waitScreen('forge');
    await page.evaluate(() => { if (modal && modal.kind === 'tip') closeTip(); });   // Bram's one-time popup
    await page.locator('#app .dock button', { hasText: 'Back' }).click(); await waitScreen('town');
    const pos = await page.evaluate(() => R.tmap.pos);
    if (Math.abs(pos[0] - door[0]) + Math.abs(pos[1] - door[1]) !== 1) throw new Error(`back from the Forge at ${pos}, not by its door ${door}`);
  });
  await step('town: a boarded door', async () => {
    await walkTo(await spot('door', 'inn')); await mapIdle();
    const s = await page.evaluate(() => ({ screen, msg: R.tmap.msg, want: TEXT.town.boarded.inn }));
    if (s.screen !== 'town' || s.msg !== s.want) throw new Error('the boarded inn: ' + JSON.stringify(s));
  });
  await step('town: a boarded cottage', async () => {
    await walkTo(await spot('door', 'house:baker')); await mapIdle();
    const s = await page.evaluate(() => ({ screen, msg: R.tmap.msg, want: TEXT.townMap.homes.baker.shut }));
    if (s.screen !== 'town' || s.msg !== s.want) throw new Error('the baker’s boarded door: ' + JSON.stringify(s));
  });
  await step('town: reload puts you back on the map', async () => {
    const before = await page.evaluate(() => R.tmap.pos.join(','));
    await page.reload(); await btn('Continue').click(); await waitScreen('town');
    const after = await page.evaluate(() => R.tmap.pos.join(','));
    if (after !== before) throw new Error(`town position ${before} -> ${after} across a reload`);
  });
  await step('town: walk into the Hollow', async () => {
    await walkTo(await spot('cave', 0)); await waitScreen('caveintro');
    await finishDialogue(); await act().click(); await waitScreen('dive');
  });
  await step('walk to the first fight', async () => {
    const start = await page.evaluate(() => R.map.pos.join(','));
    await walkTo(await findGlyph('1')); await waitScreen('fight');
    const hero = await page.evaluate(() => R.map.pos.join(','));
    if (hero === start) throw new Error('never left the start');
  });
  await step('fight', async () => {
    await winFight();
    const who = await page.evaluate(() => R.enemies.map(e => e.villager ? 'villager' : e.id));
    if (!who.every(w => w === 'villager')) throw new Error('expected rescued villagers, got ' + who);
    await page.locator('#app button[onclick*="clearColumn"]').click(); await waitScreen('dive');
    const f = await findGlyph('1');
    if (await page.evaluate(f => !!markAt(...f), f)) throw new Error('the fight is still on the map');
  });
  await step('open a chest', async () => {
    const creed = await page.evaluate(() => P.creed);
    await walkTo(await findGlyph('3')); await page.waitForFunction(() => R.room === 'lock');
    await btn('Open it').click();
    while (await page.evaluate(() => modal && modal.kind === 'assembly')) {
      const i = await page.evaluate(() => modal.order.indexOf(modal.next)); await page.locator('.overlay .chip').nth(i).click();
    }
    await waitScreen('dive');
    if (!(await page.evaluate(() => modal && modal.kind === 'reward' && modal.r.kind === 'chest'))) throw new Error('no reward popup after the chest');
    await dismissRewards();
    const after = await page.evaluate(([c, x, y]) => ({ creed: P.creed === c + 1, gone: !markAt(x, y) }), [creed, ...await findGlyph('3')]);
    if (!after.creed || !after.gone) throw new Error('after the chest: ' + JSON.stringify(after));
  });
  await step('true/false villager, with Amos, in the arena', async () => {
    const t = await findGlyph('t');
    await walkTo(t); await waitScreen('meet');
    // Amos's popups: tap through their lines and OK until the game reaches `pred`
    const talkUntil = async pred => {
      for (let i = 0; i < 200; i++) {
        if (await page.evaluate(pred)) return;
        if (await page.evaluate(() => modal && modal.kind === 'talk')) {
          if (await page.locator('.talkpop #acts:not(.hide) button').count()) await page.locator('.talkpop #acts button').click();
          else await page.locator('.talkpop .dlg').click();
        }
        await page.waitForTimeout(60);
      }
      throw new Error('stuck in Amos’s popups: ' + JSON.stringify(await page.evaluate(() => ({ tf: R.tf, busy: R.busy, modal: modal && modal.kind }))));
    };
    const asking = () => R.tf && R.tf.phase === 'ask' && !R.busy && !modal;
    await talkUntil(asking);   // Amos arrives, Amos answers the first
    const s0 = await page.evaluate(() => ({ amos: !!document.querySelector('#arena .amosin'), held: !!document.querySelector('#en0 .sprite.held'), q: R.tf.q }));
    if (!s0.amos || !s0.held) throw new Error('arena at the question: ' + JSON.stringify(s0));
    const ans = await page.evaluate(() => TRUTHS[R.tf.q].answer);
    const tf = t => page.locator('.dock .tfbtns button', { hasText: t });
    await tf(ans ? 'False' : 'True').click();   // a wrong answer: Amos points you back
    await page.waitForFunction(() => modal && modal.kind === 'talk'); await talkUntil(asking);
    await tf(ans ? 'True' : 'False').click();   // right: freed, then Amos goes back up
    await talkUntil(() => R.tf && R.tf.result === 'right' && !R.busy && !modal);
    if (!(await page.evaluate(() => R.enemies[0].freed && !document.querySelector('#arena .amosin')))) throw new Error('after the right answer: not freed, or Amos still there');
    await page.locator('.dock button', { hasText: 'Go on' }).click(); await waitScreen('dive'); await mapIdle();
    const st = await page.evaluate(t => ({ room: R.room, first: P.firstTruth, gone: !markAt(...t), right: (P.truthsRight || []).length }), t);
    if (st.room || !st.first || !st.gone || !st.right) throw new Error('after the truth: ' + JSON.stringify(st));
  });
  await step('verse door', async () => {
    const v = await findGlyph('V');
    await walkTo(v); await page.waitForFunction(() => R.room === 'verse');
    await page.locator('#app .panel button').first().click(); await solveRecall(); await mapIdle();
    if (!(await page.evaluate(v => isOpen(...v), v))) throw new Error('the verse door stayed shut after a perfect recital');
  });
  await step('lever opens the gate', async () => {
    await walkTo(await findGlyph('L'));
    if (await page.evaluate(g => closedAt(...g), await findGlyph('G'))) throw new Error('the gate is still shut');
  });
  await step('boss door stays barred', async () => {
    const d = await findGlyph('D');
    const doorMsg = () => page.evaluate(() => R.map.msg === fill(TEXT.dive.bossDoorShut, { n: fightsLeft() }));
    for (let i = 0; i < 4 && !(await doorMsg()); i++) await walkTo(d);   // you stop to look at anything new on the way
    const s = await page.evaluate(d => ({ shut: closedAt(...d), msg: R.map.msg, want: fill(TEXT.dive.bossDoorShut, { n: fightsLeft() }), left: fightsLeft() }), d);
    if (!s.shut || s.msg !== s.want || !s.left) throw new Error('boss door with fights left: ' + JSON.stringify(s));
  });
  await step('reload resumes on the map', async () => {
    const before = await page.evaluate(() => JSON.stringify({ pos: R.map.pos, done: R.map.done, open: R.map.open, seen: R.map.seen.join('') }));
    await page.reload(); await btn('Continue').click(); await waitScreen('dive');
    const after = await page.evaluate(() => JSON.stringify({ pos: R.map.pos, done: R.map.done, open: R.map.open, seen: R.map.seen.join('') }));
    if (after !== before) throw new Error('the map changed across a reload');
  });
  await step('move save to a fresh browser', async () => {
    const before = await page.evaluate(() => { saveHero(); return { deck: R.deck.length, forge: !!P.town.forge, level: R.level }; });
    await page.evaluate(() => goto('title')); await waitScreen('title');
    await btn('Move your save').click(); await waitScreen('saves');
    await btn('Copy save code').click();
    const code = await page.locator('#savecode').inputValue();
    if (!code.startsWith('HITH1.')) throw new Error('no save code shown');
    await page.evaluate(() => localStorage.clear()); await page.reload();
    if (await btn('Continue').count()) throw new Error('save survived clearing storage');
    await btn('Move your save').click(); await waitScreen('saves');
    await page.locator('#loadcode').fill('HITH1.not-a-real-save'); await btn('Load save').click();
    if (await page.evaluate(() => !!P.hero)) throw new Error('accepted a broken code');
    await page.locator('#loadcode').fill(code); await btn('Load save').click();
    await page.waitForLoadState('load'); await btn('Continue').waitFor();
    await btn('Continue').click();
    const after = await page.evaluate(() => ({ deck: R.deck.length, forge: !!P.town.forge, level: R.level }));
    if (JSON.stringify(after) !== JSON.stringify(before)) throw new Error(`save changed in transit: ${JSON.stringify(before)} -> ${JSON.stringify(after)}`);
  });
  // the rest runs in test mode (?test, its own save): the town with people home, and the finale
  await step('test mode: someone home, walk into them', async () => {
    await page.goto(pathToFileURL(target).href + '?test'); await page.waitForTimeout(300);
    await page.evaluate(() => testJump(TEST_JUMPS.findIndex(j => j[0].startsWith('Town map, a few folk'))));
    await waitScreen('town'); await page.waitForFunction(() => R.folk && R.folk.length === 5 && document.querySelectorAll('.tfolk').length === 5);
    await page.evaluate(() => { R.folk.forEach(f => clearTimeout(f.t)); clearInterval(folkTimer); folkTimer = null; });   // hold still for the test
    const f = await page.evaluate(() => R.folk.find(f => f.look === 'washer').pos);
    await walkTo(f);
    const s = await page.evaluate(() => ({ modal: modal && modal.kind, key: modal && modal.key }));
    if (s.modal !== 'talk' || s.key !== 'home-washer') throw new Error('walking into Ruth: ' + JSON.stringify(s));
    await finishDialogue(); await page.locator('#talkpop #acts button').first().click();
  });
  await step('test mode: the finale, everyone to church', async () => {
    await page.evaluate(() => testJump(TEST_JUMPS.findIndex(j => j[0].startsWith('Finale'))));
    for (let i = 0; i < 200; i++) {
      const s = await page.evaluate(() => ({ screen, talk: modal && modal.kind === 'talk', stage: R.finale && R.finale.stage, line: R.finale && R.finale.walkers && R.finale.walkers.filter(w => w.out).length }));
      if (s.screen === 'chapterend') return;
      if (s.talk) { await finishDialogue(); await page.locator('#talkpop #acts button').first().click(); }
      if (s.stage === 'march' && s.line < 14) throw new Error(`only ${s.line} of 14 in the line to church`);
      await page.waitForTimeout(100);
    }
    throw new Error('never got into the church');
  });
} catch { result = 'fail'; }

await browser.close();
console.log(`target: ${target}`);
console.log(steps.join('\n'));
if (netFails.length) console.log('network failures (not counted):\n  ' + netFails.join('\n  '));
if (warnings.length) console.log('console warnings:\n  ' + warnings.join('\n  '));
console.log(errors.length ? 'console errors:\n  ' + errors.join('\n  ') : 'console errors: none');
console.log(`screenshots: ${shots}`);
if (result === 'fail' || errors.length) { console.log('SMOKE FAILED'); process.exit(1); }
console.log('SMOKE PASSED');
