import {readFileSync,writeFileSync,mkdirSync,chmodSync} from 'node:fs';
import {brotliDecompressSync} from 'node:zlib';
const root=new URL('./node_modules/@sparticuz/chromium/bin/',import.meta.url);
mkdirSync(new URL('./runtime/',import.meta.url),{recursive:true});
for(const name of ['chromium','fonts.tar','swiftshader.tar'])writeFileSync(new URL('./runtime/'+name,import.meta.url),brotliDecompressSync(readFileSync(new URL(name+'.br',root))));
chmodSync(new URL('./runtime/chromium',import.meta.url),0o755);
