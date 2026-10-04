"""Deterministic candidate ZIP; run after build/tests and verification updates."""
import hashlib,json,pathlib,zipfile
root=pathlib.Path(__file__).resolve().parents[1]
excluded={'node_modules','.git','__pycache__','.mypy_cache','.venv','runtime'}
files=sorted(p for p in root.rglob('*') if p.is_file() and not p.is_symlink() and not any(x in excluded for x in p.relative_to(root).parts) and p.name!='SHA256SUMS.json')
manifest={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
m=root/'SHA256SUMS.json';m.write_text(json.dumps(manifest,indent=2,sort_keys=True)+'\n')
archive=root.parent/'wayfarer-v0.8-rc8-xam-candidate.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in sorted([*files,m]):
  info=zipfile.ZipInfo('wayfarer-v0.8/'+str(p.relative_to(root)),date_time=(2026,10,4,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
  z.writestr(info,p.read_bytes())
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 for name,digest in manifest.items():assert hashlib.sha256(z.read('wayfarer-v0.8/'+name)).hexdigest()==digest
print(json.dumps({'archive':str(archive),'files':len(files)+1,'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()}))
