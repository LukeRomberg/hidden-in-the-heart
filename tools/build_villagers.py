from PIL import Image
import colorsys, base64, io, json
im=Image.open('../assets/source/hero_starter_sheet.png').convert('RGBA')
frames=[im.crop((0,0,64,64)), im.crop((64,0,128,64))]
def hsv(c): return colorsys.rgb_to_hsv(*[k/255 for k in c[:3]])
def rgb(h,s,v): return tuple(int(max(0,min(1,k))*255) for k in colorsys.hsv_to_rgb(h%1,s,v))+(255,)
def kind(c,x,y):
    h,s,v=hsv(c)
    if v<0.13: return 'outline'
    if (h<=0.1 or h>0.95) and s>0.3 and v>=0.62 and y>=12: return 'skin'
    if (h<=0.07 or h>0.95) and s>0.5 and v<0.62 and y<=31: return 'hair'
    if 0.55<=h<=0.63 and s>0.45 and y>=44: return 'pants'
    if s<0.26 and 0.2<v<0.85 and 4<=y<=50: return 'top'
    if v>0.9 and s<0.05 and y>=58: return 'shoe'
    return 'other'
PEOPLE = [
 # name, sex, hair(h,s,vmul), skin(vmul,hshift), top hue/sat, pants (h,s,vmul) or None
 ('Tomas','m',(0.06,0.70,1.00),(1.00,0.00),(0.30,0.45),None),
 ('Abel','m',(0.00,0.10,0.55),(0.62,0.01),(0.02,0.55),(0.08,0.45,0.75)),
 ('Ezra','m',(0.11,0.55,1.55),(1.05,0.00),(0.58,0.50),(0.05,0.10,0.55)),
 ('Ruth','f',(0.02,0.80,1.30),(1.05,-0.01),(0.83,0.40),(0.83,0.30,0.70)),
 ('Mara','f',(0.00,0.15,0.50),(0.70,0.01),(0.12,0.65),(0.60,0.35,0.60)),
 ('Lydia','f',(0.10,0.50,1.65),(0.98,0.00),(0.47,0.45),(0.47,0.30,0.65)),
]
def make(frame, person):
    name,sex,hair,skin,top,pants=person
    src=frame.copy(); p=src.load(); W=64
    K=[[kind(p[x,y],x,y) if p[x,y][3] else None for x in range(W)] for y in range(W)]
    if sex=='f':
        # long hair: two thick locks framing the face, falling past the shoulders
        sk=[(x,y) for y in range(14,27) for x in range(20,45) if K[y][x]=='skin']
        fx0=min(x for x,y in sk if y<26); fx1=max(x for x,y in sk if y<26)
        hc=[p[x,y] for y in range(4,16) for x in range(W) if K[y][x]=='hair']
        hc.sort(key=lambda c:sum(c[:3])); light,mid,dark=hc[int(len(hc)*.8)],hc[len(hc)//2],hc[int(len(hc)*.2)]
        for side in (-1,1):
            edge = fx0 if side<0 else fx1
            for y in range(12,38):
                width = 4 if y<32 else 4-(y-32)//2
                for k in range(width):
                    x = edge + side*(1+k)
                    if K[y][x]=='skin': continue
                    col = dark if k==width-1 else (light if k==0 and y%4==1 else mid)
                    p[x,y]=col; K[y][x]='hair'
        for y in range(W):
            for x in range(W):
                if K[y][x]!='hair' and K[y][x]!='skin' and any(0<=x+dx<W and 0<=y+dy<W and K[y+dy][x+dx]=='hair' and y+dy>=18 for dx,dy in ((1,0),(-1,0),(0,-1))) and y>=18 and K[y][x] in (None,'top','other','outline'):
                    p[x,y]=(18,5,6,255); K[y][x]='outline'
    for y in range(W):
        for x in range(W):
            k=K[y][x]; c=p[x,y]
            if not k: continue
            h,s,v=hsv(c)
            if k=='hair': p[x,y]=rgb(hair[0], hair[1]*min(1,s/0.7) if hair[1]>0.3 else hair[1], v*hair[2])
            elif k=='skin': p[x,y]=rgb(h+skin[1], min(1,s*(1.15 if skin[0]<0.9 else 1)), v*skin[0])
            elif k=='top': p[x,y]=rgb(top[0], top[1], min(1,v*1.05))
            elif k=='pants' and pants: p[x,y]=rgb(pants[0], pants[1], v*pants[2])
    return src
out={}; prev=Image.new('RGBA',(64*6*3,64*2*3),(23,17,13,255))
for i,person in enumerate(PEOPLE):
    fr=[make(f,person) for f in frames]
    key='freed'+str(i); out[key]={'w':64,'h':64,'name':person[0],'f':[]}
    for j,f in enumerate(fr):
        b=io.BytesIO(); f.save(b,'PNG',optimize=True); out[key]['f'].append('data:image/png;base64,'+base64.b64encode(b.getvalue()).decode())
        prev.alpha_composite(f.resize((192,192),Image.NEAREST),(i*192,j*192))
prev.save('villagers.png'); json.dump(out,open('villagers.json','w'))
print(sum(len(x) for v in out.values() for x in v['f'])//1024,'KB')
