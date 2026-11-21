"""Explicitly register reviewed local PNG edits without changing the PNG or timing."""
from pathlib import Path
from PIL import Image
import argparse,json,hashlib,datetime

ROOT=Path(__file__).resolve().parents[2]
sha=lambda data:hashlib.sha256(data).hexdigest()
write=lambda path,value:path.write_text(json.dumps(value,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest');parser.add_argument('--characters',nargs='+',required=True)
    parser.add_argument('--note',required=True);args=parser.parse_args()
    path=(ROOT/args.manifest).resolve()
    if not path.is_relative_to(ROOT/'animation'):raise ValueError('Manifest must be inside animation/')
    manifest=json.loads(path.read_text(encoding='utf-8'))
    selected=[item for item in manifest['items'] if item['character'].lower() in args.characters]
    if len(selected)!=len(set(args.characters)):raise ValueError('Unknown or duplicate character')
    updates=[]
    for item in selected:
        png=(ROOT/item['png']).resolve();atlas_path=(ROOT/item['atlas']).resolve()
        if not png.is_relative_to(ROOT/'animation') or not atlas_path.is_relative_to(ROOT/'animation'):raise ValueError('Asset outside animation/')
        sheets=item.get('sheets') or [{'png':item['png'],'pngSha256':item['pngSha256']}]
        paths=[(ROOT/s['png']).resolve() for s in sheets]
        if any(not p.is_relative_to(ROOT/'animation') for p in paths):raise ValueError('Sheet outside animation/')
        digests=[sha(p.read_bytes()) for p in paths];digest=digests[0]
        if digest==item['pngSha256'] and all(d==s['pngSha256'] for d,s in zip(digests,sheets)):continue
        atlas=json.loads(atlas_path.read_text(encoding='utf-8'));images=[Image.open(p).convert('RGBA') for p in paths]
        sizes=[s['size'] for s in atlas['meta']['sheets']] if item.get('sheets') else [atlas['meta']['size']]
        if len(sizes)!=len(images) or any(image.size!=(size['w'],size['h']) for image,size in zip(images,sizes)):raise ValueError('PNG dimensions changed: update atlas before registering')
        if len(atlas['frames'])!=item['frames']:raise ValueError('Frame count mismatch')
        changed=[]
        for key,frame in atlas['frames'].items():
            sheet=frame.get('sheet',0)
            if not isinstance(sheet,int) or sheet<0 or sheet>=len(images):raise ValueError('Invalid sheet index')
            image=images[sheet]
            r=frame['frame'];x,y,w,h=[r[k] for k in ['x','y','w','h']]
            if min(x,y)<0 or w!=item['frameWidth'] or h!=item['frameHeight'] or x+w>image.width or y+h>image.height:raise ValueError('Invalid frame bounds')
            actual=sha(image.crop((x,y,x+w,y+h)).tobytes())
            if actual!=frame['rgbaSha256']:
                frame.setdefault('importedRgbaSha256',frame['rgbaSha256'])
                frame['rgbaSha256']=actual;frame['locallyEdited']=True;changed.append(int(key))
        item.setdefault('importedPngSha256',item['pngSha256'])
        item['pngSha256']=digest
        for spec,current in zip(sheets,digests):
            if spec['pngSha256']!=current:spec.setdefault('importedPngSha256',spec['pngSha256']);spec['pngSha256']=current
        item['localEdits']={'registeredAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'note':args.note,'changedFrames':sorted(set(item.get('localEdits',{}).get('changedFrames',[])+changed)),
            'verification':'Reviewed local edits; current decoded RGBA hashes recorded after validating unchanged canvas and frame bounds. Source IDs, frame order and timing preserved.'}
        item['pixelVerification']='Original import verified against AutoSprite sources. Current PNG includes reviewed local edits recorded in localEdits; current frame hashes are in the atlas and imported hashes are retained for edited frames.'
        atlas['meta']['local_edits']=item['localEdits']
        updates.append((atlas_path,atlas,item['character'],len(changed)))
    for atlas_path,atlas,name,count in updates:
        write(atlas_path,atlas);print(name+': registered '+str(count)+' edited RGBA frames; PNG unchanged')
    if updates:write(path,manifest)
    else:print('No changes to register')

if __name__=='__main__':main()
