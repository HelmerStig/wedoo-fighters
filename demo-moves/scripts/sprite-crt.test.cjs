const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const demo=path.resolve(__dirname,'..');
function fixture({supported=true,render=true}={}){
  const calls=[],created=[];let builds=0,destroys=0,fallbacks=0;
  const context={window:{},StageEffects:require('../stage-effects.js'),CrtWebGL:{create(input,output){builds++;return {supported,render(settings,strength,time){calls.push({settings,strength,time});return render;},destroy(){destroys++;}};}}};
  vm.runInNewContext(fs.readFileSync(path.join(demo,'crt-presets.js'),'utf8'),context);
  context.STAGE_CRT_PRESETS=context.window.STAGE_CRT_PRESETS;
  vm.runInNewContext(fs.readFileSync(path.join(demo,'sprite-crt.js'),'utf8'),context);
  const document={createElement(){const canvas={width:0,height:0};canvas.getContext=()=>({clearRect(){},drawImage(){}});created.push(canvas);return canvas;}};
  const processor=context.MovesSpriteCrt.create(document,()=>fallbacks++);
  const composites=[];
  const ctx={save(){},restore(){},clearRect(){},drawImage(){composites.push(this.globalCompositeOperation);}};
  const canvas={width:512,height:512,style:{},getContext:()=>ctx};
  return {processor,canvas,created,calls,composites,get builds(){return builds;},get destroys(){return destroys;},get fallbacks(){return fallbacks;}};
}
test('preset degli stage, singolo WebGL condiviso e alpha ripristinato dopo il filtro',()=>{
  const f=fixture();assert.equal(f.builds,0);
  assert.equal(f.processor.render(f.canvas,100),true);
  assert.equal(f.processor.render({...f.canvas},400),true);
  assert.equal(f.builds,1);assert.equal(f.created.length,2);
  assert.equal(f.calls[0].settings.bloomIntensity,.86);assert.equal(f.calls[0].settings.dotPitch,6.5);
  assert.equal(f.calls[0].strength,1);assert.equal(f.calls[1].time,400);
  assert.deepEqual(f.composites,['source-over','destination-in','source-over','destination-in']);
  f.processor.destroy();f.processor.destroy();assert.equal(f.destroys,1);
  assert.equal(f.processor.render(f.canvas,500),false);
});
test('WebGL indisponibile o in errore mantiene il CRT base e non ricrea contesti',()=>{
  for(const options of [{supported:false},{render:false}]){
    const f=fixture(options);assert.equal(f.processor.render(f.canvas,0),false);
    assert.equal(f.processor.render(f.canvas,100),false);
    assert.equal(f.fallbacks,1);assert.equal(f.builds,1);assert.equal(f.composites.length,0);
    const vars={};let enabled;
    const stage={classList:{toggle(key,value){enabled=value;}},querySelector(){return {style:{setProperty(k,v){vars[k]=v;}}};}};
    f.processor.decorate(stage,f.canvas,true);assert.equal(enabled,true);
    assert.match(f.canvas.style.filter,/contrast\(1.11\)/);assert.equal(vars['--crt-vignette-alpha'],String(.8*.68));
    f.processor.decorate(stage,f.canvas,false);assert.equal(enabled,false);assert.equal(f.canvas.style.filter,'none');
    f.processor.destroy();
  }
});
test('pagine personaggio e per mossa caricano preset e processore prima della galleria',()=>{
  for(const file of ['personaggio.html','mosse.html']){
    const html=fs.readFileSync(path.join(demo,file),'utf8');
    for(const dep of ['crt-presets.js','crt-webgl.js','stage-effects.js','sprite-crt.js']){
      assert.ok(html.indexOf(dep)>=0);assert.ok(html.indexOf(dep)<html.indexOf('animation-gallery.js'));
    }
  }
});
