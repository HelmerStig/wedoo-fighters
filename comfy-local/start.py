"""Start the isolated local server without changing PowerShell execution policy."""
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
work = root / 'autosprite-agent/output/comfy-local-20261119'
python = work / 'venv/Scripts/python.exe'
source = work / 'source/ComfyUI-995456d0188ffb51032c28f41527cfa82d87d8a9'
subprocess.run([str(python), str(root / 'comfy-local/run-trial.py'), '--prepare-only'], check=True)
subprocess.run([
    str(python), str(source / 'main.py'), '--listen', '127.0.0.1', '--port', '8189',
    '--extra-model-paths-config', str(work / 'extra-model-paths.yaml'),
    '--input-directory', str(work / 'input'), '--output-directory', str(work / 'output'),
    '--force-fp16', '--fp16-text-enc', '--cpu-vae', '--lowvram', '--reserve-vram', '1',
    '--disable-dynamic-vram', '--disable-smart-memory', '--disable-all-custom-nodes',
    '--offline', '--preview-method', 'none',
], cwd=source, check=True)
