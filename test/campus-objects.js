// Bounds follow the existing painted props, in percent of the whole room.
// Reusing the room texture keeps every crop aligned with the original artwork.
const PROPS={
 classroom:{titles:[1,29,11.5,41.5],inventory:[13,41,19,29.5],quests:[32,29,34,33],teacher:[58,56,17,14.5],shop:[75,34,13,36.5],hallway:[90,33,9.5,37.5]},
 hallway:{classroom:[8.5,30,13,39],library:[82,32.5,13,36.5]},
 library:{hallway:[.5,33,11,37.5],reading:[13,55,19,15.5],portfolio:[66,25,33.5,45.5]}
};
const verbs={titles:'살펴보기',inventory:'옷 갈아입기',quests:'의뢰 보기',teacher:'기록 보기',shop:'상점 열기',hallway:'이동하기',classroom:'들어가기',library:'들어가기',reading:'책 이야기 쓰기',portfolio:'기록 펼치기',tori:'이야기하기'};
export function decorateCampusObject(button,place,room,tori){
 const doc=button.ownerDocument,caption=doc.createElement('span');caption.className='campus-object-caption';
 const name=doc.createElement('b');name.textContent=place.label;
 const action=doc.createElement('small');action.className='campus-object-action';action.textContent='↗ '+verbs[place.kind];
 caption.append(name,action);button.dataset.walkX=place.x;button.setAttribute('aria-label',place.label.replace(/^\p{Extended_Pictographic}\ufe0f?\s*/u,'')+' · '+verbs[place.kind]);
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
 const action=button.querySelector('.campus-object-action');if(action)action.textContent=(guided?'◆ 가는 곳 · ':near?'✓ ':'↗ ')+verbs[button.dataset.place];
}
