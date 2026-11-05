"""Report Parata alta e pose selezionate, dai manifest locali."""
import csv
import html
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT / 'demo-moves/reports'
POSES = REPORT / 'block-poses'
POSES.mkdir(parents=True, exist_ok=True)
def read(path):
    return json.loads((ROOT/path).read_text(encoding='utf-8-sig'))

manifest = read('animation/block-manifest.json')
timing = read('animation/block-timing.json')
roster = read('animation/manifest.json')
entries = {e['character']: e for e in timing['items']}
rows, records = [], []
for item in sorted(manifest['items'],key=lambda i:i['character'].lower()):
    entry = entries[item['character']]
    assert all(entry[k] == item[k] for k in ('sourceSheetId','sourceStart','sourceEnd'))
    peak, count, ready = entry['blockFrame'], item['frames'], timing['blockMs']
    assert 0 < peak < count and ready > 0
    fps, cycle = peak*1000/ready, count*ready/peak
    atlas = read(item['atlas'])
    frame = atlas['frames'][str(peak)]
    frame = frame.get('frame',frame)
    slug = item['character'].lower()
    with Image.open(ROOT/item['png']) as image:
        image.crop((frame['x'],frame['y'],frame['x']+frame['w'],frame['y']+frame['h'])).save(POSES/(slug+'.png'))
    note = entry.get('note','')
    records.append([item['character'],count,peak+1,item['sourceStart']+peak,ready,fps,round(cycle,3),note,item['sourceSheetId']])
    name = html.escape(item['character'])
    rows.append(f'<tr><th scope="row">{name}</th><td><img src="block-poses/{slug}.png" alt="Parata alta di {name}" width="128" height="128" loading="lazy"></td><td>{peak+1} / {count}</td><td><b>{ready} ms</b></td><td>{fps:g}</td><td>{cycle:.1f} ms</td><td>{html.escape(note)}</td></tr>')
with (REPORT/'block-timing.csv').open('w',encoding='utf-8-sig',newline='') as output:
    writer = csv.writer(output)
    writer.writerow(['Personaggio','Frame totali','Frame parata (da 1)','Frame sorgente (da 0)','Parata pronta ms','FPS a 1x','Ciclo ms','Note','Source sheet ID'])
    writer.writerows(records)
missing = sorted({i['character'] for i in roster['items']} - {i['character'] for i in manifest['items']})
page = '''<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Timing Parata alta - WEDOO Fighters</title><style>body{font:15px/1.5 system-ui;background:#141815;color:#eff3eb;margin:0;padding:32px}main{max-width:1500px;margin:auto}a,b{color:#ceef80}h1{font-size:30px}p{max-width:1000px;color:#bbc7b9}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border-bottom:1px solid #3b493c;padding:10px;text-align:left}thead th{background:#273329;white-space:nowrap}img{object-fit:contain;background:#cbd3ca;border-radius:8px;image-rendering:pixelated}td:last-child{min-width:200px}@media print{body{background:white;color:black;padding:0}b,a{color:black}thead th{background:#eee}img{width:80px;height:80px}th,td{padding:5px;font-size:10px}}</style></head><body><main><a href="../mosse.html?move=block">Apri Parata alta nella demo</a><h1>Timing Parata alta</h1>'''
page += f'<p>Aggiornamento: {html.escape(timing["updatedAt"])}. Controllati visivamente {len(records)} personaggi su {len(roster["items"])}. La posa selezionata di parata alta inizia a {timing["blockMs"]} ms (0,1 s) dalla partenza, a velocità 1x.</p>'
page += '<p>Ogni personaggio usa un framerate costante scelto in base al proprio spritesheet: FPS = indice del frame di parata (da 0) × 1000 / 100 ms. I numeri dei frame in tabella partono da 1. Tutti i frame esportati restano nel loro ordine, senza modificare scala o margini. La durata del ciclo varia con il numero di frame e il framerate; i moltiplicatori di velocità modificano anche il tempo di ingresso in parata. Le altre mosse conservano il loro timing.</p>'
page += '<p>“Riproduci tutte” riparte dal primo frame. Le pose scelte e i relativi ID sorgente sono registrati in animation/block-timing.json; dopo una sostituzione degli asset occorre rivedere la selezione.</p>'
page += f'<p>Personaggi senza Block disponibile ({len(missing)}): {html.escape(", ".join(missing)) or "nessuno"}.</p>'
page += '<p><a href="block-timing.csv" download>Scarica i timing in CSV</a></p><div class="table-wrap"><table><thead><tr><th>Personaggio</th><th>Posa scelta</th><th>Frame parata</th><th>Parata pronta</th><th>FPS a 1x</th><th>Ciclo</th><th>Note</th></tr></thead><tbody>'
page += ''.join(rows)+'</tbody></table></div></main></body></html>'
(REPORT/'block-timing.html').write_text(page,encoding='utf-8')
print(f'Report Parata alta: {len(records)} pose; {len(missing)} mancanti.')
