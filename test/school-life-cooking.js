import {createCookingStorage} from './school-life-cooking-storage.js?v=20261123-harvest-uses';
import {SOUP_SVG} from './school-life-cooking-art.js?v=20261123-harvest-uses';
export const COOK_TARGET=Object.freeze({id:'cookingTable',x:1035,y:580,label:'작은 요리대',action:'요리',kind:'cook'});
export function drawCookingTable(g){
 g.save();g.translate(980,510);g.lineWidth=3;g.strokeStyle='#795b3e';
 g.fillStyle='#bd8b56';for(const x of [-51,39]){g.fillRect(x,8,12,45);g.strokeRect(x,8,12,45);}
 g.fillStyle='#d7a76a';g.beginPath();g.roundRect(-64,-5,128,19,5);g.fill();g.stroke();
 g.fillStyle='#52665c';g.beginPath();g.roundRect(-43,-13,63,13,4);g.fill();g.stroke();
 g.fillStyle='#88a99c';g.beginPath();g.moveTo(-39,-40);g.quadraticCurveTo(-36,-14,-12,-15);g.quadraticCurveTo(13,-14,16,-40);g.closePath();g.fill();g.stroke();g.beginPath();g.ellipse(-12,-40,28,8,0,0,Math.PI*2);g.fillStyle='#e1c28b';g.fill();g.stroke();
 g.beginPath();g.moveTo(-42,-34);g.lineTo(-50,-34);g.lineTo(-50,-26);g.lineTo(-38,-26);g.moveTo(17,-34);g.lineTo(25,-34);g.lineTo(25,-26);g.lineTo(13,-26);g.stroke();
 g.fillStyle='#e4cb96';g.beginPath();g.roundRect(30,-12,22,10,3);g.fill();g.stroke();g.restore();
}
export function createCooking(api){
 let handled=null;const visible=()=>!!api.overlay().querySelector('.life-cooking');
 const store=createCookingStorage({identity:api.identity,rpc:api.rpc,onChange:s=>{if(!api.valid())return;if(s.command&&s.command.id!==handled){handled=s.command.id;void api.finished();}if(visible())render();}});
 function render(){
  if(!api.valid())return;const root=api.overlay(),scroll=root.querySelector('.life-book-body')?.scrollTop||0,focus=root.contains(document.activeElement)?document.activeElement.dataset.cookFocus:null;
  const s=store.snapshot(),active=s.status==='ready',enough=s.ingredients.length===2&&s.ingredients.every(x=>BigInt(x.count)>0n),full=BigInt(s.soup)>=999999n;
  let message=({idle:'요리대 살피는 중…',loading:'요리대 살피는 중…',saving:'수프 만드는 중…',pending:'확인하지 못한 요리 기록이 있다.',error:s.pending?'요리 저장을 확인하지 못했다.':'요리 기록을 불러오지 못했다.','storage-error':'요리 기록을 이 기기에 남기지 못했다.',conflict:'다른 곳에서 재료나 학교가 바뀌었다.',recovery:'확인하지 못한 요리 기록이 여러 개 있다.',unreadable:'이 기기의 요리 기록을 읽지 못했다.'})[s.status]||'';
  if(active)message=!api.ready()?'재료 기록 확인 필요':full?'수프를 담을 자리가 없다.':s.command?.outcome==='cooked'?'채소 수프 1개를 만들었다.':!enough?'당근과 무가 각각 1개씩 필요하다.':'';
  const html='<div class="life-cooking-result">'+SOUP_SVG+'<div><h3>채소 수프</h3><p>주머니에 '+s.soup+'개</p></div></div><div class="life-cooking-ingredients">'+[3,4].map((kind,i)=>'<div class="life-item"><img src="maps/life/'+(kind===3?'carrot':'radish')+'-v1.webp" alt=""><strong>'+(kind===3?'당근':'무')+' 1개</strong><span>보유 '+(s.ingredients[i]?.count||'0')+'개</span></div>').join('')+'</div><p class="life-cooking-status" role="status">'+message+'</p><div class="life-choices">'+(active?'<button class="life-choice" data-cook-make data-cook-focus="make" '+(!api.ready()||!enough||full?'disabled':'')+'>수프 만들기</button>'+(!api.ready()?'<button class="life-choice" data-cook-record>재료 기록 확인</button>':''):s.status==='conflict'?'<button class="life-choice" data-cook-current>현재 기록 불러오기</button>':s.status==='recovery'?s.copies.map((d,i)=>'<button class="life-choice" data-cook-recover="'+d.id+'">요리 기록 '+(i+1)+'</button>').join(''):['pending','error','storage-error'].includes(s.status)?'<button class="life-choice" data-cook-retry data-cook-focus="retry">'+(s.pending?'저장 확인':'다시 불러오기')+'</button>':'')+'</div>';
  api.book('작은 요리대',html);const book=root.querySelector('.life-book');book.classList.add('life-cooking');book.querySelector('.life-book-close').dataset.cookFocus='close';
  const guard=b=>api.valid()&&root.contains(b)&&visible()&&api.reachable();
  const make=root.querySelector('[data-cook-make]');if(make)make.onclick=()=>{if(guard(make)&&api.ready())store.act();};
  const record=root.querySelector('[data-cook-record]');if(record)record.onclick=()=>{if(guard(record))api.gardenPanel();};
  const retry=root.querySelector('[data-cook-retry]');if(retry)retry.onclick=()=>{if(guard(retry))store.retry();};
  const latest=root.querySelector('[data-cook-current]');if(latest)latest.onclick=()=>{if(guard(latest)){store.keepServer();void api.finished();}};
  root.querySelectorAll('[data-cook-recover]').forEach(b=>b.onclick=()=>{if(guard(b))store.selectPending(b.dataset.cookRecover);});
  book.querySelector('.life-book-body').scrollTop=scroll;if(focus)root.querySelector('[data-cook-focus="'+focus+'"]')?.focus({preventScroll:true});
 }
 return {store,open(){if(!api.valid()||!api.reachable())return;if(!api.ready()){api.gardenPanel();return;}render();void store.read();},refreshView:()=>{if(visible())render();},saving:()=>store.snapshot().status==='saving'};
}
