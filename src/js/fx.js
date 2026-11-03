/* Spell and freeing effects in the arena. */
function center(id){ const a=document.getElementById('arena'), el=document.getElementById(id); if(!a||!el) return {x:200,y:80}; const ar=a.getBoundingClientRect(), r=el.getBoundingClientRect(); return {x:r.left-ar.left+r.width/2, y:r.top-ar.top+r.height/2}; }
function fxel(style, anim, dur, delay, cls){ const fx=document.getElementById('fx'); if(!fx) return; const d=document.createElement('div'); d.className='fxel '+(cls||''); d.style.cssText=style+`;animation:${anim} ${dur}ms steps(${Math.max(3,Math.round(dur/70))}) ${delay}ms 1 forwards;opacity:0`; fx.appendChild(d); setTimeout(()=>d.remove(), dur+delay+50); }
const TYPE_COLOR = {Patience:'#f2d25a', Gentleness:'#8cb45a', 'Self-control':'#7aa6c8', Love:'#d86a92', Peace:'#cfe3f0', Goodness:'#fff2b0'};
async function castFX(type, tier, weak, from, to){
  const col = TYPE_COLOR[type]; const sz = (weak?0.6:1)*(tier===1?1: tier===2?1.5:2.2); const w=weak?'weak':'';
  const vars = `--sx:${from.x}px;--sy:${from.y}px;--tx:${to.x}px;--ty:${to.y}px`;
  const box = (wd,ht,extra='')=>`${vars};width:${wd}px;height:${ht}px;margin-left:${-wd/2}px;margin-top:${-ht/2}px;background:${col};${extra}`;
  let dur = 600;
  if(type==='Patience'){ fxel(box(44*sz,12*sz),'fly',dur,0,w); if(tier>1) fxel(box(28*sz,6*sz),'fly',dur,120,w); }
  else if(type==='Gentleness'){ const n=4*tier; for(let i=0;i<n;i++) fxel(box(7,7,`--sy:${from.y-30+(i*19)%60}px;--ty:${to.y-20+(i*23)%50}px`),'fly',dur,i*45,w); dur+=n*45; }
  else if(type==='Self-control'){ const n=7; for(let i=0;i<n;i++){ const f=i/(n-1); fxel(`${vars};--tx:${from.x+(to.x-from.x)*f}px;--ty:${from.y+(to.y-from.y)*f}px;width:${9*sz}px;height:${9*sz}px;background:${col};transform:translate(var(--tx),var(--ty))`,'pop',200,i*60,w); }
    fxel(`${vars};width:${60*sz}px;height:${60*sz}px;margin-left:${-30*sz}px;margin-top:${-30*sz}px;border:5px solid ${col}`,'ring',400,n*60,w); dur=n*60+400; }
  else if(type==='Love'){ fxel(box(16*sz,16*sz,`transform:translate(var(--tx),var(--ty))`),'pop',150,0,w); for(let i=0;i<8;i++){ const a=i*Math.PI/4; fxel(box(8*sz,8*sz,`--dx:${Math.cos(a)*40*sz}px;--dy:${Math.sin(a)*40*sz}px`),'radiate',450,150,w); } dur=600; }
  else if(type==='Peace'){ fxel(`--tx:${from.x}px;--ty:${from.y}px;width:${70*sz}px;height:${70*sz}px;margin-left:${-35*sz}px;margin-top:${-35*sz}px;border:5px solid ${col}`,'ring',550,0,w); for(let i=0;i<4;i++) fxel(box(10,10,`--tx:${from.x}px;--ty:${from.y}px;--dx:${[0,30,0,-30][i]}px;--dy:${[-30,0,30,0][i]}px`),'radiate',500,100,w); dur=600; }
  else if(type==='Goodness'){ fxel(`--h:${to.y+20}px;left:${to.x-7*sz}px;top:0;width:${14*sz}px;background:${col};height:0`,'drop',350,0,w); fxel(box(30*sz,10*sz,`transform:translate(var(--tx),var(--ty))`),'pop',200,300,w); dur=550; }
  if(tier===3 && !weak){ setTimeout(()=>{ const fx=document.getElementById('fx'), a=document.getElementById('arena'); if(fx){ const f=document.createElement('div'); f.className='flash'; fx.appendChild(f); setTimeout(()=>f.remove(),400); } if(a){ a.classList.add('shake'); setTimeout(()=>a.classList.remove('shake'),800); }
    for(let i=0;i<12;i++){ const ang=i*Math.PI/6; fxel(box(10,10,`--dx:${Math.cos(ang)*70}px;--dy:${Math.sin(ang)*70}px`),'radiate',500,0,''); } }, dur-150); dur+=350; }
  await sleep(dur);
}
async function freedFX(i){
  const el=document.getElementById('en'+i); if(!el) return; const c=center('en'+i);
  for(let k=0;k<10;k++){ const ang=k*Math.PI/5; fxel(`--tx:${c.x}px;--ty:${c.y}px;--dx:${Math.cos(ang)*50}px;--dy:${Math.sin(ang)*50}px;width:8px;height:8px;margin:-4px;background:#c8502a`,'radiate',500,0,''); }
  el.classList.remove('windup'); await sleep(450); const t=R.enemies[i]; if(t && t.fk===undefined) t.fk=pickFreed(); render(); await sleep(700);
}
