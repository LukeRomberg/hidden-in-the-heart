// Berean Standard Bible lookup, backed by tools/data/BSB.json (gitignored; downloaded on
// first use from the scrollmapper bible_databases repo named in CLAUDE.md).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const BSB_URL = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/BSB.json';
const FILE = join(ROOT, 'tools/data/BSB.json');

// Our reference spelling -> the database's book name.
const BOOK_ALIAS = { Psalm: 'Psalms', 'Song of Songs': 'Song of Solomon', Revelation: 'Revelation of John' };
const ROMAN = { 1: 'I', 2: 'II', 3: 'III' };

export async function loadBSB() {
  if (!existsSync(FILE)) {
    console.log(`downloading BSB -> ${FILE.replace(ROOT + '/', '')}`);
    const res = await fetch(BSB_URL);
    if (!res.ok) throw new Error(`BSB download failed: ${res.status} ${res.statusText}`);
    mkdirSync(dirname(FILE), { recursive: true });
    writeFileSync(FILE, Buffer.from(await res.arrayBuffer()));
  }
  const db = JSON.parse(readFileSync(FILE, 'utf8'));
  if (!/^BSB/.test(db.translation)) throw new Error(`expected BSB, got "${db.translation}"`);
  const books = new Map(db.books.map(b => [b.name, b]));

  const book = name => {
    const m = name.match(/^([123]) (.+)$/);
    const key = m ? `${ROMAN[m[1]]} ${m[2]}` : (BOOK_ALIAS[name] || name);
    const b = books.get(key);
    if (!b) throw new Error(`unknown book "${name}"`);
    return b;
  };
  const chapter = (name, ch) => {
    const c = book(name).chapters.find(c => c.chapter === ch);
    if (!c) throw new Error(`${name} has no chapter ${ch}`);
    return c;
  };
  const verse = (name, ch, v) => {
    const x = chapter(name, ch).verses.find(x => x.verse === v);
    if (!x) throw new Error(`${name} ${ch}:${v} not found`);
    return x.text.trim();
  };
  // "Galatians 5:22-23" (hyphen or en dash) -> joined text of those verses.
  const text = ref => {
    const r = parseRef(ref);
    const out = [];
    for (let v = r.from; v <= r.to; v++) out.push(verse(r.book, r.ch, v));
    return out.join(' ');
  };
  const lastVerse = (name, ch) => Math.max(...chapter(name, ch).verses.map(x => x.verse));
  return { text, verse, lastVerse };
}

export function parseRef(ref) {
  const m = ref.match(/^(.+) (\d+):(\d+)(?:[-–](\d+))?$/);
  if (!m) throw new Error(`can't parse reference "${ref}"`);
  return { book: m[1], ch: +m[2], from: +m[3], to: +(m[4] || m[3]), vs: m[4] ? `${m[3]}-${m[4]}` : m[3] };
}
