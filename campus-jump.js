// The original jump arc can also land on an optional room terrain adapter.
export function installCampusJump({hub,getStudent,getScene,getTerrain=()=>null,onMealJumpBlocked=()=>{}}){
 const doc=hub.ownerDocument,player=doc.getElementById('hubPlayer'),button=hub.querySelector('[data-campus="jump"]');
 let animations=[],frame=0,owner=null,scene=null,heldObserver=null,terrain=null,heldSpace=false,repeatFrame=0;
 const unavailable=()=>hub.classList.contains('hidden')||doc.hidden||doc.querySelector('dialog[open],.modal-backdrop:not(.hidden):not(#schoolExplorerModal),.reward-notice-backdrop');
 const blocked=()=>unavailable()||player.classList.contains('cafeteria-eating');
 function cancel(completed=false){cancelAnimationFrame(repeatFrame);repeatFrame=0;if(completed!==true)heldSpace=false;cancelAnimationFrame(frame);frame=0;heldObserver?.disconnect();heldObserver=null;const previous=animations;animations=[];previous.forEach(a=>a.cancel());delete player.dataset.jumping;delete player.dataset.jumpPhase;const current=terrain;terrain=null;current?.end(completed===true);if(completed===true&&heldSpace)repeatFrame=requestAnimationFrame(()=>{repeatFrame=0;if(heldSpace&&!blocked()&&owner===getStudent()?.id&&scene===getScene())jump();else heldSpace=false})}
 function jump(){
  if(unavailable()||animations.length)return false;
  if(player.classList.contains('cafeteria-eating')){onMealJumpBlocked();return false}
  const rig=player.querySelector('.campus-rig');if(!rig)return false;
  const ground=getTerrain();if(ground?.takeoff()===false)return false;terrain=ground;
  owner=getStudent()?.id;scene=getScene();player.dataset.jumping='true';
  let shadow=player.querySelector('.campus-jump-shadow');if(!shadow){shadow=doc.createElement('span');shadow.className='campus-jump-shadow';shadow.setAttribute('aria-hidden','true');player.append(shadow)}
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,height=reduce?12:44,duration=reduce?360:560;
  // A brief crouch, a sampled ballistic arc, then a soft landing. Horizontal
  // facing stays on transform; independent translate/scale never overwrite it.
  const samples=[{offset:0,y:0,sx:1,sy:1,tuck:0},{offset:.12,y:reduce?1:3,sx:reduce?1:1.025,sy:reduce?1:.955,tuck:reduce?0:.35}];
  for(let i=0;i<=24;i++){const u=i/24,recover=1-Math.min(1,u*8);samples.push({offset:.12+.72*u,y:(reduce?1:3)*(1-u)-4*height*u*(1-u),sx:reduce?1:1+.025*recover,sy:reduce?1:1-.045*recover,tuck:reduce?0:Math.max(.35*recover,Math.sin(Math.PI*u))})}
  samples.push({offset:.89,y:reduce?1:3,sx:reduce?1:1.03,sy:reduce?1:.95,tuck:reduce?0:.35},{offset:1,y:0,sx:1,sy:1,tuck:0});
  const options={duration,easing:'linear'},lift=samples.map(p=>({offset:p.offset,translate:'0 '+p.y+'px'}));
  animations=[rig.animate(samples.map(p=>({offset:p.offset,translate:'0 '+p.y+'px',scale:p.sx+' '+p.sy})),options)];
  const linked=new Map(),heldSelector='.cafeteria-held-tray:not([hidden]),.parcel-held:not([hidden]),.momo-held:not([hidden]),.trio-held:not([hidden])';
  function attach(el){const a=el.animate(lift,options),base=animations[0];if(base.startTime!==null)a.startTime=base.startTime;else a.currentTime=base.currentTime;if(base.playState==='paused'){a.pause();a.currentTime=base.currentTime}linked.set(el,a);animations.push(a)}
  function syncHeld(){
   const visible=new Set(player.querySelectorAll(heldSelector));
   for(const [el,a]of linked)if(!el.isConnected||el.matches('.cafeteria-held-tray,.parcel-held,.momo-held,.trio-held')&&!visible.has(el)){a.cancel();linked.delete(el);animations=animations.filter(x=>x!==a)}
   for(const el of visible)if(!linked.has(el))attach(el);
  }
  const name=player.querySelector('.campus-player-name');if(name)attach(name);syncHeld();
  heldObserver=new MutationObserver(syncHeld);heldObserver.observe(player,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  for(const [selector,sign] of [['.campus-leg-left',1],['.campus-leg-right',-1]]){
   const leg=rig.querySelector(selector);if(leg)animations.push(leg.animate(samples.map(p=>({offset:p.offset,transform:'translateY('+(-3*p.tuck)+'px) rotate('+(sign*8*p.tuck)+'deg)'})),options));
  }
  const upper=rig.querySelector('.campus-upper');if(upper)animations.push(upper.animate(samples.map(p=>({offset:p.offset,transform:'rotate('+(-1.5*p.tuck)+'deg)'})),options));
  animations.push(shadow.animate(samples.map(p=>{const altitude=Math.max(0,-p.y)/height;return{offset:p.offset,opacity:.27-.13*altitude,scale:String(1-.3*altitude)}}),options));
  const landing=animations[0];landing.onfinish=()=>{terrain?.frame(0);cancel(true)};const start=performance.now(),end=start+duration;
  function check(){const now=performance.now();if(blocked()||owner!==getStudent()?.id||scene!==getScene()||!rig.isConnected){cancel();return}if(now>=end){terrain?.frame(0);cancel(true);return}const t=Math.min(1,Math.max(0,Number(landing.currentTime??now-start)/duration)),phase=t<.12?'prepare':t<.84?'air':'land';let a=samples[0],b=samples.at(-1);for(let i=1;i<samples.length;i++){b=samples[i];if(b.offset>=t)break;a=b}const u=(t-a.offset)/Math.max(.0001,b.offset-a.offset);terrain?.frame(-(a.y+(b.y-a.y)*u));if(player.dataset.jumpPhase!==phase)player.dataset.jumpPhase=phase;frame=requestAnimationFrame(check)}check();return true;
 }
 button.addEventListener('click',jump);
 // A second touch does not synthesize a click while the movement finger stays down.
 button.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&!e.isPrimary){e.preventDefault();jump()}});
 window.addEventListener('keydown',e=>{
  if(e.code!=='Space'||e.altKey||e.ctrlKey||e.metaKey||hub.classList.contains('hidden'))return;
  const active=doc.activeElement;
  if(active?.matches('input,textarea,select,[contenteditable]'))return;
  e.preventDefault();e.stopImmediatePropagation();if(unavailable()){heldSpace=false;return}if(!e.repeat){heldSpace=true;jump();}
 },true);
 window.addEventListener('keyup',e=>{if(e.code!=='Space')return;heldSpace=false;cancelAnimationFrame(repeatFrame);repeatFrame=0;if(!hub.classList.contains('hidden')&&!doc.activeElement?.matches('input,textarea,select,[contenteditable]')){e.preventDefault();e.stopImmediatePropagation()}},true);
 for(const name of ['blur','pagehide'])window.addEventListener(name,cancel);
 doc.addEventListener('visibilitychange',cancel);doc.addEventListener('student-dashboard-updated',()=>{if(owner!==getStudent()?.id)cancel()});
 return {jump,cancel};
}
