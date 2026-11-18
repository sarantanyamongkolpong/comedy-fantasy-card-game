"""Reference compositor (same rules as the preview JS): body, accessory, headgear, main_hand item, L05f grip
overlay, off_hand item, L06f, L09 vfx. Item placed at anchor - pivot (+ per-character fit offset)."""
import json, sys
from PIL import Image, ImageDraw
import os
R=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')) + '/'
def data():
    rigs={k:json.load(open(R+f'assets/characters/_rigs/{k}.json')) for k in ('humanoid_heavy','humanoid_standard')}
    items={}
    for k,v in json.load(open(R+'assets/equipment/shared_items.json')).items(): items[k]=dict(file=f'assets/equipment/{k}.png',pivot=v['pivot'])
    chars={}
    for rg in rigs.values():
        for cid,c in rg['characters'].items():
            chars[cid]=c
            for k,v in c['native_items'].items(): items[k]=dict(file=v['file'],pivot=v['pivot'])
    return chars,items
CH,IT=data()
def default(cid):
    d={}
    for k,v in CH[cid]['native_items'].items():
        if v['slot'] not in d and 'GOLD' not in k: d[v['slot']]=k
    return d
def compose(cid,load):
    c=CH[cid]; out=Image.new('RGBA',(128,128)); L={l['layer']:l['file'] for l in c['layers'] if not l.get('variant')}
    sp=R+f'assets/characters/{cid}/sprite/'
    def item(slot):
        iid=load.get(slot)
        if not iid: return
        it=IT[iid]; a=c['anchors']['head' if slot=='headgear' else 'feet' if slot=='accessory' else slot]
        fit=c.get('fit',{}).get(iid,[0,0])
        out.alpha_composite(Image.open(R+it['file']).convert('RGBA'),(a[0]-it['pivot'][0]+fit[0],a[1]-it['pivot'][1]+fit[1]))
    out.alpha_composite(Image.open(sp+L['L01']))
    item('accessory'); item('headgear'); item('main_hand')
    if 'L05f' in L: out.alpha_composite(Image.open(sp+L['L05f']))
    item('off_hand')
    if 'L06f' in L: out.alpha_composite(Image.open(sp+L['L06f']))
    if 'L09' in L and load.get('vfx',True): out.alpha_composite(Image.open(sp+L['L09']))
    return out
def sheet(cells,dst,z=4,cols=4,bg=(200,201,212,255)):
    W=128*z; rows=(len(cells)+cols-1)//cols
    sh=Image.new('RGBA',(W*cols,(W+18)*rows),(40,38,54,255)); d=ImageDraw.Draw(sh)
    for i,(im,label) in enumerate(cells):
        x,y=(i%cols)*W,(i//cols)*(W+18)
        b=Image.new('RGBA',(W,W),bg); b.alpha_composite(im.resize((W,W),Image.NEAREST)); sh.paste(b,(x,y))
        d.text((x+4,y+W+3),label,fill=(255,255,255))
    sh.save(dst)
if __name__=='__main__':
    M,P,A,N='AVT_CEL_001','AVT_SAN_001','AVT_AEG_001','AVT_PHA_001'
    U=lambda cid,**k: dict(default(cid),**k)
    sheet([(compose(M,U(M)),'Meteor + planet staff (native)'),(compose(M,U(M,main_hand='EQ_STAFF_NEUTRAL_001')),'Meteor + NEUTRAL staff'),
           (compose(P,U(P)),'Plaster + bandage staff (native)'),(compose(P,U(P,main_hand='EQ_STAFF_NEUTRAL_001')),'Plaster + NEUTRAL staff'),
           (compose(M,U(M,main_hand='EQ_SAN_STAFF_BANDAGE_001')),'Meteor + bandage staff (cross)'),(compose(P,U(P,main_hand='EQ_CEL_STAFF_PLANET_001')),'Plaster + planet staff (cross)'),
           (compose(M,U(M,main_hand=None)),'Meteor body, no staff'),(compose(P,U(P,main_hand=None)),'Plaster body, no staff')],R+'docs/qa/composite_shared_staff_test.png')
    sheet([(compose(A,U(A)),'Potlid silver pot (V1)'),(compose(A,U(A,headgear='EQ_AEG_POT_HELMET_GOLD_001')),'Potlid GOLDEN pot (V2)'),
           (compose(A,U(A,headgear=None)),'Potlid no helmet (body head)'),(compose(A,{}),'Potlid body only')],R+'docs/qa/composite_potlid_silver_vs_gold.png')
    sheet([(compose(A,U(A,main_hand='EQ_SWORD_BASIC_001')),'Potlid + basic sword'),(compose(N,U(N,main_hand='EQ_SWORD_BASIC_001')),'Nox + basic sword'),
           (compose(N,U(N,main_hand='EQ_DAGGER_BASIC_001',off_hand='EQ_DAGGER_BASIC_001')),'Nox + 2 basic daggers'),(compose(A,U(A,off_hand='EQ_SHIELD_BUCKLER_001')),'Potlid + buckler'),
           (compose(P,U(P,off_hand='EQ_SHIELD_BUCKLER_001')),'Plaster + buckler'),(compose(N,U(N,accessory=None,vfx=False)),'Nox sneakers off'),
           (compose(M,U(M,headgear=None)),'Meteor no hat'),(compose(P,U(P,headgear=None)),'Plaster no cap')],R+'docs/qa/composite_shared_equipment_test.png')
    sheet([(compose(c,U(c)),c) for c in (A,N,M,P)],R+'docs/qa/composite_base_sprites.png')
    print('ok')
