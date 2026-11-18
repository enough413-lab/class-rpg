import {cropPolicy} from './school-life-crops.js?v=20261118-seeds';
const copy=x=>structuredClone(x),decimal=x=>typeof x==='string'&&/^(0|[1-9][0-9]{0,18})$/.test(x)&&BigInt(x)<=9223372036854775806n;
const day=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const successes=['enrolled','already_enrolled','planted','occupied','watered','empty','mature','already_watered_today','clock_backwards','harvested','not_mature','bag_full','seeds_supplied','already_supplied','no_seeds'];
const conflicts=['garden_conflict','life_conflict','plant_conflict'];
const intent=d=>d&&Object.keys(d).length===8&&d.v===1&&['enroll','plant','water','harvest','vegetables','flowers'].includes(d.action)&&decimal(d.expected)&&BigInt(d.expected)<9223372036854775806n&&decimal(d.life)&&BigInt(d.life)>0n&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(d.id)&&(['enroll','vegetables','flowers'].includes(d.action)?d.slot===null&&d.generation===null&&d.seed===null:Number.isInteger(d.slot)&&d.slot>=0&&d.slot<6&&decimal(d.generation)&&BigInt(d.generation)<9223372036854775806n&&(d.action!=='plant'?d.seed===null:Number.isInteger(d.seed)&&d.seed>=0&&d.seed<5));
const emptyStock=()=>[0,1,2,3,4].map(kind=>({kind,flowers:'0',seeds:'0'}));
const validStock=a=>Array.isArray(a)&&a.length===5&&a.every((v,i)=>v&&Object.keys(v).length===3&&v.kind===i&&decimal(v.flowers)&&decimal(v.seeds)&&BigInt(v.flowers)<=999999n&&BigInt(v.seeds)<=999999n);
function validPlant(p,i){
 const target=p?.water_target;if(!Number.isInteger(target)||target<3||target>31||!Number.isInteger(p.yield_items)||p.yield_items<1||p.yield_items>999999||!Number.isInteger(p.yield_seeds)||p.yield_seeds<0||p.yield_seeds>999999)return false;
 if(!p||Object.keys(p).length!==11||p.slot!==i||!Number.isInteger(p.kind)||p.kind<0||p.kind>4||!decimal(p.generation)||!Number.isInteger(p.stage)||p.stage<0||p.stage>3||!Number.isInteger(p.progress)||p.progress<0||p.progress>target||![0,1,3].includes(p.inherited_credit)||!Array.isArray(p.watered_days)||p.watered_days.some((d,i,a)=>!day(d)||i>0&&d<=a[i-1])||p.progress!==p.inherited_credit+p.watered_days.length)return false;
 if(p.origin==='empty')return p.stage===0&&p.progress===0;
 if(p.kind>=3&&p.origin==='legacy_visual'||p.origin==='decorative_seed'&&p.inherited_credit!==0||!['legacy_visual','decorative_seed'].includes(p.origin))return false;
 const floor=p.origin==='legacy_visual'?(p.inherited_credit===3?3:p.inherited_credit===1?2:1):1;
 return p.stage===Math.max(floor,p.progress>=target?3:p.progress>=2?2:1);
}
export function createGardenStorage({rpc,identity,storage=localStorage,onChange=()=>{},timeout=15000}){
 let owner='',token='',epoch=0,status='idle',revision='0',lifeRevision='0',plants=[],inventory=emptyStock(),policies=[],vegetableSeedsClaimed=false,flowerSeedsClaimed=false,enrolled=false,today=null,pending=null,list=[],busy=false,outcome=null,command=null;
 const memory=new Map(),prefix=()=>`classRpgSchoolGarden_v1_${owner}_intent_`;
 const current=e=>e===epoch&&String(identity().id||'')===owner&&String(identity().token||'')===token;
 const snapshot=()=>({status,revision,lifeRevision,plants:copy(plants),inventory:copy(inventory),policies:copy(policies),vegetableSeedsClaimed,flowerSeedsClaimed,enrolled,today,pending:pending&&copy(pending),copies:list.map(copy),outcome,command:command&&copy(command)});
 const emit=s=>{status=s;onChange(snapshot());};
 function scan(){const found=new Map(memory.get(owner)||[]);for(let i=0;i<storage.length;i++){const k=storage.key(i);if(!k?.startsWith(prefix()))continue;const d=JSON.parse(storage.getItem(k));if(!intent(d)||k!==prefix()+d.id||found.has(d.id)&&JSON.stringify(found.get(d.id))!==JSON.stringify(d))throw Error('unreadable');found.set(d.id,d);}list=[...found.values()];return list;}
 function remember(d){const entries=memory.get(owner)||new Map();entries.set(d.id,copy(d));memory.set(owner,entries);}
 function persist(d){const k=prefix()+d.id,raw=JSON.stringify(d),old=storage.getItem(k);if(old!==null&&old!==raw)throw Error('unreadable');if(old===null)storage.setItem(k,raw);if(storage.getItem(k)!==raw)throw Error('storage');}
 function forget(d){const k=prefix()+d.id,raw=storage.getItem(k);if(raw!==null&&raw!==JSON.stringify(d))throw Error('unreadable');storage.removeItem(k);memory.get(owner)?.delete(d.id);}
 function rest(){scan();pending=list.length===1?list[0]:null;emit(list.length>1?'recovery':pending?'pending':'ready');}
 function response(r){if(r?.error)throw Error('network');const d=r?.data;
  if(!d||d.protocol!==2||d.kind!=='school_garden'||d.policy!=='korea-crops-v2'||!Array.isArray(d.policies)||d.policies.length!==5||d.policies.some((p,i)=>p.kind!==i||!cropPolicy(i,d.policies))||typeof d.vegetable_seeds_claimed!=='boolean'||typeof d.flower_seeds_claimed!=='boolean'||d.inventory_trust!=='decorative_only'||!validStock(d.inventory)||!decimal(d.revision)||!decimal(d.life_revision)||typeof d.enrolled!=='boolean'||!day(d.today)||!Array.isArray(d.plants)||d.plants.length!==(d.enrolled?6:0)||d.enrolled!==(d.revision!=='0')||d.plants.some((p,i)=>!validPlant(p,i))||typeof d.conflict!=='boolean'||typeof d.replay!=='boolean'||!['read',...successes,...conflicts].includes(d.outcome)||!(d.ack_revision===null||decimal(d.ack_revision)&&BigInt(d.ack_revision)>0n&&BigInt(d.ack_revision)<=BigInt(d.revision)))throw Error('response');return d;
 }
 async function call(args){let timer;try{return response(await Promise.race([Promise.resolve().then(()=>rpc(args)),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('timeout')),timeout))]));}finally{clearTimeout(timer);}}
 function apply(d){revision=d.revision;lifeRevision=d.life_revision;plants=copy(d.plants);inventory=copy(d.inventory);policies=copy(d.policies);vegetableSeedsClaimed=d.vegetable_seeds_claimed;flowerSeedsClaimed=d.flower_seeds_claimed;enrolled=d.enrolled;today=d.today;outcome=d.outcome;}
 async function read(){if(busy||!current(epoch))return;const e=epoch;busy=true;command=null;emit('loading');try{const d=await call({p_token:token});if(!current(e))return;if(d.conflict||d.replay||d.ack_revision!==null||d.outcome!=='read')throw Error('response');apply(d);rest();}catch{if(current(e))emit('error');}finally{if(e===epoch)busy=false;}}
 async function activate(id,nextToken){epoch++;owner=String(id||'');token=String(nextToken||'');busy=false;revision='0';lifeRevision='0';plants=[];inventory=emptyStock();policies=[];vegetableSeedsClaimed=false,flowerSeedsClaimed=false;enrolled=false;today=null;pending=null;list=[];status='idle';outcome=null;command=null;try{scan();pending=list.length===1?list[0]:null;}catch{emit('unreadable');return;}await read();}
 function deactivate(){epoch++;busy=false;owner='';token='';pending=null;list=[];plants=[];inventory=emptyStock();policies=[];vegetableSeedsClaimed=false,flowerSeedsClaimed=false;enrolled=false;today=null;revision='0';lifeRevision='0';outcome=null;command=null;status='idle';}
 async function send(){if(busy||!pending||!current(epoch))return;const e=epoch,d=copy(pending);busy=true;command=null;
  try{persist(d);}catch{busy=false;emit('storage-error');return;}
  emit('saving');try{const r=await call({p_token:token,p_action:d.action,p_expected_revision:d.expected,p_life_revision:d.life,p_request_id:d.id,p_slot:d.slot,p_generation:d.generation,p_seed:d.seed});if(!current(e))return;
   const allowed=d.action==='enroll'?['enrolled','already_enrolled']:['vegetables','flowers'].includes(d.action)?['seeds_supplied','already_supplied','bag_full']:d.action==='plant'?['planted','occupied','clock_backwards','no_seeds']:d.action==='harvest'?['harvested','not_mature','bag_full']:['watered','empty','mature','already_watered_today','clock_backwards'];
   if(!r.conflict&&(r.ack_revision===null||BigInt(r.ack_revision)!==BigInt(d.expected)+1n||!allowed.includes(r.outcome)||!r.enrolled)||r.conflict&&(r.replay||r.ack_revision!==null||!conflicts.includes(r.outcome)))throw Error('response');apply(r);
   if(r.conflict){emit('conflict');return;}forget(d);pending=null;command={id:d.id,action:d.action,slot:d.slot,outcome:r.outcome,replay:r.replay};rest();
  }catch{if(current(e))emit('error');}finally{if(e===epoch)busy=false;}
 }
 function act(action,life,slot=null,seed=null){if(status!=='ready'||busy||!current(epoch)||!decimal(String(life))||BigInt(life)<1n||BigInt(revision)>=9223372036854775806n||action!=='enroll'&&!enrolled)return false;try{scan();}catch{emit('unreadable');return false;}if(list.length){rest();return false;}
  const d={v:1,id:crypto.randomUUID(),action,expected:revision,life:String(life),slot,generation:slot===null?null:plants[slot]?.generation,seed};if(!intent(d))return false;pending=d;remember(pending);void send();return true;
 }
 function retry(){if(busy||!current(epoch))return;if(pending)void send();else void read();}
 function keepServer(){if(status!=='conflict'||!pending||busy||!current(epoch))return;try{const raw=JSON.stringify(pending),k=`classRpgSchoolGarden_v1_${owner}_conflict_${pending.id}`;const old=storage.getItem(k);if(old!==null&&old!==raw)throw Error('storage');storage.setItem(k,raw);if(storage.getItem(k)!==raw)throw Error('storage');forget(pending);pending=null;rest();}catch{emit('storage-error');}}
 function selectPending(id){if(status!=='recovery'||busy||!current(epoch))return;pending=list.find(x=>x.id===id)||null;if(pending)emit('pending');}
 function storageChanged(){if(busy||!owner||!current(epoch))return;try{scan();}catch{emit('unreadable');return;}void read();}
 return {activate,deactivate,read,enroll:life=>act('enroll',life),claimVegetables:life=>act('vegetables',life),claimFlowers:life=>act('flowers',life),plant:(slot,seed,life)=>act('plant',life,slot,seed),water:(slot,life)=>act('water',life,slot),harvest:(slot,life)=>act('harvest',life,slot),retry,keepServer,selectPending,storageChanged,snapshot};
}
