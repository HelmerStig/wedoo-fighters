(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.StageStormAudio=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function create(env=globalThis,options={}){
    let context=null,master=null,rain=null,rainGain=null,enabled=false,disposed=false,lastTime=null;
    let wind=null,windGain=null,analyser=null,samples=null,windLevel=null,windAudible=false;
    let windLoad=null,thunderBuffer=null,revision=0;
    const voices=new Set();
    function noise(seconds){
      const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*seconds),context.sampleRate);
      const samples=buffer.getChannelData(0);let seed=51791;
      for(let i=0;i<samples.length;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;samples[i]=(seed>>>0)/2147483648-1;}
      return buffer;
    }
    function stopVoices(){for(const voice of voices){try{voice.stop();}catch{}}voices.clear();}
    const abort=env.AbortController?new env.AbortController():null;
    async function loadTracks(){
      if(windLoad)return windLoad;
      windLoad=(async()=>{
        const decode=async url=>{
          const response=await env.fetch(url,{signal:abort?.signal});
          if(!response.ok)throw Error('Audio non disponibile');
          return context.decodeAudioData(await response.arrayBuffer());
        };
        const [windBuffer,thunder]=await Promise.all([
          options.windTrack?decode(options.windTrack):null,
          options.thunderTrack?decode(options.thunderTrack):null
        ]);
        if(disposed)return;
        thunderBuffer=thunder;
        if(windBuffer){
          windGain=context.createGain();windGain.gain.value=0;windGain.connect(master);
          analyser=context.createAnalyser();analyser.fftSize=1024;samples=new Float32Array(analyser.fftSize);
          wind=context.createBufferSource();wind.buffer=windBuffer;wind.loop=true;
          wind.connect(analyser);analyser.connect(windGain);wind.start();
        }
      })().catch(error=>{windLoad=null;throw error;});
      return windLoad;
    }
    function setup(){
      const Audio=env.AudioContext??env.webkitAudioContext;
      if(!Audio)return false;
      context=new Audio();master=context.createGain();master.gain.value=0;master.connect(context.destination);
      rainGain=context.createGain();rainGain.gain.value=0;rainGain.connect(master);
      const high=context.createBiquadFilter();high.type='highpass';high.frequency.value=650;
      const low=context.createBiquadFilter();low.type='lowpass';low.frequency.value=7500;
      rain=context.createBufferSource();rain.buffer=noise(4);rain.loop=true;
      rain.connect(high);high.connect(low);low.connect(rainGain);rain.start();
      return true;
    }
    function burst(buffer,frequency,volume,delay,duration){
      const source=context.createBufferSource();source.buffer=buffer;
      const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=frequency;
      const gain=context.createGain(),start=context.currentTime+delay;
      gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.025);
      gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
      source.connect(filter);filter.connect(gain);gain.connect(master);voices.add(source);
      source.onended=()=>{voices.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};
      source.start(start);source.stop(start+duration);
    }
    let thunderNoise=null,crackNoise=null;
    function strike(cycle){
      if(thunderBuffer){
        const source=context.createBufferSource(),gain=context.createGain();
        source.buffer=thunderBuffer;gain.gain.value=1.5;source.connect(gain);gain.connect(master);
        voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();gain.disconnect();};
        source.start();return;
      }
      thunderNoise??=noise(4);crackNoise??=noise(.2);
      burst(crackNoise,4800,.85,0,.18);
      // Rombi +6 dB rispetto al riferimento; pioggia e schiocco restano invariati.
      burst(thunderNoise,220,3.80,.35+(cycle%3)*.12,3.5);
      burst(thunderNoise,90,2.60,.70+(cycle%2)*.10,3.1);
    }
    async function setEnabled(value){
      const token=++revision;
      if(disposed)return false;
      if(!value){enabled=false;lastTime=null;windLevel=null;windAudible=false;stopVoices();if(master)master.gain.setTargetAtTime(0,context.currentTime,.04);return false;}
      try{
        if(!context&&!setup())return false;
        await context.resume();
        if(options.windTrack||options.thunderTrack)await loadTracks();
        if(disposed||token!==revision)return false;
        enabled=context.state==='running';lastTime=null;
        return enabled;
      }catch{enabled=false;return false;}
    }
    function update({rain:wet,elapsed,lightning,hidden}){
      if(!context||disposed)return;
      const audible=enabled&&!hidden&&(!options.timeline||lightning);
      master.gain.setTargetAtTime(audible?.38:0,context.currentTime,.06);
      rainGain.gain.setTargetAtTime(audible&&wet?.32:0,context.currentTime,.12);
      windAudible=Boolean(audible&&analyser);
      if(windGain)windGain.gain.setTargetAtTime(audible?.85:0,context.currentTime,.10);
      if(windAudible){
        analyser.getFloatTimeDomainData(samples);
        const rms=Math.sqrt(samples.reduce((sum,v)=>sum+v*v,0)/samples.length);
        const target=Math.min(1,rms*8),previous=windLevel??target;
        windLevel=previous+(target-previous)*(target>previous?.18:.06);
      }else windLevel=null;
      if(!audible){stopVoices();lastTime=null;return;}
      if(lightning&&lastTime!==null&&elapsed>=lastTime){
        const event=options.timeline?options.timeline(elapsed):{id:Math.floor(elapsed/9700),at:Math.floor(elapsed/9700)*9700+3800};
        if(event.id>=0&&lastTime<event.at&&elapsed>=event.at)strike(event.id);
      }
      lastTime=elapsed;
    }
    return {setEnabled,update,getWindLevel(){return windAudible?windLevel:null;},destroy(){
      disposed=true;enabled=false;revision++;abort?.abort();stopVoices();
      if(wind){try{wind.stop();}catch{}wind.disconnect();}
      if(rain){try{rain.stop();}catch{}}
      if(context)context.close().catch(()=>{});
    }};
  }
  return Object.freeze({create});
});
