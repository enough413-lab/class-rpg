// A personal resting place in the existing garden, with a small spinning toy.
const WHEEL='<svg viewBox="0 0 64 64" aria-hidden="true"><g class="bench-wheel-blades"><path d="M32 32 6 6Q33-2 32 32Z" fill="#e4b28c"/><path d="M32 32 58 6Q66 33 32 32Z" fill="#dcca85"/><path d="M32 32 58 58Q31 66 32 32Z" fill="#9cbeaa"/><path d="M32 32 6 58Q-2 31 32 32Z" fill="#a4bbc4"/><path d="M32 32 6 6M32 32 58 6M32 32 58 58M32 32 6 58" stroke="#6c7962" stroke-width="1.4"/><circle cx="32" cy="32" r="4" fill="#f5e4ad" stroke="#6c7962" stroke-width="1.4"/></g></svg>';
export function installGardenBench(c){
 const doc=c.hub.ownerDocument,player=doc.getElementById('hubPlayer');
 const toy=doc.createElement('button');toy.type='button';toy.className='bench-pinwheel';toy.hidden=true;toy.innerHTML='<span class="bench-wheel-stem"></span>'+WHEEL;c.stage.append(toy);
 const help=doc.createElement('div');help.className='bench-help';help.hidden=true;const status=doc.createElement('span');status.setAttribute('role','status');
 const play=doc.createElement('button');play.type='button';play.className='bench-play';help.append(status,play);c.hub.querySelector('.hub-help').append(help);
 let owner=null,placed=false,seated=false,seatX=0,storageOk=true,message='',spin=null,appearance=null,spinAt=0,drag=null,ignoreClick=false,angle=0;
 const key=id=>'classRpgGardenBench_v1_'+id,here=()=>c.getScene()==='garden'&&!c.hub.classList.contains('hidden'),near=()=>here()&&c.walk.nearby()?.kind==='look-2';
 const prop=()=>here()?c.objects.querySelector('[data-place=look-2]'):null;
 function stopSpin(){if(spin){const blades=toy.querySelector('.bench-wheel-blades');angle=(parseFloat(getComputedStyle(blades).rotate)||0)%360;spin.cancel();blades.style.rotate=angle+'deg'}spin=null;appearance?.cancel();appearance=null;toy.classList.remove('is-spinning')}
 function cancelDrag(){const d=drag;drag=null;if(d){ignoreClick=true;if(toy.hasPointerCapture(d.id))toy.releasePointerCapture(d.id)}}
 function stand(){if(seated)message='벤치에서 일어났어요.';seated=false;delete player.dataset.benchRest;stopSpin();cancelDrag()}
 function activate(){const id=c.getStudent()?.id;if(id===owner)return;stand();owner=id;placed=false;angle=0;toy.querySelector('.bench-wheel-blades').style.rotate='0deg';storageOk=true;message='';if(id==null)return;try{const s=JSON.parse(localStorage.getItem(key(id))||'null');placed=s?.v===1&&s.placed===true}catch{storageOk=false}}
 function save(){if(owner==null)return;try{localStorage.setItem(key(owner),JSON.stringify({v:1,placed:true}));storageOk=true}catch{storageOk=false}}
 function label(kind){activate();return c.getScene()==='garden'&&kind==='look-2'?(seated?'벤치에서 일어나기':'벤치에 앉기'):null}
 function geometry(){const b=prop();if(!b)return;const lift=Math.max(0,b.offsetHeight*.43-player.offsetHeight*.24);player.style.setProperty('--bench-lift',(-lift)+'px');toy.style.left='calc(79% + '+b.offsetWidth*.34+'px)';toy.style.bottom='calc(20% + '+b.offsetHeight*.52+'px)'}
 function sync(){
  activate();const b=prop();if(seated&&(!here()||Math.abs(c.getPosition().x-seatX)>.15||player.hasAttribute('data-jumping')))stand();
  if(!near()||player.hasAttribute('data-jumping')||spin&&Math.abs(c.getPosition().x-spinAt)>.15||drag&&Math.abs(c.getPosition().x-drag.at)>.15){stopSpin();cancelDrag()}
  toy.hidden=!b||!placed;toy.disabled=!near();toy.tabIndex=near()?0:-1;toy.setAttribute('aria-label','벤치 바람개비 · 돌리기');
  help.hidden=!near();play.textContent=placed?'바람개비 돌리기':'바람개비 놓기';
  const text=(message||(seated?'그늘에서 잠깐 쉬어요. 언제든 다시 걸어도 좋아요.':'벤치에 앉아 쉬거나 바람개비를 놓아 봐요.'))+(storageOk?'':' 이 기기에 저장하지 못했어요.');if(status.textContent!==text)status.textContent=text;
  if(!b)return;b.classList.toggle('bench-occupied',seated);const action=label('look-2');b.dataset.action=action;b.setAttribute('aria-label','그늘 쉼터 · '+action);const hint=b.querySelector('.campus-object-action');if(hint.textContent!==action)hint.textContent=action;
 }
 function reachable(){return here()&&Math.abs(c.getPosition().x-79)<=1}
 function arrive(){if(reachable())return true;c.walk.goTo('look-2');message='벤치 앞에 도착하면 쉬어 가요.';sync();return false}
 function interact(kind){
  if(c.getScene()!=='garden'||kind!=='look-2')return false;activate();c.stop();if(!arrive())return true;
  if(player.hasAttribute('data-jumping')){message='땅에 내려오면 앉을 수 있어요.';sync();return true}
  if(seated){stand();message='잘 쉬었어요. 다시 걸어 볼까요?'}else{geometry();seated=true;seatX=c.getPosition().x;player.dataset.benchRest='true';player.dataset.facing='right';message='나무 그늘에 앉았어요. 바람개비도 돌려 볼까요?'}
  sync();c.refresh();return true;
 }
 function rotate(turns=3){
  stopSpin();spinAt=c.getPosition().x;const blades=toy.querySelector('.bench-wheel-blades'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const from=angle,to=from+(reduce?90:360*Math.max(1,Math.min(5,turns)));angle=to%360;
  blades.style.rotate=angle+'deg';if(reduce)return;
  const a=blades.animate([{rotate:from+'deg'},{rotate:to+'deg'}],{duration:1600,easing:'cubic-bezier(.16,.65,.3,1)',iterations:1});spin=a;toy.classList.add('is-spinning');a.finished.then(()=>{if(spin===a){spin=null;toy.classList.remove('is-spinning')}}).catch(()=>{});
 }
 function playToy(){
  activate();c.stop();if(!arrive())return;if(player.hasAttribute('data-jumping')){message='내려오면 바람개비를 돌려요.';sync();return}
  if(!placed){placed=true;save();geometry();message='벤치 곁에 내 바람개비를 꽂았어요.';sync();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)appearance=toy.animate([{opacity:0,translate:'0 -12px'},{opacity:1,translate:'0 0'}],{duration:260});}
  else{rotate();message='후우! 바람개비가 빙글빙글 돌아요.';sync()}c.refresh();
 }
 play.onclick=playToy;toy.addEventListener('click',e=>{if(ignoreClick&&e.detail!==0){ignoreClick=false;return}playToy()});
 toy.addEventListener('pointerdown',e=>{ignoreClick=false;if(e.button!==0||!e.isPrimary||!reachable()||player.hasAttribute('data-jumping'))return;c.stop();stopSpin();drag={id:e.pointerId,x:e.clientX,y:e.clientY,owner,at:c.getPosition().x,moved:false};toy.setPointerCapture(e.pointerId)});
 toy.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const d=drag;if(d.owner!==c.getStudent()?.id||!reachable()){cancelDrag();return}const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.hypot(dx,dy)>10){d.moved=true;e.preventDefault();toy.querySelector('.bench-wheel-blades').style.rotate=(angle+dx*3-dy*2)+'deg'}});
 toy.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const d=drag;cancelDrag();if(d.moved){ignoreClick=true;angle=(angle+(e.clientX-d.x)*3-(e.clientY-d.y)*2)%360;rotate(Math.hypot(e.clientX-d.x,e.clientY-d.y)/25);message='손으로 돌린 바람개비가 천천히 멈춰요.';sync();c.refresh()}else ignoreClick=false});
 for(const type of ['pointercancel','lostpointercapture'])toy.addEventListener(type,()=>{if(drag){cancelDrag();toy.querySelector('.bench-wheel-blades').style.rotate=angle+'deg'}});
 new MutationObserver(()=>{sync();geometry()}).observe(c.objects,{childList:true});
 new MutationObserver(()=>{sync();c.refresh()}).observe(player,{attributes:true,attributeFilter:['data-jumping']});
 new MutationObserver(sync).observe(c.hub,{attributes:true,attributeFilter:['class']});
 new ResizeObserver(()=>{geometry();sync()}).observe(c.stage);
 doc.addEventListener('student-dashboard-updated',()=>{activate();sync()});
 for(const type of ['blur','pagehide'])window.addEventListener(type,()=>{stand();sync();c.refresh()});doc.addEventListener('visibilitychange',()=>{if(doc.hidden){stand();sync();c.refresh()}});
 sync();return{interact,label,sync};
}
