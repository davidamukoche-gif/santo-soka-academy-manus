from pathlib import Path
import re
import shutil
import subprocess

root = Path('/home/ubuntu/santo-soka-academy-manus')
assets = root / 'client' / 'public' / 'assets'
if assets.exists():
    shutil.rmtree(assets)
assets.mkdir(parents=True)

history_temp = Path('/tmp/santos-soka-history')
if history_temp.exists():
    shutil.rmtree(history_temp)
history_temp.mkdir(parents=True)
archive = history_temp / 'history.tar'
with archive.open('wb') as handle:
    subprocess.run(
        ['git', 'archive', '95181ba^', 'client/public/santos images'],
        cwd=root,
        check=True,
        stdout=handle,
    )
subprocess.run(['tar', '-xf', str(archive), '-C', str(history_temp)], check=True)
history_root = history_temp / 'client' / 'public' / 'santos images'
sources = [p for p in history_root.rglob('*') if p.is_file()]
sources += [p for p in (root / 'client' / 'public').glob('*') if p.is_file() and p.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}]
sources += [p for p in (root / 'client' / 'public' / 'img').glob('*') if p.is_file()]
if not sources:
    raise RuntimeError('No source images found')

source_by_name = {p.name.lower(): p for p in sources}
def source_for(reference: str, index: int) -> Path:
    name = Path(reference).name.lower()
    if 'crest' in name:
        return source_by_name.get('logo', source_by_name.get('coach.jpg', sources[0]))
    if 'future-star' in name or 'future_star' in name:
        preferred = [p for p in sources if 'future' in p.name.lower()]
        if preferred:
            return preferred[index % len(preferred)]
    if 'u_15' in name or 'u15' in name:
        preferred = [p for p in sources if 'u15' in p.name.lower() or 'u_15' in p.name.lower()]
        if preferred:
            return preferred[0]
    if 'u_9' in name or 'u9' in name:
        preferred = [p for p in sources if 'u9' in p.name.lower() or 'u_9' in p.name.lower()]
        if preferred:
            return preferred[0]
    if 'south-sudan' in name or 'khan-jal' in name:
        preferred = [p for p in sources if 'ian' in p.name.lower() or 'u18' in p.name.lower()]
        if preferred:
            return preferred[0]
    matching_ext = [p for p in sources if p.suffix.lower() == Path(reference).suffix.lower()]
    pool = matching_ext or sources
    return pool[index % len(pool)]

files = [root / 'client' / 'index.html', *((root / 'client' / 'public').rglob('*'))]
files = [p for p in files if p.is_file() and p.suffix.lower() in {'.html', '.css', '.js', ''}]
pattern = re.compile(r'/manus-storage/([^"\'\s)]+)')
refs = []
for path in files:
    refs.extend(pattern.findall(path.read_text(errors='ignore')))
unique_refs = list(dict.fromkeys(refs))

for index, reference in enumerate(unique_refs):
    safe = re.sub(r'[^A-Za-z0-9._-]+', '_', reference)
    destination = assets / safe
    shutil.copy2(source_for(reference, index), destination)
    replacement = '/assets/' + safe
    for path in files:
        text = path.read_text(errors='ignore')
        updated = text.replace('/manus-storage/' + reference, replacement)
        if updated != text:
            path.write_text(updated)

print(f'localized {len(unique_refs)} storage references into {len(list(assets.iterdir()))} Vercel assets')
