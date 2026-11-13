/* Spell and freeing effects in the arena: PixelLab sprite sheets (IMG.fx) played with CSS steps(). */
function center(id){ const a=document.getElementById('arena'), el=document.getElementById(id); if(!a||!el) return {x:200,y:80}; const ar=a.getBoundingClientRect(), r=el.getBoundingClientRect(); return {x:r.left-ar.left+r.width/2, y:r.top-ar.top+r.height/2}; }
function fxel(style, anim, dur, delay, cls){ const fx=document.getElementById('fx'); if(!fx) return; const d=document.createElement('div'); d.className='fxel '+(cls||''); d.style.cssText=style+`;animation:${anim} ${dur}ms steps(${Math.max(3,Math.round(dur/70))}) ${delay}ms 1 forwards;opacity:0`; fx.appendChild(d); setTimeout(()=>d.remove(), dur+delay+50); }
const TYPE_COLOR = {Patience:'#f2d25a', Gentleness:'#8cb45a', 'Self-control':'#7aa6c8', Love:'#d86a92', Peace:'#cfe3f0', Goodness:'#fff2b0', Armor:'#c8ccd4'};
const TYPE_FX = {Patience:'patience', Gentleness:'gentleness', 'Self-control':'selfcontrol', Love:'love', Peace:'peace', Goodness:'goodness', Armor:'patience'};
const FRAME_MS = 80;
// The HTML for one sheet playing once (or `loops` times), centred on (x, y) at `scale` x its pixel size.
function sheetHTML(name, x, y, scale, opts={}){
  const f=IMG.fx[name]; if(!f) return '';
  const w=Math.round(f.w*scale), h=Math.round(f.h*scale), ms=(opts.ms||FRAME_MS)*f.n;
  return `<div class="sheet ${opts.cls||''}" style="left:${Math.round(x-w/2)}px;top:${Math.round(y-h/2)}px;width:${w}px;height:${h}px;background-image:url(${f.src});background-size:${w*f.n}px ${h}px;--end:${-w*f.n}px;animation-duration:${ms}ms;animation-timing-function:steps(${f.n});animation-delay:${opts.delay||0}ms;animation-iteration-count:${opts.loops||1}"></div>`;
}
// Play a sheet over the arena; resolves when it has finished. It lives in a fixed layer on <body>,
// so a render() in the middle (a freed sprite swapping in) doesn't cut it off.
function sheetFX(name, at, scale, opts={}){
  const a=document.getElementById('arena'), f=IMG.fx[name]; if(!a||!f) return Promise.resolve();
  const top=fxTop(), r=a.getBoundingClientRect();
  const tmp=document.createElement('div'); tmp.innerHTML=sheetHTML(name, r.left+at.x, r.top+at.y, scale, opts); const d=tmp.firstChild; top.appendChild(d);
  const total=(opts.delay||0)+(opts.ms||FRAME_MS)*f.n*(opts.loops||1);
  return new Promise(res=>setTimeout(()=>{ d.remove(); res(); }, total));
}
const arenaK = ()=>{ const a=document.getElementById('arena'); return a ? parseFloat(a.style.getPropertyValue('--k'))||1 : 1; };
async function castFX(type, tier, weak, from, to){
  const k=arenaK(), col=TYPE_COLOR[type]||'#fff2b0', name=TYPE_FX[type]||'patience';
  const s=3.3*k*(tier===1?1: tier===2?1.2:1.45)*(weak?0.75:1);
  const self = from.x===to.x && from.y===to.y;
  // a mote of the fruit's colour carries the verse across (Goodness comes down from above instead)
  if(!self && type!=='Goodness'){ const m=Math.round(8*k*(weak?0.75:1)); fxel(`--sx:${from.x}px;--sy:${from.y}px;--tx:${to.x}px;--ty:${to.y}px;width:${m}px;height:${m}px;margin:${-m/2}px;background:${col};box-shadow:0 0 ${m}px ${col}`,'fly',320,0,weak?'weak':''); await sleep(300); }
  const big = tier===3 && !weak;
  if(big){ const fx=document.getElementById('fx'), a=document.getElementById('arena');
    if(fx){ const f=document.createElement('div'); f.className='flash'; fx.appendChild(f); setTimeout(()=>f.remove(),400); }
    if(a){ a.classList.add('shake'); setTimeout(()=>a.classList.remove('shake'),800); }
    sheetFX('bigcast', to, 3*k); }
  await sheetFX(name, to, s);
}
function hitFX(){ return sheetFX('hit', center('pl'), 2.2*arenaK()); }
function shieldFX(){ const c=center('pl'); return sheetFX('shield', c, 3*arenaK(), {loops:2, ms:90}); }
async function freedFX(i){
  const el=document.getElementById('en'+i); if(!el) return; const c=center('en'+i);
  const smoke=sheetFX('freed', c, 2.6*arenaK(), {ms:90});
  el.classList.remove('windup'); await sleep(360); const t=R.enemies[i]; if(t && t.fk===undefined) t.fk=pickFreed(); render();
  await smoke; await sleep(150);
}
// ---- Battle feel: floating numbers, turn banners, hit-stop, the freeing beat ----
// All of these live in #fxtop (fixed, over everything) so a render() underneath doesn't cut them off.
const CALM = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function fxTop(){ let top=document.getElementById('fxtop'); if(!top){ top=document.createElement('div'); top.id='fxtop'; document.body.appendChild(top); } return top; }
// a number or short label that pops up over element `id` in the arena, rises and fades
function floatText(id, text, cls='', dy=0){
  const a=document.getElementById('arena'); if(!a || !document.getElementById(id)) return;
  if(id==='pl') dy -= 34;   // above the hero's head, clear of the hit flash
  const r=a.getBoundingClientRect(), c=center(id), d=document.createElement('div');
  d.className='float '+cls; d.textContent=text; d.style.left=(r.left+c.x)+'px'; d.style.top=(r.top+c.y-24+dy)+'px';
  fxTop().appendChild(d); setTimeout(()=>d.remove(), 1100);
}
// freeze the arena for a beat on a big hit, so it lands
async function hitStop(ms=120){ if(CALM()) return; const a=document.getElementById('arena'); if(!a) return; a.classList.add('stop'); await sleep(ms); a.classList.remove('stop'); }
// a hit landing on `id` ('pl' or 'en0'…): flash and knock back, the number, the bars drain; big ones hit-stop
async function strike(id, text, cls, big){
  const el=document.getElementById(id); if(el) el.classList.add('hit');
  floatText(id, text, 'dmg '+(cls||'')+(big?' big':'')); barsSync();
  if(big) await hitStop();
  setTimeout(()=>{ if(el) el.classList.remove('hit'); }, 320);
}
// “Your turn” / “Their turn”, across the middle of the arena
function turnBanner(text, mine){
  if(modal) return;   // a popup is up (Amos teaching, a recall): the banner would sit on top of it
  const a=document.getElementById('arena'); if(!a) return; const r=a.getBoundingClientRect();
  const d=document.createElement('div'); d.className='turnban '+(mine?'mine':'theirs'); d.innerHTML=`<span>${text}</span>`;
  d.style.left=r.left+'px'; d.style.width=r.width+'px'; d.style.top=(r.top+r.height*0.4)+'px';
  fxTop().appendChild(d); setTimeout(()=>d.remove(), 950);
}
// the freed person's first words, big, over the arena; tap to go on, or it goes on by itself
function thanksBeat(e, text){
  return new Promise(res=>{
    const a=document.getElementById('arena'); if(!a){ res(); return; } const r=a.getBoundingClientRect();
    const who=FREED_AS[e.id], spr=FREED_IMG['freed'+e.fk];   // a portrait for the named, the freed sprite for villagers
    const pic=!e.villager && IMG.portrait[who] ? `<img src="${IMG.portrait[who]}" width="40" height="40" alt="">` : e.villager && spr ? `<img class="spr" src="${spr.f[0]}" width="40" height="40" alt="">` : '';
    const d=document.createElement('div'); d.className='beat'; d.setAttribute('role','status');
    d.style.left=(r.left+10)+'px'; d.style.width=(r.width-20)+'px'; d.style.top=(r.top+r.height*0.14)+'px';
    d.innerHTML=`<div class="bwho">${pic}<span>${freedName(e)}</span></div><div class="bline">${text}</div>`;
    let done=false; const end=()=>{ if(done) return; done=true; d.classList.add('out'); setTimeout(()=>{ d.remove(); res(); }, CALM()?0:220); };
    d.onclick=end; fxTop().appendChild(d); setTimeout(end, Math.min(4200, 1500+text.length*28));
  });
}
