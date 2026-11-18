import numpy as np, sys
from PIL import Image
COLS=[(255,0,0),(0,255,0),(0,128,255),(255,0,255),(255,255,0),(0,255,255),(255,128,0)]
def viz(img,masks,dst,z=6):
    out=img.copy().astype(float)
    bg=np.array([200,200,210],float)
    out[...,:3]=np.where(img[...,3:]>0,out[...,:3],bg)
    for i,(k,m) in enumerate(masks.items()):
        c=np.array(COLS[i%len(COLS)])
        out[m,:3]=out[m,:3]*0.45+c*0.55
    o=Image.fromarray(out[...,:3].astype(np.uint8)).resize((128*z,128*z),Image.NEAREST)
    from PIL import ImageDraw; d=ImageDraw.Draw(o)
    for i in range(0,129,8):
        c=(255,0,0) if i%32==0 else (90,90,110)
        d.line([(i*z,0),(i*z,128*z)],fill=c); d.line([(0,i*z),(128*z,i*z)],fill=c); d.text((i*z+1,1),str(i),fill=(0,0,0))
        d.text((1,i*z+1),str(i),fill=(0,0,0))
    for i,k in enumerate(masks): d.text((4,128*z-14*(i+1)),k,fill=COLS[i%len(COLS)])
    o.save(dst)
