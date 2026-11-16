import {readFile,writeFile} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),demo=resolve(root,'demo-moves');
const manifest=JSON.parse(await readFile(resolve(root,'animation/stage-actors.json'),'utf8'));
const catalog={};
for(const character of manifest.characters){
  const animations={};
  for(const [id,item] of Object.entries(character.animations)){
    const atlas=JSON.parse(await readFile(resolve(root,item.atlas),'utf8'));
    const frames=Object.entries(atlas.frames).sort(([a],[b])=>Number(a)-Number(b)).map(([,f])=>[f.x,f.y,f.w,f.h]);
    const png=await readFile(resolve(root,item.image));
    if(frames.length!==item.frames||frames.some(([x,y,w,h])=>x<0||y<0||x+w>png.readUInt32BE(16)||y+h>png.readUInt32BE(20)))throw Error('Atlas non valido: '+character.id+'/'+id);
    animations[id]={image:relative(demo,resolve(root,item.image)).replaceAll('\\','/'),frames,frameWidth:item.frameWidth,frameHeight:item.frameHeight,playbackFps:item.playbackFps,contentBounds:item.contentBounds,groundRange:item.groundRange};
  }
  catalog[character.id]={name:character.name,animations};
}
await writeFile(resolve(demo,'stage-actors-catalog.js'),'/* Generato da scripts/build-stage-actors.mjs. */\nwindow.STAGE_ACTORS_CATALOG = '+JSON.stringify(catalog,null,2)+';\n');
console.log('Personaggi di sfondo: '+Object.keys(catalog).join(', '));
