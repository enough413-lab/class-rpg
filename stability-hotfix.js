(()=>{
const app=document.getElementById('app');
const FALLBACK_STUDENTS=[
  [1,'ym3201'],[2,'ym3202'],[3,'ym3203'],[4,'ym3204'],[5,'ym3205'],[6,'ym3206'],[7,'ym3207'],
  [8,'ym3208'],[9,'ym3209'],[10,'ym3210'],[11,'ym3211'],[12,'ym3212'],[13,'ym3213'],[98,'ym3298'],[99,'ym3299']
];
function core(){try{return app.contentDocument?.getElementById('core')?.contentWindow||null}catch{return null}}
function stabilize(){const w=core(),d=w?.document;if(!d)return;
  if(d.__extraMutation?.disconnect&&!d.__extraMutationStopped){d.__extraMutation.disconnect();d.__extraMutationStopped=true}
  rescueLoginOptions(w,d);
}
function fillLoginOptions(d,rows,note=''){
  const select=d.getElementById('number');if(!select)return;
  const current=select.value;
  select.innerHTML='<option value="">번호를 골라요</option>'+rows.map(([n,id])=>`<option value="${id}">${n}번</option>`).join('');
  select.disabled=false;
  if(current&&[...select.options].some(o=>o.value===current))select.value=current;
  const msg=d.getElementById('loginMsg');
  if(msg&&note&&!msg.textContent){msg.className='message ok';msg.textContent=note}
}
async function rescueLoginOptions(w,d){
  const select=d.getElementById('number');
  if(!select||d.__loginRescueBusy)return;
  const stuck=select.disabled||/불러오는 중|계정을 불러오는 중/.test(select.textContent||'');
  if(!stuck)return;
  d.__loginRescueBusy=true;
  try{
    if(w?.db?.rpc){
      const result=await Promise.race([
        w.db.rpc('student_login_options'),
        new Promise(resolve=>setTimeout(()=>resolve({error:new Error('timeout')}),2500))
      ]);
      if(!result?.error&&Array.isArray(result?.data)&&result.data.length){
        fillLoginOptions(d,result.data.map(x=>[x.student_number,x.login_id]));
        return;
      }
    }
    fillLoginOptions(d,FALLBACK_STUDENTS,'번호 목록을 임시로 불러왔어요.');
  }catch{
    fillLoginOptions(d,FALLBACK_STUDENTS,'번호 목록을 임시로 불러왔어요.');
  }finally{d.__loginRescueBusy=false}
}
app?.addEventListener('load',()=>setTimeout(stabilize,900));
setInterval(stabilize,2000);
})();
