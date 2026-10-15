// One personal meal per student. Sitting is local; carried contents resume elsewhere.
export const mealState=s=>s?.v===1&&['free','carrying','eating','finished'].includes(s.mode)&&Number.isInteger(s.bites)&&s.bites>=0&&s.bites<=3&&Number.isInteger(s.meals)&&s.meals>=0&&s.meals<=999&&typeof s.washed==='boolean'&&(s.mode==='finished'?s.bites===3:s.mode==='free'?s.bites===0:s.bites<3);
const portable=s=>({v:1,mode:s.mode==='eating'?'carrying':s.mode,bites:s.bites,meals:s.meals,washed:s.washed});
const same=(a,b)=>JSON.stringify(portable(a))===JSON.stringify(portable(b));
const validRequest=r=>r&&Number.isSafeInteger(r.p_expected_revision)&&r.p_expected_revision>=0&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(r.p_request_id)&&mealState(r.p_state);
export function installMealMemory(c,changed,notice){
 const entries=new Map();let active=null;
 const key=id=>'classRpgCafeteriaCloud_v1_'+id;
 const current=e=>active===e&&c.getStudent()?.id===e.id&&c.getToken()===e.token;
 function persist(e){try{localStorage.setItem(key(e.id),JSON.stringify({pending:e.pending}));e.durable=true}catch{e.durable=false}}
 function announce(e){if(current(e))notice()}
 async function run(e){
  if(e.running||!current(e)||!e.id||!e.token)return;
  e.running=true;e.status=e.pending?'saving':'loading';announce(e);
  let timer;
  try{
   const result=await Promise.race([c.db.rpc('student_cafeteria_play',{p_token:e.token,...(e.pending||{})}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),8000)})]);
   if(!current(e))return;
   const d=result.data;if(result.error||!mealState(d?.state)||!Number.isSafeInteger(d.revision)||d.revision<0)throw Error('meal unavailable');
   const sent=e.pending;e.pending=null;e.revision=d.revision;e.status='ready';
   if(!sent&&d.revision===0&&e.legacy){
    const legacy=e.legacy;e.legacy=null;e.value=portable(legacy);e.pending={p_expected_revision:0,p_request_id:crypto.randomUUID(),p_state:e.value};persist(e);
   }else{
    e.legacy=null;e.value=portable(d.state);persist(e);
    if(!sent||d.conflict)changed(e.value,d.conflict?'다른 기기에서 이어 한 식판을 가져왔어요.':'');
   }
  }catch{if(current(e))e.status='error'}
  finally{clearTimeout(timer);e.running=false;announce(e)}
  if(current(e)&&e.pending&&e.status==='ready')void run(e);
 }
 return {
  activate(id,token,legacy){
   if(active&&active.id===id&&active.token===token)return;
   const prior=entries.get(id);let pending=prior?.pending||null;
   if(!pending)try{const data=JSON.parse(localStorage.getItem(key(id))||'null');if(validRequest(data?.pending))pending={p_state:portable(data.pending.p_state),p_request_id:data.pending.p_request_id,p_expected_revision:data.pending.p_expected_revision}}catch{}
   active={id,token,pending,legacy:mealState(legacy)?portable(legacy):null,value:pending?portable(pending.p_state):mealState(legacy)?portable(legacy):{v:1,mode:'free',bites:0,meals:0,washed:false},revision:null,status:'loading',running:false,durable:true};
   entries.set(id,active);if(pending)changed(pending.p_state,'');void run(active);
  },
  save(state){const e=active;if(!e||same(e.value,state)||e.status!=='ready'||e.pending)return;e.value=portable(state);e.pending={p_expected_revision:e.revision,p_request_id:crypto.randomUUID(),p_state:e.value};persist(e);void run(e)},
  blocked(){return !active||active.status!=='ready'||!!active.pending},
  status(){return active?.status||'loading'},
  retry(){if(active)void run(active)},
  refresh(){if(active&&!active.pending&&!active.running)void run(active)}
 };
}
