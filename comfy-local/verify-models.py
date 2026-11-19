"""Check downloaded official weights against the Hugging Face LFS SHA-256."""
from pathlib import Path
import hashlib
import json
import re
import subprocess

work = Path(__file__).resolve().parents[1] / 'autosprite-agent/output/comfy-local-20261119'
workflow = json.loads((work / 'official-workflow.json').read_text(encoding='utf-8'))
records = []
for node in workflow['nodes']:
    for model in node.get('properties', {}).get('models', []):
        assert model['url'].startswith('https://huggingface.co/Comfy-Org/')
        header = subprocess.check_output(['curl.exe', '-sSfIL', '--max-time', '60', model['url']], text=True)
        expected = re.search(r'^x-linked-etag:\s*"?([a-f0-9]{64})', header, re.I | re.M)
        if expected is None:
            raise RuntimeError('No authoritative SHA-256 header for ' + model['name'])
        path = work / 'models' / model['directory'] / model['name']
        digest = hashlib.sha256()
        with path.open('rb') as source:
            while data := source.read(16 * 1024 * 1024):
                digest.update(data)
        actual = digest.hexdigest()
        assert actual == expected[1], model['name']
        records.append({'name': model['name'], 'sha256': actual, 'bytes': path.stat().st_size, 'url': model['url']})
        print('SHA-256 verified: ' + model['name'], flush=True)
(work / 'verified-models.json').write_text(json.dumps(records, indent=2))
