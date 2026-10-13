const HELP_CODES={student_login:'RPG-L01',student_login_options:'RPG-L02',student_dashboard:'RPG-D01',student_shop:'RPG-S01',student_shop_wallet:'RPG-S02',student_purchase_receipts:'RPG-S04',student_gold_history:'RPG-G01',student_shop_product_detail:'RPG-S03',student_safe_action:'RPG-A01',student_reading_journal:'RPG-R01',student_reading_shelf:'RPG-R02',student_submit_quest_evidence:'RPG-Q01',student_submit_quest_guarded:'RPG-Q02',student_quest_context:'RPG-Q03',student_quest_history:'RPG-Q04',student_quest_schedule:'RPG-Q05',student_request_coupon_cancel:'RPG-S05',student_change_pin:'RPG-P01',student_logout:'RPG-X01'};
export function installStudentDiagnostics(db,doc=document){
 const base=db.rpc.bind(db);let last=null;
 function note(name){
  const code=HELP_CODES[name]||'RPG-C01';last={code,version:'20261013-session',at:new Date().toISOString()};
  setTimeout(()=>{
   for(const el of doc.querySelectorAll('.message.error')){
    if(!el.getClientRects().length||!el.textContent||el.querySelector('.student-diagnostic'))continue;
    const hint=doc.createElement('small');hint.className='student-diagnostic';hint.style.cssText='display:block;margin-top:6px;font-weight:400';hint.textContent='선생님께 이 도움 번호를 보여 주세요: '+code;el.append(hint);
   }
  },0);
 }
 db.rpc=async(name,...args)=>{
  try{const result=await base(name,...args);if(result?.error&&result.error.code!=='P0001')note(String(name));return result}
  catch(error){note(String(name));throw error}
 };
 // Never retain request arguments, credentials, student identity, writing or photos.
 return {snapshot:()=>last?{...last}:null};
}
