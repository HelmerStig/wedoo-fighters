"""Scarica i modelli WEDOO scelti e verifica SHA256 pubblicato da Hugging Face."""
import hashlib,json,urllib.request
from pathlib import Path
from urllib.parse import quote
ROOT=Path(__file__).resolve().parents[2]
MODELS=[
    ('stabilityai/stable-diffusion-xl-base-1.0','sd_xl_base_1.0_0.9vae.safetensors','sd_xl_base_1.0_0.9vae.safetensors','checkpoints'),
    ('nerijs/pixel-art-xl','pixel-art-xl.safetensors','pixel-art-xl.safetensors','loras'),
    ('h94/IP-Adapter','sdxl_models/ip-adapter-plus_sdxl_vit-h.safetensors','ip-adapter-plus_sdxl_vit-h.safetensors','ipadapter'),
    ('h94/IP-Adapter','models/image_encoder/model.safetensors','CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors','clip_vision'),
    ('xinsir/controlnet-openpose-sdxl-1.0','diffusion_pytorch_model.safetensors','xinsir_openpose_sdxl.safetensors','controlnet'),
]
manifest=[]
for repo,source_name,name,kind in MODELS:
    with urllib.request.urlopen('https://huggingface.co/api/models/'+repo+'?blobs=true',timeout=60) as response:data=json.load(response)
    item=next(i for i in data['siblings'] if i['rfilename']==source_name)
    expected=item['lfs']['sha256'];revision=data['sha'];url=f'https://huggingface.co/{repo}/resolve/{revision}/{quote(source_name,safe="/")}'
    destination=ROOT/'.runtime/ComfyUI/models'/kind/name;destination.parent.mkdir(parents=True,exist_ok=True)
    if destination.exists() and hashlib.file_digest(destination.open('rb'),'sha256').hexdigest()==expected:
        print(name+' gia verificato',flush=True)
    else:
        temporary=destination.with_suffix('.part');offset=temporary.stat().st_size if temporary.exists() else 0
        request=urllib.request.Request(url,headers={'Range':f'bytes={offset}-'} if offset else {})
        with urllib.request.urlopen(request,timeout=120) as response:
            append=offset>0 and response.status==206
            if not append:offset=0
            done=offset;last=done;print(f'Download {name}: {item["size"]/1e9:.2f} GB',flush=True)
            with temporary.open('ab' if append else 'wb') as output:
                while block:=response.read(8*1024*1024):
                    output.write(block);done+=len(block)
                    if done-last>256*1024*1024:print(f'{name}: {done/item["size"]:.0%}',flush=True);last=done
        actual=hashlib.file_digest(temporary.open('rb'),'sha256').hexdigest()
        if actual!=expected:raise ValueError('SHA256 non corrispondente: '+name)
        temporary.replace(destination);print(name+' SHA256 verificato',flush=True)
    manifest.append(dict(repo=repo,revision=revision,sourceFile=source_name,file=name,sha256=expected,size=item['size'],path=str(destination.relative_to(ROOT))))
(ROOT/'comfy-local/models.json').write_text(json.dumps(manifest,indent=2)+'\n')
