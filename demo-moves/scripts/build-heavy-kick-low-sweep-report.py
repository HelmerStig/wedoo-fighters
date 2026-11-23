"""Build timing and selected-pose evidence from the current sweep assets."""
from pathlib import Path
from PIL import Image
import csv, html, json

ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT / 'demo-moves/reports'
POSES = REPORT / 'heavy-kick-low-sweep-poses'
POSES.mkdir(exist_ok=True)
read = lambda p: json.loads((ROOT / p).read_text(encoding='utf-8-sig'))
manifest = read('animation/heavy-kick-low-sweep-manifest.json')
timing = read('animation/heavy-kick-low-sweep-timing.json')
records, rows = [], []
for item in manifest['items']:
    entry = next(x for x in timing['items'] if x['character'] == item['character'])
    assert entry['sourceSheetId'] == item['sourceSheetId']
    peak, count = entry['impactFrame'], item['frames']
    f = read(item['atlas'])['frames'][str(peak)]['frame']
    image = Image.open(ROOT / item['png']).convert('RGBA')
    slug = item['character'].lower()
    image.crop((f['x'], f['y'], f['x'] + 512, f['y'] + 512)).save(POSES / (slug + '.png'))
    before = timing['impactMs'] / peak
    after = (timing['durationMs'] - timing['impactMs']) / (count - peak)
    records.append([item['character'], count, item['sourceFrames'], peak + 1, entry['impactSourceFrame'], timing['impactMs'], timing['durationMs'], before, after, item['sourceSheetId'], item['sourceStart'], item['sourceEnd'], 'forward'])
    rows.append(f'<tr><th>{html.escape(item["character"])}</th><td><img width="160" height="160" loading="lazy" src="heavy-kick-low-sweep-poses/{slug}.png" alt="Impatto della spazzata"></td><td>{peak + 1} / {count}</td><td>{item["sourceStart"]}–{item["sourceEnd"]} / {item["sourceFrames"]}</td><td>{before:.3f} / {after:.3f} ms</td><td><code>{item["sourceSheetId"]}</code></td></tr>')
with (REPORT / 'heavy-kick-low-sweep-timing.csv').open('w', encoding='utf-8-sig', newline='') as output:
    writer = csv.writer(output)
    writer.writerow(['Personaggio', 'Frame riprodotti', 'Frame foglio scaricato', 'Impatto da 1', 'Impatto sorgente da 0', 'Impatto ms', 'Totale ms', 'Durata frame prima ms', 'Durata frame dopo ms', 'Source sheet ID', 'Inizio sorgente da 0', 'Fine sorgente da 0', 'Playback'])
    writer.writerows(records)
count = sum(item['frames'] for item in manifest['items'])
page = '''<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Calcio potente basso (spazzata) · Timing</title><style>body{font:16px/1.5 system-ui;background:#151d2a;color:#eef3f8;margin:24px}main{max-width:1350px;margin:auto}a{color:#9cdbff}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #536175;text-align:left}img{background:#45536a;image-rendering:pixelated}section{overflow:auto}code{font-size:11px;overflow-wrap:anywhere}</style><main><a href="../mosse.html?move=heavy-kick-low-sweep">Apri la spazzata nella demo</a><h1>Calcio potente basso (spazzata) · Timing</h1><p>23 novembre 2026. Integrati i nove personaggi richiesti da <b>Heavy Kick Low Sweep</b> su AutoSprite. La prima passata principale verso l’avversario è marcata a <b>0,50 s</b>; il ciclo completo termina a <b>0,90 s</b> a velocità 1×, come il calcio potente.</p><p>Tutti i fogli contengono già rotazione e recupero: riproduzione <b>solo avanti</b>, con loop attivo per default. Le ulteriori pose estese durante il giro completo restano nel sorgente. Il marcatore scelto non implica l’aggiunta di altri colpi, danni o hitbox nella demo.</p><p>Intervalli salvati applicati una sola volta, senza recuperare i frame esclusi. Celle 512×512, scala e padding originali. La velocità remota salvata (2×) è conservata come metadata e non moltiplica il timing sincronizzato.</p><p>COUNT celle RGBA verificate contro i sorgenti scaricati. Nessuna generazione AutoSprite: 0 crediti. Le durate variabili indicano quando inizia il frame scelto e mantengono l’ordine originale.</p><p><a href="heavy-kick-low-sweep-alpha.png">Confronto alpha dei nove personaggi</a> · <a href="heavy-kick-low-sweep-timing.csv">Timing CSV</a> · <a href="../../animation/heavy-kick-low-sweep-manifest.json">Manifest</a> · <a href="../../animation/heavy-kick-low-sweep-timing.json">Timing JSON</a></p><p>Il controllo alpha distingue spazi naturali tra arti, bordi sfumati, scie e polvere dai difetti. I contatori automatici servono a selezionare i casi da verificare visivamente; non dimostrano da soli l’assenza di ogni artefatto.</p><p><b>Difetto sorgente individuato:</b> Peppo presenta piccoli riempimenti bianchi tra braccia e corpo nei frame 3, 9 e 15 (da 1). Sono distinti dalle scie e restano da correggere. <a href="heavy-kick-low-sweep-peppo-white.png">Ingrandimenti</a> ? <a href="../../animation/heavy-kick-low-sweep-alpha-review.json">Esito del controllo</a>. Non sono emersi ulteriori difetti evidenti di alpha o riempimenti bianchi nei candidati esaminati.</p><p><b>Limite del sorgente di Oscar:</b> nel frame 11 (da 1), il piede del calcio raggiunge e supera il bordo destro della cella 512x512, risultando tagliato. Il file importato conserva scala e padding originali; non e stato ricentrato o ridimensionato. <a href="heavy-kick-low-sweep-oscar-edge.png">Fotogramma originale</a>.</p><section><table><thead><tr><th>Personaggio</th><th>Posa d’impatto</th><th>Frame da 1</th><th>Intervallo / frame sorgente da 0</th><th>Durata passo prima / dopo</th><th>Sorgente</th></tr></thead><tbody>''' + ''.join(rows) + '</tbody></table></section></main></html>'
page = page.replace('COUNT', str(count))
(REPORT / 'heavy-kick-low-sweep-timing.html').write_text(page, encoding='utf-8')
print(f'Spazzata: nove pose, {count} frame, impatto 500 ms e ciclo 900 ms.')
