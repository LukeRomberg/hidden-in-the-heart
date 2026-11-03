/* Run state (R), current screen, modal, and small shared helpers. */
let R = null, screen = 'title', modal = null, toastT = null;
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const KEEP = ['hp','maxHp','maxMana','deck','talents','souls','level','xp','rank','tree','gear'];
function blankHero(){ return {hp:40, maxHp:40, maxMana:3, deck:[], talents:0, souls:0, level:1, xp:0, rank:0, tree:{Patience:0,Gentleness:0,Peace:0}, gear:{head:null,chest:null,waist:null,feet:null,shield:null,hand:null}}; }
function transient(){ return {mana:0, draw:[], hand:[], disc:[], shield:0, vexed:false, step:0, frags:[], node:null, enemies:[], turn:0, target:0, boss:null, log:[], busy:false,
  charge:false, pendingDrop:null, after:false, earned:{souls:0,talents:0,xp:0}, treeSel:null, treeFrom:'town', gearFrom:'town', helmUsed:false, gearDropped:null, unlockMsg:null,
  pick:pick(OFFENSE,3), chosen:{off:null, def:null}}; }
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function pick(a,n){ return shuffle(a.slice()).slice(0,n); }
function toast(msg){ clearTimeout(toastT); let t=document.getElementById('toast'); if(!t){ t=document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t);} t.textContent=msg; t.style.display='block'; toastT=setTimeout(()=>t.style.display='none',2200); }
function log(msg){ if(!R) return; R.log.push(msg); R.log = R.log.slice(-3); const el=document.getElementById('log'); if(el) el.innerHTML = R.log.map(m=>`<div>${m}</div>`).join(''); }
function goto(s, fn){ const w=document.getElementById('wipe'); w.className='on'; setTimeout(()=>{ if(fn) fn(); screen=s; render(); const a=document.getElementById('app'); a.classList.remove('enter'); void a.offsetWidth; a.classList.add('enter'); w.className='off'; setTimeout(()=>{ w.className=''; },320); },300); }
