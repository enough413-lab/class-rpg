import {freshStory,validStory,validStoryAction} from './school-life-story-state.js?v=20261110-story';
const copy=value=>structuredClone(value);
const validIntent=d=>d&&Object.keys(d).length===5&&d.v===1&&validStoryAction(d.action,d.payload)&&Number.isSafeInteger(d.expected)&&d.expected>=0&&d.expected<Number.MAX_SAFE_INTEGER&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(d.id);
// Separate action receipts. Original snapshots never carry or overwrite narrative progress.
export function createStoryStorage({rpc,identity,storage=localStorage,onChange=()=>{},timeout=15000}){
 let owner='',token='',epoch=0,status='idle',state=freshStory(),revision=0,lastResult=null,pending=null,list=[],busy=false;
 const memory=new Map();
 const prefix=()=>`classRpgSchoolStory_v1_${owner}_intent_`;
 const current=e=>e===epoch&&String(identity().id||'')===owner&&String(identity().token||'')===token;
 const snapshot=()=>({status,state:copy(state),revision,lastResult,pending:pending&&copy(pending),copies:list.map(copy)});
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
  if(!d||d.protocol!==1||d.kind!=='school_story'||!Number.isSafeInteger(d.revision)||d.revision<0||!validStory(d.state)||!['read','advanced','already_done','not_ready','incorrect','conflict'].includes(d.outcome)||typeof d.conflict!=='boolean'||typeof d.replay!=='boolean'||!(d.ack_revision===null||Number.isSafeInteger(d.ack_revision)&&d.ack_revision>=0&&d.ack_revision<=d.revision))throw Error('response');if((d.revision===0)!==(d.state.phase===0)||d.conflict!==(d.outcome==='conflict')||d.conflict&&(d.replay||d.ack_revision!==null)||d.outcome==='read'&&(d.replay||d.ack_revision!==null)||d.outcome==='advanced'&&d.ack_revision===0)throw Error('response');return d;
 }
 async function call(args){let timer;try{return response(await Promise.race([Promise.resolve().then(()=>rpc(args)),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('timeout')),timeout))]));}finally{clearTimeout(timer);}}
 async function read(){if(busy||!current(epoch))return;const e=epoch;busy=true;emit('loading');try{const d=await call({p_token:token});if(!current(e))return;if(d.outcome!=='read'||d.conflict||d.replay||d.ack_revision!==null)throw Error('response');state=copy(d.state);revision=d.revision;lastResult=null;rest();}catch{if(current(e))emit('error');}finally{if(e===epoch)busy=false;}}
 async function activate(id,nextToken){epoch++;owner=String(id||'');token=String(nextToken||'');busy=false;state=freshStory();revision=0;lastResult=null;pending=null;list=[];status='idle';try{scan();pending=list.length===1?list[0]:null;}catch{emit('unreadable');return;}await read();}
 function deactivate(){epoch++;busy=false;owner='';token='';pending=null;list=[];state=freshStory();revision=0;lastResult=null;status='idle';}
 async function send(){if(busy||!pending||!current(epoch))return;const e=epoch,d=copy(pending);busy=true;
  try{persist(d);}catch{busy=false;emit('storage-error');return;}
  emit('saving');try{const r=await call({p_token:token,p_action:d.action,p_payload:copy(d.payload),p_expected_revision:d.expected,p_request_id:d.id});if(!current(e))return;
   if(r.outcome==='read'||!r.conflict&&r.ack_revision===null)throw Error('response');state=copy(r.state);revision=r.revision;lastResult=r.outcome;
   if(r.conflict){emit('conflict');return;}forget(d);pending=null;rest();
  }catch{if(current(e))emit('error');}finally{if(e===epoch)busy=false;}
 }
 function act(action,payload={}){if(status!=='ready'||busy||!current(epoch)||!validStoryAction(action,payload)||revision===Number.MAX_SAFE_INTEGER)return false;
  try{scan();}catch{emit('unreadable');return false;}if(list.length){rest();return false;}
  pending={v:1,id:crypto.randomUUID(),action,payload:copy(payload),expected:revision};remember(pending);void send();return true;
 }
 function retry(){if(busy||!current(epoch))return;if(pending)void send();else void read();}
 function keepServer(){if(status!=='conflict'||!pending||busy||!current(epoch))return;try{forget(pending);pending=null;rest();}catch{emit('storage-error');}}
 function selectPending(id){if(status!=='recovery'||busy||!current(epoch))return;pending=list.find(x=>x.id===id)||null;if(pending)emit('pending');}
 function storageChanged(){if(busy||!owner||!current(epoch))return;try{scan();}catch{emit('unreadable');return;}void read();}
 return {activate,deactivate,read,act,retry,keepServer,selectPending,storageChanged,snapshot};
}
