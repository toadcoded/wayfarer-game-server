import { NavigationWorld } from './navigation.js';
import { RealmRuntime } from './realm-runtime.js';
import { encodeMoveIntent } from './movement.js';
import { encodeRealmSnapshot, decodeRealmSnapshot } from './replication.js';

// Two in-process players, not an Internet multiplayer transport.
const nav = new NavigationWorld(() => ({ height: 0, slopeDegrees: 0, waterDepth: 0 }), {
  bounds: { minX: -30, maxX: 30, minZ: -30, maxZ: 30 },
});
nav.upsertCollider({ id: 'garden-wall', minX: 2, maxX: 2.2, minZ: -3, maxZ: 3, minY: 0, maxY: 4 });
const realm = new RealmRuntime(nav);
realm.join('connection-a', { x: 0, z: 0 });
realm.join('connection-b', { x: -3, z: 0 });
for (let sequence = 0; sequence < 30; sequence++) {
  realm.receive('connection-a', encodeMoveIntent({ sequence, dx: 1, dz: 0 }));
  realm.receive('connection-b', encodeMoveIntent({ sequence, dx: 0, dz: 1 }));
  realm.advance(50);
}
console.log(JSON.stringify(decodeRealmSnapshot(encodeRealmSnapshot(realm.snapshotFor('connection-a')!)), null, 2));
