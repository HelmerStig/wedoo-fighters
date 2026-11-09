import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {createRequire} from 'node:module';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const {parsePreset}=createRequire(import.meta.url)('../crt-panel.js');
const data={};
for(const id of ['villa-arduino','porta-susa']){
  const source=await readFile(resolve(root,'original-backgrounds',id,'crt-preset.json'),'utf8');
  data[id]=parsePreset(source);
}
await writeFile(resolve(root,'demo-moves/crt-presets.js'),'/* Generato da scripts/build-crt-presets.mjs, utilizzabile anche offline. */\nwindow.STAGE_CRT_PRESETS = '+JSON.stringify(data,null,2)+';\n');
console.log('Preset CRT aggiornati: '+Object.keys(data).join(', '));
