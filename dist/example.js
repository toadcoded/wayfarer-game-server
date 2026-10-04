import { BIOMES, generateChunk, regionAt, weatherAt } from './world.js';
import { answerChunkRequest, chunkFromMessage, encodeMessage } from './protocol.js';
// Demonstrates the boundary locally. Replace transport with your authenticated socket.
const world = { seed: 20260928, generatorVersion: 1 };
const serverPlayer = { x: 20, z: 20 }; // position from your server's player state
const request = encodeMessage({ schema: 1, type: 'world.request', cx: 0, cz: 0 });
const reply = answerChunkRequest(request, world, serverPlayer, 300000);
const chunk = chunkFromMessage(reply, world);
const region = regionAt(world, serverPlayer.x, serverPlayer.z);
console.log({ chunk: chunk.id, region: region.name, biome: BIOMES[region.biome].name,
    vertices: chunk.heights.length, props: chunk.props.length, landmarks: chunk.landmarks,
    weather: weatherAt(world, region, 300000) });
// Your renderer consumes generateChunk(world, cx, cz) or the decoded chunk above.
// Your authoritative collision builder consumes the same generated chunk data.
console.log('Server geometry matches:', JSON.stringify(generateChunk(world, 0, 0)) === JSON.stringify(chunk));
