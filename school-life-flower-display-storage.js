const copy=x=>structuredClone(x),decimal=x=>typeof x==='string'&&/^(0|[1-9][0-9]{0,18})$/.test(x)&&BigInt(x)<=9223372036854775806n;
const count=x=>decimal(x)&&BigInt(x)<=999999n;
const successes=['displayed','taken','unchanged','no_flower','bag_full'],conflicts=['garden_conflict','life_conflict'];
const intent=d=>d&&Object.keys(d).length===6&&d.v===1&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(d.id)&&decimal(d.expected)&&BigInt(d.expected)>0n&&BigInt(d.expected)<9223372036854775806n&&decimal(d.life)&&BigInt(d.life)>0n&&['display','take'].includes(d.action)&&(d.action==='take'?d.kind===null:Number.isInteger(d.kind)&&d.kind>=0&&d.kind<3);
export function createFlowerDisplayStorage({rpc,identity,storage=localStorage,onChange=()=>{},timeout=15000}){
 let owner='',token='',epoch=0,status='idle',revision='0',lifeRevision='0',displayed=null,flowers=[],enrolled=false,pending=null,list=[],busy=false,outcome=null,command=null;
 const memory=new Map(),prefix=()=>'classRpgSchoolVase_v1_'+owner+'_intent_';
 const current=e=>e===epoch&&String(identity().id||'')===owner&&String(identity().token||'')===token;
 const snapshot=()=>({status,revision,lifeRevision,displayed,flowers:copy(flowers),enrolled,pending:pending&&copy(pending),copies:list.map(copy),outcome,command:command&&copy(command)});
 const emit=s=>{status=s;onChange(snapshot());};
 function scan(){const found=new Map(memory.get(owner)||[]);for(let i=0;i<storage.length;i++){const k=storage.key(i);if(!k?.startsWith(prefix()))continue;const d=JSON.parse(storage.getItem(k));if(!intent(d)||k!==prefix()+d.id||found.has(d.id)&&JSON.stringify(found.get(d.id))!==JSON.stringify(d))throw Error('unreadable');found.set(d.id,d);}list=[...found.values()];return list;}
 function remember(d){const entries=memory.get(owner)||new Map();entries.set(d.id,copy(d));memory.set(owner,entries);}
 function persist(d){const k=prefix()+d.id,raw=JSON.stringify(d),old=storage.getItem(k);if(old!==null&&old!==raw)throw Error('unreadable');if(old===null)storage.setItem(k,raw);if(storage.getItem(k)!==raw)throw Error('storage');}
 function forget(d){const k=prefix()+d.id,raw=storage.getItem(k);if(raw!==null&&raw!==JSON.stringify(d))throw Error('unreadable');storage.removeItem(k);memory.get(owner)?.delete(d.id);}
 function rest(){scan();pending=list.length===1?list[0]:null;emit(list.length>1?'recovery':pending?'pending':'ready');}
 function response(r){if(r?.error)throw Error('network');const d=r?.data;
  if(!d||d.protocol!==1||d.kind!=='flower_display'||!decimal(d.revision)||!decimal(d.life_revision)||!(d.displayed===null||Number.isInteger(d.displayed)&&d.displayed>=0&&d.displayed<3)||typeof d.enrolled!=='boolean'||d.enrolled!==(d.revision!=='0')||!Array.isArray(d.flowers)||d.flowers.length!==3||d.flowers.some((p,i)=>p?.kind!==i||!count(p.count))||typeof d.conflict!=='boolean'||typeof d.replay!=='boolean'||!['read',...successes,...conflicts].includes(d.outcome)||!(d.ack_revision===null||decimal(d.ack_revision)&&BigInt(d.ack_revision)>0n&&BigInt(d.ack_revision)<=BigInt(d.revision)))throw Error('response');return d;
 }
 async function call(args){let timer;try{return response(await Promise.race([Promise.resolve().then(()=>rpc(args)),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('timeout')),timeout))]));}finally{clearTimeout(timer);}}
 function apply(d){revision=d.revision;lifeRevision=d.life_revision;displayed=d.displayed;flowers=copy(d.flowers);enrolled=d.enrolled;outcome=d.outcome;}
 async function read(){if(busy||!current(epoch))return;const e=epoch;busy=true;command=null;emit('loading');try{const d=await call({p_token:token});if(!current(e))return;if(d.conflict||d.replay||d.ack_revision!==null||d.outcome!=='read')throw Error('response');apply(d);rest();}catch{if(current(e))emit('error');}finally{if(e===epoch)busy=false;}}
 async function activate(id,nextToken){epoch++;owner=String(id||'');token=String(nextToken||'');busy=false;revision='0';lifeRevision='0';displayed=null;flowers=[];enrolled=false;pending=null;list=[];status='idle';outcome=null;command=null;try{scan();pending=list.length===1?list[0]:null;}catch{emit('unreadable');return;}await read();}
 function deactivate(){epoch++;busy=false;owner='';token='';pending=null;list=[];flowers=[];displayed=null;enrolled=false;revision='0';lifeRevision='0';outcome=null;command=null;status='idle';}
 async function send(){if(busy||!pending||!current(epoch))return;const e=epoch,d=copy(pending);busy=true;command=null;
  try{persist(d);}catch{busy=false;emit('storage-error');return;}emit('saving');
  try{const r=await call({p_token:token,p_kind:d.kind,p_action:d.action,p_expected_revision:d.expected,p_life_revision:d.life,p_request_id:d.id});if(!current(e))return;
   if(!r.conflict&&(r.ack_revision===null||BigInt(r.ack_revision)!==BigInt(d.expected)+1n||!successes.includes(r.outcome)||!r.enrolled)||r.conflict&&(r.replay||r.ack_revision!==null||!conflicts.includes(r.outcome)))throw Error('response');apply(r);
   if(r.conflict){emit('conflict');return;}forget(d);pending=null;command={id:d.id,kind:d.kind,action:d.action,outcome:r.outcome,replay:r.replay};rest();
  }catch{if(current(e))emit('error');}finally{if(e===epoch)busy=false;}
 }
 function act(action,kind=null){if(status!=='ready'||busy||!current(epoch)||!enrolled||BigInt(lifeRevision)<1n||BigInt(revision)>=9223372036854775806n)return false;try{scan();}catch{emit('unreadable');return false;}if(list.length){rest();return false;}
  const d={v:1,id:crypto.randomUUID(),expected:revision,life:lifeRevision,kind,action};if(!intent(d))return false;pending=d;remember(d);void send();return true;
 }
 function retry(){if(busy||!current(epoch))return;if(pending)void send();else void read();}
 function keepServer(){if(status!=='conflict'||!pending||busy||!current(epoch))return;try{const raw=JSON.stringify(pending),k='classRpgSchoolVase_v1_'+owner+'_conflict_'+pending.id;const old=storage.getItem(k);if(old!==null&&old!==raw)throw Error('storage');storage.setItem(k,raw);if(storage.getItem(k)!==raw)throw Error('storage');forget(pending);pending=null;rest();}catch{emit('storage-error');}}
 function selectPending(id){if(status!=='recovery'||busy||!current(epoch))return;pending=list.find(x=>x.id===id)||null;if(pending)emit('pending');}
 function storageChanged(){if(busy||!owner||!current(epoch))return;try{scan();}catch{emit('unreadable');return;}void read();}
 return {activate,deactivate,read,act,retry,keepServer,selectPending,storageChanged,snapshot};
}

