const test=require('node:test'),assert=require('node:assert/strict');
const storm=require('../stage-wind-storm.js'),weather=require('../stage-weather.js');

test('lampi irregolari e tuoni condividono gli eventi, con ritardo e senza ripetizioni al bordo',()=>{
  const gaps=[];
  for(let i=0;i<30;i++){
    const at=storm.strikeAt(i),next=storm.strikeAt(i+1);gaps.push(Math.round(next-at));
    assert.ok(next-at>=6000&&next-at<=18000);
    assert.ok(storm.lightningState(at+70).flash>.4);
    assert.equal(storm.lightningState(at+1000).flash,0);
    let heard=at;while(storm.thunderState(heard).id<i)heard+=1;
    assert.ok(heard-at>=500&&heard-at<=1601);
    assert.equal(storm.thunderState(next-1).id,i);
  }
  assert.ok(new Set(gaps).size>20);
});

test('foglie pixel art: vento verso sinistra, piani distinti e coordinate riproducibili',()=>{
  for(const t of [0,1000,5000,30000]){
    const a=storm.leaves(2550,1080,t),b=storm.leaves(2550,1080,t+100);
    assert.deepEqual(a,storm.leaves(2550,1080,t));assert.equal(a.length,72);
    assert.ok(a.some(l=>l.front)&&a.some(l=>!l.front));
    a.forEach((leaf,i)=>{
      assert.ok(leaf.y>=0&&leaf.y<1080&&leaf.x>=-120&&leaf.x<2670);
      assert.ok([1,2,3].includes(leaf.size)&&leaf.alpha>0&&leaf.alpha<=1);
      if(b[i].x-leaf.x<1000)assert.ok(b[i].x<=leaf.x,'moto verso sinistra fra due wrap');
    });
  }
});

test('il livello del vento modula densita e velocita senza salti del tempo al cambio di intensita',()=>{
  const low=storm.leaves(2550,1080,3000,.1),high=storm.leaves(2550,1080,3000,.9);
  assert.ok(high.length>low.length*3);assert.equal(storm.leaves(2550,1080,0,0).length,12);
  let level=.1;const times=[];
  const w=weather.create({width:2550,height:1080,storm:'approaching',wind:true,windTrack:'wind.mp3',lightning:true},
    {StageWindStorm:{...storm,renderLeaves(ctx,stage,t,camera,front,strength){times.push([t,camera,strength]);}},StageStormAudio:{create(){return {update(){},getWindLevel:()=>level,destroy(){}};}}});
  const view={elapsed:0,camera:315,viewportWidth:1920,raining:false};w.updateAudio(view);
  w.updateAudio({...view,elapsed:100});w.background({},view);
  assert.ok(Math.abs(times.at(-1)[0]-68)<1e-8);
  level=.9;w.updateAudio({...view,elapsed:200});w.background({},view);
  assert.ok(Math.abs(times.at(-1)[0]-280)<1e-8);
  w.updateAudio({...view,elapsed:200});w.background({},{...view,camera:630});
  assert.equal(times.at(-1)[1],630);assert.ok(Math.abs(times.at(-1)[0]-280)<1e-8);
  w.destroy();
});

test('il flash copre tutto il quadro; foglie e lampi rispettano movimento ridotto, originale e pausa',()=>{
  const calls=[],context={save(){},restore(){},fillRect(...v){calls.push(v);}};
  storm.renderFlash(context,1920,1080,storm.strikeAt(0)+70);
  assert.deepEqual(calls.at(-1),[0,0,1920,1080]);assert.equal(context.globalCompositeOperation,'screen');
  const paints=[],w=weather.create({width:2550,height:1080,storm:'approaching',wind:true,lightning:true},{StageWindStorm:{...storm,renderLeaves(...args){paints.push(['leaves',args[3],args[4]]);},renderFlash(){paints.push(['flash']);}}});
  const view={elapsed:5000,camera:315,viewportWidth:1920,reduced:false,raining:false};
  const flashView={...view,elapsed:storm.strikeAt(0)+70};
  assert.deepEqual(w.crtSettings(flashView),{bloomIntensity:5,bloomThreshold:0,weight:storm.bloomWeight(flashView.elapsed)});
  assert.equal(w.crtSettings({...flashView,elapsed:storm.strikeAt(0)+1400}),null);
  for(const mode of [{paused:true},{reduced:true},{suppressed:true}])assert.equal(w.crtSettings({...flashView,...mode}),null);
  w.background(context,view);w.foreground(context,view);
  assert.deepEqual(paints,[['leaves',315,false],['leaves',315,true],['flash']]);
  paints.length=0;w.foreground(context,{...view,paused:true});assert.deepEqual(paints,[['leaves',315,true]]);
  for(const setting of [{reduced:true},{suppressed:true}]){paints.length=0;w.background(context,{...view,...setting});w.foreground(context,{...view,...setting});assert.equal(paints.length,0);}
  paints.length=0;w.setEffect('leaves',false);w.background(context,view);w.foreground(context,view);assert.deepEqual(paints,[['flash']]);
  w.destroy();
});

test('bloom con fade: salita morbida, picco breve e ritorno continuo a zero',()=>{
  const at=storm.strikeAt(0),value=t=>storm.bloomWeight(at+t);
  assert.equal(value(0),0);assert.equal(value(180),1);assert.equal(value(280),1);assert.equal(value(1400),0);
  assert.ok(value(50)>0&&value(50)<value(100)&&value(100)<value(180));
  assert.ok(value(400)>value(800)&&value(800)>value(1200)&&value(1200)>0);
  assert.ok(value(1)<.001&&value(1399)<.001);
});
