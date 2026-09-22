// One selection scope: a quest and, optionally, one submission period.
export function groupQuestReviews(quests, submissions) {
  const groups = new Map(quests.map(q => [String(q.id), { ...q, rows: [], records: [] }]));
  for (const row of submissions) {
    const key = String(row.quest_id);
    if (!groups.has(key)) groups.set(key, { id: row.quest_id, ...row.quests, rows: [], records: [] });
    groups.get(key).records.push(row);
    if(row.status === 'submitted') groups.get(key).rows.push(row);
  }
  return [...groups.values()].sort((a, b) => b.rows.length - a.rows.length || String(a.title).localeCompare(String(b.title), 'ko'));
}

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const typeNames = { daily: '일일', weekly: '주간', main: '메인' };
const icons = { daily: '☀️', weekly: '📅', main: '🏆' };
const rowVersion = r => JSON.stringify([r.status, r.submitted_at, r.report_text, r.evidence_image, r.period_key]);
const dateLabel = value => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '제출 날짜 없음';
function imageUrl(value) {
  if (!value) return '';
  try { return /^https?:$/.test(new URL(value).protocol) || /^data:image\/(png|jpeg|webp|gif);base64,/i.test(value) ? value : ''; } catch { return ''; }
}

export function currentQuestPeriod(type, now = new Date()) {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const get=k=>parts.find(p=>p.type===k).value;
  const day=new Date(`${get('year')}-${get('month')}-${get('day')}T00:00:00Z`);
  if(type==='weekly')day.setUTCDate(day.getUTCDate()-((day.getUTCDay()+6)%7));
  return type==='main'?'once':day.toISOString().slice(0,10);
}
export function questRoster(group, students, period) {
  const records=(group?.records||[]).filter(r=>String(r.period_key||'once')===period);
  return students.map(student=>{
    const row=records.filter(r=>String(r.student_id)===String(student.id)).sort((a,b)=>Number(b.id)-Number(a.id))[0];
    const assigned=!group?.target_student_ids||group.target_student_ids.map(String).includes(String(student.id));
    return {student,row,status:row?.status||(assigned?'available':'excluded')};
  }).sort((a,b)=>Number(a.student.student_number)-Number(b.student.student_number));
}
const statusLabels={submitted:'🔔 완료 요청',approved:'✓ 완료',accepted:'✏️ 진행 중',in_progress:'✏️ 진행 중',rejected:'↩ 보완 요청',available:'○ 아직 시작 전',excluded:'대상 아님'};
const speech={submitted:'다 했어요! 확인해 주세요 💌',approved:'참 잘했어요! 뿌듯해요 ✨',in_progress:'열심히 도전 중이에요! 💪',accepted:'열심히 도전 중이에요! 💪',rejected:'조금 더 다듬어 볼게요 🌱',available:'이제 도전해 볼까요? 🚀',excluded:'이번엔 응원할게요! 🎈'};
function studentAvatar(student,appearances){
 if(!student.gender)return '<div class="qr-avatar-placeholder" aria-label="캐릭터 설정 전">🥚</div>';
 const gender=student.gender==='girl'?'girl':'boy';
 const items=appearances.filter(i=>String(i.student_id)===String(student.id));
 const hanbok=items.some(i=>i.slot==='hair'&&i.item_id==='hanbok-hair-'+gender);
 const front=hanbok?`2.hair/hair_${gender}_hanbok_front.png`:gender==='girl'?'2.hair/hair_girl_default_front.png':'2.hair/hair_boy_default.png';
 const back=hanbok?`2.hair/hair_${gender}_hanbok_back.png`:gender==='girl'?'2.hair/hair_girl_default_back.png':'';
 const aliases={'item-boy-top-basic.png':'3.top/top_boy_basic.png','item-girl-top-basic.png':'3.top/top_girl_basic.png','item-boy-bottom-basic.png':'4.bottom/bottom_boy_basic.png','item-girl-bottom-basic.png':'4.bottom/bottom_girl_basic.png','item-boy-shoes-basic.png':'7.shoes/shoes_boy_basic.png','item-girl-shoes-basic.png':'7.shoes/shoes_girl_basic.png'};
 const long=items.some(i=>i.slot==='bottom'&&i.image?.includes('_hanbok.png'));
 const z={bottom:long?4:3,shoes:long?3:4,top:5,accessory:7,weapon:8};
 const img=(src,layer)=>src?`<img src="${escape(aliases[src]||src)}" alt="" style="z-index:${layer}" loading="lazy">`:'';
 return `<div class="qr-avatar" role="img" aria-label="${escape(student.nickname||'학생')}의 아바타">${img(back,0)}${img('1. character/character_'+gender+'.png',1)}${items.filter(i=>i.slot!=='hair').map(i=>img(i.image,z[i.slot]||6)).join('')}${img(front,6)}</div>`;
}
export function createQuestReviews({ root, db, refresh, onCount }) {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  root.dataset.questReviews = 'true';
  root.classList.remove('muted');
  const style = doc.createElement('style');
  style.textContent = `
    .qr-banner{width:100%;display:flex;align-items:center;gap:12px;padding:16px;margin:10px 0;border:1px solid #dfdcf5;border-radius:15px;background:#faf9ff;text-align:left;color:#252736;font:inherit;cursor:pointer}
    .qr-banner{background:#f8fafc;border-color:#e2e8f0}.qr-banner:hover{background:#f1f5f9;border-color:#cbd5e1}
    .qr-banner .qr-count{background:#e9edf2;color:#596579}
    .qr-banner.qr-pending{background:#fff7e8;border-color:#efb455;box-shadow:inset 5px 0 0 #e68a12}
    .qr-banner.qr-pending:hover{background:#ffefd2;border-color:#d9860d}
    .qr-banner.qr-pending .qr-count{background:#a94708;color:#fff;padding:5px 11px}
    .qr-banner.qr-pending b{color:#713b12}.qr-banner:focus-visible,.qr-dialog button:focus-visible{outline:3px solid #6c63ff;outline-offset:3px}
    .qr-icon{font-size:27px}.qr-banner-main{flex:1;min-width:0;overflow-wrap:anywhere}.qr-banner b{display:block;font-size:16px}.qr-meta{font-size:14px;color:#62677a;line-height:1.5}.qr-count{display:inline-block;margin-top:5px;border-radius:20px;padding:3px 9px;background:#eae5ff;color:#5142a6;font-size:14px;font-weight:800}
    .qr-dialog{width:min(760px,calc(100% - 24px));max-height:90vh;padding:0;border:0;border-radius:20px;color:#252736;box-shadow:0 24px 70px #11142e40}.qr-dialog::backdrop{background:#14152788}
    .qr-head{padding:20px 22px 14px;border-bottom:1px solid #e7e8ef}.qr-head h2{margin:0 0 5px;font-size:22px;overflow-wrap:anywhere}.qr-head-top{display:flex;justify-content:space-between;gap:12px;align-items:start}
    .qr-toolbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:15px}.qr-toolbar select{width:auto;max-width:100%;flex:1;min-width:160px}.qr-check-label{display:flex;align-items:center;gap:9px;font-size:15px;font-weight:700;cursor:pointer}
    .qr-dialog input[type=checkbox]{width:20px;height:20px;margin:0;accent-color:#6c63ff;flex:none}.qr-list{padding:4px 22px 18px}.qr-record{margin-top:14px;padding:16px;border:1px solid #e7e8ef;border-radius:14px;background:white}.qr-record:has(input:checked){border-color:#a699ee;background:#fcfbff}
    .qr-report{white-space:pre-wrap;overflow-wrap:anywhere;margin:12px 0;font-size:16px;line-height:1.7;color:#252736}.qr-photo{display:block;padding:0;border:0;background:transparent;cursor:zoom-in}.qr-photo img{display:block;max-width:100%;max-height:180px;border-radius:10px}.qr-record-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
    .qr-footer{position:sticky;bottom:0;background:#fff;padding:14px 22px;border-top:1px solid #e7e8ef}.qr-footer-actions{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}.qr-message{margin:8px 0 0;font-size:14px;white-space:pre-wrap}.qr-empty{padding:26px 0;color:#62677a;font-size:15px}.qr-dialog button:disabled{opacity:.5;cursor:not-allowed}.qr-error{color:#a72e44}
    .qr-status{display:inline-block;padding:5px 9px;border-radius:20px;font-size:13px;font-weight:800;margin-top:8px}.qr-state-submitted{background:#fff1f2;border:2px solid #ee8495}.qr-state-submitted .qr-status{background:#b42342;color:white}.qr-state-approved{background:#f1f3f5;border-color:#dce0e5;color:#687181}.qr-state-approved .qr-status{background:#e1e5ea;color:#515966}.qr-state-available{background:#eff6ff;border-color:#a8c9ed}.qr-state-available .qr-status{color:#225fa2}.qr-state-accepted,.qr-state-in_progress{background:#f1f1ff;border-color:#bcb7eb}.qr-state-rejected{background:#fff7e6;border-color:#e6bd73}.qr-state-excluded{background:#f8fafc;color:#76808f}.qr-roster-summary{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.qr-roster-summary span{font-size:13px;background:#f1f3f5;padding:5px 8px;border-radius:12px}.qr-zoom{width:min(1000px,calc(100% - 24px));padding:14px;border:0;border-radius:16px}.qr-zoom::backdrop{background:#111a}.qr-zoom img{display:block;max-width:100%;max-height:75vh;margin:12px auto 0}
    @media(max-width:480px){.qr-head,.qr-footer{padding:15px}.qr-list{padding:0 15px 15px}.qr-footer .btn{width:100%}.qr-toolbar{align-items:stretch;flex-direction:column}.qr-toolbar select{width:100%}}

    .qr-dialog{width:min(860px,calc(100% - 24px));background:#fffdf7;border:3px solid #f2dfba;border-radius:28px}
    .qr-head{background:#fff8e9;border-bottom:2px dashed #ecdfc8}.qr-head h2{color:#705231}.qr-footer{background:#fffaf0;border-top:2px dashed #ecdfc8}
    .qr-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;padding:18px;align-items:start}
    .qr-record{margin:0;border-radius:24px;padding:16px;border-width:2px;box-shadow:0 5px 0 #d7c7a51c;min-width:0;background:#f0f7ff}
    .qr-student-name{font-size:15px;min-height:22px;display:flex;align-items:center;gap:8px;color:#49465a}
    .qr-scene{display:flex;align-items:center;gap:8px;min-height:158px;padding:10px 0 2px}
    .qr-avatar{width:116px;height:146px;position:relative;flex:0 0 116px;isolation:isolate;background:radial-gradient(ellipse at 50% 90%,#a5bed72a 0 30%,transparent 32%)}
    .qr-avatar img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
    .qr-avatar-placeholder{font-size:65px;width:116px;text-align:center}
    .qr-head-top>[data-close]{flex-shrink:0;white-space:nowrap}.qr-bubble{word-break:keep-all;position:relative;background:white;border:2px solid #d7e5fa;border-radius:20px 20px 20px 5px;padding:13px 11px;color:#49678e;font-size:15px;font-weight:800;line-height:1.55;flex:1;overflow-wrap:anywhere}
    .qr-state-submitted{background:#fff0f2;border-color:#f2a1af}.qr-state-submitted .qr-bubble{color:#ab3655;border-color:#f0b5c2}
    .qr-state-approved{background:#f2f3f4;border-color:#d9dddf}.qr-state-approved .qr-bubble{color:#687677;border-color:#d9dfe0}.qr-state-approved .qr-avatar{opacity:.8}
    .qr-state-rejected{background:#fff5df}.qr-state-rejected .qr-bubble{color:#95632b;border-color:#ead4a7}
    .qr-state-in_progress,.qr-state-accepted{background:#f3eeff}.qr-state-in_progress .qr-bubble,.qr-state-accepted .qr-bubble{color:#7253a0;border-color:#d9c8ef}
    .qr-status{font-size:12px}.qr-roster-summary span{background:#fff;border:1px solid #eddec7}.qr-record-actions{flex-wrap:wrap}.qr-record-actions .btn{border-radius:16px;font-size:13px;flex:1}
    .qr-record details{margin-top:10px;background:#ffffffaa;border-radius:14px;padding:10px;font-size:13px}.qr-record summary{cursor:pointer;font-weight:800;color:#6d617d}.qr-record .qr-report{font-size:14px}.qr-empty{grid-column:1/-1}
    @media(max-width:600px){.qr-list{grid-template-columns:1fr;padding:12px}.qr-scene{min-height:145px}.qr-avatar{height:140px}.qr-bubble{max-width:250px}}

    .qr-category{border:2px solid #ede3c9;border-radius:20px;margin-top:14px;overflow:hidden;background:#fffdf8}
    .qr-category>summary{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:15px 12px;background:#fff2c9;cursor:pointer;list-style:none;font-weight:900;color:#755525;flex-wrap:wrap}
    .qr-category>summary::-webkit-details-marker{display:none}.qr-category>summary:after{content:'＋';font-size:18px}.qr-category[open]>summary:after{content:'−'}
    .qr-category>summary:focus-visible{outline:3px solid #6c63ff;outline-offset:-3px}.qr-category small{font-size:12px;font-weight:700;opacity:.75}
    .qr-category-weekly{border-color:#d5e7f7}.qr-category-weekly>summary{background:#e6f3ff;color:#386186}
    .qr-category-main{border-color:#e5dbf5}.qr-category-main>summary{background:#f0eaff;color:#715196}
    .qr-category-count{font-size:12px;border-radius:18px;padding:5px 8px;background:#ffffffa8;white-space:nowrap;margin-left:auto}.qr-category-count.has-requests{background:#b73e5b;color:white}
    .qr-category-list{padding:0 10px}.qr-category-empty{padding:8px 0;font-size:13px;color:#85818c;text-align:center}

    .qr-list{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:14px}
    .qr-record{position:relative;padding:8px;border-radius:18px}.qr-record:has(.qr-student-detail[open]){grid-column:1/-1}
    .qr-record .qr-student-detail{margin:0;padding:0;background:transparent;border-radius:0}
    .qr-record .qr-mini-card{display:flex;align-items:center;gap:8px;min-height:90px;list-style:none;padding:3px 0;cursor:pointer}
    .qr-mini-card::-webkit-details-marker{display:none}.qr-mini-card:focus-visible{outline:3px solid #6c63ff;border-radius:12px}
    .qr-record .qr-avatar{width:62px;height:80px;flex:0 0 62px}.qr-record .qr-avatar-placeholder{width:62px;font-size:40px}
    .qr-mini-text{min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:3px}.qr-mini-text strong{font-size:13px;overflow-wrap:anywhere;padding-right:19px;color:#49465a}.qr-mini-text .qr-status{font-size:11px;padding:3px 5px;margin:0}.qr-mini-text small{font-size:11px;color:#77798c;font-weight:500}
    .qr-card-check{position:absolute;right:9px;top:10px;z-index:2}
    .qr-student-content{border-top:1px dashed #d4cdda;padding:12px 5px 3px}.qr-student-content .qr-bubble{padding:8px 12px;font-size:14px;margin-bottom:8px}.qr-student-content .qr-record-actions{justify-content:flex-end}.qr-student-content .qr-record-actions .btn{flex:0 1 auto}
    @media(max-width:720px){.qr-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:430px){.qr-list{grid-template-columns:1fr;padding:10px}.qr-record .qr-mini-card{min-height:76px}.qr-record .qr-avatar{height:70px;width:56px;flex-basis:56px}}

    .qr-dialog{width:min(1100px,calc(100% - 24px));max-height:94vh}
    .qr-list{grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;align-items:start}
    .qr-record .qr-mini-card{width:100%;border:0;background:transparent;text-align:left;font:inherit;color:inherit;min-height:84px;padding:0;cursor:pointer}
    .qr-record .qr-avatar{width:56px;flex-basis:56px;height:75px}.qr-mini-text strong{font-size:13px;line-height:1.4}.qr-mini-text .qr-status{font-size:11px;white-space:normal}
    .qr-filter{font-size:13px;padding:7px 10px!important;border:1px solid #e4d8c1!important;background:#fff!important}.qr-filter[aria-pressed=true]{background:#74548f!important;color:white!important;border-color:#74548f!important}
    .qr-detail-dialog{width:min(520px,calc(100% - 24px));max-height:85vh;border:2px solid #e8d6b2;border-radius:24px;background:#fffdf7;padding:20px;color:#49465a;box-sizing:border-box;overflow:auto}.qr-detail-dialog::backdrop{background:#29213588}
    .qr-detail-head{display:flex;justify-content:space-between;align-items:center;gap:10px}.qr-detail-head h3{margin:0;overflow-wrap:anywhere}.qr-detail-head button{flex-shrink:0}.qr-detail-identity{display:flex;align-items:center;gap:15px}.qr-detail-identity .qr-avatar{width:90px;height:115px;flex-basis:90px}.qr-detail-message{white-space:pre-wrap;font-size:13px}
    @media(max-width:1050px){.qr-list{grid-template-columns:repeat(4,minmax(0,1fr))}}
    @media(max-width:820px){.qr-list{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(max-width:600px){.qr-list{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:10px}.qr-record{padding:6px}.qr-record .qr-mini-card{min-height:90px;gap:4px}.qr-record .qr-avatar{width:42px;flex-basis:42px;height:64px}.qr-mini-text strong{font-size:12px}.qr-mini-text small{font-size:10px}.qr-card-check{right:5px;top:5px}.qr-head{padding:12px}.qr-head h2{font-size:19px}}
  `;
  doc.head.appendChild(style);
  const dialog = doc.createElement('dialog');
  dialog.className = 'qr-dialog';
  dialog.setAttribute('aria-labelledby', 'qrTitle');
  dialog.innerHTML = `<div class="qr-head"><div class="qr-head-top"><div><h2 id="qrTitle"></h2><div class="qr-meta" id="qrSubtitle"></div></div><button class="btn" data-close>닫기</button></div><div class="qr-roster-summary" data-summary></div><div class="qr-toolbar"><label class="qr-check-label"><input type="checkbox" data-all> 승인 대기 전체 선택</label><select aria-label="제출 회차" data-period></select></div></div><div class="qr-list"></div><div class="qr-footer"><div class="qr-footer-actions"><b data-selection></b><button class="btn good" data-approve></button></div><p class="qr-message" role="status" aria-live="polite"></p></div>`;
  doc.body.appendChild(dialog);
  const find = selector => dialog.querySelector(selector);
  let statusFilter='all', detailStudent=null;
  const detail=doc.createElement('dialog');detail.className='qr-detail-dialog';detail.setAttribute('aria-label','학생 활동 내역');dialog.appendChild(detail);
  detail.addEventListener('cancel',e=>{if(busy)e.preventDefault()});
  detail.addEventListener('close',()=>{const id=detailStudent;detailStudent=null;dialog.querySelector(`[data-open-student="${id}"]`)?.focus()});
  let appearances = [], students = [], groups = [], currentId = null, period = '', selected = new Map(), busy = false, request = 0, message = '', failed = false;
  const current = () => groups.find(g => String(g.id) === currentId);
  const visibleRows = () => (current()?.rows || []).filter(r => (statusFilter==='all'||statusFilter==='submitted'||statusFilter==='incomplete')&&(!period || String(r.period_key || '') === period)).sort((a, b) => Number(a.students?.student_number || 0) - Number(b.students?.student_number || 0));

  function controls() {
    const rows = visibleRows();
    const count = rows.filter(r => selected.has(String(r.id))).length;
    find('[data-all]').checked = rows.length > 0 && count === rows.length;
    find('[data-all]').indeterminate = count > 0 && count < rows.length;
    find('[data-all]').disabled = busy || !rows.length;
    find('[data-period]').disabled = busy;
    find('[data-close]').disabled = busy;
    dialog.querySelectorAll('[data-filter],[data-open-student],[data-detail-close]').forEach(el=>el.disabled=busy);
    find('[data-selection]').textContent = `${rows.length}건 중 ${count}건 선택`;
    find('[data-approve]').textContent = busy ? '처리 중…' : `${current()?.title || '퀘스트'} · 선택한 ${count}건 승인`;
    find('[data-approve]').disabled = busy || count === 0;
    find('.qr-message').textContent = message;
    if(detail.open)detail.querySelector('.qr-detail-message').textContent=message;
    find('.qr-message').classList.toggle('qr-error', failed);
    dialog.querySelectorAll('[data-row], [data-single], [data-reject]').forEach(el => { el.disabled = busy; });
  }

  function renderDialog() {
    if (!dialog.open) return;
    const group = current();
    const periods = [...new Set([currentQuestPeriod(group?.quest_type),...(group?.records || []).map(r => String(r.period_key || '')).filter(Boolean)])].sort().reverse();
    find('#qrTitle').textContent = group?.title || '퀘스트';
    find('#qrSubtitle').textContent = `${typeNames[group?.quest_type] || '퀘스트'} · 전체 학생의 진행 상태를 확인해요. 회차를 바꾸면 이전 기록도 볼 수 있어요.`;
    find('[data-period]').innerHTML = ` ${periods.map(p => `<option value="${escape(p)}">${escape(p)}${p===currentQuestPeriod(group?.quest_type)?' (현재)':''} · 요청 ${(group?.rows||[]).filter(r=>r.period_key===p).length}건</option>`).join('')}`;
    find('[data-period]').value = period;
    find('[data-period]').hidden = group?.quest_type === 'main' || (!periods.length && !period);
    const roster=questRoster(group,students,period);
    const count=status=>roster.filter(r=>r.status===status).length;
    const filters=[['all',`전체 ${roster.length}명`],['submitted',`🔔 요청 ${count('submitted')}명`],['approved',`✓ 완료 ${count('approved')}명`],['incomplete',`미완료 ${roster.filter(r=>!['approved','excluded'].includes(r.status)).length}명`]];
    find('[data-summary]').innerHTML=filters.map(([key,label])=>`<button class="btn qr-filter" data-filter="${key}" aria-pressed="${statusFilter===key}">${label}</button>`).join('');
    const shown=roster.filter(r=>statusFilter==='all'||r.status===statusFilter||(statusFilter==='incomplete'&&!['approved','excluded'].includes(r.status)));
    find('.qr-list').innerHTML=shown.length?shown.map(({student,row,status})=>{
      const id=escape(row?.id),name=`${student.student_number}번 · ${student.nickname||'닉네임 미설정'}`,pending=status==='submitted';
      return `<article class="qr-record qr-state-${escape(status)}" data-student="${escape(student.id)}">
      ${pending?`<input class="qr-card-check" type="checkbox" aria-label="${escape(name)} 승인 선택" data-row="${id}" ${selected.has(String(row.id))?'checked':''}>`:''}
      <button type="button" class="qr-mini-card" data-open-student="${escape(student.id)}" aria-haspopup="dialog">${studentAvatar(student,appearances)}<span class="qr-mini-text"><strong>${escape(name)}</strong><span class="qr-status">${statusLabels[status]||'진행 중'}</span><small>활동 내역 보기 ›</small></span></button></article>`;
    }).join(''):'<div class="qr-empty">해당하는 학생이 없어요.</div>';
    if(detail.open)renderDetail();
    controls();
  }

  function renderDetail(){
    const entry=questRoster(current(),students,period).find(r=>String(r.student.id)===String(detailStudent));
    if(!entry){detail.close();return}
    const {student,row,status}=entry,id=escape(row?.id),name=`${student.student_number}번 · ${student.nickname||'닉네임 미설정'}`,photo=imageUrl(row?.evidence_image),pending=status==='submitted';
    detail.innerHTML=`<div class="qr-detail-head"><h3>${escape(name)}</h3><button class="btn" data-detail-close>닫기</button></div><div class="qr-detail-identity">${studentAvatar(student,appearances)}<span class="qr-status">${statusLabels[status]||'진행 중'}</span></div><div class="qr-student-content"><div class="qr-bubble">${speech[status]||speech.in_progress}</div>
      ${row?.submitted_at?`<div class="qr-meta">제출 · ${escape(dateLabel(row.submitted_at))}</div>`:''}
      <p class="qr-report">${escape(row?.report_text||(row?'작성된 수행 내용이 없어요.':'아직 수행 기록이 없어요.'))}</p>
      ${status==='rejected'&&row?.rejection_reason?`<p class="qr-report">보완 요청: ${escape(row.rejection_reason)}</p>`:''}
      ${photo?`<button class="qr-photo" data-photo="${id}" aria-label="${escape(name)} 수행 사진 확대"><img src="${escape(photo)}" alt="학생 수행 사진" loading="lazy"></button>`:''}
      ${pending?`<div class="qr-record-actions"><button class="btn" data-reject="${id}">보완 요청</button><button class="btn good" data-single="${id}">개별 승인</button></div>`:''}
      </div><p class="qr-detail-message" role="status"></p>`;
  }

  function renderBanners() {
    const collapsed=new Set([...root.querySelectorAll('.qr-category:not([open])')].map(el=>el.dataset.category));
    root.innerHTML=['daily','weekly','main'].map(type=>{
      const quests=groups.filter(g=>(g.quest_type||'main')===type);
      const pending=quests.reduce((sum,g)=>sum+g.rows.length,0);
      return `<details class="qr-category qr-category-${type}" data-category="${type}" ${collapsed.has(type)?'':'open'}><summary><span>${icons[type]} ${typeNames[type]} 퀘스트 <small>${quests.length}개</small></span><span class="qr-category-count ${pending?'has-requests':''}">${pending?`🔔 요청 ${pending}건!`:'요청 없음'}</span></summary><div class="qr-category-list">${quests.length?quests.map(g=>`<button class="qr-banner${g.rows.length ? ' qr-pending' : ''}" data-quest="${escape(g.id)}" aria-haspopup="dialog"><span class="qr-icon" aria-hidden="true">${icons[g.quest_type] || '📋'}</span><span class="qr-banner-main"><b>${escape(g.title || '이름 없는 퀘스트')}</b><span class="qr-meta">${typeNames[g.quest_type] || '퀘스트'}${g.active === false ? ' · 종료된 퀘스트' : ''}</span><br><span class="qr-count">${g.rows.length ? `🔔 요청 ${g.rows.length}건!` : '승인 대기 없음'}</span></span><span aria-hidden="true">›</span></button>`).join(''):'<p class="qr-category-empty">아직 등록된 퀘스트가 없어요 🌱</p>'}</div></details>`;
    }).join('');
  }

  async function pages(makeQuery) {
    const rows = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await makeQuery().range(offset, offset + 499);
      if (error) throw error;
      rows.push(...(data || []));
      if (!data || data.length < 500) return rows;
    }
  }

  async function load() {
    const generation = ++request;
    try {
      const [quests, rows, rosterStudents, looks] = await Promise.all([
        pages(() => db.from('quests').select('id,title,quest_type,active,target_student_ids').eq('active', true).order('id')),
        pages(() => db.from('quest_submissions').select('id,student_id,quest_id,status,period_key,submitted_at,report_text,evidence_image,rejection_reason,students(student_number,nickname),quests(title,quest_type,active)').order('id')),
        pages(() => db.from('students').select('id,student_number,nickname,gender').order('id')),
        db.rpc('teacher_student_appearances')
      ]);
      if (generation !== request) return;
      if(looks.error)throw looks.error;
      appearances=looks.data||[];students=rosterStudents;
      groups = groupQuestReviews(quests, rows).filter(g=>g.active!==false||g.rows.length);
      // Keep an open quest visible even after its last pending record is processed.
      if (currentId && !current()) groups.push({ id: currentId, title: find('#qrTitle').textContent, rows: [] });
      const versions = new Map(visibleRows().map(r => [String(r.id), rowVersion(r)]));
      for (const [id, version] of selected) if (versions.get(id) !== version) selected.delete(id);
      onCount(rows.filter(r=>r.status==='submitted').length);
      renderBanners();
      renderDialog();
    } catch (error) {
      if (generation !== request) return;
      selected.clear();
      // A stale list must never remain actionable after a failed refresh.
      groups = []; students = [];
      onCount(null);
      root.innerHTML = '<p class="qr-error" role="alert">승인 목록을 불러오지 못했어요.</p><button class="btn" data-retry>다시 불러오기</button>';
      message = '목록을 다시 불러온 뒤 승인해 주세요.';
      failed = true;
      renderDialog();
      throw error;
    }
  }

  async function review(ids, approve) {
    if (busy) return;
    const candidates = visibleRows().filter(r => ids.includes(String(r.id)));
    if (!candidates.length) return;
    let reason = '';
    if (!approve) {
      reason = win.prompt('학생에게 전달할 보완 요청을 적어 주세요.', '조금 더 확인해서 다시 제출해 주세요.');
      if (reason === null) return;
      if (!reason.trim()) { message = '보완할 내용을 적어 주세요.'; failed = true; controls(); return; }
    } else if (!win.confirm(`${current().title}\n선택한 ${candidates.length}건을 승인하고 보상을 지급할까요?`)) return;
    busy = true; ++request; message = '처리 중이에요…'; failed = false; controls();
    try {
      const { error } = approve
        ? await db.rpc('teacher_bulk_review_submissions', { p_submission_ids: candidates.map(r => r.id), p_approve: true })
        : await db.rpc('review_submission_with_reason', { target_submission: candidates[0].id, approve: false, p_reason: reason.trim() });
      if (error) throw error;
      selected.clear();
      message = approve ? '승인 처리가 완료됐어요.' : '보완 요청을 보냈어요.';
      await refresh();
    } catch (error) {
      selected.clear();
      message = `처리 결과를 확인해 주세요. ${error?.message || '연결에 문제가 생겼어요.'}`;
      failed = true;
      // No automatic retry: refresh the pending rows before allowing another action.
      try { await load(); } catch { /* load renders a safe error state */ }
    } finally { busy = false; controls(); }
  }

  root.addEventListener('click', event => {
    if (event.target.closest('[data-retry]')) { load().catch(() => {}); return; }
    const button = event.target.closest('[data-quest]');
    if (!button || busy) return;
    statusFilter='all';currentId = button.dataset.quest; period = currentQuestPeriod(current()?.quest_type); selected.clear(); message = ''; failed = false;
    dialog.showModal(); renderDialog(); find('[data-close]').focus();
  });
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  dialog.addEventListener('change', event => {
    if (busy) return;
    const target = event.target;
    if (target.matches('[data-period]')) { period = target.value; selected.clear(); message = ''; renderDialog(); }
    if (target.matches('[data-all]')) {
      selected.clear();
      if (target.checked) visibleRows().forEach(r => selected.set(String(r.id), rowVersion(r)));
      dialog.querySelectorAll('[data-row]').forEach(el => { el.checked = selected.has(el.dataset.row); });
      controls();
    }
    if (target.matches('[data-row]')) {
      const row = visibleRows().find(r => String(r.id) === target.dataset.row);
      if (row && target.checked) selected.set(String(row.id), rowVersion(row)); else selected.delete(target.dataset.row);
      controls();
    }
  });
  dialog.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || busy) return;
    if(button.matches('[data-detail-close]')){detail.close();return}
    if(button.matches('[data-open-student]')){detailStudent=button.dataset.openStudent;renderDetail();detail.showModal();detail.querySelector('[data-detail-close]').focus();return}
    if(button.matches('[data-filter]')){statusFilter=button.dataset.filter;selected.clear();message='';renderDialog();return}
    if (button.matches('[data-close]')) dialog.close();
    if (button.matches('[data-approve]')) review([...selected.keys()], true);
    if (button.matches('[data-single]')) review([button.dataset.single], true);
    if (button.matches('[data-reject]')) review([button.dataset.reject], false);
    if (button.matches('[data-photo]')) {
      const row = (current()?.records||[]).find(r => String(r.id) === button.dataset.photo);
      const url = imageUrl(row?.evidence_image);
      if (!url) return;
      const zoom = doc.createElement('dialog'); zoom.className = 'qr-zoom'; zoom.setAttribute('aria-label', '수행 사진 확대');
      zoom.innerHTML = `<button class="btn">사진 닫기</button><img src="${escape(url)}" alt="학생 수행 사진 확대">`;
      zoom.querySelector('button').onclick = () => zoom.close(); zoom.onclose = () => zoom.remove();
      doc.body.appendChild(zoom); zoom.showModal();
    }
  });
  return { load };
}







