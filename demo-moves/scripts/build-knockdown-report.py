"""Build the joined knockdown/recovery report and boundary previews."""
from pathlib import Path
from PIL import Image
import json,csv,html
root=Path(__file__).resolve().parents[2];report=root/'demo-moves/reports';poses=report/'knockdown-poses';poses.mkdir(parents=True,exist_ok=True)
data=json.loads((root/'animation/knockdown-manifest.json').read_text(encoding='utf-8'));rows=[];records=[]
for item in data['items']:
    slug=item['character'].lower();name=html.escape(item['character']);atlas=json.loads((root/item['atlas']).read_text());frames=list(atlas['frames'].values());fall,recovery=item['sources']
    image=Image.open(root/item['png']).convert('RGBA');preview=Image.new('RGBA',(512*4,512))
    for col,index in enumerate([0,fall['endFrame'],recovery['startFrame'],len(frames)-1]):
        f=frames[index]['frame'];preview.paste(image.crop((f['x'],f['y'],f['x']+512,f['y']+512)),(col*512,0))
    preview.save(poses/(slug+'.png'))
    source_html=[]
    for p in item['sources']:
        source_html.append(f'{html.escape(p["sourceAnimationName"])}: {p["sourceStart"]}–{p["sourceEnd"]}<br><code>{html.escape(p["sourceSheetId"])}</code>')
        records.append([item['character'],p['id'],p['sourceSheetId'],p['sourceStart'],p['sourceEnd'],p['startFrame'],p['endFrame'],p['startMs'],p['motionMs'],p['holdMs'],data['durationMs']])
    if item.get('localEdits'):source_html.append('Ritocchi locali registrati: '+html.escape(item['localEdits']['note']))
    rows.append(f'<tr><th><a href="../personaggio.html?id={slug}&amp;anim=knockdown">{name}</a></th><td><img src="knockdown-poses/{slug}.png" width="512" height="128" alt="{name}: guardia, fine caduta, inizio rialzata, guardia finale" loading="lazy"></td><td>{fall["frames"]} + {recovery["frames"]}</td><td>{fall["frames"]/.5:g} / {recovery["frames"]/.8:g}</td><td>500 + 200 + 800 ms</td><td>{"<br><br>".join(source_html)}<br><a href="../../{item["atlas"]}">Atlas</a></td></tr>')
with (report/'knockdown-timing.csv').open('w',newline='',encoding='utf-8') as f:
    w=csv.writer(f);w.writerow(['character','phase','sourceSheetId','sourceStart','sourceEnd','playbackStartFrame','playbackEndFrame','phaseStartMs','motionMs','holdMs','totalMs']);w.writerows(records)
page='''<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Timing caduta e rialzata · WEDOO Fighters</title><style>body{background:#151c18;color:#e6eadf;font:15px/1.6 system-ui;max-width:1600px;margin:auto;padding:28px}a{color:#c6e588}table{border-collapse:collapse;width:100%}td,th{border:1px solid #465044;padding:10px;text-align:left}img{image-rendering:pixelated;max-width:none}code{overflow-wrap:anywhere}.table{overflow:auto}</style><main>
<a href="../mosse.html?move=knockdown">Apri Caduta e rialzata nella demo</a><h1>Caduta da spazzata → rialzata</h1>
<p>Prima taratura, 21 novembre 2026. Nove personaggi: <b>1,5 s complessivi</b>. Sweep Knockdown per 500 ms, posa finale mantenuta per altri 200 ms, poi Sweep Knockdown Recovery per 800 ms. La rialzata inizia a 700 ms.</p>
<p>98 fotogrammi per personaggio (49 + 49), riprodotti solo avanti, con loop e CRT della demo. Il fermo a terra aumenta la durata dell'ultimo frame della caduta, senza inserire fotogrammi generati o interpolazioni. La sequenza termina nella guardia in piedi.</p>
<p>Celle 512x512, scala e padding conservati. L'importazione originale e stata verificata pixel per pixel; gli eventuali ritocchi locali successivi sono indicati nelle righe interessate e nel manifest. Gli atlas conservano sia le impronte aggiornate sia quelle importate dei frame ritoccati. Le immagini mostrano il raccordo fra fine caduta e inizio rialzata. Gli atlas riportano durata, fase, ID dello spritesheet e indice sorgente per ogni frame: riutilizzabili in Godot anche come due stati distinti. Timing modificabile dopo una prova visiva.</p>
<p><a href="knockdown-timing.csv">Scarica CSV</a></p><div class="table"><table><thead><tr><th>Personaggio</th><th>Guardia / fine caduta / inizio rialzata / guardia</th><th>Frame caduta + rialzata</th><th>FPS caduta / rialzata</th><th>Caduta + fermo + rialzata</th><th>Provenienza</th></tr></thead><tbody>ROWS</tbody></table></div></main></html>'''
(report/'knockdown-timing.html').write_text(page.replace('ROWS',''.join(rows)),encoding='utf-8')
print('Report caduta e rialzata:',len(data['items']),'personaggi')
