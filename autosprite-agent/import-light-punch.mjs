import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {AutoSprite,readJson,saveJson,downloadSheet} from './lib.mjs';

const root=resolve(import.meta.dirname,'..');
const output=resolve(root,process.env.LIGHT_PUNCH_OUTPUT??'autosprite-agent/output/light-punch-import-20261103');
const api=new AutoSprite(process.env.AUTOSPRITE_API_KEY);
const roster=await readJson(join(root,'animation/manifest.json'));
const requested=process.argv.slice(2).map(name=>name.toLowerCase());
if(requested.length){
  for(const name of requested)if(!roster.items.some(item=>item.character.toLowerCase()===name))throw Error('Personaggio sconosciuto: '+name);
  roster.items=roster.items.filter(item=>requested.includes(item.character.toLowerCase()));
}
const characters=await api.characters();
const plan={animation:'light-punch',sourceAnimation:'names containing light punch',durationMs:500,creditsUsed:0,createdAt:new Date().toISOString(),items:[],missing:[],inventory:[]};
const newest=(a,b)=>String(b.createdAt).localeCompare(String(a.createdAt));
const matchesName=name=>name.toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ').includes('light punch');
async function downloadListedSheet(sheet,directory,characterId){
  try{return await downloadSheet(api,sheet.id,directory);}catch(error){
    if(!error.message.includes('HTTP 404')||!sheet.isUnlocked||!sheet.sheetUrl||!sheet.atlasUrl)throw error;
    // The authenticated character listing sometimes exposes a valid sheet which
    // the detail endpoint cannot resolve. Use only its supplied download URLs.
    const [png,atlasBytes]=await Promise.all([api.download(sheet.sheetUrl),api.download(sheet.atlasUrl)]);
    if(png.length<33||!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Download PNG non valido');
    const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
    if(width!==sheet.columns*sheet.frameWidth||height!==Math.ceil(sheet.frameCount/sheet.columns)*sheet.frameHeight)throw Error('Dimensioni PNG non valide');
    const atlas=JSON.parse(atlasBytes.toString('utf8'));
    const frames=Object.values(atlas.frames).map(f=>f.frame??f);
    if(frames.length!==sheet.frameCount||frames.some(f=>![f.x,f.y,f.w,f.h].every(Number.isInteger)||f.x<0||f.y<0||f.w<=0||f.h<=0||f.x+f.w>width||f.y+f.h>height))throw Error('Atlas non valido');
    await mkdir(directory,{recursive:true});
    await writeFile(join(directory,sheet.id+'.png'),png);
    await writeFile(join(directory,sheet.id+'-atlas.json'),atlasBytes);
    const {sheetUrl,atlasUrl,audioUrl,thumbnailUrl,rmVideoBgUrl,publicUrl,publicAtlasUrl,...metadata}=sheet;
    await saveJson(join(directory,sheet.id+'-metadata.json'),{...metadata,characterId,downloadValidated:true,downloadSource:'authenticated character listing; detail endpoint returned 404',pngWidth:width,pngHeight:height,atlasFramesChecked:frames.length});
    console.log('Download dall’elenco verificato: '+sheet.id);
  }
}
let next=0;
await mkdir(output,{recursive:true});
await Promise.all(Array.from({length:2},async()=>{
  while(next<roster.items.length){
    const item=roster.items[next++],slug=item.character.toLowerCase();
    const matches=characters.filter(c=>c.name.toLowerCase()===slug);
    if(matches.length!==1)throw Error('Identità ambigua: '+slug);
    const character=matches[0];
    const list=await api.request(`/characters/${character.id}/spritesheets`);
    const sheets=list.spritesheets.filter(s=>matchesName(s.name)).sort(newest);
    if(!sheets.length){plan.missing.push(item.character);console.log('NON PRESENTE: '+item.character);continue;}
    const latest=sheets[0];
    const siblings=latest.sourceVideoId?sheets.filter(s=>s.sourceVideoId===latest.sourceVideoId):[latest];
    const sourceCount=Math.max(...siblings.map(s=>s.frameCount));
    const isTrimmed=s=>(s.loopStart??0)>0||(s.loopEnd??s.frameCount-1)<s.frameCount-1||s.frameCount<sourceCount||/trimmed/i.test(s.name);
    const selected=siblings.filter(isTrimmed).sort(newest)[0]??latest;
    plan.inventory.push({character:item.character,latestSheetId:latest.id,selectedSheetId:selected.id,candidates:sheets.map(({id,name,createdAt,sourceVideoId,frameCount,loopStart,loopEnd})=>({id,name,createdAt,sourceVideoId,frameCount,loopStart,loopEnd}))});
    const directory=join(output,slug);
    await downloadListedSheet(selected,directory,character.id);
    const metadata=await readJson(join(directory,selected.id+'-metadata.json'));
    const first=metadata.loopStart??0,last=metadata.loopEnd??metadata.frameCount-1;
    if(!Number.isInteger(first)||!Number.isInteger(last)||first<0||last<first||last>=metadata.frameCount)throw Error('Taglio non valido: '+slug);
    const sourceAtlas=await readJson(join(directory,selected.id+'-atlas.json'));
    const frames=Object.entries(sourceAtlas.frames).sort(([a],[b])=>Number(a)-Number(b)).map(([,f])=>f.frame??f);
    for(let i=0;i<frames.length;i++)if(frames[i].x!==i%metadata.columns*metadata.frameWidth||frames[i].y!==Math.floor(i/metadata.columns)*metadata.frameHeight)throw Error('Atlas non regolare: '+slug);
    plan.items.push({character:item.character,characterId:character.id,sourceSheetId:selected.id,sourceVideoId:metadata.sourceVideoId,sourceAnimationName:metadata.name,createdAt:metadata.createdAt,sourceStart:first,sourceEnd:last,sourceFrames:metadata.frameCount,frames:last-first+1,frameWidth:metadata.frameWidth,frameHeight:metadata.frameHeight,sourceColumns:metadata.columns,speedMultiplier:metadata.speedMultiplier??1,trimmed:isTrimmed(selected),rawPng:join(directory,selected.id+'.png'),png:`animation/${slug}/${slug}-light-punch.png`,atlas:`animation/${slug}/${slug}-light-punch.json`,playbackFps:(last-first+1)*2,durationMs:500});
    console.log(`${item.character}: ${metadata.name}, ${last-first+1}/${metadata.frameCount} frame${isTrimmed(selected)?' trimmed':''}`);
  }
}));
const order=new Map(roster.items.map((item,index)=>[item.character,index]));
plan.items.sort((a,b)=>order.get(a.character)-order.get(b.character));
plan.missing.sort((a,b)=>order.get(a)-order.get(b));
await saveJson(join(output,'export-plan.json'),plan);
console.log(JSON.stringify({downloaded:plan.items.length,missing:plan.missing,creditsUsed:0}));
