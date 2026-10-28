---
name: wedoo-autosprite
description: Genera e recupera animazioni dei personaggi WEDOO su AutoSprite usando il client del repository. Usala per preset, prompt, pose, crediti e lavori remoti; per esportare asset nella demo usa wedoo-animation-assets.
---

# WEDOO AutoSprite

Lavora dalla radice del repository che contiene `autosprite-agent/cli.mjs`.
Leggi `autosprite-agent/AGENT.md` e, per i parametri necessari, `autosprite-agent/README.md` e `lib.mjs`. Il client locale può avere limiti più restrittivi della documentazione aggiornata: verifica entrambi prima di cambiare la validazione.

## Identità e configurazione

- Risolvi i personaggi con `node autosprite-agent/cli.mjs characters`; usa `poses ID` e `sheets ID` per verificare posa originale e risultati esistenti.
- Oscar è diverso da Oscare; Peirolo è diverso da Peiro. Il file locale `PNG/OSCARE.png` è associato a Oscar dal catalogo. Non dedurre l'identità remota dal solo nome del PNG.
- I manifest in `animation/` descrivono gli asset selezionati; i job e i risultati storici non dimostrano quale versione l'utente voglia ora.
- Leggi la chiave soltanto da `AUTOSPRITE_API_KEY`. Non stamparla, salvarla nei job o passarla agli URL di storage.
- Usa `catalog` per i preset disponibili; `walk` è un tipo standard e può non essere elencato dal catalogo dei preset aggiuntivi. I preset non accettano `prompt` o `rawPrompt`; per un testo proprio usa `custom` con nome e prompt.
- `videoTier: "pro"` con `durationSec: 2` seleziona il vecchio Turbo. Non equivale al nuovo `turbo`. Rispetta il modello richiesto; verifica tariffe e capacità correnti prima di consigliare alternative.
- Per preservare la composizione, quando richiesto usa la posa originale caricata come `poseId` e `lastFramePoseId`. Non promettere che questo garantisca la qualità del movimento. Non aggiungere il vincolo finale ai tier che lo ignorano.

## Invio e recupero

1. Crea un job JSON per la richiesta corrente e validalo con `node autosprite-agent/cli.mjs plan PERCORSO_JOB`.
2. Comunica il costo stimato prima dell'invio autorizzato. Usa una cartella output nuova per ogni generazione.
3. Esegui `node autosprite-agent/cli.mjs generate PERCORSO_JOB CARTELLA_OUTPUT` una sola volta.
4. Dopo interruzioni o errori, consulta il manifest e usa `resume CARTELLA_OUTPUT/manifest.json`, `jobs ID` o `sheets ID`. Un invio incerto non autorizza un nuovo POST.
5. Per scaricare un risultato già esistente usa `download SHEET_ID CARTELLA_OUTPUT`: non rigenerarlo.

I batch sono limitati ai personaggi e alla spesa autorizzati. Un ordine di arresto ferma i nuovi invii; i lavori già accettati possono terminare sul server. Registra quelli avviati e i crediti effettivi. `guard-walk-batch.mjs` è un batch storico con elenco e data fissi, fermato dall'utente: non riattivarlo come scorciatoia per nuove richieste.

## Verifica del risultato

Controlla visivamente movimento, postura, abiti, visibilità di testa e piedi, continuità del loop e margini rispetto al riferimento. Se disponibile, `autosprite-agent/output/scale-audit/check-animation.ps1` confronta le dimensioni; richiede un solo file metadata e `reference-pose.png` nella cartella. Gli output ignorati da Git potrebbero mancare su un altro checkout.

Una camminata richiede passi alternati: guardia che oscilla, passo avanti e ritorno e inversione a metà ciclo non bastano. La validità di PNG e atlas non prova la qualità della mossa. Riferisci i difetti senza avviare altre prove a pagamento non richieste e senza estendere una prova a tutti i personaggi.

Riporta nome, risultato, costo `creditsUsed` e percorso dei file. La creazione di una skill o una verifica in sola lettura non autorizza generazioni, cancellazioni o pubblicazioni.
