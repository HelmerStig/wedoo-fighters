"""Misura le suole nei frame idle; genera contatti per le ombre, senza modificare i PNG."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
def read(path):
    return json.loads((ROOT/path).read_text(encoding='utf-8-sig'))
manifest=read('animation/manifest.json')
items=[]
for slug,split in [('alberto',253),('marsan',256),('pippo',253),('peppo',252)]:
    item=next(i for i in manifest['items'] if i['character'].lower()==slug)
    atlas=read(item['atlas'])
    entries=sorted(atlas['frames'].items(),key=lambda p:int(p[0]))
    contacts=[]
    with Image.open(ROOT/item['png']) as image:
        image=image.convert('RGBA')
        for _,entry in entries:
            f=entry.get('frame',entry)
            alpha=image.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h'])).getchannel('A')
            bbox=alpha.point(lambda a:255 if a>64 else 0).getbbox()
            assert bbox,slug
            low=int(bbox[1]+(bbox[3]-bbox[1])*0.7)
            feet=[]
            for left,right in [(0,split),(split,f['w'])]:
                pixels=[(x,y) for y in range(low,f['h']) for x in range(left,right) if alpha.getpixel((x,y))>64]
                assert pixels,(slug,len(contacts))
                bottom=max(y for x,y in pixels)
                sole=[x for x,y in pixels if y>=bottom-2]
                shoe=[x for x,y in pixels if y>=bottom-7]
                feet.append(dict(x=round((min(sole)+max(sole)+1)/2,2),y=bottom+1,width=max(shoe)-min(shoe)+1))
            assert feet[1]['x']-feet[0]['x']>40,(slug,len(contacts))
            contacts.append(feet)
    items.append(dict(characterId=slug,image='../'+item['png'],sourceSheetId=item['sourceSheetId'],
                      pngSha256=hashlib.sha256((ROOT/item['png']).read_bytes()).hexdigest(),frames=contacts))
data=dict(method='Suola alpha >64, due piedi separati; y indica il bordo inferiore del pixel.',items=items)
payload=json.dumps(data,indent=2,ensure_ascii=False)
(ROOT/'animation/stage-foot-contacts.json').write_text(payload+'\n',encoding='utf-8')
(ROOT/'demo-moves/stage-foot-contacts.js').write_text('/* Generato da scripts/build-stage-foot-contacts.py. */\nwindow.STAGE_FOOT_CONTACTS = '+payload+';\n',encoding='utf-8')
print([(item['characterId'],len(item['frames']),item['frames'][0]) for item in items])
