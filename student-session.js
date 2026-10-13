export function installStudentSession(ctx){
 const doc=ctx.doc||document;
 let leaving=false;
 function clearView(message='로그인이 만료됐어요. 다시 들어와 주세요.'){
  ctx.clear();
  for(const d of doc.querySelectorAll('dialog[open]'))d.close();
  for(const el of doc.querySelectorAll('.modal-backdrop'))el.classList.add('hidden');
  for(const el of doc.querySelectorAll('.reward-notice-backdrop,.achievement-backdrop,.classreward-backdrop,.milestone-backdrop,.levelup-backdrop'))el.remove();
  doc.getElementById('classroomHub')?.classList.add('hidden');
  ctx.showLogin();const status=doc.getElementById('loginMsg');status.textContent=message;status.className='message error';
  doc.getElementById('pin')?.focus();
 }
 async function logout(){
  if(leaving)return;
  const token=ctx.getToken();if(!token){clearView('내 번호와 비밀번호로 다시 들어올 수 있어요.');return}
  leaving=true;
  try{
   const {data,error}=await ctx.db.rpc('student_logout',{p_token:token});if(error||data?.ok!==true)throw error||Error('unconfirmed logout');
   clearView('안전하게 나갔어요. 다음에 내 번호와 비밀번호로 다시 들어와 주세요.');
  }catch{const status=doc.getElementById('saNetwork');if(status){status.hidden=false;status.textContent='서버에서 나가기를 확인하지 못했어요. 인터넷 연결 후 나가기를 다시 눌러 주세요.'}}
  finally{leaving=false}
 }
 return {expire:clearView,logout};
}
