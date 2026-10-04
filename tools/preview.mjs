import {staticPayload} from './static-compression.mjs';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const types={'.html':'text/html','.js':'text/javascript','.png':'image/png','.gif':'image/gif','.json':'application/json','.css':'text/css'};
const server=http.createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const relative=pathname==='/'?'preview/index.html':pathname.slice(1);
 if(!(relative.startsWith('dist/')||relative.startsWith('preview/'))||relative.includes('..')){res.writeHead(404);res.end();return;}
 try{const data=await readFile(path.join(root,relative));const type=types[path.extname(relative)]||'application/octet-stream';const payload=await staticPayload(data,type,req.headers['accept-encoding']);res.writeHead(200,{...payload.headers,'Content-Type':type,'X-Content-Type-Options':'nosniff'});res.end(payload.bytes);}catch{res.writeHead(404);res.end();}
});
server.listen(Number(process.env.PORT||8080),'127.0.0.1',()=>console.log('Wayfarer v0.7.9 ABC local preview: http://127.0.0.1:'+server.address().port));
