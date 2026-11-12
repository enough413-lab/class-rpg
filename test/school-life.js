import {createFurnitureDepth} from './school-life-depth.js?v=20261112-depth';
import {createReaction} from './school-life-expression.js?v=20261112-expression';
import {faceTarget} from './school-life-facing.js?v=20261111-facing';
import {drawHeldTool,SPADE_SVG} from './school-life-tools.js?v=20261111-tools';
import {createSeating} from './school-life-seat.js?v=20261111-sitting';
import {actionFrame,ACTION_MS} from './school-life-action.js?v=20261112-curtains';
import {createLifeAvatar,SLOTS} from './school-life-avatar.js?v=20261112-curtains';
import {createSchoolStory} from './school-life-story.js?v=20261112-depth';
import {createSchoolWish} from './school-life-wish.js?v=20261110-memory';
import {createSchoolConversations} from './school-life-conversations.js?v=20261110-scenes';
import {createSchoolArrival} from './school-life-arrival.js?v=20261110-arrival';
import {createInvitationAction} from './school-life-invitation.js?v=20261110-arrival';
import {createSchoolMemories} from './school-life-memories.js?v=20261112-depth';
import {createLifePrologue} from './school-life-prologue.js?v=20261110-replay';
import {createLifeFeedback,drawBroom,drawWater,drawTarget,waterTarget,lookDirection,VECTORS} from './school-life-feedback.js?v=20261111-actions';
import {installLifeNotebook} from './school-life-notebook.js?v=20261112-windows';
import {createSchoolLifeSync} from './school-life-sync.js?v=20261112-windows';
import {installSchoolOpening} from './school-life-opening.js?v=20261112-curtains';
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
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),feedback=createLifeFeedback(),playerAvatar=createLifeAvatar();
 const reactions=createReaction();let reactionView=null;
 function clearReaction(){reactions.clear();reactionView=null;$('lifeToast').style.visibility='';}
 function react(kind,delay=0){reactions.schedule(kind,performance.now(),delay);}
 const furnitureDepth=createFurnitureDepth();let depthOrder=[];
 const seating=createSeating();let seatedAvatarKey=null;
 let walkPhase=0,walkMoving=false;
 let look='d',queuedToast=null,queuedArrival=null,replayOrigin=null;const arrivalsSeen=new Set();
 function laterToast(text,delay=950){queuedToast={text,at:performance.now()+delay,scene};}
 let blockedNotice=null,workControlsLocked=null;
 function working(t=performance.now()){return !!gesture&&['weed','branch','dust','plant','water','window'].includes(gesture.kind)&&t-gesture.at<ACTION_MS;}
 function workControls(t=performance.now()){
  const seat=seating.snapshot(),locked=working(t)||!!seat&&seat.phase!=='rest',menus=locked||!!seat,key=locked+'|'+menus;if(key!==workControlsLocked){workControlsLocked=key;host.querySelectorAll('[data-dir]').forEach(b=>b.disabled=locked);host.querySelectorAll('[data-life=bag],[data-life=journal],[data-life=map]').forEach(b=>b.disabled=menus);}
  $('lifeUse').disabled=locked||(!near&&!seat);$('lifeTool').disabled=locked||!!seat;
 }
 function seatInput(){if(!seating.active())return false;seating.stand(performance.now(),reduced.matches);keys.clear();path=[];jump=0;return true;}
 function sit(id){clearReaction();keys.clear();path=[];jump=0;gesture=null;fish=null;$('lifeFish').hidden=true;seating.start(id,pos,look,performance.now(),reduced.matches);workControls();}
 function beginGesture(data){clearReaction();keys.clear();path=[];jump=0;gesture={...data,at:performance.now()};workControls();}
 function windowMotion(t=performance.now()){return gesture?.kind==='window'&&scene==='classroom'&&t-gesture.at<ACTION_MS?{index:gesture.index,phase:clamp((t-gesture.at)/ACTION_MS,0,1),last:gesture.last,reduced:reduced.matches}:null;}
 function windowOpened(window,previous,last,message){beginGesture({kind:'window',index:window.index,previous,last,x:window.x,y:window.y});laterToast(message,ACTION_MS);tone(last?784:660,.3);if(last)react('joy',ACTION_MS);}
 function cannotGo(){
  if(blockedNotice?.scene===scene&&distance(blockedNotice,pos)<28)return;
  blockedNotice={scene,...pos};toast('아직 갈 수 없다.');
 }
 const level=()=>Math.max(1,Number(ctx.levelInfo(ctx.getStudent()?.xp||0).level)||1);
 const cloud=createSchoolLifeSync({host,getIdentity:()=>({id:ctx.getStudent()?.id,token:ctx.getToken?.()}),rpc:args=>ctx.db.rpc('student_school_life_save',args),onChange:cloudChanged});
 const saveKey=()=>`classRpgSchoolLife_v1_${owner}`;
 const opening=installSchoolOpening({state:()=>state,mutate,talk,react,windowMotion,windowOpened,wishChoice:()=>({label:'이 학교 말인데',run:()=>wish.open('saessak')}),remember:(npc,text)=>wish.remember(npc,text),conversation:showConversation,toast,burst,tone,invitation:readInvitation,invitationActive:()=>invitation.active(),thought:mark=>feedback.notice(mark),unlock:()=>{feedback.unlock();keys.clear();path=[];tone(660,.3);laterToast('교실 문이 열렸다.',2200);}});
 const wish=createSchoolWish({identity:()=>({id:ctx.getStudent()?.id,token:ctx.getToken?.()}),rpc:args=>ctx.db.rpc('student_school_life_wish',args),talk,hide:hideOverlay,overlay,valid});
 const memories=createSchoolMemories({talk,book,overlay:()=>overlay});
 const story=createSchoolStory({identity:()=>({id:ctx.getStudent()?.id,token:ctx.getToken?.()}),rpc:args=>ctx.db.rpc('student_school_life_story',args),original:()=>state,overlay:()=>overlay,assets:()=>assets,avatars:()=>avatar,drawAvatar:(g,d,m)=>playerAvatar.draw(g,d,m),avatarHand:(d,f,m)=>playerAvatar.hand(d,f,m),reduced:()=>reduced.matches,nickname:()=>ctx.getStudent()?.nickname||'모험가',valid:()=>valid()&&mode==='play'&&cloudStatus==='ready'&&!syncVisible(),changed:()=>{refresh();},talk,book,hide:hideOverlay,toast,tone,wishMemory:npc=>wish.remember(npc,''),wish:npc=>wish.open(npc)});
 const names={room:'나의 작은 방',campus:'봄빛 학교',classroom:'우리 교실'};
 const manifest={woods:'maps/life/woods-v1.webp',bellFrame:'maps/life/bell-frame-v1.webp',saessakPoint:'maps/npcs/saessak-point-v1.webp',toriNote:'maps/npcs/tori-note-v1.webp',duri:'maps/npcs/duri-anime-v2.webp',prologueBell:'maps/life/prologue-bell-v1.webp',invitation:'maps/life/invitation-harmony-v2.webp',campus:'maps/life/campus-harmony-v2.webp',restored:'maps/life/restored-harmony-v2.webp',room:'maps/life/room-harmony-v2.webp',classroom:'maps/life/classroom-harmony-v2.webp',classroomClosed:'maps/life/classroomClosed-harmony-v2.webp',saessak:'maps/npcs/saessak-anime-v2.webp',tori:'maps/npcs/tori-anime-v2.webp',bench:'maps/life/bench-harmony-v2.webp',weed:'maps/life/weed-harmony-v2.webp',branch:'maps/life/branch-harmony-v2.webp',soil:'maps/life/soil-harmony-v2.webp',sprout:'maps/life/sprout-harmony-v2.webp',flower:'maps/life/flower-harmony-v2.webp',flowerPink:'maps/life/flowerPink-harmony-v2.webp',flowerBlue:'maps/life/flowerBlue-harmony-v2.webp',brokenBench:'maps/life/brokenBench-harmony-v2.webp',readingNook:'maps/life/readingNook-harmony-v2.webp',lantern:'maps/life/lantern-harmony-v2.webp'};
 const notebook=installLifeNotebook({state:()=>state,level,book,overlay:()=>overlay,valid,mutate,toast,hide:hideOverlay,title,replay:replayPrologue,storyPage:()=>story.journal(),legacy:()=>{close();ctx.openLegacy?.();},held:()=>heldTool,hold:id=>{heldTool=id;nearId=null;}});
 const arrival=createSchoolArrival({overlay,hide:hideOverlay,reduced:()=>reduced.matches,tone,toggleSound,soundEnabled:()=>sound});
 const dialogue=createSchoolConversations({overlay,hide:hideOverlay,reduced:()=>reduced.matches,assets:()=>assets});
 const invitation=createInvitationAction({overlay,hide:hideOverlay,reduced:()=>reduced.matches});
 const prologue=createLifePrologue({host,valid,finish:finishPrologue,cancel:title,tone,toggleSound,soundEnabled:()=>sound});
 manifest.can='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(notebook.can.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="104" height="72" '));manifest.spade='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(SPADE_SVG);manifest.rod='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(notebook.rod.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" '));
 function loadImage(src){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});}
 let loadingAssets=false,loadedAssets=0;
 async function loadAssets(){if(loadingAssets)return;loadingAssets=true;loadedAssets=0;assetError=false;try{await Promise.all(Object.entries(manifest).map(async([key,src])=>{assets[key]=await loadImage(src).catch(error=>{const fallback={saessakPoint:manifest.saessak,toriNote:manifest.tori}[key];if(fallback)return loadImage(fallback);throw error;});loadedAssets++;updateTitle();}));await Promise.all([document.fonts.load('20px SchoolLife'),document.fonts.load('20px SchoolLifeText')]);assetsReady=true;}catch{assetError=true;}loadingAssets=false;updateTitle();}
 function valid(){return host.open&&String(ctx.getStudent()?.id||'')===owner&&String(ctx.getToken?.()||'')===ownerToken;}
 function cloudChanged(s){
  if(!valid()||s.owner!==owner)return;
  cloudStatus=s.status;if(!['ready','saving'].includes(s.status))clearReaction();if(!ownWrite&&s.status!=='ready')seating.cancel();readError=s.status==='unreadable';saveError=!!s.pending&&s.status!=='saving'||['error','offline','storage-error','local-conflict','conflict','recovery'].includes(s.status);
  const changed=JSON.stringify(state)!==JSON.stringify(s.state);
  if(mode==='replay'&&(changed||s.status!=='ready'))endReplay(false);
  if(mode==='intro'&&!ownWrite&&(s.status!=='ready'||changed)){prologue.stop();mode='title';$('lifeTitle').hidden=false;$('lifeHud').hidden=true;keys.clear();path=[];}
  if(changed){state=s.state;if(!ownWrite){clearReaction();seating.cancel();gesture=null;actionUntil=0;scene=state.scene;pos={...state.position};if(blocked(pos.x,pos.y))pos=scene==='campus'?{x:800,y:550}:{x:800,y:780};keys.clear();path=[];fish=null;$('lifeFish').hidden=true;if(!overlay.hidden)hideOverlay();}}
  updateSave();updateTitle();if(mode==='play')refresh();
 }
 function loadState(){void cloud.store.activate(owner,ownerToken);}
 function write(next){
  if(!valid()||cloudStatus!=='ready')return false;
  next.savedAt=new Date().toISOString();ownWrite=true;
  try{return cloud.store.save(readLife(JSON.stringify(next)));}finally{ownWrite=false;}
 }
 function mutate(fn){if(cloudStatus!=='ready'){toast(cloudStatus==='saving'?'저장 중…':'저장 확인 필요');if(cloudStatus!=='saving')cloud.show();return false;}const next=structuredClone(state);next.scene=scene;next.position={...pos};fn(next);const normalized=readLife(JSON.stringify(next));if(JSON.stringify(normalized)===JSON.stringify(state))return true;if(!write(normalized))return false;refresh();return true;}
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
 function open(){clearReaction();toolAttachment=null;seating.cancel();if(!ctx.getStudent()?.id)return;replayOrigin=null;prologue.stop();invitation.stop();arrival.stop();dialogue.stop(true);queuedArrival=null;queuedToast=null;feedback.reset();blockedNotice=null;look='d';focusBack=document.activeElement;owner=String(ctx.getStudent().id);ownerToken=String(ctx.getToken?.()||'');cloud.reset();heldTool='';gesture=null;state=freshLife();scene='room';pos={x:800,y:725};cloudStatus='loading';readError=false;saveError=false;avatarImages();mode='title';stopped=false;host.showModal();startMusic();loadState();void wish.store.activate(owner,ownerToken);void story.store.activate(owner,ownerToken);$('lifeTitle').hidden=false;$('lifeHud').hidden=true;overlay.hidden=true;keys.clear();path=[];resize();if(!assetsReady)loadAssets();updateTitle();lastTime=0;cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);$('lifeStart').focus();}
 function close(){clearReaction();toolAttachment=null;seating.cancel();if(!host.open)return;replayOrigin=null;story.cancelView();story.store.deactivate();wish.close();wish.store.deactivate();prologue.stop();invitation.stop();arrival.stop();dialogue.stop(true);queuedArrival=null;queuedToast=null;feedback.reset();blockedNotice=null;gesture=null;heldTool='';if(mode==='play'&&!saveError&&!readError&&valid())mutate(s=>{s.position={...pos};s.scene=scene;});keys.clear();path=[];fish=null;host.close();playerAvatar.reset();cancelAnimationFrame(frame);stopSound();focusBack?.focus?.({preventScroll:true});}
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
  hideOverlay();feedback.cancel();replayOrigin=origin;keys.clear();path=[];fish=null;$('lifeFish').hidden=true;
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
 function title(){clearReaction();toolAttachment=null;seating.cancel();story.cancelView();replayOrigin=null;wish.close();prologue.stop();invitation.stop();arrival.stop();dialogue.stop(true);queuedArrival=null;queuedToast=null;feedback.reset();keys.clear();path=[];fish=null;$('lifeFish').hidden=true;if(mode==='play'&&!saveError&&!readError)mutate(()=>{});mode='title';overlay.hidden=true;$('lifeTitle').hidden=false;$('lifeHud').hidden=true;updateTitle();$('lifeStart').focus();}
 function refresh(){if(!host.open)return;$('lifePlace').textContent=names[scene];$('lifeClock').textContent=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());$('lifeLevel').textContent=`${ctx.getStudent()?.nickname||'모험가'} · Lv. ${level()}`;$('lifeTask').innerHTML=svg('book')+'<span><small>받은 부탁</small><strong>'+esc(opening.goal()||story.goal())+'</strong></span>';$('lifeTask').hidden=!(opening.goal()||story.goal());updateSave();nearId=null;}
 function hideOverlay(){clearReaction();seating.cancel();story.cancelView();wish.close();arrival.stop();dialogue.stop();queuedArrival=null;invitation.stop();gesture=null;overlay.hidden=true;overlay.replaceChildren();keys.clear();path=[];($('lifeUse').hidden?canvas:$('lifeUse')).focus({preventScroll:true});}
 function showConversation(kind,finish){hideOverlay();const origin={scene,state,position:{...pos},owner,token:ownerToken};fish=null;$('lifeFish').hidden=true;dialogue.start(kind,()=>valid()&&mode==='play'&&cloudStatus==='ready'&&!syncVisible()&&owner===origin.owner&&ownerToken===origin.token&&scene===origin.scene&&state===origin.state&&distance(pos,origin.position)<=1,finish);}
 function talk(name,text,choices=[{label:'확인'}],face){clearReaction();arrival.stop();dialogue.stop();queuedArrival=null;invitation.stop();const origin={scene,position:{...pos},state};keys.clear();path=[];fish=null;$('lifeFish').hidden=true;overlay.hidden=false;overlay.innerHTML=`<section class="life-dialog" role="dialog" aria-label="${esc(name)}의 이야기"><div class="life-speaker">${esc(name)}</div>${face?`<img class="life-face" src="${manifest[face]}" alt="">`:''}<p>${esc(text)}</p><div class="life-choices"></div></section>`;for(const choice of choices){const b=document.createElement('button');b.className='life-choice';b.textContent=choice.label;b.onclick=()=>{if(!valid()||mode!=='play'||overlay.hidden||!overlay.contains(b)||origin.scene!==scene||origin.state!==state||distance(origin.position,pos)>76)return;hideOverlay();choice.run?.();};overlay.querySelector('.life-choices').append(b);}overlay.querySelector('button')?.focus({preventScroll:true});}
 function book(title,html){clearReaction();arrival.stop();dialogue.stop();queuedArrival=null;invitation.stop();feedback.cancel();keys.clear();path=[];fish=null;gesture=null;$('lifeFish').hidden=true;overlay.hidden=false;overlay.innerHTML=`<section class="life-book" role="dialog" aria-label="${esc(title)}"><header class="life-book-head"><h2>${esc(title)}</h2><button class="life-book-close" aria-label="수첩 닫기">×</button></header><div class="life-book-body">${html}</div></section>`;overlay.querySelector('button').onclick=hideOverlay;overlay.querySelector('button')?.focus({preventScroll:true});}
 function bag(){if(!seating.active()&&!working()&&!stopped&&!document.hidden)notebook.bag();}
 function journal(){if(!seating.active()&&!working()&&!stopped&&!document.hidden)notebook.journal();}
 function map(){if(seating.active()||working()||stopped||document.hidden)return;book('우리 학교 산책 지도','<canvas class="life-map-canvas" id="lifeMapCanvas" width="750" height="500" aria-label="왼쪽 내 방, 위쪽 학교, 가운데 화단, 오른쪽 연못"></canvas><p>집 → 앞마당 → 학교 · 오른쪽에는 연못<br>바닥 클릭: 이동 · 가까운 대상: 행동</p><p class="life-remember">방향키 / WASD 걷기 · E / Enter 표시된 행동 · Space 폴짝 · Esc 수첩 닫기</p>');const c=$('lifeMapCanvas').getContext('2d');c.drawImage(assets.campus,0,0,750,500);c.font='17px SchoolLife';c.textAlign='center';for(const [text,x,y]of[['내 방',120,265],['학교',390,205],['꽃밭',310,320],['연못',625,430]]){c.fillStyle='#fff6dc';c.fillRect(x-35,y-18,70,26);c.fillStyle='#405d3f';c.fillText(text,x,y);}if(scene==='campus'){c.fillStyle='#e17d59';c.beginPath();c.arc(pos.x/1600*750,pos.y/1067*500,6,0,Math.PI*2);c.fill();}}
 function baseEntities(){
  if(scene==='room')return [{id:'door',x:800,y:965,label:'학교로 나가기',action:'나가기',kind:'exit',target:'campus'},{id:'plant',x:1400,y:630,label:'내 방의 작은 화분',action:'꾸미기',kind:'plant'}];
  if(scene==='classroom')return [{id:'door',x:800,y:965,label:'마당으로 나가기',action:'나가기',kind:'exit',target:'campus'},{id:'tori',x:1060,y:615,label:'토리',action:'대화',kind:'npc'},...DUST.map(([x,y],i)=>({id:'dust'+i,x,y,index:i,label:'먼지 쓸기',action:'쓸기',kind:'dust'})).filter(o=>!state.dust.includes(o.index)),{id:'library',x:1160,y:775,label:'작은 책쉼터',action:state.projects.includes('library')?'쉬기':'살피기',kind:'project'}];
  return [{id:'home',x:260,y:548,label:'내 방으로',action:'들어가기',kind:'exit',target:'room'},{id:'schoolDoor',x:815,y:435,label:'교실로',action:'들어가기',kind:'exit',target:'classroom'},{id:'saessak',x:540,y:540,label:'새싹',action:'대화',kind:'npc'},{id:'pond',x:1155,y:786,label:'연못 낚시',action:'낚시하기',kind:'pond'},{id:'bench',x:945,y:610,label:'나무 벤치',action:state.projects.includes('bench')?'쉬기':'살피기',kind:'project'},{id:'school',x:935,y:457,label:'학교에 새 봄빛',action:'살피기',kind:'project'},{id:'garden',x:805,y:591,label:'넓어진 꽃밭',action:'살피기',kind:'project'},{id:'lights',x:970,y:946,label:'등굣길 꽃등',action:'살피기',kind:'project'},...WEEDS.map(([x,y],i)=>({id:'weed'+i,x,y,index:i,label:'잡초 뽑기',action:'뽑기',kind:'weed'})).filter(o=>!state.weeds.includes(o.index)),...BRANCHES.map(([x,y],i)=>({id:'branch'+i,x,y,index:i,label:'나뭇가지 줍기',action:'줍기',kind:'branch'})).filter(o=>!state.branches.includes(o.index)),...FLOWERS.slice(0,state.projects.includes('garden')?6:3).map(([x,y],i)=>({id:'flower'+i,x,y,index:i,label:state.flowers[i].stage===0?'빈 흙':FLOWER_NAMES[state.flowers[i].kind],action:state.flowers[i].stage===0?'심기':state.flowers[i].stage<3?'물 주기':'살피기',kind:'flower'}))];
 }
 function entities(){return [...baseEntities().filter(e=>e.id!=='tori'||opening.toriVisible()).filter(e=>e.kind!=='project'||state.projects.includes(e.id)||level()>=PROJECTS.find(p=>p.id===e.id).level),...opening.entities(scene),...memories.entities(scene),...story.entities(scene)];}
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
  if(e.kind==='npc'){if(e.id==='saessak'){const text=state.weeds.length<6?'여기, 작은 초록빛이 숨어 있어.\n마당의 잡초를 뽑고 빈 흙에 꽃을 심어 볼래?\n나뭇가지는 벤치를 고칠 때 쓸 수 있어.':state.flowers.slice(0,3).some(f=>f.stage<3)?'마당이 훨씬 환해졌어!\n씨앗을 심고 두 번 물을 주면 꽃이 피어.\n어떤 꽃을 심을지는 주머니에서 골라 봐.':'우리가 돌본 학교에 꽃이 피었네!\n네가 고른 꽃이 학교와 참 잘 어울려.\n가끔 연못에서 쉬어 가는 것도 좋아.';talk('새싹',wish.remember('saessak',text),[{label:'둘러볼게'},{label:'이 학교 말인데',run:()=>wish.open('saessak')}],'saessak');}else talk('토리',wish.remember('tori',state.projects.includes('library')?'우리 교실에 책쉼터가 생겼네!\n여기 앉아서 한숨 돌려도 좋아.':'네가 들어오니 교실에 생기가 도네.\n여기서 다시 책을 읽을 수 있어 기뻐.'),[{label:'다녀올게'},{label:'이 학교 말인데',run:()=>wish.open('tori')}],'tori');return;}
  if(['weed','branch','dust'].includes(e.kind)){const field={weed:'weeds',branch:'branches',dust:'dust'}[e.kind];if(mutate(s=>{if(!s[field].includes(e.index)){s[field].push(e.index);if(e.kind==='branch')s.wood++;}})){beginGesture({kind:e.kind,x:e.x,y:e.y});gesture.color=e.kind==='dust'?'#d8c9ab':'#fbe3a1';laterToast(e.kind==='weed'?'잡초를 뽑았다.':e.kind==='branch'?'나뭇가지 +1':'먼지를 쓸었다.');}return;}
  if(e.kind==='flower'){const f=state.flowers[e.index];if(f.stage===3){talk(FLOWER_NAMES[f.kind],'꽃이 활짝 피었다.\n같은 꽃 모양의 화분을 방에 놓을 수 있다.',[{label:'내 방에 놓기',run:()=>{if(mutate(s=>s.roomPlant=f.kind))toast('방에 화분을 놓았다.');}},{label:'여기서 바라보기'}]);}else if(mutate(s=>{const f=s.flowers[e.index];if(!f.stage)f.kind=s.seed;f.stage++;})){beginGesture({kind:f.stage>0?'water':'plant',x:e.x,y:e.y,from:{...pos},spout:waterSpout()});burst(e.x,e.y,f.stage===2?'#ffeaaa':'#b9dfed');tone(880,.15);if(f.stage===2)react('joy',ACTION_MS);laterToast(state.flowers[e.index].stage===1?'씨앗을 심었다.':state.flowers[e.index].stage===2?'새싹이 돋았다.':'꽃이 피었다.');}return;}
  if(e.kind==='plant'){if(state.roomPlant<0)talk('작은 선반','학교에서 키운 꽃 모양의 화분을 놓는 자리.');else talk('나의 작은 화분',FLOWER_NAMES[state.roomPlant]+' 화분. 학교에서 키운 꽃과 같은 모양이다.');return;}
  if(e.kind==='project'){const p=PROJECTS.find(p=>p.id===e.id);if(state.projects.includes(e.id)){if(e.id==='bench'||e.id==='library'){sit(e.id);}else talk(p.name,'수리가 끝났다.');return;}const reason=projectRequirement(state,p.id,level());if(reason){talk(p.name,reason+`\n${p.description}`,[{label:'확인'},{label:'학교 수첩',run:journal}]);return;}talk(p.name,p.description+(p.wood?`\n나뭇가지 ${p.wood}개 필요`:''),[{label:'함께 고치기',run:()=>{if(projectRequirement(state,p.id,level()))return;if(mutate(s=>{s.projects.push(p.id);s.wood-=p.wood;})){burst(e.x,e.y);tone(1046,.3);toast(p.name+' 완성');react('joy');}}},{label:'조금 이따가'}]);return;}
  if(e.kind==='pond'){heldTool='rod';look='r';facing=-1;fish={phase:'wait',at:performance.now(),bite:performance.now()+1700+Math.random()*1600};$('lifeFish').hidden=false;tone(440,.1);}
 }
 function selectedWater(){return scene==='campus'?waterTarget(pos,look,FLOWERS.slice(0,state.projects.includes('garden')?6:3)):{x:pos.x+VECTORS[look][0]*56,y:pos.y+VECTORS[look][1]*56,index:-1};}
 function waterSpout(){const [dx,dy]=VECTORS[look],hand=playerAvatar.hand(look,facing);return {x:pos.x+hand.x+dx*28,y:pos.y+hand.y+dy*28};}
 function useTool(){if(seating.active())return;
  if(!valid()||mode!=='play'||!overlay.hidden||syncVisible()||working()||stopped||document.hidden||fish||heldTool!=='can'||feedback.busy(performance.now(),reduced.matches)||performance.now()<actionUntil)return;
  if(cloudStatus!=='ready'){if(cloudStatus!=='saving')cloud.show();return;}
  const target=selectedWater(),flower=target.index>=0?state.flowers[target.index]:null;
  if(flower&&flower.stage>0&&flower.stage<3){if(!mutate(s=>s.flowers[target.index].stage++))return;laterToast(flower.stage===1?'새싹이 돋았다.':'꽃이 피었다.');}
  actionUntil=performance.now()+950;keys.clear();path=[];beginGesture({kind:'water',...target,from:{...pos},spout:waterSpout()});if(flower?.stage===2)react('joy',ACTION_MS);tone(660,.12);
 }
 function reel(){if(!fish)return;const good=fish.phase==='bite';fish=null;nearId=null;$('lifeFish').hidden=true;if(good){const n=state.fish.reduce((a,b)=>a+b,0)%3,first=!state.fish[n];if(mutate(s=>s.fish[n]=Math.min(999,s.fish[n]+1))){burst(1165,786,'#d6eff0');toast(FISH_NAMES[n]+' 발견. 낚시 기록에 남기고 방생했다.');tone(880,.3);react(first?'surprise':'joy');}}else{toast('너무 일찍 낚싯대를 올렸다.');react('sad');}}
 function tone(freq,duration){if(!sound||!audio||stopped||document.hidden)return;const o=audio.createOscillator(),v=audio.createGain();o.type='sine';o.frequency.value=freq;v.gain.setValueAtTime(0,audio.currentTime);v.gain.linearRampToValueAtTime(.035,audio.currentTime+.025);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(v);v.connect(audio.destination);o.start();o.stop(audio.currentTime+duration+.03);}
 function stopSound(){clearInterval(audioTimer);audio?.suspend?.();}
 function startMusic(){clearInterval(audioTimer);if(!sound||!host.open||stopped||document.hidden)return;audio?.resume?.();let n=0;audioTimer=setInterval(()=>{if(!host.open||document.hidden||stopped||mode==='intro'||mode==='replay'||arrival.active())return;tone([523,659,784,659,587,440,523,0][n++%8],1.1);},2300);}
 function toggleSound(){sound=!sound;if(sound){try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();startMusic();tone(523,.5);}catch{sound=false;toast('소리를 재생할 수 없다.');}}else stopSound();host.querySelectorAll('[data-life=sound]').forEach(b=>{b.setAttribute('aria-pressed',String(sound));b.setAttribute('aria-label',sound?'소리 끄기':'소리 켜기');});}
 function ellipse(x,y,rx,ry,fill){g.fillStyle=fill;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();}
 function line(points,color,width=3){g.strokeStyle=color;g.lineWidth=width;g.lineJoin='round';g.lineCap='round';g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();}
 function flower(x,y,kind,stage,small=false){g.save();g.translate(x,y);if(small)g.scale(.7,.7);g.drawImage(assets.soil,-28,-12,56,31);if(stage===1){ellipse(0,-1,4,3,'#d9c68a');}else if(stage===2){g.drawImage(assets.sprout,-22,-31,44,38);}else if(stage===3){g.drawImage(assets[['flower','flowerPink','flowerBlue'][kind]],-28,-61,56,69);}g.restore();}
 function weed(x,y){g.drawImage(assets.weed,x-25,y-40,50,52);}
 function branch(x,y){g.drawImage(assets.branch,x-31,y-27,62,52);}
 function flag(x,y,text){line([[x,y],[x,y-42]],'#85734c',4);g.fillStyle='#e9d7a4';g.beginPath();g.roundRect(x-22,y-55,44,25,4);g.fill();g.strokeStyle='#8c8053';g.lineWidth=2;g.stroke();g.font='14px SchoolLife';g.textAlign='center';g.fillStyle='#695b3b';g.fillText(text,x,y-37);}
 function sprite(img,x,y,w,h,bob=0){if(!img?.complete||!img.naturalWidth)return;ellipse(x,y+4,w*.26,8,'#364e3930');g.drawImage(img,x-w/2,y-h+bob,w,h);}
 let toolAttachment=null;
 function drawPlayer(t){
  toolAttachment=null;
  const seat=seating.view(t,reduced.matches),drawPos=seat||pos,drawLook=seat?.look||look;
  const j=jump?Math.sin(clamp((t-jump)/550,0,1)*Math.PI)*26:0;if(jump&&t-jump>550)jump=0;
  const action=gesture&&t-gesture.at<950?gesture:null;if(!action)gesture=null;
  const phase=action?clamp((t-action.at)/ACTION_MS,0,1):0,actionView=action?actionFrame(action.kind,phase,reduced.matches):null,bend=actionView?.lean||0;
  if(action?.color&&actionView.impact&&!action.impactShown){action.impactShown=true;burst(action.x,action.y,action.color);tone(660,.12);}
  ellipse(drawPos.x,seat?drawPos.y+15:pos.y+5,20,7,'#314b3b45');g.save();g.translate(drawPos.x,drawPos.y-j+(reactionView?.dy||0));g.rotate(-bend*.24*facing+(reactionView?.angle||0));
  const motion={reaction:reactionView,seated:seat&&!seat.walking?seat.amount:undefined,action:action&&!reduced.matches?actionView:null,facing,walking:seat?seat.walking&&!reduced.matches:walkMoving&&!jump&&!reduced.matches&&!action,phase:seat?seat.walkPhase:walkPhase,carry:!!(heldTool||fish||story.carrying()||invitation.active())};playerAvatar.draw(g,drawLook,motion);const hand=playerAvatar.hand(drawLook,facing,motion);
  const tool=seat?'':fish?'rod':action?.kind==='water'?'can':action?.kind==='plant'?'spade':action?'':heldTool;
  if(tool&&!story.carrying()){
   const h=g.getTransform().transformPoint(hand);g.save();g.translate(hand.x,hand.y);const drawn=drawHeldTool(g,{kind:tool,asset:assets[tool],direction:drawLook,facing,action:actionView,fishing:!!fish});g.restore();
   if(drawn){const world=p=>p&&({x:p.x/(DPR*S)+camera.x,y:p.y/(DPR*S)+camera.y});toolAttachment={kind:tool,hand:world(h),grip:world(drawn.grip),tip:world(drawn.tip),spout:world(drawn.spout)};if(action?.kind==='water')action.spout=toolAttachment.spout;playerAvatar.drawGrip(g,drawLook,facing,motion);}
  }
  g.scale(facing,1);g.translate(hand.x/facing+22,hand.y+40);
  if(action?.kind==='dust')drawBroom(g,phase,reduced.matches);
  if((action?.kind==='weed'||action?.kind==='branch')&&actionView.impact){g.save();g.globalAlpha=phase>.8?(1-phase)*5:1;g.drawImage(assets[action.kind],-43,-61,29,31);g.restore();}
  if(invitation.active()){const point=g.getTransform().transformPoint({x:-22,y:-45});invitation.hand({x:point.x/(DPR*S)+camera.x,y:point.y/(DPR*S)+camera.y});}
  story.held(g);g.restore();placeName($('lifePlayerName'),ctx.getStudent()?.nickname||'모험가',drawPos.x,drawPos.y+17);
 }
 function placeName(el,text,x,y){const scale=dialogue.view(W,H,S,camera,pos)?.scale||arrival.view(W,H,S)?.scale||S;if(el.textContent!==text)el.textContent=text;el.style.left=Math.round((x-camera.x)*scale)+'px';el.style.top=Math.round((y-camera.y)*scale)+'px';}
 function drawWorld(t){
  toolAttachment=null;
  $('lifeNpcName').hidden=mode!=='play'||scene!=='campus'||arrival.snapshot()?.phase==='view'||dialogue.active();$('lifePlayerName').hidden=arrival.snapshot()?.phase==='view'||dialogue.active();
  g.setTransform(DPR,0,0,DPR,0,0);g.clearRect(0,0,W,H);g.fillStyle='#95b27c';g.fillRect(0,0,W,H);
  if(mode==='intro'||mode==='replay'){prologue.draw(g,assets,W,H,t,reduced.matches,stopped||document.hidden);return;}
  if(mode==='title'&&!assets.campus)return;if(mode!=='title'&&!assetsReady)return;
  if(mode==='title'){const s=Math.max(W/1536,H/1024)*1.05;g.drawImage(assets.campus,(W-1536*s)/2+Math.sin(t*.00004)*12,(H-1024*s)/2,1536*s,1024*s);if(!reduced.matches){for(let i=0;i<15;i++){const x=(i*139+t*.018)% (W+40)-20,y=(i*79+t*.009)%H;g.save();g.translate(x,y);g.rotate(t*.0006+i);ellipse(0,0,5,2.5,i%2?'#f8e6b6bb':'#d3e1a2aa');g.restore();}}return;}
  camera.x=clamp(pos.x-W/(2*S),0,Math.max(0,1600-W/S));camera.y=clamp(pos.y-H*.54/S,0,Math.max(0,1067-H/S));if(H/S>1067)camera.y=(1067-H/S)/2;
  const arrivalView=dialogue.view(W,H,S,camera,pos)||arrival.view(W,H,S),worldScale=arrivalView?.scale||S;if(arrivalView)camera={x:arrivalView.x,y:arrivalView.y};
  g.scale(worldScale,worldScale);g.translate(-camera.x,-camera.y);const backdrop=assets[scene==='campus'?(state.projects.includes('school')?'restored':'campus'):scene==='classroom'&&!state.opening.legacy&&state.opening.step<5?'classroomClosed':scene];if(scene==='classroom')opening.drawClassroom(g,assets);else g.drawImage(backdrop,0,0,1600,1067);const props=furnitureDepth.layers(scene,backdrop).map(p=>({...p,draw:()=>p.draw(g)}));
  if(scene==='campus'){
   for(let i=0;i<6;i++){const [x,y]=FLOWERS[i];if(i<3||state.projects.includes('garden')){flower(x,y,state.flowers[i].kind,state.flowers[i].stage);}}
   WEEDS.forEach(([x,y],i)=>{if(!state.weeds.includes(i))weed(x,y);else{ellipse(x,y,22,7,'#b7c47d55');}});BRANCHES.forEach(([x,y],i)=>{if(!state.branches.includes(i))branch(x,y);});
   props.push(state.projects.includes('bench')?{id:'bench',y:595,draw:()=>sprite(assets.bench,945,595,150,105)}:{id:'brokenBench',y:619,draw:()=>g.drawImage(assets.brokenBench,872,490,146,129)});
   if(state.projects.includes('lights')){for(let i=0;i<5;i++){const x=630+i*105,y=931;props.push({id:'lantern'+i,y:y+7,draw:()=>g.drawImage(assets.lantern,x-32,y-103,64,110)});}}
   for(let i=0;i<4;i++){const x=1260+i*48,y=590+Math.sin(t*.0005+i)*90;g.strokeStyle='#d9f3df88';g.lineWidth=2;g.beginPath();g.ellipse(x,y,12+Math.sin(t*.001+i)*3,3,0,0,Math.PI*2);g.stroke();}

  }else if(scene==='room'){if(state.roomPlant>=0)props.push({id:'roomPlant',y:549,draw:()=>{ellipse(1450,549,20,9,'#946b50');g.fillStyle='#c89468';g.fillRect(1435,531,30,18);flower(1450,530,state.roomPlant,3,true);}});}
  else{DUST.forEach(([x,y],i)=>{if(!state.dust.includes(i)){for(let n=0;n<5;n++)ellipse(x+(n-2)*9,y+Math.sin(n)*6,12,6,'#b5a38399');}});if(state.projects.includes('library')){props.push({id:'readingNook',y:800,draw:()=>g.drawImage(assets.readingNook,1069,650,182,150)});}}
  if(gesture&&!reduced.matches&&!actionFrame(gesture.kind,(t-gesture.at)/ACTION_MS).impact){
   if(gesture.kind==='weed')weed(gesture.x,gesture.y);
   if(gesture.kind==='branch')branch(gesture.x,gesture.y);
   if(gesture.kind==='dust')for(let n=0;n<5;n++)ellipse(gesture.x+(n-2)*9,gesture.y+Math.sin(n)*6,12,6,'#b5a38399');
  }
  memories.draw(g,scene,assets,'photo');if(scene==='classroom')props.push({id:'waitingBook',y:527,draw:()=>memories.draw(g,scene,assets,'book')});opening.draw(g,scene,assets,t,reduced.matches);for(const part of story.depth(scene))props.push({...part,draw:()=>story.draw(g,scene,part.id)});
  if(!seating.active()&&heldTool==='can'&&!fish&&overlay.hidden&&scene==='campus')drawTarget(g,selectedWater());
  if(path.length){const goal=path[path.length-1];g.strokeStyle='#fff3b9aa';g.lineWidth=2;g.beginPath();g.ellipse(goal.x,goal.y,12,5,0,0,Math.PI*2);g.stroke();}
  if(near&&!seating.active()&&!fish&&!arrival.active()&&!dialogue.active()){g.strokeStyle='#fff5b5';g.lineWidth=3;g.beginPath();g.ellipse(near.x,near.y+8,29,10,0,0,Math.PI*2);g.stroke();}
  const seatId=seating.snapshot()?.id,playerDepth=Math.max(pos.y,seatId==='bench'?596:seatId==='library'?801:0),people=[...props,{id:'player',y:playerDepth,actor:{left:pos.x-100,right:pos.x+100,top:pos.y-190,bottom:pos.y+30},draw:()=>drawPlayer(t)}];if(scene==='campus')people.push({id:'saessak',y:540,actor:{left:dialogue.actor('saessak').x-35,right:dialogue.actor('saessak').x+35,top:437,bottom:548},draw:()=>{arrival.reaction(g,bob=>sprite(dialogue.pose('saessak')||assets.saessak,dialogue.actor('saessak').x,540,69,103,bob));placeName($('lifeNpcName'),'새싹',540,557);}});if(scene==='classroom'&&opening.toriVisible())people.push({id:'tori',y:615,actor:{left:dialogue.actor('tori').x-41,right:dialogue.actor('tori').x+41,top:507,bottom:623},draw:()=>sprite(dialogue.pose('tori')||assets.tori,dialogue.actor('tori').x,615,dialogue.pose('tori')?72:81,108)});for(const p of story.people(scene))people.push({id:p.key,y:p.y,actor:{left:p.x-p.w/2,right:p.x+p.w/2,top:p.y-p.h,bottom:p.y+8},draw:()=>sprite(assets[p.key],p.x,p.y,p.w,p.h)});people.sort((a,b)=>a.y-b.y);depthOrder=people.map(p=>({id:p.id,y:p.y}));people.forEach(p=>{if(p.bounds&&!people.some(a=>a.actor&&a.y<p.y&&a.actor.left<p.bounds.right&&a.actor.right>p.bounds.left&&a.actor.top<p.bounds.bottom&&a.actor.bottom>p.bounds.top))return;p.draw();});if(fish&&toolAttachment?.tip){line([[toolAttachment.tip.x,toolAttachment.tip.y],[1280,fish.phase==='bite'?741:734]],'#f1e9c9',1.5);ellipse(1280,fish.phase==='bite'?741:734,4,5,'#f38762');}
  
  dialogue.draw(g);invitation.drawWorld(g);
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
   if(!working(t)&&!seating.active())nearest();if(heldTool==='can'&&near?.kind==='flower')$('lifeUse').hidden=true;else $('lifeUse').hidden=!near;$('lifeTool').hidden=heldTool!=='can'||!!fish||!overlay.hidden||syncVisible();$('lifeUse').querySelector('small').textContent=heldTool==='can'?'Enter':'E / Enter';if(fish){if(t>=fish.bite&&fish.phase==='wait'){fish.phase='bite';tone(1046,.15);}if(t>fish.bite+1800){fish=null;nearId=null;$('lifeFish').hidden=true;toast('물고기를 놓쳤다.');react('sad');}else{$('lifeFish').innerHTML=fish.phase==='bite'?'지금!<meter min="0" max="1800" value="'+Math.max(0,1800-(t-fish.bite))+'"></meter>':'입질 기다리는 중';$('lifeUseText').textContent=fish.phase==='bite'?'낚기!':'기다리기';$('lifeUse').setAttribute('aria-label',fish.phase==='bite'?'지금 낚싯대 올리기':'찌를 보며 기다리기');}}
  }
  if(seating.active()){const seat=seating.snapshot();$('lifePrompt').hidden=true;$('lifeTool').hidden=true;$('lifeUse').hidden=false;$('lifeUseText').textContent=seat.phase==='rest'?'일어나기':seat.phase==='enter'?'앉는 중':'일어나는 중';$('lifeUse').setAttribute('aria-label',seat.phase==='rest'?'자리에서 일어나기':seat.phase==='enter'?'자리에 앉는 중':'자리에서 일어나는 중');nearId=null;}
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
 window.addEventListener('keydown',e=>{if(!host.open)return;if(e.target.closest('input,textarea,select'))return;if(mode==='play'&&!overlay.hidden&&story.isView()&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)hideOverlay();return;}if(mode==='replay'&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)endReplay();return;}if(e.key==='Tab'){const items=[...host.querySelectorAll('button:not(:disabled)')].filter(b=>b.getClientRects().length&&(syncVisible()?$('lifeSyncPanel').contains(b):!overlay.hidden?overlay.contains(b):true));if(items.length){const at=items.indexOf(document.activeElement);if(at<0&&syncVisible()){e.preventDefault();(e.shiftKey?items.at(-1):items[0]).focus();}else if(e.shiftKey&&at<=0){e.preventDefault();items.at(-1).focus();}else if(!e.shiftKey&&at===items.length-1){e.preventDefault();items[0].focus();}}return;}if((mode==='intro'||mode==='replay')&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','e','E','Enter',' '].includes(e.key)){if(['Enter',' '].includes(e.key)&&e.target.closest('#lifePrologue button')&&!e.repeat)return;e.preventDefault();e.stopImmediatePropagation();if(e.key==='Enter'&&!e.repeat)prologue.next();return;}const dir={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r',w:'u',a:'l',s:'d',d:'r'}[e.key];if(mode==='play'&&overlay.hidden&&!syncVisible()&&(dir||['e','E','Enter',' '].includes(e.key))){e.preventDefault();e.stopImmediatePropagation();if(working()||stopped||document.hidden)return;if(seatInput())return;if(dir||e.key===' ')clearReaction();if(dir){keys.add(dir);look=dir;if(dir==='l'||dir==='r')facing=dir==='l'?1:-1;}else if(e.key===' '){if(!jump)jump=performance.now();}else if(!e.repeat){if(heldTool==='can'&&['e','E'].includes(e.key))useTool();else use();}}},true);
 window.addEventListener('keyup',e=>{if(!host.open)return;const dir={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r',w:'u',a:'l',s:'d',d:'r'}[e.key];if(dir)keys.delete(dir);if(e.key===' '&&mode==='play'&&!syncVisible()&&!e.target.closest('.life-invitation-panel button,.life-arrival-panel button,.life-conversation-panel button')){e.preventDefault();e.stopImmediatePropagation();}},true);
 function pause(){clearReaction();toolAttachment=null;seating.cancel();queuedToast=null;feedback.cancel();gesture=null;workControls();keys.clear();path=[];fish=null;$('lifeFish').hidden=true;stopped=true;stopSound();}
 window.addEventListener('blur',pause);window.addEventListener('focus',()=>{stopped=false;startMusic();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else{stopped=false;startMusic();}});window.addEventListener('resize',resize);
 window.addEventListener('pagehide',()=>{if(host.open&&mode==='play'&&!saveError&&!readError&&valid())mutate(()=>{});pause();});
 window.addEventListener('storage',e=>{if(!host.open)return;if(e.key===null||e.key?.includes('classRpgSchoolStory_v1_'+owner+'_'))story.store.storageChanged();if(e.key===null||e.key?.includes('classRpgSchoolWish_v1_'+owner+'_'))wish.store.storageChanged();if(!valid()){close();return;}if(e.key&&/Token|Session/i.test(e.key)){close();return;}if(e.key===null||e.key.endsWith(saveKey())||e.key.endsWith('classRpgSchoolLifeCloud_v1_'+owner)){hideOverlay();keys.clear();path=[];void cloud.store.activate(owner,ownerToken);}});
 const avatarChanged=()=>{if(host.open&&valid())avatarImages();};
 const avatarObserver=new MutationObserver(avatarChanged);
 for(const id of SLOTS){const image=document.getElementById(id);if(image){avatarObserver.observe(image,{attributes:true,attributeFilter:['src','class']});image.addEventListener('load',avatarChanged);}}
 document.addEventListener('student-dashboard-updated',()=>{if(!host.open)return;if(!valid())close();else{avatarImages();refresh();updateTitle();}});
 const api={open,close,snapshot:()=>({mode,prologue:prologue.snapshot(),invitation:invitation.snapshot(),arrival:arrival.snapshot(),conversation:dialogue.snapshot(),wish:wish.snapshot(),story:story.snapshot(),sound,scene,position:{...pos},look,avatar:playerAvatar.snapshot(),heldTool,toolTarget:heldTool==='can'?selectedWater():null,gesture:gesture?.kind||null,seating:seating.snapshot(),toolAttachment:toolAttachment&&structuredClone(toolAttachment),depthOrder:depthOrder.map(p=>({...p})),reaction:reactionView&&{...reactionView},reactionPending:reactions.snapshot().pending,working:working(),jumping:!!jump,action:gesture?{...actionFrame(gesture.kind,(performance.now()-gesture.at)/ACTION_MS,reduced.matches),impactShown:!!gesture.impactShown}:null,windowOpening:windowMotion(),openingEffect:feedback.busy(performance.now(),reduced.matches),level:level(),near:near?.id||null,entities:entities().map(e=>({id:e.id,x:e.x,y:e.y,kind:e.kind})),goal:opening.goal()||story.goal(),saveError,readError,cloudStatus,cloudRevision:cloud.store.snapshot()?.revision||0,state:structuredClone(state),assetsReady})};window.schoolLife=api;return api;
}
