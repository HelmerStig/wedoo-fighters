import {resolve} from 'node:path';
import {readJson,saveJson,plan} from './lib.mjs';
const root=resolve('wedoo-fighters/autosprite-agent/jobs/distribution-natale-new3-20261113');
const poses=await readJson(resolve(root,'poses.json'));
const {actions}=await readJson(resolve(root,'../distribution-20261113/input.json'));
const indices={Franco:0,Tamara:1,Patrick:5};
const assignments=[];
for(const c of poses){
 const [name,prompt]=actions[indices[c.name]];
 const config={characterId:c.characterId,request:{videoTier:'pro',durationSec:2,frameCount:49,frameSize:512,withSound:false,removeBg:'ultra',turboMode:'first_frame',animations:[{kind:'custom',name,prompt,rawPrompt:true,loop:false,poseId:c.pose.id}]}};
 plan(config);
 const jobFile=resolve(root,c.characterId+'.json');await saveJson(jobFile,config);
 assignments.push({characterId:c.characterId,character:c.name,animation:name,basePoseId:c.pose.id,basePoseLabel:c.pose.label,jobFile,estimatedCredits:7});
}
await saveJson(resolve(root,'assignments.json'),{createdAt:new Date().toISOString(),estimatedCredits:21,assignments});
console.log(JSON.stringify(assignments.map(a=>({character:a.character,animation:a.animation,pose:a.basePoseLabel}))));
