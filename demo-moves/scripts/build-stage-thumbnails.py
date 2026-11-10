"""Miniature locali dei soli sfondi: niente spritesheet o runtime di animazione."""
import json,subprocess
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
stages=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./demo-moves/stages-catalog.js')))"],cwd=ROOT,text=True))
folder=ROOT/'demo-moves/assets/stages';folder.mkdir(parents=True,exist_ok=True)
for stage in stages:
    image=Image.new('RGBA',(stage['width'],stage['height']))
    for index,layer in sorted(enumerate(stage['layers']),key=lambda pair:(pair[1]['zIndex'],pair[0])):
        with Image.open(ROOT/'demo-moves'/layer['image']) as source:
            image.alpha_composite(source.convert('RGBA'),((stage['width']-layer['width'])//2,0))
    width=stage.get('viewportWidth',1920);left=(stage['width']-width)//2
    image=image.crop((left,0,left+width,stage['height'])).convert('RGB').resize((640,360),Image.Resampling.LANCZOS)
    image.save(folder/(stage['id']+'.webp'),quality=82,method=6)
    print(stage['name'],(folder/(stage['id']+'.webp')).stat().st_size,'bytes')
