import {writeFile} from 'node:fs/promises';
import {REALM_CONTRACT,REALM_SUBPROTOCOL,encodeHello,encodeWelcome} from '../dist/realm-contract.js';
const manifest={
 format:'wayfarer-interoperability-manifest',manifestVersion:1,subprotocol:REALM_SUBPROTOCOL,
 contract:REALM_CONTRACT,endpoint:'/socket',handshakeDeadlineMs:5000,maxInboundBytes:256,
 examples:{hello:JSON.parse(encodeHello()),welcome:JSON.parse(encodeWelcome('p1')),movement:{sequence:0,dx:1,dz:0},appearance:{kind:'action',sequence:0,action:'appearance',value:'elder'},beacon:{kind:'action',sequence:1,action:'beacon',value:'light'},quest:{kind:'action',sequence:2,action:'quest',value:'accept'},claim:{kind:'action',sequence:3,action:'claim',value:'reed_blade'},equip:{kind:'action',sequence:4,action:'equip',value:'reed_blade'},unequip:{kind:'action',sequence:5,action:'unequip',value:'weapon'},attack:{kind:'action',sequence:6,action:'combat',value:'attack'},guard:{kind:'action',sequence:7,action:'combat',value:'guard'}},
 lifecycle:['upgrade','hello','welcome','snapshot','movement-actions-and-game-state','disconnect'],
 rejectionReasons:['invalid_handshake','incompatible_contract','handshake_timeout'],
 limitations:['loopback-only','local-signed-cookie-is-not-production-auth','local-json-profile-store-not-cloud-database','shared-world-state-not-durable'],
};
await writeFile(new URL('../REALM-CONTRACT.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');
console.log('Wrote REALM-CONTRACT.json from compiled contract constants.');
