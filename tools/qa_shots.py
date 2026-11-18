import asyncio, sys
from playwright.async_api import async_playwright
import os
R=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')) + '/'
async def main(page_file='preview/index.html', tag=''):
    async with async_playwright() as p:
        b=await p.chromium.launch()
        errs=[]
        async def shot(vw,vh,name,actions=None,full=False,mobile=False):
            ctx=await b.new_context(viewport={'width':vw,'height':vh},device_scale_factor=2 if mobile else 1,is_mobile=mobile,has_touch=mobile)
            pg=await ctx.new_page(); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None); pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.goto('file://'+R+page_file); await pg.wait_for_timeout(700)
            if actions: await actions(pg)
            await pg.wait_for_timeout(400)
            await pg.screenshot(path=R+f'docs/qa/{name}{tag}.png',full_page=full); await ctx.close()
        async def gold(pg): await pg.click('text=Golden Pot (V2)')
        async def meteor_neutral(pg): await pg.click('#tabs button[data-id=AVT_CEL_001]'); await pg.click('text=Neutral shared staff')
        async def plaster_neutral(pg): await pg.click('#tabs button[data-id=AVT_SAN_001]'); await pg.click('text=Neutral shared staff')
        async def nox(pg): await pg.click('#tabs button[data-id=AVT_PHA_001]'); await pg.check('#anch')
        async def staffsec(pg): await pg.locator('#staffTest').scroll_into_view_if_needed()
        async def zoomcard(pg): await pg.click('#cardHost .card')
        async def attack(pg): await pg.click('#anims button[data-a=attack]'); await pg.wait_for_timeout(180)
        async def ko(pg): await pg.click('#anims button[data-a=ko]'); await pg.wait_for_timeout(900)
        await shot(1440,900,'desk_1440_potlid_silver')
        await shot(1440,900,'desk_1440_potlid_gold',gold)
        await shot(1440,900,'desk_1440_meteor_neutral_staff',meteor_neutral)
        await shot(1440,900,'desk_1440_plaster_neutral_staff',plaster_neutral)
        await shot(1440,900,'desk_1440_nox_anchors',nox)
        await shot(1440,900,'desk_1440_fullpage',None,True)
        await shot(1440,900,'desk_1440_attack_frame',attack)
        await shot(1440,900,'desk_1440_ko',ko)
        await shot(1440,900,'desk_1440_card_zoom',zoomcard)
        await shot(844,390,'mob_844x390_landscape_potlid',None,False,True)
        await shot(844,390,'mob_844x390_landscape_gold',gold,False,True)
        await shot(844,390,'mob_844x390_landscape_plaster_neutral',plaster_neutral,False,True)
        await shot(844,390,'mob_844x390_staff_test',staffsec,False,True)
        await shot(390,844,'mob_390x844_portrait',None,False,True)
        await shot(390,844,'mob_390x844_portrait_meteor_neutral',meteor_neutral,True,True)
        ctx=await b.new_context(viewport={'width':1440,'height':900},device_scale_factor=1); pg=await ctx.new_page()
        await pg.goto('file://'+R+page_file); await pg.wait_for_timeout(900)
        for sec in ('potTest','staffTest','sharedTest','compare'):
            await pg.locator('#'+sec).screenshot(path=R+f'docs/qa/section_{sec}{tag}.png')
        await ctx.close()
        await b.close()
        print('ERRORS:',errs)
asyncio.run(main(*(sys.argv[1:] or [])))
