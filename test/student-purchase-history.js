const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v));
export function installStudentPurchaseHistory(ctx){
 const dialog=document.createElement('dialog');dialog.id='studentPurchaseHistory';dialog.setAttribute('aria-labelledby','purchaseHistoryTitle');dialog.style.cssText='width:min(560px,calc(100% - 24px));max-height:85vh;overflow:auto;border:1px solid #dbe5de;border-radius:20px;padding:20px;color:#17362e';document.body.append(dialog);const style=document.createElement('style');style.textContent='#studentPurchaseHistory button{min-height:44px;padding:9px 12px;font:inherit;border:1px solid #dbe5de;border-radius:10px;background:#f5f7f1}';document.head.append(style);
 function attach(){const wallet=document.getElementById('shopCouponWallet');if(!wallet?.open||wallet.querySelector('[data-open-purchase-history]'))return;const button=document.createElement('button');button.type='button';button.className='btn';button.dataset.openPurchaseHistory='true';button.textContent='구매 영수증';wallet.querySelector('header').after(button);button.onclick=()=>{wallet.close();open()}}new MutationObserver(attach).observe(document.body,{childList:true,subtree:true});
 let owner='',version=0,busy=false,rows=[],cursorAt=null,cursorId=null,more=false;
 const identity=()=>String(ctx.getStudent()?.id||'')+':'+ctx.getToken();
 const same=()=>owner===identity();
 const el=id=>document.getElementById(id);
 async function load(append=false){
  if(busy||!same())return;busy=true;const v=++version;el('purchaseHistoryStatus').textContent='실제로 결제된 영수증을 확인하고 있어요…';
  try{const {data,error}=await ctx.db.rpc('student_purchase_receipts',{p_token:ctx.getToken(),p_before_at:append?cursorAt:null,p_before_request:append?cursorId:null});if(error||!Array.isArray(data?.receipts))throw error||Error('missing receipts');if(!same()||v!==version||!dialog.open)return;
   rows=append?[...rows,...data.receipts]:data.receipts;cursorAt=data.next_before_at;cursorId=data.next_before_request;more=data.has_more===true;
   el('purchaseHistoryRows').innerHTML=rows.length?rows.map(r=>'<article style="padding:14px 0;border-top:1px solid #dbe5de;overflow-wrap:anywhere"><strong>'+esc(r.name)+'</strong><p>실제로 쓴 골드: <b>'+Number(r.price)+' G</b></p><small>'+esc(date(r.created_at))+'</small>'+(r.status?'<p>'+({pending:'선생님 확인 기다리는 중',used:'사용 확인 완료',cancelled:'취소 완료 · '+Number(r.price)+' G 환불'}[r.status]||'')+'</p>':'<p>내 옷장에 보관한 아이템이에요.</p>')+'</article>').join(''):'<p>아직 안전 구매 영수증이 없어요. 예전에 신청한 교환권은 교환권 지갑에서 볼 수 있어요.</p>';
   el('purchaseHistoryMore').hidden=!more;el('purchaseHistoryStatus').textContent=rows.length+'개 영수증을 확인했어요. 같은 구매를 다시 확인해도 골드가 또 쓰이지 않아요.';
  }catch{if(same()&&v===version&&dialog.open)el('purchaseHistoryStatus').textContent='영수증을 아직 불러오지 못했어요. 다시 확인해 주세요.'}
  finally{if(v===version){busy=false;el('purchaseHistoryRefresh').disabled=false;el('purchaseHistoryMore').disabled=false}}
 }
 function open(){owner=identity();version++;busy=false;rows=[];cursorAt=null;cursorId=null;more=false;dialog.innerHTML='<header style="display:flex;justify-content:space-between;gap:8px"><h2 id="purchaseHistoryTitle">내 구매 영수증</h2><button class="btn" data-receipts-close>닫기</button></header><p>서버에 남은 실제 결제 금액을 보여 줘요. 영수증의 상품 이름은 현재 이름으로 표시돼요.</p><div id="purchaseHistoryRows"></div><p id="purchaseHistoryStatus" role="status"></p><button class="btn" id="purchaseHistoryRefresh">다시 확인</button> <button class="btn" id="purchaseHistoryMore" hidden>이전 영수증 더 보기</button>';el('purchaseHistoryRefresh').onclick=()=>load();el('purchaseHistoryMore').onclick=()=>load(true);if(!dialog.open)dialog.showModal();load()}
 dialog.addEventListener('click',e=>{if(e.target.closest('[data-receipts-close]')){version++;busy=false;dialog.close();document.getElementById('shopWalletOpen')?.focus()}});document.addEventListener('student-dashboard-updated',()=>{if(owner&&!same()){version++;rows=[];busy=false;if(dialog.open)dialog.close();dialog.replaceChildren()}});
 return{open};
}
