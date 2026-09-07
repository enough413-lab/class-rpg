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
      .quest-template-box{margin:12px 0;padding:11px;border:1px solid #dedaff;border-radius:13px;background:#faf9ff}.quest-template-row{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.quest-template-row select{flex:1;min-width:170px}.quest-template-row .btn{white-space:nowrap}
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

function installQuestTemplates(d,w){
  if(d.getElementById('questTemplateBox'))return;
  const title=d.getElementById('questTitle'),desc=d.getElementById('questDesc'),xp=d.getElementById('questXp'),gold=d.getElementById('questGold'),type=d.getElementById('questType');
  if(!title||!desc||!xp||!gold||!type)return;
  const card=title.closest('.card');if(!card)return;
  const box=d.createElement('div');box.id='questTemplateBox';box.className='quest-template-box';
  box.innerHTML='<b>⚡ 퀘스트 템플릿</b><div class="muted" style="margin:3px 0 8px">자주 쓰는 퀘스트를 저장해 두고 한 번에 불러와요.</div><div class="quest-template-row"><select id="questTemplateSelect"><option value="">저장된 템플릿 선택</option></select><button class="btn" id="loadQuestTemplate">불러오기</button><button class="btn good" id="saveQuestTemplate">현재 입력 저장</button><button class="btn danger" id="deleteQuestTemplate">삭제</button></div>';
  const firstField=card.querySelector('.field');card.insertBefore(box,firstField);
  const key='classRpgTeacherQuestTemplates_v1';
  const read=()=>{try{return JSON.parse(w.localStorage.getItem(key)||'[]')}catch{return[]}};
  const write=v=>w.localStorage.setItem(key,JSON.stringify(v));
  const render=()=>{const items=read(),sel=box.querySelector('#questTemplateSelect');const chosen=sel.value;sel.innerHTML='<option value="">저장된 템플릿 선택</option>'+items.map((t,i)=>`<option value="${i}">${String(t.name||t.title||'템플릿')}</option>`).join('');if(chosen&&items[Number(chosen)])sel.value=chosen};
  box.querySelector('#saveQuestTemplate').onclick=()=>{if(!title.value.trim()){w.alert('퀘스트 이름을 먼저 입력해 주세요.');return}const name=w.prompt('이 템플릿 이름을 정해 주세요.',title.value.trim());if(!name)return;const items=read();items.push({name,title:title.value,desc:desc.value,xp:xp.value,gold:gold.value,type:type.value});write(items.slice(-50));render()};
  box.querySelector('#loadQuestTemplate').onclick=()=>{const i=Number(box.querySelector('#questTemplateSelect').value),t=read()[i];if(!t)return;title.value=t.title||'';desc.value=t.desc||'';xp.value=t.xp??10;gold.value=t.gold??10;type.value=t.type||'daily';type.dispatchEvent(new Event('change',{bubbles:true}))};
  box.querySelector('#deleteQuestTemplate').onclick=()=>{const sel=box.querySelector('#questTemplateSelect'),i=Number(sel.value),items=read();if(!sel.value||!items[i])return;items.splice(i,1);write(items);render()};
  render();
}

function enhanceTeacher(){
  const w=getTeacherCore(),d=w?.document;if(!w||!d||!w.db)return;
  installRejectReason(d,w);installBulkApproval(d,w);installQuestTemplates(d,w);
  if(!d.__teacherEnhanceObserver){d.__teacherEnhanceObserver=new MutationObserver(()=>{installBulkApproval(d,w);installQuestTemplates(d,w)});d.__teacherEnhanceObserver.observe(d.body,{childList:true,subtree:true})}
}

teacherFrame.addEventListener('load',()=>setTimeout(enhanceTeacher,500));
setInterval(enhanceTeacher,2000);
