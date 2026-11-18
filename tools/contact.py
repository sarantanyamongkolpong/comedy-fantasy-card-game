import json,numpy as np,sys
from PIL import Image
import os
R=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')) + '/'
ORDER=['L01','L08','L04','L05','L05f','L06','L06f','L09']
def comp(cid,skip=(),variant=None,only_body=False):
    rig=json.load(open(R+'assets/characters/_rigs/%s.json'%('humanoid_heavy' if cid=='AVT_AEG_001' else 'humanoid_standard')))['characters'][cid]
    out=Image.new('RGBA',(128,128))
    for L in ORDER:
        for l in rig['layers']:
            if l['layer']!=L: continue
            if only_body and L!='L01': continue
            if l['slot'] in skip: continue
            if l['slot']=='headgear' and (l.get('variant') or 'silver')!=(variant or 'silver') and cid=='AVT_AEG_001': continue
            out.alpha_composite(Image.open(R+f'assets/characters/{cid}/sprite/'+l['file']))
    return out
if __name__=='__main__':
    cids=['AVT_AEG_001','AVT_PHA_001','AVT_CEL_001','AVT_SAN_001']
    z=4; sh=Image.new('RGBA',(128*z*4,128*z*3),(170,175,190,255))
    for i,c in enumerate(cids):
        sh.alpha_composite(Image.open(R+f'docs/qa/work/flat_{c}.png').resize((128*z,)*2,Image.NEAREST),(i*128*z,0))
        sh.alpha_composite(comp(c,only_body=True).resize((128*z,)*2,Image.NEAREST),(i*128*z,128*z))
        sh.alpha_composite(comp(c,variant='gold' if c=='AVT_AEG_001' else None).resize((128*z,)*2,Image.NEAREST),(i*128*z,256*z))
    sh.save(R+'docs/qa/work/contact.png')
