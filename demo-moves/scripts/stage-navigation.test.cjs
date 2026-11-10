const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const stages=require('../stages-catalog.js');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
test('elenco stage con miniature piccole, senza renderer e senza catalogo completo',()=>{
 const html=read('stages.html');
 assert.ok(html.includes('roster-nav.js'));assert.ok(!html.includes('src="catalog.js"'));
 for(const script of ['stage-player.js','stage-weather.js','crt-webgl.js','stage-loop-audio.js','stages-app.js'])assert.ok(!html.includes('src="'+script+'"'));
 const list={},count={};
 vm.runInNewContext(read('stage-index.js'),{window:{STAGES_CATALOG:stages},location:{hash:''},document:{querySelector:s=>s==='#stages-list'?list:count}});
 assert.equal(count.textContent,stages.length);
 for(const stage of stages){
  assert.ok(list.innerHTML.includes('stage.html?id='+stage.id));
  assert.ok(fs.statSync(path.join(__dirname,'../assets/stages',stage.id+'.webp')).size<100000);
 }
 assert.equal((list.innerHTML.match(/<img /g)||[]).length,stages.length);
 assert.ok(!list.innerHTML.includes('<canvas'));
});
function detail(id){
 const calls=[],nodes=new Map();
 function node(){return {textContent:'',innerHTML:'',listeners:{},addEventListener(k,f){this.listeners[k]=f;},removeEventListener(){},setAttribute(){},querySelector(){return node();}};}
 const card=node();
 for(const key of ['#stages-list','#stages-count','#stage-page-name','#stage-breadcrumb'])nodes.set(key,node());
 nodes.get('#stages-list').querySelectorAll=()=>[card];
 const characters=stages.flatMap(s=>s.fighters).map(f=>({id:f.characterId,name:f.characterId,animations:[{id:'idle',frames:[[0,0,512,512]]}]}));
 const empty=()=>({destroy(){}});
 const sandbox={URLSearchParams,location:{search:'?id='+encodeURIComponent(id)},document:{querySelector:s=>nodes.get(s)},window:{STAGES_CATALOG:stages,MOVES_CATALOG:{characters},addEventListener(){}},StageCrt:{launcher:()=>'',markup:()=>'',install:empty},StageEffects:{markup:()=>'',crtMarkup:()=>'',install:empty},StageFullscreen:{install:empty},StagesPlayer:{install(canvas,button,status,stage){calls.push(stage);return {destroy(){}};}}};
 vm.runInNewContext(read('stages-app.js'),sandbox);return {calls,nodes};
}
test('il dettaglio crea un solo player e carica solo i personaggi dello stage scelto',()=>{
 const f=detail('porta-palazzo');assert.equal(f.calls.length,1);assert.equal(f.calls[0].id,'porta-palazzo');
 assert.deepEqual(Array.from(f.calls[0].fighters,f=>f.characterId),['tommaso','marco-balpo']);
 assert.equal(f.nodes.get('#stage-page-name').textContent,'Porta Palazzo');
 const invalid=detail('<unknown>');assert.equal(invalid.calls.length,0);assert.ok(invalid.nodes.get('#stages-list').innerHTML.includes('Stage non trovato'));
});
