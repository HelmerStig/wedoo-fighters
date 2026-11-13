import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { access } from 'node:fs/promises';
import { readJson, saveJson } from './lib.mjs';
const exec=promisify(execFile);
const batchName=process.argv[2]??'distribution-20261113';
if(!/^[a-z0-9-]+$/.test(batchName))throw new Error('Nome batch non valido');
const root=resolve('wedoo-fighters/autosprite-agent/jobs',batchName);
const data=await readJson(resolve(root,'assignments.json'));
const outputs=[];
for(const row of data.assignments) {
 const output=resolve('wedoo-fighters/autosprite-agent/output',batchName,row.characterId);
 try { await access(resolve(output,'manifest.json')); throw new Error('Manifest già presente: usare resume, non reinviare.'); }
 catch(e) { if(e.code!=='ENOENT') throw e; }
 const result=await exec(process.execPath,['wedoo-fighters/autosprite-agent/cli.mjs','enqueue',row.jobFile,output],{windowsHide:true,timeout:150000});
 const state=await readJson(resolve(output,'manifest.json'));
 outputs.push({character:row.character,animation:row.animation,manifest:resolve(output,'manifest.json'),creditsUsed:state.creditsUsed??state.accepted?.usage?.creditsUsed,workflows:state.workflows});
 await saveJson(resolve(root,'submitted.json'),{outputs});
 console.log(row.character+' → '+row.animation+'; '+state.workflows.map(w=>w.jobId).join(', '));
}
