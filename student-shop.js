export function installStudentShop(ctx){
 const $=id=>document.getElementById(id),baseOpen=window.openShop;
 let owner='',pending=null,busy=false,selection=null;
 $('shopModal').dataset.reliableActions='true';
 const identity=()=>String(ctx.getStudent()?.id||'');
 const key=id=>'classRpgShopRequest:v1:'+location.pathname+':'+id;
 const same=id=>owner===id&&identity()===id;
 const dialog=document.createElement('dialog');dialog.className='student-purchase-dialog';dialog.id='studentPurchaseDialog';dialog.setAttribute('aria-labelledby','purchaseTitle');
 dialog.innerHTML='<div class="purchase-icon" aria-hidden="true">🎁</div><h2 id="purchaseTitle">내 모험에 더할 선물</h2><p id="purchaseProduct"></p><div id="purchaseBalance"></div><p id="purchaseHint"></p><p id="purchaseMessage" role="status"></p><div class="purchase-buttons"><button class="btn" id="purchaseCancel">더 둘러보기</button><button class="btn good" id="purchaseConfirm">구매하기</button></div>';
 document.body.append(dialog);
 $('purchaseCancel').onclick=()=>dialog.close();$('purchaseConfirm').onclick=()=>purchase();
 dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault()});
 const recovery=document.createElement('div');recovery.id='shopRecovery';recovery.hidden=true;
 recovery.innerHTML='<p>지난 구매 결과를 먼저 확인해 주세요. 골드는 한 번만 사용돼요.</p><button class="btn" id="shopRecover">구매 결과 확인하기</button>';
 $('shopMsg').after(recovery);$('shopRecover').onclick=()=>purchase();$('shopMsg').setAttribute('role','status');
 function message(text,ok=false){$('shopMsg').className='message '+(ok?'ok':'error');$('shopMsg').textContent=text}
 function persist(){try{if(pending)localStorage.setItem(key(owner),JSON.stringify(pending));else localStorage.removeItem(key(owner));return true}catch{return false}}
 function load(){owner=identity();pending=null;try{const value=JSON.parse(localStorage.getItem(key(owner))||'null');if(value?.id&&value?.payload?.product_id)pending=value}catch{}}
 function sync(){
  const locked=busy||!!pending;
  $('shopGrid').querySelectorAll('button').forEach(b=>{
   if(locked&&!b.disabled){b.dataset.purchaseLock='true';b.disabled=true}
   if(!locked&&b.dataset.purchaseLock){delete b.dataset.purchaseLock;b.disabled=false}
  });
  $('shopRecover').disabled=busy;recovery.hidden=!pending||busy;
  $('purchaseConfirm').disabled=busy;$('purchaseCancel').disabled=busy;
  $('purchaseConfirm').textContent=busy?'구매하는 중…':'구매하기';
  dialog.setAttribute('aria-busy',String(busy));
 }
 new MutationObserver(sync).observe($('shopGrid'),{childList:true,subtree:true});
 window.openShop=async()=>{if(busy&&owner!==identity())return;if(!busy)load();await baseOpen();sync()};
 window.buyItem=productId=>{
  if(busy)return;if(owner!==identity())load();if(pending){sync();message('지난 구매 결과부터 확인해 주세요.');return}
  const item=ctx.getItems().find(i=>i.product_id===productId);if(!item||item.owned||item.stock===0)return;
  if((ctx.getStudent()?.gold||0)<item.price)return message('골드가 조금 더 필요해요. 학교에서 실천한 일을 기록하며 모아 보세요.');
  selection={...item};$('purchaseProduct').textContent=item.name;
  $('purchaseBalance').innerHTML='<div><span>사용할 골드</span><b>'+Number(item.price)+' 골드</b></div><div><span>구매 뒤 남는 골드</span><b>'+((ctx.getStudent()?.gold||0)-item.price)+' 골드</b></div>';
  $('purchaseHint').textContent=item.kind==='coupon'?'선생님께 교환 요청이 보내져요. 확인받은 뒤 사용해요.':'내 옷장에 보관돼요. 원하는 때에 골라 입을 수 있어요.';
  $('purchaseMessage').textContent='';dialog.showModal();$('purchaseCancel').focus();sync();
 };
 async function purchase(){
  if(busy||!same(owner))return;
  if(!pending){
   if(!selection)return;
   pending={id:crypto.randomUUID(),payload:{product_id:selection.product_id,expected_price:selection.price},kind:selection.kind,name:selection.name};
   if(!persist()){pending=null;$('purchaseMessage').textContent='이 기기에 구매 준비를 저장하지 못했어요. 창을 닫았다가 다시 시도해 주세요.';return}
  }
  const id=owner,request=pending;busy=true;sync();message('구매 결과를 확인하고 있어요…',true);
  try{
   const {data,error}=await ctx.db.rpc('student_safe_action',{p_token:ctx.getToken(),p_request_id:request.id,p_action:'shop_buy',p_payload:request.payload});
   if(error)throw error;if(!data?.ok)throw new Error('unconfirmed');
   if(!same(id))return;
   pending=null;selection=null;persist();dialog.close();
   await Promise.allSettled([ctx.refresh(),ctx.loadShop()]);
   if(same(id))message(request.kind==='coupon'?'교환 요청을 보냈어요! 선생님의 확인을 기다려 주세요.':'“'+request.name+'” 구매 완료! 내 옷장에서 골라 입어 보세요.',true);
  }catch(error){
   if(!same(id))return;
   if(error?.code==='P0001'||/^22\w{3}$/.test(error?.code||'')){
    pending=null;selection=null;persist();dialog.close();
    await ctx.loadShop().catch(()=>{});message(error.code==='P0001'?error.message:'상품을 다시 확인해 주세요.');
   }else{dialog.close();message('연결이 잠깐 끊겼어요. 아래에서 구매 결과를 확인해 주세요.')}
  }finally{busy=false;if(same(id))sync()}
 }
 return {sync};
}
