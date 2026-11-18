import asyncio
from playwright.async_api import async_playwright
import os
R=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')) + '/'
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844},is_mobile=True,device_scale_factor=2); pg=await ctx.new_page()
    await pg.goto('file://'+R+'preview/index.html'); await pg.wait_for_timeout(800)
    r=await pg.evaluate("""()=>{const o=[];document.querySelectorAll('body *').forEach(e=>{const r=e.getBoundingClientRect();if(r.right>392)o.push(e.tagName+'#'+e.id+'.'+e.className+' '+Math.round(r.right))});return [document.documentElement.scrollWidth,o.slice(0,15)]}""")
    print(r); await b.close()
asyncio.run(m())
