import {regionAt,REGION_SIZE,generateChunk,CHUNK_SIZE,type WorldConfig} from './world.js';
import {BIOMES,type BiomeId} from './catalog.js';
export interface RegionStory {id:string;name:string;biome:BiomeId;description:string;places:readonly string[];travelNote:string}
/** Authored setting content. Named places are design references, not spawned quest objects. */
export const REGION_STORIES:readonly RegionStory[]=Object.freeze([
 {id:'reedhaven',name:'Reedhaven Vale',biome:'river-valley',description:'Willow lanterns shelter clay roads between orchard walls and the old river keep.',places:['Willowglass Causeway','Rainbell Orchard','Earthbound Keep'],travelNote:'The local realm contains the tested Willowglass crossing.'},
 {id:'barrow',name:'Barrow Meadow',biome:'grassland',description:'Wind-bent flowers trace burial ridges; shepherds hang bronze bells above the hollow lanes.',places:['Bellwether Barrows','Flaxwind Enclave','The Moss Calendar'],travelNote:'Ridge trails and graveyard gates are proposed content.'},
 {id:'moonroot',name:'Moonroot Elderwood',biome:'forest',description:'Pale roots lace the forest floor around a library whose shelves were carved into living wood.',places:['Rootscript Archive','Hollow Crown','Dewglass Nursery'],travelNote:'Root passages and woodland settlements are proposed.'},
 {id:'ashfen',name:'Ashfen Mire',biome:'mire',description:'Moth lamps mark abandoned ferry posts above peat pools and slow, reflective water.',places:['Mothlight Wharf','Peatmirror Pools','The Crooked Tollhouse'],travelNote:'Mothlight crossing geometry exists in the offline preview; this regional placement is planning.'},
 {id:'saffron',name:'Saffron Dominion',biome:'desert',description:'Red dunes gather against sandstone courts where shadow lines preserve the hours of a vanished kingdom.',places:['Saffron Meridian','Sunken Glyph Court','The Sand-Singing Stair'],travelNote:'Saffron crossing geometry exists in the offline preview; desert routes remain planning.'},
 {id:'glass',name:'Glass Oasis',biome:'oasis-coast',description:'Palm courts open onto mirror canals, salt-bright coves and gardens cooled by porous stone.',places:['Coconut Lantern Cove','Mirrorwater Court','Saltwind Steps'],travelNote:'Canals, coastline activities and boat routes are proposed.'},
 {id:'cloudbreak',name:'Cloudbreak Heights',biome:'alpine',description:'Mountain terraces hold tiny gardens below rope bridges and wind-polished monastery roofs.',places:['Cloudgate Monastery','The Hanging Herbarium','Kestrel Stair'],travelNote:'Cliff traversal needs dedicated route and fall rules.'},
 {id:'aurora',name:'Aurora Expanse',biome:'tundra',description:'Stone rings rise from blue-white drifts, guiding winter caravans toward a silent ice harbor.',places:['The Northern Rings','Aurora Harbor','Frostwool Refuge'],travelNote:'Winter travel and ice behavior are proposed.'},
 {id:'emberfall',name:'Emberfall Caldera',biome:'volcanic',description:'Obsidian walls frame geothermal gardens where warm rain gathers under copper-colored steam.',places:['Cinder Orchard','Obsidian Watch','The Copper Springs'],travelNote:'Hazards and geothermal gameplay are proposed.'},
 {id:'underdeep',name:'Luminous Underdeep',biome:'cavern',description:'Crystal pillars illuminate fungal courtyards and a buried archive of river-shaped inscriptions.',places:['Prismwell Archive','The Lantern Mycelium','Deepwater Choir'],travelNote:'Current cavern biome is a heightfield theme, not a subterranean level.'},
].map(r=>Object.freeze({...r,places:Object.freeze(r.places)})) as RegionStory[]);
export interface AtlasAnchor {story:RegionStory;rx:number;rz:number;x:number;z:number}
export interface AtlasLink {from:string;to:string;name:string;status:'planned'}
export const ATLAS_LINKS:readonly AtlasLink[]=Object.freeze([
 ['reedhaven','barrow','The Bell Road'],['reedhaven','moonroot','Root-and-Reed Way'],['reedhaven','ashfen','The Ferry Ledger'],
 ['barrow','cloudbreak','Kestrel Ascent'],['cloudbreak','aurora','The Winter Thread'],['cloudbreak','emberfall','Steamglass Pass'],
 ['moonroot','underdeep','The Rootscript Descent'],['ashfen','underdeep','Moth Lantern Passage'],['underdeep','emberfall','The Copper Vein'],
 ['emberfall','saffron','Ash-to-Amber Road'],['saffron','glass','The Mirror Caravan'],['glass','ashfen','Salt-and-Peat Trail'],
].map(([from,to,name])=>Object.freeze({from:from!,to:to!,name:name!,status:'planned' as const})));
/** Places stories at real matching procedural region centers; never changes generator-v1 terrain. */
export function buildAtlas(config:WorldConfig):AtlasAnchor[]{
 const candidates:{rx:number;rz:number;d:number}[]=[];
 for(let rz=-8;rz<=8;rz++)for(let rx=-8;rx<=8;rx++)candidates.push({rx,rz,d:rx*rx+rz*rz});
 candidates.sort((a,b)=>a.d-b.d||a.rz-b.rz||a.rx-b.rx);
 return REGION_STORIES.map(story=>{
  const cell=candidates.find(c=>regionAt(config,c.rx*REGION_SIZE,c.rz*REGION_SIZE).biome===story.biome);
  if(!cell)throw new Error(`No ${story.biome} region in the bounded atlas search`);
  return {story,rx:cell.rx,rz:cell.rz,x:cell.rx*REGION_SIZE,z:cell.rz*REGION_SIZE};
 });
}
/** Shortest number of authored links. This is itinerary planning, NOT a walkable path query. */
export function planItinerary(from:string,to:string):string[]{
 const ids=new Set(REGION_STORIES.map(r=>r.id));if(!ids.has(from)||!ids.has(to))throw new Error('Unknown atlas region');
 const queue=[from],previous=new Map<string,string|undefined>([[from,undefined]]);
 for(let i=0;i<queue.length;i++){
  const id=queue[i]!;if(id===to)break;
  for(const edge of ATLAS_LINKS){const next=edge.from===id?edge.to:edge.to===id?edge.from:undefined;if(next&&!previous.has(next)){previous.set(next,id);queue.push(next);}}
 }
 if(!previous.has(to))return [];
 const route=[];for(let id:string|undefined=to;id!==undefined;id=previous.get(id))route.push(id);return route.reverse();
}
export function inspectAnchor(config:WorldConfig,anchor:AtlasAnchor){
 const actual=regionAt(config,anchor.x,anchor.z);if(actual.biome!==anchor.story.biome)throw new Error('Atlas anchor does not match this world');
 const chunk=generateChunk(config,Math.floor(anchor.x/CHUNK_SIZE),Math.floor(anchor.z/CHUNK_SIZE));
 return {regionId:actual.id,biome:actual.biome,chunkId:chunk.id,propCount:chunk.props.length,landmarkKinds:chunk.landmarks.map(l=>l.kind),minHeight:Math.min(...chunk.heights),maxHeight:Math.max(...chunk.heights),wetCells:chunk.waterDepths.filter(d=>d>0).length,resources:[...BIOMES[actual.biome].resources]};
}
