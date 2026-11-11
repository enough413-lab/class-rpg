import {createSeatRig} from './school-life-seat.js?v=20261111-sitting';
import {actionPose} from './school-life-action.js?v=20261111-actions';
import {createWalkRig,walkPose,walkPoint} from './school-life-walk.js?v=20261111-tools';
const SLOTS=['avatarHairBack','avatarBase','avatarShoes','avatarBottom','avatarTop','avatarEquipment','avatarHairFront','avatarHat','avatarAccessory'];
const DIRS={u:0,l:1,r:2},ROOT='./maps/life/avatar-v1/';
const readable=i=>i?.complete&&i.naturalWidth>0;
// Source-space foot centers measured from the unmodified body silhouettes.
const FEET={boy:{d:[547.5,1363,1122,1402],u:[278,960],l:[205.5,962],r:[268.5,961]},girl:{d:[596,1265,1229,1280],u:[278,961],l:[206,962],r:[270,962]}};
function name(src){try{return decodeURIComponent(new URL(src,location.href).pathname).split('/').pop();}catch{return '';}}
function selection(layers){
 for(const i of layers){const folder={avatarBase:'1. character',avatarHairBack:'2.hair',avatarHairFront:'2.hair',avatarTop:'3.top',avatarBottom:'4.bottom',avatarShoes:'7.shoes'}[i.id];try{const url=new URL(i.src,location.href);if(!folder||url.origin!==location.origin||!decodeURIComponent(url.pathname).endsWith('/'+folder+'/'+name(i.src)))return null;}catch{return null;}}
 const byId=Object.fromEntries(layers.map(i=>[i.id,name(i.src)])),gender=/^character_(boy|girl)\.png$/.exec(byId.avatarBase||'')?.[1];
 if(!gender)return null;
 const result={gender,body:gender+'-body',hair:null,shoes:null,bottom:null,top:null};
 for(const id of ['avatarEquipment','avatarHat','avatarAccessory'])if(byId[id])return null;
 for(const [id,slot]of [['avatarShoes','shoes'],['avatarBottom','bottom'],['avatarTop','top']]){
  if(!byId[id])continue;
  const match=new RegExp('^'+slot+'_'+gender+'_(basic|school|pajama|magic|hanbok)\\.png$').exec(byId[id]);
  if(!match||slot==='shoes'&&match[1]==='school')return null;
  result[slot]=gender+'-'+slot+'-'+match[1];
 }
 for(const id of ['avatarHairBack','avatarHairFront'])if(byId[id]){
  const match=new RegExp('^hair_'+gender+'_(default|hanbok)(?:_(back|front))?\\.png$').exec(byId[id]);
  if(!match||result.hair&&result.hair!==gender+'-'+match[1]+'-hair')return null;
  result.hair=gender+'-'+match[1]+'-hair';
 }
 return result;
}
export function createLifeAvatar(){
 let sources=[],chosen=null,images=null,sprites=null,status='empty',serial=0,key='',lastDirection='d',rigs={},seatRigs={},palms={},lastMotion=null;const cache=new Map();
 function load(n){if(!cache.has(n)){const p=new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('avatar image unavailable'));i.src=ROOT+n+'.webp';}).catch(e=>{cache.delete(n);throw e;});cache.set(n,p);}return cache.get(n);}
 function update(layers,owner=''){
  const next=owner+'|'+layers.map(i=>i.id+':'+i.src).join('|');if(next===key&&['ready','loading','unsupported'].includes(status))return;
  key=next;const ticket=++serial;sources=layers.slice();chosen=selection(sources);images=null;sprites=null;rigs={};seatRigs={};palms={};lastMotion=null;status=chosen?'loading':sources.length?'unsupported':'empty';
  if(!chosen)return;const names=[...new Set(Object.values(chosen).filter(n=>n&&n!==chosen.gender))];
  Promise.all(names.map(async n=>[n,await load(n)])).then(entries=>{if(ticket!==serial)return;images=Object.fromEntries(entries);const next={};for(const [d,col]of Object.entries(DIRS)){const c=document.createElement('canvas');c.width=256;c.height=320;const g=c.getContext('2d');g.scale(2,2);g.translate(64,145);compose(g,col);next[d]=c;const body=canvasImage(g=>compose(g,col,false)),hair=canvasImage(g=>paintHair(g,col));rigs[d]=createWalkRig(body,hair,d,chosen,canvasImage(g=>paintClothes(g,col)),null,canvasImage(g=>paintClothes(g,col,true)),canvasImage(g=>compose(g,col,false,true)));}sprites=next;images=null;for(const n of cache.keys())if(cache.size>12&&!names.includes(n))cache.delete(n);status='ready';}).catch(()=>{if(ticket===serial)status='error';});
 }
 function reset(){serial++;key='';sources=[];chosen=null;images=null;sprites=null;rigs={};seatRigs={};palms={};lastMotion=null;status='empty';}
 function frontGeometry(){const base=sources.find(i=>i.id==='avatarBase'),gender=/^character_(boy|girl)\.png$/.exec(name(base?.src||''))?.[1],foot=FEET[gender]?.d;return foot||[base?.naturalWidth/2||53,base?.naturalHeight||133,base?.naturalWidth||106,base?.naturalHeight||133];}
 function canvasImage(paint){const c=document.createElement('canvas');c.width=256;c.height=320;const g=c.getContext('2d');g.scale(2,2);g.translate(64,145);paint(g);return c;}
 function original(g,part='all'){const [x,y,w,h]=frontGeometry();for(const i of sources)if(readable(i)&&(part==='all'||(part==='hairFront'?i.id==='avatarHairFront':part==='hairBack'?i.id==='avatarHairBack':part==='clothes'?['avatarTop','avatarBottom'].includes(i.id):part==='bottom'?i.id==='avatarBottom':part==='feet'?['avatarBase','avatarShoes'].includes(i.id):!i.id.includes('Hair')))){const scale=133/i.naturalHeight;g.drawImage(i,-x/w*i.naturalWidth*scale,-y/h*133,i.naturalWidth*scale,133);}if(!sources.length){g.fillStyle='#ebc69f';g.fillRect(-12,-50,24,50);}}
 function ensureRig(direction){if(direction==='d'&&!rigs.d&&sources.every(readable))rigs.d=createWalkRig(canvasImage(g=>original(g,'body')),canvasImage(g=>original(g,'hairFront')),'d',chosen,canvasImage(g=>original(g,'clothes')),canvasImage(g=>original(g,'hairBack')),canvasImage(g=>original(g,'bottom')),canvasImage(g=>original(g,'feet')));}
 function draw(g,direction='d',motion=null){
  lastDirection=direction;if(Number.isFinite(motion?.seated)){if(status==='ready'){ensureRig(direction);if(rigs[direction]){lastMotion={seated:motion.seated};rigs[direction].drawSeat(g,motion.seated);return true;}}const d=status==='ready'?direction:'d';if(!seatRigs[d]){const source=d==='d'?canvasImage(g=>original(g)):sprites[d];if(source)seatRigs[d]=createSeatRig(source,d,chosen||{});}if(seatRigs[d]){lastMotion={seated:motion.seated};seatRigs[d].draw(g,motion.seated);return status==='ready';}}lastMotion=status==='ready'?(motion?.action?{action:{...motion.action},facing:motion.facing}:motion?.walking?{phase:motion.phase,carry:!!motion.carry}:null):null;
  if(lastMotion){ensureRig(direction);if(rigs[direction]){if(lastMotion.action)rigs[direction].drawAction(g,lastMotion.action,lastMotion.facing);else rigs[direction].draw(g,lastMotion.phase,lastMotion.carry);return true;}lastMotion=null;}if(direction==='d'||status!=='ready'){original(g);return false;}
  if(!sprites[direction]){original(g);return false;}g.drawImage(sprites[direction],-64,-145,128,160);return true;
 }
 function paintClothes(g,col,bottomOnly=false){const foot=FEET[chosen.gender][Object.keys(DIRS)[col]];g.save();g.translate(-foot[0]*.134,-foot[1]*.134);g.scale(.134,.134);for(const n of bottomOnly?[chosen.bottom]:[chosen.bottom,chosen.top])if(n)g.drawImage(images[n],col*512,0,512,1024,0,0,512,1024);g.restore();}
 function paintHair(g,col){if(!chosen.hair)return;const foot=FEET[chosen.gender][Object.keys(DIRS)[col]];g.save();g.translate(-foot[0]*.134,-foot[1]*.134);g.scale(.134,.134);g.drawImage(images[chosen.hair],col*512,0,512,1024,0,0,512,1024);g.restore();}
 function compose(g,col,showHair=true,feetOnly=false){
  const foot=FEET[chosen.gender][Object.keys(DIRS)[col]],body=images[chosen.body],hair=chosen.hair&&images[chosen.hair],part=n=>{if(n)g.drawImage(images[n],col*512,0,512,1024,0,0,512,1024);};
  g.save();g.translate(-foot[0]*.134,-foot[1]*.134);g.scale(.134,.134);
  // The hairstyle supplies the outer scalp; the body supplies the face, ears and nape.
  g.save();g.beginPath();g.rect(0,435,512,589);
  if(!hair)g.rect(0,0,512,435);
  else if(col===0){g.rect(70,280,90,120);g.rect(410,280,90,120);g.rect(218,405,100,40);}
  else {const points=[[76,195],[210,195],[245,270],[330,270],[330,392],[240,440],[76,440],[64,325],[70,250]];points.forEach(([x,y],i)=>{x=col===2?512-x:x;i?g.lineTo(x,y):g.moveTo(x,y);});g.closePath();}
  g.clip();g.drawImage(body,col*512,0,512,1024,0,0,512,1024);g.restore();
  part(chosen.shoes);if(!feetOnly){part(chosen.bottom);part(chosen.top);}
  if(col!==0){
   const short=!chosen.top||/-(basic|school|magic)$/.test(chosen.top),arm=short?[[222,568],[275,568],[270,630],[279,657],[278,681],[268,699],[222,701],[207,686],[202,667],[212,641],[219,624]]:[[213,657],[276,657],[278,681],[268,699],[222,701],[207,686],[202,667]];
   g.save();g.beginPath();arm.forEach(([x,y],i)=>{x=col===2?484-x:x;i?g.lineTo(x,y):g.moveTo(x,y);});g.closePath();g.clip();g.drawImage(body,col*512,0,512,1024,0,0,512,1024);g.restore();
  }
  if(hair&&showHair)g.drawImage(hair,col*512,0,512,1024,0,0,512,1024);
  g.restore();
 }
 function restingHand(direction,facing=1){
  const gender=chosen?.gender||/^character_(boy|girl)\.png$/.exec(name(sources.find(i=>i.id==='avatarBase')?.src||''))?.[1];
  if(status==='ready'&&direction!=='d')return direction==='r'?{x:-5,y:-39}:direction==='l'?{x:6.5,y:-39.5}:{x:-20.5,y:-39.5};
  if(gender==='boy')return facing>0?{x:-19,y:-39}:{x:21.5,y:-38.5};
  if(gender==='girl')return facing>0?{x:-20.5,y:-40}:{x:21,y:-40};
  const [x,y,w,h]=frontGeometry(),scale=133/h;return {x:((-22*facing+53)/106*w-x)*scale,y:86-y*scale};
 }
 function handPose(direction,facing,motion){
  if(status!=='ready')return null;
  if(motion?.action){const pose=actionPose(direction,motion.action,facing);return pose.arms[pose.working];}
  if(motion?.walking&&!motion.carry){const index=direction==='u'||direction==='d'?(facing>0?0:1):1;return walkPose(direction,motion.phase).arms[index];}
  return null;
 }
 function hand(direction,facing=1,motion=null){const p=restingHand(direction,facing),pose=handPose(direction,facing,motion);return pose?walkPoint(p,pose):p;}
 function drawGrip(g,direction,facing=1,motion=null){
  if(status!=='ready')return false;
  const key=direction+':'+(direction==='d'?Math.sign(facing):0),p=restingHand(direction,facing);
  if(!palms[key]){const source=direction==='d'?canvasImage(g=>original(g)):sprites[direction];if(!source)return false;const c=document.createElement('canvas');c.width=256;c.height=320;const cg=c.getContext('2d');cg.drawImage(source,0,0);const im=cg.getImageData(0,0,256,320),v=im.data,mask=new Uint8Array(256*320),cx=(p.x+64)*2,cy=(p.y+145)*2;
   for(let y=Math.floor(cy-8);y<=cy+8;y++)for(let x=Math.floor(cx-8);x<=cx+8;x++){if(x<1||x>254||y<1||y>318||((x-cx)/8)**2+((y-cy)/8)**2>1)continue;const i=(y*256+x)*4;if(v[i+3]>100&&v[i]>140&&v[i]-v[i+1]>16&&v[i+1]-v[i+2]>8)for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+1;xx++)mask[yy*256+xx]=1;}
   for(let i=0;i<mask.length;i++)if(!mask[i])v[i*4+3]=0;cg.putImageData(im,0,0);palms[key]=c;
  }
  const pose=handPose(direction,facing,motion);g.save();if(pose){g.translate(pose.x,pose.y);g.rotate(pose.angle);g.translate(-pose.pivot[0],-pose.pivot[1]);}g.drawImage(palms[key],-64,-145,128,160);g.restore();return true;
 }
 return {update,reset,draw,hand,drawGrip,snapshot:()=>({status,direction:lastDirection,motion:lastMotion&&{...lastMotion},selection:chosen&&{...chosen},sources:sources.map(i=>({slot:i.id,file:name(i.src)}))})};
}
export {SLOTS};
