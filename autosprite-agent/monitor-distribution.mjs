import { resolve } from 'node:path';
import { AutoSprite, readJson, saveJson, resume } from './lib.mjs';
const batchName=process.argv[2]??'distribution-20261113';
if(!/^[a-z0-9-]+$/.test(batchName))throw new Error('Nome batch non valido');
const root=resolve('wedoo-fighters/autosprite-agent/jobs',batchName);
const {outputs}=await readJson(resolve(root,'submitted.json'));
const api=new AutoSprite(process.env.AUTOSPRITE_API_KEY);
const results=[];
let next=0;
await Promise.all(Array.from({length:4},async()=>{
 while(next<outputs.length) {
  const row=outputs[next++];
  try {
  const state=await resume(api,row.manifest,{intervalMs:30000,timeoutMs:1800000,log:()=>{}});
  const item={character:row.character,animation:row.animation,status:state.status,creditsUsed:state.creditsUsed,workflows:state.workflows};
  console.log(row.character+': '+state.status);
  results.push(item);
  } catch(error) { results.push({character:row.character,error:String(error)}); }
 }
}));
await saveJson(resolve(root,'results.json'),{updatedAt:new Date().toISOString(),creditsUsed:outputs.reduce((s,r)=>s+(r.creditsUsed??0),0),results});
