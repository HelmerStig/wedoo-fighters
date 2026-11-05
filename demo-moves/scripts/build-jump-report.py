"""Genera report e pose degli apici del salto dai dati locali."""
import csv
import html
import json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
REPORT=ROOT/'demo-moves/reports'
POSES=REPORT/'jump-poses'
POSES.mkdir(parents=True,exist_ok=True)
def read(path):
    return json.loads((ROOT/path).read_text(encoding='utf-8-sig'))
manifest=read('animation/jump-manifest.json')
timing=read('animation/jump-timing.json')
roster=read('animation/manifest.json')
entries={i['character']:i for i in timing['items']}
rows,records=[],[]
ms,total=timing['apexMs'],timing['durationMs']
for item in sorted(manifest['items'],key=lambda i:i['character'].lower()):
    entry=entries[item['character']]
    assert all(item[k]==entry[k] for k in ('sourceSheetId','sourceStart','sourceEnd'))
    peak,count=entry['apexFrame'],item['frames']
    assert 0<peak<count and 0<ms<total
    up,down=peak*1000/ms,(count-peak)*1000/(total-ms)
    atlas=read(item['atlas'])
    frame=atlas['frames'][str(peak)]
    frame=frame.get('frame',frame)
    slug=item['character'].lower()
    with Image.open(ROOT/item['png']) as image:
        image.crop((frame['x'],frame['y'],frame['x']+frame['w'],frame['y']+frame['h'])).save(POSES/(slug+'.png'))
    note=entry.get('note','')
    records.append([item['character'],count,peak+1,item['sourceStart']+peak,ms,up,down,total,note,item['sourceSheetId']])
    name=html.escape(item['character'])
    rows.append(f'<tr><th scope="row">{name}</th><td><img src="jump-poses/{slug}.png" alt="Apice del salto di {name}" width="128" height="128" loading="lazy"></td><td>{peak+1} / {count}</td><td><b>{ms} ms</b></td><td>{up:g} / {down:g}</td><td>{total} ms</td><td>{html.escape(note)}</td></tr>')
with (REPORT/'jump-timing.csv').open('w',encoding='utf-8-sig',newline='') as output:
    writer=csv.writer(output)
    writer.writerow(['Personaggio','Frame totali','Frame apice (da 1)','Frame sorgente (da 0)','Apice ms','FPS fino all apice','FPS da apice a fine ciclo','Ciclo ms','Note','Source sheet ID'])
    writer.writerows(records)
missing=sorted({i['character'] for i in roster['items']}-{i['character'] for i in manifest['items']})
page='''<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Timing Salto - WEDOO Fighters</title><style>body{font:15px/1.5 system-ui;background:#141815;color:#eff3eb;margin:0;padding:32px}main{max-width:1500px;margin:auto}a,b{color:#ceef80}h1{font-size:30px}p{max-width:1000px;color:#bbc7b9}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border-bottom:1px solid #3b493c;padding:10px;text-align:left}thead th{background:#273329;white-space:nowrap}img{object-fit:contain;background:#cbd3ca;border-radius:8px;image-rendering:pixelated}td:last-child{min-width:200px}@media print{body{background:white;color:black;padding:0}b,a{color:black}thead th{background:#eee}img{width:80px;height:80px}th,td{padding:5px;font-size:10px}}</style></head><body><main><a href="../mosse.html?move=jump">Apri Salto nella demo</a><h1>Timing Salto</h1>'''
page+=f'<p>Aggiornamento: {html.escape(timing["updatedAt"])}. Controllati visivamente {len(records)} personaggi su {len(roster["items"])}. Il frame selezionato di massima altezza inizia a {ms} ms (0,5 s) dalla partenza, con ciclo comune di {total} ms a velocità 1x.</p>'
page+='<p>Salita e discesa hanno framerate adattati a ciascuno spritesheet: FPS prima dell’apice = indice del frame apice (da 0) × 1000 / 500 ms; FPS da apice a fine ciclo = frame rimanenti × 1000 / 500 ms. Il frame apice è incluso nella seconda fase. Tutti i frame restano in ordine e i pixel non vengono modificati. I numeri in tabella partono da 1. Un plateau può includere pose di quota equivalente prima o dopo il marcatore; nei casi di taglio al bordo l’apice è stimato dal corpo visibile.</p>'
page+='<p>“Riproduci tutte” riparte dal primo frame e mantiene l’allineamento anche nei cicli successivi e con caricamento progressivo. Il tempo di 500 ms vale a 1x; i moltiplicatori modificano anche il tempo dell’apice. Le selezioni sono legate agli ID sorgente in animation/jump-timing.json: sostituendo uno spritesheet occorre rivederne l’apice.</p>'
page+=f'<p>Personaggi senza salto disponibile ({len(missing)}): {html.escape(", ".join(missing)) or "nessuno"}.</p>'
page+='<p><a href="jump-timing.csv" download>Scarica i timing in CSV</a></p><div class="table-wrap"><table><thead><tr><th>Personaggio</th><th>Apice scelto</th><th>Frame apice</th><th>Apice a</th><th>FPS salita / seconda fase</th><th>Ciclo</th><th>Note</th></tr></thead><tbody>'
page+=''.join(rows)+'</tbody></table></div></main></body></html>'
(REPORT/'jump-timing.html').write_text(page,encoding='utf-8')
print(f'Report Salto: {len(records)} pose; {len(missing)} mancanti.')
