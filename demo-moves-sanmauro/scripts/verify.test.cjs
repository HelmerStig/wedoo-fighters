const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'),'utf8'));

test('sette personaggi con idle, camminata e salto: copie integre e frame entro i limiti',()=>{
  assert.deepEqual(manifest.characters.map(c=>c.name),['Arianna','Bue','Mangler','Mileto','Oscare','Peirò','Torpe']);
  const idleCounts={arianna:24,bue:63,mangler:49,mileto:63,oscare:63,peirolo:63,torpe:61};
  const walkCounts={arianna:48,bue:49,mangler:48,mileto:49,oscare:49,peirolo:49,torpe:21};
  const walkPaths={arianna:'basic-moves/01-walk.png',mangler:'02-walk.png',torpe:'Torpe-walk-trimmed.png'};
  const jumpCounts={arianna:49,bue:37,mangler:25,mileto:39,oscare:38,peirolo:40,torpe:34};
  for(const c of manifest.characters){
    assert.deepEqual(c.animations.map(a=>a.id),['idle','walk','jump']);
    for(const a of c.animations){
      const sheet=fs.readFileSync(path.join(root,a.image));
      assert.equal(createHash('sha256').update(sheet).digest('hex'),a.sourceSha256,c.name+' '+a.id);
      const width=sheet.readUInt32BE(16),height=sheet.readUInt32BE(20);
      assert.equal(a.frames.length,({idle:idleCounts,walk:walkCounts,jump:jumpCounts})[a.id][c.id]);
      assert.equal(a.playbackFps,a.id==='jump'?a.frames.length:24);
      assert.equal(width,a.sheetWidth);assert.equal(height,a.sheetHeight);
      for(const [i,[x,y,w,h]] of a.frames.entries()){
        assert.equal(w,512);assert.equal(h,512);assert.ok(x>=0&&y>=0&&x+w<=width&&y+h<=height,c.name);
        if(a.id==='walk'){assert.equal(x,(i%7)*512);assert.equal(y,Math.floor(i/7)*512);}
      }
      if(a.id==='walk'){
        assert.equal(a.sourceFps,24);
        assert.equal(a.sourcePath,'assets/sprites/characters/'+c.id+'/'+(walkPaths[c.id]??'walk-spritesheet.png'));
        assert.equal(a.trimmed,c.id==='torpe');assert.ok(a.sourceConfigPath);
      }
    }
    const portrait=fs.readFileSync(path.join(root,c.thumbnail));
    assert.equal(portrait.readUInt32BE(16),512);assert.equal(portrait.readUInt32BE(20),512);
    assert.deepEqual(fs.readdirSync(path.join(root,'assets/characters',c.id)).sort(),['idle.png','jump.png','portrait.png','walk.png']);
  }
});

test('catalogo offline uguale al manifest, tutte le pagine hanno riferimenti autonomi',()=>{
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'catalog.js'),'utf8'),context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.window.SANMAURO_CATALOG)),manifest);
  for(const page of ['index.html','personaggio.html','mosse.html','stages.html']){
    const html=fs.readFileSync(path.join(root,page),'utf8');
    for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
      if(match[1].startsWith('#'))continue;
      assert.ok(!match[1].includes('..')&&!match[1].includes(':'),match[1]);
      assert.ok(fs.existsSync(path.join(root,match[1].split('?')[0])),match[1]);
    }
  }
});

test('ingombri normalizzati, piedi e centro comuni, rapporto delle scale Godot conservato',()=>{
  for(const c of manifest.characters){
    const [idle,walk]=c.animations;
    assert.ok(Math.abs(idle.medianContentHeight*idle.preview.scale[1]-344)<1e-8);
    assert.ok(Math.abs(walk.medianContentHeight*walk.preview.scale[1]-344)<10,c.name);
    for(const a of c.animations){
      const [x,y,w,h]=a.preview.drawRect,[sx,sy]=a.preview.scale,[ax,ay]=a.preview.anchor;
      assert.ok(Math.abs(sx-sy)<1e-8,'proporzioni conservate');
      assert.ok(Math.abs(x+ax*sx-256)<1e-8);assert.ok(Math.abs(y+ay*sy-430)<1e-8);
      assert.ok(Math.abs(w/a.frameWidth-sx)<1e-8&&Math.abs(h/a.frameHeight-sy)<1e-8);
      const [left,top,right,bottom]=a.contentBounds;
      assert.ok(x+left*sx>=0&&x+right*sx<=512&&y+top*sy>=0&&y+bottom*sy<=512,c.name+' '+a.id);
    }
    assert.ok(Math.abs(walk.preview.scale[0]/idle.preview.scale[0]-walk.sourceTransform.scale[0]/idle.sourceTransform.scale[0])<1e-8);
  }
  const mangler=manifest.characters.find(c=>c.id==='mangler');
  assert.deepEqual(mangler.animations.map(a=>a.sourceTransform.scale),[[.85,.85],[.7,.7],[.85,.85]]);
  assert.ok(mangler.animations[1].preview.drawRect[2]<mangler.animations[0].preview.drawRect[2]);
});

test('salti rispettano selezioni Godot, preparazione compressa e durate originali di Mangler',()=>{
  const {advanceAnimation}=require('../player-core.js');
  const starts={arianna:0,bue:3,mangler:0,mileto:4,oscare:5,peirolo:4,torpe:4};
  const takeoffs={arianna:9,bue:9,mangler:5,mileto:11,oscare:8,peirolo:12,torpe:9};
  for(const c of manifest.characters){
    const a=c.animations.find(a=>a.id==='jump'),columns=c.id==='mangler'?5:7;
    for(const [i,frame] of a.frames.entries()){
      const source=starts[c.id]+i;
      assert.deepEqual(frame,[source%columns*512,Math.floor(source/columns)*512,512,512]);
    }
    assert.equal(a.takeoffFrame,takeoffs[c.id]);assert.equal(a.sourceLoop,false);
    assert.equal(a.frameDurations.length,a.frames.length);
    assert.ok(a.frameDurations.every(d=>Number.isFinite(d)&&d>0));
    assert.ok(Math.abs(a.frameDurations.reduce((s,d)=>s+d,0)-a.durationMs)<1e-8);
    for(const speed of [.5,1,2]){
      assert.equal(advanceAnimation({frame:0,remainder:0},a.takeoffMs/speed,a,speed,true).frame,a.takeoffFrame,c.name);
      assert.equal(advanceAnimation({frame:0,remainder:0},a.durationMs/speed,a,speed,true).frame,0);
    }
  }
  const mangler=manifest.characters.find(c=>c.id==='mangler').animations[2];
  assert.match(mangler.sourceConfigPath,/idle_frames.tres$/);assert.match(mangler.sourcePath,/04-jump.png$/);
  assert.ok(Math.abs(mangler.sourceFrameDurations[5]-1.942857*1000/24)<1e-8);
  assert.ok(Math.abs(mangler.sourceTakeoffMs-1000*4/60)<1e-8);
  assert.equal(mangler.preview.scale[0],manifest.characters.find(c=>c.id==='mangler').animations[0].preview.scale[0]);
});

test('apici a 500 ms e ciclo di 1000 ms per tutti, anche con velocità e cicli diversi',()=>{
  const {advanceAnimation}=require('../player-core.js');
  const timing=JSON.parse(fs.readFileSync(path.join(root,'assets/jump-timing.json'),'utf8'));
  for(const c of manifest.characters){
    const a=c.animations[2],entry=timing.items.find(i=>i.characterId===c.id);
    assert.equal(a.apexFrame,entry.apexFrame);assert.equal(a.apexMs,500);assert.equal(a.durationMs,1000);
    assert.equal(entry.sourceSha256,a.sourceSha256);
    assert.equal(entry.framesSha256,createHash('sha256').update(JSON.stringify(a.frames)).digest('hex'));
    for(const speed of [.5,1,2]){
      const origin={frame:0,remainder:0};
      for(const cycle of [0,1,10]){
        assert.ok(advanceAnimation(origin,(cycle*1000+499.99)/speed,a,speed,true).frame<a.apexFrame,c.name);
        assert.equal(advanceAnimation(origin,(cycle*1000+500)/speed,a,speed,true).frame,a.apexFrame,c.name);
        assert.equal(advanceAnimation(origin,((cycle+1)*1000)/speed,a,speed,true).frame,0);
      }
      assert.equal(advanceAnimation(origin,1000/speed,a,speed,false).ended,true);
    }
  }
});

test('report HTML/CSV con sette pose e link locali validi',()=>{
  const html=fs.readFileSync(path.join(root,'reports/jump-timing.html'),'utf8');
  const csv=fs.readFileSync(path.join(root,'reports/jump-timing.csv'),'utf8');
  assert.match(html,/0,5 s/);assert.match(html,/1000 ms/);
  assert.equal((html.match(/<tr data-character=/g)??[]).length,7);
  assert.equal(csv.trim().split(/\r?\n/).length,8);
  for(const c of manifest.characters){
    assert.ok(html.includes('data-character="'+c.id+'"'));
    const png=fs.readFileSync(path.join(root,'reports/jump-poses',c.id+'.png'));
    assert.equal(png.readUInt32BE(16),512);assert.equal(png.readUInt32BE(20),512);
  }
  for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    assert.ok(fs.existsSync(path.resolve(root,'reports',match[1].split('?')[0])),match[1]);
  }
});

test('server autonomo e condiviso servono gallerie e asset, proteggendo i percorsi esterni',async t=>{
  for(const [modulePath,prefix] of [['./serve.mjs',''],['../../demo-moves/scripts/serve.mjs','/demo-moves-sanmauro']]){
    const {createDemoServer}=await import(modulePath),server=createDemoServer();
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    t.after(()=>new Promise(resolve=>server.close(resolve)));
    const base='http://127.0.0.1:'+server.address().port;
    for(const asset of ['index.html','personaggio.html?id=torpe','mosse.html?move=walk','reports/jump-timing.html','reports/jump-timing.csv','assets/jump-timing.json','catalog.js','styles.css','roster.css','app.js','roster-preview.js','player-core.js','animation-gallery.js','move-groups.js',...manifest.characters.flatMap(c=>[c.thumbnail,'reports/jump-poses/'+c.id+'.png',...c.animations.map(a=>a.image)])]){
      assert.equal((await fetch(base+prefix+'/'+asset,{method:'HEAD'})).status,200,asset);
    }
    assert.equal((await fetch(base+prefix+'/.git/config')).status,403);
    assert.equal((await fetch(base+'/project.godot')).status,403);
    assert.equal((await fetch(base+prefix+'/absent.png')).status,404);
  }
});

function fixture({page='roster',search=''}={}){
  const nodes=new Map(),galleries=[],lifecycle={},classes=new Set();let stops=0,focused;
  function node(){return {hidden:false,value:'',textContent:'',innerHTML:'',dataset:{},listeners:{},attrs:{},
    addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);},emit(type,event={}){for(const fn of this.listeners[type]??[])fn(event);},
    setAttribute(k,v){this.attrs[k]=v;},focus(){focused=this;},getClientRects(){return this.hidden?[]:[1];}};}
  for(const s of ['#main','#character-grid','#sidebar','.menu-toggle','.menu-overlay','#character-search','#nav-count','#visible-count','#empty-state','.nav-empty','.sidebar-close','#character-detail','#breadcrumb-name','#animation-gallery','#move-gallery','#move-name','#move-total-count','#move-visible-count','#move-empty','#move-report'])nodes.set(s,node());
  const elements=manifest.characters.flatMap(c=>[Object.assign(node(),{dataset:{character:c.id}}),Object.assign(node(),{dataset:{character:c.id}})]);
  nodes.get('#sidebar').querySelectorAll=()=>[nodes.get('#character-search'),...elements];
  const body={dataset:{page},classList:{contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k),toggle(k,on){on?classes.add(k):classes.delete(k);}}};
  const document={...node(),body,querySelector:s=>nodes.get(s),querySelectorAll(s){if(s==='[data-character]')return elements;if(s==='[data-total]')return [node()];return [];}};
  const context={window:{SANMAURO_CATALOG:manifest,addEventListener(type,fn){lifecycle[type]=fn;}},document,URLSearchParams,location:{search},
    MovesGroups:require('../move-groups.js'),MovesGallery:{install(container,data,options){const record={container,data,options,destroyed:false};galleries.push(record);return {destroy(){record.destroyed=true;}};}},
    MovesRoster:{install:()=>({stop(){stops++;},refresh(){}})},matchMedia:()=>({matches:false,addEventListener(){}})};
  vm.runInNewContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),context);
  return {nodes,elements,galleries,lifecycle,document,stops:()=>stops,focused:()=>focused};
}

test('roster e menu collegano le vere pagine; ricerca senza accenti con stato vuoto',()=>{
  const f=fixture(),search=f.nodes.get('#character-search');
  assert.match(f.nodes.get('#character-grid').innerHTML,/personaggio.html\?id=torpe/);
  assert.match(f.nodes.get('#character-grid').innerHTML,/3 animazioni disponibili/);
  assert.match(f.nodes.get('#sidebar').innerHTML,/mosse.html\?move=walk/);
  assert.match(f.nodes.get('#sidebar').innerHTML,/Per personaggio/);
  assert.match(f.nodes.get('#sidebar').innerHTML,/href="stages.html"/);
  search.value='peiro';search.emit('input');
  assert.deepEqual(f.elements.filter(el=>!el.hidden).map(el=>el.dataset.character),['peirolo','peirolo']);
  assert.equal(f.nodes.get('#visible-count').textContent,1);
  search.value='inesistente';search.emit('input');assert.equal(f.nodes.get('#empty-state').hidden,false);
  search.value='';search.emit('input');assert.equal(f.nodes.get('#visible-count').textContent,7);
  f.lifecycle.pagehide();assert.equal(f.stops(),1);
});

test('dettaglio personaggio mostra le tre mosse con navigazione e highlight',()=>{
  const f=fixture({page:'character',search:'?id=torpe&anim=walk'});
  assert.equal(f.document.title,'Torpe · Animazioni · Sanmauro Fighters');
  assert.deepEqual(f.galleries[0].data.animations.map(a=>a.id),['idle','walk','jump']);
  assert.equal(f.galleries[0].data.animations[1].frames.length,21);
  assert.equal(f.galleries[0].options.highlightId,'walk');
  assert.match(f.nodes.get('#character-detail').innerHTML,/personaggio.html\?id=peirolo&anim=walk/);
  f.lifecycle.pagehide();assert.equal(f.galleries[0].destroyed,true);
});

test('Salto disponibile per mossa e per personaggio, con highlight e scala corretta',()=>{
  const f=fixture({page:'moves',search:'?move=jump'});
  assert.equal(f.nodes.get('#move-name').textContent,'Salto');
  assert.equal(f.nodes.get('#move-report').hidden,false);
  assert.equal(f.galleries[0].data.animations.length,7);
  const c=fixture({page:'character',search:'?id=mangler&anim=jump'});
  assert.equal(c.galleries[0].options.highlightId,'jump');
  assert.equal(c.galleries[0].data.animations[2].frames.length,25);
  assert.match(c.nodes.get('#sidebar').innerHTML,/mosse.html\?move=jump/);
});

test('per mossa confronta sette camminate; ricerca distrugge e ricrea la galleria',()=>{
  const f=fixture({page:'moves',search:'?move=walk'}),search=f.nodes.get('#character-search');
  assert.equal(f.nodes.get('#move-name').textContent,'Camminata');
  assert.equal(f.nodes.get('#move-report').hidden,true);
  assert.equal(f.galleries[0].data.animations.length,7);
  assert.ok(f.galleries[0].data.animations.every(a=>a.id==='walk'&&a.characterId&&a.characterName));
  search.value='peiro';search.emit('input');
  assert.equal(f.galleries[0].destroyed,true);assert.equal(f.galleries.at(-1).data.animations.length,1);
  assert.equal(f.galleries.at(-1).data.animations[0].characterId,'peirolo');
  search.value='nessuno';search.emit('input');assert.equal(f.nodes.get('#move-empty').hidden,false);
  assert.equal(f.nodes.get('#move-gallery').hidden,true);
  search.value='';search.emit('input');assert.equal(f.galleries.at(-1).data.animations.length,7);
});

test('URL di personaggio e mossa inesistenti hanno un recupero, senza gallery errate',()=>{
  const c=fixture({page:'character',search:'?id=inesistente'});
  assert.match(c.nodes.get('#character-detail').innerHTML,/Personaggio non trovato/);assert.equal(c.galleries.length,0);
  const m=fixture({page:'moves',search:'?move=inesistente'});
  assert.match(m.nodes.get('#main').innerHTML,/Mossa non trovata/);assert.equal(m.galleries.length,0);
  m.nodes.get('#character-search').emit('input');
});
