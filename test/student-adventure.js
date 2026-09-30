import {SCHOOL_CHAPTERS,GROWTH_AREAS} from './school-adventure-data.js?v=20260930-workshop';
import {weeklyResetLabel} from './quest-schedule.js?v=20260930-workshop';
import {LEVEL_GIFTS,experienceUntil} from './rpg-progression.js?v=20260930-progression';
import {NOTEBOOK_COVERS,WORKSHOP_MILESTONES,GARDEN_OBJECTS,gardenView,coverView} from './school-workshop.js?v=20260930-workshop';
import {CHAPTER_PROMISES,CHAPTER_ONE_MILESTONE,chapterOneView,profileMemento} from './school-chapter.js?v=20260930-chapter';
import {LIBRARY_MILESTONE,LIBRARY_CASES,evidenceView,libraryBookmarkView} from './library-evidence.js?v=20260930-evidence';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(action,label,kind='',attrs='')=>'<button class="sa-button '+kind+'" data-sa="'+action+'" '+attrs+'>'+label+'</button>';
const typeName={daily:'매일 도전',weekly:'이번 주 도전',main:'선생님 의뢰'};
export function questAction(q){
 if(q.status==='approved')return {label:'해냈어요!',kind:'done'};
 if(q.status==='submitted')return {label:q.quest_type==='main'?'확인 기다리는 중':'기록 추가·수정',kind:q.quest_type==='main'?'waiting':'report'};
 if(q.quest_type!=='main'||q.status==='accepted')return {label:q.status==='rejected'?'다듬어서 다시 보내기':'완료 기록 보내기',kind:'report'};
 return {label:q.status==='rejected'?'다시 도전하기':'의뢰 살펴보기',kind:'accept'};
}
export function installStudentAdventure(ctx){
 const doc=document,byId=id=>doc.getElementById(id);
 const dashboard=byId('dashboard');
 if(!dashboard||byId('studentAdventureHome'))return;
 let filter='todo',journal=null,journalError='',journalTask=null,loadedAt=0,owner=null,activeChapter=null,stepIndex=0,replay=false,saving=false,viewRequest=0,gardenChoices=new Set(),endingPromise='';
 const workshopMilestones=[...WORKSHOP_MILESTONES,CHAPTER_ONE_MILESTONE,LIBRARY_MILESTONE];
 let libraryIndex=0,libraryChoice={claim:null,evidence:null},librarySolved=false;
 const home=doc.createElement('div');home.id='studentAdventureHome';home.className='sa-home';
 home.innerHTML='<div class="sa-topbar"><div class="sa-brand"><span class="sa-brand-mark" aria-hidden="true">✦</span>우리반 모험학교</div><div class="sa-top-actions"><span class="sa-small" id="saDate"></span>'+button('help','도움말')+'</div></div>'+
 '<div id="saNetwork" class="sa-offline" role="status" hidden></div>'+
 '<section class="sa-hero" aria-labelledby="saWelcome"><div class="sa-hero-art" aria-hidden="true"></div><div class="sa-hero-content"><span class="sa-eyebrow">우리의 학교가 모험이 되는 곳</span><h1 id="saWelcome">오늘의 작은 도전,<br>한 뼘 더 자라는 나!</h1><p>배우고, 도와주고, 함께 해내며<br>나만의 모험 이야기를 채워요.</p>'+button('map','학교 탐험 떠나기 <span aria-hidden="true">→</span>','primary')+'</div></section>'+
 '<div class="sa-layout"><aside class="sa-side"><section class="sa-panel sa-profile" aria-label="나의 모험가 정보"><div class="sa-profile-title" id="saProfileTitle"></div><div class="sa-profile-avatar" id="saAvatar"></div><div class="sa-profile-progress" id="saProfileProgress"></div><div class="sa-shortcuts">'+button('inventory','🎒 옷장')+button('shop','🪙 상점')+button('growth','🌱 성장')+button('titles','🏅 칭호')+button('reading','📚 독서')+button('achievements','🏆 업적')+'</div></section><section class="sa-panel sa-note"><strong>학교에서 해낸 일이 내 힘이 돼요</strong><p>퀘스트를 실천하고 기록을 보내요.<br>선생님이 확인하면 경험치와 골드를 받아요.</p>'+button('parent','보호자와 함께 읽기')+'</section></aside>'+
 '<div class="sa-main"><section class="sa-panel sa-next-goal" id="saNextGoal" aria-label="다음 성장 목표"></section><section class="sa-panel" aria-labelledby="saQuestHeading"><div class="sa-panel-head"><div><h2 id="saQuestHeading">오늘의 모험 수첩</h2><p class="sa-small" id="saQuestSummary"></p></div>'+button('refresh','↻','', 'aria-label="퀘스트 새로고침"')+'</div><div class="sa-tabs" aria-label="퀘스트 종류">'+[['todo','할 일'],['daily','매일'],['weekly','이번 주'],['main','의뢰'],['done','완료']].map(x=>'<button class="sa-tab" data-filter="'+x[0]+'" aria-pressed="false">'+x[1]+'</button>').join('')+'</div><div id="saQuestList" class="sa-quest-list"></div></section>'+
 '<section class="sa-panel sa-map-teaser"><img class="sa-map-thumb" src="maps/school-campus-v2.webp" alt="학교와 도서관, 정원이 이어진 모험 지도" loading="lazy"><div><span class="sa-eyebrow">학교 탐험 수첩</span><h2>익숙한 학교, 새로운 발견</h2><p id="saExploreSummary">교실에서 시작해 일곱 장소의 이야기를 만나 보세요.</p>'+button('map','탐험 지도 펼치기')+'</div></section></div></div>'+
 '<nav class="sa-mobile-nav" aria-label="빠른 메뉴"><button data-sa="home"><span aria-hidden="true">🏡</span>오늘</button><button data-sa="map"><span aria-hidden="true">🗺️</span>탐험</button><button data-sa="growth"><span aria-hidden="true">🌱</span>성장</button><button data-sa="inventory"><span aria-hidden="true">🎒</span>옷장</button></nav><div id="saStatus" class="sa-sr-only" role="status" aria-live="polite"></div>';
 dashboard.prepend(home);
 const avatar=dashboard.querySelector('.avatar-card');
 if(avatar)byId('saAvatar').append(avatar);
 byId('saDate').textContent=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',weekday:'short'}).format(new Date());
 const dialog=doc.createElement('dialog');dialog.className='sa-dialog';dialog.id='studentAdventureDialog';dialog.setAttribute('aria-labelledby','saDialogTitle');
 dialog.innerHTML='<header class="sa-dialog-head"><div><h2 id="saDialogTitle"></h2><p id="saDialogSubtitle"></p></div>'+button('close','닫기','', 'aria-label="창 닫기"')+'</header><div class="sa-dialog-body" id="saDialogBody"></div>';
 doc.body.append(dialog);
 dialog.addEventListener('cancel',e=>{if(saving)e.preventDefault();else viewRequest++});
 const say=text=>{byId('saStatus').textContent=text};
 const network=()=>{byId('saNetwork').hidden=navigator.onLine;if(!navigator.onLine)byId('saNetwork').textContent='인터넷 연결이 끊겼어요. 작성 중인 글은 닫기 전에 저장하고, 다시 연결되면 이어서 해요.'};
 window.addEventListener('online',network);window.addEventListener('offline',network);network();
 function student(){return ctx.getStudent()||{}}
 function completed(){return new Set(journal?.exploration||[])}
 function render(){
  const s=student();if(!s.id)return;
  if(owner!==s.id){owner=s.id;journal=null;journalError='';loadedAt=0;queueMicrotask(()=>loadJournal())}
  const lv=ctx.levelInfo(s.xp||0),all=ctx.getQuests()||[];
  renderNextGoal(lv.level,s.xp||0);
  byId('saProfileTitle').innerHTML='<span class="sa-level-chip">Lv. '+lv.level+' 모험가</span><h2>'+esc(s.nickname||'모험가')+'</h2>'+profileMemento(journal?.workshop);
  byId('saProfileProgress').innerHTML='<div class="sa-xp" role="progressbar" aria-label="다음 레벨까지 경험치" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+lv.pct+'"><span style="width:'+lv.pct+'%"></span></div><div class="sa-small">'+(lv.max?'최고 레벨에 도착했어요!':'다음 레벨까지 <b>'+(lv.need-lv.cur)+' 경험치</b>')+'</div><div class="sa-currency"><span>🪙 <b>'+Number(s.gold||0)+'</b> 골드</span><span>✨ '+Number(s.xp||0)+' 경험치</span></div>';
  const needs=all.filter(q=>!['approved','submitted'].includes(q.status)).length,waiting=all.filter(q=>q.status==='submitted').length;
  byId('saQuestSummary').textContent=needs?'도전할 일 '+needs+'개'+(waiting?' · 선생님 확인 중 '+waiting+'개':''):waiting?'보낸 기록 '+waiting+'개를 선생님이 확인하고 있어요.':'오늘도 나의 속도로 한 걸음씩!';
  home.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));
  const items=all.filter(q=>filter==='todo'?q.status!=='approved':filter==='done'?q.status==='approved':q.quest_type===filter).sort((a,b)=>(a.status==='submitted')-(b.status==='submitted'));
  byId('saQuestList').innerHTML=items.length?items.map(card).join(''):'<div class="sa-empty"><span class="sa-empty-icon" aria-hidden="true">'+(filter==='done'?'🌱':'☀️')+'</span><b>'+(filter==='done'?'첫 번째 성장을 기다리고 있어요.':'지금은 등록된 할 일이 없어요.')+'</b><p>'+(filter==='done'?'학교에서 실천한 일을 선생님께 보내 보세요.':'탐험 수첩을 펼치거나, 읽은 책을 기록해 볼까요?')+'</p>'+button('map','학교 탐험하기')+'</div>';
  const cover=NOTEBOOK_COVERS.find(c=>c.id===journal?.workshop?.cover)||NOTEBOOK_COVERS[0];
  home.dataset.cover=cover.id;dialog.dataset.cover=cover.id;
  if(journal){byId('saExploreSummary').textContent='탐험 도장 '+stampCount()+' / '+SCHOOL_CHAPTERS.length+'개 · '+cover.name+' 표지'}
 }
 function stampCount(){return SCHOOL_CHAPTERS.filter(c=>c.steps.every(s=>completed().has(s.id))).length}
 function milestones(){
  const entries=SCHOOL_CHAPTERS.map(c=>({level:c.level,label:c.icon+' '+c.name+' 이야기',chapter:c.id,description:c.subtitle}));
  entries.push(...LEVEL_GIFTS.map(level=>({level,label:'🎁 레벨 달성 선물 · 50 골드',description:'이 레벨의 선물은 한 번 받아요.'})));
  entries.push(...workshopMilestones);
  return entries.sort((a,b)=>a.level-b.level);
 }
 function unlocksBetween(from,to){return milestones().filter(m=>m.level>from&&m.level<=to).map(m=>'Lv. '+m.level+' · '+m.label)}
 function renderNextGoal(level,xp){
  const entries=milestones(),next=entries.find(m=>m.level>level),soon=next?entries.filter(m=>m.level===next.level):[];
  byId('saNextGoal').innerHTML='<div><span class="sa-eyebrow">'+(next?'다음에 만날 즐거움':'Lv. 30 · 멋지게 자랐어요!')+'</span><h2>'+(next?'Lv. '+next.level+'에서 만나요':'나의 배움은 계속돼요')+'</h2><p>'+(next?soon.map(m=>esc(m.label)).join('<br>'):'탐험 도장을 모으고, 학교에서 해낸 일을 성장 나무에 남겨요.')+'</p>'+(next?'<strong class="sa-goal-xp">'+experienceUntil(xp,next.level)+' 경험치 더 모으면 도착!</strong>':'')+'</div>'+button('roadmap','성장 길잡이 →');
 }
 function roadmap(){
  ++viewRequest;
  const xp=student().xp||0,level=ctx.levelInfo(xp).level,entries=milestones(),next=entries.find(m=>m.level>level)?.level;
  const levels=[...new Set(entries.map(m=>m.level))];
  open('나의 성장 길잡이','다음 모험과 선물을 한눈에 살펴봐요.',
   '<div class="sa-real-mission"><b>지금 Lv. '+level+' · '+Number(xp)+' 경험치</b><p>학교에서 실천하고 선생님께 확인받으며 자라요. 서두르지 않아도 괜찮아요.</p></div><ol class="sa-roadmap">'+levels.map(lv=>'<li class="sa-milestone '+(lv<=level?'reached':lv===next?'up-next':'')+'"'+(lv===next?' aria-current="step"':'')+'><div class="sa-milestone-head"><b>Lv. '+lv+'</b><span>'+(lv<=level?'✓ 레벨 달성':lv===next?'다음 목표':'앞으로 만나요')+'</span></div>'+entries.filter(m=>m.level===lv).map(m=>'<div class="sa-milestone-content"><strong>'+esc(m.label)+'</strong><p>'+esc(m.description)+'</p>'+(m.activity&&lv<=level?'<button class="sa-button" data-workshop="'+m.activity+'">놀이 시작하기</button>':'')+(m.chapter&&lv<=level?button('visit-chapter','이야기 만나기','','data-go-chapter="'+m.chapter+'"'):'')+'</div>').join('')+(lv>level?'<small>'+experienceUntil(xp,lv)+' 경험치 남았어요.</small>':'')+'</li>').join('')+'</ol><p class="sa-note">도서관 탐험이 열리기 전에도 독서 기록과 학교생활 퀘스트는 할 수 있어요. 레벨 선물은 이미 받은 경우 다시 지급되지 않아요.</p>');
 }
 function card(q){
  const a=questAction(q),mode={photo:'사진 1장 이상',text:'글',both:'글 + 사진 1장 이상'}[q.submission_mode]||'글·사진으로 기록';
  const status=q.status==='submitted'?'선생님 확인 중':q.status==='rejected'?'한 번 더 도전':q.status==='approved'?'완료':q.status==='accepted'?'도전 중':'시작할 수 있어요';
  return '<article class="quest sa-quest"><div class="sa-quest-top"><span class="sa-tag '+esc(q.quest_type)+'">'+esc(typeName[q.quest_type]||'의뢰')+'</span><span class="sa-tag waiting">'+status+'</span></div><b>'+esc(q.title)+'</b><p class="muted">'+esc(q.description||'학교에서 실천하고 나의 기록을 남겨요.')+'</p>'+
   (q.quest_type==='weekly'?'<p class="sa-small">'+esc(weeklyResetLabel(q))+'</p>':'')+
   (q.status==='rejected'&&q.rejection_reason?'<p>💬 선생님: '+esc(q.rejection_reason)+'</p>':'')+
   '<div class="sa-quest-bottom"><div class="sa-reward">✨ '+Number(q.xp||0)+' 경험치 · 🪙 '+Number(q.gold||0)+' 골드<br>보낼 기록: '+mode+'</div>'+
   (['done','waiting'].includes(a.kind)?'<span class="sa-tag">'+a.label+'</span>':button('quest',a.label,'primary','data-id="'+Number(q.id)+'" data-kind="'+a.kind+'"'))+'</div></article>';
 }
 async function loadJournal(force=false){
  if(journalTask)await journalTask;
  if(!student().id)return;
  if(!force&&journal&&Date.now()-loadedAt<30000)return;
  journalError='';const requestedOwner=student().id;
  const task=(async()=>{try{
   const {data,error}=await ctx.db.rpc('student_learning_journal',{p_token:ctx.getToken()});
   if(error)throw error;
   if(!data||!Array.isArray(data.exploration))throw Error('기록을 불러오지 못했어요.');
   if(requestedOwner!==student().id)return;
   journal=data;loadedAt=Date.now();render();
  }catch{if(requestedOwner===student().id)journalError='기록을 불러오지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.'}
  })();journalTask=task;
  await task;if(journalTask===task)journalTask=null;
 }
 function open(title,subtitle,html){
  byId('saDialogTitle').textContent=title;byId('saDialogSubtitle').textContent=subtitle;
  byId('saDialogBody').innerHTML=html;
  if(!dialog.open)dialog.showModal();
  byId('saDialogBody').scrollTop=0;dialog.scrollTop=0;
 }
 function errorView(retry){return '<div class="sa-empty" role="status"><p>'+esc(journalError||'기록을 불러오는 중이에요…')+'</p>'+button(retry,'다시 불러오기')+'</div>'}
 async function map(force=false){
  const request=++viewRequest;
  activeChapter=null;
  open('학교 탐험 수첩','배움이 쌓이면 새로운 장소가 열려요.',errorView('retry-map'));
  await loadJournal(force);
  if(request!==viewRequest||!dialog.open)return;
  if(!journal){open('학교 탐험 수첩','잠깐, 연결을 확인하고 있어요.',errorView('retry-map'));return}
  const lv=ctx.levelInfo(student().xp||0).level,done=completed(),stamps=SCHOOL_CHAPTERS.filter(c=>c.steps.every(s=>done.has(s.id))).length;
  const label=c=>c.steps.every(s=>done.has(s.id))?'✓ 탐험 도장 획득':lv<c.level?'Lv. '+c.level+'에 열려요':c.steps.filter(s=>done.has(s.id)).length+' / 3 이야기';
  open('학교 탐험 수첩','장소를 눌러 이야기 속 선택을 해 보세요.',
   '<div class="sa-passport"><div><b>나의 탐험 도장 '+stamps+' / '+SCHOOL_CHAPTERS.length+'</b><br><span class="sa-small">지금 Lv. '+lv+' · 골드 없이 탐험해요.</span></div><div class="sa-passport-actions">'+button('roadmap','성장 길잡이')+button('classroom','교실에서 걷기')+'</div></div>'+
   (journalError?'<p class="sa-offline" role="status">'+esc(journalError)+'</p>':'')+
   '<div class="sa-world" aria-label="학교 탐험 지도">'+SCHOOL_CHAPTERS.map(c=>'<button class="sa-map-pin '+(lv<c.level?'locked':'')+'" data-chapter="'+c.id+'" style="left:'+c.x+'%;top:'+c.y+'%" aria-label="'+c.name+', '+label(c)+'">'+c.icon+' '+c.name+'<span>'+label(c)+'</span></button>').join('')+'</div>'+
   '<p class="sa-legend">✦ 학교생활 퀘스트로 레벨을 올려요. 탐험은 이야기 도장을 모으는 작은 연습이에요.</p>'+
   '<div class="sa-destinations">'+SCHOOL_CHAPTERS.map(c=>'<button class="sa-destination" data-chapter="'+c.id+'"><b>'+c.icon+' '+c.name+'</b><small>'+c.subtitle+'</small><small>'+label(c)+'</small></button>').join('')+'</div><h3>학교에서 발견한 작은 즐거움</h3><div class="sa-workshop-links">'+workshopMilestones.map(m=>'<button class="sa-destination" data-workshop="'+m.activity+'"><b>'+m.label+'</b><small>'+m.description+'</small><small>'+(m.activity==='library-evidence'?libraryLabel(lv):m.activity==='chapter-one'&&journal.workshop?.chapter_one_complete?'✓ 첫 모험 완료 · 기억 보기':lv<m.level?'🔒 Lv. '+m.level+'에 열려요':m.activity==='garden'&&journal.workshop?.garden_complete?'✓ 관찰 완료 · 다시 놀기':'지금 해 보기')+'</small></button>').join('')+'</div>');
 }
 async function workshop(kind){
  const m=workshopMilestones.find(x=>x.activity===kind);if(!m)return;
  const request=++viewRequest,lv=ctx.levelInfo(student().xp||0).level;
  open(m.label,'나의 탐험 기록을 펼치고 있어요.',errorView('retry-map'));await loadJournal();
  if(request!==viewRequest||!dialog.open)return;
  if(!journal){open(m.label,'연결을 확인하고 다시 시도해 주세요.',errorView('retry-map'));return}
  const earned=kind==='chapter-one'&&journal?.workshop?.chapter_one_complete||kind==='library-evidence'&&LIBRARY_CASES.some(s=>completed().has(s.id));
  if(lv<m.level&&!earned){open(m.label,'Lv. '+m.level+'에 열리는 새로운 즐거움','<div class="sa-stamp"><div class="sa-stamp-medal">🔒</div><h3>'+esc(m.description)+'</h3><p>'+experienceUntil(student().xp||0,m.level)+' 경험치를 더 모으면 열려요.</p>'+button('map','지도로 돌아가기')+'</div>');return}
  if(kind==='library-evidence'){libraryIndex=LIBRARY_CASES.findIndex(s=>!completed().has(s.id));renderEvidence()}
  else if(kind==='chapter-one'){endingPromise=journal.workshop?.chapter_one_promise||'';showChapterOne()}
  else if(kind==='garden'){gardenChoices=new Set();open(m.label,'자세히 보고, 달라진 것을 찾아요.',gardenView(gardenChoices,journal.workshop?.garden_complete)+'<p>'+button('map','← 탐험 지도')+'</p>')}
  else open(m.label,'탐험 도장이 새로운 표지가 돼요.',coverView({cover:journal.workshop?.cover,stamps:stampCount(),nickname:student().nickname||'모험가'},esc)+'<p>'+button('map','← 탐험 지도')+'</p>');
 }
 function showChapterOne(){
  open('첫 모험 기념식','학교에서 배운 마음을 다음 모험으로 가져가요.',chapterOneView({chapters:SCHOOL_CHAPTERS,completed:completed(),workshop:journal.workshop,nickname:student().nickname||'모험가',promise:endingPromise},esc)+'<p>'+button('map','← 탐험 지도')+'</p>');
 }
 function renderEvidence(){
  libraryChoice={claim:null,evidence:null};librarySolved=false;
  const story=LIBRARY_CASES[libraryIndex];
  open(story?'도서관 단서 탐험':'나의 단서 책갈피',story?'글 속 문장과 내 생각을 연결해 봐요.':'책을 읽는 또 하나의 힘을 발견했어요.',(story?evidenceView(story,libraryIndex,libraryChoice,esc):libraryBookmarkView(esc))+'<p>'+button('map','← 탐험 지도')+'</p>');
 }
 function libraryLabel(level){
  const n=LIBRARY_CASES.filter(s=>completed().has(s.id)).length;
  return n===3?'✓ 단서 책갈피 모음 · 다시 읽기':n?'이야기 '+n+' / 3 완료 · 이어 읽기':level<11?'🔒 Lv. 11에 열려요':'새로운 세 이야기 만나기';
 }
 function selectEvidence(type,value){
  if(librarySolved||!Number.isInteger(value)||value<0||value>2)return;
  libraryChoice[type]=value;
  dialog.querySelectorAll('[data-evidence-'+(type==='claim'?'claim':'line')+']').forEach(b=>{
   const selected=Number(type==='claim'?b.dataset.evidenceClaim:b.dataset.evidenceLine)===value;b.setAttribute('aria-pressed',String(selected));
   if(type==='evidence')b.querySelector('small').textContent=selected?'✓ 고른 단서':'단서로 고르기';
  });
  byId('saEvidenceSelection').textContent='문장 단서 '+(libraryChoice.evidence===null?'0':'1')+'개 · 내 생각 '+(libraryChoice.claim===null?'0':'1')+'개를 골랐어요.';
  byId('saEvidenceFeedback').textContent='';
 }
 async function saveEvidence(){
  const story=LIBRARY_CASES[libraryIndex],feedback=byId('saEvidenceFeedback');if(saving||librarySolved||!story||!feedback)return;
  if(libraryChoice.claim===null||libraryChoice.evidence===null){feedback.textContent='내 생각 하나와, 글 속 문장 단서 하나를 골라 주세요.';return}
  const requestedOwner=student().id,choice={...libraryChoice};
  saving=true;const buttons=[...dialog.querySelectorAll('button')].map(b=>[b,b.disabled]);buttons.forEach(([b])=>b.disabled=true);feedback.textContent='생각과 단서를 함께 살펴보고 있어요…';
  try{
   const {data,error}=await ctx.db.rpc('student_library_evidence',{p_token:ctx.getToken(),p_case:story.id,p_claim:choice.claim,p_evidence:choice.evidence});if(error||!data)throw error||Error('Missing evidence result');
   if(requestedOwner!==student().id)return;
   if(!data.correct){feedback.textContent='다시 읽어 볼까요? '+(data.reason==='evidence'?story.evidenceHint:story.claimHint);return}
   if(data.step_id!==story.id)throw Error('Unexpected evidence result');
   journal.exploration=[...new Set([...journal.exploration,story.id])];loadedAt=Date.now();librarySolved=true;render();
   feedback.innerHTML='<b>단서와 생각이 이어졌어요! ✦</b><p>'+esc(story.explanation)+'</p><div class="sa-real-mission"><strong>진짜 학교에서도 해 볼까요?</strong><p>'+esc(story.real)+'</p></div><p>'+button('next-evidence',libraryIndex===2?'단서 책갈피 보기':'다음 이야기 →','primary')+'</p>';
   feedback.querySelector('button').focus({preventScroll:true});
  }catch{if(requestedOwner===student().id)feedback.textContent='아직 저장하지 못했어요. 고른 생각과 단서는 그대로예요. 연결을 확인하고 다시 눌러 주세요.'}
  finally{saving=false;buttons.forEach(([b,disabled])=>{if(b.isConnected)b.disabled=disabled||librarySolved&&b.matches('[data-evidence-line],[data-evidence-claim],[data-sa=check-evidence]')})}
 }
 async function saveChapterOne(badge=journal?.workshop?.chapter_one_badge!==false){
  const feedback=byId('saChapterFeedback');if(saving||!feedback)return;
  if(!CHAPTER_PROMISES.some(p=>p.id===endingPromise)){feedback.textContent='내가 이어 갈 작은 약속을 하나 골라 주세요.';return}
  const requestedOwner=student().id;
  saving=true;const buttons=[...dialog.querySelectorAll('button')].map(b=>[b,b.disabled]);buttons.forEach(([b])=>b.disabled=true);
  feedback.textContent='나의 첫 모험을 수첩에 담고 있어요…';
  try{
   const {data,error}=await ctx.db.rpc('student_complete_school_chapter',{p_token:ctx.getToken(),p_promise:endingPromise,p_badge:badge});
   if(error||!data?.chapter_one_complete)throw error||Error('Unconfirmed chapter');
   if(requestedOwner!==student().id)return;
   journal.workshop={...journal.workshop,...data};loadedAt=Date.now();render();showChapterOne();
   byId('saChapterFeedback').textContent=badge?'✓ 학교 탐험가 휘장과 작은 약속을 저장했어요!':'✓ 휘장을 수첩에 보관했어요. 언제든 다시 달 수 있어요.';
  }catch{if(requestedOwner===student().id)feedback.textContent='아직 저장하지 못했어요. 고른 약속은 그대로예요. 연결을 확인하고 다시 눌러 주세요.'}
  finally{saving=false;buttons.forEach(([b,disabled])=>{if(b.isConnected)b.disabled=disabled})}
 }
 async function saveWorkshop(action,choice){
  if(saving)return;
  const feedback=byId('saWorkshopFeedback');if(!feedback)return;
  if(action==='garden'&&gardenChoices.size!==3){feedback.textContent='달라진 것을 세 가지 골라 주세요.';return}
  saving=true;const buttons=[...dialog.querySelectorAll('button')].map(b=>[b,b.disabled]);buttons.forEach(([b])=>b.disabled=true);
  feedback.textContent='내 수첩에 기록하는 중이에요…';
  try{
   const {data,error}=await ctx.db.rpc('student_school_workshop',{p_token:ctx.getToken(),p_action:action,p_choice:choice});if(error||!data)throw error||Error('Missing result');
   if(action==='garden'){
    if(!data.correct){feedback.textContent='다시 살펴볼까요? 잎을 세고, 꽃의 모습과 물건의 자리를 비교해 보세요.';return}
    journal.workshop={...journal.workshop,garden_complete:true};
    feedback.innerHTML='<b>세 가지 변화를 모두 발견했어요! ✦</b><p>잎이 두 장 늘고, 꽃이 피고, 물뿌리개의 자리가 달라졌어요.</p><div class="sa-real-mission"><strong>진짜 학교에서도 해 볼까요?</strong><p>화분 하나를 골라 날짜와 잎의 모습을 기록해 보세요. 며칠 뒤 무엇이 달라졌는지 비교해요.</p></div><p>✓ 관찰 완료가 내 수첩에 저장됐어요.</p>';
   }else{
    const cover=NOTEBOOK_COVERS.find(c=>c.id===data.cover);if(!cover)throw Error('Invalid cover');
    journal.workshop={...journal.workshop,cover:cover.id};
    open('🎨 나의 탐험 수첩 꾸미기','탐험 도장이 새로운 표지가 돼요.',coverView({cover:cover.id,stamps:stampCount(),nickname:student().nickname||'모험가'},esc)+'<p>'+button('map','← 탐험 지도')+'</p>');
    byId('saWorkshopFeedback').textContent=cover.name+' 표지를 저장했어요. 다른 기기에서도 이어져요.';
   }
   loadedAt=Date.now();render();
  }catch{feedback.textContent='아직 저장하지 못했어요. 선택은 그대로예요. 연결을 확인하고 다시 눌러 주세요.'}
  finally{saving=false;buttons.forEach(([b,disabled])=>{if(b.isConnected)b.disabled=disabled})}
 }
 function chapter(id,again=false){
  const c=SCHOOL_CHAPTERS.find(x=>x.id===id);if(!c)return;
  const lv=ctx.levelInfo(student().xp||0).level;
  if(lv<c.level){open(c.icon+' '+c.name,'Lv. '+c.level+'에 열리는 다음 모험','<div class="sa-stamp"><div class="sa-stamp-medal">🔒</div><h3>조금 더 자라서 만나요!</h3><p>지금은 Lv. '+lv+'예요.<br><b>'+experienceUntil(student().xp||0,c.level)+' 경험치</b>를 더 모으면<br>'+c.name+'의 이야기가 열려요.</p><p>'+esc(c.subtitle)+'</p>'+button('map','지도로 돌아가기')+'</div>');return}
  activeChapter=c;replay=again;stepIndex=again?0:c.steps.findIndex(s=>!completed().has(s.id));
  renderChapter();
 }
 function renderChapter(){
  const c=activeChapter;if(!c)return;
  if(stepIndex<0||stepIndex>=c.steps.length){completeChapter(c);return}
  const s=c.steps[stepIndex];
  open(c.icon+' '+c.name,c.subtitle,'<div class="sa-chapter"><div class="sa-guide"><span class="sa-guide-icon" aria-hidden="true">'+c.icon+'</span><p><b>'+c.guide+'</b>함께 생각해 봐요. 틀려도 괜찮아요!</p></div><div class="sa-step-dots">'+c.steps.map((x,i)=>'<span class="sa-step-dot '+(i<stepIndex?'done':'')+'" aria-hidden="true"></span>').join('')+' 이야기 '+(stepIndex+1)+' / 3</div><h3 id="saQuestion" class="sa-question" tabindex="-1">'+esc(s.question)+'</h3><div class="sa-choices">'+s.choices.map((choice,i)=>'<button class="sa-choice" data-choice="'+i+'"><span aria-hidden="true">'+(i+1)+'</span>'+esc(choice)+'</button>').join('')+'</div><div id="saFeedback" class="sa-feedback" role="status" aria-live="polite"></div><div class="sa-chapter-footer">'+button('map','← 지도')+'<span class="sa-small">저장된 이야기는 이어서 할 수 있어요.</span></div></div>');
  byId('saQuestion').focus({preventScroll:true});
 }
 async function answer(index){
  if(saving||!activeChapter)return;
  const c=activeChapter,s=c.steps[stepIndex],feedback=byId('saFeedback');
  if(!s||!Number.isInteger(index)||index<0||index>2)return;
  saving=true;dialog.querySelectorAll('button').forEach(b=>b.disabled=true);
  feedback.className='sa-feedback';feedback.textContent='선택을 확인하고 저장하는 중이에요…';
  try{
   const {data,error}=await ctx.db.rpc('student_explore_school',{p_token:ctx.getToken(),p_step:s.id,p_choice:index});
   if(error)throw error;
   if(!data?.correct){feedback.className='sa-feedback error';feedback.textContent='다시 생각해 볼까요? '+s.why;return}
   journal.exploration=[...new Set([...journal.exploration,s.id])];loadedAt=0;
   feedback.innerHTML='<b>멋진 생각이에요! ✦</b><br>'+esc(s.why)+'<p>'+button('next',stepIndex===2?'탐험 도장 보기':'다음 이야기 →','primary')+'</p>';
   dialog.querySelectorAll('[data-choice]').forEach(b=>b.dataset.answered='true');
   render();feedback.querySelector('[data-sa=next]').focus();
  }catch{
   feedback.className='sa-feedback error';feedback.textContent='아직 저장하지 못했어요. 연결을 확인한 뒤 같은 답을 다시 눌러 주세요.';
  }finally{saving=false;dialog.querySelectorAll('button').forEach(b=>b.disabled=b.dataset.answered==='true')}
 }
 function completeChapter(c){
  open(c.icon+' '+c.name,'작은 배움이 모여 나의 힘이 돼요.','<div class="sa-chapter sa-stamp"><div class="sa-stamp-medal">'+c.icon+'</div><span class="sa-eyebrow">탐험 도장을 모았어요</span><h3>'+c.subtitle+'</h3><p>세 가지 이야기를 모두 살펴봤어요.<br>이제 진짜 학교에서도 실천해 볼까요?</p><div class="sa-real-mission"><strong>학교에서 해 볼 한 가지</strong><br>'+c.real+'</div><p class="sa-small">탐험 도장은 수첩에 남아요.<br>경험치와 골드는 선생님이 확인한 학교생활 퀘스트에서 받아요.</p><div class="sa-chapter-footer">'+button('map','지도에서 다음 모험 찾기','primary')+button('replay','이야기 다시 보기')+'</div></div>');
 }
 async function growth(force=false){
  const request=++viewRequest;
  open('나의 성장 나무','학교에서 해낸 일이 차곡차곡 쌓여요.',errorView('retry-growth'));
  await loadJournal(force);
  if(request!==viewRequest||!dialog.open)return;
  if(!journal){open('나의 성장 나무','기록을 함께 살펴봐요.',errorView('retry-growth'));return}
  const count=journal.areas||{};
  open('나의 성장 나무','선생님이 확인한 활동 기록을 모았어요.',
   '<p class="sa-note">잘하는 모습을 찾는 나만의 수첩이에요. 다른 친구와 비교하지 않고, 어제의 나보다 한 걸음씩 자라요.</p><div class="sa-growth-grid">'+GROWTH_AREAS.map(([key,name,icon])=>{const n=Number(count[key]||0);return '<div class="sa-growth-card"><span aria-hidden="true">'+icon+'</span><b>'+name+'</b><strong>'+n+'</strong> <span class="sa-small">활동</span><p>'+(n>=10?'꾸준히 가꾼 나의 나무':n>=3?'쑥쑥 자라는 중':'새싹부터 천천히')+'</p></div>'}).join('')+'</div><p class="sa-note">각 숫자는 해당 분야에서 확인받은 퀘스트 수예요. 표현력에는 승인된 독후감도 함께 담겨요.</p><h3>최근에 해낸 일</h3><ul class="sa-history">'+(journal.recent||[]).map(r=>'<li><b>'+esc(r.title)+'</b><small>'+esc(new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric'}).format(new Date(r.at)))+' · 선생님 확인 완료</small></li>').join('')+'</ul>'+(!(journal.recent||[]).length?'<p class="sa-note">첫 기록을 기다리고 있어요. 작은 실천부터 시작해 보세요.</p>':''));
 }
 function help(parent=false){
  open(parent?'보호자와 함께 보는 모험학교':'모험학교 사용 안내',parent?'학교에서의 실천이 성장 기록으로 이어집니다.':'처음이어도 괜찮아요. 세 가지만 기억해요.',
   '<div class="sa-chapter"><div class="sa-guide"><span class="sa-guide-icon">🌱</span><p><b>배우고, 실천하고, 돌아보기</b>게임 속 성장은 실제 학교생활과 이어져요.</p></div>'+
   '<h3>1. 오늘 할 일을 살펴봐요</h3><p>선생님이 만든 퀘스트를 읽어요. 의뢰는 내용을 읽고 맡은 뒤 시작해요.</p>'+
   '<h3>2. 학교에서 실천하고 기록해요</h3><p>사진만, 글만, 글과 사진 중 정해진 방식으로 보내요. 글과 사진은 최대 5장까지 이 기기에 임시저장할 수 있어요.</p>'+
   '<h3>3. 확인받은 활동으로 자라요</h3><p>선생님이 확인하면 경험치와 골드를 받아요. 성장 수첩에는 확인받은 배움·배려·생활 활동이 쌓여요.</p>'+
   '<div class="sa-real-mission"><strong>탐험지도는 학교생활 연습장</strong><p>안전, 배려, 독서, 관찰 이야기를 짧게 만나고 실천할 일을 찾아요. 같은 탐험을 반복해도 골드나 경험치가 늘어나지는 않아요.</p></div>'+
   '<p class="sa-note">성장 숫자는 활동 기록의 개수이며 능력 평가나 친구와의 순위가 아니에요. 탐험은 이 계정에 저장되고, 아직 보내지 않은 글·사진은 작성한 기기에만 남아요.</p>'+
   '<div class="sa-chapter-footer">'+button('pin','비밀번호 바꾸기')+button('logout','로그아웃')+'</div></div>');
 }
 async function action(event){
  if(saving)return;
  const evidenceLine=event.target.closest('[data-evidence-line]');if(evidenceLine){selectEvidence('evidence',Number(evidenceLine.dataset.evidenceLine));return}
  const evidenceClaim=event.target.closest('[data-evidence-claim]');if(evidenceClaim){selectEvidence('claim',Number(evidenceClaim.dataset.evidenceClaim));return}
  const evidenceReplay=event.target.closest('[data-evidence-replay]');if(evidenceReplay){
   const index=Number(evidenceReplay.dataset.evidenceReplay);if(LIBRARY_CASES[index]&&completed().has(LIBRARY_CASES[index].id)){libraryIndex=index;renderEvidence()}return;
  }
  const promiseButton=event.target.closest('[data-promise]');if(promiseButton){
   if(!CHAPTER_PROMISES.some(p=>p.id===promiseButton.dataset.promise))return;
   endingPromise=promiseButton.dataset.promise;dialog.querySelectorAll('[data-promise]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.promise===endingPromise)));byId('saChapterFeedback').textContent='이 약속을 골랐어요. 아래 버튼을 눌러 저장해요.';return;
  }
  const badgeButton=event.target.closest('[data-chapter-badge]');if(badgeButton){await saveChapterOne(badgeButton.dataset.chapterBadge==='true');return}
  const workshopButton=event.target.closest('[data-workshop]');if(workshopButton){await workshop(workshopButton.dataset.workshop);return}
  const coverButton=event.target.closest('[data-cover-choice]');if(coverButton&&!coverButton.disabled){await saveWorkshop('cover',coverButton.dataset.coverChoice);return}
  const gardenButton=event.target.closest('[data-garden]');if(gardenButton){
   const id=gardenButton.dataset.garden;if(!GARDEN_OBJECTS.some(x=>x[0]===id))return;
   if(gardenChoices.has(id))gardenChoices.delete(id);else if(gardenChoices.size<3)gardenChoices.add(id);else{byId('saWorkshopFeedback').textContent='세 가지를 골랐어요. 바꾸려면 고른 것을 한 번 더 눌러 주세요.';return}
   gardenButton.setAttribute('aria-pressed',String(gardenChoices.has(id)));byId('saGardenSelection').textContent=gardenChoices.size+' / 3개 골랐어요.';byId('saWorkshopFeedback').textContent='';return;
  }
  const chapterButton=event.target.closest('[data-chapter]');if(chapterButton){if(!saving)chapter(chapterButton.dataset.chapter);return}
  const choice=event.target.closest('[data-choice]');if(choice){await answer(Number(choice.dataset.choice));return}
  const tab=event.target.closest('[data-filter]');if(tab){filter=tab.dataset.filter;render();return}
  const b=event.target.closest('[data-sa]');if(!b||saving)return;
  const a=b.dataset.sa;
  if(a==='close'){viewRequest++;dialog.close();return}
  if(a==='roadmap'){roadmap();return}
  if(a==='finish-chapter'){await saveChapterOne();return}
  if(a==='check-evidence'){await saveEvidence();return}
  if(a==='next-evidence'&&librarySolved){libraryIndex++;renderEvidence();return}
  if(a==='check-garden'){await saveWorkshop('garden',JSON.stringify([...gardenChoices].sort()));return}
  if(a==='visit-chapter'){
   const id=b.dataset.goChapter,request=++viewRequest;
   open('탐험 이야기','내가 모은 기록을 확인하고 있어요.',errorView('retry-map'));
   await loadJournal();
   if(request!==viewRequest||!dialog.open)return;
   if(!journal){open('탐험 이야기','잠깐, 연결을 확인하고 있어요.',errorView('retry-map'));return}
   chapter(id);return;
  }
  if(a==='map'||a==='retry-map'){await map(a==='retry-map');return}
  if(a==='growth'||a==='retry-growth'){await growth(a==='retry-growth');return}
  if(a==='next'){stepIndex++;renderChapter();return}
  if(a==='replay'){chapter(activeChapter.id,true);return}
  if(a==='help'||a==='parent'){help(a==='parent');return}
  if(a==='refresh'){b.disabled=true;try{await ctx.refresh();say('모험 수첩을 새로 불러왔어요.')}catch{say('불러오지 못했어요. 다시 눌러 주세요.')}finally{b.disabled=false;render()}return}
  if(a==='home'){home.scrollIntoView({behavior:'smooth'});return}
  if(a==='logout'){dialog.close();window.logout();return}
  dialog.open&&dialog.close();
  if(a==='reading')window.openReadingPortfolio();
  if(a==='achievements'){const entry=byId('achievementBtn');if(entry)entry.click();else await growth()}
  if(a==='inventory')window.openInventory();
  if(a==='shop')window.openShop();
  if(a==='titles')window.openTitleCollection();
  if(a==='pin')window.openChangePin();
  if(a==='classroom')window.openClassroomHub();
  if(a==='quest'){const id=Number(b.dataset.id);if(b.dataset.kind==='accept')window.openMainQuest(id);else window.openProgressQuest(id)}
 }
 home.addEventListener('click',e=>{action(e).catch(()=>say('잠깐 연결이 끊겼어요. 다시 눌러 주세요.'))});
 dialog.addEventListener('click',e=>{action(e).catch(()=>{byId('saDialogSubtitle').textContent='불러오지 못했어요. 다시 시도해 주세요.'})});
 // One input route prevents legacy movement listeners from stealing typing or moving twice.
 window.addEventListener('keydown',event=>{
  const key=event.key.toLowerCase(),directions={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};
  if(!directions[key]&&!['e','enter','escape'].includes(key))return;
  const hub=byId('classroomHub'),explorer=byId('schoolExplorerModal');
  const hubOpen=hub&&!hub.classList.contains('hidden'),explorerOpen=explorer&&!explorer.classList.contains('hidden');
  if(!hubOpen&&!explorerOpen)return;
  const editable=event.target.closest('input,textarea,select,[contenteditable="true"]');
  const overlay=doc.querySelector('dialog[open],.modal-backdrop:not(.hidden):not(#schoolExplorerModal),.reward-notice-backdrop');
  if(editable||overlay){event.stopImmediatePropagation();return}
  if(key==='enter'&&event.target.closest('button,a[href]')){event.stopImmediatePropagation();return}
  event.preventDefault();event.stopImmediatePropagation();
  if(directions[key]){if(hubOpen)window.moveHub(...directions[key]);else window.moveExplorer?.(...directions[key])}
  else if(key==='escape'){if(hubOpen)window.closeClassroomHub();else window.closeSchoolExplorer?.()}
  else{if(hubOpen)window.hubUseNearby();else window.interactExplorer?.()}
 },true);
 window.openAdventureMap=()=>map();
 doc.addEventListener('student-dashboard-updated',render);
 render();
 return {render,map,growth,roadmap,unlocksBetween,workshop};
}
