const teacherFrame=document.getElementById('core');

function getTeacherCore(){
  try{return teacherFrame.contentWindow}catch{return null}
}

function submissionIdFromButton(btn){
  const text=btn?.getAttribute('onclick')||'';
  const m=text.match(/\((\d+)/);
  return m?Number(m[1]):null;
}

function findReviewCard(btn,root){
  let el=btn;
  while(el&&el!==root){
    if(el.classList?.contains('quest')||el.classList?.contains('reading-review-row'))return el;
    el=el.parentElement;
  }
  return btn?.parentElement||null;
}

function installBulkApproval(d,w){
  const root=d.getElementById('submissions');
  if(!root)return;
  if(!d.getElementById('bulkReviewStyle')){
    const s=d.createElement('style');s.id='bulkReviewStyle';s.textContent=`
      .bulk-review-bar{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin:9px 0 12px;padding:9px;border-radius:12px;background:#f7f6ff;border:1px solid #dedaff}
      .bulk-review-check{width:18px;height:18px;accent-color:#6c63ff;flex:0 0 auto}
      .review-feedback-note{margin-top:7px;padding:7px 9px;border-radius:9px;background:#fff6dd;color:#795a00;font-size:12px;font-weight:800}
    `;d.head.appendChild(s);
  }
  if(!d.getElementById('bulkReviewBar')){
    const bar=d.createElement('div');bar.id='bulkReviewBar';bar.className='bulk-review-bar';bar.innerHTML='<label style="display:flex;align-items:center;gap:6px;font-weight:800"><input id="bulkAll" class="bulk-review-check" type="checkbox"> 전체 선택</label><button id="bulkApprove" class="btn good">선택 일괄 승인</button><span id="bulkMsg" class="muted"></span>';
    root.parentElement?.insertBefore(bar,root);
    bar.querySelector('#bulkAll').onchange=e=>d.querySelectorAll('.submission-review-check').forEach(c=>c.checked=e.target.checked);
    bar.querySelector('#bulkApprove').onclick=async()=>{
      const ids=[...d.querySelectorAll('.submission-review-check:checked')].map(c=>Number(c.dataset.id)).filter(Boolean);
      const msg=bar.querySelector('#bulkMsg');
      if(!ids.length){msg.textContent='승인할 요청을 선택해 주세요.';return}
      if(!confirm(`${ids.length}개의 퀘스트 완료 요청을 모두 승인할까요?`))return;
      const btn=bar.querySelector('#bulkApprove');btn.disabled=true;msg.textContent='승인하는 중...';
      try{
        const{error}=await w.db.rpc('teacher_bulk_review_submissions',{p_submission_ids:ids,p_approve:true});
        if(error)throw error;
        msg.textContent=`${ids.length}개 승인 완료!`;
        setTimeout(()=>w.location.reload(),350);
      }catch(e){msg.textContent=e?.message||'일괄 승인에 실패했어요.';btn.disabled=false}
    };
  }
  const approveButtons=[...root.querySelectorAll('button')].filter(b=>/승인/.test(b.textContent||''));
  approveButtons.forEach(btn=>{
    const id=submissionIdFromButton(btn);if(!id)return;
    const card=findReviewCard(btn,root);if(!card||card.querySelector('.submission-review-check'))return;
    const check=d.createElement('input');check.type='checkbox';check.className='bulk-review-check submission-review-check';check.dataset.id=String(id);check.title='일괄 승인 선택';
    card.insertBefore(check,card.firstChild);
  });
}

function installRejectReason(d,w){
  if(d.__rejectReasonInstalled)return;d.__rejectReasonInstalled=true;
  d.addEventListener('click',async e=>{
    const btn=e.target.closest('button');if(!btn)return;
    const text=(btn.textContent||'').trim();
    if(!/반려/.test(text))return;
    const questRoot=d.getElementById('submissions');
    const readingRoot=d.getElementById('readingReviews');
    const inQuest=questRoot?.contains(btn),inReading=readingRoot?.contains(btn);
    if(!inQuest&&!inReading)return;
    const id=submissionIdFromButton(btn);if(!id)return;
    e.preventDefault();e.stopImmediatePropagation();
    const reason=w.prompt('반려 사유를 적어 주세요.\n학생에게 이 내용이 그대로 보여요.','조금 더 확인해서 다시 제출해 주세요.');
    if(reason===null)return;
    btn.disabled=true;
    try{
      const call=inQuest
        ? w.db.rpc('review_submission_with_reason',{target_submission:id,approve:false,p_reason:reason})
        : w.db.rpc('teacher_review_reading_review_with_reason',{p_review_id:id,p_approve:false,p_reason:reason});
      const{error}=await call;if(error)throw error;
      setTimeout(()=>w.location.reload(),250);
    }catch(err){w.alert(err?.message||'반려 처리에 실패했어요.');btn.disabled=false}
  },true);
}

function enhanceTeacher(){
  const w=getTeacherCore(),d=w?.document;if(!w||!d||!w.db)return;
  installRejectReason(d,w);installBulkApproval(d,w);
  if(!d.__teacherEnhanceObserver){d.__teacherEnhanceObserver=new MutationObserver(()=>installBulkApproval(d,w));d.__teacherEnhanceObserver.observe(d.body,{childList:true,subtree:true})}
}

teacherFrame.addEventListener('load',()=>setTimeout(enhanceTeacher,500));
setInterval(enhanceTeacher,2000);
