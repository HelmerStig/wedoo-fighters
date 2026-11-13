# Backflip al posto di Piroetta

Personaggi: Matteo, Giorgio, Emma, Alex e Simona. Peirolo è stato aggiunto su richiesta dell'utente nel lotto separato `../distribution-natale-backflip-peirolo-20261113`, sostituendo Muscoli alla telecamera.

Prompt originale, senza modifiche:

> the character crouches, jumps up and backward, rotates a full 360 degrees in the air with arms tucked, then lands softly on both feet in the starting stance. Side view, the camera stays fixed.

Primo fotogramma fissato alla rispettiva posa natalizia tramite `poseId`. Impostazioni ereditate: Pro legacy, 2 secondi, 49 frame da 512px, senza audio, rimozione sfondo Ultra. Costo effettivo: 35 crediti per questo lotto e 7 per Peirolo, totale 42.

Il catalogo di `demo-moves/roster-natale.html` sostituisce solo questi sei hover e mantiene gli originali archiviati. Riproduzione singola a 24fps, senza loop. `replacesSpritesheetId` verifica che la sostituzione riguardi esattamente il risultato precedente.

Esito del controllo visivo: tutti i job sono completati e integrati tecnicamente, ma il movimento generato non realizza un backflip completo riconoscibile. La revisione di tutti i 49 frame mostra prevalentemente salti, torsioni o rotazioni parziali senza un giro completo all'indietro. Le immagini `review-<nome>.png` conservano la verifica completa; non sono state avviate rigenerazioni aggiuntive. I sei test mirati della demo sono superati e verificano associazioni e playback, non l'accuratezza del movimento generato.

Comandi dalla radice del repository per riprendere il download senza inviare nuove generazioni:

```powershell
node wedoo-fighters/autosprite-agent/monitor-distribution.mjs distribution-natale-backflip-20261113
node wedoo-fighters/autosprite-agent/monitor-distribution.mjs distribution-natale-backflip-peirolo-20261113
```

Dopo il completamento:

```powershell
node wedoo-fighters/demo-moves/scripts/build-christmas-hover.mjs
node wedoo-fighters/demo-moves/scripts/build-christmas-roster.mjs
```
