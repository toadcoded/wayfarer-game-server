import test from 'node:test';import assert from 'node:assert/strict';import {rasterIso} from '../dist/iso-raster.js';
const project=p=>({x:p.x-p.z+4,y:(p.x+p.z)/2-p.y+4});
test('depth wins independently of face order, including overlaid terrain and bridge',()=>{const low={points:[{x:-2,y:0,z:-2},{x:2,y:0,z:-2},{x:0,y:0,z:2}],color:'#008800'},high={points:low.points.map(p=>({x:p.x+1,y:1,z:p.z+1})),color:'#aa4400'};const a=rasterIso(12,12,[low,high],project),b=rasterIso(12,12,[high,low],project);assert.deepEqual(a,b);assert.deepEqual([...a.slice((4*12+4)*4,(4*12+4)*4+3)],[170,68,0]);});
test('raster bounds are capped',()=>{for(const n of [0,-1,NaN,1.5,20000])assert.throws(()=>rasterIso(n,n,[],project));});
