import {copyFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
for(const name of ['pglite.wasm','initdb.wasm','pglite.data'])await copyFile(new URL('node_modules/@electric-sql/pglite/dist/'+name,root),new URL('preview/'+name,root));
await copyFile(new URL('node_modules/@electric-sql/pglite/LICENSE',root),new URL('preview/PGLITE-LICENSE.txt',root));
