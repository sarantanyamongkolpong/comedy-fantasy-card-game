import json, glob, hashlib, os, datetime
from PIL import Image
R=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')) + '/'
def sha(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()
def size(p):
    try: return list(Image.open(p).size)
    except Exception: return None
qa=json.load(open(R+'docs/qa/qa_checks.json'))
rigs={k:json.load(open(R+f'assets/characters/_rigs/{k}.json')) for k in ('humanoid_heavy','humanoid_standard')}
shared=json.load(open(R+'assets/equipment/shared_items.json')); vfx=json.load(open(R+'assets/vfx/vfx.json'))
A=[]
def add(**k):
    p=R+k['path']; k['sha256']=sha(p); k['bytes']=os.path.getsize(p)
    if k['path'].endswith(('.png','.webp','.jpg')): k.setdefault('canvas_px',size(p))
    A.append(k)
for rn,rg in rigs.items():
    add(asset_id=f'RIG_{rn.upper()}_001',path=f'assets/characters/_rigs/{rn}.json',type='rig_definition',owner='shared',status='PROTOTYPE',
        note='default anchors + per-character measured anchors, layer list and fit offsets')
    for cid,c in rg['characters'].items():
        for l in c['layers']:
            stem=l['file'][:-4]
            add(asset_id='SPR_'+stem,path=f'assets/characters/{cid}/sprite/{l["file"]}',type='sprite_layer',owner=cid,rig=rn,layer=l['layer'],slot=l['slot'],
                variant=l.get('variant'),pivot=[0,0],pivot_note='character-fitted layer: canvas-aligned (0,0)',anchors=c['anchors'],status='PROTOTYPE',
                fill_note=l.get('fill') or l.get('note'),qa={'alpha_0_255':True,'canvas_128':True})
        for iid,it in c['native_items'].items():
            add(asset_id=iid,path=it['file'],type='equipment_item',owner=cid,slot=it['slot'],pivot=it['pivot'],pivot_kind=it['pivot_kind'],
                native_origin_on_128=it['native_origin'],variant_of=it.get('variant_of'),status='PROTOTYPE',
                reuse='equippable on other characters via pivot→anchor' if it['slot'] in ('main_hand','off_hand') else 'character-specific shape')
        for kind,suffix in (('sprite_composite_flattened','_base_composite'),('sprite_composite_flattened','_base_composite_goldpot'),('sprite_sheet_idle','_idle_sheet')):
            p=f'assets/characters/{cid}/sprite/{cid}{suffix}.png'
            if os.path.exists(R+p): add(asset_id='SPR_'+cid+suffix.upper(),path=p,type=kind,owner=cid,status='PROTOTYPE',
                note='derived (flattened) from layers by tools/compose.py / export_idle.py; NOT a source asset' + (' · 6 frames x 128px, procedural idle' if 'idle' in suffix else ''))
for k,v in shared.items():
    add(asset_id=k,path=f'assets/equipment/{k}.png',type='equipment_item',owner='shared',slot=v['slot'],pivot=v['pivot'],pivot_kind=v['pivot_kind'],
        compatible_rigs=v['compatible_rigs'],tested_on=v['tested_on'],status='PROTOTYPE',note=v['note'])
add(asset_id='META_SHARED_ITEMS_001',path='assets/equipment/shared_items.json',type='metadata',owner='shared',status='PROTOTYPE')
for k,v in vfx.items():
    add(asset_id=k,path=f'assets/vfx/{k}.png',type='vfx_strip',owner='shared',frame_px=v['frame'],frames=v['frames'],pivot=v['pivot'],use=v['use'],status='PROTOTYPE')
add(asset_id='META_VFX_001',path='assets/vfx/vfx.json',type='metadata',owner='shared',status='PROTOTYPE')
add(asset_id='ANIM_SHARED_001',path='assets/animations/ANIM_SHARED_001.json',type='animation_timing',owner='shared',status='PROTOTYPE',
    note='Idle tuned/loopable; Attack/Defend/Hit/KO procedural prototypes (no hand-drawn frames)')
# card art worker outputs (read-only, recorded for integration)
cstat=lambda p:'CONCEPT' if ('variant' in p or 'EMBLEM' in p) else 'PROTOTYPE'
for p in sorted(glob.glob(R+'assets/characters/*/card/*.*')):
    if '_rejected' in p: continue
    rp=p.replace(R,''); cid=rp.split('/')[2]
    add(asset_id='CARD_'+os.path.basename(p).rsplit('.',1)[0],path=rp,type='card_art',owner=cid,produced_by='card_art_worker',status=cstat(rp),
        note='flat painted illustration (not modular); see docs/CARD_ART_NOTES.md')
for p in sorted(glob.glob(R+'assets/card-art/frames/shared/*.png')+glob.glob(R+'assets/card-art/frames/factions/*.png')+[R+'assets/card-art/frames/frame_layout.json']):
    rp=p.replace(R,''); add(asset_id=os.path.basename(p).rsplit('.',1)[0].upper(),path=rp,type='card_frame' if 'FRAME' in rp else 'card_emblem' if 'EMBLEM' in rp else 'card_frame_layout',
        owner='shared',produced_by='card_art_worker',status=cstat(rp))
for p in sorted(glob.glob(R+'assets/reference/sprites/*.png')):
    rp=p.replace(R,''); add(asset_id='REF_'+os.path.basename(p)[:-4].upper(),path=rp,type='owner_reference_flat',owner='owner',status='CONCEPT',
        note='Owner flat reference (identity lock). Not layered, not modular.')
for p in ('preview/index.html','preview/card_game_art_preview_standalone.html'):
    add(asset_id='PREVIEW_'+('LOCAL' if 'index' in p else 'STANDALONE'),path=p,type='preview',owner='shared',status='PROTOTYPE')
ids=[a['asset_id'] for a in A]; assert len(ids)==len(set(ids)),'duplicate ids'
M=dict(project='Comedy Fantasy Card Game — First 4 Avatars',manifest_version=1,generated=datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S+07:00'),
  status_legend=['CONCEPT','PROTOTYPE','QA_PASSED','PRODUCTION_READY','INTEGRATED'],
  honest_summary='Nothing is PRODUCTION_READY. Sprite layers are real separate PNGs on a shared 128x128 canvas but were cut from flat Owner references by script; occluded pixels are repainted approximations.',
  canvas={'logical':[128,128],'baseline_y':122,'scale_from_ref':0.09,'alpha':'0/255 only','scaling':'nearest-neighbour integer'},
  characters={'AVT_AEG_001':'Sir Potlid / เซอร์ฝาหม้อ · Aegis Dominion · Tank · humanoid_heavy','AVT_PHA_001':'Nox Squeak / น็อกซ์ รองเท้าดัง · Phantom Blades · DPS · humanoid_standard',
              'AVT_CEL_001':'Madame Meteor / มาดามดาวตก · Celestial Nexus · Magic · humanoid_standard','AVT_SAN_001':'Sister Plaster / ซิสเตอร์พลาสเตอร์ · Sanctuary Order · Support · humanoid_standard'},
  stats='POW/DEF/SPD values TBD; rarity TBD; card AP costs TBD',qa_checks={'roundtrip_default_composite_vs_pixelized_ref_px_diff':qa['roundtrip'],'gold_swap':qa['gold_swap']},
  asset_count=len(A),assets=A)
json.dump(M,open(R+'docs/ASSET_MANIFEST.json','w'),indent=1,ensure_ascii=False); print(len(A))
