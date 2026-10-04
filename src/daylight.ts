/** Cosmetic twenty-minute cycle, starting at midnight. No gameplay clock mutation. */
export function daylightAt(timeMs:number){if(!Number.isFinite(timeMs)||timeMs<0)throw Error('Invalid daylight clock');const phase=(timeMs%1200000)/1200000,day=Math.max(0,Math.min(1,(Math.sin(phase*Math.PI*2-Math.PI/2)+.2)/1.2));return {phase,day,night:1-day};}
