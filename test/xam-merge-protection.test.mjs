import test from 'node:test';
import assert from 'node:assert/strict';
import {freshEncounter,freshFighter,finishEncounter} from '../dist/encounter.js';
import {GameActions} from '../dist/game-actions.js';
import {NavigationWorld} from '../dist/navigation.js';
import {RealmRuntime} from '../dist/realm-runtime.js';
import {XamAgent,XAM_MAX_FOCUS_TICKS} from '../dist/xam-agent.js';
import {checkedXamView} from '../dist/xam-view.js';

const target={x:0,y:0,z:0};
const camp={x:8,y:0,z:0};

test('protected encounter participants are never targeted or damaged',()=>{
  const encounter=freshEncounter(),x=freshFighter(),human=freshFighter();
  finishEncounter(encounter,[{fighter:x,position:target,protectedCombat:true}],target,camp,1);
  assert.equal(encounter.strikeAt,0,'protected-only presence must not schedule a Warden strike');
  finishEncounter(encounter,[{fighter:x,position:target,protectedCombat:true},{fighter:human,position:target}],target,camp,2);
  assert.equal(encounter.strikeAt,42);
  finishEncounter(encounter,[{fighter:x,position:target,protectedCombat:true},{fighter:human,position:target}],target,camp,42);
  assert.equal(x.hp,40);
  assert.equal(x.recoverAt,0);
  assert.equal(human.hp,30);
});

test('GameActions preserves combat protection across staged commits',()=>{
  let g=new GameActions(target,camp);g.join('x','p1',undefined,true);g.join('h','p2');
  for(let i=0;i<41;i++)g=g.stagedCommit(()=>target);
  assert.equal(g.snapshot('x',['p1','p2']).fighter.hp,40);
  assert.equal(g.snapshot('h',['p1','p2']).fighter.hp,30);
});

test('Xam joins protected and exposes the merged identity contract',()=>{
  const nav=new NavigationWorld(()=>({height:0,slopeDegrees:0,waterDepth:0}),{bounds:{minX:-20,maxX:20,minZ:-20,maxZ:20}});
  const realm=new RealmRuntime(nav,{beacon:target,camp});
  const xam=new XamAgent(realm,nav,camp,target);
  const view=checkedXamView(xam.examine());
  assert.equal(view.protected,true);assert.equal(view.untouchable,true);assert.equal(view.autoRetaliate,false);assert.equal(view.collision,'nonblocking');
  assert.equal(view.armor,'legendary_holographic_rustic');assert.equal(view.mainHand,'diamond_scythe');assert.equal(view.offHand,'gilded_secateurs');
  assert.equal(XAM_MAX_FOCUS_TICKS,6000);
});
