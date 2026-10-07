import {installReadingShelf} from './reading-shelf.js?v=20261007-shelf';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ids={book_title:'readingBookTitle',read_date:'readingDate',summary:'readingSummary',thoughts:'readingThought',recommendation_rating:'readingRating',recommendation_reason:'readingRecommendation'};
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const blank=()=>({book_title:'',read_date:today(),summary:'',thoughts:'',recommendation_rating:5,recommendation_reason:''});
const hasWriting=data=>['book_title','summary','thoughts','recommendation_reason'].some(k=>data?.[k]?.trim());

export function installStudentReading(ctx){
 const $=id=>document.getElementById(id);
 const shelf=installReadingShelf({...ctx,write:id=>openDesk(id)});
 let owner='',state=null,context='new',busy=false,historyVersion=0,reviews=[];
 const identity=()=>String(ctx.getStudent()?.id||'');
 const key=id=>'classRpgReadingDraft:v1:'+location.pathname+':'+id;
 const same=id=>identity()===id&&owner===id;
 function persist(){
  try{localStorage.setItem(key(owner),JSON.stringify(state));return true}catch{return false}
 }
 function ensure(){
  ctx.ensureModals();
  const modal=$('readingPortfolioModal');if(modal.dataset.drafts)return;
  modal.dataset.drafts='true';modal.dataset.reliableActions='true';modal.querySelector('section').setAttribute('aria-labelledby','readingJournalTitle');
  modal.querySelector('h2').id='readingJournalTitle';modal.querySelector('h2').textContent='나의 책 이야기';
  modal.querySelector('.reading-form').innerHTML=
   '<div class="reading-welcome"><span aria-hidden="true">📚</span><div><b>책에서 만난 생각을 모아요</b><p>내 말로 짧게 적어도 좋아요. 선생님이 확인하면 10 경험치와 30 골드를 받아요.</p></div></div>'+
   '<div class="reading-context"><h3 id="readingFormTitle">새 책 이야기 쓰기</h3><button type="button" class="btn" id="readingNew" hidden>새 글 쓰기</button></div>'+
   '<p id="readingTeacherNote" class="reading-teacher-note" hidden></p><p id="readingDraftStatus" class="reading-draft-status" role="status"></p>'+
   '<form id="readingEntryForm"><div class="reading-book-row"><div class="field"><label for="readingBookTitle">읽은 책 이름</label><input id="readingBookTitle" maxlength="80" required placeholder="어떤 책을 읽었나요?" autocomplete="off"></div><div class="field"><label for="readingDate">읽은 날</label><input id="readingDate" type="date" required></div></div>'+
   '<div class="field"><label for="readingSummary">어떤 이야기였나요?</label><p id="readingSummaryHelp">기억에 남는 일을 순서대로 적어 보세요.</p><textarea id="readingSummary" maxlength="3000" required aria-describedby="readingSummaryHelp" placeholder="처음에는… 그러다가…"></textarea></div>'+
   '<div class="field"><label for="readingThought">나는 이렇게 생각했어요</label><p id="readingThoughtHelp">내 경험과 닮은 점이나 주인공에게 하고 싶은 말도 좋아요.</p><textarea id="readingThought" maxlength="3000" required aria-describedby="readingThoughtHelp" placeholder="내가 주인공이라면…"></textarea></div>'+
   '<div class="field"><label for="readingRating">친구에게 얼마나 추천하고 싶나요?</label><select id="readingRating"><option value="5">★★★★★ · 꼭 추천해요</option><option value="4">★★★★☆ · 추천해요</option><option value="3">★★★☆☆ · 괜찮아요</option><option value="2">★★☆☆☆ · 조금 아쉬워요</option><option value="1">★☆☆☆☆ · 나와는 잘 맞지 않았어요</option></select></div>'+
   '<div class="field"><label for="readingRecommendation">그렇게 생각한 까닭은요?</label><textarea id="readingRecommendation" maxlength="1500" required placeholder="어떤 친구에게 추천하고 싶은지도 적어 보세요."></textarea></div>'+
   '<div id="readingPortfolioMsg" class="message" role="status" aria-live="polite"></div><button type="submit" id="readingSubmit" class="btn good">선생님께 보내기</button></form>'+
   '<p class="reading-draft-hint">쓰던 글은 이 기기의 내 계정에 자동으로 보관돼요. 제출한 글은 다른 기기에서도 볼 수 있어요.</p>';
  $('readingEntryForm').addEventListener('input',capture);
  $('readingEntryForm').addEventListener('change',capture);
  $('readingEntryForm').addEventListener('submit',e=>{e.preventDefault();save()});
  $('readingNew').onclick=()=>switchContext('new');const shelfButton=document.createElement('button');shelfButton.type='button';shelfButton.className='btn reading-shelf-link';shelfButton.textContent='📚 책장에서 나와 친구들의 글 읽기';shelfButton.onclick=()=>{close();shelf.open()};modal.querySelector('.reading-form').append(shelfButton);
  $('readingHistory').addEventListener('click',e=>{
   if(e.target.closest('[data-reading-reload]'))loadHistory();
   const button=e.target.closest('[data-reading-retry]');if(button&&!busy&&!state.pending)switchContext(button.dataset.readingRetry);
  });
 }
 function message(text,ok=false){$('readingPortfolioMsg').className='message '+(ok?'ok':'error');$('readingPortfolioMsg').textContent=text}
 function fields(){return Object.fromEntries(Object.entries(ids).map(([k,id])=>[k,k==='recommendation_rating'?Number($(id).value):$(id).value]))}
 function capture(){
  if(!same(owner)||busy||state.pending)return;
  state.drafts[context]=fields();state.active=context;
  $('readingDraftStatus').textContent=persist()?'✓ 쓰던 글을 이 기기에 보관했어요.':'이 기기에 글을 보관하지 못했어요. 창을 닫기 전에 쓴 글을 따로 복사해 주세요.';
 }
 function loadState(id){
  owner=id;state={active:'new',drafts:{},pending:null};
  try{const saved=JSON.parse(localStorage.getItem(key(id))||'null');if(saved?.drafts&&typeof saved.drafts==='object')state=saved}catch{}
  context=String(state.pending?.context||state.active||'new');
 }
 function renderForm(){
  const row=reviews.find(r=>String(r.review_id)===context);
  const data=state.pending?.payload||state.drafts[context]||row||blank();
  for(const [k,id] of Object.entries(ids))$(id).value=data[k]??blank()[k];
  $('readingFormTitle').textContent=context==='new'?'새 책 이야기 쓰기':'선생님 말씀을 읽고 다듬기';
  $('readingNew').hidden=context==='new';
  $('readingTeacherNote').hidden=!row?.rejection_reason;
  $('readingTeacherNote').textContent=row?.rejection_reason?'선생님 말씀: '+row.rejection_reason:'';
  $('readingDraftStatus').textContent=hasWriting(state.drafts[context])?'✓ 쓰던 글을 이어서 가져왔어요.':'한 줄씩 천천히 써 보세요. 쓰는 동안 자동으로 보관해요.';
  syncBusy();
  if(state.pending)message('이전에 보낸 글의 결과를 확인해 주세요. 같은 글은 한 번만 제출돼요.');
 }
 function syncBusy(){
  const frozen=busy||!!state.pending;
  for(const id of Object.values(ids))$(id).disabled=frozen;
  $('readingNew').disabled=frozen;
  $('readingSubmit').disabled=busy;
  $('readingSubmit').textContent=busy?'선생님께 보내는 중…':state.pending?'제출 결과 확인하기':context==='new'?'선생님께 보내기':'다듬은 글 다시 보내기';
  $('readingEntryForm').setAttribute('aria-busy',String(busy));
  $('readingHistory').querySelectorAll('[data-reading-retry]').forEach(b=>b.disabled=frozen);
 }
 function switchContext(next){
  if(busy||state.pending)return;
  capture();context=String(next);state.active=context;
  if(!state.drafts[context])state.drafts[context]=reviews.find(r=>String(r.review_id)===context)||blank();
  persist();message('');renderForm();$('readingBookTitle').focus();$('readingFormTitle').scrollIntoView({block:'nearest'});
 }
 async function loadHistory(){
  const id=owner,version=++historyVersion;
  $('readingHistory').setAttribute('aria-busy','true');
  if(!reviews.length)$('readingHistory').innerHTML='<p class="reading-loading">책 이야기를 불러오고 있어요…</p>';
  try{
   const {data,error}=await ctx.db.rpc('student_reading_journal',{p_token:ctx.getToken()});if(error||!Array.isArray(data?.reviews))throw error||new Error('missing journal');
   if(!same(id)||version!==historyVersion)return;
   reviews=data.reviews;$('readingPortfolioCount').textContent='이번 주 '+data.weekly_count+' / 3편 · 모두 '+reviews.length+'편';
   $('readingHistory').innerHTML='<div class="reading-history-heading"><h3>차곡차곡 모은 책 이야기</h3><button class="btn" data-reading-reload>새로고침</button></div>'+(reviews.length?reviews.map(r=>
    '<article class="reading-entry"><div class="reading-entry-top"><h4>'+esc(r.book_title)+'</h4><span class="reading-state '+esc(r.status)+'">'+({submitted:'선생님 확인 중',approved:'확인 완료 · 보상 받음',rejected:'조금 더 다듬어요'}[r.status]||'선생님 확인 중')+'</span></div><p class="reading-entry-date">'+esc(r.read_date)+' · '+'★'.repeat(Math.max(0,Math.min(5,Number(r.recommendation_rating)||0)))+'</p><details><summary>내가 쓴 글 펼치기</summary><p><b>책 이야기</b><br>'+esc(r.summary)+'</p><p><b>내 생각</b><br>'+esc(r.thoughts)+'</p><p><b>추천하는 까닭</b><br>'+esc(r.recommendation_reason)+'</p></details>'+
    (r.status==='rejected'?'<p class="reading-teacher-note">'+esc(r.rejection_reason?'선생님 말씀: '+r.rejection_reason:'생각을 조금 더 보태서 다시 보내 주세요.')+'</p><button class="btn" data-reading-retry="'+esc(r.review_id)+'">이 글 다듬기</button>':'')+'</article>').join(''):'<div class="reading-empty"><span aria-hidden="true">🌱</span><b>첫 책 이야기를 기다려요</b><p>좋아하는 책 한 권에서 시작해 볼까요?</p></div>');
   const row=reviews.find(r=>String(r.review_id)===context);
   $('readingTeacherNote').hidden=!row?.rejection_reason;$('readingTeacherNote').textContent=row?.rejection_reason?'선생님 말씀: '+row.rejection_reason:'';
   syncBusy();
  }catch{
   if(same(id)&&version===historyVersion){$('readingPortfolioCount').textContent='기록을 아직 불러오지 못했어요.';$('readingHistory').innerHTML='<div class="reading-empty"><b>예전 글을 불러오지 못했어요</b><p>지금 쓰는 글은 그대로 있어요. 연결을 확인하고 다시 눌러 주세요.</p><button class="btn" data-reading-reload>기록 다시 불러오기</button></div>'}
  }finally{if(same(id)&&version===historyVersion)$('readingHistory').removeAttribute('aria-busy')}
 }
 async function open(mode='combined'){
  const id=identity();if(!id)return;ensure();$('readingPortfolioModal').classList.toggle('reading-desk',mode==='desk');$('readingJournalTitle').textContent=mode==='desk'?'책상에서 독후감 쓰기':'나의 책 이야기';if(busy&&owner!==id){$('readingPortfolioModal').classList.add('hidden');return}
  if(!busy){capture();reviews=[];loadState(id);message('');renderForm()}
  $('readingPortfolioModal').classList.remove('hidden');await loadHistory();
 }
 async function openDesk(reviewId=null){await open('desk');if(reviewId&&same(owner)&&!busy&&!state.pending){if(reviews.some(r=>String(r.review_id)===String(reviewId)))switchContext(reviewId);else message('수정할 글을 아직 불러오지 못했어요. 연결을 확인하고 책장에서 다시 펼쳐 주세요.');}const form=$('readingEntryForm');form?.scrollIntoView({block:'nearest'})}
 function close(){capture();$('readingPortfolioModal')?.classList.add('hidden')}
 async function save(){
  if(busy||!same(owner))return;
  if(!state.pending){
   if(!$('readingEntryForm').reportValidity())return;
   capture();const payload=fields();for(const k of ['book_title','summary','thoughts','recommendation_reason'])payload[k]=payload[k].trim();
   if(!['book_title','read_date','summary','thoughts','recommendation_reason'].every(k=>payload[k]))return message('빈칸을 채우고 내 생각을 들려주세요.');
   if(context!=='new')payload.review_id=Number(context);
   state.pending={id:crypto.randomUUID(),action:context==='new'?'reading_add':'reading_retry',context,payload};
   if(!persist()){state.pending=null;return message('이 기기에 제출 준비를 저장하지 못했어요. 쓴 글을 복사해 두고 선생님께 알려 주세요.')}
  }
  const id=owner,request=state.pending;busy=true;syncBusy();message('글을 안전하게 보내고 있어요…',true);
  try{
   const {data,error}=await ctx.db.rpc('student_safe_action',{p_token:ctx.getToken(),p_request_id:request.id,p_action:request.action,p_payload:request.payload});
   if(error)throw error;if(!data?.ok)throw new Error('unconfirmed');
   if(!same(id))return;
   // Clear immediately after the receipt, before a possibly failing history refresh.
   delete state.drafts[request.context];state.pending=null;state.active='new';context='new';persist();renderForm();
   message('선생님께 보냈어요! 확인이 끝나면 10 경험치와 30 골드를 받아요.',true);
   await loadHistory();
  }catch(error){
   if(!same(id))return;
   if(error?.code==='P0001'||/^22\w{3}$/.test(error?.code||'')){
    state.pending=null;persist();message(error.code==='P0001'?error.message:'날짜와 별점을 다시 확인해 주세요.');
   }else message('연결이 잠깐 끊겼어요. ‘제출 결과 확인하기’를 눌러 주세요. 쓴 글은 그대로 보관하고 있어요.');
  }finally{busy=false;if(same(id))syncBusy()}
 }
 window.addEventListener('pagehide',capture);
 window.openReadingPortfolio=open;window.openReadingDesk=openDesk;window.closeReadingPortfolio=close;window.saveReadingEntry=save;
 return {open,close};
}
