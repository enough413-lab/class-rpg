// Original painted assets for the existing hallway, with independent route doors.
export const HALLWAY_BACKGROUND='maps/hallway-panorama-v1.webp';
export const HALLWAY_PLACES=[{kind:'classroom',x:8,label:'← 우리 교실'},{kind:'notice',x:51,label:'📜 꾸러미 표식 안내'},{kind:'library',x:90,label:'도서관 →'}];
export function decorateHallwayObject(button,place){
 const art={classroom:'hallway-classroom-door',library:'hallway-library-door',notice:'hallway-notice'}[place.kind];if(!art)return false;
 const doc=button.ownerDocument,door=place.kind!=='notice';button.classList.add('campus-sprite','campus-hallway-prop');if(door)button.classList.add('campus-hallway-door');else button.dataset.standBeside='true';button.dataset.art=art;button.dataset.walkX=place.x;button.dataset.action=door?'이동하기':'단서 읽기';button.setAttribute('aria-label',place.label+' · '+button.dataset.action);
 const img=doc.createElement('img');img.className='campus-sprite-art';img.src='maps/props/'+art+'-v1.webp';img.alt='';img.draggable=false;img.onerror=()=>{img.hidden=true;button.classList.add('art-missing')};
 const missing=doc.createElement('span');missing.className='campus-sprite-missing';missing.textContent='그림을 못 불러왔어요. 이름을 눌러 이용해요.';missing.setAttribute('aria-hidden','true');
 const caption=doc.createElement('span');caption.className='campus-object-caption';const title=doc.createElement('b');title.textContent=place.label;const hint=doc.createElement('small');hint.className='campus-object-action';hint.textContent='↗ '+button.dataset.action;caption.append(title,hint);button.append(img,missing,caption);return true;
}
