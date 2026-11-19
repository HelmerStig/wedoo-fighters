"""Build the strong punch timing report from committed manifests and atlas data."""
import argparse
import csv
import html
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT / 'demo-moves/reports'
POSES = REPORT / 'strong-punch-poses'
POSES.mkdir(parents=True, exist_ok=True)


def read(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8-sig'))


def seconds(ms):
    return f'{ms / 1000:.2f}'.replace('.', ',')


def main():
    manifest = read('animation/strong-punch-manifest.json')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        '--character',
        action='append',
        default=[],
        help='Aggiorna solo le pose indicate; HTML e CSV includono sempre tutti i personaggi.',
    )
    args = parser.parse_args()
    selected = {name.lower() for name in args.character}
    unknown = selected - {item['character'].lower() for item in manifest['items']}
    if unknown:
        raise ValueError('Personaggi assenti: ' + ', '.join(sorted(unknown)))

    timing = read('animation/strong-punch-timing.json')
    roster = read('animation/manifest.json')
    entries = {i['character']: i for i in timing['items']}
    total, impact = timing['durationMs'], timing['impactMs']
    updated_at = timing.get('updatedAt') or manifest.get('updatedAt', '')

    rows, records = [], []
    for item in sorted(manifest['items'], key=lambda i: i['character'].lower()):
        entry = entries[item['character']]
        assert entry['sourceSheetId'] == item['sourceSheetId']
        assert (entry['sourceStart'], entry['sourceEnd']) == (item['sourceStart'], item['sourceEnd'])
        peak, count = entry['impactFrame'], item['frames']
        assert 0 < peak < item['sourceFrames']
        atlas = read(item['atlas'])
        assert len(atlas['frames']) == count
        cell = atlas['frames'][str(peak)]
        impact_source_frame = cell.get('source_frame', item['sourceStart'] + peak)
        if 'duration' in cell:
            before_sum = sum(atlas['frames'][str(i)]['duration'] for i in range(peak))
            total_sum = sum(f['duration'] for f in atlas['frames'].values())
            assert abs(before_sum - impact) < 1e-6, (item['character'], before_sum, impact)
            assert abs(total_sum - total) < 1e-6, (item['character'], total_sum, total)

        frame = cell['frame']
        slug = item['character'].lower()
        if not selected or slug in selected:
            with Image.open(ROOT / item['png']) as image:
                image.crop(
                    (frame['x'], frame['y'], frame['x'] + frame['w'], frame['y'] + frame['h'])
                ).save(POSES / f'{slug}.png')

        sheet_frames = item.get('sourceSheetFrames', item['sourceFrames'])
        mode = 'Solo avanti' if item['playback'] == 'forward' else 'Avanti e indietro'
        before, after = impact / peak, (total - impact) / (count - peak)
        note = entry.get('note', '')
        records.append([
            item['character'],
            sheet_frames,
            item['sourceFrames'],
            count,
            mode,
            peak + 1,
            impact_source_frame,
            impact,
            total - impact,
            total,
            round(before, 6),
            round(after, 6),
            item['sourceStart'],
            item['sourceEnd'],
            item['sourceSheetId'],
            note,
        ])
        name = html.escape(item['character'])
        rows.append(
            f'<tr>'
            f'<th scope="row"><a href="../personaggio.html?id={slug}">{name}</a></th>'
            f'<td><img src="strong-punch-poses/{slug}.png" alt="Impatto principale di {name}" width="128" height="128" loading="lazy"></td>'
            f'<td>{item["sourceFrames"]} / {count}</td>'
            f'<td>{mode}</td>'
            f'<td>{peak + 1} / {count}<br>sorgente {impact_source_frame}</td>'
            f'<td><b>{impact} ms</b></td>'
            f'<td>{total - impact} ms</td>'
            f'<td>{total} ms</td>'
            f'<td>{before:.3f} / {after:.3f} ms</td>'
            f'<td>{html.escape(note)}</td>'
            f'<td><a href="../../{item["atlas"]}">Atlas e sequenza</a><br><code>{item["sourceSheetId"]}</code></td>'
            f'</tr>'
        )

    with (REPORT / 'strong-punch-timing.csv').open('w', encoding='utf-8-sig', newline='') as out:
        writer = csv.writer(out)
        writer.writerow([
            'Personaggio',
            'Frame foglio scaricato',
            'Frame sorgente utilizzati',
            'Frame riprodotti',
            'Riproduzione',
            'Frame impatto sequenza (da 1)',
            'Frame impatto sorgente (da 0)',
            'Impatto ms',
            'Fase successiva ms',
            'Totale ms',
            'Durata frame prima ms',
            'Durata frame dopo ms',
            'Inizio sorgente (da 0)',
            'Fine sorgente (da 0)',
            'Source sheet ID',
            'Note',
        ])
        writer.writerows(records)

    available = {item['character'].lower() for item in manifest['items']}
    missing = [item['character'] for item in roster['items'] if item['character'].lower() not in available]

    page = (
        '<!doctype html><html lang="it"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        '<title>Timing Pugno forte - WEDOO Fighters</title>'
        '<style>'
        'body{font:15px/1.5 system-ui;background:#141815;color:#eff3eb;margin:0;padding:32px}'
        'main{max-width:1700px;margin:auto}'
        'a{color:#ceef80}'
        'h1{font-size:30px}'
        'p{max-width:1100px;color:#bbc7b9}'
        '.table-wrap{overflow:auto}'
        'table{border-collapse:collapse;width:100%;font-size:13px}'
        'th,td{border-bottom:1px solid #3b493c;padding:10px;text-align:left}'
        'thead th{background:#273329;white-space:nowrap}'
        'img{object-fit:contain;background:#cbd3ca;border-radius:8px;image-rendering:pixelated}'
        'td:nth-last-child(2){min-width:270px}'
        'code{font-size:11px;overflow-wrap:anywhere}'
        'b{color:#ceef80}'
        '@media(max-width:600px){body{padding:16px}h1{font-size:25px}}'
        '@media print{body{background:white;color:black;padding:0}b,a,p{color:black}'
        'thead th{background:#eee}img{width:80px;height:80px}th,td{padding:5px;font-size:10px}}'
        '</style><main>'
        '<a href="../mosse.html?move=strong-punch">Apri Pugno forte nella demo</a>'
        '<h1>Timing Pugno forte</h1>'
    )
    page += (
        f'<p>Aggiornamento: {html.escape(updated_at)}. Integrati {len(records)} personaggi su {len(roster["items"])}. '
        f'A velocita 1x il frame scelto di impatto principale inizia esattamente a <b>{impact} ms ({seconds(impact)} s)</b>; '
        f'il ciclo completo termina a <b>{total} ms ({seconds(total)} s)</b>. '
        f'La fase successiva all\'impatto dura {total - impact} ms ({seconds(total - impact)} s).</p>'
    )
    page += (
        '<p>Tutti i nove personaggi integrati usano la sequenza sorgente solo avanti, che include preparazione, colpo e recupero naturale. '
        'I PNG scaricati da AutoSprite e il padding delle celle 512x512 sono conservati byte per byte, senza ridimensionamenti o ricentrature.</p>'
    )
    page += (
        '<p>Le durate variabili per frame sono incorporate nel catalogo offline e negli atlas come riferimento per Godot. '
        'Gli fps medi non descrivono le due fasi: la tabella indica i millisecondi effettivi di ogni passo prima e dopo l\'impatto. '
        'Le maschere del braccio per scia e particelle azzurre (intensita 75%) sono mantenute manualmente in '
        '<a href="../../animation/strong-punch-trails.json">strong-punch-trails.json</a>.</p>'
    )
    page += (
        f'<p>Personaggi senza Pugno forte importato ({len(missing)}): '
        + ', '.join(html.escape(x) for x in missing)
        + '.</p>'
    )
    page += (
        '<p><a href="strong-punch-timing.csv" download>Scarica il report CSV</a> · '
        '<a href="../../animation/strong-punch-timing.json">Timing JSON</a> · '
        '<a href="../../animation/strong-punch-manifest.json">Manifest e provenienza</a> · '
        '<a href="../../animation/strong-punch-trails.json">Trails JSON</a></p>'
        '<div class="table-wrap"><table><thead><tr>'
        '<th>Personaggio</th><th>Posa scelta</th><th>Frame sorgente / riprodotti</th>'
        '<th>Riproduzione</th><th>Frame impatto</th><th>Impatto</th><th>Fase successiva</th>'
        '<th>Ciclo</th><th>Durata passo prima / dopo</th><th>Note</th><th>Asset</th>'
        '</tr></thead><tbody>'
        + ''.join(rows)
        + '</tbody></table></div></main></html>'
    )
    (REPORT / 'strong-punch-timing.html').write_text(page, encoding='utf-8')
    print(
        f'Report Pugno forte: {len(records)} personaggi, impatto {impact} ms, '
        f'ciclo {total} ms, {len(missing)} non importati.'
    )


if __name__ == '__main__':
    main()
