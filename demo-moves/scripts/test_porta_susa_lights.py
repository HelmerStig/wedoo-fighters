import json
from pathlib import Path
import unittest
from PIL import Image


class PortaSusaLights(unittest.TestCase):
    def test_only_existing_warm_lights_are_masked_and_lamps_are_independent(self):
        root=Path(__file__).resolve().parents[2]
        folder=root/'original-backgrounds/porta-susa'
        data=json.loads((folder/'lights.json').read_text(encoding='utf-8'))
        with Image.open(folder/'porta-susa.png') as source, Image.open(folder/'lights-mask.png') as mask:
            source=source.convert('RGBA');mask=mask.convert('RGBA')
            lamps=[p['rect'] for p in data['points'] if p['kind']=='lamp']
            for point in data['points']:
                x,y,w,h=point['rect'];mx,my,_,_=point['maskRect'];count=0
                for yy in range(h):
                    for xx in range(w):
                        if not mask.getpixel((mx+xx,my+yy))[3]:continue
                        count+=1;r,g,b,a=source.getpixel((x+xx,y+yy))
                        self.assertGreater(a,0);self.assertGreaterEqual(r,165);self.assertGreaterEqual(g,115);self.assertGreater(g,b*1.13)
                        if point['kind']=='window':
                            self.assertFalse(any(lx<=x+xx<lx+lw and ly<=y+yy<ly+lh for lx,ly,lw,lh in lamps),'lampione incluso nella maschera della finestra')
                self.assertEqual(count,point['pixels'])


if __name__=='__main__':unittest.main()
