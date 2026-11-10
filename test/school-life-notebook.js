import {PROJECTS,FLOWER_NAMES,FISH_NAMES,projectRequirement} from './school-life-state.js?v=20261110-notebook';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const art={invitation:'invitation',weed:'weed',branch:'branch',flower:'flower',flowerPink:'flowerPink',flowerBlue:'flowerBlue',sprout:'sprout',bench:'bench',school:'restored',garden:'flowerPink',library:'readingNook',lights:'lantern'};
const img=(name,cls='')=>`<img class="${cls}" src="maps/life/${art[name]||name}-harmony-v2.webp" alt="">`;
const can='<svg viewBox="0 0 104 72" aria-hidden="true"><path d="M24 26C-2 11-3 64 26 55" fill="none" stroke="#536f60" stroke-width="7"/><path d="M57 43 84 17 96 23 65 58" fill="#9fbea1" stroke="#536f60" stroke-width="3"/><path d="m85 15 14 7-4 7-14-8Z" fill="#dbcf99" stroke="#637b61" stroke-width="2"/><path d="M23 24Q43 16 64 25L66 58Q43 72 21 57Z" fill="#90b897" stroke="#536f60" stroke-width="3"/><ellipse cx="43" cy="25" rx="20" ry="7" fill="#d4dcc0" stroke="#536f60" stroke-width="3"/><path d="M28 36V53" stroke="#c3dbb8" stroke-width="4" stroke-linecap="round"/></svg>';
const rod='<svg viewBox="0 0 90 90" aria-hidden="true"><path d="M20 75 56 16" fill="none" stroke="#6e5137" stroke-width="6" stroke-linecap="round"/><path d="M26 64 56 16" stroke="#c6a36a" stroke-width="3"/><path d="M56 16Q73 20 70 64" fill="none" stroke="#617d83" stroke-width="2"/><path d="M70 64v10q0 8-7 5" fill="none" stroke="#617d83" stroke-width="3"/><ellipse cx="70" cy="59" rx="5" ry="8" fill="#d98261" stroke="#795744" stroke-width="2"/><circle cx="30" cy="59" r="6" fill="#e8ce8d" stroke="#795744" stroke-width="2"/></svg>';
const fish='<svg viewBox="0 0 100 76" aria-hidden="true"><path d="M25 38C40 11 73 11 88 38 73 65 40 65 25 38L9 24v28Z" fill="#a5c5b8" stroke="#4f7066" stroke-width="3"/><path d="m47 23 9-12 10 13M45 51l12 12 8-13" fill="#e4bd78" stroke="#4f7066" stroke-width="2"/><circle cx="74" cy="35" r="3" fill="#344c42"/></svg>';
const empty=(title,text)=>`<div class="life-empty">${img('sprout')}<h3>${title}</h3><p>${text}</p></div>`;
const progress=(value,max,label)=>`<div class="life-progress"><div><span>${label}</span><b>${value}<small> / ${max}</small></b></div><progress max="${max}" value="${value}" aria-label="${label}"></progress></div>`;
export function installLifeNotebook(api){
 function tabs(kind,items,selected,render){
  const root=api.overlay(),book=root.querySelector('.life-book');book.classList.add('life-notebook');
  const nav=document.createElement('div');nav.className='life-book-tabs';nav.setAttribute('role','tablist');nav.setAttribute('aria-label',kind);
  nav.innerHTML=items.map(([id,label])=>`<button role="tab" id="life-tab-${id}" aria-controls="life-page-${kind}" aria-selected="${id===selected}" tabindex="${id===selected?0:-1}" data-page="${id}">${label}</button>`).join('');
  book.querySelector('.life-book-head').after(nav);
  const panel=book.querySelector('.life-book-body');panel.setAttribute('role','tabpanel');panel.id='life-page-'+kind;panel.setAttribute('aria-labelledby','life-tab-'+selected);panel.tabIndex=0;
  for(const b of nav.children){b.onclick=()=>{if(!api.valid()||!root.contains(b))return;render(b.dataset.page);root.querySelector('[data-page="'+b.dataset.page+'"]').focus({preventScroll:true});};b.onkeydown=e=>{const at=items.findIndex(x=>x[0]===b.dataset.page),next=e.key==='ArrowRight'?(at+1)%items.length:e.key==='ArrowLeft'?(at+items.length-1)%items.length:e.key==='Home'?0:e.key==='End'?items.length-1:-1;if(next<0)return;e.preventDefault();nav.children[next].click();};}
 }
 function quest(s){
  const n=s.opening.step,w=[0,1,2].filter(i=>s.weeds.includes(i)).length,d=s.dust.length;
  const choices=[
   ['도착한 편지','잎사귀 초대장','방 안의 편지를 읽어 보아요.','내 방','invitation'],
   ['새로운 만남','새싹에게 초대장 보여 주기','마당에서 기다리는 새싹과 이야기해요.','학교 마당','invitation'],
   ['새싹의 부탁',w===3?'풀 아래 작은 열쇠':'풀 아래에서 열쇠 찾기',w===3?'드러난 열쇠를 가까이서 주워요.':'화단 아래 잡초 세 곳을 뽑아요.','학교 마당',w===3?'invitation':'weed'],
   ['새싹의 부탁','찾은 열쇠로 교실 열기','학교 문에 가까이 가서 열쇠를 맞춰요.','학교 앞','school'],
   ['교실에 첫 햇살',d===4?'창문을 활짝 열어요':'교실의 먼지 쓸기',d===4?'깨끗해진 교실에 햇살을 들여요.':'바닥에 남은 먼지 네 곳을 쓸어요.','교실','school'],
   ['돌아온 친구','토리와 인사하기','교실로 돌아온 토리에게 말을 걸어요.','교실','library'],
   ['토리의 쪽지','종 아래 글귀 읽기','토리가 놓은 쪽지를 수첩에 간직해요.','교실','invitation']
  ];
  if(n===7)return empty('첫 이야기를 마쳤어요','교실에 햇살이 들고 토리가 돌아왔어요.<br>이제 학교를 천천히 둘러보아요.')+'<button class="life-choice" data-memory>남긴 기억 보기</button>';
  const [label,title,body,place,icon]=choices[n];
  return `<article class="life-quest-sheet"><div class="life-quest-caption"><span>${label}</span><span class="life-status">${n===0?'도착':'진행 중'}</span></div><div class="life-quest-title">${img(icon)}<h3>${title}</h3></div><p class="life-quest-next">${body}</p>${n===2?progress(w,3,'잡초 뽑기'):n===4?progress(d,4,'먼지 쓸기'):''}<div class="life-quest-place"><span>찾아갈 곳</span><strong>${place}</strong></div></article><button class="life-choice life-return" data-return>계속 둘러보기</button>`;
 }
 function memories(s){
  const places=PROJECTS.filter(p=>s.projects.includes(p.id)||api.level()>=p.level);
  const stamps=[['초대장을 간직했어요',1,'invitation'],['열쇠를 찾았어요',3,'weed'],['교실 문을 열었어요',4,'school'],['첫 햇살이 들었어요',5,'school'],['토리가 돌아왔어요',6,'library'],['종 아래 글귀를 남겼어요',7,'invitation']].filter(x=>s.opening.step>=x[1]);
  return `<h3 class="life-section-title">학교에 남긴 작은 봄</h3><div class="life-stat-grid">${[['weed','잡초',s.weeds.length,'/ 6곳'],['flower','피운 꽃',s.flowers.filter(f=>f.stage===3).length,'송이'],['school','교실 청소',s.dust.length,'/ 4곳']].map(([a,b,c,d])=>`<div>${img(a)}<span>${b}</span><strong>${c} <small>${d}</small></strong></div>`).join('')}</div>${stamps.length?'<h3 class="life-section-title">함께한 기억</h3><ul class="life-memory-list">'+stamps.map(([t,n,a])=>`<li><span aria-hidden="true">✓</span>${t}</li>`).join('')+'</ul>':''}${s.opening.step===7?'<blockquote>“학교의 종이 잠든 날,<br>우리는 작은 씨앗을 남겼다.”</blockquote>':''}${places.length?'<h3 class="life-section-title">가꾸는 학교</h3><div class="life-place-list">'+places.map(p=>`<details><summary>${img(p.id)}<span><strong>${p.name}</strong><small>${s.projects.includes(p.id)?'✓ 완성했어요':'살펴볼 수 있어요'}</small></span></summary><p>${esc(s.projects.includes(p.id)?'우리가 가꾼 모습이 학교에 남았어요.':projectRequirement(s,p.id,api.level())||'준비가 되었어요. 가까이 가서 함께 고쳐요.')}</p></details>`).join('')+'</div>':''}<details class="life-record-details"><summary>이전 기록과 나가기</summary><p>이전 탐험과 이 기기의 원래 이야기도 남아 있어요.</p><div class="life-choices"><button class="life-choice" data-old>이전 탐험 수첩</button><button class="life-choice" data-title>타이틀로</button></div></details>`;
 }
 function discoveries(s){const known=s.fish.map((v,i)=>({v,i})).filter(x=>x.v>0);return `<h3 class="life-section-title">연못에서 만난 친구</h3>${known.length?'<div class="life-item-grid">'+known.map(({v,i})=>`<div class="life-item">${fish}<strong>${FISH_NAMES[i]}</strong><span>${v}번 만났어요</span></div>`).join('')+'</div>':empty('아직 비어 있는 수첩','연못에서 물고기를 만나면<br>이곳에 기억이 남아요.')}<p class="life-page-note">만난 물고기는 연못에 놓아주었어요.</p>`;}
 function journal(page='quest'){const s=api.state();api.book('학교 수첩',page==='quest'?quest(s):page==='memory'?memories(s):discoveries(s));tabs('journal',[['quest','받은 부탁'],['memory','학교 모습'],['discovery','발견 기록']],page,journal);const o=api.overlay();o.querySelector('[data-return]')?.addEventListener('click',api.hide);o.querySelector('[data-memory]')?.addEventListener('click',()=>journal('memory'));o.querySelector('[data-title]')?.addEventListener('click',api.title);o.querySelector('[data-old]')?.addEventListener('click',api.legacy);}
 function bag(page='tools'){
  const s=api.state();let html='';
  if(page==='tools')html='<h3 class="life-section-title">언제든 꺼내 쓰는 도구</h3><div class="life-item-grid">'+[['can','물뿌리개',can],['rod','낚싯대',rod]].map(([id,name,icon])=>`<button class="life-item" data-tool="${id}" aria-pressed="${api.held()===id}">${icon}<strong>${name}</strong><span>${api.held()===id?'손에 들고 있어요':'손에 들기'}</span></button>`).join('')+'</div><p class="life-page-note">그림을 누르면 손에 들어요.<br>한 번 더 누르면 주머니에 넣어요.</p>';
  if(page==='seeds')html='<h3 class="life-section-title">오늘 심을 꽃</h3><div class="life-item-grid life-seed-grid">'+FLOWER_NAMES.map((n,i)=>`<button class="life-item life-swatch" data-seed="${i}" aria-pressed="${s.seed===i}">${img(['flower','flowerPink','flowerBlue'][i])}<strong>${n}</strong><span>${s.seed===i?'선택한 씨앗':'씨앗 고르기'}</span></button>`).join('')+'</div><p class="life-page-note">빈 흙에 가까이 가서 선택한 씨앗을 심어요.</p>';
  if(page==='materials')html='<h3 class="life-section-title">모은 재료</h3><div class="life-item-grid"><div class="life-item">'+img('branch')+`<strong>나뭇가지</strong><span>${s.wood}개</span></div></div><p class="life-page-note">학교의 쉴 자리를 고칠 때 써요.</p>`;
  if(page==='food')html=empty('아직 음식이 없어요','먹을 수 있는 음식을 얻으면<br>이곳에 담아 둘게요.');
  api.book('작은 도구 주머니',html);tabs('bag',[['tools','도구'],['seeds','씨앗'],['materials','재료'],['food','음식']],page,bag);const o=api.overlay();
  o.querySelectorAll('[data-seed]').forEach(b=>b.onclick=()=>{if(!api.valid()||!o.contains(b))return;if(api.mutate(s=>s.seed=Number(b.dataset.seed))){bag('seeds');api.toast(FLOWER_NAMES[api.state().seed]+' 씨앗을 골랐어요.');}});
  o.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{if(!api.valid()||!o.contains(b))return;api.hold(api.held()===b.dataset.tool?'':b.dataset.tool);bag('tools');});
 }
 return {journal,bag,can,rod};
}
