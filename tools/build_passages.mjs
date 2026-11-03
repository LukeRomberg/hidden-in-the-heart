// Regenerates src/data/pass.json (const PASS) from the BSB.
// Every spell verse grows into a passage: its own verse (or verse range) first, then the
// verses that follow it, up to MAX_VERSES or the end of the chapter. PASS.ARMOR is
// Ephesians 6:14-17, recited cumulatively at the Forge.
// Usage: node tools/build_passages.mjs [--check]   (--check: fail if pass.json is out of date)
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { loadBSB, parseRef, ROOT } from './bsb.mjs';

const MAX_VERSES = 5;
const OUT = join(ROOT, 'src/data/pass.json');

export function loadScripture() {
  const ctx = {};
  vm.runInNewContext(readFileSync(join(ROOT, 'src/data/scripture.js'), 'utf8') +
    '\nthis.S = {VERSES, ARMOR_V, STORY_V, PASSAGE_REF, CHUNKS};', ctx);
  return ctx.S;
}

export async function buildPassages() {
  const bsb = await loadBSB();
  const { VERSES, STORY_V } = loadScripture();
  const pass = {};
  for (const { ref } of [...VERSES, ...STORY_V]) {
    const r = parseRef(ref);
    const vs = [{ v: r.vs, t: bsb.text(ref) }];
    const last = bsb.lastVerse(r.book, r.ch);
    for (let v = r.to + 1; v <= last && vs.length < MAX_VERSES; v++) vs.push({ v: String(v), t: bsb.verse(r.book, r.ch, v) });
    pass[ref] = { book: r.book, ch: r.ch, vs };
  }
  pass.ARMOR = { book: 'Ephesians', ch: 6, vs: [14, 15, 16, 17].map(v => ({ v: String(v), t: bsb.verse('Ephesians', 6, v) })) };
  return JSON.stringify(pass, null, 1) + '\n';
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const next = await buildPassages();
  const cur = readFileSync(OUT, 'utf8');
  if (process.argv.includes('--check')) {
    if (cur !== next) { console.error('src/data/pass.json is out of date; run: node tools/build_passages.mjs'); process.exit(1); }
    console.log('pass.json is up to date');
  } else {
    writeFileSync(OUT, next);
    console.log(cur === next ? 'pass.json unchanged' : 'wrote src/data/pass.json (changed)');
  }
}
