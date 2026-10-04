import test from 'node:test';
import assert from 'node:assert/strict';
import {RealmRuntime} from '../dist/realm-runtime.js';
import {NavigationWorld} from '../dist/navigation.js';
import {checkedPersistentPlayerState} from '../dist/game-actions.js';
import {checkedPlayerSave} from '../dist/persistence.js';
import {ReplayJournal,replayJournal,stateHash,parseJournal} from '../tools/replay-journal.mjs';

const nav=()=>new NavigationWorld(()=>({height:0,slopeDegrees:0,waterDepth:0}),{bounds:{minX:-20,maxX:20,minZ:-20,maxZ:20}});
const options={capacity:8,visibilityRadius:64,beacon:{x:0,y:0,z:0},camp:{x:0,y:0,z:0}};
function saved(){return checkedPlayerSave({version:1,position:{x:2,z:1},gameplay:checkedPersistentPlayerState({version:1,skin:'elder',quest:{status:'completed',reeds:0,tithes:0,gatherCooldownTicks:0},inventory:{slots:Array(20).fill(null),weapon:'reed_blade',rewardClaimed:true}})});}

test('replay v2 records restored gameplay without recording account or connection identity',()=>{
 const realm=new RealmRuntime(nav(),options),journal=new ReplayJournal(realm,options),save=saved();realm.join('secret-transport-id',save.position,save);journal.join('secret-transport-id',save.position,realm,save);
 const packet=JSON.stringify({kind:'action',sequence:0,action:'unequip',value:'weapon'});assert.ok(realm.receive('secret-transport-id',packet));journal.input('secret-transport-id',packet,realm);realm.advance(50);journal.advance(50,realm);
 const text=JSON.stringify(journal.export());assert.equal(text.includes('secret-transport-id'),false);assert.equal(text.includes('wf_profile'),false);assert.equal(parseJournal(text).version,2);const replay=replayJournal(text,nav());assert.equal(replay.hash,stateHash(realm));assert.equal(replay.realm.gameStateFor('c1').inventory.slots[0],'reed_blade');
});
