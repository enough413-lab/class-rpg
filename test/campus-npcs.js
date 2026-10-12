const PEOPLE={
 quests:{name:'담임선생님',role:'담임선생님',art:'teacher',greeting:'토리에게 전할 책 꾸러미가 있어. 표식을 따라 찾아줄래?',note:'',choices:[['parcel','책 꾸러미 찾으러 갈게요'],['quests','다른 의뢰를 볼래요'],['teacher','내가 해낸 일 보기'],['kindness','나루 길 안내 · Lv.15'],['art','엽서 만들기 · Lv.17'],['frame','액자 꾸미기 · Lv.18'],['finale','기억 가랜드 · Lv.20']]},
 shop:{name:'문구지기 모모',role:'우리 교실 상점',art:'shopkeeper',greeting:'어서 와! 차곡차곡 모은 골드로 무엇을 골라볼까?',note:'마음에 드는 물건과 필요한 골드를 살펴봐. 구경만 해도 좋아!',choices:[['shop','상점 둘러보기']]}
};
export function installCampusNpcs({hub}){
 const doc=hub.ownerDocument,dialog=doc.createElement('dialog');dialog.id='campusNpcDialog';dialog.className='campus-npc-dialog';dialog.setAttribute('aria-labelledby','campusNpcName');doc.body.append(dialog);
 let current=null,opener=null;
 const choice=([action,label])=>'<button type="button" data-npc-action="'+action+'">'+label+' <span aria-hidden="true">▸</span></button>';
 function talk(kind){
  const person=PEOPLE[kind];if(!person)return false;
  current=person;opener=doc.activeElement;dialog.dataset.person=kind;
  dialog.innerHTML='<header><span>'+person.role+'</span><button type="button" data-npc-close autofocus>닫기</button></header><div class="npc-conversation"><span class="game-speaker-name">'+person.name+'</span><img src="maps/npcs/'+person.art+'-v1.webp" alt="" width="160" height="230"><div><h2 id="campusNpcName">'+person.name+'</h2><p>'+(kind==='quests'&&window.studentAdventure?.finale?.completed()?'네가 걸어 둔 가랜드를 봤어! 또 어떤 이야기를 만들고 싶니?':person.greeting)+'</p>'+(person.note?'<p class="npc-note">'+person.note+'</p>':'')+'</div></div><div class="npc-choices">'+person.choices.slice(0,kind==='quests'?2:1).map(choice).join('')+(kind==='quests'?'<details class="npc-notebook"><summary>기록과 만들기</summary>'+person.choices.slice(2).map(choice).join('')+'</details>':'')+'</div><button type="button" class="npc-return" data-npc-close>이따 다시 올게요</button>';
  if(!dialog.open)dialog.showModal();return true;
 }
 dialog.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.hasAttribute('data-npc-close'))dialog.close();
  const action=button.dataset.npcAction;
  if(action&&current?.choices.some(([key])=>key===action)){dialog.close();if(action==='finale')window.studentAdventure.workshop('school-finale');else if(action==='kindness')window.studentAdventure.workshop('kindness-chapter');else if(action==='parcel')window.studentCampus.parcel.start();else if(action==='frame')window.studentAdventure.workshop('art-frame');else if(action==='art')window.studentAdventure.workshop('art-postcard');else window.hubInteract(action)}
 });
 dialog.addEventListener('close',()=>{if(opener?.isConnected&&!hub.classList.contains('hidden')&&!doc.querySelector('dialog[open],.modal-backdrop:not(.hidden):not(#schoolExplorerModal):not(#classroomHub)'))opener.focus({preventScroll:true})});
 new MutationObserver(()=>{if(hub.classList.contains('hidden')&&dialog.open)dialog.close()}).observe(hub,{attributes:true,attributeFilter:['class']});
 return {talk};
}
