import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const read=async path=>JSON.parse((await readFile(path,'utf8')).replace(/^\uFEFF/,''));
const save=(path,data)=>writeFile(path,JSON.stringify(data,null,2)+'\n');
const path=resolve(root,'animation/light-punch-manifest.json');
const manifest=await read(path);
manifest.durationMs=500;
delete manifest.playbackFps;
for(const item of manifest.items){
  item.durationMs=500;
  item.playbackFps=item.frames*2;
  const atlasPath=resolve(root,item.atlas),atlas=await read(atlasPath);
  atlas.meta.fps=item.playbackFps;
  atlas.meta.duration_ms=500;
  for(const frame of Object.values(atlas.frames))frame.duration=500/item.frames;
  await save(atlasPath,atlas);
}
await save(path,manifest);
console.log(`${manifest.items.length} Pugni leggeri impostati a 500 ms.`);
