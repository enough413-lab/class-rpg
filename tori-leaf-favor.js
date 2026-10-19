// A personal, device-local errand using the existing pond rubbing. No school rewards.
import {leafImpression} from './pond-notebook.js?v=20261014-leaf-favor';
export function installToriLeafFavor(c){
 const doc=c.hub.ownerDocument,player=doc.getElementById('hubPlayer'),guide=c.guide,choices=guide.querySelector('.campus-guide-choices'),book=guide.querySelector('.tori-notebook'),reading=choices.querySelector('[data-guide=reading]');
 const answer=doc.createElement('button');answer.type='button';answer.dataset.leafAction='answer';answer.innerHTML='<b></b><span></span>';book.append(answer);
 const help=doc.createElement('div');help.className='tori-leaf-help';help.hidden=true;
 const hint=doc.createElement('span');hint.setAttribute('role','status');const take=doc.createElement('button');take.type='button';take.className='tori-leaf-take';take.textContent='그림 챙기기';const retry=doc.createElement('button');retry.type='button';retry.className='tori-leaf-retry';retry.textContent='다시 저장';help.append(hint,retry);c.hub.querySelector('.campus-viewport').append(help);c.hub.querySelector('.notebook-help').append(take);
 let owner=null,phase=0,cells=[],stored=true,message='',acceptedIn=null;
 const key=id=>'classRpgToriLeafFavor_v1_'+id,open=()=>!c.hub.classList.contains('hidden'),nearTori=()=>open()&&c.getScene()==='library'&&c.walk.nearby()?.kind==='tori';
 const playable=()=>phase>0||c.levelInfo(c.getStudent()?.xp||0).level>=6;
 const validCells=a=>Array.isArray(a)&&a.length>0&&a.length<=392&&a.every(n=>Number.isInteger(n)&&n>=0&&n<392);
 function activate(){
  const id=c.getStudent()?.id;if(id===owner)return false;owner=id;phase=0;cells=[];message='';acceptedIn=null;stored=true;delete guide.dataset.leafStory;
  try{const s=JSON.parse(localStorage.getItem(key(id))||'null');if(id!=null&&s?.v===1&&[1,2,3].includes(s.phase)&&(s.phase===1||validCells(s.cells))){phase=s.phase;cells=phase>1?[...new Set(s.cells)]:[]}}catch{stored=false}
  return true;
 }
 function save(){if(owner==null||owner!==c.getStudent()?.id)return;try{localStorage.setItem(key(owner),JSON.stringify({v:1,phase,cells}));stored=true}catch{stored=false}}
 function goal(){
  if(phase===2)return c.getScene()==='library'?'토리에게 잎 그림을 건네요.':c.getScene()==='pond'?'정원 문으로 · 토리에게 돌아가요.':c.getScene()==='garden'?'도서관 문으로 · 토리가 기다려요.':'도서관의 토리에게 잎 그림을 가져가요.';
  return c.getScene()==='library'?'오른쪽 정원 문 → 연못의 질문 노트':c.getScene()==='garden'?'오른쪽 연못 문 → 질문 노트':c.getScene()==='pond'?'질문 노트에서 잎 무늬를 문질러요.':'도서관 → 정원 → 연못의 질문 노트';
 }
 function renderDialogue(){
  activate();const available=owner!=null&&playable(),priority=c.getParcelStatus()?.phase>0&&c.getParcelStatus()?.phase<3;
  answer.hidden=!available;const primary=available&&!priority,parent=primary?choices:book;
  if(answer.parentElement!==parent){if(primary)choices.insertBefore(answer,reading);else book.append(answer)}
  // The active parcel remains the first request. Its completed keepsake is optional.
  const parcel=choices.querySelector(':scope > [data-guide=parcel]');if(primary&&parcel)book.append(parcel);
  guide.dataset.leafStory=primary?'active':'none';
  answer.querySelector('b').textContent=['잎 그림을 가져올게!','어느 길로 가면 돼?','잎 그림 건네기','함께 만든 잎 그림'][phase];
  answer.querySelector('span').textContent=['연못의 노트에서 만든 그림을 토리에게 줘요.','받은 부탁 · 정원을 지나 연못의 질문 노트로 가요.','받은 부탁 · 손에 든 그림을 토리에게 전해요.','도서관에 남겨 둔 내 그림이에요.'][phase];
  if(!primary||guide.dataset.inspection==='true')return;
  guide.querySelector('#campusGuideTitle').textContent=['그림책에 잎 한 장!','천천히 다녀와!','잎 그림을 가져왔구나!','네 잎 그림을 간직할게!'][phase];
  guide.querySelector('.campus-greeting p').textContent=[
   '내 그림책에 연못의 잎 무늬를 넣고 싶어. 질문 노트에서 문질러 만든 그림을 가져다줄래?',
   '오른쪽 정원을 지나면 연못이야. 질문 노트에서 잎을 문지른 뒤, 그림을 챙겨서 돌아와 줘.',
   '네 손으로 문지른 선이 보이네. 그림책 옆에 놓아도 될까?',
   '고마워! 네가 가져온 잎 그림을 내 그림책 옆에 놓았어. 다시 볼 때마다 네 생각이 날 거야.'
  ][phase];
 }
 function sync(){
  const changed=activate();if(changed)renderDialogue();const snapshot=c.notebook.snapshot(),atNotebook=open()&&c.getScene()==='pond'&&c.walk.nearby()?.kind==='look-2';
  const parcelPhase=c.getParcelStatus()?.phase||0;if(acceptedIn!==c.getScene())acceptedIn=null;
  help.dataset.requestState=phase===3?'completed':phase>0?'accepted':'available';
  help.hidden=!open()||owner==null||atNotebook&&stored||stored&&parcelPhase>0&&parcelPhase<3&&!acceptedIn||!(phase===1||phase===2||!stored&&phase===3);
  take.hidden=!(phase===1&&atNotebook);take.disabled=snapshot.owner!==owner||!snapshot.cells.length||snapshot.busy||player.hasAttribute('data-jumping');retry.hidden=stored;
  const text=(phase===1||phase===2?'받은 부탁 · 토리의 잎 그림 · ':'')+(message||goal())+(stored?'':' 이 기기에 저장하지 못했어요. 다시 저장해 주세요.');if(hint.textContent!==text)hint.textContent=text;
  const rig=player.querySelector('.campus-rig');let held=player.querySelector('.tori-leaf-held');
  if(rig&&!held){held=doc.createElement('span');held.className='tori-leaf-held';held.setAttribute('aria-hidden','true');rig.append(held)}
  const signature=owner+':'+phase+':'+cells.join(',');
  if(held){const hide=phase!==2||!open();if(held.hidden!==hide)held.hidden=hide;if(held.dataset.impression!==signature){held.innerHTML=phase>1?leafImpression(cells,'toriHeldLeaf'):'';held.dataset.impression=signature}held.classList.toggle('is-tucked',!!player.querySelector('.cafeteria-held-tray:not([hidden]),.parcel-held:not([hidden]),.momo-held:not([hidden]),.playground-held-ball:not([hidden])'))}
  const tori=c.getScene()==='library'?c.objects.querySelector('[data-place=tori]'):null;if(!tori)return;
  let memory=tori.querySelector('.tori-leaf-memory');if(!memory){memory=doc.createElement('span');memory.className='tori-leaf-memory';memory.setAttribute('aria-hidden','true');tori.append(memory)}
  memory.hidden=phase!==3;if(memory.dataset.impression!==signature){memory.innerHTML=phase===3?leafImpression(cells,'toriMemoryLeaf'):'';memory.dataset.impression=signature}
  tori.classList.toggle('tori-leaf-waiting',phase===2);tori.dataset.leafFavor=String(phase);
 }
 answer.onclick=()=>{
  activate();if(owner==null||!playable()||!guide.open||guide.dataset.inspection==='true')return;
  if(!nearTori()){guide.close();message='토리 곁으로 걸어가요.';if(c.getScene()==='library')c.walk.goTo('tori');sync();return}
  c.stop();message='';if(phase===0){phase=1;acceptedIn=c.getScene();save();guide.close()}else if(phase===1){guide.close()}else if(phase===2){phase=3;save();c.refreshStory()}else{guide.close()}
  sync();c.refresh();c.onRequestAction?.();
 };
 take.onclick=()=>{
  activate();const s=c.notebook.snapshot();if(owner==null||phase!==1||s.owner!==owner||!s.cells.length||s.busy||!open()||c.getScene()!=='pond'||c.walk.nearby()?.kind!=='look-2'||player.hasAttribute('data-jumping')||doc.querySelector('dialog[open]'))return;
  c.stop();cells=[...s.cells];phase=2;message='';save();c.notebook.putAway();sync();c.refreshStory();c.refresh();c.onRequestAction?.();
 };
 retry.onclick=()=>{activate();save();sync()};
 guide.addEventListener('campus-story-rendered',renderDialogue);
 doc.addEventListener('student-dashboard-updated',()=>{activate();c.refreshStory();sync()});
 new MutationObserver(sync).observe(player,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
 new MutationObserver(sync).observe(c.hub,{attributes:true,attributeFilter:['class']});
 function request(){activate();return {id:'leaf',title:'토리의 잎 그림',loaded:true,active:phase===1||phase===2,text:goal(),error:!stored?'이 기기에 저장하지 못했어요.':null,retry:()=>{save();sync();c.refresh()}}}
 sync();renderDialogue();return {sync,request};
}
