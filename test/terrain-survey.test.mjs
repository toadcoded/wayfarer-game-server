import test from 'node:test';
import assert from 'node:assert/strict';
import {surveyChunk} from '../dist/terrain-survey.js';
import {buildAtlas} from '../dist/world-atlas.js';
import {generateChunk} from '../dist/world.js';
import {REALM_WORLD} from '../dist/realm-scene.js';
const flat=()=>({cx:-1,cz:-2,heights:Array(289).fill(5),waterDepths:Array(256).fill(0)});
test('flat terrain has one component and deterministic interior candidate in negative chunk',()=>{
 const c=flat(),s=surveyChunk(c);assert.equal(s.openCells,256);assert.equal(s.components,1);assert.equal(s.largestComponent,256);assert.deepEqual(s.candidate,{cell:119,x:-34,y:5,z:-98});assert.deepEqual(s,surveyChunk(c));assert.equal(c.heights[0],5);
});
test('water wall separates components without row wrapping',()=>{
 const c=flat();for(let z=0;z<16;z++)c.waterDepths[z*16+7]=1;
 const s=surveyChunk(c);assert.equal(s.waterCells,16);assert.equal(s.components,2);assert.equal(s.largestComponent,128);assert.ok(s.candidate.cell%16>=9);
});
test('grade boundary is inclusive and steeper ground has no candidate',()=>{
 const c=flat();c.heights=c.heights.map((_,i)=>i%17*2);assert.equal(surveyChunk(c).openCells,256);
 c.heights=c.heights.map(h=>h*1.01);const s=surveyChunk(c);assert.equal(s.steepCells,256);assert.equal(s.candidate,null);assert.equal(s.components,0);
});
test('tiny dry islands cannot supply arrival patches and water wins classification',()=>{
 const c=flat();c.waterDepths.fill(2);c.waterDepths[119]=0;const s=surveyChunk(c);assert.equal(s.openCells,1);assert.equal(s.candidate,null);
 c.heights[0]=100;assert.equal(surveyChunk(c).cells[0],'water');
});
test('survey rejects malformed grids and thresholds',()=>{
 for(const grade of [NaN,Infinity,-1,2])assert.throws(()=>surveyChunk(flat(),grade));
 for(const field of ['heights','waterDepths']){const c=flat();c[field][0]=NaN;assert.throws(()=>surveyChunk(c));c[field]=[];assert.throws(()=>surveyChunk(c));}
});
test('all atlas samples produce bounded honest surveys with open candidate neighborhoods',()=>{
 for(const a of buildAtlas(REALM_WORLD)){
 const c=generateChunk(REALM_WORLD,Math.floor(a.x/64),Math.floor(a.z/64)),s=surveyChunk(c);
 assert.equal(s.openCells+s.waterCells+s.steepCells,256);assert.ok(s.largestComponent<=s.openCells);
 if(s.candidate){const n=s.candidate.cell;for(let z=-1;z<=1;z++)for(let x=-1;x<=1;x++)assert.equal(s.cells[n+z*16+x],'open');}
 }
});
