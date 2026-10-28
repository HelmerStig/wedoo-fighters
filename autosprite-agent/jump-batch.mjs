import {mkdir,access,writeFile,readdir,copyFile} from 'node:fs/promises';
import {resolve,join,basename} from 'node:path';
import {spawn} from 'node:child_process';
import {AutoSprite,readJson,saveJson,plan,redact} from './lib.mjs';

const root=resolve(import.meta.dirname,'..');
const directory=join(root,'autosprite-agent/output/jump-custom-20261028');
const statePath=join(directory,'batch.json');
const stopPath=join(directory,'STOP');
const api=new AutoSprite(process.env.AUTOSPRITE_API_KEY);
const exists=path=>access(path).then(()=>true,()=>false);
const relative=path=>path.slice(root.length+1).replaceAll('\\','/');
const log=value=>console.log(redact(typeof value==='string'?value:JSON.stringify(value),api.key));
async function pool(items,count,fn){let index=0;await Promise.all(Array.from({length:count},async()=>{while(index<items.length){await fn(items[index++]);}}));}
async function cli(args,output){
  return new Promise((ok,fail)=>{
    const child=spawn(process.execPath,[join(root,'autosprite-agent/cli.mjs'),...args],{cwd:root,windowsHide:true});
    let text='';child.stdout.on('data',b=>text+=b);child.stderr.on('data',b=>text+=b);
    child.on('error',fail);child.on('close',async code=>{try{await writeFile(join(output,'cli.log'),redact(text,api.key));ok(code);}catch(e){fail(e);}});
  });
}
const command=process.argv[2];
if(command==='prepare'){
  if(await exists(statePath))throw Error('Batch già preparato: usare run o status');
  const template=await readJson(join(root,'autosprite-agent/jobs/oscar-jump-compact-pro.json'));
  const roster=(await readdir(join(root,'PNG'))).filter(f=>f.toLowerCase().endsWith('.png')).sort(new Intl.Collator('it',{sensitivity:'base',ignorePunctuation:true}).compare);
  const [characters,account]=await Promise.all([api.characters(),api.request('/account')]);
  const historical=await readJson(join(root,'autosprite-agent/output/alphabetical-progress.json'));
  const approved={oscar:'cmvrtl6i40052wv57993v5l8u',jerry:'cmvrttn7v000b9x8c9psq6pnx'};
  const state={animation:'jump custom',createdAt:new Date().toISOString(),status:'preparing',items:[]};
  await mkdir(directory,{recursive:true});
  await pool(roster,2,async(filename)=>{
    const requested=basename(filename,'.png').toLowerCase();
    const slug=requested==='oscare'?'oscar':requested;
    const matches=characters.filter(c=>c.name.toLowerCase()===slug);
    if(matches.length!==1)throw Error('Identità ambigua o assente: '+filename);
    const character=matches[0];
    const [poses,sheets]=await Promise.all([api.request(`/characters/${character.id}/poses`),api.request(`/characters/${character.id}/spritesheets`)]);
    const uploaded=poses.poses.filter(p=>p.sourceType==='upload');
    const old=historical.items.find(i=>i.characterId===character.id);
    const pose=uploaded.find(p=>p.id===old?.poseId)??(uploaded.length===1?uploaded[0]:null);
    if(!pose)throw Error('Posa originale ambigua: '+filename);
    const sameName=sheets.spritesheets.filter(s=>s.name.toLowerCase()==='jump custom').sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
    let existing=approved[slug]?sheets.spritesheets.find(s=>s.id===approved[slug]):sameName[0];
    if(approved[slug]&&!existing){
      const approvedOutput=slug==='oscar'?'oscar-jump-compact-pro-20261028-01':'jerry-jump-compact-pro-20261028-01';
      const metadata=await readJson(join(root,'autosprite-agent/output',approvedOutput,approved[slug]+'-metadata.json'));
      existing=sameName.find(s=>s.sourceVideoId&&s.sourceVideoId===metadata.sourceVideoId);
    }
    if(approved[slug]&&!existing)throw Error('Risultato approvato non presente: '+slug);
    const output=join(directory,slug),jobPath=join(root,'autosprite-agent/jobs',slug+'-jump-batch-20261028.json');
    const config=structuredClone(template);config.characterId=character.id;
    config.request.animations[0].poseId=pose.id;config.request.animations[0].lastFramePoseId=pose.id;plan(config);
    await saveJson(jobPath,config);await mkdir(output,{recursive:true});
    await writeFile(join(output,'reference-pose.png'),await api.download(pose.imageUrl));
    await saveJson(join(output,'preflight.json'),{filename,characterId:character.id,poseId:pose.id,matchingSheets:sameName});
    state.items.push({index:roster.indexOf(filename)+1,filename,character:character.name,characterId:character.id,poseId:pose.id,jobPath:relative(jobPath),output:relative(output),status:existing?'reuse':'pending',existingSheetId:existing?.id,creditsUsed:0});
    log('Preparato: '+character.name+(existing?' (riuso)':''));
  });
  state.items.sort((a,b)=>a.index-b.index);
  if(new Set(state.items.map(i=>i.characterId)).size!==roster.length)throw Error('Personaggi duplicati');
  state.newGenerations=state.items.filter(i=>i.status==='pending').length;state.estimatedCredits=state.newGenerations*5;
  if(!Number.isFinite(account.credits)||account.credits<state.estimatedCredits)throw Error('Saldo insufficiente per completare il batch');
  state.status='ready';await saveJson(statePath,state);log({characters:state.items.length,newGenerations:state.newGenerations,estimatedCredits:state.estimatedCredits});
}else if(command==='run'){
  const state=await readJson(statePath);
  if(await exists(stopPath)||state.status==='stopped_by_user')throw Error('Batch fermato: nessun nuovo invio');
  let writes=Promise.resolve();const persist=()=>{const snapshot=structuredClone(state);writes=writes.then(()=>saveJson(statePath,snapshot));return writes;};
  state.status='running';await persist();
  await pool(state.items,4,async item=>{
    if(item.status==='completed'||await exists(stopPath))return;
    const output=join(root,item.output),manifestPath=join(output,'manifest.json');
    try{
      let args;
      if(await exists(manifestPath)){
        const m=await readJson(manifestPath);
        if(!m.workflows?.length)throw Error('Invio incerto: controllare jobs senza nuovo POST');
        args=['resume',manifestPath];
      }else if(item.existingSheetId)args=['download',item.existingSheetId,output];
      else{
        if(item.status!=='pending')throw Error('Stato non sicuro per nuovo invio');
        const current=await api.request(`/characters/${item.characterId}/spritesheets`);
        const duplicate=current.spritesheets.find(s=>s.name.toLowerCase()==='jump custom');
        if(duplicate){item.existingSheetId=duplicate.id;args=['download',duplicate.id,output];}
        else args=['generate',join(root,item.jobPath),output];
      }
      if(await exists(stopPath))return;
      item.status='running';await persist();log('Avvio: '+item.character);
      const code=await cli(args,output);
      if(await exists(manifestPath)){
        const m=await readJson(manifestPath);item.creditsUsed=m.creditsUsed??0;item.sheetId=m.workflows.flatMap(w=>w.sheets??[])[0]?.sheetId;
        if(code!==0||m.status!=='completed')throw Error('CLI incompleta: consultare manifest e log');
      }else{if(code!==0)throw Error('Download incompleto');item.sheetId=item.existingSheetId;}
      item.status='completed';item.completedAt=new Date().toISOString();delete item.error;log('Completato: '+item.character+' — '+item.sheetId);
    }catch(e){item.status='error';item.error=redact(e.message,api.key);log('ERRORE '+item.character+': '+item.error);}
    await persist();
  });
  state.status=await exists(stopPath)?'stopped_by_user':state.items.every(i=>i.status==='completed')?'completed':'completed_with_errors';
  state.creditsUsed=state.items.reduce((n,i)=>n+(i.creditsUsed??0),0);await persist();log({status:state.status,completed:state.items.filter(i=>i.status==='completed').length,creditsUsed:state.creditsUsed});
}else if(command==='stop'){
  await writeFile(stopPath,new Date().toISOString());log('Bloccati i nuovi invii; i lavori accettati possono completarsi.');
}else if(command==='status'){
  const state=await readJson(statePath);log({status:state.status,counts:Object.fromEntries(['pending','reuse','running','completed','error'].map(s=>[s,state.items.filter(i=>i.status===s).length])),creditsUsed:state.items.reduce((n,i)=>n+(i.creditsUsed??0),0),errors:state.items.filter(i=>i.status==='error')});
}else throw Error('Usare prepare, run, stop o status');
