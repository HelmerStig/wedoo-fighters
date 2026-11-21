"""Lossless indexed PNG copies for Pages; originals and decoded RGBA stay intact."""
from pathlib import Path
from PIL import Image
import numpy as np
import hashlib,json,subprocess

ROOT=Path(__file__).resolve().parents[2]
CACHE=ROOT/'.pages-png-cache'
sha=lambda data:hashlib.sha256(data).hexdigest()

def copy_color_metadata(original,encoded):
    keep={b'iCCP',b'sRGB',b'gAMA',b'cHRM',b'pHYs'}
    def chunks(data):
        offset=8
        while offset<len(data):
            size=int.from_bytes(data[offset:offset+4],'big');end=offset+12+size
            yield data[offset+4:offset+8],data[offset:end]
            offset=end
    metadata=b''.join(chunk for kind,chunk in chunks(original) if kind in keep)
    result=bytearray(encoded[:8])
    for kind,chunk in chunks(encoded):
        if kind in keep:continue
        result.extend(chunk)
        if kind==b'IHDR':result.extend(metadata)
    return bytes(result)

def indexed_copy(image):
    rgba=image.convert('RGBA')
    colors=rgba.getcolors(256)
    if colors is None:return None
    keys=sorted(r|(g<<8)|(b<<16)|(a<<24) for _,(r,g,b,a) in colors)
    pixels=np.array(rgba,dtype=np.uint8).view('<u4').reshape(rgba.height,rgba.width)
    indices=np.searchsorted(np.array(keys,dtype=np.uint32),pixels).astype(np.uint8)
    result=Image.fromarray(indices).convert('P')
    palette=[];alpha=[]
    for key in keys:palette.extend([key&255,(key>>8)&255,(key>>16)&255]);alpha.append((key>>24)&255)
    result.putpalette(palette+[0]*(768-len(palette)))
    result.info['transparency']=bytes(alpha+[255]*(256-len(alpha)))
    if result.convert('RGBA').tobytes()!=rgba.tobytes():raise ValueError('Indexed palette changed pixels')
    return result

def main():
    manifest_path=CACHE/'manifest.json'
    manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    # Upgrade existing local caches without changing source assets.
    for local,entry in manifest.items():
        if entry.get('colorMetadataPreserved'):continue
        source=(ROOT/local).resolve();dest=(CACHE/local).resolve()
        if not source.is_relative_to(ROOT) or not dest.is_relative_to(CACHE):raise ValueError('Invalid cache path')
        if not source.exists() or not dest.exists():continue
        original=source.read_bytes()
        if sha(original)!=entry['sourceSha256']:continue
        cached=dest.read_bytes()
        if sha(cached)!=entry['pngSha256']:raise ValueError('Corrupted PNG cache: '+local)
        encoded=copy_color_metadata(original,cached);dest.write_bytes(encoded)
        entry.update(pngSha256=sha(encoded),colorMetadataPreserved=True)
    if manifest_path.exists():manifest_path.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    inventory=json.loads(subprocess.check_output(['node','demo-moves/scripts/build-pages.mjs','--inventory'],cwd=ROOT,text=True))
    if inventory['bytes']<=990_000_000:
        print('Pages PNG: already within budget, no new compression needed.');return
    CACHE.mkdir(exist_ok=True)
    projected=inventory['bytes']
    candidates=sorted((ROOT/p for p in inventory['files'] if p.endswith('.png') and p not in inventory['optimized']),key=lambda p:p.stat().st_size,reverse=True)
    for source in candidates:
        local=source.relative_to(ROOT).as_posix()
        if source.stat().st_size<128*1024:continue
        with Image.open(source) as image:
            if image.mode=='P':continue
            result=indexed_copy(image)
            if result is None:continue
            dest=CACHE/local;dest.parent.mkdir(parents=True,exist_ok=True)
            result.save(dest,compress_level=9)
            with Image.open(dest) as saved:
                assert saved.convert('RGBA').tobytes()==image.convert('RGBA').tobytes(),local
        before=source.read_bytes();after=copy_color_metadata(before,dest.read_bytes());dest.write_bytes(after)
        if len(after)>=len(before):dest.unlink();continue
        manifest[local]={'sourceSha256':sha(before),'pngSha256':sha(after),'rgbaVerified':True,'colorMetadataPreserved':True}
        projected-=len(before)-len(after)
        manifest_path.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
        print('Pages PNG:',local,'saved',round((len(before)-len(after))/1024/1024,2),'MiB; total',round(projected/1024/1024,1),'MiB',flush=True)
        if projected<=990_000_000:break
    if projected>1_000_000_000:raise RuntimeError('Lossless PNG compression did not bring the site below 1 GB')
    print('Pages PNG: all optimized copies verified pixel-for-pixel; originals unchanged.')

if __name__=='__main__':main()
