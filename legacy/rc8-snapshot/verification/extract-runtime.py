import tarfile,pathlib
p=pathlib.Path(__file__).resolve().parent/'runtime'
for n in ['fonts.tar','swiftshader.tar']:
 with tarfile.open(p/n) as t:t.extractall(p,filter='data')
