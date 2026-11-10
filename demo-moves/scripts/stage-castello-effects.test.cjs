const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const effects=require('../stage-castello-effects.js');
function fixture(){
 const draws=[],image={};
 const context={save(){},restore(){},drawImage(...a){draws.push(['flag',...a]);},fillRect(...a){draws.push([['#efffff','#9de5ff','#d5f7ff'].includes(this.fillStyle)?'water':'leaf',...a,this.globalAlpha]);}};
 return {renderer:effects.create(image),context,draws};
}
test('bandiere animate da spritesheet locale: nessuna lettura pixel richiesta nel browser',()=>{
 const f=fixture();f.renderer.render(f.context,0,315);const first=f.draws[0];
 assert.equal(first[2],0);assert.equal(first[6],effects.flags[0].rect[0]-315);
 f.draws.length=0;f.renderer.render(f.context,500,315);assert.equal(f.draws[0][2],480);
 f.draws.length=0;f.renderer.render(f.context,2000,315);assert.equal(f.draws[0][2],0);
 const png=fs.readFileSync(path.resolve(__dirname,'../../original-backgrounds/piazza-castello/bandiere-animate.png'));
 assert.equal(png.readUInt32BE(16),24*80);assert.equal(png.readUInt32BE(20),112);
 f.renderer.destroy();f.draws.length=0;f.renderer.render(f.context,0,0);assert.equal(f.draws.length,0);
});
test('gli effetti seguono la camera e gli spruzzi restano visibili dopo il ridimensionamento',()=>{
 const f=fixture();f.renderer.render(f.context,720,0);const first=f.draws.slice();
 f.draws.length=0;f.renderer.render(f.context,720,630);
 for(let i=0;i<first.length;i++){
  const x=first[i][0]==='flag'?6:1;assert.equal(f.draws[i][x],first[i][x]-630);
  if(first[i][0]==='water'){
   assert.ok(first[i].slice(1,5).every(Number.isInteger));assert.ok(first[i][3]>=4);assert.ok(first[i][5]>=.45);
  }
 }
});

test('ombre lente cicliche, nuvole verso sinistra e foglie sporadiche vicino al suolo',()=>{
  const first=effects.cloudCover(2100,800,0),later=effects.cloudCover(2100-180,800,10000);
  assert.ok(Math.abs(first-later)<1e-10);
  for(const time of [0,1000,20000,400000]){
    for(const x of [0,600,1500,2400]){
      const a=effects.cloudCover(x,900,time);assert.ok(a>=0&&a<=.32);
      assert.ok(Math.abs(a-effects.cloudCover(x,900,time+3750/.018))<1e-8);
    }
  }
  assert.equal(effects.leaves(19000).length,0);
  assert.equal(effects.leaves(23000).length,0);
  const leaf=effects.leaves(1000)[0],next=effects.leaves(1100)[0];
  assert.ok(next.x<leaf.x);assert.ok(leaf.y>=960&&leaf.y<=1030);
  assert.ok(effects.leaves(4000).length<=10);
  assert.ok(effects.leaves(6000).length>=6);
  assert.ok(effects.leaves(6000).some(l=>l.size===3));
  assert.ok(effects.cloudCover(1800,850,0)>.25);
  const f=fixture();f.renderer.setEffect('leaves',false);f.renderer.render(f.context,4000,0);
  assert.equal(f.draws.filter(d=>d[0]==='leaf').length,0);
});
test('le ombre sono mascherate con alpha dello sfondo e seguono il drag',()=>{
  const source={},calls=[],canvas={width:0,height:0};
  const ctx={clearRect(){},fillRect(){},drawImage(image){calls.push([image,this.globalCompositeOperation,this.globalAlpha]);}};
  canvas.getContext=()=>ctx;
  const renderer=effects.create({}, {document:{createElement:()=>canvas}},source);
  const drawn=[],context={save(){},restore(){},fillRect(){},drawImage(...a){drawn.push(a);}};
  renderer.render(context,1000,315);
  assert.deepEqual(calls[0],[source,'destination-in',1]);
  assert.ok(drawn.some(a=>a[0]===canvas&&a[1]===-315));
  renderer.setEffect('cloudShadows',false);drawn.length=0;renderer.render(context,2000,0);
  assert.equal(drawn.some(a=>a[0]===canvas),false);
  renderer.destroy();assert.equal(canvas.width,0);
});
