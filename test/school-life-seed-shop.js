import {createSeedShopStorage} from './school-life-seed-shop-storage.js?v=20261123-seed-shop';
import {CROPS} from './school-life-crops.js?v=20261118-seeds';
const art=['flower-harmony-v2.webp','flowerPink-harmony-v2.webp','flowerBlue-harmony-v2.webp','carrot-v1.webp','radish-v1.webp'];
export function createSeedShop(api){
 let selected=0,handled=null;
 const visible=()=>!!api.overlay().querySelector('.life-seed-shop:not(.life-market)');
 const store=createSeedShopStorage({identity:api.identity,rpc:api.rpc,onChange:s=>{
  if(!api.valid())return;
  if(s.command&&s.command.id!==handled){handled=s.command.id;void api.finished();}
  if(visible())render();
 }});
 function render(){
  if(!api.valid())return;
  const root=api.overlay(),prior=root.querySelector('.life-book-body'),scroll=prior?.scrollTop||0,focus=root.contains(document.activeElement)?document.activeElement.dataset.shopFocus:null;
  const s=store.snapshot(),active=s.status==='ready',p=s.products[selected];
  let message=({idle:'가게 여는 중…',loading:'가게 여는 중…',saving:'구매 중…',pending:'확인하지 못한 구매가 있다.',error:s.pending?'구매 결과를 확인하지 못했다.':'가게를 불러오지 못했다.','storage-error':'구매 기록을 이 기기에 남기지 못했다.',conflict:'다른 곳에서 씨앗이나 학교가 바뀌었다.',recovery:'확인하지 못한 구매가 여러 개 있다.',unreadable:'이 기기의 구매 기록을 읽지 못했다.'})[s.status]||'';
  if(active&&s.command)message=({bought:CROPS[s.command.kind].name+' 씨앗 1개 · −'+s.command.paid+' G',insufficient_gold:'골드가 부족하다.',bag_full:'씨앗을 더 담을 수 없다.',price_changed:'가격이 바뀌었다.'})[s.command.outcome];
  if(active&&!api.ready())message='씨앗 기록 확인 필요';
  const rows=s.products.map(x=>'<button class="life-seed-product" data-shop-kind="'+x.kind+'" data-shop-focus="kind'+x.kind+'" aria-pressed="'+(selected===x.kind)+'" '+(!active?'disabled':'')+'><img src="maps/life/'+art[x.kind]+'" alt=""><span><strong>'+CROPS[x.kind].name+'</strong><small>보유 '+x.seeds+'개</small></span><b>'+x.price+' G</b></button>').join('');
  let controls='';
  if(active&&p)controls='<p class="life-seed-order-name">'+CROPS[selected].name+' 씨앗 1개</p><button class="life-choice" data-shop-buy data-shop-focus="buy" '+(!api.ready()||s.gold<p.price||BigInt(p.seeds)>=999999n?'disabled':'')+'>1개 구매 · '+p.price+' G</button>';
  if(active&&!api.ready())controls+='<button class="life-choice" data-shop-record>씨앗 기록 확인</button>';
  else if(s.status==='conflict')controls='<button class="life-choice" data-shop-current data-shop-focus="current">현재 기록 불러오기</button>';
  else if(s.status==='recovery')controls=s.copies.map((d,i)=>'<button class="life-choice" data-shop-recover="'+d.id+'">구매 '+(i+1)+' · '+CROPS[d.kind].name+' · '+d.price+' G</button>').join('');
  else if(['pending','error','storage-error'].includes(s.status))controls='<button class="life-choice" data-shop-retry data-shop-focus="retry">'+(s.pending?'구매 확인':'다시 불러오기')+'</button>';
  api.book('씨앗 가게','<div class="life-seed-wallet">내 골드 <strong>'+(s.gold===null?'—':s.gold+' G')+'</strong></div><div class="life-seed-products">'+rows+'</div><div class="life-seed-checkout"><p class="life-seed-shop-status" role="status">'+message+'</p>'+controls+'</div>');
  const book=root.querySelector('.life-book');book.classList.add('life-seed-shop');book.querySelector('.life-book-close').dataset.shopFocus='close';
  const guard=b=>api.valid()&&root.contains(b)&&visible();
  root.querySelectorAll('[data-shop-kind]').forEach(b=>b.onclick=()=>{if(!guard(b)||store.snapshot().status!=='ready')return;selected=Number(b.dataset.shopKind);render();root.querySelector('[data-shop-focus="kind'+selected+'"]')?.focus({preventScroll:true});});
  const buy=root.querySelector('[data-shop-buy]');if(buy)buy.onclick=()=>{if(guard(buy)&&api.ready())store.buy(selected);};
  const record=root.querySelector('[data-shop-record]');if(record)record.onclick=()=>{if(guard(record))api.gardenPanel();};
  const retry=root.querySelector('[data-shop-retry]');if(retry)retry.onclick=()=>{if(guard(retry))store.retry();};
  const current=root.querySelector('[data-shop-current]');if(current)current.onclick=()=>{if(guard(current)){store.keepServer();void api.finished();}};
  root.querySelectorAll('[data-shop-recover]').forEach(b=>b.onclick=()=>{if(guard(b))store.selectPending(b.dataset.shopRecover);});
  book.querySelector('.life-book-body').scrollTop=scroll;
  if(focus)root.querySelector('[data-shop-focus="'+focus+'"]')?.focus({preventScroll:true});
 }
 function open(){if(!api.valid())return;if(!api.ready()){api.gardenPanel();return;}selected=0;handled=null;render();const id=api.identity();void store.activate(id.id,id.token);}
 return {open,store,refreshView:()=>{if(visible())render();},saving:()=>store.snapshot().status==='saving'};
}

