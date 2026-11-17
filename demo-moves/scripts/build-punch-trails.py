"""Build arm-only punch effect masks from the current local sprites and timing.
No sprite pixels or timing values are changed. Oscar's reviewed medium mask is kept.
"""
import copy
import json
import math
from pathlib import Path
from statistics import median
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[2]
QA=ROOT/'autosprite-agent/output/punch-trail-masks-20261117'
QA.mkdir(parents=True,exist_ok=True)
def read(p): return json.loads((ROOT/p).read_text(encoding='utf-8-sig'))
def save(p,data): (ROOT/p).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
reviewed=next(p for p in read('animation/medium-punch-trails.json')['items'] if p['character'].lower()=='oscar')
def arm(cell):
    alpha=cell.getchannel('A').point(lambda a:255 if a>128 else 0)
    box=alpha.getbbox()
    if not box: return None
    top=box[1]
    head=alpha.crop((0,top,512,min(512,top+12))).getbbox()
    head_right=head[2]+14
    upper=alpha.crop((0,min(511,top+20),512,min(512,top+150))).getbbox()
    if not upper:return None
    tip=upper[2]-1
    ys=[y for y in range(top+20,min(512,top+150)) for x in range(max(0,tip-14),tip+1) if alpha.getpixel((x,y))]
    if not ys:return None
    cy=int(median(ys))
    left=max(head_right+6,tip-100)
    if tip-left<22:return None
    columns=[]
    xs=list(range(left,tip+1,max(3,(tip-left)//10)))
    if xs[-1]!=tip:xs.append(tip)
    for x in xs:
        yy=[y for y in range(max(0,cy-30),min(512,cy+31)) if alpha.getpixel((x,y))]
        if yy:columns.append((x,max(0,min(yy)-1),min(511,max(yy)+1)))
    if len(columns)<3:return None
    polygon=[[x,y0] for x,y0,y1 in columns]+[[x,y1] for x,y0,y1 in reversed(columns)]
    a=columns[len(columns)//3];b=columns[2*len(columns)//3];c=columns[-1]
    origins=[[a[0],a[1]-2],[b[0],b[1]-2],[c[0]-3,c[2]+2],[a[0],a[2]+2]]
    return polygon,origins
all_profiles={}
for move in ['medium-punch','light-punch']:
    manifest=read('animation/'+move+'-manifest.json');timing=read('animation/'+move+'-timing.json')
    entries={i['character'].lower():i for i in timing['items']}
    profiles=[];tiles=[]
    for item in manifest['items']:
        slug=item['character'].lower();entry=entries[slug];peak=entry['impactFrame']
        atlas=read(item['atlas'])
        with Image.open(ROOT/item['png']) as raw:
            image=raw.convert('RGBA')
            def cell(i):
                f=atlas['frames'][str(i)];f=f.get('frame',f)
                return image.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h']))
            if move=='medium-punch' and slug=='oscar' and reviewed['sourceSheetId']==item['sourceSheetId'] and reviewed.get('sourceStart')==item['sourceStart'] and reviewed.get('sourceEnd')==item['sourceEnd']:
                profile=copy.deepcopy(reviewed)
                profile['polygons']={str(k):v for k,v in profile['polygons'].items()}
            else:
                masks={};origins={}
                lookback=max(1,math.ceil(peak*80/timing['impactMs']))
                for i in range(max(0,peak-lookback),peak+1):
                    detected=arm(cell(i))
                    if detected:
                        masks[str(i)],origins[str(i)]=detected
                if str(peak) not in masks: raise ValueError('Review arm mask: '+move+'/'+slug)
                profile={'character':item['character'],'sourceSheetId':item['sourceSheetId'],'enabled':True,'strength':.75,'tint':'#b8d7e6','startFrame':min(map(int,masks)),'endFrame':peak,'fadeOutMs':30,'historyMs':[48,32,16],'opacities':[.16,.26,.38],'polygons':masks,'particles':{'perBurst':14,'lifetimeMs':220,'speedX':250,'spreadY':115,'widths':[3,5,7],'heights':[1,1,1],'colors':['#c8efff','#9cd8f0','#79bddb'],'origins':origins}}
            profile.update({'sourceStart':item['sourceStart'],'sourceEnd':item['sourceEnd'],'frameIndexSpace':'exported-playback','impactFrame':peak,'forwardEndFrame':item.get('sourceFrames',item['frames'])-1 if move=='medium-punch' else item['frames']-1})
            profiles.append(profile)
            # Review-only overlay of the impact arm mask, not a game asset.
            tile=Image.new('RGB',(176,200),(65,72,86));pose=cell(peak);mask=Image.new('L',(512,512),0)
            ImageDraw.Draw(mask).polygon(profile['polygons'][str(peak)],fill=155)
            tint=Image.new('RGBA',(512,512),(100,220,255,0));tint.putalpha(mask)
            pose=Image.alpha_composite(pose,tint);pose.thumbnail((176,176),Image.Resampling.NEAREST)
            tile.paste(pose,(0,0),pose);ImageDraw.Draw(tile).text((4,180),slug,fill='white');tiles.append(tile)
        print(move,slug,'mask frames',len(profile['polygons']),'impact',peak)
    doc={'version':1,'description':'Maschere distali del braccio e lineette azzurrine; indici nella sequenza esportata. Oscar medium conserva la maschera verificata manualmente.','items':profiles}
    save('animation/'+move+'-trails.json',doc);all_profiles[move]=profiles
    contact=Image.new('RGB',(8*176,math.ceil(len(tiles)/8)*200),(65,72,86))
    for i,tile in enumerate(tiles):contact.paste(tile,((i%8)*176,(i//8)*200))
    contact.save(QA/('review-'+move+'.jpg'))
print('Profiles:',{k:len(v) for k,v in all_profiles.items()})

