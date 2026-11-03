from PIL import Image
import random, base64, io, json
random.seed(7)
def hx(c): return tuple(int(c[i:i+2],16) for i in (1,3,5))+(255,)
def save(img,name): img.save(name+'.png'); b=io.BytesIO(); img.save(b,'PNG',optimize=True); return 'data:image/png;base64,'+base64.b64encode(b.getvalue()).decode()
OUT={}
def grain(img, x0,y0,x1,y1, base, dark, light, vertical=False):
    p=img.load()
    for y in range(y0,y1):
        for x in range(x0,x1):
            k = (x if vertical else y)
            n = (k*7 + ((y if vertical else x)//5)*3) % 9
            c = base
            if n==0: c=dark
            elif n==4 and random.random()<0.5: c=light
            if random.random()<0.06: c=dark
            p[x,y]=c
def parchment(img,x0,y0,x1,y1, base='#f3e2b6', spk='#e6cf9a', hi='#fbf0d2'):
    p=img.load(); B,S,H=hx(base),hx(spk),hx(hi)
    for y in range(y0,y1):
        for x in range(x0,x1):
            r=random.random(); p[x,y]= S if r<0.07 else (H if r<0.11 else B)
def rect(img,x0,y0,x1,y1,c):
    p=img.load()
    for y in range(y0,y1):
        for x in range(x0,x1): p[x,y]=hx(c) if isinstance(c,str) else c

# ---- 1. Wood frame, parchment inside (main content panel). 32x32, slice 9
def wood_parch(size=32, sl=9, inner='parch'):
    im=Image.new('RGBA',(size,size),(0,0,0,0))
    rect(im,0,0,size,size,'#2a160c')                       # outline
    grain(im,1,1,size-1,size-1,hx('#8c5a30'),hx('#6e4220'),hx('#a87040'))
    rect(im,1,1,size-1,2,'#c08a52'); rect(im,1,1,2,size-1,'#b07a46')      # bevel light
    rect(im,1,size-2,size-1,size-1,'#4a2a14'); rect(im,size-2,1,size-1,size-1,'#5a3418')  # bevel dark
    rect(im,6,6,size-6,size-6,'#3a200e')                   # inner groove
    rect(im,7,7,size-7,size-7,'#c89a5c')
    if inner=='parch': parchment(im,8,8,size-8,size-8)
    else: grain(im,8,8,size-8,size-8,hx('#3c2616'),hx('#2e1c10'),hx('#4a3020'))
    for cx,cy in ((3,3),(size-5,3),(3,size-5),(size-5,size-5)):   # brass rivets
        rect(im,cx,cy,cx+2,cy+2,'#f2c45a'); rect(im,cx+1,cy+1,cx+2,cy+2,'#a8781e'); im.putpixel((cx,cy),hx('#fff0b0'))
    return im
OUT['panel']=save(wood_parch(),'panel')
OUT['dark']=save(wood_parch(inner='wood'),'dark')

# ---- 2. Parchment only, thin inked edge (sub-panels / stats). 18x18 slice 5
def parch_thin(size=18):
    im=Image.new('RGBA',(size,size),(0,0,0,0))
    rect(im,1,0,size-1,size,'#5a3a20'); rect(im,0,1,size,size-1,'#5a3a20')
    rect(im,1,1,size-1,size-1,'#c8a26a')
    parchment(im,2,2,size-2,size-2)
    rect(im,2,size-3,size-2,size-2,'#d8bc86')
    return im
OUT['paper']=save(parch_thin(),'paper')

# ---- 3. Buttons: wood plank, raised and pressed. 20x20 slice 6
def button(pressed=False, base='#9a6436', dark='#7a4a24', light='#b87a44', top='#d49a5a'):
    s=20; im=Image.new('RGBA',(s,s),(0,0,0,0))
    rect(im,1,0,s-1,s,'#2a160c'); rect(im,0,1,s,s-1,'#2a160c')
    grain(im,1,1,s-1,s-1,hx(base),hx(dark),hx(light))
    if not pressed:
        rect(im,1,1,s-1,3,top); rect(im,1,s-4,s-1,s-1,'#4e2c14'); rect(im,1,s-5,s-1,s-4,'#6a3c1c')
    else:
        rect(im,1,1,s-1,3,'#4e2c14'); rect(im,1,s-2,s-1,s-1,top)
    for cx in (3,s-5): rect(im,cx,8 if not pressed else 9,cx+2,10 if not pressed else 11,'#f2c45a')
    return im
OUT['btn']=save(button(),'btn'); OUT['btnDown']=save(button(True),'btnDown')
OUT['btnPrimary']=save(button(base='#3e6a2a',dark='#2e5220',light='#5a8a3a',top='#8cc05a'),'btnPrimary')
OUT['btnPrimaryDown']=save(button(True,base='#3e6a2a',dark='#2e5220',light='#5a8a3a',top='#8cc05a'),'btnPrimaryDown')

# ---- 4. Card frames per fruit: parchment face, metal rim in the fruit's color, corner studs. 24x24 slice 7
RIM={'Patience':('#f2c84a','#b88a18','#7a5a10'),'Gentleness':('#9cc86a','#5a8a3a','#3a5a22'),'Self-control':('#8ab8e0','#4a7aa8','#2a4a70'),
     'Peace':('#c8e0f0','#7aa6c8','#4a6a8a'),'Goodness':('#f09a6a','#c8502a','#7a2a14'),'Love':('#f0a0c0','#c85a8a','#7a2a50'),'Armor':('#d8dce4','#8a929e','#4a505a')}
def cardframe(hi,mid,lo):
    s=24; im=Image.new('RGBA',(s,s),(0,0,0,0))
    rect(im,0,0,s,s,'#1e120a')
    rect(im,1,1,s-1,s-1,mid); rect(im,1,1,s-1,2,hi); rect(im,1,1,2,s-1,hi); rect(im,1,s-2,s-1,s-1,lo); rect(im,s-2,1,s-1,s-1,lo)
    rect(im,4,4,s-4,s-4,lo)
    parchment(im,5,5,s-5,s-5,base='#f6e8c4',spk='#ecd9a8',hi='#fff6dc')
    for cx,cy in ((1,1),(s-4,1),(1,s-4),(s-4,s-4)):
        rect(im,cx,cy,cx+3,cy+3,'#1e120a'); rect(im,cx+1,cy+1,cx+2,cy+2,hi)
    return im
for k,(a,b,c) in RIM.items(): OUT['card_'+k]=save(cardframe(a,b,c),'card_'+k)

# ---- 5. Portrait frame (gold) and name plate (wood tab)
def pframe():
    s=18; im=Image.new('RGBA',(s,s),(0,0,0,0)); rect(im,0,0,s,s,'#2a160c')
    rect(im,1,1,s-1,s-1,'#e8b84a'); rect(im,1,1,s-1,2,'#fff0a0'); rect(im,1,s-2,s-1,s-1,'#8a6018'); rect(im,s-2,1,s-1,s-1,'#a87a20')
    rect(im,3,3,s-3,s-3,'#5a3a10'); grain(im,4,4,s-4,s-4,hx('#5a4a6a'),hx('#4a3a5a'),hx('#6a5a7a'))
    return im
OUT['portrait']=save(pframe(),'portrait')
def plate():
    s=16; im=Image.new('RGBA',(s,s),(0,0,0,0)); rect(im,1,0,s-1,s,'#2a160c'); rect(im,0,1,s,s-1,'#2a160c')
    grain(im,1,1,s-1,s-1,hx('#b07a44'),hx('#8c5a30'),hx('#c8925a')); rect(im,1,1,s-1,2,'#e0aa6a'); rect(im,1,s-2,s-1,s-1,'#5a3418')
    return im
OUT['plate']=save(plate(),'plate')

# ---- 6. Background tile: dark plank floor
def floor():
    w,hh=48,48; im=Image.new('RGBA',(w,hh)); p=im.load()
    for band in range(0,hh,12):
        base=hx(random.choice(['#3a2416','#352014','#3e2818']))
        grain(im,0,band,w,band+12,base,hx('#2a180c'),hx('#4a3020'))
        rect(im,0,band+11,w,band+12,'#1e1008')
        off=random.randint(4,40); rect(im,off,band,off+1,band+11,'#1e1008')
        rect(im,(off+24)%w,band+4,(off+24)%w+1,band+5,'#5a3a24')
    return im
OUT['floor']=save(floor(),'floor')
json.dump(OUT,open('ui.json','w'))
print({k:len(v) for k,v in OUT.items()}, sum(len(v) for v in OUT.values())//1024,'KB')

# preview sheet
prev=Image.new('RGBA',(520,200),(30,18,10,255))
x=4
for n in ['panel','dark','paper','btn','btnDown','btnPrimary','portrait','plate','card_Patience','card_Love','card_Peace']:
    im=Image.open(n+'.png'); im=im.resize((im.width*4,im.height*4),Image.NEAREST); prev.alpha_composite(im,(x,4)); x+=im.width+6
    if x>420: x=4
prev.save('preview.png')
