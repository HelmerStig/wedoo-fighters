import {resolve} from 'node:path';
import {readJson,saveJson,plan} from './lib.mjs';
const root=resolve('wedoo-fighters/autosprite-agent/jobs/distribution-natale-20261113');
const old=await readJson(resolve(root,'../distribution-20261113/assignments.json'));
const poses=await readJson(resolve(root,'poses.json'));
const assignments=[],excluded=[];
for(const row of old.assignments){
 const found=poses.find(p=>p.characterId===row.characterId);
 if(!found){excluded.push({character:row.character,reason:'Posa natalizia assente'});continue;}
 const config=await readJson(row.jobFile);
 config.request.animations[0].poseId=found.pose.id;
 plan(config);
 const jobFile=resolve(root,row.characterId+'.json');
 await saveJson(jobFile,config);
 assignments.push({...row,basePoseId:found.pose.id,basePoseLabel:found.pose.label,jobFile,estimatedCredits:7});
}
await saveJson(resolve(root,'assignments.json'),{createdAt:new Date().toISOString(),supersedes:'distribution-20261113',preserved:old.preserved,excluded,estimatedCredits:assignments.length*7,assignments});
console.log(JSON.stringify({jobs:assignments.length,estimatedCredits:assignments.length*7,excluded}));
