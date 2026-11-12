const ROW={surprise:0,sad:1,joy:2},COL={d:0,l:1,r:2};
const FEET={boy:{d:[547.5,1363,133/1402],l:[205.5,962,.134],r:[268.5,961,.134]},girl:{d:[596,1265,133/1280],l:[206,962,.134],r:[270,962,.134]}};
const FRONT={boy:[[333,327,153,230],[580,327,178,230],[494,557,94,57]],girl:[[342,278,169,228],[611,278,192,228],[515,506,86,54]]};
const EYES={boy:{d:[[94,145,99,163],[246,145,94,163]],l:[[488,145,94,163]],r:[[1074,145,94,163]]},girl:{d:[[90,142,108,164],[248,142,108,164]],l:[[506,138,91,166]],r:[[1063,138,102,166]]}};
const MOUTHS={boy:{d:[[195,309,48,47],[194,720,50,33],[187,1130,64,48]],l:[[482,310,28,42],[479,721,30,28],[478,1132,34,46]],r:[[1145,310,28,42],[1145,720,32,29],[1144,1132,34,46]]},girl:{d:[[201,311,40,43],[199,734,45,27],[190,1146,62,46]],l:[[493,308,27,38],[494,730,28,28],[494,1140,34,48]],r:[[1146,308,28,38],[1147,730,28,28],[1143,1140,35,48]]}};
const cache=new Map();
function canvas(){const c=document.createElement('canvas');c.width=256;c.height=320;return c;}
function patch(source,src,dest){
 const c=canvas(),g=c.getContext('2d'),[x,y,w,h]=dest,px=(x+64)*2,py=(y+145)*2,pw=w*2,ph=h*2;
 g.drawImage(source,...src,px,py,pw,ph);
 // A one-pixel soft rim joins the existing skin; the eyes and mouth stay opaque.
 g.globalCompositeOperation='destination-in';const mask=canvas(),m=mask.getContext('2d'),edge=2;
 m.fillStyle='#fff';m.fillRect(px+edge,py+edge,pw-edge*2,ph-edge*2);
 for(const[a,b,cx,cy,bx,by,bw,bh]of [[px,py,px+edge,py,px,py+edge,edge,ph-edge*2],[px+pw,py,px+pw-edge,py,px+pw-edge,py+edge,edge,ph-edge*2],[px,py,px,py+edge,px+edge,py,pw-edge*2,edge],[px,py+ph,px,py+ph-edge,px+edge,py+ph-edge,pw-edge*2,edge]]){const gradient=m.createLinearGradient(a,b,cx,cy);gradient.addColorStop(0,'#fff0');gradient.addColorStop(1,'#fff');m.fillStyle=gradient;m.fillRect(bx,by,bw,bh);}
 g.drawImage(mask,0,0);return c;
}
function make(source,gender,direction,kind){
 const row=ROW[kind],foot=FEET[gender][direction],eyeSources=EYES[gender][direction].map(a=>[a[0],a[1]+row*418,a[2],a[3]]);
 const targets=direction==='d'?FRONT[gender]:direction==='l'?[[106,200,105,166],[94,366,44,38]]:[[269,200,112,166],[353,366,49,38]];
 const sources=[...eyeSources,MOUTHS[gender][direction][row]],result=canvas(),g=result.getContext('2d');
 for(let i=0;i<sources.length;i++){const[x,y,w,h]=targets[i],scale=foot[2];g.drawImage(patch(source,sources[i],[(x-foot[0])*scale,(y-foot[1])*scale,w*scale,h*scale]),0,0);}
 return result;
}
export function loadExpressions(gender){
 if(!FEET[gender])return Promise.resolve(null);
 if(!cache.has(gender)){const p=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{const faces={};for(const direction of Object.keys(COL))for(const kind of Object.keys(ROW))faces[direction+':'+kind]=make(image,gender,direction,kind);resolve(faces);};image.onerror=()=>reject(Error('expression image unavailable'));image.src='./maps/life/'+gender+'-expressions-v1.webp';}).catch(e=>{cache.delete(gender);throw e;});cache.set(gender,p);}
 return cache.get(gender);
}
export function reactionFrame(kind,phase,reduced=false){
 const p=Math.max(0,Math.min(1,phase)),fade=Math.min(1,p/.12,(1-p)/.18),wave=Math.sin(p*Math.PI);
 return {kind,phase:p,dy:reduced?0:kind==='sad'?2*wave:kind==='surprise'?-3*Math.sin(Math.min(1,p/.6)*Math.PI):-4*Math.abs(Math.sin(p*Math.PI*2))*fade,angle:reduced?0:kind==='sad'?.045*wave:kind==='surprise'?-.035*wave:.025*Math.sin(p*Math.PI*2)*fade};
}
export function createReaction(){
 let pending=null,current=null;
 const clear=()=>{pending=null;current=null;};
 return {clear,schedule(kind,now,delay=0){clear();if(Object.hasOwn(ROW,kind))pending={kind,at:now+delay,expires:now+delay+1200};},
  sample(now,{active=true,ready=true,reduced=false}={}){
   if(!active){clear();return null;}
   if(pending){if(now>pending.expires)pending=null;else if(ready&&now>=pending.at){current={kind:pending.kind,at:now};pending=null;}}
   if(!current)return null;const phase=(now-current.at)/850;if(phase>=1){current=null;return null;}return reactionFrame(current.kind,phase,reduced);
  },snapshot:()=>({pending:pending&&{...pending},current:current&&{...current}})};
}
