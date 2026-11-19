"""Apply reviewed integer frame offsets; preserve sprite size, artwork and timing.

No AutoSprite requests. Inputs are the uncorrected local sheets. A backup source
directory can contain <slug>/original.png and original.json. Repeated invocation
checks the output instead of applying the translations a second time.
"""
from pathlib import Path
from PIL import Image
import argparse
import hashlib
import json

ROOT = Path(__file__).resolve().parents[2]
PROFILE = ROOT / 'animation/light-kick-foot-lock.json'
MANIFEST = ROOT / 'animation/light-kick-manifest.json'
read = lambda p: json.loads(p.read_text(encoding='utf-8'))
sha = lambda b: hashlib.sha256(b).hexdigest()


def support_contact(cell):
    """Rightmost planted sole, reviewed against the raised foot in these four clips."""
    alpha = cell.getchannel('A')
    mask = alpha.point(lambda a: 255 if a >= 96 else 0)
    bottom = mask.getbbox()[3] - 1
    pixels = mask.load()
    columns = [x for x in range(512) if any(pixels[x, y] for y in range(max(0, bottom - 20), bottom + 1))]
    runs = []
    for x in columns:
        if not runs or x > runs[-1][-1] + 1:
            runs.append([])
        runs[-1].append(x)
    foot = [r for r in runs if len(r) >= 3][-1]
    left, right = foot[0], foot[-1]
    y = max(y for y in range(512) if any(pixels[x, y] for x in range(left, right + 1)))
    sole = [x for x in range(left, right + 1) if any(pixels[x, yy] for yy in range(max(0, y - 5), y + 1))]
    return [(sole[0] + sole[-1]) // 2, y + 1]


def verify_output(item, profile):
    atlas = read(ROOT / item['atlas'])
    sheet = Image.open(ROOT / item['png']).convert('RGBA')
    assert sha((ROOT / item['png']).read_bytes()) == item['pngSha256']
    lookup = {f['sourceFrame']: f for f in profile['frames']}
    for i in range(item['frames']):
        entry = atlas['frames'][str(i)]
        r = entry['frame']
        cell = sheet.crop((r['x'], r['y'], r['x'] + 512, r['y'] + 512))
        selected = lookup[entry['source_frame']]
        assert sha(cell.tobytes()) == entry['rgbaSha256'] == selected['rgbaSha256']
        assert support_contact(cell) == profile['target'], (item['character'], i, 'support foot moved')
        assert entry['source_offset'] == selected['offset']


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path)
    parser.add_argument('--verify', action='store_true')
    args = parser.parse_args()
    profiles, manifest = read(PROFILE), read(MANIFEST)
    count = 0
    for profile in profiles['items']:
        item = next(i for i in manifest['items'] if i['character'] == profile['character'])
        assert profile['sourceSheetId'] == item['sourceSheetId'], 'Review alignment after changing source sheets'
        png_path, atlas_path = ROOT / item['png'], ROOT / item['atlas']
        current_hash = sha(png_path.read_bytes())
        if args.verify or current_hash == profile.get('outputPngSha256'):
            verify_output(item, profile)
            count += item['frames']
            continue
        assert current_hash == profile['inputPngSha256'], 'Input changed; review offsets instead of overwriting edits'
        slug = item['character'].lower()
        source_png = args.source_dir / slug / 'original.png' if args.source_dir else png_path
        source_atlas = args.source_dir / slug / 'original.json' if args.source_dir else atlas_path
        assert sha(source_png.read_bytes()) == profile['inputPngSha256']
        atlas = read(source_atlas)
        source = Image.open(source_png).convert('RGBA')
        output = Image.new('RGBA', source.size)
        lookup = {f['sourceFrame']: f for f in profile['frames']}
        for i in range(item['frames']):
            entry = atlas['frames'][str(i)]
            r = entry['frame']
            cell = source.crop((r['x'], r['y'], r['x'] + 512, r['y'] + 512))
            selected = lookup[entry['source_frame']]
            assert sha(cell.tobytes()) == selected['sourceRgbaSha256']
            assert support_contact(cell) == selected['sourceContact']
            dx, dy = selected['offset']
            assert [selected['sourceContact'][0] + dx, selected['sourceContact'][1] + dy] == profile['target']
            b = cell.getbbox()
            assert 0 <= b[0] + dx and 0 <= b[1] + dy and b[2] + dx <= 512 and b[3] + dy <= 512, 'Clipped artwork'
            corrected = Image.new('RGBA', (512, 512))
            corrected.paste(cell, (dx, dy))
            assert corrected.crop((b[0] + dx, b[1] + dy, b[2] + dx, b[3] + dy)).tobytes() == cell.crop(b).tobytes()
            assert sha(corrected.tobytes()) == selected['rgbaSha256']
            output.paste(corrected, (r['x'], r['y']))
            entry.update(source_offset=[dx, dy], support_contact=profile['target'],
                         sourceRgbaSha256=selected['sourceRgbaSha256'], rgbaSha256=selected['rgbaSha256'])
        output.save(png_path)
        atlas['meta']['alignment'] = dict(type='support-foot-lock', profile='animation/light-kick-foot-lock.json', target=profile['target'])
        atlas_path.write_text(json.dumps(atlas, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
        profile['outputPngSha256'] = sha(png_path.read_bytes())
        item.update(pngSha256=profile['outputPngSha256'], originalExportPngSha256=profile['inputPngSha256'],
                    alignment=atlas['meta']['alignment'],
                    pixelVerification='Integer translation per source frame to lock the supporting sole. Visible RGBA pixels compared to source, without resampling or clipping; offsets recorded in atlas/profile.')
        verify_output(item, profile)
        count += item['frames']
    if not args.verify:
        PROFILE.write_text(json.dumps(profiles, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
        MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Verified {count} frames: fixed support contact, translated pixels preserved, no clipping.')


if __name__ == '__main__':
    main()
