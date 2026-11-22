import {createRangeSound, hitTarget, pelletsAt, stageWeapons, weapons} from './shooting.js';
import {createWeaponView} from './weapon-model.js';

const id=name=>document.getElementById(name);
const normalPositions=[[-3.9,1.80,-1.5],[0,1.66,-2.2],[3.9,1.80,-1.5]];
const shotgunPositions=[[-3.85,1.7,-.75],[0,1.66,-1.1],[3.85,1.7,-.75]];
const sniperPositions=[[-3.45,1.77,-9.1],[0,1.66,-16],[3.45,1.77,-9.1]];
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function createFiringRange({range, canvas, camera, canShoot, onHit, onActivity, otherTargets, draw, announce, isMoving}) {
  const view=id('viewmodel'), viewModel=createWeaponView(view);
  const shotCanvas=id('shot-fx'), ctx=shotCanvas.getContext('2d'), hitMark=id('hit-mark');
  const fireButton=id('fire'), reloadButton=id('reload'), aimButton=id('aim');
  const sound=createRangeSound(), calm=window.matchMedia('(prefers-reduced-motion: reduce)');
  let key='pistol', weapon=weapons[key], ammo=weapon.capacity, scoped=false, muted=false;
  let shotUntil=0, lastFire=-Infinity, burst=0, reloadTimer=0, actionTimer=0, repeatTimer=0, trigger=null;
  let width=1, height=1, previousWidth=0, previousHeight=0, muzzle={x:0,y:0}, targets=[], recoilAnimation, shotAnimation, hitAnimation;
  try { muted=localStorage.getItem('desert-code-muted')==='yes'; } catch {}
  const locked=()=>document.pointerLockElement===canvas;
  const turnScale=()=>scoped ? .40 : 1;

  function play(kind) {
    if(!muted) sound(kind,weapon);
  }

  function updateMute() {
    id('mute').setAttribute('aria-pressed',String(muted));
    id('mute').setAttribute('aria-label',muted?'開啟音效':'靜音');
    id('mute').title=muted?'開啟音效':'靜音';
  }

  function updateHud() {
    id('ammo').textContent=ammo;
    fireButton.disabled=!canShoot();
    aimButton.disabled=!canShoot()||!camera.available;
    reloadButton.disabled=!canShoot()||Boolean(reloadTimer)||ammo===weapon.capacity;
  }

  function status(message='', time=0) {
    clearTimeout(actionTimer);
    id('weapon-status').textContent=message;
    if(time) actionTimer=setTimeout(()=>{id('weapon-status').textContent='';},time);
  }

  function setScope(active) {
    scoped=Boolean(active && camera.available && weapon.zoom);
    camera.setZoom(scoped?weapon.zoom:1);
    range.dataset.scoped=scoped;
    aimButton.setAttribute('aria-pressed',String(scoped));
    aimButton.querySelector('span').textContent=scoped?'關鏡':'開鏡';
  }

  function toggleScope() {
    if(!weapon.zoom||!canShoot()) return;
    setScope(!scoped);
    draw();
  }

  function reset(lesson) {
    stopTrigger();
    clearTimeout(reloadTimer);
    reloadTimer=0;
    recoilAnimation?.cancel();
    shotAnimation?.cancel();
    hitAnimation?.cancel();
    hitMark.classList.remove('active');
    key=stageWeapons[lesson];
    weapon=weapons[key];
    ammo=weapon.capacity;
    shotUntil=0;
    lastFire=-Infinity;
    burst=0;
    range.dataset.weapon=key;
    id('weapon-name').textContent=weapon.name;
    id('capacity').textContent=weapon.capacity;
    id('weapon-style').textContent=weapon.name+'　·　'+weapon.style;
    aimButton.hidden=!weapon.zoom;
    setScope(false);
    status();
    updateHud();
  }

  function pause(keepScope=false) {
    stopTrigger();
    if(reloadTimer) recoilAnimation?.cancel();
    clearTimeout(reloadTimer);
    reloadTimer=0;
    if(!keepScope) setScope(false);
    if(locked()) document.exitPointerLock?.();
    status();
    updateHud();
  }

  function render(buttons) {
    width=range.clientWidth||1;
    height=range.clientHeight||1;
    if(width!==previousWidth||height!==previousHeight){
      const density=Math.min(window.devicePixelRatio||1,1.75);
      shotCanvas.width=Math.round(width*density);
      shotCanvas.height=Math.round(height*density);
      ctx?.setTransform(density,0,0,density,0,0);
      previousWidth=width;
      previousHeight=height;
    }
    muzzle=viewModel(key,width,height);
    const positions=key==='sniper'?sniperPositions:key==='shotgun'?shotgunPositions:normalPositions;
    const limit=Math.min(height*.39,width*.44);
    targets=[];
    for(const [index,button] of buttons.entries()){
      const position=positions[index];
      const point=camera.available?camera.project(...position):{x:.19+index*.31,y:.45,depth:1};
      const x=point.x*width, y=point.y*height;
      const perspective=(scoped?weapon.zoom:1)*(key==='sniper'?13:9.1)/Math.max(1,point.depth);
      const size=clamp(46*perspective,27,width<600?57:92);
      const visible=point.depth>.55&&point.x>.07&&point.x<.93&&point.y>.11&&point.y<.84
        && (!scoped||Math.hypot(x-width/2,y-height/2)<limit-size*.15)
        && (!camera.available||camera.hasLineOfSight(...position));
      button.hidden=!visible;
      if(!visible) continue;
      const distance=camera.available?Math.hypot(position[0]-camera.state.x,position[1]-camera.state.y,position[2]-camera.state.z):1;
      button.style.left=x+'px';
      button.style.top=y+'px';
      button.style.setProperty('--plate-size',size+'px');
      targets.push({index,x,y,radius:Math.max(23,size*.69),depth:distance});
    }
  }

  function animateView(frames,length) {
    if(calm.matches) return;
    recoilAnimation?.cancel();
    recoilAnimation=view.animate(frames,{duration:length,easing:'ease-out'});
  }

  function reload() {
    if(!canShoot()||reloadTimer||ammo>=weapon.capacity) return;
    status('換彈中');
    play('reload');
    animateView([
      {transform:'none',offset:0},
      {transform:'translate(5%,18%) rotate(10deg)',offset:.34},
      {transform:'translate(5%,18%) rotate(10deg)',offset:.62},
      {transform:'none',offset:1},
    ],weapon.reload);
    reloadTimer=setTimeout(()=>{
      reloadTimer=0;
      ammo=weapon.capacity;
      status('已裝填',650);
      updateHud();
    },weapon.reload);
    updateHud();
  }

  function renderShot(origin, points, hit, directed) {
    if(ctx&&!calm.matches) {
      const start=scoped?{x:width*.52,y:height*.79}:muzzle;
      ctx.clearRect(0,0,width,height);
      for(const [index,p] of points.entries()){
        const line=ctx.createLinearGradient(start.x,start.y,p.x,p.y);
        line.addColorStop(0,index===0?'#ffc16ded':'#ffad6559');
        line.addColorStop(.56,index===0?'#ffdfa66d':'#ffe6a463');
        line.addColorStop(1,'#ffdf810a');
        ctx.strokeStyle=line;
        ctx.lineWidth=index===0?2.4:.9;
        ctx.beginPath();
        ctx.moveTo(start.x,start.y);
        ctx.lineTo(p.x,p.y);
        ctx.stroke();
      }
      if(!scoped){
        const glow=ctx.createRadialGradient(start.x,start.y,0,start.x,start.y,weapon.pellets>1?51:33);
        glow.addColorStop(0,'#fffde6f6');
        glow.addColorStop(.20,'#ffe4a8d9');
        glow.addColorStop(.48,'#ffc46a80');
        glow.addColorStop(1,'#ff933100');
        ctx.fillStyle=glow;
        ctx.fillRect(start.x-52,start.y-52,104,104);
      }
      shotAnimation?.cancel();
      shotAnimation=shotCanvas.animate([{opacity:1},{opacity:0}],154);
    }
    if(hit>=0) {
      hitMark.style.left=origin.x+'px';
      hitMark.style.top=origin.y+'px';
      hitMark.classList.add('active');
      hitAnimation?.cancel();
      hitAnimation=hitMark.animate([{opacity:1},{opacity:0}],245);
      hitAnimation.onfinish=()=>hitMark.classList.remove('active');
    }
    if(!directed&&!calm.matches&&camera.available){
      camera.rotate(weapon.kick*(burst%2===0?.39:-.33),weapon.kick*(scoped?.32:1+burst*.13));
      draw();
    }
    const kick=weapon.pellets>1?6:weapon.zoom?5:3;
    animateView([{transform:'none',offset:0},{transform:'translate('+kick+'%,'+kick+'%) rotate(3deg)',offset:.16},{transform:'none',offset:1}],Math.min(weapon.cadence*.87,280));
  }

  function shoot(origin, directed=false) {
    if(!canShoot()||reloadTimer) return;
    onActivity();
    const now=performance.now();
    if(now<shotUntil) return;
    if(ammo===0) {
      if(trigger!==null&&id('weapon-status').textContent==='彈匣已空') return;
      status('彈匣已空');
      play('empty');
      return;
    }
    burst=weapon.automatic&&now-lastFire<330?burst+1:0;
    lastFire=now;
    shotUntil=now+weapon.cadence;
    ammo--;
    const movingBonus=isMoving()&&!scoped ? 3 : 0;
    const points=pelletsAt(weapon,origin,scoped,movingBonus,burst,directed ? .25 : height/480);
    const possible=[...targets,...otherTargets()];
    const hit=hitTarget(points,possible,weapon.reach);
    play('shot');
    renderShot(origin,points,hit,directed);
    status(ammo===0?'彈匣已空':weapon.cadence>=700?'上膛中…':'',ammo&&weapon.cadence>=700?weapon.cadence:0);
    updateHud();
    if(hit>=0) {
      onHit(hit);
    } else if(weapon.reach&&hitTarget(points,possible)>=0) {
      announce('距離太遠。向前移動，再用散彈槍射擊。',true,true);
    } else {
      announce('未命中資料靶。對準靶心後再開火。',true,true);
    }
  }

  function fireAtCenter() {
    shoot({x:width/2,y:height/2});
  }

  function fireAtPointer(x,y) {
    const bounds=canvas.getBoundingClientRect();
    const point={x:x-bounds.left,y:y-bounds.top};
    if(scoped&&Math.hypot(point.x-width/2,point.y-height/2)>Math.min(height*.39,width*.44)) return;
    shoot(point);
  }

  function fireAtTarget(index) {
    const target=[...targets,...otherTargets()].find(item=>item.index===index);
    if(target&&!locked()) shoot(target,true);
  }

  function startTrigger(token) {
    if(trigger!==null||!canShoot()) return;
    trigger=token;
    fireAtCenter();
    if(weapon.automatic&&trigger===token) repeatTimer=setInterval(fireAtCenter,weapon.cadence);
  }

  function stopTrigger(token=trigger) {
    if(token!==trigger) return;
    clearInterval(repeatTimer);
    repeatTimer=0;
    trigger=null;
  }

  fireButton.addEventListener('pointerdown',e=>{
    if(e.button!==0) return;
    e.preventDefault();
    fireButton.setPointerCapture(e.pointerId);
    startTrigger(e.pointerId);
  });
  fireButton.addEventListener('lostpointercapture',e=>stopTrigger(e.pointerId));
  fireButton.addEventListener('pointerup',e=>stopTrigger(e.pointerId));
  fireButton.addEventListener('click',e=>{if(e.detail===0) fireAtCenter();});
  reloadButton.addEventListener('click',reload);
  aimButton.addEventListener('click',toggleScope);
  range.addEventListener('contextmenu',e=>{
    if(weapon.zoom&&canShoot()){
      e.preventDefault();
      toggleScope();
    }
  });
  id('mute').addEventListener('click',()=>{
    muted=!muted;
    updateMute();
    try { localStorage.setItem('desert-code-muted',muted?'yes':'no'); } catch {}
  });
  updateMute();
  id('mouse-aim').addEventListener('click',async()=>{
    onActivity();
    if(locked()){
      document.exitPointerLock?.();
      return;
    }
    try {
      if(!canvas.requestPointerLock||!camera.available) throw new Error('Unavailable');
      await canvas.requestPointerLock();
    } catch {
      announce('把滑鼠移到場內即可瞄準。',false,true);
    }
  });
  document.addEventListener('pointerlockchange',()=>{
    range.dataset.locked=locked();
    id('mouse-aim').setAttribute('aria-pressed',String(locked()));
    if(!locked()) stopTrigger();
  });
  document.addEventListener('pointerlockerror',()=>announce('把滑鼠移到場內即可瞄準。',false,true));

  return {render,reset,pause,updateHud,locked,turnScale,startTrigger,stopTrigger,fireAtTarget,fireAtPointer,reload,toggleScope};
}
