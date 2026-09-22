(()=>{
const $=id=>document.getElementById(id),app=$('app');
const menus=[['today','☀️','오늘'],['quests','📋','퀘스트'],['students','👥','학생'],['reading','📚','독후감'],['shop','🎁','상점'],['records','🧾','기록'],['settings','⚙️','설정']];
const oldGrid=app.querySelector('.grid'),top=app.querySelector('.top'),summary=app.querySelector('.summary');
const shell=document.createElement('div');shell.className='teacher-shell';
shell.innerHTML=`<aside class="teacher-sidebar"><div class="teacher-brand">🌱 우리반 RPG<small>선생님 교실</small></div><nav aria-label="교사용 메뉴">${menus.map(([id,icon,label])=>`<button type="button" data-view="${id}"><span><i class="menu-icon" aria-hidden="true">${icon}</i>${label}</span><small id="nav-${id}"></small></button>`).join('')}</nav><a href="./" target="_blank" rel="noopener">학생 화면 ↗</a><button class="btn" onclick="logout()">로그아웃</button></aside><div class="teacher-content"><header class="teacher-heading"><div><p id="teacherDate" class="muted"></p><h1 id="teacherTitle" tabindex="-1">오늘의 현황</h1><p id="teacherSubtitle" class="muted"></p></div><button class="btn" id="dashboardRefresh">↻ 새로고침</button></header>${menus.map(([id])=>`<section id="view-${id}" class="teacher-view" aria-labelledby="teacherTitle" ${id==='today'?'':'hidden'}></section>`).join('')}</div>`;
app.prepend(shell);top.remove();
const descriptions={today:'아이들이 보낸 요청을 확인하고, 우리 반 소식을 살펴보세요.',quests:'퀘스트별로 학생들의 진행 상황을 확인해요.',students:'학생 계정과 성장 상태를 관리해요.',reading:'아이들이 읽은 책과 생각을 확인해요.',shop:'학생들의 교환 요청을 처리해요.',records:'활동 기록과 보완 요청을 살펴봐요.',settings:'우리 반에 맞게 기능을 설정해요.'};
function open(view,focus=false){if(!menus.some(m=>m[0]===view))view='today';for(const [id,,label] of menus){$('view-'+id).hidden=id!==view;const b=shell.querySelector(`[data-view="${id}"]`);b.setAttribute('aria-current',id===view?'page':'false');if(id===view)$('teacherTitle').textContent=id==='today'?'오늘의 현황':label}$('teacherSubtitle').textContent=descriptions[view];if(focus)$('teacherTitle').focus();window.scrollTo(0,0)}
shell.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>open(b.dataset.view,true));
const move=(id,view)=>$('view-'+view).append($(id).closest('section.card'));
move('students','students');move('submissions','quests');move('quests','quests');move('readingReviews','reading');move('shopOrders','shop');
const form=$('questType').closest('section.card'),details=document.createElement('details');details.className='quest-create';details.innerHTML='<summary>＋ 퀘스트 만들기</summary>';details.append(form);$('view-quests').prepend(details);
$('view-records').dataset.recordsMount='true';
$('view-settings').innerHTML='<section class="card"><h2>우리 반 기능 설정</h2><p class="muted">사용할 기능과 운영 설정을 변경할 수 있어요.</p><a class="btn primary settings-link" href="teacher-controls.html" target="_top">기능 설정 열기 ↗</a><div class="row" style="margin-top:18px"><a class="btn settings-link" href="./" target="_blank" rel="noopener">학생 화면 ↗</a><button class="btn" onclick="logout()">로그아웃</button></div></section>';
$('view-today').innerHTML='<h2 class="dashboard-section-title">확인을 기다리고 있어요</h2><p class="muted">오늘 이전에 도착한 미처리 요청도 함께 표시해요.</p><div class="dashboard-requests"></div><h2 class="dashboard-section-title">우리 반 한눈에</h2>';
const requestTypes=[['quests','📋','퀘스트 완료 요청'],['reading','📚','독후감 확인 요청'],['shop','🎁','상점 교환 요청']];
for(const [view,icon,label] of requestTypes){const b=document.createElement('button');b.type='button';b.className='dashboard-request';b.innerHTML=`<span><i class="request-icon" aria-hidden="true">${icon}</i>${label}</span><strong id="count-${view}">불러오는 중…</strong><small>확인하러 가기 →</small>`;b.onclick=()=>open(view,true);$('view-today').querySelector('.dashboard-requests').append(b)}
$('view-today').append(summary);move('ranking','today');oldGrid.remove();
function sync(){for(const [view] of requestTypes){let n;if(view==='quests'){const t=$('summaryPending').textContent;n=/^\d+건$/.test(t)?parseInt(t):null}else{const root=$(view==='reading'?'readingReviews':'shopOrders');n=root.dataset.pendingCount===undefined?null:Number(root.dataset.pendingCount)}const text=!Number.isFinite(n)?'확인 필요':`${n}건`;const el=$('count-'+view);if(el.textContent!==text)el.textContent=text;el.parentElement.classList.toggle('has-pending',n>0);const badge=$('nav-'+view),v=n>0?String(n):'';if(badge.textContent!==v)badge.textContent=v}}
new MutationObserver(sync).observe(app,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-pending-count']});
$('dashboardRefresh').onclick=async()=>{const b=$('dashboardRefresh');b.disabled=true;b.textContent='불러오는 중…';try{await window.refresh?.()}finally{b.disabled=false;b.textContent='↻ 새로고침'}};
$('teacherDate').textContent=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',weekday:'long'}).format(new Date());open('today');sync();
})();


