// Separate nearby names without moving a character or running an idle animation.
export function installCampusNameplates({hub,stage,viewport,player,objects}){
 let frame=0;const offsets=new WeakMap();
 function layout(){
  frame=0;if(hub.classList.contains('hidden'))return;
  const name=player.querySelector('.campus-player-name');if(!name)return;
  const view=viewport.getBoundingClientRect(),scene=stage.getBoundingClientRect();if(!view.width)return;
  const measure=label=>{const r=label.getBoundingClientRect(),old=offsets.get(label)||{x:0,y:0};return {label,left:r.left-old.x,top:r.top-old.y,width:r.width,height:r.height}};
  const own=measure(name),playerBody=player.getBoundingClientRect(),npcs=[...objects.querySelectorAll('.campus-npc .campus-object-caption')].map(label=>({...measure(label),body:label.parentElement.getBoundingClientRect()}));
  const parcelLabel=objects.querySelector('[data-place=parcel]:not([hidden]) .campus-object-caption'),parcel=parcelLabel?{...measure(parcelLabel),body:parcelLabel.parentElement.getBoundingClientRect()}:null;
  const scenery=parcel?[...objects.querySelectorAll('.campus-object-caption')].filter(label=>label!==parcelLabel&&!label.parentElement.classList.contains('campus-npc')).map(label=>label.getBoundingClientRect()):[];
  const clampX=r=>Math.max(view.left+8,Math.min(r.left,view.right-8-r.width))-r.left;
  const ownX=clampX(own),ownLeft=own.left+ownX,ownBottom=own.top+own.height;
  const placements=[{...own,x:ownX,y:0}];
  for(const npc of npcs){
   // Do not pull an offscreen resident's label into the current camera view.
   const center=npc.body.left+npc.body.width/2,visible=center>=view.left&&center<=view.right;
   const x=visible?clampX(npc):0,left=npc.left+x;
   const overlap=visible&&left<ownLeft+own.width+4&&left+npc.width>ownLeft-4&&npc.top<ownBottom+4&&npc.top+npc.height>own.top-4;
   let y=overlap?ownBottom+5-npc.top:0;
   if(overlap&&npc.top+y+npc.height>Math.min(view.bottom,scene.bottom)-3)y=npc.body.top-8-npc.height-npc.top;
   placements.push({...npc,x,y});
  }
  if(parcel){
   const center=parcel.body.left+parcel.body.width/2,visible=center>=view.left&&center<=view.right,x=visible?clampX(parcel):0,left=parcel.left+x;
   const obstacles=[...scenery,...placements.map(p=>({left:p.left+p.x,right:p.left+p.x+p.width,top:p.top+p.y,bottom:p.top+p.y+p.height}))];
   const crowded=top=>visible&&obstacles.some(r=>left<r.right+4&&left+parcel.width>r.left-4&&top<r.bottom+4&&top+parcel.height>r.top-4);
   let top=parcel.top;
   if(crowded(top)){top=Math.min(playerBody.top,parcel.body.top)-8-parcel.height;for(let tries=0;tries<4&&crowded(top)&&top-parcel.height-6>=view.top+6;tries++)top-=parcel.height+6}
   placements.push({...parcel,x,y:top-parcel.top});
  }
  // All geometry reads precede writes. Only changed offsets touch the DOM.
  for(const {label,x,y}of placements){const old=offsets.get(label);if(old?.x===x&&old?.y===y)continue;label.style.setProperty('--campus-name-x',x+'px');label.style.setProperty('--campus-name-y',y+'px');offsets.set(label,{x,y})}
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(layout)}
 hub.ownerDocument.fonts?.ready.then(schedule);
 return {schedule};
}
