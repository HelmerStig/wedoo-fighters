"""Esporta i frame Block senza ridimensionamenti; verifica i pixel decodificati."""
import hashlib
import json
import math
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))

plan = read(ROOT / sys.argv[1])
results = []
for item in plan['items']:
    w, h, count = item['frameWidth'], item['frameHeight'], item['frames']
    columns = math.ceil(math.sqrt(count))
    rows = math.ceil(count / columns)
    with Image.open(item['rawPng']) as raw:
        source = raw.convert('RGBA')
    image = Image.new('RGBA', (columns*w, rows*h))
    frames = {}
    for i in range(count):
        f = item['sourceStart'] + i
        sx, sy = f % item['sourceColumns']*w, f // item['sourceColumns']*h
        x, y = i % columns*w, i // columns*h
        cell = source.crop((sx, sy, sx+w, sy+h))
        image.paste(cell, (x, y))
        frames[str(i)] = dict(x=x, y=y, w=w, h=h, source_frame=f)
    destination = ROOT / item['png']
    image.save(destination)
    with Image.open(destination) as saved:
        assert saved.convert('RGBA').tobytes() == image.tobytes()
        for i in range(count):
            f = item['sourceStart'] + i
            sx, sy = f % item['sourceColumns']*w, f // item['sourceColumns']*h
            x, y = i % columns*w, i // columns*h
            assert saved.crop((x,y,x+w,y+h)).tobytes() == source.crop((sx,sy,sx+w,sy+h)).tobytes()
    meta = dict(image=destination.name, size=dict(w=image.width,h=image.height),
                frame_size=dict(w=w,h=h), frame_count=count, columns=columns, rows=rows,
                trimmed=item['trimmed'], source_sheet_id=item['sourceSheetId'],
                source_frame_count=item['sourceFrames'], source_frame_start=item['sourceStart'],
                source_frame_end=item['sourceEnd'], speed_multiplier=item['speedMultiplier'])
    (ROOT / item['atlas']).write_text(json.dumps(dict(frames=frames,meta=meta),indent=2)+'\n',encoding='utf-8')
    result = {k:v for k,v in item.items() if k not in ('rawPng','sourceColumns','playbackFps')}
    result.update(pixelVerification='decoded RGBA comparison per source frame and exported PNG',
                  pixelHash=hashlib.sha256(image.tobytes()).hexdigest())
    results.append(result)
manifest = dict(animation='block',name='Parata alta',creditsUsed=0,importedAt=plan['createdAt'],items=results,missing=plan['missing'])
(ROOT/'animation/block-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(f'Esportate e verificate {len(results)} animazioni Block.')
