"""Export timing evidence from the selected Medium Kick Low assets."""
from pathlib import Path
from PIL import Image
import csv, html, json

ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT / 'demo-moves/reports'
POSES = REPORT / 'medium-kick-low-poses'
POSES.mkdir(exist_ok=True)
read = lambda p: json.loads((ROOT / p).read_text(encoding='utf-8-sig'))
m = read('animation/medium-kick-low-manifest.json')
t = read('animation/medium-kick-low-timing.json')
rows, records = [], []
for item in m['items']:
    timing = next(x for x in t['items'] if x['character'] == item['character'])
    assert timing['sourceSheetId'] == item['sourceSheetId']
    peak, count = timing['impactFrame'], item['frames']
    f = read(item['atlas'])['frames'][str(peak)]['frame']
    im = Image.open(ROOT / item['png']).convert('RGBA')
    slug = item['character'].lower()
    im.crop((f['x'], f['y'], f['x'] + 512, f['y'] + 512)).save(POSES / (slug + '.png'))
    before = t['impactMs'] / peak
    after = (t['durationMs'] - t['impactMs']) / (count - peak)
    records.append([item['character'], count, peak + 1, t['impactMs'], t['durationMs'], before, after, item['sourceSheetId'], item['sourceStart'], item['sourceEnd'], 'forward'])
    rows.append(f'<tr><th>{html.escape(item["character"])}</th><td><img width="160" height="160" src="medium-kick-low-poses/{slug}.png" alt="Posa di impatto"></td><td>{peak + 1} / {count}</td><td>{before:.3f} / {after:.3f}</td><td>{item["sourceStart"]}–{item["sourceEnd"]}</td></tr>')
with (REPORT / 'medium-kick-low-timing.csv').open('w', encoding='utf-8-sig', newline='') as out:
    writer = csv.writer(out)
    writer.writerow(['Personaggio', 'Frame totali', 'Impatto frame da 1', 'Impatto ms', 'Durata ms', 'Frame prima ms', 'Frame dopo ms', 'Source sheet ID', 'Source start da 0', 'Source end da 0', 'Playback'])
    writer.writerows(records)
page = '''<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Calcio medio basso · Timing</title><style>body{font:16px/1.5 system-ui;background:#151d2a;color:#eef3f8;margin:24px}main{max-width:1100px;margin:auto}a{color:#9cdbff}table{width:100%;border-collapse:collapse}td,th{padding:10px;text-align:left;border-bottom:1px solid #536175}img{background:#45536a;image-rendering:pixelated}section{overflow:auto}</style><main><a href="../mosse.html?move=medium-kick-low">Apri Calcio medio basso</a><h1>Calcio medio basso · Timing</h1><p>23 novembre 2026. Nove personaggi. La posa scelta di massima estensione inizia a <b>0,50 s</b>; il ciclo completo termina a <b>0,80 s</b> a velocità 1×, come il calcio medio. Le durate dei frame variano prima e dopo l’impatto.</p><p>Tutti gli spritesheet includono il ritorno in guardia accovacciata: riproduzione <b>solo in avanti</b>, con loop attivo per default. Applicati una sola volta i tagli salvati su AutoSprite: da 30 a 40 frame per personaggio. La velocita remota salvata (2x) resta informativa e non moltiplica il timing della demo. Nessun ritaglio aggiuntivo dei margini, nessuna variazione di scala. Le pose sul plateau possono differire di pochi pixel.</p><p>CELLCOUNT celle RGBA confrontate con i file scaricati prima di eventuali ritocchi locali. Gli interventi di pulizia sono registrati nei manifest e negli atlas, preservando gli hash d’importazione. Nessuna generazione AutoSprite, 0 crediti.</p><p>Controllo alpha dei CELLCOUNT frame: spazi naturali tra gli arti, scie e polvere conservati. La trasparenza sorgente sulla punta della scarpa di Alberto è stata corretta localmente nei frame 12–24 (da 1): 13 fotogrammi, 11.772 pixel. La ricostruzione è limitata alle maschere verificate, con tutti i pixel esterni invariati. <a href="medium-kick-low-alberto-foot-repair.png">Confronto prima/dopo e alpha</a>. <a href="medium-kick-low-alpha.png">Confronto su bianco, nero e canale alpha</a>.</p><p><a href="medium-kick-low-timing.csv">Timing CSV</a></p><section><table><thead><tr><th>Personaggio</th><th>Impatto</th><th>Frame da 1</th><th>Durata frame prima / dopo (ms)</th><th>Intervallo sorgente da 0</th></tr></thead><tbody>''' + ''.join(rows) + '</tbody></table></section></main></html>'
page = page.replace('CELLCOUNT', str(sum(item['frames'] for item in m['items'])))
(REPORT / 'medium-kick-low-timing.html').write_text(page, encoding='utf-8')
print('Medium Kick Low: report, nove pose e CSV aggiornati.')
