// A small, personal pond view. School progress, rewards and records stay untouched.
const BIRD='<svg viewBox="0 0 80 64" aria-hidden="true"><path d="M11 43q5-14 23-11l17 1 9-11q8 5 6 14-2 19-24 18-23 1-31-11Z" fill="#f3ebce" stroke="#82744d" stroke-width="2"/><path class="viewer-wing" d="M22 37q17-9 28 4-8 13-23 4Z" fill="#acb98b" stroke="#728364" stroke-width="2"/><path d="M49 33q-1-11 3-15 11-8 20 4l-7 15" fill="#75977b" stroke="#526f5b" stroke-width="2"/><path d="m67 24 11 4-12 4" fill="#dca75f" stroke="#957643" stroke-width="2"/><circle cx="64" cy="22" r="2" fill="#354e42"/></svg>';
export function installPondViewer(c){
 const doc=c.hub.ownerDocument,player=doc.getElementById('hubPlayer'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const view=doc.createElement('div');view.className='pond-view';view.hidden=true;view.setAttribute('role','group');view.setAttribute('aria-label','망원경 속 연못');
 view.innerHTML='<div class="viewer-lens"><div class="viewer-water"><span class="viewer-reeds" aria-hidden="true"></span><span class="viewer-ripples" aria-hidden="true"></span><button type="button" class="viewer-bird" aria-label="연못의 물새 살펴보기">'+BIRD+'</button></div><span class="viewer-glass" aria-hidden="true"></span></div>';
 c.stage.parentElement.append(view);const lens=view.querySelector('.viewer-lens'),water=view.querySelector('.viewer-water'),bird=view.querySelector('.viewer-bird'),ripples=view.querySelector('.viewer-ripples');
 const help=doc.createElement('div');help.className='viewer-help';help.hidden=true;const status=doc.createElement('span');status.setAttribute('role','status');
 const handle=doc.createElement('input');handle.type='range';handle.className='viewer-handle';handle.min=0;handle.max=100;handle.step=5;handle.setAttribute('aria-label','망원경 방향 손잡이');help.append(status,handle);c.hub.querySelector('.hub-help').append(help);
 let owner=null,seen=false,savedPan=0,storageOk=true,active=null,drag=null,response=null,suppressClick=false,message='';
 const key=id=>'classRpgPondViewer_v1_'+id,here=()=>c.getScene()==='pond'&&!c.hub.classList.contains('hidden'),near=()=>here()&&c.walk.nearby()?.kind==='look-1';
 const prop=()=>here()?c.objects.querySelector('[data-place=look-1]'):null;
 const available=()=>owner!=null&&here()&&!player.hasAttribute('data-jumping')&&!doc.querySelector('dialog[open]');
 function stopResponse(){const old=response;response=null;old?.animations.forEach(a=>a.cancel());bird.classList.remove('viewer-greeting')}
 function release(){const d=drag;drag=null;if(d){suppressClick=d.moved;if(d.capture.hasPointerCapture(d.id))d.capture.releasePointerCapture(d.id)}}
 function close(){stopResponse();release();if(active){active.el.classList.remove('viewer-looking');active.el.style.removeProperty('--viewer-turn')}active=null;view.hidden=true;handle.hidden=true;bird.disabled=true}
 function activate(){const id=c.getStudent()?.id;if(id===owner)return;close();owner=id;seen=false;savedPan=0;storageOk=true;message='';if(id==null)return;try{const s=JSON.parse(localStorage.getItem(key(id))||'null');if(s?.v===1&&s.seen===true){seen=true;savedPan=Number.isFinite(s.pan)?Math.max(0,Math.min(100,s.pan)):0}}catch{storageOk=false}}
 const valid=()=>active&&available()&&owner===active.owner&&owner===c.getStudent()?.id&&active.el.isConnected&&Math.abs(c.getPosition().x-active.at)<.1;
 function label(kind){return c.getScene()==='pond'&&kind==='look-1'?(active?'망원경에서 눈 떼기':'망원경 들여다보기'):null}
 function draw(){
  if(!active)return;const width=lens.clientWidth,offset=(900-width)*active.pan/100;
  water.style.transform='translateX('+(-offset)+'px)';active.el.style.setProperty('--viewer-turn',((active.pan-50)*.16)+'deg');
  const visible=630-offset>=30&&630-offset<=width-30;bird.disabled=!visible;bird.tabIndex=visible?0:-1;
  handle.value=String(active.pan);handle.setAttribute('aria-valuetext',visible?'물새가 보이는 방향':active.pan<50?'연못 왼쪽':'연못 오른쪽');
  if(!response)message=visible?'물새가 보여요! 살짝 눌러 볼까요?':'망원경을 좌우로 쓸거나 아래 손잡이를 움직여요.';
 }
 function setPan(value){if(!valid())return;stopResponse();active.pan=Math.max(0,Math.min(100,value));draw();sync()}
 function sync(){
  activate();if(active&&!valid()){close();message='천천히 다시 둘러봐도 좋아요.'}
  help.hidden=!near();handle.hidden=!active;view.hidden=!active;
  const text=(message||(seen?'전에 만난 물새가 기다리고 있을까요?':'망원경으로 연못을 둘러봐요.'))+(storageOk?'':' 이 기기에 저장하지 못했어요.');if(status.textContent!==text)status.textContent=text;
  const el=prop();if(!el)return;
  if(!el.querySelector('.viewer-head')){const head=doc.createElement('img');head.className='campus-sprite-art viewer-head';head.src='maps/props/pond-viewer-v1.webp';head.alt='';head.draggable=false;head.onerror=()=>{head.hidden=true};const tag=doc.createElement('span');tag.className='viewer-memory';tag.setAttribute('aria-hidden','true');tag.innerHTML=BIRD;el.append(head,tag)}
  el.classList.toggle('viewer-remembered',seen);const action=label('look-1');el.dataset.action=action;el.setAttribute('aria-label','물결 관찰대 · '+action+(seen?' · 물새를 만난 기억':''));const hint=el.querySelector('.campus-object-action');if(hint.textContent!==action)hint.textContent=action;
 }
 function start(el){close();c.stop();active={el,owner,at:c.getPosition().x,pan:savedPan};el.classList.add('viewer-looking');view.hidden=false;draw();sync();c.refresh()}
 function greet(){
  activate();if(!valid()||bird.disabled)return;c.stop();stopResponse();message='물새가 날개를 파닥! 둥근 물결이 퍼져요.';bird.classList.add('viewer-greeting');
  const duration=reduce.matches?120:850,animations=[bird.querySelector('.viewer-wing').animate(reduce.matches?[{opacity:1},{opacity:1}]:[{rotate:'0deg'},{rotate:'-26deg',offset:.25},{rotate:'10deg',offset:.55},{rotate:'0deg'}],{duration}),ripples.animate(reduce.matches?[{opacity:.65},{opacity:0}]:[{scale:'.5',opacity:0},{scale:'.8',opacity:.7,offset:.3},{scale:'1.7',opacity:0}],{duration})];
  const expected={owner,pan:active.pan,active,animations};response=expected;sync();
  animations[0].finished.then(()=>{if(response!==expected)return;stopResponse();if(!valid()||active!==expected.active||owner!==expected.owner)return;seen=true;savedPan=expected.pan;try{localStorage.setItem(key(owner),JSON.stringify({v:1,seen:true,pan:savedPan}));storageOk=true}catch{storageOk=false}message='물새를 만난 기억이 관찰대에 남았어요.';sync();c.refresh()}).catch(()=>{});
 }
 function interact(kind){if(c.getScene()!=='pond'||kind!=='look-1')return false;activate();c.stop();if(!available())return true;if(!near()){c.walk.goTo(kind);message='관찰대 곁으로 걸어가요.';sync();return true}if(active){close();message='연못을 조용히 둘러봤어요.';sync();c.refresh()}else{sync();const el=prop();if(el)start(el)}return true}
 handle.oninput=()=>setPan(Number(handle.value));handle.onpointerdown=()=>c.stop();bird.onclick=greet;
 lens.addEventListener('click',e=>{if(suppressClick&&e.detail!==0){suppressClick=false;e.preventDefault();e.stopImmediatePropagation()}},true);
 lens.addEventListener('pointerdown',e=>{suppressClick=false;activate();if(!valid()||e.button!==0||!e.isPrimary)return;c.stop();const capture=e.target.closest('button')||lens;drag={id:e.pointerId,capture,x:e.clientX,start:active.pan,owner,moved:false};capture.setPointerCapture(e.pointerId)});
 lens.addEventListener('pointermove',e=>{const d=drag;if(!d||d.id!==e.pointerId)return;if(!valid()){close();sync();return}const dx=e.clientX-d.x;if(Math.abs(dx)<6&&!d.moved)return;e.preventDefault();d.moved=true;setPan(d.start-dx/2.3)});
 lens.addEventListener('pointerup',e=>{const d=drag;if(!d||d.id!==e.pointerId)return;release();if(!d.moved&&d.capture===bird&&valid()){suppressClick=true;greet()}});
 for(const type of ['pointercancel','lostpointercapture'])lens.addEventListener(type,()=>{const d=drag;if(!d)return;release();suppressClick=true;if(valid()&&owner===d.owner)setPan(d.start)});
 function pause(){close();sync();c.refresh()}
 new MutationObserver(sync).observe(c.objects,{childList:true});new MutationObserver(sync).observe(c.hub,{attributes:true,attributeFilter:['class']});new MutationObserver(()=>{sync();c.refresh()}).observe(player,{attributes:true,attributeFilter:['data-jumping']});new ResizeObserver(pause).observe(c.stage);
 doc.addEventListener('student-dashboard-updated',sync);for(const type of ['blur','pagehide'])window.addEventListener(type,pause);doc.addEventListener('visibilitychange',()=>{if(doc.hidden)pause()});
 c.hub.addEventListener('click',e=>{if(e.target.closest('[data-campus=map],[data-campus=find],[data-route],[data-place=story]'))pause()},true);
 sync();return{interact,label,sync};
}
