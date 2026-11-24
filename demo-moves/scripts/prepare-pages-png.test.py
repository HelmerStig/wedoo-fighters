"""Palette conversion must preserve every RGBA value, including transparent RGB."""
import importlib.util,unittest,io,json,tempfile
from unittest.mock import patch
from pathlib import Path
from PIL import Image,PngImagePlugin
import struct
spec=importlib.util.spec_from_file_location('pages_png',Path(__file__).with_name('prepare-pages-png.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class PaletteTests(unittest.TestCase):
    def test_valid_near_limit_cache_skips_futile_recompression(self):
        with tempfile.TemporaryDirectory(prefix='wedoo-pages-budget-') as temp:
            root=Path(temp)
            # No files inventory is needed unless compression actually starts.
            # A restored 995 MB package already meets the real Pages limit.
            inventory=json.dumps({'bytes':995_000_000}).encode()
            with patch.object(module,'ROOT',root),patch.object(module,'CACHE',root/'cache'),patch.object(module.subprocess,'check_output',return_value=inventory):
                module.main()
            self.assertFalse((root/'cache').exists())

    def test_package_above_real_limit_still_fails_without_lossless_savings(self):
        with tempfile.TemporaryDirectory(prefix='wedoo-pages-budget-') as temp:
            root=Path(temp)
            inventory=json.dumps({'bytes':1_000_000_001,'files':[],'optimized':{}}).encode()
            with patch.object(module,'ROOT',root),patch.object(module,'CACHE',root/'cache'),patch.object(module.subprocess,'check_output',return_value=inventory):
                with self.assertRaisesRegex(RuntimeError,'below 1 GB'):
                    module.main()

    def test_existing_palette_recompression_preserves_alpha_and_hidden_rgb(self):
        image=Image.new('P',(256,2));image.putpalette([v for i in range(256) for v in (i,255-i,i//2)])
        image.putdata(list(range(256))*2);image.info['transparency']=bytes(range(256))
        result=module.lossless_copy(image);output=io.BytesIO();result.save(output,format='PNG',optimize=True,compress_level=9)
        restored=Image.open(io.BytesIO(output.getvalue()))
        self.assertEqual(restored.convert('RGBA').tobytes(),image.convert('RGBA').tobytes())
        self.assertEqual(result.mode,'P');self.assertEqual(image.info['transparency'],bytes(range(256)))

    def test_exact_rgba_including_same_rgb_with_different_alpha(self):
        pixels=[(4,8,12,0),(4,8,12,127),(4,8,12,255),(255,127,19,64),(1,2,3,0)]
        image=Image.new('RGBA',(len(pixels),1));image.putdata(pixels)
        result=module.indexed_copy(image);output=io.BytesIO();result.save(output,format='PNG')
        restored=Image.open(io.BytesIO(output.getvalue())).convert('RGBA')
        self.assertEqual(restored.tobytes(),image.tobytes())
        self.assertEqual(image.getpixel((0,0)),pixels[0])

    def test_more_than_256_colors_are_not_quantized(self):
        image=Image.new('RGBA',(257,1));image.putdata([(i%256,i//256,0,255) for i in range(257)])
        self.assertIsNone(module.indexed_copy(image))
        result=module.lossless_copy(image);output=io.BytesIO();result.save(output,format='PNG',optimize=True)
        self.assertEqual(Image.open(io.BytesIO(output.getvalue())).convert('RGBA').tobytes(),image.tobytes())
        self.assertEqual(result.mode,'RGBA')

    def test_color_and_resolution_chunks_are_preserved(self):
        image=Image.new('RGBA',(2,2),(12,34,56,128));info=PngImagePlugin.PngInfo()
        info.add(b'gAMA',struct.pack('>I',45455));info.add(b'sRGB',bytes([0]))
        original=io.BytesIO();image.save(original,format='PNG',pnginfo=info,dpi=(96,96))
        encoded=io.BytesIO();module.indexed_copy(image).save(encoded,format='PNG')
        result=Image.open(io.BytesIO(module.copy_color_metadata(original.getvalue(),encoded.getvalue())))
        self.assertEqual(result.info['srgb'],0);self.assertEqual(result.info['gamma'],.45455)
        self.assertEqual(result.info['dpi'],Image.open(io.BytesIO(original.getvalue())).info['dpi'])
        self.assertEqual(result.convert('RGBA').tobytes(),image.tobytes())

if __name__=='__main__':unittest.main()
