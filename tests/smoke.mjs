// Headless click-through: title -> New game -> prologue -> pick two verses -> tutorial fight ->
// town -> church -> start mission -> first fight. Fails on any console error or page error.
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
    const s = await page.evaluate(() => ({ after: R.after, screen }));
    if (s.after || s.screen !== 'fight') break;
    const card = page.locator('#app .hand .card:not(.dim):not(.spent)').first();
    if (await card.count()) { await card.click(); await solveRecall(); }
    else await btn('Brace').click();
    await page.waitForFunction(() => !R.busy, null, { timeout: 15000 });
  }
  await page.waitForFunction(() => R.after, null, { timeout: 15000 });
  await page.evaluate(() => { if (modal && modal.kind === 'levelup') closeLevelUp(); });
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
  await step('tutorial fight', async () => {
    await finishDialogue(); await act().click(); await waitScreen('fight');
    if (!(await page.locator('.coach').count())) throw new Error('no tutorial coaching shown');
    await winFight();
    await btn('Move on').click(); await waitScreen('tutend');
    await finishDialogue(); await act().click(); await waitScreen('town');
    if (!(await page.evaluate(() => P.town.forge && P.tutorialDone))) throw new Error('tutorial did not open the forge');
  });
  await step('town -> church', async () => {
    await page.locator('.town [onclick="enterBuilding(\'church\')"]').click(); await waitScreen('church');
  });
  await step('start mission', async () => {
    await btn('Anger in the Square').click(); await waitScreen('mstory');
    await finishDialogue(); await btn('Go in').click(); await waitScreen('map');
  });
  await step('enter first room', async () => {
    await page.locator('svg.dmap g.roomclick').first().click(); await waitScreen('corridor');
    await btn('Go in').click(); await waitScreen('fight');
  });
  await step('fight', async () => {
    await winFight();
    const who = await page.evaluate(() => R.enemies.map(e => e.villager ? 'villager' : e.id));
    if (who.includes('hothead')) throw new Error('fought Bram again after freeing him');
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
