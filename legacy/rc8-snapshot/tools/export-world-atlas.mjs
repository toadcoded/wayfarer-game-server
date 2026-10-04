import {surveyChunk} from '../dist/terrain-survey.js';
import {generateChunk} from '../dist/world.js';
import {writeFileSync} from 'node:fs';
import {buildAtlas,ATLAS_LINKS,inspectAnchor} from '../dist/world-atlas.js';
import {REALM_WORLD} from '../dist/realm-scene.js';
const regions=buildAtlas(REALM_WORLD).map(a=>({...a,sample:inspectAnchor(REALM_WORLD,a),terrainSurvey:surveyChunk(generateChunk(REALM_WORLD,Math.floor(a.x/64),Math.floor(a.z/64)))}));
writeFileSync(new URL('../WORLD-ATLAS.json',import.meta.url),JSON.stringify({schemaVersion:2,world:REALM_WORLD,regionSize:512,scope:'Authored region stories anchored to generated biomes; links and named places are plans, not walkable paths or spawned objects.',regions,links:ATLAS_LINKS},null,2)+'\n');
console.log('Exported WORLD-ATLAS.json');
