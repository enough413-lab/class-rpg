// The destination stays in world coordinates as the camera follows the player.
export function installCampusWaypoint(stage){
 const pin=stage.ownerDocument.createElement('div');pin.className='campus-waypoint';pin.hidden=true;pin.setAttribute('aria-hidden','true');
 pin.innerHTML='<svg viewBox="0 0 40 48"><path d="M20 45 6 24A17 17 0 1 1 34 24Z"/><path class="waypoint-star" d="m20 7 3.5 7 8 1-5.8 5.8 1.4 8-7.1-3.7-7.1 3.7 1.4-8L8.5 15l8-1Z"/></svg><span></span>';
 stage.append(pin);let timer=0;
 function show(x){clearTimeout(timer);pin.style.left=x+'%';pin.dataset.state='walking';pin.hidden=false}
 function end(arrived=false){clearTimeout(timer);if(!arrived){pin.hidden=true;return}pin.dataset.state='arrived';timer=setTimeout(()=>{pin.hidden=true},850)}
 return {show,end};
}
