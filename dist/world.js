const radians = Math.PI / 180;
const stone = [0.76, 0.56, 0.37];
const pale = [0.86, 0.70, 0.50];
const adobe = [0.75, 0.49, 0.30];
const wood = [0.39, 0.26, 0.15];
const steel = [0.30, 0.36, 0.33];
const teal = [0.26, 0.47, 0.46];
const brick = [0.81, 0.63, 0.43];
const sand = [0.80, 0.63, 0.43];

function colorScale(color, scale) {
  return color.map(channel => Math.min(1, channel * scale));
}

function buildMesh() {
  const vertices = [];
  const colliders = [];
  let seed = 12718;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function triangle(a, b, c, color, material = 1) {
    const u = b.map((value, axis) => value - a[axis]);
    const v = c.map((value, axis) => value - a[axis]);
    const normal = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const length = Math.hypot(...normal) || 1;
    for (const point of [a, b, c]) vertices.push(...point, ...normal.map(n => n / length), ...color, material);
  }

  function quad(a, b, c, d, color, material) {
    triangle(a, b, c, color, material);
    triangle(a, c, d, color, material);
  }

  function box(x, y, z, w, h, d, color, material = 1, solid = false) {
    const l = x - w / 2, r = x + w / 2, b = y, t = y + h, f = z + d / 2, k = z - d / 2;
    quad([l,b,f],[r,b,f],[r,t,f],[l,t,f], color, material);
    quad([r,b,k],[l,b,k],[l,t,k],[r,t,k], color, material);
    quad([l,b,k],[l,b,f],[l,t,f],[l,t,k], color, material);
    quad([r,b,f],[r,b,k],[r,t,k],[r,t,f], color, material);
    quad([l,t,f],[r,t,f],[r,t,k],[l,t,k], color, material);
    if (solid) colliders.push([l, r, k, f]);
  }

  function shadow(x, z, w, d, opacity = 0.69) {
    const c = colorScale(sand, opacity);
    quad([x-w/2,.008,z+d/2],[x+w/2,.008,z+d/2],[x+w/2,.008,z-d/2],[x-w/2,.008,z-d/2], c, 2);
  }

  function wallFront(x, y, z, w, h, base) {
    const rows = Math.floor(h / .45);
    for (let row = 0; row < rows; row++) {
      const lo = x - w / 2, hi = x + w / 2;
      let start = lo + .08;
      while (start < hi - .15) {
        const width = Math.min(.62 + random() * .62, hi - .08 - start);
        if (random() > .40) {
          box(start + width / 2, y + .11 + row * .45, z, width - .045, .384, .045, colorScale(base, .92 + random() * .19));
        }
        start += width;
      }
    }
  }

  function wallSide(x, y, z, d, h, base) {
    for (let row = 0; row < Math.floor(h / .46); row++) {
      let start = z - d / 2 + .07;
      const end = z + d / 2 - .08;
      while (start < end - .18) {
        const width = Math.min(.62 + random() * .8, end - start);
        if (random() > .37) box(x, y + .08 + row * .46, start + width / 2, .05, .39, width - .05, colorScale(base, .92 + random() * .14));
        start += width;
      }
    }
  }

  function opening(x, y, z, w, h, color = wood) {
    box(x, y, z, w + .22, h + .16, .09, stone);
    box(x, y + .035, z + .058, w, h, .045, colorScale(color, .61), 0);
    for (let column = 1; column < 5; column++) {
      box(x - w / 2 + column * w / 5, y + .04, z + .09, .035, h - .035, .024, colorScale(color, 1.2), 0);
    }
    box(x, y - .08, z + .1, w + .38, .12, .27, pale);
  }

  function arch(x,z,radius,pillar, depth, color) {
    const spring = 2.63;
    for (const side of [-1,1]) {
      box(x+side*(radius+pillar/2),0,z,pillar,spring,depth,color,1,true);
      for (let level=0; level<6; level++) {
        box(x+side*(radius+pillar/2),.065+level*.43,z+depth/2,pillar+.09,.36,.09,colorScale(color,.93+random()*.17));
      }
    }
    for (let part=0;part<13;part++) {
      const a=part*Math.PI/13+.012, b=(part+1)*Math.PI/13-.012;
      const p=(angle, r, front)=>[x+Math.cos(angle)*r,spring+Math.sin(angle)*r,z+(front?depth/2:-depth/2)];
      const out=radius+pillar, shade=colorScale(color,.91+random()*.19);
      quad(p(a,out,true),p(b,out,true),p(b,radius,true),p(a,radius,true),shade,1);
      quad(p(a,radius,false),p(a,radius,true),p(b,radius,true),p(b,radius,false),colorScale(shade,.76),1);
      quad(p(a,out,true),p(a,out,false),p(b,out,false),p(b,out,true),shade,1);
    }
  }

  function crate(x,z,width=1.45,height=1.3,y=0) {
    box(x,y,z,width,height,width,wood,1,true);
    for (let n=0;n<5;n++) {
      const off=(n-2)*width/5;
      box(x+off,y+.06,z+width/2,width/5-.025,height-.12,.035,colorScale(wood,1.28+random()*.36));
      box(x-width/2,y+.06,z+off,.035,height-.12,width/5-.026,colorScale(wood,1.25+random()*.3));
      box(x+width/2,y+.06,z+off,.035,height-.12,width/5-.026,colorScale(wood,1.25+random()*.3));
    }
    for (const level of [y+.13,y+height-.23]) {
      box(x,level,z,width+.12,.12,width+.12,colorScale(wood,.68),0);
    }
    shadow(x+.26,z-.17,width*1.19,width*1.2,.70);
  }

  function awning(x,y,z,w,d,color) {
    const strips=7;
    for (let i=0;i<strips;i++) {
      const l=x-w/2+i*w/strips, r=l+w/strips;
      const c=colorScale(color,i%2 ? 1.12 : .93);
      quad([l,y-.49,z+d],[r,y-.49,z+d],[r,y,z],[l,y,z],c,0);
      quad([l,y-.77,z+d],[r,y-.77,z+d],[r,y-.49,z+d],[l,y-.49,z+d],c,0);
    }
    for (const offset of [-w/2+.08,w/2-.08]) box(x+offset,0,z+d-.07,.08,y-.52,.09,wood,0);
  }

  function cylinder(x,y,z,r,h,color,material=1,segments=10) {
    for(let side=0;side<segments;side++) {
      const a=side*Math.PI*2/segments,b=(side+1)*Math.PI*2/segments;
      const p=(a,level)=>[x+Math.sin(a)*r,level,z+Math.cos(a)*r];
      quad(p(a,y),p(b,y),p(b,y+h),p(a,y+h),color,material);
      triangle([x,y+h,z],p(a,y+h),p(b,y+h),color,material);
    }
  }

  function palm(x,z,h) {
    cylinder(x,0,z,.12,h,wood,1,7);
    const y=h;
    for(let i=0;i<10;i++) {
      const a=i*2.399, ca=Math.cos(a), sa=Math.sin(a), reach=1.2+random()*1.2;
      const p=(d,offset,dy)=>[x+ca*d-sa*offset,y+dy,z+sa*d+ca*offset];
      const dark=[.33,.39,.20], light=[.46,.49,.26];
      quad(p(0,0,0),p(reach*.55,.27,.21),p(reach,0,-.55),p(reach*.55,0,.37),dark,0);
      quad(p(0,0,0),p(reach*.55,0,.37),p(reach,0,-.55),p(reach*.55,-.25,.21),light,0);
    }
  }

  quad([-55,0,32],[55,0,32],[55,0,-74],[-55,0,-74],sand,2);
  for(let i=0;i<58;i++){
    const x=(random()-.5)*25, z=12-random()*35, w=.17+random()*.65;
    box(x,.01,z,w,.019,.10+random()*.40,colorScale(sand,.88+random()*.20),1);
  }
  for(let i=0;i<24;i++){
    const x=-31+i*2.8, z=-47-random()*13, height=2.1+random()*4.3;
    box(x,0,z,3+random()*3,height,4+random()*6,colorScale(pale,.79+random()*.22));
  }

  // The foreground opens from a narrow market lane into a shaded courtyard.
  box(-9.24,0,3.1,4.45,7.75,14.7,stone,1,true);
  wallSide(-7,0,3.1,14.6,7.7,stone);
  box(-7.04,5.08,3.1,.26,.18,14.8,adobe);
  box(-7.04,7.68,3.1,.38,.28,14.94,pale);
  box(-6.97,.02,3.1,.25,.22,14.83,adobe);
  box(-8.8,7.7,-3.5,4.25,1.25,2.3,pale);
  for(let i=0;i<5;i++) box(-7.03,7.88, -3+i*3.2, .43,.44,.62,stone);
  awning(-6.03,3.12,.9,2.0,2.72,teal);

  box(9.23,0,2,4.0,7.15,16.2,pale,1,true);
  wallSide(7.22,0,2,16.1,7.1,pale);
  box(7.20,5.73,2,.28,.18,16.36,brick);
  box(7.21,7.12,2,.41,.29,16.38,brick);
  box(7.20,.02,2,.34,.20,16.38,stone);
  box(9.07,7.16,1.22,2.4,1.20,6.18,pale);
  for(let i=0;i<4;i++) {
    const z=-3.8+i*3.55;
    box(7.16,3.93,z,.095,1.15,.68,wood,0);
    box(7.08,3.91,z,.29,.14,.94,brick);
    box(7.08,5.06,z,.23,.16,.93,stone);
    for(let j=-1;j<=1;j++) box(7.09,3.96,z+j*.15,.07,1.0,.056,steel,0);
  }
  awning(6.06,3.3,-4.7,2.32,2.6,[.62,.29,.22]);
  shadow(-5.91,2.9,2.1,2.69,.68);
  shadow(5.65,4.0,3.25,13.2,.71);

  box(-9.1,0,-9.94,9.0,6.5,5.62,brick,1,true);
  wallFront(-9.1,0,-7.1,9,6.45,brick);
  box(-9.1,5.68,-7.02,9.15,.18,.30,pale);
  box(-10.11,6.46,-10.20,5.5,1.68,4.5,stone);
  opening(-6.45,0,-7.03,1.63,2.9);
  opening(-9,3.4,-7.03,.74,1.25);
  box(9.15,0,-12.4,10.2,7.16,6.6,stone,1,true);
  wallFront(9.15,0,-9.09,10.05,7.0,stone);
  box(9.15,5.98,-9,10.42,.24,.34,pale);
  box(9.15,7.13,-9,10.41,.28,.40,adobe);
  opening(5.4,.08,-9.02,1.36,2.48);
  opening(8.85,3.84,-9.02,.86,1.42);

  arch(0,-12,2.65,.56,1.02,pale);
  box(-3.85,0,-12,1.45,5.6,1.06,brick,1,true);
  box(3.85,0,-12,1.45,5.6,1.06,brick,1,true);
  box(0,5.81,-12,8.99,.34,1.24,adobe);
  box(0,5.51,-12,8.95,.29,1.06,pale);
  for(let i=-5;i<=5;i++) box(i*.78,6.15,-12,.42,.42,1.17,pale);
  arch(.2,-22,3.25,.56,.92,adobe);
  box(0,0,-28,12,4.5,1.6,stone,1,true);
  wallFront(0,0,-27.18,11.9,4.4,stone);
  opening(0,0,-27.12,1.75,3.1);
  palm(-3.58,-18.9,7.4);
  palm(4.54,-21.5,8.4);
  palm(-9.1,-11.6,9.2);

  crate(-5.77,5.8,1.43,1.25);
  crate(-5.53,4.69,1.19,.98);
  crate(5.56,2.5,1.58,1.4);
  crate(5.56,2.5,1.27,1.1,1.4);
  crate(4.66,-6.42,1.14,.94);
  crate(-5.13,-5.79,1.15,.97);

  for (const [x,z] of [[-6.26,8.5],[6.31,7.1],[6.23,-5.7]]) {
    cylinder(x,0,z,.39,.84,steel);
    cylinder(x,.10,z,.416,.08,colorScale(steel,1.45),0);
    cylinder(x,.66,z,.416,.06,colorScale(steel,1.45),0);
    cylinder(x,.84,z,.34,.055,steel);
  }
  for(const [x,z] of [[-3.9,-1.5],[0,-2.2],[3.9,-1.5]]){
    shadow(x,z,1.86,1.33,.76);
    cylinder(x,0,z,.73,.11,steel,1,8);
    cylinder(x,.105,z,.58,.10,colorScale(steel,.69),0,8);
    cylinder(x,.202,z,.43,.018,colorScale(teal,1.60),0,8);
  }
  return { vertices:new Float32Array(vertices), colliders };
}

const vertexShader = `
attribute vec3 point;
attribute vec3 normal;
attribute vec3 tint;
attribute float material;
uniform vec3 eye;
uniform vec2 turn;
uniform vec2 focal;
varying vec3 vPoint;
varying vec3 vNormal;
varying vec3 vTint;
varying float vMaterial;
varying float vDepth;
void main(){
  vec3 p=point-eye;
  float sx=p.x*cos(turn.x)+p.z*sin(turn.x);
  float dir=p.x*sin(turn.x)-p.z*cos(turn.x);
  float sy=p.y*cos(turn.y)-dir*sin(turn.y);
  float depth=p.y*sin(turn.y)+dir*cos(turn.y);
  gl_Position=vec4(sx*focal.x,sy*focal.y,depth*1.003-0.16,depth);
  vPoint=point;
  vNormal=normal;
  vTint=tint;
  vMaterial=material;
  vDepth=depth;
}
`;
const fragmentShader = `
precision mediump float;
varying vec3 vPoint;
varying vec3 vNormal;
varying vec3 vTint;
varying float vMaterial;
varying float vDepth;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*4375.5453);}
float layered(vec2 p){
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
}
void main(){
  vec2 plane=abs(vNormal.y)>.5?vPoint.xz:vec2(vPoint.x+vPoint.z,vPoint.y);
  float grain=(hash(floor(plane*92.))-.5)*.105;
  float cloud=(layered(plane*2.4)-.5)*.16+(layered(plane*11.)-.5)*.13;
  float amt=clamp(vMaterial,0.,1.);
  float light=.68+.38*max(0.,dot(vNormal,normalize(vec3(-.35,.75,.47))));
  vec3 rgb=vTint*(light+(grain+cloud)*amt);
  rgb=mix(rgb, vec3(.79,.71,.56), smoothstep(15.,63.,vDepth)*.63);
  gl_FragColor=vec4(rgb,1.);
}
`;

function softwareRenderer(canvas, vertices) {
  const context = canvas.getContext('2d', {alpha:false});
  if (!context) return null;
  const faces = [];
  const pointAt = index => [vertices[index], vertices[index + 1], vertices[index + 2]];
  const mix = (a,b, amount) => a.map((x,i) => x + (b[i]-x)*amount);
  const coordinate = (a,b) => Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);

  function split(a,b,c,normal,tint) {
    const ab = coordinate(a,b), bc = coordinate(b,c), ca = coordinate(c,a);
    if (Math.max(ab,bc,ca)>5.2) {
      if (ab >= bc && ab >= ca) {
        const m=mix(a,b,.5);
        split(a,m,c,normal,tint);
        split(m,b,c,normal,tint);
      } else if (bc>=ca) {
        split(b,c,a,normal,tint);
      } else {
        split(c,a,b,normal,tint);
      }
      return;
    }
    faces.push({a,b,c,normal,tint});
  }

  for (let i=0;i<vertices.length;i+=30) {
    const a=pointAt(i), b=pointAt(i+10), c=pointAt(i+20);
    const normal=pointAt(i+3), tint=pointAt(i+6);
    // The large level sand plane is drawn first beneath the sorted faces.
    if (a[1]===0 && b[1]===0 && c[1]===0 && Math.abs(a[0])>=55) continue;
    split(a,b,c,normal,tint);
  }

  function clipNear(points) {
    const result=[];
    let a=points.at(-1);
    for (const b of points) {
      const aVisible=a[2]>=.14, bVisible=b[2]>=.14;
      if (aVisible!==bVisible) result.push(mix(a,b,(.14-a[2])/(b[2]-a[2])));
      if (bVisible) result.push(b);
      a=b;
    }
    return result;
  }

  return (camera,focalX,focalY) => {
    const width=canvas.width, height=canvas.height;
    if (!width || !height) return;
    const cy=Math.cos(camera.yaw), sy=Math.sin(camera.yaw);
    const cp=Math.cos(camera.pitch), sp=Math.sin(camera.pitch);
    const horizon=height*(.5+Math.tan(camera.pitch)*focalY*.5);
    const sky=context.createLinearGradient(0,0,0,height);
    sky.addColorStop(0,'#82a8ba');
    sky.addColorStop(.55,'#d7d3ba');
    sky.addColorStop(1,'#eadcc8');
    context.fillStyle=sky;
    context.fillRect(0,0,width,height);
    const glow=context.createRadialGradient(width*.18,height*.19,0,width*.18,height*.19,width*.45);
    glow.addColorStop(0,'#fff1bd91');
    glow.addColorStop(1,'#fff1bd00');
    context.fillStyle=glow;
    context.fillRect(0,0,width,height);
    const sandGradient=context.createLinearGradient(0,0,0,height);
    sandGradient.addColorStop(0,'#e2c49a');
    sandGradient.addColorStop(.62,'#b7885d');
    sandGradient.addColorStop(1,'#9c704b');
    context.fillStyle=sandGradient;
    const floor=Math.max(0,horizon);
    context.fillRect(0,floor,width,Math.max(0,height-floor));
    const projected=[];
    function transform([x,y,z]) {
      const dx=x-camera.x, dy=y-camera.y, dz=z-camera.z;
      const dir=dx*sy-dz*cy;
      return [dx*cy+dz*sy,dy*cp-dir*sp,dy*sp+dir*cp];
    }
    for (const {a,b,c,normal,tint} of faces) {
      const facing=(camera.x-a[0])*normal[0]+(camera.y-a[1])*normal[1]+(camera.z-a[2])*normal[2];
      if (facing<-.5) continue;
      const points=[transform(a),transform(b),transform(c)];
      const clipped=points.every(p=>p[2]>=.14)?points:clipNear(points);
      if (!clipped.length) continue;
      const polygon=clipped.map(([x,y,z])=>[width*(.5+x*focalX/z*.5),height*(.5-y*focalY/z*.5)]);
      if (polygon.every(([x])=>x<0) || polygon.every(([x])=>x>width) || polygon.every(([,y])=>y<0) || polygon.every(([,y])=>y>height)) continue;
      const depth=clipped.reduce((sum,p)=>sum+p[2],0)/clipped.length;
      const light=.70+.38*Math.max(0,normal[0]*-.35+normal[1]*.75+normal[2]*.47);
      const fog=Math.min(.56,Math.max(0,(depth-16)*.013));
      const channels=mix(colorScale(tint,light),[.80,.72,.57],fog).map(n=>Math.round(n*255));
      projected.push({polygon,depth,color:'rgb('+channels.join(',')+')'});
    }
    projected.sort((a,b)=>b.depth-a.depth);
    context.lineWidth=.75;
    for (const {polygon,color} of projected) {
      context.beginPath();
      context.moveTo(...polygon[0]);
      for (const point of polygon.slice(1)) context.lineTo(...point);
      context.closePath();
      context.fillStyle=color;
      context.strokeStyle=color;
      context.fill();
      context.stroke();
    }
  };
}

export function createWorld(canvas) {
  const state = {x:0,y:1.70,z:8.6,yaw:0,pitch:.005};
  const gl = canvas.getContext('webgl',{antialias:true,alpha:true,powerPreference:'low-power'});
  const {vertices,colliders}=buildMesh();
  let draw = () => {};
  let focalX = 1, focalY = 1;
  const camera = { state, available:Boolean(gl), draw:()=>draw(), reset, project, move, rotate, useSoftware };
  let lastWidth=0, lastHeight=0;
  let activeCanvas=canvas;

  function reset() {
    Object.assign(state,{x:0,y:1.70,z:8.6,yaw:0,pitch:.005});
  }

  function updateSize() {
    const dimensions=canvas.getBoundingClientRect();
    const width=dimensions.width || 1, height=dimensions.height || 1;
    const aspect=width/height;
    focalY=1/Math.tan(51*radians/2);
    focalX=Math.min(focalY/aspect,1.09);
    focalY=focalX*aspect;
    if(width!==lastWidth || height!==lastHeight){
      const density=Math.min(window.devicePixelRatio||1,1.65);
      activeCanvas.width=Math.round(width*density);
      activeCanvas.height=Math.round(height*density);
      if(gl && activeCanvas===canvas) gl.viewport(0,0,canvas.width,canvas.height);
      lastWidth=width;
      lastHeight=height;
    }
  }

  function project(x,y,z) {
    const p=[x-state.x,y-state.y,z-state.z];
    const side=p[0]*Math.cos(state.yaw)+p[2]*Math.sin(state.yaw);
    const dir=p[0]*Math.sin(state.yaw)-p[2]*Math.cos(state.yaw);
    const up=p[1]*Math.cos(state.pitch)-dir*Math.sin(state.pitch);
    const depth=p[1]*Math.sin(state.pitch)+dir*Math.cos(state.pitch);
    return {x:.5+.5*side*focalX/depth,y:.5-.5*up*focalY/depth,depth};
  }

  function move(strafe, forward) {
    const dx=Math.cos(state.yaw)*strafe+Math.sin(state.yaw)*forward;
    const dz=Math.sin(state.yaw)*strafe-Math.cos(state.yaw)*forward;
    function clear(x,z) {
      return x>-6.76&&x<6.95&&z<10.2&&z>-24.7 && !colliders.some(([l,r,k,f])=>x>l-.24&&x<r+.24&&z>k-.24&&z<f+.24);
    }
    if(clear(state.x+dx,state.z)) state.x+=dx;
    if(clear(state.x,state.z+dz)) state.z+=dz;
  }

  function rotate(x,y) {
    state.yaw=(state.yaw+x)%(Math.PI*2);
    state.pitch=Math.min(.69,Math.max(-.65,state.pitch+y));
  }

  function shader(type,code) {
    const item=gl.createShader(type);
    gl.shaderSource(item,code);
    gl.compileShader(item);
    if(!gl.getShaderParameter(item,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(item));
    return item;
  }

  function useSoftware() {
    if (activeCanvas !== canvas) return;
    activeCanvas=document.createElement('canvas');
    activeCanvas.setAttribute('aria-hidden','true');
    canvas.before(activeCanvas);
    canvas.style.opacity='0';
    const paint=softwareRenderer(activeCanvas,vertices);
    camera.available=Boolean(paint);
    lastWidth=0;
    lastHeight=0;
    draw=paint?()=>{
      updateSize();
      paint(state,focalX,focalY);
    }:()=>{};
  }

  if(gl) {
    try {
      const program=gl.createProgram();
      gl.attachShader(program,shader(gl.VERTEX_SHADER,vertexShader));
      gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragmentShader));
      gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      const buffer=gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
      for(const [attribute, components, offset] of [['point',3,0],['normal',3,12],['tint',3,24],['material',1,36]]){
        const at=gl.getAttribLocation(program,attribute);
        gl.enableVertexAttribArray(at);
        gl.vertexAttribPointer(at,components,gl.FLOAT,false,40,offset);
      }
      const eye=gl.getUniformLocation(program,'eye');
      const turn=gl.getUniformLocation(program,'turn');
      const focal=gl.getUniformLocation(program,'focal');
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0,0,0,0);
      draw=()=>{
        updateSize();
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        gl.uniform3f(eye,state.x,state.y,state.z);
        gl.uniform2f(turn,state.yaw,state.pitch);
        gl.uniform2f(focal,focalX,focalY);
        gl.drawArrays(gl.TRIANGLES,0,vertices.length/10);
      };
    } catch(error) {
      console.error('3D rendering:',error);
      useSoftware();
    }
  } else useSoftware();
  return camera;
}
