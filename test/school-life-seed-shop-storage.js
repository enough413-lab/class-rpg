const copy=x=>structuredClone(x),decimal=x=>typeof x==='string'&&/^(0|[1-9][0-9]{0,18})$/.test(x)&&BigInt(x)<=9223372036854775806n;
const money=x=>Number.isInteger(x)&&x>=0&&x<=2147483647;
const successes=['bought','insufficient_gold','bag_full','price_changed'],conflicts=['garden_conflict','life_conflict'];
const intent=d=>d&&Object.keys(d).length===6&&d.v===1&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(d.id)&&decimal(d.expected)&&BigInt(d.expected)>0n&&BigInt(d.expected)<9223372036854775806n&&decimal(d.life)&&BigInt(d.life)>0n&&Number.isInteger(d.kind)&&d.kind>=0&&d.kind<5&&money(d.price)&&d.price>0;
export function createSeedShopStorage({rpc,identity,storage=localStorage,onChange=()=>{},timeout=15000}){
 let owner='',token='',epoch=0,status='idle',revision='0',lifeRevision='0',gold=null,products=[],enrolled=false,pending=null,list=[],busy=false,outcome=null,command=null;
 const memory=new Map(),prefix=()=>'classRpgSchoolSeeds_v1_'+owner+'_intent_';
 const current=e=>e===epoch&&String(identity().id||'')===owner&&String(identity().token||'')===token;
 const snapshot=()=>({status,revision,lifeRevision,gold,products:copy(products),enrolled,pending:pending&&copy(pending),copies:list.map(copy),outcome,command:command&&copy(command)});
 const emit=s=>{status=s;onChange(snapshot());};
 function scan(){const found=new Map(memory.get(owner)||[]);for(let i=0;i<storage.length;i++){const k=storage.key(i);if(!k?.startsWith(prefix()))continue;const d=JSON.parse(storage.getItem(k));if(!intent(d)||k!==prefix()+d.id||found.has(d.id)&&JSON.stringify(found.get(d.id))!==JSON.stringify(d))throw Error('unreadable');found.set(d.id,d);}list=[...found.values()];return list;}
 function remember(d){const entries=memory.get(owner)||new Map();entries.set(d.id,copy(d));memory.set(owner,entries);}
 function persist(d){const k=prefix()+d.id,raw=JSON.stringify(d),old=storage.getItem(k);if(old!==null&&old!==raw)throw Error('unreadable');if(old===null)storage.setItem(k,raw);if(storage.getItem(k)!==raw)throw Error('storage');}
 function forget(d){const k=prefix()+d.id,raw=storage.getItem(k);if(raw!==null&&raw!==JSON.stringify(d))throw Error('unreadable');storage.removeItem(k);memory.get(owner)?.delete(d.id);}
 function rest(){scan();pending=list.length===1?list[0]:null;emit(list.length>1?'recovery':pending?'pending':'ready');}
 function response(r){if(r?.error)throw Error('network');const d=r?.data;
  if(!d||d.protocol!==1||d.kind!=='school_seed_shop'||!decimal(d.revision)||!decimal(d.life_revision)||!money(d.gold)||typeof d.enrolled!=='boolean'||d.enrolled!==(d.revision!=='0')||!Array.isArray(d.products)||d.products.length!==5||d.products.some((p,i)=>p?.kind!==i||!money(p.price)||p.price<1||!decimal(p.seeds)||BigInt(p.seeds)>999999n)||typeof d.conflict!=='boolean'||typeof d.replay!=='boolean'||!['read',...successes,...conflicts].includes(d.outcome)||!money(d.paid)||!(d.ack_revision===null||decimal(d.ack_revision)&&BigInt(d.ack_revision)>0n&&BigInt(d.ack_revision)<=BigInt(d.revision)))throw Error('response');return d;
 }
 async function call(args){let timer;try{return response(await Promise.race([Promise.resolve().then(()=>rpc(args)),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('timeout')),timeout))]));}finally{clearTimeout(timer);}}
 function apply(d){revision=d.revision;lifeRevision=d.life_revision;gold=d.gold;products=copy(d.products);enrolled=d.enrolled;outcome=d.outcome;}
 async function read(){if(busy||!current(epoch))return;const e=epoch;busy=true;command=null;emit('loading');try{const d=await call({p_token:token});if(!current(e))return;if(d.conflict||d.replay||d.ack_revision!==null||d.outcome!=='read'||d.paid!==0)throw Error('response');apply(d);rest();}catch{if(current(e))emit('error');}finally{if(e===epoch)busy=false;}}
 async function activate(id,nextToken){epoch++;owner=String(id||'');token=String(nextToken||'');busy=false;revision='0';lifeRevision='0';gold=null;products=[];enrolled=false;pending=null;list=[];status='idle';outcome=null;command=null;try{scan();pending=list.length===1?list[0]:null;}catch{emit('unreadable');return;}await read();}
 function deactivate(){epoch++;busy=false;owner='';token='';pending=null;list=[];products=[];gold=null;enrolled=false;revision='0';lifeRevision='0';outcome=null;command=null;status='idle';}
 async function send(){if(busy||!pending||!current(epoch))return;const e=epoch,d=copy(pending);busy=true;command=null;
  try{persist(d);}catch{busy=false;emit('storage-error');return;}emit('saving');
  try{const r=await call({p_token:token,p_kind:d.kind,p_price:d.price,p_expected_revision:d.expected,p_life_revision:d.life,p_request_id:d.id});if(!current(e))return;
   if(!r.conflict&&(r.ack_revision===null||BigInt(r.ack_revision)!==BigInt(d.expected)+1n||!successes.includes(r.outcome)||!r.enrolled||r.paid!==(r.outcome==='bought'?d.price:0))||r.conflict&&(r.replay||r.ack_revision!==null||!conflicts.includes(r.outcome)||r.paid!==0))throw Error('response');apply(r);
   if(r.conflict){emit('conflict');return;}forget(d);pending=null;command={id:d.id,kind:d.kind,outcome:r.outcome,replay:r.replay,paid:r.paid};rest();
  }catch{if(current(e))emit('error');}finally{if(e===epoch)busy=false;}
 }
 function buy(kind){if(status!=='ready'||busy||!current(epoch)||!enrolled||BigInt(lifeRevision)<1n||BigInt(revision)>=9223372036854775806n||!products[kind])return false;try{scan();}catch{emit('unreadable');return false;}if(list.length){rest();return false;}
  const d={v:1,id:crypto.randomUUID(),expected:revision,life:lifeRevision,kind,price:products[kind].price};if(!intent(d))return false;pending=d;remember(d);void send();return true;
 }
 function retry(){if(busy||!current(epoch))return;if(pending)void send();else void read();}
 function keepServer(){if(status!=='conflict'||!pending||busy||!current(epoch))return;try{const raw=JSON.stringify(pending),k='classRpgSchoolSeeds_v1_'+owner+'_conflict_'+pending.id;const old=storage.getItem(k);if(old!==null&&old!==raw)throw Error('storage');storage.setItem(k,raw);if(storage.getItem(k)!==raw)throw Error('storage');forget(pending);pending=null;rest();}catch{emit('storage-error');}}
 function selectPending(id){if(status!=='recovery'||busy||!current(epoch))return;pending=list.find(x=>x.id===id)||null;if(pending)emit('pending');}
 function storageChanged(){if(busy||!owner||!current(epoch))return;try{scan();}catch{emit('unreadable');return;}void read();}
 return {activate,deactivate,read,buy,retry,keepServer,selectPending,storageChanged,snapshot};
}

