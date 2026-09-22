// One selection scope: a quest and, optionally, one submission period.
export function groupQuestReviews(quests, submissions) {
  const groups = new Map(quests.map(q => [String(q.id), { ...q, rows: [] }]));
  for (const row of submissions) {
    if (row.status !== 'submitted') continue;
    const key = String(row.quest_id);
    if (!groups.has(key)) groups.set(key, { id: row.quest_id, ...row.quests, rows: [] });
    groups.get(key).rows.push(row);
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
    .qr-zoom{width:min(1000px,calc(100% - 24px));padding:14px;border:0;border-radius:16px}.qr-zoom::backdrop{background:#111a}.qr-zoom img{display:block;max-width:100%;max-height:75vh;margin:12px auto 0}
    @media(max-width:480px){.qr-head,.qr-footer{padding:15px}.qr-list{padding:0 15px 15px}.qr-footer .btn{width:100%}.qr-toolbar{align-items:stretch;flex-direction:column}.qr-toolbar select{width:100%}}
  `;
  doc.head.appendChild(style);
  const dialog = doc.createElement('dialog');
  dialog.className = 'qr-dialog';
  dialog.setAttribute('aria-labelledby', 'qrTitle');
  dialog.innerHTML = `<div class="qr-head"><div class="qr-head-top"><div><h2 id="qrTitle"></h2><div class="qr-meta" id="qrSubtitle"></div></div><button class="btn" data-close>닫기</button></div><div class="qr-toolbar"><label class="qr-check-label"><input type="checkbox" data-all> 승인 대기 전체 선택</label><select aria-label="제출 회차" data-period></select></div></div><div class="qr-list"></div><div class="qr-footer"><div class="qr-footer-actions"><b data-selection></b><button class="btn good" data-approve></button></div><p class="qr-message" role="status" aria-live="polite"></p></div>`;
  doc.body.appendChild(dialog);
  const find = selector => dialog.querySelector(selector);
  let groups = [], currentId = null, period = '', selected = new Map(), busy = false, request = 0, message = '', failed = false;
  const current = () => groups.find(g => String(g.id) === currentId);
  const visibleRows = () => (current()?.rows || []).filter(r => !period || String(r.period_key || '') === period).sort((a, b) => Number(a.students?.student_number || 0) - Number(b.students?.student_number || 0));

  function controls() {
    const rows = visibleRows();
    const count = rows.filter(r => selected.has(String(r.id))).length;
    find('[data-all]').checked = rows.length > 0 && count === rows.length;
    find('[data-all]').indeterminate = count > 0 && count < rows.length;
    find('[data-all]').disabled = busy || !rows.length;
    find('[data-period]').disabled = busy;
    find('[data-close]').disabled = busy;
    find('[data-selection]').textContent = `${rows.length}건 중 ${count}건 선택`;
    find('[data-approve]').textContent = busy ? '처리 중…' : `${current()?.title || '퀘스트'} · 선택한 ${count}건 승인`;
    find('[data-approve]').disabled = busy || count === 0;
    find('.qr-message').textContent = message;
    find('.qr-message').classList.toggle('qr-error', failed);
    dialog.querySelectorAll('[data-row], [data-single], [data-reject]').forEach(el => { el.disabled = busy; });
  }

  function renderDialog() {
    if (!dialog.open) return;
    const group = current();
    const periods = [...new Set((group?.rows || []).map(r => String(r.period_key || '')).filter(Boolean))].sort().reverse();
    find('#qrTitle').textContent = group?.title || '퀘스트';
    find('#qrSubtitle').textContent = `${typeNames[group?.quest_type] || '퀘스트'} · 수행 기록을 확인한 뒤 승인해 주세요.`;
    find('[data-period]').innerHTML = `<option value="">모든 제출 회차</option>${[...new Set([...periods, ...(period ? [period] : [])])].map(p => `<option value="${escape(p)}">${escape(p)}</option>`).join('')}`;
    find('[data-period]').value = period;
    find('[data-period]').hidden = group?.quest_type === 'main' || (!periods.length && !period);
    const rows = visibleRows();
    find('.qr-list').innerHTML = rows.length ? rows.map(row => {
      const id = escape(row.id), student = `${row.students?.student_number ?? '?'}번 · ${row.students?.nickname || '닉네임 미설정'}`, photo = imageUrl(row.evidence_image);
      return `<article class="qr-record"><label class="qr-check-label"><input type="checkbox" data-row="${id}" ${selected.has(String(row.id)) ? 'checked' : ''}><span>${escape(student)}</span></label><div class="qr-meta" style="margin-top:7px">${escape(dateLabel(row.submitted_at))}${row.period_key ? ` · 회차 ${escape(row.period_key)}` : ''}</div><p class="qr-report">${escape(row.report_text || '작성된 수행 기록이 없어요.')}</p>${photo ? `<button class="qr-photo" data-photo="${id}" aria-label="${escape(student)} 수행 사진 확대"><img src="${escape(photo)}" alt="학생 수행 사진" loading="lazy"></button>` : ''}<div class="qr-record-actions"><button class="btn" data-reject="${id}">보완 요청</button><button class="btn good" data-single="${id}">개별 승인</button></div></article>`;
    }).join('') : '<div class="qr-empty">이 퀘스트에 확인할 승인 대기 기록이 없어요.</div>';
    controls();
  }

  function renderBanners() {
    root.innerHTML = groups.length ? groups.map(g => `<button class="qr-banner${g.rows.length ? ' qr-pending' : ''}" data-quest="${escape(g.id)}" aria-haspopup="dialog"><span class="qr-icon" aria-hidden="true">${icons[g.quest_type] || '📋'}</span><span class="qr-banner-main"><b>${escape(g.title || '이름 없는 퀘스트')}</b><span class="qr-meta">${typeNames[g.quest_type] || '퀘스트'}${g.active === false ? ' · 종료된 퀘스트' : ''}</span><br><span class="qr-count">${g.rows.length ? `● 승인 대기 ${g.rows.length}건` : '승인 대기 없음'}</span></span><span aria-hidden="true">›</span></button>`).join('') : '<p class="qr-empty">진행 중인 퀘스트와 승인 대기 요청이 없어요.</p>';
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
      const [quests, rows] = await Promise.all([
        pages(() => db.from('quests').select('id,title,quest_type,active').eq('active', true).order('id')),
        pages(() => db.from('quest_submissions').select('id,quest_id,status,period_key,submitted_at,report_text,evidence_image,students(student_number,nickname),quests(title,quest_type,active)').eq('status', 'submitted').order('id'))
      ]);
      if (generation !== request) return;
      groups = groupQuestReviews(quests, rows);
      // Keep an open quest visible even after its last pending record is processed.
      if (currentId && !current()) groups.push({ id: currentId, title: find('#qrTitle').textContent, rows: [] });
      const versions = new Map(visibleRows().map(r => [String(r.id), rowVersion(r)]));
      for (const [id, version] of selected) if (versions.get(id) !== version) selected.delete(id);
      onCount(rows.length);
      renderBanners();
      renderDialog();
    } catch (error) {
      if (generation !== request) return;
      selected.clear();
      // A stale list must never remain actionable after a failed refresh.
      groups = [];
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
    currentId = button.dataset.quest; period = ''; selected.clear(); message = ''; failed = false;
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
    if (button.matches('[data-close]')) dialog.close();
    if (button.matches('[data-approve]')) review([...selected.keys()], true);
    if (button.matches('[data-single]')) review([button.dataset.single], true);
    if (button.matches('[data-reject]')) review([button.dataset.reject], false);
    if (button.matches('[data-photo]')) {
      const row = visibleRows().find(r => String(r.id) === button.dataset.photo);
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
