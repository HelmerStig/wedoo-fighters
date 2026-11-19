"""Isolated native ComfyUI first/last-frame experiment; no production assets written."""
import argparse
import hashlib
import json
from pathlib import Path
import time
import urllib.request
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'autosprite-agent/output/comfy-local-20261119'

def request(base, route, data=None):
    payload = None if data is None else json.dumps(data).encode()
    req = urllib.request.Request(base + route, data=payload, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as response:
        return json.load(response)

def prepare():
    (WORK / 'input').mkdir(parents=True, exist_ok=True)
    (WORK / 'results').mkdir(exist_ok=True)
    sources = ['PNG/MARSAN.png', 'PNG/STRONG-PUNCH/marsan-strong-punch-preparation.png']
    references = []
    for source, name in zip(sources, ['marsan-idle.png', 'marsan-preparation.png']):
        path = ROOT / source
        image = Image.open(path).convert('RGBA')
        assert image.size == (512, 512), (source, image.size)
        matte = Image.new('RGBA', image.size, (128, 128, 128, 255))
        matte.alpha_composite(image)
        matte.convert('RGB').save(WORK / 'input' / name)
        references.append({'path': source, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    def node(kind, **inputs):
        return {'class_type': kind, 'inputs': inputs}
    workflow = {
        '1': node('UNETLoader', unet_name='wan2.1_fun_inp_1.3B_bf16.safetensors', weight_dtype='default'),
        '2': node('ModelSamplingSD3', model=['1', 0], shift=5),
        '3': node('CLIPLoader', clip_name='umt5_xxl_fp8_e4m3fn_scaled.safetensors', type='wan', device='cpu'),
        '4': node('CLIPTextEncode', clip=['3', 0], text='A single 16-bit pixel art fighter facing right, full body, fixed camera. He slowly shifts his weight and rotates his torso away from the camera to wind up one strong punch, drawing back only the punching arm. The other hand stays close to his body. End in the supplied preparation pose. Preserve his face, red navy and cream tracksuit jacket, jeans, shoes, scale and framing. Feet stay on the ground. Neutral solid gray background. One continuous smooth movement, no punch yet.'),
        '5': node('CLIPTextEncode', clip=['3', 0], text='camera movement, zoom, attack, second punch, changing clothes, changing face, extra limbs, extra fingers, sliding feet, walking, text, lighting effects, background scenery, blur, photorealism'),
        '6': node('VAELoader', vae_name='wan_2.1_vae.safetensors'),
        '7': node('LoadImage', image='marsan-idle.png'),
        '8': node('LoadImage', image='marsan-preparation.png'),
        '9': node('CLIPVisionLoader', clip_name='clip_vision_h.safetensors'),
        '10': node('CLIPVisionEncode', clip_vision=['9', 0], image=['7', 0], crop='none'),
        '11': node('WanFunInpaintToVideo', positive=['4', 0], negative=['5', 0], vae=['6', 0], width=512, height=512, length=17, batch_size=1, start_image=['7', 0], end_image=['8', 0], clip_vision_output=['10', 0]),
        '12': node('KSampler', model=['2', 0], positive=['11', 0], negative=['11', 1], latent_image=['11', 2], seed=20261119, steps=12, cfg=5, sampler_name='uni_pc', scheduler='simple', denoise=1),
        '13': node('VAEDecodeTiled', samples=['12', 0], vae=['6', 0], tile_size=256, overlap=64, temporal_size=16, temporal_overlap=4),
        '14': node('SaveImage', images=['13', 0], filename_prefix='marsan-preparation/frame'),
    }
    (WORK / 'workflow-api.json').write_text(json.dumps(workflow, indent=2), encoding='utf-8')
    (WORK / 'references.json').write_text(json.dumps(references, indent=2), encoding='utf-8')
    (WORK / 'extra-model-paths.yaml').write_text('local_trial:\n  base_path: ' + (WORK / 'models').as_posix() + '\n  diffusion_models: diffusion_models\n  text_encoders: text_encoders\n  vae: vae\n  clip_vision: clip_vision\n', encoding='utf-8')
    return workflow

def export(history, prompt_id, results):
    records = history[prompt_id]['outputs']['14']['images']
    frames = []
    for record in records:
        path = WORK / 'output' / record['subfolder'] / record['filename']
        frames.append(Image.open(path).convert('RGB'))
    assert len(frames) == 17, len(frames)
    results.mkdir(exist_ok=True)
    frames[0].save(results / 'marsan-preparation.gif', save_all=True, append_images=frames[1:], duration=80, loop=0)
    import av
    with av.open(str(results / 'marsan-preparation.mp4'), mode='w') as video:
        stream = video.add_stream('libx264', rate=16)
        stream.width = stream.height = 512
        stream.pix_fmt = 'yuv420p'
        stream.options = {'crf': '16'}
        for frame in frames:
            for packet in stream.encode(av.VideoFrame.from_image(frame)):
                video.mux(packet)
        for packet in stream.encode():
            video.mux(packet)
    atlas = Image.new('RGB', (5 * 512, 4 * 512), (128, 128, 128))
    for index, frame in enumerate(frames):
        atlas.paste(frame, (index % 5 * 512, index // 5 * 512))
    atlas.save(results / 'marsan-preparation-raw-sheet.png')
    (results / 'atlas.json').write_text(json.dumps({
        'image': 'marsan-preparation-raw-sheet.png', 'transparent': False,
        'frames': [{'index': i, 'frame': {'x': i % 5 * 512, 'y': i // 5 * 512, 'w': 512, 'h': 512}} for i in range(len(frames))],
        'note': 'Raw model output; no endpoint replacement, retouching or pixelation.'
    }, indent=2))
    sheet = Image.new('RGB', (5 * 256, 4 * 280), '#303030')
    draw = ImageDraw.Draw(sheet)
    for index, frame in enumerate(frames):
        x, y = index % 5 * 256, index // 5 * 280
        sheet.paste(frame.resize((256, 256), Image.Resampling.NEAREST), (x, y))
        draw.text((x + 8, y + 258), str(index), fill='white')
    sheet.save(results / 'contact-sheet.png')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--prepare-only', action='store_true')
    parser.add_argument('--whole-timeline', action='store_true', help='Decode all 17 frames together in time, retaining spatial tiling.')
    parser.add_argument('--base', default='http://127.0.0.1:8189')
    args = parser.parse_args()
    workflow = prepare()
    suffix = '-whole-timeline' if args.whole_timeline else ''
    if args.whole_timeline:
        workflow['13']['inputs']['temporal_size'] = 32
        workflow['14']['inputs']['filename_prefix'] = 'marsan-preparation-whole-timeline/frame'
        (WORK / ('workflow-api' + suffix + '.json')).write_text(json.dumps(workflow, indent=2), encoding='utf-8')
    if args.prepare_only:
        print('Prepared workflow and unchanged-size reference inputs.', flush=True)
        return
    receipt_path = WORK / ('job-receipt' + suffix + '.json')
    workflow_hash = hashlib.sha256(json.dumps(workflow, sort_keys=True).encode()).hexdigest()
    if receipt_path.exists():
        receipt = json.loads(receipt_path.read_text())
        if receipt.get('workflow_sha256') != workflow_hash:
            raise RuntimeError('Saved job belongs to a different workflow; use a separate trial directory.')
        print('Resuming existing job; not submitting again.', flush=True)
    else:
        stats = request(args.base, '/system_stats')
        (WORK / 'system-stats.json').write_text(json.dumps(stats, indent=2))
        receipt = request(args.base, '/prompt', {'prompt': workflow, 'client_id': 'wedoo-local-trial'})
        receipt['started_at'] = time.time()
        receipt['workflow_sha256'] = workflow_hash
        receipt_path.write_text(json.dumps(receipt, indent=2))
    prompt_id = receipt['prompt_id']
    print('Job: ' + prompt_id, flush=True)
    while True:
        history = request(args.base, '/history/' + prompt_id)
        if prompt_id in history:
            (WORK / ('history' + suffix + '.json')).write_text(json.dumps(history, indent=2))
            status = history[prompt_id]['status']
            if status['status_str'] != 'success':
                raise RuntimeError(json.dumps(status))
            results = WORK / ('results' + suffix)
            export(history, prompt_id, results)
            messages = history[prompt_id]['status']['messages']
            started = next(data['timestamp'] for kind, data in messages if kind == 'execution_start')
            finished = next(data['timestamp'] for kind, data in messages if kind == 'execution_success')
            seconds = (finished - started) / 1000
            (results / 'run-summary.json').write_text(json.dumps({'prompt_id': prompt_id, 'execution_seconds': seconds, 'frame_count': 17, 'frame_size': [512, 512], 'video_fps': 16, 'gif_frame_ms': 80, 'workflow_sha256': workflow_hash}, indent=2))
            print('Job execution: %.1f seconds; results: %s' % (seconds, results), flush=True)
            return
        time.sleep(10)

if __name__ == '__main__':
    main()
