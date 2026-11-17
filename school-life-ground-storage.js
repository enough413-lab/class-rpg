import {GROUND_MAP,groundAllowed} from './school-life-ground-map.js?v=20261117-ground';
const copy=x=>structuredClone(x),decimal=x=>typeof x==='string'&&/^(0|[1-9][0-9]{0,18})$/.test(x)&&BigInt(x)<=9223372036854775806n;
const intent=d=>d&&Object.keys(d).length===6&&d.v===1&&groundAllowed(d.cell)&&d.map===GROUND_MAP&&decimal(d.expected)&&BigInt(d.expected)<9223372036854775806n&&decimal(d.life)&&BigInt(d.life)>0n&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(d.id);
export function createGroundStorage({rpc,identity,storage=localStorage,onChange=()=>{},timeout=15000}){
 let owner='',token='',epoch=0,status='idle',revision='0',lifeRevision='0',plots=[],pending=null,list=[],busy=false,outcome=null;
 const memory=new Map(),prefix=()=>`classRpgSchoolGround_v1_${owner}_intent_`;
 const current=e=>e===epoch&&String(identity().id||'')===owner&&String(identity().token||'')===token;
 const snapshot=()=>({status,revision,lifeRevision,plots:copy(plots),pending:pending&&copy(pending),copies:list.map(copy),outcome});
 const emit=s=>{status=s;onChange(snapshot());};
 function scan(){const found=new Map(memory.get(owner)||[]);for(let i=0;i<storage.length;i++){const k=storage.key(i);if(!k?.startsWith(prefix()))continue;const d=JSON.parse(storage.getItem(k));if(!intent(d)||k!==prefix()+d.id||found.has(d.id)&&JSON.stringify(found.get(d.id))!==JSON.stringify(d))throw Error('unreadable');found.set(d.id,d);}list=[...found.values()];return list;}
 function remember(d){const entries=memory.get(owner)||new Map();entries.set(d.id,copy(d));memory.set(owner,entries);}
 function persist(d){const k=prefix()+d.id,raw=JSON.stringify(d),old=storage.getItem(k);if(old!==null&&old!==raw)throw Error('unreadable');if(old===null)storage.setItem(k,raw);if(storage.getItem(k)!==raw)throw Error('storage');}
 function forget(d){const k=prefix()+d.id,raw=storage.getItem(k);if(raw!==null&&raw!==JSON.stringify(d))throw Error('unreadable');storage.removeItem(k);memory.get(owner)?.delete(d.id);}
 function rest(){scan();pending=list.length===1?list[0]:null;emit(list.length>1?'recovery':pending?'pending':'ready');}
 function response(r){if(r?.error)throw Error('network');const d=r?.data;
  if(!d||d.protocol!==1||d.kind!=='school_ground'||d.map!==GROUND_MAP||!decimal(d.revision)||!decimal(d.life_revision)||!Array.isArray(d.plots)||d.plots.length>560||d.plots.some((p,i)=>!p||Object.keys(p).length!==3||!groundAllowed(p.cell)||typeof p.tilled!=='boolean'||!decimal(p.generation)||(i>0&&d.plots[i-1].cell>=p.cell))||typeof d.conflict!=='boolean'||typeof d.replay!=='boolean'||!['read','tilled','already_tilled','obstructed','ground_conflict','life_conflict'].includes(d.outcome)||!(d.ack_revision===null||decimal(d.ack_revision)&&BigInt(d.ack_revision)>0n&&BigInt(d.ack_revision)<=BigInt(d.revision)))throw Error('response');return d;
 }
 async function call(args){let timer;try{return response(await Promise.race([Promise.resolve().then(()=>rpc(args)),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('timeout')),timeout))]));}finally{clearTimeout(timer);}}
 function apply(d){revision=d.revision;lifeRevision=d.life_revision;plots=copy(d.plots);outcome=d.outcome;}
 async function read(){if(busy||!current(epoch))return;const e=epoch;busy=true;emit('loading');try{const d=await call({p_token:token});if(!current(e))return;if(d.conflict||d.replay||d.ack_revision!==null||d.outcome!=='read')throw Error('response');apply(d);rest();}catch{if(current(e))emit('error');}finally{if(e===epoch)busy=false;}}
 async function activate(id,nextToken){epoch++;owner=String(id||'');token=String(nextToken||'');busy=false;revision='0';lifeRevision='0';plots=[];pending=null;list=[];status='idle';outcome=null;try{scan();pending=list.length===1?list[0]:null;}catch{emit('unreadable');return;}await read();}
 function deactivate(){epoch++;busy=false;owner='';token='';pending=null;list=[];plots=[];revision='0';lifeRevision='0';outcome=null;status='idle';}
 async function send(){if(busy||!pending||!current(epoch))return;const e=epoch,d=copy(pending);busy=true;
  try{persist(d);}catch{busy=false;emit('storage-error');return;}
  emit('saving');try{const r=await call({p_token:token,p_cell:d.cell,p_map:d.map,p_expected_revision:d.expected,p_life_revision:d.life,p_request_id:d.id});if(!current(e))return;
   if(!r.conflict&&(r.ack_revision===null||!['tilled','already_tilled','obstructed'].includes(r.outcome))||r.conflict&&(r.replay||r.ack_revision!==null||!['ground_conflict','life_conflict'].includes(r.outcome)))throw Error('response');apply(r);
   if(r.conflict){emit('conflict');return;}forget(d);pending=null;rest();
  }catch{if(current(e))emit('error');}finally{if(e===epoch)busy=false;}
 }
 function dig(cell,life){if(status!=='ready'||busy||!current(epoch)||!groundAllowed(cell)||!decimal(String(life))||BigInt(life)<1n||BigInt(revision)>=9223372036854775806n)return false;try{scan();}catch{emit('unreadable');return false;}if(list.length){rest();return false;}
  pending={v:1,id:crypto.randomUUID(),cell,map:GROUND_MAP,expected:revision,life:String(life)};remember(pending);void send();return true;
 }
 function retry(){if(busy||!current(epoch))return;if(pending)void send();else void read();}
 function keepServer(){if(status!=='conflict'||!pending||busy||!current(epoch))return;try{const raw=JSON.stringify(pending),k=`classRpgSchoolGround_v1_${owner}_conflict_${pending.id}`;const old=storage.getItem(k);if(old!==null&&old!==raw)throw Error('storage');storage.setItem(k,raw);if(storage.getItem(k)!==raw)throw Error('storage');forget(pending);pending=null;rest();}catch{emit('storage-error');}}
 function selectPending(id){if(status!=='recovery'||busy||!current(epoch))return;pending=list.find(x=>x.id===id)||null;if(pending)emit('pending');}
 function storageChanged(){if(busy||!owner||!current(epoch))return;try{scan();}catch{emit('unreadable');return;}void read();}
 return {activate,deactivate,read,dig,retry,keepServer,selectPending,storageChanged,snapshot};
}
