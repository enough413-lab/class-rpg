// Only chooses which existing request to show. It never accepts or completes one.
export function installCurrentGoal(c){
 const doc=c.hub.ownerDocument,box=doc.createElement('aside'),dialog=doc.createElement('dialog');
 box.className='campus-current-goal';box.setAttribute('aria-label','지금 할 일');
 box.innerHTML='<div class="current-goal-copy" role="status" aria-live="polite" aria-atomic="true"><b></b><span></span></div><button type="button" data-goal-book aria-label="받은 부탁 수첩 열기">부탁<br>수첩</button>';
 dialog.id='campusRequestBook';dialog.className='campus-request-book';dialog.setAttribute('aria-labelledby','requestBookTitle');
 dialog.innerHTML='<header><h2 id="requestBookTitle">받은 부탁</h2><button type="button" data-goal-close autofocus>닫기</button></header><p>지금 할 부탁 하나를 골라요.</p><ul class="request-state-legend" aria-label="친구 머리 위 부탁 표시"><li><img src="maps/ui/quest-bulb-v2.svg?v=20261020-harmony" width="36" height="36" alt="">새 부탁</li><li><img src="maps/ui/quest-compass-v1.svg?v=20261030-quest-polish" width="36" height="36" alt="">진행 중</li><li><img src="maps/ui/quest-book-v2.svg?v=20261020-harmony" width="36" height="36" alt="">완료 가능</li></ul><div class="request-book-list"></div><p class="goal-save-status" role="status"></p><button type="button" data-goal-save hidden>목표 선택 다시 저장</button><button type="button" data-goal-parcel>꾸러미 수첩 열기</button>';
 c.viewport.append(box);doc.body.append(dialog);c.hub.classList.add('has-current-goal');
 const button=box.querySelector('button'),title=box.querySelector('b'),hint=box.querySelector('span'),list=dialog.querySelector('.request-book-list'),saveStatus=dialog.querySelector('.goal-save-status');
 const choices=new Map(),key=id=>'classRpgCurrentGoal_v1_'+id,ids=['momo','leaf','parcel','letter','trio-tori','trio-garden','trio-duri','trio-link','flowerbed'];
 let owner=null,token=null,selected=null,stored=true,current=null,signature='',bookOwner=null,bookToken=null;
 const requests=()=>c.requests().filter(Boolean);
 function activate(){const id=c.getStudent()?.id,t=c.getToken();if(id===owner&&t===token)return;owner=id;token=t;signature='';if(dialog.open)dialog.close();
  if(choices.has(id)){({selected,stored}=choices.get(id));return}selected=null;stored=true;
  try{const saved=JSON.parse(localStorage.getItem(key(id))||'null');if(id!=null&&saved?.v===1&&ids.includes(saved.id))selected=saved.id}catch{stored=false}
  choices.set(id,{selected,stored});
 }
 function remember(){if(owner==null)return;try{localStorage.setItem(key(owner),JSON.stringify({v:1,id:selected}));stored=true}catch{stored=false}choices.set(owner,{selected,stored})}
 function text(el,value){if(el.textContent!==value)el.textContent=value}
 function refresh(){
  activate();const all=requests(),active=all.filter(r=>r.active),pending=all.some(r=>!r.loaded),errors=all.filter(r=>r.error);
  // Do not let a late journal reply steal a selected local request, or erase a pending choice.
  current=active.find(r=>r.id===selected)||active[0]||null;
  box.dataset.request=current?.id||'';box.dataset.state=current?'active':errors.length?'error':pending?'loading':'free';
  text(title,current?current.title:errors.length?'부탁을 확인해 주세요':pending?'부탁을 확인하는 중':'지금은 자유롭게');
  text(hint,current?current.text:errors.length?'수첩에서 다시 확인해요.':pending?'수첩에서 확인할 수 있어요.':'가까운 친구나 물건을 살펴봐요.');
  const warning=errors.length||!stored;text(button,warning?'수첩 확인':'부탁 수첩'+(active.length?' '+active.length:''));button.setAttribute('aria-label','받은 부탁 수첩 열기'+(warning?' · 확인 필요':''));
  if(!dialog.open)return;
  const state=JSON.stringify(all.map(({id,title,text,active,error,loaded})=>({id,title,text,active,error,loaded})))+':'+current?.id;
  if(signature!==state){const focused=doc.activeElement?.dataset,focusId=focused?.goalPick||focused?.goalRetry,wasRetry=!!focused?.goalRetry;list.replaceChildren();
   for(const r of all.filter(r=>r.active||r.error)){const row=doc.createElement('section');row.dataset.request=r.id;
    if(r.active){const b=doc.createElement('button');b.type='button';b.dataset.goalPick=r.id;b.setAttribute('aria-pressed',String(r.id===current?.id));const strong=doc.createElement('b'),small=doc.createElement('span');strong.textContent=r.title;small.textContent=r.text;b.append(strong,small);row.append(b)}
    if(r.error){const p=doc.createElement('p');p.textContent=r.title+' · '+r.error;const retry=doc.createElement('button');retry.type='button';retry.dataset.goalRetry=r.id;retry.textContent='다시 확인 · '+r.title;row.append(p,retry)}list.append(row);
   }
   if(!list.children.length){const p=doc.createElement('p');p.textContent=pending?'부탁 기록을 확인하고 있어요.':'진행 중인 부탁이 없어요. 친구에게 말을 걸어 보세요.';list.append(p)}
   signature=state;if(focusId)(list.querySelector('[data-goal-'+(wasRetry?'retry':'pick')+'="'+focusId+'"]')||dialog.querySelector('[data-goal-close]')).focus({preventScroll:true});
  }
  text(saveStatus,stored?'':'목표 선택을 이 기기에 저장하지 못했어요. 지금은 선택한 부탁을 계속할 수 있어요.');dialog.querySelector('[data-goal-save]').hidden=stored;
 }
 function focus(id){activate();if(!requests().some(r=>r.id===id&&r.active)){refresh();return}selected=id;remember();refresh()}
 function open(){activate();c.stop();bookOwner=owner;bookToken=token;signature='';dialog.showModal();refresh()}
 button.onclick=open;
 dialog.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!dialog.open)return;
  if(b.hasAttribute('data-goal-close')){dialog.close();return}
  if(bookOwner!==c.getStudent()?.id||bookToken!==c.getToken()){dialog.close();refresh();return}
  if(b.dataset.goalPick){focus(b.dataset.goalPick);dialog.close();return}
  if(b.dataset.goalRetry){requests().find(r=>r.id===b.dataset.goalRetry)?.retry?.();refresh();return}
  if(b.hasAttribute('data-goal-save')){remember();refresh();if(stored)dialog.querySelector('[data-goal-close]').focus();return}
  if(b.hasAttribute('data-goal-parcel')){dialog.close();c.openParcel()}
 });
 dialog.addEventListener('close',()=>{signature='';if(!c.hub.classList.contains('hidden')&&button.getClientRects().length)button.focus({preventScroll:true})});
 doc.addEventListener('student-dashboard-updated',refresh);new MutationObserver(()=>{if(c.hub.classList.contains('hidden')&&dialog.open)dialog.close()}).observe(c.hub,{attributes:true,attributeFilter:['class']});
 refresh();return {refresh,focus,open};
}
