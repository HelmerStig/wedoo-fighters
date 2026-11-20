"""Rigenera il report del Calcio potente dagli asset e dai timing locali."""
import csv
import html
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT / 'demo-moves/reports'
POSES = REPORT / 'strong-kick-poses'
POSES.mkdir(parents=True, exist_ok=True)
read = lambda p: json.loads((ROOT / p).read_text(encoding='utf-8-sig'))
manifest = read('animation/strong-kick-manifest.json')
timing = read('animation/strong-kick-timing.json')
entries = {e['character']: e for e in timing['items']}
total, impact = timing['durationMs'], timing['impactMs']
rows, records = [], []
for item in sorted(manifest['items'], key=lambda i: i['character'].lower()):
    entry = entries[item['character']]
    assert entry['sourceSheetId'] == item['sourceSheetId']
    assert (entry['sourceStart'], entry['sourceEnd']) == (item['sourceStart'], item['sourceEnd'])
    peak, count = entry['impactFrame'], item['frames']
    assert 0 < peak < count
    atlas = read(item['atlas'])
    assert atlas['meta']['source_sheet_id'] == item['sourceSheetId']
    assert abs(sum(f['duration'] for f in atlas['frames'].values()) - total) < 1e-8
    assert abs(sum(atlas['frames'][str(i)]['duration'] for i in range(peak)) - impact) < 1e-8
    slug = item['character'].lower()
    frame = atlas['frames'][str(peak)]['frame']
    with Image.open(ROOT / item['png']) as image:
        image.crop((frame['x'], frame['y'], frame['x'] + 512, frame['y'] + 512)).save(POSES / (slug + '.png'))
    before, after = impact / peak, (total - impact) / (count - peak)
    note = entry.get('note', '')
    if item.get('alignment', {}).get('type') == 'support-foot-lock':
        note += ' Piede d’appoggio stabilizzato tramite traslazioni intere dei frame, anche nel ritorno al contrario; nessun ridimensionamento o taglio.'
    name = html.escape(item['character'])
    source = html.escape(item['sourceSheetId'])
    rows.append(f'<tr><th scope="row"><a href="../personaggio.html?id={slug}&amp;anim=strong-kick">{name}</a></th>'
                f'<td><img src="strong-kick-poses/{slug}.png" alt="Massima estensione di {name}" width="128" height="128" loading="lazy"></td>'
                f'<td>{peak + 1} / {count}</td><td>{item["sourceStart"] + peak}</td>'
                f'<td><b>{impact} ms</b></td><td>{impact} / {total-impact} ms</td><td><b>{total} ms</b></td>'
                f'<td>{before:.3f} / {after:.3f} ms</td><td><code>{source}</code><p>{html.escape(note)}</p></td></tr>')
    records.append([item['character'], count, item['sourceStart'], item['sourceEnd'], peak + 1,
                    item['sourceStart'] + peak, impact, total, before, after, item['sourceAnimationName'],
                    item['sourceSheetId'], note])
with (REPORT / 'strong-kick-timing.csv').open('w', encoding='utf-8-sig', newline='') as output:
    writer = csv.writer(output)
    writer.writerow(['Personaggio', 'Frame totali', 'Source start', 'Source end', 'Frame impatto (da 1)',
                     'Frame sorgente (da 0)', 'Impatto ms', 'Totale ms', 'Durata frame prima ms',
                     'Durata frame dopo ms', 'Nome AutoSprite', 'Source sheet ID', 'Note'])
    writer.writerows(records)
page = '''<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Timing Calcio potente - WEDOO Fighters</title><style>
body{font:15px/1.5 system-ui;background:#141815;color:#eff3eb;margin:0;padding:32px}main{max-width:1500px;margin:auto}a,b{color:#ceef80}p{max-width:1100px;color:#bbc7b9}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border-bottom:1px solid #3b493c;padding:10px;text-align:left}thead th{background:#273329;white-space:nowrap}img{object-fit:contain;background:#cbd3ca;border-radius:8px;image-rendering:pixelated}code{font-size:11px;overflow-wrap:anywhere}td:last-child{min-width:220px}@media(max-width:600px){body{padding:16px}}@media print{body{background:white;color:black}a,b{color:black}thead th{background:#eee}}
</style></head><body><main><a href="../mosse.html?move=strong-kick">Apri Calcio potente nella demo</a><h1>Timing Calcio potente</h1>
'''
page += f'<p>Aggiornamento: {html.escape(timing["updatedAt"])}. Integrati {len(records)} personaggi. Il frame selezionato di massima estensione inizia a <b>{impact} ms ({str(impact / 1000).replace(".", ",")} s)</b> e il ciclo completo dura <b>{total} ms ({str(total / 1000).replace(".", ",")} s)</b> a velocità 1x.</p>'
page += f'<p>Preparazione: {impact} ms. Fase di impatto/recupero: {total-impact} ms. Le durate dei fotogrammi variano nelle due fasi per sincronizzare le pose. Quando la gamba resta estesa per più fotogrammi, il marcatore identifica una posa rappresentativa del tratto di massima estensione: le pose adiacenti possono essere simili.</p>'
page += '<p>Riproduzione avanti fino all’ultimo frame del taglio salvato, poi ritorno al contrario senza duplicare il vertice. Il frame di impatto è l’ultimo della fase di andata; il ritorno completa la guardia iniziale. Loop attivo per default e CRT condiviso.</p>'
page += '<p>Fonte AutoSprite: strong kick per tutti i nove personaggi. Le ultime versioni salvate e gli intervalli selezionati sono conservati, senza modificare scala, padding o pixel delle celle 512x512.</p>'
locked = [html.escape(item['character']) for item in manifest['items'] if item.get('alignment', {}).get('type') == 'support-foot-lock']
if locked:
    page += '<p>Piede d’appoggio stabilizzato direttamente nei PNG per ' + ', '.join(locked) + '. Traslazioni intere in X/Y mantengono la suola sullo stesso punto, sia in andata sia nel ritorno; nessun ridimensionamento o taglio della sagoma. La posizione nel canvas è adattata per contenere il calcio completo. <a href="../../animation/strong-kick-foot-lock.json">Offset e punti d’appoggio per Godot</a>.</p>'
page += f'<p>I frame della demo partono da 1 in tabella; gli indici sorgente partono da 0 nello sheet selezionato, anche quando già accorciato. FPS medio = numero di frame × 1000 / {total}; le durate effettive sono negli atlas e nel catalogo, da trasferire anche in Godot.</p>'
page += '<p><a href="strong-kick-timing.csv" download>Scarica CSV</a></p><div class="table-wrap"><table><thead><tr><th>Personaggio</th><th>Posa scelta</th><th>Frame demo</th><th>Frame sorgente</th><th>Impatto</th><th>Preparazione / fase successiva</th><th>Totale</th><th>Durata frame prima / dopo</th><th>Provenienza e note</th></tr></thead><tbody>'
page += ''.join(rows) + '</tbody></table></div></main></body></html>'
(REPORT / 'strong-kick-timing.html').write_text(page, encoding='utf-8')
print(f'Report Calcio potente: {len(records)} personaggi, impatto {impact} ms, totale {total} ms.')
