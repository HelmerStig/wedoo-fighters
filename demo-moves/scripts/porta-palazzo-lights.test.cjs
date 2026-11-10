const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {level}=require('../stage-lights.js');
const data=require('../stage-lights-catalog.js')['porta-palazzo'];
test('neon e riflessi condividono il blink con intensita minore sul pavimento',()=>{
 const groups=new Set(data.points.map(p=>p.group));assert.equal(groups.size,8);
 for(const group of groups){
  const pair=data.points.filter(p=>p.group===group);assert.equal(pair.length,2);
  const sign=pair.find(p=>p.kind==='neon'),reflection=pair.find(p=>p.kind==='reflection');
  assert.ok(reflection.strength<sign.strength);assert.equal(sign.seed,reflection.seed);
  let changed=false;for(let t=0;t<20000;t+=100){assert.equal(level(sign,t),level(reflection,t));if(level(sign,t)<.9)changed=true;}
  assert.ok(changed,group);
 }
});
test('maschera neon valida e legata allo sfondo originale',()=>{
 const root=path.resolve(__dirname,'../..'),png=fs.readFileSync(path.resolve(__dirname,'..',data.mask.image));
 assert.equal(png.readUInt32BE(16),data.mask.width);assert.equal(png.readUInt32BE(20),data.mask.height);
 const source=fs.readFileSync(path.join(root,'original-backgrounds/porta-palazzo/porta-palazzo-stage.png'));
 assert.equal(crypto.createHash('sha256').update(source).digest('hex'),data.sourceSha256);
 for(const p of data.points){const [x,y,w,h]=p.maskRect;assert.ok(p.pixels>0&&x>=0&&y>=0&&x+w<=data.mask.width&&y+h<=data.mask.height);if(p.kind==='reflection')assert.ok(p.rect[1]>=885);}
});
