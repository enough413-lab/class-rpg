// Personal play mastery only: no school economy, database or earned-record writes.
const META={tori:{name:'토리',room:'library',image:'tori-v1.webp',title:'뒤섞인 책 표지',task:'단서 두 개로 책 표지를 찾아 줘!',done:'책 표지가 제자리를 찾았어!'},garden:{name:'새싹',room:'garden',image:'saessak-v1.webp',title:'꽃밭으로 물길 잇기',task:'구부러진 물길을 돌려 꽃까지 이어 줘!',done:'네가 이은 물길로 꽃이 피었어!'},duri:{name:'두리',room:'playground',image:'duri-v1.webp',title:'바람뜰 공 던지기',task:'각도와 힘을 바꿔 바구니에 공을 넣어 봐!',done:'멋진 골! 네 깃발을 운동장에 달았어!'}};
const PATHS=[[0,1,4,7,8,5,2],[3,0,1,2,5],[6,7,4,1,2,5,8]];
const ports=tile=>tile.shape==='line'?[tile.turn%2,(tile.turn%2)+2]:[tile.turn,(tile.turn+1)%4];
export function pipePuzzle(round){
 const path=PATHS[round%3],solution=Array.from({length:9},(_,i)=>({shape:i%2?'line':'bend',turn:(i+round)%4}));
 const side=(a,b)=>b===a-3?0:b===a+1?1:b===a+3?2:3;
 path.forEach((cell,i)=>{const pair=[i?side(cell,path[i-1]):3,i<path.length-1?side(cell,path[i+1]):1];const straight=Math.abs(pair[0]-pair[1])===2;solution[cell]={shape:straight?'line':'bend',turn:straight?pair[0]%2:([0,1,2,3].find(t=>pair.includes(t)&&pair.includes((t+1)%4)))}});
 return {start:Math.floor(path[0]/3),end:Math.floor(path.at(-1)/3),solution,tiles:solution.map((t,i)=>({...t,turn:(t.turn+1+(i%2))%4}))};
}
export function traceWater(tiles,start,end){
 let cell=start*3,incoming=3;const visited=[];
 for(let n=0;n<10;n++){if(visited.includes(cell))return {ok:false,visited};visited.push(cell);const p=ports(tiles[cell]);if(!p.includes(incoming))return {ok:false,visited};const out=p.find(s=>s!==incoming),row=Math.floor(cell/3),col=cell%3;
  if(out===1&&col===2)return {ok:row===end,visited};if(out===3&&col===0||out===0&&row===0||out===2&&row===2)return {ok:false,visited};cell+=[-3,1,3,-1][out];incoming=(out+2)%4;
 }return {ok:false,visited};
}
export const shotLanding=(angle,power)=>30+power*power*Math.sin(2*angle*Math.PI/180)/10;
export function decorateTrioObject(b,p){
 const id=p.kind==='trio-garden'?'garden':p.kind==='trio-duri'?'duri':null;if(!id)return false;
 b.classList.add('campus-npc','trio-resident');b.dataset.standBeside='true';b.dataset.cameraPair='true';b.dataset.walkX=p.x;b.setAttribute('aria-label',META[id].name+' · 말 걸기');
 b.innerHTML='<img alt="" width="110" height="160" src="maps/npcs/'+META[id].image+'"><span class="trio-name">'+META[id].name+'</span><span class="trio-mark" aria-hidden="true">!</span>';
 b.querySelector('img').onerror=e=>{e.target.hidden=true;b.classList.add('trio-art-failed')};return true;
}
export function installNpcTrio(c){
 const doc=c.hub.ownerDocument,dialog=doc.createElement('dialog');dialog.id='npcTrio';dialog.className='trio-dialog';dialog.setAttribute('aria-labelledby','trioTitle');doc.body.append(dialog);
 const records=new Map(),blank=()=>Object.fromEntries(Object.keys(META).map(id=>[id,{phase:0,round:0,wins:0}]));
 let owner=null,token=null,state=blank(),saveError=false,loaded=false,active=null,opening=null,frame=0,board=null,mode='talk',focusBack=null;
 const key=id=>'classRpgNpcTrio_v1_'+id;
 function cancel(){cancelAnimationFrame(frame);frame=0}
 function close(){cancel();if(dialog.open)dialog.close();if(focusBack?.isConnected&&!c.hub.classList.contains('hidden'))focusBack.focus({preventScroll:true})}
 function activate(){const id=c.getStudent()?.id,t=c.getToken();if(id===owner&&t===token&&loaded)return;close();owner=id;token=t;loaded=true;saveError=false;state=blank();
  if(records.has(id)){({state,saveError}=records.get(id));return}
  if(id!=null)try{const s=JSON.parse(localStorage.getItem(key(id))||'null');if(s?.v===1)for(const name of Object.keys(META)){const r=s[name];if(r&&[r.phase,r.round,r.wins].every(Number.isInteger)&&r.phase>=0&&r.phase<=3&&r.round>=0&&r.round<=999999&&r.wins>=0&&r.wins<=999999)state[name]={phase:r.phase,round:r.round,wins:r.wins}}}catch{saveError=true}
  records.set(id,{state,saveError});
 }
 function save(){try{localStorage.setItem(key(owner),JSON.stringify({v:1,...state}));saveError=false}catch{saveError=true}records.set(owner,{state,saveError});sync();c.refresh();}
 const valid=()=>dialog.open&&opening?.id===c.getStudent()?.id&&opening?.token===c.getToken()&&opening?.room===c.getScene()&&!c.hub.classList.contains('hidden')&&!doc.hidden;
 function changed(){save();c.focusGoal?.('trio-'+active)}
 function shell(){const m=META[active];dialog.innerHTML='<header><h2 id="trioTitle">'+m.name+' · '+m.title+'</h2><button type="button" data-trio="close" aria-label="놀이 닫기">닫기</button></header><div class="trio-content"></div><p class="trio-feedback" role="status" aria-live="polite"></p><footer>놀이 기록은 이 기기·이 학생에게 저장돼요. 학교 경험치·골드는 그대로예요.<button type="button" data-trio="save" '+(saveError?'':'hidden')+'>저장 다시 시도</button><span class="trio-storage" role="status">'+(saveError?'저장하지 못했어요. 지금은 이어 놀 수 있어요.':'')+'</span></footer>'}
 const content=()=>dialog.querySelector('.trio-content');
 function feedback(text){dialog.querySelector('.trio-feedback').textContent=text}
 function talk(){mode='talk';shell();const m=META[active],r=state[active];content().innerHTML='<div class="trio-conversation"><img alt="" src="maps/npcs/'+m.image+'"><p>'+(r.phase===2?m.done:r.phase===1?'돌아왔구나! '+m.task:r.phase===3?'또 놀러 왔구나! 이번에는 조금 다른 도전이야.':m.task)+'</p></div><div class="trio-choices"><button type="button" data-trio="'+(r.phase===2?'return':r.phase===1?'play':'accept')+'">'+(r.phase===2?'함께 완성하기':r.phase===1?'계속 도전하기':r.phase===3?'다른 도전 받기':'좋아, 해 볼게!')+'</button>'+(active==='tori'?'<button type="button" data-trio="legacy">책 이야기와 예전 부탁</button>':'<button type="button" data-trio="close">조금 더 둘러볼게</button>')+'</div>';
  const im=content().querySelector('img');im.onerror=()=>im.hidden=true;
 }
 function launch(id){activate();active=id;opening={id:owner,token,room:c.getScene()};focusBack=doc.activeElement;c.stop();c.walk.stop();talk();if(!dialog.open)dialog.showModal()}
 function bookGame(){
  const r=state.tori,colors=['초록','파랑','분홍'],motifs=['달','잎','별'],round=r.round,target=round%6;mode='books';shell();
  const order=[0,1,2,3,4,5].map(i=>(i+round)%6),color=i=>Math.floor(i/2),motif=i=>(Math.floor(i/2)+i%2+round)%3;const goalColor=colors[color(target)],goalMotif=motifs[motif(target)],glyph=n=>'<svg viewBox="0 0 60 60" width="52" height="52" aria-hidden="true"><path fill="#fff8d3" d="'+['M40 8C12 3 3 43 32 52C17 38 20 19 40 8Z','M48 10C14 7 7 24 15 42C34 49 51 33 48 10ZM12 48L39 20','M30 5L37 22L55 30L37 37L30 55L23 37L5 30L23 23Z'][n]+'" stroke="#fff8d3" stroke-width="3" stroke-linejoin="round"/></svg>';
  content().innerHTML='<p class="trio-clue">토리의 단서: <b>'+goalColor+' 표지</b>에 <b>'+goalMotif+' 무늬</b>가 있어!</p><div class="trio-books" role="group" aria-label="책 표지 고르기">'+order.map(i=>'<button type="button" data-book="'+i+'" aria-label="'+colors[color(i)]+' 표지, '+motifs[motif(i)]+' 무늬"><span class="trio-book color-'+color(i)+'"><span>' +glyph(motif(i))+'</span></span><span>'+colors[color(i)]+' · '+motifs[motif(i)]+'</span></button>').join('')+'</div>';
  feedback('단서 두 개가 모두 맞는 책을 골라 줘. 틀려도 다시 골라도 돼!');
 }
 function pipes(){mode='pipes';shell();board=pipePuzzle(state.garden.round);content().innerHTML='<p>조각을 누르면 돌아가요. 왼쪽 수도에서 오른쪽 꽃까지 이어 봐!</p><div class="trio-pipe-wrap"><span class="trio-source" style="grid-row:'+(board.start+1)+'" aria-label="수도">💧</span><div class="trio-pipes" role="group" aria-label="돌려서 잇는 아홉 물길"></div><span class="trio-flower" style="grid-row:'+(board.end+1)+'" aria-label="물을 기다리는 꽃">🌼</span></div><button type="button" data-trio="water">물 흘리기</button>';drawPipes();feedback('시간 제한은 없어. 물을 흘려서 어디까지 가는지 확인해 봐!')}
 function drawPipes(wet=[]){const container=dialog.querySelector('.trio-pipes'),focused=doc.activeElement?.dataset.tile;container.innerHTML=board.tiles.map((tile,i)=>{const p=ports(tile),ends=[[30,0],[60,30],[30,60],[0,30]],a=ends[p[0]],b=ends[p[1]];return '<button type="button" data-tile="'+i+'" aria-label="'+(Math.floor(i/3)+1)+'행 '+(i%3+1)+'열 물길 · '+p.map(s=>['위','오른쪽','아래','왼쪽'][s]).join('·')+'" class="'+(wet.includes(i)?'wet':'')+'"><svg viewBox="0 0 60 60" aria-hidden="true"><path d="M '+a.join(' ')+' L 30 30 L '+b.join(' ')+'"/></svg></button>'}).join('');if(focused!=null)container.querySelector('[data-tile="'+focused+'"]').focus({preventScroll:true})}
 function shot(){mode='shot';shell();const target=215+state.duri.round%4*22;content().innerHTML='<p>점선을 보고 각도와 힘을 조절한 뒤 던져 봐!</p><svg class="trio-court" viewBox="0 0 400 210" role="img" aria-label="왼쪽에서 오른쪽 바구니로 공 던지기"><path d="M0 180H400" stroke="#839c60" stroke-width="8"/><path d="M'+(target-18)+' 172h36l-5 24h-26z" fill="#c88e54" stroke="#795934" stroke-width="3"/><path class="trio-trajectory" fill="none" stroke="#447c8c" stroke-width="2" stroke-dasharray="4 5"/><circle class="trio-projectile" cx="30" cy="172" r="9" fill="#eab45c" stroke="#89632d" stroke-width="2"/></svg><div class="trio-shot-controls"><label>각도 <output data-angle>40°</output><input aria-label="던지는 각도" data-shot="angle" type="range" min="30" max="70" value="40"></label><label>힘 <output data-power>38</output><input aria-label="던지는 힘" data-shot="power" type="range" min="35" max="65" value="38"></label></div><button type="button" data-trio="throw">공 던지기</button>';trajectory();feedback('바구니를 향해 점선을 맞춰 봐. 몇 번이든 다시 던질 수 있어!')}
 function trajectory(){const angle=Number(dialog.querySelector('[data-shot=angle]').value),power=Number(dialog.querySelector('[data-shot=power]').value),landing=shotLanding(angle,power),height=Math.sin(angle*Math.PI/180)*power*1.5;dialog.querySelector('[data-angle]').textContent=angle+'°';dialog.querySelector('[data-power]').textContent=power;dialog.querySelector('.trio-trajectory').setAttribute('d','M30 172 Q'+((30+landing)/2)+' '+(172-height*2)+' '+landing+' 172');return {landing,height}}
 function complete(){state[active].phase=2;changed();feedback('성공! 닫고 '+META[active].name+'에게 다시 말을 걸어 마무리하자.');content().querySelectorAll('button,input').forEach(el=>el.disabled=true);const b=doc.createElement('button');b.type='button';b.dataset.trio='close';b.textContent='맵으로 돌아가기';content().append(b);b.focus({preventScroll:true})}
 function play(){if(active==='tori')bookGame();else if(active==='garden')pipes();else shot()}
 dialog.addEventListener('input',e=>{if(valid()&&mode==='shot'&&e.target.matches('[data-shot]')&&!frame)trajectory()});
 dialog.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.trio==='close'){close();return}if(!valid()){close();sync();return}
  const r=state[active],action=b.dataset.trio;
  if(action==='save'){save();dialog.querySelector('.trio-storage').textContent=saveError?'아직 저장하지 못했어요.':'이 기기에 저장했어요.';b.hidden=!saveError;return}
  if(action==='legacy'){close();c.legacyTori();return}
  if(action==='accept'){if(r.phase===3)r.round=(r.round+1)%999999;r.phase=1;changed();play();return}
  if(action==='play'){play();return}
  if(action==='return'&&r.phase===2){r.phase=3;r.wins=Math.min(999999,r.wins+1);changed();talk();feedback('완성! 맵에 네가 해낸 흔적이 남았어. 다른 친구도 만나 봐!');return}
  if(r.phase!==1)return;
  if(b.dataset.book!=null&&mode==='books'){if(Number(b.dataset.book)===r.round%6)complete();else{feedback('이 책은 단서가 하나 달라. 표지 색과 무늬를 함께 봐!');b.classList.add('trio-wrong')}return}
  if(b.dataset.tile!=null&&mode==='pipes'){const tile=board.tiles[Number(b.dataset.tile)];tile.turn=(tile.turn+1)%4;drawPipes();feedback('물길을 돌렸어. 이어졌는지 물을 흘려 보자!');return}
  if(action==='water'&&mode==='pipes'){const result=traceWater(board.tiles,board.start,board.end);drawPipes(result.visited);if(result.ok)complete();else feedback('물이 여기서 멈췄어. 파란 물길 끝의 연결 방향을 바꿔 봐!');return}
  if(action==='throw'&&mode==='shot'&&!frame){const {landing,height}=trajectory(),target=215+r.round%4*22,ball=dialog.querySelector('.trio-projectile'),start=performance.now(),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?180:850;content().querySelectorAll('button,input').forEach(el=>el.disabled=true);
   function tick(now){if(!valid()){frame=0;close();return}const t=Math.min(1,(now-start)/duration);ball.setAttribute('cx',30+(landing-30)*t);ball.setAttribute('cy',172-4*height*t*(1-t));if(t<1){frame=requestAnimationFrame(tick);return}frame=0;if(Math.abs(landing-target)<=18)complete();else{content().querySelectorAll('button,input').forEach(el=>el.disabled=false);feedback(landing<target?'조금 짧았어! 힘을 높이거나 각도를 바꿔 봐.':'조금 멀리 갔어! 힘을 낮춰서 다시 던져 봐.')}}frame=requestAnimationFrame(tick);
  }
 });
 dialog.addEventListener('close',cancel);dialog.addEventListener('cancel',cancel);
 function sync(){activate();if(dialog.open&&!valid())close();
  for(const id of Object.keys(META)){const kind=id==='tori'?'tori':'trio-'+id,b=c.objects.querySelector('[data-place="'+kind+'"]');if(!b)continue;const r=state[id];b.dataset.trioPhase=String(r.phase);b.dataset.trioWins=String(r.wins);let badge=b.querySelector('.trio-world-result');if(r.wins&&!badge){badge=doc.createElement('span');badge.className='trio-world-result';badge.setAttribute('role','img');badge.setAttribute('aria-label',id==='tori'?'복원한 책':id==='garden'?'함께 피운 꽃':'성공 깃발');badge.textContent=id==='tori'?'📚':id==='garden'?'🌼🌷🌼':'⚑';b.append(badge)}else if(!r.wins)badge?.remove();const mark=b.querySelector('.trio-mark');if(mark)mark.textContent=r.phase===2?'✓':r.phase===1?'…':'!';
  }
 }
 const observer=new MutationObserver(()=>{if(c.hub.classList.contains('hidden'))close()});observer.observe(c.hub,{attributes:true,attributeFilter:['class','data-scene']});
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden)close()});doc.addEventListener('student-dashboard-updated',sync);
 return {sync,interact(kind){const id=kind==='tori'?'tori':kind==='trio-garden'?'garden':kind==='trio-duri'?'duri':null;if(!id)return false;sync();if(c.walk.nearby()?.kind!==kind){c.walk.goTo(kind);return true}launch(id);return true},requests(){activate();return Object.keys(META).map(id=>({id:'trio-'+id,title:META[id].name+' · '+META[id].title,loaded:true,active:state[id].phase===1||state[id].phase===2,text:state[id].phase===2?META[id].name+'에게 돌아가 완성해요.':META[id].task,error:saveError?'이 기기에 놀이 기록을 저장하지 못했어요.':null,retry:save}))}};
}
