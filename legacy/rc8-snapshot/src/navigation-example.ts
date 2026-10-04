import { generateChunk, type WorldConfig } from './world.js';
import { landmarkPrimitives } from './geometry.js';
import { NavigationWorld, terrainSampler } from './navigation.js';
import { ServerWalker, encodeMoveIntent } from './movement.js';

const world:WorldConfig={seed:20260928,generatorVersion:1};
const nav=new NavigationWorld(terrainSampler(world),{
 bounds:{minX:-32,maxX:64,minZ:-32,maxZ:64},radius:.35,height:1.8,cellSize:2,
});
// Include adjacent owners: structures may extend beyond their owning chunk.
for(let cx=-2;cx<=2;cx++)for(let cz=-2;cz<=2;cz++)nav.addPrimitives(landmarkPrimitives(generateChunk(world,cx,cz)));
// (0,0) is a proposed test spawn, independent of the live game's Reedhaven spawn.
const walker=new ServerWalker(nav,{x:0,z:0});
walker.receiveInput(encodeMoveIntent({sequence:1,dx:1,dz:0}));
for(let i=0;i<5;i++)walker.advance();
console.log('Authoritative player snapshot:',walker.snapshot());
console.log('Route to nearby trail:',nav.findPath({x:0,z:0},{x:8,z:0},512));
