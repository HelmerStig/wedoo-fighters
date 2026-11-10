"""Maschere dei neon e dei riflessi esistenti di Porta Palazzo, con timing condiviso."""
import hashlib,json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];folder=ROOT/'original-backgrounds/porta-palazzo';source=folder/'porta-palazzo-stage.png'
# Rettangoli dell'insegna e del riflesso corrispondente, coordinate native.
groups=[('love',(660,550,950,645),(650,890,940,1080)),('purple',(775,460,1010,550),(730,890,1010,1080)),('red-center',(1195,320,1460,395),(1200,890,1450,1080)),('white-top',(1080,260,1460,318),(1010,890,1195,1080)),('yellow',(1080,390,1380,480),(1020,890,1200,1080)),('blue-center',(1140,535,1380,595),(1110,900,1380,1080)),('cyan-right',(1520,495,1760,550),(1500,885,1750,1080)),('orange-right',(1710,545,1880,615),(1760,900,1950,1080))]
atlas=Image.new('RGBA',(1024,1024));points=[];xpos=ypos=rowheight=0
with Image.open(source).convert('RGBA') as image:
 for i,(name,sign,reflection) in enumerate(groups):
  for isreflection,box in [(False,sign),(True,reflection)]:
   x,y,r,b=box;w,h=r-x,b-y
   if xpos+w>1024:xpos=0;ypos+=rowheight;rowheight=0
   assert ypos+h<=1024
   tile=Image.new('RGBA',(w,h));count=0
   for yy in range(h):
    for xx in range(w):
     red,green,blue,alpha=image.getpixel((x+xx,y+yy));bright=max(red,green,blue);saturation=bright-min(red,green,blue)
     if alpha<128 or bright<(125 if isreflection else 175):continue
     if saturation<55 and not (not isreflection and min(red,green,blue)>180):continue
     # Assorbe soltanto i pixel luminosi; la geometria dello sfondo resta intatta.
     a=round(min(1,max(0,(bright-110)/100))*200)
     tile.putpixel((xx,yy),(12,15,31,a));count+=1
   assert count,name
   atlas.paste(tile,(xpos,ypos));points.append(dict(id=name+('-reflection' if isreflection else '-neon'),kind='reflection' if isreflection else 'neon',neon=True,group=name,rect=[x,y,w,h],maskRect=[xpos,ypos,w,h],seed=79+i*137,pixels=count,strength=.5 if isreflection else 1))
   xpos+=w;rowheight=max(rowheight,h)
atlas.save(folder/'neon-mask.png');data=dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),mask=dict(id='neon-mask',image='../original-backgrounds/porta-palazzo/neon-mask.png',width=1024,height=1024),points=points)
(folder/'lights.json').write_text(json.dumps(data,indent=2)+'\n')
all_data={p.parent.name:json.loads(p.read_text()) for p in (ROOT/'original-backgrounds').glob('*/lights.json')}
(ROOT/'demo-moves/stage-lights-catalog.js').write_text('// Maschere locali degli stage.\n(function(root){const data='+json.dumps(all_data,indent=2)+';if(typeof module==="object"&&module.exports)module.exports=data;else root.STAGE_LIGHTS_CATALOG=data;})(typeof globalThis!=="undefined"?globalThis:this);\n')
print('Porta Palazzo:',len(groups),'neon e riflessi collegati.')
