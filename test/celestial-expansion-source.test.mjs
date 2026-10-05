import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('celestial expansion is procedural presentation only and carries the supplied inspiration layers',async()=>{
 const source=await readFile(new URL('../src/celestial-expansion-3d.ts',import.meta.url),'utf8');
 for(const marker of ['celestial-observatory','sunward-orchard','prism-leaf','moonlight-cavern','moon-crystal','cavern-walkway','glowshroom','astral-snail'])assert.ok(source.includes(marker),marker);
 assert.ok(source.includes('state and cannot award XP, move actors, or mutate collision.'));
 assert.match(source,/twelve columns and an open codex/i);
 assert.match(source,/Moonlight Cavern/i);
});

test('3D resonance burst duration comes from the authoritative effect catalog instead of a magic constant',async()=>{
 const source=await readFile(new URL('../src/realm-3d.ts',import.meta.url),'utf8');
 assert.match(source,/resonanceEffect\(effectId\)\.durationMs/);
 assert.doesNotMatch(source,/resonanceBurstUntil=performance\.now\(\)\+9000/);
});

test('checked-in Babylon preview bundle carries the v1.2 Celestial/Moonlight layer in either build mode',async()=>{
 const bundle=await readFile(new URL('../preview/realm-3d.bundle.js',import.meta.url),'utf8');
 assert.ok(bundle.includes('v12-celestial-runtime')||bundle.includes('v12-expansion'),'missing fallback bridge and canonical source build');
 for(const marker of ['celestial-observatory','polycodex-dodecahedron','sunward-orchard','moonlight-cavern','astral-snail','setResonance'])assert.ok(bundle.includes(marker),marker);
});
