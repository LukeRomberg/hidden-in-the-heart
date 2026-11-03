/* Small hand-drawn pixel sprites and icons (one char per pixel, keys into PAL). */
const PAL = {k:'--px-k',r:'--px-r',o:'--px-o',y:'--px-y',w:'--px-w',b:'--px-b',g:'--px-g',p:'--px-p',d:'--px-d',s:'--px-s',h:'--px-h',j:'--px-j',1:'--px-1',2:'--px-2',3:'--px-3',4:'--px-4',5:'--px-5',6:'--px-6',S:'--px-S',D:'--px-D',W:'--px-W',A:'--px-A',B:'--px-B',C:'--px-C'};
const SPR = {
  hothead:[[
    "....rr....","...rror...","..rroorr..",".krrrrrrk.","krrkrrkrrk","krrrrrrrrk","krrkkkkrrk",".krrrrrrk.","..krrrrk..","..krkkrk..",".kk....kk.",".........."],[
    "...rror...","..rroorr..",".rroyyorr.",".krrrrrrk.","krrkrrkrrk","krrrrrrrrk","krkkrrkkrk",".krrrrrrk.","..krrrrk..","..krkkrk..","..k....k..",".kk....kk."]],
  grudge:[[
    "..........","...kkkk...","..kppppk..",".kppkppkk.",".kpppppkpk",".kkppppkpk","..kpppkpk.",".kpppppk..",".kppppppk.",".kpkppkpk.",".kk.kk.kk.",".........."],[
    "..........","...kkkk...","..kppppk..",".kppkppkk.","kkpppppkk.","kppppppppk","kkppppppkk",".kpppppk..",".kppppppk.",".kpkppkpk.",".kk.kk.kk.",".........."]],
  brawler:[[
    "...kkkk...","..kssssk..","..kskssk..","..ksssskk.",".kkddddkk.","kddddddddk","kdkddddkdk","ksk.dd.ksk",".k.kddk.k.","...kddk...","..kddkddk.","..kkk.kkk."],[
    "...kkkk...","..kssssk..","..kskssk..","..ksssskk.",".kkddddkk.","kddddddddk","kdkddddkdk","ksk.dd.kdk",".k.kddk.ks","...kddk.kk","..kddkddk.","..kkk.kkk."]],
  slanderer:[[
    "...kkkk...","..kppppk..",".kppppppk.",".kpkkkkpk.",".kpkykykk.",".kpkkkkpk.",".kkppppkk.",".kppppppk.","kpkppppkpk","kpk.pp.kpk",".k.kppk.k.","...kkkk..."],[
    "...kkkk...","..kppppk..",".kppppppk.",".kpkkkkpk.",".kpyykyykk",".kpkkkkpk.","kkkppppkkk","kpkppppkpk","kpk.pp.kpk",".k.kppk.k.","...kppk...","...kkkk..."]],
  furnace:[[
    "..r...rr...r..","..rr.rrrr.rr..","..rrrooorrrr..","...rroyyorr...","..krrrrrrrrk..",".krrkkrrkkrrk.",".krryyrryyrrk.",".krrkkrrkkrrk.","krrrrrrrrrrrrk","krrkkkkkkkkrrk","krrkoooooookrk",".krrkkkkkkrrk.",".kkrrrrrrrrkk.","..krrkrrkrrk..","..kk.krrk.kk..",".....kkkk....."],[
    ".r..r.rr.r..r.",".rr.rrrrrr.rr.","..rroyyyyorr..","..rroyyyyorr..","..krrrrrrrrk..",".krrkkrrkkrrk.",".krryyrryyrrk.",".krrkkrrkkrrk.","krrrrrrrrrrrrk","krrkoooooookrk","krrkyyyyyyykrk",".krrkkkkkkrrk.","kkkrrrrrrrrkkk","krkrrkrrkrrkrk","kk.kk.krk.kk.k",".....kkkk....."]],
};
const ICON = {
  fight:["..kkkk..",".kwwwwk.","kwwwwwwk","kwkwwkwk","kwwwwwwk",".kwkkwk.","..kwwk..","..kkkk.."],
  elite:["........","y..y..y.","yy.yy.yy","yyyyyyyy","yyyyyyyy","kyyyyyyk","kkkkkkkk","........"],
  shrine:["...yy...","..yyyy..","...yy...","...yy...","...yy...",".kkkkkk.","kwwwwwwk","kkkkkkkk"],
  lock:["..kkkk..",".kk..kk.",".k....k.","kyyyyyyk","kyyyyyyk","kyykkyyk","kyyyyyyk","kkkkkkkk"],
  rest:["...r....","..ror...",".rroyr..",".royyr..","..ryr...","kdkkkkdk",".kddddk.","..kkkk.."],
  forge:["........","........",".kkkkkk.","kwwwwwwk",".kkwwkk.","..kwwk..",".kwwwwk.","kkkkkkkk"],
  boss:["...r....","..rr.r..",".rrorr..",".rroor..","rroyyor.","rroyyorr",".rrorrr.","..rrrr.."],
  torch:[["..r.","..o.",".yy.",".kk.",".kk."],["..r.",".ro.",".oy.",".kk.",".kk."]],
};
const LOCK = ["..kkkk..",".kk..kk.",".k....k.","kyyyyyyk","kyykkyyk","kyykkyyk","kyyyyyyk","kkkkkkkk"];
const ICONS = {
  heart:["..........",".rr...rr..","roorrroorr","rooooooorr","roooooooor",".rooooooor.","..rooooor.","...rooor..","....ror...",".....r...."],
  mana:["....b.....","...bb.....","...bwb....","..bbbbb...","..bwbbbb..",".bbbbbbbb.",".bwbbbbbb.",".bbbbbbbb.","..bbbbbb..","...bbbb..."],
  soul:["....y.....","...yy.....","...yoy....","..yooy....","..yoooy...",".yooroy...",".yorrroy..",".yorrroy..","..yooooy..","...yyyy..."],
  coin:["...kkkk...","..kyyyyk..",".kyywwyyk.",".kywyyyyk.",".kyyyyyyk.",".kyyyyyyk.",".kyyyyyyk.","..kyyyyk..","...kkkk...",".........."],
  town:["....k.....","...kyk....","..kyyyk...",".kyyyyyk..","kkkkkkkkk.",".kwwkwwk..",".kwwkwwk..",".kkk.kkk..",".kk...kk..",".kkkkkkk.."],
  church:["....y.....","...yyy....","....y.....","...kkk....","..kwwwk...",".kwwwwwk..",".kwwkwwk..",".kwwkwwk..",".kwkkkwk..",".kkkkkkk.."],
  gear:["..kkkkk...",".kwwwwwk..",".kwwywwk..",".kwyyywk..",".kwwywwk..",".kwwwwwk..","..kwwwk...","...kwk....","....k.....",".........."],
  tree:["...ggg....","..ggggg...",".ggrgggg..",".gggggrg..","..ggggg...","....d.....","....d.....","....d.....","...ddd....",".........."],
  deck:[".kkkkk....",".kwwwkk...",".kwkwkwk..",".kwwwkwk..",".kwkwkwk..",".kwwwkwk..",".kkkkkwk..","..kwwwwk..","..kkkkkk..",".........."],
};
const PRIEST = ["....kkkk....","...kwwwwk...","..kwwwwwwk..","..kssssssk..","..ksksskssk.","..kssssssk..","..kwwsswwk..","...kwwwwk...","..kddddddk..",".kddddyddddk",".kdddyyydddk",".kddddyddddk"];
