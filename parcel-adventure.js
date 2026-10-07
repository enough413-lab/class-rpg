export const PARCEL_MILESTONE={level:16,label:'📦 책 향기가 나는 꾸러미',activity:'parcel-adventure',description:'교실의 꾸러미와 복도의 단서를 살펴 도서관에 전달하는 작은 산책 의뢰예요.'};
const STEPS=['parcel-1','parcel-2','parcel-3'];
export function installParcelAdventure(c){
 const doc=c.hub.ownerDocument,dialog=doc.createElement('dialog');dialog.id='parcelAdventureDialog';dialog.className='parcel-dialog';dialog.setAttribute('aria-labelledby','parcelTitle');doc.body.append(dialog);
 const tracker=doc.createElement('button');tracker.className='parcel-tracker';tracker.type='button';c.viewport.append(tracker);
 const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 let owner=null,token=null,done=new Set(),loaded=false,error=false,busy=false,task=null,clues=new Set(),opener=null,view=0,loadVersion=0,saveVersion=0;
 const student=()=>c.getStudent()||{},phase=()=>STEPS.filter(id=>done.has(id)).length,level=()=>c.levelInfo(student().xp||0).level;
 const goal=()=>phase()===0?'교실의 꾸러미에서 단서 두 가지 찾기':phase()===1?'복도의 도서 안내판 살펴보기':phase()===2?'도서관에서 토리에게 꾸러미 전달하기':'도서 꾸러미 전달 완료';
 function render(){
  tracker.innerHTML='<span aria-hidden="true">'+(phase()>0?'<img src="maps/npcs/parcel-v1.webp" alt="">':'✦')+'</span><span><b>책 향기 꾸러미</b><small>'+(error?'연결 확인 · 다시 읽기':!loaded?'의뢰 수첩 읽는 중…':level()<16&&!phase()?'Lv.16부터 살펴봐요':goal())+'</small><i aria-hidden="true">'+[0,1,2].map(i=>i<phase()?'●':'○').join(' ')+'</i></span>';
  tracker.setAttribute('aria-label','꾸러미 의뢰 수첩 · '+(loaded?goal():'기록 불러오기'));tracker.dataset.complete=String(phase()===3);
  const parcel=c.objects.querySelector('[data-place=parcel]');if(parcel)parcel.hidden=loaded&&phase()>0;
  c.onProgress?.({loaded:loaded&&owner===student().id&&token===c.getToken(),phase:phase()});
 }
 async function load(){const s=student(),t=c.getToken();if(!s.id||!t)return false;if(owner===s.id&&token===t&&loaded)return true;if(task&&owner===s.id&&token===t)return task;
  owner=s.id;token=t;done=new Set();loaded=false;error=false;clues.clear();render();
  const requestedOwner=owner,requestedToken=t,version=++loadVersion;
  const current=()=>version===loadVersion&&requestedOwner===student().id&&requestedToken===c.getToken();
  let requestTask;requestTask=(async()=>{try{const {data,error:e}=await c.db.rpc('student_learning_journal',{p_token:t});if(e||!Array.isArray(data?.exploration))throw e||Error('No progress');if(!current())return false;done=new Set(data.exploration);loaded=true;error=false;return true}catch{if(current()){error=true;loaded=false}return false}finally{if(task===requestTask)task=null;render()}})();task=requestTask;return requestTask;
 }
 const close=()=>{if(!busy){view++;dialog.close()}};
 function open(title,subtitle,html){c.stopMovement();if(!dialog.open)opener=doc.activeElement;dialog.innerHTML='<header><div><span>우리 학교 작은 의뢰</span><h2 id="parcelTitle">'+esc(title)+'</h2><p>'+esc(subtitle)+'</p></div><button data-parcel-close type="button" autofocus>닫기</button></header><div class="parcel-body">'+html+'</div>';if(!dialog.open)dialog.showModal();dialog.scrollTop=0}
 async function prepare(){
  const request=++view,who=student().id,t=c.getToken();open('책 향기가 나는 꾸러미','의뢰 수첩을 펼치고 있어요.','<p>학교의 발자국을 확인하고 있어요…</p>');
  const ok=await load();if(request!==view||!dialog.open||who!==student().id||t!==c.getToken())return false;
  if(!ok){open('수첩을 아직 펼치지 못했어요','연결을 확인하고 다시 눌러 주세요.','<button data-parcel-retry>다시 읽기</button>');return false}return true;
 }
 const footer=()=>'<div id="parcelFeedback" class="parcel-feedback" role="status" aria-live="polite"></div>';
 async function start(){
  if(busy||!await prepare())return;
  if(level()<16&&!phase()){open('리본 꾸러미가 기다리고 있어요','Lv.16에 시작하는 산책 의뢰','<div class="parcel-intro"><img src="maps/npcs/parcel-v1.webp" alt="책 봉인과 잎 장식이 달린 리본 꾸러미"><h3>이 꾸러미는 누구에게 가는 걸까요?</h3><p>학교생활로 조금 더 성장하면 교실에서 단서를 찾아볼 수 있어요.<br>옷장과 독서 기록은 지금도 쓸 수 있어요.</p></div>');return}
  if(phase()===3){finish();return}
  const destinations=[['classroom','parcel','교실의 꾸러미로 걷기'],['hallway','notice','복도의 안내판으로 걷기'],['library','tori','토리에게 걸어가기']][phase()];
  open('책 향기가 나는 꾸러미','발자국 '+phase()+' / 3 · '+goal(),'<div class="parcel-intro"><img src="maps/npcs/parcel-v1.webp" alt="책 향기 꾸러미"><p>새봄 선생님: “주인을 찾지 못한 작은 꾸러미가 있네. 물건에 남은 표식을 따라 누구에게 가는지 알아볼까?”</p><div class="parcel-goal"><b>지금 찾을 단서</b><p>'+goal()+'</p></div></div><button class="parcel-primary" data-parcel-go="'+destinations[0]+'" data-target="'+destinations[1]+'">'+destinations[2]+'</button><p class="parcel-note">교실·복도·도서관은 실제 걷기 화면으로 이어져요. 돌아오면 완료한 단서부터 계속해요.</p>');
 }
 async function inspect(kind){if(busy||!await prepare())return;if(level()<16&&!phase())return start();
  if(phase()===3)return finish();
  if(kind==='parcel'&&c.getScene()==='classroom'&&phase()===0){clues=new Set();
   open('리본 아래에 남은 표식','눈에 띄는 봉인과 잎 장식을 눌러 살펴봐요.', '<div class="parcel-inspect"><img src="maps/npcs/parcel-v1.webp" alt="파란 책 봉인과 작은 잎 장식이 달린 꾸러미"><button class="parcel-hotspot seal" data-parcel-clue="book" aria-label="파란 책 모양 봉인 살펴보기">✦</button><button class="parcel-hotspot leaf" data-parcel-clue="leaf" aria-label="작은 잎 장식 살펴보기">✦</button></div><p class="parcel-note">빛나는 자리 두 곳을 눌러요. 아래 이름 버튼으로도 똑같이 살펴볼 수 있어요.</p><div class="parcel-clue-buttons"><button data-parcel-clue="book">책 모양 봉인 살펴보기</button><button data-parcel-clue="leaf">잎 장식 살펴보기</button></div><div id="parcelClues" class="parcel-clues" role="status">아직 발견한 단서가 없어요.</div><button class="parcel-primary" data-parcel-save="parcel-1">단서를 수첩에 담고 꾸러미 챙기기</button>'+footer());return}
  if(kind==='notice'&&c.getScene()==='hallway'&&phase()===1){
   open('복도의 작은 안내판','꾸러미에 찍힌 표식과 같은 곳을 찾아요.', '<div class="parcel-notice"><span aria-hidden="true">📖 🌿</span><h3>책 나눔 준비 중</h3><p>파란 책 봉인과 잎 장식은 도서관의 표식이에요.<br>책지기 토리가 책 나눔 물건을 기다리고 있어요.</p></div><h3>꾸러미가 향할 곳은?</h3><div class="parcel-route-choices"><button data-parcel-route="shop">✏️ 모모의 상점</button><button data-parcel-route="library">📖 토리의 도서관</button><button data-parcel-route="classroom">🏫 선생님의 교실</button></div>'+footer());return}
  if(kind==='tori'&&c.getScene()==='library'&&phase()===2){
   open('토리에게 찾아온 책 향기','도서관 · 마지막 발자국', '<div class="parcel-tori"><img src="maps/npcs/tori-v1.webp" alt="책지기 토리"><div><h3>“내가 기다리던 책 나눔 꾸러미구나!”</h3><p>토리: “책 봉인과 잎 표식을 잘 찾았네. 이 안에는 낡은 책을 고칠 종이와 예쁜 책갈피가 있어. 같이 책 나눔을 준비해 줄래?”</p></div></div><div class="parcel-delivery"><img src="maps/npcs/parcel-v1.webp" alt="토리에게 전달할 책 나눔 꾸러미"></div><button class="parcel-primary" data-parcel-save="parcel-3">토리에게 꾸러미 전달하기</button>'+footer());return}
  return start();
 }
 function finish(){open('책 나눔의 작은 배달부','세 발자국을 모두 모았어요.', '<div class="parcel-finish"><img src="maps/npcs/tori-v1.webp" alt="책지기 토리"><h3>토리가 책갈피 하나를 수첩에 끼워 줬어요!</h3><div class="parcel-bookmark" role="img" aria-label="파란 책과 작은 잎이 그려진 기념 책갈피"><span>📖</span><i>🌿</i><b>책 나눔의 기억</b></div><p>꾸러미의 표식 → 복도 안내판 → 토리에게 전달<br>직접 찾아다니며 세 단서를 이어 줬어요.</p><strong>✓ 내 탐험 수첩에 배달 기억이 남아요</strong></div><p class="parcel-note">기념 책갈피는 이 의뢰의 수첩 장식이에요. 경험치·골드·장비 능력치는 바뀌지 않아요.</p><button data-parcel-back>학교 산책 계속하기</button>');render()}
 async function save(step,values){if(busy)return;const feedback=doc.getElementById('parcelFeedback');if(!feedback)return;
  if(step==='parcel-1'&&clues.size!==2){feedback.textContent='봉인과 잎 장식을 둘 다 살펴봐 주세요.';return}
  const requestedOwner=student().id,requestedToken=c.getToken(),version=++saveVersion;busy=true;c.stopMovement();const buttons=[...dialog.querySelectorAll('button')].map(b=>[b,b.disabled]);buttons.forEach(([b])=>b.disabled=true);feedback.textContent='발견한 발자국을 수첩에 담고 있어요…';
  try{const {data,error:e}=await c.db.rpc('student_parcel_adventure',{p_token:requestedToken,p_step:step,p_clues:values});if(e||!data)throw e||Error('No result');if(requestedOwner!==student().id||requestedToken!==c.getToken())return;
   if(version!==saveVersion)return;if(!data.correct){feedback.textContent='꾸러미의 파란 책 봉인과 잎 표식을 안내판과 나란히 살펴봐요. 토리가 있는 도서관으로 향해요.';return}if(data.step_id!==step)throw Error('Unexpected progress');done.add(step);render();doc.dispatchEvent(new CustomEvent('student-parcel-updated'));
   feedback.innerHTML='<b>✓ 발자국 '+phase()+' / 3을 저장했어요.</b><p>'+(phase()===1?'꾸러미를 챙겼어요. 복도 안내판에서 두 표식의 주인을 찾아봐요.':phase()===2?'두 표식이 도서관을 가리켜요. 토리에게 직접 걸어가 보세요.':'토리: “꼼꼼히 찾아와 줘서 고마워!”')+'</p><button class="parcel-primary" data-parcel-next>'+(phase()===3?'기념 책갈피 보기':'다음 단서로 걷기 →')+'</button>';feedback.querySelector('button').focus({preventScroll:true});
  }catch{if(version===saveVersion&&requestedOwner===student().id&&requestedToken===c.getToken())feedback.textContent='아직 저장을 확인하지 못했어요. 발견한 단서는 그대로예요. 연결을 확인하고 다시 눌러 주세요.'}
  finally{if(version===saveVersion){busy=false;buttons.forEach(([b,disabled])=>{if(b.isConnected)b.disabled=disabled||done.has(step)&&b.matches('[data-parcel-save],[data-parcel-route],[data-parcel-clue]')})}}
 }
 function go(room,target){close();window.enterHubScene(room);requestAnimationFrame(()=>{if(c.getScene()===room){c.walk.goTo(target);doc.getElementById('campusTitle').focus({preventScroll:true})}})}
 tracker.onclick=()=>start();dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();else view++});dialog.addEventListener('close',()=>{if(dialog.open)return;view++;if(opener?.isConnected&&opener.getClientRects().length)opener.focus({preventScroll:true});else {const title=doc.getElementById('campusTitle');if(title?.getClientRects().length)title.focus({preventScroll:true});else doc.querySelector('.sa-hero button')?.focus({preventScroll:true})}});
 dialog.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||busy)return;
  if(b.hasAttribute('data-parcel-close')||b.hasAttribute('data-parcel-back')){close();return}
  if(b.hasAttribute('data-parcel-retry')){loaded=false;start();return}
  if(owner!==student().id||token!==c.getToken()){loaded=false;done.clear();clues.clear();start();return}
  if(b.hasAttribute('data-parcel-go')){go(b.dataset.parcelGo,b.dataset.target);return}
  if(b.hasAttribute('data-parcel-next')){if(phase()===3)finish();else {const target=phase()===1?['hallway','notice']:['library','tori'];go(...target)}return}
  if(b.hasAttribute('data-parcel-clue')){const id=b.dataset.parcelClue;if(!['book','leaf'].includes(id)||phase()!==0)return;clues.add(id);dialog.querySelectorAll('[data-parcel-clue="'+id+'"]').forEach(el=>{el.classList.add('found');el.setAttribute('aria-pressed','true')});doc.getElementById('parcelClues').innerHTML='<b>발견한 단서 '+clues.size+' / 2</b><ul>'+[...clues].map(x=>'<li>'+(x==='book'?'📖 파란 책 모양 봉인':'🌿 작은 잎 장식')+'</li>').join('')+'</ul>';return}
  if(b.hasAttribute('data-parcel-route')){save('parcel-2',[b.dataset.parcelRoute]);return}
  if(b.hasAttribute('data-parcel-save')){save(b.dataset.parcelSave,b.dataset.parcelSave==='parcel-1'?[...clues].sort():['tori'])}
 });
 new MutationObserver(render).observe(c.objects,{childList:true});doc.addEventListener('student-dashboard-updated',()=>{if(owner!==student().id||token!==c.getToken()){view++;loadVersion++;saveVersion++;busy=false;loaded=false;done.clear();clues.clear();if(dialog.open)dialog.close();render()}load()});
 load();render();return {start,inspect,collected:()=>loaded&&phase()>0};
}
