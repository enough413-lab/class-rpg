const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const lerp=(a,b,p)=>a+(b-a)*p;
export function createSeatRig(source,direction,selection={}){
 // Bend only the lower body. The original torso, head and hair keep their scale.
 const side=direction==='l'||direction==='r',sign=direction==='l'?-1:1,skirt=selection.gender==='girl'&&/-(school|magic|hanbok)$/.test(selection.bottom||''),cache=new Map();
 const paint=(g,c)=>g.drawImage(c,-64,-145,128,160);
 const pixels=source.getContext('2d').getImageData(0,0,256,320).data,cells=[];
 for(let y=-42;y<16;y+=4)for(let x=-56;x<56;x+=4){const y2=Math.min(16,y+4);let visible=false;for(let py=(y+145)*2;py<Math.min(320,(y2+145)*2)&&!visible;py++)for(let px=(x+64)*2;px<(x+68)*2;px++)if(pixels[(py*256+px)*4+3]){visible=true;break;}if(visible)cells.push([[x,y],[x+4,y],[x+4,y2],[x,y2]]);}
 function render(amount){
  const c=document.createElement('canvas');c.width=256;c.height=320;const g=c.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.save();g.beginPath();g.rect(0,0,256,206);g.clip();g.drawImage(source,0,0);g.restore();
  const kneeBend=y=>y<-42||y>=-18?0:y<-34?ease((y+42)/8):y<-23?1:1-ease((y+23)/5);
  const centers=[];let cx=0,cy=-42;for(let y=-42;y<=16;y++){const bend=kneeBend(y),angle=side?-sign*amount*1.48*bend:0;centers.push({x:cx,y:cy,angle});if(y<16){const mid=y+.5,theta=side?-sign*amount*1.48*kneeBend(mid):0;cx-=Math.sin(theta);cy+=Math.cos(theta);}}
  const point=(x,y)=>{const row=centers[Math.round(y+42)],k=clamp((y+42)/33);if(!side)return [(64+x*(1+amount*.12*ease(k)))*2,(145+y-amount*12*ease(k))*2];const nx=skirt?x:x*Math.cos(row.angle),ny=skirt?0:x*Math.sin(row.angle);return [(64+row.x+nx)*2,(145+row.y+ny)*2];};
  const triangle=(src,dst)=>{const [a,b,c]=src,[A,B,C]=dst,det=a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1]);const fit=v=>[(v[0]*(b[1]-c[1])+v[1]*(c[1]-a[1])+v[2]*(a[1]-b[1]))/det,(v[0]*(c[0]-b[0])+v[1]*(a[0]-c[0])+v[2]*(b[0]-a[0]))/det,(v[0]*(b[0]*c[1]-c[0]*b[1])+v[1]*(c[0]*a[1]-a[0]*c[1])+v[2]*(a[0]*b[1]-b[0]*a[1]))/det],xx=fit([A[0],B[0],C[0]]),yy=fit([A[1],B[1],C[1]]),mx=(A[0]+B[0]+C[0])/3,my=(A[1]+B[1]+C[1])/3;g.save();g.beginPath();for(const[p,i]of dst.map((p,i)=>[p,i])){const dx=p[0]-mx,dy=p[1]-my,n=Math.hypot(dx,dy)||1,x=p[0]+dx/n*.35,y=p[1]+dy/n*.35;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.clip();g.setTransform(xx[0],yy[0],xx[1],yy[1],xx[2],yy[2]);g.drawImage(source,0,0);g.restore();};
  g.save();g.beginPath();g.rect(0,206,256,114);g.clip();for(const s of cells){const src=s.map(([x,y])=>[(x+64)*2,(y+145)*2]),dst=s.map(([x,y])=>point(x,y));triangle([src[0],src[1],src[2]],[dst[0],dst[1],dst[2]]);triangle([src[0],src[2],src[3]],[dst[0],dst[2],dst[3]]);}
  g.restore();return c;
 }
 function draw(g,amount){const key=Math.round(clamp(amount)*24);if(!key){paint(g,source);return {amount:0,direction};}if(!cache.has(key))cache.set(key,render(key/24));paint(g,cache.get(key));return {amount:key/24,direction};}
 return {draw};
}

export const SEATS={bench:{id:'bench',x:925,y:580,entry:{x:925,y:616}},library:{id:'library',x:1160,y:804,entry:{x:1160,y:832}}};
export function createSeating(){
 let current=null;
 function start(id,position,look,t,reduced=false){const target=SEATS[id];if(!target||current)return false;current={id,origin:{...position},originLook:look,target,phase:'enter',at:t,reduced};return true;}
 function view(t,reduced=false){if(!current)return null;if(reduced)current.reduced=true;const s=current,target=s.target;
  if(s.phase==='enter'){
   const p=s.reduced?1:clamp((t-s.at)/1100);if(p>=1){s.phase='rest';s.at=t;}
   const approach=ease(p/.4),sit=ease((p-.4)/.6);return {id:s.id,phase:s.phase,x:lerp(s.origin.x,target.entry.x,approach),y:lerp(lerp(s.origin.y,target.entry.y,approach),target.y,sit),look:p<.4?(target.entry.x<s.origin.x?'l':target.entry.x>s.origin.x?'r':'u'):'r',amount:sit,walking:p<.4,walkPhase:(t-s.at)/560};
  }
  if(s.phase==='leave'){
   const p=s.reduced?1:clamp((t-s.at)/900),stand=1-ease(p/.5),walk=ease((p-.5)/.5);if(p>=1){current=null;return null;}
   return {id:s.id,phase:'leave',x:lerp(target.x,s.origin.x,walk),y:lerp(lerp(target.y,target.entry.y,1-stand),s.origin.y,walk),look:p<.5?'r':s.origin.x<target.x?'l':s.origin.x>target.x?'r':'d',amount:stand,walking:p>.5,walkPhase:(t-s.at)/560};
  }
  return {id:s.id,phase:'rest',x:target.x,y:target.y,look:'r',amount:1,walking:false,walkPhase:0};
 }
 function stand(t,reduced=false){if(current?.phase!=='rest')return false;current.phase='leave';current.at=t;current.reduced=reduced;return true;}
 return {start,view,stand,cancel(){current=null;},active:()=>!!current,resting:()=>current?.phase==='rest',snapshot:()=>current?{id:current.id,phase:current.phase,origin:{...current.origin}}:null};
}
