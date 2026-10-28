---
name: wedoo-demo-moves
description: Modifica la demo HTML locale WEDOO in demo-moves, inclusi navigazione personaggi, player canvas, catalogo e server. Usala per la demo del repository, senza pubblicare siti o generare animazioni.
---

# Demo mosse WEDOO

La demo è HTML, CSS e JavaScript senza build o dipendenze frontend. Deve funzionare aprendo `demo-moves/index.html` direttamente e tramite il server locale. Leggi `demo-moves/LEGGIMI.txt` per i comandi e verifica i file correnti, perché la demo può evolvere.

## Mappa dei file

- `index.html`: elenco dei personaggi.
- `personaggio.html?id=slug`: dettaglio delle animazioni.
- `app.js`: navigazione, ricerca, caricamento immagini e controlli canvas.
- `player-core.js`: tempo, avanzamento frame, loop e fps.
- `styles.css`: layout e comportamento responsive.
- `scripts/build-catalog.mjs`: genera `catalog.js` dai manifest in `animation/` e dalle anteprime in `PNG/`.
- `scripts/serve.mjs`: server locale con percorsi consentiti limitati alla demo e agli asset previsti.

Non editare manualmente `catalog.js` per modifiche permanenti ai dati: aggiorna il manifest o il generatore, poi ricostruisci il catalogo. Il catalogo incorpora i rettangoli dei frame per evitare fetch JSON incompatibili con `file://`.

## Comportamenti da preservare

- Anteprime dal PNG originale, spritesheet caricati all'apertura dell'animazione; il player mantiene le celle e i margini degli asset esportati.
- Base uniforme di 18 fps per idle, walk e victory, salvo nuova richiesta dell'utente. `savedSpeed` è informativo; il selettore applica il moltiplicatore scelto dall'utente alla base.
- Il loop usa soltanto i frame esportati; non ricostruisce i frame esclusi dal taglio e non applica una sequenza avanti-indietro.
- Mantieni accumulatori temporali, pausa, avanzamento singolo, riproduzione senza loop e caricamenti asincroni coerenti quando si cambia animazione.
- Il pulsante di chiusura della barra laterale serve al menu mobile aperto e resta nascosto su desktop. Controlla la specificità CSS: `.icon-button` può sovrascrivere regole meno specifiche di `.sidebar-close`.
- Preserva ricerca, navigazione da tastiera, gestione del focus, menu mobile e preferenze di movimento ridotto.
- Non aggiungere dipendenze esterne o richieste di rete senza una necessità della richiesta; l'uso locale offline è una caratteristica del progetto.

## Verifica

Per modifiche ai dati esegui `node demo-moves/scripts/build-catalog.mjs`. Per modifiche funzionali esegui `node --test demo-moves/scripts/verify.test.cjs` e gli altri test pertinenti presenti in `demo-moves/scripts/`.

Per vedere la demo usa `node demo-moves/scripts/serve.mjs` e l'indirizzo riportato dal server. Se gli strumenti browser sono disponibili, verifica le viste desktop e mobile coinvolte. Se manca l'accesso visivo, dichiaralo: i test dei dati non verificano il layout.

Non estendere il server all'intero repository per servire un nuovo asset. Aggiungi soltanto la cartella necessaria e mantieni la protezione contro percorsi esterni e file privati. Non pubblicare o fare deploy come conseguenza implicita di una modifica locale.
