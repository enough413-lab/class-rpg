import {createMarketStorage} from './school-life-market-storage.js?v=20261124-market';
import {CROPS} from './school-life-crops.js?v=20261118-seeds';
const art=['flower-harmony-v2.webp','flowerPink-harmony-v2.webp','flowerBlue-harmony-v2.webp','carrot-v1.webp','radish-v1.webp'];
export function createMarket(api){
 let selected=0,handled=null;
 const visible=()=>!!api.overlay().querySelector('.life-market');
 const store=createMarketStorage({identity:api.identity,rpc:api.rpc,onChange:s=>{
  if(!api.valid())return;
  if(s.command&&s.command.id!==handled){handled=s.command.id;void api.finished();}
  if(visible())render();
 }});
 function render(){
  if(!api.valid())return;
  const root=api.overlay(),prior=root.querySelector('.life-book-body'),scroll=prior?.scrollTop||0,focus=root.contains(document.activeElement)?document.activeElement.dataset.marketFocus:null;
  const s=store.snapshot(),active=s.status==='ready',p=s.products[selected];
  let message=({idle:'가게 여는 중…',loading:'가게 여는 중…',saving:'판매 중…',pending:'확인하지 못한 판매가 있다.',error:s.pending?'판매 결과를 확인하지 못했다.':'가게를 불러오지 못했다.','storage-error':'판매 기록을 이 기기에 남기지 못했다.',conflict:'다른 곳에서 주머니나 학교가 바뀌었다.',recovery:'확인하지 못한 판매가 여러 개 있다.',unreadable:'이 기기의 판매 기록을 읽지 못했다.'})[s.status]||'';
  if(active&&s.command)message=({sold:CROPS[s.command.kind].name+' 1개 · +'+s.command.paid+' G',no_stock:'팔 수 있는 수확물이 없다.',daily_limit:'오늘은 여기까지. 내일 다시 팔 수 있다.',price_changed:'가격이 바뀌었다.',gold_full:'골드를 더 받을 수 없다.',clock_backwards:'날짜 확인 뒤 다시 팔 수 있다.'})[s.command.outcome];
  if(active&&!api.ready())message='수확물 기록 확인 필요';
  const rows=s.products.map(x=>'<button class="life-seed-product" data-market-kind="'+x.kind+'" data-market-focus="kind'+x.kind+'" aria-pressed="'+(selected===x.kind)+'" '+(!active?'disabled':'')+'><img src="maps/life/'+art[x.kind]+'" alt=""><span><strong>'+CROPS[x.kind].name+'</strong><small>보관 '+x.items+'개 · 판매 가능 '+x.sellable+'개</small></span><b>'+x.price+' G</b></button>').join('');
  let controls='';
  if(active&&p)controls='<p class="life-seed-order-name">'+CROPS[selected].name+' 1개</p><button class="life-choice" data-market-sell data-market-focus="buy" '+(!api.ready()||s.clockBackwards||s.earned+p.price>s.cap||BigInt(p.sellable)===0n||s.gold>2147483647-p.price?'disabled':'')+'>1개 판매 · '+p.price+' G</button>';
  if(active&&!api.ready())controls+='<button class="life-choice" data-market-record>수확물 기록 확인</button>';
  else if(s.status==='conflict')controls='<button class="life-choice" data-market-current data-market-focus="current">현재 기록 불러오기</button>';
  else if(s.status==='recovery')controls=s.copies.map((d,i)=>'<button class="life-choice" data-market-recover="'+d.id+'">판매 '+(i+1)+' · '+CROPS[d.kind].name+' · '+d.price+' G</button>').join('');
  else if(['pending','error','storage-error'].includes(s.status))controls='<button class="life-choice" data-market-retry data-market-focus="retry">'+(s.pending?'판매 확인':'다시 불러오기')+'</button>';
  if(active&&!message&&s.earned===s.cap)message='오늘은 여기까지. 내일 다시 팔 수 있다.';
  api.book('수확물 판매','<p class="life-page-note">새로 심어 거둔 꽃과 채소를 팔 수 있다.</p><p class="life-market-budget">오늘 판매 <strong>'+s.earned+' / '+s.cap+' G</strong> · 한국 날짜 기준</p><div class="life-seed-wallet">내 골드 <strong>'+(s.gold===null?'—':s.gold+' G')+'</strong></div><div class="life-seed-products">'+rows+'</div><div class="life-seed-checkout"><p class="life-seed-shop-status" role="status">'+message+'</p>'+controls+'</div>');
  const book=root.querySelector('.life-book');book.classList.add('life-market','life-seed-shop');book.querySelector('.life-book-close').dataset.marketFocus='close';
  const guard=b=>api.valid()&&root.contains(b)&&visible();
  root.querySelectorAll('[data-market-kind]').forEach(b=>b.onclick=()=>{if(!guard(b)||store.snapshot().status!=='ready')return;selected=Number(b.dataset.marketKind);render();root.querySelector('[data-market-focus="kind'+selected+'"]')?.focus({preventScroll:true});});
  const sell=root.querySelector('[data-market-sell]');if(sell)sell.onclick=()=>{if(guard(sell)&&api.ready())store.sell(selected);};
  const record=root.querySelector('[data-market-record]');if(record)record.onclick=()=>{if(guard(record))api.gardenPanel();};
  const retry=root.querySelector('[data-market-retry]');if(retry)retry.onclick=()=>{if(guard(retry))store.retry();};
  const current=root.querySelector('[data-market-current]');if(current)current.onclick=()=>{if(guard(current)){store.keepServer();void api.finished();}};
  root.querySelectorAll('[data-market-recover]').forEach(b=>b.onclick=()=>{if(guard(b))store.selectPending(b.dataset.marketRecover);});
  book.querySelector('.life-book-body').scrollTop=scroll;
  if(focus)root.querySelector('[data-market-focus="'+focus+'"]')?.focus({preventScroll:true});
 }
 function open(){if(!api.valid())return;if(!api.ready()){api.gardenPanel();return;}selected=0;handled=null;render();const id=api.identity();void store.activate(id.id,id.token);}
 return {open,store,refreshView:()=>{if(visible())render();},saving:()=>store.snapshot().status==='saving'};
}
