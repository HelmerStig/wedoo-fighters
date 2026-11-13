# Franco, Tamara e Patrick

Tre generazioni aggiuntive approvate esplicitamente, completate e scaricate. Primo fotogramma: posa `Natale` fissata tramite `poseId`. Pro legacy, 2 secondi, 49 frame da 512px, senza audio, rimozione sfondo Ultra.

- Franco: Saluto alla telecamera.
- Tamara: Inchino ed esaltazione.
- Patrick: Dancing.

Costo effettivo: 21 crediti. Le 45 animazioni natalizie dei tre lotti sono tutte completate: 315 crediti complessivi. Includendo il primo lotto non natalizio già conservato (252 crediti), il totale effettivo della sessione è 567 crediti.

Le nove azioni compaiono esattamente cinque volte ciascuna. Mike, Zichella, Mario e Tony restano esclusi.

I risultati sono integrati in `demo-moves/roster-natale.html`: hover/focus a 24fps, una sola riproduzione, ultimo fotogramma mantenuto fino all'uscita. Una nuova entrata riavvia dal primo fotogramma. Il roster generale mantiene le idle in loop.

Per ricostruire i cataloghi dalla radice del repository dopo un download completato:

```powershell
node wedoo-fighters/demo-moves/scripts/build-christmas-hover.mjs
node wedoo-fighters/demo-moves/scripts/build-christmas-roster.mjs
```

Verifica: 83 test della demo superati. Revisione visiva dei frame 0, 24 e 48 dei 45 personaggi conservata in `../distribution-natale-20261113/review-*.png`.
