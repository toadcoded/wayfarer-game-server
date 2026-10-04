import {CHUNK_SIZE,GRID,type Chunk} from './world.js';
export type SurveyCell='open'|'water'|'steep';
export interface TerrainSurvey {
 cells:SurveyCell[];openCells:number;waterCells:number;steepCells:number;
 components:number;largestComponent:number;
 candidate:{x:number;y:number;z:number;cell:number}|null;
}
/** Terrain screening only: excludes props, landmarks, construction and actor collision. */
export function surveyChunk(chunk:Chunk,maxGrade=0.5):TerrainSurvey {
 if(!Number.isFinite(maxGrade)||maxGrade<0||maxGrade>1)throw new RangeError('grade must be between 0 and 1');
 if(chunk.heights.length!==(GRID+1)**2||chunk.waterDepths.length!==GRID**2||
 !chunk.heights.every(Number.isFinite)||!chunk.waterDepths.every(d=>Number.isFinite(d)&&d>=0)||
 !Number.isInteger(chunk.cx)||!Number.isInteger(chunk.cz))throw new Error('Invalid survey chunk');
 const step=CHUNK_SIZE/GRID,cells:SurveyCell[]=[];
 for(let z=0;z<GRID;z++)for(let x=0;x<GRID;x++){
  const i=z*(GRID+1)+x,h=[chunk.heights[i]!,chunk.heights[i+1]!,chunk.heights[i+GRID+1]!,chunk.heights[i+GRID+2]!];
  // Conservative corner-height range per cell width, not an exact mesh slope.
  cells.push(chunk.waterDepths[z*GRID+x]!>0?'water':(Math.max(...h)-Math.min(...h))/step>maxGrade?'steep':'open');
 }
 const seen=new Set<number>();let components=0,largest:number[]=[];
 for(let start=0;start<cells.length;start++){
  if(cells[start]!=='open'||seen.has(start))continue;
  const queue=[start];seen.add(start);components++;
  for(let i=0;i<queue.length;i++){
   const n=queue[i]!,x=n%GRID,z=Math.floor(n/GRID);
   for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const nx=x+dx!,nz=z+dz!;if(nx<0||nz<0||nx>=GRID||nz>=GRID)continue;
    const next=nz*GRID+nx;if(cells[next]==='open'&&!seen.has(next)){seen.add(next);queue.push(next);}
   }
  }
  if(queue.length>largest.length)largest=queue;
 }
 // Require a full 3x3 open patch; choose nearest chunk center in the largest component.
 const eligible=largest.filter(n=>{const x=n%GRID,z=Math.floor(n/GRID);if(x<1||z<1||x>=GRID-1||z>=GRID-1)return false;
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)if(cells[(z+dz)*GRID+x+dx]!=='open')return false;return true;});
 const distance=(n:number)=>(n%GRID+.5-GRID/2)**2+(Math.floor(n/GRID)+.5-GRID/2)**2;
 eligible.sort((a,b)=>distance(a)-distance(b)||a-b);
 const n=eligible[0];let candidate:TerrainSurvey['candidate']=null;
 if(n!==undefined){const x=n%GRID,z=Math.floor(n/GRID),i=z*(GRID+1)+x;
  candidate={cell:n,x:chunk.cx*CHUNK_SIZE+(x+.5)*step,z:chunk.cz*CHUNK_SIZE+(z+.5)*step,y:(chunk.heights[i]!+chunk.heights[i+1]!+chunk.heights[i+GRID+1]!+chunk.heights[i+GRID+2]!)/4};}
 return {cells,openCells:cells.filter(c=>c==='open').length,waterCells:cells.filter(c=>c==='water').length,steepCells:cells.filter(c=>c==='steep').length,components,largestComponent:largest.length,candidate};
}
