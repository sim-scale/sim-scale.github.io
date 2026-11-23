// Runs the AssetEngine Python generators in a Web Worker (Pyodide, with manifold's WebAssembly build for mesh
// Booleans). Only the newest build request is kept while a build runs.
import {loadPyodide} from 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.mjs';
import Manifold from './vendor/manifold.js';

let py=null,busy=false,queued=null;
const post=(msg,transfer)=>self.postMessage(msg,transfer||[]);

async function start(){
  post({type:'progress',stage:'Loading Python runtime'});
  py=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'});
  post({type:'progress',stage:'Loading NumPy'});
  const [bundle,manifold]=await Promise.all([
    fetch('media/generators/webgen.zip').then(r=>{if(!r.ok)throw new Error('generator bundle request failed');return r.arrayBuffer();}),
    Manifold({locateFile:f=>new URL(`vendor/${f}`,self.location.href).href}),
    py.loadPackage('numpy',{messageCallback:()=>{}}),
  ]);
  manifold.setup();
  py.registerJsModule('manifold_js',manifold);
  py.unpackArchive(bundle,'zip',{extractDir:'/webgen'});
  post({type:'progress',stage:'Loading generators'});
  py.runPython(`import sys; sys.path.insert(0, '/webgen')
import webgen_stubs
import webgen_runtime as R
R._patch_sdk()`);
  const cats=JSON.parse(py.runPython(`import json; json.dumps({k: {"title": v["title"]} for k, v in R.CATS.items()})`));
  post({type:'ready',categories:cats});
}

function describe(key){
  return JSON.parse(py.runPython(`json.dumps(R.describe(${JSON.stringify(key)}))`));
}

function build({id,key,settings,fallback}){
  const t0=performance.now();
  py.globals.set('_settings_json',JSON.stringify(settings||{}));
  py.globals.set('_fallback_json',JSON.stringify(fallback||null));
  const result=py.runPython(`R.build(${JSON.stringify(key)}, json.loads(_settings_json), json.loads(_fallback_json))`);
  const out=result.toJs({dict_converter:Object.fromEntries});
  result.destroy();
  const transfer=[];
  const parts=out.parts.map(p=>{
    const positions=new Float32Array(p.positions.slice().buffer),indices=new Uint32Array(p.indices.slice().buffer);
    transfer.push(positions.buffer,indices.buffer);
    return {link:p.link,name:p.name,finish:p.finish,group:p.group,positions,indices};
  });
  post({type:'mesh',id,key,parts,joints:out.joints,controls:out.controls,adjusted:out.adjusted||null,ms:performance.now()-t0},transfer);
}

async function pump(){
  if(busy||!queued||!py)return;
  busy=true;const job=queued;queued=null;
  try{build(job);}catch(e){post({type:'error',id:job.id,key:job.key,message:String(e.message||e).split('\n').filter(Boolean).slice(-1)[0]});}
  busy=false;setTimeout(pump,0);
}

const ready=start().catch(e=>post({type:'fatal',message:String(e.message||e)}));
self.onmessage=async({data})=>{
  await ready;if(!py)return;
  if(data.type==='describe'){
    try{post({type:'controls',key:data.key,spec:describe(data.key)});}catch(e){post({type:'error',key:data.key,message:String(e.message||e)});}
  }else if(data.type==='build'){queued=data;pump();}
};
