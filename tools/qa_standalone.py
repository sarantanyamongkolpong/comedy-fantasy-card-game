import asyncio
from playwright.async_api import async_playwright
import os
R=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')) + '/'
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch(); 
    for vw,vh,n,mob in ((1440,900,'standalone_desk_1440',False),(844,390,'standalone_mob_844x390',True)):
      ctx=await b.new_context(viewport={'width':vw,'height':vh},is_mobile=mob,device_scale_factor=2 if mob else 1); pg=await ctx.new_page(); errs=[]
      pg.on('pageerror',lambda e: errs.append(str(e)))
      await pg.goto('file://'+R+'preview/card_game_art_preview_standalone.html'); await pg.wait_for_timeout(1200)
      await pg.click('#tabs button[data-id=AVT_AEG_001]'); await pg.click('text=Golden Pot (V2)'); await pg.wait_for_timeout(300)
      ok=await pg.evaluate("()=>[...document.images].filter(i=>!i.complete||!i.naturalWidth).length")
      sw=await pg.evaluate("()=>document.documentElement.scrollWidth")
      await pg.screenshot(path=f'{R}docs/qa/{n}.png'); print(n,'broken imgs',ok,'scrollWidth',sw,'errors',errs); await ctx.close()
    await b.close()
asyncio.run(m())
