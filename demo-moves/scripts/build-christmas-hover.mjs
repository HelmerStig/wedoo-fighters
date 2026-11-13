import {resolve} from 'node:path';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=resolve('wedoo-fighters'),demo=resolve(root,'demo-moves');
const batches=['distribution-natale-20261113','distribution-natale-extra-20261113','distribution-natale-new3-20261113','distribution-natale-backflip-20261113','distribution-natale-backflip-peirolo-20261113','peirolo-typewriter-20261113'];
const animations=[];
const psQuote=value=>"'"+value.replaceAll("'","''")+"'";
for(const batch of batches){
 const {assignments}=JSON.parse(await readFile(resolve(root,'autosprite-agent/jobs',batch,'assignments.json'),'utf8'));
 for(const row of assignments){
  const folder=row.sourceFolder?resolve(root,row.sourceFolder):resolve(root,'autosprite-agent/output',batch,row.characterId);
  let id=row.sourceSpritesheetId;
  if(!id){
   const manifest=JSON.parse(await readFile(resolve(folder,'manifest.json'),'utf8'));
   if(manifest.status!=='completed')throw new Error('Job non completato: '+row.character);
   id=manifest.workflows[0].sheets[0].sheetId;
  }
  const meta=JSON.parse(await readFile(resolve(folder,id+'-metadata.json'),'utf8'));
  if(meta.characterId!==row.characterId||meta.status!=='succeeded')throw new Error('Spritesheet non valido per '+row.character);
  const atlas=JSON.parse(await readFile(resolve(folder,id+'-atlas.json'),'utf8'));
  const entries=Array.isArray(atlas.frames)?atlas.frames:Object.values(atlas.frames);
  const frames=entries.map(entry=>{const f=entry.frame??entry;return [f.x,f.y,f.w,f.h];});
  if(frames.length!==49||meta.frameCount!==49)throw new Error('Servono 49 frame: '+row.character);
  const filename=row.characterId+'-'+id+'.png';
  await mkdir(resolve(demo,'assets/christmas-hover'),{recursive:true});
  await copyFile(resolve(folder,id+'.png'),resolve(demo,'assets/christmas-hover',filename));
  let staticImage;
  if(batch==='distribution-natale-new3-20261113'){
   staticImage='assets/christmas-hover/'+row.characterId+'-'+id+'-pose.png';
   const [x,y,w,h]=frames[0];
   // Export the already transparent first frame; preserve the original uploaded pose.
   const command=`Add-Type -AssemblyName System.Drawing; $sheet=[System.Drawing.Bitmap]::FromFile(${psQuote(resolve(folder,id+'.png'))}); try { $rect=New-Object System.Drawing.Rectangle ${x},${y},${w},${h}; $frame=$sheet.Clone($rect,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb); try { $frame.Save(${psQuote(resolve(demo,staticImage))},[System.Drawing.Imaging.ImageFormat]::Png) } finally { $frame.Dispose() } } finally { $sheet.Dispose() }`;
   execFileSync('powershell.exe',['-NoProfile','-Command',command],{windowsHide:true});
  }
  const animation={name:row.character,characterId:row.characterId,sourceSpritesheetId:id,basePoseId:row.basePoseId,...(staticImage?{staticImage}:{}),hoverAnimation:{name:row.animation,image:'assets/christmas-hover/'+filename,frameWidth:meta.frameWidth,frameHeight:meta.frameHeight,playbackFps:24,loop:false,frames}};
  if(row.replacesSpritesheetId){
   const index=animations.findIndex(a=>a.characterId===row.characterId);
   if(index<0||animations[index].sourceSpritesheetId!==row.replacesSpritesheetId)throw new Error('Sostituzione non corrispondente: '+row.character);
   animations[index]=animation;
  }else animations.push(animation);
 }
}
if(animations.length!==45||new Set(animations.map(a=>a.characterId)).size!==45)throw new Error('Roster incompleto o duplicato');
await writeFile(resolve(demo,'christmas-hover.json'),JSON.stringify({animations},null,2)+'\n');
console.log('Hover natalizi: '+animations.length+' animazioni, 49 frame ciascuna, 24 fps, senza loop.');
