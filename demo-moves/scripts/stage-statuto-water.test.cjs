const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {create,flow}=require('../stage-statuto-water.js');
test('l acqua scorre verso il basso e segue il drag senza muovere la maschera',()=>{
 assert.ok(Math.abs(flow(10,0)-flow(25,100))<1e-10);
 const image={},draws=[];const ctx={save(){},restore(){},drawImage(...a){draws.push([...a,this.globalAlpha]);}};
 const water=create(image);water.render(ctx,0,0);const first=draws[0];assert.equal(first[5],1165);assert.equal(first[6],400);
 draws.length=0;water.render(ctx,500,315);assert.equal(draws[0][5],850);assert.notEqual(draws[0].at(-1),first.at(-1));
 water.destroy();draws.length=0;water.render(ctx,500,0);assert.equal(draws.length,0);
});
test('la maschera acqua resta confinata al monumento e usa un asset piccolo',()=>{
 const png=fs.readFileSync(path.resolve(__dirname,'../../original-backgrounds/piazza-statuto/acqua-mask.png'));
 assert.equal(png.readUInt32BE(16),210);assert.equal(png.readUInt32BE(20),550);assert.ok(png.length<100000);
});
