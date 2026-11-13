import { resolve } from 'node:path';
import { AutoSprite, readJson, saveJson, plan } from './lib.mjs';
const root=resolve('wedoo-fighters/autosprite-agent/jobs/distribution-20261113');
const input=await readJson(resolve(root,'input.json'));
const api=new AutoSprite(process.env.AUTOSPRITE_API_KEY);
const assignments=[];
for (const [i,c] of input.characters.entries()) {
  const raw=await api.request('/characters/'+c.id);
  const base=raw.baseImageUrl?.split('?')[0];
  const pose=c.poses.find(p=>p.imageUrl===base);
  if(!pose) throw new Error('Base image non associata a posa: '+c.name);
  const [name,prompt]=input.actions[i%input.actions.length];
  const config={characterId:c.id,request:{videoTier:'pro',durationSec:2,frameCount:49,frameSize:512,withSound:false,removeBg:'ultra',turboMode:'first_frame',animations:[{kind:'custom',name,prompt,rawPrompt:true,loop:false,poseId:pose.id}]}};
  const jobFile=resolve(root,c.id+'.json');
  const validation=plan(config);
  await saveJson(jobFile,config);
  assignments.push({characterId:c.id,character:c.name,animation:name,basePoseId:pose.id,basePoseLabel:pose.label,jobFile,estimatedCredits:validation.estimatedCredits.max});
  console.log(c.name+' → '+name+' ['+pose.label+']');
}
await saveJson(resolve(root,'assignments.json'),{createdAt:new Date().toISOString(),preserved:input.preserved,estimatedCredits:assignments.reduce((s,a)=>s+a.estimatedCredits,0),assignments});
