// Only the existing walking rooms and activities are listed here. Story gates stay in the exploration notebook.
const DETAILS={parcel:'책 향기 꾸러미의 봉인과 잎 표식을 살펴봐요.',notice:'도서관의 표식을 알려 주는 작은 안내판이에요.',titles:'모은 칭호를 둘러봐요.',inventory:'옷을 미리 입어보고 바꿔요.',quests:'선생님이 맡긴 의뢰를 살펴봐요.',teacher:'내가 해낸 퀘스트를 다시 봐요.',shop:'모은 골드로 살 수 있는 물건을 구경해요.',classroom:'친숙한 우리 교실로 가는 문이에요.',hallway:'다른 교실과 이어지는 문이에요.',library:'책과 이야기가 있는 도서관 문이에요.',reading:'읽은 책과 내 생각을 기록해요.',tori:'책지기와 이야기하거나 단서를 찾아요.',portfolio:'나와 우리 반 친구들의 독후감을 읽어요.'};
export function installCampusWayfinder(ctx){
 const doc=document,dialog=doc.createElement('dialog');dialog.id='campusWayfinder';dialog.className='campus-wayfinder';dialog.setAttribute('aria-labelledby','campusWayfinderTitle');
 dialog.innerHTML='<header><div><span>우리 학교 길 안내</span><h2 id="campusWayfinderTitle">어디로 갈까요?</h2></div><button type="button" data-finder-close autofocus>닫기</button></header><p class="finder-intro">장소와 물건을 고르면 그 앞까지 걸어가요.<br>도착한 뒤 활동 버튼을 눌러요.</p><nav class="finder-rooms" aria-label="둘러볼 장소"></nav><div class="finder-current"></div><div class="finder-places"></div><p class="finder-note">학교 이야기는 <b>탐험 지도</b>에서 레벨에 맞게 만나요.<br>옷장과 독서 기록은 모든 레벨에서 쓸 수 있어요.</p>';
 doc.body.append(dialog);let room='',ticket=0;
 function render(){
  dialog.querySelector('.finder-rooms').innerHTML=Object.entries(ctx.rooms).map(([id,info])=>'<button type="button" data-finder-room="'+id+'" aria-pressed="'+(id===room)+'">'+info.name+'</button>').join('');
  dialog.querySelector('.finder-current').textContent=(room===ctx.getScene()?'지금 있는 곳 · ':'둘러볼 곳 · ')+ctx.rooms[room].name;
  const list=dialog.querySelector('.finder-places');list.replaceChildren();
  for(const place of ctx.walk.places(room)){
   const button=doc.createElement('button');button.type='button';button.dataset.finderPlace=place.kind;
   const name=doc.createElement('strong');name.textContent=place.label;
   const detail=doc.createElement('span');detail.textContent=DETAILS[place.kind]||'가까이에서 살펴봐요.';
   const action=doc.createElement('small');action.textContent='이곳으로 걷기 →';button.append(name,detail,action);list.append(button);
  }
 }
 function open(){
  if(dialog.open)return;ctx.stop();ctx.walk.stop();ticket++;room=ctx.getScene();render();dialog.showModal();dialog.scrollTop=0;
 }
 dialog.addEventListener('click',event=>{
  if(event.target.closest('[data-finder-close]')){ticket++;dialog.close();return}
  const tab=event.target.closest('[data-finder-room]');
  if(tab){room=tab.dataset.finderRoom;render();dialog.querySelector('[data-finder-room="'+room+'"]').focus({preventScroll:true});return}
  const place=event.target.closest('[data-finder-place]');if(!place)return;
  const selectedRoom=room,kind=place.dataset.finderPlace,request=++ticket;
  dialog.close();
  if(selectedRoom!==ctx.getScene())window.enterHubScene(selectedRoom);
  // The legacy room renderer settles through MutationObservers before the next frame.
  requestAnimationFrame(()=>{
   if(request!==ticket||dialog.open||!ctx.isOpen()||ctx.getScene()!==selectedRoom)return;
   if(ctx.walk.goTo(kind))doc.getElementById('campusTitle').focus({preventScroll:true});
  });
 });
 dialog.addEventListener('cancel',()=>ticket++);
 dialog.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const buttons=[...dialog.querySelectorAll('button')].filter(b=>!b.disabled&&b.getClientRects().length),first=buttons[0],last=buttons.at(-1);
  if(event.shiftKey&&doc.activeElement===first||!event.shiftKey&&doc.activeElement===last){event.preventDefault();(event.shiftKey?last:first)?.focus()}
 });
 return {open};
}
