// Builds the script editor page (a claude.ai artifact) from src/data/text.js: every line of player-facing text,
// in story-order sections, with who says it and when it comes up. Luke edits there; his edits are saved in the
// artifact's database and written back by tools/apply_text_edits.mjs.
// Usage: node tools/script_page.mjs   -> tools/out/script-editor.html (then publish it with the Artifact tool)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { ROOT } from './bsb.mjs';

const SRC = readFileSync(join(ROOT, 'src/data/text.js'), 'utf8');
const ctx = {}; vm.runInNewContext(SRC + '\nthis.TEXT = TEXT;', ctx);
const T = ctx.TEXT;

// ---- the comments in text.js say when most lines come up: map them to key paths (array indexes dropped) ----
const NOTES = {};
{ const stack = []; let pending = [];
  for(const raw of SRC.split('\n')){
    const line = raw.replace(/\s+$/, ''), ind = line.length - line.trimStart().length, t = line.trim();
    if(t.startsWith('//')){ const c = t.replace(/^\/\/\s?/, '').replace(/^-+\s*|\s*-+$/g, '').trim(); if(c) pending.push(c); continue; }
    const m = t.match(/^([A-Za-z_$][\w$]*|'[^']+'):\s*(.*)$/);
    if(m){ while(stack.length && stack[stack.length-1].ind >= ind) stack.pop();
      const key = m[1].replace(/'/g,''), path = [...stack.map(s=>s.key), key].join('.');
      const trail = m[2].match(/\/\/\s*(.+)$/); if(trail) pending.push(trail[1].trim());
      if(pending.length) NOTES[path] = pending.join(' ');
      if(/[{[]\s*(\/\/.*)?$/.test(m[2])) stack.push({ind, key});
      pending = []; continue; }
    if(t && !t.startsWith('[') && !t.startsWith('{')) pending = [];
  }
}
const keyPath = p => p.split('.').filter(s=>!/^\d+$/.test(s)).join('.');
function noteFor(path){ let kp = keyPath(path).split('.'); while(kp.length){ const n = NOTES[kp.join('.')]; if(n) return n; kp.pop(); } return ''; }

// ---- who says it ----
const SP = T.speakers;
const NOT_TEXT = new Set(['id','who','ref','truth','at','pronoun','he','him','his','He','His']);
function whoFor(path, parent, key){
  const ks = path.split('.');
  if(Array.isArray(parent) && parent.length===2 && key==='1' && (parent[0]===null || parent[0] in SP)) return parent[0] ? SP[parent[0]] : 'Narration';
  if(ks[0]==='foes'){ const e = T.enemies[ks[1]]; return e ? e.name : 'A villager'; }
  if(ks[0]==='thanks'){ const e = T.enemies[ks[1]]; return e ? e.name : ''; }
  if(ks[0]==='villagers'){ const v = T.villagers[+ks[1]]; return v ? v.name : ''; }
  if(ks[0]==='tutorial' && (ks[1]==='coach')) return 'Amos';
  if(ks[0]==='truths' && ks[1]==='list'){ const k = ks[3]; return k==='q' ? 'A held villager' : k==='scrap' ? 'Amos’s note' : ''; }
  if(ks[0]==='fight' && ks[1]==='thoughts') return 'You (thinking)';
  return '';
}
// what each part of a fight means, where text.js has no comment of its own
const WHEN = { taunts:'Most turns, in a speech bubble over them', waver:'Once they’re below half health', crack:'When they’re nearly free',
  atk:'Their normal attack, as it lands', big:'Their big attack', vex:'When they provoke you (your verses cost 1 more)',
  firstVisit:'The first time you walk in', line:'Every visit after the first', button:'A button', heading:'A heading' };

// ---- sections, in story order: each takes the TEXT paths that start with one of its prefixes ----
const SECTIONS = [
  ['opening', 'The opening', 'Bedroom, falling asleep, waking in the square, the church, the lid.', ['prologue', 'title']],
  ['furnace', 'Amos and the Furnace', 'Walking out to the well, the tutorial fight, Amos’s popups, Bram after.', ['tutorial', 'boss', 'enemies.furnace', 'foes.furnace', 'thanks.furnace', 'victory']],
  ['town', 'The town and the tour', 'The town map, the people on it, Amos’s tour, the church.', ['townMap', 'tour', 'town', 'church', 'world']],
  ['forge', 'The Forge', 'Bram’s shop, his popup about the armor, the gear and the Armor of God.', ['forge', 'items', 'gear']],
  ['inn', 'The Inn', 'Wendell, rumors, the ledger.', ['inn']],
  ['yard', 'The Training Yard', 'Hale and the drills.', ['training']],
  ['scriptorium', 'The Scriptorium', 'Silas and the shelf of verses.', ['scriptorium']],
  ['caves', 'The three caves', 'Each cave’s opening and ending, the tunnels, doors and levers, chests and campfires.', ['caves', 'dive', 'rooms', 'drop']],
  ['truths', 'Amos’s notes and the truth villagers', '“Is it true that…?”, the notes you find, what Amos says the first time.', ['truths']],
  ['hurt', 'Someone hurt', 'Living it out: the hurt people, helping or walking on.', ['living']],
  ['bosses', 'The cave bosses', 'The Grudge, the Brawler and the Slanderer: names, taunts, moves, thanks.', ['enemies', 'foes.grudge', 'foes.brawler', 'foes.slanderer', 'thanks']],
  ['villagers', 'Villager fights', 'The fled villagers: names, what they say held, their thanks.', ['villagers', 'foes']],
  ['fight', 'In every fight', 'Openers, what you say as you cast, your own thoughts, the log lines, buttons.', ['fight', 'afterFight', 'defeat']],
  ['popups', 'Popups, leveling up, the tree', 'The “you got…” popups, level-up, the fruit tree, verses growing, the recall screen.', ['reward', 'levelUp', 'tree', 'tiers', 'spells', 'recall', 'codex']],
  ['ending', 'The chapter ending', 'The full church, the bell, everyone’s line, Revelation 3:8, the stats.', ['chapterEnd']],
  ['other', 'Everything else', 'Save codes, character names, and anything not above.', ['']],
];

const sections = SECTIONS.map(([id, title, blurb]) => ({id, title, blurb, groups: []}));
const taken = new Set();
function addLine(path, text, parent, key){
  const si = SECTIONS.findIndex(s => s[3].some(pre => pre==='' || path===pre || path.startsWith(pre+'.')));
  const sec = sections[si]; const ks = path.split('.');
  // group by the key path above the line (a conversation, a pool of taunts…)
  let gk = ks.slice(0,-1).filter(s=>!/^\d+$/.test(s)).join('.') || ks[0];
  if(Array.isArray(parent) && parent.length===2 && key==='1') gk = keyPath(ks.slice(0,-2).join('.'));
  let g = sec.groups.find(g=>g.key===gk);
  if(!g){ g = {key: gk, when: noteFor(gk + '.x') || noteFor(gk), lines: []}; sec.groups.push(g); }
  const k2 = ks.filter(s=>!/^\d+$/.test(s)).pop();
  g.lines.push({p: path, t: text, w: whoFor(path, parent, key), n: WHEN[k2] && !g.when.includes(WHEN[k2]) ? WHEN[k2] : (NOTES[keyPath(path)] && NOTES[keyPath(path)]!==g.when ? NOTES[keyPath(path)] : '')});
  taken.add(path);
}
(function walk(o, path, parent, key){
  if(typeof o === 'string'){
    const k = path.split('.').pop();
    if(path.startsWith('speakers.')){ addLine(path, o, parent, key); return; }
    if(NOT_TEXT.has(k)) return;
    if(Array.isArray(parent) && parent.length===2 && key==='0' && (o in SP)) return;   // a speaker id
    if(!/[a-z]/i.test(o)) return;
    addLine(path, o, parent, key); return; }
  if(o && typeof o === 'object') for(const k of Object.keys(o)) walk(o[k], path ? path+'.'+k : k, o, k);
})(T, '', null, null);

const total = sections.reduce((n,s)=>n+s.groups.reduce((m,g)=>m+g.lines.length,0),0);
const data = JSON.stringify({generated: new Date().toISOString().slice(0,10), total, sections}).replace(/</g,'\\u003c');
const html = readFileSync(join(ROOT, 'tools/script_page.html'), 'utf8').replace('/*__DATA__*/null', data);
mkdirSync(join(ROOT, 'tools/out'), {recursive: true});
writeFileSync(join(ROOT, 'tools/out/script-editor.html'), html);
console.log(`wrote tools/out/script-editor.html: ${total} lines in ${sections.length} sections`);
sections.forEach(s=>console.log(`  ${s.title}: ${s.groups.reduce((m,g)=>m+g.lines.length,0)}`));
