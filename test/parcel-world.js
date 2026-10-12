// Read-only props from this account's confirmed parcel steps. No progress writes.
export function installParcelWorld(c){
 const doc=c.hub.ownerDocument,player=doc.getElementById('hubPlayer');
 let state={loaded:false,phase:0},owner=null,token=null;
 function prop(parent,className){
  let el=parent.querySelector('.'+className);if(el)return el;
  el=doc.createElement('span');el.className=className;el.setAttribute('aria-hidden','true');
  const image=doc.createElement('img');image.src='maps/npcs/parcel-v1.webp';image.alt='';image.draggable=false;
  const fallback=doc.createElement('span');fallback.className='parcel-prop-fallback';fallback.textContent='📦';
  image.onerror=()=>{image.hidden=true;el.classList.add('art-missing')};el.append(image,fallback);parent.append(el);return el;
 }
 function sync(){
  const current=state.loaded&&owner===c.getStudent()?.id&&token===c.getToken(),carrying=current&&(state.phase===1||state.phase===2);
  const held=carrying?prop(player,'parcel-held'):player.querySelector('.parcel-held');if(held)held.hidden=!carrying;
  player.classList.toggle('parcel-carrying',carrying);
  const tori=c.objects.querySelector('[data-place=tori]');if(!tori)return;
  const delivered=current&&state.phase===3,placed=delivered?prop(tori,'parcel-delivered'):tori.querySelector('.parcel-delivered');if(placed)placed.hidden=!delivered;
 }
 new MutationObserver(sync).observe(player,{childList:true});
 return {render(next){state=next;owner=c.getStudent()?.id;token=c.getToken();sync()}};
}
