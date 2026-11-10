const test=require('node:test'),assert=require('node:assert/strict');
const {create,envelope}=require('../stage-loop-audio.js');
test('fade in e fade out prima della ripresa del loop',()=>{
 for(const [t,v] of [[0,0],[1.5,.5],[3,1],[30,1],[57,1],[58.5,.5],[60,0]])assert.equal(envelope(t,60),v);
 assert.equal(envelope(1,4),1);assert.equal(envelope(0,NaN),0);
});
function fixture(){
 const tracks=[],listeners=new Map();let callback=null;
 class Audio{
  constructor(url){this.src=url;this.currentTime=0;this.duration=60;this.events=new Map();tracks.push(this);}
  addEventListener(k,f){this.events.set(k,f);}removeEventListener(k){this.events.delete(k);}
  async play(){this.playing=true;}pause(){this.playing=false;}removeAttribute(){this.src='';}load(){}
 }
 const document={hidden:false,addEventListener(k,f){listeners.set(k,f);},removeEventListener(k){listeners.delete(k);}};
 const controller=create('../sfx/traffic.mp3',{Audio,document,setInterval(f){callback=f;return 1;},clearInterval(){callback=null;}});
 return {controller,tracks,listeners,document,tick(){callback?.();}};
}
test('MP3 locale senza autoplay, loop, volume e sospensione della scheda',async()=>{
 const f=fixture();assert.equal(f.tracks.length,0);assert.equal(await f.controller.setEnabled(true),true);
 const a=f.tracks[0];assert.equal(a.src,'../sfx/traffic.mp3');assert.equal(a.loop,true);assert.equal(a.volume,0);
 a.currentTime=1.5;f.tick();assert.equal(a.volume,.25);
 a.currentTime=30;f.tick();assert.equal(a.volume,.5);
 a.currentTime=58.5;f.tick();assert.equal(a.volume,.25);
 a.currentTime=0;f.tick();assert.equal(a.volume,0);
 f.document.hidden=true;f.listeners.get('visibilitychange')();assert.equal(a.playing,false);
 f.document.hidden=false;f.listeners.get('visibilitychange')();await Promise.resolve();assert.equal(a.playing,true);
 await f.controller.setEnabled(false);assert.equal(a.playing,false);assert.equal(a.currentTime,0);
 f.controller.destroy();assert.equal(a.src,'');assert.equal(f.listeners.size,0);assert.equal(a.events.size,0);
});
test('server serve solo il file audio autorizzato, con MIME MP3',async()=>{
 const {createDemoServer}=await import('./serve.mjs');const server=createDemoServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const base='http://127.0.0.1:'+server.address().port;
 const ok=await fetch(base+'/sfx/traffic.mp3',{method:'HEAD'});assert.equal(ok.status,200);assert.equal(ok.headers.get('content-type'),'audio/mpeg');
 assert.equal((await fetch(base+'/sfx/altro.mp3')).status,403);
 assert.equal((await fetch(base+'/original-backgrounds/piazza-castello/stage-castello.png',{method:'HEAD'})).status,200);
 }finally{await new Promise(r=>server.close(r));}
});
