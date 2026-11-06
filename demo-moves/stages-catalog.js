(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.STAGES_CATALOG=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const base='../original-backgrounds/villa-arduino/';
  return [{id:'villa-arduino',name:'Villa Arduino',width:2550,height:1080,viewportWidth:1920,layers:[
    {id:'sky',image:base+'cielo.png',zIndex:0,width:2550,height:1080},
    {id:'clouds-far',image:base+'01-nuvole-lontane.png',zIndex:2,width:5000,height:1080,speed:6,haze:1},
    {id:'clouds-mid',image:base+'02-nuvole-intermedie.png',zIndex:3,width:5000,height:1080,speed:12,haze:0.35},
    {id:'clouds-near',image:base+'03-nuvole-vicine.png',zIndex:4,width:5000,height:1080,speed:20},
    // A parità di z-index, la villa viene disegnata per ultima, davanti alle nuvole.
    {id:'foreground',image:base+'villa-arduino.png',zIndex:4,width:2550,height:1080}
  ],fighters:[
    {characterId:'alberto',animationId:'idle',x:675,groundY:1025,scale:4/3,anchorX:253,anchorY:430,flipX:false},
    {characterId:'marsan',animationId:'idle',x:1890,groundY:1025,scale:4/3,anchorX:256,anchorY:433,flipX:true}
  ]}];
});
