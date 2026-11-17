(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.STAGES_CATALOG=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const base='../original-backgrounds/villa-arduino/';
  return [{id:'villa-arduino',name:'Villa Arduino',cats:[{id:'telma',level:'balconies',zone:0,scale:.2},{id:'tilda',level:'balconies',zone:1,scale:.18},{id:'tullio',level:'ground',groundY:972,scale:.35}],width:2550,height:1080,viewportWidth:1920,
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
    ],webglClouds:true,stars:true,shootingStars:true},{id:'via-somis',name:'Via Somis, Cortile',width:2550,height:1080,viewportWidth:1920,lightning:true,wind:true,storm:'approaching',windTrack:'../sfx/wind.mp3',thunderTrack:'../sfx/tuono.mp3',
    backgroundActors:[{characterId:'tony',scale:.672,pixelSize:3,anchorX:260.5,anchorY:482,speed:63,startX:1000,firstGreetingInterval:[6000,10000],greetingInterval:[14000,50000],
      path:{minX:120,maxX:2350,groundY:825},
      walkableRect:{left:0,right:2450,top:800,bottom:870}}],
    shadow:{color:'#1d1625',shearX:.5,flattenY:.11,opacity:.72,contactOpacity:.28},
    layers:[
      {id:'sky',image:'../original-backgrounds/via-somis/cielo.png',zIndex:0,width:2550,height:1080},
      {id:'foreground',image:'../original-backgrounds/via-somis/somis.png',zIndex:1,width:2550,height:1080}
    ],fighters:[
      {characterId:'oscar',animationId:'idle',x:675,groundY:1025,scale:4/3,anchorX:253.5,anchorY:433,flipX:false},
      {characterId:'fra-tavarone',animationId:'idle',x:1890,groundY:1025,scale:4/3,anchorX:245,anchorY:427,flipX:true}
    ]},{id:'piazza-statuto',name:'Piazza Statuto',ambientVolume:.2,birdVolume:.5,birdTrack:'../sfx/uccelli.mp3',birdGroundTexture:{id:'blackbird-ground',image:'../original-backgrounds/piazza-statuto/merlo/merlo-spritesheet.png',width:896,height:896},birdTexture:{id:'blackbird-sheet',image:'../original-backgrounds/piazza-statuto/merlo/merlo-volo-spritesheet.png',width:896,height:896},ambientTrack:'../sfx/acqua.mp3',ambientAudioLabel:'acqua',ambient:'statuto',ambientTexture:{id:'water-mask',image:'../original-backgrounds/piazza-statuto/acqua-mask.png',width:210,height:550},width:2550,height:1080,viewportWidth:1920,webglClouds:true,cloudPalette:'sunset',
    shadow:{color:'#302239',shearX:.5,flattenY:.11,opacity:.72,contactOpacity:.28},
    layers:[
      {id:'sky',image:'../original-backgrounds/piazza-statuto/cielo.png',zIndex:0,width:2550,height:1080},
      {id:'foreground',image:'../original-backgrounds/piazza-statuto/statuto.png',zIndex:1,width:2550,height:1080}
    ],fighters:[
      {characterId:'angela',animationId:'idle',x:675,groundY:1025,scale:4/3,anchorX:264.5,anchorY:437,flipX:false},
      {characterId:'giordano',animationId:'idle',x:1890,groundY:1025,scale:4/3,anchorX:258,anchorY:431,flipX:true}
    ]}];
});
