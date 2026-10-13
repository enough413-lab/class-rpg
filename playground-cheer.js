// A small personal cheering prop in the existing playground, never a reward.
const FLAG='<svg viewBox="0 0 58 86" aria-hidden="true"><g class="cheer-flag-motion"><path d="M9 9Q22 4 34 10T54 10L48 37Q33 41 22 35T9 36Z" fill="#e9c879" stroke="#746641" stroke-width="2"/><path d="M11 11Q24 7 34 13T51 13M11 32Q22 31 32 36" fill="none" stroke="#fff0be" stroke-width="2"/><path d="m30 17 2.4 5 5.5.8-4 4 .9 5.5-4.8-2.7-4.9 2.7.9-5.5-4-4 5.5-.8Z" fill="#719d86" stroke="#547866" stroke-width="1"/><path d="M9 7V79" stroke="#87683f" stroke-width="4" stroke-linecap="round"/><path d="M8 8V77" stroke="#ccb98b" stroke-width="1"/><circle cx="9" cy="6" r="3" fill="#f7df9d" stroke="#87683f"/></g></svg>';
export function installPlaygroundCheer(c){
 const doc=c.hub.ownerDocument,player=doc.getElementById('hubPlayer'),motion=matchMedia('(prefers-reduced-motion: reduce)');
 const flag=doc.createElement('button');flag.type='button';flag.className='cheer-flag';flag.innerHTML=FLAG;flag.hidden=true;c.stage.append(flag);
 const words=doc.createElement('span');words.className='cheer-words';words.hidden=true;words.setAttribute('aria-hidden','true');c.stage.append(words);
 const help=doc.createElement('div');help.className='cheer-help';help.hidden=true;const status=doc.createElement('span');status.setAttribute('role','status');const play=doc.createElement('button');play.type='button';play.className='cheer-play';help.append(status,play);c.hub.querySelector('.hub-help').append(help);
 let owner=null,used=false,seated=false,holding=false,seatX=0,message='',storageOk=true,drag=null,ignoreClick=false,animations=[],run=null,wordTimer=0,phrase=0;
 const key=id=>'classRpgPlaygroundCheer_v1_'+id,here=()=>c.getScene()==='playground'&&!c.hub.classList.contains('hidden');
 const prop=()=>here()?c.objects.querySelector('[data-place=look-1]'):null,near=()=>here()&&c.walk.nearby()?.kind==='look-1';
 const reachable=()=>owner!=null&&here()&&Math.abs(c.getPosition().x-53)<=1&&!player.hasAttribute('data-jumping');
 const blade=flag.querySelector('.cheer-flag-motion');
 function cancelDrag(){const d=drag;drag=null;if(d){ignoreClick=true;if(flag.hasPointerCapture(d.id))flag.releasePointerCapture(d.id)}}
 function stopWave(){run=null;animations.forEach(a=>a.cancel());animations=[];blade.style.rotate=holding?'16deg':'0deg';player.style.removeProperty('--cheer-lean');flag.classList.remove('is-waving');clearTimeout(wordTimer);words.hidden=true;cancelDrag()}
 function stand(){stopWave();holding=false;blade.style.rotate='0deg';seated=false;delete player.dataset.cheerRest;geometry()}
 function activate(){const id=c.getStudent()?.id;if(id===owner)return;stand();owner=id;used=false;phrase=0;message='';storageOk=true;if(id==null)return;try{const s=JSON.parse(localStorage.getItem(key(id))||'null');used=s?.v===1&&s.used===true}catch{storageOk=false}}
 function remember(){used=true;try{localStorage.setItem(key(owner),JSON.stringify({v:1,used:true}));storageOk=true}catch{storageOk=false}}
 function geometry(){const b=prop();if(!b)return;const lift=Math.max(0,b.offsetHeight*.40-player.offsetHeight*.24),w=parseFloat(getComputedStyle(flag).width),h=parseFloat(getComputedStyle(flag).height);player.style.setProperty('--cheer-lift',-lift+'px');flag.style.left=holding?'calc(53% + '+(player.offsetWidth*.15-w*9/58)+'px)':'calc(53% + '+b.offsetWidth*.38+'px)';flag.style.bottom='calc(20% + '+((holding?player.offsetHeight*.32+lift:b.offsetHeight*.38)-h*7/86)+'px)';words.style.left='53%';words.style.bottom='calc(20% + '+(player.offsetHeight+lift+10)+'px)'}
 function sit(){seated=true;seatX=c.getPosition().x;player.dataset.cheerRest='true';player.dataset.facing='right';geometry()}
 function label(kind){return c.getScene()==='playground'&&kind==='look-1'?(seated?'벤치에서 일어나기':'응원 벤치에 앉기'):null}
 function sync(){
  activate();if(seated&&(!reachable()||Math.abs(c.getPosition().x-seatX)>.15)){stand();message=used?'깃발을 벤치 곁에 놓았어요.':'벤치에서 일어났어요.'}
  const b=prop();flag.hidden=!b||!holding&&!used;flag.disabled=!near();flag.tabIndex=near()?0:-1;flag.classList.toggle('is-held',holding);flag.setAttribute('aria-label',holding?'손에 든 응원 깃발 · 쓸거나 눌러 흔들기':'벤치의 응원 깃발 · 들기');
  help.hidden=!near();play.textContent=holding?'깃발 흔들기':'깃발 들기';const text=(message||(used?'내 깃발이 기다리고 있어요.':'앉아서 운동장을 바라볼까요?'))+(storageOk?'':' 이 기기에 저장하지 못했어요.');if(status.textContent!==text)status.textContent=text;
  if(!b)return;b.classList.toggle('cheer-occupied',seated);b.classList.toggle('cheer-speaking',!words.hidden);const action=label('look-1');b.dataset.action=action;b.setAttribute('aria-label','응원 벤치 · '+action);const hint=b.querySelector('.campus-object-action');if(hint&&hint.textContent!==action)hint.textContent=action;
 }
 function arrive(){if(reachable())return true;if(player.hasAttribute('data-jumping'))message='내려오면 벤치에서 쉬어요.';else{c.walk.goTo('look-1');message='벤치에 도착하면 앉아 봐요.'}sync();return false}
 function interact(kind){if(c.getScene()!=='playground'||kind!=='look-1')return false;activate();c.stop();if(!arrive())return true;if(seated){stand();message=used?'응원 깃발을 벤치 곁에 놓았어요.':'잘 쉬었어요. 다시 걸어 볼까요?'}else{sit();message='깃발을 들고 살랑살랑 응원해 볼까요?'}sync();c.refresh();return true}
 function cheer(){
  if(!reachable()||!holding)return;remember();message=['힘내!','잘하고 있어!','함께라서 좋아!'][phrase++%3];words.textContent=message;words.hidden=false;clearTimeout(wordTimer);wordTimer=setTimeout(()=>{words.hidden=true;sync()},1400);sync();c.refresh();
 }
 function wave(){
  stopWave();if(motion.matches){blade.style.rotate='20deg';cheer();return}
  const expected={owner};run=expected;flag.classList.add('is-waving');const frames=[16,4,32,7,26,16].map(rotate=>({rotate:rotate+'deg'})),options={duration:1100,easing:'ease-in-out'};
  const a=blade.animate(frames,options);animations=[a];for(const el of player.querySelectorAll('.campus-upper,.cafeteria-held-tray:not([hidden]),.parcel-held:not([hidden]),.momo-held:not([hidden])'))animations.push(el.animate([0,-2,2,-1.5,1,0].map(rotate=>({rotate:rotate+'deg'})),options));
  a.finished.then(()=>{if(run!==expected)return;stopWave();if(expected.owner===c.getStudent()?.id&&reachable()&&holding)cheer()}).catch(()=>{});
 }
 function playFlag(){activate();c.stop();if(!arrive())return;if(!seated)sit();if(!holding){stopWave();holding=true;blade.style.rotate='16deg';geometry();message='깃발을 좌우로 쓸어 봐요. 버튼으로도 흔들어요.';sync();c.refresh()}else wave()}
 play.onclick=playFlag;flag.addEventListener('click',e=>{if(ignoreClick&&e.detail!==0){ignoreClick=false;return}playFlag()});
 flag.addEventListener('pointerdown',e=>{ignoreClick=false;activate();if(e.button!==0||!e.isPrimary||!holding||!reachable())return;c.stop();stopWave();drag={id:e.pointerId,owner,x:e.clientX,moved:false,enough:false};flag.setPointerCapture(e.pointerId)});
 flag.addEventListener('pointermove',e=>{const d=drag;if(!d||d.id!==e.pointerId)return;if(d.owner!==c.getStudent()?.id||!reachable()){stopWave();return}const dx=e.clientX-d.x;if(Math.abs(dx)<5)return;e.preventDefault();d.moved=true;d.enough=Math.abs(dx)>=18;const angle=Math.max(-12,Math.min(16,dx*.45));message='살랑살랑, 내 손을 따라 움직여요.';blade.style.rotate=(16+(motion.matches?angle*.35:angle))+'deg';player.style.setProperty('--cheer-lean',angle*.07+'deg')});
 flag.addEventListener('pointerup',e=>{const d=drag;if(!d||d.id!==e.pointerId)return;cancelDrag();blade.style.rotate='16deg';player.style.removeProperty('--cheer-lean');if(d.moved){ignoreClick=true;if(d.enough&&d.owner===c.getStudent()?.id&&reachable())cheer();else{message='깃발을 조금 더 길게 쓸어 봐요.';sync()}}else ignoreClick=false});
 for(const type of ['pointercancel','lostpointercapture'])flag.addEventListener(type,()=>{if(drag)stopWave()});
 new MutationObserver(()=>{sync();geometry()}).observe(c.objects,{childList:true});new ResizeObserver(()=>{geometry();sync()}).observe(c.stage);
 new MutationObserver(()=>{sync();c.refresh()}).observe(player,{attributes:true,attributeFilter:['data-jumping']});new MutationObserver(sync).observe(c.hub,{attributes:true,attributeFilter:['class']});
 c.hub.addEventListener('click',e=>{if(seated&&e.target.closest('[data-campus=map],[data-campus=find],[data-route],[data-place=story]')){stand();sync()}},true);
 doc.addEventListener('student-dashboard-updated',()=>{activate();sync()});for(const type of ['blur','pagehide'])window.addEventListener(type,()=>{stand();sync();c.refresh()});doc.addEventListener('visibilitychange',()=>{if(doc.hidden){stand();sync();c.refresh()}});
 sync();return{interact,label,sync};
}
