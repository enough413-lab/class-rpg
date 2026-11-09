import {freshLife,readLife} from './school-life-state.js?v=20261109-cloud';
const clone=x=>structuredClone(x);
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const uuidPattern=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export function strictLifeSnapshot(value){
 const normalized=readLife(JSON.stringify(value));
 if(stable(value)!==stable(normalized))throw Error('unsupported snapshot');
 return normalized;
}
function validPending(p){
 return p&&Object.keys(p).every(k=>['p_state','p_expected_revision','p_request_id','p_local_source'].includes(k))&&Number.isSafeInteger(p.p_expected_revision)&&p.p_expected_revision>=0&&
 p.p_expected_revision<Number.MAX_SAFE_INTEGER&&uuidPattern.test(p.p_request_id)&&
 (p.p_local_source===undefined||typeof p.p_local_source==='string')&&
 !!strictLifeSnapshot(p.p_state);
}
function response(d){
 if(d?.protocol!==1||d.trust!=='client_unverified'||!Number.isSafeInteger(d.revision)||d.revision<0||
 typeof d.conflict!=='boolean'||typeof d.replay!=='boolean'||
 !Number.isFinite(Date.parse(d.server_time))||
 (d.revision===0?d.state!==null:!d.state)||
 (d.ack_revision!==null&&(!Number.isSafeInteger(d.ack_revision)||d.ack_revision<1||d.ack_revision>d.revision)))
 throw Error('unsupported response');
 return {...d,state:d.state===null?null:strictLifeSnapshot(d.state)};
}
// This adapter never writes or removes classRpgSchoolLife_v1_<owner>.
// Explicit import preserves that exact source; no merging or commerce authority.
export function createLifeStorage({storage,rpc,getIdentity,onChange=()=>{},uuid=()=>crypto.randomUUID(),timeoutMs=8000}){
 let active=null,generation=0;
 const entries=new Map();
 const current=e=>active===e&&e.generation===generation&&String(getIdentity()?.id||'')===e.owner&&String(getIdentity()?.token||'')===e.token;
 const notify=e=>{if(current(e))onChange(snapshot());};
 const cacheKey=id=>'classRpgSchoolLifeCloud_v1_'+id;
 const intentKey=(e,p)=>e.key+'_intent_'+p.p_request_id;
 function intentCopies(e){
  const ids=new Set(),prefix=e.key+'_intent_';
  if(typeof storage.key==='function')for(let i=0;i<storage.length;i++){
   const key=storage.key(i)||'',at=key.lastIndexOf(prefix);
   if(at>=0&&uuidPattern.test(key.slice(at+prefix.length)))ids.add(key.slice(at+prefix.length));
  }
  if(e.pending)ids.add(e.pending.p_request_id);
  const values=[];
  for(const id of ids){
   const raw=storage.getItem(prefix+id);if(!raw)continue;
   const d=JSON.parse(raw);
   if(d?.v!==1||d.owner!==e.owner||!validPending(d.pending)||d.pending.p_request_id!==id)throw Error('invalid intent');
   values.push(d);
  }
  return values;
 }
 function readyStatus(e){return intentCopies(e).length?'recovery':'ready';}
 function keepIntent(e){
  try{
   const key=intentKey(e,e.pending),raw=JSON.stringify({v:1,owner:e.owner,pending:e.pending}),prior=storage.getItem(key);
   if(prior!==null&&prior!==raw)throw Error('different intent');
   if(prior===null)storage.setItem(key,raw);
   return true;
  }catch{e.durable=false;e.status='storage-error';e.error='intent-backup';return false;}
 }
 function removeIntent(e,p){
  try{
   const key=intentKey(e,p),raw=JSON.stringify({v:1,owner:e.owner,pending:p});
   if(storage.getItem(key)===raw)storage.removeItem(key);
  }catch{/* A retained acknowledged intent is safe to retry; never discard another value. */}
 }
 function snapshot(){const e=active;return e?clone({owner:e.owner,status:e.status,state:e.value,revision:e.revision,pending:e.pending,server:e.server,sourceAvailable:!!e.source,serverTime:e.serverTime,durable:e.durable,error:e.error||null}):null;}
 function checkCache(e){
  if(storage.getItem(e.key)!==e.cacheRaw){e.status='local-conflict';e.error='another-tab';return false;}
  return true;
 }
 function persist(e){
  try{
   if(!checkCache(e))return false;
   const raw=JSON.stringify({v:1,owner:e.owner,revision:e.revision,state:e.value,pending:e.pending,server:e.server});
   storage.setItem(e.key,raw);e.cacheRaw=raw;e.durable=true;return true;
  }catch{e.durable=false;e.status='storage-error';e.error='local-storage';return false;}
 }
 function loadCache(e){
  e.cacheRaw=storage.getItem(e.key);
  if(!e.cacheRaw)return;
  const d=JSON.parse(e.cacheRaw);
  if(d?.v!==1||d.owner!==e.owner||!Number.isSafeInteger(d.revision)||d.revision<0)throw Error('invalid cache');
  e.revision=d.revision;e.value=strictLifeSnapshot(d.state);
  if(d.pending){if(!validPending(d.pending))throw Error('invalid pending');e.pending=clone(d.pending);}
  if(d.server)e.server=response(d.server);
 }
 async function request(e,payload){
  let timer;
  try{return await Promise.race([rpc({...payload,p_token:e.token}),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('timeout')),timeoutMs))]);}
  finally{clearTimeout(timer);}
 }
 async function read(e){
  if(!current(e)||e.running)return;
  e.running=true;e.status='loading';e.error=null;notify(e);
  try{
   const r=await request(e,{});if(!current(e))return;
   if(r.error)throw Error('read failed');const d=response(r.data);
   e.serverTime=d.server_time;e.server=d;
   if(e.pending){e.value=clone(e.pending.p_state);e.status=d.conflict?'conflict':'pending';}
   else if(d.revision){e.value=d.state;e.revision=d.revision;e.status=readyStatus(e);}
   else{e.value=e.source?readLife(e.source):freshLife();e.revision=0;e.status=e.source?'import':'ready';}
  }catch{if(current(e)){e.status='offline';e.error='server-read';}}
  finally{e.running=false;notify(e);}
 }
 async function flush(e){
  if(!current(e)||e.running||!e.pending)return;
  // Write intent must be recoverable before issuing an RPC.
  if(!keepIntent(e)||!persist(e)){notify(e);return;}
  e.running=true;e.status='saving';e.error=null;notify(e);
  const sent=clone(e.pending);
  try{
   const r=await request(e,sent);if(!current(e))return;
   if(r.error)throw Error('save failed');const d=response(r.data);
   if(!d.conflict&&(d.ack_revision!==sent.p_expected_revision+1||d.revision<d.ack_revision))throw Error('invalid acknowledgement');
   e.serverTime=d.server_time;e.server=d;
   if(d.conflict){
    // Retain the proposed save until a durable backup and explicit server choice.
    e.status='conflict';
    if(persist(e))e.status='conflict';
   }else{
    const oldValue=e.value,oldRevision=e.revision;
    e.value=d.state;e.revision=d.revision;e.pending=null;e.server=null;
    if(persist(e)){removeIntent(e,sent);e.status=readyStatus(e);}
    else{e.pending=sent;e.value=oldValue;e.revision=oldRevision;}
   }
  }catch{if(current(e)){e.status='error';e.error='server-save';}}
  finally{e.running=false;notify(e);}
 }
 function prepare(next,source){
  const e=active;
  if(!e||!current(e)||e.running||e.pending||!['ready','import'].includes(e.status))return false;
  if(e.status==='import'&&source===undefined)return false;
  try{
   if(!checkCache(e)){notify(e);return false;}
   if(source!==undefined&&storage.getItem('classRpgSchoolLife_v1_'+e.owner)!==source){e.status='local-conflict';e.error='legacy-changed';notify(e);return false;}
   const value=strictLifeSnapshot(next);
   if(e.status==='ready'&&e.revision>0&&stable(value)===stable(e.value))return true;
   e.pending={p_state:value,p_expected_revision:e.revision,p_request_id:uuid(),...(source===undefined?{}:{p_local_source:source})};
   e.value=value;e.server=null;e.status='saving';notify(e);void flush(e);return true;
  }catch{e.status='storage-error';e.error='prepare';notify(e);return false;}
 }
 return {
  async activate(id,token){
   generation++;
   const owner=String(id),previous=entries.get(owner);
   const e={owner,token:String(token||''),generation,key:cacheKey(owner),cacheRaw:null,source:null,value:freshLife(),revision:0,pending:null,server:null,serverTime:null,status:'loading',running:false,durable:true};
   active=e;entries.set(owner,e);
   try{
    e.source=storage.getItem('classRpgSchoolLife_v1_'+owner);
    // Invalid legacy data is preserved and blocks import, never silently reset.
    if(e.source!==null)e.value=readLife(e.source);
    loadCache(e);
    const copies=intentCopies(e);
    if(!e.pending&&copies.length===1){e.pending=clone(copies[0].pending);e.value=clone(e.pending.p_state);}
    if(!e.pending&&copies.length>1){e.status='recovery';notify(e);return snapshot();}
    if(previous?.pending){
     e.pending=clone(previous.pending);e.value=clone(previous.pending.p_state);e.revision=previous.revision;
     // Do not silently claim a different tab's pending cache as our own.
     if(previous.cacheRaw!==e.cacheRaw){e.status='local-conflict';notify(e);return snapshot();}
    }
   }catch{e.status='unreadable';e.error='local-read';notify(e);return snapshot();}
   await read(e);return snapshot();
  },
  detach(){generation++;active=null;},
  snapshot,
  pendingCopies(){const e=active;if(!e||!current(e))return [];try{return clone(intentCopies(e));}catch{return [];}},
  choosePending(requestId){
   const e=active;if(!e||!current(e)||e.running||!['recovery','pending','conflict','ready'].includes(e.status))return false;
   try{
    const copy=intentCopies(e).find(d=>d.pending.p_request_id===requestId);if(!copy)return false;
    if(e.pending&&e.pending.p_request_id!==requestId&&!keepIntent(e)){notify(e);return false;}
    e.pending=clone(copy.pending);e.value=clone(e.pending.p_state);e.server=null;e.status='pending';notify(e);return true;
   }catch{e.status='unreadable';notify(e);return false;}
  },
  pendingCopy(requestId){
   const e=active;if(!e||!current(e)||!uuidPattern.test(requestId))return null;
   try{
    const raw=storage.getItem(e.key+'_intent_'+requestId);if(!raw)return null;
    const d=JSON.parse(raw);
    return d?.v===1&&d.owner===e.owner&&validPending(d.pending)?clone(d):null;
   }catch{return null;}
  },
  save(next){return prepare(next);},
  importLocal(){
   const e=active;if(!e||e.status!=='import'||!e.source)return false;
   return prepare(readLife(e.source),e.source);
  },
  async retry(){
   const e=active;if(!e||!current(e)||e.running)return;
   if(e.status==='local-conflict'||e.status==='unreadable')return;
   if(e.pending)await flush(e);else await read(e);
  },
  async refresh(){const e=active;if(e&&!e.pending&&!e.running)await read(e);},
  async reloadLocal(){
   const e=active;if(!e||!current(e)||e.running||e.status!=='local-conflict')return false;
   try{
    if(e.pending){
     const key=e.key+'_local_conflict_'+e.pending.p_request_id;
     const raw=JSON.stringify({owner:e.owner,pending:e.pending});
     const prior=storage.getItem(key);
     if(prior!==null&&prior!==raw)throw Error('backup differs');
     storage.setItem(key,raw);
     removeIntent(e,e.pending);
    }
    entries.delete(e.owner);
    await this.activate(e.owner,e.token);return true;
   }catch{e.status='storage-error';e.error='local-backup';notify(e);return false;}
  },
  acceptServer(){
   const e=active;if(!e||!current(e)||e.running||e.status!=='conflict'||!e.pending||!e.server?.state)return false;
   try{
    if(!checkCache(e)){notify(e);return false;}
    const backupKey=e.key+'_conflict_'+e.pending.p_request_id;
    const backup=JSON.stringify({owner:e.owner,pending:e.pending,server:e.server});
    const prior=storage.getItem(backupKey);
    if(prior!==null&&prior!==backup)throw Error('backup exists');
    storage.setItem(backupKey,backup);
    const previous={value:e.value,revision:e.revision,pending:e.pending,server:e.server};
    e.value=e.server.state;e.revision=e.server.revision;e.pending=null;e.server=null;
    if(!persist(e)){Object.assign(e,previous);notify(e);return false;}
    removeIntent(e,previous.pending);
    e.status=readyStatus(e);e.error=null;notify(e);return true;
   }catch{e.status='storage-error';e.error='conflict-backup';notify(e);return false;}
  }
 };
}
