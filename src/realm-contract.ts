/** Private rehearsal subprotocol; application compatibility is checked before any realm join. */
export const REALM_SUBPROTOCOL = 'wayfarer.realm.v2';
export const REALM_CONTRACT = Object.freeze({
 protocolVersion:2,simulationRevision:17,worldSeed:20260928,generatorVersion:1,sceneRevision:4,
 coordinateSystem:'xz-y-up-metres',tickMs:50,snapshotVersion:1,
} as const);
export type RealmContract = typeof REALM_CONTRACT;
export class CompatibilityError extends Error {
 constructor(readonly code:'invalid_handshake'|'incompatible_contract'){super(code);}
}
function object(value:unknown,keys:readonly string[]):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new CompatibilityError('invalid_handshake');
 const r=value as Record<string,unknown>;
 if(Object.keys(r).length!==keys.length||!keys.every(k=>Object.hasOwn(r,k)))throw new CompatibilityError('invalid_handshake');
 return r;
}
function parse(text:string):unknown{
 if(typeof text!=='string'||text.length>512||new TextEncoder().encode(text).length>512)throw new CompatibilityError('invalid_handshake');
 try{return JSON.parse(text);}catch{throw new CompatibilityError('invalid_handshake');}
}
function contract(value:unknown):RealmContract{
 const expected=REALM_CONTRACT,r=object(value,Object.keys(expected));
 if(!Object.entries(expected).every(([k,v])=>r[k]===v))throw new CompatibilityError('incompatible_contract');
 return {...expected};
}
export function encodeHello():string{return JSON.stringify({kind:'hello',contract:REALM_CONTRACT});}
export function decodeHello(text:string):RealmContract{
 const r=object(parse(text),['kind','contract']);if(r.kind!=='hello')throw new CompatibilityError('invalid_handshake');return contract(r.contract);
}
export function encodeWelcome(id:string):string{
 if(!/^p[1-9][0-9]{0,15}$/.test(id))throw new CompatibilityError('invalid_handshake');
 return JSON.stringify({kind:'welcome',id,contract:REALM_CONTRACT});
}
export function decodeWelcome(text:string):{id:string;contract:RealmContract}{
 const r=object(parse(text),['kind','id','contract']);
 if(r.kind!=='welcome'||typeof r.id!=='string'||!/^p[1-9][0-9]{0,15}$/.test(r.id))throw new CompatibilityError('invalid_handshake');
 return {id:r.id,contract:contract(r.contract)};
}
export function compatibilityMessage(reason:string):string{
 switch(reason){
  case 'incompatible_contract':return 'Client and server use different world or protocol versions. Reload the matching release.';
  case 'invalid_handshake':return 'Connection rejected: the compatibility handshake was invalid.';
  case 'handshake_timeout':return 'Compatibility handshake timed out. Try joining again.';
  default:return 'Disconnected. Join again to start at the landing.';
 }
}
