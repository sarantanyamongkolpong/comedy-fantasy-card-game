"""Split pixelized flat sprites into real transparent layers on the 128x128 canvas,
fill occluded pixels, build Golden Pot variant, export pivoted equipment items and rig JSON.
Run: python3 tools/pixelize.py && python3 tools/build_sprites.py
"""
import sys, os, json, numpy as np, cv2
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image
from masks import *
import pixelize as PX
R=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')) + '/'
def load(cid): return np.array(Image.open(R+f'docs/qa/work/flat_{cid}.png'))
def palette_of(img):
    return np.unique(img[img[...,3]>0][:,:3],axis=0)
def snap_to(rgb, pal):
    p=pal.astype(np.float32)/255
    lab=cv2.cvtColor(rgb.reshape(-1,1,3).astype(np.float32)/255,cv2.COLOR_RGB2Lab).reshape(-1,3)
    pl=cv2.cvtColor(p.reshape(-1,1,3),cv2.COLOR_RGB2Lab).reshape(-1,3)
    return pal[((lab[:,None]-pl[None])**2).sum(-1).argmin(1)].reshape(rgb.shape)
def inpaint(img, fill, pal, radius=3):
    """fill: bool mask of pixels to synthesize (inside silhouette). Uses cv2 TELEA from neighbouring
    body pixels, then snaps to the character palette so the result stays indexed."""
    if not fill.any(): return img
    out=img.copy(); known=img[...,3]>0
    src=img[...,:3].copy()
    # pixels that are transparent and not to be filled act as "unknown" too, but we only write `fill`
    unk=(fill|~known).astype(np.uint8)
    # seed unknown transparent with mean colour so they don't bleed black
    res=cv2.inpaint(src,unk,radius,cv2.INPAINT_TELEA)
    out[fill,:3]=snap_to(res[fill],pal); out[fill,3]=255
    return out
def mirror_fill(img, fill, axis_x, pal, avoid):
    out=img.copy()
    ys,xs=np.where(fill)
    left=[]
    for y,x in zip(ys,xs):
        mx=int(round(2*axis_x-x))
        if 0<=mx<128 and img[y,mx,3]>0 and not avoid[y,mx]:
            out[y,x]=img[y,mx]
        else: left.append((y,x))
    # no fallback: where the mirrored source is empty the pixel stays transparent (silhouette edge)
    return out
def hair_dome(img, region, cx, cy, rx, ry, ramp):
    """Paint a simple shaded hair cap (lit top-left) inside region∩ellipse; outline with ramp[0]."""
    out=img.copy(); e=ell(cx,cy,rx,ry)&region
    inner=cv2.erode(e.astype(np.uint8),np.ones((3,3),np.uint8)).astype(bool)
    for y,x in zip(*np.where(e)):
        t=((x-cx)/rx*0.6+(y-cy)/ry*0.8)  # -1 top-left lit .. +1 dark
        i=int(np.clip(round((1-(t+1)/2)*(len(ramp)-2))+1,1,len(ramp)-1))
        out[y,x,:3]=ramp[i]; out[y,x,3]=255
    edge=e&~inner&(Y<cy)  # outline only on the upper rim
    out[edge,:3]=ramp[0]
    # hair strands: every 3rd column darker one step
    for y,x in zip(*np.where(inner)):
        if (x+y//4)%4==0 and out[y,x,0]==ramp[-1][0]: pass
    return out
def ramp_from(img, m, n=5):
    px=img[m][:,:3]; 
    if len(px)==0: return None
    lum=px.astype(int).sum(1); order=np.argsort(lum)
    qs=[px[order[int(q*(len(px)-1))]] for q in np.linspace(0.05,0.95,n)]
    return [tuple(int(v) for v in q) for q in qs]
def layer(img, m):
    out=np.zeros_like(img); out[m]=img[m]; out[...,3]=np.where(m&(img[...,3]>0),255,0); out[out[...,3]==0]=0; return out
def silhouette_close(alpha, k=5):
    return cv2.morphologyEx(alpha.astype(np.uint8),cv2.MORPH_CLOSE,np.ones((k,k),np.uint8)).astype(bool)
def front_overlay(body_orig_ok, c, bx):
    m=bx&(c.skin|c.grey)&body_orig_ok
    m=grow(m,c.dark&bx&body_orig_ok,1)
    return m

SPEC={}
def spec_AEG(img,c):
    helm=box(40,21,90,43)&(c.grey|c.dark)&~c.skin&~c.brown
    helm|=box(40,44,90,51)&(c.grey|c.dark)&~c.skin&~c.brown&((X<57)|(X>79))
    sword=(poly([(29,42),(36,42),(42,69),(30,70)])&c.a)|(box(28,68,56,78)&(c.gold|c.dark)&~box(44,72,56,80))|(box(38,81,48,90)&c.gold)
    shield=ell(84.5,76.5,17.5,25)&c.a&~c.blue&~(c.gold&(X<72))
    return dict(
      items=[('L04_headgear_silver','headgear',helm,'hair'),('L05_main_hand','main_hand',sword,'auto'),('L06_off_hand','off_hand',shield,'mirror')],
      shield_region=poly([(66,51),(84,52),(92,62),(96,84),(100,104),(66,104)]),
      hair=dict(cx=66,cy=43,rx=12,ry=9,ramp_box=box(50,44,82,56),mirror_axis=61),
      front={'main_hand':box(40,70,54,84)},
      anchors=dict(head=[66,34],main_hand=[46,75],off_hand=[86,76],back=[60,58],body_center=[62,80],feet=[64,122]))
def spec_PHA(img,c):
    dag_l=poly([(28,92),(33,92),(47,73),(44,68),(40,69)])&c.a&~c.skin
    dag_r=poly([(92,63),(104,79),(101,84),(88,71),(86,66)])&c.a&~c.skin
    yel=(c.H>=16)&(c.H<=36)&(c.S>=120)&c.a
    squeak=(box(24,96,40,118)|box(84,96,104,118))&yel
    squeak=grow(squeak,c.dark&~box(36,100,86,124),1)&~box(38,100,86,124)
    shoes=box(34,101,100,125)&c.a&~c.skin&~squeak
    shoes&=~(box(44,98,52,104)&c.dark)&~(box(74,98,84,104)&c.dark)
    return dict(items=[('L05_main_hand','main_hand',dag_l,'auto'),('L06_off_hand','off_hand',dag_r,'auto'),
                       ('L08_accessory_sneakers','accessory',shoes,'feet'),('L09_vfx_squeak','vfx',squeak,'none')],
      front={'main_hand':box(34,60,48,72),'off_hand':box(82,54,96,66)},
      anchors=dict(head=[70,30],main_hand=[40,66],off_hand=[88,60],back=[60,52],body_center=[64,74],feet=[64,122]))
def spec_CEL(img,c):
    staff=(box(24,14,47,44)&c.a&~(c.white|c.skin))|(box(24,44,48,58)&c.a&~c.skin&~c.white&~box(44,44,60,58))|(thick_line((43,58),(52,122),3)&c.a&(c.dark|c.gold|(c.S<90))&~c.skin)
    staff&=~(c.purple&box(47,20,100,60))
    steam=box(92,34,104,49)&c.a
    cup=box(86,44,104,62)&c.a&~(c.skin&box(84,56,94,64))&~steam
    hat=box(44,14,98,56)&c.a&~staff&~(c.grey|c.white)&~c.skin&~box(60,40,82,56)&~box(54,42,64,58)
    return dict(items=[('L04_headgear','headgear',hat,'hair'),('L05_main_hand','main_hand',staff,'auto'),
                       ('L06_off_hand','off_hand',cup,'auto'),('L09_vfx_steam','vfx',steam,'none')],
      hair=dict(cx=68,cy=40,rx=10,ry=7,ramp_box=box(62,34,76,46),grey=True),
      front={'main_hand':box(38,57,50,68)},
      anchors=dict(head=[68,32],main_hand=[44,62],off_hand=[89,58],back=[64,56],body_center=[66,78],feet=[64,122]))
def spec_SAN(img,c):
    shaft=np.zeros((128,128),bool)
    pts=[(44,50),(47,66),(50,90),(53,110),(55,119)]
    for p0,p1 in zip(pts,pts[1:]): shaft|=thick_line(p0,p1,4)
    shaft&=c.a&~c.white&~c.green&~box(40,55,54,65)
    staff=(box(26,8,48,40)&c.a)|(box(38,40,50,52)&c.a&~c.white)|(box(22,50,44,76)&c.green)|shaft
    staff|=box(48,96,57,104)&(c.gold|c.dark)|box(50,111,58,121)&(c.gold|c.dark)&~box(36,100,49,124)
    cap=box(56,10,82,30)&c.a&(c.white|c.green|c.gold|c.dark)&~c.brown
    clip=box(84,44,104,68)&c.a&~c.skin
    sat=box(52,70,74,90)&c.a&(c.brown|c.white|c.dark)
    return dict(items=[('L04_headgear','headgear',cap,'hair'),('L05_main_hand','main_hand',staff,'auto'),
                       ('L06_off_hand','off_hand',clip,'auto')],
      hair=dict(cx=68,cy=26,rx=11,ry=7,ramp_box=box(70,22,84,34)),
      front={'main_hand':box(42,56,54,68)},
      anchors=dict(head=[68,18],main_hand=[48,61],off_hand=[93,60],back=[62,54],body_center=[66,78],feet=[64,122]))
NAMES={('AVT_AEG_001','L04_headgear_silver'):'EQ_AEG_POT_HELMET_SILVER_001',('AVT_AEG_001','L05_main_hand'):'EQ_AEG_SWORD_POTLID_001',
 ('AVT_AEG_001','L06_off_hand'):'EQ_AEG_SHIELD_POTLID_001',('AVT_PHA_001','L05_main_hand'):'EQ_PHA_KUNAI_MAIN_001',('AVT_PHA_001','L06_off_hand'):'EQ_PHA_KUNAI_OFF_001',
 ('AVT_PHA_001','L08_accessory_sneakers'):'EQ_PHA_SNEAKERS_SQUEAK_001',('AVT_CEL_001','L04_headgear'):'EQ_CEL_HAT_ASTRO_001',('AVT_CEL_001','L05_main_hand'):'EQ_CEL_STAFF_PLANET_001',
 ('AVT_CEL_001','L06_off_hand'):'EQ_CEL_NOODLE_CUP_001',('AVT_SAN_001','L04_headgear'):'EQ_SAN_CAP_HEALER_001',('AVT_SAN_001','L05_main_hand'):'EQ_SAN_STAFF_BANDAGE_001',
 ('AVT_SAN_001','L06_off_hand'):'EQ_SAN_CLIPBOARD_001'}
FIT={'AVT_AEG_001':{'EQ_SWORD_BASIC_001':[-6,-2],'EQ_DAGGER_BASIC_001':[-4,0]}}
SPECS={'AVT_AEG_001':spec_AEG,'AVT_PHA_001':spec_PHA,'AVT_CEL_001':spec_CEL,'AVT_SAN_001':spec_SAN}
RIG={'AVT_AEG_001':'humanoid_heavy'}
def save(arr,path):
    os.makedirs(os.path.dirname(path),exist_ok=True)
    a=arr.copy(); a[...,3]=np.where(a[...,3]>0,255,0); a[a[...,3]==0]=0
    Image.fromarray(a.astype(np.uint8),'RGBA').save(path)
def crop_item(layer_img, anchor):
    ys,xs=np.where(layer_img[...,3]>0); x0,y0,x1,y1=xs.min(),ys.min(),xs.max(),ys.max()
    return layer_img[y0:y1+1,x0:x1+1], [int(anchor[0]-x0),int(anchor[1]-y0)], [int(x0),int(y0)]
def gold_helmet(helm_layer, helm_mask):
    """Recolour silver helmet layer to gold by luminance rank, ramp sampled from the Owner's gold
    reference (palette only; geometry is OUR silver helmet layer)."""
    g=np.array(Image.open(R+'assets/reference/sprites/aegis_sir_potlid_gold_helmet.png').convert('RGBA'))
    # pixelize the gold ref with identical transform to sample its helmet palette
    rgb,m,_=PX.pixelize(R+'assets/reference/sprites/aegis_sir_potlid_gold_helmet.png',40)
    gm=m&helm_mask
    gp=(rgb[gm]*255).astype(int); gp=gp[(gp.max(1)-gp.min(1))>40]  # saturated gold only
    lum=gp.sum(1); gp=gp[np.argsort(lum)]
    ramp=[gp[int(q*(len(gp)-1))] for q in np.linspace(0.02,0.98,7)]
    out=helm_layer.copy(); a=out[...,3]>0
    L=out[...,:3].astype(int).sum(-1)
    vals=np.sort(L[a]); 
    for y,x in zip(*np.where(a)):
        r=np.searchsorted(vals,L[y,x])/max(1,len(vals)-1)
        if L[y,x]<150: out[y,x,:3]=(np.array(ramp[0])*0.45).astype(int)  # keep dark outline dark (gold-brown)
        else: out[y,x,:3]=ramp[int(np.clip(round(r*6),0,6))]
    return out, [list(map(int,c)) for c in ramp]
def main():
    rigs={'humanoid_heavy':{'rig':'humanoid_heavy','canvas':[128,128],'baseline_y':122,'characters':{}},
          'humanoid_standard':{'rig':'humanoid_standard','canvas':[128,128],'baseline_y':122,'characters':{}}}
    rigs['humanoid_heavy']['default_anchors']=dict(head=[64,30],main_hand=[38,72],off_hand=[90,74],back=[64,56],body_center=[64,80],feet=[64,122])
    rigs['humanoid_standard']['default_anchors']=dict(head=[64,26],main_hand=[40,70],off_hand=[88,70],back=[64,52],body_center=[64,74],feet=[64,122])
    report={}
    for cid,fn in SPECS.items():
        img=load(cid); c=C(img); sp=fn(img,c); pal=palette_of(img)
        # orphan cleanup: tiny body islands left after cutting items are re-assigned to the adjacent item
        allm=np.zeros((128,128),bool)
        for _,_,m,_ in sp['items']: allm|=m
        rest=(img[...,3]>0)&~allm
        n,lab,st,_=cv2.connectedComponentsWithStats(rest.astype(np.uint8),connectivity=8)
        main=np.argmax(st[1:,cv2.CC_STAT_AREA])+1 if n>1 else -1
        moved=0
        for k in range(1,n):
            if k==main or st[k,cv2.CC_STAT_AREA]>=40: continue
            comp_=lab==k; dl=cv2.dilate(comp_.astype(np.uint8),np.ones((7,7),np.uint8)).astype(bool)
            best=max(range(len(sp['items'])),key=lambda i:(dl&sp['items'][i][2]).sum())
            if (dl&sp['items'][best][2]).sum()>0:
                it=list(sp['items'][best]); it[2]=it[2]|comp_; sp['items'][best]=tuple(it); moved+=int(comp_.sum())
        sd=R+f'assets/characters/{cid}/sprite/'; ed=R+f'assets/characters/{cid}/equipment/'
        allitems=np.zeros((128,128),bool)
        for _,_,m,_ in sp['items']: allitems|=m
        body=img.copy(); body[allitems]=0
        filled=np.zeros((128,128),bool); notes={}
        sil=silhouette_close(body[...,3]>0,9)
        for name,slot,m,mode in sp['items']:
            if mode=='none': notes[name]='removed; background behind (no fill needed)'; continue
            if mode=='auto':
                f=m&sil; body=inpaint(body,f,pal); filled|=f
                notes[name]=f'{int(f.sum())} occluded px synthesized (TELEA inpaint + palette snap); {int((m&~sil).sum())} px left transparent'
            elif mode=='mirror':
                f=m&sp['shield_region']; body=mirror_fill(body,f,sp['hair']['mirror_axis'],pal,allitems); filled|=f
                notes[name]=f'{int(f.sum())} px behind shield filled by mirroring the opposite body half about x={sp["hair"]["mirror_axis"]}; pixels with no mirrored source left transparent (approximate, normally hidden)'
            elif mode=='hair':
                h=sp['hair']; rb=h['ramp_box']&(img[...,3]>0)
                src=(c.grey|c.white)&rb if h.get('grey') else c.brown&rb
                ramp=ramp_from(img,src,5)
                ramp=[tuple(int(v*0.5) for v in ramp[0])]+ramp
                region=m.copy()  # only under the headgear, so the equipped composite stays pixel-identical
                region&=~(body[...,3]>0)
                before=body[...,3]>0
                body=hair_dome(body,region,h['cx'],h['cy'],h['rx'],h['ry'],ramp)
                f=(body[...,3]>0)&~before; filled|=f
                rest=m&sil&~f&~ell(h['cx'],h['cy'],h['rx']+3,h['ry']+3)
                notes[name]=f'{int(f.sum())} px: simple shaded hair cap painted under headgear; rest transparent'
            elif mode=='feet':
                # simple dark tabi feet so the body is valid with footwear removed
                f=m&(ell(46,113,8,10)|ell(80,113,8,10))&(Y>=101)
                body[f,:3]=(40,32,48); body[f,3]=255; filled|=f
                notes[name]=f'{int(f.sum())} px: placeholder dark tabi feet painted under sneakers'
        save(body,sd+f'{cid}_L01_body.png')
        layers=[{'file':f'{cid}_L01_body.png','layer':'L01','slot':'body','note':'L01 base body + L02 face/hair + L03 outfit baked (flat-source simplification)'}]
        okbody=(img[...,3]>0)&~allitems
        items={}
        for name,slot,m,mode in sp['items']:
            L=layer(img,m); save(L,sd+f'{cid}_{name}.png')
            layers.append({'file':f'{cid}_{name}.png','layer':name[:3],'slot':slot,'fill':notes.get(name)})
            if slot in ('headgear','main_hand','off_hand','accessory'):
                anc=sp['anchors']['head' if slot=='headgear' else (slot if slot!='accessory' else 'feet')]
                cr,piv,org=crop_item(L,anc)
                short=cid.split('_')[1]
                iname=NAMES[(cid,name)]
                save(cr,ed+f'{iname}.png')
                items[iname]={'asset_id':iname,'file':f'assets/characters/{cid}/equipment/{iname}.png','slot':slot,
                    'pivot':piv,'pivot_kind':'grip' if 'hand' in slot else 'mount','size':[int(cr.shape[1]),int(cr.shape[0])],
                    'native_character':cid,'native_origin':org}
                if name=='L04_headgear_silver':
                    g,ramp=gold_helmet(L,m); save(g,sd+f'{cid}_L04_headgear_gold.png')
                    layers.append({'file':f'{cid}_L04_headgear_gold.png','layer':'L04','slot':'headgear','variant':'gold',
                        'fill':'recolour of OUR silver helmet layer by luminance rank; gold ramp sampled from owner gold ref palette'})
                    cr,piv,org=crop_item(g,anc); gname='EQ_AEG_POT_HELMET_GOLD_001'
                    save(cr,ed+f'{gname}.png')
                    items[gname]={'asset_id':gname,'file':f'assets/characters/{cid}/equipment/{gname}.png','slot':'headgear','pivot':piv,'pivot_kind':'mount',
                        'size':[int(cr.shape[1]),int(cr.shape[0])],'native_character':cid,'native_origin':org,'variant_of':'EQ_AEG_POT_HELMET_SILVER_001'}
        for slot,bx in sp.get('front',{}).items():
            fm=front_overlay(okbody,c,bx)
            Lf=layer(img,fm); fn_=f'{cid}_L{"05" if slot=="main_hand" else "06"}f_{slot}_front.png'; save(Lf,sd+fn_)
            layers.append({'file':fn_,'layer':'L05f' if slot=='main_hand' else 'L06f','slot':slot+'_front',
                'note':'grip overlay: original fist pixels drawn ABOVE the held item so any item looks gripped'})
        rig=RIG.get(cid,'humanoid_standard')
        rigs[rig]['characters'][cid]={'anchors':sp['anchors'],'layers':layers,'native_items':items,'fit':FIT.get(cid,{}),
            'fit_note':'per-character extra offset [dx,dy] for specific items, applied after pivot->anchor (QA-tuned)'}
        json.dump(items,open(ed+'items.json','w'),indent=1)
        report[cid]={'notes':notes,'colors':int(len(pal)),'orphan_px_reassigned':moved}
    os.makedirs(R+'assets/characters/_rigs',exist_ok=True)
    for k,v in rigs.items(): json.dump(v,open(R+f'assets/characters/_rigs/{k}.json','w'),indent=1)
    json.dump(report,open(R+'docs/qa/work/split_report.json','w'),indent=1)
    print(json.dumps(report,indent=1))
if __name__=='__main__': main()
