import * as THREE from './vendor/three.module.min.js';

// Interactive AssetEngine generators: every slider move runs the original Python generator in a Web
// Worker (generator-worker.js) and shows the exact mesh it returns. Nothing is precomputed or interpolated.
const $=s=>document.querySelector(s);
const canvas=$('#asset-canvas'),family=$('#asset-family'),fields=$('#gen-controls'),status=$('#asset-status');
const openBox=$('#gen-open'),openInput=$('#gen-open-input'),openOut=$('#gen-open-value');
const bodyColor=$('#asset-color'),accentColor=$('#accent-color'),swatches=$('#gen-swatches');
const download=$('#download-asset'),randomBtn=$('#sample-asset'),resetBtn=$('#reset-asset');
const meshCount=$('#mesh-count'),overlay=$('#gen-overlay'),timing=$('#gen-timing');
const TASK=['mug','mug_tree','pot','cooktop','charger','drawer_cabinet'];
// Glaze colors of the paper figures; the accent colors handles, knobs, and legs.
const PALETTE=['#7c9781','#59799e','#ad6c50','#c4a44b','#458186','#815073','#cea29b','#a297c8','#90934b','#767e86','#953845','#bfb3a0'];
const DEFAULT_BODY='#7c9781',DEFAULT_ACCENT='#2f3338';

let worker=null,categories=null,spec=null,settings={},latest=0,shown=0,current=null,fitNext=true;
let yaw=.6,tilt=.42,zoom=1,drag=null,radius=.3,targetZ=.15;
const setStatus=t=>{status.textContent=t;};

// ---------- Rendering ----------
let renderer,scene,camera,group,pivot,shadow,materials,view=null;
try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor('#eef2ec');
  renderer.outputColorSpace=THREE.SRGBColorSpace;
}catch(e){renderer=null;}
if(renderer){
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(30,1,.005,50);camera.up.set(0,0,1);
  group=new THREE.Group();pivot=new THREE.Group();pivot.add(group);scene.add(pivot);
  scene.add(new THREE.HemisphereLight(0xffffff,0x8a9486,1.9));
  const key=new THREE.DirectionalLight(0xffffff,2.4);key.position.set(-2.5,-3.5,5);scene.add(key);
  const rim=new THREE.DirectionalLight(0xffffff,.9);rim.position.set(3,2.5,2);scene.add(rim);
  materials={
    body:new THREE.MeshStandardMaterial({color:DEFAULT_BODY,roughness:.55,metalness:.02,side:THREE.DoubleSide}),
    light:new THREE.MeshStandardMaterial({color:DEFAULT_BODY,roughness:.8,metalness:0,side:THREE.DoubleSide}),
    dark:new THREE.MeshStandardMaterial({color:DEFAULT_ACCENT,roughness:.45,metalness:.1,side:THREE.DoubleSide}),
    steel:new THREE.MeshStandardMaterial({color:'#c3c8ce',roughness:.3,metalness:.55,side:THREE.DoubleSide}),
  };
  materials.silver=materials.steel;
  materials.decal=new THREE.MeshStandardMaterial({color:'#333',roughness:.3,metalness:.05,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  // A soft contact shadow under the asset.
  const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
  const grad=g.createRadialGradient(64,64,4,64,64,64);grad.addColorStop(0,'rgba(40,52,40,.32)');grad.addColorStop(1,'rgba(40,52,40,0)');
  g.fillStyle=grad;g.fillRect(0,0,128,128);
  shadow=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));
  scene.add(shadow);
}
const render=()=>{
  if(!renderer)return;const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
  renderer.setSize(w,h,false);camera.aspect=w/h;
  // Far enough that the bounding sphere fits the narrower field of view.
  const half=Math.min(camera.fov/2,Math.atan(Math.tan(camera.fov*Math.PI/360)*camera.aspect)*180/Math.PI)*Math.PI/180;
  const d=radius/Math.sin(half)*1.08*zoom;
  camera.position.set(Math.sin(yaw)*Math.cos(tilt)*d,-Math.cos(yaw)*Math.cos(tilt)*d,Math.sin(tilt)*d+targetZ);
  camera.lookAt(0,0,targetZ);camera.near=d/100;camera.far=d*10;camera.updateProjectionMatrix();renderer.render(scene,camera);
};
if(renderer)new ResizeObserver(render).observe(canvas);

function tint(hex,amount){const c=new THREE.Color(hex);return c.lerp(new THREE.Color('#ffffff'),amount);}
function applyColors(){
  if(!materials)return;
  materials.body.color.set(bodyColor.value);materials.light.color.copy(tint(bodyColor.value,.42));materials.decal.color.set(bodyColor.value).multiplyScalar(.42);materials.dark.color.set(accentColor.value);
  swatches.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.color===bodyColor.value)));
  render();
}

// Normals that stay sharp at creases (box edges) and smooth on curved surfaces (lathes, lofts).
function creasedGeometry(positions,indices,crease=Math.cos(32*Math.PI/180)){
  const nTri=indices.length/3,pos=new Float32Array(nTri*9),nor=new Float32Array(nTri*9),fn=new Float32Array(nTri*3);
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  for(let t=0;t<nTri;t++){
    for(let k=0;k<3;k++){const i=indices[3*t+k];pos.set(positions.subarray(3*i,3*i+3),9*t+3*k);}
    a.fromArray(pos,9*t);b.fromArray(pos,9*t+3);c.fromArray(pos,9*t+6);
    b.sub(a);c.sub(a);b.cross(c);const l=b.length()||1;fn[3*t]=b.x/l;fn[3*t+1]=b.y/l;fn[3*t+2]=b.z/l;
  }
  const groups=new Map(),q=v=>Math.round(v*1e5);
  for(let t=0;t<nTri;t++)for(let k=0;k<3;k++){
    const o=9*t+3*k,key=q(pos[o])+','+q(pos[o+1])+','+q(pos[o+2]);
    let g=groups.get(key);if(!g)groups.set(key,g=[]);g.push(t);
  }
  for(let t=0;t<nTri;t++)for(let k=0;k<3;k++){
    const o=9*t+3*k,g=groups.get(q(pos[o])+','+q(pos[o+1])+','+q(pos[o+2]));
    let x=0,y=0,z=0;
    for(const s of g){const d=fn[3*s]*fn[3*t]+fn[3*s+1]*fn[3*t+1]+fn[3*s+2]*fn[3*t+2];if(d>=crease){x+=fn[3*s];y+=fn[3*s+1];z+=fn[3*s+2];}}
    const l=Math.hypot(x,y,z)||1;nor[o]=x/l;nor[o+1]=y/l;nor[o+2]=z/l;
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.BufferAttribute(nor,3));
  return geo;
}

// Link frames from the joint tree, with movable joints opened by a fraction of their range.
const originMatrix=(xyz,rpy)=>new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rpy[0],rpy[1],rpy[2],'ZYX')).setPosition(xyz[0],xyz[1],xyz[2]);
function linkFrames(joints,links,open){
  const byChild=new Map(joints.map(j=>[j.child,j])),frames=new Map();
  const frame=name=>{
    if(frames.has(name))return frames.get(name);
    const j=byChild.get(name);let m=new THREE.Matrix4();
    if(j){
      m=frame(j.parent).clone().multiply(originMatrix(j.xyz,j.rpy));
      const lo=j.lower??0,hi=j.upper??0,q=j.type==='continuous'?0:lo+open*(hi-lo);
      const axis=new THREE.Vector3(...j.axis).normalize();
      if(j.type==='prismatic')m.multiply(new THREE.Matrix4().makeTranslation(axis.x*q,axis.y*q,axis.z*q));
      else if(j.type==='revolute')m.multiply(new THREE.Matrix4().makeRotationAxis(axis,q));
    }
    frames.set(name,m);return m;
  };
  links.forEach(frame);return frames;
}
// The turn that the paper figures give each category, so that the asset faces the camera.
function orientation(){
  const rule=view?.orient,joints=current.joints,pts=[];
  const moving=new Set(joints.filter(j=>j.type==='revolute'||j.type==='prismatic').map(j=>j.child));
  const children=new Set(joints.map(j=>j.child));
  const boxOf=pred=>{const b=new THREE.Box3();group.children.forEach(m=>{if(pred(m.userData.link))b.expandByObject(m);});return b;};
  group.children.forEach(m=>{const p=m.geometry.attributes.position,v=new THREE.Vector3();for(let i=0;i<p.count;i++)pts.push(v.fromBufferAttribute(p,i).applyMatrix4(m.matrix).clone());});
  const all=new THREE.Box3().setFromPoints(pts),ext=all.getSize(new THREE.Vector3());
  const snap=a=>Math.round(a/(Math.PI/2))*Math.PI/2;
  if(typeof rule==='number')return [rule*Math.PI/180,0];
  if(rule==='front'){
    const st=boxOf(l=>!children.has(l)),mv=boxOf(l=>moving.has(l));if(st.isEmpty()||mv.isEmpty())return [0,0];
    const sc=st.getCenter(new THREE.Vector3()),shift=mv.getCenter(new THREE.Vector3()).sub(sc),se=st.getSize(new THREE.Vector3());
    if(Math.hypot(shift.x/Math.max(se.x,1e-6),shift.y/Math.max(se.y,1e-6))<.15)return [0,0];
    return [snap(-Math.PI/2-Math.atan2(shift.y,shift.x)),0];
  }
  if(rule==='back_tall'){
    const top=pts.filter(p=>p.z>all.min.z+.7*ext.z);if(!top.length)return [0,0];
    const c=all.getCenter(new THREE.Vector3()),m=top.reduce((a,p)=>a.add(p),new THREE.Vector3()).divideScalar(top.length).sub(c);
    return Math.hypot(m.x/Math.max(ext.x,1e-6),m.y/Math.max(ext.y,1e-6))>.08?[snap(Math.PI/2-Math.atan2(m.y,m.x)),0]:[0,0];
  }
  if(rule==='long_x'||rule==='handles_x')return [ext.y>1.05*ext.x?Math.PI/2:0,0];
  if(rule==='lay_x'){
    if(ext.z>Math.max(ext.x,ext.y))return [ext.y>ext.x?Math.PI/2:0,Math.PI/2];
    return [ext.y>1.05*ext.x?Math.PI/2:0,0];
  }
  return [0,0];
}
function pose(){
  if(!current)return;
  const frames=linkFrames(current.joints,[...new Set(current.parts.map(p=>p.link))],Number(openInput.value));
  group.children.forEach(m=>{m.matrixAutoUpdate=false;m.matrix.copy(frames.get(m.userData.link));});
  if(fitNext){const [yawObj,tiltObj]=orientation();pivot.rotation.set(0,tiltObj,yawObj,'ZYX');}
  pivot.position.set(0,0,0);pivot.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(pivot),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
  pivot.position.set(-center.x,-center.y,-box.min.z);pivot.updateMatrixWorld(true);
  if(fitNext){radius=Math.max(.03,.5*Math.hypot(size.x,size.y,size.z));targetZ=size.z/2;fitNext=false;}
  const s=Math.max(size.x,size.y)*1.6+.02;shadow.scale.set(s,s,1);shadow.position.set(0,0,.0005);
  render();
}
function show(msg){
  const geoms=new Map();
  for(const p of msg.parts){const k=p.link+'|'+p.finish;if(!geoms.has(k))geoms.set(k,[]);geoms.get(k).push(p);}
  group.children.forEach(m=>m.geometry.dispose());group.clear();
  let tris=0;
  for(const list of geoms.values()){
    let nv=0,ni=0;list.forEach(p=>{nv+=p.positions.length;ni+=p.indices.length;});
    const P=new Float32Array(nv),I=new Uint32Array(ni);let ov=0,oi=0;
    for(const p of list){P.set(p.positions,ov);for(let i=0;i<p.indices.length;i++)I[oi+i]=p.indices[i]+ov/3;ov+=p.positions.length;oi+=p.indices.length;}
    tris+=ni/3;
    const mesh=new THREE.Mesh(creasedGeometry(P,I),materials[list[0].finish]||materials.body);
    mesh.userData.link=list[0].link;group.add(mesh);
  }
  current=msg;pose();
  meshCount.textContent=`${tris.toLocaleString()} triangles`;
  timing.textContent=`generated in ${Math.max(1,Math.round(msg.ms))} ms`;
}

// ---------- Controls ----------
const fmt=(v,unit)=>{
  if(typeof v!=='number')return String(v);
  if(unit==='m')return v<1?`${(v*100).toFixed(1)} cm`:`${v.toFixed(2)} m`;
  if(unit==='rad')return `${(v*180/Math.PI).toFixed(0)}°`;
  if(unit==='deg')return `${v.toFixed(0)}°`;
  if(unit==='ratio')return `×${v.toFixed(2)}`;
  return Math.abs(v)>=10?v.toFixed(0):v.toFixed(3);
};
function renderControls(){
  fields.innerHTML='';
  spec.controls.forEach((c,i)=>{
    const id=`gen-c-${i}`,box=document.createElement('div');box.className='gen-field';box.dataset.factor=c.factor;
    if(c.kind==='choice'){
      box.innerHTML=`<span class="gen-label" id="${id}">${c.label}</span><div class="gen-seg" role="radiogroup" aria-labelledby="${id}"></div><span class="gen-note"></span>`;
      const seg=box.querySelector('.gen-seg');
      c.values.forEach((v,k)=>{const b=document.createElement('button');b.type='button';b.setAttribute('role','radio');b.textContent=c.labels[k];b.dataset.value=JSON.stringify(v);
        b.addEventListener('click',()=>{settings[c.factor]=v;mark(box,v);request();});seg.append(b);});
    }else{
      box.innerHTML=`<label class="gen-label" for="${id}">${c.label}<output for="${id}"></output></label><input id="${id}" type="range" min="0" max="1" step="0.001" value="0.5"><span class="gen-range" aria-hidden="true"><span></span><span></span></span><span class="gen-note"></span>`;
      const input=box.querySelector('input');
      input.addEventListener('input',()=>{settings[c.factor]=['q',Number(input.value)];request();});
    }
    fields.append(box);
  });
}
function mark(box,v){box.querySelectorAll('button').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.value===JSON.stringify(v))));}
function sync(controls){
  for(const box of fields.children){
    const c=spec.controls.find(x=>x.factor===box.dataset.factor),s=controls[c.factor];if(!s)continue;
    box.classList.toggle('inactive',!s.active);
    box.querySelector('.gen-note').textContent=s.active?'':'Not used with the current choices';
    if(c.kind==='choice'){mark(box,s.value);continue;}
    const input=box.querySelector('input'),out=box.querySelector('output');
    out.value=fmt(s.value,c.unit);input.setAttribute('aria-valuetext',out.value);
    const [lo,hi]=box.querySelectorAll('.gen-range span');
    if(!c.derived&&typeof s.low==='number'){lo.textContent=fmt(s.low,c.unit);hi.textContent=fmt(s.high,c.unit);}
    if(!(c.factor in settings)&&s.high>s.low&&typeof s.position==='number')input.value=String((s.position-s.low)/(s.high-s.low));
  }
}
function resetView(){zoom=1;fitNext=true;if(view){yaw=(view.azimuth+90)*Math.PI/180;tilt=view.elevation*Math.PI/180;}}
// At most one build in flight: moves made while the generator runs collapse into one newest request.
let inflight=false,pending=false;
function request(){
  if(!worker||!spec)return;
  if(inflight){pending=true;return;}
  inflight=true;worker.postMessage({type:'build',id:++latest,key:spec.key,settings:structuredClone(settings)});
}
function settle(){inflight=false;if(pending){pending=false;request();}}
function selectCategory(key){
  spec=null;pending=false;settings={};fitNext=true;
  worker.postMessage({type:'describe',key});
}
function setEnabled(on){[family,randomBtn,resetBtn].forEach(e=>e.disabled=!on);download.disabled=!(on&&current);}

function startWorker(){
  if(worker)return;
  if(!renderer){setStatus('This interactive preview needs WebGL. The asset videos above remain available.');return;}
  if(typeof WebAssembly!=='object'){setStatus('This interactive preview needs WebAssembly.');return;}
  overlay.hidden=false;setStatus('Starting the Python generators in your browser (about 10 MB, downloaded once)…');
  worker=new Worker(new URL('./generator-worker.js',import.meta.url),{type:'module'});
  worker.onerror=()=>{setStatus('The generator runtime failed to start. Please reload to retry.');overlay.hidden=true;};
  worker.onmessage=({data:m})=>{
    if(m.type==='progress'){overlay.querySelector('span').textContent=m.stage+'…';}
    else if(m.type==='fatal'){overlay.hidden=true;setStatus(`The generator runtime failed to start (${m.message}). Please reload to retry.`);}
    else if(m.type==='ready'){
      categories=m.categories;family.innerHTML='';
      const rest=Object.keys(categories).filter(k=>!TASK.includes(k)).sort((a,b)=>categories[a].title.localeCompare(categories[b].title));
      for(const [label,keys] of [['Task objects',TASK],['Other categories',rest]]){
        const g=document.createElement('optgroup');g.label=label;keys.forEach(k=>g.append(new Option(categories[k].title,k)));family.append(g);
      }
      family.value='mug';selectCategory(family.value);
    }else if(m.type==='controls'){
      if(m.key!==family.value)return;spec=m.spec;view=spec.view;resetView();renderControls();request();
    }else if(m.type==='mesh'){
      settle();if(m.id<shown||m.key!==spec?.key)return;shown=m.id;
      overlay.hidden=true;
      openBox.hidden=!m.joints.some(j=>j.type==='revolute'||j.type==='prismatic');
      show(m);sync(m.controls);setEnabled(true);
      setStatus(`${spec.title} · original AssetEngine generator, run live in your browser`);
    }else if(m.type==='error'){
      if(m.id)settle();if(m.id&&m.id<shown)return;
      setStatus(`The generator rejected this combination (${m.message}). Move a slider to try another.`);
    }
  };
}

family.addEventListener('change',()=>selectCategory(family.value));
openInput.addEventListener('input',()=>{openOut.value=`${Math.round(openInput.value*100)}%`;pose();});
bodyColor.addEventListener('input',applyColors);accentColor.addEventListener('input',applyColors);
PALETTE.forEach(hex=>{const b=document.createElement('button');b.type='button';b.className='gen-swatch';b.style.background=hex;b.dataset.color=hex;
  b.setAttribute('aria-label',`Body color ${hex}`);b.addEventListener('click',()=>{bodyColor.value=hex;applyColors();});swatches.append(b);});
randomBtn.addEventListener('click',()=>{
  if(!spec)return;settings={};
  for(const c of spec.controls){
    if(c.kind==='choice')settings[c.factor]=c.values[Math.floor(Math.random()*c.values.length)];
    else{const t=Math.random();settings[c.factor]=['q',t];fields.querySelector(`[data-factor="${c.factor}"] input`).value=String(t);}
  }
  request();
});
resetBtn.addEventListener('click',()=>{
  if(!spec)return;settings={};fields.querySelectorAll('input[type=range]').forEach(i=>i.value='0.5');
  bodyColor.value=DEFAULT_BODY;accentColor.value=DEFAULT_ACCENT;openInput.value='0.6';openOut.value='60%';
  resetView();applyColors();request();
});
download.addEventListener('click',()=>{
  if(!current)return;
  const lines=['# SimScale AssetEngine generator output (meters, Z up)',`# Category: ${spec.title}`];
  for(const c of spec.controls){const s=current.controls[c.factor];if(s)lines.push(`# ${c.label}: ${JSON.stringify(s.value)}`);}
  let base=1;const v=new THREE.Vector3();
  group.children.forEach(m=>{
    const p=m.geometry.attributes.position;lines.push(`o ${m.userData.link}`);
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);lines.push(`v ${v.x.toFixed(6)} ${v.y.toFixed(6)} ${v.z.toFixed(6)}`);}
    for(let i=0;i<p.count;i+=3)lines.push(`f ${base+i} ${base+i+1} ${base+i+2}`);base+=p.count;
  });
  const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain'})),a=document.createElement('a');
  a.href=url;a.download=`simscale-${spec.key}.obj`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});

// Orbit (one pointer), pinch zoom (two pointers), wheel zoom, and double-click to reset the view.
const pointers=new Map();let pinch=null;
canvas.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,[e.clientX,e.clientY]);canvas.setPointerCapture(e.pointerId);
  if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1]),zoom};drag=null;}else drag=[e.clientX,e.clientY];});
canvas.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,[e.clientX,e.clientY]);
  if(pinch&&pointers.size===2){const [a,b]=[...pointers.values()];zoom=Math.max(.45,Math.min(2.5,pinch.zoom*pinch.d/Math.max(1,Math.hypot(a[0]-b[0],a[1]-b[1]))));render();return;}
  if(!drag)return;yaw-=(e.clientX-drag[0])*.008;tilt=Math.max(-.15,Math.min(1.35,tilt+(e.clientY-drag[1])*.006));drag=[e.clientX,e.clientY];render();
});
['pointerup','pointercancel','lostpointercapture'].forEach(t=>canvas.addEventListener(t,e=>{pointers.delete(e.pointerId);if(pointers.size<2)pinch=null;if(!pointers.size)drag=null;}));
canvas.addEventListener('wheel',e=>{if(!current)return;e.preventDefault();zoom=Math.max(.45,Math.min(2.5,zoom*Math.exp(e.deltaY*.001)));render();},{passive:false});
canvas.addEventListener('dblclick',()=>{if(!current)return;resetView();pose();});
canvas.addEventListener('keydown',e=>{
  const k={ArrowLeft:[.12,0],ArrowRight:[-.12,0],ArrowUp:[0,.08],ArrowDown:[0,-.08]}[e.key];if(!k)return;e.preventDefault();
  yaw+=k[0];tilt=Math.max(-.15,Math.min(1.35,tilt+k[1]));render();
});

// Start the runtime only when the playground comes near the viewport, so the rest of the page loads as before.
applyColors();
const section=$('#playground');
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();startWorker();}},{rootMargin:'600px 0px'});
  io.observe(section);
}else startWorker();
