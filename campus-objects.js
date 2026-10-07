// Bounds follow the existing painted props, in percent of the whole room.
// Reusing the room texture keeps every crop aligned with the original artwork.
const PROPS={
 classroom:{hallway:[89,48,10.5,27.5]},
 hallway:{classroom:[8.3,45.5,13,29.5],library:[80.7,46,13,29]},
 library:{hallway:[.5,48,11,27]}
};
const verbs={parcel:'봉인 살펴보기',notice:'단서 읽기',titles:'살펴보기',inventory:'옷 갈아입기',quests:'의뢰 보기',teacher:'기록 보기',shop:'상점 열기',hallway:'이동하기',classroom:'들어가기',library:'들어가기',reading:'독후감 쓰기',portfolio:'독후감 읽기',tori:'이야기하기'};
const SPRITES={
 parcel:{art:'parcel',x:38,width:13,height:18},titles:{art:'titles',x:8,width:14,height:34},inventory:{art:'wardrobe',x:25,width:17,height:32},
 quests:{art:'teacher',x:54,width:14,height:37,name:'담임선생님'},
 teacher:{art:'records',x:68,width:14,height:24},
 shop:{art:'shopkeeper',x:82,width:15,height:32,name:'문구지기 모모'}
};
const HALLWAY_SPRITES={notice:{art:'records',x:51,width:19,height:28}};
const LIBRARY_SPRITES={
 reading:{art:'reading-desk',x:27,width:24,height:32},
 portfolio:{art:'journal-shelf',x:82,width:25,height:46},
 tori:{art:'tori',x:58,width:17,height:35,name:'책지기 토리'}
};
export function decorateCampusObject(button,place,room,tori){
 const doc=button.ownerDocument,caption=doc.createElement('span');caption.className='campus-object-caption';
 const name=doc.createElement('b');name.textContent=place.label;
 const action=doc.createElement('small');action.className='campus-object-action';action.textContent='↗ '+verbs[place.kind];
 caption.append(name,action);button.dataset.walkX=place.x;button.setAttribute('aria-label',place.label.replace(/^\p{Extended_Pictographic}\ufe0f?\s*/u,'')+' · '+verbs[place.kind]);
 const sprite=(room==='classroom'?SPRITES:room==='library'?LIBRARY_SPRITES:room==='hallway'?HALLWAY_SPRITES:{})[place.kind];
 if(sprite){
  button.classList.add('campus-sprite');button.style.left=sprite.x+'%';button.style.width=sprite.width+'%';button.style.height=sprite.height*.75+'%';
  if(sprite.name){button.classList.add('campus-npc');name.textContent=sprite.name;button.dataset.action='이야기하기';button.setAttribute('aria-label',sprite.name+(sprite.name===place.label?'':' · '+place.label)+' · 이야기하기')}
  const art=doc.createElement('img');art.className='campus-sprite-art';art.src='maps/npcs/'+sprite.art+'-v1.webp';art.alt='';art.draggable=false;
  art.onerror=()=>{art.hidden=true;button.classList.add('art-missing')};
  const missing=doc.createElement('span');missing.className='campus-sprite-missing';missing.textContent='그림을 못 불러왔어요. 이름을 눌러 이용해요.';missing.setAttribute('aria-hidden','true');
  button.append(art,missing,caption);return;
 }
 if(place.kind==='tori'){
  button.innerHTML=tori;button.classList.add('campus-character');button.append(caption);return;
 }
 const bounds=PROPS[room]?.[place.kind];if(!bounds){button.append(caption);return}
 const [x,y,w,h]=bounds;button.classList.add('campus-object');button.style.left=x+w/2+'%';button.style.top=y+'%';button.style.width=w+'%';button.style.height=h+'%';
 button.style.setProperty('--prop-size',`${10000/w}% ${10000/h}%`);button.style.setProperty('--prop-position',`${100*x/(100-w)}% ${100*y/(100-h)}%`);
 const art=doc.createElement('span');art.className='campus-prop-art';art.setAttribute('aria-hidden','true');
 // The outline is a consistent interaction cue, not a claim of a separate sprite.
 const outline=doc.createElementNS('http://www.w3.org/2000/svg','svg');outline.classList.add('campus-prop-outline');outline.setAttribute('viewBox','0 0 100 100');outline.setAttribute('preserveAspectRatio','none');outline.setAttribute('aria-hidden','true');
 outline.innerHTML='<rect x="1" y="1" width="98" height="98" rx="4" vector-effect="non-scaling-stroke"/>';
 button.append(art,outline,caption);
}
export function markCampusObject(button,{near=false,guided=false}={}){
 button.classList.toggle('is-near',near);button.classList.toggle('is-destination',guided);
 const action=button.querySelector('.campus-object-action'),text=(guided?'◆ 가는 곳 · ':near?'✓ ':'↗ ')+(button.dataset.action||verbs[button.dataset.place]);if(action&&action.textContent!==text)action.textContent=text;
}
