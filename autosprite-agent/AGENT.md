# Uso dell'agente AutoSprite

Quando viene chiesta un'animazione, traduci personaggio, azione e impostazioni in un
job JSON compatibile con `jobs/elisa-punch-pro.json`, quindi usa `cli.mjs`.
Leggi README.md per comandi e limiti. Non serve avviare ComfyUI o usare REA.

- Leggi `characters` per risolvere il nome nel conto della chiave attuale.
  Elisa ? stata ricaricata nel conto API e assegnata a WEDOO; il job usa il nuovo ID.
- Usa `catalog` per i preset, `custom` per una mossa descritta dall'utente.
- Per movimenti controllati preferisci l'impostazione di qualità richiesta;
  Pro 2s corrisponde al vecchio Turbo. Le prove precedenti non identificano i
  modelli proprietari di AutoSprite.
- `plan` non usa rete né crediti. `generate` consuma crediti: eseguilo quando
  l'utente ha richiesto la generazione concreta, comunicando la stima. Non
  avviare generazioni come semplice test del software.
- Leggi la chiave dalla variabile di ambiente; non mostrarla o salvarla.
- Usa una cartella output diversa per ogni invio. Dopo errori usa `resume`,
  `jobs` e `sheets`: non reinviare automaticamente una generazione.
- Riferisci fallimenti parziali e costo effettivo `creditsUsed`. Dopo il download
  controlla anche visivamente la mossa prima di dichiararla utilizzabile.

La verifica iniziale ha usato solo letture e download di un risultato esistente;
la creazione di una nuova animazione tramite questa versione resta da verificare
con una richiesta reale dell'utente.
