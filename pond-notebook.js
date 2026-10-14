// Personal leaf rubbing on the existing pond desk. No school record or reward writes.
const LEAF='<path d="M55 123Q52 75 94 42L113 39 114 24 135 27 151 12 165 22 194 11 190 29 216 29 207 46 239 49 225 67 239 85 218 91 221 109 195 112 191 128 166 121 152 133 127 119 108 127 93 113 72 130Z"/><path d="M51 132Q117 100 201 39M85 115 83 70m25 33-5-48m27 35-1-52m26 37 3-43m-49 71 56 5m-33-19 57 6m-35-21 55 7" fill="none" stroke="#47634f" stroke-width="2.5" stroke-linecap="round"/>';
const COLS=28,ROWS=14;
export function installPondNotebook(c){
 const doc=c.hub.ownerDocument,player=doc.getElementById('hubPlayer'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const paper=doc.createElement('div');paper.className='pond-paper';paper.hidden=true;paper.setAttribute('role','group');paper.setAttribute('aria-label','연못 노트 위 잎 무늬 종이');
 paper.innerHTML='<span class="notebook-paper-title">나의 잎 무늬</span><div class="notebook-rubbing" role="img" aria-label="문지르면 잎 무늬가 드러나는 종이"><svg viewBox="0 0 280 140" aria-hidden="true"><defs><mask id="pondRubbingMask" maskUnits="userSpaceOnUse" x="0" y="0" width="280" height="140"><path class="notebook-marks" fill="white"/></mask><pattern id="pondRubbingGrain" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".6" fill="#f9f0d6"/></pattern></defs><g class="notebook-emboss">'+LEAF+'</g><g mask="url(#pondRubbingMask)"><g class="notebook-leaf">'+LEAF+'</g><path d="M0 0H280V140H0Z" fill="url(#pondRubbingGrain)"/></g></svg><span class="notebook-crayon" aria-hidden="true"></span></div>';
 c.stage.parentElement.append(paper);
 const surface=paper.querySelector('.notebook-rubbing'),mask=paper.querySelector('.notebook-marks'),crayon=paper.querySelector('.notebook-crayon');
 const help=doc.createElement('div');help.className='notebook-help';help.hidden=true;
 const status=doc.createElement('span');status.setAttribute('role','status');
 const rub=doc.createElement('button');rub.type='button';rub.className='notebook-rub';rub.textContent='연필로 한 줄';
 const undo=doc.createElement('button');undo.type='button';undo.className='notebook-undo';undo.textContent='되돌리기';
 help.append(status,rub,undo);c.hub.querySelector('.hub-help').append(help);
 let owner=null,cells=new Set(),previous=null,storageOk=true,message='',active=null,drag=null,run=null,row=0;
 const key=id=>'classRpgPondNotebook_v1_'+id,here=()=>c.getScene()==='pond'&&!c.hub.classList.contains('hidden'),near=()=>here()&&c.walk.nearby()?.kind==='look-2';
 const prop=()=>here()?c.objects.querySelector('[data-place=look-2]'):null;
 const available=()=>owner!=null&&here()&&!player.hasAttribute('data-jumping')&&!doc.querySelector('dialog[open]');
 const valid=()=>active&&available()&&owner===active.owner&&owner===c.getStudent()?.id&&active.el.isConnected&&Math.abs(c.getPosition().x-active.at)<.1;
 function release(){const d=drag;drag=null;if(d&&surface.hasPointerCapture(d.id))surface.releasePointerCapture(d.id)}
 function stopRub(){const old=run;run=null;old?.animation.cancel();release();crayon.hidden=true;paper.classList.remove('is-rubbing');paint(cells)}
 function close(){stopRub();active?.el.classList.remove('notebook-open');active=null;previous=null;paper.hidden=true}
 function activate(){
  const id=c.getStudent()?.id;if(id===owner)return;close();owner=id;cells=new Set();previous=null;row=0;storageOk=true;message='';
  if(id==null)return;
  try{const s=JSON.parse(localStorage.getItem(key(id))||'null');if(s?.v===1&&Array.isArray(s.cells)&&s.cells.length<=COLS*ROWS&&s.cells.every(n=>Number.isInteger(n)&&n>=0&&n<COLS*ROWS))cells=new Set(s.cells)}catch{storageOk=false}
 }
 const ink=set=>[...set].map(n=>'M'+(n%COLS*10)+' '+(Math.floor(n/COLS)*10)+'h10v10h-10Z').join('');
 function paint(set){mask.setAttribute('d',ink(set))}
 function mark(set,x,y){for(let r=Math.max(0,Math.floor((y-19)/10));r<Math.min(ROWS,Math.ceil((y+19)/10));r++)for(let col=Math.max(0,Math.floor((x-19)/10));col<Math.min(COLS,Math.ceil((x+19)/10));col++)if(Math.hypot(col*10+5-x,r*10+5-y)<22)set.add(r*COLS+col)}
 function line(set,a,b){const count=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/5));for(let i=0;i<=count;i++)mark(set,a.x+(b.x-a.x)*i/count,a.y+(b.y-a.y)*i/count)}
 function tool(p){crayon.hidden=false;crayon.style.left=p.x/280*100+'%';crayon.style.top=p.y/140*100+'%'}
 function save(){if(!valid())return;try{localStorage.setItem(key(owner),JSON.stringify({v:1,cells:[...cells].sort((a,b)=>a-b)}));storageOk=true}catch{storageOk=false}}
 function commit(next){if(!valid())return;previous=new Set(cells);cells=next;save();message='잎 무늬가 남았어요. 더 문질러도 좋아요.';paint(cells);sync();c.refresh()}
 function label(kind){return c.getScene()==='pond'&&kind==='look-2'?(active?'종이 내려놓기':'잎 무늬 문지르기'):null}
 function sync(){
  activate();if(active&&!valid()){close();message='남긴 무늬는 다음에 이어 봐요.'}
  help.hidden=!near();paper.hidden=!active;rub.hidden=undo.hidden=!active;rub.disabled=!!run||!!drag;undo.disabled=!previous||!!run||!!drag;
  const text=(message||(cells.size?'노트에 내 잎 무늬가 남아 있어요.':'종이 위를 문질러 잎 무늬를 찾아봐요.'))+(storageOk?'':' 이 기기에 저장하지 못했어요.');if(status.textContent!==text)status.textContent=text;
  const el=prop();if(!el)return;
  let tag=el.querySelector('.notebook-memory');if(!tag){tag=doc.createElement('span');tag.className='notebook-memory';tag.setAttribute('aria-hidden','true');tag.innerHTML='<svg viewBox="0 0 280 140"><defs><mask id="pondNotebookTagMask" maskUnits="userSpaceOnUse" x="0" y="0" width="280" height="140"><path class="notebook-mini-marks" fill="white"/></mask></defs><g mask="url(#pondNotebookTagMask)">'+LEAF+'</g></svg>';el.append(tag)}
  const mini=tag.querySelector('.notebook-mini-marks'),drawn=ink(cells);if(mini.getAttribute('d')!==drawn)mini.setAttribute('d',drawn);
  el.classList.toggle('notebook-remembered',cells.size>0);const action=label('look-2');el.dataset.action=action;el.setAttribute('aria-label','질문 노트 · '+action+(cells.size?' · 내가 남긴 잎 무늬':''));const hint=el.querySelector('.campus-object-action');if(hint.textContent!==action)hint.textContent=action;
 }
 function start(el){close();c.stop();active={owner,el,at:c.getPosition().x};el.classList.add('notebook-open');message='종이를 좌우로 문질러 봐요.';paint(cells);sync();c.refresh()}
 function interact(kind){if(c.getScene()!=='pond'||kind!=='look-2')return false;activate();c.stop();if(!available())return true;if(!near()){c.walk.goTo(kind);message='노트 곁으로 걸어가요.';sync();return true}if(active){close();message=cells.size?'내 잎 무늬를 노트에 끼워 두었어요.':'종이를 살며시 내려놓았어요.';sync();c.refresh()}else{sync();const el=prop();if(el)start(el)}return true}
 const point=e=>{const r=surface.getBoundingClientRect();return{x:Math.max(0,Math.min(280,(e.clientX-r.left)/r.width*280)),y:Math.max(0,Math.min(140,(e.clientY-r.top)/r.height*140))}};
 surface.addEventListener('pointerdown',e=>{activate();if(!valid()||e.button!==0||!e.isPrimary)return;e.preventDefault();c.stop();stopRub();const p=point(e);drag={id:e.pointerId,owner,active,first:p,last:p,length:0,next:new Set(cells)};surface.setPointerCapture(e.pointerId);tool(p);paper.classList.add('is-rubbing');sync()});
 surface.addEventListener('pointermove',e=>{const d=drag;if(!d||d.id!==e.pointerId)return;if(!valid()||d.owner!==owner){close();sync();return}e.preventDefault();const p=point(e);d.length+=Math.hypot(p.x-d.last.x,p.y-d.last.y);line(d.next,d.last,p);d.last=p;tool(p);paint(d.next)});
 surface.addEventListener('pointerup',e=>{const d=drag;if(!d||d.id!==e.pointerId)return;release();crayon.hidden=true;paper.classList.remove('is-rubbing');if(valid()&&d.active===active&&d.owner===owner&&d.length>=16)commit(d.next);else{paint(cells);sync()}});
 for(const type of ['pointercancel','lostpointercapture'])surface.addEventListener(type,()=>{if(drag){stopRub();sync()}});
 rub.onclick=()=>{
  activate();if(!valid()||run||drag)return;c.stop();const a={x:45,y:30+row%3*40},b={x:240,y:a.y},next=new Set(cells);line(next,a,b);tool(a);paper.classList.add('is-rubbing');
  const animation=crayon.animate(reduce.matches?[{opacity:1},{opacity:1}]:[{left:a.x/280*100+'%'},{left:b.x/280*100+'%'}],{duration:reduce.matches?100:500,easing:'ease-in-out'}),expected={owner,active,animation};run=expected;sync();
  animation.finished.then(()=>{if(run!==expected)return;run=null;crayon.hidden=true;paper.classList.remove('is-rubbing');if(valid()&&active===expected.active&&owner===expected.owner){row++;commit(next)}}).catch(()=>{});
 };
 undo.onclick=()=>{activate();if(!valid()||!previous||run||drag)return;cells=previous;previous=null;save();paint(cells);message='마지막 문지름을 되돌렸어요.';sync();c.refresh()};
 function pause(){close();sync();c.refresh()}
 new MutationObserver(sync).observe(c.objects,{childList:true});new MutationObserver(sync).observe(c.hub,{attributes:true,attributeFilter:['class']});new MutationObserver(()=>{sync();c.refresh()}).observe(player,{attributes:true,attributeFilter:['data-jumping']});new ResizeObserver(pause).observe(c.stage);
 doc.addEventListener('student-dashboard-updated',sync);for(const type of ['blur','pagehide'])window.addEventListener(type,pause);doc.addEventListener('visibilitychange',()=>{if(doc.hidden)pause()});c.hub.addEventListener('click',e=>{if(e.target.closest('[data-campus=map],[data-campus=find],[data-route],[data-place=story]'))pause()},true);
 crayon.hidden=true;sync();return{interact,label,sync};
}
