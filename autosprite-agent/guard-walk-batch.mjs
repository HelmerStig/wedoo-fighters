import {mkdir,copyFile,access,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {spawn} from 'node:child_process';
import {AutoSprite,readJson,saveJson,plan,redact} from './lib.mjs';

const root=resolve(import.meta.dirname,'..');
const directory=join(root,'autosprite-agent/output/guard-treadmill-walk-pro-20261021');
const statePath=join(directory,'batch.json');
const api=new AutoSprite(process.env.AUTOSPRITE_API_KEY);
const exists=async p=>access(p).then(()=>true,()=>false);
const relative=p=>p.slice(root.length+1).replaceAll('\\','/');
const log=message=>console.log(redact(message,api.key));
async function pool(items,count,fn){
  let next=0;
  await Promise.all(Array.from({length:count},async()=>{while(next<items.length){const item=items[next++];await fn(item);}}));
}
async function cli(args,logPath){
  return new Promise((ok,fail)=>{
    const child=spawn(process.execPath,[join(root,'autosprite-agent/cli.mjs'),...args],{cwd:root,windowsHide:true});
    let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
    child.on('error',fail);
    child.on('close',async code=>{try{await writeFile(logPath,redact(output,api.key));ok(code);}catch(e){fail(e);}});
  });
}
if(process.argv[2]==='prepare'){
  if(await exists(statePath))throw Error('Il batch esiste: usare run/status, senza ricrearlo');
  const roster=await readJson(join(root,'autosprite-agent/output/alphabetical-progress.json'));
  const template=await readJson(join(root,'autosprite-agent/jobs/oscar-walk-treadmill-pro.json'));
  const [characters,account]=await Promise.all([api.characters(),api.request('/account')]);
  if(roster.items.length!==41||new Set(roster.items.map(i=>i.characterId)).size!==41)throw Error('Roster inatteso');
  const state={animation:template.request.animations[0].name,createdAt:new Date().toISOString(),status:'preparing',items:[]};
  await mkdir(directory,{recursive:true});
  await pool(roster.items,2,async item=>{
    const character=characters.find(c=>c.id===item.characterId);
    if(!character||character.name.toLowerCase()!==item.characterName.toLowerCase())throw Error('Identità non corrispondente: '+item.characterName);
    const [poseData,sheetData]=await Promise.all([
      api.request(`/characters/${item.characterId}/poses`),api.request(`/characters/${item.characterId}/spritesheets`)
    ]);
    const uploaded=poseData.poses.filter(p=>p.sourceType==='upload');
    const pose=uploaded.find(p=>p.id===item.poseId)??(uploaded.length===1?uploaded[0]:null);
    if(!pose)throw Error('Posa originale ambigua: '+item.characterName);
    const slug=item.characterName.toLowerCase();
    const config=structuredClone(template);config.characterId=item.characterId;
    config.request.animations[0].poseId=pose.id;config.request.animations[0].lastFramePoseId=pose.id;
    plan(config);
    const jobPath=join(root,'autosprite-agent/jobs',slug+'-guard-treadmill-walk-pro.json');
    const output=join(directory,slug);
    const matches=sheetData.spritesheets.filter(s=>s.name===state.animation).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
    const existing=matches[0];
    if(slug==='oscar'&&!existing)throw Error('Oscar non ha la versione da riutilizzare');
    await saveJson(jobPath,config);await mkdir(output,{recursive:true});
    await writeFile(join(output,'reference-pose.png'),await api.download(pose.imageUrl));
    await saveJson(join(output,'preflight.json'),{character:{id:character.id,name:character.name},poseId:pose.id,existingSheets:matches});
    state.items.push({index:item.index,character:character.name,characterId:character.id,poseId:pose.id,jobPath:relative(jobPath),output:relative(output),status:existing?'reuse':'pending',existingSheetId:existing?.id,creditsUsed:0});
    log('Preparato: '+character.name+(existing?' (esistente)':''));
  });
  state.items.sort((a,b)=>a.index-b.index);
  state.newGenerations=state.items.filter(i=>i.status==='pending').length;
  state.estimatedCredits=state.newGenerations*5;
  if(!Number.isFinite(account.credits)||account.credits<state.estimatedCredits)throw Error('Saldo insufficiente per il batch');
  state.status='ready';await saveJson(statePath,state);
  log(JSON.stringify({characters:state.items.length,newGenerations:state.newGenerations,estimatedCredits:state.estimatedCredits}));
}else if(process.argv[2]==='run'){
  const state=await readJson(statePath);
  if(state.status==='stopped_by_user')throw Error('Batch fermato dall’utente: nessuna nuova generazione autorizzata');
  let writes=Promise.resolve();
  const persist=()=>{const snapshot=structuredClone(state);writes=writes.then(()=>saveJson(statePath,snapshot));return writes;};
  state.status='running';await persist();
  await pool(state.items,3,async item=>{
    if(item.status==='completed')return;
    const output=join(root,item.output),manifestPath=join(output,'manifest.json');
    try{
      let args;
      if(await exists(manifestPath)){
        const m=await readJson(manifestPath);
        if(!m.workflows?.length)throw Error('Invio incerto: controllare API jobs prima di procedere');
        args=['resume',manifestPath];
      }else if(item.existingSheetId){args=['download',item.existingSheetId,output];}
      else{
        if(item.status==='error')throw Error('Errore precedente: richiede verifica, nessun nuovo invio automatico');
        const current=await api.request(`/characters/${item.characterId}/spritesheets`);
        const match=current.spritesheets.find(s=>s.name===state.animation);
        if(match){item.existingSheetId=match.id;args=['download',match.id,output];}
        else args=['generate',join(root,item.jobPath),output];
      }
      item.status='running';await persist();log('Avvio: '+item.character);
      const code=await cli(args,join(output,'cli.log'));
      if(await exists(manifestPath)){
        const m=await readJson(manifestPath);item.creditsUsed=m.creditsUsed??0;
        item.sheetId=m.workflows.flatMap(w=>w.sheets??[])[0]?.sheetId;
        if(code!==0||m.status!=='completed')throw Error('CLI incompleta: consultare manifest e cli.log');
      }else{
        if(code!==0)throw Error('Download incompleto: consultare cli.log');
        item.sheetId=item.existingSheetId;
      }
      item.status='completed';item.completedAt=new Date().toISOString();delete item.error;
      log('Completato: '+item.character+' — '+item.sheetId);
    }catch(e){item.status='error';item.error=redact(e.message,api.key);log('ERRORE '+item.character+': '+item.error);}
    await persist();
  });
  state.status=state.items.every(i=>i.status==='completed')?'completed':'completed_with_errors';
  state.creditsUsed=state.items.reduce((n,i)=>n+(i.creditsUsed??0),0);await persist();
  log(JSON.stringify({status:state.status,completed:state.items.filter(i=>i.status==='completed').length,creditsUsed:state.creditsUsed}));
}else if(process.argv[2]==='stop'){
  const state=await readJson(statePath);
  state.status='stopped_by_user';state.stoppedAt=new Date().toISOString();
  await saveJson(statePath,state);
  for(const item of state.items){
    const manifestPath=join(root,item.output,'manifest.json');
    if(!(await exists(manifestPath)))continue;
    const manifest=await readJson(manifestPath);
    item.creditsUsed=manifest.creditsUsed??0;
    item.remoteJobs=[];
    for(const workflow of manifest.workflows??[]){
      const job=await api.request(`/jobs/${workflow.jobId}`);
      item.remoteJobs.push({jobId:workflow.jobId,status:job.status,sheetIds:job.spritesheetIds??[]});
    }
  }
  state.creditsUsed=state.items.reduce((n,i)=>n+(i.creditsUsed??0),0);
  await saveJson(statePath,state);
  log(JSON.stringify({status:state.status,submitted:state.items.filter(i=>i.remoteJobs?.length).map(i=>({character:i.character,jobs:i.remoteJobs})),creditsUsed:state.creditsUsed}));
}else if(process.argv[2]==='status'){
  const state=await readJson(statePath);log(JSON.stringify({status:state.status,counts:Object.fromEntries(['pending','reuse','running','completed','error'].map(s=>[s,state.items.filter(i=>i.status===s).length])),creditsUsed:state.items.reduce((n,i)=>n+(i.creditsUsed??0),0),errors:state.items.filter(i=>i.status==='error')}));
}else throw Error('Usare prepare, run o status');
