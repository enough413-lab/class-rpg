import {createFlowerDisplayStorage} from './school-life-flower-display-storage.js?v=20261123-harvest-uses';
import {CROPS} from './school-life-crops.js?v=20261118-seeds';
const art=['flower-harmony-v2.webp','flowerPink-harmony-v2.webp','flowerBlue-harmony-v2.webp'];
export const VASE_TARGET=Object.freeze({id:'flowerVase',x:1110,y:550,label:'교실 꽃병',action:'꽃 꽂기',kind:'vase'});
export function drawClassroomVase(g,assets,kind){
 g.save();g.translate(1140,444);
 if(kind!==null&&assets[CROPS[kind].itemArt])g.drawImage(assets[CROPS[kind].itemArt],-20,-65,40,51);
 g.fillStyle='#83a69b';g.strokeStyle='#506e5b';g.lineWidth=2;
 g.beginPath();g.moveTo(-8,-25);g.bezierCurveTo(-7,-16,-17,-13,-14,-2);g.quadraticCurveTo(0,5,14,-2);g.bezierCurveTo(17,-13,7,-16,8,-25);g.closePath();g.fill();g.stroke();
 g.fillStyle='#c4d9c3';g.beginPath();g.ellipse(0,-25,8,3,0,0,Math.PI*2);g.fill();g.stroke();g.restore();
}
export function createFlowerDisplay(api){
 let selected=null,handled=null;
 const visible=()=>!!api.overlay().querySelector('.life-flower-display');
 const store=createFlowerDisplayStorage({identity:api.identity,rpc:api.rpc,onChange:s=>{
  if(!api.valid())return;api.changed?.();
  if(s.command&&s.command.id!==handled){handled=s.command.id;void api.finished();}
  if(visible())render();
 }});
 function render(){
  if(!api.valid())return;
  const root=api.overlay(),prior=root.querySelector('.life-book-body'),scroll=prior?.scrollTop||0,focus=root.contains(document.activeElement)?document.activeElement.dataset.vaseFocus:null;
  const s=store.snapshot(),active=s.status==='ready';
  const owned=s.flowers.filter(x=>BigInt(x.count)>0n),current=s.displayed;
  let message=({idle:'꽃병 살피는 중…',loading:'꽃병 살피는 중…',saving:'꽃병 정리 중…',pending:'확인하지 못한 꽃병 기록이 있다.',error:s.pending?'꽃병 저장을 확인하지 못했다.':'꽃병을 불러오지 못했다.','storage-error':'꽃병 기록을 이 기기에 남기지 못했다.',conflict:'다른 곳에서 꽃이나 학교가 바뀌었다.',recovery:'확인하지 못한 꽃병 기록이 여러 개 있다.',unreadable:'이 기기의 꽃병 기록을 읽지 못했다.'})[s.status]||'';
  if(active&&s.command)message=({displayed:'꽃을 꽂았다.',taken:'꽃을 주머니에 넣었다.',unchanged:'그대로 두었다.',no_flower:'이 꽃은 주머니에 없다.',bag_full:'꽃을 돌려받을 자리가 없다.'})[s.command.outcome];
  if(active&&!api.ready())message='꽃 기록 확인 필요';
  const image=kind=>'<img src="maps/life/'+art[kind]+'" alt="">';
  let html='<div class="life-vase-current">'+(current===null?'<span class="life-vase-empty" aria-hidden="true"></span><p>빈 꽃병</p>':image(current)+'<p>'+CROPS[current].name+' · 1송이</p>')+'</div>';
  html+=owned.length?'<div class="life-item-grid life-vase-flowers">'+owned.map(x=>'<button class="life-item" data-vase-kind="'+x.kind+'" data-vase-focus="kind'+x.kind+'" aria-pressed="'+(selected===x.kind)+'" '+(!active?'disabled':'')+'>'+image(x.kind)+'<strong>'+CROPS[x.kind].name+'</strong><span>'+x.count+'송이</span></button>').join('')+'</div>':'<p class="life-page-note">주머니에 수확한 꽃이 없다.</p>';
  html+='<p class="life-vase-status" role="status">'+message+'</p><div class="life-choices">';
  if(active){
   if(selected!==null&&owned.some(x=>x.kind===selected))html+='<button class="life-choice" data-vase-place data-vase-focus="place" '+(!api.ready()||selected===current?'disabled':'')+'>'+CROPS[selected].name+' 꽂기</button>';
   if(current!==null)html+='<button class="life-choice" data-vase-take data-vase-focus="take" '+(!api.ready()?'disabled':'')+'>꽃 꺼내기</button>';
   if(!api.ready())html+='<button class="life-choice" data-vase-record>꽃 기록 확인</button>';
  }else if(s.status==='conflict')html+='<button class="life-choice" data-vase-current data-vase-focus="current">현재 기록 불러오기</button>';
  else if(s.status==='recovery')html+=s.copies.map((d,i)=>'<button class="life-choice" data-vase-recover="'+d.id+'">꽃병 기록 '+(i+1)+'</button>').join('');
  else if(['pending','error','storage-error'].includes(s.status))html+='<button class="life-choice" data-vase-retry data-vase-focus="retry">'+(s.pending?'저장 확인':'다시 불러오기')+'</button>';
  html+='</div><p class="life-page-note">꽃을 바꾸거나 꺼내면 원래 꽃은 주머니로 돌아간다.</p>';
  api.book('교실 꽃병',html);const book=root.querySelector('.life-book');book.classList.add('life-flower-display');book.querySelector('.life-book-close').dataset.vaseFocus='close';
  const guard=b=>api.valid()&&root.contains(b)&&visible()&&api.reachable();
  root.querySelectorAll('[data-vase-kind]').forEach(b=>b.onclick=()=>{if(!guard(b)||store.snapshot().status!=='ready')return;selected=Number(b.dataset.vaseKind);render();root.querySelector('[data-vase-focus="kind'+selected+'"]')?.focus({preventScroll:true});});
  const place=root.querySelector('[data-vase-place]');if(place)place.onclick=()=>{if(guard(place)&&api.ready())store.act('display',selected);};
  const take=root.querySelector('[data-vase-take]');if(take)take.onclick=()=>{if(guard(take)&&api.ready())store.act('take');};
  const record=root.querySelector('[data-vase-record]');if(record)record.onclick=()=>{if(guard(record))api.gardenPanel();};
  const retry=root.querySelector('[data-vase-retry]');if(retry)retry.onclick=()=>{if(guard(retry))store.retry();};
  const latest=root.querySelector('[data-vase-current]');if(latest)latest.onclick=()=>{if(guard(latest)){store.keepServer();void api.finished();}};
  root.querySelectorAll('[data-vase-recover]').forEach(b=>b.onclick=()=>{if(guard(b))store.selectPending(b.dataset.vaseRecover);});
  book.querySelector('.life-book-body').scrollTop=scroll;if(focus)root.querySelector('[data-vase-focus="'+focus+'"]')?.focus({preventScroll:true});
 }
 function open(){if(!api.valid()||!api.reachable())return;if(!api.ready()){api.gardenPanel();return;}selected=null;render();void store.read();}
 return {open,store,refreshView:()=>{if(visible())render();},saving:()=>store.snapshot().status==='saving'};
}

