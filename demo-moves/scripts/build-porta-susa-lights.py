"""Maschere per le sole luci calde del fondale. Nessuna modifica al PNG originale."""
import hashlib
import json
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parents[2]
folder=root/'original-backgrounds/porta-susa'
source=folder/'porta-susa.png'
windows=[(1800,400,1880,543),(1902,378,1983,532),(2020,356,2100,519),(2140,333,2225,510),(2274,315,2360,497),
    (1640,632,1738,815),(1800,630,1887,814),(1905,615,2005,814),(2020,600,2125,814),(2148,582,2267,814),(2290,560,2400,814),(2470,570,2545,814)]
lamps=[(2230,423,2257,445),(2305,427,2333,450)]
atlas=Image.new('RGBA',(512,1024));points=[]
with Image.open(source) as image:
    image=image.convert('RGBA')
    for i,box in enumerate(windows+lamps):
        lamp=i>=len(windows);x,y,right,bottom=box;w,h=right-x,bottom-y
        tile=Image.new('RGBA',(w,h));count=0
        for yy in range(h):
            for xx in range(w):
                wx,wy=x+xx,y+yy;r,g,b,a=image.getpixel((wx,wy))
                if not a or g<115 or r<165 or g<=b*1.13:continue
                if lamp:
                    if r<g*.96 or ((xx-w/2)/(w/2))**2+((yy-h/2)/(h/2))**2>1:continue
                elif r<=g*1.03 or any(l<=wx<rgt and top<=wy<btm for l,top,rgt,btm in lamps):continue
                alpha=round(min(1,max(0,(g-100)/55))*235)
                tile.putpixel((xx,yy),(18,17,34,alpha));count+=1
        if not count:raise ValueError('Maschera vuota: '+str(box))
        mx,my=i%4*128,i//4*256;atlas.paste(tile,(mx,my))
        points.append(dict(id=('lamp-' if lamp else 'window-')+str(i-len(windows)+1 if lamp else i+1),kind='lamp' if lamp else 'window',
            rect=[x,y,w,h],maskRect=[mx,my,w,h],seed=37+i*139,pixels=count))
atlas.save(folder/'lights-mask.png')
data=dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),mask=dict(id='lights-mask',image='../original-backgrounds/porta-susa/lights-mask.png',width=512,height=1024),points=points)
(folder/'lights.json').write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
(root/'demo-moves/stage-lights-catalog.js').write_text('// Generato da scripts/build-porta-susa-lights.py.\n(function(root){const data='+json.dumps({'porta-susa':data},indent=2)+';if(typeof module==="object"&&module.exports)module.exports=data;else root.STAGE_LIGHTS_CATALOG=data;})(typeof globalThis!=="undefined"?globalThis:this);\n',encoding='utf-8')
print('Porta Susa: maschere di 12 finestre e 2 lampioni, PNG sorgente integro.')
