const PEOPLE={
 quests:{name:'담임선생님',role:'담임선생님',art:'teacher',greeting:'토리에게 전할 책 꾸러미가 있어. 표식을 따라 찾아줄래?',note:'',choices:[['parcel','책 꾸러미 찾으러 갈게요'],['quests','다른 의뢰를 볼래요'],['teacher','내가 해낸 일 보기'],['kindness','나루 길 안내 · Lv.15'],['art','엽서 만들기 · Lv.17'],['frame','액자 꾸미기 · Lv.18'],['finale','기억 가랜드 · Lv.20']]},
 shop:{name:'문구지기 모모',role:'우리 교실 상점',art:'shopkeeper',greeting:'어서 와! 차곡차곡 모은 골드로 무엇을 골라볼까?',note:'마음에 드는 물건과 필요한 골드를 살펴봐. 구경만 해도 좋아!',choices:[['shop','상점 둘러보기']]}
};
export function installCampusNpcs({hub,getParcelStatus,getStudent,getToken,levelInfo,getMomo,onMomoAction,onVisitMomo}){
 const doc=hub.ownerDocument,dialog=doc.createElement('dialog');dialog.id='campusNpcDialog';dialog.className='campus-npc-dialog';dialog.setAttribute('aria-labelledby','campusNpcName');doc.body.append(dialog);
 let current=null,opener=null,owner=null,token=null,rendered='';
 const choice=([action,label])=>'<button type="button" data-npc-action="'+action+'">'+label+' <span aria-hidden="true">▸</span></button>';
 function talk(kind){
  const person=PEOPLE[kind];if(!person)return false;
  const wasOpen=dialog.open,notebookOpen=dialog.querySelector('.npc-notebook')?.open;
  current=person;if(!wasOpen)opener=doc.activeElement;owner=getStudent?.()?.id;token=getToken?.();dialog.dataset.person=kind;
  const progress=getParcelStatus?.(),phase=progress?.loaded?progress.phase:0;
  const parcelWords=phase===1?['꾸러미를 챙겼구나! 복도 안내판에서 같은 표식을 찾아보렴.','표식 안내판으로 갈게요']:phase===2?['책지기 토리가 기다리고 있단다. 꾸러미를 직접 전해줄래?','토리에게 전하러 갈게요']:phase===3?['토리에게 잘 전해 줬구나! 네 덕분에 책 나눔을 준비했대. 고마워.','배달 기억을 볼래요']:null;
  const parcelReady=phase>0||levelInfo?.(getStudent?.()?.xp||0)?.level>=16;
  const momo=getMomo?.(),shop=kind==='shop'?momo:null;
  const momoWords=momo?.action==='momo-return'?['찾은 연필을 모모에게 직접 건네줄래? 모모가 기다리고 있어.','모모에게 연필 전하러 가기']:momo?.action==='momo-go'?['모모의 연필을 찾고 있구나. 옷장 왼쪽 바닥을 살펴보렴.','모모에게 다시 물어보기']:momo?.action==='momo-thanks'?['모모가 네가 찾아준 연필로 가격표를 썼대. 고마워!','모모에게 인사하러 가기']:['모모가 연필을 잃어버렸대. 오른쪽 모모에게 가서 무슨 일인지 물어봐 줄래?','모모의 부탁 들으러 가기'];
  const firstChoices=shop?[[shop.action,shop.label],['shop','상점 둘러보기']]:kind==='quests'?[parcelReady?['parcel',parcelWords?parcelWords[1]:progress?.loaded?'책 꾸러미 찾으러 갈게요':'의뢰 수첩 확인하기']:['visit-momo',momoWords[1]]]:person.choices.slice(0,1);
  const finaleSeen=kind==='quests'&&window.studentAdventure?.finale?.completed();
  const greeting=shop?shop.text:kind==='quests'?(finaleSeen?'가랜드를 봤어! ':'')+(parcelWords?parcelWords[0]:!parcelReady?momoWords[0]:!progress?.loaded?'의뢰 수첩을 먼저 확인해 볼까? 전에 시작한 부탁부터 이어가자.':person.greeting):person.greeting;
  const signature=JSON.stringify([kind,owner,token,firstChoices,greeting]);if(wasOpen&&signature===rendered)return true;rendered=signature;
  const focused=doc.activeElement,focusAction=focused?.dataset.npcAction,focusSummary=focused?.matches('.npc-notebook summary'),focusClose=focused?.hasAttribute('data-npc-close');
  dialog.innerHTML='<header><span>'+person.role+'</span><button type="button" data-npc-close autofocus>닫기</button></header><div class="npc-conversation"><span class="game-speaker-name">'+person.name+'</span><img src="maps/npcs/'+person.art+'-v1.webp" alt="" width="160" height="230"><div><h2 id="campusNpcName">'+person.name+'</h2><p>'+greeting+'</p>'+(person.note?'<p class="npc-note">'+person.note+'</p>':'')+'</div></div><div class="npc-choices">'+firstChoices.map(choice).join('')+(kind==='quests'?'<details class="npc-notebook"><summary>다른 의뢰와 기록</summary>'+person.choices.slice(1).filter(([id])=>!firstChoices.some(([primary])=>primary===id)).map(choice).join('')+'</details>':'')+'</div><button type="button" class="npc-return" data-npc-close>이따 다시 올게요</button>';
  if(wasOpen&&notebookOpen)dialog.querySelector('.npc-notebook')?.setAttribute('open','');
  if(wasOpen&&dialog.contains(focused)===false&&(focusAction||focusSummary||focusClose))(dialog.querySelector(focusAction?'[data-npc-action="'+focusAction+'"]':focusSummary?'.npc-notebook summary':'[data-npc-close]')||dialog.querySelector('.npc-choices>button')).focus({preventScroll:true});
  if(!dialog.open)dialog.showModal();return true;
 }
 dialog.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.hasAttribute('data-npc-close'))dialog.close();
  const action=button.dataset.npcAction;
  if(action&&(owner!==getStudent?.()?.id||token!==getToken?.())){dialog.close();return}
  if(action==='visit-momo'&&dialog.dataset.person==='quests'){dialog.close();onVisitMomo?.();return}
  if(action?.startsWith('momo-')&&dialog.dataset.person==='shop'){dialog.close();if(onMomoAction?.(action))talk('shop');return}
  if(action&&current?.choices.some(([key])=>key===action)){dialog.close();if(action==='finale')window.studentAdventure.workshop('school-finale');else if(action==='kindness')window.studentAdventure.workshop('kindness-chapter');else if(action==='parcel')window.studentCampus.parcel.start();else if(action==='frame')window.studentAdventure.workshop('art-frame');else if(action==='art')window.studentAdventure.workshop('art-postcard');else window.hubInteract(action)}
 });
 dialog.addEventListener('close',()=>{if(opener?.isConnected&&!hub.classList.contains('hidden')&&!doc.querySelector('dialog[open],.modal-backdrop:not(.hidden):not(#schoolExplorerModal):not(#classroomHub)'))opener.focus({preventScroll:true})});
 new MutationObserver(()=>{if(hub.classList.contains('hidden')&&dialog.open)dialog.close()}).observe(hub,{attributes:true,attributeFilter:['class']});
 const refresh=()=>{if(dialog.open){if(owner!==getStudent?.()?.id||token!==getToken?.())dialog.close();else talk(dialog.dataset.person)}};
 doc.addEventListener('student-dashboard-updated',refresh);
 return {talk,refresh};
}
