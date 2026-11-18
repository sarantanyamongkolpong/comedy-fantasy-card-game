"""Regenerate preview/index.html (relative asset paths) and preview/card_game_art_preview_standalone.html
(every image inlined as base64) from the CURRENT files. Re-run after any asset change:
    python3 tools/build_preview.py

Mobile layout (touch targets, name plate, stage fit) lives in tools/preview_template.html.
Both HTML files are generated from that template so they stay in sync.
"""
import json, os, base64, glob, datetime, hashlib
R=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')) + '/'
CH=[('AVT_AEG_001','Sir Potlid','เซอร์ฝาหม้อ','Aegis Dominion','Tank','humanoid_heavy','AEGIS'),
    ('AVT_PHA_001','Nox Squeak','น็อกซ์ รองเท้าดัง','Phantom Blades','DPS','humanoid_standard','PHANTOM'),
    ('AVT_CEL_001','Madame Meteor','มาดามดาวตก','Celestial Nexus','Magic','humanoid_standard','CELESTIAL'),
    ('AVT_SAN_001','Sister Plaster','ซิสเตอร์พลาสเตอร์','Sanctuary Order','Support','humanoid_standard','SANCTUARY')]
NOTES={'EQ_AEG_POT_HELMET_SILVER_001':'Silver cooking-pot helmet (cut from body, head repainted underneath)',
 'EQ_AEG_POT_HELMET_GOLD_001':'Gold variant = recolour of the silver helmet layer (same shape/pivot)',
 'EQ_AEG_SWORD_POTLID_001':'Potlid short sword (native)','EQ_AEG_SHIELD_POTLID_001':'Pot-lid shield (native)',
 'EQ_PHA_KUNAI_MAIN_001':'Kunai, main hand (native)','EQ_PHA_KUNAI_OFF_001':'Kunai, off hand (native)',
 'EQ_PHA_SNEAKERS_SQUEAK_001':'Light-up squeaky sneakers (native accessory)','EQ_CEL_HAT_ASTRO_001':'Astrologer hat with orbit ring',
 'EQ_CEL_STAFF_PLANET_001':'Ringed-planet staff (signature)','EQ_CEL_NOODLE_CUP_001':'Fortune-telling instant noodles',
 'EQ_SAN_CAP_HEALER_001':'Healer cap with green cross','EQ_SAN_STAFF_BANDAGE_001':'Giant bandage staff (signature)','EQ_SAN_CLIPBOARD_001':'Clipboard'}
OPTS={'AVT_AEG_001':dict(headgear=['EQ_AEG_POT_HELMET_SILVER_001','EQ_AEG_POT_HELMET_GOLD_001'],main_hand=['EQ_AEG_SWORD_POTLID_001','EQ_SWORD_BASIC_001','EQ_DAGGER_BASIC_001'],off_hand=['EQ_AEG_SHIELD_POTLID_001','EQ_SHIELD_BUCKLER_001']),
 'AVT_PHA_001':dict(main_hand=['EQ_PHA_KUNAI_MAIN_001','EQ_DAGGER_BASIC_001','EQ_SWORD_BASIC_001'],off_hand=['EQ_PHA_KUNAI_OFF_001','EQ_DAGGER_BASIC_001'],accessory=['EQ_PHA_SNEAKERS_SQUEAK_001']),
 'AVT_CEL_001':dict(headgear=['EQ_CEL_HAT_ASTRO_001'],main_hand=['EQ_CEL_STAFF_PLANET_001','EQ_STAFF_NEUTRAL_001','EQ_SAN_STAFF_BANDAGE_001'],off_hand=['EQ_CEL_NOODLE_CUP_001','EQ_SHIELD_BUCKLER_001']),
 'AVT_SAN_001':dict(headgear=['EQ_SAN_CAP_HEALER_001'],main_hand=['EQ_SAN_STAFF_BANDAGE_001','EQ_STAFF_NEUTRAL_001','EQ_CEL_STAFF_PLANET_001'],off_hand=['EQ_SAN_CLIPBOARD_001','EQ_SHIELD_BUCKLER_001'])}
def rel(p): return '../'+p
def build(inline=False):
    def src(p):
        if p is None or not os.path.exists(R+p): return None
        if not inline: return rel(p)
        mime='image/webp' if p.endswith('.webp') else 'image/png'
        return f'data:{mime};base64,'+base64.b64encode(open(R+p,'rb').read()).decode()
    rigs={k:json.load(open(R+f'assets/characters/_rigs/{k}.json')) for k in ('humanoid_heavy','humanoid_standard')}
    shared=json.load(open(R+'assets/equipment/shared_items.json'))
    vfx=json.load(open(R+'assets/vfx/vfx.json'))
    items={}
    for k,v in shared.items():
        items[k]=dict(src=src(f'assets/equipment/{k}.png'),pivot=v['pivot'],slot=v['slot'],shared=True,status='PROTOTYPE',note=v['note'])
    chars=[]
    for cid,en,th,fac,role,rig,fk in CH:
        rc=rigs[rig]['characters'][cid]
        for k,v in rc['native_items'].items():
            items[k]=dict(src=src(v['file']),pivot=v['pivot'],slot=v['slot'],native_character=cid,status='PROTOTYPE',note=NOTES.get(k,''))
        Ls={}
        for l in rc['layers']:
            p=f'assets/characters/{cid}/sprite/'+l['file']
            if l['layer']=='L01': Ls['L01']=src(p)
            if l['layer'] in ('L05f','L06f'): Ls[l['layer']]=src(p)
            if l['layer']=='L09': Ls['L09']=src(p)
        native={l['slot']:None for l in rc['layers']}
        dl={}
        for k,v in rc['native_items'].items():
            if v['slot'] not in dl and 'GOLD' not in k: dl[v['slot']]=k
        cd=f'assets/characters/{cid}/card/'
        art=cd+f'{cid}_card_v1_web.webp' if os.path.exists(R+cd+f'{cid}_card_v1_web.webp') else cd+f'{cid}_card_v1.png'
        var=cd+f'{cid}_card_v1_variant_goldpot_web.webp'
        chars.append(dict(id=cid,name_en=en,name_th=th,faction=fac,role=role,rig=rig,anchors=rc['anchors'],layers=Ls,
            default_loadout=dl,slot_options=OPTS[cid],fit=rc.get('fit',{}),
            vfx_id={'AVT_PHA_001':'VFX_PHA_SQUEAK_001','AVT_CEL_001':'VFX_CEL_NOODLE_STEAM_001'}.get(cid),
            body_note='L01–L03 baked from flat ref; occluded pixels repainted (see registry)',
            card=dict(art=src(art),variant=src(var),frame=src(f'assets/card-art/frames/factions/FRAME_{fk}_001.png') or src('assets/card-art/frames/shared/FRAME_BASE_001.png'),
                      emblem=src(f'assets/card-art/frames/factions/EMBLEM_{fk}_001.png'))))
    for k,v in vfx.items(): v['src']=src(f'assets/vfx/{k}.png')
    layout=json.load(open(R+'assets/card-art/frames/frame_layout.json')) if os.path.exists(R+'assets/card-art/frames/frame_layout.json') else {"canvas":{"w":750,"h":1050},"rects":{"art_window":{"x":30,"y":30,"w":690,"h":920},"faction_emblem":{"x":42,"y":42,"w":96,"h":96},"rarity":{"x":560,"y":48,"w":148,"h":40},"name":{"x":120,"y":896,"w":510,"h":50},"stat_pow":{"x":45,"y":960,"w":200,"h":70},"stat_def":{"x":275,"y":960,"w":200,"h":70},"stat_spd":{"x":505,"y":960,"w":200,"h":70}}}
    anim=json.load(open(R+'assets/animations/ANIM_SHARED_001.json'))
    honest=("<b>Real now:</b> separate transparent layer PNGs on one 128×128 canvas per character; equipment items with their own pivots placed on per-character anchors; "
      "Silver→Gold pot is a true L04 swap; the neutral staff and both signature staffs equip on both mages via the same compositor. "
      "<b>Approximated:</b> L01 Body + L02 Face/Hair + L03 Outfit are baked into one body layer (flat-source simplification); pixels hidden by removed items were repainted by script "
      "(inpaint + palette snap, mirror-fill behind Potlid's shield, simple painted hair caps under headgear, placeholder tabi feet under Nox's sneakers) — acceptable when equipped, rough when the slot is empty. "
      "Sprites are scripted downscales of the Owner's flat references, not hand-pixelled. Attack/Defend/Hit/KO are procedural transforms + shared VFX (PROTOTYPE), not hand-drawn frames. "
      "Card art = generated illustrations (PROTOTYPE); gold-pot card = CONCEPT. Nothing here is PRODUCTION_READY. No stats, rarity or card costs assigned.")
    pot_note="Same Character ID AVT_AEG_001; body, face, armour, shield, sword and animation identical — only the L04 headgear layer is replaced (EQ_AEG_POT_HELMET_SILVER_001 ↔ EQ_AEG_POT_HELMET_GOLD_001, same pivot)."
    data=dict(items=items,characters=chars,anim=anim,vfx=vfx,frame_layout=layout,honest=honest,pot_note=pot_note,
              build=datetime.datetime.now().strftime('%Y-%m-%d %H:%M (UTC+7)')+(' · standalone' if inline else ' · local'))
    t=open(R+'tools/preview_template.html').read().replace('/*__DATA__*/null',json.dumps(data,ensure_ascii=False))
    out=R+('preview/card_game_art_preview_standalone.html' if inline else 'preview/index.html')
    os.makedirs(R+'preview',exist_ok=True); open(out,'w').write(t); print(out,len(t))
if __name__=='__main__':
    build(False); build(True)
