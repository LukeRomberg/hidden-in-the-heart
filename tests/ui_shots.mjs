// Screenshots of every interface screen at phone width (430px), for checking the chrome by eye.
// Uses test mode (?test), so no real save is touched.
// Usage: npm run build && node tests/ui_shots.mjs [out dir]   (default: tests/out/ui)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const out = resolve(process.argv[2] || 'tests/out/ui'); mkdirSync(out, { recursive: true });
const url = pathToFileURL(resolve('dist/index.html')).href + '?test' + (process.env.UI ? '&ui=' + process.env.UI : '');   // UI=N: one of the design options (src/ui-options.css)
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
await page.addInitScript(() => { window.__FAST = true; });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('dialog', d => d.accept());

const wait = ms => page.waitForTimeout(ms);
const idle = () => page.waitForFunction(() => !document.getElementById('wipe').className, null, { timeout: 5000 }).then(() => wait(120));
const shot = async (name, full) => { await page.evaluate(() => { const t = document.getElementById('testpanel'); if (t) t.style.display = 'none'; }); await page.screenshot({ path: `${out}/${name}.png`, fullPage: !!full }); };
const fresh = async () => { await page.goto(url); await page.evaluate(() => localStorage.clear()); await page.goto(url); await wait(200); };
const jump = async name => { await page.evaluate(n => testJump(TEST_JUMPS.findIndex(j => j[0] === n)), name); await idle(); await wait(250); };
const ev = (fn, arg) => page.evaluate(fn, arg);
// finish typing the current dialogue line(s) so the box and its buttons show
const finishTalk = () => ev(() => { if (typeof TW !== 'undefined' && TW.typing) { stopTyping(); const el = document.getElementById('tw'); if (el) { el.innerHTML = el.dataset.full; doneTyping(); } } });

const S = {};
S.title = async () => { await fresh(); await shot('title'); };
S.titleContinue = async () => { await fresh(); await jump('Town map, after the tutorial'); await ev(() => { screen = 'title'; modal = null; render(); }); await wait(450); await shot('title-continue'); };
S.saves = async () => { await ev(() => goto('saves')); await idle(); await shot('saves'); };
S.codex = async () => { await ev(() => { R.codexFrom = 'title'; goto('codex'); }); await idle(); await shot('codex'); await shot('codex-full', true); };
S.dialogue = async () => { await fresh(); await ev(() => { testHero(false); goto('pro3'); }); await idle(); await wait(400); await finishTalk(); await shot('dialogue'); };
S.dialogueLast = async () => { await ev(() => { TW.i = TEXT.prologue.church.lines.length - 1; render(); }); await wait(100); await finishTalk(); await wait(450); await shot('dialogue-last'); };
S.intro = async () => { await ev(() => { testHero(false); R.deck = []; R.chosen = {}; goto('intro'); }); await idle(); await finishTalk(); await shot('intro-pick'); };
S.tip = async () => { await fresh(); await jump('Tutorial: the Furnace'); for (let i = 0; i < 30 && !(await ev(() => modal && modal.kind === 'tip')); i++) await wait(450); await shot('tip'); };
// recall: answer two choices (one right, one wrong) then shoot; then a first-letter verse; then the end states
const recallSetup = async () => { await fresh(); await jump('Villager fight'); await wait(300); await ev(() => { R.busy = false; R.say = null; }); };
S.recallChoice = async () => { await recallSetup();
  await ev(() => { openRecall(BY_REF['Proverbs 14:29'], () => {}, 1); }); await wait(450); await shot('recall-start');
  await ev(() => { const o = curTok(); answer(o.ans); }); await ev(() => { const o = curTok(); answer(o.opts.find(x => x !== o.ans) || o.ans); }); await wait(450); await shot('recall-mid'); };
S.recallLetters = async () => { await ev(() => { modal = null; openRecall(BY_REF['Philippians 4:7'], () => {}, 3); }); await wait(100);
  await ev(() => { for (let i = 0; i < 6; i++){ const o = curTok(); o.given = i === 3 ? 'z' : o.ans; advance(); } render(); }); await wait(450); await shot('recall-letters'); };
const finishAll = (miss) => ev(m => { const c = modal.c; let k = 0; while (!c.done) { const o = curTok(); o.given = (k++ < m) ? 'zz' : o.ans; advance(); } render(); }, miss);
S.recallPerfect = async () => { await ev(() => { modal = null; openRecall(BY_REF['Proverbs 14:29'], () => {}, 1); }); await finishAll(0); await wait(450); await shot('recall-done-perfect'); };
S.recallSteady = async () => { await ev(() => { modal = null; openRecall(BY_REF['Proverbs 14:29'], () => {}, 3); }); await finishAll(2); await wait(450); await shot('recall-done-steady'); };
S.recallSlip = async () => { await ev(() => { modal = null; openRecall(BY_REF['Proverbs 14:29'], () => {}, 1); }); await finishAll(3); await wait(450); await shot('recall-done-slipped'); };
// after the fight: two freed, three casts, a level up (its popup over the panel)
S.after = async () => { await recallSetup();
  await ev(() => { modal = null; R.enemies.forEach(e => { e.freed = true; e.hp = 0; }); R.castRefs = ['Proverbs 14:29', 'Philippians 4:7']; R.castLog = [{ ref: 'Proverbs 14:29', frac: 1 }, { ref: 'Philippians 4:7', frac: 0.8 }, { ref: 'Proverbs 14:29', frac: 0.4 }];
    R.earned = { souls: 0, talents: 6 }; setSp('Proverbs 14:29', { ...sp('Proverbs 14:29'), perf: 2, fails: 1 }); gainXP(xpNeed(R.level) - R.xp + 1); R.talents += 6; R.levelUps = 0; fightWon(); });
  await wait(450); await shot('after-fight'); await shot('after-fight-full', true);
  await ev(() => { R.levelUps = 1; modal = null; render(); }); await wait(450); await shot('after-fight-levelup');
  await ev(() => { closeLevelUp(); reward({ kind: 'spell', ref: 'Proverbs 14:29', grew: false }); render(); }); await wait(450); await shot('after-fight-reward'); };
S.levelup = async () => { await fresh(); await jump('Level-up popup'); await wait(400); await shot('levelup'); };
S.rewards = async () => { await fresh(); await jump('Town map, after the tutorial');
  const kinds = [['gear', { kind: 'gear', id: 'belt', how: 'bought' }], ['verse', { kind: 'verse', ref: 'Proverbs 16:32' }], ['chest', { kind: 'chest', talents: 12, creed: 2 }], ['note', { kind: 'note', id: null }], ['talents', { kind: 'talents', n: 2, line: '' }]];
  for (const [k, r] of kinds) { await ev(r => { modal = null; REWARDS = []; if (r.kind === 'note') r.id = TEXT.truths.list[0].id; if (r.kind === 'gear') { r.before = { ...R.gear }; equip(r.id); } reward(r); render(); }, r); await wait(450); await shot('reward-' + k); } };
S.shops = async () => { for (const [n, f] of [['Shop: the Forge', 'shop-forge'], ['Shop: the Inn', 'shop-inn'], ['Shop: the Training Yard', 'shop-training'], ['Shop: the Scriptorium', 'shop-scriptorium']]) {
  await fresh(); await jump(n); await wait(300); await finishTalk(); await ev(() => { if (modal && modal.kind === 'tip') closeTip(); }); await wait(450); await shot(f); await shot(f + '-full', true); } };
S.church = async () => { await fresh(); await jump('Town map, after the tutorial'); await ev(() => enterBuilding('church')); await idle(); await finishTalk(); await shot('church'); };
S.gear = async () => { await fresh(); await jump('Town map, after the tutorial'); await ev(() => { R.gearFrom = 'town'; goto('gear'); }); await idle(); await shot('gear'); await shot('gear-full', true); };
S.tree = async () => { await ev(() => { R.level = 4; goto('tree'); }); await idle(); await shot('tree'); await ev(() => treeSel('Patience')); await wait(450); await shot('tree-sheet'); };
S.deck = async () => { await ev(() => { R.treeSel = null; goto('deck'); }); await idle(); await shot('deck'); };
S.chest = async () => { await ev(() => { modal = { kind: 'assembly', phase: 'chest', chunks: CREED.sections[0].slice(), order: shuffle(CREED.sections[0].map((c, i) => i)), next: 2, mistakes: 1, allowed: 2, sec: 0, wrong: null }; render(); }); await wait(450); await shot('chest-creed'); };
S.toast = async () => { await ev(() => { modal = null; render(); toast(TEXT.fight.notEnoughFocus); }); await wait(450); await shot('toast'); };
S.town = async () => { await fresh(); await jump('Town map, after the tutorial'); await wait(300); await shot('town'); };
S.cave = async () => { await fresh(); await jump('The Hollow'); await wait(500); await shot('cave'); };
S.fight = async () => { await recallSetup(); await shot('fight'); };
S.defeat = async () => { await ev(() => { modal = null; R.lostTalents = 7; goto('defeat'); }); await idle(); await shot('defeat'); };

const only = process.argv.slice(3);
for (const [k, fn] of Object.entries(S)) { if (only.length && !only.includes(k)) continue; try { await fn(); } catch (e) { console.log(`FAIL ${k}: ${e.message.split('\n')[0]}`); } }
await browser.close();
console.log(errors.length ? 'console errors:\n' + errors.join('\n') : 'no console errors'); console.log('shots in ' + out);
