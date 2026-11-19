PROVA LOCALE COMFYUI — MARSAN

Risultato e valutazione: RISULTATO-PROVA.txt.
Anteprime e input portabili: prove/marsan-preparazione/.

Esperimento separato dalla demo: idle -> preparazione del pugno forte.
Non modifica animation/, PNG/ o i cataloghi, non usa crediti AutoSprite.
Le immagini originali rimangono 512x512 con lo stesso padding. Il modello
video riceve copie su grigio neutro: l'output non ha trasparenza nativa.

Hardware rilevato: RTX 2060 6 GB, RAM 32 GB. Runtime isolato e modelli in:
autosprite-agent/output/comfy-local-20261119/ (ignorato da Git).
Quella cartella NON segue un clone: conservare i modelli o riscaricarli.
Su un'altra postazione ricreare il venv: non copiarlo come ambiente portabile.
requirements-lock.txt registra le 86 versioni installate per questa prova.

Sorgente ufficiale ComfyUI, commit:
995456d0188ffb51032c28f41527cfa82d87d8a9
https://github.com/Comfy-Org/ComfyUI
Workflow di riferimento:
https://github.com/Comfy-Org/workflow_templates/blob/main/templates/wan2.1_fun_inp.json
Modelli ufficiali: Comfy-Org/Wan_2.1_ComfyUI_repackaged su Hugging Face:
wan2.1_fun_inp_1.3B_bf16, umt5_xxl_fp8_e4m3fn_scaled,
wan_2.1_vae, clip_vision_h (tutti .safetensors).

Python 3.12, PyTorch 2.8.0 CUDA 12.6, torchvision 0.23.0,
torchaudio 2.8.0 e requirements.txt del commit ComfyUI indicato.
Il workflow usa soltanto nodi nativi: nessun custom node.

Avvio, dopo installazione e download completati:
  autosprite-agent/output/comfy-local-20261119/venv/Scripts/python.exe comfy-local/start.py
In un secondo terminale dalla radice del repository:
  autosprite-agent/output/comfy-local-20261119/venv/Scripts/python.exe comfy-local/run-trial.py --whole-timeline

Server solo locale: http://127.0.0.1:8189
Prova: 17 frame 512x512, seed 20261119, 12 step, CFG 5, UniPC/simple.
Text encoder e VAE su CPU, diffusione FP16 con offload per limitare VRAM.
La variante --whole-timeline decodifica insieme tutti i 17 frame nel tempo,
mantenendo i tasselli spaziali per limitare la RAM. La prova iniziale senza
questo flag usa temporal_size=16 ed e' conservata per confronto.
Risultati grezzi: output/; GIF, MP4, spritesheet e tavola di confronto:
results-whole-timeline/ nel runtime (results/ per la prima variante).
workflow-api.json, references.json, job-receipt.json e history.json
registrano workflow, hash degli input, identificativo e risultato del lavoro.
Il runner riprende il job salvato senza inviarlo nuovamente.
Per una nuova prova usare una nuova cartella di lavoro e ricevuta separata.
verify-models.py confronta i pesi con gli SHA-256 ufficiali Hugging Face.

ComfyUI 0.46.0 segnala che CUDA 12.6 non abilita alcuni percorsi ottimizzati
disponibili con build CUDA 13+. Il test CUDA e il workflow funzionano, ma
questa configurazione non e' un benchmark delle massime prestazioni possibili.

Prima di adottarlo verificare identita', anatomia, pixel art, piedi fermi,
padding e coerenza temporale. Nessuna integrazione automatica nella demo.
