export function realmHeartbeat(connected:boolean,ageMs:number,hidden=false,hasSnapshot=true){
 if(hidden)return {state:'paused',text:'Realm heartbeat · page resting'} as const;
 if(!connected)return {state:'offline',text:'Realm heartbeat · offline'} as const;
 if(!hasSnapshot)return {state:'waiting',text:'Realm heartbeat · awaiting first snapshot'} as const;
 if(!Number.isFinite(ageMs)||ageMs>=5000)return {state:'lost',text:'Realm heartbeat · updates lost'} as const;
 if(ageMs>=500)return {state:'waiting',text:'Realm heartbeat · waiting for server'} as const;
 return {state:'live',text:'Realm heartbeat · live · '+Math.max(0,Math.round(ageMs))+' ms since snapshot'} as const;
}
