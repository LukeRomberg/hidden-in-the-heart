// Verifies every Scripture quotation in src/ against the BSB. Exits 1 on any mismatch.
// Checks:
//   1. VERSES, ARMOR_V, STORY_V in src/data/scripture.js: text == BSB for the ref
//   2. CHUNKS (the boss assembly) joined == BSB for PASSAGE_REF
//   3. src/data/pass.json == what tools/build_passages.mjs generates from the BSB
//   4. Quotations inline in src/ (“…” followed by a reference, e.g. the Ephesians 6:12 line)
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadBSB, ROOT } from './bsb.mjs';
import { buildPassages, loadScripture } from './build_passages.mjs';

const bsb = await loadBSB();
const S = loadScripture();
const fails = [];
let checked = 0;

function check(where, ref, got) {
  checked++;
  let want;
  try { want = bsb.text(ref); } catch (e) { fails.push(`${where}: ${ref}: ${e.message}`); return; }
  if (got === want) return;
  let i = 0; while (i < got.length && got[i] === want[i]) i++;
  fails.push(`${where}: ${ref} does not match the BSB (first difference at character ${i})\n` +
    `    ours: ${got}\n    BSB:  ${want}\n` +
    `          ${' '.repeat(i)}^`);
}

// 1. verse lists
for (const list of ['VERSES', 'ARMOR_V', 'STORY_V']) for (const v of S[list]) check(`scripture.js ${list}`, v.ref, v.text);

// 2. boss passage pieces
check('scripture.js CHUNKS', S.PASSAGE_REF, S.CHUNKS.join(' '));

// 3. passages
checked++;
const passFile = readFileSync(join(ROOT, 'src/data/pass.json'), 'utf8');
if (passFile !== await buildPassages()) fails.push('src/data/pass.json differs from the BSB-generated passages; run: node tools/build_passages.mjs, then review the diff');

// 4. inline quotations: “text” Book C:V  (source may write the quotes as “ / ”)
const REF = String.raw`((?:[123] )?[A-Z][a-z]+(?: of [A-Z][a-z]+)? \d+:\d+(?:[-–]\d+)?)`;
const QUOTE = new RegExp(String.raw`“([^“”]+)”\s+` + REF, 'g');
const files = ['index.html', 'data/text.js', ...readdirSync(join(ROOT, 'src/js')).map(f => 'js/' + f)];
let inline = 0;
for (const f of files) {
  const src = readFileSync(join(ROOT, 'src', f), 'utf8').replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  for (const m of src.matchAll(QUOTE)) { inline++; check(`src/${f}`, m[2], m[1]); }
}

if (fails.length) {
  console.error(`\nSCRIPTURE CHECK FAILED: ${fails.length} problem(s)\n`);
  for (const f of fails) console.error('  ' + f + '\n');
  process.exit(1);
}
console.log(`scripture OK: ${checked} checks against the BSB (${S.VERSES.length + S.ARMOR_V.length + S.STORY_V.length} verses, ` +
  `Galatians chunks, ${Object.keys(JSON.parse(passFile)).length} passages, ${inline} inline quotations)`);
