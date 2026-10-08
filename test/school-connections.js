// Existing places form one walkable route. Walking access is separate from story levels.
export const SCHOOL_PATH=['classroom','hallway','library','garden','pond','playground','cafeteria'];
export const ROOM_NAMES={classroom:'우리 교실',hallway:'별빛 복도',library:'도서관',garden:'정원',pond:'연못',playground:'운동장',cafeteria:'급식실'};
export function roomDoors(room){
 const i=SCHOOL_PATH.indexOf(room);
 return [-1,1].flatMap(direction=>{const to=SCHOOL_PATH[i+direction];return to?[{kind:to,x:direction<0?6:94,label:(direction<0?'← ':'')+ROOM_NAMES[to]+(direction>0?' →':''),door:true}]:[]});
}
export function decorateRoomDoor(button,place,painted=false){
 button.classList.add('campus-door');if(painted)button.classList.add('campus-painted-door');
 button.dataset.walkX=place.x;button.dataset.action='이동하기';button.setAttribute('aria-label',ROOM_NAMES[place.kind]+' · 이동하기');
 const caption=button.ownerDocument.createElement('span');caption.className='campus-object-caption';
 const title=button.ownerDocument.createElement('b');title.textContent=place.label;
 const hint=button.ownerDocument.createElement('small');hint.className='campus-object-action';hint.textContent='↗ 이동하기';caption.append(title,hint);button.append(caption);
}
