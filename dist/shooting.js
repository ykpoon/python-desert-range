export const weapons = {
  pistol: {
    name:'手槍', style:'單發 · 低後坐力', capacity:8, cadence:295, reload:800,
    kick:.008, spread:2, pellets:1, tone:135, length:.20,
  },
  rifle: {
    name:'步槍', style:'可連射 · 後坐力逐發增加', capacity:20, cadence:122, reload:1080,
    kick:.011, spread:3.5, pellets:1, tone:92, length:.16, automatic:true,
  },
  shotgun: {
    name:'散彈槍', style:'近距離散射 · 每發需上膛', capacity:5, cadence:710, reload:1240,
    kick:.024, spread:19, pellets:7, reach:9.8, tone:62, length:.31,
  },
  sniper: {
    name:'狙擊槍', style:'3× 瞄準鏡 · 單發上膛', capacity:5, cadence:900, reload:1330,
    kick:.012, spread:16, scopedSpread:0, pellets:1, tone:72, length:.33, zoom:3,
  },
};

export const stageWeapons = ['pistol','rifle','shotgun','sniper','rifle','sniper'];

export function pelletsAt(weapon, point, scoped, movement, burst, scale, random = Math.random) {
  const base = scoped ? weapon.scopedSpread : weapon.spread;
  const spread = (base + movement + Math.min(9,burst) * 1.4) * scale;
  if(weapon.pellets===1) {
    const angle=random()*Math.PI*2;
    const radius=Math.sqrt(random())*spread;
    return [{x:point.x+Math.cos(angle)*radius,y:point.y+Math.sin(angle)*radius}];
  }
  const points=[point];
  const offset=random()*Math.PI*2;
  for(let i=1;i<weapon.pellets;i++){
    const angle=offset+i*Math.PI/3;
    const radius=spread*(.58+random()*.42);
    points.push({x:point.x+Math.cos(angle)*radius,y:point.y+Math.sin(angle)*radius});
  }
  return points;
}

export function hitTarget(points, targets, maxRange = Infinity) {
  let best=null;
  for(const target of targets){
    if(target.depth > maxRange) continue;
    const hits=points.filter(p=>Math.hypot(p.x-target.x,p.y-target.y)<=target.radius).length;
    if(hits && (!best || hits>best.hits || (hits===best.hits && target.depth<best.depth))) {
      best={...target,hits};
    }
  }
  return best?.index ?? -1;
}

export function createRangeSound() {
  let context, noise;
  function play(kind, weapon) {
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio) return;
    try {
      context??=new Audio();
      if(context.state==='suspended') context.resume().catch(()=>{});
      if(!noise) {
        noise=context.createBuffer(1,context.sampleRate*.4,context.sampleRate);
        const samples=noise.getChannelData(0);
        for(let i=0;i<samples.length;i++) samples[i]=Math.random()*2-1;
      }
      const t=context.currentTime;
      const gain=context.createGain();
      gain.connect(context.destination);
      if(kind==='shot'){
        const source=context.createBufferSource();
        const filter=context.createBiquadFilter();
        source.buffer=noise;
        source.connect(filter);
        filter.type='lowpass';
        filter.frequency.setValueAtTime(6300,t);
        filter.frequency.exponentialRampToValueAtTime(380,t+weapon.length);
        filter.connect(gain);
        gain.gain.setValueAtTime(.19,t);
        gain.gain.exponentialRampToValueAtTime(.001,t+weapon.length);
        source.start(t);
        source.stop(t+weapon.length);
        tone(weapon.tone,t,.095,.17,weapon.tone*.4);
        if(weapon.cadence>=700) {
          tone(500,t+.32,.045,.035,165);
          tone(245,t+.44,.045,.03,100);
        }
      } else if(kind==='reload') {
        tone(400,t,.055,.045,180);
        tone(560,t+.2,.07,.045,220);
        tone(310,t+.42,.06,.05,120);
      } else {
        tone(400,t,.035,.04,145);
      }
    } catch { /* Sound is optional on devices without an audio output. */ }
  }
  function tone(hz,start,length,volume,end){
    const osc=context.createOscillator();
    const gain=context.createGain();
    osc.type='triangle';
    osc.frequency.setValueAtTime(hz,start);
    osc.frequency.exponentialRampToValueAtTime(end,start+length);
    gain.gain.setValueAtTime(volume,start);
    gain.gain.exponentialRampToValueAtTime(.001,start+length);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(start);
    osc.stop(start+length);
  }
  return play;
}
