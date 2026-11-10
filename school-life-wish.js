const choices=new Set(['flowers','books']);
const copy=value=>structuredClone(value);
const validIntent=d=>d&&Object.keys(d).length===4&&d.v===1&&choices.has(d.choice)&&Number.isSafeInteger(d.expected)&&d.expected>=0&&d.expected<Number.MAX_SAFE_INTEGER&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(d.id);
// A separate story preference. Whole-game snapshots never carry or overwrite it.
export function createWishStorage({rpc,identity,storage=localStorage,onChange=()=>{},timeout=15000}){
 let owner='',token='',epoch=0,status='idle',choice=null,revision=0,pending=null,list=[],busy=false;
 const memory=new Map();
 const prefix=()=>`classRpgSchoolWish_v1_${owner}_intent_`;
 const current=e=>e===epoch&&String(identity().id||'')===owner&&String(identity().token||'')===token;
 const snapshot=()=>({status,choice,revision,pending:pending&&copy(pending),copies:list.map(copy)});
 const emit=s=>{status=s;onChange(snapshot());};
 function scan(){
  const found=new Map(memory.get(owner)||[]);
  for(let i=0;i<storage.length;i++){const key=storage.key(i);if(!key?.startsWith(prefix()))continue;
   const d=JSON.parse(storage.getItem(key));if(!validIntent(d)||key!==prefix()+d.id)throw Error('unreadable');
   if(found.has(d.id)&&JSON.stringify(found.get(d.id))!==JSON.stringify(d))throw Error('unreadable');found.set(d.id,d);
  }
  // Only this adapter's unsent actions belong in memory. Other tabs may finish
  // and remove their durable intents; scanning must not retain phantom copies.
  list=[...found.values()];return list;
 }
 function remember(d){const found=memory.get(owner)||new Map();found.set(d.id,copy(d));memory.set(owner,found);}
 function persist(d){const key=prefix()+d.id,old=storage.getItem(key),raw=JSON.stringify(d);if(old!==null&&old!==raw)throw Error('unreadable');if(old===null)storage.setItem(key,raw);if(storage.getItem(key)!==raw)throw Error('storage');}
 function forget(d){const key=prefix()+d.id,raw=storage.getItem(key);if(raw!==null&&raw!==JSON.stringify(d))throw Error('unreadable');storage.removeItem(key);memory.get(owner)?.delete(d.id);}
 function rest(){scan();pending=list.length===1?list[0]:null;emit(list.length>1?'recovery':pending?'pending':'ready');}
 function response(r){if(r?.error)throw Error('network');const d=r?.data;
  if(!d||d.protocol!==1||d.kind!=='school_wish'||!Number.isSafeInteger(d.revision)||d.revision<0||!(d.revision===0?d.choice===null:choices.has(d.choice))||typeof d.conflict!=='boolean'||typeof d.replay!=='boolean'||!(d.ack_revision===null||Number.isSafeInteger(d.ack_revision)&&d.ack_revision>0&&d.ack_revision<=d.revision))throw Error('response');return d;
 }
 async function call(args){let timer;try{return response(await Promise.race([Promise.resolve().then(()=>rpc(args)),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('timeout')),timeout))]));}finally{clearTimeout(timer);}}
 async function read(){if(busy||!current(epoch))return;const e=epoch;busy=true;emit('loading');try{const d=await call({p_token:token});if(!current(e))return;if(d.conflict||d.replay||d.ack_revision!==null)throw Error('response');choice=d.choice;revision=d.revision;rest();}catch{if(current(e))emit('error');}finally{if(e===epoch)busy=false;}}
 async function activate(id,nextToken){epoch++;owner=String(id||'');token=String(nextToken||'');busy=false;choice=null;revision=0;pending=null;list=[];status='idle';try{scan();pending=list.length===1?list[0]:null;}catch{emit('unreadable');return;}await read();}
 function deactivate(){epoch++;busy=false;owner='';token='';pending=null;list=[];choice=null;revision=0;status='idle';}
 async function send(){if(busy||!pending||!current(epoch))return;const e=epoch,d=copy(pending);busy=true;
  try{persist(d);}catch{busy=false;emit('storage-error');return;}
  emit('saving');try{const r=await call({p_token:token,p_choice:d.choice,p_expected_revision:d.expected,p_request_id:d.id});if(!current(e))return;
   if(!r.conflict&&r.ack_revision===null)throw Error('response');choice=r.choice;revision=r.revision;
   if(r.conflict){emit('conflict');return;}forget(d);pending=null;rest();
  }catch{if(current(e))emit('error');}finally{if(e===epoch)busy=false;}
 }
 function choose(value){if(status!=='ready'||busy||!current(epoch)||!choices.has(value)||revision===Number.MAX_SAFE_INTEGER)return false;
  try{scan();}catch{emit('unreadable');return false;}if(list.length){rest();return false;}if(choice===value)return true;
  pending={v:1,id:crypto.randomUUID(),choice:value,expected:revision};remember(pending);void send();return true;
 }
 function retry(){if(busy||!current(epoch))return;if(pending)void send();else void read();}
 function keepServer(){if(status!=='conflict'||!pending||busy||!current(epoch))return;try{forget(pending);pending=null;rest();}catch{emit('storage-error');}}
 function selectPending(id){if(status!=='recovery'||busy||!current(epoch))return;pending=list.find(x=>x.id===id)||null;if(pending)emit('pending');}
 function storageChanged(){if(busy||!owner||!current(epoch))return;try{scan();}catch{emit('unreadable');return;}void read();}
 return {activate,deactivate,read,choose,retry,keepServer,selectPending,storageChanged,snapshot};
}

const label=choice=>choice==='flowers'?'꽃이 많은 학교':choice==='books'?'책이 많은 학교':'아직 고른 학교 없음';
const reactions={saessak:{flowers:'꽃이 많은 학교랬지.\n난 노란 꽃을 좋아해. 그 옆에 앉으면 햇볕 냄새가 나.',books:'책이 많은 학교랬지.\n토리한테 읽어 달라고 해야겠다. 난 듣는 게 좋거든.'},tori:{flowers:'꽃이 많은 학교. 기억하고 있어.\n책을 읽다 창밖을 보면 꽃이 보이겠군.',books:'책이 많은 학교랬지.\n책장 하나는 비워 둘게. 네가 좋아하는 책도 꽂아야 하니까.'}};
export function createSchoolWish({identity,rpc,talk,hide,overlay,valid}){
 let active=null;
 const store=createWishStorage({identity,rpc,onChange:()=>{if(active&&valid()&&overlay.querySelector('.life-wish'))render();}});
 function render(){if(!active||!valid())return;const s=store.snapshot(),npc=active.npc,name=npc==='tori'?'토리':'새싹';
  let text='';const answers=[],origin=active;
  const add=(label,run,disabled=false)=>answers.push({label,disabled,run:()=>{active=origin;run();render();}});
  if(s.status==='ready'){
   text=s.choice?reactions[npc][s.choice]:'너는 어떤 학교가 좋아?';
   add('꽃이 많은 학교',()=>{store.choose('flowers');render();},s.choice==='flowers');add('책이 많은 학교',()=>{store.choose('books');render();},s.choice==='books');
  }else if(s.status==='loading'||s.status==='saving')text=s.status==='loading'?'이야기 불러오는 중…':'이야기 저장 중…';
  else if(s.status==='conflict'){text='다른 곳에서 남긴 말이 있다.\n'+label(s.choice);add('지금 기록 유지',()=>store.keepServer());}
  else if(s.status==='recovery'){text='아직 확인하지 못한 말이 있다.';for(const d of s.copies)add(label(d.choice),()=>store.selectPending(d.id));}
  else if(s.status==='unreadable')text='이 기기의 학교 이야기를 읽지 못했다.\n창을 닫고 다시 접속한 뒤 확인할 수 있다.';
  else {text=s.pending?'저장 확인 필요\n'+label(s.pending.choice)+(s.status==='storage-error'?'\n이 기기에 기록을 남기지 못했다.':'\n연결을 확인한 뒤 다시 저장할 수 있다.'):'학교 이야기를 불러오지 못했다.';add(s.pending?'다시 저장':'다시 불러오기',()=>store.retry());}
  talk(s.status==='ready'?name:'학교 이야기',text,answers,s.status==='ready'?npc:null);
  const panel=overlay.querySelector('.life-dialog');panel.classList.add('life-wish');panel.querySelector('p').classList.add('life-wish-line');
  [...panel.querySelectorAll('.life-choice')].forEach((b,i)=>b.disabled=answers[i].disabled);
  const close=document.createElement('button');close.className='life-book-close life-wish-close';close.setAttribute('aria-label','이야기 닫기');close.textContent='×';close.onclick=()=>{if(valid()&&active===origin&&overlay.contains(close))hide();};panel.append(close);
  (panel.querySelector('.life-choice:not(:disabled)')||close).focus({preventScroll:true});
 }
 return {store,open(npc){active={npc};render();},close(){active=null;},remember(npc,fallback){return reactions[npc]?.[store.snapshot().choice]||fallback;},snapshot:()=>store.snapshot()};
}
