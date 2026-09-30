const SLOTS = {all:'모두',hair:'머리',top:'상의',bottom:'하의',shoes:'신발',hat:'모자',accessory:'장신구',equipment:'장비'};
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function installStudentWardrobe(ctx) {
  const modal = document.getElementById('inventoryModal');
  if (!modal) return;
  const panel = modal.querySelector('section');
  panel.classList.add('wardrobe');
  panel.innerHTML = `<header class="inventory-top"><div><span class="wardrobe-kicker">나만의 작은 꾸밈방</span><h2 id="inventoryTitle">내 옷장</h2><p>먼저 입어보고, 마음에 들면 바꿔요.</p></div><button class="btn" onclick="closeInventory()" aria-label="옷장 닫기">닫기</button></header>
    <div class="wardrobe-layout"><section class="wardrobe-mirror" aria-label="옷차림 미리 보기"><span id="wardrobeMode" class="wardrobe-mode">지금 입은 모습</span><div id="wardrobeAvatar" class="wardrobe-avatar" role="img" aria-label="내 캐릭터"></div><div class="wardrobe-plinth"></div><strong id="wardrobeName"></strong><span class="wardrobe-mirror-note">학교에서 만나는 나의 모습</span></section>
    <section class="wardrobe-rack" aria-label="내가 가진 아이템"><nav id="wardrobeFilters" aria-label="아이템 종류"></nav><div id="inventoryGrid" class="wardrobe-grid"></div></section></div>
    <footer class="wardrobe-footer"><div class="wardrobe-choice"><strong id="wardrobeChoice">어떤 옷이 마음에 드나요?</strong><span id="wardrobeHint">가진 아이템을 눌러 먼저 입어봐요.</span></div><div class="wardrobe-actions"><button type="button" class="btn" id="wardrobeReset">지금 옷으로 보기</button><button type="button" class="btn primary" id="wardrobeApply" disabled>아이템을 골라요</button></div><div id="inventoryMsg" role="status" aria-live="polite"></div><button type="button" class="btn" id="wardrobeCheck" hidden>옷차림 다시 확인</button></footer>`;
  const el = id => document.getElementById(id);
  let owner = '', items = [], selected = null, category = 'all', busy = false, known = false, epoch = 0;
  const item = () => items.find(i => String(i.item_id) === selected);
  const status = (message, warning = false) => { el('inventoryMsg').textContent = message; el('inventoryMsg').classList.toggle('wardrobe-warning', warning); };
  const valid = (key, n) => owner === key && ctx.owner() === key && epoch === n;
  function preview() {
    const chosen = item(), outfit = items.map(i => ({...i}));
    if (chosen && !chosen.equipped) outfit.forEach(i => { if (i.slot === chosen.slot) i.equipped = String(i.item_id) === selected; });
    const hairItem = outfit.find(i => i.slot === 'hair' && i.equipped), girl = ctx.getStudent()?.gender === 'girl';
    const hair = ctx.hairStyles[hairItem?.item_id] || (girl ? {back:'2.hair/hair_girl_default_back.png',front:'2.hair/hair_girl_default_front.png'} : {front:'2.hair/hair_boy_default.png'});
    const layers = [hair.back, girl ? '1. character/character_girl.png' : '1. character/character_boy.png', ...['bottom','shoes','top','equipment'].map(slot => outfit.find(i => i.slot === slot && i.equipped)?.image), hair.front, ...['hat','accessory'].map(slot => outfit.find(i => i.slot === slot && i.equipped)?.image)];
    el('wardrobeAvatar').innerHTML = layers.filter(Boolean).map(src => `<img src="${esc(ctx.assetUrl(src))}" alt="">`).join('');
    el('wardrobeName').textContent = ctx.getStudent()?.nickname || '나의 캐릭터';
    el('wardrobeMode').textContent = chosen && !chosen.equipped ? '미리 입어본 모습' : '지금 입은 모습';
    el('wardrobeChoice').textContent = chosen?.name || '어떤 옷이 마음에 드나요?';
    el('wardrobeHint').textContent = chosen ? (chosen.equipped ? (chosen.slot === 'hair' ? '지금 한 머리예요. 벗으면 기본 머리로 돌아가요.' : '지금 입고 있어요. 벗으려면 아래 버튼을 눌러요.') : '아직 바뀌지 않았어요. 아래 버튼을 누르면 입어요.') : '가진 아이템을 눌러 먼저 입어봐요.';
    el('wardrobeApply').textContent = busy ? '옷차림 확인 중…' : chosen ? (chosen.equipped ? '이 아이템 벗기' : '이 모습으로 입기') : '아이템을 골라요';
    el('wardrobeApply').disabled = busy || !known || !chosen;
    el('wardrobeReset').disabled = busy || !chosen;
    el('wardrobeCheck').hidden = known || busy;
    el('wardrobeCheck').disabled = busy;
    modal.setAttribute('aria-busy', String(busy));
    for (const card of el('inventoryGrid').querySelectorAll('[data-item]')) card.setAttribute('aria-pressed', String(card.dataset.item === selected));
  }
  function render() {
    const focused = document.activeElement?.dataset.item;
    if (selected && !item()) selected = null;
    el('wardrobeFilters').innerHTML = Object.entries(SLOTS).map(([slot, name]) => `<button type="button" data-slot="${slot}" aria-pressed="${category === slot}">${name}<span>${items.filter(i => slot === 'all' || i.slot === slot).length}</span></button>`).join('');
    const shown = items.filter(i => category === 'all' || i.slot === category);
    el('inventoryGrid').innerHTML = shown.length ? shown.map(i => `<button type="button" class="wardrobe-item" data-item="${esc(i.item_id)}" data-kind="${esc(i.slot)}" aria-pressed="${String(i.item_id) === selected}"><span class="wardrobe-thumb"><img src="${esc(ctx.assetUrl(i.image))}" alt="" loading="lazy"></span><strong>${esc(i.name)}</strong><span class="wardrobe-item-state">${i.equipped ? '✓ 입고 있어요' : `${esc(SLOTS[i.slot] || '아이템')} · 입어보기`}</span></button>`).join('') : `<div class="wardrobe-empty"><span aria-hidden="true">🧺</span><strong>${category === 'all' ? '아직 가진 아이템이 없어요.' : `아직 ${SLOTS[category]} 아이템이 없어요.`}</strong><p>학교생활 퀘스트로 모은 골드는<br>상점에서 쓸 수 있어요.</p><button class="btn" type="button" id="wardrobeShop">상점 구경하기</button></div>`;
    preview();
    if (focused) [...el('inventoryGrid').querySelectorAll('[data-item]')].find(b => b.dataset.item === focused)?.focus({preventScroll:true});
  }
  async function check(expected = null) {
    if (busy) return;
    const key = owner, n = epoch;
    busy = true; known = false; status('저장된 옷차림을 확인하고 있어요.'); preview();
    try {
      const fresh = await ctx.readItems();
      if (!valid(key,n)) return;
      items = fresh; known = true;
      const saved = expected && !!items.find(i => String(i.item_id) === expected.id)?.equipped === expected.equipped;
      status(expected ? (saved ? '옷차림을 저장했어요! 학교에서도 이 모습으로 만나요.' : '저장된 옷차림을 확인했어요. 원하는 아이템을 다시 골라 주세요.') : '아이템은 여러 번 입어봐도 골드가 들지 않아요.');
    } catch {
      if (valid(key,n)) status('연결이 잠깐 끊겼어요. 옷차림을 다시 확인한 뒤 바꿔요.', true);
    } finally { if (valid(key,n)) { busy = false; render(); } }
  }
  async function apply() {
    const chosen = item();
    if (busy || !known || !chosen) return;
    const key = owner, n = epoch, expected = {id:selected,equipped:!chosen.equipped};
    busy = true; known = false; status('옷차림을 바꾸고 있어요. 잠깐만 기다려 주세요.'); preview();
    // The legacy endpoint toggles. Never replay it after a lost acknowledgement.
    // Reconcile using a read, and keep mutations locked when that read fails.
    try { await ctx.toggle(chosen.item_id); } catch { /* The read below determines the saved outfit. */ }
    if (!valid(key,n)) return;
    busy = false;
    await check(expected);
  }
  el('wardrobeFilters').addEventListener('click', e => {
    const button = e.target.closest('[data-slot]'); if (!button) return;
    category = button.dataset.slot; render();
    [...el('wardrobeFilters').children].find(b => b.dataset.slot === category)?.focus({preventScroll:true});
  });
  el('inventoryGrid').addEventListener('click', e => {
    if (e.target.closest('#wardrobeShop')) { window.closeInventory(); window.openShop(); return; }
    const button = e.target.closest('[data-item]'); if (!button || busy) return;
    selected = button.dataset.item; preview();
  });
  el('wardrobeReset').addEventListener('click', () => { if (!busy) { selected = null; preview(); } });
  el('wardrobeApply').addEventListener('click', apply);
  el('wardrobeCheck').addEventListener('click', () => check());
  window.openInventory = () => {
    const key = ctx.owner(); if (!key) return;
    if (key !== owner) { owner = key; epoch++; busy = false; known = false; category = 'all'; items = []; }
    selected = null; items = ctx.getItems().map(i => ({...i})); render();
    modal.classList.remove('hidden');
    if (!busy) check();
  };
  // Old inventory entry points now select a preview instead of silently toggling.
  window.toggleItem = id => { if (!busy) { selected = String(id); preview(); } };
  window.closeInventory = () => modal.classList.add('hidden');
  return {open:window.openInventory};
}
