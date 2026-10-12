export const LETTER_MILESTONE={level:19,label:'🌿 햇빛을 찾는 초록 편지',activity:'garden-letter',description:'정원 새싹을 살펴보고 낱말 조각을 옮겨 토리에게 관찰 편지를 전해요.'};
const STEPS=['letter-1','letter-2','letter-3'];
const WORDS={leaf:'🌿 새싹은',light:'☀️ 빛을 향해',grow:'🌱 자라요.'};
const CLUES={leaf:'잎 두 장이 펼쳐져 있어요.',stem:'줄기가 햇빛이 오는 쪽으로 기울어 있어요.',light:'오른쪽 위에서 햇빛이 비쳐요.'};
export function installGardenLetter(c){
 const doc=c.hub.ownerDocument,d=doc.createElement('dialog');d.id='gardenLetterDialog';d.className='parcel-dialog letter-dialog';d.setAttribute('aria-labelledby','letterTitle');doc.body.append(d);
 let owner=null,token=null,done=new Set(),loaded=false,busy=false,task=null,generation=0,view=0,clues=new Set(),words=[null,null,null],selected=null,drag=null,suppressClick=false,opener=null;
 const student=()=>c.getStudent()||{},phase=()=>STEPS.filter(x=>done.has(x)).length,valid=(id,t,g)=>id===student().id&&t===c.getToken()&&g===generation;
 const status=()=>phase()===3?'✓ 초록 편지 · 기억 보기':phase()===2?'완성한 편지 전하기':phase()===1?'새싹 편지 조립하기':'새싹의 비밀 알아보기';
 function refreshTori(){const b=c.guide.querySelector('[data-guide=letter]');if(b)b.querySelector('b').textContent='🌿 '+status();if(c.guide.dataset.inspection==='false'&&c.guide.dataset.parcelStory!=='delivery'&&loaded&&phase()===3)c.guide.querySelector('.campus-greeting p').textContent='네가 전해 준 새싹 편지를 기억해. 작은 줄기까지 자세히 보았지! 오늘도 새롭게 발견한 것이 있니?'}
 function reset(){generation++;view++;owner=student().id;token=c.getToken();done.clear();clues.clear();words=[null,null,null];loaded=false;busy=false;task=null;selected=null;drag=null;if(d.open)d.close();if(c.guide.open)c.guide.close();refreshTori()}
 async function load(){
  if(owner!==student().id||token!==c.getToken())reset();if(loaded)return true;if(task)return task;if(!owner||!token)return false;
  const id=owner,t=token,g=generation;let pending;pending=(async()=>{try{const {data,error}=await c.db.rpc('student_learning_journal',{p_token:t});if(error||!Array.isArray(data?.exploration))throw error||Error('Missing journal');if(!valid(id,t,g))return false;done=new Set(data.exploration);loaded=true;refreshTori();return true}catch{return false}finally{if(task===pending)task=null}})();task=pending;return pending;
 }
 function open(subtitle,html){c.stopMovement();if(!d.open)opener=doc.activeElement;d.innerHTML='<header><div><span>우리 학교 작은 의뢰 · Lv.19</span><h2 id="letterTitle">햇빛을 찾는 초록 편지</h2><p>'+subtitle+'</p></div><button data-letter="close" autofocus>닫기</button></header><div class="parcel-body">'+html+'</div>';if(!d.open)d.showModal();d.scrollTop=0}
 const feedback=()=>'<p id="letterFeedback" class="parcel-feedback" role="status" aria-live="polite"></p>';
 const portrait=text=>'<div class="parcel-tori"><img src="maps/npcs/tori-v1.webp" alt="책지기 토리"><p>'+text+'</p></div>';
 async function start(place='notebook'){
  if(busy)return;if(owner!==student().id||token!==c.getToken())reset();const request=++view;
  open('토리의 관찰 수첩을 펼치고 있어요.','<p>잠시만 기다려 주세요…</p>');const ok=await load();if(request!==view||!d.open)return;
  if(!ok){open('연결을 확인하고 다시 펼쳐 주세요.','<button data-letter="retry">다시 읽기</button>');return}
  if(c.levelInfo(student().xp||0).level<19&&!phase()){open('Lv.19에 시작하는 작은 정원 의뢰',portrait('“정원에서 자라는 작은 친구의 편지를 함께 만들어 볼까? 조금 더 자라면 다시 만나자.”'));return}
  if(phase()===3){finish();return}
  if(place==='garden'&&c.getScene()==='garden'&&phase()<2){if(phase()===0)observe();else compose();return}
  if(place==='tori'&&c.getScene()==='library'&&phase()===2){open('책지기 토리에게 발견을 들려줘요.',portrait('“어디를 향해 자라고 있었니? 네가 살펴본 새싹 이야기를 들려줘!”')+letter()+'<button class="parcel-primary" data-letter="deliver">토리에게 편지 전하기</button>'+feedback());return}
  open('자세히 보고, 나의 말로 이어 보는 의뢰',portrait('“정원의 새싹은 어느 쪽을 향해 자라고 있을까? 새싹 화분에서 비밀을 살피고, 나에게 초록 편지를 가져다줘.”')+'<div class="parcel-goal"><b>'+status()+'</b><p>'+['정원에서 잎·줄기·햇빛을 살펴봐요.','살펴본 단서를 낱말 조각으로 이어 봐요.','편지를 완성했어요. 도서관 토리에게 전해요.'][phase()]+'</p></div><button class="parcel-primary" data-letter="go">'+(phase()<2?'정원 새싹 화분으로 걷기':'도서관 토리에게 걷기')+'</button><p class="parcel-note">서두르지 않아도 괜찮아요. 저장한 발자국부터 이어서 할 수 있어요.</p>');
 }
 function plant(){return '<div class="letter-plant"><svg viewBox="0 0 420 240" role="img" aria-label="오른쪽 위의 햇빛을 향해 줄기가 기울고 두 잎이 펼쳐진 새싹의 관찰 그림"><rect width="420" height="240" rx="24" fill="#edf4df"/><path d="M20 197Q160 166 400 195V240H20Z" fill="#d7e5ba"/><g stroke="#efd582" stroke-width="4" stroke-linecap="round"><path d="M331 31v-12m0 85v-12m-35-36h-12m94 0h-12m-59-25-9-9m58 59-9-9m-50 0-9 9m68-59-9 9"/></g><circle cx="331" cy="56" r="26" fill="#ffe5a2"/><path d="m209 181q3-44 31-85" fill="none" stroke="#65844e" stroke-width="9" stroke-linecap="round"/><path d="M226 134q-72 4-62-43 55-5 62 43" fill="#8bb271" stroke="#52784b" stroke-width="3"/><path d="M230 126q-5-56 55-61 10 50-55 61" fill="#a0c57c" stroke="#52784b" stroke-width="3"/><path d="m166 175 15 54h61l16-54" fill="#d4a279" stroke="#956845" stroke-width="3"/><rect x="159" y="167" width="107" height="17" rx="7" fill="#e4b68b" stroke="#956845" stroke-width="3"/><path d="m244 70 35-15" fill="none" stroke="#e8cc78" stroke-width="3" stroke-dasharray="5 6"/></svg>'+Object.keys(CLUES).map(id=>'<button class="letter-spot '+id+'" data-clue="'+id+'" aria-label="'+({leaf:'잎',stem:'줄기',light:'햇빛'}[id])+' 살펴보기" aria-pressed="'+clues.has(id)+'">'+({leaf:'잎',stem:'줄기',light:'햇빛'}[id])+'</button>').join('')+'</div>'}
 function observe(){open('새싹 그림에서 세 곳을 눌러 살펴봐요.',plant()+'<div id="letterClues" class="letter-clues" role="status"></div><button class="parcel-primary" data-letter="observe">발견한 단서 세 개 저장하기</button>'+feedback());renderClues()}
 function renderClues(){doc.getElementById('letterClues').innerHTML='<b>발견 '+clues.size+' / 3</b><ul>'+[...clues].map(x=>'<li>'+CLUES[x]+'</li>').join('')+'</ul>';d.querySelectorAll('[data-clue]').forEach(b=>b.setAttribute('aria-pressed',String(clues.has(b.dataset.clue))))}
 function letter(){return '<div class="letter-paper"><span>토리에게 보내는 관찰 편지</span><p>🌿 새싹은<br>☀️ 빛을 향해<br>🌱 자라요.</p><small>줄기와 햇빛의 자리를 살펴보았어요.</small></div>'}
 function compose(){open('발견을 담아 편지 조각을 이어 봐요.','<p class="letter-hint">줄기가 햇빛 쪽으로 기울어 있었어요.<br>“새싹은 어디를 향해 자랄까?”</p><div class="letter-paper"><span>토리에게 보내는 관찰 편지</span><div class="letter-slots">'+[0,1,2].map(i=>'<button data-slot="'+i+'" aria-label="편지 '+(i+1)+'번째 자리"></button>').join('')+'</div></div><p>조각을 끌어 놓거나, 조각과 빈자리를 차례로 눌러요.</p><div class="letter-words">'+['grow','leaf','light'].map(id=>'<button data-word="'+id+'">'+WORDS[id]+'</button>').join('')+'</div><p class="parcel-note">키보드: 조각 선택 → Tab으로 자리 이동 → Enter. 채운 자리를 다시 누르면 지워져요.</p><button data-letter="clear">조각 다시 놓기</button><button class="parcel-primary" data-letter="compose">내 편지 읽어 주기</button>'+feedback());renderWords()}
 function renderWords(){d.querySelectorAll('[data-slot]').forEach((b,i)=>{b.textContent=words[i]?WORDS[words[i]]:(i+1)+' · 여기에 놓아요';b.setAttribute('aria-label',(i+1)+'번째 자리 · '+(words[i]?WORDS[words[i]]:'비어 있어요'))});d.querySelectorAll('[data-word]').forEach(b=>{b.setAttribute('aria-pressed',String(selected===b.dataset.word));b.dataset.placed=String(words.includes(b.dataset.word))})}
 function place(index){if(!selected||index<0||index>2)return;words=words.map(x=>x===selected?null:x);words[index]=selected;selected=null;renderWords();doc.getElementById('letterFeedback').textContent=words.every(Boolean)?'편지를 이어 놓았어요. 아래에서 읽어 주세요.':'좋아요. 남은 빈자리에도 조각을 놓아 봐요.'}
 function finish(){open('토리가 너의 발견을 기억해요.',portrait('“햇빛 쪽으로 기운 줄기까지 살펴보았구나! 네 초록 편지는 내 수첩에 오래 간직할게.”')+letter()+'<p class="letter-keepsake">✓ 초록 편지의 기억이 내 탐험 수첩에 남았어요.</p><p>우리 교실의 화분도 며칠 동안 같은 자리에서 살펴볼까요? 눈으로 관찰하고, 달라진 모습을 이야기해 봐요.</p><button data-letter="close">학교 산책 계속하기</button>');refreshTori()}
 async function save(step,values){
  if(busy)return;const f=doc.getElementById('letterFeedback');if(!f)return;if(values.some(x=>!x)||step==='letter-1'&&clues.size!==3){f.textContent=step==='letter-1'?'잎·줄기·햇빛을 모두 살펴봐 주세요.':'빈자리에 조각을 모두 놓아 주세요.';return}
  const id=owner,t=token,g=generation;busy=true;const buttons=[...d.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);f.textContent='내 수첩에 발자국을 저장하고 있어요…';
  try{const {data,error}=await c.db.rpc('student_garden_letter',{p_token:t,p_step:step,p_clues:values});if(!valid(id,t,g))return;if(error||!data||data.correct&&data.step_id!==step)throw error||Error('Missing result');
   if(!data.correct){f.textContent='“누가 → 어디를 향해 → 어떻게” 순서로 이어 볼까요? 조각을 다시 놓아도 괜찮아요.';return}
   done.add(step);refreshTori();doc.dispatchEvent(new CustomEvent('student-letter-updated'));f.innerHTML='<b>✓ 발자국 '+phase()+' / 3을 저장했어요.</b><p>'+(['','세 단서로 편지를 만들어 볼까요?','편지가 완성됐어요. 토리가 기다리고 있어요.','토리가 너의 발견을 기억할 거예요.'][phase()])+'</p><button class="parcel-primary" data-letter="next">'+(phase()===1?'편지 조립하기':phase()===2?'토리에게 걸어가기':'초록 편지의 기억 보기')+'</button>';f.querySelector('button').focus({preventScroll:true});
  }catch{if(valid(id,t,g))f.textContent='저장을 확인하지 못했어요. 단서와 조각은 그대로예요. 연결을 확인하고 다시 눌러 주세요.'}finally{if(valid(id,t,g)){busy=false;buttons.forEach(b=>{if(b.isConnected)b.disabled=done.has(step)&&b.dataset.letter!=='close'})}}
 }
 function go(){const room=phase()<2?'garden':'library',target=phase()<2?'look-0':'tori';d.close();window.enterHubScene(room);requestAnimationFrame(()=>{if(c.getScene()===room)c.walk.goTo(target)})}
 d.addEventListener('click',e=>{if(suppressClick){suppressClick=false;return}if(busy)return;const b=e.target.closest('button');if(!b)return;if(owner!==student().id||token!==c.getToken()){reset();return}const a=b.dataset.letter;
  if(a==='close'){d.close();return}if(a==='retry'){loaded=false;start();return}if(a==='go'){go();return}if(a==='next'){if(phase()===1)compose();else if(phase()===2)go();else finish();return}
  if(b.dataset.clue){clues.add(b.dataset.clue);renderClues();return}if(b.dataset.word){selected=b.dataset.word;renderWords();doc.getElementById('letterFeedback').textContent='놓을 자리를 눌러 주세요.';return}
  if(b.hasAttribute('data-slot')){const i=Number(b.dataset.slot);if(selected)place(i);else{words[i]=null;renderWords()}return}
  if(a==='clear'){words=[null,null,null];selected=null;renderWords();return}if(a==='observe')save('letter-1',[...clues]);if(a==='compose')save('letter-2',words.slice());if(a==='deliver')save('letter-3',['tori']);
 });
 d.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-word]');if(!b||busy||e.button!==0)return;drag={id:e.pointerId,word:b.dataset.word,x:e.clientX,y:e.clientY,moved:false};b.setPointerCapture(e.pointerId)});
 d.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8){drag.moved=true;selected=drag.word;renderWords();d.querySelectorAll('[data-slot]').forEach(b=>b.classList.toggle('letter-over',b===doc.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot]')))}});
 d.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;const moved=drag.moved;drag=null;d.querySelectorAll('.letter-over').forEach(b=>b.classList.remove('letter-over'));if(moved){const slot=doc.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot]');if(slot)place(Number(slot.dataset.slot));suppressClick=true;setTimeout(()=>suppressClick=false,0)}});
 for(const name of ['pointercancel','lostpointercapture'])d.addEventListener(name,()=>{drag=null;d.querySelectorAll('.letter-over').forEach(b=>b.classList.remove('letter-over'))});
 d.addEventListener('cancel',e=>{if(busy)e.preventDefault()});d.addEventListener('close',()=>{view++;drag=null;if(opener?.isConnected&&opener.getClientRects().length)opener.focus({preventScroll:true})});
 doc.addEventListener('student-dashboard-updated',()=>{if(owner!==student().id||token!==c.getToken())reset();load()});load();
 return {start,refreshTori};
}
