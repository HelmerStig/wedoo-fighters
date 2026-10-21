import {readFile,writeFile,readdir,mkdir,copyFile} from 'node:fs/promises';
import {dirname,resolve,relative,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const demo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const root=resolve(demo,'..');
const readJson=async path=>JSON.parse((await readFile(path,'utf8')).replace(/^\uFEFF/,''));
const manifest=await readJson(join(root,'animation/manifest.json'));
const pngs=(await readdir(join(root,'PNG'))).filter(name=>name.toLowerCase().endsWith('.png'));
const url=path=>relative(demo,path).split(/[\\/]/).map(part=>encodeURIComponent(part)).join('/');
const characters=[];
const frameRects=atlas=>Object.entries(atlas.frames).sort(([a],[b])=>Number(a)-Number(b)).map(([,entry])=>{const f=entry.frame??entry;return [f.x,f.y,f.w,f.h];});
await mkdir(join(demo,'assets'),{recursive:true});
for(const item of manifest.items){
  const id=item.character.toLowerCase();
  if(!/^[a-z0-9_-]+$/.test(id))throw Error('Nome non valido: '+id);
  const pngPath=resolve(root,item.png),atlasPath=resolve(root,item.atlas);
  if(!pngPath.startsWith(join(root,'animation')+'/')&&!pngPath.startsWith(join(root,'animation')+'\\'))throw Error('PNG fuori dalla cartella animation');
  const atlas=await readJson(atlasPath);
  const frames=frameRects(atlas);
  const png=await readFile(pngPath);
  if(!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('PNG non valido: '+id);
  const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
  if(frames.length!==item.frames||!frames.length||frames.some(f=>!f.every(Number.isInteger)||f[0]<0||f[1]<0||f[2]<=0||f[3]<=0||f[0]+f[2]>width||f[1]+f[3]>height))throw Error('Frame non validi: '+id);
  const thumbnailName=pngs.find(name=>name.toLowerCase()===(id==='oscar'?'oscare':id)+'.png');
  let thumbnail;
  if(thumbnailName)thumbnail=url(join(root,'PNG',thumbnailName));
  else{
    const reference=join(root,'autosprite-agent/output',id+'-combat-idle-dynamic-pro-20261021-01/reference-pose.png');
    const destination=join(demo,'assets',id+'.png');
    await copyFile(reference,destination);thumbnail=url(destination);
  }
  let baseFps=24;
  try{
    const source=await readJson(join(root,'autosprite-agent/output/idle-download-raw',id,item.sourceSheetId+'-atlas.json'));
    if(Number(source.meta?.duration_s)>0)baseFps=Number(((atlas.meta.source_frame_count??item.frames)/source.meta.duration_s).toFixed(3));
  }catch{}
  const savedSpeed=Number(item.speedMultiplier)||1;
  characters.push({id,name:item.character,thumbnail,animations:[{id:'idle',name:'Idle',description:'Guardia e movimento a riposo',image:url(pngPath),atlas:url(atlasPath),frames,frameWidth:item.frameWidth,frameHeight:item.frameHeight,trimmed:Boolean(item.trimmed),baseFps,savedSpeed}]});
}
characters.sort((a,b)=>new Intl.Collator('it',{sensitivity:'base',ignorePunctuation:true}).compare(a.name,b.name));
const extraAnimations=[
  {manifest:'walk-manifest.json',id:'walk',name:'walk',description:'Camminata in guardia'},
  {manifest:'victory-manifest.json',id:'victory',name:'Victory',description:'Mossa di vittoria'}
];
for(const extra of extraAnimations){
  const data=await readJson(join(root,'animation',extra.manifest));
  for(const item of data.items){
    const character=characters.find(c=>c.id===item.character.toLowerCase());
    if(!character)throw Error(`Personaggio ${extra.id} assente: ${item.character}`);
    const atlas=await readJson(resolve(root,item.atlas));
    const frames=frameRects(atlas);
    if(frames.length!==item.frames)throw Error(`Frame ${extra.id} non corrispondenti: ${item.character}`);
    character.animations.push({id:extra.id,name:extra.name,description:extra.description,image:url(resolve(root,item.png)),atlas:url(resolve(root,item.atlas)),frames,frameWidth:item.frameWidth,frameHeight:item.frameHeight,trimmed:item.trimmed,playbackFps:18,savedSpeed:item.speedMultiplier});
  }
}
await writeFile(join(demo,'catalog.js'),'/* Generato da scripts/build-catalog.mjs: dati locali, nessuna chiamata esterna. */\nwindow.MOVES_CATALOG = '+JSON.stringify({characters},null,2)+';\n');
console.log('Catalogo aggiornato: '+characters.length+' personaggi.');
