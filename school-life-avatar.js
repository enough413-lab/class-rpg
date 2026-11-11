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
 let sources=[],chosen=null,images=null,sprites=null,status='empty',serial=0,key='',lastDirection='d';const cache=new Map();
 function load(n){if(!cache.has(n)){const p=new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('avatar image unavailable'));i.src=ROOT+n+'.webp';}).catch(e=>{cache.delete(n);throw e;});cache.set(n,p);}return cache.get(n);}
 function update(layers,owner=''){
  const next=owner+'|'+layers.map(i=>i.id+':'+i.src).join('|');if(next===key&&['ready','loading','unsupported'].includes(status))return;
  key=next;const ticket=++serial;sources=layers.slice();chosen=selection(sources);images=null;sprites=null;status=chosen?'loading':sources.length?'unsupported':'empty';
  if(!chosen)return;const names=[...new Set(Object.values(chosen).filter(n=>n&&n!==chosen.gender))];
  Promise.all(names.map(async n=>[n,await load(n)])).then(entries=>{if(ticket!==serial)return;images=Object.fromEntries(entries);const next={};for(const [d,col]of Object.entries(DIRS)){const c=document.createElement('canvas');c.width=256;c.height=320;const g=c.getContext('2d');g.scale(2,2);g.translate(64,145);compose(g,col);next[d]=c;}sprites=next;images=null;for(const n of cache.keys())if(cache.size>12&&!names.includes(n))cache.delete(n);status='ready';}).catch(()=>{if(ticket===serial)status='error';});
 }
 function reset(){serial++;key='';sources=[];chosen=null;images=null;sprites=null;status='empty';}
 function frontGeometry(){const base=sources.find(i=>i.id==='avatarBase'),gender=/^character_(boy|girl)\.png$/.exec(name(base?.src||''))?.[1],foot=FEET[gender]?.d;return foot||[base?.naturalWidth/2||53,base?.naturalHeight||133,base?.naturalWidth||106,base?.naturalHeight||133];}
 function original(g){const [x,y,w,h]=frontGeometry();for(const i of sources)if(readable(i)){const scale=133/i.naturalHeight;g.drawImage(i,-x/w*i.naturalWidth*scale,-y/h*133,i.naturalWidth*scale,133);}if(!sources.length){g.fillStyle='#ebc69f';g.fillRect(-12,-50,24,50);}}
 function draw(g,direction='d'){
  lastDirection=direction;if(direction==='d'||status!=='ready'){original(g);return false;}
  if(!sprites[direction]){original(g);return false;}g.drawImage(sprites[direction],-64,-145,128,160);return true;
 }
 function compose(g,col){
  const foot=FEET[chosen.gender][Object.keys(DIRS)[col]],body=images[chosen.body],hair=chosen.hair&&images[chosen.hair],part=n=>{if(n)g.drawImage(images[n],col*512,0,512,1024,0,0,512,1024);};
  g.save();g.translate(-foot[0]*.134,-foot[1]*.134);g.scale(.134,.134);
  // The hairstyle supplies the outer scalp; the body supplies the face, ears and nape.
  g.save();g.beginPath();g.rect(0,435,512,589);
  if(!hair)g.rect(0,0,512,435);
  else if(col===0){g.rect(70,280,90,120);g.rect(410,280,90,120);g.rect(218,405,100,40);}
  else {const points=[[76,195],[210,195],[245,270],[330,270],[330,392],[240,440],[76,440],[64,325],[70,250]];points.forEach(([x,y],i)=>{x=col===2?512-x:x;i?g.lineTo(x,y):g.moveTo(x,y);});g.closePath();}
  g.clip();g.drawImage(body,col*512,0,512,1024,0,0,512,1024);g.restore();
  part(chosen.shoes);part(chosen.bottom);part(chosen.top);
  if(col!==0){
   const short=!chosen.top||/-(basic|school|magic)$/.test(chosen.top),arm=short?[[222,568],[275,568],[270,630],[279,657],[278,681],[268,699],[222,701],[207,686],[202,667],[212,641],[219,624]]:[[213,657],[276,657],[278,681],[268,699],[222,701],[207,686],[202,667]];
   g.save();g.beginPath();arm.forEach(([x,y],i)=>{x=col===2?484-x:x;i?g.lineTo(x,y):g.moveTo(x,y);});g.closePath();g.clip();g.drawImage(body,col*512,0,512,1024,0,0,512,1024);g.restore();
  }
  if(hair)g.drawImage(hair,col*512,0,512,1024,0,0,512,1024);
  g.restore();
 }
 function hand(direction,facing=1){if(status!=='ready'||direction==='d'){const [x,y,w,h]=frontGeometry(),scale=133/h;return {x:((-22*facing+53)/106*w-x)*scale,y:86-y*scale};}const col=DIRS[direction],foot=FEET[chosen.gender][direction],old=direction==='u'?{x:-22,y:-32}:direction==='l'?{x:3.5,y:-35}:{x:-4,y:-35};return {x:old.x+([278,228,256][col]-foot[0])*.134,y:old.y+125-foot[1]*.134};}
 return {update,reset,draw,hand,snapshot:()=>({status,direction:lastDirection,selection:chosen&&{...chosen},sources:sources.map(i=>({slot:i.id,file:name(i.src)}))})};
}
export {SLOTS};
