import {mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {AutoSprite,readJson,saveJson,downloadSheet} from './lib.mjs';

const root=resolve(import.meta.dirname,'..');
const output=join(root,'autosprite-agent/output/jump-custom-2-import-20261028');
const api=new AutoSprite(process.env.AUTOSPRITE_API_KEY);
const roster=await readJson(join(root,'animation/manifest.json'));
const characters=await api.characters();
const plan={animation:'jump',sourceAnimation:'jump custom 2',playbackFps:24,creditsUsed:0,createdAt:new Date().toISOString(),items:[],missing:[]};
let next=0;
await mkdir(output,{recursive:true});
await Promise.all(Array.from({length:2},async()=>{
  while(next<roster.items.length){
    const item=roster.items[next++],slug=item.character.toLowerCase();
    const matches=characters.filter(c=>c.name.toLowerCase()===slug);
    if(matches.length!==1)throw Error('Identità ambigua: '+slug);
    const character=matches[0];
    const list=await api.request(`/characters/${character.id}/spritesheets`);
    const sheets=list.spritesheets.filter(s=>s.name.trim().toLowerCase()==='jump custom 2').sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
    if(!sheets.length){plan.missing.push(item.character);console.log('ASSENTE: '+item.character);continue;}
    // Prefer the newest user-saved version; its own loop range is applied once.
    const selected=sheets[0],directory=join(output,slug);
    await downloadSheet(api,selected.id,directory);
    const metadata=await readJson(join(directory,selected.id+'-metadata.json'));
    const first=metadata.loopStart??0,last=metadata.loopEnd??metadata.frameCount-1;
    if(!Number.isInteger(first)||!Number.isInteger(last)||first<0||last<first||last>=metadata.frameCount)throw Error('Taglio non valido: '+slug);
    const sourceAtlas=await readJson(join(directory,selected.id+'-atlas.json'));
    const frames=Object.values(sourceAtlas.frames).map(f=>f.frame??f);
    for(let i=0;i<frames.length;i++)if(frames[i].x!==i%metadata.columns*metadata.frameWidth||frames[i].y!==Math.floor(i/metadata.columns)*metadata.frameHeight)throw Error('Atlas non regolare: '+slug);
    plan.items.push({character:item.character,characterId:character.id,sourceSheetId:selected.id,sourceAnimationName:metadata.name,createdAt:metadata.createdAt,sourceStart:first,sourceEnd:last,sourceFrames:metadata.frameCount,frames:last-first+1,frameWidth:metadata.frameWidth,frameHeight:metadata.frameHeight,sourceColumns:metadata.columns,speedMultiplier:metadata.speedMultiplier??1,trimmed:first!==0||last!==metadata.frameCount-1,rawPng:join(directory,selected.id+'.png'),png:`animation/${slug}/${slug}-jump.png`,atlas:`animation/${slug}/${slug}-jump.json`,playbackFps:24});
    console.log(`${item.character}: ${last-first+1}/${metadata.frameCount} frame (${selected.id})`);
  }
}));
const order=new Map(roster.items.map((item,index)=>[item.character,index]));
plan.items.sort((a,b)=>order.get(a.character)-order.get(b.character));
await saveJson(join(output,'export-plan.json'),plan);
console.log(JSON.stringify({downloaded:plan.items.length,missing:plan.missing,creditsUsed:0}));
if(plan.missing.length)process.exitCode=1;
