// One personal playground ball. No school record, inventory or economy writes.
const BALL='<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="#dea45e" stroke="#826445" stroke-width="2"/><path d="M8 11Q20 0 34 10M7 18Q22 12 39 17" fill="none" stroke="#f6d18f" stroke-width="3" stroke-linecap="round"/><path d="M4 24H44M24 3Q10 24 24 45M24 3Q38 24 24 45" fill="none" stroke="#866b49" stroke-width="1.7"/><path d="M8 34Q24 46 39 32" fill="none" stroke="#c48d50" stroke-width="2"/></svg>';
export function installPlaygroundBall(c){
 const doc=c.hub.ownerDocument,player=doc.getElementById('hubPlayer'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const ground=doc.createElement('button');ground.type='button';ground.className='playground-ball';ground.innerHTML=BALL;ground.hidden=true;c.stage.append(ground);
 const held=doc.createElement('button');held.type='button';held.className='playground-held-ball';held.innerHTML=BALL;held.hidden=true;held.setAttribute('aria-label','손에 든 공 · 쓸거나 눌러 굴리기');
 const help=doc.createElement('div');help.className='ball-help';help.hidden=true;const status=doc.createElement('span');status.setAttribute('role','status');const action=doc.createElement('button');action.type='button';action.className='ball-play';help.append(status,action);c.hub.querySelector('.hub-help').append(help);
 let owner=null,mode='cart',x=79,returned=false,played=false,storageOk=true,message='',flight=null,drag=null,suppressClick=false;
 const key=id=>'classRpgPlaygroundBall_v1_'+id,here=()=>c.getScene()==='playground'&&!c.hub.classList.contains('hidden');
 const basket=()=>here()?c.objects.querySelector('[data-place=look-2]'):null,nearCart=()=>here()&&c.walk.nearby()?.kind==='look-2';
 const closeBall=()=>here()&&Math.abs(c.getPosition().x-x)*c.stage.clientWidth/100<=55;
 const available=()=>owner!=null&&here()&&!player.hasAttribute('data-jumping')&&!doc.querySelector('dialog[open]');
 function release(){const d=drag;drag=null;if(d){suppressClick=true;if(d.el.hasPointerCapture(d.id))d.el.releasePointerCapture(d.id)}held.style.removeProperty('--ball-pull')}
 function stopRoll(){const f=flight;flight=null;if(f){f.animations.forEach(a=>a.cancel());x=f.end;mode='ground'}ground.classList.remove('is-rolling')}
 function reset(){release();stopRoll();mode='cart';played=false;held.hidden=true;ground.hidden=true}
 function activate(){const id=c.getStudent()?.id;if(id===owner)return;reset();owner=id;returned=false;storageOk=true;message='';if(id==null)return;try{const s=JSON.parse(localStorage.getItem(key(id))||'null');returned=s?.v===1&&s.returned===true}catch{storageOk=false}}
 function remember(){returned=true;try{localStorage.setItem(key(owner),JSON.stringify({v:1,returned:true}));storageOk=true}catch{storageOk=false}}
 function label(kind){if(c.getScene()!=='playground'||kind!=='look-2')return null;return mode==='held'?'공 바구니에 돌려놓기':mode==='cart'?'공 꺼내기':'굴린 공 찾기'}
 function geometry(){ground.style.left=x+'%'}
 function sync(){
  activate();if(!here()&&mode!=='cart'){reset();message=''}
  const rig=player.querySelector('.campus-rig');if(rig&&held.parentNode!==rig)rig.append(held);
  held.hidden=mode!=='held'||!here();ground.hidden=!here()||!['ground','rolling'].includes(mode);ground.disabled=mode==='rolling';ground.setAttribute('aria-label',closeBall()?'굴린 공 · 줍기':'굴린 공 · 가까이 걷기');geometry();
  help.hidden=!here()||mode==='cart'&&!nearCart();action.textContent=mode==='held'?'공 굴리기':mode==='cart'?'공 꺼내기':mode==='rolling'?'데굴데굴…':closeBall()?'공 줍기':'공 따라가기';action.disabled=mode==='rolling';action.hidden=mode==='cart';
  const text=(message||(returned?'공이 제자리에 기다리고 있어요.':'공을 꺼내서 굴려 볼까요?'))+(storageOk?'':' 이 기기에 저장하지 못했어요.');if(status.textContent!==text)status.textContent=text;
  const b=basket();if(!b)return;b.classList.toggle('ball-returned',returned);const title=label('look-2');b.dataset.action=title;b.setAttribute('aria-label','함께 쓰는 공 · '+title);const hint=b.querySelector('.campus-object-action');if(hint&&hint.textContent!==title)hint.textContent=title;
 }
 function handsFree(){return !player.querySelector('.cafeteria-held-tray:not([hidden]),.parcel-held:not([hidden]),.momo-held:not([hidden])')}
 function pick(){if(!available())return;if(!handsFree()){message='손에 든 물건을 먼저 돌려놓고 공을 들어요.';sync();return}mode='held';player.dataset.facing=c.getPosition().x<79?'left':'right';message='공을 좌우로 쓸어 굴려요. 버튼으로도 할 수 있어요.';sync();c.refresh()}
 function follow(){if(mode==='rolling')return;if(closeBall()){c.stop();pick()}else{c.walk.goToPoint(x,'굴린 공');message='공 가까이 가서 주워요.';sync()}}
 function roll(direction,distance=110){
  activate();if(!available()||mode!=='held'&&!(mode==='ground'&&closeBall()))return;c.stop();release();
  const hand=mode==='held'?held.getBoundingClientRect():null,scene=c.stage.getBoundingClientRect(),start=hand?(hand.x+hand.width/2-scene.x)/scene.width*100:x;
  const end=Math.max(5,Math.min(95,start+direction*Math.max(45,Math.min(180,distance))/c.stage.clientWidth*100));
  mode='rolling';x=end;message='데굴데굴! 따라가서 다시 주워요.';sync();c.refresh();ground.classList.add('is-rolling');
  const dx=(start-end)*c.stage.clientWidth/100,height=hand?ground.getBoundingClientRect().top-hand.top:0;
  const frames=reduce.matches?[{translate:dx+'px 0'},{translate:'0 0'}]:[{offset:0,translate:dx+'px '+(-height)+'px'},{offset:.2,translate:(dx*.75)+'px 0'},{offset:.35,translate:(dx*.5)+'px -9px'},{offset:.52,translate:(dx*.28)+'px 0'},{offset:1,translate:'0 0'}];
  const options={duration:reduce.matches?180:1250,easing:'ease-out'},a=ground.animate(frames,options),spin=ground.querySelector('svg').animate([{rotate:'0deg'},{rotate:reduce.matches?'0deg':direction*300+'deg'}],options);
  const expected={owner,end,animations:[a,spin]};flight=expected;
  a.finished.then(()=>{if(flight!==expected)return;stopRoll();if(expected.owner===c.getStudent()?.id&&here()){played=true;message='공이 멈췄어요. 가까이 가서 주워 볼까요?';sync();c.refresh()}}).catch(()=>{});
 }
 function play(){activate();if(!available()){message='내려오면 공을 갖고 놀아요.';sync();return}if(mode==='held')roll(player.dataset.facing==='left'?-1:1);else if(mode==='ground')follow();else if(mode==='cart')interact('look-2')}
 function interact(kind){
  if(c.getScene()!=='playground'||kind!=='look-2')return false;activate();c.stop();
  if(!available()){message='내려오면 공을 갖고 놀아요.';sync();return true}
  if(mode==='ground'||mode==='rolling'){follow();return true}
  if(!nearCart()){c.walk.goTo('look-2');message='공 바구니까지 걸어가요.';sync();return true}
  if(mode==='held'){release();mode='cart';if(played)remember();played=false;message='공을 제자리에 놓았어요. 또 놀아도 좋아요.';sync();c.refresh()}else pick();return true;
 }
 action.onclick=play;
 for(const el of [held,ground]){
  el.addEventListener('click',e=>{if(suppressClick&&e.detail!==0){suppressClick=false;return}play()});
  el.addEventListener('pointerdown',e=>{suppressClick=false;activate();if(e.button!==0||!e.isPrimary||!available()||mode==='rolling'||mode==='ground'&&!closeBall())return;e.preventDefault();el.focus({preventScroll:true});c.stop();drag={id:e.pointerId,el,owner,x:e.clientX,position:c.getPosition().x,dx:0};el.setPointerCapture(e.pointerId)});
  el.addEventListener('pointermove',e=>{const d=drag;if(!d||d.id!==e.pointerId)return;if(d.owner!==c.getStudent()?.id||!available()){release();return}d.dx=e.clientX-d.x;if(Math.abs(d.dx)>5){e.preventDefault();held.style.setProperty('--ball-pull',Math.max(-8,Math.min(8,d.dx*.12))+'px')}});
  el.addEventListener('pointerup',e=>{const d=drag;if(!d||d.id!==e.pointerId)return;release();if(Math.abs(d.dx)>=18&&d.owner===c.getStudent()?.id&&available()){suppressClick=true;roll(Math.sign(d.dx),Math.abs(d.dx)*2)}else if(Math.abs(d.dx)>5){suppressClick=true;message='조금 더 길게 밀면 공이 굴러가요.';sync()}else suppressClick=false});
  for(const type of ['pointercancel','lostpointercapture'])el.addEventListener(type,()=>{if(drag)release()});
 }
 // Cancel an unfinished gesture, never a jump's own timeline or walking speed.
 function position(){if(drag&&(Math.abs(c.getPosition().x-drag.position)>.1||player.hasAttribute('data-jumping')))release();sync()}
 new MutationObserver(position).observe(player,{attributes:true,attributeFilter:['data-jumping']});
 new MutationObserver(sync).observe(c.objects,{childList:true});new MutationObserver(sync).observe(c.hub,{attributes:true,attributeFilter:['class']});new ResizeObserver(()=>{stopRoll();sync()}).observe(c.stage);
 doc.addEventListener('student-dashboard-updated',sync);
 function pause(){release();stopRoll();message=mode==='ground'?'공은 여기서 기다릴게요.':message;sync();c.refresh()}
 for(const type of ['blur','pagehide'])window.addEventListener(type,pause);doc.addEventListener('visibilitychange',()=>{if(doc.hidden)pause()});
 c.hub.addEventListener('click',e=>{if(e.target.closest('[data-campus=map],[data-campus=find],[data-route],[data-place=story]'))pause()},true);
 sync();return {interact,label,sync:position};
}
