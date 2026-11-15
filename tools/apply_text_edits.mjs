// Writes Luke's script edits (from the Philadelphia Script artifact, tools/script_page.mjs) into src/data/text.js.
// Usage: node tools/apply_text_edits.mjs <dir of edit .json docs | edits.json>   [--dry]
//   Each edit is {path, orig, text, note}. A changed line is replaced only where text.js still holds `orig` at
//   that path (checked by evaluating the file), so a line that changed since, or the same words used in two
//   places, can't be edited by mistake. Straight quotes are curled. Lines with only a note are listed for Claude.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { ROOT } from './bsb.mjs';

const [arg, flag] = process.argv.slice(2);
if(!arg){ console.error('usage: node tools/apply_text_edits.mjs <dir|file.json> [--dry]'); process.exit(1); }
const files = statSync(arg).isDirectory() ? readdirSync(arg, {recursive: true}).filter(f=>f.endsWith('.json')).map(f=>join(arg, f)) : [arg];
let edits = [];
for(const f of files){ const v = JSON.parse(readFileSync(f, 'utf8')); const d = v.data || v; if(Array.isArray(d)) edits.push(...d); else if(d.path) edits.push(d); }

const FILE = join(ROOT, 'src/data/text.js');
let src = readFileSync(FILE, 'utf8');
const evalText = s => { const c = {}; vm.runInNewContext(s + '\nthis.TEXT = TEXT;', c); return c.TEXT; };
const at = (T, p) => p.split('.').reduce((o,k)=>o==null?o:o[k], T);
// curly quotes, as text.js wants: apostrophes and closing quotes ’ ”, opening quotes ‘ “
function curl(s){ return s.replace(/(^|[\s(\[—–-])"/g, '$1“').replace(/"/g, '”').replace(/(^|[\s(\[—–-])'/g, '$1‘').replace(/'/g, '’'); }
const lit = (s, q) => q + s.replace(/\\/g, '\\\\').replace(new RegExp(q, 'g'), '\\' + q) + q;

const done = [], skipped = [], notes = [];
for(const e of edits){
  if(e.note) notes.push(e);
  if(e.text == null || e.text === e.orig) continue;
  const T = evalText(src), now = at(T, e.path);
  if(now !== e.orig){ skipped.push(`${e.path}: text.js no longer says what the page showed (it says ${JSON.stringify(now)})`); continue; }
  const next = curl(e.text.trim());
  let applied = false;
  for(const q of ["'", '"']){
    const needle = lit(e.orig, q); let i = -1;
    while(!applied && (i = src.indexOf(needle, i + 1)) >= 0){
      const cand = src.slice(0, i) + lit(next, q === '"' && !next.includes("'") ? "'" : q) + src.slice(i + needle.length);
      try{ const T2 = evalText(cand); if(at(T2, e.path) === next){ src = cand; applied = true; } }catch(x){}
    }
    if(applied) break;
  }
  if(applied) done.push(`${e.path}: ${JSON.stringify(e.orig)} -> ${JSON.stringify(next)}`); else skipped.push(`${e.path}: couldn't find it in text.js`);
}
if(flag !== '--dry' && done.length) writeFileSync(FILE, src);
console.log(`${done.length} line(s) ${flag==='--dry'?'would change':'changed'}:`); done.forEach(l=>console.log('  ' + l));
if(skipped.length){ console.log(`${skipped.length} skipped:`); skipped.forEach(l=>console.log('  ' + l)); }
if(notes.length){ console.log(`${notes.length} note(s) for Claude:`); notes.forEach(n=>console.log(`  ${n.path}: ${n.note}  [now: ${JSON.stringify(n.text ?? n.orig)}]`)); }
