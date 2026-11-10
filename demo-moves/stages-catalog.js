(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.STAGES_CATALOG=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const base='../original-backgrounds/villa-arduino/';
  return [{id:'villa-arduino',name:'Villa Arduino',width:2550,height:1080,viewportWidth:1920,
    // Luce alta da sinistra: proiezione verso destra e verso il basso sul pavimento.
    shadow:{color:'#1d1625',shearX:0.5,flattenY:0.11,opacity:0.72,contactOpacity:0.28},
    layers:[
    {id:'sky',image:base+'cielo.png',zIndex:0,width:2550,height:1080},
    {id:'clouds-far',image:base+'01-nuvole-lontane.png',zIndex:2,width:5000,height:1080,speed:6,haze:1},
    {id:'clouds-mid',image:base+'02-nuvole-intermedie.png',zIndex:3,width:5000,height:1080,speed:12,haze:0.35},
    {id:'clouds-near',image:base+'03-nuvole-vicine.png',zIndex:4,width:5000,height:1080,speed:20},
    // A parità di z-index, la villa viene disegnata per ultima, davanti alle nuvole.
    {id:'foreground',image:base+'villa-arduino.png',zIndex:4,width:2550,height:1080}
  ],fighters:[
    {characterId:'alberto',animationId:'idle',x:675,groundY:1025,scale:4/3,anchorX:253,anchorY:430,flipX:false},
    {characterId:'marsan',animationId:'idle',x:1890,groundY:1025,scale:4/3,anchorX:256,anchorY:433,flipX:true}
  ]},{id:'porta-susa',name:'Porta Susa',width:2550,height:1080,viewportWidth:1920,
    shadow:{color:'#140e26',shearX:.5,flattenY:.11,opacity:.72,contactOpacity:.28},
    layers:[
      {id:'sky',image:'../original-backgrounds/porta-susa/cielo.png',zIndex:0,width:2550,height:1080},
      {id:'foreground',image:'../original-backgrounds/porta-susa/porta-susa.png',zIndex:1,width:2550,height:1080}
    ],fighters:[
      {characterId:'pippo',animationId:'idle',x:675,groundY:1025,scale:4/3,anchorX:253,anchorY:432,flipX:false},
      {characterId:'peppo',animationId:'idle',x:1890,groundY:1025,scale:4/3,anchorX:251.5,anchorY:435,flipX:true}
    ],rain:true,webglClouds:true,lightning:true,shootingStars:true,rainGroundTop:.87},{id:'piazza-castello',name:'Piazza Castello',trafficTrack:'../sfx/traffic.mp3',ambient:'castello',ambientTexture:{id:'ambient-flags',image:'../original-backgrounds/piazza-castello/bandiere-animate.png',width:1920,height:112},width:2550,height:1080,viewportWidth:1920,
    shadow:{color:'#1d1625',shearX:.5,flattenY:.11,opacity:.72,contactOpacity:.28},
    layers:[
      {id:'sky',image:'../original-backgrounds/piazza-castello/cielo.png',zIndex:0,width:2550,height:1080},
      {id:'clouds-far',image:'../original-backgrounds/piazza-castello/01-nuvole-lontane.png',zIndex:2,width:5000,height:1080,speed:6,haze:1},
      {id:'clouds-mid',image:'../original-backgrounds/piazza-castello/02-nuvole-intermedie.png',zIndex:3,width:5000,height:1080,speed:12,haze:.35},
      {id:'clouds-near',image:'../original-backgrounds/piazza-castello/03-nuvole-vicine.png',zIndex:4,width:5000,height:1080,speed:20},
      {id:'foreground',image:'../original-backgrounds/piazza-castello/stage-castello.png',zIndex:4,width:2550,height:1080}
    ],fighters:[
      {characterId:'condello',animationId:'idle',x:675,groundY:1025,scale:4/3,anchorX:257.5,anchorY:433,flipX:false},
      {characterId:'elisa',animationId:'idle',x:1890,groundY:1025,scale:4/3,anchorX:254.5,anchorY:432,flipX:true}
    ]},{id:'porta-palazzo',name:'Porta Palazzo',lightFlicker:false,ambient:'palazzo',ambientTexture:{id:'reflection-mask',image:'../original-backgrounds/porta-palazzo/riflessi.png',width:2550,height:195},width:2550,height:1080,viewportWidth:1920,
    shadow:{color:'#140e26',shearX:.5,flattenY:.11,opacity:.72,contactOpacity:.28},
    layers:[
      {id:'sky',image:'../original-backgrounds/porta-palazzo/cielo.png',zIndex:0,width:2550,height:1080},
      {id:'foreground',image:'../original-backgrounds/porta-palazzo/porta-palazzo-stage.png',zIndex:1,width:2550,height:1080}
    ],fighters:[
      {characterId:'tommaso',animationId:'idle',x:675,groundY:1025,scale:4/3,anchorX:249,anchorY:438,flipX:false},
      {characterId:'marco-balpo',animationId:'idle',x:1890,groundY:1025,scale:4/3,anchorX:260,anchorY:437,flipX:true}
    ],webglClouds:true,stars:true,shootingStars:true}];
});
