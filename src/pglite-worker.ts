import {PGlite} from '@electric-sql/pglite';
import {worker} from '@electric-sql/pglite/worker';
worker({async init(){
 const get=async(name:string)=>{const response=await fetch('/preview/'+name);if(!response.ok)throw new Error('Missing local database asset');return response;};
 const [wasm,initdb,bundle]=await Promise.all([get('pglite.wasm'),get('initdb.wasm'),get('pglite.data')]);
 return PGlite.create({dataDir:'idb://wayfarer-visual-preferences-v1',pgliteWasmModule:await WebAssembly.compile(await wasm.arrayBuffer()),initdbWasmModule:await WebAssembly.compile(await initdb.arrayBuffer()),fsBundle:await bundle.blob()});
}});
