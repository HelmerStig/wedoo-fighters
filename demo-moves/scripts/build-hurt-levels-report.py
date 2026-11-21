"""Build the three Hurt timing reports from the imported manifests."""
from pathlib import Path
from PIL import Image
import csv,html,json
root=Path(__file__).resolve().parents[2]
report=root/'demo-moves/reports'
for move in ['hurt-medium','hurt-low','hurt-crouched']:
    data=json.loads((root/'animation'/(move+'-manifest.json')).read_text(encoding='utf-8'))
    poses=report/(move+'-poses');poses.mkdir(parents=True,exist_ok=True)
    rows=[];records=[];total=data['durationMs'];title=html.escape(data['name'])
    for item in data['items']:
        slug=item['character'].lower();name=html.escape(item['character'])
        atlas=json.loads((root/item['atlas']).read_text(encoding='utf-8'));frames=list(atlas['frames'].values());count=len(frames)
        assert count==item['frames'] and atlas['meta']['source_sheet_id']==item['sourceSheetId']
        assert abs(sum(f['duration'] for f in frames)-total)<1e-6
        image=Image.open(root/item['png']).convert('RGBA');preview=Image.new('RGBA',(1536,512))
        for column,index in enumerate([0,count//2,count-1]):
            f=frames[index]['frame'];preview.paste(image.crop((f['x'],f['y'],f['x']+512,f['y']+512)),(column*512,0))
        preview.save(poses/(slug+'.png'))
        fps=count*1000/total;sid=html.escape(item['sourceSheetId'])
        rows.append(f'<tr><th><a href="../personaggio.html?id={slug}&amp;anim={move}">{name}</a></th>'
            f'<td><img src="{move}-poses/{slug}.png" width="384" height="128" alt="{name}: inizio, meta, fine" loading="lazy"></td>'
            f'<td>{item["sourceStart"]}–{item["sourceEnd"]} / {item["sourceFrames"]}</td><td>{count}</td><td>{fps:g}</td>'
            f'<td>{total/count:.3f} ms</td><td>{total} ms</td><td>{html.escape(item["sourceAnimationName"])}<br><code>{sid}</code><br><a href="../../{item["atlas"]}">Atlas</a></td></tr>')
        records.append([item['character'],item['sourceSheetId'],item['sourceStart'],item['sourceEnd'],item['sourceFrames'],count,fps,total/count,total,'forward'])
    with (report/(move+'-timing.csv')).open('w',newline='',encoding='utf-8') as output:
        writer=csv.writer(output);writer.writerow(['character','sourceSheetId','sourceStart','sourceEnd','sourceFrames','frames','fps','frameMs','durationMs','playback']);writer.writerows(records)
    state='guardia accovacciata' if move=='hurt-crouched' else 'guardia in piedi'
    page=f'''<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Timing {title} · WEDOO Fighters</title>
<style>body{{background:#151c18;color:#e6eadf;font:15px/1.6 system-ui;max-width:1500px;margin:auto;padding:28px}}a{{color:#c6e588}}td,th{{border:1px solid #465044;padding:10px;text-align:left}}table{{border-collapse:collapse;width:100%}}img{{image-rendering:pixelated;max-width:none}}code{{overflow-wrap:anywhere}}.table{{overflow:auto}}</style>
<main><a href="../mosse.html?move={move}">Apri {title} nella demo</a><h1>Timing {title}</h1>
<p>Aggiornato il {data['updatedAt']}. Nove personaggi; ogni animazione dura <b>500 ms (0,5 s)</b> a velocita 1x. FPS e durata del singolo frame compensano il numero di celle di ciascun taglio.</p>
<p>Riproduzione solo avanti della reazione e del recupero presenti nello spritesheet. Le immagini mostrano inizio, meta e fine del taglio, senza indicare un impatto sincronizzato. Loop e CRT attivi nella demo. La posa di riferimento e la {state}.</p>
<p>Preferite le versioni trimmed salvate su AutoSprite. Indici sorgente da zero nello spritesheet selezionato; nessun offset dedotto dal parent. Pixel RGBA, dimensioni 512x512 e padding conservati senza ridimensionamenti. In Godot usare gli atlas e le durate per frame.</p>
<p><a href="{move}-timing.csv">Scarica CSV</a></p><div class="table"><table><thead><tr><th>Personaggio</th><th>Inizio / meta / fine</th><th>Intervallo / sorgente</th><th>Frame</th><th>FPS</th><th>Durata frame</th><th>Durata ciclo</th><th>Provenienza</th></tr></thead><tbody>{''.join(rows)}</tbody></table></div></main></html>'''
    (report/(move+'-timing.html')).write_text(page,encoding='utf-8')
    print('Report',data['name'],':',len(records),'personaggi,',total,'ms')
