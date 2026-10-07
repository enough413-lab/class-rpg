import {installCampusStory} from './campus-story.js?v=20261007-world';
import {EXTRA_ROOMS,WORLD_DETAILS} from './school-walking-places.js?v=20261007-world';
import {installParcelAdventure} from './parcel-adventure.js?v=20261007-world';
import {installSchoolWalk} from './school-walk.js?v=20261007-world';
import {installCampusMemory} from './campus-memory.js?v=20261007-journey';
import {installCampusNpcs} from './campus-npcs.js?v=20261007-world';
import {installCampusWayfinder} from './campus-wayfinder.js?v=20261007-parcel';
// Walking scenes stay a doorway to school activities; they never award XP or gold.
const TORI='<img src="maps/npcs/tori-v1.webp" alt="" width="115" height="165">';
const SCENES={classroom:{name:'우리 교실',hint:'선생님과 모모에게 말을 걸고, 옷장과 진열장을 살펴봐요.',routes:[['hallway','🚪 복도']]},hallway:{name:'별빛 복도',hint:'가고 싶은 문을 누르거나 가까이 걸어가 보세요.',routes:[['classroom','🏫 교실'],['library','📚 도서관']]},library:{name:'이야기 도서관',hint:'책지기 토리와 오늘 읽은 이야기를 나눠요.',routes:[['hallway','🚪 복도'],['reading','✍️ 독서 기록']]}};
for(const [id,room] of Object.entries(EXTRA_ROOMS))SCENES[id]={name:room.name,hint:'길을 따라 걸으며 물건과 이야기를 발견해요.',routes:[['hallway','🚪 복도로 가기']]};
export function installStudentCampus(ctx){
 const doc=document,hub=doc.getElementById('classroomHub');if(!hub)return;
 const shell=hub.querySelector('.hub-shell'),stage=hub.querySelector('.hub-stage'),objects=doc.getElementById('hubSceneObjects');
 hub.classList.add('campus-walk');hub.setAttribute('role','dialog');hub.setAttribute('aria-modal','true');hub.setAttribute('aria-labelledby','campusTitle');
 const header=doc.createElement('header');header.className='campus-header';
 header.innerHTML='<div><span class="campus-eyebrow">우리 학교 산책</span><h2 id="campusTitle" tabindex="-1"></h2><p id="campusHint"></p></div><div class="campus-menu"><button data-campus="find">길 찾기</button><button data-campus="map">탐험 지도</button><button data-campus="home">내 화면으로</button></div>';
 shell.prepend(header);header.firstElementChild.append(doc.getElementById('hubStatus'));hub.querySelector('.hub-top').remove();
 const footer=hub.querySelector('.hub-help');footer.innerHTML='<nav class="campus-routes" aria-label="다른 장소로 이동"></nav><div class="campus-controller"><div class="campus-pad" role="group" aria-label="캐릭터 이동"><button data-move="-1,0" aria-label="왼쪽으로 이동">←</button><button data-move="1,0" aria-label="오른쪽으로 이동">→</button></div><div class="campus-near"><p id="campusNear" role="status" aria-live="polite"></p><button data-campus="use" disabled>가까이 가 보세요</button></div></div><p class="campus-how">← → 버튼을 누르고 걷거나, 가고 싶은 바닥을 눌러요.<br><span>키보드: ← → 걷기 · ↑ 또는 E로 말 걸기 · Esc로 나가기</span><br><span>이 기기에서는 마지막 산책 자리부터 이어져요.</span></p>';
 const guide=doc.createElement('dialog');guide.id='campusGuide';guide.className='campus-guide';guide.setAttribute('aria-labelledby','campusGuideTitle');
 guide.innerHTML='<div class="campus-guide-top"><span>이야기 도서관 · 책지기</span><button data-guide="close" autofocus>닫기</button></div><div class="campus-greeting"><div class="campus-portrait">'+TORI+'</div><div><h2 id="campusGuideTitle">안녕! 나는 토리야.</h2><p>책 속에서 마음에 남은 장면이 있니?<br>왜 그 장면이 좋았는지 함께 생각해 보자.</p></div></div><div class="campus-guide-choices"><button data-guide="reading"><b>✍️ 책 이야기 기록하기</b><span>모든 레벨 · 내가 쓴 글과 선생님 답장도 봐요.</span></button><button data-guide="parcel"><b>📦 꾸러미 의뢰 듣기</b><span>Lv.16부터 · 찾은 표식의 주인을 만나요.</span></button><button data-guide="evidence"><b>🔎 책 속 단서 찾기</b><span>Lv. 11부터 · 시작한 탐험은 계속할 수 있어요.</span></button></div><div class="campus-real"><b>오늘 학교에서 해 볼까?</b><p>친구에게 좋아하는 장면 하나를 소개해 줘.<br>“나는 이 장면이 좋아. 왜냐하면…” 하고 말해 봐!</p></div><button class="campus-return" data-guide="close">도서관으로 돌아가기</button>';
 guide.querySelector('.campus-portrait img').onerror=()=>{guide.querySelector('.campus-portrait').hidden=true};
 doc.body.append(guide);
 const story=installCampusStory({objects,guide});
 const people=installCampusNpcs({hub});
 let timer=null,held=null,returnFocus=null,lastScene='',isOpen=false,memory=null;
 const open=()=>!hub.classList.contains('hidden');
 const overlay=()=>doc.querySelector('dialog[open],.modal-backdrop:not(.hidden):not(#schoolExplorerModal),.reward-notice-backdrop');
 function stop(){clearInterval(timer);timer=null;held=null}
 function syncNear(){
  if(!open())return;const near=walk.nearby(),closest=walk.nearest(),destination=walk.destination(),action=footer.querySelector('[data-campus=use]');
  memory?.capture();
  const direction=closest.x<ctx.getPosition().x?'왼쪽':'오른쪽';
  const hint=destination?destination.label+' 쪽으로 걷고 있어요.':near?'도착! 아래 버튼으로 살펴봐요.':direction+'을 살펴봐요 · '+closest.label;
  if(doc.getElementById('campusNear').textContent!==hint)doc.getElementById('campusNear').textContent=hint;
  action.disabled=false;const label=destination?'잠깐 멈추기':near?near.label:direction+'으로 안내받기';
  if(action.textContent!==label)action.textContent=label;
  action.dataset.state=destination?'walking':near?'arrived':'guide';
 }
 function syncScene(){
  stop();const scene=ctx.getScene(),info=SCENES[scene]||SCENES.classroom;hub.dataset.scene=scene;
  doc.getElementById('campusTitle').textContent=info.name;doc.getElementById('campusHint').textContent=info.hint;
  footer.querySelector('.campus-routes').innerHTML=info.routes.map(([id,label])=>'<button data-route="'+id+'">'+label+'</button>').join('')+'<button data-route="story">📖 이야기</button>';
  walk.syncScene();
  if(open()&&lastScene!==scene)doc.getElementById('campusTitle').focus({preventScroll:true});lastScene=scene;syncNear();
 }
 function talk(){stop();guide.dataset.inspection='false';doc.getElementById('campusGuideTitle').textContent='책지기 토리';guide.querySelector('.campus-greeting p').textContent='책에서 마음에 남은 장면이 있니? 함께 이야기해 보자.';guide.querySelector('.campus-portrait').hidden=false;guide.querySelector('.campus-guide-top span').textContent='이야기 도서관 · 책지기';guide.querySelector('.campus-guide-choices').hidden=false;guide.querySelector('.campus-real').hidden=true;story.refresh();if(open()&&!guide.open)guide.showModal()}
 function syncOpen(){
  if(isOpen===open())return;isOpen=open();stop();walk.stop();
  if(isOpen){returnFocus=doc.activeElement;syncScene();memory?.resume(false);doc.getElementById('campusTitle').focus({preventScroll:true})}
  else{memory?.flush();if(guide.open)guide.close();if(returnFocus?.isConnected&&returnFocus.getClientRects().length)returnFocus.focus({preventScroll:true})}
 }
 let parcel=null;
 function interact(kind){
  if(kind==='story'){stop();walk.stop();window.studentAdventure.chapter(ctx.getScene());return}
  if(kind.startsWith('look-')){stop();walk.stop();guide.dataset.inspection='true';const room=ctx.getScene(),i=Number(kind.slice(5));doc.getElementById('campusGuideTitle').textContent=EXTRA_ROOMS[room].props[i];guide.querySelector('.campus-greeting p').textContent=WORLD_DETAILS[room][i];guide.querySelector('.campus-portrait').hidden=true;guide.querySelector('.campus-guide-top span').textContent=SCENES[room].name;guide.querySelector('.campus-guide-choices').hidden=true;guide.querySelector('.campus-real').hidden=true;guide.showModal();return}
  if(['parcel','notice'].includes(kind))return parcel.inspect(kind);
  if(kind==='tori')return talk();
  if(['quests','shop'].includes(kind))return people.talk(kind);
  if(['classroom','hallway','library'].includes(kind))return window.enterHubScene(kind);
  if(['reading','portfolio'].includes(kind))return window.openReadingPortfolio();
  return window.hubInteract(kind);
 }
 const walk=installSchoolWalk({...ctx,hub,stage,objects,tori:TORI,interact,onPosition:syncNear,isParcelCollected:()=>parcel?.collected()});
 parcel=installParcelAdventure({...ctx,hub,objects,walk,viewport:stage.parentElement,stopMovement:()=>{stop();walk.stop()},onProgress:state=>{story.render(state);if(parcel)syncNear()}});
 memory=installCampusMemory({getStudent:ctx.getStudent,getSpot:()=>({room:ctx.getScene(),x:ctx.getPosition().x}),restore:spot=>{window.enterHubScene(spot.room);syncScene();ctx.setPosition(spot.x,80);walk.camera();syncNear()},doc});
 // A direct room/quest link keeps its destination. Only the general walk entry resumes.
 const openCampus=window.openClassroomHub;
 window.openClassroomHub=(...args)=>{memory.flush();openCampus(...args);syncScene();memory.resume(true,true)};
 doc.addEventListener('student-dashboard-updated',()=>{memory.activate();if(open())memory.resume()});
 const wayfinder=installCampusWayfinder({rooms:SCENES,walk,stop,getScene:ctx.getScene,isOpen:open});
 window.hubUseNearby=()=>{const near=walk.nearby();if(near){stop();walk.stop();interact(near.kind)}};
 hub.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.move&&event.detail===0&&!overlay())window.moveHub(...b.dataset.move.split(',').map(Number));
  const route=b.dataset.route;if(route){stop();if(route==='story'){walk.stop();window.studentAdventure.chapter(ctx.getScene())}else if(route==='reading')window.openReadingPortfolio();else window.enterHubScene(route)}
  if(b.dataset.campus==='use'){stop();if(walk.destination())walk.stop();else if(walk.nearby())window.hubUseNearby();else walk.goTo(walk.nearest().kind)}
  if(b.dataset.campus==='find')wayfinder.open();
  if(b.dataset.campus==='home')window.closeClassroomHub();
  if(b.dataset.campus==='map'){stop();walk.stop();window.studentAdventure.map()}
 });
 footer.addEventListener('pointerdown',event=>{
  const b=event.target.closest('[data-move]');if(!b||event.button!==0||overlay())return;
  event.preventDefault();stop();b.focus({preventScroll:true});held=event.pointerId;b.setPointerCapture(event.pointerId);
  const direction=b.dataset.move.split(',').map(Number);window.moveHub(...direction);
  timer=setInterval(()=>{if(!open()||overlay()||doc.hidden){stop();return}window.moveHub(...direction)},140);
 });
 for(const event of ['pointerup','pointercancel','lostpointercapture'])footer.addEventListener(event,e=>{if(e.pointerId===held)stop()});
 window.addEventListener('blur',stop);doc.addEventListener('visibilitychange',stop);
 guide.addEventListener('click',event=>{
  const action=event.target.closest('[data-guide]')?.dataset.guide;if(!action)return;guide.close();
  if(action==='reading')window.openReadingPortfolio();
  if(action==='parcel')parcel.inspect('tori');
  if(action==='evidence')window.studentAdventure.workshop('library-evidence');
 });
 // Keep keyboard focus in the walking scene, while leaving nested dialogs in charge.
 window.addEventListener('keydown',event=>{
  if(event.key!=='Tab'||!open()||overlay())return;
  const buttons=[...hub.querySelectorAll('button')].filter(b=>!b.disabled&&b.getClientRects().length);
  const first=buttons[0],last=buttons.at(-1),active=doc.activeElement;
  if(!hub.contains(active)||event.shiftKey&&(active===first||active.id==='campusTitle')||!event.shiftKey&&(active===last||active.id==='campusTitle')){
   event.preventDefault();event.stopImmediatePropagation();(event.shiftKey?last:first)?.focus();
  }
 },true);
 new MutationObserver(syncScene).observe(objects,{childList:true});
 new MutationObserver(syncNear).observe(doc.getElementById('hubPlayer'),{attributes:true,attributeFilter:['style']});
 new MutationObserver(syncOpen).observe(hub,{attributes:true,attributeFilter:['class']});
 syncScene();syncOpen();
 return {talk,find:wayfinder.open,parcel};
}
