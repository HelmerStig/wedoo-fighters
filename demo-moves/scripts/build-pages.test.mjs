import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {planPages,buildPages} from './build-pages.mjs';
import {createHash} from 'node:crypto';

async function fixture(t){
  const source=await mkdtemp(resolve(tmpdir(),'wedoo-pages-'));
  t.after(()=>rm(source,{recursive:true,force:true}));
  const put=async(name,text)=>{const file=resolve(source,name);await mkdir(resolve(file,'..'),{recursive:true});await writeFile(file,text);};
  await put('demo-moves/catalog.js','window.MOVES_CATALOG={image:"../animation/test.png"};');
  for(const file of ['stages-catalog.js','stage-actors-catalog.js','stage-cats-catalog.js','stage-lights-catalog.js'])await put('demo-moves/'+file,'');
  await put('demo-moves/index.html','<link href="styles.css" rel="stylesheet"><script src="catalog.js"></script><a href="reports/timing.html">Report</a>');
  await put('demo-moves/styles.css','body{background:#fff}');
  await put('demo-moves/reports/timing.html','<img src="../../animation/test.png"><a href="../index.html?move=idle#main">Demo</a>');
  await put('animation/test.png','PNG fixture');await put('portraits/fire.mp4','Video fixture');
  await put('original-images/private.psd','Excluded');await put('animation/unused.png','Excluded');
  await put('demo-moves/scripts/private.mjs','Excluded');await put('demo-moves/.env','Excluded');
  return {source,put};
}

test('pacchetto conserva sottocartelle e link dei report ed esclude materiale non usato',async t=>{
  const {source}=await fixture(t),destination=resolve(source,'.pages-dist');
  const plan=await buildPages(destination,source);
  assert.ok(plan.files.includes('animation/test.png'));assert.ok(plan.files.includes('demo-moves/reports/timing.html'));
  assert.ok(!plan.files.some(p=>p.includes('private')||p.includes('unused')||p.includes('.env')));
  assert.match(await readFile(resolve(destination,'index.html'),'utf8'),/url=demo-moves\//);
  await access(resolve(destination,'.nojekyll'));
  assert.equal(await readFile(resolve(destination,'animation/test.png'),'utf8'),'PNG fixture');
  await assert.rejects(buildPages(destination,source),/non vuota/);
});

test('blocca asset mancanti, puntatori LFS e link assoluti incompatibili con il sottopercorso Pages',async t=>{
  const {source,put}=await fixture(t);
  await put('demo-moves/catalog.js','window.MOVES_CATALOG={image:"../animation/missing.png"};');
  await assert.rejects(planPages(source),/assente/);
  await put('animation/missing.png','version https://git-lfs.github.com/spec/v1\noid sha256:test\n');
  await assert.rejects(planPages(source),/Git LFS/);
  await put('animation/missing.png','PNG');
  await put('demo-moves/index.html','<script src="/catalog.js"></script>');
  await assert.rejects(planPages(source),/Percorso assoluto/);
});

test('il catalogo non puo pubblicare cartelle private o scrivere nella sorgente',async t=>{
  const {source,put}=await fixture(t);
  await put('demo-moves/catalog.js','window.MOVES_CATALOG={image:"../original-images/private.png"};');
  await assert.rejects(planPages(source),/non pubblicabile/);
  await assert.rejects(buildPages(source,source),/cartella .pages-dist/);
});

test('la demo corrente ha tutti gli asset e resta entro il limite di Pages',async()=>{
  const plan=await planPages();
  assert.ok(plan.files.includes('demo-moves/stage.html'));
  assert.ok(plan.files.includes('sfx/tuono.mp3'));
  assert.ok(plan.files.some(p=>p.startsWith('animation/')&&p.endsWith('.png')));
  assert.ok(plan.bytes<1_000_000_000);
});

test('la copia online usa solo cache verificate e ignora quelle riferite a sorgenti superate',async t=>{
  const {source,put}=await fixture(t),hash=b=>createHash('sha256').update(b).digest('hex');
  const original=Buffer.alloc(80),encoded=Buffer.alloc(40);
  Buffer.from([137,80,78,71,13,10,26,10]).copy(original);original.copy(encoded,0,0,24);
  await put('animation/test.png',original);
  await put('.pages-png-cache/animation/test.png',encoded);
  const manifest={'animation/test.png':{sourceSha256:hash(original),pngSha256:hash(encoded),rgbaVerified:true}};
  await put('.pages-png-cache/manifest.json',JSON.stringify(manifest));
  const plan=await buildPages(resolve(source,'.pages-dist'),source);
  assert.equal(plan.sourceBytes-plan.bytes,40);
  assert.deepEqual(await readFile(resolve(source,'.pages-dist/animation/test.png')),encoded);
  await put('animation/test.png',Buffer.concat([original,Buffer.from('changed')]));
  assert.equal(Object.keys((await planPages(source)).optimized).length,0);
  await put('animation/test.png',original);
  await put('.pages-png-cache/animation/test.png',Buffer.alloc(40));
  await assert.rejects(planPages(source),/Cache PNG non valida/);
});
