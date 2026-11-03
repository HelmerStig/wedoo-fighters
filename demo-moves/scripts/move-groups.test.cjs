const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {group,filter}=require('../move-groups.js');
function characters(){const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../catalog.js'),'utf8'),context);return context.window.MOVES_CATALOG.characters;}
test('ogni mossa contiene tutti e solo i personaggi disponibili, senza alterare frame o velocita',()=>{
  const roster=characters(),groups=group(roster);
  assert.deepEqual(groups.map(g=>g.id),[...new Set(roster.flatMap(c=>c.animations.map(a=>a.id)))]);
  for(const move of groups){
    const expected=roster.filter(c=>c.animations.some(a=>a.id===move.id));
    assert.deepEqual(move.animations.map(a=>a.characterId),Array.from(expected,c=>c.id));
    assert.equal(new Set(move.animations.map(a=>a.characterId)).size,move.animations.length);
    for(const entry of move.animations){
      const owner=roster.find(c=>c.id===entry.characterId),source=owner.animations.find(a=>a.id===move.id);
      assert.equal(entry.characterName,owner.name);
      assert.equal(entry.frames,source.frames);
      assert.equal(entry.image,source.image);
      assert.equal(entry.playbackFps,source.playbackFps);
      if(move.id==='light-punch')assert.equal(entry.frames.length/entry.playbackFps,0.5);
      assert.equal(source.characterId,undefined);
    }
  }
});
test('la ricerca per mossa ignora maiuscole e spazi, e gestisce risultati vuoti',()=>{
  const move=group(characters()).find(g=>g.id==='light-punch'),original=move.animations.length;
  assert.deepEqual(filter(move,'  LUANA ').animations.map(a=>a.characterId),['luana']);
  assert.equal(filter(move,'non presente').animations.length,0);
  assert.equal(filter(move,'').animations.length,original);
  assert.equal(move.animations.length,original);
  assert.deepEqual(group([]),[]);
});

test('la pagina per mossa inizializza la galleria, filtra e distrugge i player precedenti',()=>{
  const nodes=new Map(),installs=[];
  function node(){return {dataset:{},hidden:false,innerHTML:'',textContent:'',listeners:{},setAttribute(){},focus(){},querySelector(){return null;},querySelectorAll(){return [];},addEventListener(type,fn){this.listeners[type]=fn;}};}
  for(const selector of ['#sidebar','.menu-toggle','.sidebar-close','#character-search','#nav-count','.nav-empty','#breadcrumb-name','#move-name','#move-total-count','#move-visible-count','#move-empty','#move-gallery'])nodes.set(selector,node());
  const document={body:{dataset:{page:'moves'},append(){},classList:{contains(){return false;},toggle(){}}},querySelector:s=>nodes.get(s),querySelectorAll:()=>[],createElement:node,addEventListener(){}};
  const sandbox={document,window:{MOVES_CATALOG:{characters:characters()},addEventListener(){}},location:{search:'?move=light-punch'},URLSearchParams,sessionStorage:{getItem(){return null;}},MovesGroups:{group,filter},MovesGallery:{install(container,selected,options){const instance={selected,options,destroy(){this.destroyed=true;}};installs.push(instance);return instance;}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8'),sandbox);
  assert.equal(installs.length,1);
  assert.equal(installs[0].selected.id,'light-punch');
  assert.ok(nodes.get('#sidebar').innerHTML.includes('mosse.html?move=walk'));
  const search=nodes.get('#character-search').listeners.input;
  search({target:{value:'luana'}});
  assert.equal(installs[0].destroyed,true);
  assert.equal(installs[1].selected.animations.length,1);
  assert.equal(installs[1].selected.animations[0].characterId,'luana');
  search({target:{value:'nessuno'}});
  assert.equal(installs[1].destroyed,true);
  assert.equal(nodes.get('#move-empty').hidden,false);
  assert.equal(nodes.get('#move-gallery').hidden,true);
  search({target:{value:''}});
  assert.equal(nodes.get('#move-gallery').hidden,false);
  assert.equal(installs.length,3);
});
