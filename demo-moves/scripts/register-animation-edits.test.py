"""Reviewed edits retain provenance and timing; structural changes must fail."""
from pathlib import Path
from PIL import Image
import tempfile,unittest,shutil,json,hashlib,subprocess,sys
SCRIPT=Path(__file__).with_name('register-animation-edits.py')
sha=lambda b:hashlib.sha256(b).hexdigest()

class RegistrationTests(unittest.TestCase):
    def fixture(self,root):
        script=root/'demo-moves/scripts/register-animation-edits.py';script.parent.mkdir(parents=True);shutil.copyfile(SCRIPT,script)
        folder=root/'animation/peppo';folder.mkdir(parents=True)
        png=folder/'peppo-test.png';image=Image.new('RGBA',(2,2),(10,20,30,255));image.save(png)
        original_png=sha(png.read_bytes());original_rgba=sha(image.tobytes())
        atlas={'frames':{'0':{'frame':{'x':0,'y':0,'w':2,'h':2},'duration':1500,'source_frame':9,'rgbaSha256':original_rgba}},'meta':{'size':{'w':2,'h':2}}}
        manifest={'items':[{'character':'PEPPO','png':'animation/peppo/peppo-test.png','atlas':'animation/peppo/peppo-test.json','frames':1,'frameWidth':2,'frameHeight':2,'pngSha256':original_png}]}
        ap=png.with_suffix('.json');ap.write_text(json.dumps(atlas));mp=root/'animation/test-manifest.json';mp.write_text(json.dumps(manifest))
        def run():return subprocess.run([sys.executable,str(script),'animation/test-manifest.json','--characters','peppo','--note','Reviewed fixture edit'],cwd=root,capture_output=True,text=True)
        return png,ap,mp,original_png,original_rgba,run

    def test_registers_without_changing_png_timing_or_source_and_is_idempotent(self):
        with tempfile.TemporaryDirectory(prefix='wedoo-edit-test-') as temp:
            png,ap,mp,original_png,original_rgba,run=self.fixture(Path(temp))
            image=Image.open(png).convert('RGBA');image.putpixel((0,0),(99,88,77,127));image.save(png);edited=png.read_bytes()
            result=run();self.assertEqual(result.returncode,0,result.stderr)
            item=json.loads(mp.read_text())['items'][0];frame=json.loads(ap.read_text())['frames']['0']
            self.assertEqual(png.read_bytes(),edited);self.assertEqual(item['pngSha256'],sha(edited));self.assertEqual(item['importedPngSha256'],original_png)
            self.assertEqual(frame['importedRgbaSha256'],original_rgba);self.assertEqual(frame['rgbaSha256'],sha(image.tobytes()))
            self.assertEqual(frame['duration'],1500);self.assertEqual(frame['source_frame'],9)
            before=mp.read_bytes(),ap.read_bytes();self.assertEqual(run().returncode,0);self.assertEqual((mp.read_bytes(),ap.read_bytes()),before)

    def test_rejects_changed_canvas_without_writing_metadata(self):
        with tempfile.TemporaryDirectory(prefix='wedoo-edit-test-') as temp:
            png,ap,mp,_,_,run=self.fixture(Path(temp));before=mp.read_bytes(),ap.read_bytes()
            Image.new('RGBA',(3,2)).save(png);result=run()
            self.assertNotEqual(result.returncode,0);self.assertIn('dimensions changed',result.stderr)
            self.assertEqual((mp.read_bytes(),ap.read_bytes()),before)

    def test_detects_edits_only_in_a_shared_second_sheet(self):
        with tempfile.TemporaryDirectory(prefix='wedoo-edit-test-') as temp:
            root=Path(temp);png,ap,mp,_,_,run=self.fixture(root)
            second=png.with_name('shared.png');image=Image.new('RGBA',(3,3),(30,40,50,255));image.save(second)
            atlas=json.loads(ap.read_text());atlas['meta']['sheets']=[{'size':{'w':2,'h':2}},{'size':{'w':3,'h':3}}]
            atlas['frames']['1']={'frame':{'x':1,'y':1,'w':2,'h':2},'sheet':1,'duration':800,'source_frame':12,'rgbaSha256':sha(image.crop((1,1,3,3)).tobytes())}
            manifest=json.loads(mp.read_text());item=manifest['items'][0];item['frames']=2
            item['sheets']=[{'png':item['png'],'pngSha256':item['pngSha256']},{'png':'animation/peppo/shared.png','pngSha256':sha(second.read_bytes())}]
            ap.write_text(json.dumps(atlas));mp.write_text(json.dumps(manifest))
            image.putpixel((2,2),(99,1,2,128));image.save(second);original_primary=png.read_bytes()
            result=run();self.assertEqual(result.returncode,0,result.stderr)
            self.assertEqual(png.read_bytes(),original_primary)
            self.assertEqual(json.loads(mp.read_text())['items'][0]['sheets'][1]['pngSha256'],sha(second.read_bytes()))
            frame=json.loads(ap.read_text())['frames']['1'];self.assertTrue(frame['locallyEdited']);self.assertEqual(frame['duration'],800)

if __name__=='__main__':unittest.main()
