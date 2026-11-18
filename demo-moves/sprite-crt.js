/* Preset e shader degli stage, con un solo processore condiviso per galleria. */
(function(root){
  'use strict';
  function create(document,onFallback=()=>{}){
    let input=null,output=null,processor=null,failed=false,disposed=false;
    const preset=root.STAGE_CRT_PRESETS?.['villa-arduino'];
    const base=root.StageEffects?.defaults;
    function fallback(){if(!failed){failed=true;onFallback();}}
    function decorate(stage,canvas,enabled){
      stage.classList.toggle('sprite-crt-enabled',enabled);
      if(!base)return;
      canvas.style.filter=enabled?`contrast(${1+base.crt*base.contrast*.22}) saturate(${1+base.crt*base.saturation*.18}) brightness(${1+base.crt*base.brightness*.08})`:'none';
      const overlay=stage.querySelector('.stage-crt');
      if(!overlay)return;
      const vars={'--crt-vignette-alpha':base.vignette*.68,'--crt-scanline-alpha':base.scanlines*.38,'--crt-scanline-highlight':base.scanlines*.045,'--crt-mask-rb':base.rgbMask*.12,'--crt-mask-g':base.rgbMask*.065,'--crt-glass-opacity':base.glass,'--crt-frame-alpha':base.glass*.5,'--crt-rim-alpha':base.glass*.85};
      Object.entries(vars).forEach(([key,value])=>overlay.style.setProperty(key,String(value)));
    }
    function render(canvas,time){
      if(disposed||failed)return false;
      if(!preset||!root.CrtWebGL){fallback();return false;}
      if(!input){input=document.createElement('canvas');output=document.createElement('canvas');}
      if(input.width!==canvas.width)input.width=canvas.width;
      if(input.height!==canvas.height)input.height=canvas.height;
      const source=input.getContext('2d');
      if(!source){fallback();return false;}
      source.clearRect(0,0,input.width,input.height);source.drawImage(canvas,0,0);
      if(!processor){
        processor=root.CrtWebGL.create(input,output,fallback);
        if(!processor.supported){fallback();return false;}
      }
      if(!processor.render(preset.settings,preset.enabled?preset.strength:0,time)){fallback();return false;}
      // Gli shader degli stage sono opachi: ripristina l'alpha di sprite e scie.
      // Lo sfondo selezionato resta visibile e nessun pixel del PNG viene modificato.
      const context=canvas.getContext('2d');
      context.save();context.clearRect(0,0,canvas.width,canvas.height);
      context.globalCompositeOperation='source-over';context.drawImage(output,0,0);
      context.globalCompositeOperation='destination-in';context.drawImage(input,0,0);context.restore();
      return true;
    }
    return {render,decorate,destroy(){if(disposed)return;disposed=true;processor?.destroy();if(input){input.width=1;input.height=1;}input=null;output=null;}};
  }
  root.MovesSpriteCrt=Object.freeze({create});
})(typeof globalThis!=='undefined'?globalThis:this);
