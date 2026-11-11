const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const demo = path.resolve(__dirname, '..');

test('il roster natalizio include tutti i PNG attivi e le esclusioni concordate', () => {
  const sandbox = {window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(demo,'roster-natale-catalog.js'),'utf8'), sandbox);
  const characters = sandbox.window.CHRISTMAS_ROSTER.characters;
  assert.equal(characters.length,42);
  assert.equal(new Set(characters.map(c => c.id)).size,42);
  assert.ok(!characters.some(c => c.name === 'Tony'));
  assert.ok(characters.some(c => c.name === 'Oscar'));
  assert.equal(characters.filter(c => c.theme === 'pan-di-zenzero').length,6);
  assert.deepEqual(Array.from(characters.filter(c => c.theme === 'babbo-natale'), c => c.id).sort(), ['alberto','alessandro-mandelli','fabio-clara','sboz']);
  for (const theme of ['elfo','maglione','renna','albero','pupazzo-di-neve','pan-di-zenzero']) {
    assert.equal(characters.filter(c => c.theme === theme).length,['maglione','elfo'].includes(theme) ? 7 : 6,theme);
  }
  for (const c of characters) {
    assert.ok(!['zichella','mike','mario','tony-ok'].includes(c.id));
    assert.ok(fs.existsSync(path.resolve(demo,decodeURIComponent(c.image))),c.name);
    assert.ok(!c.image.includes('archivio') && !c.image.includes('prove-scartate'));
  }
  const index = fs.readFileSync(path.join(demo,'index.html'),'utf8');
  assert.match(index, /<h1>Il roster[\s\S]*?<a class="christmas-button" href="roster-natale.html">/);
});

test('la pagina natalizia usa immagini statiche e esclude Tony e filtra i personaggi disponibili', () => {
  const nodes = new Map();
  function node() { return {dataset:{},hidden:false,innerHTML:'',textContent:'',listeners:{},setAttribute(){},focus(){},querySelectorAll(){return [];},addEventListener(type,fn){this.listeners[type]=fn;}}; }
  for (const selector of ['#sidebar','.menu-toggle','.sidebar-close','#character-search','#nav-count','.nav-empty','#total-count','#visible-count','#character-grid','#empty-state']) nodes.set(selector,node());
  const cards = [];
  const document = {body:{dataset:{page:'roster-natale'},append(){},classList:{contains(){return false;},toggle(){}}},querySelector:s=>nodes.get(s),querySelectorAll:s=>s==='[data-christmas-character]'?cards:[],createElement:node,addEventListener(){}};
  const sandbox = {document,window:{},location:{search:''},URLSearchParams,sessionStorage:{getItem(){return null;}},MovesGroups:require('../move-groups.js')};
  vm.runInNewContext(fs.readFileSync(path.join(demo,'roster-nav.js'),'utf8'), sandbox);
  vm.runInNewContext(fs.readFileSync(path.join(demo,'roster-natale-catalog.js'),'utf8'), sandbox);
  for (const c of sandbox.window.CHRISTMAS_ROSTER.characters) cards.push({...node(),dataset:{christmasCharacter:c.id}});
  vm.runInNewContext(fs.readFileSync(path.join(demo,'app.js'),'utf8'), sandbox);
  assert.equal(nodes.get('#total-count').textContent,42);
  assert.equal((nodes.get('#character-grid').innerHTML.match(/data-christmas-character=/g)||[]).length,42);
  assert.match(nodes.get('#sidebar').innerHTML,/href="roster-natale.html" aria-current="page"/);
  const search = nodes.get('#character-search').listeners.input;
  search({target:{value:'  TONY  '}});
  assert.equal(nodes.get('#visible-count').textContent,0);
  assert.equal(cards.filter(c=>!c.hidden).length,0);
  search({target:{value:'  OSCAR  '}});
  assert.equal(nodes.get('#visible-count').textContent,1);
  assert.equal(cards.filter(c=>!c.hidden)[0].dataset.christmasCharacter,'oscare');
  search({target:{value:'nessuno'}});
  assert.equal(nodes.get('#empty-state').hidden,false);
  search({target:{value:''}});
  assert.equal(cards.filter(c=>!c.hidden).length,42);
  assert.equal(nodes.get('#empty-state').hidden,true);
});
