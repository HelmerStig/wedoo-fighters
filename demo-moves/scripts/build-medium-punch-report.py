"""Build the medium punch timing report from committed manifests and atlas data."""
import csv
import html
import json
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT / 'demo-moves/reports'
POSES = REPORT / 'medium-punch-poses'
POSES.mkdir(parents=True, exist_ok=True)
def read(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8-sig'))
manifest = read('animation/medium-punch-manifest.json')
timing = read('animation/medium-punch-timing.json')
roster = read('animation/manifest.json')
entries = {i['character']: i for i in timing['items']}
total, impact = timing['durationMs'], timing['impactMs']
def seconds(ms):
    return f'{ms / 1000:.2f}'.replace('.', ',')
rows, records = [], []
for item in sorted(manifest['items'], key=lambda i:i['character'].lower()):
    entry = entries[item['character']]
    assert entry['sourceSheetId'] == item['sourceSheetId']
    assert (entry['sourceStart'],entry['sourceEnd']) == (item['sourceStart'],item['sourceEnd'])
    assert entry['playback'] == item['playback']
    peak, count = entry['impactFrame'], item['frames']
    assert 0 < peak < item['sourceFrames']
    atlas = read(item['atlas'])
    assert len(atlas['frames']) == count
    cell = atlas['frames'][str(peak)]
    assert cell['source_frame'] == entry['impactSourceFrame']
    assert sum(atlas['frames'][str(i)]['duration'] for i in range(peak)) == impact or abs(sum(atlas['frames'][str(i)]['duration'] for i in range(peak))-impact)<1e-8
    assert abs(sum(f['duration'] for f in atlas['frames'].values())-total)<1e-8
    frame=cell['frame']
    slug=item['character'].lower()
    with Image.open(ROOT/item['png']) as image:
        image.crop((frame['x'],frame['y'],frame['x']+frame['w'],frame['y']+frame['h'])).save(POSES/(slug+'.png'))
    mode='Solo avanti' if item['playback']=='forward' else 'Avanti e indietro'
    before, after = impact/peak, (total-impact)/(count-peak)
    note=entry.get('note','')
    records.append([item['character'],item['sourceSheetFrames'],item['sourceFrames'],count,mode,peak+1,entry['impactSourceFrame'],impact,total-impact,total,round(before,6),round(after,6),item['sourceStart'],item['sourceEnd'],item['sourceSheetId'],note])
    name=html.escape(item['character'])
    rows.append(f'<tr><th scope="row"><a href="../personaggio.html?id={slug}">{name}</a></th><td><img src="medium-punch-poses/{slug}.png" alt="Impatto principale di {name}" width="128" height="128" loading="lazy"></td><td>{item["sourceFrames"]} / {count}</td><td>{mode}</td><td>{peak+1} / {count}<br>sorgente {entry["impactSourceFrame"]}</td><td><b>{impact} ms</b></td><td>{total-impact} ms</td><td>{total} ms</td><td>{before:.3f} / {after:.3f} ms</td><td>{html.escape(note)}</td><td><a href="../../{item["atlas"]}">Atlas e sequenza</a><br><code>{item["sourceSheetId"]}</code></td></tr>')
with (REPORT/'medium-punch-timing.csv').open('w',encoding='utf-8-sig',newline='') as out:
    writer=csv.writer(out)
    writer.writerow(['Personaggio','Frame foglio scaricato','Frame sorgente utilizzati','Frame riprodotti','Riproduzione','Frame impatto sequenza (da 1)','Frame impatto sorgente (da 0)','Impatto ms','Fase successiva ms','Totale ms','Durata frame prima ms','Durata frame dopo ms','Inizio sorgente (da 0)','Fine sorgente (da 0)','Source sheet ID','Note'])
    writer.writerows(records)
available={item['character'] for item in manifest['items']}
missing=[item['character'] for item in roster['items'] if item['character'] not in available]
page='''<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Timing Pugno medio - WEDOO Fighters</title><style>body{font:15px/1.5 system-ui;background:#141815;color:#eff3eb;margin:0;padding:32px}main{max-width:1700px;margin:auto}a{color:#ceef80}h1{font-size:30px}p{max-width:1100px;color:#bbc7b9}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border-bottom:1px solid #3b493c;padding:10px;text-align:left}thead th{background:#273329;white-space:nowrap}img{object-fit:contain;background:#cbd3ca;border-radius:8px;image-rendering:pixelated}td:nth-last-child(2){min-width:270px}code{font-size:11px;overflow-wrap:anywhere}b{color:#ceef80}@media(max-width:600px){body{padding:16px}h1{font-size:25px}}@media print{body{background:white;color:black;padding:0}b,a,p{color:black}thead th{background:#eee}img{width:80px;height:80px}th,td{padding:5px;font-size:10px}}</style><main><a href="../mosse.html?move=medium-punch">Apri Pugno medio nella demo</a><h1>Timing Pugno medio</h1>'''
page+=f'<p>Aggiornamento: {html.escape(timing["updatedAt"])}. Integrati {len(records)} personaggi su {len(roster["items"])}. A velocita 1x il frame scelto di impatto principale inizia esattamente a <b>{impact} ms ({seconds(impact)} s)</b>; il ciclo completo termina a <b>{total} ms ({seconds(total)} s)</b>. La fase successiva all\'impatto dura {total-impact} ms ({seconds(total-impact)} s).</p>'
page+='<p>Alberto, Fabio Clara, Pippo, Peppo, Oscar, Elisa, Fra Tavarone e Marsan usano l\'andata seguita dagli stessi frame al contrario, senza raddoppiare il frame di inversione. L\'ultimo frame del recupero e la guardia iniziale. Sboz usa solo la sequenza sorgente in avanti, che contiene gia il recupero.</p>'
page+='<p>Gli atlas referenziano le celle del PNG originale anche nel ritorno: i pixel non sono duplicati, ridimensionati o ricentrati. Le durate variabili sono incorporate nel catalogo offline e negli atlas, utilizzabili come riferimento per Godot. Gli fps medi non descrivono le due fasi: la tabella indica i millisecondi effettivi di ogni passo prima e dopo l\'impatto.</p>'
page+='<p>La colonna Frame distingue le celle sorgente utilizzate dai passi della sequenza riprodotta, che includono il ritorno. I frame di sequenza in tabella partono da 1; gli indici sorgente partono da 0 e si riferiscono al foglio gia accorciato scaricato da AutoSprite. Nessun vecchio taglio e stato applicato una seconda volta. Per Marsan e escluso solo il frame isolato finale in guardia, indicato nelle note.</p>'
page+='<p>Il marcatore riguarda la posa scelta del colpo principale. Eventuali estensioni preliminari con altri bracci, scie grafiche e pose estese mantenute presenti negli asset approvati sono conservate e segnalate nelle note. Per questo alcune pose estese adiacenti possono comparire prima o dopo il marcatore. Riproduci tutte allinea le nove schede; modificare la velocita scala impatto e durata nella stessa proporzione.</p>'
page+=f'<p>Personaggi senza Pugno medio importato ({len(missing)}): '+', '.join(html.escape(x) for x in missing)+'.</p>'
page+='<p><a href="medium-punch-timing.csv" download>Scarica il report CSV</a> · <a href="../../animation/medium-punch-timing.json">Timing JSON</a> · <a href="../../animation/medium-punch-manifest.json">Manifest e provenienza</a></p><div class="table-wrap"><table><thead><tr><th>Personaggio</th><th>Posa scelta</th><th>Frame sorgente / riprodotti</th><th>Riproduzione</th><th>Frame impatto</th><th>Impatto</th><th>Fase successiva</th><th>Ciclo</th><th>Durata passo prima / dopo</th><th>Note</th><th>Asset</th></tr></thead><tbody>'
page+=''.join(rows)+'</tbody></table></div></main></html>'
(REPORT/'medium-punch-timing.html').write_text(page,encoding='utf-8')
print(f'Report Pugno medio: {len(records)} personaggi, impatto {impact} ms, ciclo {total} ms, {len(missing)} non importati.')

