"""Report for Hurt in Jump followed by the existing local recovery segment."""
from pathlib import Path
from PIL import Image
import json,csv,html
root=Path(__file__).resolve().parents[2];report=root/'demo-moves/reports';poses=report/'hurt-in-jump-poses';poses.mkdir(parents=True,exist_ok=True)
data=json.loads((root/'animation/hurt-in-jump-manifest.json').read_text(encoding='utf-8'));rows=[];records=[]
for item in data['items']:
    slug=item['character'].lower();name=html.escape(item['character']);atlas=json.loads((root/item['atlas']).read_text());frames=list(atlas['frames'].values());fall,recovery=item['sources']
    images=[Image.open(root/s['png']).convert('RGBA') for s in item['sheets']];preview=Image.new('RGBA',(512*4,512))
    for col,index in enumerate([0,fall['endFrame'],recovery['startFrame'],len(frames)-1]):
        entry=frames[index];f=entry['frame'];preview.paste(images[entry['sheet']].crop((f['x'],f['y'],f['x']+512,f['y']+512)),(col*512,0))
    preview.save(poses/(slug+'.png'));source_html=[]
    for p in item['sources']:
        source_html.append(f'{html.escape(p["sourceAnimationName"])}: {p["sourceStart"]}–{p["sourceEnd"]}<br><code>{html.escape(p["sourceSheetId"])}</code>')
        records.append([item['character'],p['id'],p['sourceSheetId'],p['sourceStart'],p['sourceEnd'],p['startFrame'],p['endFrame'],p['startMs'],p['motionMs'],p['holdMs'],data['durationMs']])
    local=recovery['localSegment'];note='Rialzata riutilizzata dalla sequenza locale caduta/rialzata.'
    if local.get('localEdits'):note+=' Conservati i ritocchi locali registrati.'
    source_html.append(note)
    rows.append(f'<tr><th><a href="../personaggio.html?id={slug}&amp;anim=hurt-in-jump">{name}</a></th><td><img src="hurt-in-jump-poses/{slug}.png" width="512" height="128" alt="{name}: salto, fine caduta, inizio rialzata, guardia finale" loading="lazy"></td><td>{fall["frames"]} + {recovery["frames"]}</td><td>{fall["frames"]/.6:g} / {recovery["frames"]/.8:g}</td><td>600 + 200 + 800 ms</td><td>{"<br><br>".join(source_html)}<br><a href="../../{item["atlas"]}">Atlas</a></td></tr>')
with (report/'hurt-in-jump-timing.csv').open('w',newline='',encoding='utf-8') as f:
    w=csv.writer(f);w.writerow(['character','phase','sourceSheetId','sourceStart','sourceEnd','playbackStartFrame','playbackEndFrame','phaseStartMs','motionMs','holdMs','totalMs']);w.writerows(records)
page='''<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Timing Hurt in salto e rialzata · WEDOO Fighters</title><style>body{background:#151c18;color:#e6eadf;font:15px/1.6 system-ui;max-width:1600px;margin:auto;padding:28px}a{color:#c6e588}table{border-collapse:collapse;width:100%}td,th{border:1px solid #465044;padding:10px;text-align:left}img{image-rendering:pixelated;max-width:none}code{overflow-wrap:anywhere}.table{overflow:auto}</style><main>
<a href="../mosse.html?move=hurt-in-jump">Apri Hurt in salto e rialzata nella demo</a><h1>Hurt in Jump → Knockdown Recovery</h1>
<p>Prima durata, 21 novembre 2026. Nove personaggi, <b>1,6 s complessivi</b>: reazione al colpo in salto e caduta per 600 ms, fermo a terra per 200 ms, poi rialzata per 800 ms. La rialzata inizia a 800 ms.</p>
<p>Versioni trimmed preferite quando salvate su AutoSprite. Tutti i frame degli intervalli selezionati, riprodotti solo avanti con loop e CRT. Il fermo estende l'ultimo frame della caduta senza generare o interpolare immagini.</p>
<p>Due fogli collegati nello stesso player: Hurt in Jump e il foglio knockdown locale gia presente, usando soltanto il suo segmento di rialzata. Nessuna copia aggiuntiva della rialzata; conservati i ritocchi registrati di Peppo ed Elisa. Verificati i pixel RGBA di tutte le 876 celle, compresi i 441 frame di rialzata locali. Celle 512x512, scala e padding conservati. Gli atlas indicano il foglio di ciascun frame nel campo sheet, da usare anche in Godot.</p>
<p>Le anteprime mostrano inizio in salto, raccordo fra atterraggio e rialzata, guardia finale. Gli atlas indicano origine, fase e durata di ogni frame, per separare i due stati anche in Godot. <a href="hurt-in-jump-timing.csv">Scarica CSV</a>.</p>
<div class="table"><table><thead><tr><th>Personaggio</th><th>Salto / fine caduta / rialzata / guardia</th><th>Frame caduta + rialzata</th><th>FPS caduta / rialzata</th><th>Caduta + fermo + rialzata</th><th>Provenienza</th></tr></thead><tbody>ROWS</tbody></table></div></main></html>'''
(report/'hurt-in-jump-timing.html').write_text(page.replace('ROWS',''.join(rows)),encoding='utf-8');print('Report Hurt in salto e rialzata:',len(data['items']),'personaggi')
