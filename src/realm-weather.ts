export interface RealmWeather {kind:'clear'|'cloudy'|'rain'|'mist';humidity:number;cloudWater:number;rain:number;wetness:number;fogDensity:number;wind:number}
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
function rainAt(seed:number,seconds:number){const phase=seconds/90+(seed%997)/997*Math.PI*2,cloud=clamp(.5+.5*Math.sin(phase));return {cloud,rain:clamp((cloud-.68)/.32)};}
/** Cosmetic shared-clock field. Never grants resources, changes traction or mutates save data. */
export function realmWeather(seed:number,timeMs:number):RealmWeather {if(!Number.isSafeInteger(seed)||!Number.isFinite(timeMs)||timeMs<0)throw Error('Invalid weather clock');const t=timeMs/1000,{cloud,rain}=rainAt(seed,t);let wetness=0,weight=0;for(let i=0;i<48;i++){const w=Math.exp(-i/12);wetness+=rainAt(seed,t-i*4).rain*w;weight+=w;}wetness=clamp(wetness/weight);const humidity=clamp(.4+cloud*.4+wetness*.2),fogDensity=.0025+humidity*.003+wetness*.004;return {kind:rain>.08?'rain':wetness>.35&&cloud<.68?'mist':cloud>.45?'cloudy':'clear',humidity,cloudWater:cloud,rain,wetness,fogDensity,wind:Math.sin(t/31+seed%17)*(.3+cloud*.7)};}
/** Small per-chunk cosmetic cache; one climate evaluation per second, maximum16 entries. */
export class WeatherChunkCache {
 private bucket=-1;private base:RealmWeather|undefined;private values=new Map<string,RealmWeather>();constructor(private seed:number){}
 get size(){return this.values.size;}
 at(timeMs:number,cx:number,cz:number){if(!Number.isFinite(timeMs)||timeMs<0||![cx,cz].every(n=>Number.isSafeInteger(n)&&Math.abs(n)<=1000000))throw Error('Invalid weather chunk');const bucket=Math.floor(timeMs/1000);if(bucket!==this.bucket){this.bucket=bucket;this.base=realmWeather(this.seed,bucket*1000);this.values.clear();}const key=`${cx}:${cz}`;let value=this.values.get(key);if(!value){const n=(Math.imul(cx,73856093)^Math.imul(cz,19349663)^this.seed)>>>0,gain=.9+(n%201)/1000;value={...this.base!,wetness:clamp(this.base!.wetness*gain),humidity:clamp(this.base!.humidity+(gain-1)*.08)};if(this.values.size>=16)this.values.delete(this.values.keys().next().value!);this.values.set(key,value);}return {...value};}
 clear(){this.values.clear();this.base=undefined;this.bucket=-1;}
}
