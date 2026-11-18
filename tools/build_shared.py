"""Hand-authored (procedural, pixel-by-pixel) shared equipment + VFX for the cross-character reuse test.
All alpha 0/255, nearest only. Each item has a sidecar pivot in assets/equipment/shared_items.json."""
import numpy as np, json, os, math
from PIL import Image
R=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')) + '/'
def canvas(w,h): return np.zeros((h,w,4),np.uint8)
def px(a,x,y,c):
    if 0<=x<a.shape[1] and 0<=y<a.shape[0]: a[y,x,:3]=c; a[y,x,3]=255
def rect(a,x0,y0,x1,y1,c):
    for y in range(y0,y1+1):
        for x in range(x0,x1+1): px(a,x,y,c)
def disc(a,cx,cy,r,c):
    for y in range(int(cy-r-1),int(cy+r+2)):
        for x in range(int(cx-r-1),int(cx+r+2)):
            if (x-cx)**2+(y-cy)**2<=r*r: px(a,x,y,c)
def outline(a,c):
    m=a[...,3]>0; o=a.copy()
    H,W=m.shape
    for y in range(H):
        for x in range(W):
            if not m[y,x] and any(0<=y+dy<H and 0<=x+dx<W and m[y+dy,x+dx] for dx,dy in ((1,0),(-1,0),(0,1),(0,-1))):
                o[y,x,:3]=c; o[y,x,3]=255
    return o
def save(a,p):
    os.makedirs(os.path.dirname(p),exist_ok=True); Image.fromarray(a,'RGBA').save(p)
OUT=dict(); D=R+'assets/equipment/'; V=R+'assets/vfx/'
WOOD=[(92,58,34),(128,84,46),(166,116,66),(198,152,96)]
SILV=[(88,92,108),(140,146,162),(196,202,214),(240,242,248)]
GOLD=[(122,78,20),(186,132,34),(232,184,62),(252,232,140)]
OUTL=(34,24,30)
# --- neutral staff: plain wood shaft, silver collar & ferrule, clear quartz orb (no faction colour)
st=canvas(15,102)
for y in range(16,97):
    px(st,6,y,WOOD[3] if y%9 else WOOD[2]); px(st,7,y,WOOD[2]); px(st,8,y,WOOD[1])
rect(st,5,12,9,15,SILV[2]); rect(st,8,12,9,15,SILV[1]); rect(st,5,12,5,15,SILV[3])
rect(st,5,40,9,41,SILV[1]); rect(st,5,48,9,49,SILV[1])   # grip wraps (fist sits between)
rect(st,6,97,8,99,SILV[1]); px(st,6,97,SILV[3]); px(st,7,100,SILV[0])
for x,y in ((3,9),(11,9),(4,11),(10,11)): px(st,x,y,SILV[2])
disc(st,7,6,4.6,(176,214,236)); disc(st,6.3,5.3,2.6,(214,238,250)); px(st,5,3,(255,255,255)); px(st,6,4,(255,255,255)); px(st,9,8,(122,160,196))
st=outline(st,OUTL)
save(st,D+'EQ_STAFF_NEUTRAL_001.png')
OUT['EQ_STAFF_NEUTRAL_001']=dict(slot='main_hand',pivot=[7,45],pivot_kind='grip',size=[15,102],compatible_rigs=['humanoid_standard'],
  tested_on=['AVT_CEL_001','AVT_SAN_001'],note='Neutral wood+silver staff with quartz orb; grip = shaft point between the two wraps')
# --- basic short sword (blade up)
sw=canvas(11,36)
for y in range(2,24):
    px(sw,4,y,SILV[3]); px(sw,5,y,SILV[2]); px(sw,6,y,SILV[1])
px(sw,5,0,SILV[3]); px(sw,4,1,SILV[3]); px(sw,5,1,SILV[2]); px(sw,6,1,SILV[1])
for y in range(4,22,1): px(sw,5,y,SILV[2] if y%2 else SILV[3])
rect(sw,0,24,10,25,GOLD[2]); rect(sw,0,25,10,25,GOLD[1]); px(sw,0,24,GOLD[3])
rect(sw,4,26,6,31,WOOD[1]); px(sw,4,27,WOOD[2]); px(sw,4,29,WOOD[2])
rect(sw,4,32,6,33,GOLD[2]); px(sw,4,32,GOLD[3])
sw=outline(sw,OUTL); save(sw,D+'EQ_SWORD_BASIC_001.png')
OUT['EQ_SWORD_BASIC_001']=dict(slot='main_hand',pivot=[5,29],pivot_kind='grip',size=[11,36],compatible_rigs=['humanoid_heavy','humanoid_standard'],
  tested_on=['AVT_AEG_001','AVT_PHA_001'],note='Plain steel short sword, blade up, brass guard')
# --- basic dagger (reverse grip, blade down)
dg=canvas(7,22)
rect(dg,2,0,4,1,GOLD[2]); rect(dg,2,2,4,6,WOOD[1]); px(dg,2,3,WOOD[2]); rect(dg,0,7,6,7,GOLD[2]); px(dg,0,7,GOLD[3])
for y in range(8,20): px(dg,2,y,SILV[3]); px(dg,3,y,SILV[2]); px(dg,4,y,SILV[1])
px(dg,3,20,SILV[2]); px(dg,3,21,SILV[1])
dg=outline(dg,OUTL); save(dg,D+'EQ_DAGGER_BASIC_001.png')
OUT['EQ_DAGGER_BASIC_001']=dict(slot='main_hand|off_hand',pivot=[3,4],pivot_kind='grip',size=[7,22],compatible_rigs=['humanoid_standard','humanoid_heavy'],
  tested_on=['AVT_PHA_001','AVT_AEG_001'],note='Plain dagger, reverse grip (blade down)')
# --- wooden buckler shield
bk=canvas(24,24)
disc(bk,11.5,11.5,11,SILV[1]); disc(bk,11.5,11.5,9.5,WOOD[1]); 
for y in range(24):
    for x in range(24):
        if bk[y,x,3] and (x-11.5)**2+(y-11.5)**2<9.5**2 and (x+y)<20: bk[y,x,:3]=WOOD[2]
for x in range(3,21,5):
    for y in range(3,21):
        if (x-11.5)**2+(y-11.5)**2<9**2: px(bk,x,y,WOOD[0])
disc(bk,11.5,11.5,3.2,SILV[2]); disc(bk,10.6,10.6,1.4,SILV[3]); px(bk,13,13,SILV[0])
for a in range(0,360,45):
    px(bk,int(round(11.5+10*math.cos(math.radians(a)))),int(round(11.5+10*math.sin(math.radians(a)))),SILV[3])
bk=outline(bk,OUTL); save(bk,D+'EQ_SHIELD_BUCKLER_001.png')
OUT['EQ_SHIELD_BUCKLER_001']=dict(slot='off_hand',pivot=[12,12],pivot_kind='grip',size=[24,24],compatible_rigs=['humanoid_heavy','humanoid_standard'],
  tested_on=['AVT_AEG_001','AVT_SAN_001'],note='Iron-rimmed wooden buckler; grip = boss centre')
json.dump(OUT,open(D+'shared_items.json','w'),indent=1)
# ---------------- VFX strips (frames laid out horizontally) ----------------
VX={}
def strip(frames): 
    h,w=frames[0].shape[:2]; s=np.zeros((h,w*len(frames),4),np.uint8)
    for i,f in enumerate(frames): s[:,i*w:(i+1)*w]=f
    return s
# slash arc
fr=[]
for k in range(4):
    a=canvas(32,32); r0=13
    for t in np.linspace(-1.9+0.5*k,-0.2+0.5*k,40):
        for dr,c in ((0,(255,255,255)),(1,(190,230,255)),(2,(120,170,240)) if k<3 else (0,(180,200,230)),):
            x=int(round(16+(r0-dr)*math.cos(t))); y=int(round(16+(r0-dr)*math.sin(t)))
            if k<3 or dr==0: px(a,x,y,c)
    fr.append(a)
save(strip(fr),V+'VFX_SLASH_001.png'); VX['VFX_SLASH_001']=dict(frame=[32,32],frames=4,pivot=[16,16],use='Attack (melee)')
# hit spark
fr=[]
for k,rr in enumerate((2,5,7,5)):
    a=canvas(16,16)
    for ang in range(0,360,45):
        L=rr if ang%90==0 else rr-2
        for d in range(max(0,L-3) if k==3 else 0,L+1):
            px(a,int(round(8+d*math.cos(math.radians(ang)))),int(round(8+d*math.sin(math.radians(ang)))),(255,250,200) if d<L-1 else (255,170,60))
    if k<2: px(a,8,8,(255,255,255))
    fr.append(a)
save(strip(fr),V+'VFX_HIT_SPARK_001.png'); VX['VFX_HIT_SPARK_001']=dict(frame=[16,16],frames=4,pivot=[8,8],use='Hit')
# heal sparkle (green crosses rising)
fr=[]
pos=[(6,18),(16,14),(19,20),(10,8)]
for k in range(4):
    a=canvas(24,24)
    for i,(x,y) in enumerate(pos):
        yy=y-k*2-(i%2); s=1 if (k+i)%3 else 2
        c=(150,255,180) if (k+i)%2 else (90,220,140)
        for d in range(-s,s+1): px(a,x+d,yy,c); px(a,x,yy+d,c)
        px(a,x,yy,(240,255,240))
    fr.append(a)
save(strip(fr),V+'VFX_HEAL_SPARKLE_001.png'); VX['VFX_HEAL_SPARKLE_001']=dict(frame=[24,24],frames=4,pivot=[12,20],use='Skill (support) / heal')
# magic particles (purple-blue diamonds twinkle)
fr=[]
pts=[(5,6),(17,4),(12,13),(20,17),(4,19)]
for k in range(4):
    a=canvas(24,24)
    for i,(x,y) in enumerate(pts):
        ph=(k+i)%4
        c=[(120,90,230),(170,140,255),(220,210,255),(120,200,255)][ph]
        px(a,x,y,c)
        if ph in (1,2): px(a,x-1,y,c); px(a,x+1,y,c); px(a,x,y-1,c); px(a,x,y+1,c)
        if ph==2: px(a,x,y,(255,255,255))
    fr.append(a)
save(strip(fr),V+'VFX_MAGIC_PARTICLE_001.png'); VX['VFX_MAGIC_PARTICLE_001']=dict(frame=[24,24],frames=4,pivot=[12,12],use='Skill (magic)')
# defend glint ring
fr=[]
for k in range(4):
    a=canvas(32,32); r=6+k*3
    for t in np.linspace(0,2*math.pi,60):
        if k<3 or int(t*10)%2: px(a,int(round(16+r*math.cos(t))),int(round(16+r*0.6*math.sin(t))),(200,230,255) if k<2 else (130,180,240))
    fr.append(a)
save(strip(fr),V+'VFX_GUARD_RING_001.png'); VX['VFX_GUARD_RING_001']=dict(frame=[32,32],frames=4,pivot=[16,16],use='Defend')
json.dump(VX,open(V+'vfx.json','w'),indent=1)
print('ok')
