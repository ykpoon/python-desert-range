const baseEyeHeight=1.70;
export const patrolIds=[3,4];

export function jumpHeight(seconds) {
  return Math.max(0, 5.4*seconds-7.5*seconds*seconds);
}

export function createPatrol() {
  const robots=patrolIds.map((id,i)=>({id,side:i===0?-1:1,until:0}));
  let elapsed, count, turn, nextAttack, shot;
  reset();

  function reset() {
    elapsed=0;
    count=3;
    turn=0;
    nextAttack=7.2;
    shot=null;
    for(const robot of robots) robot.until=0;
  }

  function position(robot) {
    const phase=robot.side<0?0:1.38;
    return [
      robot.side*(2.7+.57*Math.sin(elapsed*1.31+phase)),
      1.10+.033*Math.sin(elapsed*7+phase),
      2.7+.68*Math.cos(elapsed*.97+phase),
    ];
  }

  function advance(seconds, camera) {
    elapsed+=seconds;
    if(!count) return null;
    if(shot?.kind==='flight'&&elapsed>=shot.at+.72) {
      const dodged= Math.hypot(camera.state.x-shot.x,camera.state.z-shot.z)>.67
        || camera.state.y-baseEyeHeight>.32 || !camera.hasLineOfSight(...position(shot.robot));
      shot=null;
      if(!dodged) count--;
      return dodged?'dodge':count?'hit':'defeat';
    }
    if(shot?.kind==='warning'&&elapsed>=shot.at+1.4) {
      if(!camera.hasLineOfSight(...position(shot.robot))) {
        shot=null;
        return null;
      }
      shot={kind:'flight',robot:shot.robot,at:elapsed,x:camera.state.x,z:camera.state.z};
      return 'fire';
    }
    if(!shot&&elapsed>=nextAttack){
      const available=[robots[turn],robots[1-turn]].find(robot=>robot.until<=elapsed&&camera.hasLineOfSight(...position(robot)));
      if(!available) {
        nextAttack=elapsed+1.15;
        return null;
      }
      turn=1-robots.indexOf(available);
      shot={kind:'warning',robot:available,at:elapsed};
      nextAttack=elapsed+8;
      return 'warning';
    }
    return null;
  }

  function stun(id) {
    const robot=robots.find(item=>item.id===id);
    if(!robot||robot.until>elapsed) return false;
    robot.until=elapsed+6;
    if(shot?.robot===robot) shot=null;
    return true;
  }

  return {
    robots,position,reset,advance,stun,
    get time(){return elapsed;},
    get health(){return count;},
    get attack(){return shot;},
  };
}

export function createPatrolView({range,camera,onTarget}) {
  const layer=document.getElementById('patrol-targets');
  const bolt=document.getElementById('patrol-bolt');
  const hearts=document.getElementById('health');
  const patrol=createPatrol();
  const buttons=patrol.robots.map((robot,i)=>{
    const button=document.createElement('button');
    button.type='button';
    button.className='training-robot';
    button.setAttribute('aria-label','訓練假人 '+(i+1));
    button.innerHTML='<span class="robot-head"></span><span class="robot-body"></span><span class="robot-arm left"></span><span class="robot-arm right"></span><span class="robot-leg left"></span><span class="robot-leg right"></span><span class="robot-label">提示</span>';
    button.addEventListener('click',()=>onTarget(robot.id));
    return button;
  });
  layer.replaceChildren(...buttons);
  let active=false, targets=[];

  function render(show=true){
    const width=range.clientWidth, height=range.clientHeight;
    const scoped=range.dataset.scoped==='true';
    const attack=patrol.attack;
    layer.dataset.live=active&&show;
    let origin;
    targets=[];
    for(const [i,robot] of patrol.robots.entries()){
      const button=buttons[i];
      const position=patrol.position(robot);
      const point=camera.available&&camera.project(...position);
      const x=point?.x*width,y=point?.y*height;
      const size=Math.max(32,Math.min(height*.59,height*(scoped?3:1)*1.79/(point?.depth||1)));
      const visible=show&&point&&point.depth>.65&&point.x>.035&&point.x<.965&&point.y>.14&&point.y<.85
        && (!scoped||Math.hypot(x-width/2,y-height/2)<Math.min(height*.39,width*.44)-size*.19)
        && camera.hasLineOfSight(...position);
      button.hidden=!visible;
      if(!visible) continue;
      button.style.left=x+'px';
      button.style.top=y+'px';
      button.style.setProperty('--robot-size',size+'px');
      const stunned=robot.until>patrol.time;
      button.dataset.state=stunned?'stunned':attack?.robot===robot?attack.kind:'patrol';
      button.disabled=stunned;
      if(!stunned) {
        const distance=Math.hypot(position[0]-camera.state.x,position[1]-camera.state.y,position[2]-camera.state.z);
        targets.push({x,y,depth:distance,index:robot.id,radius:Math.max(17,size*.24)});
      }
      if(attack?.robot===robot) origin={x,y};
    }
    bolt.hidden=attack?.kind!=='flight'||!show;
    if(bolt.hidden) return;
    const from=origin??{x:attack.robot.side<0?0:width,y:height*.45};
    const progress=Math.min(1,(patrol.time-attack.at)/.72);
    const x=from.x+(width*.5-from.x)*progress;
    const y=from.y+(height*.49-from.y)*progress;
    bolt.style.left=x+'px';
    bolt.style.top=y+'px';
    bolt.style.transform='translate(-50%, -50%) scale('+(1+progress*2)+')';
  }

  function updateHealth(){
    hearts.setAttribute('aria-label','生命值 '+patrol.health+' / 3');
    for(const [i,heart] of Array.from(hearts.children).entries()) heart.classList.toggle('lost',i>=patrol.health);
  }

  function reset(){
    active=false;
    patrol.reset();
    updateHealth();
  }

  return {
    render,reset,
    start(){active=true;},
    stop(){active=false;render(false);},
    update(seconds){
      if(!active) return null;
      const event=patrol.advance(seconds,camera);
      if(event==='hit'||event==='defeat') updateHealth();
      return event;
    },
    stun(id){return patrol.stun(id);},
    get active(){return active;},
    get health(){return patrol.health;},
    get targets(){return targets;},
  };
}
