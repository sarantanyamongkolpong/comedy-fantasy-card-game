"""Export Idle sprite sheets (6 frames x 128px) using the shared idle timing; procedural (PROTOTYPE)."""
import json, sys, os
sys.path.insert(0,os.path.dirname(__file__))
from PIL import Image
import compose as C
R=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')) + '/'
A=json.load(open(R+'assets/animations/ANIM_SHARED_001.json'))
for cid in C.CH:
    load=C.default(cid); fr=A['states']['idle']['frames']
    sheet=Image.new('RGBA',(128*len(fr),128))
    noload=dict(load,vfx=False)
    base=C.compose(cid,noload)
    L={l['layer']:l['file'] for l in C.CH[cid]['layers'] if not l.get('variant')}
    for i,f in enumerate(fr):
        im=Image.new('RGBA',(128,128)); dx,dy=f['body']; im.alpha_composite(base,(dx,dy)) if dx>=0 and dy>=0 else im.paste(base.crop((max(0,-dx),max(0,-dy),128,128)),(max(0,dx),max(0,dy)))
        if 'L09' in L:
            v=Image.open(R+f'assets/characters/{cid}/sprite/'+L['L09']); vx,vy=f['vfx']
            t=Image.new('RGBA',(128,128)); t.paste(v.crop((0,max(0,-vy),128,128)),(0,max(0,vy))); im.alpha_composite(t)
        sheet.paste(im,(i*128,0))
    p=R+f'assets/characters/{cid}/sprite/{cid}_idle_sheet.png'; sheet.save(p); print(p)
