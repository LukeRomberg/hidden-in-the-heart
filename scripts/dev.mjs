// Dev server: builds dist/index.html, rebuilds when src/ changes, serves it on the local
// network (open the printed LAN address on your phone), and reloads open pages after each
// rebuild. The reload snippet is added only when serving; dist/index.html stays clean.
// PORT=8080 npm run dev to change the port.
import { createServer } from 'node:http';
import { watch, readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = +process.env.PORT || 5173;
const clients = new Set();

function rebuild(why) {
  try {
    const { bytes } = build();
    console.log(`${new Date().toLocaleTimeString()} built (${(bytes / 1024).toFixed(0)} KB)${why ? ' after ' + why : ''}`);
    for (const res of clients) res.write('data: reload\n\n');
  } catch (e) {
    console.error(`${new Date().toLocaleTimeString()} BUILD FAILED: ${e.message}`);
  }
}

rebuild();
let timer;
watch(join(ROOT, 'src'), { recursive: true }, (_, file) => {
  clearTimeout(timer); timer = setTimeout(() => rebuild(file), 80);
});

const RELOAD = `<script>new EventSource('/__reload').onmessage=()=>location.reload()</script>`;
createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/__reload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(': hi\n\n'); clients.add(res); req.on('close', () => clients.delete(res));
    return;
  }
  if (url === '/' || url === '/index.html') {
    const html = readFileSync(join(ROOT, 'dist/index.html'), 'utf8').replace('</body>', RELOAD + '\n</body>');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(html);
  }
  res.writeHead(404); res.end('not found');
}).listen(PORT, '0.0.0.0', () => {
  const lan = Object.values(networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
  console.log(`\n  local:  http://localhost:${PORT}`);
  for (const ip of lan) console.log(`  phone:  http://${ip}:${PORT}   (same Wi-Fi)`);
  console.log('\n  watching src/ ...\n');
});
