"""Rigenera il report e le pose dai manifest locali (nessuna generazione AI)."""
import csv
import html
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT / 'demo-moves/reports'
POSES = REPORT / 'light-punch-poses'
POSES.mkdir(parents=True, exist_ok=True)

def read(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8-sig'))

manifest = read('animation/light-punch-manifest.json')
timing = read('animation/light-punch-timing.json')
roster = read('animation/manifest.json')
entries = {e['character']: e for e in timing['items']}
rows, records = [], []
cycle, impact = timing['durationMs'], timing['impactMs']
for item in sorted(manifest['items'], key=lambda i: i['character'].lower()):
    entry = entries[item['character']]
    assert entry['sourceSheetId'] == item['sourceSheetId'], item['character']
    assert (entry['sourceStart'], entry['sourceEnd']) == (item['sourceStart'], item['sourceEnd'])
    peak, count = entry['impactFrame'], item['frames']
    assert 0 < peak < count
    atlas = read(item['atlas'])
    frame = atlas['frames'][str(peak)]
    frame = frame.get('frame', frame)
    slug = item['character'].lower()
    with Image.open(ROOT / item['png']) as image:
        image.crop((frame['x'], frame['y'], frame['x'] + frame['w'], frame['y'] + frame['h'])).save(POSES / (slug + '.png'))
    previous, before, after = peak * cycle / count, impact / peak, (cycle - impact) / (count - peak)
    note = entry.get('note', '')
    records.append([item['character'], count, peak + 1, item['sourceStart'] + peak, round(previous, 3), impact, impact, cycle - impact, cycle, round(before, 3), round(after, 3), note, item['sourceSheetId']])
    name = html.escape(item['character'])
    rows.append(f'<tr><th scope="row">{name}</th><td><img src="light-punch-poses/{slug}.png" alt="Massima estensione di {name}" width="128" height="128" loading="lazy"></td><td>{peak + 1} / {count}</td><td>{previous:.1f} ms</td><td><b>{impact} ms</b></td><td>{impact} ms</td><td>{cycle-impact} ms</td><td>{cycle} ms</td><td>{before:.2f} / {after:.2f} ms</td><td>{html.escape(note) or "-"}</td></tr>')

with (REPORT / 'light-punch-timing.csv').open('w', encoding='utf-8-sig', newline='') as output:
    writer = csv.writer(output)
    writer.writerow(['Personaggio', 'Frame totali', 'Frame impatto (da 1)', 'Frame sorgente (da 0)', 'Impatto precedente uniforme ms', 'Impatto nuovo ms', 'Preparazione ms', 'Impatto e recupero ms', 'Totale ms', 'Durata frame prima ms', 'Durata frame dopo ms', 'Note', 'Source sheet ID'])
    writer.writerows(records)

available = {item['character'] for item in manifest['items']}
missing = [item['character'] for item in roster['items'] if item['character'] not in available]
missing_text = ', '.join(html.escape(name) for name in missing) or 'nessuno'
page = '''<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Timing Pugno leggero - WEDOO Fighters</title><style>body{font:15px/1.5 system-ui;background:#141815;color:#eff3eb;margin:0;padding:32px}main{max-width:1500px;margin:auto}a{color:#ceef80}h1{font-size:30px}p{max-width:1000px;color:#bbc7b9}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border-bottom:1px solid #3b493c;padding:10px;text-align:left}thead th{background:#273329;white-space:nowrap}img{object-fit:contain;background:#cbd3ca;border-radius:8px;image-rendering:pixelated}td:last-child{min-width:200px}b{color:#ceef80}@media print{body{background:white;color:black;padding:0}b,a{color:black}thead th{background:#eee}img{width:80px;height:80px}th,td{padding:5px;font-size:10px}}</style><main><a href="../mosse.html?move=light-punch">Apri i pugni nella demo</a><h1>Timing Pugno leggero</h1>'''
page += f'<p>Aggiornamento: {html.escape(timing["updatedAt"])}. Controllati visivamente {len(records)} personaggi su {len(roster["items"])}. Il frame selezionato di massima estensione inizia a {impact} ms, con ciclo di {cycle} ms a velocita 1x. Preparazione e fase successiva durano {impact} ms e {cycle-impact} ms; i frame hanno durate diverse nelle due fasi e conservano l\'ordine originale.</p>'
page += '<p>I numeri dei frame in tabella partono da 1. Il timing precedente e il riferimento uniforme di 500 ms della demo, non la velocita di AutoSprite. Quando il braccio resta esteso per piu frame, e scelta una posa rappresentativa di massima estensione: le pose estese adiacenti possono iniziare prima del marcatore. Recuperi incompleti e colpi multipli sono segnalati nelle note.</p>'
page += '<p>Riproduci tutte riparte dal primo frame e allinea le schede anche con caricamento progressivo. I controlli individuali permettono di uscire dalla sincronizzazione. Il timing e applicato dal player, senza modificare i pixel degli spritesheet. Le altre mosse mantengono 24 fps.</p>'
page += f'<p>Personaggi senza Light Punch disponibile ({len(missing)}): {missing_text}.</p>'
page += '<p><a href="light-punch-timing.csv" download>Scarica i timing in CSV</a></p><div class="table-wrap"><table><thead><tr><th>Personaggio</th><th>Posa scelta</th><th>Frame</th><th>Impatto prima (uniforme)</th><th>Impatto ora</th><th>Preparazione</th><th>Fase successiva</th><th>Ciclo</th><th>Durata frame prima / dopo</th><th>Note</th></tr></thead><tbody>'
page += ''.join(rows) + '</tbody></table></div></main></html>'
(REPORT / 'light-punch-timing.html').write_text(page, encoding='utf-8')
print(f'Report aggiornato: {len(records)} pose e timing; {len(missing)} personaggi senza Light Punch.')
