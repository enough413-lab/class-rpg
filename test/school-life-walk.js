import {createSeatRig} from './school-life-seat.js?v=20261111-sitting';
import {actionPose} from './school-life-action.js?v=20261111-actions';
const TAU=Math.PI*2;
function canvas(){const c=document.createElement('canvas');c.width=256;c.height=320;return c;}
function context(c){const g=c.getContext('2d');g.scale(2,2);g.translate(64,145);return g;}
function polygon(g,points){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();}
const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const mirror=p=>p.map(([x,y])=>[-x,y]);
const paint=(g,c)=>g.drawImage(c,-64,-145,128,160);
function cut(source,points){const c=canvas(),g=context(c);polygon(g,points);g.clip();paint(g,source);return c;}
function erase(g,points){g.save();g.globalCompositeOperation='destination-out';polygon(g,points);g.fill();g.restore();}
function transform(g,pose){g.translate(pose.x,pose.y);g.rotate(pose.angle);g.translate(-pose.pivot[0],-pose.pivot[1]);}
function limb(pivot,angle,lift=0){return {pivot,angle,x:pivot[0],y:pivot[1]-lift};}
export function walkPose(direction,phase,carry=false){
 const wave=Math.sin(phase*TAU),side=direction==='l'||direction==='r',sign=direction==='r'?-1:1;
 const legs=[-1,1].map(n=>limb([side?0:n*9,-35],side?n*wave*.31:n*wave*.055,Math.max(0,n*wave)*(side?1.5:3.3)));
 const arms=[-1,1].map(n=>limb([side?6*sign:n*12,-66],carry?0:side?-n*wave*.27:wave*.07,carry||side?0:-n*wave*1.6));
 return {legs,arms,phase,walking:true};
}
export function walkPoint(point,pose){const x=point.x-pose.pivot[0],y=point.y-pose.pivot[1],c=Math.cos(pose.angle),s=Math.sin(pose.angle);return {x:pose.x+x*c-y*s,y:pose.y+x*s+y*c};}
export function createWalkRig(body,hair,direction,selection,clothes,backHair=null,bottom=null,feetSource=null){
 const side=direction==='l'||direction==='r',sign=direction==='r'?-1:1;
 const skirt=selection.gender==='girl'&&/-(school|magic|hanbok)$/.test(selection.bottom||''),longSkirt=skirt&&selection.bottom.endsWith('-hanbok');
 const hem=skirt?-30:!selection.bottom?-36:/-(pajama|hanbok)$/.test(selection.bottom||'')?-38:-30;
 let arm=side?[[1,-69],[11,-69],[12,-37],[9,-33],[-1,-33],[-2,-38],[1,-53]]:[[-64,-71],[-13,-71],[-10,-62],[-12,-49],[-13,-39],[-12,-30],[-64,-31]];
 if(side&&sign<0)arm=mirror(arm);
 const armMasks=side?[arm,arm]:[arm,mirror(arm)],legMasks=side?[rect(-28,hem,56,50),rect(-28,hem,56,50)]:[rect(-38,hem,38,50),rect(0,hem,38,50)];
 const arms=armMasks.map(mask=>cut(body,mask)),legs=legMasks.map(mask=>cut(skirt?feetSource:body,mask)),torso=canvas(),g=context(torso);paint(g,body);
 for(const mask of [...armMasks,...legMasks])erase(g,mask);
 // Restore only the torso texture hidden by the resting arm and the hip
 // overlap. The source garment remains unchanged, including its pattern.
 g.save();polygon(g,side?rect(sign>0?-3:-14,-65,17,35):rect(-14,-69,28,39));g.clip();if(!selection.top){if(side){g.fillStyle='#f1f0ed';g.fillRect(sign>0?0:-11,-64,11,20);g.fillStyle='#b7b8ba';g.fillRect(sign>0?-1:-11,-44,12,11);}else paint(g,body);}paint(g,clothes);g.restore();
 g.save();polygon(g,rect(-44,skirt?-44:hem-5,88,skirt?56:7));g.clip();if(!selection.bottom){polygon(g,rect(-15,-39,30,12));g.clip();paint(g,body);}else paint(g,skirt?bottom:clothes);g.restore();
 const caps=(side?[6*sign]:[-12,12]).map(x=>cut(body,rect(x-3,-68,6,8)));for(const cap of caps)paint(g,cap);
 if(!selection.top&&!side){
  // A bare hand overlaps the original shorts at rest. Keep the gray cloth
  // while removing that hidden hand from the stationary torso layer.
  const image=g.getImageData(0,0,256,320),pixels=image.data,clear=[];
  for(let y=200;y<228;y++)for(let x=0;x<256;x++){const wx=x/2-64;if(Math.abs(wx)<12||Math.abs(wx)>30)continue;const i=(y*256+x)*4;if(pixels[i+3]>100&&pixels[i]>135&&pixels[i]-pixels[i+1]>15&&pixels[i+1]-pixels[i+2]>8)clear.push([x,y]);}
  for(const[x,y]of clear)for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+1;xx++)if(xx>=0&&xx<256&&yy>=0&&yy<320)pixels[(yy*256+xx)*4+3]=0;
  g.putImageData(image,0,0);
 }
 const soles=legs.map(c=>{const pixels=c.getContext('2d').getImageData(0,0,256,320).data,points=[];for(let x=0;x<256;x++){for(let y=319;y>254;y--)if(pixels[(y*256+x)*4+3]>100){points.push({x:(x+.5)/2-64,y:(y+1)/2-145});break;}}return points;});
 function draw(g,phase,carry=false){const pose=walkPose(direction,phase,carry);if(backHair)paint(g,backHair);
  for(let i=0;i<2;i++){const sole=soles[i];if(!sole.length)continue;const lowest=Math.max(...sole.map(p=>walkPoint(p,pose.legs[i]).y)),lift=Math.max(0,(i?1:-1)*Math.sin(phase*TAU))*3.3;pose.legs[i].y-=lowest+lift;}
  const part=(img,p)=>{g.save();transform(g,p);paint(g,img);g.restore();};
  if(side){g.save();g.globalAlpha=.9;part(legs[0],pose.legs[0]);part(arms[0],pose.arms[0]);g.restore();}
  if(!side)part(legs[0],pose.legs[0]);part(legs[1],pose.legs[1]);paint(g,torso);
  if(!side)part(arms[0],pose.arms[0]);part(arms[1],pose.arms[1]);paint(g,hair);return pose;
 }
 // A resting hand overlaps shorts/skirt edges. Those garment pixels belong
 // to the stationary body, not to the raised arm.
 const tail=side?rect(sign>0?-3:-22,-45,25,19):rect(-32,-45,20,19),tails=side?[tail]:[tail,mirror(tail)];
 const actionTorso=canvas(),at=context(actionTorso);paint(at,body);for(const mask of [...armMasks,...tails])erase(at,mask);
 at.save();polygon(at,side?rect(sign>0?-3:-14,-65,17,23):rect(-14,-69,28,27));at.clip();paint(at,torso);at.restore();
 if(selection.bottom){at.save();polygon(at,rect(-44,-45,88,22));at.clip();paint(at,bottom);at.restore();}
 else{
  const pixels=body.getContext('2d').getImageData(0,0,256,320).data,rows=[];for(let y=190;y<260;y++){let count=0;for(let x=96;x<160;x++){const i=(y*256+x)*4;if(pixels[i+3]>128&&pixels[i]>80&&pixels[i]<205&&Math.max(pixels[i],pixels[i+1],pixels[i+2])-Math.min(pixels[i],pixels[i+1],pixels[i+2])<18)count++;}rows.push({y,count});}
  const groups=[];for(const row of rows){if(row.count<8)continue;let group=groups.at(-1);if(!group||group.at(-1)!==row.y-1){group=[];groups.push(group);}group.push(row.y);}const band=groups.sort((a,b)=>b.length-a.length)[0]||[],points=[];
  for(const y of band)for(let x=80;x<176;x++){const i=(y*256+x)*4;if(pixels[i+3]>128&&pixels[i]>80&&pixels[i]<205&&Math.max(pixels[i],pixels[i+1],pixels[i+2])-Math.min(pixels[i],pixels[i+1],pixels[i+2])<18)points.push([x/2-64,y/2-145]);}
  points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),half=ps=>{const h=[];for(const p of ps){while(h.length>1&&cross(h.at(-2),h.at(-1),p)<=0)h.pop();h.push(p);}return h;},hull=half(points).slice(0,-1).concat(half(points.slice().reverse()).slice(0,-1));
  if(hull.length>2)for(const mask of tails){at.save();polygon(at,mask);at.clip();polygon(at,hull);at.fillStyle='#b7b8ba';at.fill();at.strokeStyle='#796e69';at.lineWidth=.7;at.stroke();at.restore();}
 }
 {const cx=actionTorso.getContext('2d'),data=cx.getImageData(0,0,256,320),p=data.data;
  if(selection.bottom){const base=feetSource.getContext('2d').getImageData(0,0,256,320).data,cloth=bottom.getContext('2d').getImageData(0,0,256,320).data,skin=(a,i)=>a[i+3]>100&&a[i]>140&&a[i]-a[i+1]>14&&a[i+1]-a[i+2]>8,mask=new Uint8Array(256*320);
   for(let y=206;y<244;y++)for(let x=80;x<176;x++){const i=(y*256+x)*4;if(skin(p,i)&&skin(base,i))for(let yy=y-2;yy<=y+2;yy++)for(let xx=x-2;xx<=x+2;xx++)mask[yy*256+xx]=1;}
   for(let y=204;y<246;y++)for(let x=78;x<178;x++)if(mask[y*256+x]){const i=(y*256+x)*4;let source=-1;for(let step=0;step<32;step++){const xx=x+(x>128?-step:step),j=(y*256+xx)*4;if(cloth[j+3]>180&&!skin(cloth,j)&&Math.max(cloth[j],cloth[j+1],cloth[j+2])>85){source=j;break;}}if(source<0)p[i+3]=0;else for(let k=0;k<4;k++)p[i+k]=cloth[source+k];}
  }
  const seen=new Uint8Array(256*320);for(let k=0;k<seen.length;k++){if(seen[k]||!p[k*4+3])continue;const stack=[k],group=[];seen[k]=1;while(stack.length){const j=stack.pop();group.push(j);const x=j%256,y=Math.floor(j/256);for(const n of [x?j-1:-1,x<255?j+1:-1,y?j-256:-1,y<319?j+256:-1])if(n>=0&&!seen[n]&&p[n*4+3]){seen[n]=1;stack.push(n);}}if(group.length<128)for(const j of group)p[j*4+3]=0;}cx.putImageData(data,0,0);}
 // The hand-removal mask must not remove the original thighs below it.
 at.save();polygon(at,rect(-64,-31,128,50));at.clip();paint(at,body);at.restore();
 const actionArms=arms.map(source=>{const c=canvas(),cx=c.getContext('2d');cx.drawImage(source,0,0);const data=cx.getImageData(0,0,256,320),p=data.data,b=bottom?.getContext('2d').getImageData(0,0,256,320).data;
  for(let y=206;y<240;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4;if(!p[i+3])continue;const same=b&&b[i+3]>100&&[0,1,2].every(k=>Math.abs(p[i+k]-b[i+k])<4);const gray=!selection.bottom&&Math.max(p[i],p[i+1],p[i+2])-Math.min(p[i],p[i+1],p[i+2])<13;if(same||gray)p[i+3]=0;}
  if(!selection.bottom){const skin=new Uint8Array(256*320);let lastSkin=200;for(let y=200;y<244;y++){let count=0;for(let x=0;x<256;x++){const i=(y*256+x)*4;if(p[i+3]>100&&p[i]>140&&p[i]-p[i+1]>14&&p[i+1]-p[i+2]>8){count++;for(let yy=y-3;yy<=y+3;yy++)for(let xx=Math.max(0,x-3);xx<=Math.min(255,x+3);xx++)skin[yy*256+xx]=1;}}if(count>=3)lastSkin=y;}for(let y=206;y<244;y++)for(let x=0;x<256;x++)if(!skin[y*256+x]||y>lastSkin+2)p[(y*256+x)*4+3]=0;}
  const seen=new Uint8Array(256*320);for(let k=0;k<seen.length;k++){if(seen[k]||!p[k*4+3])continue;const stack=[k],group=[];seen[k]=1;while(stack.length){const j=stack.pop();group.push(j);const x=j%256,y=Math.floor(j/256);for(const n of [x?j-1:-1,x<255?j+1:-1,y?j-256:-1,y<319?j+256:-1])if(n>=0&&!seen[n]&&p[n*4+3]){seen[n]=1;stack.push(n);}}if(group.length<32)for(const j of group)p[j*4+3]=0;}
  cx.putImageData(data,0,0);return c;
 });
 function drawAction(g,frame,facing){const pose=actionPose(direction,frame,facing);
  if(backHair)paint(g,backHair);
  paint(g,actionTorso);
  for(const i of side?[1]:[0,1]){g.save();transform(g,pose.arms[i]);paint(g,actionArms[i]);g.restore();}
  paint(g,hair);return pose;
 }
 let seatRig=null;function drawSeat(g,amount){if(!seatRig)seatRig=createSeatRig(actionTorso,direction,selection);if(backHair)paint(g,backHair);seatRig.draw(g,amount);for(const i of side?[1]:[0,1])paint(g,actionArms[i]);paint(g,hair);}
 return {draw,drawAction,drawSeat};
}



