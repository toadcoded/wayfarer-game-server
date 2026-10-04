import {readFile,stat} from 'node:fs/promises';
import {createRealmScene} from '../dist/realm-scene.js';
import {replayJournal,MAX_REPLAY_BYTES} from './replay-journal.mjs';
const filename=process.argv[2];if(!filename)throw new Error('Usage: npm run replay -- path/to/journal.json');
if((await stat(filename)).size>MAX_REPLAY_BYTES)throw new Error('Replay exceeds byte budget');
const result=replayJournal(await readFile(filename,'utf8'),createRealmScene().navigation);
console.log(JSON.stringify({verified:true,events:result.events,tick:result.realm.tick,sha256:result.hash}));
