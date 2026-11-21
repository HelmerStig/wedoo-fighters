"""Palette conversion must preserve every RGBA value, including transparent RGB."""
import importlib.util,unittest,io
from pathlib import Path
from PIL import Image,PngImagePlugin
import struct
spec=importlib.util.spec_from_file_location('pages_png',Path(__file__).with_name('prepare-pages-png.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class PaletteTests(unittest.TestCase):
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
