import {resolve} from 'node:path';
import {readJson,saveJson,plan} from './lib.mjs';
const root=resolve('wedoo-fighters/autosprite-agent/jobs/distribution-natale-extra-20261113');
const old=await readJson(resolve(root,'../distribution-20261113/assignments.json'));
const input=await readJson(resolve(root,'../distribution-20261113/input.json'));
const poses=await readJson(resolve(root,'../distribution-natale-20261113/poses.json'));
const assignments=[];
const actionIndex={'Luca Arcangeli':0,'Cristian Canino':1,'Alessandro Mandelli':2,'JERRY':3,'Oscar':4,'TOMMASO':5,'Simona':6,'SBOZ':7,'PIPPO':8,'PEPPO':0};
for(const c of old.preserved){
 const found=poses.find(p=>p.characterId===c.id);
 if(!found)throw new Error('Posa natalizia assente: '+c.name);
 const [name,prompt]=input.actions[actionIndex[c.name]];
 const config={characterId:c.id,request:{videoTier:'pro',durationSec:2,frameCount:49,frameSize:512,withSound:false,removeBg:'ultra',turboMode:'first_frame',animations:[{kind:'custom',name,prompt,rawPrompt:true,loop:false,poseId:found.pose.id}]}};
 plan(config);
 const jobFile=resolve(root,c.id+'.json');await saveJson(jobFile,config);
 assignments.push({characterId:c.id,character:c.name,animation:name,basePoseId:found.pose.id,basePoseLabel:found.pose.label,jobFile,estimatedCredits:7});
}
await saveJson(resolve(root,'assignments.json'),{createdAt:new Date().toISOString(),estimatedCredits:70,assignments});
console.log(JSON.stringify(assignments.map(a=>({character:a.character,animation:a.animation,pose:a.basePoseLabel}))));
