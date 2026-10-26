// Personal play mastery only: no school economy, database or earned-record writes.
const META={tori:{name:'토리',room:'library',image:'tori-anime-v2.webp',title:'잃어버린 책 찾기',task:'단서 두 개로 책 표지를 찾아 줘!',done:'책 표지가 제자리를 찾았어!'},garden:{name:'새싹',room:'garden',image:'saessak-anime-v2.webp',title:'꽃밭으로 물길 잇기',task:'구부러진 물길을 돌려 꽃까지 이어 줘!',done:'네가 이은 물길로 꽃이 피었어!'},duri:{name:'두리',room:'playground',image:'duri-anime-v2.webp',title:'바람뜰 공 던지기',task:'각도와 힘을 바꿔 바구니에 공을 넣어 봐!',done:'멋진 골! 네 깃발을 운동장에 달았어!'}};
const PATHS=[[0,1,4,7,8,5,2],[3,0,1,2,5],[6,7,4,1,2,5,8]];
const ports=tile=>tile.shape==='line'?[tile.turn%2,(tile.turn%2)+2]:[tile.turn,(tile.turn+1)%4];
export function pipePuzzle(round){
 const path=PATHS[round%3],solution=Array.from({length:9},(_,i)=>({shape:i%2?'line':'bend',turn:(i+round)%4}));
 const side=(a,b)=>b===a-3?0:b===a+1?1:b===a+3?2:3;
 path.forEach((cell,i)=>{const pair=[i?side(cell,path[i-1]):3,i<path.length-1?side(cell,path[i+1]):1];const straight=Math.abs(pair[0]-pair[1])===2;solution[cell]={shape:straight?'line':'bend',turn:straight?pair[0]%2:([0,1,2,3].find(t=>pair.includes(t)&&pair.includes((t+1)%4)))}});
 const start=Math.floor(path[0]/3),end=Math.floor(path.at(-1)/3),tiles=solution.map((t,i)=>({...t,turn:(t.turn+1+(i%2))%4})),cycle=Math.floor(round/3);
 // Keep the introductory layouts; later rounds vary starts without changing routes or saved drafts.
 if(cycle>0){
  let seed=(round+1)>>>0;
  tiles.forEach(t=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;t.turn=seed>>>30});
  const anchor=path.find((cell,i)=>i>0&&solution[cell].shape==='bend');
  tiles[anchor].turn=(solution[anchor].turn+1+(anchor%2)+cycle)%4;
  if(traceWater(tiles,start,end).ok){const inlet=tiles[path[0]];while(ports(inlet).includes(3))inlet.turn=(inlet.turn+1)%4}
 }
 return {start,end,solution,tiles};
}
export function traceWater(tiles,start,end){
 let cell=start*3,incoming=3;const visited=[],wet=[],stop=(side,reason)=>({ok:false,visited,wet,blocked:{cell,side,reason}});
 for(let n=0;n<10;n++){if(visited.includes(cell))return stop(incoming,'loop');visited.push(cell);const p=ports(tiles[cell]);if(!p.includes(incoming))return stop(incoming,'inlet');wet.push(cell);const out=p.find(s=>s!==incoming),row=Math.floor(cell/3),col=cell%3;
  if(out===1&&col===2)return row===end?{ok:true,visited,wet,blocked:null}:stop(out,'flower');if(out===3&&col===0||out===0&&row===0||out===2&&row===2)return stop(out,'edge');cell+=[-3,1,3,-1][out];incoming=(out+2)%4;
 }return stop(incoming,'loop');
}
export const shotLanding=(angle,power)=>30+power*power*Math.sin(2*angle*Math.PI/180)/10;
export const TRIO_SEARCH_PLACES=[{kind:'trio-clue-color',x:14,label:'창가에 붙은 쪽지'},{kind:'trio-clue-motif',x:70,label:'책장 틈의 책갈피'},{kind:'trio-books',x:91,label:'분실책 수레'}];
// Only newly accepted requests opt in; unfinished older requests keep their original places.
const validSearchLayout=r=>Number.isInteger(r.round)&&r.round>=0&&r.round<=999999&&r.searchLayout?.round===r.round&&[1,2].includes(r.searchLayout.shift);
export const nextToriSearchShift=round=>(round+Math.floor(round/6))%3;
export function toriSearchPlaces(r){
 const shift=validSearchLayout(r)?r.searchLayout.shift:0;
 const spots=[[[14,'창가에 붙은 쪽지'],[70,'책장 틈의 책갈피'],[91,'분실책 수레']],[[70,'책장 틈의 쪽지'],[14,'창가의 책갈피'],[45,'가운데 분실책 수레']],[[40,'가운데의 쪽지'],[91,'문 옆의 책갈피'],[65,'토리 오른쪽 분실책 수레']]][shift];
 return TRIO_SEARCH_PLACES.map((p,i)=>({...p,x:spots[i][0],label:spots[i][1]}));
}

// A round keeps its layout across reopening; every six requests use all target positions.
export function bookCartOrder(round){
 const target=round%6,order=[0,1,2,3,4,5].filter(i=>i!==target);
 let seed=(round+1)>>>0;
 for(let i=order.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[order[i],order[j]]=[order[j],order[i]]}
 order.splice((Math.floor(round/6)+target*5+2)%6,0,target);
 return order;
}
const freshBest=()=>[null,null,null,null];
const count=n=>Number.isInteger(n)&&n>=0&&n<=999999?n:0;
// A draft belongs to one unfinished round; old saves are read without inventing a layout.
const validPipeDraft=r=>r.phase===1&&r.pipeDraft?.round===r.round&&Array.isArray(r.pipeDraft.turns)&&r.pipeDraft.turns.length===9&&r.pipeDraft.turns.every(n=>Number.isInteger(n)&&n>=0&&n<4);
const bestRecords=list=>freshBest().map((_,i)=>Array.isArray(list)&&Number.isInteger(list[i])&&list[i]>0&&list[i]<=999999?list[i]:null);
const COLORS=['초록','파랑','분홍'],MOTIFS=['달','잎','별'];
const bookColor=i=>Math.floor(i/2),bookMotif=(i,round)=>(Math.floor(i/2)+i%2+round)%3;
const glyph=n=>'<svg viewBox="0 0 60 60" aria-hidden="true"><path fill="#fff8d3" d="'+['M40 8C12 3 3 43 32 52C17 38 20 19 40 8Z','M48 10C14 7 7 24 15 42C34 49 51 33 48 10ZM12 48L39 20','M30 5L37 22L55 30L37 37L30 55L23 37L5 30L23 23Z'][n]+'" stroke="#fff8d3" stroke-width="3" stroke-linejoin="round"/></svg>';
const bookArt=(i,round)=>'<span class="trio-book color-'+bookColor(i)+'">'+glyph(bookMotif(i,round))+'</span>';
const FLOWER='<svg viewBox="0 0 80 85" aria-hidden="true"><path d="M40 75V35M40 57Q14 35 18 58Q25 68 40 65M40 65Q66 42 65 63Q52 74 40 70" fill="#82a36a" stroke="#4f7951" stroke-width="4"/><g fill="#e6a6a3" stroke="#a96970" stroke-width="2"><circle cx="29" cy="22" r="12"/><circle cx="47" cy="20" r="12"/><circle cx="53" cy="37" r="12"/><circle cx="34" cy="41" r="12"/><circle cx="23" cy="34" r="12"/></g><circle cx="38" cy="31" r="9" fill="#f4d781"/></svg>';
const RIBBON='<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M37 34Q10 5 9 26Q7 48 37 39M43 34Q70 5 71 26Q74 48 43 39M35 40L20 68L36 64L42 48L49 68L64 72L47 39" fill="#dfb762" stroke="#8f683d" stroke-width="3"/><circle cx="40" cy="36" r="9" fill="#f6d887" stroke="#8f683d" stroke-width="3"/></svg>';
const FESTIVAL_NAMES=['햇살 리본','초록 잎','별빛 종이'];
const festivalChoice=n=>Number.isInteger(n)&&n>=0&&n<FESTIVAL_NAMES.length?n:0;
function festivalArt(style){if(style===0)return '<svg viewBox="0 0 300 50" aria-hidden="true"><path d="M0 4Q150 65 300 4" fill="none" stroke="#ae8b59" stroke-width="3"/><path d="M30 15L48 45L58 24M86 32L106 58L118 38M182 38L194 58L214 32M242 24L252 45L270 15" fill="#e9b987" stroke="#ac8963" stroke-width="2"/></svg>';return '<svg viewBox="0 0 300 70" aria-hidden="true"><path d="M0 4Q150 65 300 4" fill="none" stroke="#ae8b59" stroke-width="3"/>'+[[42,18],[102,34],[198,34],[258,18]].map(([x,y])=>'<g transform="translate('+(x-15)+' '+y+')"><path d="M15 -4V7" stroke="#ae8b59" stroke-width="2"/><path d="'+(style===1?'M26 6C5 2 0 15 6 27C20 31 30 17 26 6ZM5 29L22 10':'M15 3L19 12L29 15L21 21L23 31L15 26L6 31L8 21L1 15L11 12Z')+'" fill="'+(style===1?'#94ba72':'#eac873')+'" stroke="'+(style===1?'#55794a':'#a18043')+'" stroke-width="2" stroke-linejoin="round"/></g>').join('')+'</svg>'}
const knownReturn=r=>r.wins>0?(r.phase===3?r.round:Number.isInteger(r.returnedRound)&&r.returnedRound>=0&&r.returnedRound<=999999?r.returnedRound:null):null;
const returnedName=round=>COLORS[bookColor(round%6)]+' 표지·'+MOTIFS[bookMotif(round%6,round)]+' 무늬 책';
function returnedArt(round){return '<svg viewBox="0 0 72 92" aria-hidden="true"><path d="M5 72H67V80H5ZM12 80V90M60 80V90" fill="#bf9561" stroke="#765a3c" stroke-width="4" stroke-linejoin="round"/>'+(round==null?'<rect x="10" y="50" width="52" height="19" rx="3" fill="#b49a78" stroke="#765a3c" stroke-width="3"/><path d="M18 55H58M18 61H58" stroke="#f7e6bf" stroke-width="3"/>':'<rect x="14" y="7" width="44" height="60" rx="5" fill="'+['#739d63','#6c9fbd','#c48392'][bookColor(round%6)]+'" stroke="#596b4d" stroke-width="3"/><path d="M20 9V65" stroke="#596b4d" stroke-width="6"/><path d="M24 68H56" stroke="#f4dfaf" stroke-width="4"/>'+glyph(bookMotif(round%6,round)).replace('<svg ','<svg x="25" y="18" width="29" height="34" '))+'</svg>'}
// Six repeatable cover variants, with counts rather than an unbounded save history.
const validBooks=r=>Array.isArray(r.returnedBooks)&&r.returnedBooks.length===6&&r.returnedBooks.every(n=>Number.isInteger(n)&&n>=0&&n<=999999)&&r.returnedBooks.reduce((a,b)=>a+b,0)<=r.wins;
const collectedBooks=r=>{if(validBooks(r))return [...r.returnedBooks];const books=[0,0,0,0,0,0],round=knownReturn(r);if(round!=null)books[round%6]=1;return books};
const displayBook=r=>Number.isInteger(r.displayBook)&&r.displayBook>=0&&r.displayBook<6&&collectedBooks(r)[r.displayBook]>0?r.displayBook:null;
const shelfTotal=books=>books.reduce((a,b)=>a+b,0);
const SHELF='<img class="trio-shelf-art" src="maps/npcs/tori-bookshelf-v2.webp" alt="" width="116" height="126">';
export function decorateTrioObject(b,p){
 if(p.kind==='trio-shelf'){b.classList.add('trio-return-shelf');b.dataset.walkX=p.x;b.dataset.standBeside='true';b.dataset.cameraPair='true';b.dataset.upOnly='true';b.dataset.approachSide='right';b.dataset.action='토리의 작은 책장 살펴보기';b.setAttribute('aria-label','토리의 작은 책장 · 가까이서 ↑사용');b.innerHTML=SHELF+'<span class="trio-shelf-books" aria-hidden="true"></span><span class="campus-object-caption">토리의 작은 책장</span>';return true}

 if(TRIO_SEARCH_PLACES.some(x=>x.kind===p.kind)){
  b.classList.add('trio-search-prop');b.dataset.walkX=p.x;b.setAttribute('aria-label',p.label+' · 살펴보기');
  b.innerHTML=(p.kind==='trio-books'?'<span class="trio-book-cart" aria-hidden="true">'+bookArt(0,0)+'<i></i></span>':'<span class="trio-clue-prop" aria-hidden="true">'+(p.kind==='trio-clue-color'?'<i></i><i></i><i></i>':glyph(1))+'</span>')+'<span class="campus-object-caption"><b>'+p.label+'</b><small>살펴보기</small></span>';return true;
 }
 const id=p.kind==='trio-garden'?'garden':p.kind==='trio-duri'?'duri':null;if(!id)return false;
 b.classList.add('campus-npc','trio-resident');b.dataset.standBeside='true';b.dataset.cameraPair='true';b.dataset.walkX=p.x;b.setAttribute('aria-label',META[id].name+' · 말 걸기');
 b.innerHTML='<img alt="" width="110" height="160" src="maps/npcs/'+META[id].image+'"><span class="trio-name campus-object-caption">'+META[id].name+'</span><span class="trio-mark" aria-hidden="true">!</span>';
 b.querySelector('img').onerror=e=>{e.target.hidden=true;b.classList.add('trio-art-failed')};return true;
}
export function installNpcTrio(c){
 const doc=c.hub.ownerDocument,dialog=doc.createElement('dialog');dialog.id='npcTrio';dialog.className='trio-dialog';dialog.setAttribute('aria-labelledby','trioTitle');doc.body.append(dialog);
 const records=new Map(),blank=()=>({...Object.fromEntries(Object.keys(META).map(id=>[id,{phase:0,round:0,wins:0,...(id==='tori'?{clues:0}:id==='duri'?{attempts:0,best:freshBest()}:{})}])),link:{step:0,round:0,wins:0,attempts:0,decor:0}});
 let owner=null,token=null,state=blank(),saveError=false,loaded=false,active=null,opening=null,frame=0,board=null,mode='talk',focusBack=null,festivalDraft=0,festivalUndo=null,lastShot=null,shotReplay=null,shelfDraft=null,shelfUndo=null,aimDrag=null,pipeFlow=null,practice=null,basketDrag=null,pipeUndo=null,bookDrag=null,bookClick=null,festivalDrag=null,festivalClick=null,pipeDrag=null,pipeClick=null;
 const key=id=>'classRpgNpcTrio_v1_'+id;
 function cancel(){stopShotReplay();shelfUndo=null;endPipeDrag();endFestivalDrag();endBasketDrag(false);cancelBookDrag();stopPipeFlow();endAimDrag(false);cancelAnimationFrame(frame);frame=0}
 function close(){cancel();pipeUndo=null;practice=null;lastShot=null;shelfDraft=null;shelfUndo=null;if(dialog.open)dialog.close();if(focusBack?.isConnected&&!c.hub.classList.contains('hidden'))focusBack.focus({preventScroll:true})}
 function activate(){const id=c.getStudent()?.id,t=c.getToken();if(id===owner&&t===token&&loaded)return;close();festivalUndo=null;owner=id;token=t;loaded=true;saveError=false;state=blank();
  if(records.has(id)){({state,saveError}=records.get(id));return}
  if(id!=null)try{const s=JSON.parse(localStorage.getItem(key(id))||'null');if(s?.v===1){for(const name of Object.keys(META)){const r=s[name];if(r&&[r.phase,r.round,r.wins].every(Number.isInteger)&&r.phase>=0&&r.phase<=3&&r.round>=0&&r.round<=999999&&r.wins>=0&&r.wins<=999999)state[name]={phase:r.phase,round:r.round,wins:r.wins,...(name==='tori'?{...(validSearchLayout(r)?{searchLayout:{round:r.round,shift:r.searchLayout.shift}}:{}),...(validBooks(r)?{returnedBooks:[...r.returnedBooks]}:{}),...(displayBook(r)!=null?{displayBook:displayBook(r)}:{}),...(r.wins>0&&Number.isInteger(r.returnedRound)&&r.returnedRound>=0&&r.returnedRound<=999999?{returnedRound:r.returnedRound}:{}),clues:Number.isInteger(r.clues)&&r.clues>=0&&r.clues<=3?r.clues:r.phase>=2?3:0}:name==='duri'?{attempts:count(r.attempts),best:bestRecords(r.best)}:validPipeDraft(r)?{pipeDraft:{round:r.round,turns:[...r.pipeDraft.turns]}}:{})}}const l=s.link;if(l&&state.garden.wins>0&&[l.step,l.round,l.wins].every(Number.isInteger)&&l.step>=0&&l.step<=5&&l.round>=0&&l.round<=999999&&l.wins>=0&&l.wins<=999999)state.link={step:l.step,round:l.round,wins:l.wins,attempts:count(l.attempts),decor:festivalChoice(l.decor)}}}catch{saveError=true}
  records.set(id,{state,saveError});
 }
 function save(){try{localStorage.setItem(key(owner),JSON.stringify({v:1,...state}));saveError=false}catch{saveError=true}records.set(owner,{state,saveError});sync();c.refresh();if(dialog.open){const retry=dialog.querySelector('[data-trio=save]'),notice=dialog.querySelector('.trio-storage');if(retry)retry.hidden=!saveError;if(notice)notice.textContent=saveError?'저장하지 못했어요. 지금은 이어 놀 수 있어요.':''}}
 const shotRound=()=>mode==='practice-shot'?practice:mode==='link-shot'?state.link:state.duri;
 function recordText(r){if(mode==='practice-shot')return (r.round+1)+'번 연습 · '+r.attempts+'번 던짐';const best=state.duri.best[r.round%4];return (r.round%4+1)+'번 바구니 · 이번 '+r.attempts+'번 / 내 최고 '+(best==null?'아직 없음':best+'번')}
 function drawRecord(){const el=dialog.querySelector('[data-shot-record]');if(el)el.textContent=recordText(shotRound())}
 function rememberShot(){const r=shotRound(),index=r.round%4,old=state.duri.best[index];if(r.attempts<1)return '';const improved=old==null||r.attempts<old;if(improved)state.duri.best[index]=r.attempts;drawRecord();return (improved?'내 최고 기록! ':r.attempts===old?'내 최고 기록과 같아! ':'')+'기록 깃발에 남겼어. '}
 const valid=()=>dialog.open&&opening?.id===c.getStudent()?.id&&opening?.token===c.getToken()&&opening?.room===c.getScene()&&opening?.kind===c.walk.nearby()?.kind&&!c.hub.classList.contains('hidden')&&!doc.hidden;
 function changed(id='trio-'+active){save();c.focusGoal?.(id)}
 function shell(){stopShotReplay();shelfUndo=null;endPipeDrag();endFestivalDrag();endBasketDrag(false);cancelBookDrag();stopPipeFlow();pipeUndo=null;endAimDrag(false);dialog.dataset.presentation="play";const m=META[active];dialog.innerHTML='<header><h2 id="trioTitle">'+m.name+' · '+m.title+'</h2><button type="button" data-trio="close" aria-label="놀이 닫기">닫기</button></header><div class="trio-content"></div><p class="trio-feedback" role="status" aria-live="polite"></p><footer>놀이 기록은 이 기기·이 학생에게 저장돼요. 학교 경험치·골드는 그대로예요.<button type="button" data-trio="save" '+(saveError?'':'hidden')+'>저장 다시 시도</button><span class="trio-storage" role="status">'+(saveError?'저장하지 못했어요. 지금은 이어 놀 수 있어요.':'')+'</span></footer>'}
 const content=()=>dialog.querySelector('.trio-content');
 function feedback(text){dialog.querySelector('.trio-feedback').textContent=text}
 function conversation(text,action,label,secondAction='close',secondLabel='조금 더 둘러볼게'){
  if(active==='garden'){if(state.link.wins>0&&secondAction==='personal'){secondAction='festival';secondLabel='내 축제 장식'}if(mode!=='flowerbed')text=(c.flowerbedSummary?.()||'')+text;if(secondAction==='close'){secondAction='flowerbed';secondLabel='씨앗 심고 꽃밭 꾸미기'}}
  if(active==='duri'&&secondAction==='close'&&state.duri.best.some(Boolean)){secondAction='practice-menu';secondLabel='기록 바구니 연습'}
  dialog.dataset.presentation='conversation';dialog.querySelector('#trioTitle').textContent=META[active].name;const m=META[active];content().innerHTML='<div class="trio-conversation"><img alt="" src="maps/npcs/'+m.image+'"><p></p></div><div class="trio-choices"><button type="button" data-trio="'+action+'"></button><button type="button" data-trio="'+secondAction+'"></button></div>';content().querySelector('p').textContent=text;const buttons=content().querySelectorAll('button');buttons[0].textContent=label;buttons[1].textContent=secondLabel;content().querySelector('img').onerror=e=>e.target.hidden=true;
 }
 function nextClue(){return !(state.tori.clues&1)?'trio-clue-color':!(state.tori.clues&2)?'trio-clue-motif':'trio-books'}
 function searchText(){const r=state.tori,target=r.round%6;return '색 단서: '+(r.clues&1?COLORS[bookColor(target)]:'아직 못 찾음')+' · 무늬 단서: '+(r.clues&2?MOTIFS[bookMotif(target,r.round)]:'아직 못 찾음')}
 function toriMemory(r){const round=knownReturn(r);return round==null?'전에 찾아준 책은 잘 있어!':returnedName(round)+', 네가 찾아줬지! 작은 책장에 잘 모아 뒀어.'}
 function toriGoal(){const r=state.tori,target=r.round%6,color=COLORS[bookColor(target)],motif=MOTIFS[bookMotif(target,r.round)];return r.phase===2?color+' · '+motif+' 책을 들었어 · 토리에게 건네기':r.clues===3?color+' · '+motif+' 확인 · 분실책 수레에서 책 들기':r.clues&1?color+' 표지 발견 · '+(validSearchLayout(r)?'책갈피 찾기':'책장 틈 책갈피 찾기'):r.clues&2?motif+' 무늬 발견 · '+(validSearchLayout(r)?'쪽지 찾기':'창가 쪽지 찾기'):validSearchLayout(r)?'도서관 · 쪽지와 책갈피에서 단서 찾기':'도서관 왼쪽 · 창가 쪽지에서 색 단서 찾기'}
 function flowerbedTalk(){mode='flowerbed';shell();dialog.querySelector('h2').textContent='새싹 · 나비 꽃길';const ask=c.flowerbedOffer();conversation(ask.text,'bed-'+ask.action,ask.label,'garden-other','다른 부탁 이야기');if(c.flowerbedRequest?.().error)feedback('꽃밭을 이 기기에 저장하지 못했어. 닫고 부탁 수첩에서 다시 저장해 줘.')}
 function festival(){mode='festival';festivalDraft=state.link.decor;shell();dialog.querySelector('h2').textContent='새싹 · 우리 꽃 축제';content().innerHTML='<p>장식을 위 리본으로 끌어 걸어 봐!</p><div class="trio-festival-preview" data-festival-drop role="img"></div><div class="trio-festival-choices" role="group" aria-label="축제 장식 모양">'+FESTIVAL_NAMES.map((name,i)=>'<button type="button" data-festival-style="'+i+'" aria-pressed="'+(i===festivalDraft)+'"><span>'+festivalArt(i)+'</span>'+name+'</button>').join('')+'</div><div class="trio-choices"><button type="button" data-trio="festival-hang">이 모양으로 걸기</button><button type="button" data-trio="festival-undo" hidden>걸기 되돌리기</button><button type="button" data-trio="personal">물길·꽃밭 이야기</button></div>';previewFestival();festivalUndoControl();feedback('눌러 고른 뒤 ‘이 모양으로 걸기’도 돼!')}
 function previewFestival(){const preview=dialog.querySelector('.trio-festival-preview');preview.innerHTML=festivalArt(festivalDraft)+'<span>여기로 끌어 걸기</span>';preview.setAttribute('aria-label',FESTIVAL_NAMES[festivalDraft]+' 장식 미리 보기 · 여기에 끌어 걸기');dialog.querySelectorAll('[data-festival-style]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.festivalStyle)===festivalDraft)))}
 function talk(personal=false,skipFlower=false){practice=null;lastShot=null;mode='talk';shell();const m=META[active],r=state[active],l=state.link;
  if(!personal&&r.phase!==2){
   if(active==='garden'&&!skipFlower&&l.step!==4&&c.flowerbedRequest?.().active){flowerbedTalk();return}
   if(active==='garden'&&r.wins>0&&(l.step===0||l.step===5)){conversation(l.step===5?'우리 정원의 '+FESTIVAL_NAMES[l.decor]+' 장식을 기억해! 두리와 다시 꽃 축제를 준비해 볼까?':'네가 피운 꽃을 두리에게 전해 줄래? 운동장 꽃 장식을 준비하고 있대.','link-start','꽃을 받아 두리에게 전할게','personal','물길 놀이 이야기');return}
   if(active==='garden'&&l.step===4){conversation('두리가 보낸 리본이구나! 네가 피운 꽃에 묶으면 축제 준비가 완성돼.','link-finish','새싹에게 리본 건네기','personal','물길 놀이 이야기');return}
   if(active==='garden'&&l.step>=1&&l.step<=3){conversation('꽃을 운동장 두리에게 전하고, 두리의 리본을 받아 와 줘. 연못 길을 지나면 운동장이야.','link-route','두리를 만나러 갈게','personal','물길 놀이 이야기');return}
   if(active==='duri'&&l.step===1){conversation('새싹이 보낸 꽃이구나! 받아서 바구니 옆을 꾸밀게.','link-flower','두리에게 꽃 건네기','personal','내 공놀이 이야기');return}
   if(active==='duri'&&l.step===2){conversation('꽃 장식은 됐어! 바구니에 공을 넣어 축제 연습을 마치면 새싹에게 줄 리본을 꺼내 줄게.','link-shot','축제 공놀이 하기','close','잠깐 더 둘러볼게');return}
   if(active==='duri'&&l.step===3){conversation('멋진 슛이었어! '+(l.attempts?recordText(l)+'. ':'')+'이 리본을 새싹에게 가져다줄래? 네 꽃을 묶으면 축제 준비 끝이야.','link-take','리본 받아 새싹에게 가기');return}
   if(active==='duri'&&l.step===4){conversation('리본은 정원의 새싹에게 전해 줘! 연못 길을 따라 돌아가면 돼.','link-route','새싹에게 돌아갈게','personal','내 공놀이 이야기');return}
  }
  if(active==='tori'){conversation(r.phase===2?'찾은 책이구나! 내 곁에 놓아 줄래?':r.phase===1?(r.wins?toriMemory(r)+' ':validSearchLayout(r)?'이번에는 쪽지와 책갈피, 수레가 다른 자리에 있어. ':'창가 쪽지와 책장 틈의 책갈피를 살펴봐 줘. ')+searchText():r.phase===3?toriMemory(r)+' 다른 책도 찾아줄래?':'잃어버린 책의 단서가 도서관에 흩어졌어. 창가 쪽지와 책장 틈의 책갈피를 찾아줄래?',r.phase===2?'return':r.phase===1?'search':'accept',r.phase===2?'들고 온 책 건네기':r.phase===1?'단서 찾으러 갈게':'맡겨 줘, 찾아올게!','legacy','책 이야기와 예전 부탁');return}
  conversation(r.phase===2?m.done+(active==='duri'&&r.attempts?' '+recordText(r)+'.':''):r.phase===1?(active==='garden'&&validPipeDraft(r)?'돌려 둔 물길은 그대로야. 이어서 꽃까지 연결해 줄래?':'돌아왔구나! '+m.task):r.phase===3?(active==='duri'?'이번에는 '+((r.round+1)%4+1)+'번 바구니야. 각도와 힘을 다시 맞춰 볼까?':'또 놀러 왔구나! 이번에는 조금 다른 도전이야.'):m.task,r.phase===2?'return':r.phase===1?'play':'accept',r.phase===2?'함께 완성하기':r.phase===1?'계속 도전하기':r.phase===3?'다른 도전 받기':'좋아, 해 볼게!');
 }
 function launch(id,kind=id==='tori'?'tori':'trio-'+id){activate();active=id;opening={id:owner,token,room:c.getScene(),kind};focusBack=doc.activeElement;c.stop();c.walk.stop();talk();if(!dialog.open)dialog.showModal()}
 function inspectShelf(){launch('tori','trio-shelf');mode='shelf';shelfDraft=null;shell();dialog.dataset.presentation='shelf';dialog.querySelector('h2').textContent='토리의 작은 책장';const books=collectedBooks(state.tori),total=shelfTotal(books),unknown=state.tori.wins-total;
  content().innerHTML='<p class="trio-shelf-intro">'+(total?'모은 책 '+total+'권. 눌러 살펴보거나 아래 앞자리로 끌어 봐!':unknown?'예전에 돌려준 책도 잘 간직하고 있어.':'책장은 아직 비어 있어. 토리에게 책을 돌려주면 여기 모여!')+'</p><div class="trio-shelf-collection" role="group" aria-label="돌려준 책">'+books.map((n,i)=>n?'<button type="button" data-shelf-book="'+i+'" aria-label="'+returnedName(i)+' · '+n+'권" aria-pressed="false">'+bookArt(i,i)+'<span>'+COLORS[bookColor(i)]+' · '+MOTIFS[bookMotif(i,i)]+'</span><small>'+n+'권</small></button>':'').join('')+'</div>'+(total?'<div class="trio-shelf-actions"><span data-shelf-drop aria-label="책을 놓을 앞자리"><button type="button" data-trio="shelf-display" disabled>앞에 세우기</button></span><button type="button" data-trio="shelf-latest" hidden>최근 책으로</button><button type="button" data-trio="shelf-undo" hidden>진열 되돌리기</button></div>':'')+(unknown?'<p class="trio-shelf-legacy">예전 '+unknown+'권은 표지 기록이 없어. 새로 돌려주는 책부터 하나씩 모을게.</p>':'');shelfControls();feedback(displayBook(state.tori)!=null?'토리: 앞에는 '+returnedName(displayBook(state.tori))+'을 세워 뒀어!':total?'책을 골라 토리의 기억을 읽어 봐.':'찾은 책을 직접 토리에게 건네줘.');
 }
 function shelfControls(){const selected=dialog.querySelector('[data-trio=shelf-display]'),latest=dialog.querySelector('[data-trio=shelf-latest]'),chosen=displayBook(state.tori);if(!selected)return;selected.disabled=shelfDraft==null||shelfDraft===chosen;selected.setAttribute('aria-label',shelfDraft==null?'표지를 고른 뒤 앞에 세우기':returnedName(shelfDraft)+' 앞에 세우기');latest.hidden=chosen==null;dialog.querySelector('[data-trio=shelf-undo]').hidden=!shelfUndo;dialog.querySelectorAll('[data-shelf-book]').forEach(b=>b.dataset.displayed=String(Number(b.dataset.shelfBook)===chosen))}
 const canDisplayShelf=()=>valid()&&active==='tori'&&mode==='shelf'&&opening.kind==='trio-shelf';
 function placeShelfBook(i){
  if(!canDisplayShelf()||!Number.isInteger(i)||i<0||i>5||!collectedBooks(state.tori)[i]||displayBook(state.tori)===i)return;
  shelfUndo={book:displayBook(state.tori)};shelfDraft=i;state.tori.displayBook=i;save();dialog.querySelectorAll('[data-shelf-book]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.shelfBook)===i)));shelfControls();dialog.querySelector('[data-shelf-book="'+i+'"]').focus({preventScroll:true});feedback('토리: '+returnedName(i)+'을 앞에 세웠어!');
 }
 function undoShelf(){
  if(!canDisplayShelf()||!shelfUndo)return;const previous=shelfUndo.book;shelfUndo=null;
  if(previous==null)delete state.tori.displayBook;else state.tori.displayBook=previous;
  save();shelfControls();const focus=dialog.querySelector('[data-shelf-book="'+(shelfDraft??previous)+'"]')||dialog.querySelector('[data-shelf-book]');focus?.focus({preventScroll:true});
  feedback('토리: '+(previous==null?'최근에 돌려준 책을 다시 앞에 세웠어!':returnedName(previous)+'을 다시 앞에 세웠어!'));
 }
 function search(){close();doc.getElementById('campusTitle').focus({preventScroll:true})}
 function inspectSearch(kind){launch('tori',kind);mode='clue';shell();const r=state.tori;if(r.phase!==1){conversation(r.phase===2?'책은 이미 네 손에 있어. 토리에게 가져가자!':'먼저 토리의 부탁을 받아 보자.','close','계속 둘러보기');return}
  if(kind==='trio-books'){if(r.clues===3)bookGame();else conversation((validSearchLayout(r)?'아직 단서가 부족해. 도서관의 쪽지와 책갈피를 모두 살펴보자. ':'아직 단서가 부족해. 창가 쪽지와 책장 틈의 책갈피를 모두 살펴보자. ')+searchText(),'search','남은 단서 찾으러 가기');return}
  const color=kind==='trio-clue-color',target=r.round%6;content().innerHTML='<div class="trio-found-clue">'+(color?'<span class="trio-color-swatch color-'+bookColor(target)+'"></span>':glyph(bookMotif(target,r.round)))+'</div><p></p><button type="button" data-trio="note">단서를 수첩에 적기</button>';content().querySelector('p').textContent=color?(validSearchLayout(r)?'쪽지: 잃어버린 책의 표지는 ':'창가 쪽지: 잃어버린 책의 표지는 ')+COLORS[bookColor(target)]+'색이래!':'책갈피의 자국: 표지에 '+MOTIFS[bookMotif(target,r.round)]+' 무늬가 있었대!';
 }
 function bookGame(){
  const r=state.tori,colors=['초록','파랑','분홍'],motifs=['달','잎','별'],round=r.round,target=round%6;mode='books';shell();dialog.querySelector('h2').textContent='토리 · 책 수레';
  const order=bookCartOrder(round),color=i=>Math.floor(i/2),motif=i=>(Math.floor(i/2)+i%2+round)%3;const goalColor=colors[color(target)],goalMotif=motifs[motif(target)],glyph=n=>'<svg viewBox="0 0 60 60" width="52" height="52" aria-hidden="true"><path fill="#fff8d3" d="'+['M40 8C12 3 3 43 32 52C17 38 20 19 40 8Z','M48 10C14 7 7 24 15 42C34 49 51 33 48 10ZM12 48L39 20','M30 5L37 22L55 30L37 37L30 55L23 37L5 30L23 23Z'][n]+'" stroke="#fff8d3" stroke-width="3" stroke-linejoin="round"/></svg>';
  content().innerHTML='<p class="trio-clue">토리의 단서: <b>'+goalColor+' 표지</b>에 <b>'+goalMotif+' 무늬</b>가 있어!</p><div class="trio-books" role="group" aria-label="책 표지 고르기">'+order.map(i=>'<button type="button" data-book="'+i+'" aria-label="'+colors[color(i)]+' 표지, '+motifs[motif(i)]+' 무늬 책 들기"><span class="trio-book color-'+color(i)+'"><span>' +glyph(motif(i))+'</span></span><span>'+colors[color(i)]+' · '+motifs[motif(i)]+'</span></button>').join('')+'</div><div class="trio-book-drop" data-book-drop>여기로 옮겨 들고 가기</div>';
  feedback('책을 아래 자리로 끌거나 눌러 들어 줘. 두 단서와 맞춰 봐!');
 }
 function pipes(){mode='pipes';shell();dialog.querySelector('h2').textContent='새싹 · 물길 잇기';board=pipePuzzle(state.garden.round);const resumed=validPipeDraft(state.garden);if(resumed)board.tiles.forEach((tile,i)=>tile.turn=state.garden.pipeDraft.turns[i]);content().innerHTML='<p>좌우 끌기·누르기로 회전! 방향키로 고르고 Enter도 돼.</p><div class="trio-pipe-wrap"><span class="trio-source" style="grid-row:'+(board.start+1)+'" aria-label="수도">💧</span><div class="trio-pipes" role="group" aria-label="돌려서 잇는 아홉 물길"></div><span class="trio-flower" style="grid-row:'+(board.end+1)+'" aria-label="물을 기다리는 꽃">🌼</span></div><div class="trio-pipe-actions"><button type="button" data-trio="water">물 흘리기</button><button type="button" data-trio="pipe-undo" disabled>회전 되돌리기</button></div>';drawPipes();feedback(resumed?'돌려 둔 물길에서 이어 하자. 물을 흘려 다시 확인해 봐!':'시간 제한은 없어. 물을 흘려서 어디까지 가는지 확인해 봐!')}
 const canTurnPipe=()=>valid()&&active==='garden'&&mode==='pipes'&&state.garden.phase===1;
 function turnPipe(index,step=1){if(!canTurnPipe()||!Number.isInteger(index)||index<0||index>=9||![1,-1].includes(step))return;stopPipeFlow();rememberPipeTurn(index);board.tiles[index].turn=(board.tiles[index].turn+step+4)%4;state.garden.pipeDraft={round:state.garden.round,turns:board.tiles.map(t=>t.turn)};drawPipes();save();dialog.querySelector('[data-tile="'+index+'"]').focus({preventScroll:true});feedback(saveError?'물길을 돌렸어. 아래에서 저장을 다시 해 줘.':'물길을 돌렸어. 이어졌는지 물을 흘려 보자!')}
 function endPipeDrag(block=true){const d=pipeDrag;if(!d)return null;pipeDrag=null;d.el.classList.remove('is-turn-preview');delete d.el.dataset.turnDirection;dialog.classList.remove('is-turning-pipe');if(block)pipeClick={id:d.id,until:performance.now()+800};try{if(d.el.hasPointerCapture(d.id))d.el.releasePointerCapture(d.id)}catch{}return d}
 const pipeDropAt=e=>!!doc.elementFromPoint(e.clientX,e.clientY)?.closest('#npcTrio .trio-pipes');
 const pipeStep=(d,e)=>Math.abs(e.clientX-d.x)>=12&&Math.abs(e.clientX-d.x)>Math.abs(e.clientY-d.y)?Math.sign(e.clientX-d.x):0;
 dialog.addEventListener('pointerdown',e=>{if(pipeDrag)return;pipeClick=null;const b=e.target.closest('[data-tile]');if(!b||!e.isPrimary||e.button!==0||b.disabled||!content()?.contains(b)||!canTurnPipe())return;pipeDrag={id:e.pointerId,el:b,index:Number(b.dataset.tile),board,round:state.garden.round,x:e.clientX,y:e.clientY,active:false,flowing:!!pipeFlow};try{b.setPointerCapture(e.pointerId)}catch{pipeDrag=null}});
 dialog.addEventListener('pointermove',e=>{const d=pipeDrag;if(!d||d.id!==e.pointerId)return;if(!canTurnPipe()||d.board!==board||d.round!==state.garden.round||!content().contains(d.el)){endPipeDrag();return}if(!d.active&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<8)return;d.active=true;const step=!d.flowing&&!pipeFlow&&pipeDropAt(e)?pipeStep(d,e):0;dialog.classList.add('is-turning-pipe');d.el.classList.toggle('is-turn-preview',!!step);d.el.dataset.turnDirection=step<0?'↶':'↷'});
 dialog.addEventListener('pointerup',e=>{const d=pipeDrag;if(!d||d.id!==e.pointerId)return;const ok=canTurnPipe()&&d.board===board&&d.round===state.garden.round&&content().contains(d.el),step=pipeStep(d,e),drop=pipeDropAt(e);endPipeDrag(d.active);if(!d.active)return;if(ok&&!d.flowing&&!pipeFlow&&drop&&step)turnPipe(d.index,step)});
 for(const type of ['pointercancel','lostpointercapture'])dialog.addEventListener(type,e=>{if(pipeDrag?.id===e.pointerId)endPipeDrag()});
 for(const type of ['blur','resize'])doc.defaultView.addEventListener(type,()=>endPipeDrag());dialog.addEventListener('scroll',()=>endPipeDrag());dialog.addEventListener('close',()=>endPipeDrag());
 dialog.addEventListener('click',e=>{if(pipeClick&&performance.now()<pipeClick.until&&e.detail!==0&&(e.pointerId===pipeClick.id||e.pointerId==null)){pipeClick=null;e.preventDefault();e.stopImmediatePropagation()}},true);
 function pipeKey(e){
  const tile=e.target.closest('[data-tile]');
  if(!tile||!content().contains(tile)||mode!=='pipes'||active!=='garden'||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||e.isComposing)return false;
  if(!valid()){close();sync();return true}
  if(state.garden.phase!==1||tile.disabled||pipeDrag)return true;
  const index=Number(tile.dataset.tile),row=Math.floor(index/3),col=index%3;
  if(!Number.isInteger(index)||index<0||index>=9)return true;
  const next=e.key==='ArrowLeft'?(col?index-1:index):e.key==='ArrowRight'?(col<2?index+1:index):e.key==='ArrowUp'?(row?index-3:index):(row<2?index+3:index);
  dialog.querySelector('[data-tile="'+next+'"]').focus();
  return true;
 }
 function pipeUndoControl(){const b=dialog.querySelector('[data-trio=pipe-undo]');if(b)b.disabled=!pipeUndo||pipeUndo.board!==board||pipeUndo.round!==state.garden.round||state.garden.phase!==1}
 function rememberPipeTurn(index){pipeUndo={board,round:state.garden.round,index,turn:board.tiles[index].turn,draft:validPipeDraft(state.garden)?{round:state.garden.round,turns:[...state.garden.pipeDraft.turns]}:null};pipeUndoControl()}
 function undoPipeTurn(){const previous=pipeUndo;if(!previous||previous.board!==board||previous.round!==state.garden.round)return;stopPipeFlow();board.tiles[previous.index].turn=previous.turn;if(previous.draft)state.garden.pipeDraft={round:previous.draft.round,turns:[...previous.draft.turns]};else delete state.garden.pipeDraft;pipeUndo=null;drawPipes();pipeUndoControl();save();dialog.querySelector('[data-tile="'+previous.index+'"]').focus({preventScroll:true});feedback(saveError?'회전을 되돌렸어. 아래에서 저장을 다시 해 줘.':'방금 돌린 조각을 되돌렸어. 물을 흘려 다시 확인해 봐!')}
 function drawPipes(wet=[],blocked=null){endPipeDrag();const container=dialog.querySelector('.trio-pipes'),focused=doc.activeElement?.dataset.tile,directions=['위','오른쪽','아래','왼쪽'];container.innerHTML=board.tiles.map((tile,i)=>{const p=ports(tile),ends=[[30,0],[60,30],[30,60],[0,30]],a=ends[p[0]],b=ends[p[1]],stopped=blocked?.cell===i,marker=stopped?'<g class="trio-pipe-stop" transform="translate('+[[30,10],[50,30],[30,50],[10,30]][blocked.side].join(' ')+')"><circle r="8"/><path d="M-3-3L3 3M-3 3L3-3"/></g>':'';return '<button type="button" data-tile="'+i+'" aria-label="'+(Math.floor(i/3)+1)+'행 '+(i%3+1)+'열 물길 · '+p.map(s=>directions[s]).join('·')+(stopped?' · 물이 멈춘 곳 · '+directions[blocked.side]+' 연결 확인':'')+'" class="'+(wet.includes(i)?'wet ':'')+(stopped?'pipe-blocked':'')+'"><svg viewBox="0 0 60 60" aria-hidden="true"><path d="M '+a.join(' ')+' L 30 30 L '+b.join(' ')+'"/>'+marker+'</svg></button>'}).join('');if(focused!=null)container.querySelector('[data-tile="'+focused+'"]').focus({preventScroll:true})}

 function stopPipeFlow(clear=false){
  if(!pipeFlow)return;cancelAnimationFrame(pipeFlow.frame);pipeFlow=null;delete dialog.dataset.waterFlow;
  const button=dialog.querySelector('[data-trio=water]');if(button){button.textContent='물 흘리기';button.setAttribute('aria-pressed','false')}
  dialog.querySelectorAll('.trio-water-front').forEach(el=>el.remove());dialog.querySelectorAll('.pipe-flowing').forEach(el=>el.classList.remove('pipe-flowing'));
  if(clear&&mode==='pipes'&&dialog.querySelector('.trio-pipes'))drawPipes();
 }
 function finishWater(result){stopPipeFlow();drawPipes(result.wet,result.blocked);if(result.ok)complete();else feedback(result.blocked.reason==='inlet'?'물이 여기서 멈췄어. × 표시 쪽으로 물길이 열리게 돌려 줘!':result.blocked.reason==='loop'?'물이 같은 곳으로 돌아왔어. × 표시에서 꽃 쪽으로 이어 줘!':'물이 꽃 밖으로 흘렀어. × 표시에서 꽃이 있는 줄의 오른쪽으로 이어 줘!');}
 function runWater(){
  const result=traceWater(board.tiles,board.start,board.end);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!result.wet.length){finishWater(result);return}
  drawPipes();const run={board,round:state.garden.round,result,index:0,frame:0,start:0,path:null,cell:null};pipeFlow=run;
  dialog.dataset.waterFlow='running';const button=dialog.querySelector('[data-trio=water]');button.textContent='물 멈추기';button.setAttribute('aria-pressed','true');
  feedback('물이 흐르는 중이야. 멈추거나 조각을 돌려 다시 시험해 봐!');
  function tick(now){
   if(pipeFlow!==run)return;
   if(!valid()||mode!=='pipes'||active!=='garden'||board!==run.board||state.garden.phase!==1||state.garden.round!==run.round){close();return}
   if(matchMedia('(prefers-reduced-motion: reduce)').matches){finishWater(result);return}
   if(!run.path){
    const i=result.wet[run.index],prev=result.wet[run.index-1],incoming=run.index===0?3:i===prev+1?3:i===prev-1?1:i===prev+3?0:2;
    const out=ports(board.tiles[i]).find(side=>side!==incoming),ends=[[30,0],[60,30],[30,60],[0,30]];
    run.cell=dialog.querySelector('[data-tile="'+i+'"]');run.cell.classList.add('pipe-flowing');
    run.path=doc.createElementNS('http://www.w3.org/2000/svg','path');run.path.classList.add('trio-water-front');
    run.path.setAttribute('d','M '+ends[incoming].join(' ')+' L 30 30 L '+ends[out].join(' '));run.path.setAttribute('pathLength','1');
    run.path.setAttribute('stroke-dasharray','1');run.path.setAttribute('stroke-dashoffset','1');run.cell.querySelector('svg').append(run.path);run.start=now;
   }
   const progress=Math.min(1,(now-run.start)/200);run.path.setAttribute('stroke-dashoffset',String(1-progress));
   if(progress===1){run.cell.classList.remove('pipe-flowing');run.cell.classList.add('wet');run.path.remove();run.path=null;run.index++;if(run.index===result.wet.length){finishWater(result);return}}
   run.frame=requestAnimationFrame(tick);
  }
  run.frame=requestAnimationFrame(tick);
 }
 doc.defaultView.addEventListener('blur',()=>{if(pipeFlow){stopPipeFlow(true);if(valid())feedback('물을 멈췄어. 다시 흘려서 확인해 봐!')}});

 function practiceNotice(){dialog.querySelector('footer').firstChild.textContent='연습은 부탁과 최고 기록을 바꾸지 않아요.'}
 function practiceMenu(){
  practice=null;lastShot=null;mode='practice-menu';shell();practiceNotice();dialog.querySelector('h2').textContent='두리 · 바구니 골라 연습';
  content().innerHTML='<p>성공했던 바구니를 골라 다시 던져 봐!</p><div class="trio-practice-baskets" role="group" aria-label="기록이 있는 바구니 연습">'+state.duri.best.map((best,i)=>'<button type="button" data-practice-basket="'+i+'" '+(best==null?'disabled':'')+'><svg viewBox="0 0 480 210" aria-hidden="true"><path d="M0 180H480" stroke="#839c60" stroke-width="6"/><circle cx="30" cy="172" r="9" fill="#eab45c" stroke="#89632d" stroke-width="2"/><path d="M'+(197+i*22)+' 172h36l-5 24h-26z" fill="#c88e54" stroke="#795934" stroke-width="3"/></svg><span>'+(i+1)+'번 바구니</span><small>'+(best==null?'아직 성공 기록 없음':'내 최고 '+best+'번')+'</small></button>').join('')+'</div><button type="button" data-trio="practice-back">부탁 이야기로</button>';
  feedback('골라서 연습해도 원래 부탁은 그대로 이어갈 수 있어.');dialog.querySelector('[data-practice-basket]:not(:disabled)')?.focus({preventScroll:true});
 }
 function finishPractice(){
  practice.done=true;drawPracticeGuide();content().querySelector('.trio-practice-distance').hidden=true;content().querySelectorAll('button,input').forEach(el=>el.disabled=true);dialog.querySelector('[data-trio=replay-shot]').disabled=false;content().querySelector('p').hidden=false;content().querySelector('p').textContent='실선과 ×가 방금 던진 공이야.';content().querySelector('.trio-shot-controls').hidden=true;content().querySelector('.trio-shot-actions').hidden=true;
  feedback('연습 성공! '+practice.attempts+'번 만에 넣었어. 다시 던져 볼까?');
  const actions=doc.createElement('div');actions.className='trio-practice-actions';actions.innerHTML='<button type="button" data-trio="practice-again">한 번 더</button><button type="button" data-trio="practice-menu">다른 바구니</button>';content().append(actions);actions.firstElementChild.focus({preventScroll:true});
 }
 function shot(link=false,practiceIndex=null,practiceTarget=null,guide=true){lastShot=null;practice=practiceIndex==null?null:{round:practiceIndex,target:practiceTarget??215+practiceIndex*22,attempts:0,done:false,guide};mode=practice?'practice-shot':link?'link-shot':'shot';shell();const target=shotTarget();content().innerHTML='<p>공을 오른쪽 위로 끌어 조준해 봐.</p><p class="trio-shot-record" data-shot-record aria-live="polite"></p><div class="trio-court-wrap"><svg class="trio-court" viewBox="0 0 480 210" role="img" aria-label="왼쪽에서 오른쪽 바구니로 공 던지기"><path d="M0 180H480" stroke="#839c60" stroke-width="8"/><path d="M'+(target-18)+' 172h36l-5 24h-26z" fill="#c88e54" stroke="#795934" stroke-width="3"/><g class="trio-last-shot" visibility="hidden" aria-hidden="true"><path class="trio-last-trajectory"/><g class="trio-landing-mark"><circle r="12"/><path d="M-6-6L6 6M-6 6L6-6"/></g></g><path class="trio-trajectory" fill="none" stroke="#447c8c" stroke-width="2" stroke-dasharray="4 5"/><circle class="trio-projectile" cx="30" cy="172" r="9" fill="#eab45c" stroke="#89632d" stroke-width="2"/></svg><button type="button" class="trio-aim-grip" data-trio="aim-grip" aria-label="공을 끌어 조준하기. 키보드는 아래 각도와 힘 막대를 사용하세요."></button></div><div class="trio-shot-review"><p class="trio-shot-last" data-shot-last>아직 던지기 전이야.</p><button type="button" data-trio="replay-shot" aria-pressed="false" hidden>공 다시 보기</button></div><div class="trio-shot-controls"><label>각도 <output data-angle>40°</output><input aria-label="던지는 각도" data-shot="angle" type="range" min="30" max="70" value="40"></label><label>힘 <output data-power>38</output><input aria-label="던지는 힘" data-shot="power" type="range" min="35" max="65" value="38"></label></div><div class="trio-shot-actions"><button type="button" data-trio="throw">공 던지기</button><button type="button" data-trio="recall-shot" hidden>방금 조준으로</button></div>';trajectory();drawRecord();feedback('막대로도 조절할 수 있어. 점선을 맞추고 공 던지기를 눌러 줘!');if(practice){installPracticeTarget();installPracticeGuide();practiceNotice();dialog.querySelector('[data-shot-last]').hidden=true;feedback('점선을 숨겨도 돼. 직접 조준해 던져 봐!');dialog.querySelector('h2').textContent='두리 · 바구니 연습';dialog.querySelector('.trio-aim-grip').focus({preventScroll:true})}if(matchMedia('(min-width: 560px) and (max-height: 520px)').matches)dialog.scrollTop=0}
 function trajectory(){const angle=Number(dialog.querySelector('[data-shot=angle]').value),power=Number(dialog.querySelector('[data-shot=power]').value),landing=shotLanding(angle,power),height=Math.sin(angle*Math.PI/180)*power*1.5;dialog.querySelector('[data-angle]').textContent=angle+'°';dialog.querySelector('[data-power]').textContent=power;dialog.querySelector('.trio-trajectory').setAttribute('d','M30 172 Q'+((30+landing)/2)+' '+(172-height*2)+' '+landing+' 172');const ball=dialog.querySelector('.trio-projectile');ball.setAttribute('cx',30);ball.setAttribute('cy',172);return {landing,height,angle,power}}
 function showShotResult({landing,height,angle,power,target}){content().querySelector('p').hidden=true;dialog.querySelector('[data-shot-last]').hidden=false;lastShot={landing,height,angle,power,target};dialog.querySelector('[data-trio=replay-shot]').hidden=false;dialog.querySelector('[data-trio=recall-shot]').hidden=false;const result=Math.abs(landing-target)<=18?'바구니 안':landing<target?'바구니 앞':'바구니 너머',court=dialog.querySelector('.trio-court'),last=dialog.querySelector('.trio-last-shot');last.querySelector('.trio-last-trajectory').setAttribute('d',dialog.querySelector('.trio-trajectory').getAttribute('d'));last.querySelector('.trio-landing-mark').setAttribute('transform','translate('+landing+' 194)');last.setAttribute('visibility','visible');last.dataset.result=result;dialog.querySelector('[data-shot-last]').textContent='방금 '+angle+'° · 힘 '+power+' → '+result;court.setAttribute('aria-label','공 던지기. 방금 각도 '+angle+'도, 힘 '+power+', '+result+'에 도착. 실선과 ×가 방금 공, 점선이 다음 공의 예상 길.');lastShot.text=dialog.querySelector('[data-shot-last]').textContent;lastShot.label=court.getAttribute('aria-label');drawPracticeGuide()}
 function complete(){if(mode==='practice-shot'){finishPractice();return}const record=(mode==='shot'||mode==='link-shot')?rememberShot():'';if(active==='tori'){state.tori.phase=2;changed();close();doc.getElementById('campusTitle').focus({preventScroll:true});return}if(mode==='link-shot'){state.link.step=3;changed('trio-link')}else{state[active].phase=2;if(active==='garden'){pipeUndo=null;delete state.garden.pipeDraft;}changed()}feedback('성공! '+record+META[active].name+'에게 돌아가 마무리하자.');content().querySelectorAll('button,input').forEach(el=>el.disabled=true);if(mode==='shot'||mode==='link-shot'){dialog.querySelector('[data-trio=replay-shot]').disabled=false;content().querySelector('p').textContent='실선과 ×가 방금 던진 공이야.';content().querySelector('.trio-shot-controls').hidden=true;content().querySelector('.trio-shot-actions').hidden=true}const b=doc.createElement('button');b.type='button';b.dataset.trio='close';b.textContent='맵으로 돌아가기';content().append(b);b.focus({preventScroll:true})}

 function stopShotReplay(){
  const replay=shotReplay;if(!replay)return;shotReplay=null;cancelAnimationFrame(replay.frame);replay.ghost.remove();replay.court.classList.remove('is-shot-replay');
  if(replay.button.isConnected){replay.button.textContent='공 다시 보기';replay.button.setAttribute('aria-pressed','false')}
  if(dialog.open&&replay.court.isConnected)feedback(replay.feedback);
 }
 function replayShot(button){
  if(!valid()||active!=='duri'||!lastShot||frame||aimDrag||basketDrag||!['shot','link-shot','practice-shot'].includes(mode)||!content().contains(button)||button.hidden||button.disabled)return;
  if(shotReplay){stopShotReplay();return}
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){feedback('실선·×가 방금 공이야. 횟수 그대로!');return}
  const court=dialog.querySelector('.trio-court'),ghost=doc.createElementNS('http://www.w3.org/2000/svg','g'),ball=doc.createElementNS('http://www.w3.org/2000/svg','circle'),shot={...lastShot};
  ghost.classList.add('trio-shot-replay');ghost.setAttribute('aria-hidden','true');
  if(practice&&practice.target!==shot.target){const basket=doc.createElementNS('http://www.w3.org/2000/svg','path');basket.setAttribute('d','M'+(shot.target-18)+' 172h36l-5 24h-26z');basket.classList.add('trio-replay-basket');ghost.append(basket)}
  ball.setAttribute('r','9');ball.setAttribute('cx','30');ball.setAttribute('cy','172');ghost.append(ball);court.append(ghost);court.classList.add('is-shot-replay');
  const replay=shotReplay={court,ghost,button,feedback:dialog.querySelector('.trio-feedback').textContent,frame:0},start=performance.now();
  button.textContent='보기 멈추기';button.setAttribute('aria-pressed','true');feedback(practice&&practice.target!==shot.target?'옮기기 전 공이야. 횟수 그대로!':'방금 공이야. 횟수는 그대로야.');
  function tick(now){if(shotReplay!==replay)return;if(!valid()){close();return}if(!court.isConnected){stopShotReplay();return}const t=Math.min(1,(now-start)/1400);ball.setAttribute('cx',30+(shot.landing-30)*t);ball.setAttribute('cy',172-4*shot.height*t*(1-t));if(t<1)replay.frame=requestAnimationFrame(tick);else stopShotReplay()}
  replay.frame=requestAnimationFrame(tick);
 }
 for(const type of ['blur','resize'])doc.defaultView.addEventListener(type,stopShotReplay);
 dialog.addEventListener('scroll',stopShotReplay);
 dialog.addEventListener('input',stopShotReplay,true);
 dialog.addEventListener('pointerdown',e=>{if(e.target.closest('.trio-aim-grip,.trio-basket-grip'))stopShotReplay()},true);
 const replayMotion=matchMedia('(prefers-reduced-motion: reduce)');replayMotion.addEventListener('change',e=>{if(e.matches)stopShotReplay()});
 function play(){if(active==='tori')search();else if(active==='garden')pipes();else shot()}


 const shotTarget=()=>mode==='practice-shot'?practice.target:215+shotRound().round%4*22;
 const canMoveBasket=()=>canAim()&&mode==='practice-shot'&&!aimDrag;
 function installPracticeTarget(){
  content().querySelector('p').textContent='공은 위로, 바구니는 좌우로 끌어 봐.';
  const wrap=dialog.querySelector('.trio-court-wrap'),grip=doc.createElement('button');grip.type='button';grip.className='trio-basket-grip';grip.dataset.trio='basket-grip';grip.setAttribute('aria-label','연습 바구니를 좌우로 옮기기. Enter를 누르면 거리 막대로 이동해요.');grip.innerHTML='<span aria-hidden="true">↔</span>';wrap.append(grip);
  const row=doc.createElement('div');row.className='trio-practice-distance';row.innerHTML='<label><span>거리</span><input type="range" min="170" max="350" step="1" data-practice-distance aria-label="연습 바구니 거리"></label><button type="button" data-trio="basket-reset">원래 자리</button>';wrap.after(row);drawPracticeTarget(practice.target);
 }
 function drawPracticeTarget(target){
  const grip=dialog.querySelector('.trio-basket-grip');if(!grip)return;
  dialog.querySelector('.trio-court>path:nth-of-type(2)').setAttribute('d','M'+(target-18)+' 172h36l-5 24h-26z');grip.style.left='calc('+target/480*100+'% - 22px)';dialog.querySelector('[data-practice-distance]').value=target;
  if(lastShot?.text){const moved=target!==lastShot.target;dialog.querySelector('[data-shot-last]').textContent=(moved?'옮기기 전: ':'')+lastShot.text;dialog.querySelector('.trio-court').setAttribute('aria-label',(moved?'바구니를 옮겼어요. 다음 기록은 옮기기 전 결과예요. ':'')+lastShot.label)}
  drawPracticeGuide(target);
 }
 function installPracticeGuide(){
  const record=dialog.querySelector('[data-shot-record]'),row=doc.createElement('div'),button=doc.createElement('button');row.className='trio-practice-heading';record.before(row);row.append(record);button.type='button';button.dataset.trio='practice-guide';button.setAttribute('aria-label','조준 점선 보기');row.append(button);drawPracticeGuide();
 }
 function drawPracticeGuide(target=practice?.target){
  if(!practice||mode!=='practice-shot')return;
  const button=dialog.querySelector('[data-trio=practice-guide]');if(!button)return;
  button.textContent=practice.guide?'점선 숨기기':'점선 보기';button.setAttribute('aria-pressed',String(practice.guide));button.hidden=practice.done;
  dialog.querySelector('.trio-trajectory').setAttribute('visibility',practice.guide?'visible':'hidden');
  const moved=lastShot&&target!==lastShot.target,base=lastShot?lastShot.label.replace('실선과 ×가 방금 공, 점선이 다음 공의 예상 길.','실선과 ×가 방금 공이에요.'):'왼쪽에서 오른쪽 바구니로 공 던지기.';
  dialog.querySelector('.trio-court').setAttribute('aria-label',(moved?'바구니를 옮겼어요. 다음 기록은 옮기기 전 결과예요. ':'')+base+' 조준 점선은 '+(practice.guide?'보여요.':'숨겼어요.'));
 }
 function setPracticeTarget(target){
  if(!canMoveBasket())return;target=Math.max(170,Math.min(350,Math.round(target)));const changed=target!==practice.target;practice.target=target;drawPracticeTarget(target);
  if(changed)feedback('바구니를 옮겼어. 다시 던져 봐!');
 }
 function endBasketDrag(commit){
  const d=basketDrag;if(!d)return;basketDrag=null;d.grip.parentElement?.classList.remove('moving-basket');for(const [el,disabled]of d.controls)if(el.isConnected)el.disabled=disabled;
  if(commit&&canMoveBasket())setPracticeTarget(d.target);else if(practice&&d.grip.isConnected)drawPracticeTarget(practice.target);
  try{if(d.grip.hasPointerCapture(d.id))d.grip.releasePointerCapture(d.id)}catch{}
 }
 function moveBasketDrag(e){
  const d=basketDrag;if(!d||d.id!==e.pointerId)return;if(!canMoveBasket()||!d.grip.isConnected){endBasketDrag(false);return}
  if(Math.abs(e.clientX-d.x)<6&&!d.moved)return;d.moved=true;d.target=Math.max(170,Math.min(350,Math.round(d.original+(e.clientX-d.x)/d.scale)));drawPracticeTarget(d.target);
 }
 dialog.addEventListener('pointerdown',e=>{
  const grip=e.target.closest('.trio-basket-grip');if(!grip||grip.disabled||!content().contains(grip)||!canMoveBasket()||basketDrag||e.button!==0||e.isPrimary===false)return;
  const rect=dialog.querySelector('.trio-court').getBoundingClientRect();basketDrag={id:e.pointerId,grip,x:e.clientX,scale:rect.width/480,rect,original:practice.target,target:practice.target,moved:false,controls:[...content().querySelectorAll('button,input')].filter(el=>el!==grip).map(el=>[el,el.disabled])};for(const [el]of basketDrag.controls)el.disabled=true;grip.setPointerCapture(e.pointerId);grip.parentElement.classList.add('moving-basket');grip.focus({preventScroll:true});
 });
 dialog.addEventListener('pointermove',moveBasketDrag);
 dialog.addEventListener('pointerup',e=>{const d=basketDrag;if(!d||d.id!==e.pointerId)return;moveBasketDrag(e);const inside=e.clientX>=d.rect.left&&e.clientX<=d.rect.right&&e.clientY>=d.rect.top&&e.clientY<=d.rect.bottom;endBasketDrag(d.moved&&inside&&canMoveBasket())});
 for(const name of ['pointercancel','lostpointercapture'])dialog.addEventListener(name,e=>{if(basketDrag?.id===e.pointerId)endBasketDrag(false)});
 for(const name of ['blur','resize'])doc.defaultView.addEventListener(name,()=>endBasketDrag(false));
 dialog.addEventListener('scroll',()=>endBasketDrag(false));
 dialog.addEventListener('input',e=>{if(e.target.matches('[data-practice-distance]')&&content().contains(e.target)&&!e.target.disabled&&!basketDrag&&canMoveBasket())setPracticeTarget(Number(e.target.value))});

 const canAim=()=>valid()&&active==='duri'&&!frame&&(mode==='practice-shot'?practice&&!practice.done:mode==='shot'?state.duri.phase===1:mode==='link-shot'&&state.link.step===2);
 function setAim(angle,power){dialog.querySelector('[data-shot=angle]').value=angle;dialog.querySelector('[data-shot=power]').value=power;trajectory()}
 function endAimDrag(commit){
  const d=aimDrag;if(!d)return;aimDrag=null;d.grip.parentElement?.classList.remove('aiming');
  if(!commit&&d.grip.isConnected&&canAim())setAim(d.angle,d.power);
  if(d.grip.hasPointerCapture(d.id))d.grip.releasePointerCapture(d.id);
 }
 function moveAimDrag(e){
  const d=aimDrag;if(!d||e.pointerId!==d.id)return;
  if(!canAim()||!d.grip.isConnected){endAimDrag(false);return}
  const dx=e.clientX-d.x,dy=d.y-e.clientY;
  if(Math.hypot(dx,dy)<6&&!d.moved)return;
  d.moved=true;
  if(dx<=0||dy<=0){setAim(d.angle,d.power);d.changed=false;return}
  const angle=Math.max(30,Math.min(70,Math.round(Math.atan2(dy,dx)*180/Math.PI)));
  const power=Math.max(35,Math.min(65,Math.round(Math.hypot(dx,dy)/d.scale/2)));
  setAim(angle,power);d.changed=true;
 }
 dialog.addEventListener('pointerdown',e=>{
  const grip=e.target.closest('.trio-aim-grip');if(!grip||grip.disabled||!canAim()||aimDrag||basketDrag||e.button!==0||e.isPrimary===false)return;
  const rect=dialog.querySelector('.trio-court').getBoundingClientRect();
  aimDrag={id:e.pointerId,grip,x:e.clientX,y:e.clientY,scale:rect.width/480,rect,angle:Number(dialog.querySelector('[data-shot=angle]').value),power:Number(dialog.querySelector('[data-shot=power]').value),moved:false,changed:false};
  grip.setPointerCapture(e.pointerId);grip.parentElement.classList.add('aiming');grip.focus({preventScroll:true});
 });
 dialog.addEventListener('pointermove',e=>{if(aimDrag?.id===e.pointerId){moveAimDrag(e)}});
 dialog.addEventListener('pointerup',e=>{
  const d=aimDrag;if(!d||e.pointerId!==d.id)return;moveAimDrag(e);
  const inside=e.clientX>=d.rect.left&&e.clientX<=d.rect.right&&e.clientY>=d.rect.top&&e.clientY<=d.rect.bottom;
  const keep=canAim()&&d.changed&&inside;endAimDrag(keep);
  if(canAim()&&d.moved)feedback(practice?(keep?(practice.guide?'조준했어! 이제 공을 던져 봐.':'조준했어! 점선 없이 던져 봐.'):'조준은 그대로야. 다시 끌어 봐.'):(keep?'조준했어! 점선은 다음 공, 실선과 ×는 방금 공이야.':'조준을 바꾸지 않았어. 공에서 오른쪽 위로 끌어 봐!'));
 });
 for(const name of ['pointercancel','lostpointercapture'])dialog.addEventListener(name,e=>{if(aimDrag?.id===e.pointerId)endAimDrag(false)});
 for(const name of ['blur','resize'])doc.defaultView.addEventListener(name,()=>endAimDrag(false));
 dialog.addEventListener('input',e=>{if(canAim()&&!basketDrag&&content().contains(e.target)&&e.target.matches('[data-shot]')){const value=e.target.value;endAimDrag(false);e.target.value=value;trajectory()}});


 const canPickBook=()=>valid()&&active==='tori'&&mode==='books'&&opening.kind==='trio-books'&&state.tori.phase===1&&state.tori.clues===3;
 function chooseBook(b){if(!canPickBook()||!content().contains(b))return;const r=state.tori;const picked=Number(b.dataset.book),target=r.round%6;if(!Number.isInteger(picked)||picked<0||picked>5)return;if(picked===target)complete();else{const colorSame=bookColor(picked)===bookColor(target),motifSame=bookMotif(picked,r.round)===bookMotif(target,r.round),reason=colorSame?'무늬 다름':motifSame?'색 다름':'둘 다 다름';feedback(colorSame?'표지 색은 맞아! '+MOTIFS[bookMotif(target,r.round)]+' 무늬를 다시 찾아보자.':motifSame?'무늬는 맞아! '+COLORS[bookColor(target)]+' 표지를 다시 찾아보자.':'색과 무늬가 둘 다 달라. 모은 두 단서와 다시 맞춰 보자.');b.classList.add('trio-wrong');let check=b.querySelector('.trio-book-check');if(!check){check=doc.createElement('span');check.className='trio-book-check';b.append(check)}check.textContent=reason;b.setAttribute('aria-label',COLORS[bookColor(picked)]+' 표지, '+MOTIFS[bookMotif(picked,r.round)]+' 무늬 · '+reason+' · 다시 살펴보기')}}
 function clearBookDrag(){const d=bookDrag;if(!d)return null;bookDrag=null;d.ghost?.remove();d.el.classList.remove('is-lifted');dialog.querySelectorAll('[data-book-drop],[data-shelf-drop]').forEach(el=>el.classList.remove('is-book-target'));dialog.classList.remove('is-dragging-book');try{if(d.el.hasPointerCapture(d.id))d.el.releasePointerCapture(d.id)}catch{}return d}
 function blockBookClick(d){bookClick={id:d.id,until:performance.now()+800}}
 function cancelBookDrag(){const d=clearBookDrag();if(d)blockBookClick(d)}
 function canDragBook(d){return content()?.contains(d.el)&&(d.shelf?canDisplayShelf()&&collectedBooks(state.tori)[d.book]>0:canPickBook()&&d.round===state.tori.round)}
 function bookDropAt(e){return !!doc.elementFromPoint(e.clientX,e.clientY)?.closest('#npcTrio '+(bookDrag?.shelf?'[data-shelf-drop]':'[data-book-drop]'))}
 dialog.addEventListener('pointerdown',e=>{
  if(bookDrag)return;bookClick=null;const b=e.target.closest('[data-book],[data-shelf-book]'),shelf=mode==='shelf';if(!b||!e.isPrimary||e.button!==0||!content().contains(b))return;
  const i=Number(shelf?b.dataset.shelfBook:b.dataset.book);if(shelf?b.dataset.shelfBook==null||!canDisplayShelf()||!Number.isInteger(i)||i<0||i>5||!collectedBooks(state.tori)[i]:b.dataset.book==null||!canPickBook())return;
  bookDrag={id:e.pointerId,el:b,x:e.clientX,y:e.clientY,round:state.tori.round,shelf,book:i,active:false};try{b.setPointerCapture(e.pointerId)}catch{bookDrag=null}
 });
 dialog.addEventListener('pointermove',e=>{const d=bookDrag;if(!d||d.id!==e.pointerId)return;if(!canDragBook(d)){close();return}if(!d.active&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<8)return;
  if(!d.active){d.active=true;dialog.classList.add('is-dragging-book');d.el.classList.add('is-lifted');d.ghost=doc.createElement('span');d.ghost.className='trio-book-ghost';d.ghost.setAttribute('aria-hidden','true');d.ghost.append(d.el.querySelector('.trio-book').cloneNode(true));dialog.append(d.ghost)}
  d.ghost.style.left=e.clientX+'px';d.ghost.style.top=e.clientY+'px';dialog.querySelector(d.shelf?'[data-shelf-drop]':'[data-book-drop]').classList.toggle('is-book-target',bookDropAt(e));
 });
 dialog.addEventListener('pointerup',e=>{const d=bookDrag;if(!d||d.id!==e.pointerId)return;if(!canDragBook(d)){close();return}const drop=bookDropAt(e);clearBookDrag();if(!d.active)return;blockBookClick(d);if(drop){if(d.shelf)placeShelfBook(d.book);else chooseBook(d.el)}else feedback(d.shelf?'진열은 그대로야. 앞자리로 다시 옮겨 봐!':'책을 수레에 그대로 두었어. 다시 골라 봐!');if(dialog.open)d.el.focus({preventScroll:true})});
 for(const type of ['pointercancel','lostpointercapture'])dialog.addEventListener(type,e=>{if(bookDrag?.id===e.pointerId)cancelBookDrag()});
 for(const type of ['blur','resize'])doc.defaultView.addEventListener(type,cancelBookDrag);
 dialog.addEventListener('scroll',cancelBookDrag);
 dialog.addEventListener('click',e=>{if(bookClick&&performance.now()<bookClick.until&&e.detail!==0&&(e.pointerId===bookClick.id||e.pointerId==null)){bookClick=null;e.preventDefault();e.stopImmediatePropagation()}},true);


 // One temporary step survives the normal automatic map return, within this garden visit only.
 function validFestivalUndo(){return festivalUndo&&festivalUndo.owner===owner&&festivalUndo.token===token&&c.getScene()==='garden'&&state.link.wins>0&&state.link.decor===festivalUndo.applied}
 function festivalUndoControl(){const b=dialog.querySelector('[data-trio=festival-undo]');if(b)b.hidden=!validFestivalUndo()}
 function undoFestival(){
  if(!canHangFestival()||!validFestivalUndo())return;
  const previous=festivalUndo.decor;festivalUndo=null;state.link.decor=previous;save();festivalUndoControl();
  feedback(FESTIVAL_NAMES[previous]+' 장식으로 되돌렸어.'+(saveError?' 저장은 다시 시도해 줘.':''));
  dialog.querySelector('[data-festival-style="'+festivalDraft+'"]').focus({preventScroll:true});
 }
 const canHangFestival=()=>valid()&&active==='garden'&&mode==='festival'&&state.link.wins>0;
 function hangFestival(choice,drag=false){
  if(!canHangFestival()||!Number.isInteger(choice)||choice<0||choice>=FESTIVAL_NAMES.length)return;
  if(state.link.decor===choice){if(drag)feedback('이미 걸린 모양이야. 다른 장식도 걸어 봐!');else{close();doc.getElementById('campusTitle').focus({preventScroll:true})}return}
  festivalUndo={owner,token,decor:state.link.decor,applied:choice};festivalDraft=choice;previewFestival();state.link.decor=choice;save();festivalUndoControl();
  if(saveError)feedback('장식은 걸었어. 저장하지 못했으니 다시 저장해 줘.');else{close();doc.getElementById('campusTitle').focus({preventScroll:true})}
 }
 function endFestivalDrag(){const d=festivalDrag;if(!d)return null;festivalDrag=null;d.ghost?.remove();d.el.classList.remove('is-lifted');dialog.querySelector('[data-festival-drop]')?.classList.remove('is-festival-target');dialog.classList.remove('is-dragging-festival');festivalClick={id:d.id,until:performance.now()+800};try{if(d.el.hasPointerCapture(d.id))d.el.releasePointerCapture(d.id)}catch{}return d}
 const festivalDropAt=e=>!!doc.elementFromPoint(e.clientX,e.clientY)?.closest('#npcTrio [data-festival-drop]');
 dialog.addEventListener('pointerdown',e=>{
  if(festivalDrag)return;festivalClick=null;const b=e.target.closest('[data-festival-style]');if(!b||!e.isPrimary||e.button!==0||!content()?.contains(b)||!canHangFestival())return;
  const choice=Number(b.dataset.festivalStyle);if(!Number.isInteger(choice)||choice<0||choice>=FESTIVAL_NAMES.length)return;
  festivalDrag={id:e.pointerId,el:b,choice,x:e.clientX,y:e.clientY,active:false};try{b.setPointerCapture(e.pointerId)}catch{festivalDrag=null}
 });
 dialog.addEventListener('pointermove',e=>{const d=festivalDrag;if(!d||d.id!==e.pointerId)return;if(!canHangFestival()||!content().contains(d.el)){close();return}if(!d.active&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<8)return;
  if(!d.active){d.active=true;dialog.classList.add('is-dragging-festival');d.el.classList.add('is-lifted');d.ghost=doc.createElement('span');d.ghost.className='trio-festival-ghost';d.ghost.setAttribute('aria-hidden','true');d.ghost.innerHTML=festivalArt(d.choice);dialog.append(d.ghost)}
  d.ghost.style.left=e.clientX+'px';d.ghost.style.top=e.clientY+'px';dialog.querySelector('[data-festival-drop]').classList.toggle('is-festival-target',festivalDropAt(e));
 });
 dialog.addEventListener('pointerup',e=>{const d=festivalDrag;if(!d||d.id!==e.pointerId)return;if(!canHangFestival()||!content().contains(d.el)){close();return}const drop=festivalDropAt(e);endFestivalDrag();if(!d.active){festivalClick=null;return}if(drop)hangFestival(d.choice,true);else feedback('걸린 장식은 그대로야. 리본으로 다시 옮겨 봐!');if(dialog.open)d.el.focus({preventScroll:true})});
 for(const type of ['pointercancel','lostpointercapture'])dialog.addEventListener(type,e=>{if(festivalDrag?.id===e.pointerId)endFestivalDrag()});
 for(const type of ['blur','resize'])doc.defaultView.addEventListener(type,endFestivalDrag);
 dialog.addEventListener('scroll',endFestivalDrag);
 dialog.addEventListener('click',e=>{if(festivalClick&&performance.now()<festivalClick.until&&e.detail!==0&&(e.pointerId===festivalClick.id||e.pointerId==null)){festivalClick=null;e.preventDefault();e.stopImmediatePropagation()}},true);

 dialog.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.trio==='close'){close();return}if(!valid()){close();sync();return}if(bookDrag||basketDrag||festivalDrag||pipeDrag)return;
  const r=state[active],l=state.link,action=b.dataset.trio;
  if(action==='save'){save();dialog.querySelector('.trio-storage').textContent=saveError?'아직 저장하지 못했어요.':'이 기기에 저장했어요.';b.hidden=!saveError;return}
  if(action==='replay-shot'){replayShot(b);return}
  if(shotReplay)stopShotReplay();
  if(mode==='shelf'){
   if(b.dataset.shelfBook!=null){const i=Number(b.dataset.shelfBook),books=collectedBooks(state.tori);if(Number.isInteger(i)&&i>=0&&i<6&&books[i]){shelfDraft=i;dialog.querySelectorAll('[data-shelf-book]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));shelfControls();feedback('토리: '+returnedName(i)+', 네가 찾아줬지! '+books[i]+'권 모두 잘 간직하고 있어.')}return}
   if(action==='shelf-display'){placeShelfBook(shelfDraft);return}
   if(action==='shelf-undo'){undoShelf();return}
   if(action==='shelf-latest'&&displayBook(state.tori)!=null){shelfUndo={book:displayBook(state.tori)};delete state.tori.displayBook;save();shelfControls();dialog.querySelector('[data-shelf-book]').focus({preventScroll:true});feedback('토리: 가장 최근에 돌려준 책을 앞에 세울게!');return}
   return
  }
  if(action==='practice-guide'&&mode==='practice-shot'&&canAim()&&!aimDrag&&content().contains(b)){practice.guide=!practice.guide;drawPracticeGuide();return}
  if(active==='duri'&&!frame&&!aimDrag){
   if(action==='practice-menu'&&['talk','practice-shot'].includes(mode)&&state.duri.best.some(Boolean)){practiceMenu();return}
   if(b.dataset.practiceBasket!=null&&mode==='practice-menu'){const i=Number(b.dataset.practiceBasket);if(Number.isInteger(i)&&i>=0&&i<4&&state.duri.best[i]!=null)shot(false,i);return}
   if(action==='practice-again'&&mode==='practice-shot'&&practice?.done){const aim=lastShot;shot(false,practice.round,practice.target,practice.guide);if(aim){dialog.querySelector('[data-shot=angle]').value=aim.angle;dialog.querySelector('[data-shot=power]').value=aim.power;trajectory();dialog.querySelector('[data-shot-last]').hidden=true;feedback('방금 성공한 조준으로 또 던져 봐!')}return}
   if(action==='practice-back'&&mode==='practice-menu'){talk();return}
  }
  if(action==='legacy'){close();c.legacyTori();return}
  if(action==='flowerbed'&&active==='garden'){flowerbedTalk();return}
  if(action==='garden-other'&&active==='garden'){talk(false,true);return}
  if(action==='bed-go'&&active==='garden'){close();c.visitFlowerbed?.();return}
  if((action==='bed-accept'||action==='bed-finish')&&active==='garden'&&mode==='flowerbed'){if(c.flowerbedAct?.(action.slice(4))){if(action==='bed-accept'){close();c.visitFlowerbed?.()}else flowerbedTalk()}return}
  if(action==='festival'&&active==='garden'&&l.wins>0){festival();return}
  if(b.dataset.festivalStyle!=null&&mode==='festival'&&active==='garden'&&l.wins>0){const choice=Number(b.dataset.festivalStyle);if(!Number.isInteger(choice)||choice<0||choice>=FESTIVAL_NAMES.length)return;festivalDraft=choice;previewFestival();feedback(FESTIVAL_NAMES[choice]+' 모양을 골랐어. 마음에 들면 걸어 줘!');return}
  if(action==='festival-hang'){hangFestival(festivalDraft);return}
  if(action==='festival-undo'){undoFestival();return}
  if(action==='personal'){talk(true);return}
  if(action==='search'&&active==='tori'&&r.phase===1){search();return}
  if(action==='note'&&active==='tori'&&r.phase===1&&mode==='clue'){r.clues|=opening.kind==='trio-clue-color'?1:2;changed();close();doc.getElementById('campusTitle').focus({preventScroll:true});return}
  if(action==='link-start'&&active==='garden'&&r.wins>0&&(l.step===0||l.step===5)){if(l.step===5)l.round=(l.round+1)%999999;l.step=1;l.attempts=0;changed('trio-link');close();return}
  if(action==='link-flower'&&active==='duri'&&l.step===1){l.step=2;changed('trio-link');talk();return}
  if(action==='link-shot'&&active==='duri'&&l.step===2){shot(true);return}
  if(action==='link-take'&&active==='duri'&&l.step===3){l.step=4;changed('trio-link');close();return}
  if(action==='link-finish'&&active==='garden'&&l.step===4){l.step=5;l.wins=Math.min(999999,l.wins+1);changed('trio-link');talk();feedback('꽃과 리본으로 축제 준비 완성! 정원과 운동장에 장식이 남았어.');return}
  if(action==='link-route'){close();return}
  if(action==='accept'&&(r.phase===0||r.phase===3)){if(active==='tori'){r.returnedBooks=collectedBooks(r);if(knownReturn(r)!=null)r.returnedRound=knownReturn(r);}if(r.phase===3)r.round=(r.round+1)%999999;r.phase=1;if(active==='tori'){r.clues=0;const shift=nextToriSearchShift(r.round);if(shift)r.searchLayout={round:r.round,shift};else delete r.searchLayout;}if(active==='duri')r.attempts=0;if(active==='garden')delete r.pipeDraft;changed();play();return}
  if(action==='play'&&r.phase===1){play();return}
  if(action==='return'&&r.phase===2){if(active==='tori'){const books=collectedBooks(r);if(shelfTotal(books)<999999)books[r.round%6]++;r.returnedBooks=books;r.returnedRound=r.round;}r.phase=3;r.wins=Math.min(999999,r.wins+1);changed();talk();feedback(active==='tori'?'고마워! 작은 책장에 한 권 더 모았어.':'완성! 맵에 네가 해낸 흔적이 남았어. 다른 친구도 만나 봐!');return}
  if(mode==='practice-shot'?(!practice||practice.done):r.phase!==1&&!(active==='duri'&&mode==='link-shot'&&l.step===2))return;
  if(b.dataset.book!=null&&mode==='books'){chooseBook(b);return}
  if(b.dataset.tile!=null&&mode==='pipes'&&content().contains(b)){turnPipe(Number(b.dataset.tile));return}
  if(action==='pipe-undo'&&mode==='pipes'&&active==='garden'){undoPipeTurn();return}
  if(action==='water'&&mode==='pipes'){if(pipeFlow){stopPipeFlow(true);feedback('물을 멈췄어. 조각을 돌리거나 다시 흘려 봐!')}else runWater();return}
  if(action==='basket-grip'){if(e.detail===0&&canMoveBasket())dialog.querySelector('[data-practice-distance]').focus({preventScroll:!matchMedia('(min-width: 560px) and (max-height: 520px)').matches});return}
  if(action==='basket-reset'&&canMoveBasket()){setPracticeTarget(215+practice.round*22);return}
  if(action==='aim-grip'){if(e.detail===0&&canAim()&&!aimDrag){dialog.querySelector('[data-shot=angle]').focus({preventScroll:true});feedback(practice?'각도와 힘을 바꿔 던져 봐!':'각도와 힘 막대를 방향키로 조절하고 공 던지기를 눌러 줘!')}return}
  if(action==='recall-shot'&&canAim()&&!aimDrag&&lastShot){dialog.querySelector('[data-shot=angle]').value=lastShot.angle;dialog.querySelector('[data-shot=power]').value=lastShot.power;trajectory();feedback(practice?'방금 조준이야. 바꿔 던져 봐!':'방금 던진 각도와 힘이야. 여기서 조금씩 바꿔 봐!');return}
  if(action==='throw'&&canAim()&&!aimDrag){const challenge=shotRound();challenge.attempts=Math.min(999999,challenge.attempts+1);if(mode!=='practice-shot')save();drawRecord();const {landing,height,angle,power}=trajectory(),target=shotTarget(),ball=dialog.querySelector('.trio-projectile'),start=performance.now(),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?180:850;content().querySelectorAll('button,input').forEach(el=>el.disabled=true);
   function tick(now){if(!valid()){frame=0;close();return}const t=Math.min(1,(now-start)/duration);ball.setAttribute('cx',30+(landing-30)*t);ball.setAttribute('cy',172-4*height*t*(1-t));if(t<1){frame=requestAnimationFrame(tick);return}frame=0;showShotResult({landing,height,angle,power,target});if(Math.abs(landing-target)<=18)complete();else{content().querySelectorAll('button,input').forEach(el=>el.disabled=false);feedback(practice?(landing<target?'조금 짧아! 힘을 높여 봐.':'조금 멀어! 힘을 낮춰 봐.'):(landing<target?'조금 짧아! 힘을 높여 봐.':'조금 멀어! 힘을 낮춰 봐.'))}}frame=requestAnimationFrame(tick);
  }
 });
 dialog.addEventListener('close',cancel);dialog.addEventListener('cancel',cancel);
 function visible(kind){activate();return !TRIO_SEARCH_PLACES.some(p=>p.kind===kind)||state.tori.phase===1}
 function syncHeld(){
  const player=doc.getElementById('hubPlayer');if(!player)return;
  const t=state.tori,l=state.link,items=[['book',t.phase===2,bookArt(t.round%6,t.round),'토리에게 가져갈 책'],['parcel',l.step===1||l.step===4,l.step===4?RIBBON:FLOWER,l.step===4?'새싹에게 전할 리본':'두리에게 전할 꽃']];
  for(const [name,show,art,label]of items){let el=player.querySelector('.trio-held-'+name);if(!el&&show){el=doc.createElement('span');el.className='trio-held trio-held-'+name;el.setAttribute('role','img');player.append(el)}if(!el)continue;if(el.hidden===show)el.hidden=!show;const signature=name==='book'?String(t.round):String(l.step);if(show&&el.dataset.art!==signature){el.dataset.art=signature;el.innerHTML=art;el.setAttribute('aria-label',label)}}
 }
 function sync(){activate();if(c.getScene()!=='garden')festivalUndo=null;if(dialog.open&&!valid())close();syncHeld();
  const shelf=c.objects.querySelector('[data-place="trio-shelf"]');if(shelf){const r=state.tori,books=collectedBooks(r),total=shelfTotal(books),round=knownReturn(r),chosen=displayBook(r),front=chosen??round,signature=JSON.stringify([books,round,r.wins,chosen]);if(shelf.dataset.collection!==signature){shelf.dataset.collection=signature;shelf.dataset.bookCount=String(total);shelf.querySelector('.campus-object-caption').textContent='토리의 작은 책장'+(total?' · '+total+'권':'');shelf.setAttribute('aria-label','토리의 작은 책장 · 표지를 기억하는 책 '+total+'권 · 가까이서 ↑사용');const copies=[];books.forEach((n,i)=>{for(let k=0,limit=Math.min(n,12-copies.length);k<limit;k++)copies.push(i)});if(front!=null){const last=copies.indexOf(front%6);if(last>=0)copies.splice(last,1);else copies.pop()}shelf.querySelector('.trio-shelf-books').innerHTML=copies.slice(0,11).map((i,n)=>'<i class="color-'+bookColor(i)+'" style="left:'+(n<5?42+n*8:18+(n-5)*10)+'px;top:'+(n<5?29:65)+'px"></i>').join('');let last=shelf.querySelector('.trio-returned-book');if(r.wins){if(!last){last=doc.createElement('span');last.className='trio-returned-book';last.setAttribute('role','img');shelf.append(last)}last.dataset.returned=round==null?'unknown':String(round);last.dataset.displayBook=chosen==null?'':String(chosen);last.innerHTML=returnedArt(front);last.setAttribute('aria-label',chosen!=null?'앞에 세운 '+returnedName(chosen)+' · 토리에게 돌려준 책':round==null?'전에 돌려준 책 · 표지 기록 없음':'토리에게 돌려준 '+returnedName(round))}else last?.remove()}}

  for(const p of toriSearchPlaces(state.tori)){const b=c.objects.querySelector('[data-place="'+p.kind+'"]');if(!b)continue;b.style.left=p.x+'%';b.dataset.walkX=p.x;const caption=b.querySelector('.campus-object-caption b');if(caption&&caption.textContent!==p.label)caption.textContent=p.label;const hide=state.tori.phase!==1;if(b.hidden!==hide)b.hidden=hide;const noted=p.kind==='trio-clue-color'?!!(state.tori.clues&1):p.kind==='trio-clue-motif'?!!(state.tori.clues&2):false;b.classList.toggle('trio-clue-noted',noted);b.setAttribute('aria-label',p.label+' · '+(noted?(p.kind==='trio-clue-color'?COLORS[bookColor(state.tori.round%6)]+' 표지':MOTIFS[bookMotif(state.tori.round%6,state.tori.round)]+' 무늬')+' 기록함':'살펴보기'));const prop=b.querySelector('.trio-clue-prop');if(prop){const color=p.kind==='trio-clue-color',target=state.tori.round%6,signature=noted?String(state.tori.round):'unknown';if(prop.dataset.discovery!==signature){prop.dataset.discovery=signature;prop.innerHTML=noted?(color?'<span class="trio-color-swatch color-'+bookColor(target)+'"></span>':glyph(bookMotif(target,state.tori.round))):color?'<i></i><i></i><i></i>':glyph(1);}}}
  for(const id of Object.keys(META)){const kind=id==='tori'?'tori':'trio-'+id,b=c.objects.querySelector('[data-place="'+kind+'"]');if(!b)continue;const r=state[id];b.dataset.trioPhase=String(r.phase);b.dataset.trioWins=String(r.wins);let badge=b.querySelector('.trio-world-result');if(id!=='tori'&&r.wins&&!badge){badge=doc.createElement('span');badge.className='trio-world-result';badge.setAttribute('role','img');badge.setAttribute('aria-label',id==='tori'?'복원한 책':id==='garden'?'함께 피운 꽃':'성공 깃발');badge.textContent=id==='tori'?'📚':id==='garden'?'🌼🌷🌼':'⚑';b.append(badge)}else if(id==='tori'||!r.wins)badge?.remove();const mark=b.querySelector('.trio-mark');if(mark)mark.textContent=r.phase===2?'✓':r.phase===1?'…':'!';
   if(id==='duri'){let flags=b.querySelector('.trio-record-flags');if(r.best.some(Boolean)){if(!flags){flags=doc.createElement('span');flags.className='trio-record-flags';flags.setAttribute('role','img');b.append(flags)}const signature=JSON.stringify(r.best);if(flags.dataset.record!==signature){flags.dataset.record=signature;flags.setAttribute('aria-label','내 바구니 기록: '+r.best.map((n,i)=>(i+1)+'번 '+(n==null?'아직 없음':n+'번에 성공')).join(', '));flags.innerHTML=r.best.map((n,i)=>'<span class="'+(n==null?'empty':'earned')+'" aria-hidden="true">'+(i+1)+'</span>').join('')}}else flags?.remove()}
   if(id!=='tori'){const l=state.link,show=id==='duri'?(l.step>=2||l.wins>0):l.wins>0;let decoration=b.querySelector('.trio-link-result');if(show&&!decoration){decoration=doc.createElement('span');decoration.className='trio-link-result';decoration.setAttribute('role','img');decoration.setAttribute('aria-label',id==='duri'?'새싹이 보낸 꽃':'두리의 리본으로 꾸민 꽃');decoration.innerHTML=FLOWER+(id==='garden'?RIBBON:'');b.append(decoration)}else if(!show)decoration?.remove()}
  }
  let bunting=c.stage.querySelector('.trio-festival');const festive=state.link.wins>0&&['garden','playground'].includes(c.getScene());if(festive&&!bunting){bunting=doc.createElement('span');bunting.className='trio-festival';bunting.setAttribute('role','img');c.stage.append(bunting)}else if(!festive)bunting?.remove();if(festive&&bunting.dataset.decor!==String(state.link.decor)){bunting.dataset.decor=String(state.link.decor);bunting.setAttribute('aria-label','새싹과 두리와 함께 완성한 꽃 축제 · '+FESTIVAL_NAMES[state.link.decor]);bunting.innerHTML=festivalArt(state.link.decor).repeat(2)}
 }
 const observer=new MutationObserver(()=>{if(c.getScene()!=='garden'||c.hub.classList.contains('hidden'))festivalUndo=null;if(c.hub.classList.contains('hidden'))close()});observer.observe(c.hub,{attributes:true,attributeFilter:['class','data-scene']});
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden)close()});doc.addEventListener('student-dashboard-updated',sync);new MutationObserver(sync).observe(doc.getElementById('hubPlayer'),{childList:true});
 return {pipeKey,searchPlace(p){if(!TRIO_SEARCH_PLACES.some(x=>x.kind===p.kind))return p;activate();return toriSearchPlaces(state.tori).find(x=>x.kind===p.kind)},signs(){activate();const a=r=>r.phase===2?'ready':r.phase===1?'active':'available',l=state.link;return {tori:a(state.tori),'trio-garden':state.garden.phase===2||l.step===4?'ready':l.step>=1&&l.step<=3?'active':a(state.garden),'trio-duri':state.duri.phase===2||l.step===1||l.step===3?'ready':l.step===2?'active':a(state.duri)}},sync,visible,interact(kind){const prop=TRIO_SEARCH_PLACES.some(p=>p.kind===kind),id=kind==='tori'||kind==='trio-shelf'||prop?'tori':kind==='trio-garden'?'garden':kind==='trio-duri'?'duri':null;if(!id)return false;sync();if(prop&&!visible(kind))return true;if(c.walk.nearby()?.kind!==kind)return true;if(kind==='trio-shelf')inspectShelf();else if(prop)inspectSearch(kind);else launch(id);return true},requests(){activate();return [...Object.keys(META).map(id=>({id:'trio-'+id,title:META[id].name+' · '+META[id].title,loaded:true,active:state[id].phase===1||state[id].phase===2,text:id==='tori'?toriGoal():state[id].phase===2?META[id].name+'에게 돌아가 완성해요.':META[id].task,error:saveError?'이 기기에 놀이 기록을 저장하지 못했어요.':null,retry:save})),{id:'trio-link',title:'새싹과 두리 · 꽃 축제 준비',loaded:true,active:state.link.step>=1&&state.link.step<=4,text:['','꽃을 두리에게 · 정원 → 연못 → 운동장','운동장 · 두리의 축제 바구니에 공 넣기','운동장 · 두리에게 돌아가 리본 받기','리본을 새싹에게 · 운동장 → 연못 → 정원'][state.link.step]||'꽃 축제 준비 완성!',error:saveError&&state.link.step>0?'이 기기에 놀이 기록을 저장하지 못했어요.':null,retry:save}]}};
}
