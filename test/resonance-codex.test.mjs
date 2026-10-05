import test from 'node:test';
import assert from 'node:assert/strict';
import {RESONANCE_NODES,RESONANCE_COOLDOWN_MS,checkedResonanceSelection,resolveResonanceChord,resonanceCooldownRemaining} from '../dist/resonance-codex.js';

test('PolyCodex exposes twelve unique original resonance nodes',()=>{
 assert.equal(RESONANCE_NODES.length,12);
 assert.equal(new Set(RESONANCE_NODES.map(n=>n.id)).size,12);
 assert.equal(new Set(RESONANCE_NODES.map(n=>n.value)).size,12);
 for(const node of RESONANCE_NODES){assert.match(node.color,/^#[0-9a-f]{6}$/i);assert.ok(node.toneHz>=80&&node.toneHz<=1200);}
});

test('resonance chord resolution is order independent and deterministic',()=>{
 const a=resolveResonanceChord(['cinder','verdant','moon']);
 const b=resolveResonanceChord(['moon','cinder','verdant']);
 assert.deepEqual(a,b);
 assert.ok(a.effect.durationMs>0);
 assert.match(a.name,/Cinder/);
});

test('resonance selections reject duplicates, unknown nodes and oversized input',()=>{
 assert.deepEqual(checkedResonanceSelection(['cinder','tide']),['cinder','tide']);
 assert.throws(()=>checkedResonanceSelection(['cinder','cinder']),/Duplicate/);
 assert.throws(()=>checkedResonanceSelection(['unknown']),/Unknown/);
 assert.throws(()=>checkedResonanceSelection(['cinder','flare','sunward','verdant']),/at most three/);
 assert.throws(()=>resolveResonanceChord(['cinder','flare']),/exactly three/);
});

test('resonance cooldown never becomes negative',()=>{
 assert.equal(RESONANCE_COOLDOWN_MS,8000);
 assert.equal(resonanceCooldownRemaining(1000,9000),8000);
 assert.equal(resonanceCooldownRemaining(10000,9000),0);
 assert.throws(()=>resonanceCooldownRemaining(Number.NaN,0),/Invalid/);
});

test('canonical cast encoding/decoding is order-independent and rejects malformed network values',async()=>{
 const {encodeResonanceCast,decodeResonanceCast,isResonanceCast}=await import('../dist/resonance-codex.js');
 const encoded=encodeResonanceCast(['moon','cinder','verdant']);
 assert.equal(encoded,'cinder+verdant+moon');
 assert.deepEqual(decodeResonanceCast(encoded).nodes,['cinder','verdant','moon']);
 assert.equal(isResonanceCast(encoded),true);
 for(const value of ['', 'cinder+cinder+moon','cinder+moon','cinder+verdant+moon+rose','../cinder+verdant+moon'])assert.equal(isResonanceCast(value),false);
});
