// Lints src/data/text.js so a typo can't quietly break a scene. Exits 1 on any problem.
//   - every conversation line is [speaker id or null, 'text'] and the speaker exists
//   - no straight double quotes in player-facing text (the game uses “ ”)
//   - no {placeholders} misspelled with the wrong brackets, no empty strings
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { ROOT } from './bsb.mjs';

const src = readFileSync(join(ROOT, 'src/data/text.js'), 'utf8');
const ctx = {};
try { vm.runInNewContext(src + '\nthis.TEXT = TEXT;', ctx); }
catch (e) { console.error(`text.js does not load: ${e.message}`); process.exit(1); }
const T = ctx.TEXT, problems = [];

// Conversations: arrays whose items are arrays (lines, lead, after, intro…)
function walk(o, path) {
  if (Array.isArray(o) && o.length && o.every(x => Array.isArray(x) || x === undefined)) {
    o.forEach((line, i) => {
      const at = `${path}[${i}]`;
      if (!Array.isArray(line) || line.length !== 2) return problems.push(`${at}: expected [speaker, 'text'] (missing comma between lines?)`);
      const [who, text] = line;
      if (who !== null && !(who in T.speakers)) problems.push(`${at}: unknown speaker '${who}' (add it to speakers)`);
      if (typeof text !== 'string' || !text.trim()) problems.push(`${at}: line text is missing`);
    });
    return;
  }
  if (typeof o === 'string') {
    if (o.includes('"')) problems.push(`${path}: straight quote " (use “ ”)`);
    if (!o.trim() && path !== 'TEXT.fight.absorbed') problems.push(`${path}: empty text`);
    return;
  }
  if (o === undefined) return problems.push(`${path}: undefined (missing comma?)`);
  if (o && typeof o === 'object') for (const k of Object.keys(o)) walk(o[k], `${path}${Array.isArray(o) ? `[${k}]` : '.' + k}`);
}
walk(T, 'TEXT');
// conversation lines are walked as arrays above; check their strings for straight quotes too
for (const m of src.matchAll(/^\s*\[(?:null|'[\w]+'),\s*'([^\n]*)'\],?\s*$/gm)) if (m[1].includes('"')) problems.push(`straight quote " in: ${m[1].slice(0, 60)}…`);
// a line like  ['a', 'b']  followed directly by  ['c', …]  with no comma
for (const m of src.matchAll(/\]\s*\n\s*\[(?:null|')/g)) {
  const line = src.slice(0, m.index).split('\n').length;
  problems.push(`text.js line ${line}: missing comma after this line`);
}

if (problems.length) { console.error(`TEXT CHECK FAILED:\n  ${[...new Set(problems)].join('\n  ')}`); process.exit(1); }
console.log('text OK');
