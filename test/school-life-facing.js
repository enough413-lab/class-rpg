import {lookDirection} from './school-life-feedback.js?v=20261110-field-feedback';
// Facing belongs to the current view, never to the saved story.
export function faceTarget(position,target,look='d',facing=1){
 const point=target.face||target,dx=point.x-position.x,dy=point.y-position.y;
 if(!Number.isFinite(dx)||!Number.isFinite(dy))return {look,facing};
 const direction=lookDirection(dx,dy,look);
 return {look:direction,facing:dx?dx<0?1:-1:facing};
}
