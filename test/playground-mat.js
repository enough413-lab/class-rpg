// Direct, unscored body play on the existing mat. No school record or reward.
const POSES=['left','right','bend'],WORDS={left:'왼쪽으로 쭉!',right:'오른쪽으로 쭉!',bend:'무릎을 살짝 굽혀요.'};
const PRINT='<svg viewBox="0 0 70 28" aria-hidden="true"><ellipse cx="24" cy="16" rx="8" ry="11" transform="rotate(-18 24 16)"/><ellipse cx="46" cy="16" rx="8" ry="11" transform="rotate(18 46 16)"/><path d="m22 9 5 2m16 0 5-2"/></svg>';
export function installPlaygroundMat(c){
 const doc=c.hub.ownerDocument,player=doc.getElementById('hubPlayer');
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const help=doc.createElement('p');help.className='mat-help';help.hidden=true;help.setAttribute('role','status');c.hub.querySelector('.hub-help').append(help);
 let owner=null,used=false,storageOk=true,message='',next=0,drag=null,run=null,bound=null,suppressClick=false;
 const key=id=>'classRpgPlaygroundMat_v1_'+id,here=()=>c.getScene()==='playground'&&!c.hub.classList.contains('hidden');
 const prop=()=>here()?c.objects.querySelector('[data-place=look-0]'):null,near=()=>here()&&c.walk.nearby()?.kind==='look-0';
 const reachable=()=>owner!=null&&here()&&Math.abs(c.getPosition().x-27)<=1&&!player.hasAttribute('data-jumping');
 function release(){const d=drag;drag=null;if(d){suppressClick=true;if(d.el.hasPointerCapture(d.id))d.el.releasePointerCapture(d.id)}}
 function clearPose(){delete player.dataset.matPose;for(const k of ['--mat-lean','--mat-drop','--mat-knee','--mat-hand-x'])player.style.removeProperty(k)}
 function cancel(){if(run){clearTimeout(run.timer);run=null}release();clearPose()}
 function activate(){const id=c.getStudent()?.id;if(owner===id)return;cancel();owner=id;used=false;next=0;storageOk=true;message='';if(id==null)return;try{const s=JSON.parse(localStorage.getItem(key(id))||'null');used=s?.v===1&&s.used===true}catch{storageOk=false}}
 function remember(){used=true;try{localStorage.setItem(key(owner),JSON.stringify({v:1,used:true}));storageOk=true}catch{storageOk=false}}
 function pose(kind,amount=1){
  const a=Math.max(0,Math.min(1,amount)),limit=motion.matches?6:12,lean=(kind==='left'?-limit:kind==='right'?limit:0)*a;
  player.dataset.facing='right';player.dataset.matPose=kind;
  player.style.setProperty('--mat-lean',lean+'deg');player.style.setProperty('--mat-hand-x',lean*.55+'px');
  player.style.setProperty('--mat-drop',(kind==='bend'?player.offsetHeight*.055*a:0)+'px');player.style.setProperty('--mat-knee',(kind==='bend'?18*a:0)+'deg');
  message=WORDS[kind];
 }
 function label(kind){return c.getScene()==='playground'&&kind==='look-0'?'매트에서 몸풀기':null}
 function sync(){
  activate();if((run||drag)&&(!reachable()||Math.abs(c.getPosition().x-(run||drag).x)>.15)){cancel();message='언제든 다시 몸을 풀어도 좋아요.'}
  const b=prop();player.classList.toggle('mat-ready',reachable());help.hidden=!near();const text=(message||'매트를 좌우·아래로 쓸어 봐요. 몸풀기 버튼으로도 할 수 있어요.')+(storageOk?'':' 이 기기에 저장하지 못했어요.');if(help.textContent!==text)help.textContent=text;
  if(!b)return;bind(b);b.classList.toggle('mat-used',used);b.classList.toggle('mat-reached',reachable());
  b.setAttribute('aria-label','준비운동 자리 · 매트를 쓸거나 눌러 몸풀기');b.dataset.action='매트에서 몸풀기';const hint=b.querySelector('.campus-object-action');if(hint&&hint.textContent!=='매트에서 몸풀기')hint.textContent='매트에서 몸풀기';
 }
 function arrive(){if(reachable())return true;if(player.hasAttribute('data-jumping')){message='내려오면 매트에서 몸을 풀어요.';sync();return false}c.walk.goTo('look-0');message='매트에 도착하면 몸풀기를 눌러 봐요.';sync();return false}
 function finish(expected){if(run!==expected)return;run=null;clearPose();if(expected.owner!==c.getStudent()?.id||!reachable())return;remember();message='몸이 가벼워졌어! 다른 방향으로도 움직여 봐요.';sync();c.refresh()}
 function interact(kind){
  if(c.getScene()!=='playground'||kind!=='look-0')return false;activate();c.stop();if(!arrive())return true;if(run||drag)return true;
  pose(POSES[next++%POSES.length]);const expected={owner,x:c.getPosition().x,timer:0};run=expected;
  expected.timer=setTimeout(()=>finish(expected),850);sync();c.refresh();return true;
 }
 function bind(b){
  if(bound===b)return;bound=b;const print=doc.createElement('span');print.className='mat-footprints';print.innerHTML=PRINT;print.title='여기서 몸을 풀었어요';b.append(print);
  // Capture consumes the drag's compatibility click before generic world navigation.
  b.addEventListener('click',e=>{if(suppressClick&&e.detail!==0){suppressClick=false;e.preventDefault();e.stopImmediatePropagation()}},true);
  b.addEventListener('pointerdown',e=>{suppressClick=false;activate();if(e.button!==0||!e.isPrimary||!reachable())return;c.stop();cancel();drag={id:e.pointerId,el:b,owner,x:c.getPosition().x,px:e.clientX,py:e.clientY,moved:false};b.setPointerCapture(e.pointerId)});
  b.addEventListener('pointermove',e=>{
   const d=drag;if(!d||d.id!==e.pointerId)return;if(d.owner!==c.getStudent()?.id||!reachable()){cancel();return}
   const dx=e.clientX-d.px,dy=e.clientY-d.py,amount=Math.max(Math.abs(dx),Math.max(0,dy));if(amount<5)return;
   e.preventDefault();d.moved=true;d.enough=amount>=18;pose(dy>Math.abs(dx)?'bend':dx<0?'left':'right',amount/38);sync();
  });
  b.addEventListener('pointerup',e=>{const d=drag;if(!d||d.id!==e.pointerId)return;release();clearPose();if(d.moved){suppressClick=true;if(d.enough&&d.owner===c.getStudent()?.id&&reachable()){remember();message='쭉쭉! 내 움직임을 따라 몸을 풀었어요.'}else message='조금 더 길게 쓸어 봐요.';sync();c.refresh()}else suppressClick=false});
  for(const t of ['pointercancel','lostpointercapture'])b.addEventListener(t,()=>{if(drag){cancel();message='언제든 다시 움직여 봐요.';sync()}});
 }
 new MutationObserver(sync).observe(c.objects,{childList:true});new MutationObserver(()=>{sync();c.refresh()}).observe(player,{attributes:true,attributeFilter:['data-jumping']});
 new MutationObserver(sync).observe(c.hub,{attributes:true,attributeFilter:['class']});
 c.hub.addEventListener('click',e=>{if((run||drag)&&e.target.closest('[data-campus=map],[data-campus=find],[data-route],[data-place=story]')){cancel();message='언제든 다시 움직여 봐요.';sync()}},true);
 doc.addEventListener('student-dashboard-updated',()=>{activate();sync()});
 for(const type of ['blur','pagehide'])window.addEventListener(type,()=>{cancel();sync()});doc.addEventListener('visibilitychange',()=>{if(doc.hidden){cancel();sync()}});
 sync();return{interact,label,sync};
}
