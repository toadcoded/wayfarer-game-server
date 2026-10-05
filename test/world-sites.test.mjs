import test from 'node:test';
import assert from 'node:assert/strict';
import {createRealmScene} from '../dist/realm-scene.js';
import {REALM_CONTRACT} from '../dist/realm-contract.js';
import {crossingScene} from '../dist/scene-meshes.js';
import {REALM_WORLD} from '../dist/realm-scene.js';

test('expanded realm has spacious bounds and an intentionally sparse shared orchard',()=>{
 const realm=createRealmScene(),bounds=realm.navigation.options.bounds;
 assert.ok(bounds.maxX-bounds.minX>140,'expanded map should offer a broader east-west route');
 assert.ok(bounds.maxZ-bounds.minZ>120,'expanded map should offer a broader north-south route');
 assert.equal(realm.orchardTrees.length,5,'visual orchard trunks share one concise placement list');
 assert.ok(realm.worldPrimitives.length>0);
 assert.ok(realm.codexPoint&&realm.cavernPoint);
 assert.equal(REALM_CONTRACT.simulationRevision,17);
 assert.equal(REALM_CONTRACT.sceneRevision,4);
});

test('orchard trunks are solid to the server walker and click routes path around them',()=>{
 const realm=createRealmScene(),tree=realm.orchardTrees[0];
 assert.equal(realm.navigation.check({x:tree.x,z:tree.z}).reason,'obstacle');
 const from={x:tree.x-4,z:tree.z},to={x:tree.x+4,z:tree.z};
 assert.equal(realm.navigation.check(from).ok,true);
 assert.equal(realm.navigation.check(to).ok,true);
 assert.equal(realm.navigation.traverse(from,to).reason,'obstacle');
 const route=realm.navigation.findPath(from,to,5000);
 assert.equal(route.status,'found');
 for(let i=1;i<route.points.length;i++)assert.equal(realm.navigation.traverse(route.points[i-1],route.points[i]).ok,true);
 assert.ok(route.points.some(point=>Math.abs(point.z-tree.z)>.7),'the route should travel around, not through, the trunk');
});

test('only ground and constructed walk surfaces are marked for client pointer picking',()=>{
 const realm=createRealmScene(),meshes=crossingScene(REALM_WORLD,realm.plan,realm.worldPrimitives);
 assert.ok(meshes.some(mesh=>mesh.walkable===true),'terrain is pickable');
 assert.ok(meshes.some(mesh=>mesh.walkable===false),'props/water/rails cannot become click destinations');
 assert.ok(meshes.some(mesh=>mesh.color==='#487F87'&&mesh.walkable===false),'water is explicitly nonwalkable');
});
