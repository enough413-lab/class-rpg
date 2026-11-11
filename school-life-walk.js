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
 return {draw};
}



