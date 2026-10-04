// Run from the package directory: node tools/export-atlas.mjs /tmp/atlas-scenes.json
import {writeFileSync} from 'node:fs';
import {terrainSampler} from '../dist/navigation.js';
import {planCrossing,CROSSING_STYLES} from '../dist/crossings.js';
import {crossingScene} from '../dist/scene-meshes.js';
const world={seed:20260928,generatorVersion:1};
const scenes=[['willowglass',0],['saffron',128],['mothlight',-128]].map(([style,z])=>{
 const plan=planCrossing(terrainSampler(world),{id:`atlas-${style}`,style,z,minX:-16,maxX:176});
 return {plan,style:CROSSING_STYLES[style],meshes:crossingScene(world,plan).map(m=>({positions:Array.from(m.positions),indices:Array.from(m.indices),color:m.color}))};
});
const destination=process.argv[2]??'atlas-scenes.json';writeFileSync(destination,JSON.stringify({world,scenes}));console.log(destination);
