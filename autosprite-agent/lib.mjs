import { readFile, writeFile, mkdir, rename, open } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const BASE = 'https://www.autosprite.io/api/v1';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const assert = (ok, message) => { if (!ok) throw new Error(message); };
export const id = value => {
  assert(typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value), 'ID non valido');
  return value;
};
export function redact(value, key = '') {
  let text = String(value).replace(/vspk_[A-Za-z0-9_-]+/g, '[API_KEY]');
  if (key) text = text.split(key).join('[API_KEY]');
  return text.replace(/https:\/\/[^\s"<>]+/g, url => url.split('?')[0]);
}
export async function readJson(path) { return JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, '')); }
export async function saveJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path + '.tmp', JSON.stringify(value, null, 2) + '\n');
  await rename(path + '.tmp', path);
}

export function plan(config) {
  assert(config && typeof config === 'object', 'Configurazione mancante');
  id(config.characterId);
  const r = structuredClone(config.request);
  assert(r && typeof r === 'object', 'request mancante');
  const allowed = ['animations', 'videoTier', 'turboMode', 'durationSec', 'frameCount', 'frameSize', 'withSound', 'removeBg'];
  assert(Object.keys(r).every(k => allowed.includes(k)), 'Campo request sconosciuto');
  r.videoTier ??= 'pro';
  assert(['turbo', 'pro', 'ultra', 'max'].includes(r.videoTier), 'videoTier non valido');
  r.durationSec ??= ['pro', 'max'].includes(r.videoTier) ? 4 : 2;
  const durations = { turbo: [2], pro: [2, 4, 6], ultra: [1, 2, 3, 4, 5, 6], max: [4, 6] };
  assert(durations[r.videoTier].includes(r.durationSec), 'Durata non valida per il tier');
  r.withSound ??= false;
  assert(typeof r.withSound === 'boolean', 'withSound deve essere booleano');
  r.frameCount ??= r.withSound ? 64 : 49;
  r.frameSize ??= 512;
  assert(Number.isInteger(r.frameCount) && r.frameCount >= 2 && r.frameCount <= 64, 'frameCount deve essere 2..64');
  assert(Number.isInteger(r.frameSize) && r.frameSize >= 32 && r.frameSize <= 512, 'frameSize deve essere 32..512');
  assert(r.removeBg === undefined || ['default', 'ultra'].includes(r.removeBg), 'removeBg non valido');
  assert(r.turboMode === undefined || ['reference', 'first_frame'].includes(r.turboMode), 'turboMode non valido');
  assert(Array.isArray(r.animations) && r.animations.length >= 1 && r.animations.length <= 10, 'Servono 1..10 animazioni');
  const warnings = [];
  if (r.videoTier === 'pro' && r.durationSec === 2) warnings.push('Pro a 2s usa il vecchio Turbo, non il nuovo Pro.');
  if (r.videoTier === 'turbo' && r.withSound) throw new Error('Turbo API ignora il suono: seleziona un altro tier');
  let extra = 0;
  for (const a of r.animations) {
    assert(a && typeof a === 'object', 'Animazione non valida');
    assert(Object.keys(a).every(k => ['kind', 'name', 'prompt', 'poseId', 'lastFramePoseId', 'loop', 'rawPrompt', 'firstFrameQuality'].includes(k)), 'Campo animazione sconosciuto');
    id(a.kind);
    if (a.kind === 'custom') {
      assert(typeof a.name === 'string' && a.name.trim().length > 0, 'Custom richiede name');
      assert(typeof a.prompt === 'string' && a.prompt.trim().length > 0 && a.prompt.length <= 1000, 'Custom richiede prompt di 1..1000 caratteri');
    } else {
      assert(a.prompt === undefined && a.rawPrompt === undefined, 'I preset non accettano prompt/rawPrompt: usa custom');
    }
    for (const k of ['loop', 'rawPrompt']) assert(a[k] === undefined || typeof a[k] === 'boolean', `${k} deve essere booleano`);
    for (const k of ['poseId', 'lastFramePoseId']) if (a[k] !== undefined) id(a[k]);
    assert(a.firstFrameQuality === undefined || a.firstFrameQuality === 'pro', 'firstFrameQuality deve essere pro');
    if (a.firstFrameQuality === 'pro' && !a.poseId) extra += 3;
    if (r.videoTier === 'ultra') {
      assert(!a.lastFramePoseId, 'Ultra non supporta il frame finale: usa Pro/Max/Turbo');
      assert(!a.loop && !['idle', 'walk', 'run'].includes(a.kind) && !/^iso_(idle|walk|run)_/.test(a.kind), 'Ultra non garantisce il loop: usa un altro tier');
    }
  }
  const clip = { turbo: 5, pro: r.durationSec === 2 ? 5 : 10, ultra: 10 * r.durationSec, max: 35 }[r.videoTier];
  // La tabella generale e il riferimento per tier non concordano sul suono Pro.
  // Esporre un intervallo, senza presentarlo come preventivo vincolante.
  const base = clip * r.animations.length + extra;
  const sound = r.videoTier === 'pro' && r.withSound;
  if (sound) warnings.push('Costo suono Pro ambiguo nei documenti: stima a intervallo, verificare in AutoSprite.');
  if (r.durationSec === 6 && ['pro', 'max'].includes(r.videoTier)) warnings.push('Tariffa 6s non distinta nella tabella: verificare il costo attuale in AutoSprite.');
  return { characterId: config.characterId, request: r,
    estimatedCredits: { min: base + (sound ? 5 * r.animations.length : 0), max: base + (sound ? clip * r.animations.length : 0) },
    warnings, pricingSource: 'https://www.autosprite.io/docs/api-spritesheets', pricingChecked: '2026-10-15' };
}

export class AutoSprite {
  constructor(key, { fetcher = fetch, pause = sleep } = {}) {
    assert(typeof key === 'string' && key.trim(), 'Imposta AUTOSPRITE_API_KEY nella sessione PowerShell');
    this.key = key.trim(); this.fetcher = fetcher; this.pause = pause;
  }
  async request(path, { method = 'GET', body } = {}) {
    assert(path.startsWith('/') && !path.startsWith('//') && !path.includes('..'), 'Percorso API non valido');
    for (let attempt = 0; ; attempt++) {
      let res;
      try {
        const form = body instanceof FormData;
        res = await this.fetcher(BASE + path, {
          method, redirect: 'error', signal: AbortSignal.timeout(120_000),
          headers: { 'x-api-key': this.key, ...(!form && body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
          body: body === undefined ? undefined : form ? body : JSON.stringify(body)
        });
      } catch {
        throw new Error(method === 'GET' ? 'Connessione API interrotta. Riprova la lettura.' : 'Esito invio sconosciuto: non ripetere il POST. Controlla jobs/account prima di procedere.');
      }
      if (method === 'GET' && (res.status === 429 || res.status >= 500) && attempt < 3) {
        const h = res.headers.get('retry-after');
        const delay = h ? (/^\d+$/.test(h) ? Number(h) * 1000 : Date.parse(h) - Date.now()) : 1000 * 2 ** attempt;
        if (Number.isFinite(delay) && delay > 60_000) throw new Error('Limite API: riprova dopo Retry-After, senza inviare nuove generazioni');
        await res.body?.cancel();
        await this.pause(Math.max(1000, Number.isFinite(delay) ? delay : 1000));
        continue;
      }
      let data;
      try { data = await res.json(); } catch { throw new Error(`HTTP ${res.status}: risposta JSON non valida; se era un invio controlla jobs prima di ripeterlo`); }
      if (!res.ok) throw new Error(redact(`HTTP ${res.status}: ${data.error?.code ?? ''} ${data.error?.message ?? 'Errore API'}`, this.key));
      return data;
    }
  }
  async characters() {
    const result = []; let cursor; const seen = new Set();
    do {
      const page = await this.request('/characters?limit=50' + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
      assert(Array.isArray(page.characters), 'Risposta characters non valida');
      result.push(...page.characters);
      cursor = page.hasMore ? page.nextCursor : null;
      if (page.hasMore) assert(cursor && !seen.has(cursor), 'Cursore API mancante o ripetuto');
      seen.add(cursor);
    } while (cursor);
    return result;
  }
  async upload(name, path) {
    assert(name && name.length <= 100, 'Nome richiesto, massimo 100 caratteri');
    const bytes = await readFile(path);
    assert(bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])), 'Per upload usa un file PNG');
    const form = new FormData();
    form.set('name', name); form.set('isHumanoid', 'true');
    form.set('image', new Blob([bytes], { type: 'image/png' }), 'character.png');
    return this.request('/characters', { method: 'POST', body: form });
  }
  async download(url) {
    const u = new URL(url);
    assert(u.protocol === 'https:' && !u.username && !u.password, 'Download richiede HTTPS');
    // Nessuna chiave API ai servizi di storage, anche in caso di redirect.
    let res;
    try { res = await this.fetcher(u, { redirect: 'error', signal: AbortSignal.timeout(120_000) }); }
    catch { throw new Error('Download interrotto: usa resume per ottenere URL aggiornati'); }
    assert(res.ok, `Download HTTP ${res.status}: usa resume per aggiornare URL scaduti`);
    return Buffer.from(await res.arrayBuffer());
  }
}

export async function downloadSheet(api, sheetId, output) {
  id(sheetId);
  const sheet = await api.request(`/spritesheets/${sheetId}`);
  assert(sheet.status === 'succeeded' && sheet.sheetUrl && sheet.atlasUrl, 'Spritesheet non ancora pronto');
  const png = await api.download(sheet.sheetUrl);
  assert(png.length >= 33 && png.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])), 'Download PNG non valido');
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  assert(width === sheet.columns * sheet.frameWidth && height === Math.ceil(sheet.frameCount / sheet.columns) * sheet.frameHeight, 'Dimensioni PNG diverse dai metadati API');
  const atlasBytes = await api.download(sheet.atlasUrl);
  const atlas = JSON.parse(atlasBytes.toString('utf8'));
  const frames = Array.isArray(atlas.frames) ? atlas.frames : Object.values(atlas.frames ?? {});
  assert(frames.length === sheet.frameCount, 'Numero frame atlas diverso dai metadati API');
  for (const entry of frames) {
    const f = entry.frame ?? entry;
    assert([f.x, f.y, f.w, f.h].every(Number.isInteger) && f.x >= 0 && f.y >= 0 && f.w > 0 && f.h > 0 && f.x + f.w <= width && f.y + f.h <= height, 'Frame atlas fuori dal PNG');
  }
  await mkdir(output, { recursive: true });
  await writeFile(resolve(output, sheetId + '.png'), png);
  await writeFile(resolve(output, sheetId + '-atlas.json'), atlasBytes);
  if (sheet.audioUrl) await writeFile(resolve(output, sheetId + '.mp3'), await api.download(sheet.audioUrl));
  const { sheetUrl, atlasUrl, audioUrl, ...metadata } = sheet;
  await saveJson(resolve(output, sheetId + '-metadata.json'), { ...metadata, audioDownloaded: Boolean(audioUrl), pngWidth: width, pngHeight: height, atlasFramesChecked: frames.length });
  return { sheetId, width, height, frames: frames.length, audio: Boolean(audioUrl) };
}

export async function submit(api, config, output) {
  const planned = plan(config);
  const manifestPath = resolve(output, 'manifest.json');
  await mkdir(output, { recursive: true });
  // wx impedisce due invii concorrenti o la sovrascrittura di un lavoro esistente.
  const file = await open(manifestPath, 'wx');
  const state = { version: 1, status: 'submission_unknown', createdAt: new Date().toISOString(), plan: planned, workflows: [], failed: [] };
  try { await file.writeFile(JSON.stringify(state, null, 2)); } finally { await file.close(); }
  let accepted;
  try { accepted = await api.request(`/characters/${id(planned.characterId)}/spritesheets`, { method: 'POST', body: planned.request }); }
  catch (error) { state.error = redact(error.message, api.key); await saveJson(manifestPath, state); throw error; }
  // Conservare subito la risposta anche se il formato non e quello atteso.
  state.accepted = JSON.parse(redact(JSON.stringify(accepted), api.key));
  state.workflows = accepted.workflows ?? [];
  state.failed = accepted.failed ?? [];
  state.creditsUsed = accepted.creditsUsed;
  state.status = 'accepted';
  await saveJson(manifestPath, state);
  assert(Array.isArray(state.workflows) && state.workflows.length, 'Nessun workflow accettato: consulta manifest.json');
  return manifestPath;
}

export async function resume(api, manifestPath, { timeoutMs = 15 * 60_000, intervalMs = 5000, log = console.log } = {}) {
  const state = await readJson(manifestPath);
  assert(state.version === 1 && Array.isArray(state.workflows) && state.workflows.length, 'Nessun job da riprendere: controlla jobs/account. Non inviare di nuovo alla cieca.');
  const deadline = Date.now() + timeoutMs;
  const output = dirname(resolve(manifestPath));
  let pending;
  do {
    pending = false;
    for (const workflow of state.workflows) {
      if (workflow.downloaded || workflow.status === 'failed') continue;
      const job = await api.request(`/jobs/${id(workflow.jobId)}`);
      workflow.status = job.status;
      log(`${workflow.jobId}: ${job.status}`);
      if (job.status === 'failed') workflow.error = redact(job.error ?? 'Generazione fallita', api.key);
      else if (job.status === 'succeeded') {
        assert(Array.isArray(job.spritesheetIds) && job.spritesheetIds.length, 'Job riuscito senza spritesheetIds: riprova resume');
        workflow.sheets = [];
        for (const sheetId of job.spritesheetIds) workflow.sheets.push(await downloadSheet(api, sheetId, output));
        workflow.downloaded = true;
      } else {
        assert(['queued', 'running'].includes(job.status), 'Stato job sconosciuto');
        pending = true;
      }
      await saveJson(manifestPath, state);
    }
    if (pending) {
      assert(Date.now() < deadline, 'Attesa scaduta: usa resume sullo stesso manifest, senza generare di nuovo');
      await api.pause(intervalMs);
    }
  } while (pending);
  state.status = state.failed.length || state.workflows.some(w => w.status === 'failed') ? 'completed_with_errors' : 'completed';
  await saveJson(manifestPath, state);
  return state;
}
