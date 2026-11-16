import {AutoSprite,readJson,saveJson,downloadSheet} from '../autosprite-agent/lib.mjs';
const api=new AutoSprite(process.env.AUTOSPRITE_API_KEY);
const selections=(await readJson('tmp/new-idles-remote.json')).map(c=>{
 const sheet=c.sheets.filter(s=>s.kind==='idle').sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
 if(!sheet)throw Error('Idle assente: '+c.character);
 return {...c,sheets:undefined,sheet,slug:c.character.toLowerCase().replaceAll(' ','-')};
});
await saveJson('tmp/new-idles-selection.json',selections);
await Promise.all(selections.map(async s=>{
 await downloadSheet(api,s.sheet.id,`autosprite-agent/output/idle-download-20261116/${s.slug}`);
 console.log(`${s.character}: ${s.sheet.id}, frame ${s.sheet.loopStart ?? 0}..${s.sheet.loopEnd ?? s.sheet.frameCount-1}`);
}));
