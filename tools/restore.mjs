import {readFile,writeFile,mkdir,rename,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {SqliteRealmStore,acquireRealmLease} from './sqlite-store.mjs';

export async function restoreRealm(bytes,dataDir) {
  if(!Buffer.isBuffer(bytes)||bytes.length<16||bytes.length>64*1024*1024||bytes.subarray(0,16).toString()!=='SQLite format 3\0')throw Error('Invalid or oversized SQLite backup');
  const dir=path.resolve(dataDir),target=path.join(dir,'realm.sqlite');
  const release=await acquireRealmLease(path.join(dir,'realm.lease.sqlite'));
  const temporary=path.join(dir,'restore-'+randomBytes(8).toString('hex')+'.sqlite');let checked,current,previous;
  try {
    await writeFile(temporary,bytes,{mode:0o600,flag:'wx'});
    const probe=new DatabaseSync(temporary,{readOnly:true});
    try {if(probe.prepare('PRAGMA user_version').get().user_version!==1)throw Error('Backup is not a v1 realm database');}
    finally{probe.close();}
    checked=await SqliteRealmStore.open(temporary);checked.close();checked=undefined;
    try {current=await SqliteRealmStore.open(target);
      const backups=path.join(dir,'backups');await mkdir(backups,{recursive:true,mode:0o700});
      previous=path.join(backups,'before-restore-'+Date.now()+'-'+randomBytes(4).toString('hex')+'.sqlite');
      await current.backup(previous);current.close();current=undefined;
    }catch(error){throw new Error('Could not preserve the current database; restore stopped',{cause:error});}
    // Exclusive realm lease plus closed SQLite handles: no active WAL writer exists.
    for(const suffix of ['-wal','-shm'])await rm(target+suffix,{force:true});
    await rename(temporary,target);
    return {restored:target,previous};
  }finally{
    checked?.close();current?.close();release();
    for(const suffix of ['','-wal','-shm'])await rm(temporary+suffix,{force:true});
  }
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  process.umask(0o077);const source=process.argv[2];if(!source)throw Error('Usage: node tools/restore.mjs BACKUP.sqlite (or - for stdin)');
  let bytes;
  if(source==='-') {
    const chunks=[];let length=0;
    for await(const chunk of process.stdin){length+=chunk.length;if(length>64*1024*1024)throw Error('Backup exceeds 64 MiB');chunks.push(chunk);}
    bytes=Buffer.concat(chunks);
  }else bytes=await readFile(source);
  const result=await restoreRealm(bytes,process.env.DATA_DIR||'runtime');
  console.log('Realm restored. Previous database preserved: '+result.previous);
}
