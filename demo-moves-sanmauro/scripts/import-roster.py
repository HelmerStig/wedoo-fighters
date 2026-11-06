"""Copia idle, walk e jump realmente configurate nel vecchio progetto.
Uso: python demo-moves-sanmauro/scripts/import-roster.py F:/Personali/Godot
Richiede Pillow. Nessuna modifica al progetto sorgente.
"""
import hashlib
import json
from pathlib import Path
import re
import shutil
import statistics
import sys
import subprocess
from PIL import Image
from jump_timing import apply_timing

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('F:/Personali/Godot')
roster = [
    ('arianna', 'Arianna', 'Arianna'), ('bue', 'Bue', 'Bue'),
    ('mangler', 'Mangler', 'Mangler'), ('mileto', 'Mileto', 'Mileto'),
    ('oscare', 'Oscare', 'Oscare'), ('peirolo', 'Peirò', 'Peirolo'),
    ('torpe', 'Torpe', 'Torpe'),
]
characters = []
shared = (source / 'scripts' / 'IdleRosterFighter.gd').read_text(encoding='utf-8-sig')


def number(code, key, fallback=None):
    match = re.search(r'\b' + re.escape(key) + r'\s*(?::=|=)\s*(\d+(?:\.\d+)?)', code)
    if match:
        return float(match[1])
    if fallback is not None:
        return number(fallback, key)
    raise ValueError(f'Parametro non trovato: {key}')


def vector(code, key, fallback=None):
    match = re.search(r'\b' + re.escape(key) + r'\s*(?::=|=)\s*Vector2\(([^)]+)\)', code)
    if match:
        return tuple(float(v.strip()) for v in match[1].split(','))
    if fallback is not None:
        return vector(fallback, key)
    raise ValueError(f'Dimensioni cella non trovate: {key}')


def cell_size(code, key, fallback=None):
    return tuple(int(v) for v in vector(code, key, fallback))


def source_transform(ident, move, code):
    if ident == 'mangler':
        # update_sprite_scale: idle/jump sono reworked, walk resta legacy.
        prefix = 'LEGACY_SPRITE' if move == 'walk' else 'REWORK_SPRITE'
        return dict(scale=vector(code, prefix + '_SCALE'), position=vector(code, prefix + '_POSITION'))
    if ident == 'arianna':
        return dict(scale=vector(code, 'ARIANNA_SPRITE_SCALE'), position=vector(code, 'ARIANNA_SPRITE_POSITION'))
    scale = vector(code, 'sprite_scale', shared)
    position = vector(code, 'sprite_position', shared)
    if not any(scale):
        scale = vector(code, 'idle_sprite_scale', shared)
    if not any(position):
        position = vector(code, 'idle_sprite_position', shared)
    return dict(scale=scale, position=position)


def mangler_jump():
    """Il salto di Mangler non è ricostruito dal catalogo: arriva dal .tres."""
    scene_path = 'scenes/Mangler.tscn'
    scene_code = (source / scene_path).read_text(encoding='utf-8-sig')
    resource_id = re.search(r'sprite_frames = ExtResource\("([^"]+)"\)', scene_code)[1]
    resource_path = re.search(r'path="res://([^"]+)" id="' + re.escape(resource_id) + '"', scene_code)[1]
    resource = (source / resource_path).read_text(encoding='utf-8-sig')
    records = re.finditer(r'"frames":\s*\[(.*?)\],\s*"loop":\s*(\w+),\s*"name":\s*&?"([^"]+)",\s*"speed":\s*([\d.]+)', resource, re.S)
    record = next(r for r in records if r[3] == 'jump')
    frames, weights, sheets = [], [], set()
    for entry in re.finditer(r'"duration":\s*([\d.]+),\s*"texture":\s*SubResource\("([^"]+)"\)', record[1]):
        block = re.search(r'\[sub_resource type="AtlasTexture" id="' + re.escape(entry[2]) + r'"\](.*?)(?=\n\[|\Z)', resource, re.S)[1]
        rect = re.search(r'region = Rect2\(([^)]+)\)', block)[1]
        frames.append([int(float(v.strip())) for v in rect.split(',')])
        weights.append(float(entry[1]))
        texture_id = re.search(r'atlas = ExtResource\("([^"]+)"\)', block)[1]
        sheets.add(re.search(r'path="res://([^"]+)" id="' + re.escape(texture_id) + '"', resource)[1])
    if not frames or len(sheets) != 1:
        raise ValueError('Risorsa salto Mangler non supportata')
    return sheets.pop(), frames, weights, float(record[4]), resource_path


for ident, name, scene in roster:
    custom = ident in ('arianna', 'mangler')
    config_path = ('scripts/' + scene + '.gd') if custom else ('scenes/' + scene + '.tscn')
    code = (source / config_path).read_text(encoding='utf-8-sig')
    destination = root / 'assets' / 'characters' / ident
    destination.mkdir(parents=True, exist_ok=True)
    animations = []
    for move, label in [('idle', 'Idle'), ('walk', 'Camminata'), ('jump', 'Salto')]:
        start, explicit_frames, weights, jump_timing = 0, None, None, {}
        animation_config_path = config_path
        if ident == 'mangler' and move == 'jump':
            relative, explicit_frames, weights, original_fps, animation_config_path = mangler_jump()
            count = len(explicit_frames)
            fw, fh = explicit_frames[0][2:]
            takeoff = int(number(code, 'JUMP_TAKEOFF_FRAME'))
        elif custom:
            prefix = ('ARIANNA_' if ident == 'arianna' else '') + move.upper()
            relative = re.search(r'const ' + prefix + r'_SHEET\s*:=\s*preload\(\s*"res://([^"]+)"', code)[1]
            count = int(number(code, prefix + '_FRAME_COUNT'))
            columns = int(number(code, prefix + '_COLUMNS'))
            fw, fh = cell_size(code, prefix + '_CELL_SIZE')
            catalog = (source / 'scripts' / (scene + 'AnimationCatalog.gd')).read_text(encoding='utf-8-sig')
            function = re.search(r'func configure_' + move + r'_frames\(\).*?(?=\nfunc |\Z)', catalog, re.S)[0]
            if move == 'jump':
                original_fps = number(code, prefix + '_FPS')
                takeoff = int(number(code, prefix + '_TAKEOFF_FRAME'))
            else:
                original_fps = float(re.search(r'set_animation_speed\(&"' + move + r'",\s*([\d.]+)', function)[1])
        else:
            resource_id = re.search(move + r'_sheet = ExtResource\("([^"]+)"\)', code)[1]
            relative = re.search(r'path="res://([^"]+)" id="' + re.escape(resource_id) + '"', code)[1]
            if move == 'jump':
                start = int(number(code, 'jump_start_frame', shared)) - 1
                count = int(number(code, 'jump_idle_frame', shared)) - start - 1
                takeoff = int(number(code, 'jump_takeoff_frame', shared)) - start - 1
            else:
                count = int(number(code, move + '_frame_count', shared))
            columns = int(number(code, move + '_columns', shared))
            fw, fh = cell_size(code, move + '_cell_size', shared)
            original_fps = number(shared, move.upper() + '_FPS')
        sheet = source / relative
        frames = explicit_frames if explicit_frames is not None else [[i % columns * fw, i // columns * fh, fw, fh] for i in range(start, start+count)]
        if move == 'jump':
            # Fighter.configure_jump_startup_timing comprime solo la preparazione.
            fighter_code = (source / 'scripts/Fighter.gd').read_text(encoding='utf-8-sig')
            startup = re.search(r'const JUMP_STARTUP_SECONDS\s*:=\s*([\d.]+)\s*/\s*([\d.]+)', fighter_code)
            startup_ms = float(startup[1]) / float(startup[2]) * 1000
            durations = [(weights[i] if weights else 1) * 1000/original_fps for i in range(count)]
            if takeoff <= 0 or takeoff >= count:
                raise ValueError(f'Stacco fuori sequenza: {ident}')
            durations[:takeoff] = [startup_ms/takeoff] * takeoff
            jump_timing = dict(frameDurations=durations, durationMs=sum(durations),
                takeoffFrame=takeoff, takeoffMs=startup_ms, sourceLoop=False)
        with Image.open(sheet) as image:
            width, height = image.size
            if any(x+w > width or y+h > height for x, y, w, h in frames):
                raise ValueError(f'Spritesheet incompatibile: {sheet}')
            bounds = []
            for x, y, w, h in frames:
                alpha = image.crop((x, y, x+w, y+h)).convert('RGBA').getchannel('A')
                bbox = alpha.point(lambda value: 255 if value >= 32 else 0).getbbox()
                if bbox is None:
                    raise ValueError(f'Frame vuoto: {sheet}, ({x}, {y})')
                bounds.append(bbox)
            union = [min(b[0] for b in bounds), min(b[1] for b in bounds), max(b[2] for b in bounds), max(b[3] for b in bounds)]
        shutil.copy2(sheet, destination / (move + '.png'))
        animations.append(dict(id=move, name=label, image=f'assets/characters/{ident}/{move}.png',
            frameWidth=fw, frameHeight=fh, frames=frames, playbackFps=original_fps if move == 'jump' else 24,
            sourceFps=original_fps, sheetWidth=width, sheetHeight=height,
            sourcePath=relative, sourceConfigPath=animation_config_path,
            sourceTransform=source_transform(ident, move, code),
            contentBounds=union, medianContentHeight=statistics.median(b[3]-b[1] for b in bounds),
            trimmed='trimmed' in sheet.name.lower(),
            sourceSha256=hashlib.sha256(sheet.read_bytes()).hexdigest(), **jump_timing))
    # Un solo fattore per personaggio conserva le proporzioni Godot fra le mosse.
    # Ancoraggi fissi sull'intero ciclo: nessun auto-fit per singolo frame.
    target_height, center_x, ground_y = 344, 256, 430
    idle = animations[0]
    factor = target_height / (idle['medianContentHeight'] * idle['sourceTransform']['scale'][1])
    for animation in animations:
        sx, sy = [v * factor for v in animation['sourceTransform']['scale']]
        left, top, right, bottom = animation['contentBounds']
        anchor_x, anchor_y = (left + right) / 2, bottom
        rect = [center_x-anchor_x*sx, ground_y-anchor_y*sy,
                animation['frameWidth']*sx, animation['frameHeight']*sy]
        animation['preview'] = dict(drawRect=rect, anchor=[anchor_x, anchor_y],
            scale=[sx, sy], centerX=center_x, groundY=ground_y, targetIdleHeight=target_height)
    # Solo l'anteprima derivata viene trasformata; idle.png/walk.png restano copie integre.
    x, y, w, h = idle['preview']['drawRect']
    with Image.open(destination / 'idle.png') as image:
        pose = image.crop((0, 0, idle['frameWidth'], idle['frameHeight'])).convert('RGBA')
        pose = pose.resize((round(w), round(h)), Image.Resampling.NEAREST)
        portrait = Image.new('RGBA', (512, 512))
        portrait.alpha_composite(pose, (round(x), round(y)))
        portrait.save(destination / 'portrait.png')
    characters.append(dict(id=ident, name=name,
        thumbnail=f'assets/characters/{ident}/portrait.png',
        animations=animations))
data = dict(schema='sanmauro.roster', version=1, characters=characters)
timing_path = root / 'assets/jump-timing.json'
if timing_path.exists():
    apply_timing(data, json.loads(timing_path.read_text(encoding='utf-8')))
(root / 'assets' / 'manifest.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(root / 'catalog.js').write_text('// Generato da scripts/import-roster.py.\nwindow.SANMAURO_CATALOG = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
print(f'Copiate {sum(len(c["animations"]) for c in characters)} animazioni e {len(characters)} anteprime in {root / "assets"}')
if timing_path.exists():
    subprocess.run([sys.executable, str(root / 'scripts/build-jump-report.py')], check=True)
if (root / 'scripts/build-stages.py').exists():
    subprocess.run([sys.executable, str(root / 'scripts/build-stages.py')], check=True)
