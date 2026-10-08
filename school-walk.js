import {EXTRA_ROOMS} from './school-walking-places.js?v=20261007-world';
import {decorateCampusObject,markCampusObject} from './campus-objects.js?v=20261007-shelf';
import {installCampusWaypoint} from './campus-waypoint.js?v=20261007-journey';
// One horizontal ground plane: the avatar, interaction points and camera share coordinates.
const PLACES={
 classroom:[{kind:'titles',x:8,label:'🏅 칭호 진열장'},{kind:'inventory',x:24,label:'🎒 내 옷장'},{kind:'parcel',x:38,label:'📦 도서 꾸러미'},{kind:'quests',x:48,label:'📋 선생님 의뢰'},{kind:'teacher',x:66,label:'🌟 해낸 일'},{kind:'shop',x:81,label:'🛍️ 상점'},{kind:'hallway',x:94,label:'🚪 복도'}],
 hallway:[{kind:'classroom',x:16,label:'🏫 우리 교실'},{kind:'notice',x:51,label:'📜 도서 안내판'},{kind:'library',x:85,label:'📚 도서관'}],
 library:[{kind:'hallway',x:7,label:'🚪 복도'},{kind:'reading',x:28,label:'✍️ 독후감 쓰기'},{kind:'tori',x:58,label:'책지기 토리'},{kind:'portfolio',x:82,label:'📖 독후감 책장'}]
};
for(const [room,info] of Object.entries(EXTRA_ROOMS))PLACES[room]=[{kind:'hallway',x:7,label:'🚪 복도로 돌아가기'},...info.props.map((label,i)=>({kind:'look-'+i,x:27+i*26,label})),{kind:'story',x:91,label:'📖 이곳의 이야기'}];
export function installSchoolWalk(ctx){
 // CSS pixels per second, shared by keys, touch buttons and destination walking.
 const GROUND=80,WALK_SPEED=100;
 const {hub,stage,objects}=ctx,doc=hub.ownerDocument,player=doc.getElementById('hubPlayer');
 const viewport=doc.createElement('div');viewport.className='campus-viewport';stage.before(viewport);viewport.append(stage);
 const status=doc.createElement('div');status.className='campus-scene-status';status.setAttribute('role','status');viewport.append(status);
 hub.classList.add('campus-side');
 const waypoint=installCampusWaypoint(stage);
 // A real pointer target keeps mobile tap adjustment from choosing a nearby NPC.
 // Keyboard and assistive-technology users already have the movement controls.
 const floor=doc.createElement('button');floor.type='button';floor.className='campus-floor-target';floor.tabIndex=-1;floor.setAttribute('aria-hidden','true');stage.prepend(floor);
 let frame=0,target=null,destination=null,lastAt=0,walkEnd=0,scene='',imageRequest=0;
 const heldDirections=new Map();let movementOwner=null;
 const direction=()=>[...heldDirections.values()].at(-1)||0;
 const overlay=()=>doc.querySelector('dialog[open],.modal-backdrop:not(.hidden):not(#schoolExplorerModal),.reward-notice-backdrop');
 const canWalk=()=>!hub.classList.contains('hidden')&&!overlay()&&!doc.hidden;
 const currentPlaces=()=>(PLACES[ctx.getScene()]||PLACES.classroom).filter(p=>p.kind!=='parcel'||!ctx.isParcelCollected?.());
 function camera(x=ctx.getPosition().x){
  const width=stage.clientWidth,view=viewport.clientWidth,offset=Math.max(0,Math.min(width-view,width*x/100-view/2));
  stage.style.transform='translateX('+(-offset)+'px)';
 }
 function markPlaces(){const near=nearby();for(const b of objects.querySelectorAll('[data-place]'))markCampusObject(b,{near:b.dataset.place===near?.kind,guided:b.dataset.place===destination?.kind})}
 function stop(arrived=false){const wasGuided=!!destination;cancelAnimationFrame(frame);frame=0;target=null;destination=null;lastAt=0;heldDirections.clear();movementOwner=null;clearTimeout(walkEnd);player.classList.remove('walking');waypoint.end(arrived===true);markPlaces();if(wasGuided)ctx.onPosition()}
 function nearest(){const x=ctx.getPosition().x;return currentPlaces().reduce((a,b)=>Math.abs(a.x-x)<=Math.abs(b.x-x)?a:b)}
 function nearby(){const closest=nearest();return Math.abs(closest.x-ctx.getPosition().x)<8?closest:null}
 function goTo(kind){
  const place=currentPlaces().find(p=>p.kind===kind);if(!place||!canWalk())return false;
  stop();destination=place;target=place.x;waypoint.show(target);
  markPlaces();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){renderPosition(target);stop(true)}
  else{startFrames();ctx.onPosition()}
  return true;
 }
 function renderPosition(x){
  const previous=ctx.getPosition().x,next=Math.max(4,Math.min(96,x));if(next===previous)return false;
  ctx.setPosition(next,GROUND);player.dataset.facing=next<previous?'left':'right';player.classList.add('walking');
  markPlaces();camera();ctx.onPosition();return true;
 }
 function startFrames(){movementOwner=ctx.getStudent()?.id;lastAt=performance.now();frame=requestAnimationFrame(tick)}
 function advance(time){
  const dt=Math.min(Math.max(0,(time-lastAt)/1000),.05);lastAt=time;
  const x=ctx.getPosition().x,dir=direction(),distance=dt*WALK_SPEED/Math.max(1,stage.clientWidth)*100;
  const diff=dir?dir:target-x,step=dir?dir*distance:Math.sign(diff)*Math.min(Math.abs(diff),distance);
  renderPosition(x+step);
  return dir?(dir<0?ctx.getPosition().x<=4:ctx.getPosition().x>=96):Math.abs(target-ctx.getPosition().x)<.001;
 }
 function tick(time){
  frame=0;if(!canWalk()||movementOwner!==ctx.getStudent()?.id||!heldDirections.size&&target===null){stop();return}
  if(advance(time)){stop(!heldDirections.size);return}frame=requestAnimationFrame(tick);
 }
 function hold(source,dx,repeat=false){
  if(!canWalk()||!dx||repeat||heldDirections.has(source))return;
  if(!heldDirections.size)stop();heldDirections.set(source,Math.sign(dx));
  player.dataset.facing=dx<0?'left':'right';player.classList.add('walking');
  if(!frame)startFrames();
 }
 function release(source){
  if(!heldDirections.has(source))return;
  if(canWalk()&&movementOwner===ctx.getStudent()?.id)advance(performance.now());
  heldDirections.delete(source);
  if(!heldDirections.size)stop();else player.dataset.facing=direction()<0?'left':'right';
 }
 // Native button activation has no hold duration (e.g. screen readers / Enter).
 function nudge(dx){
  if(!canWalk()||!dx)return;stop();target=Math.max(4,Math.min(96,ctx.getPosition().x+Math.sign(dx)*12/Math.max(1,stage.clientWidth)*100));startFrames();
 }
 function rig(){
  if(player.querySelector('.campus-rig'))return;
  const layers=[...player.children].filter(el=>el.tagName==='IMG');if(!layers.length)return;
  const body=doc.createElement('div');body.className='campus-rig';
  for(const part of ['upper','leg-left','leg-right']){
   const piece=doc.createElement('div');piece.className='campus-part campus-'+part;
   for(const layer of layers)piece.append(layer.cloneNode(true));body.append(piece);
  }
  player.replaceChildren(body);const name=doc.createElement('span');name.className='campus-player-name';name.textContent=ctx.getStudent()?.nickname||'나의 모험가';player.append(name);
 }
 function background(){
  const room=ctx.getScene(),request=++imageRequest,url=EXTRA_ROOMS[room]?'maps/'+room+'-walk.svg':'maps/'+room+'-tall-'+(room==='library'?'v2':'v1')+'.webp',img=new Image();
  status.hidden=false;status.textContent='학교 풍경을 펼치는 중…';
  img.onload=()=>{if(request!==imageRequest)return;stage.style.backgroundImage='url("'+url+'")';stage.style.setProperty('--campus-room-art','url("'+url+'")');status.hidden=true};
  img.onerror=()=>{if(request!==imageRequest)return;status.innerHTML='<span>풍경을 아직 불러오지 못했어요.</span><button type="button">다시 보기</button>';status.querySelector('button').onclick=background};img.src=url;
 }
 function syncScene(){
  const next=ctx.getScene();if(scene===next&&objects.querySelector('[data-place]')){rig();camera();markPlaces();return}
  stop();scene=next;hub.classList.toggle('campus-wide',!!EXTRA_ROOMS[next]);ctx.setPosition(EXTRA_ROOMS[next]?12:44,GROUND);objects.replaceChildren();
  for(const p of currentPlaces()){
   const b=doc.createElement('button');b.className=p.kind==='tori'?'campus-place campus-tori':'campus-place';b.dataset.place=p.kind;b.style.left=p.x+'%';
   if(EXTRA_ROOMS[next]){b.classList.add('campus-world-object');const title=doc.createElement('b');title.textContent=p.label;b.append(title);b.dataset.walkX=p.x;b.setAttribute('aria-label',p.label+' · 살펴보기')}else decorateCampusObject(b,p,next,ctx.tori);
   b.onclick=()=>{stop();ctx.interact(p.kind)};objects.append(b);
  }
  rig();background();camera();markPlaces();ctx.onPosition();
 }
 window.moveHub=(dx,dy)=>{
  if(!canWalk())return;stop();
  if(dx){renderPosition(ctx.getPosition().x+Math.sign(dx)*3);walkEnd=setTimeout(()=>player.classList.remove('walking'),180)}
  else if(dy<0)window.hubUseNearby();
 };
 stage.addEventListener('click',e=>{
  if(e.target.closest('button')&&e.target!==floor||!canWalk())return;const rect=stage.getBoundingClientRect();
  if(e.clientY<rect.top+rect.height*.75)return;
  stop();target=Math.max(4,Math.min(96,(e.clientX-rect.left)/rect.width*100));waypoint.show(target);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){renderPosition(target);stop(true)}else startFrames();
 });
 // Pointer focus must not move a target out from under the pending tap/click.
 stage.addEventListener('focusin',e=>{const p=e.target.closest('[data-place]');if(p?.matches(':focus-visible'))camera(Number(p.dataset.walkX))});
 new ResizeObserver(()=>camera()).observe(viewport);
 new MutationObserver(rig).observe(player,{childList:true});
 window.addEventListener('blur',stop);window.addEventListener('pagehide',stop);doc.addEventListener('visibilitychange',stop);
 let studentId=ctx.getStudent()?.id;doc.addEventListener('student-dashboard-updated',()=>{const next=ctx.getStudent()?.id;if(next!==studentId)stop();studentId=next});
 return {syncScene,nearby,nearest,stop,hold,release,nudge,camera,goTo,destination:()=>destination,places:room=>(PLACES[room]||[]).filter(p=>p.kind!=='parcel'||!ctx.isParcelCollected?.())};
}
