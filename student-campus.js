import {installSchoolWalk} from './school-walk.js?v=20261007-release';
import {installCampusNpcs} from './campus-npcs.js?v=20261007-release';
import {installCampusWayfinder} from './campus-wayfinder.js?v=20261007-release';
// Walking scenes stay a doorway to school activities; they never award XP or gold.
const TORI=`<svg viewBox="0 0 120 130" aria-hidden="true"><ellipse cx="60" cy="119" rx="36" ry="7" fill="#3c615b" opacity=".16"/><path d="M25 55 19 19 45 31Q60 22 75 31L101 19 95 55Q113 106 78 114H42Q7 106 25 55Z" fill="#bdcfa4" stroke="#486754" stroke-width="3"/><path d="M31 60Q29 36 47 39L60 49 73 39Q94 35 89 63L81 96H39Z" fill="#fff5d9"/><circle cx="45" cy="59" r="16" fill="#fffdf5" stroke="#637b60" stroke-width="2"/><circle cx="75" cy="59" r="16" fill="#fffdf5" stroke="#637b60" stroke-width="2"/><path d="M60 57h-1" stroke="#637b60" stroke-width="3"/><circle cx="46" cy="59" r="4" fill="#344c40"/><circle cx="74" cy="59" r="4" fill="#344c40"/><path d="m55 72 5 7 5-7" fill="#e5a448"/><path d="M29 85Q43 80 60 89Q76 80 91 85L88 110Q74 106 60 115Q45 106 32 110Z" fill="#eac691" stroke="#795e41" stroke-width="2"/><path d="M60 90v23M38 93l14 4M68 97l14-4M38 100l14 4" fill="none" stroke="#fff5d9" stroke-width="3"/><path d="M23 80q-10 18 12 21M97 80q10 18-12 21" fill="#a7c198" stroke="#486754" stroke-width="3"/></svg>`;
const SCENES={classroom:{name:'우리 교실',hint:'선생님과 모모에게 말을 걸고, 옷장과 진열장을 살펴봐요.',routes:[['hallway','🚪 복도 가기']]},hallway:{name:'별빛 복도',hint:'가고 싶은 문을 누르거나 가까이 걸어가 보세요.',routes:[['classroom','🏫 교실 가기'],['library','📚 도서관 가기']]},library:{name:'이야기 도서관',hint:'책지기 토리와 오늘 읽은 이야기를 나눠요.',routes:[['hallway','🚪 복도 가기'],['reading','✍️ 독서 기록 열기']]}};
export function installStudentCampus(ctx){
 const doc=document,hub=doc.getElementById('classroomHub');if(!hub)return;
 const shell=hub.querySelector('.hub-shell'),stage=hub.querySelector('.hub-stage'),objects=doc.getElementById('hubSceneObjects');
 hub.classList.add('campus-walk');hub.setAttribute('role','dialog');hub.setAttribute('aria-modal','true');hub.setAttribute('aria-labelledby','campusTitle');
 const header=doc.createElement('header');header.className='campus-header';
 header.innerHTML='<div><span class="campus-eyebrow">우리 학교 산책</span><h2 id="campusTitle" tabindex="-1"></h2><p id="campusHint"></p></div><div class="campus-menu"><button data-campus="find">길 찾기</button><button data-campus="map">탐험 지도</button><button data-campus="home">내 화면으로</button></div>';
 shell.prepend(header);header.firstElementChild.append(doc.getElementById('hubStatus'));hub.querySelector('.hub-top').remove();
 const footer=hub.querySelector('.hub-help');footer.innerHTML='<nav class="campus-routes" aria-label="다른 장소로 이동"></nav><div class="campus-controller"><div class="campus-pad" role="group" aria-label="캐릭터 이동"><button data-move="-1,0" aria-label="왼쪽으로 이동">←</button><button data-move="1,0" aria-label="오른쪽으로 이동">→</button></div><div class="campus-near"><p id="campusNear" role="status" aria-live="polite"></p><button data-campus="use" disabled>가까이 가 보세요</button></div></div><p class="campus-how">← → 버튼을 누르고 걷거나, 가고 싶은 바닥을 눌러요.<br><span>키보드: ← → 걷기 · ↑ 또는 E로 말 걸기 · Esc로 나가기</span></p>';
 const guide=doc.createElement('dialog');guide.id='campusGuide';guide.className='campus-guide';guide.setAttribute('aria-labelledby','campusGuideTitle');
 guide.innerHTML='<div class="campus-guide-top"><span>이야기 도서관 · 책지기</span><button data-guide="close" autofocus>닫기</button></div><div class="campus-greeting"><div class="campus-portrait">'+TORI+'</div><div><h2 id="campusGuideTitle">안녕! 나는 토리야.</h2><p>책 속에서 마음에 남은 장면이 있니?<br>왜 그 장면이 좋았는지 함께 생각해 보자.</p></div></div><div class="campus-guide-choices"><button data-guide="reading"><b>✍️ 읽은 책 이야기 남기기</b><span>모든 레벨 · 내가 쓴 글과 선생님 답장도 봐요.</span></button><button data-guide="evidence"><b>🔎 단서 탐험 살펴보기</b><span>Lv. 11부터 · 시작한 탐험은 계속할 수 있어요.</span></button></div><div class="campus-real"><b>오늘 학교에서 해 볼까?</b><p>친구에게 좋아하는 장면 하나를 소개해 줘.<br>“나는 이 장면이 좋아. 왜냐하면…” 하고 말해 봐!</p></div><button class="campus-return" data-guide="close">도서관으로 돌아가기</button>';
 doc.body.append(guide);
 const people=installCampusNpcs({hub});
 let timer=null,held=null,returnFocus=null,lastScene='',isOpen=false;
 const open=()=>!hub.classList.contains('hidden');
 const overlay=()=>doc.querySelector('dialog[open],.modal-backdrop:not(.hidden):not(#schoolExplorerModal),.reward-notice-backdrop');
 function stop(){clearInterval(timer);timer=null;held=null}
 function syncNear(){
  if(!open())return;const near=walk.nearby(),closest=walk.nearest(),destination=walk.destination(),action=footer.querySelector('[data-campus=use]');
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
  footer.querySelector('.campus-routes').innerHTML=info.routes.map(([id,label])=>'<button data-route="'+id+'">'+label+'</button>').join('');
  walk.syncScene();
  if(open()&&lastScene!==scene)doc.getElementById('campusTitle').focus({preventScroll:true});lastScene=scene;syncNear();
 }
 function talk(){stop();if(open()&&!guide.open)guide.showModal()}
 function syncOpen(){
  if(isOpen===open())return;isOpen=open();stop();walk.stop();
  if(isOpen){returnFocus=doc.activeElement;syncScene();doc.getElementById('campusTitle').focus({preventScroll:true})}
  else{if(guide.open)guide.close();if(returnFocus?.isConnected&&returnFocus.getClientRects().length)returnFocus.focus({preventScroll:true})}
 }
 function interact(kind){
  if(kind==='tori')return talk();
  if(['quests','shop'].includes(kind))return people.talk(kind);
  if(['classroom','hallway','library'].includes(kind))return window.enterHubScene(kind);
  if(['reading','portfolio'].includes(kind))return window.openReadingPortfolio();
  return window.hubInteract(kind);
 }
 const walk=installSchoolWalk({...ctx,hub,stage,objects,tori:TORI,interact,onPosition:syncNear});
 const wayfinder=installCampusWayfinder({rooms:SCENES,walk,stop,getScene:ctx.getScene,isOpen:open});
 window.hubUseNearby=()=>{const near=walk.nearby();if(near){stop();walk.stop();interact(near.kind)}};
 hub.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.move&&event.detail===0&&!overlay())window.moveHub(...b.dataset.move.split(',').map(Number));
  const route=b.dataset.route;if(route){stop();if(route==='reading')window.openReadingPortfolio();else window.enterHubScene(route)}
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
 return {talk,find:wayfinder.open};
}
