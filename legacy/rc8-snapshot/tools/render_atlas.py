"""Orthographic reference plate from the actual TS mesh buffers. Requires Pillow only."""
import json,math,sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
W,H,S=1680,1740,2
img=Image.new('RGB',(W*S,H*S),'#101D24');draw=ImageDraw.Draw(img)
def font(size,bold=False):
    paths=['/usr/share/fonts/truetype/dejavu/DejaVuSans'+('-Bold' if bold else '')+'.ttf']
    for p in paths:
        if Path(p).exists():return ImageFont.truetype(p,int(size*S))
    return ImageFont.load_default()
def text(x,y,s,size=18,fill='#DBE5DE',bold=False):draw.text((x*S,y*S),s,font=font(size,bold),fill=fill)
def line(points,fill,width=1):draw.line([(int(x*S),int(y*S)) for x,y in points],fill=fill,width=max(1,int(width*S)))
def rgb(h):return tuple(int(h[i:i+2],16) for i in (1,3,5))
def proj(p):
    x,y,z=p
    return (x*.88-z*.48,x*.24+z*.44-y*.95)
def depth(p):return p[0]*.456+p[1]*.503+p[2]*.836

data=json.load(open(sys.argv[1]));text(56,35,'WAYFARER  /  CONSTRUCTION ATLAS',18,'#9FB9B0',True)
text(56,71,'Three ways across the water',40,'#F0E9D7',True)
text(58,132,'v0.3  •  Rendered from generated geometry  •  Seed 20260928  •  Shared walking surfaces',16,'#A4B7B7')
for num,scene in enumerate(data['scenes']):
    top=190+num*480;left=40;right=W-40;bottom=top+456
    draw.rounded_rectangle((left*S,top*S,right*S,bottom*S),radius=18*S,fill=['#182B30','#302C27','#1E2D2B'][num],outline='#3E5355',width=S)
    p=scene['plan'];style=scene['style'];text(66,top+20,f'0{num+1}',18,style['glow'],True)
    text(112,top+16,style['name'],29,'#F1EADC',True)
    motifs='  /  '.join(style['motifs'][:3]);text(68,top+58,motifs,15,'#B6C3B9')
    # Fit the complete generated scene in its panel.
    verts=[tuple(m['positions'][i:i+3]) for m in scene['meshes'] for i in range(0,len(m['positions']),3)]
    projected=[proj(v) for v in verts];xmin=min(v[0] for v in projected);xmax=max(v[0] for v in projected)
    ymin=min(v[1] for v in projected);ymax=max(v[1] for v in projected)
    scale=min(1360/(xmax-xmin),285/(ymax-ymin));ox=(W-(xmax-xmin)*scale)/2-xmin*scale;oy=top+98-ymin*scale
    triangles=[]
    for m in scene['meshes']:
        vs=[tuple(m['positions'][i:i+3]) for i in range(0,len(m['positions']),3)];base=rgb(m['color'])
        for i in range(0,len(m['indices']),3):
            a,b,c=[vs[j] for j in m['indices'][i:i+3]]
            ab=[b[j]-a[j] for j in range(3)];ac=[c[j]-a[j] for j in range(3)]
            normal=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]]
            norm=math.sqrt(sum(n*n for n in normal)) or 1
            light=max(0,sum(normal[j]*[-.3,.88,-.36][j] for j in range(3))/norm)
            shade=.63+.37*light;color=tuple(int(min(255,max(0,v*shade))) for v in base)
            points=[((proj(v)[0]*scale+ox)*S,(proj(v)[1]*scale+oy)*S) for v in [a,b,c]]
            triangles.append((sum(depth(v) for v in [a,b,c])/3,points,color))
    for _,poly,color in sorted(triangles,key=lambda t:t[0]):draw.polygon(poly,fill=color)
    # Navigation guide is intentionally drawn above the surface as an annotated centerline.
    route=[]
    for v in p['verifiedCenterline']:
        u,vv=proj((v['x'],v['y']+.12,v['z']));route.append((u*scale+ox,vv*scale+oy))
    line(route,style['glow'],2)
    for label,spot in [('WEST LANDING',p['start']),('EAST LANDING',p['goal'])]:
        u,v=proj((spot['x'],spot['y'],spot['z']));x=u*scale+ox;y=v*scale+oy
        draw.ellipse(((x-4)*S,(y-4)*S,(x+4)*S,(y+4)*S),fill=style['glow'])
        label_x=x-120 if label.startswith('WEST') else x+15
        text(label_x,y+12,label,12,style['glow'],True)
    length=p['goal']['x']-p['start']['x'];text(68,top+405,f'{length:.0f} m verified centerline  |  2 fitted landings  |  deck + 2 ramps',16,'#D3DBCA')
    text(1000,top+405,'RAILS / FOUNDATIONS / INSPECTION POINT',12,'#9AADA5')
text(56,1659,'Solid geometry and traversal tested together. Atmospheric colors are art direction, not a lighting engine.',15,'#A2B6B7')
text(56,1694,'REFERENCE SCENES • Engine-neutral TypeScript • No live-game integration claimed',14,'#839B9C')
img.resize((W,H),Image.Resampling.LANCZOS).save(sys.argv[2])
print(sys.argv[2])
