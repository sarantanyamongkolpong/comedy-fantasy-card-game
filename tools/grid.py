import sys
from PIL import Image, ImageDraw
def grid(src,dst,z=7):
    im=Image.open(src).convert('RGBA'); W=im.width*z
    bg=Image.new('RGBA',(W+30,W+30),(200,200,210,255)); bg.alpha_composite(im.resize((W,W),Image.NEAREST),(30,30))
    d=ImageDraw.Draw(bg)
    for i in range(0,im.width+1,8):
        col=(255,0,0,255) if i%32==0 else (120,120,140,255)
        d.line([(30+i*z,30),(30+i*z,30+W)],fill=col+(0,)[:0],width=1)
        d.line([(30,30+i*z),(30+W,30+i*z)],fill=col,width=1)
        d.text((30+i*z+1,2),str(i),fill=(0,0,0,255)); d.text((1,30+i*z+1),str(i),fill=(0,0,0,255))
    bg.save(dst)
if __name__=='__main__': grid(sys.argv[1],sys.argv[2])
