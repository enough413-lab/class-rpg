import {installQuestSigns} from './campus-quest-signs.js?v=20261019-butterfly';
import {installFlowerbed} from './campus-flowerbed.js?v=20261019-butterfly';
import {installNpcTrio} from './npc-trio.js?v=20261020-aim-recall';
import {installCurrentGoal} from './campus-current-goal.js?v=20261019-butterfly';
import {installPlaygroundPlatforms} from './playground-platforms.js?v=20261014-platforms';
import {installToriLeafFavor} from './tori-leaf-favor.js?v=20261019-controls';
import {installPondNotebook} from './pond-notebook.js?v=20261014-leaf-favor';
import {installPondViewer} from './pond-viewer.js?v=20261014-viewer';
import {installPondFence} from './pond-fence.js?v=20261013-fence';
import {installPlaygroundBall} from './playground-ball.js?v=20261013-ball';
import {installPlaygroundCheer} from './playground-cheer.js?v=20261013-cheer';
import {installPlaygroundMat} from './playground-mat.js?v=20261013-mat';
import {installGardenBench} from './garden-bench.js?v=20261013-bench';
import {installGardenSprout} from './garden-sprout.js?v=20261013-sprout';
import {installLibraryNook} from './library-nook.js?v=20261012-nook';
import {installGardenCare} from './garden-care.js?v=20261013-sprout';
import {installMomoFavor} from './momo-favor.js?v=20261019-controls';
import {installCampusJump} from './campus-jump.js?v=20261019-controls';
import {installCafeteriaPlay} from './cafeteria-play.js?v=20261014-meal-sync';
import {campusIcon} from './campus-icons.js?v=20261012-icons';
import {roomDoors} from './school-connections.js?v=20261008-paths';
import {installGardenLetter} from './garden-letter.js?v=20261020-anime';
import {installCampusStory} from './campus-story.js?v=20261014-leaf-favor';
import {EXTRA_ROOMS,WORLD_DETAILS} from './school-walking-places.js?v=20261008-names';
import {installParcelAdventure} from './parcel-adventure.js?v=20261020-anime';
import {installSchoolWalk} from './school-walk.js?v=20261020-tori-shelf';
import {installCampusMemory} from './campus-memory.js?v=20261014-spot-save';
import {installCampusNpcs} from './campus-npcs.js?v=20261020-anime';
import {installCampusWayfinder} from './campus-wayfinder.js?v=20261012-classroom-interactions';
// Walking scenes stay a doorway to school activities; they never award XP or gold.
const TORI_GREETING='<img src="maps/npcs/tori-anime-v2.webp" alt="" width="115" height="165">';
const TORI='<img src="maps/npcs/tori-anime-v2.webp" alt="" width="115" height="165">';
const SCENES={classroom:{name:'우리 교실',hint:'선생님과 모모에게 말을 걸고, 옷장과 진열장을 살펴봐요.',routes:[['hallway','🚪 복도']]},hallway:{name:'별빛 복도',hint:'왼쪽은 우리 교실, 오른쪽은 도서관이에요. 긴 창가를 따라 걸어 봐요.',routes:[['classroom','🏫 교실'],['library','📚 도서관']]},library:{name:'이야기 도서관',hint:'오른쪽 창가를 지나면 정원으로 이어져요. 토리와 이야기도 나눠요.',routes:[['hallway','← 복도'],['garden','정원 →']]}};
for(const [id,room] of Object.entries(EXTRA_ROOMS))SCENES[id]={name:room.name,hint:'길을 따라 걸으며 물건과 이야기를 발견해요.',routes:roomDoors(id).map(p=>[p.kind,p.label])};
export function installStudentCampus(ctx){
 const doc=document,hub=doc.getElementById('classroomHub');if(!hub)return;
 const shell=hub.querySelector('.hub-shell'),stage=hub.querySelector('.hub-stage'),objects=doc.getElementById('hubSceneObjects');
 hub.classList.add('campus-walk');hub.setAttribute('role','dialog');hub.setAttribute('aria-modal','true');hub.setAttribute('aria-labelledby','campusTitle');
 const header=doc.createElement('header');header.className='campus-header';
 header.innerHTML='<div><span class="campus-eyebrow">우리 학교 산책</span><h2 id="campusTitle" tabindex="-1"></h2><p id="campusHint"></p></div><div class="campus-menu"><button data-campus="find" aria-label="길 찾기"><span class="hud-icon" aria-hidden="true">'+campusIcon('find')+'</span>길 찾기</button><button data-campus="map" aria-label="탐험 지도"><span class="hud-icon" aria-hidden="true">'+campusIcon('map')+'</span>지도</button><button data-campus="home" aria-label="내 화면으로"><span class="hud-icon" aria-hidden="true">'+campusIcon('home')+'</span>내 화면</button></div>';
 shell.prepend(header);header.firstElementChild.append(doc.getElementById('hubStatus'));hub.querySelector('.hub-top').remove();
 const wallet=doc.createElement('span');wallet.className='campus-wallet';wallet.setAttribute('aria-label','내 레벨과 골드');header.firstElementChild.append(wallet);
 function syncHud(){const s=ctx.getStudent(),text=s?'Lv. '+ctx.levelInfo(s.xp||0).level+' · '+Number(s.gold||0).toLocaleString('ko-KR')+' G':'';if(wallet.textContent!==text)wallet.textContent=text}
 new MutationObserver(syncHud).observe(doc.getElementById('hubStatus'),{childList:true,characterData:true,subtree:true});
 doc.addEventListener('student-dashboard-updated',syncHud);syncHud();
 const footer=hub.querySelector('.hub-help');footer.innerHTML='<nav class="campus-routes" aria-label="다른 장소로 이동"></nav><div class="campus-controller"><div class="campus-pad" role="group" aria-label="캐릭터 이동"><button data-move="-1,0" aria-label="왼쪽으로 이동">←</button><button data-move="1,0" aria-label="오른쪽으로 이동">→</button><button type="button" data-campus="jump" aria-label="점프 · Space를 길게 누르면 연속 점프">점프</button></div><div class="campus-near"><p id="campusNear" role="status" aria-live="polite"></p><button data-campus="use" disabled>가까이 가 보세요</button></div></div><p class="campus-how">← → 버튼을 누르고 걷거나, 가고 싶은 바닥을 눌러요.<br><span>키보드: ← → 걷기 · ↑로 말 걸기 · Esc로 나가기</span><br><span>이 기기에서는 마지막 산책 자리부터 이어져요.</span></p>';
 footer.append(footer.querySelector('.campus-routes'));footer.append(footer.querySelector('.campus-how'));
 footer.querySelector('.campus-how').textContent='← → 걷기 · Space 길게: 연속 점프 · ↑ 말 걸기 / 살펴보기';
 const memoryNotice=doc.createElement('div');memoryNotice.className='campus-memory-notice';memoryNotice.hidden=true;
 memoryNotice.innerHTML='<p id="campusMemoryStatus" role="status" aria-live="polite" aria-atomic="true"></p><button type="button" aria-describedby="campusMemoryStatus">다시 시도</button>';
 footer.append(memoryNotice);let memoryNoticeTimer=0;
 const memoryRetry=memoryNotice.querySelector('button');memoryRetry.addEventListener('click',()=>memory?.retry());
 function memoryStatus(state){
  clearTimeout(memoryNoticeTimer);memoryNotice.dataset.state=state;memoryNotice.hidden=state==='idle';
  const failed=state.endsWith('error');
  if(!failed&&doc.activeElement===memoryRetry)doc.getElementById('campusTitle').focus({preventScroll:true});
  memoryRetry.hidden=!failed;memoryRetry.setAttribute('aria-label',state==='load-error'?'지난 산책 자리 다시 불러오기':'이 기기에 산책 자리 다시 저장');
  memoryNotice.querySelector('p').innerHTML=state==='save-error'?'<b>산책 자리 저장 실패</b><span>계속 걸어도 괜찮아요.</span>':state==='load-error'?'<b>지난 산책 자리 읽기 실패</b><span>지금은 교실에서 시작해요.</span>':state==='saved'?'이 기기에 산책 자리를 저장했어요.':'';
  if(state==='saved')memoryNoticeTimer=setTimeout(()=>{memoryNotice.hidden=true},4000);
 }
 const guide=doc.createElement('dialog');guide.id='campusGuide';guide.className='campus-guide';guide.setAttribute('aria-labelledby','campusGuideTitle');
 guide.innerHTML='<div class="campus-guide-top"><span>이야기 도서관 · 책지기</span><button data-guide="close" autofocus>닫기</button></div><div class="campus-greeting"><span class="game-speaker-name">책지기 토리</span><div class="campus-portrait">'+TORI_GREETING+'</div><div><h2 id="campusGuideTitle">안녕! 나는 토리야.</h2><p>마음에 남은 책이 있니?<br>오늘은 어떤 이야기를 나눠 볼까?</p></div></div><div class="campus-guide-choices"><button data-guide="reading"><b>✍️ 책 이야기 쓰기</b><span>모든 레벨 · 내가 쓴 글과 선생님 답장도 봐요.</span></button><button data-guide="parcel"><b>📦 책 꾸러미 이야기</b><span>Lv.16부터 · 찾은 표식의 주인을 만나요.</span></button><button data-guide="letter"><b>🌿 새싹 이야기</b><span>Lv.19부터 · 정원에서 관찰 편지를 만들어요.</span></button><button data-guide="evidence"><b>🔎 책 속 단서 찾기</b><span>Lv. 11부터 · 시작한 탐험은 계속할 수 있어요.</span></button></div><div class="campus-real"><b>오늘 학교에서 해 볼까?</b><p>친구에게 좋아하는 장면 하나를 소개해 줘.<br>“나는 이 장면이 좋아. 왜냐하면…” 하고 말해 봐!</p></div><button class="campus-return" data-guide="close">다음에 또 이야기하자!</button>';
 const toriPortrait=guide.querySelector('.campus-portrait img');toriPortrait.onerror=()=>{if(!toriPortrait.dataset.fallback){toriPortrait.dataset.fallback='true';toriPortrait.src='maps/npcs/tori-anime-v2.webp'}else guide.querySelector('.campus-portrait').hidden=true};
 doc.body.append(guide);
 const story=installCampusStory({objects,guide});
 const people=installCampusNpcs({hub,getParcelStatus:()=>parcel?.snapshot(),getStudent:ctx.getStudent,getToken:ctx.getToken,levelInfo:ctx.levelInfo,getMomo:()=>momo?.dialogue(),onMomoAction:a=>momo?.action(a),onVisitMomo:()=>{stop();doc.getElementById('campusTitle').focus({preventScroll:true})}});
 let held=null,returnFocus=null,lastScene='',isOpen=false,memory=null;
 const open=()=>!hub.classList.contains('hidden');
 const overlay=()=>doc.querySelector('dialog[open],.modal-backdrop:not(.hidden):not(#schoolExplorerModal),.reward-notice-backdrop');
 function stop(){held=null;walk.stop()}
 function syncNear(){
  if(!open())return;const near=walk.nearby(),closest=(walk.nearby()?walk.nearest():(momo?.goal()||walk.nearest())),destination=walk.destination(),action=footer.querySelector('[data-campus=use]');
  memory?.capture();flowerbed?.sync();trio?.sync();meal?.position();momo?.sync();gardenCare?.sync();nook?.sync();sprout?.sync();bench?.sync();mat?.sync();cheer?.sync();ball?.sync();fence?.sync();viewer?.sync();notebook?.sync();leafFavor?.sync();platforms?.sync();currentGoal?.refresh();signs?.sync();
  const direction=closest.x<ctx.getPosition().x?'왼쪽':'오른쪽';
  const hint=destination?destination.label+' 쪽으로 걷고 있어요.':near?'도착! 아래 버튼으로 살펴봐요.':direction+'을 살펴봐요 · '+closest.label;
  if(doc.getElementById('campusNear').textContent!==hint)doc.getElementById('campusNear').textContent=hint;
  action.disabled=false;const label=destination?'잠깐 멈추기':near?(notebook?.label(near.kind)||viewer?.label(near.kind)||fence?.label(near.kind)||ball?.label(near.kind)||cheer?.label(near.kind)||mat?.label(near.kind)||bench?.label(near.kind)||sprout?.label(near.kind)||nook?.label(near.kind)||gardenCare?.label(near.kind)||meal?.label(near.kind)||objects.querySelector('[data-place="'+near.kind+'"]')?.dataset.action||near.label):'가까이 걸어와 ↑ 살펴보기';
  const resident=near&&objects.querySelector('[data-place="'+near.kind+'"].campus-npc'),name=resident?.querySelector('.campus-object-caption b')?.textContent||resident?.querySelector('.trio-name')?.textContent;const caption=name?'↑ '+name.replace(/^(문구지기 |책지기 )/,'')+'에게 말 걸기':near?'↑ '+label.replace(/^\p{Extended_Pictographic}[\uFE0F\u200D\p{Extended_Pictographic}]*\s*/u,''):label;if(action.textContent!==caption)action.textContent=caption;
  action.dataset.state=destination?'walking':near?'arrived':'guide';
 }
 function syncScene(){
  stop();const scene=ctx.getScene(),info=SCENES[scene]||SCENES.classroom;hub.dataset.scene=scene;
  doc.getElementById('campusTitle').textContent=info.name;doc.getElementById('campusHint').textContent=info.hint;
  footer.querySelector('.campus-routes').innerHTML=info.routes.map(([id,label])=>'<button data-route="'+id+'">'+label+'</button>').join('')+'<button data-route="story">📖 이야기</button>';
  walk.syncScene();
  if(open()&&lastScene!==scene)doc.getElementById('campusTitle').focus({preventScroll:true});lastScene=scene;syncNear();
 }
 function travel(to){
  const from=ctx.getScene();stop();window.enterHubScene(to);syncScene();
  if(ctx.getScene()!==to)return;
  const door=walk.places(to).find(p=>p.kind===from);if(!door)return;
  const facing=door.x<50?'right':'left',x=door.x+(door.x<50?6:-6);
  ctx.setPosition(x,80);doc.getElementById('hubPlayer').dataset.facing=facing;walk.camera();syncNear();
 }
 function talk(){stop();const notebook=guide.querySelector('.tori-notebook');if(notebook)notebook.open=false;guide.querySelector('.letter-inspect-link')?.remove();guide.dataset.inspection='false';guide.querySelector('.campus-return[data-guide=close]').textContent='다음에 또 이야기하자!';doc.getElementById('campusGuideTitle').textContent='책지기 토리';guide.querySelector('.campus-greeting p').textContent='책에서 마음에 남은 장면이 있니? 함께 이야기해 보자.';const portraitImage=guide.querySelector('.campus-portrait img');guide.querySelector('.campus-portrait').hidden=portraitImage.complete&&!portraitImage.naturalWidth;guide.querySelector('.campus-guide-top span').textContent='이야기 도서관 · 책지기';guide.querySelector('.campus-guide-choices').hidden=false;guide.querySelector('.campus-real').hidden=true;story.refresh();letter.refreshTori();if(open()&&!guide.open)guide.showModal()}
 function syncOpen(){
  if(isOpen===open())return;isOpen=open();stop();walk.stop();
  if(isOpen){returnFocus=doc.activeElement;syncScene();memory?.resume(false);doc.getElementById('campusTitle').focus({preventScroll:true})}
  else{memory?.flush();if(guide.open)guide.close();if(returnFocus?.isConnected&&returnFocus.getClientRects().length)returnFocus.focus({preventScroll:true})}
 }
 let signs=null,flowerbed=null,trio=null,currentGoal=null,parcel=null,letter=null,meal=null,momo=null,gardenCare=null,nook=null,sprout=null,bench=null,mat=null,cheer=null,ball=null,fence=null,viewer=null,notebook=null,leafFavor=null,platforms=null;
 function interact(kind){
  if(flowerbed?.interact(kind))return;
  if(trio?.interact(kind))return;
  if(notebook?.interact(kind))return;
  if(viewer?.interact(kind))return;
  if(fence?.interact(kind))return;
  if(ball?.interact(kind))return;
  if(cheer?.interact(kind))return;
  if(mat?.interact(kind))return;
  if(bench?.interact(kind))return;
  if(sprout?.interact(kind))return;
  if(nook?.interact(kind))return;
  if(gardenCare?.interact(kind))return;
  if(kind==='pencil')return momo?.inspect();
  if(meal?.interact(kind))return;
  if(kind==='story'){stop();walk.stop();window.studentAdventure.chapter(ctx.getScene());return}
  if(kind.startsWith('look-')){stop();walk.stop();guide.dataset.inspection='true';guide.querySelector('.campus-return[data-guide=close]').textContent='계속 둘러보기';const room=ctx.getScene(),i=Number(kind.slice(5));doc.getElementById('campusGuideTitle').textContent=EXTRA_ROOMS[room].props[i];guide.querySelector('.campus-greeting p').textContent=WORLD_DETAILS[room][i];guide.querySelector('.campus-portrait').hidden=true;guide.querySelector('.campus-guide-top span').textContent=SCENES[room].name;guide.querySelector('.campus-guide-choices').hidden=true;guide.querySelector('.campus-real').hidden=true;guide.querySelector('.letter-inspect-link')?.remove();if(room==='garden'&&i===0){const b=doc.createElement('button');b.className='campus-return letter-inspect-link';b.dataset.guide='letter-garden';b.textContent='🌿 새싹 관찰 편지 · Lv.19';guide.querySelector('.campus-greeting').after(b)}guide.showModal();return}
  if(['parcel','notice'].includes(kind))return parcel.inspect(kind);
  if(kind==='tori')return talk();
  if(['quests','shop'].includes(kind))return people.talk(kind);
  if(SCENES[kind])return travel(kind);
  if(kind==='reading')return window.openReadingDesk();
  if(kind==='portfolio')return window.openReadingShelf();
  return window.hubInteract(kind);
 }
 const walk=installSchoolWalk({...ctx,hub,stage,objects,tori:TORI,interact,onPosition:syncNear,isParcelCollected:()=>parcel?.collected(),isMomoPencilVisible:()=>momo?.visible(),isTrioPlaceVisible:kind=>trio?.visible(kind)??!['trio-clue-color','trio-clue-motif','trio-books'].includes(kind),constrainPosition:(a,b)=>platforms?.constrain(a,b)??b});
 const jump=installCampusJump({hub,getStudent:ctx.getStudent,getScene:ctx.getScene,getTerrain:()=>platforms,onMealJumpBlocked:()=>meal?.explainJump()});
 platforms=installPlaygroundPlatforms({...ctx,hub,stage,walk,stop,refresh:syncNear,jump:jump.jump,cancelJump:jump.cancel});
 momo=installMomoFavor({...ctx,hub,objects,walk,refresh:syncNear,onRequestAction:()=>currentGoal?.focus('momo')});
 gardenCare=installGardenCare({...ctx,hub,objects,walk,stop,refresh:syncNear});
 nook=installLibraryNook({...ctx,hub,stage,objects,walk,stop,refresh:syncNear});
 notebook=installPondNotebook({...ctx,hub,stage,objects,walk,stop,refresh:syncNear});
 viewer=installPondViewer({...ctx,hub,stage,objects,walk,stop,refresh:syncNear});
 fence=installPondFence({...ctx,hub,stage,objects,walk,stop,refresh:syncNear});
 ball=installPlaygroundBall({...ctx,hub,stage,objects,walk,stop,refresh:syncNear});
 cheer=installPlaygroundCheer({...ctx,hub,stage,objects,walk,stop,refresh:syncNear});
 mat=installPlaygroundMat({...ctx,hub,stage,objects,walk,stop,refresh:syncNear});
 bench=installGardenBench({...ctx,hub,stage,objects,walk,stop,refresh:syncNear});
  sprout=installGardenSprout({...ctx,hub,objects,walk,stop,refresh:syncNear,openLetter:()=>letter.start('garden')});
 meal=installCafeteriaPlay({...ctx,hub,walk,stop,refresh:syncNear});
 parcel=installParcelAdventure({onRequestAction:()=>currentGoal?.focus('parcel'),...ctx,hub,objects,walk,viewport:stage.parentElement,stopMovement:()=>{stop();walk.stop()},onProgress:state=>{story.render(state);letter?.refreshTori();people.refresh();if(parcel)syncNear()}});
 letter=installGardenLetter({onRequestAction:()=>currentGoal?.focus('letter'),onRequestUpdate:()=>currentGoal?.refresh(),...ctx,hub,guide,walk,stopMovement:()=>{stop();walk.stop()}});
 leafFavor=installToriLeafFavor({onRequestAction:()=>currentGoal?.focus('leaf'),...ctx,hub,objects,walk,guide,notebook,stop,refresh:syncNear,refreshStory:()=>story.refresh(),getParcelStatus:()=>parcel?.snapshot()});
 flowerbed=installFlowerbed({...ctx,hub,objects,walk,stop,onChange:()=>{currentGoal?.refresh();signs?.sync()},focusGoal:id=>currentGoal?.focus(id)});
 trio=installNpcTrio({...ctx,hub,stage,objects,walk,stop,refresh:syncNear,legacyTori:talk,visitFlowerbed:()=>doc.getElementById('campusTitle').focus({preventScroll:true}),flowerbedSummary:()=>flowerbed.summary(),flowerbedOffer:()=>flowerbed.offer(),flowerbedRequest:()=>flowerbed.request(),flowerbedAct:action=>flowerbed.act(action),focusGoal:id=>currentGoal?.focus(id)});
 currentGoal=installCurrentGoal({...ctx,hub,viewport:stage.parentElement,requests:()=>[...trio.requests(),flowerbed.request(),momo?.request(),leafFavor?.request(),parcel?.request(),letter?.request()],stop:()=>{stop();walk.stop()},openParcel:()=>parcel.start()});
 signs=installQuestSigns({hub,objects,requests:()=>[...trio.requests(),momo.request()],parcel:()=>parcel.snapshot(),trio:()=>trio.signs(),flowerbed:()=>flowerbed.request(),level:()=>ctx.levelInfo(ctx.getStudent()?.xp||0).level,momoPhase:()=>momo.dialogue().action==='momo-accept'?0:1});
 signs.sync();
 memory=installCampusMemory({getStudent:ctx.getStudent,getSpot:()=>({room:ctx.getScene(),x:ctx.getPosition().x}),restore:spot=>{window.enterHubScene(spot.room);syncScene();ctx.setPosition(spot.x,80);walk.camera();syncNear()},onStatus:memoryStatus,doc});
 // A direct room/quest link keeps its destination. Only the general walk entry resumes.
 const openCampus=window.openClassroomHub;
 window.openClassroomHub=(...args)=>{memory.flush();openCampus(...args);syncScene();memory.resume(true,true)};
 doc.addEventListener('student-dashboard-updated',()=>{memory.activate();if(open())memory.resume()});
 const wayfinder=installCampusWayfinder({rooms:SCENES,walk,stop,getScene:ctx.getScene,isOpen:open});
 window.hubUseNearby=()=>{const near=walk.nearby();if(near){stop();walk.stop();interact(near.kind)}};
 hub.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.move&&event.detail===0&&!overlay())walk.nudge(Number(b.dataset.move.split(',')[0]));
  const route=b.dataset.route;if(route){stop();if(route==='story'){walk.stop();window.studentAdventure.chapter(ctx.getScene())}else if(route==='reading')window.openReadingDesk();else travel(route)}
  if(b.dataset.campus==='use'){const traveling=!!walk.destination();stop();if(!traveling){if(walk.nearby())window.hubUseNearby();else doc.getElementById('campusTitle').focus({preventScroll:true})}}
  if(b.dataset.campus==='find')wayfinder.open();
  if(b.dataset.campus==='home')window.closeClassroomHub();
  if(b.dataset.campus==='map'){stop();walk.stop();window.studentAdventure.map()}
 });
 footer.addEventListener('pointerdown',event=>{
  const b=event.target.closest('[data-move]');if(!b||event.button!==0||held!==null||overlay())return;
  event.preventDefault();b.focus({preventScroll:true});held=event.pointerId;b.setPointerCapture(event.pointerId);
  walk.hold('pointer:'+held,Number(b.dataset.move.split(',')[0]));
 });
 for(const event of ['pointerup','pointercancel','lostpointercapture'])footer.addEventListener(event,e=>{if(e.pointerId===held){walk.release('pointer:'+held);held=null}});
 window.addEventListener('blur',stop);window.addEventListener('pagehide',stop);doc.addEventListener('visibilitychange',stop);
 window.addEventListener('keyup',event=>walk.release('key:'+event.key.toLowerCase()),true);
 guide.addEventListener('click',event=>{
  const action=event.target.closest('[data-guide]')?.dataset.guide;if(!action)return;guide.close();
  if(action==='reading')window.openReadingDesk();
  if(action==='parcel')parcel.inspect('tori');
  if(action==='letter')letter.start('tori');
  if(action==='letter-garden')letter.start('garden');
  if(action==='evidence')window.studentAdventure.workshop('library-evidence');
 });
 // Keep keyboard focus in the walking scene, while leaving nested dialogs in charge.
 window.addEventListener('keydown',event=>{
  if(event.key!=='Tab'||!open()||overlay())return;
  stop();
  const buttons=[...hub.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(b=>!b.disabled&&b.getClientRects().length);
  const first=buttons[0],last=buttons.at(-1),active=doc.activeElement;
  if(!hub.contains(active)||event.shiftKey&&(active===first||active.id==='campusTitle')||!event.shiftKey&&(active===last||active.id==='campusTitle')){
   event.preventDefault();event.stopImmediatePropagation();(event.shiftKey?last:first)?.focus();
  }
 },true);
 new MutationObserver(syncScene).observe(objects,{childList:true});
 new MutationObserver(syncNear).observe(doc.getElementById('hubPlayer'),{attributes:true,attributeFilter:['style']});
 new MutationObserver(syncOpen).observe(hub,{attributes:true,attributeFilter:['class']});
 syncScene();syncOpen();
 return {talk,find:wayfinder.open,parcel,letter,stop,keyDown:(key,dx,repeat)=>walk.hold('key:'+key,dx,repeat)};
}
