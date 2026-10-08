// Original painted scenery and independent props for already-open places.
export const PAINTED_PLACES={
 cafeteria:{background:'maps/cafeteria-panorama-v1.webp',props:['cafeteria-sink','cafeteria-table','cafeteria-trays']},
 playground:{background:'maps/playground-panorama-v1.webp',props:['playground-mat','playground-bench','playground-balls']}
};
export function decoratePlaceProp(button,place,room){
 const art=PAINTED_PLACES[room]?.props[Number(place.kind.slice(5))];if(!place.kind.startsWith('look-')||!art)return false;
 const doc=button.ownerDocument;button.classList.add('campus-sprite','campus-painted-prop');button.dataset.art=art;button.dataset.walkX=place.x;button.dataset.action='살펴보기';button.setAttribute('aria-label',place.label+' · 살펴보기');
 const img=doc.createElement('img');img.className='campus-sprite-art';img.src='maps/props/'+art+'-v1.webp';img.alt='';img.draggable=false;img.onerror=()=>{img.hidden=true;button.classList.add('art-missing')};
 const missing=doc.createElement('span');missing.className='campus-sprite-missing';missing.textContent='그림을 못 불러왔어요. 이름을 눌러 살펴봐요.';missing.setAttribute('aria-hidden','true');
 const caption=doc.createElement('span');caption.className='campus-object-caption';const title=doc.createElement('b');title.textContent=place.label;const hint=doc.createElement('small');hint.className='campus-object-action';hint.textContent='↗ 살펴보기';caption.append(title,hint);button.append(img,missing,caption);return true;
}
