import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {AutoSprite,readJson} from '../../autosprite-agent/lib.mjs';
const root=resolve('wedoo-fighters');
const poses=await readJson(resolve(root,'autosprite-agent/jobs/distribution-natale-new3-20261113/poses.json'));
const api=new AutoSprite(process.env.AUTOSPRITE_API_KEY);
const themes={Franco:'renna',Tamara:'elfo',Patrick:'maglione'};
const extra=[];
for(const c of poses){
 const {poses:remote}=await api.request('/characters/'+c.characterId+'/poses');
 const pose=remote.find(p=>p.id===c.pose.id);if(!pose?.imageUrl)throw new Error('Posa mancante '+c.name);
 const bytes=await api.download(pose.imageUrl);
 await mkdir(resolve(root,'PNG/natale'),{recursive:true});
 await writeFile(resolve(root,'PNG/natale',c.name+'-natale.png'),bytes);
 extra.push({name:c.name,theme:themes[c.name]});console.log(c.name+': posa natalizia scaricata');
}
await writeFile(resolve(root,'demo-moves/christmas-extras.json'),JSON.stringify(extra,null,2)+'\n');
