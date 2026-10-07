const PEOPLE={
 quests:{name:'새봄 선생님',role:'학교 의뢰 안내',art:'teacher',greeting:'학교에서 해 볼 작은 도전을 함께 찾아볼까?',note:'실제로 해 본 일을 기록하면 선생님이 확인해 주실 거야.',choices:[['quests','선생님 의뢰 보기'],['teacher','내가 해낸 일 보기'],['kindness','새 친구 나루의 길 안내 · Lv.15'],['parcel','책 향기 꾸러미 의뢰 · Lv.16']]},
 shop:{name:'문구지기 모모',role:'우리 교실 상점',art:'shopkeeper',greeting:'어서 와! 차곡차곡 모은 골드로 무엇을 골라볼까?',note:'마음에 드는 물건과 필요한 골드를 살펴봐. 구경만 해도 좋아!',choices:[['shop','상점 둘러보기']]}
};
export function installCampusNpcs({hub}){
 const doc=hub.ownerDocument,dialog=doc.createElement('dialog');dialog.id='campusNpcDialog';dialog.className='campus-npc-dialog';dialog.setAttribute('aria-labelledby','campusNpcName');doc.body.append(dialog);
 let current=null,opener=null;
 function talk(kind){
  const person=PEOPLE[kind];if(!person)return false;
  current=person;opener=doc.activeElement;
  dialog.innerHTML='<header><span>'+person.role+'</span><button type="button" data-npc-close autofocus>닫기</button></header><div class="npc-conversation"><img src="maps/npcs/'+person.art+'-v1.webp" alt="" width="160" height="230"><div><h2 id="campusNpcName">'+person.name+'</h2><p>'+person.greeting+'</p><p class="npc-note">'+person.note+'</p></div></div><div class="npc-choices">'+person.choices.map(([action,label])=>'<button type="button" data-npc-action="'+action+'">'+label+' <span aria-hidden="true">→</span></button>').join('')+'</div><button type="button" class="npc-return" data-npc-close>교실로 돌아가기</button>';
  if(!dialog.open)dialog.showModal();return true;
 }
 dialog.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.hasAttribute('data-npc-close'))dialog.close();
  const action=button.dataset.npcAction;
  if(action&&current?.choices.some(([key])=>key===action)){dialog.close();if(action==='kindness')window.studentAdventure.workshop('kindness-chapter');else if(action==='parcel')window.studentCampus.parcel.start();else window.hubInteract(action)}
 });
 dialog.addEventListener('close',()=>{if(opener?.isConnected&&!hub.classList.contains('hidden')&&!doc.querySelector('dialog[open],.modal-backdrop:not(.hidden):not(#schoolExplorerModal):not(#classroomHub)'))opener.focus({preventScroll:true})});
 new MutationObserver(()=>{if(hub.classList.contains('hidden')&&dialog.open)dialog.close()}).observe(hub,{attributes:true,attributeFilter:['class']});
 return {talk};
}
