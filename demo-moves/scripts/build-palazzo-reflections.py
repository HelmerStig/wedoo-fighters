from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
folder=ROOT/'original-backgrounds/porta-palazzo'
with Image.open(folder/'porta-palazzo-stage.png') as image:
    tile=image.convert('RGBA').crop((0,885,2550,1080))
for y in range(tile.height):
    for x in range(tile.width):
        r,g,b,a=tile.getpixel((x,y));v=max(r,g,b);sat=v-min(r,g,b)
        tile.putpixel((x,y),(0,0,0,0) if v<130 or sat<70 else (r,g,b,round(min(1,(v-110)/100)*min(1,sat/130)*210)))
tile.save(folder/'riflessi.png')
