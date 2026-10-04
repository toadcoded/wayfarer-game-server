import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {GameActions,decodeAction,decodeGameState,checkedPersistentPlayerState} from '../dist/game-actions.js';
import {parseAssetCatalog} from '../dist/asset-catalog.js';import {CHARACTER_ASSETS} from '../dist/character-assets.js';
const pos={x:0,y:0,z:0};
test('Seraphine appearance replicates and restores without granting equipment',()=>{
 const g=new GameActions(pos);g.join('a','p1');g.join('b','p2');const command=JSON.stringify({kind:'action',sequence:0,action:'appearance',value:'seraphine'});
 assert.equal(decodeAction(command).value,'seraphine');assert.ok(g.receive('a',command));g.commit(()=>pos);
 assert.equal(g.snapshot('b',['p1']).players[0].skin,'seraphine');assert.equal(g.snapshot('a',[]).inventory.weapon,null);
 const save=checkedPersistentPlayerState(g.persistentState('a'));assert.equal(save.skin,'seraphine');g.leave('a');g.join('a','p3',save);
 assert.equal(g.snapshot('a',['p3']).players[0].skin,'seraphine');assert.deepEqual(decodeGameState(JSON.stringify(g.snapshot('a',['p3']))),g.snapshot('a',['p3']));
});
test('Seraphine catalog matches unchanged PNG and both appearance selectors',()=>{
 const manifest=parseAssetCatalog(JSON.parse(readFileSync(new URL('../preview/assets/manifest.json',import.meta.url)))),asset=manifest.find(a=>a.id==='seraphine');assert.ok(asset);assert.deepEqual(CHARACTER_ASSETS.find(a=>a.id==='seraphine'),asset);
 const png=readFileSync(new URL('../preview/assets/seraphine.png',import.meta.url));assert.ok(png.length<2000000);assert.equal(png.readUInt32BE(16),asset.width);assert.equal(png.readUInt32BE(20),asset.height);assert.equal(asset.frames,1);
 for(const page of ['realm','index'])assert.match(readFileSync(new URL('../preview/'+page+'.html',import.meta.url),'utf8'),/value="seraphine"/);
});
test('high-resolution catalog keeps strict dimension and pixel budgets',()=>{
 const a=CHARACTER_ASSETS.find(a=>a.id==='seraphine');for(const patch of [{width:1025},{height:1025},{width:1024,height:1024,frames:9,durationsMs:Array(9).fill(1000)},{frames:1,durationsMs:[]}])assert.throws(()=>parseAssetCatalog([{...a,...patch}]));
 assert.equal(parseAssetCatalog([{...a}]).length,1);
});
