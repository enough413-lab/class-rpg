// Separate nearby names without moving a character or running an idle animation.
export function installCampusNameplates({hub,stage,viewport,player,objects}){
 let frame=0;const offsets=new WeakMap(),alertOffsets=new WeakMap();
 function layout(){
  frame=0;if(hub.classList.contains('hidden'))return;
  const name=player.querySelector('.campus-player-name');if(!name)return;
  const view=viewport.getBoundingClientRect(),scene=stage.getBoundingClientRect();if(!view.width)return;
  // The player tag follows the jump, but collision spacing stays on the ground
  // so walking in air does not make neighbouring NPC names bounce around.
  const jumpY=player.dataset.jumping?parseFloat(getComputedStyle(name).translate.split(' ')[1])||0:0;
  const measure=label=>{const r=label.getBoundingClientRect(),old=offsets.get(label)||{x:0,y:0};return {label,left:r.left-old.x,top:r.top-old.y-(label===name?jumpY:0),width:r.width,height:r.height}};
  const alerts=[...objects.querySelectorAll('.campus-quest-sign:not([hidden])')].filter(el=>el.getClientRects().length).map(el=>{const r=el.getBoundingClientRect(),old=alertOffsets.get(el)||0,left=r.left-old;return {el,x:Math.max(view.left+8,Math.min(left,view.right-8-r.width))-left}});
  const own=measure(name),clampX=r=>Math.max(view.left+8,Math.min(r.left,view.right-8-r.width))-r.left;
  const ownX=clampX(own),placements=[{...own,x:ownX,y:0}],bottom=Math.min(view.bottom,scene.bottom)-4;
  const boxes=()=>placements.filter(p=>!p.hidden).map(p=>({left:p.left+p.x,right:p.left+p.x+p.width,top:p.top+p.y,bottom:p.top+p.y+p.height}));
  const overlap=(left,top,r)=>left<r.right+4&&left+current.width>r.left-4&&top<r.bottom+4&&top+current.height>r.top-4;
  const captions=[...objects.querySelectorAll('[data-ground-label]>.campus-object-caption')].filter(el=>el.parentElement.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'||el.dataset.labelCrowded==='true'&&el.parentElement.getClientRects().length).map(el=>({...measure(el),body:el.parentElement.getBoundingClientRect(),resident:el.parentElement.classList.contains('campus-npc'),important:el.parentElement.matches('.is-near,.is-destination,:focus-visible')})).sort((a,b)=>Number(b.resident)-Number(a.resident)||a.body.left-b.body.left);
  let current;
  for(current of captions){const center=current.body.left+current.body.width/2,visible=center>=view.left&&center<=view.right;if(!visible){placements.push({...current,x:0,y:0,hidden:false});continue}
   let x=clampX(current),y=0;const obstacles=boxes();
   for(let row=0;row<captions.length+1;row++){const hits=obstacles.filter(r=>overlap(current.left+x,current.top+y,r));if(!hits.length)break;y=Math.max(...hits.map(r=>r.bottom+4))-current.top}
   if(current.top+y+current.height>bottom){const candidates=obstacles.flatMap(r=>[r.left-current.width-4,r.right+4]).map(left=>Math.max(view.left+8,Math.min(left,view.right-8-current.width))).sort((a,b)=>Math.abs(a-current.left)-Math.abs(b-current.left));const left=candidates.find(left=>!obstacles.some(r=>overlap(left,current.top,r)));if(left!=null){x=left-current.left;y=0}}
   const hidden=current.top+y+current.height>bottom&&!current.resident&&!current.important;placements.push({...current,x,y,hidden});
  }
  // All geometry reads precede writes. Only changed offsets touch the DOM.
  for(const {el,x}of alerts){if(alertOffsets.get(el)===x)continue;el.style.setProperty('--campus-alert-x',x+'px');alertOffsets.set(el,x)}
  for(const {label,x,y,hidden=false}of placements){if(label!==name&&label.dataset.labelCrowded!==String(hidden))label.dataset.labelCrowded=String(hidden);const old=offsets.get(label);if(old?.x===x&&old?.y===y)continue;label.style.setProperty('--campus-name-x',x+'px');label.style.setProperty('--campus-name-y',y+'px');offsets.set(label,{x,y})}
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(layout)}
 hub.ownerDocument.fonts?.ready.then(schedule);
 return {schedule};
}
