// Headless click-through: title -> New game -> prologue -> pick two verses -> the Furnace (tutorial) ->
// Bram -> town -> church -> the Hollow's map: walk to the first fight and win it, open a chest, say a verse at the
// truth villager (Amos's first), verse door, pull the lever, bump the boss door -> reload and resume on the map -> move the save to a fresh browser.
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
  for (let i = 0; i < 20; i++) {
    if (!(await page.locator('#acts.hide').count()) && !(await page.evaluate(() => TW.typing))) return;
    await page.locator('.dlg').first().click(); await page.waitForTimeout(60);
  }
  throw new Error('dialogue never finished');
}

// Answer an open recall modal correctly by clicking the right option / typing first letters.
async function solveRecall() {
  await page.waitForSelector('.overlay');
  for (let i = 0; i < 300; i++) {
    const st = await page.evaluate(() => {
      if (!modal || modal.kind !== 'recall') return { gone: true };
      const c = modal.c; if (c.done) return { done: true };
      const o = c.toks[c.order[c.cur]]; return { mode: o.mode, ans: o.ans };
    });
    if (st.gone) return;
    if (st.done) { await page.locator('.overlay button', { hasText: 'Continue' }).click(); return; }
    if (st.mode === 'letter') await page.locator('#ans').pressSequentially(st.ans);
    else await page.locator('.overlay .opts button').filter({ hasText: new RegExp(`^${st.ans.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).first().click();
  }
  throw new Error('recall never finished');
}


// Play cards (answering correctly) until the fight is won.
async function winFight() {
  for (let turn = 0; turn < 80; turn++) {
    const s = await page.evaluate(() => ({ after: R.after, screen, asm: modal && modal.kind === 'assembly' }));
    if (s.after || s.screen !== 'fight') break;
    if (s.asm) {   // a fire went out: tap the Galatians pieces in order
      while (await page.evaluate(() => modal && modal.kind === 'assembly')) {
        const i = await page.evaluate(() => modal.order.indexOf(modal.next));
        await page.locator('.overlay .chip').nth(i).click();
      }
      await page.waitForFunction(() => !R.busy, null, { timeout: 15000 }); continue;
    }
    const card = page.locator('#app .hand .card:not(.dim):not(.spent)').first();
    if (await card.count()) { await card.click(); await solveRecall(); }
    else await btn('Brace').click();
    await page.waitForFunction(() => !R.busy, null, { timeout: 15000 });
  }
  await page.waitForFunction(() => R.after, null, { timeout: 15000 });
  await page.evaluate(() => { if (modal && modal.kind === 'levelup') closeLevelUp(); });
}

// ---- Cave map: walking is done by tapping the screen, like a player ----
// tile [x,y] of the first map glyph g (S, D, V, L, a marker digit…) in the current cave
const findGlyph = g => page.evaluate(g => { const m = caveMap(R.cave); for (let y = 0; y < m.H; y++) { const x = m.rows[y].indexOf(g); if (x >= 0) return [x, y]; } return null; }, g);
const mapIdle = () => page.waitForFunction(() => !document.getElementById('wipe').className && !(R.map && R.map.walking), null, { timeout: 15000 });
// Walk to a tile (or up to a closed door, which also taps it). Each tap goes to the furthest tile of the real route
// that is already lit or remembered and on screen, so fog and the tap-to-walk path are exercised for real.
async function walkTo(goal) {
  for (let i = 0; i < 80; i++) {
    await mapIdle();
    const s = await page.evaluate(([gx, gy]) => {
      if (screen !== 'dive' || R.room || modal) return { stop: true };
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
    if (s.best.x === goal[0] && s.best.y === goal[1] && await page.evaluate(([x, y]) => closedAt(x, y), goal)) { await mapIdle(); return; }   // tapped a shut door
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
  await step('pro2', async () => { await finishDialogue(); await act().click(); await waitScreen('pro3'); });
  await step('pro3', async () => { await finishDialogue(); await act().click(); await waitScreen('pro4'); });
  await step('pro4', async () => { await finishDialogue(); await act().click(); await waitScreen('intro'); });
  await step('pick two verses', async () => {
    const hands = page.locator('#app .hand');
    await hands.nth(0).locator('.card').first().click();
    await hands.nth(1).locator('.card').first().click();
    await btn('Those two').click(); await waitScreen('tutorial');
  });
  await step('tutorial: the Furnace', async () => {
    await finishDialogue(); await act().click(); await waitScreen('fight');
    if (!(await page.locator('.coach').count())) throw new Error('no tutorial coaching shown');
    if (!(await page.evaluate(() => R.boss && R.enemies[0].id === 'furnace'))) throw new Error('the tutorial is not the Furnace');
    await winFight();
    await btn('Leave the room').click(); await waitScreen('victory');
    if (await page.locator('.overlay.levelup').count()) await page.locator('.overlay .lvopt').first().click();   // grow a fruit
    await page.locator('.dock button').first().click(); await waitScreen('tutend');
    await finishDialogue(); await act().click(); await waitScreen('tour');
    await finishDialogue(); await act().click(); await waitScreen('town');   // Amos's town tour
    const s = await page.evaluate(() => ({ forge: P.town.forge, done: P.tutorialDone, gift: owns(BRAM_GIFT), romans: R.deck.some(c => c.ref === 'Romans 12:2') }));
    if (!s.forge || !s.done || !s.gift || !s.romans) throw new Error('after the Furnace: ' + JSON.stringify(s));
  });
  await step('town -> church', async () => {
    await page.locator('.town [onclick="enterBuilding(\'church\')"]').click(); await waitScreen('church');
  });
  await step('into the first cave', async () => {
    await page.locator('#app button[onclick="startCave(0)"]').click(); await waitScreen('caveintro');
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
    const after = await page.evaluate(([c, x, y]) => ({ creed: P.creed === c + 1, gone: !markAt(x, y) }), [creed, ...await findGlyph('3')]);
    if (!after.creed || !after.gone) throw new Error('after the chest: ' + JSON.stringify(after));
  });
  await step('true/false villager, with Amos', async () => {
    await walkTo(await findGlyph('t')); await page.waitForFunction(() => R.room === 'truth');
    const dockBtn = t => page.locator('.dock button', { hasText: t });
    await dockBtn('Go on').click(); await dockBtn('Go on').click();   // Amos arrives, Amos answers the first
    const ans = await page.evaluate(() => TRUTHS[R.tf.q].answer);
    await dockBtn(ans ? 'False' : 'True').click();                   // a wrong answer: Amos points you back
    if (await page.evaluate(() => R.tf.phase) !== 'ask') throw new Error('with Amos there, a wrong answer should not end it');
    await dockBtn(ans ? 'True' : 'False').click(); await dockBtn('Go on').click(); await mapIdle();
    const st = await page.evaluate(() => ({ room: R.room, first: P.firstTruth }));
    if (st.room || !st.first) throw new Error('after the truth: ' + JSON.stringify(st));
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
