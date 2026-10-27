import http from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {dirname,resolve,relative,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.mp4':'video/mp4','.txt':'text/plain; charset=utf-8'};
export function createDemoServer(){
  return http.createServer(async(req,res)=>{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
    try{
      let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      if(pathname==='/'){res.writeHead(302,{Location:'/demo-moves/index.html'});res.end();return;}
      if(pathname==='/demo-moves'||pathname==='/demo-moves/')pathname='/demo-moves/index.html';
      const file=resolve(root,'.'+pathname),local=relative(root,file);
      const parts=local.split(sep);
      if(local.startsWith('..')||!['demo-moves','PNG','animation','portraits','portrait-pixeled'].includes(parts[0])||(parts[0]==='portraits'&&extname(file).toLowerCase()!=='.png'&&!(parts.length===2&&parts[1]==='fire.mp4'))||(parts[0]==='portrait-pixeled'&&extname(file).toLowerCase()!=='.png')||parts.some(p=>p.startsWith('.'))){res.writeHead(403);res.end('Accesso non consentito');return;}
      const info=await stat(file);
      if(!info.isFile()){res.writeHead(404);res.end('File non trovato');return;}
      res.writeHead(200,{'Content-Type':mime[extname(file).toLowerCase()]??'application/octet-stream','Content-Length':info.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
      if(req.method==='HEAD'){res.end();return;}
      const stream=createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);
    }catch(error){res.writeHead(error instanceof URIError?400:404);res.end('File non disponibile');}
  });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.argv[2]??4173);
  if(!Number.isInteger(port)||port<1||port>65535)throw Error('Porta non valida');
  createDemoServer().listen(port,'127.0.0.1',()=>console.log(`Demo locale: http://127.0.0.1:${port}/demo-moves/`));
}
