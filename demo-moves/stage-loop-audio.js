(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();else root.StageLoopAudio=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function envelope(time,duration,fadeSeconds=3){
    if(!Number.isFinite(duration)||duration<=0||!Number.isFinite(time))return 0;
    const fade=Math.min(fadeSeconds,duration/4);
    return Math.max(0,Math.min(1,time/fade,(duration-time)/fade));
  }
  function create(url,env=globalThis){
    let audio=null,timer=null,enabled=false,disposed=false,volume=.5,revision=0;
    function update(){if(audio)audio.volume=volume*envelope(audio.currentTime,audio.duration);}
    function stopClock(){if(timer!==null){env.clearInterval(timer);timer=null;}}
    async function play(){
      const token=++revision;
      if(!enabled||disposed||env.document?.hidden)return false;
      try{
        update();await audio.play();
        if(token!==revision){if(!enabled||disposed||env.document?.hidden)audio.pause();return false;}
        if(disposed||!enabled||env.document?.hidden){audio.pause();return false;}
        stopClock();timer=env.setInterval(update,50);return true;
      }catch{if(token===revision)enabled=false;return false;}
    }
    function visibility(){
      if(env.document.hidden){revision++;stopClock();audio?.pause();}
      else if(enabled)play();
    }
    env.document?.addEventListener('visibilitychange',visibility);
    return {
      async setEnabled(value){
        if(disposed)return false;
        enabled=Boolean(value);
        if(!enabled){revision++;stopClock();if(audio){audio.pause();audio.currentTime=0;audio.volume=0;}return false;}
        if(!audio){
          if(!env.Audio){enabled=false;return false;}
          audio=new env.Audio(url);audio.loop=true;audio.preload='metadata';audio.volume=0;
          for(const event of ['timeupdate','loadedmetadata','seeking'])audio.addEventListener(event,update);
        }
        return play();
      },
      setVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));update();},
      destroy(){disposed=true;enabled=false;revision++;stopClock();env.document?.removeEventListener('visibilitychange',visibility);if(audio){audio.pause();for(const event of ['timeupdate','loadedmetadata','seeking'])audio.removeEventListener(event,update);audio.removeAttribute('src');audio.load();}}
    };
  }
  return Object.freeze({create,envelope});
});
