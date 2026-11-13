# Distribuzione animazioni — 13 novembre 2026

36 personaggi del roster `wedoo-fighters/PNG`, una sola nuova animazione ciascuno. Le nove azioni richieste sono distribuite quattro volte ciascuna. Le dieci assegnazioni esistenti, inclusa Roll di Peppo, sono conservate.

Impostazioni: Pro legacy, 2 secondi, 49 fotogrammi da 512 px, senza audio, sfondo rimosso Ultra. Il primo fotogramma è fissato tramite `poseId` alla posa che coincide con la Base image corrente restituita dall'API, senza sostituirla con la posa natalizia.

Il costo effettivo restituito da AutoSprite è 7 crediti per richiesta, totale 252 crediti (la stima iniziale di 5 non comprendeva il supplemento Ultra).

- `assignments.json`: personaggio, mossa, posa di partenza e job JSON.
- `submitted.json`: job accettati, video ID, manifest e costi effettivi.
- `results.json`: risultati del monitoraggio e del download.
- Risultati: `../../output/distribution-20261113/<characterId>/`.

Per riprendere il controllo e il download senza consumare altri crediti, dalla radice del repository:

```powershell
node wedoo-fighters/autosprite-agent/monitor-distribution.mjs
```

Non rieseguire `run-distribution.mjs` per recuperare un lavoro: i manifest bloccano gli invii duplicati. La correttezza dei gesti richiede revisione visiva; il completamento tecnico non garantisce la perfetta aderenza al prompt.
