import {DatabaseSync,backup} from 'node:sqlite';
import {mkdir,chmod,access} from 'node:fs/promises';
import path from 'node:path';
process.umask(0o077);
const source=path.resolve(process.env.DATA_DIR||'runtime','realm.sqlite');
const target=path.resolve(process.argv[2]||`backups/realm-${new Date().toISOString().replaceAll(':','-')}.sqlite`);
try {await access(target);throw Error('Backup destination already exists');}catch(error){if(error.code!=='ENOENT')throw error;}
await mkdir(path.dirname(target),{recursive:true,mode:0o700});
const db=new DatabaseSync(source,{readOnly:true});
try {await backup(db,target);await chmod(target,0o600);console.log('Consistent realm backup created: '+target);} finally {db.close();}
