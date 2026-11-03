// Inlines src/ back into one self-contained dist/index.html. No dependencies.
// Modules are plain scripts that share one global scope (the game's onclick handlers
// call top-level functions by name), so ORDER matters only for top-level initializers:
// data first, then anything a later file's top-level code reads at load.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');

export const ORDER = [
  'data/scripture.js', 'data/pixels.js',
  'js/state.js', 'js/save.js', 'js/spells.js', 'js/recall.js', 'js/art.js', 'js/fx.js',
  'js/gear.js', 'js/combat.js', 'js/map.js', 'js/tree.js', 'js/story.js', 'js/town.js',
  'js/ui.js', 'js/main.js',
];

const read = p => readFileSync(join(SRC, p), 'utf8');

export function build({ out = join(ROOT, 'dist/index.html') } = {}) {
  const frames = JSON.parse(read('data/ui-frames.json'));
  const styles = read('styles.css').trimEnd().replace(/__FRAME__\(([\w-]+)\)/g, (_, k) => {
    if (!frames[k]) throw new Error(`styles.css: unknown frame "${k}"`);
    return frames[k];
  });
  const scripts = ORDER.map(f => read(f).trimEnd().replace(/__DATA__\('([\w.-]+)'\)/g, (_, file) => {
    const val = JSON.stringify(JSON.parse(read('data/' + file)));
    return val;
  })).join('\n');

  for (const [what, text] of [['styles', styles], ['scripts', scripts]]) {
    const left = text.match(/__(DATA|FRAME)__\([^)]*\)/);
    if (left) throw new Error(`${what}: unresolved placeholder ${left[0]}`);
  }
  if (/<\/script/i.test(scripts)) throw new Error('scripts contain "</script", which would end the inline script early');

  const html = read('index.html').replace('{{styles}}', () => styles).replace('{{scripts}}', () => scripts);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  return { out, bytes: Buffer.byteLength(html) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const t = Date.now();
  const { out, bytes } = build();
  console.log(`built ${out.replace(ROOT + '/', '')} (${(bytes / 1024).toFixed(0)} KB) in ${Date.now() - t} ms`);
}
