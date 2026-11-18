"""Mask helpers + per-character segmentation specs on the 128x128 logical canvas.
All coordinates are logical pixels (see docs/ART_STYLE_BIBLE.md §6)."""
import numpy as np, cv2
Y,X=np.mgrid[0:128,0:128]
def hsv(img):
    return cv2.cvtColor(np.ascontiguousarray(img[...,:3]),cv2.COLOR_RGB2HSV).astype(int)
def box(x0,y0,x1,y1): return (X>=x0)&(X<=x1)&(Y>=y0)&(Y<=y1)
def ell(cx,cy,rx,ry): return ((X-cx)/rx)**2+((Y-cy)/ry)**2<=1
def poly(pts):
    m=np.zeros((128,128),np.uint8); cv2.fillPoly(m,[np.array(pts,np.int32)],1); return m.astype(bool)
def thick_line(p0,p1,w):
    m=np.zeros((128,128),np.uint8); cv2.line(m,tuple(p0),tuple(p1),1,w); return m.astype(bool)
class C:
    def __init__(s,img):
        s.a=img[...,3]>0; h=hsv(img); s.H,s.S,s.V=h[...,0],h[...,1],h[...,2]
        s.skin=(s.H>=4)&(s.H<=20)&(s.S>=50)&(s.S<=175)&(s.V>=150)&s.a
        s.grey=(s.S<55)&(s.V>=70)&s.a
        s.gold=(s.H>=12)&(s.H<=32)&(s.S>=100)&(s.V>=110)&s.a
        s.dark=(s.V<75)&s.a
        s.purple=(s.H>=118)&(s.H<=165)&(s.S>=60)&s.a
        s.blue=(s.H>=100)&(s.H<118)&(s.S>=80)&s.a
        s.brown=(s.H>=5)&(s.H<=22)&(s.S>=90)&(s.V>=50)&(s.V<150)&s.a
        s.white=(s.S<60)&(s.V>=170)&s.a
        s.green=(s.H>=60)&(s.H<=100)&(s.S>=50)&s.a
def grow(m,into,n=1):
    for _ in range(n):
        d=cv2.dilate(m.astype(np.uint8),np.ones((3,3),np.uint8)).astype(bool)
        m=m|(d&into)
    return m
