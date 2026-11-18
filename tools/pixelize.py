"""Convert Owner reference PNGs into 128x128 logical pixel sprites (flat, pre-split).
Downscale: premultiplied INTER_AREA -> alpha threshold -> k-means palette quantize -> cleanup -> selective outline.
Output: docs/qa/work/flat_<ID>.png (+ palette npy). Layer splitting happens in tools/split_layers.py.
"""
import numpy as np, cv2, json, sys
from PIL import Image
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')) + '/'
S=0.09; CAN=128; BASE=122
CHARS={
 'AVT_AEG_001':('aegis_sir_potlid_base.png',40),
 'AVT_PHA_001':('phantom_nox_squeak_base.png',40),
 'AVT_CEL_001':('celestial_madame_meteor_base.png',44),
 'AVT_SAN_001':('sanctuary_sister_plaster_base.png',44),
}
def transform(ref_w, ref_h, bbox):
    x0,y0,x1,y1=bbox
    # target: bottom of bbox at BASE-1, horizontal center of bbox at 64
    ox = 64 - ((x0+x1)/2)*S
    oy = (BASE-1+0.5) - (y1+0.5)*S
    return ox, oy
def pixelize(path, ncol, xform=None, mask_only=False, interp=cv2.INTER_AREA):
    im=np.array(Image.open(path).convert('RGBA')).astype(np.float32)/255
    a=im[...,3]
    if xform is None:
        ys,xs=np.where(a>0.5); xform=transform(im.shape[1],im.shape[0],(xs.min(),ys.min(),xs.max(),ys.max()))
    ox,oy=xform
    M=np.float32([[S,0,ox],[0,S,oy]])
    pm=im[...,:3]*a[...,None]
    # area-style warp: blur then sample (warpAffine with INTER_AREA is not supported for downscale), so resize first
    big=cv2.resize(np.dstack([pm,a]), None, fx=S, fy=S, interpolation=interp)
    out=np.zeros((CAN,CAN,4),np.float32)
    dx=int(round(ox)); dy=int(round(oy))
    h,w=big.shape[:2]
    sx0=max(0,-dx); sy0=max(0,-dy); tx0=max(0,dx); ty0=max(0,dy)
    ww=min(w-sx0,CAN-tx0); hh=min(h-sy0,CAN-ty0)
    out[ty0:ty0+hh,tx0:tx0+ww]=big[sy0:sy0+hh,sx0:sx0+ww]
    al=out[...,3]
    rgb=np.where(al[...,None]>1e-4, out[...,:3]/np.maximum(al[...,None],1e-4),0)
    mask=al>=0.5
    return rgb, mask, (dx,dy)
def kmeans_palette(rgb, mask, n, seed=1):
    px=rgb[mask].reshape(-1,1,3).astype(np.float32)
    lab=cv2.cvtColor(px,cv2.COLOR_RGB2Lab).reshape(-1,3)
    crit=(cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_MAX_ITER,50,0.2)
    cv2.setRNGSeed(seed)
    _,lab_lbl,cent=cv2.kmeans(lab,n,None,crit,4,cv2.KMEANS_PP_CENTERS)
    pal=cv2.cvtColor(cent.reshape(-1,1,3),cv2.COLOR_Lab2RGB).reshape(-1,3)
    return np.clip(pal,0,1), cent
def snap(rgb, mask, pal):
    px=rgb.reshape(-1,1,3).astype(np.float32)
    lab=cv2.cvtColor(px,cv2.COLOR_RGB2Lab).reshape(-1,3)
    plab=cv2.cvtColor(pal.reshape(-1,1,3).astype(np.float32),cv2.COLOR_RGB2Lab).reshape(-1,3)
    d=((lab[:,None,:]-plab[None])**2).sum(-1); idx=d.argmin(1).reshape(mask.shape)
    out=np.zeros(mask.shape+(4,),np.uint8)
    out[...,:3]=(pal[idx]*255).round().astype(np.uint8); out[...,3]=mask*255
    out[~mask]=0
    return out, idx
def cleanup(mask):
    # remove isolated single pixels / fill single holes
    m=mask.astype(np.uint8)
    k=np.ones((3,3),np.uint8); n=cv2.filter2D(m,-1,k,borderType=cv2.BORDER_CONSTANT)-m
    m[(m==1)&(n<=1)]=0
    inv=1-m; n2=cv2.filter2D(inv,-1,k,borderType=cv2.BORDER_CONSTANT)-inv
    m[(m==0)&(n2<=1)]=1
    return m.astype(bool)
def outline(img):
    """Selective outline: exterior edge pixels darkened toward a dark hue of themselves."""
    a=img[...,3]>0
    er=cv2.erode(a.astype(np.uint8),np.ones((3,3),np.uint8),borderType=cv2.BORDER_CONSTANT).astype(bool)
    edge=a&~er
    c=img[...,:3].astype(np.float32)
    lum=c.mean(-1)
    dark=(c*0.35).astype(np.uint8)
    n,lab,stats,_=cv2.connectedComponentsWithStats(a.astype(np.uint8),connectivity=8)
    big=np.isin(lab,[i for i in range(1,n) if stats[i,cv2.CC_STAT_AREA]>=60])
    sel=edge&(lum>70)&big
    img[sel,:3]=np.minimum(img[sel,:3],dark[sel]+18)
    return img
if __name__=='__main__':
    info={}
    for cid,(fn,n) in CHARS.items():
        rgb,mask,off=pixelize(ROOT+'assets/reference/sprites/'+fn,n)
        mask=cleanup(mask)
        pal,_=kmeans_palette(rgb,mask,n)
        img,idx=snap(rgb,mask,pal)
        img=outline(img)
        Image.fromarray(img).save(ROOT+f'docs/qa/work/flat_{cid}.png')
        info[cid]={'offset':off,'colors':int(len(np.unique(img[img[...,3]>0][:,:3],axis=0)))}
        print(cid,info[cid])
    json.dump(info,open(ROOT+'docs/qa/work/pixelize_info.json','w'))
