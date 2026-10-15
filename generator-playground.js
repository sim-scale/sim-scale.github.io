import * as THREE from './vendor/three.module.min.js';

// Exact precompiled outputs of the original Python generators; no mesh interpolation.
const canvas=document.querySelector('#asset-canvas');
const family=document.querySelector('#asset-family');
const sliders=['width','height','detail'].map(id=>document.querySelector(`#asset-${id}`));
const outputs=['width','height','detail'].map(id=>document.querySelector(`#${id}-value`));
const labels=['width','height','detail'].map(id=>document.querySelector(`#${id}-label`));
const status=document.querySelector('#asset-status'),color=document.querySelector('#asset-color');
const download=document.querySelector('#download-asset');
let manifest,current,geometry,revision=0,yaw=-.55,tilt=.25,drag;
const cache=new Map();
try {
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
 renderer.setClearColor('#ecf1e9');renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.001,100),group=new THREE.Group();
 camera.up.set(0,0,1);scene.add(group,new THREE.HemisphereLight(0xffffff,0x74856a,2.2));
 const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-3,-4,6);scene.add(light);
 const material=new THREE.MeshStandardMaterial({color:color.value,roughness:.65,metalness:.05,side:THREE.DoubleSide});
 const render=()=>{
  const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  group.rotation.set(tilt,0,yaw);renderer.render(scene,camera);
 };
 new ResizeObserver(render).observe(canvas);
 const load=variant=>{
  if(!cache.has(variant.file))cache.set(variant.file,(async()=>{
   const r=await fetch(`media/generator-preview/${variant.file}`);if(!r.ok)throw new Error('Mesh request failed');
   const buffer=await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
   const header=new DataView(buffer),nv=header.getUint32(0,true),nf=header.getUint32(4,true);
   if(nv!==variant.vertices||nf!==variant.triangles)throw new Error('Mesh does not match manifest');
   return {positions:new Float32Array(buffer,8,nv*3),indices:new Uint32Array(buffer,8+nv*12,nf*3)};
  })());return cache.get(variant.file);
 };
 const update=async()=>{
  const token=++revision,cfg=manifest.families[family.value],key=sliders.map(s=>s.value).join('-');
  const variant=cfg.variants.find(v=>v.key===key);
  cfg.axes.forEach((axis,i)=>{labels[i].textContent=axis.label;outputs[i].value=`${Math.round(axis.values[sliders[i].value]*axis.scale)} ${axis.unit}`;sliders[i].setAttribute('aria-valuetext',outputs[i].value);});
  status.textContent='Loading original generator output…';download.disabled=true;
  try {
   const data=await load(variant);if(token!==revision)return;
   const next=new THREE.BufferGeometry();next.setAttribute('position',new THREE.BufferAttribute(data.positions,3));
   next.setIndex(new THREE.BufferAttribute(data.indices,1));next.computeVertexNormals();next.computeBoundingBox();
   const center=next.boundingBox.getCenter(new THREE.Vector3()),size=next.boundingBox.getSize(new THREE.Vector3());
   const mesh=new THREE.Mesh(next,material);mesh.position.copy(center).multiplyScalar(-1);group.clear();group.add(mesh);
   geometry?.dispose();geometry=next;
   const span=Math.max(size.x,size.y,size.z);camera.position.set(0,-span*2.6,span*.9);camera.lookAt(0,0,0);
   current={family:family.value,variant,data};canvas.dataset.meshSignature=`${family.value}-${key}`;canvas.dataset.meshSha256=variant.sha256;
   canvas.setAttribute('aria-label',`${cfg.label}, original generator output. ${cfg.axes.map((a,i)=>a.label+' '+outputs[i].value).join(', ')}. Drag or use arrow keys to rotate.`);
   document.querySelector('#mesh-count').textContent=`${variant.triangles.toLocaleString()} triangles`;
   document.querySelector('#generator-id').textContent=`${cfg.source_dataset} · source ${cfg.source_generator_sha256.slice(0,12)}`;
   status.textContent=`Original generator output · ${cfg.variants.length} combinations per family`;download.disabled=false;render();
  }catch(e){if(token===revision)status.textContent=`Preview unavailable: ${e.message}. Reload to retry.`;}
 };
 fetch('media/generator-preview/manifest.json').then(r=>{if(!r.ok)throw new Error('Manifest request failed');return r.json();}).then(data=>{
  manifest=data;family.disabled=false;sliders.forEach(s=>s.disabled=false);
  document.querySelector('#sample-asset').disabled=false;document.querySelector('#reset-asset').disabled=false;update();
 }).catch(e=>{status.textContent=`Preview unavailable: ${e.message}`;});
 family.addEventListener('change',update);sliders.forEach(s=>s.addEventListener('input',update));
 color.addEventListener('input',()=>{material.color.set(color.value);render();});
 canvas.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw+=(e.clientX-drag[0])*.009;tilt=Math.max(-.7,Math.min(.7,tilt+(e.clientY-drag[1])*.006));drag=[e.clientX,e.clientY];render();});
 ['pointerup','pointercancel','lostpointercapture'].forEach(type=>canvas.addEventListener(type,()=>{drag=null;}));
 canvas.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();
  yaw+=e.key==='ArrowLeft'?-.12:e.key==='ArrowRight'?.12:0;tilt=Math.max(-.7,Math.min(.7,tilt+(e.key==='ArrowUp'?.08:e.key==='ArrowDown'?-.08:0)));render();
 });
 document.querySelector('#sample-asset').addEventListener('click',()=>{
  const old=sliders.map(s=>s.value).join('-'),choices=manifest.families[family.value].variants.filter(v=>v.key!==old);
  choices[Math.floor(Math.random()*choices.length)].key.split('-').forEach((v,i)=>sliders[i].value=v);update();
 });
 document.querySelector('#reset-asset').addEventListener('click',()=>{family.value='mug';sliders.forEach(s=>s.value='1');color.value='#a9da58';material.color.set(color.value);yaw=-.55;tilt=.25;update();});
 download.addEventListener('click',()=>{
  if(!current)return;const {positions:p,indices:f}=current.data;
  const lines=['# SimScale original Python generator output','# Units: meters; up: Z',`# Source SHA-256: ${manifest.families[current.family].source_generator_sha256}`,`# Parameters: ${JSON.stringify(current.variant.parameters)}`];
  for(let i=0;i<p.length;i+=3)lines.push(`v ${p[i]} ${p[i+1]} ${p[i+2]}`);
  for(let i=0;i<f.length;i+=3)lines.push(`f ${f[i]+1} ${f[i+1]+1} ${f[i+2]+1}`);
  const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain'})),a=document.createElement('a');
  a.href=url;a.download=`simscale-${current.family}-${current.variant.key}.obj`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
}catch(e){status.textContent='This 3D preview needs WebGL. The asset videos above remain available.';}
