export const submissionLabels = { photo: '사진만', text: '글만', both: '글과 사진 둘 다' };
export function submissionRules(quest) {
  const mode = quest.submission_mode;
  return {
    text: mode !== 'photo', photo: mode !== 'text',
    requireText: mode === 'text' || mode === 'both' || (!mode && quest.quest_type === 'main'),
    requirePhoto: mode === 'photo' || mode === 'both',
    label: submissionLabels[mode] || '기존 제출방식'
  };
}
export function validateSubmission(quest, text, photos) {
  const rules = submissionRules(quest);
  if (rules.requireText && !text.trim()) return '수행한 내용을 한 줄 이상 적어 주세요.';
  if (rules.requirePhoto && !photos.length) return '사진을 1장 이상 첨부해 주세요.';
  return '';
}

export async function editQuestDetails({id, db, doc, refresh}) {
  const {data:quest,error} = await db.from('quests').select('title,description,submission_mode').eq('id',id).single();
  if (error) { doc.defaultView.alert(error.message); return; }
  doc.getElementById('editQuestDetails')?.remove();
  const dialog = doc.createElement('dialog');
  dialog.id = 'editQuestDetails';
  dialog.setAttribute('aria-labelledby','editQuestHeading');
  dialog.style.cssText = 'width:min(520px,calc(100% - 28px));max-height:85vh;overflow:auto;box-sizing:border-box;padding:24px;border:1px solid #ddd5eb;border-radius:20px;color:#3b2b24';
  dialog.innerHTML = `<h2 id="editQuestHeading">퀘스트 수정</h2>
    <div class="field"><label for="editQuestTitle">퀘스트 이름</label><input id="editQuestTitle"></div>
    <div class="field"><label for="editQuestDescription">설명</label><textarea id="editQuestDescription"></textarea></div>
    <div class="field"><label for="editQuestSubmissionMode">학생 제출방식</label><select id="editQuestSubmissionMode">
      ${quest.submission_mode ? '' : '<option value="">기존 제출방식 유지</option>'}
      <option value="photo">사진만 (사진 1장 이상 필수)</option><option value="text">글만 (글 필수)</option><option value="both">글과 사진 둘 다 (모두 필수)</option>
    </select></div><p class="muted">변경 후 학생이 제출하거나 수정할 때 적용돼요. 이미 제출된 기록은 그대로 보관돼요.</p>
    <p id="editQuestMessage" role="status"></p><div class="row"><button type="button" class="btn" data-cancel>취소</button><button type="button" class="btn primary" data-save>저장하기</button></div>`;
  const find = selector => dialog.querySelector(selector);
  find('#editQuestTitle').value = quest.title;
  find('#editQuestDescription').value = quest.description || '';
  find('#editQuestSubmissionMode').value = quest.submission_mode || '';
  let saving = false;
  find('[data-cancel]').onclick = () => dialog.close();
  dialog.addEventListener('cancel', event => { if (saving) event.preventDefault(); });
  dialog.onclose = () => dialog.remove();
  find('[data-save]').onclick = async () => {
    if (saving) return;
    const title = find('#editQuestTitle').value.trim();
    if (!title) { find('#editQuestMessage').textContent = '퀘스트 이름을 입력해 주세요.'; return; }
    saving = true;
    dialog.querySelectorAll('button,input,textarea,select').forEach(el => el.disabled = true);
    try {
      const {error} = await db.from('quests').update({title,description:find('#editQuestDescription').value.trim(),submission_mode:find('#editQuestSubmissionMode').value || null}).eq('id',id);
      if (error) throw error;
      await refresh();
      dialog.close();
    } catch (error) { find('#editQuestMessage').textContent = error.message || '저장하지 못했어요. 다시 시도해 주세요.'; }
    finally { saving = false; dialog.querySelectorAll('button,input,textarea,select').forEach(el => el.disabled = false); }
  };
  doc.body.appendChild(dialog);dialog.showModal();find('#editQuestTitle').focus();
}
