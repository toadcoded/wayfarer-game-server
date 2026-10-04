import {gzip} from 'node:zlib';
import {promisify} from 'node:util';
const compress=promisify(gzip);
export async function staticPayload(data,type,accepted=''){
 const encodings=new Map(accepted.toLowerCase().split(',').map(part=>{const [name,...params]=part.trim().split(';');const q=params.find(p=>p.trim().startsWith('q='));return [name,q?Number(q.trim().slice(2)):1];}));
 const q=encodings.get('gzip')??encodings.get('*')??0;
 if(data.length>=1024&&/^(text\/|application\/json)/.test(type)&&q>0&&q<=1){const bytes=await compress(data);if(bytes.length<data.length)return {bytes,headers:{'Content-Encoding':'gzip','Vary':'Accept-Encoding','Content-Length':bytes.length}};}
 return {bytes:data,headers:{'Vary':'Accept-Encoding','Content-Length':data.length}};
}
