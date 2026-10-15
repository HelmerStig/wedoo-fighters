import { resolve } from 'node:path';
import { AutoSprite, plan, readJson, saveJson, submit, resume, downloadSheet, id, redact } from './lib.mjs';

const [command = 'help', ...args] = process.argv.slice(2);
const print = value => console.log(redact(JSON.stringify(value, null, 2), process.env.AUTOSPRITE_API_KEY));
try {
  if (command === 'help') {
    console.log(`AutoSprite agent — Node 22+, nessuna dipendenza
  plan JOB.json                         Valida senza rete/crediti
  account                               Saldo crediti
  characters                            Elenco completo personaggi
  catalog                               Preset disponibili
  poses CHARACTER_ID                    Pose per primo/ultimo frame
  sheets CHARACTER_ID                   Spritesheet esistenti
  jobs [CHARACTER_ID]                    Ultimi 50 lavori (recupero invii incerti)
  upload NOME IMMAGINE.png OUTPUT.json   Carica personaggio (nessun credito)
  generate JOB.json NUOVA_CARTELLA       INVIA, consuma crediti, attende e scarica
  resume CARTELLA/manifest.json          Riprende senza inviare generazioni
  download SHEET_ID CARTELLA             Scarica un risultato esistente
Chiave: variabile AUTOSPRITE_API_KEY; . ./autosprite-agent/session.ps1`);
  } else if (command === 'plan') {
    print(plan(await readJson(args[0])));
  } else {
    const api = new AutoSprite(process.env.AUTOSPRITE_API_KEY);
    switch (command) {
      case 'account': print(await api.request('/account')); break;
      case 'characters': print((await api.characters()).map(({ id, name }) => ({ id, name }))); break;
      case 'catalog': print(await api.request('/animations')); break;
      case 'poses': print(await api.request(`/characters/${id(args[0])}/poses`)); break;
      case 'sheets': {
        const data = await api.request(`/characters/${id(args[0])}/spritesheets`);
        print(data.spritesheets.map(({ id, name, kind, frameCount, frameWidth, frameHeight }) => ({ id, name, kind, frameCount, frameWidth, frameHeight }))); break;
      }
      case 'jobs': print(await api.request('/jobs?limit=50' + (args[0] ? '&characterId=' + id(args[0]) : ''))); break;
      case 'upload': {
        if (args.length !== 3) throw new Error('Uso: upload NOME PNG OUTPUT.json');
        const character = await api.upload(args[0], args[1]);
        await saveJson(args[2], { id: character.id, name: character.name });
        print({ id: character.id, name: character.name, saved: resolve(args[2]) }); break;
      }
      case 'generate': {
        if (args.length !== 2) throw new Error('Uso: generate JOB.json NUOVA_CARTELLA');
        const config = await readJson(args[0]);
        const planned = plan(config);
        // Verifica chiave, saldo e appartenenza del personaggio prima dell'invio.
        const account = await api.request('/account');
        if (!Number.isFinite(account.credits) || account.credits < planned.estimatedCredits.max) throw new Error('Saldo insufficiente o non leggibile');
        await api.request(`/characters/${id(config.characterId)}`);
        print({ estimatedCredits: planned.estimatedCredits, warnings: planned.warnings });
        const manifest = await submit(api, config, resolve(args[1]));
        console.log('Manifest salvato: ' + manifest);
        const state = await resume(api, manifest);
        print({ status: state.status, creditsUsed: state.creditsUsed, output: resolve(args[1]) });
        if (state.status !== 'completed') process.exitCode = 1;
        break;
      }
      case 'resume': {
        if (args.length !== 1) throw new Error('Uso: resume CARTELLA/manifest.json');
        const state = await resume(api, args[0]); print({ status: state.status });
        if (state.status !== 'completed') process.exitCode = 1;
        break;
      }
      case 'download': {
        if (args.length !== 2) throw new Error('Uso: download SHEET_ID CARTELLA');
        print(await downloadSheet(api, args[0], resolve(args[1]))); break;
      }
      default: throw new Error('Comando sconosciuto: usa help');
    }
  }
} catch (error) {
  console.error(redact(error.message, process.env.AUTOSPRITE_API_KEY));
  process.exitCode = 1;
}
