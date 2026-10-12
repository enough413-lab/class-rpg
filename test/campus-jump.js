// A cosmetic jump shares the existing ground and horizontal walking coordinates.
export function installCampusJump({hub,getStudent,getScene}){
 const doc=hub.ownerDocument,player=doc.getElementById('hubPlayer'),button=hub.querySelector('[data-campus="jump"]');
 let animations=[],frame=0,owner=null,scene=null,heldObserver=null;
 const blocked=()=>hub.classList.contains('hidden')||doc.hidden||player.classList.contains('cafeteria-eating')||doc.querySelector('dialog[open],.modal-backdrop:not(.hidden):not(#schoolExplorerModal),.reward-notice-backdrop');
 function cancel(){cancelAnimationFrame(frame);frame=0;heldObserver?.disconnect();heldObserver=null;const previous=animations;animations=[];previous.forEach(a=>a.cancel());delete player.dataset.jumping;delete player.dataset.jumpPhase}
 function jump(){
  if(blocked()||animations.length)return false;
  const rig=player.querySelector('.campus-rig');if(!rig)return false;
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
  const linked=new Map(),heldSelector='.cafeteria-held-tray:not([hidden]),.parcel-held:not([hidden]),.momo-held:not([hidden])';
  function attach(el){const a=el.animate(lift,options),base=animations[0];if(base.startTime!==null)a.startTime=base.startTime;else a.currentTime=base.currentTime;if(base.playState==='paused'){a.pause();a.currentTime=base.currentTime}linked.set(el,a);animations.push(a)}
  function syncHeld(){
   const visible=new Set(player.querySelectorAll(heldSelector));
   for(const [el,a]of linked)if(!el.isConnected||el.matches('.cafeteria-held-tray,.parcel-held,.momo-held')&&!visible.has(el)){a.cancel();linked.delete(el);animations=animations.filter(x=>x!==a)}
   for(const el of visible)if(!linked.has(el))attach(el);
  }
  const name=player.querySelector('.campus-player-name');if(name)attach(name);syncHeld();
  heldObserver=new MutationObserver(syncHeld);heldObserver.observe(player,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  for(const [selector,sign] of [['.campus-leg-left',1],['.campus-leg-right',-1]]){
   const leg=rig.querySelector(selector);if(leg)animations.push(leg.animate(samples.map(p=>({offset:p.offset,transform:'translateY('+(-3*p.tuck)+'px) rotate('+(sign*8*p.tuck)+'deg)'})),options));
  }
  const upper=rig.querySelector('.campus-upper');if(upper)animations.push(upper.animate(samples.map(p=>({offset:p.offset,transform:'rotate('+(-1.5*p.tuck)+'deg)'})),options));
  animations.push(shadow.animate(samples.map(p=>{const altitude=Math.max(0,-p.y)/height;return{offset:p.offset,opacity:.27-.13*altitude,scale:String(1-.3*altitude)}}),options));
  const landing=animations[0];landing.onfinish=cancel;const start=performance.now(),end=start+duration;
  function check(){const now=performance.now();if(now>=end||blocked()||owner!==getStudent()?.id||scene!==getScene()||!rig.isConnected){cancel();return}const t=(now-start)/duration,phase=t<.12?'prepare':t<.84?'air':'land';if(player.dataset.jumpPhase!==phase)player.dataset.jumpPhase=phase;frame=requestAnimationFrame(check)}check();return true;
 }
 button.addEventListener('click',jump);
 window.addEventListener('keydown',e=>{
  if(e.code!=='Space'||e.altKey||e.ctrlKey||e.metaKey||blocked())return;
  const active=doc.activeElement;
  if(active?.matches('input,textarea,select,[contenteditable]')||active?.closest('button,a,summary')&&!active.matches('[data-move],[data-campus="jump"]'))return;
  e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)jump();
 },true);
 for(const name of ['blur','pagehide'])window.addEventListener(name,cancel);
 doc.addEventListener('visibilitychange',cancel);doc.addEventListener('student-dashboard-updated',()=>{if(owner!==getStudent()?.id)cancel()});
 return {jump,cancel};
}
