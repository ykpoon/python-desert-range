const metal='#3e464a', edge='#697274', black='#1b242b', dark='#212b30';
const stock='#6c6553', olive='#535c3f', accent='#d8a84d', orange='#bd7545';
const glove='#32362b', glovePanel='#706b52', sleeve='#77715c';

// The view model uses the same camera-relative perspective for all four original meshes.
function model(key) {
  const faces=[];
  const add=(points,color,shade)=>faces.push({points,color,shade});
  function box(x,y,z,w,h,l,color, bevel=0) {
    const outlines=[];
    for(const back of [-1,1]) {
      const a=x-w/2,b=x+w/2,c=y-h/2,d=y+h/2;
      const s=Math.min(w/3,h/3,bevel);
      outlines.push([[a+s,c],[b-s,c],[b,c+s],[b,d-s],[b-s,d],[a+s,d],[a,d-s],[a,c+s]].map(([x,y])=>[x,y,z+back*l/2]));
    }
    const [near,far]=outlines;
    add(near, color,.80);
    add(far, color,.65);
    const lights=[.62,.88,.91,1.13,1.25,1.12,.83,.70];
    for(let i=0;i<8;i++){
      const n=(i+1)%8;
      add([near[i],near[n],far[n],far[i]],color,lights[i]);
    }
  }
  function tube(x,y,z,r,l,color,rim=false) {
    const segments=10;
    const rings=[z-l/2,z+l/2].map(z=>Array.from({length:segments},(_,i)=>{
      const angle=i*Math.PI*2/segments;
      return [x+Math.cos(angle)*r,y+Math.sin(angle)*r,z];
    }));
    for(let i=0;i<segments;i++){
      const n=(i+1)%segments;
      add([rings[0][i],rings[0][n],rings[1][n],rings[1][i]],color,.86+Math.sin(i*Math.PI/5)*.31);
    }
    add(rings[0],rim?'#161c20':color,.92);
    add(rings[1],black,.65);
    if(rim) {
      const inner=rings[0].map(([a,b,c])=>[x+(a-x)*.76,y+(b-y)*.76,c-.004]);
      for(let i=0;i<segments;i++){
        const n=(i+1)%segments;
        add([rings[0][i],rings[0][n],inner[n],inner[i]],edge,1.22);
      }
      add(inner,'#466b70',.77);
    }
  }
  function hand(x,y,z, supporting=false) {
    box(x,y-.33,z-.22,.48,.48,supporting?1.03:.87,sleeve,.09);
    box(x,y-.15,z+.03,.44,.26,.31,glovePanel,.05);
    box(x,y,z+.14,.36,.32,.42,glove,.075);
    box(x+.15,y+.03,z+.19,.15,.21,.26,glovePanel,.036);
    for(let i=0;i<3;i++) box(x+.16,y+.13-i*.085,z+.34,.12,.069,.17,glove,.02);
  }

  const handgun=key==='pistol';
  hand(.07,-.29,-.27);
  if(handgun) {
    box(0,-.17,.24,.223,.51,.27,dark,.04);
    box(.104,-.23,.19,.025,.29,.23,black,.02);
    box(0,.075,.46,.28,.17,.92,dark,.025);
    box(0,.185,.53,.31,.205,.99,metal,.034);
    box(0,.286,.53,.22,.025,.92,edge,.008);
    box(.150,.187,.75,.02,.112,.30,black,.009);
    tube(0,.194,1.02,.077,.16,edge);
    box(0,.323,.125,.14,.053,.09,black,.012);
    box(0,.319,.957,.065,.051,.069,black,.011);
    box(0,.346,.946,.04,.014,.021,accent,.004);
    for(let i=0;i<5;i++) box(.155,.193,.22+i*.054,.012,.12,.022,black,.003);
    return faces;
  }

  const rifle=key==='rifle', pump=key==='shotgun', scoped=key==='sniper';
  const finish=rifle?olive:pump?orange:stock;
  box(0,-.065,-.51,.26,.31,.70,dark,.045);
  box(0,-.095,-.867,.31,.43,.095,black,.04);
  box(0,-.06,-.56,.27,.29,.53,finish,.045);
  box(0,-.19,.024,.21,.38,.27,dark,.05);
  box(0,.11,.40,.34,.244,.94,metal,.04);
  box(0,.23,.44,.28,.050,1.0,edge,.012);
  box(.178,.109,.42,.015,.11,.39,black,.01);
  box(.19,.13,.37,.03,.037,.13,edge,.009);
  box(.176,.07,.64,.016,.034,.13,accent,.007);
  hand(.08,-.21,rifle?1.11:pump?1.39:1.28,true);

  if(rifle) {
    box(0,-.18,.58,.22,.43,.285,black,.027);
    box(0,-.37,.61,.24,.17,.31,dark,.03);
    box(0,.117,1.21,.29,.25,.73,finish,.046);
    for(let i=0;i<5;i++) box(.146,.13,.96+i*.102,.025,.055,.068,dark,.006);
    tube(0,.165,1.76,.061,.46,black);
    tube(0,.165,2.0,.086,.16,edge);
    box(0,.306,.30,.16,.10,.18,black,.017);
    box(0,.306,1.53,.09,.13,.076,black,.014);
    box(0,.371,1.53,.044,.035,.048,accent,.005);
  } else if(pump) {
    tube(0,.20,1.54,.091,1.37,metal);
    tube(0,.035,1.44,.069,.94,black);
    box(0,.015,1.25,.32,.209,.60,orange,.05);
    for(let i=0;i<6;i++) box(.165,.027,1.03+i*.086,.021,.128,.030,stock,.007);
    tube(0,.20,2.19,.108,.115,edge);
    box(0,.300,2.21,.05,.048,.042,accent,.008);
  } else if(scoped) {
    box(0,.099,1.19,.31,.22,.71,finish,.045);
    tube(0,.165,1.97,.065,1.07,dark);
    tube(0,.165,2.56,.091,.22,metal);
    box(0,.32,.43,.125,.20,.14,black,.018);
    box(0,.32,.88,.125,.20,.14,black,.018);
    tube(0,.49,.62,.118,.76,black);
    tube(0,.49,.23,.163,.29,metal,true);
    tube(0,.49,1.025,.173,.294,dark);
    tube(0,.49,.103,.175,.041,edge,true);
    box(0,.61,.66,.122,.105,.105,edge,.017);
    box(.135,.49,.66,.104,.104,.11,metal,.027);
    box(0,-.13,.67,.205,.27,.26,dark,.025);
  }
  return faces;
}

export function createWeaponView(canvas) {
  const ctx=canvas.getContext('2d');
  const models=Object.fromEntries(['pistol','rifle','shotgun','sniper'].map(key=>[key,model(key)]));
  const muzzleDepth={pistol:1.10,rifle:2.08,shotgun:2.24,sniper:2.67};
  const shade=(hex,level)=>{
    const channels=hex.slice(1).match(/../g).map(value=>Math.min(255,Math.round(parseInt(value,16)*level)));
    return 'rgb('+channels.join(',')+')';
  };
  let previous='';
  let muzzle={x:0,y:0};
  return function render(key,width,height) {
    if(!ctx||!width||!height) return muzzle;
    const layout=[key,width,height].join(':');
    if(previous===layout) return muzzle;
    previous=layout;
    const dpr=Math.min(window.devicePixelRatio||1,1.75);
    canvas.width=Math.round(width*dpr);
    canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const scale=Math.min(height*.61,width*.69);
    const anchorX=width*(width<600?.80:.73),anchorY=height*.94;
    function project([x,y,z]){
      const px=x*.89-z*.47, py=y*.86+z*.33+x*.07;
      const depth=z*.81+x*.57-y*.14;
      const perspective=scale/(1.26+depth*.23);
      return [anchorX+px*perspective,anchorY-py*perspective,depth];
    }
    const sorted=models[key].map(face=>{
      const p=face.points.map(project);
      return {p,depth:p.reduce((sum,a)=>sum+a[2],0)/p.length,color:shade(face.color,face.shade)};
    }).sort((a,b)=>b.depth-a.depth);
    ctx.lineWidth=.85;
    for(const {p,color} of sorted){
      ctx.beginPath();
      ctx.moveTo(p[0][0],p[0][1]);
      for(const point of p.slice(1)) ctx.lineTo(point[0],point[1]);
      ctx.closePath();
      ctx.fillStyle=color;
      ctx.strokeStyle=color;
      ctx.fill();
      ctx.stroke();
    }
    const [x,y]=project([0,.18,muzzleDepth[key]]);
    muzzle={x,y};
    return muzzle;
  };
}
