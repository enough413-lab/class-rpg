// A personal, optional close-up of the existing fence. No school record/reward writes.
const FINDS=[
 {x:22,name:'동그란 집을 진 달팽이',svg:'<path d="M5 26h28q7 0 9-8m-3 4 1-9m1 1 4-3" fill="none" stroke="#638270" stroke-width="4" stroke-linecap="round"/><circle cx="21" cy="19" r="11" fill="#e0b775" stroke="#866443" stroke-width="2"/><path d="M24 23c-11 5-13-10-5-10 7 0 5 8 1 6" fill="none" stroke="#a57b48" stroke-width="2"/>'},
 {x:50,name:'점박이 무당벌레',svg:'<path d="m12 17-7-3m7 9-7 3m28-9 7-3m-7 9 7 3" stroke="#655c47" stroke-width="2"/><ellipse cx="22" cy="22" rx="13" ry="12" fill="#c77760" stroke="#765740" stroke-width="2"/><circle cx="22" cy="10" r="6" fill="#625f4b"/><path d="M22 15v17m-3-27-2-3m8 3 2-3" stroke="#655c47" stroke-width="2"/><g fill="#655c47"><circle cx="15" cy="19" r="2.5"/><circle cx="29" cy="19" r="2.5"/><circle cx="16" cy="27" r="2"/><circle cx="28" cy="27" r="2"/></g>'},
 {x:77,name:'잎 아래 쉬는 작은 나방',svg:'<path d="M22 18Q1 0 4 20q2 12 18 3Q42 35 41 17 38 1 22 18" fill="#d8d7a0" stroke="#81866a" stroke-width="2"/><path d="m9 17 8 4m18-6-7 6M22 11v16m0-15-4-6m4 6 4-6" fill="none" stroke="#74795b" stroke-width="2" stroke-linecap="round"/>'}
];
const field=()=>FINDS.map((f,i)=>'<span class="fence-creature creature-'+i+'" style="left:'+f.x+'%"><svg viewBox="0 0 46 38" aria-hidden="true">'+f.svg+'</svg></span>').join('');
export function installPondFence(c){
 const doc=c.hub.ownerDocument,player=doc.getElementById('hubPlayer');
 const help=doc.createElement('div');help.className='fence-help';help.hidden=true;
 const status=doc.createElement('span');status.setAttribute('role','status');
 const previous=doc.createElement('button'),next=doc.createElement('button');
 for(const b of [previous,next])b.type='button';previous.className='fence-previous';next.className='fence-next';previous.textContent='← 살피기';next.textContent='살피기 →';previous.setAttribute('aria-label','왼쪽 살펴보기');next.setAttribute('aria-label','오른쪽 살펴보기');
 help.append(status,previous,next);c.hub.querySelector('.hub-help').append(help);
 let owner=null,found=[],storageOk=true,view=null,drag=null,message='',suppressClick=false;
 const key=id=>'classRpgPondFence_v1_'+id,here=()=>c.getScene()==='pond'&&!c.hub.classList.contains('hidden');
 const prop=()=>here()?c.objects.querySelector('[data-place=look-0]'):null;
 const near=()=>here()&&c.walk.nearby()?.kind==='look-0';
 const available=()=>owner!=null&&here()&&!player.hasAttribute('data-jumping')&&!doc.querySelector('dialog[open]');
 function release(){const d=drag;drag=null;if(d){suppressClick=true;if(d.el.hasPointerCapture(d.id))d.el.releasePointerCapture(d.id)}}
 function close(){release();view?.el.classList.remove('fence-looking');view=null}
 function activate(){const id=c.getStudent()?.id;if(id===owner)return;close();owner=id;found=[];message='';storageOk=true;if(id==null)return;try{const s=JSON.parse(localStorage.getItem(key(id))||'null');if(s?.v===1&&Array.isArray(s.found))found=[...new Set(s.found.filter(i=>Number.isInteger(i)&&i>=0&&i<FINDS.length))]}catch{storageOk=false}}
 function valid(){return view&&available()&&owner===view.owner&&owner===c.getStudent()?.id&&view.el.isConnected&&Math.abs(c.getPosition().x-view.at)<.1}
 function label(kind){return c.getScene()==='pond'&&kind==='look-0'?(view?'돋보기 내려놓기':'돋보기로 살펴보기'):null}
 function draw(){if(!view)return;const {el,x}=view,lens=el.querySelector('.fence-lens'),zoom=el.querySelector('.fence-zoom');lens.style.left=x+'%';const scale=2.6,size=lens.clientWidth;zoom.style.width=el.clientWidth*scale+'px';zoom.style.height=el.clientHeight*scale+'px';zoom.style.left=size/2-x/100*el.clientWidth*scale+'px';zoom.style.top=size/2-.38*el.clientHeight*scale+'px'}
 function remember(){
  if(!valid())return;const i=FINDS.findIndex(f=>Math.abs(f.x-view.x)<8);
  if(i<0){message='돋보기를 옆으로 움직여 볼까요?';return}
  if(!found.includes(i))found.push(i);
  try{localStorage.setItem(key(owner),JSON.stringify({v:1,found:[...found].sort()}));storageOk=true}catch{storageOk=false}
  message=FINDS[i].name+'! 조용히 구경해요.';
 }
 function sync(){
  activate();if(view&&!valid()){close();message='돋보기를 내려놓았어요.'}
  help.hidden=!near();previous.hidden=next.hidden=!view;
  const text=(message||'울타리에 누가 숨어 있을까요?')+(storageOk?'':' 이 기기에 저장하지 못했어요.');if(status.textContent!==text)status.textContent=text;
  const el=prop();if(!el)return;
  if(!el.querySelector('.fence-details')){const art=doc.createElement('span');art.className='fence-details';art.setAttribute('aria-hidden','true');art.innerHTML=field()+'<span class="fence-lens"><span class="fence-zoom">'+field()+'</span></span><span class="fence-found"></span>';el.append(art);bind(el)}
  const marks=el.querySelector('.fence-found'),memory=found.map(i=>FINDS[i].name).join(', ');if(marks.dataset.memory!==memory){marks.dataset.memory=memory;marks.innerHTML=found.map(i=>'<i title="'+FINDS[i].name+'"><svg viewBox="0 0 46 38">'+FINDS[i].svg+'</svg></i>').join('');marks.hidden=!found.length;}
  const action=label('look-0');el.dataset.action=action;el.setAttribute('aria-label','관찰 울타리 · '+action+(memory?' · 발견한 이웃: '+memory:''));const hint=el.querySelector('.campus-object-action');if(hint.textContent!==action)hint.textContent=action;
 }
 function start(el){close();c.stop();view={el,owner,at:c.getPosition().x,x:8};el.classList.add('fence-looking');message='돋보기를 좌우로 밀어 봐요. 버튼으로도 살펴봐요.';draw();sync();c.refresh()}
 function step(direction){activate();if(!valid()){close();sync();return}release();const options=direction>0?FINDS:[...FINDS].reverse(),f=options.find(f=>direction>0?f.x>view.x+1:f.x<view.x-1)||options[0];view.x=f.x;draw();remember();sync();c.refresh()}
 function bind(el){
  el.addEventListener('click',e=>{if(suppressClick&&e.detail!==0){suppressClick=false;e.preventDefault();e.stopImmediatePropagation()}},true);
  el.addEventListener('pointerdown',e=>{suppressClick=false;activate();if(!view||!valid()||e.button!==0||!e.isPrimary)return;c.stop();drag={el,id:e.pointerId,owner,x:e.clientX,rect:el.getBoundingClientRect(),moved:false};el.setPointerCapture(e.pointerId)});
  el.addEventListener('pointermove',e=>{const d=drag;if(!d||e.pointerId!==d.id)return;if(!valid()){close();sync();return}if(Math.abs(e.clientX-d.x)<6&&!d.moved)return;d.moved=true;e.preventDefault();view.x=Math.max(8,Math.min(84,(e.clientX-d.rect.left)/d.rect.width*100));draw()});
  el.addEventListener('pointerup',e=>{const d=drag;if(!d||e.pointerId!==d.id)return;const moved=d.moved;release();if(moved&&d.owner===c.getStudent()?.id){remember();sync();c.refresh()}else suppressClick=false});
  for(const name of ['pointercancel','lostpointercapture'])el.addEventListener(name,()=>{if(drag){release();message='천천히 다시 살펴도 괜찮아요.';sync()}});
 }
 function interact(kind){
  if(c.getScene()!=='pond'||kind!=='look-0')return false;activate();c.stop();
  if(!available())return true;if(!near()){c.walk.goTo(kind);message='울타리 곁으로 걸어가요.';sync();return true}
  if(view){close();message=found.length?'발견한 이웃의 작은 표식이 남았어요.':'언제든 다시 구경해요.';sync();c.refresh()}else{sync();const el=prop();if(el)start(el)}return true;
 }
 previous.onclick=()=>step(-1);next.onclick=()=>step(1);
 function pause(){close();sync();c.refresh()}
 new MutationObserver(sync).observe(c.objects,{childList:true});new MutationObserver(sync).observe(c.hub,{attributes:true,attributeFilter:['class']});new MutationObserver(()=>{sync();c.refresh()}).observe(player,{attributes:true,attributeFilter:['data-jumping']});
 new ResizeObserver(pause).observe(c.stage);doc.addEventListener('student-dashboard-updated',sync);
 for(const name of ['blur','pagehide'])window.addEventListener(name,pause);doc.addEventListener('visibilitychange',()=>{if(doc.hidden)pause()});
 c.hub.addEventListener('click',e=>{if(e.target.closest('[data-campus=map],[data-campus=find],[data-route],[data-place=story]'))pause()},true);
 sync();return{interact,label,sync};
}
