const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function draftDate(value){
 const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(date):'';
}
export function installStudentDraftTools(ctx){
 const doc=document;let owner='',rows=[];
 const dialog=doc.createElement('dialog');dialog.id='studentDraftManager';dialog.setAttribute('aria-labelledby','draftManagerTitle');dialog.style.cssText='width:min(580px,calc(100% - 24px));max-height:85vh;overflow:auto;padding:20px;border:1px solid #dbe5de;border-radius:18px';doc.body.append(dialog);
 const style=doc.createElement('style');style.textContent='#studentDraftManager button{min-height:44px;font:inherit;padding:9px 12px;border:1px solid #dbe5de;border-radius:9px;background:#f5f8f2;color:#215f49;margin-top:6px}#studentDraftManager article{overflow-wrap:anywhere}';doc.head.append(style);
 function collect(){
  const who=String(ctx.getStudent()?.id||'');if(!who)return[];
  let pendingQuest=null;try{pendingQuest=JSON.parse(localStorage.getItem('classRpgQuestRequest:v1:'+location.pathname+':'+who)||'null')}catch{}
  const prefix='classRpgQuestDraft:v1:'+encodeURIComponent(who)+':';
  const reading='classRpgReadingDraft:v1:'+location.pathname+':'+who,found=[];
  for(let n=0;n<localStorage.length;n++){
   const key=localStorage.key(n);if(key===pendingQuest?.draftKey)continue;if(!key?.startsWith(prefix)&&key!==reading)continue;
   let value;try{value=JSON.parse(localStorage.getItem(key))}catch{continue}
   if(key.startsWith(prefix)&&typeof value?.text==='string'&&typeof value?.image==='string')found.push({key,label:'퀘스트 초안 · '+decodeURIComponent(key.slice(prefix.length)),text:value.text,date:value.savedAt});
   if(key===reading&&value?.drafts&&typeof value.drafts==='object')for(const [context,draft]of Object.entries(value.drafts)){
    if(context===value.pending?.context||!draft||typeof draft!=='object')continue;
    const text=[draft.book_title,draft.summary,draft.thoughts,draft.recommendation_reason].filter(v=>typeof v==='string').join('\n\n');if(!text.trim())continue;
    found.push({key,context,label:'책 이야기 · '+(typeof draft.book_title==='string'?draft.book_title:'쓰던 글'),text,date:draft.savedAt});
   }
  }
  return found;
 }
 function render(){
  dialog.innerHTML='<header style="display:flex;justify-content:space-between;gap:10px"><h2 id="draftManagerTitle" style="margin:0">이 기기에 보관한 내 초안</h2><button data-draft-close>닫기</button></header><p>아직 보내지 않은 글만 정리해요. 이미 제출한 기록과 구매 결과는 지우지 않아요.</p><div>'+rows.map((r,n)=>'<article style="border-top:1px solid #dbe5de;padding:12px 0"><strong>'+esc(r.label)+'</strong><p>'+esc(r.text.slice(0,90))+'</p><small>'+esc(draftDate(r.date)||'저장 날짜가 남아 있지 않아요')+'</small><br><button data-draft-copy="'+n+'">글 복사하기</button> <button data-draft-delete="'+n+'">이 초안 지우기</button></article>').join('')+(rows.length?'':'<p>정리할 초안이 없어요.</p>')+'</div><p id="draftManagerStatus" role="status"></p>';
 }
 function open(){owner=String(ctx.getStudent()?.id||'');rows=[];if(!owner)return;try{rows=collect();render();if(!dialog.open)dialog.showModal()}catch{render();doc.getElementById('draftManagerStatus').textContent='이 기기의 저장 공간을 읽지 못했어요. 지금 쓴 글은 따로 복사해 주세요.';if(!dialog.open)dialog.showModal()}}
 async function copy(text,status){try{await navigator.clipboard.writeText(text);status.textContent='글을 복사했어요.'}catch{const field=doc.createElement('textarea');field.value=text;field.setAttribute('aria-label','복사할 글');field.style.cssText='width:100%;min-height:120px';status.after(field);field.focus();field.select();status.textContent='복사 권한이 없어요. 선택된 글을 직접 복사해 주세요.'}}
 dialog.addEventListener('click',async e=>{
  if(e.target.closest('[data-draft-close]')){dialog.close();return}
  if(owner!==String(ctx.getStudent()?.id||'')){dialog.close();return}
  const b=e.target.closest('[data-draft-delete],[data-draft-copy]');if(!b)return;
  const index=Number(b.dataset.draftDelete??b.dataset.draftCopy),row=rows[index];if(!row)return;
  if(b.hasAttribute('data-draft-copy')){await copy(row.text,doc.getElementById('draftManagerStatus'));return}
  if(!confirm('아직 제출하지 않은 이 초안을 지울까요? 이미 제출한 기록은 그대로 남아요.'))return;
  try{
   if(row.context){const value=JSON.parse(localStorage.getItem(row.key)||'null');if(value?.pending?.context===row.context)throw Error('pending');if(value?.drafts){delete value.drafts[row.context];if(value.active===row.context)value.active='new';localStorage.setItem(row.key,JSON.stringify(value))}}
   else {let pendingQuest=null;try{pendingQuest=JSON.parse(localStorage.getItem('classRpgQuestRequest:v1:'+location.pathname+':'+owner)||'null')}catch{}if(row.key===pendingQuest?.draftKey)throw Error('pending');localStorage.removeItem(row.key);ctx.clearQuestDraft?.(row.key)}
   if(row.context)ctx.invalidateReading?.();
   rows=collect();render();doc.getElementById('draftManagerStatus').textContent='선택한 초안만 지웠어요. 글쓰기 창을 다시 열면 정리한 상태가 반영돼요.';
  }catch{doc.getElementById('draftManagerStatus').textContent='아직 지우지 못했어요. 제출 결과 확인 중인 글은 먼저 결과를 확인해 주세요.'}
 });
 function install(){
  for(const id of ['progressQuestModal','readingPortfolioModal']){
   const target=doc.getElementById(id);if(!target||target.dataset.draftTools)continue;target.dataset.draftTools='true';
   const buttons=doc.createElement('div');buttons.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:12px';
   const manage=doc.createElement('button');manage.className='btn';manage.type='button';manage.textContent='보관한 초안 관리';manage.onclick=()=>{if(target.querySelector('form[aria-busy="true"]')||target.querySelector('#progressQuestSubmit:disabled')){status.textContent='지금 보내는 글의 결과를 먼저 확인해 주세요.';return}if(id==='readingPortfolioModal')window.closeReadingPortfolio();else window.closeProgressQuest();if(target.classList.contains('hidden'))open()};
   const copyButton=doc.createElement('button');copyButton.className='btn';copyButton.type='button';copyButton.textContent='지금 쓴 글 복사';
   const status=doc.createElement('p');status.setAttribute('role','status');
   copyButton.onclick=()=>copy(id==='progressQuestModal'?doc.getElementById('progressQuestText').value:[doc.getElementById('readingBookTitle').value,doc.getElementById('readingSummary').value,doc.getElementById('readingThought').value,doc.getElementById('readingRecommendation').value].join('\n\n'),status);
   buttons.append(copyButton,manage);target.querySelector('section').append(buttons,status);
  }
 }
 new MutationObserver(install).observe(doc.body,{childList:true,subtree:true});install();return{open};
}
