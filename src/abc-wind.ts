export interface WindPoint {x:number;y:number;z:number}
export interface ABCWind {enabled:boolean;a:number;b:number;c:number;radius:number;height:number;center:WindPoint;pulseHz:number}
export const defaultABC=():ABCWind=>({enabled:false,a:0,b:0,c:0,radius:6,height:12,center:{x:0,y:8,z:0},pulseHz:0});
export function validateABC(o:ABCWind):void {
 if(typeof o.enabled!=='boolean'||![o.a,o.b,o.c,o.radius,o.height,o.center.x,o.center.y,o.center.z,o.pulseHz].every(Number.isFinite)||o.a<0||o.a>12||o.b<0||o.b>12||Math.abs(o.c)>12||o.radius<.25||o.radius>32||o.height<1||o.height>64||Math.max(Math.abs(o.center.x),Math.abs(o.center.y),Math.abs(o.center.z))>4096||o.pulseHz<0||o.pulseHz>3)throw new RangeError('Invalid ABC wind');
}
/** Stylized cylindrical wind field, not a fluid-pressure solver. Y points upward. */
export function sampleABC(o:ABCWind,p:WindPoint,seconds:number):WindPoint {
 validateABC(o);if(![p.x,p.y,p.z,seconds].every(Number.isFinite)||seconds<0)throw new RangeError('Invalid field sample');
 if(!o.enabled)return {x:0,y:0,z:0};
 const x=p.x-o.center.x,y=p.y-o.center.y,z=p.z-o.center.z,r=Math.hypot(x,z),vertical=Math.abs(y)/(o.height/2);
 if(r>=o.radius||vertical>=1)return {x:0,y:0,z:0};
 const radial=(1-r/o.radius)**2,falloff=radial*(1-vertical)**2;
 const pulse=o.pulseHz===0?1:.5+.5*Math.sin(2*Math.PI*o.pulseHz*seconds);
 const upper=.5+y/o.height,lower=.5-y/o.height,core=Math.max(.5,r);
 return {x:-z/core*o.c*falloff*pulse,y:(o.b*lower-o.a*upper)*falloff*pulse,z:x/core*o.c*falloff*pulse};
}
export const ABC_PRESETS:Readonly<Record<string,Readonly<{a:number;b:number;c:number}>>>=Object.freeze({
 calm:Object.freeze({a:0,b:0,c:0}),downdraft:Object.freeze({a:8,b:0,c:0}),updraft:Object.freeze({a:0,b:8,c:0}),vortex:Object.freeze({a:0,b:0,c:7}),rising:Object.freeze({a:0,b:8,c:6}),descending:Object.freeze({a:8,b:0,c:6}),balanced:Object.freeze({a:6,b:6,c:4}),
});
