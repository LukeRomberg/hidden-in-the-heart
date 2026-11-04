// Prints the game's story text (src/data/text.js) as a readable script, in play order.
// Usage: npm run script   -> writes tools/out/script.md
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { ROOT } from './bsb.mjs';

const ctx = {};
vm.runInNewContext(readFileSync(join(ROOT, 'src/data/text.js'), 'utf8') + '\nthis.TEXT = TEXT;', ctx);
const T = ctx.TEXT;
const who = id => (id ? `**${T.speakers[id]}:** ` : '');
const conv = lines => lines.map(([id, line]) => `${who(id)}${id ? line : `*${line}*`}`).join('\n\n');
const button = b => `> [ ${b} ]`;
const out = [];
const scene = (title, ...parts) => out.push(`## ${title}\n\n${parts.filter(Boolean).join('\n\n')}\n`);

out.push('# Hidden in the Heart: script\n\nGenerated from `src/data/text.js` by `npm run script`. Narration is in italics; buttons are in brackets. Edit text.js, not this file.\n');
const P = T.prologue;
scene('1. Bedroom, 2 a.m.', conv(P.bedroom.lines), button(P.bedroom.button), `*(Recite Psalm 119:11.)*`);
scene('2. The square at dusk', `*If you got every word:* ${P.square.firstRight}`, `*If not:* ${P.square.firstMissed}`, conv(P.square.lines), button(P.square.button));
scene('3. The church', conv(P.church.lines), button(P.church.button));
scene('4. The lid', conv(P.lid.lines), button(P.lid.button));
scene(`5. ${P.pickVerses.heading}`, conv([P.pickVerses.line]), `*${P.pickVerses.hint}*`, button(P.pickVerses.button));
scene('6. Tutorial: Bram', conv(T.tutorial.lead), button(T.tutorial.start),
  '**Amos, coaching during the fight:**\n\n' + Object.values(T.tutorial.coach).map(l => `- ${l}`).join('\n'),
  `*Freed:* ${T.thanks.hothead}`, `*${T.town.unlocked.hothead}*`);
scene('7. After the tutorial', conv(T.tutorial.after), button(T.tutorial.toTown));
scene('8. The church (before Mission 1)', conv([T.church.lineBefore]), button(T.church.mission1), `*${T.church.mission1Blurb}*`);
scene('9. Mission 1: Anger in the Square', conv(T.mission1.intro), button(T.mission1.goIn));
scene('10. Corridors', Object.entries(T.mission1.corridor).map(([k, v]) => `- **${k}:** ${[].concat(v).join(' / ')}`).join('\n'));
scene('11. The freed', Object.entries(T.thanks).map(([k, v]) => `- **${T.enemies[k].name}:** ${v}`).join('\n'),
  T.villagers.map(v => `- **${v.name}:** ${v.thanks}`).join('\n'));
scene('12. The Furnace', conv(T.boss.intro.map(([w, t]) => [w, t.replace('{passage}', 'Galatians 5:22–23')])), button(T.boss.face));
scene(`13. ${T.victory.heading}`, `*${T.victory.story}*`, `*${T.victory.bell}*`, button(T.victory.button));
scene(`14. ${T.defeat.heading}`, `*${T.defeat.story}*`, button(T.defeat.button));
scene('15. First visits', ...[['The Forge', 'forge'], ['The Inn', 'inn'], ['The Training Yard', 'training'], ['The Scriptorium', 'scriptorium']]
  .map(([h, k]) => `**${h}**\n\n${conv(T[k].firstVisit)}`));
scene('16. Town, later visits', ['forge', 'inn', 'scriptorium'].map(k => conv([T[k].line])).join('\n\n'), conv([T.training.yardLine]), conv([T.church.lineAfter]));

mkdirSync(join(ROOT, 'tools/out'), { recursive: true });
const file = join(ROOT, 'tools/out/script.md');
writeFileSync(file, out.join('\n'));
console.log('wrote tools/out/script.md');
