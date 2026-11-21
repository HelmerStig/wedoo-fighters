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
// Conserva i metadati informativi se gli output sorgente opzionali non sono locali.
let previousCharacters=[];
try{
  const previous=await readFile(join(demo,'catalog.js'),'utf8');
  const payload=previous.slice(previous.indexOf('window.MOVES_CATALOG = ')+'window.MOVES_CATALOG = '.length).trim().replace(/;$/,'');
  previousCharacters=JSON.parse(payload).characters;
}catch{}
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
  let baseFps=previousCharacters.find(c=>c.id===id)?.animations.find(a=>a.id==='idle')?.baseFps??24;
  try{
    const source=await readJson(join(root,'autosprite-agent/output/idle-download-raw',id,item.sourceSheetId+'-atlas.json'));
    if(Number(source.meta?.duration_s)>0)baseFps=Number(((atlas.meta.source_frame_count??item.frames)/source.meta.duration_s).toFixed(3));
  }catch{}
  const savedSpeed=Number(item.speedMultiplier)||1;
  characters.push({id,name:item.character,thumbnail,portrait:url(resolve(root,item.portrait??'portraits/'+id+'.png')),animations:[{id:'idle',name:'Idle',description:'Guardia e movimento a riposo',image:url(pngPath),atlas:url(atlasPath),frames,frameWidth:item.frameWidth,frameHeight:item.frameHeight,trimmed:Boolean(item.trimmed),baseFps,playbackFps:24,savedSpeed}]});
}
characters.sort((a,b)=>new Intl.Collator('it',{sensitivity:'base',ignorePunctuation:true}).compare(a.name,b.name));
const extraAnimations=[
  {manifest:'walk-manifest.json',id:'walk',name:'Walk',description:'Camminata in guardia'},
  {manifest:'victory-manifest.json',id:'victory',name:'Victory',description:'Mossa di vittoria'},
  {manifest:'jump-manifest.json',id:'jump',name:'Salto',description:'Salto con apice sincronizzato',durationMs:1000},
  {manifest:'light-punch-manifest.json',id:'light-punch',name:'Pugno leggero',description:'Pugno leggero e ritorno in guardia',durationMs:500},
  {manifest:'medium-punch-manifest.json',id:'medium-punch',name:'Pugno medio',description:'Pugno medio e ritorno in guardia',durationMs:750},
  {manifest:'strong-punch-manifest.json',id:'strong-punch',name:'Pugno forte',description:'Pugno forte e ritorno in guardia',durationMs:1000},
  {manifest:'light-kick-manifest.json',id:'light-kick',name:'Calcio leggero',description:'Calcio leggero e ritorno in guardia',durationMs:600},
  {manifest:'medium-kick-manifest.json',id:'medium-kick',name:'Calcio medio',description:'Calcio medio e ritorno in guardia',durationMs:800},
  {manifest:'strong-kick-manifest.json',id:'strong-kick',name:'Calcio potente',description:'Calcio potente e ritorno in guardia',durationMs:900},
  {manifest:'hurt-manifest.json',id:'hurt',name:'Hurt',description:'Reazione al colpo e ritorno in guardia',durationMs:500},
  {manifest:'hurt-medium-manifest.json',id:'hurt-medium',name:'Hurt medio',description:'Reazione al colpo medio e recupero',durationMs:500},
  {manifest:'hurt-low-manifest.json',id:'hurt-low',name:'Hurt basso',description:'Reazione al colpo basso e recupero',durationMs:500},
  {manifest:'hurt-crouched-manifest.json',id:'hurt-crouched',name:'Hurt da accovacciati',description:'Reazione al colpo da accovacciati e recupero',durationMs:500},
  {manifest:'crouch-manifest.json',id:'crouch',name:'Crouch',description:'Discesa in guardia accovacciata',durationMs:250},
  {manifest:'crouch-block-manifest.json',id:'crouch-block',name:'Parata accovacciata',description:'Parata da accovacciati e ritorno in guardia bassa',durationMs:500},
  {manifest:'block-manifest.json',id:'block',name:'Parata alta',description:'Parata alta pronta in 0,1 secondi'}
];
const punchTiming=await readJson(join(root,'animation/light-punch-timing.json'));
const lightKickTiming=await readJson(join(root,'animation/light-kick-timing.json'));
const mediumKickTiming=await readJson(join(root,'animation/medium-kick-timing.json'));
const strongKickTiming=await readJson(join(root,'animation/strong-kick-timing.json'));
const mediumPunchTiming=await readJson(join(root,'animation/medium-punch-timing.json'));
const mediumPunchTrails=await readJson(join(root,'animation/medium-punch-trails.json'));
const strongPunchTiming=await readJson(join(root,'animation/strong-punch-timing.json'));
const strongPunchTrails=await readJson(join(root,'animation/strong-punch-trails.json'));
const lightPunchTrails=await readJson(join(root,'animation/light-punch-trails.json'));
const blockTiming=await readJson(join(root,'animation/block-timing.json'));
const jumpTiming=await readJson(join(root,'animation/jump-timing.json'));
for(const extra of extraAnimations){
  const data=await readJson(join(root,'animation',extra.manifest));
  for(const item of data.items){
    const character=characters.find(c=>c.id===item.character.toLowerCase());
    if(!character)throw Error(`Personaggio ${extra.id} assente: ${item.character}`);
    const atlas=await readJson(resolve(root,item.atlas));
    const frames=frameRects(atlas);
    if(frames.length!==item.frames)throw Error(`Frame ${extra.id} non corrispondenti: ${item.character}`);
    let timing={};
    if(extra.id==='crouch-block'){
      const peak=item.blockFrame,sequence=Array.from({length:item.sourceEnd-item.sourceStart+1},(_,i)=>item.sourceStart+i);
      sequence.push(...sequence.slice(0,-1).reverse());
      if(data.durationMs!==500||data.blockMs!==250||peak!==item.sourceEnd-item.sourceStart||peak<1||item.playback!=='forward-reverse'||sequence.length!==frames.length||JSON.stringify(sequence)!==JSON.stringify(item.frameSequence)||atlas.meta.source_sheet_id!==item.sourceSheetId||Object.values(atlas.frames).some((f,i)=>f.source_frame!==sequence[i]))throw Error('Sequenza parata accovacciata incoerente: '+item.character);
      timing={blockFrame:peak,blockMs:data.blockMs,playbackMode:item.playback,frameDurations:frames.map((_,i)=>i<peak?data.blockMs/peak:(data.durationMs-data.blockMs)/(frames.length-peak))};
    }
    if(['hurt','hurt-medium','hurt-low','hurt-crouched','crouch'].includes(extra.id)){
      if(data.durationMs!==extra.durationMs||item.playback!=='forward'||item.sourceEnd-item.sourceStart+1!==frames.length||atlas.meta.source_sheet_id!==item.sourceSheetId||Object.values(atlas.frames).some((f,i)=>f.source_frame!==item.sourceStart+i||Math.abs(f.duration-extra.durationMs/frames.length)>1e-8))throw Error('Timing '+extra.name+' non valido: '+item.character);
      timing={playbackMode:'forward',frameDurations:frames.map(()=>extra.durationMs/frames.length)};
    }
    if(extra.id==='jump'){
      const entry=jumpTiming.items.find(t=>t.character.toLowerCase()===character.id);
      if(!entry||entry.sourceSheetId!==item.sourceSheetId||entry.sourceStart!==item.sourceStart||entry.sourceEnd!==item.sourceEnd)throw Error('Rivedere il frame di apice per '+item.character);
      const peak=entry.apexFrame,ms=jumpTiming.apexMs,total=jumpTiming.durationMs;
      if(!Number.isInteger(peak)||peak<1||peak>=frames.length||!Number.isFinite(ms)||ms<=0||!Number.isFinite(total)||total<=ms)throw Error('Timing salto non valido: '+item.character);
      if(total!==extra.durationMs)throw Error('Durata salto incoerente');
      timing={apexFrame:peak,apexMs:ms,ascentFps:peak*1000/ms,descentFps:(frames.length-peak)*1000/(total-ms),frameDurations:frames.map((_,i)=>i<peak?ms/peak:(total-ms)/(frames.length-peak))};
    }
    if(extra.id==='block'){
      const entry=blockTiming.items.find(t=>t.character.toLowerCase()===character.id);
      if(!entry||entry.sourceSheetId!==item.sourceSheetId||entry.sourceStart!==item.sourceStart||entry.sourceEnd!==item.sourceEnd)throw Error('Rivedere il frame di parata per '+item.character);
      const peak=entry.blockFrame,ms=blockTiming.blockMs;
      if(!Number.isInteger(peak)||peak<1||peak>=frames.length||!Number.isFinite(ms)||ms<=0)throw Error('Timing parata non valido: '+item.character);
      timing={blockFrame:peak,blockMs:ms,durationMs:frames.length*ms/peak,frameDurations:frames.map(()=>ms/peak)};
    }
    if(extra.id==='light-punch'||extra.id==='light-kick'||extra.id==='medium-kick'||extra.id==='strong-kick'){
      const moveTiming=extra.id==='strong-kick'?strongKickTiming:extra.id==='medium-kick'?mediumKickTiming:extra.id==='light-kick'?lightKickTiming:punchTiming;
      const entry=moveTiming.items.find(t=>t.character.toLowerCase()===character.id);
      if(!entry||entry.sourceSheetId!==item.sourceSheetId||entry.sourceStart!==item.sourceStart||entry.sourceEnd!==item.sourceEnd)throw Error('Rivedere il frame di impatto per '+item.character);
      const peak=entry.impactFrame;
      if(!Number.isInteger(peak)||peak<1||peak>=frames.length)throw Error('Frame impatto non valido: '+item.character);
      if(moveTiming.durationMs!==extra.durationMs||moveTiming.impactMs<=0||moveTiming.impactMs>=moveTiming.durationMs)throw Error('Timing non valido: '+extra.id);
      timing={impactFrame:peak,impactMs:moveTiming.impactMs,frameDurations:frames.map((_,i)=>i<peak?moveTiming.impactMs/peak:(moveTiming.durationMs-moveTiming.impactMs)/(frames.length-peak))};
      if(extra.id==='light-kick'||extra.id==='medium-kick'||extra.id==='strong-kick'){
        const sequence=Array.from({length:item.sourceEnd-item.sourceStart+1},(_,i)=>item.sourceStart+i);
        if(item.playback==='forward-reverse')sequence.push(...sequence.slice(0,-1).reverse());
        else if(item.playback!=='forward')throw Error('Sequenza calcio leggero non valida: '+item.character);
        if(sequence.length!==frames.length||atlas.meta.source_sheet_id!==item.sourceSheetId||Object.values(atlas.frames).some((f,i)=>f.source_frame!==sequence[i]))throw Error('Frame calcio leggero incoerenti: '+item.character);
        if((extra.id==='medium-kick'||extra.id==='strong-kick')&&(item.playback!=='forward-reverse'||peak!==item.sourceEnd-item.sourceStart||JSON.stringify(sequence)!==JSON.stringify(item.frameSequence)))throw Error('Sequenza calcio incoerente: '+item.character+' / '+extra.id);
        if(item.playback==='forward-reverse')timing.playbackMode=item.playback;
      }
    }
    if(extra.id==='medium-punch'){
      const entry=mediumPunchTiming.items.find(t=>t.character.toLowerCase()===character.id);
      if(!entry||entry.sourceSheetId!==item.sourceSheetId||entry.sourceStart!==item.sourceStart||entry.sourceEnd!==item.sourceEnd||entry.playback!==item.playback)throw Error('Rivedere il frame di impatto medio per '+item.character);
      const peak=entry.impactFrame,ms=mediumPunchTiming.impactMs,total=mediumPunchTiming.durationMs;
      if(!Number.isInteger(peak)||peak<1||peak>=item.sourceFrames||!Number.isFinite(ms)||ms<=0||!Number.isFinite(total)||total<=ms||total!==extra.durationMs)throw Error('Timing pugno medio non valido: '+item.character);
      const expected=Array.from({length:item.sourceEnd-item.sourceStart+1},(_,i)=>item.sourceStart+i);
      if(item.playback==='forward-reverse')expected.push(...expected.slice(0,-1).reverse());
      else if(item.playback!=='forward')throw Error('Riproduzione pugno medio non valida');
      if(JSON.stringify(item.frameSequence)!==JSON.stringify(expected)||expected.length!==frames.length||expected[peak]!==entry.impactSourceFrame||Object.values(atlas.frames).some((f,i)=>f.source_frame!==expected[i]))throw Error('Sequenza pugno medio incoerente: '+item.character);
      timing={impactFrame:peak,impactMs:ms,playbackMode:item.playback,sourceFrameCount:item.sourceFrames,frameDurations:frames.map((_,i)=>i<peak?ms/peak:(total-ms)/(frames.length-peak))};
    }
    if(extra.id==='strong-punch'){
      const entry=strongPunchTiming.items.find(t=>t.character.toLowerCase()===character.id);
      if(!entry||entry.sourceSheetId!==item.sourceSheetId||entry.sourceStart!==item.sourceStart||entry.sourceEnd!==item.sourceEnd)throw Error('Rivedere il frame di impatto forte per '+item.character);
      const peak=entry.impactFrame,ms=strongPunchTiming.impactMs,total=strongPunchTiming.durationMs;
      if(!['forward','forward-reverse'].includes(item.playback)||!Number.isInteger(peak)||peak<1||peak>=item.sourceFrames||ms<=0||total<=ms||total!==extra.durationMs)throw Error('Timing pugno forte non valido: '+item.character);
      const sequence=Array.from({length:item.sourceFrames},(_,i)=>item.sourceStart+i);
      if(item.playback==='forward-reverse')sequence.push(...sequence.slice(0,-1).reverse());
      if(sequence.length!==frames.length||Object.values(atlas.frames).some((f,i)=>f.source_frame!==sequence[i]))throw Error('Sequenza pugno forte incoerente: '+item.character);
      timing={impactFrame:peak,impactMs:ms,playbackMode:item.playback,sourceFrameCount:item.sourceFrames,frameDurations:frames.map((_,i)=>i<peak?ms/peak:(total-ms)/(frames.length-peak))};
    }
    if(extra.id==='light-punch'||extra.id==='medium-punch'||extra.id==='strong-punch'){
      const profiles=extra.id==='light-punch'?lightPunchTrails:extra.id==='medium-punch'?mediumPunchTrails:strongPunchTrails;
      const trail=profiles.items.find(t=>t.character.toLowerCase()===character.id);
      if(!trail||trail.sourceSheetId!==item.sourceSheetId||trail.sourceStart!==item.sourceStart||trail.sourceEnd!==item.sourceEnd||trail.impactFrame!==timing.impactFrame||trail.frameIndexSpace!=='exported-playback'||trail.startFrame<0||trail.endFrame>=frames.length||trail.startFrame>trail.endFrame)throw Error('Rivedere la maschera del braccio per '+item.character+' / '+extra.id);
      const {character:_,...profile}=trail;
      timing.armTrail=profile;
    }
    character.animations.push({...timing,id:extra.id,name:extra.name,description:extra.description,image:url(resolve(root,item.png)),atlas:url(resolve(root,item.atlas)),frames,frameWidth:item.frameWidth,frameHeight:item.frameHeight,trimmed:item.trimmed,playbackFps:extra.id==='block'?timing.blockFrame*1000/timing.blockMs:extra.durationMs?frames.length*1000/extra.durationMs:(extra.playbackFps??24),...(extra.durationMs?{durationMs:extra.durationMs}:{}),savedSpeed:item.speedMultiplier});
  }
}
await writeFile(join(demo,'catalog.js'),'/* Generato da scripts/build-catalog.mjs: dati locali, nessuna chiamata esterna. */\nwindow.MOVES_CATALOG = '+JSON.stringify({characters},null,2)+';\n');
console.log('Catalogo aggiornato: '+characters.length+' personaggi.');

await writeFile(join(demo,'roster-nav.js'),'/* Navigazione leggera, generata da build-catalog.mjs. */\nwindow.MOVES_CATALOG = '+JSON.stringify({characters:characters.map(({id,name,animations})=>({id,name,animations:animations.map(({id,name})=>({id,name}))}))})+';\n');
