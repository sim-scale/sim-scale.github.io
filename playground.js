/* Small dependency-free browser generator; illustrative, not the research asset engine. */
(() => {
  const canvas = document.querySelector('#asset-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const family = document.querySelector('#asset-family');
  const width = document.querySelector('#asset-width');
  const height = document.querySelector('#asset-height');
  const detail = document.querySelector('#asset-detail');
  const color = document.querySelector('#asset-color');
  let vertices = [], faces = [], yaw = -.55, tilt = .38, seed = 1;
  const add = p => (vertices.push(p), vertices.length - 1);
  const quad = (a,b,c,d) => faces.push([a,b,c],[a,c,d]);
  const N = 48;
  function lathe(profile) {
    const start = vertices.length;
    profile.forEach(([r,z]) => {
      for(let j=0;j<N;j++) { const a=j/N*Math.PI*2; add([r*Math.cos(a),r*Math.sin(a),z]); }
    });
    for(let i=0;i<profile.length-1;i++) for(let j=0;j<N;j++) {
      const a=start+i*N+j,b=start+i*N+(j+1)%N;
      quad(a,b,b+N,a+N);
    }
  }
  function handle(x,z,rx,rz,tube) {
    const start=vertices.length, rings=48, sides=10;
    for(let i=0;i<rings;i++) {
      const a=i/rings*Math.PI*2;
      for(let j=0;j<sides;j++) {
        const b=j/sides*Math.PI*2;
        add([x+(rx+tube*Math.cos(b))*Math.cos(a),tube*Math.sin(b),z+(rz+tube*Math.cos(b))*Math.sin(a)]);
      }
    }
    for(let i=0;i<rings;i++) for(let j=0;j<sides;j++) {
      quad(start+i*sides+j,start+((i+1)%rings)*sides+j,start+((i+1)%rings)*sides+(j+1)%sides,start+i*sides+(j+1)%sides);
    }
  }
  function rod(p,q,r) {
    const d=q.map((v,i)=>v-p[i]), len=Math.hypot(...d), u=d.map(v=>v/len);
    let a=Math.abs(u[2])<.9?[-u[1],u[0],0]:[1,0,0];
    const al=Math.hypot(...a);a=a.map(v=>v/al);
    const b=[u[1]*a[2]-u[2]*a[1],u[2]*a[0]-u[0]*a[2],u[0]*a[1]-u[1]*a[0]];
    const start=vertices.length, n=16;
    for(const end of [p,q]) for(let j=0;j<n;j++) {
      const angle=j/n*Math.PI*2;
      add(end.map((v,i)=>v+r*(Math.cos(angle)*a[i]+Math.sin(angle)*b[i])));
    }
    for(let j=0;j<n;j++) quad(start+j,start+(j+1)%n,start+n+(j+1)%n,start+n+j);
    const c0=add(p),c1=add(q);
    for(let j=0;j<n;j++)faces.push([c0,start+(j+1)%n,start+j],[c1,start+n+j,start+n+(j+1)%n]);
  }
  function generate() {
    vertices=[];faces=[];
    const r=Number(width.value)/200,h=Number(height.value)/100,k=Number(detail.value)/100;
    if(family.value==='tree') {
      lathe([[0,0],[r,0],[r,.055],[r*.92,.09],[0,.09]]);
      rod([0,0,.08],[0,0,h],.045);
      const count=Math.round(2+k*7);
      for(let i=0;i<count;i++) {
        const a=i*2.4+seed*.15,z=.25+(h-.38)*i/Math.max(count-1,1),len=r*.8;
        const end=[Math.cos(a)*len,Math.sin(a)*len,z+.08];
        rod([0,0,z],end,.03);
        rod(end,[end[0]*1.04,end[1]*1.04,end[2]+.1],.03);
      }
    } else {
      const pot=family.value==='pot',H=pot?h*.72:h,t=.038;
      lathe([[0,0],[r*.84,0],[r*.93,.055],[r*.99,H*.14],[r,H],[r-t,H],[r-t,H*.16],[r*.86,.07],[0,.07]]);
      const rx=k*.65,rz=pot?H*.18:H*.29;
      handle(r*.99,H*.53,rx,rz,.043);
      if(pot)handle(-r*.99,H*.53,rx,rz,.043);
    }
    document.querySelector('#width-value').value=`${width.value} mm`;
    document.querySelector('#height-value').value=`${family.value==='pot'?Math.round(Number(height.value)*.72):height.value} mm`;
    document.querySelector('#detail-label').textContent=family.value==='tree'?'Branch count':'Handle size';
    document.querySelector('#detail-value').value=family.value==='tree'?String(Math.round(2+k*7)):`${detail.value}%`;
    document.querySelector('#mesh-count').textContent=`${faces.length.toLocaleString()} triangles`;
    canvas.setAttribute('aria-label',`Generated ${family.options[family.selectedIndex].text}, width ${width.value} millimeters. Drag or use arrow keys to rotate.`);
    canvas.dataset.meshSignature=`${family.value}-${width.value}-${height.value}-${detail.value}-${seed}`;
    render();
  }
  function render() {
    const W=canvas.width,H=canvas.height;
    ctx.clearRect(0,0,W,H); ctx.fillStyle='#ecf1e9';ctx.fillRect(0,0,W,H);
    const bottom=Math.min(...vertices.map(p=>p[2])),top=Math.max(...vertices.map(p=>p[2]));
    const middle=(bottom+top)/2;
    const cy=Math.cos(yaw),sy=Math.sin(yaw),ct=Math.cos(tilt),st=Math.sin(tilt);
    const rotated=vertices.map(([x,y,z])=>{
      const X=x*cy-y*sy,Y=x*sy+y*cy,Z=z-middle;
      return [X,Y*ct-Z*st,Y*st+Z*ct];
    });
    const project=([x,y,z])=>{const scale=350*4/(4+y);return [W*.5+x*scale,H*.5-z*scale];};
    ctx.strokeStyle='#d3dccb';ctx.lineWidth=1;
    for(let i=-5;i<=5;i++) {
      for(const ends of [[[-1.8,i*.3,bottom-middle],[1.8,i*.3,bottom-middle]],[[i*.3,-1.8,bottom-middle],[i*.3,1.8,bottom-middle]]]) {
        const points=ends.map(([x,y,z])=>project([x*cy-y*sy,(x*sy+y*cy)*ct-z*st,(x*sy+y*cy)*st+z*ct]));
        ctx.beginPath();ctx.moveTo(...points[0]);ctx.lineTo(...points[1]);ctx.stroke();
      }
    }
    const rgb=color.value.match(/\w\w/g).map(v=>parseInt(v,16));
    const triangles=faces.map(f=>{
      const p=f.map(i=>rotated[i]),a=p[1].map((v,i)=>v-p[0][i]),b=p[2].map((v,i)=>v-p[0][i]);
      const normal=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],length=Math.hypot(...normal)||1;
      const light=.45+.5*Math.abs((normal[0]*-.4+normal[1]*-.7+normal[2]*.6)/length);
      return {p:p.map(project),depth:p.reduce((s,v)=>s+v[1],0)/3,light};
    }).sort((a,b)=>b.depth-a.depth);
    triangles.forEach(({p,light})=>{
      ctx.fillStyle=`rgb(${rgb.map(v=>Math.round(v*light)).join(',')})`;
      ctx.beginPath();ctx.moveTo(...p[0]);ctx.lineTo(...p[1]);ctx.lineTo(...p[2]);ctx.closePath();ctx.fill();
      ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.45;ctx.stroke();
    });
  }
  [family,width,height,detail,color].forEach(input=>input.addEventListener('input',generate));
  family.addEventListener('change',generate);
  let drag=null;
  canvas.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{
    if(!drag)return;
    yaw+=(e.clientX-drag[0])*.009;tilt=Math.max(-.2,Math.min(.9,tilt+(e.clientY-drag[1])*.006));drag=[e.clientX,e.clientY];render();
  });
  const release=()=>{drag=null;};
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
  canvas.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();if(e.key==='ArrowLeft')yaw-=.12;if(e.key==='ArrowRight')yaw+=.12;
    if(e.key==='ArrowUp')tilt=Math.min(.9,tilt+.08);if(e.key==='ArrowDown')tilt=Math.max(-.2,tilt-.08);render();
  });
  document.querySelector('#sample-asset').addEventListener('click',()=>{
    seed++;let state=seed*7919;const random=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};
    width.value=Math.round(60+random()*80);height.value=Math.round(70+random()*100);detail.value=Math.round(20+random()*50);
    color.value=['#a9da58','#dc9f67','#78b8c0','#cc88a0','#d3c8ac'][seed%5];generate();
    document.querySelector('#asset-status').textContent=`Variant ${seed} sampled locally · no model calls`;
  });
  document.querySelector('#reset-asset').addEventListener('click',()=>{
    family.value='mug';width.value=90;height.value=110;detail.value=40;color.value='#a9da58';seed=1;yaw=-.55;tilt=.38;generate();
    document.querySelector('#asset-status').textContent='Controls reset · local procedural sampling';
  });
  document.querySelector('#download-asset').addEventListener('click',()=>{
    const mm=vertices.map(p=>p.map(v=>v*100));
    const obj=['# SimScale browser playground mesh; units: millimeters', '# Illustrative generator; not validated for simulation or fabrication',...mm.map(p=>`v ${p.map(v=>v.toFixed(5)).join(' ')}`),...faces.map(f=>`f ${f.map(i=>i+1).join(' ')}`)].join('\n');
    const url=URL.createObjectURL(new Blob([obj],{type:'text/plain'})),a=document.createElement('a');a.href=url;a.download=`simscale-playground-${family.value}-${seed}.obj`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    document.querySelector('#asset-status').textContent='Mesh downloaded · OBJ coordinates in millimeters';
  });
  generate();
})();
