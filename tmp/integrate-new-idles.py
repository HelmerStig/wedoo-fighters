from pathlib import Path
from PIL import Image, ImageDraw
import json, math, hashlib

root=Path(__file__).resolve().parent.parent
selection=json.loads((root/'tmp/new-idles-selection.json').read_text(encoding='utf-8'))
manifest_path=root/'animation/manifest.json'
manifest=json.loads(manifest_path.read_text(encoding='utf-8-sig'))
audit=[]
contact=Image.new('RGB',(3*256,6*280),(28,32,43))
draw=ImageDraw.Draw(contact)
for row,c in enumerate(selection):
    slug=c['slug']; sid=c['sheet']['id']
    raw=root/'autosprite-agent/output/idle-download-20261116'/slug
    meta=json.loads((raw/(sid+'-metadata.json')).read_text())
    atlas=json.loads((raw/(sid+'-atlas.json')).read_text())
    source=Image.open(raw/(sid+'.png')).convert('RGBA')
    entries=sorted(atlas['frames'].items(),key=lambda x:int(x[0]))
    assert len(entries)==meta['frameCount']
    start=meta.get('loopStart') if meta.get('loopStart') is not None else 0
    end=meta.get('loopEnd') if meta.get('loopEnd') is not None else len(entries)-1
    assert 0<=start<=end<len(entries)
    count=end-start+1; fw=meta['frameWidth']; fh=meta['frameHeight']
    columns=min(meta['columns'],count); rows=math.ceil(count/columns)
    output=Image.new('RGBA',(columns*fw,rows*fh))
    frames={}; cells=[]
    for n,i in enumerate(range(start,end+1)):
        entry=entries[i][1]; rect=entry.get('frame',entry)
        x,y,w,h=[rect[k] for k in ('x','y','w','h')]
        assert (w,h)==(fw,fh)
        cell=source.crop((x,y,x+w,y+h)); cells.append(cell)
        dx=n%columns*fw; dy=n//columns*fh; output.paste(cell,(dx,dy))
        frames[str(n)]={'x':dx,'y':dy,'w':fw,'h':fh,'source_frame':i}
    folder=root/'animation'/slug; folder.mkdir(parents=True,exist_ok=True)
    dest=folder/(slug+'-idle.png'); output.save(dest)
    decoded=Image.open(dest).convert('RGBA'); digest=hashlib.sha256()
    for n,cell in enumerate(cells):
        x=n%columns*fw; y=n//columns*fh
        assert decoded.crop((x,y,x+fw,y+fh)).tobytes()==cell.tobytes()
        digest.update(cell.tobytes())
    trimmed=start!=0 or end!=len(entries)-1
    speed=meta.get('speedMultiplier') or 1
    exported={'frames':frames,'meta':{**atlas.get('meta',{}),'image':dest.name,'size':{'w':output.width,'h':output.height},'frame_size':{'w':fw,'h':fh},'frame_count':count,'columns':columns,'rows':rows,'trimmed':trimmed,'source_sheet_id':sid,'source_video_id':meta['sourceVideoId'],'source_frame_count':len(entries),'source_frame_start':start,'source_frame_end':end,'speed_multiplier':speed,'loopStart':0,'loopEnd':count-1}}
    (folder/(slug+'-idle.json')).write_text(json.dumps(exported,indent=2)+'\n',encoding='utf-8')
    item={'character':c['character'].replace(' ','-'),'animation':meta['name'],'sourceSheetId':sid,'sourceVideoId':meta['sourceVideoId'],'sourceFrameCount':len(entries),'trimmed':trimmed,'sourceStart':start,'sourceEnd':end,'frames':count,'columns':columns,'rows':rows,'frameWidth':fw,'frameHeight':fh,'speedMultiplier':speed,'png':dest.relative_to(root).as_posix(),'atlas':(folder/(slug+'-idle.json')).relative_to(root).as_posix(),'pixelVerification':'decoded RGBA SHA256','decodedFramesSha256':digest.hexdigest()}
    # Reuse supplied portraits; a base sprite is the fallback until a portrait exists.
    portrait=root/'portraits'/(slug+'.png')
    item['portrait']=portrait.relative_to(root).as_posix() if portrait.exists() else 'PNG/'+c['character']+'.png'
    manifest['items']=[i for i in manifest['items'] if i['character'].lower()!=slug]+[item]
    bounds=[f.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox() for f in cells]
    ref=Image.open(root/'PNG'/(c['character'].replace(' ','-')+'.png')).convert('RGBA')
    rb=ref.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()
    audit.append({'character':c['character'],'sourceSheetId':sid,'frames':count,'sourceRange':[start,end],'referenceBounds':rb,'firstBounds':bounds[0],'heightRange':[min(b[3]-b[1] for b in bounds),max(b[3]-b[1] for b in bounds)],'pixelVerified':True})
    for col,index in enumerate([0,count//2,count-1]):
        cell=cells[index].resize((256,256),Image.Resampling.NEAREST)
        contact.paste(cell,(col*256,row*280+24),cell)
        draw.text((col*256+6,row*280+4),f'{slug} #{start+index}',fill='white')
manifest['characters']=len(manifest['items'])
manifest['trimmed']=sum(bool(i['trimmed']) for i in manifest['items'])
manifest['complete']=len(manifest['items'])-manifest['trimmed']
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
(root/'autosprite-agent/output/idle-download-20261116/integration-audit.json').write_text(json.dumps(audit,indent=2)+'\n')
contact.save(root/'autosprite-agent/output/idle-download-20261116/contact.png')
print(json.dumps(audit,indent=2))
