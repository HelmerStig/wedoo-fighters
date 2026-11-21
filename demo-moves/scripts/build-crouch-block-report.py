"""Rebuild the crouching-block report from imported local assets."""
from pathlib import Path
from PIL import Image
import csv, html, json

root=Path(__file__).resolve().parents[2]
report=root/'demo-moves/reports'
poses=report/'crouch-block-poses'
poses.mkdir(parents=True,exist_ok=True)
manifest=json.loads((root/'animation/crouch-block-manifest.json').read_text(encoding='utf-8'))
rows=[];records=[]
for item in manifest['items']:
    slug=item['character'].lower();atlas=json.loads((root/item['atlas']).read_text(encoding='utf-8'))
    frames=list(atlas['frames'].values());peak=item['blockFrame'];count=len(frames)
    assert abs(sum(f['duration'] for f in frames)-500)<1e-6
    assert abs(sum(f['duration'] for f in frames[:peak])-250)<1e-6
    image=Image.open(root/item['png']).convert('RGBA');preview=Image.new('RGBA',(1536,512))
    for column,index in enumerate([0,peak,count-1]):
        f=frames[index]['frame'];preview.paste(image.crop((f['x'],f['y'],f['x']+512,f['y']+512)),(column*512,0))
    preview.save(poses/(slug+'.png'))
    name=html.escape(item['character']);source=html.escape(item['sourceAnimationName']);sid=html.escape(item['sourceSheetId'])
    rows.append(f'<tr><th><a href="../personaggio.html?id={slug}&amp;anim=crouch-block">{name}</a></th>'
        f'<td><img src="crouch-block-poses/{slug}.png" width="384" height="128" alt="{name}: guardia, parata, ritorno" loading="lazy"></td>'
        f'<td>{item["sourceStart"]}–{item["sourceEnd"]} / {item["sourceFrames"]}</td><td>{count}</td>'
        f'<td>{peak/0.25:g} / {(count-peak)/0.25:g}</td><td>250 ms / 500 ms</td>'
        f'<td>{source}<br><code>{sid}</code><br><a href="../../{item["atlas"]}">Atlas</a></td></tr>')
    records.append([item['character'],item['sourceSheetId'],item['sourceStart'],item['sourceEnd'],item['sourceFrames'],count,peak,250,500,'forward-reverse'])
with (report/'crouch-block-timing.csv').open('w',newline='',encoding='utf-8') as output:
    writer=csv.writer(output);writer.writerow(['character','sourceSheetId','sourceStart','sourceEnd','sourceFrames','playbackFrames','blockFrame','blockMs','durationMs','playback']);writer.writerows(records)
page='''<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Timing parata accovacciata · WEDOO Fighters</title><style>
body{background:#151c18;color:#e6eadf;font:15px/1.6 system-ui;margin:auto;max-width:1500px;padding:28px}a{color:#c6e588}table{border-collapse:collapse;width:100%}td,th{border:1px solid #465044;padding:10px;text-align:left}img{max-width:none;image-rendering:pixelated}code{overflow-wrap:anywhere}.table{overflow:auto}h1{line-height:1.2}
</style><main><a href="../mosse.html?move=crouch-block">Apri Parata accovacciata nella demo</a>
<h1>Timing parata accovacciata</h1><p>Aggiornato il 21 novembre 2026. Nove personaggi, ciclo completo <b>0,5 s</b>, posa finale di parata raggiunta a <b>0,25 s</b>.</p>
<p>Ogni intervallo salvato su AutoSprite viene eseguito avanti e poi al contrario, senza duplicare il vertice. Il ritorno finisce nella guardia accovacciata iniziale. Loop e CRT attivi nella demo. Oscar usa Crouch Block v2; gli altri Crouch Block. Preferite le versioni trimmed salvate.</p>
<p>I frame sorgente sono indicizzati da zero nello spritesheet selezionato. I due FPS indicano andata e ritorno: durate per frame adattate al numero di celle per mantenere entrambe le fasi a 250 ms. Scala, padding e pixel RGBA originali conservati.</p>
<p>Le immagini mostrano guardia / parata / guardia. Per Godot usare i frame e le durate degli atlas, mantenendo la guardia accovacciata come stato iniziale e finale. <a href="crouch-block-timing.csv">Scarica CSV</a>.</p>
<div class="table"><table><thead><tr><th>Personaggio</th><th>Guardia / parata / ritorno</th><th>Intervallo / frame sorgente</th><th>Frame riprodotti</th><th>FPS andata / ritorno</th><th>Parata / fine</th><th>Provenienza</th></tr></thead><tbody>ROWS</tbody></table></div></main></html>
'''
(report/'crouch-block-timing.html').write_text(page.replace('ROWS',''.join(rows)),encoding='utf-8')
print('Report parata accovacciata:',len(records),'personaggi')
