import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { AutoSprite, plan, submit, resume, readJson, downloadSheet, redact } from '../lib.mjs';

const KEY = 'vspk_FAKE_TEST_KEY';
const config = () => ({ characterId: 'elisa', request: { videoTier: 'pro', durationSec: 4, frameCount: 2, frameSize: 32, animations: [{ kind: 'custom', name: 'Punch', prompt: 'One punch' }] } });
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers });
async function temporary(t) {
  const root = await mkdtemp(join(tmpdir(), 'autosprite-agent-test-'));
  t.after(async () => {
    assert.equal(dirname(resolve(root)), resolve(tmpdir()));
    assert.ok(root.includes('autosprite-agent-test-'));
    await rm(root, { recursive: true, force: true });
  });
  return root;
}
// PNG IHDR sufficiente per verificare dimensioni senza decoder esterni.
function png(width = 64, height = 32) {
  const bytes = Buffer.alloc(33);
  Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes);
  bytes.writeUInt32BE(13, 8); bytes.write('IHDR', 12);
  bytes.writeUInt32BE(width, 16); bytes.writeUInt32BE(height, 20);
  return bytes;
}
const atlas = { frames: { 0: { x: 0, y: 0, w: 32, h: 32 }, 1: { x: 32, y: 0, w: 32, h: 32 } } };
const sheet = () => ({ id: 'ss1', status: 'succeeded', frameWidth: 32, frameHeight: 32, frameCount: 2, columns: 2, sheetUrl: 'https://storage.test/sheet.png?signature=hidden', atlasUrl: 'https://storage.test/atlas.json?signature=hidden', audioUrl: 'https://storage.test/audio.mp3?signature=hidden' });
function assets(url, options) {
  assert.equal(options.headers, undefined, 'La chiave non deve raggiungere lo storage');
  assert.equal(options.redirect, 'error');
  const path = new URL(url).pathname;
  if (path.endsWith('.png')) return new Response(png());
  if (path.endsWith('.json')) return json(atlas);
  return new Response(Buffer.from('test audio'));
}

test('valida prima di inviare e distingue Pro legacy', () => {
  const c = config();
  assert.deepEqual(plan(c).estimatedCredits, { min: 10, max: 10 });
  c.request.durationSec = 2;
  assert.equal(plan(c).estimatedCredits.min, 5);
  assert.match(plan(c).warnings.join(), /vecchio Turbo/);
  c.request.frameCount = 100;
  assert.throws(() => plan(c), /frameCount/);
});

test('legge JSON UTF-8 con BOM creati da editor Windows', async t => {
  const root = await temporary(t);
  const path = join(root, 'job.json');
  await writeFile(path, '\uFEFF' + JSON.stringify(config()));
  assert.equal(plan(await readJson(path)).characterId, 'elisa');
});

test('rifiuta prompt nei preset e limiti frame Ultra ignorati dal server', () => {
  const c = config(); c.request.animations[0].kind = 'punch';
  assert.throws(() => plan(c), /preset/);
  c.request.animations[0].kind = 'custom'; c.request.videoTier = 'ultra';
  c.request.animations[0].lastFramePoseId = 'pose1';
  assert.throws(() => plan(c), /frame finale/);
  delete c.request.animations[0].lastFramePoseId;
  c.request.animations[0].loop = true;
  assert.throws(() => plan(c), /loop/);
});

test('ripete GET su 429 rispettando Retry-After, senza ripetere POST', async () => {
  let count = 0; const delays = [];
  const api = new AutoSprite(KEY, { fetcher: async (_url, opts) => {
    assert.equal(opts.headers['x-api-key'], KEY);
    return ++count === 1 ? json({ error: { code: 'RATE_LIMIT_EXCEEDED' } }, 429, { 'retry-after': '2' }) : json({ credits: 30 });
  }, pause: async ms => delays.push(ms) });
  assert.equal((await api.request('/account')).credits, 30);
  assert.deepEqual(delays, [2000]);
  count = 0;
  await assert.rejects(api.request('/characters', { method: 'POST', body: {} }), /429/);
  assert.equal(count, 1);
});

test('errori e URL firmati non espongono chiave o query nei log', async () => {
  const api = new AutoSprite(KEY, { fetcher: async () => json({ error: { message: KEY + ' https://test.test/file?signature=secret' } }, 403) });
  await assert.rejects(api.request('/account'), error => !error.message.includes(KEY) && !error.message.includes('signature'));
  assert.equal(redact(KEY), '[API_KEY]');
  await assert.rejects(api.request('//other.test/api'), /Percorso/);
  await assert.rejects(api.download('http://storage.test/x'), /HTTPS/);
});

test('paginazione personaggi e rilevamento cursori ripetuti', async () => {
  let calls = 0;
  const api = new AutoSprite(KEY, { fetcher: async url => {
    calls++;
    if (calls === 1) return json({ characters: [{ id: 'one' }], hasMore: true, nextCursor: 'next' });
    assert.match(url, /cursor=next/);
    return json({ characters: [{ id: 'two' }], hasMore: false });
  } });
  assert.equal((await api.characters()).length, 2);
  api.fetcher = async () => json({ characters: [], hasMore: true, nextCursor: 'same' });
  await assert.rejects(api.characters(), /ripetuto/);
});

test('invio persistente, fallimento parziale e ripresa senza secondo POST', async t => {
  const root = await temporary(t); let posts = 0, polls = 0;
  const api = new AutoSprite(KEY, { pause: async () => {}, fetcher: async (url, opts) => {
    if (String(url).startsWith('https://storage.test')) return assets(url, opts);
    const path = new URL(url).pathname;
    if (opts.method === 'POST') { posts++; return json({ workflows: [{ jobId: 'j1', kind: 'custom' }], failed: [{ kind: 'walk', error: 'failed' }], creditsUsed: 10 }, 202); }
    if (path.endsWith('/jobs/j1')) return json(++polls === 1 ? { status: 'running' } : { status: 'succeeded', spritesheetIds: ['ss1'] });
    if (path.endsWith('/spritesheets/ss1')) return json(sheet());
    throw new Error('Unexpected path');
  } });
  const manifest = await submit(api, config(), root);
  assert.equal((await readJson(manifest)).workflows[0].jobId, 'j1');
  const done = await resume(api, manifest, { intervalMs: 0, log: () => {} });
  assert.equal(done.status, 'completed_with_errors');
  assert.equal(done.workflows[0].downloaded, true);
  assert.equal((await readJson(join(root, 'ss1-metadata.json'))).atlasFramesChecked, 2);
  assert.equal((await readFile(join(root, 'ss1.mp3'))).toString(), 'test audio');
  assert.ok(!(await readFile(manifest, 'utf8')).includes('signature'));
  await resume(api, manifest, { log: () => {} });
  await assert.rejects(submit(api, config(), root), /EEXIST/);
  assert.equal(posts, 1);
});

test('esito POST incerto conserva il blocco e non reinvia', async t => {
  const root = await temporary(t); let calls = 0;
  const api = new AutoSprite(KEY, { fetcher: async () => { calls++; throw new Error('network'); } });
  await assert.rejects(submit(api, config(), root), /Esito invio sconosciuto/);
  const manifest = join(root, 'manifest.json');
  assert.equal((await readJson(manifest)).status, 'submission_unknown');
  await assert.rejects(resume(api, manifest), /Nessun job/);
  await assert.rejects(submit(api, config(), root), /EEXIST/);
  assert.equal(calls, 1);
});

test('errore download si recupera rileggendo job e URL senza rigenerare', async t => {
  const root = await temporary(t); let broken = true, posts = 0;
  const api = new AutoSprite(KEY, { fetcher: async (url, opts) => {
    if (opts.method === 'POST') { posts++; return json({ workflows: [{ jobId: 'j1' }], creditsUsed: 10 }, 202); }
    if (String(url).includes('/jobs/')) return json({ status: 'succeeded', spritesheetIds: ['ss1'] });
    if (String(url).includes('/spritesheets/')) return json(sheet());
    if (broken) return new Response('expired', { status: 403 });
    return assets(url, opts);
  } });
  const manifest = await submit(api, config(), root);
  await assert.rejects(resume(api, manifest, { log: () => {} }), /Download HTTP 403/);
  broken = false;
  assert.equal((await resume(api, manifest, { log: () => {} })).status, 'completed');
  assert.equal(posts, 1);
});

test('atlas fuori griglia viene rifiutato', async t => {
  const root = await temporary(t);
  const api = new AutoSprite(KEY, { fetcher: async (url, opts) => {
    if (String(url).includes('/spritesheets/')) return json(sheet());
    if (String(url).includes('atlas.json')) return json({ frames: [{ x: 0, y: 0, w: 90, h: 32 }, { x: 32, y: 0, w: 32, h: 32 }] });
    return assets(url, opts);
  } });
  await assert.rejects(downloadSheet(api, 'ss1', root), /fuori/);
});

test('job fallito termina e non viene reinviato', async t => {
  const root = await temporary(t); let calls = 0;
  const manifest = join(root, 'manifest.json');
  await writeFile(manifest, JSON.stringify({ version: 1, workflows: [{ jobId: 'j1' }], failed: [] }));
  const api = new AutoSprite(KEY, { fetcher: async () => { calls++; return json({ status: 'failed', error: 'Model failed' }); } });
  assert.equal((await resume(api, manifest, { log: () => {} })).status, 'completed_with_errors');
  await resume(api, manifest, { log: () => {} });
  assert.equal(calls, 1);
});
