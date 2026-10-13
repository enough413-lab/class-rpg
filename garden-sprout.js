// Personal leaf care in the walking world. Never changes the observation letter.
const CLOTH='<svg viewBox="0 0 64 48" aria-hidden="true"><path d="m8 9 37-6 14 30-39 12Z" fill="#a4c8c0" stroke="#56796e" stroke-width="2.5"/><path d="m8 9 12 36 7-17L45 3" fill="#dbe4bf" stroke="#6b8c78" stroke-width="2"/><path d="m27 28 32 5M16 14l5 15m15-13 12 15" fill="none" stroke="#edf0d6" stroke-width="2"/></svg>';
export function installGardenSprout(c){
 const doc=c.hub.ownerDocument,player=doc.getElementById('hubPlayer'),help=doc.createElement('div');help.className='sprout-help';help.hidden=true;
 const status=doc.createElement('span');status.setAttribute('role','status');help.append(status);
 const letter=doc.createElement('button');letter.type='button';letter.dataset.guide='letter-garden';letter.textContent='관찰 편지 · Lv.19';help.append(letter);c.hub.querySelector('.hub-help').append(help);
 let owner=null,clean=false,message='',storageOk=true,run=null,drag=null,suppressClick=false;
 const key=id=>'classRpgSproutCare_v1_'+id,here=()=>c.getScene()==='garden'&&!c.hub.classList.contains('hidden');
 function handPoint(rect){const r=player.getBoundingClientRect(),left=c.getPosition().x<=27;return{x:r.x+r.width*(left?.68:.32)-rect.left,y:r.y+r.height*.66-rect.top}}
 function handlePose(hand,rect,x,y){const dx=x*rect.width/100-hand.x,dy=y*rect.height/100-hand.y;return{width:Math.hypot(dx,dy)+'px',rotate:Math.atan2(dy,dx)*180/Math.PI+'deg'}}
 function placeHandle(prop,rect,hand,x,y){const handle=prop.querySelector('.sprout-handle');handle.style.left=hand.x+'px';handle.style.top=hand.y+'px';Object.assign(handle.style,handlePose(hand,rect,x,y))}
 function cancel(){
  const old=run;run=null;old?.animations.forEach(a=>a.cancel());old?.prop.classList.remove('sprout-wiping');
  const d=drag;drag=null;if(d){suppressClick=true;d.prop.classList.remove('sprout-wiping');d.prop.style.removeProperty('--wipe-x');d.prop.style.removeProperty('--wipe-y');if(d.prop.hasPointerCapture(d.id))d.prop.releasePointerCapture(d.id)}
  if(old||d)message='먼지솔을 내려놓았어요. 다시 닦아도 좋아요.';
 }
 function activate(){const id=c.getStudent()?.id;if(id===owner)return;cancel();owner=id;clean=false;message='';storageOk=true;try{const s=JSON.parse(localStorage.getItem(key(id))||'null');clean=s?.v===1&&s.clean===true}catch{storageOk=false}}
 function save(){if(owner==null)return;try{localStorage.setItem(key(owner),JSON.stringify({v:1,clean:true}));storageOk=true}catch{storageOk=false}}
 function label(kind){activate();return c.getScene()==='garden'&&kind==='look-0'?(run||drag?'잎 닦는 중…':clean?'잎 살며시 닦기':'잎 닦기'):null}
 function valid(at,id=owner){return here()&&owner===id&&Math.abs(c.getPosition().x-at)<.2&&!player.hasAttribute('data-jumping')}
 function complete(prop,id,at){
  if(!valid(at,id)||!prop.isConnected)return;cancel();clean=true;save();message='반짝! 깨끗하게 닦은 잎이 남았어요.';sync();c.refresh();
 }
 function near(){return here()&&c.walk.nearby()?.kind==='look-0'}
 function reachable(){const prop=c.objects.querySelector('[data-place=look-0]');if(!prop)return false;const distance=Math.abs(c.getPosition().x-27)*c.hub.querySelector('.hub-stage').clientWidth/100;return distance<=(prop.offsetWidth+player.offsetWidth)/2+28}
 function sync(){
  activate();const prop=here()&&c.objects.querySelector('[data-place=look-0]');
  if(run&&(!valid(run.at,run.owner)||!run.prop.isConnected)||drag&&(!valid(drag.at,drag.owner)||!drag.prop.isConnected)){cancel();message='먼지솔을 내려놓았어요. 다시 닦아도 좋아요.'}
  help.hidden=!near();const text=(message||(clean?'잎을 돌본 기억이 남아 있어요.':'잎을 쓱 문지르거나, 잎 닦기를 눌러요.'))+(storageOk?'':' 이 기기에 저장하지 못했어요.');if(status.textContent!==text)status.textContent=text;
  if(!prop)return;
  if(!prop.querySelector('.sprout-care-art')){
   const art=doc.createElement('span');art.className='sprout-care-art';art.setAttribute('aria-hidden','true');art.innerHTML='<span class="sprout-dust dust-left"><i></i><i></i><i></i></span><span class="sprout-dust dust-right"><i></i><i></i><i></i></span><span class="sprout-handle"></span><span class="sprout-cloth">'+CLOTH+'</span><span class="sprout-shine shine-left">✧</span><span class="sprout-shine shine-right">✧</span><span class="sprout-care-tag">돌본 새싹</span>';prop.append(art);bindWipe(prop);
  }
  prop.classList.toggle('sprout-clean',clean);const action=label('look-0');prop.dataset.action=action;prop.setAttribute('aria-label','새싹 화분 · '+action);const hint=prop.querySelector('.campus-object-action');if(hint.textContent!==action)hint.textContent=action;
 }
 function suppress(){suppressClick=true}
 function bindWipe(prop){
  prop.addEventListener('click',e=>{if(suppressClick&&e.detail!==0){suppressClick=false;e.preventDefault();e.stopImmediatePropagation()}},true);
  prop.addEventListener('pointerdown',e=>{
   suppressClick=false;
   if(e.button!==0||!e.isPrimary||!near()||!reachable()||run||player.hasAttribute('data-jumping'))return;
   const rect=prop.getBoundingClientRect();if((e.clientY-rect.top)/rect.height>.46)return;
   c.stop();drag={id:e.pointerId,prop,rect,hand:handPoint(rect),x:e.clientX,y:e.clientY,at:c.getPosition().x,owner,moved:false,minX:e.clientX,maxX:e.clientX};prop.setPointerCapture(e.pointerId);
  });
  prop.addEventListener('pointermove',e=>{
   if(!drag||e.pointerId!==drag.id)return;const d=drag;
   if(!valid(d.at,d.owner)){cancel();sync();return}
   if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<10&&!d.moved)return;
   d.moved=true;e.preventDefault();prop.classList.add('sprout-wiping');
   const y=(e.clientY-d.rect.top)/d.rect.height;if(y>=0&&y<=.46){d.minX=Math.min(d.minX,e.clientX);d.maxX=Math.max(d.maxX,e.clientX)}
   const px=Math.max(29,Math.min(71,(e.clientX-d.rect.left)/d.rect.width*100)),py=Math.max(4,Math.min(31,y*100));prop.style.setProperty('--wipe-x',px+'%');prop.style.setProperty('--wipe-y',py+'%');placeHandle(prop,d.rect,d.hand,px,py);
   message='쓱쓱… 두 잎을 가볍게 닦아요.';sync();
  });
  prop.addEventListener('pointerup',e=>{
   if(!drag||e.pointerId!==drag.id)return;const d=drag,moved=d.moved,covered=d.maxX-d.minX>=d.rect.width*.23;
   cancel();if(moved){suppress();if(covered)complete(prop,d.owner,d.at);else{message='잎을 따라 조금 더 옆으로 쓱 문질러요.';sync();c.refresh()}}
  });
  for(const name of ['pointercancel','lostpointercapture'])prop.addEventListener(name,()=>{if(drag){suppress();cancel();message='먼지솔을 내려놓았어요. 다시 닦아도 좋아요.';sync();c.refresh()}});
 }
 function interact(kind){
  if(c.getScene()!=='garden'||kind!=='look-0')return false;activate();if(run||drag)return true;c.stop();
  if(!near()||!reachable()){c.walk.goTo(kind);message='화분 곁에 도착하면 잎을 닦아 봐요.';sync();return true}
  if(player.hasAttribute('data-jumping')){message='땅에 내려오면 잎을 닦을 수 있어요.';sync();return true}
  sync();const prop=c.objects.querySelector('[data-place=look-0]');if(!prop)return true;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,duration=reduce?140:900;
  prop.classList.add('sprout-wiping');message='쓱쓱… 부드러운 먼지솔으로 닦고 있어요.';
  const cloth=prop.querySelector('.sprout-cloth'),animations=[cloth.animate(reduce?[{opacity:1},{opacity:1}]:[{left:'25%',top:'39%',rotate:'-12deg'},{offset:.25,left:'40%',top:'13%',rotate:'-8deg'},{offset:.65,left:'63%',top:'16%',rotate:'8deg'},{left:'25%',top:'39%',rotate:'-12deg'}],{duration,iterations:1})];
  const rect=prop.getBoundingClientRect(),hand=handPoint(rect);placeHandle(prop,rect,hand,42,16);if(!reduce)animations.push(prop.querySelector('.sprout-handle').animate([[0,25,39],[.25,40,13],[.65,63,16],[1,25,39]].map(([offset,x,y])=>({offset,...handlePose(hand,rect,x,y)})),{duration,iterations:1}));
  const upper=player.querySelector('.campus-upper');if(upper&&!reduce)animations.push(upper.animate([{rotate:'0deg'},{rotate:'3deg'},{rotate:'0deg'}],{duration}));
  const current={prop,owner,at:c.getPosition().x,animations};run=current;sync();c.refresh();animations[0].finished.then(()=>{if(run===current)complete(prop,current.owner,current.at)}).catch(()=>{});return true;
 }
 letter.onclick=()=>{cancel();sync();c.refresh();c.openLetter()};
 new MutationObserver(sync).observe(c.objects,{childList:true});
 new MutationObserver(()=>{sync();c.refresh()}).observe(player,{attributes:true,attributeFilter:['data-jumping']});
 new MutationObserver(sync).observe(c.hub,{attributes:true,attributeFilter:['class']});
 doc.addEventListener('student-dashboard-updated',()=>{activate();sync()});
 for(const name of ['blur','pagehide'])window.addEventListener(name,()=>{cancel();sync();c.refresh()});doc.addEventListener('visibilitychange',()=>{if(doc.hidden){cancel();sync();c.refresh()}});
 sync();return{interact,label,sync};
}
