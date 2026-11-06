const test=require('node:test');
const assert=require('node:assert/strict');
const {defaults,amount,markup,install}=require('../stage-effects.js');

function fixture(){
  const nodes=new Map(),calls=[];
  function node(){return {style:{},checked:true,disabled:false,textContent:'',value:'',attributes:{},listeners:{},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,f){this.listeners[k]=f;},removeEventListener(k){delete this.listeners[k];}};}
  for(const key of ['[data-fx-original]','[data-fx-reset]','.stage-crt','[data-fx-status]'])nodes.set(key,node());
  for(const key of Object.keys(defaults)){
    for(const type of ['toggle','amount','output'])nodes.set(`[data-fx-${type}="${key}"]`,node());
    nodes.get(`[data-fx-amount="${key}"]`).value=String(defaults[key]*100);
  }
  const controls=install({querySelector:s=>nodes.get(s)},{setEffects:value=>calls.push(value)});
  return {nodes,calls,controls};
}

test('i tre effetti hanno intensità indipendenti, confronto originale e ripristino',()=>{
  const f=fixture();assert.deepEqual(f.calls.at(-1),defaults);
  const strength=f.nodes.get('[data-fx-amount="color"]');strength.value='80';strength.listeners.input();
  assert.equal(f.calls.at(-1).color,.8);assert.equal(f.calls.at(-1).shadows,defaults.shadows);
  const shadow=f.nodes.get('[data-fx-toggle="shadows"]');shadow.checked=false;shadow.listeners.change();
  assert.equal(f.calls.at(-1).shadows,0);assert.equal(f.nodes.get('[data-fx-amount="shadows"]').disabled,true);
  const original=f.nodes.get('[data-fx-original]');original.listeners.click();
  assert.deepEqual(f.calls.at(-1),{shadows:0,color:0,crt:0});assert.equal(f.nodes.get('.stage-crt').style.opacity,'0');
  original.listeners.click();assert.equal(f.calls.at(-1).color,.8);assert.equal(f.calls.at(-1).shadows,0);
  f.nodes.get('[data-fx-reset]').listeners.click();assert.deepEqual(f.calls.at(-1),defaults);
  assert.equal(original.attributes['aria-pressed'],'false');
  f.controls.destroy();assert.equal(Object.keys(original.listeners).length,0);
});

test('valori limitati e controlli con etichette associate per ogni stage',()=>{
  assert.equal(amount(-1),0);assert.equal(amount(2),1);assert.equal(amount('invalid'),0);
  const html=markup('villa-arduino');
  assert.match(html,/for="villa-arduino-color-amount"/);
  assert.match(html,/id="villa-arduino-crt-on"/);
  assert.equal((html.match(/type="range"/g)||[]).length,3);
  assert.match(html,/aria-live="polite"/);
});
