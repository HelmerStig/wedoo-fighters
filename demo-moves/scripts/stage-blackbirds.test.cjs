const test=require('node:test'),assert=require('node:assert/strict');
const {flock,create}=require('../stage-blackbirds.js');
test('dieci merli su due profondita, con direzioni e dimensioni varie',()=>{
 const birds=flock(1000,9253);assert.equal(birds.length,10);assert.equal(birds.filter(b=>b.front).length,3);
 assert.ok(birds.some(b=>b.right)&&birds.some(b=>!b.right));
 assert.ok(Math.max(...birds.filter(b=>!b.front).map(b=>b.scale))<Math.min(...birds.filter(b=>b.front).map(b=>b.scale)));
 for(const b of birds){assert.ok(b.x>=-100&&b.x<=2650);assert.ok(b.y>=40&&b.y<730);assert.ok(b.flap>=0&&b.flap<4);}
 assert.notDeepEqual(birds,flock(1000,147));
 const later=flock(1100,9253);for(let i=0;i<birds.length;i++){const delta=later[i].x-birds[i].x;assert.ok(birds[i].right?delta>0:delta<0);assert.ok(Math.abs(later[i].y-birds[i].y)<5);}
});
test('piani distinti, camera e distruzione del gruppo',()=>{
 const placements=[];let scales=[];const ctx={save(){},restore(){},translate(x,y){placements.push([x,y]);},scale(x){scales.push(x);},drawImage(){}};
 const birds=create({},9253);birds.render(ctx,1000,0,false);assert.equal(placements.length,7);const initial=placements.slice();
 placements.length=0;birds.render(ctx,1000,315,false);assert.equal(placements.length,7);assert.ok(placements[0][0]<initial[0][0]);
 placements.length=0;birds.render(ctx,1000,315,true);assert.equal(placements.length,3);assert.ok(scales.some(s=>s<0)&&scales.some(s=>s>0));
 birds.destroy();placements.length=0;birds.render(ctx,1000,0,true);assert.equal(placements.length,0);
});

test('nessun merlo viene disegnato nel passaggio davanti ai personaggi',()=>{
 const water=require('../stage-statuto-water.js');const passes=[];
 const renderer=water.create({}, {StageBlackbirds:{create(){return {render(ctx,time,camera,front){passes.push(front);},destroy(){}};}}});
 const ctx={save(){},restore(){},drawImage(){}};
 renderer.renderSky(ctx,1000,0);renderer.render(ctx,1000,0);
 assert.deepEqual(passes,[false,true]);assert.equal(renderer.renderForeground,undefined);
 renderer.setEffect('water',false);passes.length=0;renderer.render(ctx,1000,0);assert.deepEqual(passes,[true]);
 renderer.setEffect('birds',false);passes.length=0;renderer.renderSky(ctx,1000,0);renderer.render(ctx,1000,0);assert.deepEqual(passes,[]);
 renderer.destroy();
});

test('il volo usa le 49 celle dello spritesheet utente e riflette il verso corretto',()=>{
 const image={},draws=[],scales=[];const ctx={save(){},restore(){},translate(){},scale(x){scales.push(x);},drawImage(...a){draws.push(a);}};
 const birds=create(image,9253);birds.render(ctx,1000,0,false);
 const states=flock(1000,9253).filter(b=>!b.front);assert.equal(draws.length,7);
 draws.forEach((args,i)=>{assert.equal(args[0],image);assert.ok(args[1]>=0&&args[1]+128<=896);assert.ok(args[2]>=0&&args[2]+128<=896);assert.equal(scales[i]<0,states[i].right);});
});

test('atterraggio sul prato, tre cicli completi a terra e decollo senza salto di posizione',()=>{
 const {GROUND_DURATION,GROUND_FPS,GROUND_LOOPS}=require('../stage-blackbirds.js');
 assert.equal(GROUND_LOOPS,3);assert.equal(GROUND_FPS,24);assert.equal(GROUND_DURATION,6125);
 const flying={},ground={},draws=[],ctx={save(){},restore(){},translate(){},scale(){},drawImage(...a){draws.push(a);}};
 const birds=create(flying,9253,ground);let landed;
 for(let time=0;time<=30000;time+=50){birds.render(ctx,time,0,true);landed=birds.snapshot().find(b=>b.state==='ground');if(landed)break;}
 assert.ok(landed);assert.ok(landed.y>=970&&landed.y<=1000);
 assert.ok((landed.x>=220&&landed.x<=850)||(landed.x>=1750&&landed.x<=2340));
 assert.ok(draws.some(a=>a[0]===ground));
 assert.equal(landed.groundScale,2.1);
 const start=landed.started;
 birds.render(ctx,start+GROUND_DURATION-1,0,true);let b=birds.snapshot().find(b=>b.id===landed.id);assert.equal(b.state,'ground');assert.equal(Math.floor(b.groundElapsed*24/1000),146);
 birds.render(ctx,start+GROUND_DURATION,0,true);b=birds.snapshot().find(b=>b.id===landed.id);assert.equal(b.state,'takeoff');assert.equal(b.x,landed.x);assert.equal(b.y,landed.y);
 birds.render(ctx,start+GROUND_DURATION+2200,0,true);b=birds.snapshot().find(b=>b.id===landed.id);assert.equal(b.state,'flying');assert.ok(b.y<landed.y-100);assert.ok(Math.abs(b.groundScale-1)<1e-8);
});
