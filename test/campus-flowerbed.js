// A personal toy garden, independent of school records and the trio quest save.
const SEEDS=['햇살 데이지','분홍 코스모스','보랏빛 라벤더'],BORDERS=['나무 울타리','둥근 돌담','초록 잎 울타리'];
// Reuse the original garden-care watering-can illustration.
const WATER_CAN='<svg viewBox="0 0 104 72" aria-hidden="true"><path d="M24 26C-2 11-3 64 26 55" fill="none" stroke="#536f60" stroke-width="7"/><path d="M24 26C2 16 2 60 26 52" fill="none" stroke="#a4c1a3" stroke-width="3"/><path d="M57 43 84 17 96 23 65 58" fill="#9fbea1" stroke="#536f60" stroke-width="3"/><path d="m85 15 14 7-4 7-14-8Z" fill="#dbcf99" stroke="#637b61" stroke-width="2"/><path d="M23 24Q43 16 64 25L66 58Q43 72 21 57Z" fill="#90b897" stroke="#536f60" stroke-width="3"/><ellipse cx="43" cy="25" rx="20" ry="7" fill="#d4dcc0" stroke="#536f60" stroke-width="3"/><path d="M31 25Q43 21 55 25" fill="none" stroke="#5b8068" stroke-width="4"/><path d="M28 36V53" stroke="#c3dbb8" stroke-width="4" stroke-linecap="round"/><path d="M41 42q11-10 16-2-2 12-15 12 4-3 7-9" fill="#e6eac7" stroke="#668462" stroke-width="1.5"/></svg>';
const empty=()=>({v:1,seed:0,border:0,goal:0,plots:Array(6).fill(null)});
export function flowerArt(plant){
 if(!plant)return '<svg viewBox="0 0 80 90" aria-hidden="true"><ellipse cx="40" cy="78" rx="21" ry="6" fill="#654e36"/><path d="M34 77h12M40 71v12" stroke="#a58960" stroke-width="3" stroke-linecap="round"/></svg>';
 if(plant.stage===1)return '<svg viewBox="0 0 80 90" aria-hidden="true"><ellipse cx="40" cy="78" rx="21" ry="6" fill="#654e36"/><ellipse cx="40" cy="71" rx="7" ry="10" transform="rotate(25 40 71)" fill="#d6b178" stroke="#82623a" stroke-width="2"/></svg>';
 const stem='<path d="M40 79V38M40 65Q15 41 20 63Q29 71 40 70M40 56Q63 35 61 57Q52 66 40 63" fill="#83ad69" stroke="#47794b" stroke-width="3" stroke-linejoin="round"/>';
 if(plant.stage===2)return '<svg viewBox="0 0 80 90" aria-hidden="true">'+stem+'<ellipse cx="40" cy="36" rx="7" ry="10" fill="#8aae70" stroke="#47794b" stroke-width="2"/></svg>';
 const flower=plant.seed===2?'<g fill="#ad99d1" stroke="#7d70a4" stroke-width="2">'+[21,30,39,48].map((y,i)=>'<ellipse cx="'+(i%2?44:36)+'" cy="'+y+'" rx="9" ry="6"/>').join('')+'</g>':'<g fill="'+(plant.seed===0?'#fff5c8':'#eba6b1')+'" stroke="'+(plant.seed===0?'#d1b779':'#af717b')+'" stroke-width="2">'+Array.from({length:6},(_,i)=>'<ellipse cx="40" cy="17" rx="9" ry="13" transform="rotate('+(i*60)+' 40 32)"/>').join('')+'</g><circle cx="40" cy="32" r="9" fill="#efcd6b" stroke="#b98a47" stroke-width="2"/>';
 return '<svg viewBox="0 0 80 90" aria-hidden="true">'+stem+flower+'</svg>';
}
const plotLabel=(p,i)=>(i+1)+'번 자리 · '+(!p?'빈 흙':SEEDS[p.seed]+' · '+['','씨앗','새싹','활짝 핀 꽃'][p.stage]);
const butterfly='<svg viewBox="0 0 60 50" aria-hidden="true"><path d="M29 24C6-5 1 5 8 24L25 29C2 28 12 49 28 34M31 24C54-5 59 5 52 24L35 29C58 28 48 49 32 34" fill="#edce83" stroke="#9b763d" stroke-width="2"/><path d="M30 20v16m0-14-6-8m6 8 6-8" fill="none" stroke="#6e6549" stroke-width="3" stroke-linecap="round"/></svg>';
const flowerRows=s=>[0,3].map(start=>new Set(s.plots.slice(start,start+3).filter(p=>p?.stage===3).map(p=>p.seed)).size);
const flowerReady=s=>flowerRows(s).includes(3);
const hasVisitor=s=>s.goal===2||s.goal===1&&flowerReady(s);
const visitor=s=>hasVisitor(s)?'<span class="flowerbed-butterfly" role="img" aria-label="세 빛깔 꽃길을 찾은 나비">'+butterfly+'</span>':'';
const goalText=s=>s.goal===2?'새싹과 완성한 나비 꽃길':flowerReady(s)?'나비가 왔어! 새싹에게 직접 돌아가 알려 주기':'한 줄에 서로 다른 꽃 세 송이 피우기 · '+Math.max(...flowerRows(s))+'/3';
const gardenMarkup=s=>'<span class="flowerbed-ground border-'+s.border+'">'+s.plots.map(p=>'<span>'+flowerArt(p)+'</span>').join('')+'</span>'+visitor(s);
export function decorateFlowerbed(b,p){if(p.kind!=='flowerbed')return false;b.classList.add('campus-flowerbed');b.dataset.walkX=p.x;b.dataset.standBeside='true';b.dataset.cameraPair='true';b.setAttribute('aria-label','내 꽃밭 · 씨앗 심고 꾸미기');b.innerHTML=gardenMarkup(empty())+'<span class="campus-object-caption"><b>내 꽃밭</b><small>씨앗 심고 꾸미기</small></span>';return true}
export function installFlowerbed(c){
 const doc=c.hub.ownerDocument,dialog=doc.createElement('dialog');dialog.id='campusFlowerbed';dialog.className='flowerbed-dialog';dialog.setAttribute('aria-labelledby','flowerbedTitle');doc.body.append(dialog);
 let owner=null,token=null,state=empty(),loaded=false,error=false,opening=null,selected=0,moving=null,previousFocus=null,lastCare=null,lastBorder=null,drag=null,blockedClick=null,watering=false,landing=null,flight=[],pour=null,planting=null,placement=null;
 const cache=new Map(),key=id=>'classRpgFlowerbed_v1_'+id;
 function close(){stopPlacement();stopPlanting();stopPour();stopFlight();cancelDrag();watering=false;if(dialog.open)dialog.close();moving=null;lastCare=null;lastBorder=null;if(previousFocus?.isConnected&&!c.hub.classList.contains('hidden'))previousFocus.focus({preventScroll:true})}
 function activate(){const id=c.getStudent()?.id,t=c.getToken();if(loaded&&owner===id&&token===t)return;close();landing=null;owner=id;token=t;loaded=true;state=empty();error=false;selected=0;moving=null;if(cache.has(id)){({state,error}=cache.get(id));return}
  if(id!=null)try{const s=JSON.parse(localStorage.getItem(key(id))||'null');if(s?.v===1&&[s.seed,s.border].every(n=>Number.isInteger(n)&&n>=0&&n<=2)&&Array.isArray(s.plots)&&s.plots.length===6&&s.plots.every(p=>p===null||p&&Number.isInteger(p.seed)&&p.seed>=0&&p.seed<=2&&Number.isInteger(p.stage)&&p.stage>=1&&p.stage<=3))state={v:1,seed:s.seed,border:s.border,goal:[0,1,2].includes(s.goal)?s.goal:0,plots:s.plots.map(p=>p&&({seed:p.seed,stage:p.stage}))};else if(s!==null)error=true}catch{error=true}cache.set(id,{state,error});
 }
 const valid=()=>dialog.open&&opening?.id===c.getStudent()?.id&&opening?.token===c.getToken()&&c.getScene()==='garden'&&c.walk.nearby()?.kind==='flowerbed'&&!c.hub.classList.contains('hidden')&&!doc.hidden;
 // Moving keyboard focus never performs a care action, invites a butterfly or replaces undo.
 // Seed browsing preserves the separately chosen seed and any pending care action.
 // Fence arrows follow visible rows; browsing never applies a border or alters care history.
 function fenceKey(e){
  const fence=e.target.closest('[data-bed-border]'),section=dialog.querySelector('.flowerbed-fences');
  if(!fence||!section?.contains(fence)||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||e.isComposing)return false;
  if(!valid()){close();sync();return true}
  if(drag||fence.disabled||!section.open)return true;
  const origin=fence.getBoundingClientRect(),horizontal=e.key==='ArrowLeft'||e.key==='ArrowRight',sign=e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:1;
  const choices=[...section.querySelectorAll('[data-bed-border]')].filter(b=>b!==fence&&!b.disabled).map(b=>{const r=b.getBoundingClientRect(),dx=r.x+r.width/2-origin.x-origin.width/2,dy=r.y+r.height/2-origin.y-origin.height/2;return {fence:b,dx,dy}}).filter(p=>horizontal?Math.abs(p.dy)<1&&p.dx*sign>1:p.dy*sign>1).sort((a,b)=>horizontal?Math.abs(a.dx)-Math.abs(b.dx):Math.abs(a.dy)-Math.abs(b.dy)||Math.abs(a.dx)-Math.abs(b.dx));
  const next=choices[0]?.fence||fence;next.focus({preventScroll:true});next.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
  return true;
 }
 function seedKey(e){
  const seed=e.target.closest('[data-bed-seed]');
  if(!seed||!dialog.querySelector('.flowerbed-seeds')?.contains(seed)||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||e.isComposing)return false;
  if(!valid()){close();sync();return true}
  if(drag||seed.disabled)return true;
  const index=Number(seed.dataset.bedSeed);if(!Number.isInteger(index)||index<0||index>=SEEDS.length)return true;
  const next=e.key==='ArrowLeft'?Math.max(0,index-1):e.key==='ArrowRight'?Math.min(SEEDS.length-1,index+1):index;
  const target=dialog.querySelector('[data-bed-seed="'+next+'"]');target.focus({preventScroll:true});
  if(doc.defaultView.matchMedia('(min-width:560px) and (max-height:520px)').matches)dialog.scrollTop=0;
  else target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
  return true;
 }
 function plotKey(e){
  const plot=e.target.closest('[data-bed-plot]');
  if(!plot||!dialog.querySelector('.flowerbed-board')?.contains(plot)||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||e.isComposing)return false;
  if(!valid()){close();sync();return true}
  if(drag||plot.disabled)return true;
  const index=Number(plot.dataset.bedPlot),row=Math.floor(index/3),col=index%3;
  if(!Number.isInteger(index)||index<0||index>=6)return true;
  const next=e.key==='ArrowLeft'?(col?index-1:index):e.key==='ArrowRight'?(col<2?index+1:index):e.key==='ArrowUp'?(row?index-3:index):(row<1?index+3:index);
  if(next!==index){const target=dialog.querySelector('[data-bed-plot="'+next+'"]');target.focus({preventScroll:true});target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'})}
  return true;
 }
 function status(text){const p=dialog.querySelector('.flowerbed-status');if(p)p.textContent=text}
 function storage(){const b=dialog.querySelector('[data-bed=retry]'),p=dialog.querySelector('.flowerbed-storage');if(b)b.hidden=!error;if(p)p.textContent=error?'꽃밭을 이 기기에 저장하지 못했어요. 다시 저장할 수 있어요.':'이 학생의 이 기기에 저장돼요. 학교 경험치·골드는 그대로예요.'}
 function save(){if(owner==null)return;try{localStorage.setItem(key(owner),JSON.stringify(state));error=false}catch{error=true}cache.set(owner,{state,error});sync();storage();c.onChange?.()}
 function remember(label){lastCare={label,selected,plots:state.plots.map(p=>p&&({...p}))}}
 // A visiting butterfly remembers only a flower spot for this garden visit, never a saved reward.
 // Only the existing seed drawing moves; the real planting/save has already finished.
 // Moving feedback follows an already saved placement; finishing or cancelling never performs care.
 function stopPlacement(){const run=placement;placement=null;if(!run)return;run.animations.forEach(a=>a.cancel());run.plots.forEach(p=>delete p.dataset.settling)}
 function showPlacement(from,to){
  stopPlacement();if(!valid()||doc.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const run={plots:[],animations:[]};placement=run;
  for(const i of [from,to]){if(!state.plots[i])continue;const plot=dialog.querySelector('[data-bed-plot="'+i+'"]'),svg=plot?.querySelector('svg');if(!svg)continue;run.plots.push(plot);plot.dataset.settling='true';const parts=state.plots[i].stage===1?[svg.lastElementChild]:[...svg.children];for(const part of parts)run.animations.push(part.animate([{translate:'0 -4px'},{translate:'0 0'}],{duration:220,easing:'ease-out'}))}
  Promise.all(run.animations.map(a=>a.finished)).then(()=>{if(placement===run)stopPlacement()},()=>{});
 }
 for(const type of ['blur','resize'])doc.defaultView.addEventListener(type,stopPlacement);
 for(const type of ['close','pointerdown'])dialog.addEventListener(type,stopPlacement);
 doc.defaultView.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',stopPlacement);
 function stopPlanting(){const run=planting;planting=null;if(!run)return;run.animation.cancel();delete run.plot.dataset.planting}
 function showPlanting(i){
  stopPlanting();if(!valid()||doc.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const plot=dialog.querySelector('[data-bed-plot="'+i+'"]'),seed=plot?.querySelector('svg')?.lastElementChild;
  if(!seed||state.plots[i]?.stage!==1)return;plot.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});plot.dataset.planting='true';
  const run={plot,animation:seed.animate([{translate:'0 -18px',opacity:0},{translate:'0 -7px',opacity:1,offset:.35},{translate:'0 0',opacity:1}],{duration:450,easing:'ease-out'})};planting=run;
  run.animation.finished.then(()=>{if(planting===run)stopPlanting()},()=>{});
 }
 function stopPour(){const previous=pour;pour=null;if(!previous)return;previous.animations.forEach(a=>a.cancel());previous.el.remove()}
 function pourWater(i){
  stopPour();if(!valid()||doc.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const plot=dialog.querySelector('[data-bed-plot="'+i+'"]');plot.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
  const el=doc.createElement('i');el.className='flowerbed-pour';el.setAttribute('aria-hidden','true');el.dataset.plot=i;
  el.innerHTML='<i class="flowerbed-pour-can">'+WATER_CAN+'</i><svg class="flowerbed-pour-drops" viewBox="0 0 40 44" aria-hidden="true"><path d="m12 3-3 8m14-7-3 8m14-7-3 8M9 23l-3 8m14-7-3 8m14-7-3 8"/></svg>';plot.append(el);
  const run={el,animations:[]};pour=run;
  run.animations=[el.animate([{opacity:0},{opacity:1,offset:.12},{opacity:1,offset:.8},{opacity:0}],{duration:650}),el.firstChild.animate([{transform:'rotate(10deg)'},{transform:'rotate(35deg)',offset:.2},{transform:'rotate(35deg)',offset:.8},{transform:'rotate(10deg)'}],{duration:650}),el.lastChild.animate([{opacity:0,transform:'translateY(-3px)'},{opacity:1,offset:.25},{opacity:0,transform:'translateY(6px)'}],{duration:180,iterations:3,delay:80})];
  run.animations[0].finished.then(()=>{if(pour===run)stopPour()},()=>{});
 }
 function stopFlight(){flight.forEach(a=>a.cancel());flight=[]}
 function keepLanding(){if(!hasVisitor(state)||state.plots[landing]?.stage!==3)landing=null}
 function positionVisitor(root,map=false){const v=root?.querySelector('.flowerbed-butterfly');if(!v)return;v.dataset.plot=landing===null?'':landing;
  if(landing===null){v.style.left='';v.style.top='';v.style.right='';v.setAttribute('aria-label','세 빛깔 꽃길을 찾은 나비');return}
  const plot=map?root.querySelector('.flowerbed-ground').children[landing]:root.querySelector('[data-bed-plot="'+landing+'"]'),r=root.getBoundingClientRect(),p=plot.getBoundingClientRect();
  v.style.left=(p.left-r.left-root.clientLeft+p.width*.64-v.offsetWidth/2)+'px';v.style.top=(p.top-r.top-root.clientTop+(map?-.04:.16)*p.height-v.offsetHeight/2)+'px';v.style.right='auto';v.setAttribute('aria-label',(landing+1)+'번 '+SEEDS[state.plots[landing].seed]+' 꽃에 쉬는 나비');
 }
 function settleVisitor(){stopFlight();positionVisitor(dialog.querySelector('.flowerbed-board'));positionVisitor(c.objects.querySelector('[data-place=flowerbed]'),true)}
 function controls(){dialog.querySelector('.flowerbed-intro').textContent=hasVisitor(state)&&state.plots.some(p=>p?.stage===3)?'활짝 핀 꽃을 누르면 나비가 와! 방향키로 고르고 Enter를 눌러도 돼.':'씨앗·꽃자리는 방향키로 살펴보고 Enter로 골라! 씨앗·물뿌리개를 끌어도 돼.';const borderUndo=dialog.querySelector('[data-bed=border-undo]');borderUndo.disabled=lastBorder===null;borderUndo.setAttribute('aria-label',lastBorder===null?'울타리 되돌리기':'울타리 되돌리기 · '+BORDERS[lastBorder]+'로');const undo=dialog.querySelector('[data-bed=undo]');undo.disabled=lastCare===null;undo.setAttribute('aria-label',lastCare?'방금 '+lastCare.label+' 되돌리기':'한 번 되돌리기');const goal=dialog.querySelector('.flowerbed-goal');if(goal){goal.hidden=state.goal===0;goal.textContent=goalText(state)}const plant=state.plots[selected];dialog.querySelector('[data-bed=water]').disabled=!plant||plant.stage===3;dialog.querySelector('[data-bed=move]').disabled=!plant;dialog.querySelector('[data-bed=replace]').disabled=!plant;const clear=dialog.querySelector('[data-bed=clear]');clear.disabled=!plant;clear.setAttribute('aria-label',(selected+1)+'번 자리 비우기'+(plant?' · '+SEEDS[plant.seed]:''));const can=dialog.querySelector('[data-bed=can]');can.disabled=!state.plots.some(p=>p&&p.stage<3);can.setAttribute('aria-pressed',String(watering));dialog.classList.toggle('is-watering',watering);const cancel=dialog.querySelector('[data-bed=cancel]');cancel.hidden=moving===null&&!watering;cancel.textContent=watering?'물 주기 취소':'옮기기 취소';dialog.querySelector('.flowerbed-selection').textContent=watering?'물 줄 씨앗이나 새싹을 눌러 줘. 빈 흙과 활짝 핀 꽃은 그대로야.':moving!==null?(moving+1)+'번 꽃을 옮길 자리를 눌러요. 다른 꽃과 자리도 바꿀 수 있어요.':plotLabel(plant,selected);}
 function plantSeed(i,seed){if(state.plots[i])return false;selected=i;remember('씨앗 심기');state.plots[i]={seed,stage:1};moving=null;save();board();showPlanting(i);status((i+1)+'번 자리에 '+SEEDS[seed]+' 씨앗을 심었어. 물을 줘 볼까?');return true}
 function waterPlant(i){const p=state.plots[i];if(!p||p.stage===3)return false;selected=i;remember('물 주기');moving=null;watering=false;p.stage++;save();board();pourWater(i);if(p.stage===3)dialog.querySelector('[data-bed-plot="'+i+'"]').focus({preventScroll:true});status(p.stage===3?SEEDS[p.seed]+' 꽃이 활짝 피었어! 맵에서도 네 꽃밭을 볼 수 있어.':'작은 새싹이 올라왔어! 물을 한 번 더 주면 꽃이 피어.');return true}
 function movePlant(from,to){const a=state.plots[from],b=state.plots[to];if(a&&b&&a.seed===b.seed&&a.stage===b.stage){moving=null;selected=to;board();status('꽃을 그대로 두었어.');return}selected=from;remember('자리 옮기기');[state.plots[to],state.plots[from]]=[state.plots[from],state.plots[to]];moving=null;selected=to;save();board();showPlacement(from,to);status('꽃 자리를 옮겼어! 다 자란 꽃은 그대로야.')}
 function clearDrag(){const d=drag;if(!d)return null;drag=null;d.ghost?.remove();if(d.selection)d.selection.style.minHeight=d.selectionMin;d.el.classList.remove('is-dragging');dialog.querySelectorAll('.is-drop-target').forEach(b=>b.classList.remove('is-drop-target'));dialog.classList.remove('is-dragging-flower');try{if(d.el.hasPointerCapture(d.id))d.el.releasePointerCapture(d.id)}catch{}return d}
 function cancelDrag(){const d=clearDrag();if(!d?.active)return;blockedClick={id:d.id,until:performance.now()+800};if(dialog.open){controls();status('꽃을 그대로 두었어.')}}
 function dropTarget(e){const b=doc.elementFromPoint(e.clientX,e.clientY)?.closest('[data-bed-plot]');return b&&dialog.querySelector('.flowerbed-board')?.contains(b)?Number(b.dataset.bedPlot):null}
 dialog.addEventListener('pointerdown',e=>{blockedClick=null;const b=e.target.closest('[data-bed-plot],[data-bed-seed],[data-bed=can]');if(!b||b.disabled||drag||moving!==null||!e.isPrimary||e.button!==0||!valid())return;const water=b.dataset.bed==='can';if(watering&&!water)return;const seed=b.dataset.bedSeed!=null?Number(b.dataset.bedSeed):null,source=!water&&seed===null?Number(b.dataset.bedPlot):null;if(!water&&seed===null&&!state.plots[source])return;drag={id:e.pointerId,source,seed,water,el:b,x:e.clientX,y:e.clientY,active:false,target:null};try{b.setPointerCapture(e.pointerId)}catch{drag=null}});
 dialog.addEventListener('pointermove',e=>{const d=drag;if(!d||e.pointerId!==d.id)return;if(!valid()){close();return}if(!d.active&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<8)return;
  if(!d.active){d.active=true;dialog.classList.add('is-dragging-flower');d.selection=dialog.querySelector('.flowerbed-selection');d.selectionMin=d.selection.style.minHeight;d.selection.style.minHeight=Math.max(d.selection.getBoundingClientRect().height,parseFloat(doc.defaultView.getComputedStyle(d.selection).lineHeight)*2)+'px';const box=d.el.getBoundingClientRect();d.ghost=doc.createElement('span');d.ghost.className='flowerbed-drag-ghost';d.ghost.setAttribute('aria-hidden','true');d.ghost.classList.toggle('is-water',d.water);d.ghost.innerHTML=d.water?WATER_CAN:d.seed===null?flowerArt(state.plots[d.source]):flowerArt({seed:d.seed,stage:3})+'<b>씨앗</b>';d.ghost.classList.toggle('is-seed',!d.water&&d.seed!==null);d.ghost.style.width=box.width+'px';d.ghost.style.height=box.height+'px';dialog.append(d.ghost);d.el.classList.add('is-dragging')}
  d.ghost.style.left=e.clientX+'px';d.ghost.style.top=e.clientY+'px';d.target=dropTarget(e);dialog.querySelectorAll('[data-bed-plot]').forEach(b=>b.classList.toggle('is-drop-target',Number(b.dataset.bedPlot)===d.target&&d.target!==d.source&&(d.water?state.plots[d.target]&&state.plots[d.target].stage<3:d.seed===null||!state.plots[d.target])));dialog.querySelector('.flowerbed-selection').textContent=d.water?(d.target===null?'물뿌리개를 씨앗이나 새싹에 놓아 줘.':!state.plots[d.target]?'빈 흙이야. 먼저 씨앗을 심어 줘.':state.plots[d.target].stage===3?'이미 활짝 핀 꽃이야. 다른 씨앗이나 새싹에 물을 줘.':(d.target+1)+'번에 놓으면 물을 한 번 줘.') :d.seed!==null?(d.target===null?'빈 흙에 놓으면 '+SEEDS[d.seed]+' 씨앗을 심어.':state.plots[d.target]?'여기에는 이미 심겨 있어. 빈 흙을 골라 줘.':(d.target+1)+'번 빈 흙에 '+SEEDS[d.seed]+' 씨앗을 심어.') :d.target===null||d.target===d.source?'다른 자리에 놓으면 옮겨져. 꽃밭 밖에 놓으면 취소해.':(d.target+1)+'번에 놓으면 '+(state.plots[d.target]?'두 꽃의 자리가 바뀌어.':'꽃이 옮겨져.');
 });
 dialog.addEventListener('pointerup',e=>{const d=drag;if(!d||e.pointerId!==d.id)return;if(!valid()){close();return}const target=dropTarget(e);clearDrag();if(!d.active)return;blockedClick={id:d.id,until:performance.now()+800};if(target!==null&&target!==d.source&&(d.water?state.plots[target]&&state.plots[target].stage<3:d.seed===null||!state.plots[target])){if(d.water)waterPlant(target);else if(d.seed===null)movePlant(d.source,target);else plantSeed(target,d.seed);dialog.querySelector('[data-bed-plot="'+target+'"]').focus({preventScroll:true})}else{controls();status('꽃을 그대로 두었어.')}});
 dialog.addEventListener('pointercancel',e=>{if(e.pointerId===drag?.id)cancelDrag()});dialog.addEventListener('lostpointercapture',e=>{if(e.pointerId===drag?.id)cancelDrag()});
 dialog.addEventListener('click',e=>{if(blockedClick&&performance.now()<blockedClick.until&&e.detail!==0&&(e.pointerId===blockedClick.id||e.pointerId==null)){blockedClick=null;e.preventDefault();e.stopImmediatePropagation()}},true);
 doc.defaultView.addEventListener('blur',()=>{stopPlanting();stopPour();cancelDrag();stopFlight()});doc.defaultView.addEventListener('resize',stopPlanting);doc.defaultView.addEventListener('resize',stopPour);dialog.addEventListener('close',()=>{stopPlanting();stopPour();lastBorder=null});doc.defaultView.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',stopPlanting);doc.defaultView.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',stopPour);doc.defaultView.addEventListener('resize',settleVisitor);dialog.addEventListener('scroll',stopFlight);doc.defaultView.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',settleVisitor);doc.defaultView.addEventListener('resize',cancelDrag);dialog.addEventListener('scroll',cancelDrag);dialog.addEventListener('close',cancelDrag);dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
 function board(fly=false){stopPlacement();stopPlanting();stopPour();const area=dialog.querySelector('.flowerbed-board'),focus=doc.activeElement?.dataset.bedPlot,from=fly?area.querySelector('.flowerbed-butterfly')?.getBoundingClientRect():null;stopFlight();keepLanding();area.className='flowerbed-board border-'+state.border;area.innerHTML=state.plots.map((p,i)=>'<button type="button" data-bed-plot="'+i+'" aria-label="'+plotLabel(p,i)+(hasVisitor(state)&&p?.stage===3?' · 나비 부르기':'')+'" aria-pressed="'+(selected===i)+'"'+' class="'+(p?'has-plant ':'')+(moving===i?'is-moving':'')+'"'+'>'+flowerArt(p)+'<span>'+(i+1)+'</span></button>').join('')+visitor(state);positionVisitor(area);if(fly&&from&&landing!==null&&!doc.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches){const v=area.querySelector('.flowerbed-butterfly'),to=v.getBoundingClientRect(),dx=from.left-to.left,dy=from.top-to.top;flight=[v.animate([{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'translate('+(dx/2)+'px,'+(dy/2-18)+'px)'},{transform:'translate(0,0)'}],{duration:650,easing:'ease-in-out'}),v.firstChild.animate([{transform:'scaleX(1)'},{transform:'scaleX(.4)'},{transform:'scaleX(1)'}],{duration:160,iterations:4})]}if(focus!=null)area.querySelector('[data-bed-plot="'+focus+'"]').focus({preventScroll:true});controls()}
 function render(){dialog.innerHTML='<header><h2 id="flowerbedTitle">새싹과 나의 작은 꽃밭</h2><button type="button" data-bed="close" autofocus>닫기</button></header><p class="flowerbed-intro">씨앗·꽃자리는 방향키로 살펴보고 Enter로 골라! 씨앗·물뿌리개를 끌어도 돼.</p><div class="flowerbed-seeds" role="group" aria-label="심을 씨앗">'+SEEDS.map((name,i)=>'<button type="button" data-bed-seed="'+i+'" aria-pressed="'+(state.seed===i)+'">'+flowerArt({seed:i,stage:3})+'<span>'+name+'</span></button>').join('')+'</div><div class="flowerbed-toolbar"><button type="button" data-bed="can" aria-label="물뿌리개 · 끌거나 누른 뒤 물 줄 자리 고르기" aria-pressed="false">'+WATER_CAN+'<span>물뿌리개</span></button><p class="flowerbed-goal" role="status"></p></div><div class="flowerbed-board"></div><p class="flowerbed-selection"></p><div class="flowerbed-tools"><button type="button" data-bed="water">물 주기</button><button type="button" data-bed="move">자리 옮기기</button><button type="button" data-bed="replace">고른 씨앗으로 바꾸기</button><button type="button" data-bed="clear">빈 흙으로 비우기</button><button type="button" data-bed="cancel" hidden>옮기기 취소</button><button type="button" data-bed="undo" disabled>한 번 되돌리기</button></div><details class="flowerbed-fences"><summary>꽃밭 울타리 꾸미기</summary><div role="group" aria-label="꽃밭 울타리">'+BORDERS.map((name,i)=>'<button type="button" data-bed-border="'+i+'" aria-pressed="'+(state.border===i)+'">'+name+'</button>').join('')+'</div><button type="button" data-bed="border-undo" disabled>울타리 되돌리기</button></details><p class="flowerbed-status" role="status" aria-live="polite"></p><footer><p class="flowerbed-storage" role="status"></p><button type="button" data-bed="retry" hidden>꽃밭 다시 저장</button></footer>';board();storage();status('선택한 씨앗: '+SEEDS[state.seed]+'. 원하는 순서로 심고 꽃 자리를 바꿔 봐!')}
 function open(){activate();if(c.walk.nearby()?.kind!=='flowerbed'){c.walk.goTo('flowerbed');return}previousFocus=doc.activeElement;c.stop();c.walk.stop();opening={id:owner,token};moving=null;watering=false;lastCare=null;lastBorder=null;render();if(!dialog.open)dialog.showModal();positionVisitor(dialog.querySelector('.flowerbed-board'))}
 dialog.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.bed==='close'){close();return}if(!valid()){close();sync();return}if(drag)return;
  // Border undo is transient and independent of the last flower-care action.
  if(b.dataset.bed==='border-undo'){
   if(lastBorder===null||b.disabled||!b.closest('.flowerbed-fences')?.open)return;
   state.border=lastBorder;lastBorder=null;save();
   dialog.querySelectorAll('[data-bed-border]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.bedBorder)===state.border)));
   board();status('방금 울타리를 바꾸기 전 '+BORDERS[state.border]+'로 돌렸어.');
   const fence=dialog.querySelector('[data-bed-border="'+state.border+'"]');fence.focus({preventScroll:true});fence.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});return;
  }
  if(b.dataset.bed==='can'){if(b.disabled)return;watering=!watering;moving=null;controls();status(watering?'물 줄 씨앗이나 새싹을 골라 줘! 물뿌리개를 끌어 놓아도 돼.':'물뿌리개를 내려놓았어.');return}
  if(watering&&b.dataset.bedPlot!=null){const i=Number(b.dataset.bedPlot);if(!waterPlant(i)){status(state.plots[i]?'이미 활짝 핀 꽃이야. 씨앗이나 새싹을 골라 줘.':'빈 흙에는 먼저 씨앗을 심어 줘.')}return}
  if(watering){watering=false;controls()}

  if(b.dataset.bedSeed!=null){state.seed=Number(b.dataset.bedSeed);moving=null;save();dialog.querySelectorAll('[data-bed-seed]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.bedSeed)===state.seed)));board();status(SEEDS[state.seed]+' 씨앗을 골랐어. 빈 흙을 누르면 심을 수 있어!');return}
  if(b.dataset.bedBorder!=null){if(Number(b.dataset.bedBorder)!==state.border)lastBorder=state.border;state.border=Number(b.dataset.bedBorder);save();dialog.querySelectorAll('[data-bed-border]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.bedBorder)===state.border)));board();status(BORDERS[state.border]+'로 꽃밭을 꾸몄어!');return}
  if(b.dataset.bedPlot!=null){const i=Number(b.dataset.bedPlot);if(moving!==null){if(i!==moving){movePlant(moving,i)}else{status('같은 자리여서 그대로 두었어.');moving=null;selected=i;board()}return}if(!state.plots[i]){plantSeed(i,state.seed);return}selected=i;const invite=hasVisitor(state)&&state.plots[i].stage===3&&landing!==i;if(invite)landing=i;board(invite);if(invite)dialog.querySelector('[data-bed-plot="'+i+'"]').scrollIntoView({block:'nearest'});sync();status(invite?(i+1)+'번 '+SEEDS[state.plots[i].seed]+' 꽃으로 나비를 불렀어!':plotLabel(state.plots[i],i)+'를 골랐어.');return}
  const p=state.plots[selected],action=b.dataset.bed;
  if(action==='water'){waterPlant(selected);return}
  if(action==='move'&&p){moving=selected;board();const source=dialog.querySelector('[data-bed-plot="'+moving+'"]');source.focus({preventScroll:true});source.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});status('꽃을 옮길 빈 자리나 다른 꽃을 눌러 줘.');return}
  if(action==='replace'&&p){if(p.seed===state.seed&&p.stage===1){moving=null;board();status('같은 씨앗이 이미 심겨 있어. 물을 줘 볼까?');return}remember('다시 심기');moving=null;state.plots[selected]={seed:state.seed,stage:1};save();board();showPlanting(selected);status('이 자리만 '+SEEDS[state.seed]+' 씨앗으로 바꿨어. 다시 물을 줘서 키워 보자!');return}
  if(action==='clear'&&p){remember('자리 비우기');moving=null;state.plots[selected]=null;save();board();status((selected+1)+'번 자리를 빈 흙으로 비웠어. 한 번 되돌리면 방금 모습으로 돌아와.');dialog.querySelector('[data-bed=undo]').focus();return}
  if(action==='cancel'){moving=null;board();status('꽃을 그대로 두었어.');return}
  if(action==='undo'&&lastCare){const previous=lastCare;lastCare=null;moving=null;state.plots=previous.plots;selected=previous.selected;save();board();dialog.querySelector('[data-bed-plot="'+selected+'"]').focus({preventScroll:true});status('방금 '+previous.label+' 전으로 돌렸어. 꽃 자리를 다시 골라 봐!');return}
  if(action==='retry'){save();status(error?'아직 저장하지 못했어요. 지금 꽃밭은 계속 꾸밀 수 있어요.':'꽃밭을 이 기기에 저장했어요.')}
 });
 function sync(){activate();if(c.getScene()!=='garden'||c.hub.classList.contains('hidden')){landing=null;stopFlight()}keepLanding();if(dialog.open&&!valid())close();const b=c.objects.querySelector('[data-place=flowerbed]');if(!b)return;const signature=JSON.stringify(state);if(b.dataset.flowerbed!==signature||b.dataset.butterflyPlot!==String(landing)){b.dataset.flowerbed=signature;b.dataset.butterflyPlot=String(landing);b.innerHTML=gardenMarkup(state)+'<span class="campus-object-caption"><b>내 꽃밭</b><small>씨앗 심고 꾸미기</small></span>';b.setAttribute('aria-label','내 꽃밭 · '+state.plots.filter(p=>p?.stage===3).length+'송이 활짝 핀 꽃 · 꾸미기');positionVisitor(b,true)}}
 doc.addEventListener('student-dashboard-updated',sync);doc.addEventListener('visibilitychange',()=>{if(doc.hidden)close()});new MutationObserver(()=>{if(c.getScene()!=='garden'||c.hub.classList.contains('hidden')){landing=null;stopFlight()}if(dialog.open&&!valid())close()}).observe(c.hub,{attributes:true,attributeFilter:['class','data-scene']});
 function request(){activate();return {id:'flowerbed',title:'새싹 · 나비 꽃길',loaded:true,active:state.goal===1,ready:state.goal===1&&flowerReady(state),text:goalText(state),error:error?'꽃밭을 이 기기에 저장하지 못했어요.':null,retry:save}}
 function offer(){activate();return state.goal===2?{text:'네가 만든 나비 꽃길을 기억해! 다른 줄도 네 마음대로 꾸며 볼래?',action:'go',label:'꽃밭 더 꾸미기'}:state.goal===1?flowerReady(state)?{text:'나비가 찾아왔네! 네가 키우고 옮긴 세 빛깔 꽃 덕분이야.',action:'finish',label:'새싹과 꽃길 완성하기'}:{text:'꽃밭 위나 아래 한 줄에 데이지·코스모스·라벤더를 한 송이씩 피워 줘. 자란 꽃을 옮겨도 돼!',action:'go',label:'직접 꽃밭 돌보러 갈게'}:{text:'나비가 쉬어 갈 꽃길을 만들자! 한 줄에 서로 다른 꽃 세 송이를 활짝 피워 줄래?',action:'accept',label:'좋아, 꽃길을 만들게'} }
 function act(action){activate();if(owner==null||c.getScene()!=='garden'||c.walk.nearby()?.kind!=='trio-garden'||c.hub.classList.contains('hidden')||doc.hidden)return false;if(action==='accept'&&state.goal===0){state.goal=1;save();c.focusGoal?.('flowerbed');return true}if(action==='finish'&&state.goal===1&&flowerReady(state)){state.goal=2;save();return true}return false}
 return {fenceKey,seedKey,plotKey,sync,open,request,offer,act,interact:kind=>{if(kind!=='flowerbed')return false;open();return true},summary:()=>{activate();const n=state.plots.filter(p=>p?.stage===3).length;return (state.goal===2?'나비 꽃길을 만들어 준 걸 기억해! ':'')+(n?'네 꽃밭에 꽃 '+n+'송이가 활짝 피었네! ':'')}};
}
