---
name: wedoo-animation-assets
description: Scarica, seleziona e integra spritesheet WEDOO in animation con atlas e manifest coerenti, rispettando tagli e dimensioni. Usala per aggiornare asset esistenti da AutoSprite, senza generarne di nuovi.
---

# Asset animati WEDOO

Lavora dalla radice del repository. Le selezioni correnti sono in:

| Animazione | Manifest |
| --- | --- |
| idle | `animation/manifest.json` |
| walk | `animation/walk-manifest.json` |
| victory | `animation/victory-manifest.json` |

Leggi la struttura effettiva di questi file e degli atlas prima di modificarli. Non fissare il numero di personaggi: ricavalo dai dati correnti.

## Selezione e download

- Verifica nome e ID remoti con il client `autosprite-agent/cli.mjs`; segui `autosprite-agent/AGENT.md` per l'accesso al servizio. Una richiesta di download non autorizza generazioni.
- Se l'utente chiede le proprie ultime versioni, rileggi gli spritesheet remoti e confronta ID, data e sourceVideoId. Le varianti possono avere nomi diversi: MORI ha usato anche `Combat Idle Dynamic` senza `Pro`.
- Preferisci la versione trimmed salvata quando richiesta; altrimenti scarica quella completa. Controlla se il PNG è già tagliato o se il servizio salva soltanto `loopStart` e `loopEnd`, per non ritagliare due volte.
- Conserva PNG, atlas e metadata sorgente in una cartella di lavoro separata usando `node autosprite-agent/cli.mjs download SHEET_ID CARTELLA_OUTPUT`.

## Esportazione locale

Salva gli asset come `animation/slug/slug-idle.png`, `slug-walk.png` o `slug-victory.png`, con l'atlas JSON omonimo. Riusa gli slug esistenti, inclusi i trattini.

Per un taglio espresso come intervallo di frame inclusivo, esporta `end - start + 1` celle nell'ordine sorgente. Copia i pixel senza ridimensionare, ricentrare o ritagliare i margini interni delle celle. Per una versione completa conserva il file sorgente quando possibile.

Aggiorna l'atlas con rettangoli validi, dimensioni della griglia e numero di frame. Conserva la provenienza nel manifest: `sourceSheetId`, intervallo sorgente, conteggio originale, flag `trimmed`, percorsi, dimensioni delle celle e velocità salvata. Non inventare campi di verifica pixel se non è stata eseguita una verifica effettiva.

Modifica soltanto le voci richieste. Gli script storici negli output possono usare selezioni superate: leggerli prima di eseguirli e non riesportare l'intera libreria per aggiornare due personaggi.

## Verifica e demo

- Verifica che il numero dei rettangoli corrisponda ai frame dichiarati e che tutti rientrino nel PNG.
- Se ricomponi celle, confronta i pixel decodificati con quelli sorgente; un hash del file PNG può cambiare con la compressione anche a pixel identici.
- Confronta scala, margini e abiti con il PNG originale; segnala anomalie senza correggere la scala arbitrariamente.
- Se la richiesta comprende l'aggiornamento della demo, rigenera `demo-moves/catalog.js` con `node demo-moves/scripts/build-catalog.mjs` e verifica con `node --test demo-moves/scripts/verify.test.cjs`.

La demo usa attualmente 18 fps per idle, walk e victory; `speedMultiplier` del servizio è conservato come informazione, non moltiplicato automaticamente per la velocità di riproduzione.
