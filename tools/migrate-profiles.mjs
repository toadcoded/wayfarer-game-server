import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {SqliteRealmStore,acquireRealmLease} from './sqlite-store.mjs';
process.umask(0o077);
const [profileFile,xamFile]=process.argv.slice(2);
if(!profileFile)throw Error('Usage: node tools/migrate-profiles.mjs old/profiles.json [old/xam.json]');
async function readJson(file){const bytes=await readFile(file);if(bytes.length>8*1024*1024)throw Error('Legacy file too large');return JSON.parse(bytes.toString('utf8'));}
const profiles=await readJson(profileFile),xam=xamFile?await readJson(xamFile):undefined;
const dir=path.resolve(process.env.DATA_DIR||'runtime');
const release=await acquireRealmLease(path.join(dir,'realm.lease.sqlite'));let store;
try {store=await SqliteRealmStore.open(path.join(dir,'realm.sqlite'));store.importLegacy(profiles,xam);console.log('Migrated '+store.count+' profiles; original cookies remain valid.');}
finally{store?.close();release();}
