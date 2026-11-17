import {HARVEST_MS,harvestFrame,drawHarvest} from './school-life-harvest.js?v=20261117-harvest-motion';
import {createGardenStorage} from './school-life-garden-storage.js?v=20261117-harvest';
import {PLANT_MS,plantingFrame,drawPlanting} from './school-life-planting.js?v=20261117-plant';
import {selectedToolTarget,drawToolTarget} from './school-life-tool-target.js?v=20261117-plant';
import {createGroundStorage} from './school-life-ground-storage.js?v=20261117-plant';
import {groundCell,groundAllowed,groundObstructed,retainedFlowerSite} from './school-life-ground-map.js?v=20261117-plant';
import {residentUse} from './school-life-residents.js?v=20261117-residents';
import {workerScene,workerLayers} from './school-life-workers.js?v=20261112-workers';
import {createFacilityRepair,REPAIR_MS,constructionView,constructionLayers} from './school-life-repair.js?v=20261113-construction';
import {createDoorAction,drawDoorKey,DOOR_MS} from './school-life-door.js?v=20261112-door';
import {dustFrame,drawSweptDust,drawSweepingBroom} from './school-life-dust-sweep.js?v=20261112-dust';
import {weedMotion,drawWeedRoot,drawHeldWeed,drawWeedFragments} from './school-life-weed-pull.js?v=20261112-weed';
import {createFurnitureDepth} from './school-life-depth.js?v=20261112-depth';
import {createReaction} from './school-life-expression.js?v=20261112-expression';
import {faceTarget} from './school-life-facing.js?v=20261111-facing';
import {drawHeldTool,SPADE_SVG,HOE_SVG,toolTransform,TOOL_SHAPES} from './school-life-tools.js?v=20261117-plant';
import {createSeating} from './school-life-seat.js?v=20261111-sitting';
import {actionFrame,ACTION_MS} from './school-life-action.js?v=20261117-harvest-motion';
import {createLifeAvatar,SLOTS} from './school-life-avatar.js?v=20261112-door';
import {createSchoolStory} from './school-life-story.js?v=20261112-depth';
import {createSchoolWish} from './school-life-wish.js?v=20261110-memory';
import {createSchoolConversations} from './school-life-conversations.js?v=20261110-scenes';
import {createSchoolArrival} from './school-life-arrival.js?v=20261110-arrival';
import {createInvitationAction} from './school-life-invitation.js?v=20261110-arrival';
import {createSchoolMemories} from './school-life-memories.js?v=20261112-depth';
import {createLifePrologue} from './school-life-prologue.js?v=20261110-replay';
import {createLifeFeedback,drawWater,lookDirection,VECTORS} from './school-life-feedback.js?v=20261112-door';
import {installLifeNotebook} from './school-life-notebook.js?v=20261117-harvest';
import {createSchoolLifeSync} from './school-life-sync.js?v=20261113-construction';
import {installSchoolOpening} from './school-life-opening.js?v=20261117-residents';
import {freshLife,readLife,PROJECTS,WEEDS,BRANCHES,FLOWERS,DUST,FLOWER_NAMES,FISH_NAMES,projectRequirement} from './school-life-state.js?v=20261112-windows';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={leaf:'<path d="M6 25C1 9 17 3 29 4c0 15-6 27-19 23M6 29 23 11M14 21l-1-8m1 8 9-1"/>',bag:'<path d="M10 10V8a6 6 0 0 1 12 0v2M8 10h16l3 19H5zM6 17h20M12 19v4h8v-4"/>',book:'<path d="M16 8C11 4 6 4 3 5v22c4-1 8-1 13 2 5-3 9-3 13-2V5c-5-1-9-1-13 3v21M7 11h5m-5 5h5m8-5h5m-5 5h5"/>',map:'<path d="m3 7 9-3 9 3 8-3v23l-8 3-9-3-9 3zM12 4v23M21 7v23M5 20l4-5 7 4 9-8"/>',exit:'<path d="M13 4H5v25h8M14 9l8 7-8 7m-4-7h18"/>',sound:'<path d="m4 12 7 0 8-7v24l-8-8H4zM24 10c5 3 5 9 0 12"/>',flower:'<path d="M16 30V18m0 8-8-5m8 2 7-5"/><path fill="#efb4ab" d="M16 5c8-8 12 2 6 6 11 0 8 12 0 9 2 10-10 10-10 1-9 5-13-6-5-10-6-7 3-13 9-6Z"/><circle cx="16" cy="13" r="4" fill="#f5d374"/>',wood:'<path d="m6 29 6-14 0-11m0 16 12-9m-8 6 10 3M6 29l6 1 7-14"/>',fish:'<path d="M6 16c8-15 18-11 23 0-5 11-15 15-23 0L1 9v14z"/><circle cx="23" cy="14" r="1"/>'};
const svg=name=>`<svg viewBox="0 0 32 34" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.leaf}</svg>`;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function installSchoolLife(ctx){
 if(window.schoolLife)return window.schoolLife;
 const css=document.createElement('link');css.rel='stylesheet';css.href='./school-life.css?v=20261110-story';document.head.append(css);
 const host=document.createElement('dialog');host.id='schoolLife';host.setAttribute('aria-label','우리학교 다시, 봄');
 host.innerHTML=`<canvas id="lifeCanvas" aria-label="직접 걸어 다니는 학교 마을" tabindex="-1"></canvas><section class="life-title" id="lifeTitle"><div class="life-logo"><small>우리학교</small><h1>다시, <i>봄</i></h1></div><button class="life-start" id="lifeStart" disabled>불러오는 중…</button><p class="life-title-profile" id="lifeTitleProfile"></p><div class="life-title-note" id="lifeTitleNote">저장 기록 불러오는 중</div><div class="life-corner"><button class="life-round" data-life="sound" aria-label="소리 켜기" aria-pressed="false">${svg('sound')}</button><button class="life-round" data-life="exit" aria-label="학교생활 화면으로 나가기">${svg('exit')}</button></div></section><div class="life-hud" id="lifeHud" hidden><div class="life-place"><strong id="lifePlace"></strong><span id="lifeClock"></span></div><div class="life-level" id="lifeLevel"></div><button class="life-task" id="lifeTask" data-life="journal" aria-label="받은 부탁 펼치기"></button><div class="life-corner"><button class="life-round" data-life="bag" aria-label="도구 주머니">${svg('bag')}</button><button class="life-round" data-life="journal" aria-label="학교 수첩">${svg('book')}</button><button class="life-round" data-life="map" aria-label="학교 지도">${svg('map')}</button></div><div class="life-controls" aria-label="걷기"><button class="life-dir" data-dir="u" aria-label="위로 걷기">↑</button><button class="life-dir" data-dir="l" aria-label="왼쪽으로 걷기">←</button><button class="life-dir" data-dir="d" aria-label="아래로 걷기">↓</button><button class="life-dir" data-dir="r" aria-label="오른쪽으로 걷기">→</button></div><span class="life-name" id="lifePlayerName"></span><span class="life-name" id="lifeNpcName" hidden></span><div class="life-prompt" id="lifePrompt"></div><button class="life-use" id="lifeUse" hidden disabled aria-label="가까운 대상의 행동"><span id="lifeUseText"></span><small>E / Enter</small></button><button class="life-tool" id="lifeTool" hidden aria-label="물뿌리개 사용"><span>물 주기</span><small>E</small></button><div class="life-toast" id="lifeToast" role="status" hidden></div><div class="life-save-error" id="lifeSaveError" role="alert" hidden><span></span><button data-life="retry">다시 저장</button></div><div class="life-fish" id="lifeFish" hidden></div></div><div class="life-overlay" id="lifeOverlay" hidden></div><div class="life-sr" id="lifeAnnounce" role="status" aria-live="polite"></div>`;
 document.body.append(host);
 const $=id=>host.querySelector('#'+id),canvas=$('lifeCanvas'),g=canvas.getContext('2d'),overlay=$('lifeOverlay');
 let mode='title',state=freshLife(),owner='',ownerToken='',readError=false,saveError=false,cloudStatus='loading',ownWrite=false,pos={x:800,y:725},keys=new Set(),path=[],near=null,nearId='',frame=0,lastTime=0,clock=0,scene='room',facing=1,jump=0,moving=false,fish=null,effect=[],toastTimer=0,actionUntil=0,focusBack=null,audio=null,sound=false,audioTimer=0,stopped=false,heldTool='',gesture=null;
 let W=1,H=1,DPR=1,S=1,camera={x:0,y:0},assets={},assetsReady=false,assetError=false,avatar=[];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),feedback=createLifeFeedback(),playerAvatar=createLifeAvatar(),doorAction=createDoorAction(),repair=createFacilityRepair();
 const reactions=createReaction();let reactionView=null;
 function clearReaction(){reactions.clear();reactionView=null;$('lifeToast').style.visibility='';}
 function react(kind,delay=0){reactions.schedule(kind,performance.now(),delay);}
 const furnitureDepth=createFurnitureDepth();let depthOrder=[];
 const seating=createSeating();let seatedAvatarKey=null;
 let walkPhase=0,walkMoving=false,buildIntent=null;
 const construction=()=>cloud.store.snapshot()?.construction||null;
 const constructionDate=b=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric'}).format(new Date(b.due_at));
 let look='d',queuedToast=null,queuedArrival=null,replayOrigin=null;const arrivalsSeen=new Set();
 function laterToast(text,delay=950){queuedToast={text,at:performance.now()+delay,scene};}
 let blockedNotice=null,workControlsLocked=null;
 const gestureDuration=()=>gesture?.kind==='plant'?PLANT_MS:gesture?.kind==='harvest'?HARVEST_MS:ACTION_MS;
 function working(t=performance.now()){return garden.snapshot().status==='saving'||cloudStatus==='saving'&&!!buildIntent||repair.active(t,reduced.matches)||doorAction.active(t,reduced.matches)||!!gesture&&['weed','branch','dust','plant','water','window','dig','harvest'].includes(gesture.kind)&&t-gesture.at<gestureDuration();}
 function workControls(t=performance.now()){
  const seat=seating.snapshot(),locked=working(t)||!!seat&&seat.phase!=='rest',menus=locked||!!seat,key=locked+'|'+menus;if(key!==workControlsLocked){workControlsLocked=key;host.querySelectorAll('[data-dir]').forEach(b=>b.disabled=locked);host.querySelectorAll('[data-life=bag],[data-life=journal],[data-life=map]').forEach(b=>b.disabled=menus);}
  $('lifeUse').disabled=locked||(!near&&!seat);$('lifeTool').disabled=locked||!!seat;
 }
 function seatInput(){if(!seating.active())return false;seating.stand(performance.now(),reduced.matches);keys.clear();path=[];jump=0;return true;}
 function sit(id){clearReaction();keys.clear();path=[];jump=0;gesture=null;fish=null;$('lifeFish').hidden=true;seating.start(id,pos,look,performance.now(),reduced.matches);workControls();}
 function beginGesture(data){clearReaction();keys.clear();path=[];jump=0;gesture={...data,at:performance.now()};workControls();}
 function windowMotion(t=performance.now()){return gesture?.kind==='window'&&scene==='classroom'&&t-gesture.at<gestureDuration()?{index:gesture.index,phase:clamp((t-gesture.at)/gestureDuration(),0,1),last:gesture.last,reduced:reduced.matches}:null;}
 function windowOpened(window,previous,last,message){beginGesture({kind:'window',index:window.index,previous,last,x:window.x,y:window.y});laterToast(message,ACTION_MS);tone(last?784:660,.3);if(last)react('joy',ACTION_MS);}
 function cannotGo(){
  if(blockedNotice?.scene===scene&&distance(blockedNotice,pos)<28)return;
  blockedNotice={scene,...pos};toast('아직 갈 수 없다.');
 }
 const level=()=>Math.max(1,Number(ctx.levelInfo(ctx.getStudent()?.xp||0).level)||1);
 // Old queued full snapshots may already contain a completed school. Preserve
 // their original endpoint and request receipt; enrolled constructions remain guarded.
 const cloud=createSchoolLifeSync({host,getIdentity:()=>({id:ctx.getStudent()?.id,token:ctx.getToken?.()}),rpc:args=>ctx.db.rpc(!args.p_action&&args.p_state?.projects.includes('school')?'student_school_life_save':'student_school_life_build',args),onChange:cloudChanged});
 const saveKey=()=>`classRpgSchoolLife_v1_${owner}`;
 const opening=installSchoolOpening({state:()=>state,residentGreeting:()=>residents().saessak?'이제 삐걱거리지 않네.\n옆자리 비어 있어.':null,mutate,talk,react,windowMotion,windowOpened,weedPulling:()=>gesture?.kind==='weed'&&working(),wishChoice:()=>({label:'이 학교 말인데',run:()=>wish.open('saessak')}),remember:(npc,text)=>wish.remember(npc,text),conversation:showConversation,toast,burst,tone,invitation:readInvitation,invitationActive:()=>invitation.active(),thought:mark=>feedback.notice(mark),doorView:()=>doorAction.view(performance.now(),reduced.matches),unlock:()=>{clearReaction();gesture=null;doorAction.start(pos);feedback.unlock(performance.now(),reduced.matches);keys.clear();path=[];jump=0;workControls();tone(660,.3);laterToast('교실 문이 열렸다.',reduced.matches?350:DOOR_MS);}});
 const wish=createSchoolWish({identity:()=>({id:ctx.getStudent()?.id,token:ctx.getToken?.()}),rpc:args=>ctx.db.rpc('student_school_life_wish',args),talk,hide:hideOverlay,overlay,valid});
 const memories=createSchoolMemories({talk,book,overlay:()=>overlay});
 const story=createSchoolStory({identity:()=>({id:ctx.getStudent()?.id,token:ctx.getToken?.()}),rpc:args=>ctx.db.rpc('student_school_life_story',args),original:()=>state,overlay:()=>overlay,assets:()=>assets,avatars:()=>avatar,drawAvatar:(g,d,m)=>playerAvatar.draw(g,d,m),avatarHand:(d,f,m)=>playerAvatar.hand(d,f,m),reduced:()=>reduced.matches,nickname:()=>ctx.getStudent()?.nickname||'모험가',valid:()=>valid()&&mode==='play'&&cloudStatus==='ready'&&!syncVisible(),changed:()=>{refresh();},talk,book,hide:hideOverlay,toast,tone,wishMemory:npc=>wish.remember(npc,''),wish:npc=>wish.open(npc)});

 let gardenIntent=null;
 const garden=createGardenStorage({identity:()=>({id:ctx.getStudent()?.id,token:ctx.getToken?.()}),rpc:args=>ctx.db.rpc('student_school_life_garden',args),onChange:gardenChanged});
 const flowers=()=>garden.snapshot().enrolled?garden.snapshot().plants:state.flowers;
 const lifeView=()=>({...state,flowers:flowers()});
 function gardenChanged(s){
  if(!valid())return;
  nearId=null;
  if(s.status==='ready'&&gardenIntent&&s.command?.id===gardenIntent.id){
   const request=gardenIntent;gardenIntent=null;
   if(mode==='play'&&scene===request.scene&&!stopped&&!document.hidden){
    if(s.command.outcome==='harvested'&&!s.command.replay&&request.target){clearTimeout(toastTimer);$('lifeToast').hidden=true;queuedToast=null;beginGesture({...request.target,kind:'harvest',from:{...pos},direction:look});actionUntil=performance.now()+HARVEST_MS;}
    const f=s.plants[request.slot],text=({enrolled:null,already_enrolled:null,planted:'씨앗을 심고 물을 줬다.',occupied:'이미 심은 꽃이 있다.',watered:f?.stage===3?'꽃이 피었다.':f?.stage===2?'새싹에 물을 줬다.':'씨앗에 물을 줬다.',empty:'아직 심은 꽃이 없다.',mature:'꽃이 활짝 피었다.',already_watered_today:'오늘은 이미 물을 줬다.',clock_backwards:'날짜 확인 뒤 다시 물을 줄 수 있다.',harvested:'꽃 1개 · 씨앗 1개',not_mature:'아직 수확할 꽃이 없다.',bag_full:'주머니에 자리가 없다. 꽃은 그대로 남았다.'})[s.command.outcome];
    if(text)laterToast(text,Math.max(0,(gesture?.at||0)+gestureDuration()-performance.now()));
   }
  }else if(!['ready','saving'].includes(s.status)){gardenIntent=null;if(['plant','water'].includes(gesture?.kind)){gesture=null;actionUntil=0;queuedToast=null;}}
  if(overlay.querySelector('.life-garden-status'))gardenPanel();
  else if(mode==='play'&&['error','storage-error','conflict','pending','recovery'].includes(s.status))toast('꽃 돌보기 저장 확인 필요 · 꽃에서 확인');
  workControls();
 }
 function gardenPanel(){
  const s=garden.snapshot(),answers=[];let text='';
  if(s.status==='ready'&&s.enrolled){hideOverlay();return;}
  if(s.status==='ready'){
   text='지금까지 키운 꽃은 그대로 남는다.\n앞으로는 한국 날짜로 물 준 날을 센다.';
   answers.push({label:'꽃 돌보기 이어가기',run:()=>{if(cloudStatus!=='ready'){cloud.show();return;}gardenIntent={scene,slot:null,id:null};if(garden.enroll(String(cloud.store.snapshot().revision))){gardenIntent.id=garden.snapshot().pending?.id;gardenPanel();}else gardenIntent=null;}});
  }else if(s.status==='loading'||s.status==='saving')text=s.status==='loading'?'꽃 기록 불러오는 중…':'꽃 기록 저장 중…';
  else if(s.status==='conflict'){text='다른 곳에서 학교나 꽃이 바뀌었다.';answers.push({label:'현재 기록 불러오기',run:()=>{garden.keepServer();void cloud.store.refresh();}});}
  else if(s.status==='recovery'){text='확인하지 못한 꽃 돌보기가 있다.';for(const d of s.copies)answers.push({label:'꽃 돌보기 '+(s.copies.indexOf(d)+1),run:()=>{garden.selectPending(d.id);gardenPanel();}});}
  else if(s.status==='unreadable')text='이 기기의 꽃 기록을 읽지 못했다.';
  else {text=s.pending?'꽃 돌보기의 저장을 확인하지 못했다.':'꽃 기록을 불러오지 못했다.';answers.push({label:s.pending?'저장 확인':'다시 불러오기',run:()=>{garden.retry();gardenPanel();}});}
  answers.push({label:'돌아가기'});talk('꽃 돌보기',text,answers);overlay.querySelector('.life-dialog').classList.add('life-garden-status');
 }
 function tendFlower(e,watering=false){
  if(!retainedFlowerSite(e,state.projects)){toast('여기에는 심을 수 없다.');return;}
  const s=garden.snapshot();if(s.status!=='ready'||!s.enrolled){gardenPanel();return;}
  const f=s.plants[e.index];
  if(!watering&&f.stage===3){talk(FLOWER_NAMES[f.kind],'수확하면 꽃 1개와 씨앗 1개.',[
   {label:'수확하기',run:()=>{const now=garden.snapshot();if(now.status!=='ready'||now.plants[e.index].generation!==f.generation||now.plants[e.index].stage!==3)return;gardenIntent={scene,slot:e.index,id:null,target:{x:e.x,y:e.y,index:e.index,flowerKind:f.kind}};if(garden.harvest(e.index,String(cloud.store.snapshot().revision))){gardenIntent.id=garden.snapshot().pending?.id;}else gardenIntent=null;}},
   {label:'그대로 두기'},
   {label:'내 방에 놓기',run:()=>{const now=garden.snapshot();if(now.status!=='ready'||!now.enrolled||now.plants[e.index].generation!==f.generation||now.plants[e.index].stage!==3)return;if(mutate(s=>s.roomPlant=f.kind))toast('방에 화분을 놓았다.');}}
  ]);return;}
  const planting=!watering&&f.stage===0;gardenIntent={scene,slot:e.index,id:null};
  const accepted=planting?garden.plant(e.index,state.seed,String(cloud.store.snapshot().revision)):garden.water(e.index,String(cloud.store.snapshot().revision));
  if(!accepted){gardenIntent=null;return;}
  gardenIntent.id=garden.snapshot().pending?.id;
  clearTimeout(toastTimer);$('lifeToast').hidden=true;queuedToast=null;beginGesture({...e,kind:planting?'plant':'water',from:{...pos},spout:waterSpout()});actionUntil=performance.now()+(planting?PLANT_MS:ACTION_MS);tone(planting?880:660,.15);
 }

 const ground=createGroundStorage({identity:()=>({id:ctx.getStudent()?.id,token:ctx.getToken?.()}),rpc:(args,endpoint)=>ctx.db.rpc(endpoint||'student_school_life_ground',args),onChange:s=>{if(!valid()||!host.open)return;if(overlay.querySelector('.life-ground-status'))groundPanel();else if(mode==='play'&&['error','storage-error','conflict'].includes(s.status))toast('땅 작업 저장 확인 필요 · 삽으로 확인');else if(mode==='play'&&['error','storage-error','conflict'].includes(s.status))toast('땅 작업 저장 확인 필요 · 삽으로 확인');else if(mode==='play'&&['error','storage-error','conflict'].includes(s.status))toast('땅 작업 저장 확인 필요 · 삽으로 확인');else if(mode==='play'&&['error','storage-error','conflict'].includes(s.status))toast('땅 작업 저장 확인 필요 · 삽으로 확인');else if(mode==='play'&&['error','storage-error','conflict'].includes(s.status))toast('땅 작업 저장 확인 필요 · 삽으로 확인');else if(mode==='play'&&['error','storage-error','conflict'].includes(s.status))toast('땅 작업 저장 확인 필요 · 삽으로 확인');}});
 function groundPanel(){
  const s=ground.snapshot(),answers=[];let text='';
  if(s.status==='ready'){hideOverlay();return;}
  if(s.status==='loading'||s.status==='saving')text=s.status==='loading'?'땅 기록 불러오는 중…':'땅 기록 저장 중…';
  else if(s.status==='conflict'){text='다른 곳에서 학교가 바뀌었다.';answers.push({label:'현재 기록 불러오기',run:()=>{ground.keepServer();void cloud.store.refresh();}});}
  else if(s.status==='recovery'){text='확인하지 못한 땅 작업이 있다.';for(const d of s.copies)answers.push({label:'땅 작업 '+(s.copies.indexOf(d)+1),run:()=>{ground.selectPending(d.id);groundPanel();}});}
  else if(s.status==='unreadable')text='이 기기의 땅 기록을 읽지 못했다.';
  else {text=s.pending?'땅 작업의 저장을 확인하지 못했다.':'땅 기록을 불러오지 못했다.';answers.push({label:s.pending?'저장 확인':'다시 불러오기',run:()=>{ground.retry();groundPanel();}});}
  answers.push({label:'돌아가기'});talk('마당의 땅',text,answers);overlay.querySelector('.life-dialog').classList.add('life-ground-status');
 }
 function digGround(){
  if(!valid()||mode!=='play'||scene!=='campus'||!overlay.hidden||syncVisible()||working()||seating.active()||stopped||document.hidden||fish||performance.now()<actionUntil)return;
  if(cloudStatus!=='ready'){if(cloudStatus!=='saving')cloud.show();return;}
  const target=selectedToolCell(),s=ground.snapshot();
  if(s.status!=='ready'){groundPanel();return;}
  if(!target||!groundAllowed(target.id)){toast('여기는 팔 수 없다.');return;}
  const plot=s.plots.find(p=>p.cell===target.id),cover=!!plot?.tilled;if(!cover&&groundObstructed(target.id,state)){toast('먼저 잡초와 나뭇가지를 치워야 한다.');return;}
  const sent=cover?ground.cover(target.id,String(cloud.store.snapshot().revision),plot.generation):ground.dig(target.id,String(cloud.store.snapshot().revision));
  if(sent){beginGesture({...target,kind:'dig',tool:heldTool,cover,from:{...pos},direction:look});actionUntil=performance.now()+ACTION_MS;}
 }
 const names={room:'나의 작은 방',campus:'봄빛 학교',classroom:'우리 교실'};
 const manifest={saessakSeated:'maps/npcs/saessak-seated-v1.webp',workers:'maps/npcs/squirrel-workers-v1.webp',woods:'maps/life/woods-v1.webp',bellFrame:'maps/life/bell-frame-v1.webp',saessakPoint:'maps/npcs/saessak-point-v1.webp',toriNote:'maps/npcs/tori-note-v1.webp',duri:'maps/npcs/duri-anime-v2.webp',prologueBell:'maps/life/prologue-bell-v1.webp',invitation:'maps/life/invitation-harmony-v2.webp',campus:'maps/life/campus-harmony-v2.webp',restored:'maps/life/restored-harmony-v2.webp',room:'maps/life/room-harmony-v2.webp',classroom:'maps/life/classroom-harmony-v2.webp',classroomClosed:'maps/life/classroomClosed-harmony-v2.webp',saessak:'maps/npcs/saessak-anime-v2.webp',tori:'maps/npcs/tori-anime-v2.webp',bench:'maps/life/bench-harmony-v2.webp',weed:'maps/life/weed-harmony-v2.webp',branch:'maps/life/branch-harmony-v2.webp',soil:'maps/life/soil-harmony-v2.webp',sprout:'maps/life/sprout-harmony-v2.webp',flower:'maps/life/flower-harmony-v2.webp',flowerPink:'maps/life/flowerPink-harmony-v2.webp',flowerBlue:'maps/life/flowerBlue-harmony-v2.webp',brokenBench:'maps/life/brokenBench-harmony-v2.webp',readingNook:'maps/life/readingNook-harmony-v2.webp',lantern:'maps/life/lantern-harmony-v2.webp'};
 const notebook=installLifeNotebook({state:lifeView,garden:()=>garden.snapshot(),construction,constructionDate,level,book,overlay:()=>overlay,valid,mutate,toast,hide:hideOverlay,title,replay:replayPrologue,storyPage:()=>story.journal(),legacy:()=>{close();ctx.openLegacy?.();},held:()=>heldTool,hold:id=>{heldTool=id;nearId=null;}});
 const arrival=createSchoolArrival({overlay,hide:hideOverlay,reduced:()=>reduced.matches,tone,toggleSound,soundEnabled:()=>sound});
 const dialogue=createSchoolConversations({overlay,hide:hideOverlay,reduced:()=>reduced.matches,assets:()=>assets});
 const invitation=createInvitationAction({overlay,hide:hideOverlay,reduced:()=>reduced.matches});
 const prologue=createLifePrologue({host,valid,finish:finishPrologue,cancel:title,tone,toggleSound,soundEnabled:()=>sound});
 manifest.can='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(notebook.can.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="104" height="72" '));manifest.spade='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(SPADE_SVG);manifest.hoe='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(HOE_SVG);manifest.rod='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(notebook.rod.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" '));
 function loadImage(src){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});}
 let loadingAssets=false,loadedAssets=0;
 async function loadAssets(){if(loadingAssets)return;loadingAssets=true;loadedAssets=0;assetError=false;try{await Promise.all(Object.entries(manifest).map(async([key,src])=>{assets[key]=await loadImage(src).catch(error=>{if(key==='saessakSeated')return null;const fallback={saessakPoint:manifest.saessak,toriNote:manifest.tori}[key];if(fallback)return loadImage(fallback);throw error;});loadedAssets++;updateTitle();}));await Promise.all([document.fonts.load('20px SchoolLife'),document.fonts.load('20px SchoolLifeText')]);assetsReady=true;}catch{assetError=true;}loadingAssets=false;updateTitle();}
 function valid(){return host.open&&String(ctx.getStudent()?.id||'')===owner&&String(ctx.getToken?.()||'')===ownerToken;}
 function cloudChanged(s){
  if(!valid()||s.owner!==owner)return;
  const requestedBuild=buildIntent;
  cloudStatus=s.status;if(!['ready','saving'].includes(s.status))clearReaction();if(!ownWrite&&s.status!=='ready')seating.cancel();readError=s.status==='unreadable';saveError=!!s.pending&&s.status!=='saving'||['error','offline','storage-error','local-conflict','conflict','recovery'].includes(s.status);
  const changed=JSON.stringify(state)!==JSON.stringify(s.state);
  if(mode==='replay'&&(changed||s.status!=='ready'))endReplay(false);
  if(mode==='intro'&&!ownWrite&&(s.status!=='ready'||changed)){prologue.stop();mode='title';$('lifeTitle').hidden=false;$('lifeHud').hidden=true;keys.clear();path=[];}
  if(changed){state=s.state;if(!ownWrite){clearReaction();seating.cancel();doorAction.stop();repair.stop();buildIntent=null;feedback.cancel();gesture=null;actionUntil=0;scene=state.scene;pos={...state.position};if(blocked(pos.x,pos.y))pos=scene==='campus'?{x:800,y:550}:{x:800,y:780};keys.clear();path=[];fish=null;$('lifeFish').hidden=true;if(!overlay.hidden)hideOverlay();}}
  if(requestedBuild&&s.status==='ready'&&s.commandResult?.requestId===requestedBuild.requestId){
   buildIntent=null;
   if(mode==='play'&&!stopped&&scene===requestedBuild.scene&&!s.commandResult.replay){
    const result=s.commandResult.outcome;
    if(result==='started'){keys.clear();path=[];jump=0;gesture=null;repair.start(PROJECTS.find(p=>p.id==='school'));workControls();laterToast(constructionDate(s.construction)+' 완공',reduced.matches?1000:REPAIR_MS);}
    else if(result==='completed'){toast('학교 외관 복원 완료');react('joy');}
    else toast(({already_complete:'이미 완공된 학교다.',already_started:'공사 중이다.',not_started:'아직 공사를 시작하지 않았다.',not_ready:'아직 공사 중이다.',level_required:'학교생활 레벨 5 필요',materials_required:'나뭇가지 5개 필요'})[result]);
   }
  }else if(!['ready','saving'].includes(s.status))buildIntent=null;
  updateSave();updateTitle();if(mode==='play')refresh();
 }
 function loadState(){void cloud.store.activate(owner,ownerToken);}
 function write(next){
  if(!valid()||cloudStatus!=='ready')return false;
  next.savedAt=new Date().toISOString();ownWrite=true;
  try{return cloud.store.save(readLife(JSON.stringify(next)));}finally{ownWrite=false;}
 }
 function mutate(fn){if(cloudStatus!=='ready'){toast(cloudStatus==='saving'?'저장 중…':'저장 확인 필요');if(cloudStatus!=='saving')cloud.show();return false;}const next=structuredClone(state);next.scene=scene;next.position={...pos};fn(next);const normalized=readLife(JSON.stringify(next));if(JSON.stringify(normalized)===JSON.stringify(state))return true;if(!write(normalized))return false;refresh();return true;}
 function buildSchool(action){
  if(!valid()||mode!=='play'||cloudStatus!=='ready')return;
  const next=structuredClone(state);next.scene=scene;next.position={...pos};next.savedAt=new Date().toISOString();
  buildIntent={scene,action,requestId:null};ownWrite=true;
  try{if(cloud.store.command(action,readLife(JSON.stringify(next)))){if(buildIntent)buildIntent.requestId=cloud.store.snapshot().pending?.p_request_id;}else buildIntent=null;}finally{ownWrite=false;}
 }
 function schoolConstruction(){
  const b=construction();if(!b)return false;
  if(b.status==='building')talk('학교 외관 공사',constructionDate(b)+' 완공',[{label:'공사 확인',run:async()=>{const id=owner,token=ownerToken;await cloud.store.refresh();if(valid()&&owner===id&&ownerToken===token&&mode==='play'&&cloudStatus==='ready'&&near?.id==='school')schoolConstruction();}},{label:'돌아가기'}]);
  else if(b.status==='ready')talk('학교 외관','지붕과 벽의 수리가 끝났다.',[{label:'완공 확인',run:()=>buildSchool('finish_school')},{label:'돌아가기'}]);
  else talk('학교 외관','수리가 끝났다.');return true;
 }
 function retry(){if(valid())cloud.show();}
 function syncVisible(){return !$('lifeSyncPanel').hidden;}
 function updateSave(){$('lifeSaveError').hidden=true;}

 function toast(text){$('lifeToast').textContent=text;$('lifeToast').hidden=false;$('lifeAnnounce').textContent=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('lifeToast').hidden=true,3200);}
 function updateTitle(){
  if(!host.open)return;
  const start=$('lifeStart'),busy=['loading','saving'].includes(cloudStatus);
  start.disabled=(!assetsReady&&!assetError)||busy;
  start.textContent=assetError?'그림 다시 불러오기':!assetsReady?'불러오는 중 '+loadedAssets+'/'+Object.keys(manifest).length:cloudStatus==='loading'?'이야기 불러오는 중…':cloudStatus==='saving'?'이야기 저장 중…':cloudStatus!=='ready'?'저장 상태 살펴보기':state.started?'이어서 놀기':'처음 시작하기';
  $('lifeTitleProfile').textContent=(ctx.getStudent()?.nickname||'모험가')+' · Lv. '+level()+(state.started?' · '+names[state.scene]:'');
  $('lifeTitleNote').textContent=cloudStatus==='ready'?'마지막으로 저장한 곳에서 이어하기':'저장 상태 확인 중';
 }

 function resize(){clearReaction();W=host.clientWidth||innerWidth;H=host.clientHeight||innerHeight;DPR=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';S=W<700?.78:Math.min(1.12,W/1400);keys.clear();path=[];fish=null;$('lifeFish').hidden=true;}
 function avatarImages(){avatar=SLOTS.map(id=>document.getElementById(id)).filter(el=>el&&el.getAttribute('src')&&!el.classList.contains('hidden'));const next=owner+'|'+ownerToken+'|'+avatar.map(i=>i.id+':'+i.src).join('|');if(next!==seatedAvatarKey){clearReaction();seating.cancel();seatedAvatarKey=next;}playerAvatar.update(avatar,owner+'|'+ownerToken);}
 function open(){clearReaction();toolAttachment=null;seating.cancel();if(!ctx.getStudent()?.id)return;replayOrigin=null;prologue.stop();invitation.stop();arrival.stop();dialogue.stop(true);queuedArrival=null;queuedToast=null;feedback.reset();doorAction.stop();repair.stop();buildIntent=null;blockedNotice=null;look='d';focusBack=document.activeElement;owner=String(ctx.getStudent().id);ownerToken=String(ctx.getToken?.()||'');cloud.reset();heldTool='';gesture=null;state=freshLife();scene='room';pos={x:800,y:725};cloudStatus='loading';readError=false;saveError=false;avatarImages();mode='title';stopped=false;host.showModal();startMusic();loadState();void ground.activate(owner,ownerToken);void garden.activate(owner,ownerToken);void wish.store.activate(owner,ownerToken);void story.store.activate(owner,ownerToken);$('lifeTitle').hidden=false;$('lifeHud').hidden=true;overlay.hidden=true;keys.clear();path=[];resize();if(!assetsReady)loadAssets();updateTitle();lastTime=0;cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);$('lifeStart').focus();}
 function close(){gardenIntent=null;garden.deactivate();ground.deactivate();clearReaction();toolAttachment=null;seating.cancel();if(!host.open)return;replayOrigin=null;story.cancelView();story.store.deactivate();wish.close();wish.store.deactivate();prologue.stop();invitation.stop();arrival.stop();dialogue.stop(true);queuedArrival=null;queuedToast=null;feedback.reset();doorAction.stop();repair.stop();buildIntent=null;blockedNotice=null;gesture=null;heldTool='';if(mode==='play'&&!saveError&&!readError&&valid())mutate(s=>{s.position={...pos};s.scene=scene;});keys.clear();path=[];fish=null;host.close();playerAvatar.reset();cancelAnimationFrame(frame);stopSound();focusBack?.focus?.({preventScroll:true});}
 function finishPrologue(){
  if(!valid()||mode!=='intro')return;
  if(cloudStatus!=='ready'){prologue.stop();title();cloud.show();return;}
  prologue.stop();mode='play';$('lifeTitle').hidden=true;$('lifeHud').hidden=false;
  if(!mutate(s=>{s.started=true;s.intro=true;})){title();cloud.show();return;}
  refresh();canvas.focus({preventScroll:true});
 }
 function replayPrologue(){
  if(!valid()||mode!=='play'||!state.started)return;
  if(cloudStatus!=='ready'){cloud.show();return;}
  const origin={owner,token:ownerToken,state,scene,position:{...pos}};
  hideOverlay();feedback.cancel();doorAction.stop();repair.stop();buildIntent=null;replayOrigin=origin;keys.clear();path=[];fish=null;$('lifeFish').hidden=true;
  mode='replay';$('lifeHud').hidden=true;$('lifeTitle').hidden=true;
  prologue.start({replay:true,onFinish:()=>endReplay(),onCancel:()=>endReplay()});
 }
 function endReplay(showNotebook=true){
  if(mode!=='replay')return;const origin=replayOrigin;replayOrigin=null;prologue.stop();keys.clear();path=[];
  mode='play';$('lifeHud').hidden=false;
  if(!valid())return;
  if(showNotebook&&origin&&origin.owner===owner&&origin.token===ownerToken&&origin.state===state&&origin.scene===scene&&distance(origin.position,pos)<1)notebook.journal('memory');
  else hideOverlay();
 }
 function start(){
  if(assetError){$('lifeStart').disabled=true;loadAssets();return;}
  if(cloudStatus!=='ready'){cloud.show();return;}
  if(!assetsReady||!valid())return;
  keys.clear();path=[];$('lifeTitle').hidden=true;
  if(!state.intro&&!state.started&&!state.opening.legacy){mode='intro';$('lifeHud').hidden=true;prologue.start();return;}
  mode='play';$('lifeHud').hidden=false;refresh();
  if(!state.started)mutate(s=>s.started=true);
  canvas.focus({preventScroll:true});
 }
 function title(){clearReaction();toolAttachment=null;seating.cancel();story.cancelView();replayOrigin=null;wish.close();prologue.stop();invitation.stop();arrival.stop();dialogue.stop(true);queuedArrival=null;queuedToast=null;feedback.reset();doorAction.stop();repair.stop();buildIntent=null;keys.clear();path=[];fish=null;$('lifeFish').hidden=true;if(mode==='play'&&!saveError&&!readError)mutate(()=>{});mode='title';overlay.hidden=true;$('lifeTitle').hidden=false;$('lifeHud').hidden=true;updateTitle();$('lifeStart').focus();}
 function refresh(){if(!host.open)return;$('lifePlace').textContent=names[scene];$('lifeClock').textContent=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());$('lifeLevel').textContent=`${ctx.getStudent()?.nickname||'모험가'} · Lv. ${level()}`;$('lifeTask').innerHTML=svg('book')+'<span><small>받은 부탁</small><strong>'+esc(opening.goal()||story.goal())+'</strong></span>';$('lifeTask').hidden=!(opening.goal()||story.goal());updateSave();nearId=null;}
 function hideOverlay(){clearReaction();seating.cancel();story.cancelView();wish.close();arrival.stop();dialogue.stop();queuedArrival=null;invitation.stop();gesture=null;overlay.hidden=true;overlay.replaceChildren();keys.clear();path=[];($('lifeUse').hidden?canvas:$('lifeUse')).focus({preventScroll:true});}
 function showConversation(kind,finish){hideOverlay();const origin={scene,state,position:{...pos},owner,token:ownerToken};fish=null;$('lifeFish').hidden=true;dialogue.start(kind,()=>valid()&&mode==='play'&&cloudStatus==='ready'&&!syncVisible()&&owner===origin.owner&&ownerToken===origin.token&&scene===origin.scene&&state===origin.state&&distance(pos,origin.position)<=1,finish);}
 function talk(name,text,choices=[{label:'확인'}],face){clearReaction();arrival.stop();dialogue.stop();queuedArrival=null;invitation.stop();const origin={scene,position:{...pos},state};keys.clear();path=[];fish=null;$('lifeFish').hidden=true;overlay.hidden=false;overlay.innerHTML=`<section class="life-dialog" role="dialog" aria-label="${esc(name)}의 이야기"><div class="life-speaker">${esc(name)}</div>${face?`<img class="life-face" src="${manifest[face]}" alt="">`:''}<p>${esc(text)}</p><div class="life-choices"></div></section>`;for(const choice of choices){const b=document.createElement('button');b.className='life-choice';b.textContent=choice.label;b.onclick=()=>{if(!valid()||mode!=='play'||overlay.hidden||!overlay.contains(b)||origin.scene!==scene||origin.state!==state||distance(origin.position,pos)>76)return;hideOverlay();choice.run?.();};overlay.querySelector('.life-choices').append(b);}overlay.querySelector('button')?.focus({preventScroll:true});}
 function book(title,html){clearReaction();arrival.stop();dialogue.stop();queuedArrival=null;invitation.stop();feedback.cancel();doorAction.stop();repair.stop();buildIntent=null;keys.clear();path=[];fish=null;gesture=null;$('lifeFish').hidden=true;overlay.hidden=false;overlay.innerHTML=`<section class="life-book" role="dialog" aria-label="${esc(title)}"><header class="life-book-head"><h2>${esc(title)}</h2><button class="life-book-close" aria-label="수첩 닫기">×</button></header><div class="life-book-body">${html}</div></section>`;overlay.querySelector('button').onclick=hideOverlay;overlay.querySelector('button')?.focus({preventScroll:true});}
 function bag(){if(!seating.active()&&!working()&&!stopped&&!document.hidden)notebook.bag();}
 function journal(){if(!seating.active()&&!working()&&!stopped&&!document.hidden)notebook.journal();}
 function map(){if(seating.active()||working()||stopped||document.hidden)return;book('우리 학교 산책 지도','<canvas class="life-map-canvas" id="lifeMapCanvas" width="750" height="500" aria-label="왼쪽 내 방, 위쪽 학교, 가운데 화단, 오른쪽 연못"></canvas><p>집 → 앞마당 → 학교 · 오른쪽에는 연못<br>바닥 클릭: 이동 · 가까운 대상: 행동</p><p class="life-remember">방향키 / WASD 걷기 · E / Enter 표시된 행동 · Space 폴짝 · Esc 수첩 닫기</p>');const c=$('lifeMapCanvas').getContext('2d');c.drawImage(assets.campus,0,0,750,500);c.font='17px SchoolLife';c.textAlign='center';for(const [text,x,y]of[['내 방',120,265],['학교',390,205],['꽃밭',310,320],['연못',625,430]]){c.fillStyle='#fff6dc';c.fillRect(x-35,y-18,70,26);c.fillStyle='#405d3f';c.fillText(text,x,y);}if(scene==='campus'){c.fillStyle='#e17d59';c.beginPath();c.arc(pos.x/1600*750,pos.y/1067*500,6,0,Math.PI*2);c.fill();}}
 function residents(){const use=residentUse(state,repair.view(performance.now(),reduced.matches));if(!assets.saessakSeated?.naturalWidth)use.saessak=null;return use;}
 function residentTarget(e){const p=residents()[e.id];return p?{...e,...p.target}:e;}
 function baseEntities(){
  if(scene==='room')return [{id:'door',x:800,y:965,label:'학교로 나가기',action:'나가기',kind:'exit',target:'campus'},{id:'plant',x:1400,y:630,label:'내 방의 작은 화분',action:'꾸미기',kind:'plant'}];
  if(scene==='classroom')return [{id:'door',x:800,y:965,label:'마당으로 나가기',action:'나가기',kind:'exit',target:'campus'},{id:'tori',x:1060,y:615,label:'토리',action:'대화',kind:'npc'},...DUST.map(([x,y],i)=>({id:'dust'+i,x,y,index:i,label:'먼지 쓸기',action:'쓸기',kind:'dust'})).filter(o=>!state.dust.includes(o.index)),{id:'library',x:1160,y:775,label:'작은 책쉼터',action:state.projects.includes('library')?'쉬기':'살피기',kind:'project'}];
  return [{id:'home',x:260,y:548,label:'내 방으로',action:'들어가기',kind:'exit',target:'room'},{id:'schoolDoor',x:815,y:435,label:'교실로',action:'들어가기',kind:'exit',target:'classroom'},{id:'saessak',x:540,y:540,label:'새싹',action:'대화',kind:'npc'},{id:'pond',x:1155,y:786,label:'연못 낚시',action:'낚시하기',kind:'pond'},{id:'bench',x:945,y:610,label:'나무 벤치',action:state.projects.includes('bench')?'쉬기':'살피기',kind:'project'},{id:'school',x:935,y:457,label:'학교에 새 봄빛',action:construction()?.status==='building'?'공사 확인':construction()?.status==='ready'?'완공 확인':'살피기',kind:'project'},{id:'garden',x:805,y:591,label:'넓어진 꽃밭',action:'살피기',kind:'project'},{id:'lights',x:970,y:946,label:'등굣길 꽃등',action:'살피기',kind:'project'},...WEEDS.map(([x,y],i)=>({id:'weed'+i,x,y,index:i,label:'잡초 뽑기',action:'뽑기',kind:'weed'})).filter(o=>!state.weeds.includes(o.index)),...BRANCHES.map(([x,y],i)=>({id:'branch'+i,x,y,index:i,label:'나뭇가지 줍기',action:'줍기',kind:'branch'})).filter(o=>!state.branches.includes(o.index)),...FLOWERS.slice(0,state.projects.includes('garden')?6:3).map(([x,y],i)=>({id:'flower'+i,x,y,index:i,label:flowers()[i].stage===0?'빈 흙':FLOWER_NAMES[flowers()[i].kind],action:flowers()[i].stage===0?'심기':flowers()[i].stage<3?'물 주기':'살피기',kind:'flower'}))];
 }
 function entities(){return [...baseEntities().map(residentTarget).filter(e=>e.id!=='tori'||opening.toriVisible()).filter(e=>e.kind!=='project'||state.projects.includes(e.id)||level()>=PROJECTS.find(p=>p.id===e.id).level),...opening.entities(scene),...memories.entities(scene),...story.entities(scene)];}
 function blocked(x,y){if(x<80||x>1520||y<410||y>1000)return true;if(scene==='campus'){if(x<440&&y<535)return true;if(x>405&&x<1220&&y<405)return true;if(((x-1360)/208)**2+((y-650)/172)**2<1.07)return true;return false;}if(y<470)return true;if(scene==='room'&&((x<430&&y<550)||(x>1150&&y<510)))return true;return false;}
 function navigate(tx,ty){
  if(seating.active()||working()||stopped||document.hidden)return;
  const step=32,cols=50,rows=34,cell=(x,y)=>[clamp(Math.round(x/step),3,47),clamp(Math.round(y/step),13,31)],start=cell(pos.x,pos.y),end=cell(tx,ty),key=(x,y)=>y*cols+x;
  if(blocked(tx,ty)||blocked(end[0]*step,end[1]*step)){path=[];keys.clear();cannotGo();return;}
  const queue=[start],seen=new Set([key(...start)]),prev=new Map();let found=false;
  for(let j=0;j<queue.length&&j<1700;j++){const [x,y]=queue[j];if(x===end[0]&&y===end[1]){found=true;break;}for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(nx<2||nx>=cols-2||ny<12||ny>=rows-2||seen.has(k)||blocked(nx*step,ny*step))continue;seen.add(k);prev.set(k,[x,y]);queue.push([nx,ny]);}}
  if(!found){path=[];keys.clear();cannotGo();return;}const result=[];let p=end;while(p[0]!==start[0]||p[1]!==start[1]){result.push({x:p[0]*step,y:p[1]*step});p=prev.get(key(...p));if(!p)break;}path=result.reverse();keys.clear();
 }
 function nearest(){let list=entities();near=list.reduce((a,e)=>distance(pos,e)<76&&(!a||distance(pos,e)<distance(pos,a))?e:a,null);const id=near?.id||'';$('lifePrompt').hidden=!near||!!fish;if(id!==nearId){nearId=id;$('lifePrompt').innerHTML=near?`${svg(near.kind==='branch'?'wood':near.kind==='pond'?'fish':near.kind==='flower'?'flower':'leaf')}<span>${esc(near.label)}</span>`:'';$('lifeUse').disabled=!near;$('lifeUse').hidden=!near;$('lifeUseText').textContent=near?.action||'';$('lifeUse').dataset.ready=String(!!near);$('lifeUse').setAttribute('aria-label',near?near.label+' · '+near.action:'가까운 대상의 행동');}}
 function burst(x,y,color='#fbe3a1'){for(let i=0;i<10;i++)effect.push({x,y,vx:Math.cos(i*.628)*40,vy:Math.sin(i*.628)*36-30,life:.8,color});}
 function arrivalSeen(){if(arrivalsSeen.has(owner))return true;try{return localStorage.getItem('classRpgSchoolLifeArrival_v1_'+owner)==='1';}catch{return false;}}
 function startArrival(){const origin={state,owner,ownerToken,position:{...pos}};queuedArrival=null;if(arrivalSeen())return;arrivalsSeen.add(owner);try{localStorage.setItem('classRpgSchoolLifeArrival_v1_'+owner,'1');}catch{}keys.clear();path=[];jump=0;gesture=null;heldTool='';near=null;nearId=null;$('lifeToast').hidden=true;arrival.start(()=>valid()&&owner===origin.owner&&ownerToken===origin.ownerToken&&mode==='play'&&cloudStatus==='ready'&&scene==='campus'&&state===origin.state&&distance(pos,origin.position)<1);}
 function face(e){({look,facing}=faceTarget(pos,e,look,facing));}
 function readInvitation(e,done){const origin={state,scene,position:{...pos}};keys.clear();path=[];jump=0;fish=null;$('lifeFish').hidden=true;heldTool='';face(e);gesture={kind:'invitation',at:performance.now()};invitation.start({source:{x:e.x,y:e.y-13},image:assets.invitation,done,guard:()=>valid()&&mode==='play'&&cloudStatus==='ready'&&scene===origin.scene&&state===origin.state&&distance(pos,origin.position)<76});}
 function use(){
  if(seating.active()){if(valid()&&!stopped&&!document.hidden)seatInput();return;}
  if(!valid()||mode!=='play'||!overlay.hidden||working()||stopped||document.hidden||feedback.busy(performance.now(),reduced.matches))return;
  if(fish){reel();return;}
  if(cloudStatus!=='ready'){toast(cloudStatus==='saving'?'저장 중…':'저장 확인 필요');if(cloudStatus!=='saving')cloud.show();return;}
  if(performance.now()<actionUntil)return;nearest();if(heldTool==='can'&&near?.kind==='flower'){useTool();return;}if(!near){toast('너무 멀다.');return;}const e={...near};actionUntil=performance.now()+400;clearReaction();path=[];keys.clear();face(e);
  if(memories.handle(e,assets)){story.decorateMemory(e);return;}if(story.handle(e)||opening.handle(e))return;
  if(e.kind==='exit'){const firstArrival=scene==='room'&&e.target==='campus'&&!state.opening.legacy&&state.opening.step===1&&!arrivalSeen();const target=e.target;const dest=target==='campus'?(scene==='room'?{x:295,y:575}:{x:815,y:485}):{x:800,y:860};if(mutate(s=>{s.scene=target;s.position=dest;if(target==='classroom'&&s.opening.step===3)s.opening.step=4})){scene=target;pos=dest;refresh();if(firstArrival)queuedArrival={owner,token:ownerToken,state,position:{...dest}};else toast(names[scene]);}return;}
  if(e.kind==='npc'){if(e.id==='saessak'){const text=residents().saessak?'이제 삐걱거리지 않네.\n옆자리 비어 있어.':state.weeds.length<6?'여기, 작은 초록빛이 숨어 있어.\n마당의 잡초를 뽑고 빈 흙에 꽃을 심어 볼래?\n나뭇가지는 벤치를 고칠 때 쓸 수 있어.':flowers().slice(0,3).some(f=>f.stage<3)?'마당이 훨씬 환해졌어!\n물을 준 날마다 조금씩 자라.\n어떤 꽃을 심을지는 주머니에서 골라 봐.':'우리가 돌본 학교에 꽃이 피었네!\n네가 고른 꽃이 학교와 참 잘 어울려.\n가끔 연못에서 쉬어 가는 것도 좋아.';talk('새싹',wish.remember('saessak',text),[{label:'둘러볼게'},{label:'이 학교 말인데',run:()=>wish.open('saessak')}],'saessak');}else talk('토리',wish.remember('tori',state.projects.includes('library')?'우리 교실에 책쉼터가 생겼네!\n여기 앉아서 한숨 돌려도 좋아.':'네가 들어오니 교실에 생기가 도네.\n여기서 다시 책을 읽을 수 있어 기뻐.'),[{label:'다녀올게'},{label:'이 학교 말인데',run:()=>wish.open('tori')}],'tori');return;}
  if(['weed','branch','dust'].includes(e.kind)){const field={weed:'weeds',branch:'branches',dust:'dust'}[e.kind];if(mutate(s=>{if(!s[field].includes(e.index)){s[field].push(e.index);if(e.kind==='branch')s.wood++;}})){beginGesture({kind:e.kind,x:e.x,y:e.y,direction:look});gesture.color=e.kind==='dust'?'#d8c9ab':'#fbe3a1';laterToast(e.kind==='weed'?'잡초를 뽑았다.':e.kind==='branch'?'나뭇가지 +1':'먼지를 쓸었다.');}return;}
  if(e.kind==='flower'){tendFlower(e);return;}
  if(e.kind==='plant'){if(state.roomPlant<0)talk('작은 선반','학교에서 키운 꽃 모양의 화분을 놓는 자리.');else talk('나의 작은 화분',FLOWER_NAMES[state.roomPlant]+' 화분. 학교에서 키운 꽃과 같은 모양이다.');return;}
  if(e.kind==='project'){if(e.id==='garden'&&(!garden.snapshot().enrolled||garden.snapshot().status!=='ready')){gardenPanel();return;}const p=PROJECTS.find(p=>p.id===e.id);if(e.id==='school'&&schoolConstruction())return;if(state.projects.includes(e.id)){if(e.id==='bench'||e.id==='library'){sit(e.id);}else talk(p.name,'수리가 끝났다.');return;}const reason=projectRequirement(lifeView(),p.id,level());if(reason){talk(p.name,reason+`\n${p.description}`,[{label:'확인'},{label:'학교 수첩',run:journal}]);return;}if(p.id==='school'){talk('학교 외관','지붕과 벽을 고친다. 내일 완공.\n나뭇가지 5개 필요',[{label:'공사 시작',run:()=>{if(!projectRequirement(lifeView(),'school',level()))buildSchool('start_school');}},{label:'돌아가기'}]);return;}talk(p.name,p.description+(p.wood?`\n나뭇가지 ${p.wood}개 필요`:''),[{label:'함께 고치기',run:()=>{if(projectRequirement(lifeView(),p.id,level()))return;if(mutate(s=>{s.projects.push(p.id);s.wood-=p.wood;})){clearReaction();gesture=null;keys.clear();path=[];jump=0;repair.start(p);workControls();const duration=reduced.matches?1000:REPAIR_MS;laterToast(p.name+' 완성',duration);react('joy',duration);}}},{label:'조금 이따가'}]);return;}
  if(e.kind==='pond'){heldTool='rod';look='r';facing=-1;fish={phase:'wait',at:performance.now(),bite:performance.now()+1700+Math.random()*1600};$('lifeFish').hidden=false;tone(440,.1);}
 }
 function selectedToolCell(){return selectedToolTarget(pos,look,scene==='campus'?FLOWERS.slice(0,state.projects.includes('garden')?6:3):[]);}
 function waterSpout(){const [dx,dy]=VECTORS[look],hand=playerAvatar.hand(look,facing);return {x:pos.x+hand.x+dx*28,y:pos.y+hand.y+dy*28};}
 function useTool(){if(['spade','hoe'].includes(heldTool)){digGround();return;}if(seating.active())return;
  if(!valid()||mode!=='play'||!overlay.hidden||syncVisible()||working()||stopped||document.hidden||fish||heldTool!=='can'||feedback.busy(performance.now(),reduced.matches)||performance.now()<actionUntil)return;
  if(cloudStatus!=='ready'){if(cloudStatus!=='saving')cloud.show();return;}
  const target=selectedToolCell(),flower=target.index>=0?flowers()[target.index]:null;
  if(flower){tendFlower({...target,index:target.index},true);return;}
  actionUntil=performance.now()+950;keys.clear();path=[];beginGesture({...target,kind:'water',from:{...pos},spout:waterSpout()});if(flower?.stage===2)react('joy',ACTION_MS);tone(660,.12);
 }
 function reel(){if(!fish)return;const good=fish.phase==='bite';fish=null;nearId=null;$('lifeFish').hidden=true;if(good){const n=state.fish.reduce((a,b)=>a+b,0)%3,first=!state.fish[n];if(mutate(s=>s.fish[n]=Math.min(999,s.fish[n]+1))){burst(1165,786,'#d6eff0');toast(FISH_NAMES[n]+' 발견. 낚시 기록에 남기고 방생했다.');tone(880,.3);react(first?'surprise':'joy');}}else{toast('너무 일찍 낚싯대를 올렸다.');react('sad');}}
 function tone(freq,duration){if(!sound||!audio||stopped||document.hidden)return;const o=audio.createOscillator(),v=audio.createGain();o.type='sine';o.frequency.value=freq;v.gain.setValueAtTime(0,audio.currentTime);v.gain.linearRampToValueAtTime(.035,audio.currentTime+.025);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(v);v.connect(audio.destination);o.start();o.stop(audio.currentTime+duration+.03);}
 function stopSound(){clearInterval(audioTimer);audio?.suspend?.();}
 function startMusic(){clearInterval(audioTimer);if(!sound||!host.open||stopped||document.hidden)return;audio?.resume?.();let n=0;audioTimer=setInterval(()=>{if(!host.open||document.hidden||stopped||mode==='intro'||mode==='replay'||arrival.active())return;tone([523,659,784,659,587,440,523,0][n++%8],1.1);},2300);}
 function toggleSound(){sound=!sound;if(sound){try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();startMusic();tone(523,.5);}catch{sound=false;toast('소리를 재생할 수 없다.');}}else stopSound();host.querySelectorAll('[data-life=sound]').forEach(b=>{b.setAttribute('aria-pressed',String(sound));b.setAttribute('aria-label',sound?'소리 끄기':'소리 켜기');});}
 function ellipse(x,y,rx,ry,fill){g.fillStyle=fill;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();}
 function line(points,color,width=3){g.strokeStyle=color;g.lineWidth=width;g.lineJoin='round';g.lineCap='round';g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();}
 function flower(x,y,kind,stage,small=false){g.save();g.translate(x,y);if(small)g.scale(.7,.7);if(stage<2||small)g.drawImage(assets.soil,-28,-12,56,31);if(stage===1){const pending=gesture?.kind==='plant'&&gesture.x===x&&gesture.y===y&&!plantingFrame((performance.now()-gesture.at)/PLANT_MS,reduced.matches).seedPlaced;if(!pending)ellipse(0,-1,4,3,'#d9c68a');}else if(stage===2){g.drawImage(assets.sprout,-22,-31,44,38);}else if(stage===3){g.drawImage(assets[['flower','flowerPink','flowerBlue'][kind]],-28,-61,56,69);}g.restore();}
 function weed(x,y){g.drawImage(assets.weed,x-25,y-40,50,52);}
 function branch(x,y){g.drawImage(assets.branch,x-31,y-27,62,52);}
 function flag(x,y,text){line([[x,y],[x,y-42]],'#85734c',4);g.fillStyle='#e9d7a4';g.beginPath();g.roundRect(x-22,y-55,44,25,4);g.fill();g.strokeStyle='#8c8053';g.lineWidth=2;g.stroke();g.font='14px SchoolLife';g.textAlign='center';g.fillStyle='#695b3b';g.fillText(text,x,y-37);}
 function sprite(img,x,y,w,h,bob=0){if(!img?.complete||!img.naturalWidth)return;ellipse(x,y+4,w*.26,8,'#364e3930');g.drawImage(img,x-w/2,y-h+bob,w,h);}
 let toolAttachment=null,plantingAttachment=null,harvestAttachment=null;
 function drawPlayer(t){
  toolAttachment=null;plantingAttachment=null;harvestAttachment=null;
  const doorView=doorAction.view(t,reduced.matches),seat=seating.view(t,reduced.matches),drawLook=doorView?'u':seat?.look||look;let drawPos=doorView?.position||seat||pos;
  const j=jump?Math.sin(clamp((t-jump)/550,0,1)*Math.PI)*26:0;if(jump&&t-jump>550)jump=0;
  const action=doorView&&!doorView.walking&&!reduced.matches?{kind:'unlock'}:gesture&&t-gesture.at<gestureDuration()?gesture:null;if(!action)gesture=null;
  const phase=doorView?doorView.keyPhase:action?clamp((t-action.at)/(action.kind==='plant'?PLANT_MS:action.kind==='harvest'?HARVEST_MS:ACTION_MS),0,1):0,actionView=action?actionFrame(action.kind,phase,reduced.matches):null,bend=actionView?.lean||0;
  if(action?.color&&actionView.impact&&!action.impactShown){action.impactShown=true;if(!['weed','dust'].includes(action.kind))burst(action.x,action.y,action.color);tone(660,.12);}
  const motion={reaction:reactionView,seated:seat&&!seat.walking?seat.amount:undefined,action:action&&!reduced.matches?actionView:null,facing,walking:doorView?doorView.walking&&!reduced.matches:seat?seat.walking&&!reduced.matches:walkMoving&&!jump&&!reduced.matches&&!action,phase:doorView?doorView.walkPhase:seat?seat.walkPhase:walkPhase,carry:!!(doorView||heldTool||fish||story.carrying()||invitation.active())};const hand=playerAvatar.hand(drawLook,facing,motion);
  if(action?.kind==='dig'&&!reduced.matches){
   const shape=TOOL_SHAPES[action.tool||'spade'],pose=toolTransform(action.tool||'spade',drawLook,facing,actionView),bodyAngle=-bend*.24*facing,dx=(shape.tip[0]-shape.grip[0])*shape.scale*pose.mirror,dy=(shape.tip[1]-shape.grip[1])*shape.scale;
   const tx=hand.x+dx*Math.cos(pose.angle)-dy*Math.sin(pose.angle),ty=hand.y+dx*Math.sin(pose.angle)+dy*Math.cos(pose.angle),rx=tx*Math.cos(bodyAngle)-ty*Math.sin(bodyAngle),ry=tx*Math.sin(bodyAngle)+ty*Math.cos(bodyAngle);
   const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);},reach=smooth(phase/.32)*(1-smooth((phase-.68)/.32));
   drawPos={x:pos.x+(action.x-pos.x-rx)*reach,y:pos.y+(action.y-pos.y-ry)*reach};
  }
  if(action?.kind==='plant'&&!reduced.matches){const q=plantingFrame(phase).reach,a=-bend*.24*facing,rx=hand.x*Math.cos(a)-hand.y*Math.sin(a),ry=hand.x*Math.sin(a)+hand.y*Math.cos(a);drawPos={x:pos.x+(action.x-pos.x-rx)*q,y:pos.y+(action.y-pos.y-ry)*q};}
  if(action?.kind==='harvest'&&!reduced.matches){const q=harvestFrame(phase).reach,a=-bend*.24*facing,rx=hand.x*Math.cos(a)-hand.y*Math.sin(a),ry=hand.x*Math.sin(a)+hand.y*Math.cos(a);drawPos={x:pos.x+(action.x-pos.x-rx)*q,y:pos.y+(action.y-10-pos.y-ry)*q};}
  const worldTransform=g.getTransform();
  ellipse(drawPos.x,drawPos.y+(seat?15:5),20,7,'#314b3b45');g.save();g.translate(drawPos.x,drawPos.y-j+(reactionView?.dy||0));g.rotate(-bend*.24*facing+(reactionView?.angle||0));

  const broomBehind=action?.kind==='dust'&&drawLook==='u';
  const broomAtHand=()=>{const h=worldTransform.inverse().transformPoint(g.getTransform().transformPoint(hand));g.save();g.setTransform(worldTransform);const broom=drawSweepingBroom(g,h,action,phase,reduced.matches);g.restore();toolAttachment={kind:'broom',hand:{x:h.x,y:h.y},grip:broom.grip,tip:broom.head,direction:broom.direction};};
  if(broomBehind)broomAtHand();playerAvatar.draw(g,drawLook,motion);
  const tool=doorView?'':seat?'':fish?'rod':action?.kind==='water'?'can':action?.kind==='dig'?(action.tool||'spade'):action?.kind==='plant'?(plantingFrame(phase,reduced.matches).watering?'can':''):action?'':heldTool;
  if(tool&&!story.carrying()){
   let toolLook=drawLook,toolAction=actionView;
   if(action?.kind==='plant'&&tool==='can'){const shape=TOOL_SHAPES.can,worldHand=worldTransform.inverse().transformPoint(g.getTransform().transformPoint(hand)),length=Math.hypot(shape.spout[0]-shape.grip[0],shape.spout[1]-shape.grip[1])*shape.scale,dy=clamp(action.y-20-worldHand.y,-length*.8,length*.8),dx=(action.x>=worldHand.x?1:-1)*Math.sqrt(length*length-dy*dy),tip=g.getTransform().inverse().transformPoint(worldTransform.transformPoint({x:worldHand.x+dx,y:worldHand.y+dy})),lx=tip.x-hand.x,ly=tip.y-hand.y;toolLook=lx>=0?'r':'l';const mirror=toolTransform('can',toolLook,facing).mirror;toolAction={...actionView,kind:'water',aimAngle:Math.atan2(ly,lx)-Math.atan2(shape.spout[1]-shape.grip[1],(shape.spout[0]-shape.grip[0])*mirror)};}
   const h=g.getTransform().transformPoint(hand);g.save();g.translate(hand.x,hand.y);const drawn=drawHeldTool(g,{kind:tool,asset:assets[tool],direction:toolLook,facing,action:toolAction,fishing:!!fish});g.restore();
   if(drawn){const world=p=>p&&({x:p.x/(DPR*S)+camera.x,y:p.y/(DPR*S)+camera.y});toolAttachment={kind:tool,hand:world(h),grip:world(drawn.grip),tip:world(drawn.tip),spout:world(drawn.spout)};if(action?.kind==='water')action.spout=toolAttachment.spout;playerAvatar.drawGrip(g,drawLook,facing,motion);}
  }
  if(action?.kind==='plant'){const h=worldTransform.inverse().transformPoint(g.getTransform().transformPoint(hand));plantingAttachment={hand:{x:h.x,y:h.y},spout:toolAttachment?.spout||null};}
  if(action?.kind==='harvest'){const world=v=>worldTransform.inverse().transformPoint(g.getTransform().transformPoint(v));const h=world(hand),b=world({x:14*facing,y:-28});harvestAttachment={hand:{x:h.x,y:h.y},pocket:{x:b.x,y:b.y}};}
  if(action?.kind==='weed'&&actionView.impact){const root=g.getTransform().inverse().transformPoint(worldTransform.transformPoint({x:action.x,y:action.y}));drawHeldWeed(g,assets.weed,phase,root,hand,reduced.matches);if(!reduced.matches&&weedMotion(phase).transfer>.9)playerAvatar.drawGrip(g,drawLook,facing,motion);}
  if(action?.kind==='dust'){if(!broomBehind)broomAtHand();playerAvatar.drawGrip(g,drawLook,facing,motion);}
  if(doorView){const h=worldTransform.inverse().transformPoint(g.getTransform().transformPoint(hand));g.save();g.setTransform(worldTransform);const key=drawDoorKey(g,h,doorView);g.restore();toolAttachment={kind:'key',hand:{x:h.x,y:h.y},...key};playerAvatar.drawGrip(g,drawLook,facing,motion);}
  g.scale(facing,1);g.translate(hand.x/facing+22,hand.y+40);
  if(action?.kind==='branch'&&actionView.impact){g.save();g.globalAlpha=phase>.8?(1-phase)*5:1;g.drawImage(assets[action.kind],-43,-61,29,31);g.restore();}
  if(invitation.active()){const point=g.getTransform().transformPoint({x:-22,y:-45});invitation.hand({x:point.x/(DPR*S)+camera.x,y:point.y/(DPR*S)+camera.y});}
  if(action?.kind!=='harvest')story.held(g);g.restore();placeName($('lifePlayerName'),ctx.getStudent()?.nickname||'모험가',drawPos.x,drawPos.y+17);
 }
 function placeName(el,text,x,y){const scale=dialogue.view(W,H,S,camera,pos)?.scale||arrival.view(W,H,S)?.scale||S;if(el.textContent!==text)el.textContent=text;el.style.left=Math.round((x-camera.x)*scale)+'px';el.style.top=Math.round((y-camera.y)*scale)+'px';}
 function drawWorld(t){
  toolAttachment=null;
  $('lifeNpcName').hidden=mode!=='play'||scene!=='campus'||arrival.snapshot()?.phase==='view'||dialogue.active();$('lifePlayerName').hidden=arrival.snapshot()?.phase==='view'||dialogue.active()||gesture?.kind==='dust'||doorAction.active(t,reduced.matches);
  g.setTransform(DPR,0,0,DPR,0,0);g.clearRect(0,0,W,H);g.fillStyle='#95b27c';g.fillRect(0,0,W,H);
  if(mode==='intro'||mode==='replay'){prologue.draw(g,assets,W,H,t,reduced.matches,stopped||document.hidden);return;}
  if(mode==='title'&&!assets.campus)return;if(mode!=='title'&&!assetsReady)return;
  if(mode==='title'){const s=Math.max(W/1536,H/1024)*1.05;g.drawImage(assets.campus,(W-1536*s)/2+Math.sin(t*.00004)*12,(H-1024*s)/2,1536*s,1024*s);if(!reduced.matches){for(let i=0;i<15;i++){const x=(i*139+t*.018)% (W+40)-20,y=(i*79+t*.009)%H;g.save();g.translate(x,y);g.rotate(t*.0006+i);ellipse(0,0,5,2.5,i%2?'#f8e6b6bb':'#d3e1a2aa');g.restore();}}return;}
  camera.x=clamp(pos.x-W/(2*S),0,Math.max(0,1600-W/S));camera.y=clamp(pos.y-H*.54/S,0,Math.max(0,1067-H/S));if(H/S>1067)camera.y=(1067-H/S)/2;
  const arrivalView=dialogue.view(W,H,S,camera,pos)||arrival.view(W,H,S),worldScale=arrivalView?.scale||S;if(arrivalView)camera={x:arrivalView.x,y:arrivalView.y};
  g.scale(worldScale,worldScale);g.translate(-camera.x,-camera.y);const visibleState=construction()?.status==='ready'?[...new Set([...state.projects,'school'])]:state.projects;const visualProjects=visibleState.filter(id=>repair.visible(id,visibleState,t,reduced.matches));const backdrop=assets[scene==='campus'?(visualProjects.includes('school')?'restored':'campus'):scene==='classroom'&&!state.opening.legacy&&state.opening.step<5?'classroomClosed':scene];if(scene==='classroom')opening.drawClassroom(g,assets);else g.drawImage(backdrop,0,0,1600,1067);const props=furnitureDepth.layers(scene,backdrop).map(p=>({...p,draw:()=>p.draw(g)}));
  if(scene==='campus'){
   for(const plot of ground.snapshot().plots){const beforeContact=gesture?.kind==='dig'&&gesture.id===plot.cell&&!actionFrame('dig',(t-gesture.at)/gestureDuration(),reduced.matches).impact;if(!plot.tilled&&!(gesture?.cover&&beforeContact))continue;if(beforeContact&&!gesture.cover)continue;const c=groundCell(plot.cell);g.drawImage(assets.soil,c.x-26,c.y-16,52,34);}
   for(let i=0;i<6;i++){const [x,y]=FLOWERS[i];if(i<3||visualProjects.includes('garden')){const held=gesture?.kind==='harvest'&&gesture.index===i&&!harvestFrame((t-gesture.at)/HARVEST_MS,reduced.matches).contact&&!reduced.matches;flower(x,y,held?gesture.flowerKind:flowers()[i].kind,held?3:flowers()[i].stage);}}
   WEEDS.forEach(([x,y],i)=>{if(!state.weeds.includes(i))weed(x,y);else{ellipse(x,y,22,7,'#b7c47d55');}});BRANCHES.forEach(([x,y],i)=>{if(!state.branches.includes(i))branch(x,y);});
   props.push(visualProjects.includes('bench')?{id:'bench',y:595,draw:()=>sprite(assets.bench,945,595,150,105)}:{id:'brokenBench',y:619,draw:()=>g.drawImage(assets.brokenBench,872,490,146,129)});
   if(visualProjects.includes('lights')){for(let i=0;i<5;i++){const x=630+i*105,y=931;props.push({id:'lantern'+i,y:y+7,draw:()=>g.drawImage(assets.lantern,x-32,y-103,64,110)});}}
   for(let i=0;i<4;i++){const x=1260+i*48,y=590+Math.sin(t*.0005+i)*90;g.strokeStyle='#d9f3df88';g.lineWidth=2;g.beginPath();g.ellipse(x,y,12+Math.sin(t*.001+i)*3,3,0,0,Math.PI*2);g.stroke();}

  }else if(scene==='room'){if(state.roomPlant>=0)props.push({id:'roomPlant',y:549,draw:()=>{ellipse(1450,549,20,9,'#946b50');g.fillStyle='#c89468';g.fillRect(1435,531,30,18);flower(1450,530,state.roomPlant,3,true);}});}
  else{DUST.forEach(([x,y],i)=>{if(!state.dust.includes(i)){for(let n=0;n<5;n++)ellipse(x+(n-2)*9,y+Math.sin(n)*6,12,6,'#b5a38399');}});if(visualProjects.includes('library')){props.push({id:'readingNook',y:800,draw:()=>g.drawImage(assets.readingNook,1069,650,182,150)});}}
  if(gesture&&!reduced.matches&&!actionFrame(gesture.kind,(t-gesture.at)/gestureDuration()).impact){
   if(gesture.kind==='weed')drawWeedRoot(g,assets.weed,gesture,(t-gesture.at)/gestureDuration(),reduced.matches);
   if(gesture.kind==='branch')branch(gesture.x,gesture.y);
  }
  if(gesture?.kind==='dust'&&scene==='classroom')drawSweptDust(g,gesture,(t-gesture.at)/gestureDuration(),reduced.matches);
  for(const p of repair.layers(scene,assets,level(),state.projects,t,reduced.matches))props.push({...p,draw:()=>p.draw(g)});const repairing=repair.view(t,reduced.matches),building=construction();if(!repairing)for(const p of constructionLayers(scene,assets,building,t,reduced.matches||stopped||document.hidden))props.push({...p,draw:()=>p.draw(g)});for(const p of workerLayers(repairing||(scene==='campus'?constructionView(building,t,reduced.matches||stopped||document.hidden):null),assets))props.push({...p,draw:()=>p.draw(g)});
  memories.draw(g,scene,assets,'photo');if(scene==='classroom')props.push({id:'waitingBook',y:527,draw:()=>memories.draw(g,scene,assets,'book')});opening.draw(g,scene,assets,t,reduced.matches);for(const part of story.depth(scene))props.push({...part,draw:()=>story.draw(g,scene,part.id)});
  if(!working(t)&&!seating.active()&&['can','spade','hoe'].includes(heldTool)&&!fish&&overlay.hidden&&scene==='campus'){
   const c=selectedToolCell(),usable=heldTool==='can'||groundAllowed(c.id)&&(ground.snapshot().plots.some(p=>p.cell===c.id&&p.tilled)||!groundObstructed(c.id,state));drawToolTarget(g,c,usable);
  }
  if(path.length){const goal=path[path.length-1];g.strokeStyle='#fff3b9aa';g.lineWidth=2;g.beginPath();g.ellipse(goal.x,goal.y,12,5,0,0,Math.PI*2);g.stroke();}
  if(near&&!repair.active(t,reduced.matches)&&!doorAction.active(t,reduced.matches)&&!seating.active()&&!fish&&!arrival.active()&&!dialogue.active()){g.strokeStyle='#fff5b5';g.lineWidth=3;g.beginPath();g.ellipse(near.x,near.y+8,29,10,0,0,Math.PI*2);g.stroke();}
  const seatId=seating.snapshot()?.id,playerDepth=Math.max(pos.y,seatId==='bench'?596:seatId==='library'?801:0),people=[...props,{id:'player',y:playerDepth,actor:{left:pos.x-100,right:pos.x+100,top:pos.y-190,bottom:pos.y+30},draw:()=>drawPlayer(t)}];if(scene==='campus'){
   const use=residents().saessak,a=use||{...dialogue.actor('saessak'),w:69,h:103},depth=use?.depth||a.y;
   people.push({id:'saessak',y:depth,actor:{left:a.x-a.w/2,right:a.x+a.w/2,top:a.y-a.h,bottom:a.y+8},draw:()=>{if(use)g.drawImage(assets.saessakSeated,a.x-a.w/2,a.y-a.h,a.w,a.h);else arrival.reaction(g,bob=>sprite(dialogue.pose('saessak')||assets.saessak,a.x,a.y,a.w,a.h,bob));placeName($('lifeNpcName'),'새싹',a.x,use?622:557);}});
  }if(scene==='classroom'&&opening.toriVisible()){
   const use=residents().tori,a=use||{...dialogue.actor('tori'),w:dialogue.pose('tori')?72:81,h:108};
   people.push({id:'tori',y:use?.depth||a.y,actor:{left:a.x-a.w/2,right:a.x+a.w/2,top:a.y-a.h,bottom:a.y+8},draw:()=>sprite(dialogue.pose('tori')||assets.tori,a.x,a.y,a.w,a.h)});
  }for(const p of story.people(scene))people.push({id:p.key,y:p.y,actor:{left:p.x-p.w/2,right:p.x+p.w/2,top:p.y-p.h,bottom:p.y+8},draw:()=>sprite(assets[p.key],p.x,p.y,p.w,p.h)});people.sort((a,b)=>a.y-b.y);depthOrder=people.map(p=>({id:p.id,y:p.y}));people.forEach(p=>{if(p.bounds&&!people.some(a=>a.actor&&a.y<p.y&&a.actor.left<p.bounds.right&&a.actor.right>p.bounds.left&&a.actor.top<p.bounds.bottom&&a.actor.bottom>p.bounds.top))return;p.draw();});if(fish&&toolAttachment?.tip){line([[toolAttachment.tip.x,toolAttachment.tip.y],[1280,fish.phase==='bite'?741:734]],'#f1e9c9',1.5);ellipse(1280,fish.phase==='bite'?741:734,4,5,'#f38762');}
  
  opening.drawLight(g,scene);dialogue.draw(g);invitation.drawWorld(g);
  if(gesture?.kind==='weed')drawWeedFragments(g,gesture,(t-gesture.at)/gestureDuration(),reduced.matches);
  if(gesture?.kind==='plant')drawPlanting(g,gesture,plantingFrame((t-gesture.at)/PLANT_MS,reduced.matches),plantingAttachment,reduced.matches);
  if(gesture?.kind==='harvest')drawHarvest(g,assets[['flower','flowerPink','flowerBlue'][gesture.flowerKind]],gesture,harvestFrame((t-gesture.at)/HARVEST_MS,reduced.matches),harvestAttachment);
  drawWater(g,gesture,t,reduced.matches);feedback.draw(g,scene,pos,t,reduced.matches);
  effect.forEach(e=>{g.globalAlpha=Math.max(0,e.life);ellipse(e.x,e.y,4,4,e.color);});g.globalAlpha=1;
 }
 function tick(t){if(!host.open)return;const dt=Math.min(.05,(t-(lastTime||t))/1000);lastTime=t;
  if(!valid()){close();return;}
  seating.view(t,reduced.matches);moving=false;walkMoving=false;let walked=0;
  if(mode==='play'&&overlay.hidden&&!syncVisible()&&!document.hidden&&!stopped){let dx=0,dy=0;if(keys.has('l'))dx--;if(keys.has('r'))dx++;if(keys.has('u'))dy--;if(keys.has('d'))dy++;
   if(working(t)||seating.active()){keys.clear();path=[];jump=0;}
   if(!working(t)&&!seating.active()&&!fish&&!feedback.busy(t,reduced.matches)){if(dx||dy){gesture=null;path=[];const n=Math.hypot(dx,dy);dx/=n;dy/=n;}else if(path.length){const goal=path[0],dist=distance(pos,goal);if(dist<5)path.shift();else{dx=(goal.x-pos.x)/dist;dy=(goal.y-pos.y)/dist;}}
    const priorPosition={...pos},speed=100/S,xx=pos.x+dx*speed*dt,yy=pos.y+dy*speed*dt;
    const hitX=!!dx&&blocked(xx,pos.y);if(!hitX)pos.x=xx;
    const hitY=!!dy&&blocked(pos.x,yy);if(!hitY)pos.y=yy;
    if(blockedNotice&&(blockedNotice.scene!==scene||distance(blockedNotice,pos)>=28))blockedNotice=null;
    if(hitX||hitY)cannotGo();
    walked=distance(priorPosition,pos)*S;walkMoving=walked>.001;
    moving=!!(dx||dy);look=lookDirection(dx,dy,look);if(dx)facing=dx<0?1:-1;if(moving)actionUntil=0;
   }
   if(!working(t)&&!seating.active())nearest();if(heldTool==='can'&&near?.kind==='flower')$('lifeUse').hidden=true;else $('lifeUse').hidden=!near;$('lifeTool').hidden=!(heldTool==='can'||['spade','hoe'].includes(heldTool)&&scene==='campus')||!!fish||!overlay.hidden||syncVisible();const covering=['spade','hoe'].includes(heldTool)&&ground.snapshot().plots.some(p=>p.tilled&&p.cell===selectedToolCell()?.id);if($('lifeTool').dataset.tool!==heldTool+covering){$('lifeTool').dataset.tool=heldTool+covering;$('lifeTool').setAttribute('aria-label',['spade','hoe'].includes(heldTool)?(covering?'앞의 빈 땅 덮기':'앞의 땅 파기'):'물뿌리개 사용');$('lifeTool').innerHTML='<span>'+(['spade','hoe'].includes(heldTool)?(covering?'땅 덮기':'땅 파기'):'물 주기')+'</span><small>E</small>';}$('lifeUse').querySelector('small').textContent=heldTool==='can'?'Enter':'E / Enter';if(fish){if(t>=fish.bite&&fish.phase==='wait'){fish.phase='bite';tone(1046,.15);}if(t>fish.bite+1800){fish=null;nearId=null;$('lifeFish').hidden=true;toast('물고기를 놓쳤다.');react('sad');}else{$('lifeFish').innerHTML=fish.phase==='bite'?'지금!<meter min="0" max="1800" value="'+Math.max(0,1800-(t-fish.bite))+'"></meter>':'입질 기다리는 중';$('lifeUseText').textContent=fish.phase==='bite'?'낚기!':'기다리기';$('lifeUse').setAttribute('aria-label',fish.phase==='bite'?'지금 낚싯대 올리기':'찌를 보며 기다리기');}}
  }
  if(seating.active()){const seat=seating.snapshot();$('lifePrompt').hidden=true;$('lifeTool').hidden=true;$('lifeUse').hidden=false;$('lifeUseText').textContent=seat.phase==='rest'?'일어나기':seat.phase==='enter'?'앉는 중':'일어나는 중';$('lifeUse').setAttribute('aria-label',seat.phase==='rest'?'자리에서 일어나기':seat.phase==='enter'?'자리에 앉는 중':'자리에서 일어나는 중');nearId=null;}
  const repairView=repair.view(t,reduced.matches);if(repairView){const label={materials:'재료 정리',work:'수리 중',complete:'마무리'}[repairView.stage];$('lifeUse').hidden=false;$('lifeUseText').textContent=label;$('lifeUse').setAttribute('aria-label',label);$('lifeUse').querySelector('small').textContent='';$('lifeTool').hidden=true;nearId=null;}
  reactionView=reactions.sample(t,{active:mode==='play'&&overlay.hidden&&!syncVisible()&&!document.hidden&&!stopped&&!seating.active()&&!moving&&!jump&&['ready','saving'].includes(cloudStatus),ready:cloudStatus==='ready'&&!working(t),reduced:reduced.matches});
  $('lifeToast').style.visibility=reactionView?'hidden':'';
  workControls(t);
  walkPhase=walkMoving?(walkPhase+walked/56)%1:0;
  if(queuedArrival){const q=queuedArrival;if(!valid()||q.owner!==owner||q.token!==ownerToken||mode!=='play'||scene!=='campus'||state!==q.state||distance(pos,q.position)>1||!['saving','ready'].includes(cloudStatus))queuedArrival=null;else if(cloudStatus==='ready'&&overlay.hidden&&!syncVisible())startArrival();}
  if(queuedToast&&t>=queuedToast.at){const message=queuedToast;queuedToast=null;if(message.scene===scene&&overlay.hidden&&mode==='play')toast(message.text);}
  effect.forEach(e=>{e.x+=e.vx*dt;e.y+=e.vy*dt;e.life-=dt;});effect=effect.filter(e=>e.life>0);invitation.tick(t,stopped||document.hidden);arrival.tick(t,stopped||document.hidden);dialogue.tick(t,stopped||document.hidden);drawWorld(t);
  if(t-clock>1000){clock=t;if(mode==='play')refresh();}
  frame=requestAnimationFrame(tick);
 }
 canvas.addEventListener('pointerdown',e=>{if(seating.active()){if(!stopped&&!document.hidden)seatInput();return;}if(mode!=='play'||!overlay.hidden||syncVisible()||working()||stopped||document.hidden||fish||feedback.busy(performance.now(),reduced.matches))return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/S+camera.x,y=(e.clientY-r.top)/S+camera.y;const clicked=entities().find(o=>distance({x,y},o)<42);clearReaction();const dest=clicked?{x:clicked.x,y:clicked.y+48}:{x,y};navigate(dest.x,dest.y);});
 host.querySelectorAll('[data-dir]').forEach(b=>{b.addEventListener('pointerdown',e=>{if(seating.active()){e.preventDefault();if(!stopped&&!document.hidden)seatInput();return;}if(mode!=='play'||!overlay.hidden||syncVisible()||working()||stopped||document.hidden)return;e.preventDefault();clearReaction();b.setPointerCapture(e.pointerId);path=[];keys.add(b.dataset.dir);look=b.dataset.dir;if(look==='l'||look==='r')facing=look==='l'?1:-1;});for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>keys.delete(b.dataset.dir));});
 $('lifeStart').onclick=start;$('lifeUse').onclick=use;$('lifeTool').onclick=useTool;
 host.addEventListener('click',e=>{const action=e.target.closest('[data-life]')?.dataset.life;if(!action)return;({exit:close,sound:toggleSound,bag,journal,map,retry}[action])?.();});
 host.addEventListener('cancel',e=>{e.preventDefault();if(seating.active()){seatInput();return;}if(syncVisible())cloud.dismiss();else if(mode==='intro')title();else if(mode==='replay')endReplay();else if(!overlay.hidden)hideOverlay();else if(mode==='play')journal();else close();});
 window.addEventListener('keydown',e=>{if(!host.open)return;if(e.target.closest('input,textarea,select'))return;if(mode==='play'&&!overlay.hidden&&story.isView()&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)hideOverlay();return;}if(mode==='replay'&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)endReplay();return;}if(e.key==='Tab'){const items=[...host.querySelectorAll('button:not(:disabled)')].filter(b=>b.getClientRects().length&&(syncVisible()?$('lifeSyncPanel').contains(b):!overlay.hidden?overlay.contains(b):true));if(items.length){const at=items.indexOf(document.activeElement);if(at<0&&syncVisible()){e.preventDefault();(e.shiftKey?items.at(-1):items[0]).focus();}else if(e.shiftKey&&at<=0){e.preventDefault();items.at(-1).focus();}else if(!e.shiftKey&&at===items.length-1){e.preventDefault();items[0].focus();}}return;}if((mode==='intro'||mode==='replay')&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','e','E','Enter',' '].includes(e.key)){if(['Enter',' '].includes(e.key)&&e.target.closest('#lifePrologue button')&&!e.repeat)return;e.preventDefault();e.stopImmediatePropagation();if(e.key==='Enter'&&!e.repeat)prologue.next();return;}const dir={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r',w:'u',a:'l',s:'d',d:'r'}[e.key];if(mode==='play'&&overlay.hidden&&!syncVisible()&&(dir||['e','E','Enter',' '].includes(e.key))){e.preventDefault();e.stopImmediatePropagation();if(working()||stopped||document.hidden)return;if(seatInput())return;if(dir||e.key===' ')clearReaction();if(dir){keys.add(dir);look=dir;if(dir==='l'||dir==='r')facing=dir==='l'?1:-1;}else if(e.key===' '){if(!jump)jump=performance.now();}else if(!e.repeat){if(['can','spade','hoe'].includes(heldTool)&&['e','E'].includes(e.key))useTool();else use();}}},true);
 window.addEventListener('keyup',e=>{if(!host.open)return;const dir={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r',w:'u',a:'l',s:'d',d:'r'}[e.key];if(dir)keys.delete(dir);if(e.key===' '&&mode==='play'&&!syncVisible()&&!e.target.closest('.life-invitation-panel button,.life-arrival-panel button,.life-conversation-panel button')){e.preventDefault();e.stopImmediatePropagation();}},true);
 function pause(){clearReaction();toolAttachment=null;seating.cancel();queuedToast=null;feedback.cancel();doorAction.stop();repair.stop();buildIntent=null;gesture=null;workControls();keys.clear();path=[];fish=null;$('lifeFish').hidden=true;stopped=true;stopSound();}
 window.addEventListener('blur',pause);window.addEventListener('focus',()=>{stopped=false;startMusic();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else{stopped=false;startMusic();}});window.addEventListener('resize',resize);
 window.addEventListener('pagehide',()=>{if(host.open&&mode==='play'&&!saveError&&!readError&&valid())mutate(()=>{});pause();});
 window.addEventListener('storage',e=>{if(host.open&&e.key?.includes('classRpgSchoolGround_v1_'))ground.storageChanged();if(host.open&&e.key?.includes('classRpgSchoolGarden_v1_'))garden.storageChanged();});
 window.addEventListener('storage',e=>{if(!host.open)return;if(e.key===null||e.key?.includes('classRpgSchoolStory_v1_'+owner+'_'))story.store.storageChanged();if(e.key===null||e.key?.includes('classRpgSchoolWish_v1_'+owner+'_'))wish.store.storageChanged();if(!valid()){close();return;}if(e.key&&/Token|Session/i.test(e.key)){close();return;}if(e.key===null||e.key.endsWith(saveKey())||e.key.endsWith('classRpgSchoolLifeCloud_v1_'+owner)){hideOverlay();keys.clear();path=[];void cloud.store.activate(owner,ownerToken);}});
 const avatarChanged=()=>{if(host.open&&valid())avatarImages();};
 const avatarObserver=new MutationObserver(avatarChanged);
 for(const id of SLOTS){const image=document.getElementById(id);if(image){avatarObserver.observe(image,{attributes:true,attributeFilter:['src','class']});image.addEventListener('load',avatarChanged);}}
 document.addEventListener('student-dashboard-updated',()=>{if(!host.open)return;if(!valid())close();else{avatarImages();refresh();updateTitle();}});
 const api={open,close,snapshot:()=>({mode,prologue:prologue.snapshot(),invitation:invitation.snapshot(),arrival:arrival.snapshot(),conversation:dialogue.snapshot(),wish:wish.snapshot(),story:story.snapshot(),sound,scene,residents:structuredClone(residents()),position:{...pos},look,avatar:playerAvatar.snapshot(),heldTool,garden:garden.snapshot(),flowers:structuredClone(flowers()),ground:ground.snapshot(),toolTarget:heldTool==='can'?selectedToolCell():['spade','hoe'].includes(heldTool)?selectedToolCell():null,gesture:gesture?.kind||null,seating:seating.snapshot(),planting:gesture?.kind==='plant'?plantingFrame((performance.now()-gesture.at)/PLANT_MS,reduced.matches):null,harvesting:gesture?.kind==='harvest'?harvestFrame((performance.now()-gesture.at)/HARVEST_MS,reduced.matches):null,harvestAttachment:gesture?.kind==='harvest'&&harvestAttachment?structuredClone(harvestAttachment):null,plantingAttachment:gesture?.kind==='plant'&&plantingAttachment?structuredClone(plantingAttachment):null,toolAttachment:toolAttachment&&structuredClone(toolAttachment),depthOrder:depthOrder.map(p=>({...p})),reaction:reactionView&&{...reactionView},reactionPending:reactions.snapshot().pending,working:working(),jumping:!!jump,action:gesture?{...actionFrame(gesture.kind,(performance.now()-gesture.at)/gestureDuration(),reduced.matches),impactShown:!!gesture.impactShown}:null,workers:workerScene(repair.view(performance.now(),reduced.matches)),repair:repair.view(performance.now(),reduced.matches),doorOpening:doorAction.view(performance.now(),reduced.matches),dustSweep:gesture?.kind==='dust'?dustFrame((performance.now()-gesture.at)/gestureDuration(),gesture.direction,reduced.matches):null,weedPull:gesture?.kind==='weed'?weedMotion((performance.now()-gesture.at)/gestureDuration(),reduced.matches):null,windowOpening:windowMotion(),windowLight:scene==='classroom'?opening.lights():[],openingEffect:feedback.busy(performance.now(),reduced.matches),level:level(),near:near?.id||null,entities:entities().map(e=>({id:e.id,x:e.x,y:e.y,kind:e.kind})),goal:opening.goal()||story.goal(),saveError,readError,cloudStatus,cloudRevision:cloud.store.snapshot()?.revision||0,construction:construction(),constructionView:!repair.view(performance.now(),reduced.matches)&&scene==='campus'?constructionView(construction(),performance.now(),reduced.matches||stopped||document.hidden):null,state:structuredClone(state),assetsReady})};window.schoolLife=api;return api;
}
