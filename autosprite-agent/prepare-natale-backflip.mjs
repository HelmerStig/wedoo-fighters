import {resolve} from 'node:path';
import {readJson,saveJson,plan} from './lib.mjs';
const root=resolve('wedoo-fighters/autosprite-agent/jobs/distribution-natale-backflip-20261113');
const {animations}=await readJson(resolve('wedoo-fighters/demo-moves/christmas-hover.json'));
const targets=animations.filter(a=>a.hoverAnimation.name==='Piroetta');
if(targets.length!==5)throw new Error('Attesi cinque personaggi con Piroetta; nessun job inviato.');
const prompt='the character crouches, jumps up and backward, rotates a full 360 degrees in the air with arms tucked, then lands softly on both feet in the starting stance. Side view, the camera stays fixed.';
const assignments=[];
for(const c of targets){
 const config={characterId:c.characterId,request:{videoTier:'pro',durationSec:2,frameCount:49,frameSize:512,withSound:false,removeBg:'ultra',turboMode:'first_frame',animations:[{kind:'custom',name:'Backflip',prompt,rawPrompt:true,loop:false,poseId:c.basePoseId}]}};
 plan(config);
 const jobFile=resolve(root,c.characterId+'.json');await saveJson(jobFile,config);
 assignments.push({characterId:c.characterId,character:c.name,animation:'Backflip',basePoseId:c.basePoseId,jobFile,estimatedCredits:7,replacesSpritesheetId:c.sourceSpritesheetId});
}
await saveJson(resolve(root,'assignments.json'),{createdAt:new Date().toISOString(),estimatedCredits:35,assignments});
console.log(JSON.stringify(assignments.map(a=>({character:a.character,animation:a.animation,poseId:a.basePoseId}))));
