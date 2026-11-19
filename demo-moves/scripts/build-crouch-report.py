"""Build the uniform Crouch timing report from the imported local assets."""
import csv
import html
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT / 'demo-moves/reports'
manifest = json.loads((ROOT / 'animation/crouch-manifest.json').read_text(encoding='utf-8'))
total = manifest['durationMs']
poses = REPORT / 'crouch-poses'
poses.mkdir(parents=True, exist_ok=True)
rows, records = [], []
for item in sorted(manifest['items'], key=lambda row: row['character'].lower()):
    slug = item['character'].lower()
    atlas = json.loads((ROOT / item['atlas']).read_text(encoding='utf-8'))
    frames = list(atlas['frames'].values())
    count = item['frames']
    assert len(frames) == count
    assert atlas['meta']['source_sheet_id'] == item['sourceSheetId']
    assert abs(sum(frame['duration'] for frame in frames) - total) < 1e-6
    preview = Image.new('RGBA', (3 * 512, 512))
    with Image.open(ROOT / item['png']) as source:
        for column, index in enumerate([0, count // 2, count - 1]):
            f = frames[index]['frame']
            preview.paste(source.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])), (column * 512, 0))
    preview.save(poses / (slug + '.png'))
    fps = count * 1000 / total
    name, sid = html.escape(item['character']), html.escape(item['sourceSheetId'])
    note = html.escape(item.get('note', ''))
    rows.append(f'<tr><th scope="row"><a href="../personaggio.html?id={slug}&amp;anim=crouch">{name}</a></th>'
                f'<td><img src="crouch-poses/{slug}.png" width="384" height="128" alt="{name}: inizio, meta e fine di Crouch" loading="lazy"></td>'
                f'<td>{count} / {item["sourceFrames"]}</td><td>{fps:g}</td><td>{total / count:.3f} ms</td>'
                f'<td><b>{total} ms</b></td><td><a href="../../{item["atlas"]}">Atlas</a><br><code>{sid}</code><p>{note}</p></td></tr>')
    records.append([item['character'], count, item['sourceFrames'], item['sourceStart'], item['sourceEnd'], fps, total / count, total, 'forward', item['sourceSheetId']])
with (REPORT / 'crouch-timing.csv').open('w', newline='', encoding='utf-8-sig') as output:
    writer = csv.writer(output)
    writer.writerow(['personaggio', 'frame_esportati', 'frame_sheet_sorgente', 'source_start', 'source_end', 'fps', 'durata_frame_ms', 'durata_totale_ms', 'playback', 'source_sheet_id'])
    writer.writerows(records)
page = '''<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Timing Crouch - WEDOO Fighters</title><style>
body{font:15px/1.5 system-ui;background:#141815;color:#eff3eb;margin:0;padding:32px}main{max-width:1500px;margin:auto}a,b{color:#ceef80}p{color:#bbc7b9}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border-bottom:1px solid #3b493c;padding:10px;text-align:left}thead th{background:#273329;white-space:nowrap}img{background:#cbd3ca;border-radius:8px;image-rendering:pixelated}code{font-size:11px;overflow-wrap:anywhere}@media(max-width:600px){body{padding:16px}}
</style></head><body><main><a href="../mosse.html?move=crouch">Apri Crouch nella demo</a><h1>Timing Crouch</h1>
<p>Aggiornamento: DATE. Integrati COUNT personaggi. Ogni sequenza dura <b>250 ms (0,25 s)</b> a velocita 1x, con durata uniforme per fotogramma. I diversi FPS compensano il numero di frame di ciascuno spritesheet.</p>
<p>Riproduzione solo avanti dalla guardia alla posa accovacciata. Disattivando il loop, il player si ferma sulla posa finale. Le tre immagini mostrano inizio, meta e fine della sequenza. Il loop rimane attivo per default nella demo.</p>
<p>Celle 512x512, scala e padding conservati. Versioni salvate accorciate e intervalli di fotogrammi selezionati su AutoSprite, senza inferire offset nello spritesheet completo da 49 frame.</p>
<p><a href="crouch-timing.csv">Scarica CSV</a>. In Godot questa sequenza rappresenta la discesa; la posa finale puo essere mantenuta nello stato crouch.</p>
<div class="table-wrap"><table><thead><tr><th>Personaggio</th><th>Inizio / meta / fine</th><th>Frame esportati / sorgente</th><th>FPS</th><th>Durata frame</th><th>Durata totale</th><th>Provenienza</th></tr></thead><tbody>ROWS</tbody></table></div></main></body></html>
'''
page = page.replace('DATE', manifest['updatedAt']).replace('COUNT', str(len(records))).replace('ROWS', ''.join(rows))
(REPORT / 'crouch-timing.html').write_text(page, encoding='utf-8')
print('Report Crouch aggiornato:', len(records), 'personaggi,', total, 'ms')
