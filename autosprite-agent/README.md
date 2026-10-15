# AutoSprite API agent

Client CLI per Windows, Node.js 22 o successivo, senza pacchetti da installare.
Usa le API pubbliche AutoSprite: saldo, personaggi, upload PNG, pose esistenti,
preset, generazione singola/batch, recupero lavori, download PNG/atlas/audio.
Il motore di generazione rimane quello del servizio AutoSprite.

## Avvio

Da PowerShell in `C:\wedoo-fighters`:

```powershell
node autosprite-agent/cli.mjs account
node autosprite-agent/cli.mjs characters
```

La chiave è letta esclusivamente da `AUTOSPRITE_API_KEY`. Se manca, apri
https://www.autosprite.io/app/api-keys, crea una chiave e inseriscila con:

```powershell
. ./autosprite-agent/session.ps1
```

L'input è nascosto e vale per la sessione corrente. Non inserire chiavi nei JSON,
nei prompt, nel repository o nella chat. `run.cmd` è equivalente al comando Node.

## Elisa

Elisa ? stata caricata da `PNG/Elisa.png` nel conto API corrente e assegnata alla
guild esistente **WEDOO**. Il job `jobs/elisa-punch-pro.json` usa gi? il nuovo ID
`cmv9dyrs900045e49mr49cdz9`. Appartenenza verificata il 15 ottobre 2026.

Per caricare in futuro un altro PNG: `upload NOME FILE.png OUTPUT.json`.

## Generare

```powershell
# Controllo locale: nessuna richiesta, nessun credito
node autosprite-agent/cli.mjs plan autosprite-agent/jobs/elisa-punch-pro.json

# Questo comando invia la generazione e consuma crediti
node autosprite-agent/cli.mjs generate autosprite-agent/jobs/elisa-punch-pro.json autosprite-agent/output/elisa-punch-01
```

Esempio: Pro, 4 secondi, 49 frame da 512 px, un pugno, senza suono. Stima
documentata: 10 crediti; il costo effettivo è `creditsUsed` nella risposta.
La stima è informativa, non un tetto di spesa imposto dal servizio. La
documentazione generale e quella dei tier non concordano completamente sul
suono Pro; in quel caso `plan` espone un intervallo. Verificare le tariffe prima
di usare nuove combinazioni o durate da 6 secondi.

Puoi cambiare il prompt, usare `kind: "run"` senza prompt/rawPrompt, oppure inserire
fino a 10 animazioni nella stessa richiesta. I preset disponibili si leggono con
`catalog`. Per fissare primo/ultimo frame, elenca `poses CHARACTER_ID` e aggiungi
`poseId` e `lastFramePoseId` all'animazione. **Ultra ignora il frame finale e non
garantisce loop: il client rifiuta queste combinazioni.** Pro a 2 secondi seleziona
il vecchio motore Turbo: per il nuovo Pro usare 4 o 6 secondi.

Il comando verifica saldo e appartenenza del personaggio, salva `manifest.json`,
invia una sola richiesta e controlla i job ogni 5 secondi. Non reinvia mai un POST
automaticamente. La cartella destinazione deve essere nuova: un manifest esistente
impedisce il doppio invio. Dopo un'interruzione:

```powershell
node autosprite-agent/cli.mjs resume autosprite-agent/output/elisa-punch-01/manifest.json
```

Se l'invio ha esito sconosciuto e manca il job ID, `resume` si ferma: usa
`jobs CHARACTER_ID` e controlla AutoSprite. Puoi recuperare direttamente il risultato
con `sheets CHARACTER_ID` e `download SHEET_ID CARTELLA`. Non cancellare il manifest
per tentare di nuovo senza prima verificare il lavoro remoto.

Output: `ID.png`, `ID-atlas.json`, `ID-metadata.json`, eventuale `ID.mp3`, manifest.
Il PNG e l'atlas vengono verificati per dimensioni, numero e limiti dei frame.
La correttezza della mossa richiede una revisione visiva; il prompt non garantisce
che il modello esegua esattamente un pugno. Questa versione non scarica MP4.

## Verifica

```powershell
cd autosprite-agent
node --test
```

I test simulano le risposte API: invio unico, ripresa dopo errore, fallimenti
parziali, rate limit e download senza chiave verso lo storage. Sono stati verificati
anche saldo, personaggi e download di uno spritesheet reale preesistente;
non è stata avviata una nuova generazione a pagamento.

Fonti ufficiali controllate il 15 ottobre 2026:

- https://www.autosprite.io/docs/api
- https://www.autosprite.io/docs/api-characters
- https://www.autosprite.io/docs/api-spritesheets
- https://www.autosprite.io/docs/api-jobs
- https://www.autosprite.io/docs/api-overview
- https://www.autosprite.io/docs/api-poses
