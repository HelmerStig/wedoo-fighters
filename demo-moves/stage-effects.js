(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.StageEffects=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Intensità normalizzate: gli asset originali rimangono invariati.
  const defaults=Object.freeze({shadows:0.55,color:0.35,crt:1,fog:0.4,dust:1});
  function amount(value){const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;}
  function markup(id){
    const prefix=String(id).replace(/[^a-z0-9-]/gi,'-');
    return `<div class="stage-effects"><div class="stage-effects-heading"><h3>Effetti di anteprima</h3><div class="stage-effects-actions"><button class="step-button" type="button" data-fx-original aria-pressed="false">Vista originale</button><button class="step-button" type="button" data-fx-reset>Ripristina</button></div></div><div class="stage-effects-grid">${[['shadows','Ombre a terra'],['color','Toni caldi sui personaggi'],['crt','CRT leggero'],['fog','Foschia lontana'],['dust','Polvere in pixel art']].map(([key,label])=>`<div class="stage-effect"><label class="stage-effect-toggle" for="${prefix}-${key}-on"><input id="${prefix}-${key}-on" data-fx-toggle="${key}" type="checkbox" checked>${label}</label><div class="stage-effect-range"><label class="screen-reader-only" for="${prefix}-${key}-amount">Intensità: ${label}</label><input id="${prefix}-${key}-amount" data-fx-amount="${key}" type="range" min="0" max="100" step="1" value="${defaults[key]*100}"><output for="${prefix}-${key}-amount" data-fx-output="${key}">${defaults[key]*100}%</output></div></div>`).join('')}</div><p class="stage-effects-status" data-fx-status aria-live="polite">Anteprima con effetti.</p></div>`;
  }
  function install(card,player){
    const original=card.querySelector('[data-fx-original]'),reset=card.querySelector('[data-fx-reset]');
    const overlay=card.querySelector('.stage-crt');
    const status=card.querySelector('[data-fx-status]');
    const controls=Object.keys(defaults).map(key=>({key,toggle:card.querySelector(`[data-fx-toggle="${key}"]`),range:card.querySelector(`[data-fx-amount="${key}"]`),output:card.querySelector(`[data-fx-output="${key}"]`)}));
    let showOriginal=false;
    const cleanups=[];
    function listen(node,event,handler){node.addEventListener(event,handler);cleanups.push(()=>node.removeEventListener(event,handler));}
    function apply(){
      const values={};
      controls.forEach(({key,toggle,range,output})=>{
        const value=amount(Number(range.value)/100);
        output.textContent=Math.round(value*100)+'%';range.disabled=!toggle.checked;
        values[key]=!showOriginal&&toggle.checked?value:0;
      });
      player.setEffects(values);
      overlay.style.opacity=String(values.crt);
      original.setAttribute('aria-pressed',String(showOriginal));
      status.textContent=showOriginal?'Vista originale: effetti sospesi.':'Anteprima con effetti.';
    }
    controls.forEach(({toggle,range})=>{listen(toggle,'change',apply);listen(range,'input',apply);});
    listen(original,'click',()=>{showOriginal=!showOriginal;apply();});
    listen(reset,'click',()=>{showOriginal=false;controls.forEach(({key,toggle,range})=>{toggle.checked=true;range.value=defaults[key]*100;});apply();});
    apply();
    return {destroy(){cleanups.forEach(cleanup=>cleanup());}};
  }
  return Object.freeze({defaults,amount,markup,install});
});
