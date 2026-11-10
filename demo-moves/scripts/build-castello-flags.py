"""Prepara le pieghe animate delle bandiere senza modificare lo stage originale."""
from pathlib import Path
import math
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2]
source=Image.open(ROOT/'original-backgrounds/piazza-castello/stage-castello.png').convert('RGBA')
flags=[((1122,594,38,112),[(3,3),(31,54),(22,110),(2,96)],'italian'),((1177,594,42,112),[(3,3),(39,61),(25,110),(8,95)],'european')]
atlas=Image.new('RGBA',(80*24,112))
for index,(rect,poly,kind) in enumerate(flags):
 x,y,w,h=rect;tile=source.crop((x,y,x+w,y+h));mask=Image.new('L',(w,h));ImageDraw.Draw(mask).polygon(poly,fill=255)
 for py in range(h):
  for px in range(w):
   r,g,b,a=tile.getpixel((px,py));color=((g>r*1.12 and g>b*1.1) or (r>g*1.4 and r>b*1.3) or (r>170 and g>160 and b>150)) if kind=='italian' else ((b>r*1.3 and b>g*1.1) or (r>150 and g>130 and b<100 and abs(r-g)<50))
   if not mask.getpixel((px,py)) or not color:tile.putpixel((px,py),(0,0,0,0))
 assert tile.getbbox(),kind
 for frame in range(24):
  result=tile.copy()
  for py in range(h):
   for px in range(w):
    r,g,b,a=tile.getpixel((px,py))
    if not a:continue
    fold=1+math.sin(py*.14-px*.1-frame*math.tau/24+index)*.38
    result.putpixel((px,py),(*[max(0,min(255,round(c*fold))) for c in (r,g,b)],a))
  atlas.paste(result,(frame*80+(38 if index else 0),0))
atlas.save(ROOT/'original-backgrounds/piazza-castello/bandiere-animate.png')
print('Bandiere: 24 frame, ciclo 2 secondi; maschere estratte dai colori originali.')
