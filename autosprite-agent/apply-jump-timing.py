"""Aggiorna i metadati di playback del salto, preservando PNG e rettangoli."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
def read(path):
    return json.loads((ROOT/path).read_text(encoding='utf-8-sig'))
def save(path,value):
    (ROOT/path).write_text(json.dumps(value,indent=2)+'\n',encoding='utf-8')

manifest=read('animation/jump-manifest.json')
timing=read('animation/jump-timing.json')
entries={i['character']:i for i in timing['items']}
for item in manifest['items']:
    selection=entries[item['character']]
    assert all(item[k]==selection[k] for k in ('sourceSheetId','sourceStart','sourceEnd'))
    peak,count=selection['apexFrame'],item['frames']
    ms,total=timing['apexMs'],timing['durationMs']
    assert 0<peak<count and 0<ms<total
    fps=count*1000/total
    item.update(playbackFps=fps,apexFrame=peak,apexMs=ms,durationMs=total)
    atlas=read(item['atlas'])
    assert len(atlas['frames'])==count
    atlas['meta'].update(fps=fps,duration_ms=total,apex_frame=peak,apex_ms=ms,
                         ascent_fps=peak*1000/ms,descent_fps=(count-peak)*1000/(total-ms))
    for i in range(count):
        atlas['frames'][str(i)]['duration']=ms/peak if i<peak else (total-ms)/(count-peak)
    save(item['atlas'],atlas)
manifest.pop('playbackFps',None)
manifest.update(name='Salto',timingFile='animation/jump-timing.json',verifiedAt=timing['updatedAt'])
save('animation/jump-manifest.json',manifest)
print(f'Timing aggiornato per {len(manifest["items"])} salti; PNG invariati.')
