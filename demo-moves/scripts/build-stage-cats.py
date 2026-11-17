"""Atlas dei gatti: conta solo celle non vuote e misura gli appoggi, senza cambiare i PNG."""
from pathlib import Path
import json,statistics,hashlib
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];folder=ROOT/'original-backgrounds/villa-arduino/gatti';data={}
for name in ['Telma','Tilda','Tullio']:
 animations={}
 for action in ['run','jump']:
  file=folder/(name+('-run-trimmed.png' if action=='run' else '-jump.png'));image=Image.open(file).convert('RGBA');cols=image.width//512;frames=[];bounds=[]
  for i in range(cols*(image.height//512)):
   x=i%cols*512;y=i//cols*512;box=image.crop((x,y,x+512,y+512)).getchannel('A').point(lambda a:255 if a>64 else 0).getbbox()
   if box:frames.append([x,y,512,512]);bounds.append(box)
  assert frames
  animations[action]={'image':'../'+file.relative_to(ROOT).as_posix(),'frames':frames,'bounds':bounds,'anchorX':statistics.median((b[0]+b[2])/2 for b in bounds),'anchorY':statistics.median(b[3] for b in bounds),'playbackFps':30,'sourceSha256':hashlib.sha256(file.read_bytes()).hexdigest()}
 data[name.lower()]={'name':name,'animations':animations}
(ROOT/'demo-moves/stage-cats-catalog.js').write_text('(function(root){const data='+json.dumps(data,separators=(',',':'))+';if(typeof module==="object"&&module.exports)module.exports=data;else root.STAGE_CATS_CATALOG=data;})(typeof globalThis!=="undefined"?globalThis:this);\n')
print({name:{action:len(a['frames']) for action,a in cat['animations'].items()} for name,cat in data.items()})
