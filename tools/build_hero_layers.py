from PIL import Image
import json, colorsys
im=Image.open('../assets/source/hero_starter_sheet.png').convert('RGBA')
cell=lambda r,c: im.crop((c*64,r*64,c*64+64,r*64+64))
names=['base','cap','vest','belt','boots','lid','bible']
VIEWS=[('front',0),('front',1),('back',0),('back',1)]
def grid(img): p=img.load(); return [[(p[x,y] if p[x,y][3] else None) for x in range(64)] for y in range(64)]
def hexc(c): return '#%02x%02x%02x'%c[:3]
base={v:[None,None] for v in ('front','back')}
layers={n:{'front':[None,None],'back':[None,None]} for n in names[1:]}
for ci,(v,f) in enumerate(VIEWS):
    b=grid(cell(0,ci)); base[v][f]=b
    for ri,n in enumerate(names[1:],1):
        t=grid(cell(ri,ci))
        layers[n][v][f]=[[ ('T' if t[y][x]==b[y][x] else ('E' if t[y][x] is None else t[y][x])) for x in range(64)] for y in range(64)]
def lum(c): return 0.3*c[0]+0.59*c[1]+0.11*c[2]
def ramp(stops):
    def f(c):
        l=lum(c)/255; i=min(len(stops)-2,int(l*(len(stops)-1))); t=l*(len(stops)-1)-i
        a,b=stops[i],stops[i+1]; return tuple(int(a[k]+(b[k]-a[k])*t) for k in range(3))+(255,)
    return f
STEEL=ramp([(20,22,30),(70,78,92),(140,150,165),(205,212,222),(250,252,255)])
GOLD=ramp([(40,24,10),(130,84,24),(220,160,50),(255,224,130),(255,250,220)])
WHITE=ramp([(40,34,30),(150,140,128),(225,218,205),(250,248,242),(255,255,255)])
def weak(c):
    h,s_,v_=colorsys.rgb_to_hsv(*[x/255 for x in c[:3]])
    return s_<0.13 and 45<lum(c)<215
def recolor(layer, fn):
    return [[(c if c in ('T','E') or lum(c)<45 else fn(c)) for c in row] for row in layer]
def faith_fn(c): return GOLD(c) if lum(c)<120 else WHITE(c)
arm=Image.open('../assets/source/hero_armor_sheet.png').convert('RGBA')
acell=lambda r,c: arm.crop((c*64,r*64,c*64+64,r*64+64))
for ri,n in enumerate(['helm','breast','truth','sabatons','faith','sword'],1):
    layers[n]={'front':[None,None],'back':[None,None]}
    for ci,(v,f) in enumerate(VIEWS):
        b=base[v][f]; t=grid(acell(ri,ci))
        layers[n][v][f]=[[ ('T' if t[y][x]==b[y][x] else ('E' if t[y][x] is None else t[y][x])) for x in range(64)] for y in range(64)]
def green(c):
    r,g,b=c[:3]; h,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255)
    if s<0.13 and 45<lum(c)<215: return tuple(int(x*255) for x in colorsys.hsv_to_rgb(0.27,0.42,min(1,v*1.02)))+(255,)
    return c
freed=[[[ (green(c) if c else None) for c in row] for row in base['front'][f]] for f in (0,1)]
ALPHA=''.join(chr(c) for c in list(range(0x21,0x7f))+list(range(0xA1,0x250))+list(range(0x391,0x3CA))+list(range(0x400,0x500))+list(range(0x4E00,0x5200)) if chr(c) not in '.,\\\'"`$×÷­')
colors={}
def enc(g):
    rows=[]
    for row in g:
        s=''
        for c in row:
            if c in (None,'T'): s+='.'; continue
            if c=='E': s+=','; continue
            h=hexc(c)
            if h not in colors: colors[h]=len(colors)
            s+=ALPHA[colors[h]]
        rows.append(s)
    return rows
out={'W':64,'H':64,'base':{v:[enc(base[v][f]) for f in (0,1)] for v in base},
     'items':{n:{v:[enc(layers[n][v][f]) for f in (0,1)] for v in ('front','back')} for n in layers},
     'freed':[enc(freed[0]),enc(freed[1])]}
out['pal']=[k for k,_ in sorted(colors.items(),key=lambda kv:kv[1])]
out['weak']=''.join(ALPHA[i] for i,k in enumerate(out['pal']) if weak(tuple(int(k[j:j+2],16) for j in (1,3,5))))
assert len(colors)<len(ALPHA),(len(colors),len(ALPHA))
json.dump(out,open('hero2.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
open('alpha2.txt','w',encoding='utf-8').write(ALPHA)
print(len(colors),'colors /',len(ALPHA),'chars')
def compose(v,f,items,fr=False):
    g=[r[:] for r in (freed[f] if fr else base[v][f])]; own=[[False]*64 for _ in range(64)]
    for it in items:
        for y in range(64):
            for x in range(64):
                c=layers[it][v][f][y][x]
                if c=='T': continue
                if own[y][x] and (c=='E' or weak(c)): continue
                g[y][x]=None if c=='E' else c; own[y][x]=True
    img=Image.new('RGBA',(64,64)); p=img.load()
    for y in range(64):
        for x in range(64):
            if g[y][x]: p[x,y]=g[y][x]
    return img
order=['vest','breast','belt','truth','boots','sabatons','cap','helm','lid','faith','bible','sword']
t1=[i for i in order if i in ('vest','belt','boots','cap','lid','bible')]; t2=[i for i in order if i in ('helm','breast','truth','sabatons','faith','sword')]
imgs=[compose('front',0,[]),compose('front',0,t1),compose('back',1,t1),compose('front',0,t2),compose('back',1,t2),compose('front',1,[],True)]
sheet=Image.new('RGBA',(64*6*3,64*3),(23,17,13,255))
for i,m in enumerate(imgs): sheet.alpha_composite(m.resize((192,192),Image.NEAREST),(i*192,0))
sheet.save('hero2_preview.png')
