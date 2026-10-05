import test from 'node:test';
import assert from 'node:assert/strict';
import {GameActions,checkedPersistentPlayerState,decodeGameState} from '../dist/game-actions.js';
import {RESONANCE_COOLDOWN_TICKS,castResonance,consumeResonance,freshResonanceState,persistResonance,restoreResonance,resonanceEffectForSkill} from '../dist/resonance-authority.js';
import {RESONANCE_EFFECTS,RESONANCE_NODES,encodeResonanceCast,resolveResonanceChord} from '../dist/resonance-codex.js';

const point=(x=0,z=0)=>({x,y:0,z});
const packet=(sequence,value)=>JSON.stringify({kind:'action',sequence,action:'resonance',value});
function chordFor(effectId){
 for(let a=0;a<RESONANCE_NODES.length;a++)for(let b=a+1;b<RESONANCE_NODES.length;b++)for(let c=b+1;c<RESONANCE_NODES.length;c++){
  const ids=[RESONANCE_NODES[a].id,RESONANCE_NODES[b].id,RESONANCE_NODES[c].id];
  if(resolveResonanceChord(ids).effect.id===effectId)return ids;
 }
 throw new Error('missing chord for '+effectId);
}

test('every authoritative resonance effect is reachable and skill-bound',()=>{
 const reached=new Set();
 for(let a=0;a<RESONANCE_NODES.length;a++)for(let b=a+1;b<RESONANCE_NODES.length;b++)for(let c=b+1;c<RESONANCE_NODES.length;c++)reached.add(resolveResonanceChord([RESONANCE_NODES[a].id,RESONANCE_NODES[b].id,RESONANCE_NODES[c].id]).effect.id);
 assert.deepEqual([...reached].sort(),RESONANCE_EFFECTS.map(e=>e.id).sort());
 assert.equal(resonanceEffectForSkill('mining'),'miners-echo');
 assert.equal(resonanceEffectForSkill('fishing'),'tide-whisper');
 assert.equal(resonanceEffectForSkill('woodcutting'),'lantern-bloom');
 assert.equal(resonanceEffectForSkill('agility'),'pathfinders-gleam');
 assert.equal(resonanceEffectForSkill('magic'),'starlight-trace');
 assert.equal(resonanceEffectForSkill('defence'),'ward-glimmer');
});

test('resonance state is server-tick cooldown, consumable once, and persistence-safe',()=>{
 const ids=chordFor('miners-echo'),value=encodeResonanceCast(ids),state=freshResonanceState();
 const cast=castResonance(state,value,20);assert.equal(cast.ok,true);assert.equal(state.activeEffect,'miners-echo');assert.equal(state.readyTick,20+RESONANCE_COOLDOWN_TICKS);
 assert.equal(castResonance(state,value,21).reason,'cooldown');
 assert.equal(consumeResonance(state,'miners-echo',21),true);assert.equal(consumeResonance(state,'miners-echo',21),false);
 const saved=persistResonance(state,21);assert.equal(saved.cooldownTicks,RESONANCE_COOLDOWN_TICKS-1);assert.equal(saved.casts,1);
 const restored=restoreResonance(saved,100);assert.equal(restored.readyTick,100+RESONANCE_COOLDOWN_TICKS-1);assert.equal(restored.activeEffect,null);
});

test('GameActions validates observatory range, awards server-owned Magic/Runecrafting XP and blocks cooldown spam',()=>{
 const camp=point(0,0),beacon=point(20,0),codex=point(4,4),g=new GameActions(beacon,camp,codex);g.join('a','p1');
 const value=encodeResonanceCast(chordFor('starlight-trace'));
 assert.ok(g.receive('a',packet(0,value)));g.commit(()=>point(20,20));assert.equal(g.snapshot('a',[]).result.code,'resonance_range');
 assert.ok(g.receive('a',packet(1,value)));g.commit(()=>codex);let state=g.snapshot('a',[]);assert.equal(state.result.code,'resonance_cast');assert.equal(state.resonance.casts,1);assert.equal(state.progression.xp.magic,8);assert.equal(state.skilling.xp.runecrafting,8);assert.deepEqual(decodeGameState(JSON.stringify(state)),state);
 assert.ok(g.receive('a',packet(2,value)));g.commit(()=>codex);state=g.snapshot('a',[]);assert.equal(state.result.code,'resonance_wait');assert.equal(state.resonance.casts,1);assert.equal(state.progression.xp.magic,8);assert.equal(state.skilling.xp.runecrafting,8);
 const persisted=g.persistentState('a');assert.equal(persisted.version,6);assert.equal(checkedPersistentPlayerState(persisted).resonance.casts,1);
});

test('RealmRuntime commits a PolyCodex cast through the authoritative 50ms transaction',async()=>{
 const [{RealmRuntime},{NavigationWorld}]=await Promise.all([import('../dist/realm-runtime.js'),import('../dist/navigation.js')]);
 const codex=point(2,2),nav=new NavigationWorld(()=>({height:0,slopeDegrees:0,waterDepth:0}),{bounds:{minX:-20,maxX:20,minZ:-20,maxZ:20}});
 const realm=new RealmRuntime(nav,{beacon:point(12,12),camp:point(0,0),codex});
 realm.join('socket-a',{x:2,z:2});
 const value=encodeResonanceCast(chordFor('miners-echo'));
 assert.equal(realm.receive('socket-a',packet(0,value)),true);
 assert.equal(realm.gameStateFor('socket-a').resonance.casts,0);
 const advanced=realm.advance(50);
 assert.equal(advanced.steps,1);assert.equal(realm.tick,1);
 const state=realm.gameStateFor('socket-a');
 assert.equal(state.result.code,'resonance_cast');assert.equal(state.resonance.casts,1);assert.equal(state.resonance.activeEffect,'miners-echo');
 assert.equal(state.progression.xp.magic,8);assert.equal(state.skilling.xp.runecrafting,8);assert.deepEqual(state.codex,codex);
});
