import {AutoSprite,saveJson} from '../autosprite-agent/lib.mjs';
const api=new AutoSprite(process.env.AUTOSPRITE_API_KEY);
const characters=(await api.characters()).filter(c=>['Franco','Tamara','Patrick','Luca Arcangeli','Cristian Canino','Alessandro Mantelli'].includes(c.name));
const results=await Promise.all(characters.map(async c=>{
 const data=await api.request(`/characters/${c.id}/spritesheets`);
 return {character:c.name,characterId:c.id,sheets:data.spritesheets.map(({id,name,kind,createdAt,sourceVideoId,frameCount,frameWidth,frameHeight,loopStart,loopEnd,speedMultiplier,status})=>({id,name,kind,createdAt,sourceVideoId,frameCount,frameWidth,frameHeight,loopStart,loopEnd,speedMultiplier,status}))};
}));
await saveJson('tmp/new-idles-remote.json',results);
console.log(JSON.stringify(results,null,2));
