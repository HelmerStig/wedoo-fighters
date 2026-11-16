const test=require('node:test'),assert=require('node:assert/strict');
const {create}=require('../stage-storm-audio.js');
function fixture(options={}){
  const sources=[],gains=[],requests=[];let closed=false,sampleLevel=.02;
  function node(){return {connect(){},disconnect(){}};}
  class AudioContext{
    constructor(){this.currentTime=1;this.sampleRate=8000;this.state='running';this.destination=node();}
    createBuffer(_,size){return {getChannelData:()=>new Float32Array(size)};}
    createGain(){const n=node();n.gain={value:0,setTargetAtTime(v){this.value=v;},setValueAtTime(){},linearRampToValueAtTime(v){this.peak=v;},exponentialRampToValueAtTime(){}};gains.push(n);return n;}
    createBiquadFilter(){return {...node(),frequency:{value:0}};}
    createAnalyser(){return {...node(),getFloatTimeDomainData(samples){samples.fill(sampleLevel);}};}
    async decodeAudioData(){return {duration:8};}
    createBufferSource(){const s={...node(),start(t=0){this.started=t;},stop(t=0){this.stopped=t;}};sources.push(s);return s;}
    async resume(){}
    async close(){closed=true;}
  }
  const fetch=async url=>{requests.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};};
  return {audio:create({AudioContext,fetch},options),sources,gains,requests,setSample(value){sampleLevel=value;},get closed(){return closed;}};
}
test('storm audio starts only on enable, syncs once per strike and mutes with visibility',async()=>{
  const f=fixture();assert.equal(f.sources.length,0);
  assert.equal(await f.audio.setEnabled(true),true);assert.equal(f.sources.length,1);
  const update=(elapsed,extra={})=>f.audio.update({rain:true,lightning:true,hidden:false,elapsed,...extra});
  update(3700);assert.ok(f.gains[1].gain.value>0);
  update(3850);assert.equal(f.sources.length,4);
  assert.deepEqual(f.gains.slice(2).map(g=>g.gain.peak),[.85,3.8,2.6],'solo i due rombi sono amplificati rispetto al riferimento');
  assert.ok(f.sources[2].started>f.sources[1].started,'rumble follows crack');
  update(3900);assert.equal(f.sources.length,4,'no repeated strike');
  update(4000,{rain:false});assert.equal(f.gains[1].gain.value,0);
  update(4100,{hidden:true});assert.equal(f.gains[0].gain.value,0);
  assert.ok(f.sources.slice(1).every(s=>s.stopped===0),'hidden page cancels queued thunder');
  await f.audio.setEnabled(false);update(13550);assert.equal(f.sources.length,4);
  f.audio.destroy();assert.equal(f.closed,true);
});
test('unsupported audio fails without breaking the stage',async()=>{
  const audio=create({});assert.equal(await audio.setEnabled(true),false);audio.destroy();
});

test('Via Somis: tuoni ritardati senza pioggia, stessi volumi di Porta Susa, pausa senza recupero eventi',async()=>{
  const storm=require('../stage-wind-storm.js'),f=fixture({timeline:storm.thunderState});
  await f.audio.setEnabled(true);
  const update=(elapsed,extra={})=>f.audio.update({rain:false,lightning:true,hidden:false,elapsed,...extra});
  const flash=storm.strikeAt(0);let thunder=flash;
  while(storm.thunderState(thunder).id<0)thunder++;
  update(0);update(flash+100);assert.equal(f.sources.length,1);
  update(thunder-1);assert.equal(f.sources.length,1);
  update(thunder);assert.equal(f.sources.length,4);
  assert.deepEqual(f.gains.slice(2).map(g=>g.gain.peak),[.85,3.8,2.6]);
  assert.equal(f.gains[0].gain.value,.38);assert.equal(f.gains[1].gain.value,0);
  update(thunder+10);assert.equal(f.sources.length,4);
  update(thunder+20,{lightning:false});assert.equal(f.gains[0].gain.value,0);
  assert.ok(f.sources.slice(1).every(s=>s.stopped===0));
  update(storm.strikeAt(1)+2500);assert.equal(f.sources.length,4,'nessun tuono arretrato dopo la pausa');
  f.audio.destroy();
});

test('vento MP3 in loop e FX tuono sul lampo: analisi del solo vento, caricamento unico e pulizia',async()=>{
  const storm=require('../stage-wind-storm.js'),f=fixture({timeline:storm.lightningState,windTrack:'../sfx/wind.mp3',thunderTrack:'../sfx/tuono.mp3'});
  assert.equal(f.requests.length,0);await f.audio.setEnabled(true);
  assert.deepEqual(f.requests,['../sfx/wind.mp3','../sfx/tuono.mp3']);
  const wind=f.sources[1];assert.equal(wind.loop,true);
  const update=elapsed=>f.audio.update({rain:false,lightning:true,hidden:false,elapsed});
  update(0);const quiet=f.audio.getWindLevel();assert.ok(quiet>.1&&quiet<.2);
  f.setSample(.12);for(let i=1;i<=30;i++)update(i*10);
  assert.ok(f.audio.getWindLevel()>.9,'il livello segue la potenza RMS del sottofondo');
  update(storm.strikeAt(0)-1);assert.equal(f.sources.length,2);
  update(storm.strikeAt(0)+70);assert.equal(f.sources.length,3,'un solo FX sul lampo');
  assert.equal(f.gains.at(-1).gain.value,1.5);
  update(storm.strikeAt(0)+80);assert.equal(f.sources.length,3);
  await f.audio.setEnabled(false);assert.equal(f.audio.getWindLevel(),null);
  await f.audio.setEnabled(true);assert.equal(f.requests.length,2,'i buffer vengono riutilizzati');
  f.audio.destroy();assert.equal(wind.stopped,0);assert.ok(f.closed);
});
