"""Build the Defeat timing report from the imported local assets."""
from pathlib import Path
from PIL import Image
import json,csv,html
root=Path(__file__).resolve().parents[2];report=root/'demo-moves/reports';poses=report/'defeat-poses';poses.mkdir(parents=True,exist_ok=True)
data=json.loads((root/'animation/defeat-manifest.json').read_text(encoding='utf-8'));total=data['durationMs'];rows=[];records=[]
for item in data['items']:
    slug=item['character'].lower();name=html.escape(item['character']);atlas=json.loads((root/item['atlas']).read_text());frames=list(atlas['frames'].values());count=len(frames)
    assert count==item['frames'] and abs(sum(f['duration'] for f in frames)-total)<1e-6
    source=Image.open(root/item['png']).convert('RGBA');preview=Image.new('RGBA',(512*3,512))
    for col,index in enumerate([0,count//2,count-1]):
        f=frames[index]['frame'];preview.paste(source.crop((f['x'],f['y'],f['x']+512,f['y']+512)),(col*512,0))
    preview.save(poses/(slug+'.png'))
    fps=count*1000/total
    rows.append(f'<tr><th><a href="../personaggio.html?id={slug}&amp;anim=defeat">{name}</a></th><td><img src="defeat-poses/{slug}.png" width="384" height="128" alt="{name}: inizio, meta e posa finale di sconfitta" loading="lazy"></td><td>{item["sourceStart"]}–{item["sourceEnd"]} / {item["sourceFrames"]}</td><td>{count}</td><td>{fps:g}</td><td>{total/count:.3f} ms</td><td>{total} ms</td><td><code>{html.escape(item["sourceSheetId"])}</code><br><a href="../../{item["atlas"]}">Atlas</a></td></tr>')
    records.append([item['character'],item['sourceSheetId'],item['sourceStart'],item['sourceEnd'],count,fps,total/count,total,'forward'])
with (report/'defeat-timing.csv').open('w',newline='',encoding='utf-8') as f:
    w=csv.writer(f);w.writerow(['character','sourceSheetId','sourceStart','sourceEnd','frames','fps','frameMs','durationMs','playback']);w.writerows(records)
page='''<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Timing Defeat · WEDOO Fighters</title><style>body{background:#151c18;color:#e6eadf;font:15px/1.6 system-ui;max-width:1500px;margin:auto;padding:28px}a{color:#c6e588}table{border-collapse:collapse;width:100%}td,th{border:1px solid #465044;padding:10px;text-align:left}img{image-rendering:pixelated;max-width:none}code{overflow-wrap:anywhere}.table{overflow:auto}</style><main>
<a href="../mosse.html?move=defeat">Apri Defeat nella demo</a><h1>Timing Defeat — Sconfitta</h1><p>Prima durata, 21 novembre 2026: <b>1000 ms (1 s)</b> per tutti i nove personaggi. Ogni sequenza contiene 49 frame, a 49 fps e circa 20,408 ms per frame.</p>
<p>Riproduzione solo avanti dalla guardia alla sconfitta a terra. Nessuna rialzata o inversione: con loop disattivato, il player mantiene l'ultimo frame. Il loop resta attivo per default nella demo, insieme al CRT, per facilitare il confronto.</p>
<p>Usati gli spritesheet completi salvati su AutoSprite: non sono disponibili versioni trimmed. PNG originali copiati byte per byte, celle 512x512, scala e padding conservati. Verificati tutti i pixel RGBA delle 441 celle. Le immagini mostrano inizio, meta e posa finale, senza imporre un impatto sincronizzato.</p>
<p>Per Godot usare l'animazione una sola volta e mantenere la posa finale nello stato defeat. Durate per frame negli atlas. <a href="defeat-timing.csv">Scarica CSV</a>.</p>
<div class="table"><table><thead><tr><th>Personaggio</th><th>Inizio / meta / fine</th><th>Intervallo / sorgente</th><th>Frame</th><th>FPS</th><th>Durata frame</th><th>Durata totale</th><th>Provenienza</th></tr></thead><tbody>ROWS</tbody></table></div></main></html>'''
(report/'defeat-timing.html').write_text(page.replace('ROWS',''.join(rows)),encoding='utf-8');print('Report Defeat:',len(data['items']),'personaggi')
