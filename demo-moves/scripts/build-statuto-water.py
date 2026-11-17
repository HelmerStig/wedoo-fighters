"""Estrae solo l'acqua azzurra del monumento, lasciando invariato statuto.png."""
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];folder=ROOT/'original-backgrounds/piazza-statuto'
origin=(1165,400);regions=[(1324,400,1348,492),(1273,437,1290,573),(1315,490,1337,615),(1197,530,1215,614),(1180,610,1205,690),(1204,650,1226,724),(1312,640,1340,761),(1274,713,1295,847),(1306,810,1328,944)]
with Image.open(folder/'statuto.png') as source:
 source=source.convert('RGBA');tile=Image.new('RGBA',(210,550));count=0
 for left,top,right,bottom in regions:
  for y in range(top,bottom):
   for x in range(left,right):
    r,g,b,a=source.getpixel((x,y))
    if a<128 or b<150 or g<115 or b<r*1.08 or g<r*.98 or g<b*.8:continue
    tile.putpixel((x-origin[0],y-origin[1]),(round(r*.5),round(g*.6),round(b*.7),210));count+=1
 assert count>500,count
 tile.save(folder/'acqua-mask.png');print('Pixel acqua:',count)
