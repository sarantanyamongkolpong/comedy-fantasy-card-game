import asyncio
from playwright.async_api import async_playwright
import os
R=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')) + '/'
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':1440,'height':900}); pg=await ctx.new_page()
    await pg.goto('file://'+R+'preview/index.html'); await pg.wait_for_timeout(800)
    for cid in ('AVT_AEG_001','AVT_PHA_001','AVT_CEL_001','AVT_SAN_001'):
      await pg.click(f'#tabs button[data-id={cid}]')
      for a,ts in (('attack',(220,330)),('defend',(200,)),('hit',(70,)),('ko',(900,))):
        for t in ts:
          await pg.click(f'#anims button[data-a={a}]'); await pg.wait_for_timeout(t)
          await pg.locator('#stage').screenshot(path=R+f'docs/qa/anim_{cid}_{a}_{t}ms.png')
      await pg.click('#anims button[data-a=idle]')
    await pg.click('#tabs button[data-id=AVT_PHA_001]'); await pg.check('#anch'); await pg.wait_for_timeout(200)
    await pg.locator('#stage').screenshot(path=R+'docs/qa/anchors_AVT_PHA_001.png')
    await b.close()
asyncio.run(m())
