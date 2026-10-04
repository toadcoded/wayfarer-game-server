import zipfile,pathlib,stat,hashlib,json,re
root=pathlib.Path.cwd(); out=root/'references';out.mkdir(exist_ok=True); reports=[]
for p in sorted((root/'upload').glob('*.zip')):
 dest=out/p.stem; dest.mkdir(exist_ok=True); report={'archive':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'files':[],'rejected':[]}; seen=set()
 with zipfile.ZipFile(p) as z:
  if sum(i.file_size for i in z.infolist())>2_000_000_000:raise ValueError('archive size budget')
  for i in z.infolist():
   n=i.filename; parts=pathlib.PurePosixPath(n).parts; mode=i.external_attr>>16
   if '\\' in n or n.startswith('/') or '..' in parts or re.match(r'^[A-Za-z]:',n) or stat.S_ISLNK(mode) or (stat.S_IFMT(mode) not in (0,stat.S_IFREG,stat.S_IFDIR)) or i.flag_bits&1 or i.file_size>250_000_000:
    report['rejected'].append(n);continue
   target=dest.joinpath(*parts)
   if i.is_dir():target.mkdir(parents=True,exist_ok=True);continue
   if n.casefold() in seen:report['rejected'].append(n);continue
   seen.add(n.casefold());target.parent.mkdir(parents=True,exist_ok=True)
   data=z.read(i);target.write_bytes(data);target.chmod(0o600)
   report['files'].append({'path':n,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
 reports.append(report);print(p.name,'extracted',len(report['files']),'rejected',len(report['rejected']))
(root/'audit'/'archive-inventory.json').write_text(json.dumps(reports,indent=2))
