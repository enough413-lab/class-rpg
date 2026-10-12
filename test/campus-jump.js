// A cosmetic jump shares the existing ground and horizontal walking coordinates.
export function installCampusJump({hub,getStudent,getScene}){
 const doc=hub.ownerDocument,player=doc.getElementById('hubPlayer'),button=hub.querySelector('[data-campus="jump"]');
 let animations=[],frame=0,owner=null,scene=null;
 const blocked=()=>hub.classList.contains('hidden')||doc.hidden||player.classList.contains('cafeteria-eating')||doc.querySelector('dialog[open],.modal-backdrop:not(.hidden):not(#schoolExplorerModal),.reward-notice-backdrop');
 function cancel(){cancelAnimationFrame(frame);frame=0;animations.forEach(a=>a.cancel());animations=[];delete player.dataset.jumping}
 function jump(){
  if(blocked()||animations.length)return false;
  const rig=player.querySelector('.campus-rig');if(!rig)return false;
  owner=getStudent()?.id;scene=getScene();player.dataset.jumping='true';
  let shadow=player.querySelector('.campus-jump-shadow');if(!shadow){shadow=doc.createElement('span');shadow.className='campus-jump-shadow';shadow.setAttribute('aria-hidden','true');player.append(shadow)}
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,height=reduce?18:68,duration=reduce?360:620;
  const frames=[{translate:'0 0',offset:0},{translate:'0 -'+height+'px',offset:.5},{translate:'0 0',offset:1}],options={duration,easing:'cubic-bezier(.33,0,.67,1)'};
  animations=[rig,...player.querySelectorAll('.cafeteria-held-tray:not([hidden])')].map(el=>el.animate(frames,options));
  animations.push(shadow.animate([{opacity:.22,scale:'1'},{opacity:.1,scale:'.6'},{opacity:.22,scale:'1'}],options));
  const landing=animations[0];landing.onfinish=cancel;const end=performance.now()+duration;
  function check(){if(performance.now()>=end||blocked()||owner!==getStudent()?.id||scene!==getScene()||!rig.isConnected){cancel();return}frame=requestAnimationFrame(check)}frame=requestAnimationFrame(check);return true;
 }
 button.addEventListener('click',jump);
 window.addEventListener('keydown',e=>{
  if(e.code!=='Space'||e.repeat||e.altKey||e.ctrlKey||e.metaKey||blocked())return;
  const active=doc.activeElement;
  if(active?.matches('input,textarea,select,[contenteditable]')||active?.closest('button,a,summary')&&!active.matches('[data-move],[data-campus="jump"]'))return;
  e.preventDefault();e.stopImmediatePropagation();jump();
 },true);
 for(const name of ['blur','pagehide'])window.addEventListener(name,cancel);
 doc.addEventListener('visibilitychange',cancel);doc.addEventListener('student-dashboard-updated',()=>{if(owner!==getStudent()?.id)cancel()});
 return {jump,cancel};
}
