import {decorateFlowerbed} from './campus-flowerbed.js?v=20261026-flowerbed-keys';
import {decorateTrioObject,TRIO_SEARCH_PLACES} from './npc-trio.js?v=20261023-festival-undo';
import {HALLWAY_BACKGROUND,HALLWAY_PLACES,decorateHallwayObject} from './hallway-art.js?v=20261012-graphics';
import {PAINTED_PLACES,decoratePlaceProp} from './school-place-art.js?v=20261014-notebook';
import {roomDoors,decorateRoomDoor} from './school-connections.js?v=20261008-paths';
import {EXTRA_ROOMS} from './school-walking-places.js?v=20261008-nature';
import {decorateCampusObject,markCampusObject} from './campus-objects.js?v=20261020-anime';
import {installCampusWaypoint} from './campus-waypoint.js?v=20261007-journey';
import {installCampusNameplates} from './campus-nameplates.js?v=20261020-alert';
import {decorateMomoPencil} from './momo-favor.js?v=20261019-controls';
// One horizontal ground plane: the avatar, interaction points and camera share coordinates.
const PLACES={
 classroom:[{kind:'pencil',x:16,label:'모모의 연필'},{kind:'titles',x:8,label:'🏅 칭호 진열장'},{kind:'inventory',x:25,label:'🎒 내 옷장'},{kind:'parcel',x:38,label:'📦 도서 꾸러미'},{kind:'quests',x:54,label:'📋 선생님 의뢰'},{kind:'teacher',x:68,label:'🌟 해낸 일'},{kind:'shop',x:82,label:'🛍️ 상점'},{kind:'hallway',x:94,label:'🚪 복도'}],
 hallway:HALLWAY_PLACES,
 library:[roomDoors('library')[0],{kind:'reading',x:20,label:'독서 기록대'},{kind:'tori',x:55,label:'책지기 토리'},{kind:'portfolio',x:75,label:'📖 독후감 책장'},{kind:'nook',x:84,label:'🌿 창가 쉼터'},roomDoors('library')[1]]
};
for(const [room,info] of Object.entries(EXTRA_ROOMS))PLACES[room]=[...roomDoors(room),...info.props.map((label,i)=>({kind:'look-'+i,x:27+i*26,label})),{kind:'story',x:87,label:'📖 이곳의 이야기'}];
PLACES.library.push(...TRIO_SEARCH_PLACES,{kind:'trio-shelf',x:32,label:'토리의 작은 책장'});
PLACES.garden.push({kind:'flowerbed',x:65,label:'내 꽃밭 · 씨앗 심고 꾸미기'},{kind:'trio-garden',x:41,label:'새싹 · 말 걸기'});
PLACES.playground.push({kind:'trio-duri',x:41,label:'두리 · 공 던지기'});
export function installSchoolWalk(ctx){
 // CSS pixels per second, shared by keys, touch buttons and destination walking.
 const GROUND=80,WALK_SPEED=100;
 const {hub,stage,objects}=ctx,doc=hub.ownerDocument,player=doc.getElementById('hubPlayer');
 const viewport=doc.createElement('div');viewport.className='campus-viewport';stage.before(viewport);viewport.append(stage);
 const nameplates=installCampusNameplates({hub,stage,viewport,player,objects});
 const status=doc.createElement('div');status.className='campus-scene-status';status.setAttribute('role','status');viewport.append(status);
 hub.classList.add('campus-side');
 const waypoint=installCampusWaypoint(stage);
 // A real pointer target keeps mobile tap adjustment from choosing a nearby NPC.
 // Keyboard and assistive-technology users already have the movement controls.
 const floor=doc.createElement('button');floor.type='button';floor.className='campus-floor-target';floor.tabIndex=-1;floor.setAttribute('aria-hidden','true');stage.prepend(floor);
 let frame=0,target=null,destination=null,lastAt=0,walkEnd=0,scene='',imageRequest=0;
 const heldDirections=new Map(),approaches=new Map();let movementOwner=null,approachSide=0;
 const direction=()=>[...heldDirections.values()].at(-1)||0;
 const overlay=()=>doc.querySelector('dialog[open],.modal-backdrop:not(.hidden):not(#schoolExplorerModal),.reward-notice-backdrop');
 const canWalk=()=>!hub.classList.contains('hidden')&&!overlay()&&!doc.hidden;
 const currentPlaces=(includeInactive=false)=>(PLACES[ctx.getScene()]||PLACES.classroom).map(p=>ctx.trioSearchPlace?.(p)||p).filter(p=>(p.kind!=='parcel'||!ctx.isParcelCollected?.())&&(includeInactive||p.kind!=='pencil'||ctx.isMomoPencilVisible?.())&&(includeInactive||ctx.isTrioPlaceVisible?.(p.kind)!==false));
 function camera(x=ctx.getPosition().x){
  const width=stage.clientWidth,view=viewport.clientWidth;
  const playerFocus=width*x/100;let focus=playerFocus;
  // On narrow screens, ease the framing toward a nearby decorative prop so a
  // side-standing avatar does not push the object out of view. Geometry is
  // cached at scene/resize; this adds no timer or layout read per object.
  // Each offset uses the same avatar position. A short outer falloff prevents
  // adjacent props from pulling the camera away from the one being used.
  for(const a of approaches.values())if(a.cameraPair&&view<a.pairView){
   const delta=a.center*width/100-playerFocus,d=Math.abs(delta),t=Math.max(0,Math.min(1,(a.gapCss+24-d)/24));
   focus+=Math.sign(delta)*Math.min(d,a.gapCss)/2*t*t*(3-2*t);
  }
  const offset=Math.max(0,Math.min(width-view,focus-view/2));
  stage.style.transform='translateX('+(-offset)+'px)';
  nameplates.schedule();
 }
 function markPlaces(){const near=nearby();for(const b of objects.querySelectorAll('[data-place]'))markCampusObject(b,{near:b.dataset.place===near?.kind,guided:b.dataset.place===destination?.kind})}
 function stop(arrived=false){const wasGuided=!!destination;if(arrived===true&&approachSide)player.dataset.facing=approachSide<0?'right':'left';cancelAnimationFrame(frame);frame=0;target=null;destination=null;approachSide=0;lastAt=0;heldDirections.clear();movementOwner=null;clearTimeout(walkEnd);player.classList.remove('walking');waypoint.end(arrived===true);markPlaces();if(wasGuided)ctx.onPosition()}
 // Measure once per scene/resize, never on each walking frame. Leave room for
 // both character silhouettes and keep the chosen resident actionable on arrival.
 function measureApproaches(){
  approaches.clear();const width=stage.clientWidth;if(!width)return;
  for(const npc of objects.querySelectorAll('.campus-npc,[data-stand-beside]')){
   const center=parseFloat(npc.style.left),gap=((npc.offsetWidth+player.offsetWidth)/2+10)/width*100;
   approaches.set(npc.dataset.place,{center,cameraPair:npc.dataset.cameraPair==='true',gapCss:gap*width/100,pairView:player.offsetWidth+2*npc.offsetWidth+20,points:[{x:center-gap,side:-1},{x:center+gap,side:1}].filter(p=>p.x>=4&&p.x<=96&&(npc.dataset.approachSide!=='right'||p.side===1))});
  }
 }
 function distance(place,x=ctx.getPosition().x){return Math.min(Math.abs(place.x-x),...(approaches.get(place.kind)?.points||[]).map(p=>Math.abs(p.x-x)))}
 function nearest(){return currentPlaces().reduce((a,b)=>distance(a)<=distance(b)?a:b)}
 function nearby(){const closest=nearest();return distance(closest)<8?closest:null}
 function approachTarget(place,side=0){
  const a=approaches.get(place.kind);if(!a?.points.length)return {x:place.x,side:0};
  const preferred=side||(ctx.getPosition().x<=a.center?-1:1);
  return a.points.find(p=>p.side===preferred)||a.points[0];
 }
 function goTo(kind){
  const place=currentPlaces().find(p=>p.kind===kind);if(!place||!canWalk())return false;
  stop();measureApproaches();destination=place;const arrival=approachTarget(place);target=arrival.x;approachSide=arrival.side;waypoint.show(target);
  markPlaces();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){renderPosition(target);stop(Math.abs(target-ctx.getPosition().x)<.001)}
  else{startFrames();ctx.onPosition()}
  return true;
 }
 // Loose world objects use the same movement scheduler and speed as fixed places.
 function goToPoint(x,label,{continuous=false}={}){
  if(!Number.isFinite(x)||!canWalk())return false;
  stop();target=Math.max(4,Math.min(96,x));destination={kind:'world-object',x:target,label};waypoint.show(target);markPlaces();
  if(!continuous&&matchMedia('(prefers-reduced-motion: reduce)').matches){renderPosition(target);stop(Math.abs(target-ctx.getPosition().x)<.001)}else{startFrames();ctx.onPosition()}
  return true;
 }
 function renderPosition(x){
  const previous=ctx.getPosition().x,wanted=Math.max(4,Math.min(96,x)),next=ctx.constrainPosition?.(previous,wanted)??wanted;if(next===previous)return false;
  ctx.setPosition(next,GROUND);player.dataset.facing=next<previous?'left':'right';player.classList.add('walking');
  markPlaces();camera();ctx.onPosition();return true;
 }
 function startFrames(){movementOwner=ctx.getStudent()?.id;lastAt=performance.now();frame=requestAnimationFrame(tick)}
 function advance(time){
  const dt=Math.min(Math.max(0,(time-lastAt)/1000),.05);lastAt=time;
  const x=ctx.getPosition().x,dir=direction(),distance=dt*WALK_SPEED/Math.max(1,stage.clientWidth)*100;
  const diff=dir?dir:target-x,step=dir?dir*distance:Math.sign(diff)*Math.min(Math.abs(diff),distance);
  renderPosition(x+step);
  if(dir)return dir<0?ctx.getPosition().x<=4:ctx.getPosition().x>=96;
  const arrived=Math.abs(target-ctx.getPosition().x)<.001;if(arrived)renderPosition(target);return arrived||!player.hasAttribute('data-jumping')&&Math.abs(step)>.00001&&Math.abs(ctx.getPosition().x-x)<.00001&&'blocked';
 }
 function tick(time){
  frame=0;if(!canWalk()||movementOwner!==ctx.getStudent()?.id||!heldDirections.size&&target===null){stop();return}
  const result=advance(time);if(result){stop(result!=='blocked'&&!heldDirections.size);return}frame=requestAnimationFrame(tick);
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
  player.replaceChildren(body);const name=doc.createElement('span');name.className='campus-player-name';name.textContent=ctx.getStudent()?.nickname||'나의 모험가';name.title=name.textContent;player.append(name);nameplates.schedule();
 }
 function background(){
  const room=ctx.getScene(),request=++imageRequest,url=room==='classroom'?'maps/classroom-panorama-v1.webp':room==='hallway'?HALLWAY_BACKGROUND:PAINTED_PLACES[room]?.background||(room==='library'?'maps/library-panorama-v1.webp':EXTRA_ROOMS[room]?'maps/'+room+'-walk.svg':'maps/'+room+'-tall-'+(room==='library'?'v2':'v1')+'.webp'),img=new Image();
  status.hidden=false;status.textContent='학교 풍경을 펼치는 중…';
  img.onload=()=>{if(request!==imageRequest)return;stage.style.backgroundImage='url("'+url+'")';stage.style.setProperty('--campus-room-art','url("'+url+'")');status.hidden=true};
  img.onerror=()=>{if(request!==imageRequest)return;status.innerHTML='<span>풍경을 아직 불러오지 못했어요.</span><button type="button">다시 보기</button>';status.querySelector('button').onclick=background};img.src=url;
 }
 function syncScene(){
  const next=ctx.getScene();if(scene===next&&objects.querySelector('[data-place]')){rig();measureApproaches();camera();markPlaces();return}
  stop();scene=next;hub.classList.toggle('campus-classroom-wide',next==='classroom');hub.classList.toggle('campus-wide',!!EXTRA_ROOMS[next]);hub.classList.toggle('campus-painted-place',!!PAINTED_PLACES[next]);hub.classList.toggle('campus-library-wide',next==='library');hub.classList.toggle('campus-hallway-wide',next==='hallway');ctx.setPosition(EXTRA_ROOMS[next]?12:next==='library'?36:44,GROUND);objects.replaceChildren();
  for(const p of currentPlaces(true)){
   const b=doc.createElement('button');b.className=p.kind==='tori'?'campus-place campus-tori':'campus-place';b.dataset.place=p.kind;b.style.left=p.x+'%';
   if(decorateFlowerbed(b,p)){}else if(decorateTrioObject(b,p)){}else if(p.kind==='pencil')decorateMomoPencil(b);else if(next==='hallway'&&decorateHallwayObject(b,p)){}else if(p.door)decorateRoomDoor(b,p,next==='library'||next==='cafeteria');else if(p.kind==='nook'){b.classList.add('campus-nook');b.dataset.walkX=p.x;b.dataset.action='살펴보기';b.setAttribute('aria-label','창가 쉼터 · 살펴보기');b.innerHTML='<span class="campus-object-caption"><b>🌿 창가 쉼터</b><small class="campus-object-action">↗ 살펴보기</small></span>'}else if(decoratePlaceProp(b,p,next)){}else if(EXTRA_ROOMS[next]){b.classList.add('campus-world-object');const title=doc.createElement('b');title.textContent=p.label;b.append(title);b.dataset.walkX=p.x;b.setAttribute('aria-label',p.label+' · 살펴보기')}else decorateCampusObject(b,p,next,ctx.tori);
   if(next==='library'&&['reading','portfolio','tori'].includes(p.kind))b.style.left=p.x+'%';
   if(p.kind==='tori')b.dataset.cameraPair='true';
   const tag=b.querySelector('.campus-object-caption');if(tag){b.dataset.groundLabel='true';const title=tag.querySelector('b');if(title)title.textContent=title.textContent.replace(/^\p{Extended_Pictographic}[\uFE0F\u200D\p{Extended_Pictographic}]*\s*/u,'')}
   b.onclick=()=>{stop();if(b.classList.contains('campus-npc')||b.dataset.upOnly==='true'){doc.getElementById('campusTitle').focus({preventScroll:true});return}if(nearby()?.kind===p.kind)ctx.interact(p.kind);else doc.getElementById('campusTitle').focus({preventScroll:true})};objects.append(b);
  }
  rig();measureApproaches();background();hub.scrollTop=0;camera();markPlaces();ctx.onPosition();
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
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){renderPosition(target);stop(Math.abs(target-ctx.getPosition().x)<.001)}else startFrames();
 });
 // Pointer focus must not move a target out from under the pending tap/click.
 stage.addEventListener('focusin',e=>{const p=e.target.closest('[data-place]');if(p?.matches(':focus-visible'))camera(Number(p.dataset.walkX))});
 new ResizeObserver(()=>{hub.scrollTop=0;measureApproaches();if(destination&&approachSide){const arrival=approachTarget(destination,approachSide);target=arrival.x;approachSide=arrival.side;waypoint.show(target)}camera();markPlaces();ctx.onPosition()}).observe(viewport);
 new MutationObserver(rig).observe(player,{childList:true});
 window.addEventListener('blur',stop);window.addEventListener('pagehide',stop);doc.addEventListener('visibilitychange',stop);
 let studentId=ctx.getStudent()?.id;doc.addEventListener('student-dashboard-updated',()=>{const next=ctx.getStudent()?.id;if(next!==studentId)stop();studentId=next});
 return {syncScene,nearby,nearest,stop,hold,release,nudge,camera,goTo,goToPoint,destination:()=>destination,places:room=>(PLACES[room]||[]).filter(p=>!['pencil','parcel','notice','trio-clue-color','trio-clue-motif','trio-books'].includes(p.kind)&&(p.kind!=='parcel'||!ctx.isParcelCollected?.())&&(p.kind!=='pencil'||ctx.isMomoPencilVisible?.())&&ctx.isTrioPlaceVisible?.(p.kind)!==false)};
}
