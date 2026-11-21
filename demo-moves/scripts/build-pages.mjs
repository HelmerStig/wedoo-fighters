import {readdir,readFile,stat,lstat,mkdir,copyFile,writeFile} from 'node:fs/promises';
import {resolve,dirname,relative,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const extensions=new Set(['.html','.js','.css','.json','.png','.webp','.mp3','.mp4','.csv']);
const assetRoots=new Set(['demo-moves','animation','PNG','portraits','portrait-pixeled','original-backgrounds','sfx']);
const catalogs=['catalog.js','stages-catalog.js','stage-actors-catalog.js','stage-cats-catalog.js','stage-lights-catalog.js'];
const slash=value=>value.split(sep).join('/');

// Export only the demo and the assets its catalogs/pages actually reference.
export async function planPages(source=root){
  source=resolve(source);
  const files=new Map();
  const directoryNames=new Map();
  async function add(file){
    const local=slash(relative(source,file));
    if(local.startsWith('../')||!assetRoots.has(local.split('/')[0])||local.split('/').some(p=>p.startsWith('.'))||!extensions.has(extname(local).toLowerCase()))throw Error('Asset non pubblicabile: '+local);
    if(files.has(local))return;
    // Do not follow symbolic links, including links in parent directories.
    let current=source;
    for(const part of local.split('/')){
      if(!directoryNames.has(current))directoryNames.set(current,await readdir(current));
      if(!directoryNames.get(current).includes(part))throw Error('Asset assente o maiuscole non corrispondenti: '+local);
      current=resolve(current,part);
      if((await lstat(current)).isSymbolicLink())throw Error('Link simbolico non pubblicabile: '+local);
    }
    const info=await stat(file);
    if(!info.isFile())throw Error('Asset non trovato: '+local);
    if(info.size<256&&(await readFile(file,'utf8')).startsWith('version https://git-lfs.github.com/spec/v1'))throw Error('Asset Git LFS non scaricato: '+local);
    files.set(local,info.size);
  }
  async function visit(directory){
    for(const entry of await readdir(directory,{withFileTypes:true})){
      if(entry.name.startsWith('.')||entry.name==='scripts')continue;
      const file=resolve(directory,entry.name);
      if(entry.isDirectory())await visit(file);
      else if(extensions.has(extname(entry.name).toLowerCase()))await add(file);
    }
  }
  await visit(resolve(source,'demo-moves'));
  const context={window:{}};vm.createContext(context);
  for(const name of catalogs)vm.runInContext(await readFile(resolve(source,'demo-moves',name),'utf8'),context,{timeout:5000,filename:name});
  async function values(value){
    if(typeof value==='string'&&value.startsWith('../')&&extensions.has(extname(value).toLowerCase()))await add(resolve(source,'demo-moves',decodeURIComponent(value)));
    else if(value&&typeof value==='object')for(const child of Object.values(value))await values(child);
  }
  await values(context.window);
  for(const key of ['STAGES_CATALOG','STAGE_CATS_CATALOG','STAGE_LIGHTS_CATALOG'])await values(context[key]);
  // This video is constructed in app.js, rather than stored in a catalog.
  await add(resolve(source,'portraits/fire.mp4'));
  for(const local of [...files.keys()]){
    if(!['.html','.css'].includes(extname(local)))continue;
    const text=await readFile(resolve(source,local),'utf8');
    const refs=extname(local)==='.html'?[...text.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)].map(m=>m[1]):[...text.matchAll(/url\(\s*["']?([^\s)'";]+)["']?\s*\)/g)].map(m=>m[1]);
    for(const ref of refs){
      if(/^(?:#|https?:|data:|mailto:)/i.test(ref))continue;
      if(ref.startsWith('/'))throw Error('Percorso assoluto incompatibile con GitHub Pages: '+local+' -> '+ref);
      const path=decodeURIComponent(ref.split(/[?#]/)[0]);if(path)await add(resolve(dirname(resolve(source,local)),path));
    }
  }
  const bytes=[...files.values()].reduce((a,b)=>a+b,0);
  if(bytes>1_000_000_000)throw Error('Il sito supera il limite di 1 GB di GitHub Pages: '+bytes+' byte');
  return {files:[...files.keys()].sort(),bytes};
}

export async function buildPages(destination=resolve(root,'.pages-dist'),source=root){
  destination=resolve(destination);source=resolve(source);
  if(destination===source||!relative(source,destination)||!slash(relative(source,destination)).startsWith('.pages-dist'))throw Error('Usare una cartella .pages-dist dedicata nel repository');
  // Refuse existing files rather than deleting a user-owned directory.
  try{if((await readdir(destination)).length)throw Error('Cartella di pubblicazione non vuota: '+destination);}catch(error){if(error.code!=='ENOENT')throw error;}
  const plan=await planPages(source);
  await mkdir(destination,{recursive:true});
  for(const local of plan.files){const target=resolve(destination,local);await mkdir(dirname(target),{recursive:true});await copyFile(resolve(source,local),target);}
  await writeFile(resolve(destination,'.nojekyll'),'');
  await writeFile(resolve(destination,'index.html'),'<!doctype html><html lang="it"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=demo-moves/"><title>WEDOO Fighters</title><a href="demo-moves/">Apri demo-moves</a></html>\n');
  return plan;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const plan=process.argv.includes('--check')?await planPages():await buildPages(process.argv[2]);
  console.log(`GitHub Pages: ${plan.files.length} file, ${(plan.bytes/1024/1024).toFixed(1)} MiB; percorsi e asset verificati.`);
}
