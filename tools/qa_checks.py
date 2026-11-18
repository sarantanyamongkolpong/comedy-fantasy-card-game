import sys,os,glob,json,numpy as np
sys.path.insert(0,os.path.dirname(__file__))
from PIL import Image
import compose as C
R=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')) + '/'
res={'alpha_binary':{},'canvas':{},'roundtrip':{},'base_composites':[]}
mine=[f for f in glob.glob(R+'assets/**/*.png',recursive=True) if '/card/' not in f and '/assets/card-art/frames/' not in f]
for f in sorted(mine):
    a=np.array(Image.open(f).convert('RGBA'))[...,3]; bad=int(((a>0)&(a<255)).sum())
    res['alpha_binary'][f.replace(R,'')]=bad
for cid in C.CH:
    for f in glob.glob(R+f'assets/characters/{cid}/sprite/{cid}_L*.png'):
        res['canvas'][f.replace(R,'')]=Image.open(f).size
    comp=np.array(C.compose(cid,C.default(cid))); flat=np.array(Image.open(R+f'docs/qa/work/flat_{cid}.png'))
    diff=int((np.any(comp!=flat,axis=-1)).sum()); res['roundtrip'][cid]=diff
    out=R+f'assets/characters/{cid}/sprite/{cid}_base_composite.png'; C.compose(cid,C.default(cid)).save(out); res['base_composites'].append(out.replace(R,''))
    g=C.compose(cid,dict(C.default(cid),headgear='EQ_AEG_POT_HELMET_GOLD_001')) if cid=='AVT_AEG_001' else None
    if g: g.save(R+f'assets/characters/{cid}/sprite/{cid}_base_composite_goldpot.png'); res['base_composites'].append(f'assets/characters/{cid}/sprite/{cid}_base_composite_goldpot.png')
# gold swap check: only headgear pixels differ
s=np.array(C.compose('AVT_AEG_001',C.default('AVT_AEG_001'))); g=np.array(C.compose('AVT_AEG_001',dict(C.default('AVT_AEG_001'),headgear='EQ_AEG_POT_HELMET_GOLD_001')))
hm=np.array(Image.open(R+'assets/characters/AVT_AEG_001/sprite/AVT_AEG_001_L04_headgear_silver.png'))[...,3]>0
d=np.any(s!=g,axis=-1); res['gold_swap']={'changed_px':int(d.sum()),'changed_outside_helmet_px':int((d&~hm).sum())}
print(json.dumps({k:(v if k!='alpha_binary' else {'files':len(v),'files_with_partial_alpha':[x for x,b in v.items() if b]}) for k,v in res.items()},indent=1))
json.dump(res,open(R+'docs/qa/qa_checks.json','w'),indent=1)
