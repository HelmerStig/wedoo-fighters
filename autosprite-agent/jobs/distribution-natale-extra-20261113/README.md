# Estensione natalizia — dieci personaggi già assegnati

L'utente ha confermato di rigenerare anche i dieci personaggi con un'animazione già assegnata. Questo lotto completa i 32 job di `../distribution-natale-20261113`, per 42 personaggi totali. Sono esclusi solo Mike, Zichella, Mario e Tony, privi di posa natalizia.

Ogni richiesta usa esplicitamente la rispettiva posa `Natale 2026` come primo fotogramma: Pro legacy, 2s, 49 frame da 512px, senza audio, rimozione sfondo Ultra. Le nove azioni richieste sono distribuite su quattro o cinque personaggi ciascuna; Peppo riceve il Saluto alla telecamera, conservando separatamente il precedente Roll.

Costo effettivo dei primi due lotti natalizi: 224 + 70 = 294 crediti. Il successivo lotto `../distribution-natale-new3-20261113` aggiunge Franco, Tamara e Patrick per 21 crediti: totale natalizio 315 crediti e 45 personaggi. Il lotto originale, con posa non natalizia, è conservato separatamente ed è costato 252 crediti: totale della sessione 567 crediti.

`assignments.json` e `submitted.json` contengono assegnazioni, pose e job ID. Per riprendere monitoraggio e download senza rigenerare:

```powershell
node wedoo-fighters/autosprite-agent/monitor-distribution.mjs distribution-natale-extra-20261113
```
