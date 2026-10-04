import {surveyChunk} from './terrain-survey.js';
import {buildAtlas,ATLAS_LINKS,REGION_STORIES,planItinerary,inspectAnchor} from './world-atlas.js';
import {REALM_WORLD} from './realm-scene.js';
import {regionAt,REGION_SIZE,generateChunk,CHUNK_SIZE,GRID} from './world.js';
import {BIOMES} from './catalog.js';
const anchors=buildAtlas(REALM_WORLD),map=document.querySelector<HTMLCanvasElement>('#atlas')!,ctx=map.getContext('2d')!;
const detail=document.querySelector<HTMLCanvasElement>('#terrain')!,dc=detail.getContext('2d')!;
const select=document.querySelector<HTMLSelectElement>('#region')!,list=document.querySelector<HTMLElement>('#legend')!;
let selected=anchors[0]!,mapSize=600;
const point=(rx:number,rz:number)=>({x:(rx+8.5)*mapSize/17,y:(rz+8.5)*mapSize/17});
for(const [index,a] of anchors.entries()){
 const option=document.createElement('option');option.value=a.story.id;option.textContent=a.story.name;select.append(option);
 const button=document.createElement('button');button.textContent=`${index+1}. ${a.story.name}`;button.addEventListener('click',()=>choose(a.story.id));list.append(button);
}
function draw(){
 const dpr=Math.min(devicePixelRatio||1,2);mapSize=Math.max(260,Math.min(750,map.parentElement!.clientWidth));map.width=mapSize*dpr;map.height=mapSize*dpr;map.style.width=`${mapSize}px`;map.style.height=`${mapSize}px`;ctx.setTransform(dpr,0,0,dpr,0,0);
 const cell=mapSize/17;
 for(let rz=-8;rz<=8;rz++)for(let rx=-8;rx<=8;rx++){
  const b=BIOMES[regionAt(REALM_WORLD,rx*REGION_SIZE,rz*REGION_SIZE).biome];ctx.fillStyle=b.palette.ground;ctx.fillRect((rx+8)*cell,(rz+8)*cell,cell,cell);
  ctx.strokeStyle='#14292333';ctx.strokeRect((rx+8)*cell,(rz+8)*cell,cell,cell);
 }
 const route=planItinerary('reedhaven',selected.story.id);
 for(const edge of ATLAS_LINKS){
  const a=anchors.find(a=>a.story.id===edge.from)!,b=anchors.find(a=>a.story.id===edge.to)!;
  const active=route.some((id,i)=>i>0&&((id===edge.from&&route[i-1]===edge.to)||(id===edge.to&&route[i-1]===edge.from)));
  const p=point(a.rx,a.rz),q=point(b.rx,b.rz);ctx.strokeStyle=active?'#fff0b8':'#162a25aa';ctx.lineWidth=active?3:1;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
 }
 ctx.setLineDash([]);
 for(const [index,a] of anchors.entries()){
  const p=point(a.rx,a.rz);ctx.fillStyle=a===selected?'#fff0b8':'#172e29';ctx.beginPath();ctx.arc(p.x,p.y,a===selected?11:8,0,Math.PI*2);ctx.fill();ctx.fillStyle=a===selected?'#172e29':'#fff0b8';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 11px system-ui';ctx.fillText(String(index+1),p.x,p.y);
 }
}
function choose(id:string){
 selected=anchors.find(a=>a.story.id===id)!;select.value=id;const s=selected.story,data=inspectAnchor(REALM_WORLD,selected);
 document.querySelector('#name')!.textContent=s.name;document.querySelector('#description')!.textContent=s.description;
 document.querySelector('#places')!.textContent=s.places.join(' · ');
 document.querySelector('#note')!.textContent=s.travelNote;
 document.querySelector('#evidence')!.textContent=`Generated region ${selected.rx}, ${selected.rz} · center X ${selected.x}, Z ${selected.z}\nSample chunk ${data.chunkId}: ${data.propCount} props, ${data.wetCells}/${GRID*GRID} wet cells, height ${data.minHeight.toFixed(1)}–${data.maxHeight.toFixed(1)}.\nBiome resources: ${data.resources.join(', ')}. Resource harvesting is not implemented.`;
 document.querySelector('#route')!.textContent=planItinerary('reedhaven',id).map(id=>REGION_STORIES.find(s=>s.id===id)!.name).join(' → ');
 const chunk=generateChunk(REALM_WORLD,Math.floor(selected.x/CHUNK_SIZE),Math.floor(selected.z/CHUNK_SIZE));
 const survey=surveyChunk(chunk);
 document.querySelector('#survey')!.textContent=`Terrain screen: ${survey.openCells} open, ${survey.waterCells} wet, ${survey.steepCells} steep cells. ${survey.components} separate open patches; largest ${survey.largestComponent} cells.\n${survey.candidate?`Gold ring: terrain candidate at X ${survey.candidate.x}, Z ${survey.candidate.z}.`:'No 3 × 3 open arrival patch found.'} Props and collision are not checked; this is not an approved spawn.`;
 const min=Math.min(...chunk.heights),max=Math.max(...chunk.heights),size=256/GRID;
 for(let z=0;z<GRID;z++)for(let x=0;x<GRID;x++){
  dc.fillStyle=chunk.waterDepths[z*GRID+x]!>0?BIOMES[s.biome].palette.water:BIOMES[s.biome].palette.ground;dc.fillRect(x*size,z*size,size,size);
  dc.fillStyle=`rgba(0,0,0,${.35*(1-(chunk.heights[z*(GRID+1)+x]!-min)/Math.max(1,max-min))})`;dc.fillRect(x*size,z*size,size,size);
 }
 for(const p of chunk.props){const x=(p.position.x-chunk.cx*CHUNK_SIZE)/CHUNK_SIZE*256,z=(p.position.z-chunk.cz*CHUNK_SIZE)/CHUNK_SIZE*256;dc.fillStyle=BIOMES[s.biome].palette.accent;dc.beginPath();dc.arc(x,z,2,0,Math.PI*2);dc.fill();}
 for(let i=0;i<survey.cells.length;i++)if(survey.cells[i]==='steep'){dc.fillStyle='#ed886799';dc.fillRect(i%GRID*size,Math.floor(i/GRID)*size,size,size);}
 if(survey.candidate){const n=survey.candidate.cell;dc.strokeStyle='#fff0b8';dc.lineWidth=3;dc.beginPath();dc.arc((n%GRID+.5)*size,(Math.floor(n/GRID)+.5)*size,6,0,Math.PI*2);dc.stroke();}
 draw();
}
select.addEventListener('change',()=>choose(select.value));
map.addEventListener('pointerdown',event=>{const rect=map.getBoundingClientRect();const x=(event.clientX-rect.left)*mapSize/rect.width,y=(event.clientY-rect.top)*mapSize/rect.height;
 const nearest=[...anchors].sort((a,b)=>{const p=point(a.rx,a.rz),q=point(b.rx,b.rz);return Math.hypot(x-p.x,y-p.y)-Math.hypot(x-q.x,y-q.y);})[0]!;
 const p=point(nearest.rx,nearest.rz);if(Math.hypot(x-p.x,y-p.y)<mapSize/17)choose(nearest.story.id);
});
addEventListener('resize',draw);choose(selected.story.id);
