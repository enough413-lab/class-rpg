import {createMusicPlayer} from './music-room.js?v=20261007-sequence';
export const SEQUENCE_MILESTONE={level:14,label:'🎼 음악실의 잃어버린 멜로디',activity:'music-sequence',description:'소리 요정 루미와 음표를 순서대로 놓고, 환영 악보를 수첩에 남겨요.'};
export const SEQUENCE_TONES={low:{label:'낮은 소리',symbol:'♩',hz:261.63,duration:.4,height:25},middle:{label:'가운데 소리',symbol:'♪',hz:329.63,duration:.4,height:50},high:{label:'높은 소리',symbol:'♫',hz:392,duration:.4,height:80},short:{label:'짧은 소리',symbol:'♪',hz:329.63,duration:.22,height:50},long:{label:'긴 소리',symbol:'♩—',hz:329.63,duration:.7,height:50},rest:{label:'한 자리 쉬기',symbol:'○',hz:0,duration:.4,height:50}};
export const SEQUENCE_STEPS=[
 {id:'music-sequence-1',title:'창가의 인사',story:'루미: “새 친구를 맞이할 악보가 흩어졌어! 먼저 창가의 음표를 낮은 곳에서 높은 곳으로 이어 줄래?”',order:['low','middle','high'],pool:['high','low','middle'],hint:'낮은 소리 → 가운데 소리 → 높은 소리 순서로 놓아 봐요.'},
 {id:'music-sequence-2',title:'함께 숨 고르기',story:'루미: “잘 이어졌어! 이번에는 짧게 인사하고, 잠깐 쉬었다가, 길게 반가움을 전하자.”',order:['short','rest','long'],pool:['long','short','rest'],hint:'짧은 소리 다음에는 빈 자리인 쉼표가 와요. 마지막 소리는 길게 이어져요.'},
 {id:'music-sequence-3',title:'모험학교의 환영 멜로디',story:'루미: “이제 마지막 줄이야. 낮은 소리에서 높은 소리로 날아오르고, 쉬었다가 가운데로 돌아와 줘!”',order:['low','high','rest','middle'],pool:['rest','middle','low','high'],hint:'낮음 → 높음 → 쉼 → 가운데. 그림 악보와 한 자리씩 나란히 살펴봐요.'}
];
export function installMusicSequence(c){
 const {dialog,esc,open,button}=c,doc=dialog.ownerDocument,$=id=>doc.getElementById(id);
 let index=0,selected=[],solved=false,owner=null,token=null;
 const player=createMusicPlayer(state=>{const status=$('sequenceAudioStatus');if(!status)return;status.textContent=state==='playing'?'멜로디를 듣고 있어요.':state==='unavailable'?'소리를 켜지 못했어요. 그림 악보로 똑같이 이어 갈 수 있어요.':'버튼을 누를 때만 소리가 나요. 그림만 보고 해도 괜찮아요.';const stop=dialog.querySelector('[data-sequence-stop]');if(stop)stop.disabled=state!=='playing'});
 const done=()=>new Set(c.getJournal()?.exploration||[]);
 const hasStarted=()=>SEQUENCE_STEPS.some(s=>done().has(s.id));
 function label(level){const n=SEQUENCE_STEPS.filter(s=>done().has(s.id)).length;return n===3?'✓ 환영 악보 완성 · 다시 연주하기':n?n+' / 3줄 완료 · 이어 하기':level<14?'🔒 Lv. 14에 열려요':'루미의 부탁 만나기'}
 const tone=(id)=>{const t=SEQUENCE_TONES[id];return '<span class="sequence-tone" data-tone="'+id+'" aria-hidden="true"><i style="bottom:'+t.height+'%">'+t.symbol+'</i></span><strong>'+t.label+'</strong>'};
 function view(){
  player.stop();selected=[];solved=false;const step=SEQUENCE_STEPS[index];
  if(!step){open('나의 환영 악보','소리 요정 루미의 부탁을 마쳤어요.','<section class="sequence-finish"><span aria-hidden="true">🎼 ✦</span><h3>모험학교의 환영 악보를 완성했어요!</h3><p>흩어진 소리를 이어 새 친구를 맞이할 멜로디를 만들었어요.<br>이 악보는 내 탐험 수첩에 남아요.</p></section><h3>다시 연주할 악보</h3><div class="sa-evidence-replay">'+SEQUENCE_STEPS.map((s,i)=>'<button class="sa-destination" data-sequence-replay="'+i+'"><b>✓ '+esc(s.title)+'</b><small>완성한 줄 다시 이어 보기</small></button>').join('')+'</div><p class="sa-note">다시 해도 경험치·골드는 늘어나지 않아요. 음악 시간에도 친구를 반기는 소리를 함께 만들어 보세요.</p><p>'+button('map','← 탐험 지도')+'</p>');return}
  open('🎼 잃어버린 멜로디',step.title+' · 악보 '+(index+1)+' / 3',
   '<div class="sa-music-hero"><img src="maps/music-room-v1.webp" alt="피아노가 있는 햇살 드는 음악실"><div><span class="sa-eyebrow">루미의 작은 부탁</span><h3>'+esc(step.title)+'</h3><p>'+esc(step.story)+'</p></div></div>'+
   '<div class="sequence-progress" aria-label="악보 세 줄 중 '+(index+1)+'번째">'+SEQUENCE_STEPS.map((s,i)=>'<span class="'+(i===index?'current':'')+'">'+(done().has(s.id)?'✓':i+1)+'</span>').join('')+'</div>'+
   '<h3>루미가 기억하는 악보</h3><p class="sa-note">그림과 글에 소리 순서가 모두 있어요. 왼쪽부터 살펴봐요.</p><ol class="sequence-score">'+step.order.map((id,i)=>'<li><small>'+(i+1)+'번째</small>'+tone(id)+'</li>').join('')+'</ol>'+
   '<div class="sa-music-player sequence-player"><div class="sa-music-controls"><button class="sa-button" data-sequence-play="target">▶ 루미의 멜로디 듣기</button><button class="sa-button" data-sequence-stop disabled>■ 멈추기</button></div><label class="sa-music-volume" for="sequenceVolume">소리 크기 <input id="sequenceVolume" type="range" min="0" max="100" value="30" aria-label="멜로디 소리 크기"></label><p id="sequenceAudioStatus" role="status">소리는 버튼을 누를 때만 나요. 그림만 보고 해도 괜찮아요.</p></div>'+
   '<h3>내가 이어 놓는 악보</h3><p class="sa-note">아래 음표를 하나씩 눌러 빈 자리에 놓아요. 놓은 음표를 누르면 빼고 다시 놓을 수 있어요.</p><div id="sequenceSlots" class="sequence-slots" role="group" aria-label="내 악보의 소리 순서"></div><p id="sequenceSelection" role="status" class="sa-small"></p><div class="sequence-pool" role="group" aria-label="놓을 수 있는 소리">'+step.pool.map(id=>'<button class="sequence-card" data-sequence-add="'+id+'">'+tone(id)+'<small>악보에 놓기</small></button>').join('')+'</div><div class="sequence-actions"><button class="sa-button" data-sequence-undo>↶ 마지막 음표 빼기</button><button class="sa-button" data-sequence-play="mine">▶ 내 악보 듣기</button><button class="sa-button primary" data-sequence-check>악보 확인하고 저장하기</button></div><div id="sequenceFeedback" class="sa-feedback" role="status" aria-live="polite"></div><p>'+button('map','← 탐험 지도')+'</p>');
  slots();player.setVolume(30);
 }
 function slots(focusIndex){const step=SEQUENCE_STEPS[index];if(!step)return;
  $('sequenceSlots').innerHTML=step.order.map((_,i)=>'<button class="sequence-slot '+(selected[i]?'filled':'')+'" data-sequence-remove="'+i+'" '+(!selected[i]?'disabled':'')+' aria-label="'+(i+1)+'번째 자리, '+(selected[i]?SEQUENCE_TONES[selected[i]].label+', 누르면 빼기':'비어 있어요')+'"><small>'+(i+1)+'번째</small>'+(selected[i]?tone(selected[i]):'<span aria-hidden="true">＋</span><strong>빈 자리</strong>')+'</button>').join('');
  dialog.querySelectorAll('[data-sequence-add]').forEach(b=>{b.disabled=solved||selected.includes(b.dataset.sequenceAdd);b.querySelector('small').textContent=b.disabled?'✓ 악보에 놓았어요':'악보에 놓기'});
  $('sequenceSelection').textContent=selected.length+' / '+step.order.length+'개 놓았어요. '+selected.map(id=>SEQUENCE_TONES[id].label).join(' → ');
  dialog.querySelector('[data-sequence-undo]').disabled=solved||!selected.length;dialog.querySelector('[data-sequence-play=mine]').disabled=!selected.length;
  if(focusIndex!==undefined)dialog.querySelector('[data-sequence-remove="'+focusIndex+'"]')?.focus({preventScroll:true});
 }
 function start(){owner=c.getStudent().id;token=c.getToken();index=SEQUENCE_STEPS.findIndex(s=>!done().has(s.id));
  if(!hasStarted()&&!['music-room-1','music-room-2','music-room-3'].every(id=>done().has(id))){open('루미가 기다리고 있어요','음악실에서 세 가지 소리를 먼저 발견해요.','<div class="sa-real-mission"><h3>첫 소리 탐험부터 만나 볼까요?</h3><p>높낮이·길이·쉼을 발견하면 루미와 환영 악보를 이어 갈 수 있어요.</p><button class="sa-button primary" data-workshop="music-room">Lv.13 소리 탐험 만나기</button></div><p>'+button('map','← 탐험 지도')+'</p>');return}view()}
 async function save(){const step=SEQUENCE_STEPS[index],feedback=$('sequenceFeedback');if(c.getSaving()||solved||!step||!feedback)return;
  if(selected.length!==step.order.length){feedback.textContent='빈 자리에 음표를 모두 놓아 주세요.';return}
  player.stop();const requestedOwner=c.getStudent().id,requestedToken=c.getToken(),choice=[...selected];c.setSaving(true);
  const buttons=[...dialog.querySelectorAll('button')].map(b=>[b,b.disabled]);buttons.forEach(([b])=>b.disabled=true);feedback.textContent='루미와 악보를 확인하고 수첩에 담고 있어요…';
  try{const {data,error}=await c.db.rpc('student_music_sequence',{p_token:requestedToken,p_step:step.id,p_order:choice});if(error||!data)throw error||Error('Missing result');
   if(requestedOwner!==c.getStudent().id||requestedToken!==c.getToken())return;
   if(!data.correct){feedback.textContent='다시 이어 볼까요? '+step.hint;return}if(data.step_id!==step.id)throw Error('Unexpected result');
   const journal=c.getJournal();journal.exploration=[...new Set([...journal.exploration,step.id])];c.markLoaded();solved=true;c.render();
   feedback.innerHTML='<b>✦ 루미: “이 줄을 찾았어! 고마워.”</b><p>✓ 악보 '+(index+1)+' / 3줄을 저장했어요. 다음에 와도 이어져요.</p><button class="sa-button primary" data-sequence-next>'+(index===2?'완성한 환영 악보 보기':'다음 악보 찾기 →')+'</button>';feedback.querySelector('button').focus({preventScroll:true});
  }catch{if(requestedOwner===c.getStudent().id&&requestedToken===c.getToken())feedback.textContent='아직 저장을 확인하지 못했어요. 놓은 음표는 그대로예요. 연결을 확인하고 다시 눌러 주세요.'}
  finally{c.setSaving(false);buttons.forEach(([b,disabled])=>{if(b.isConnected)b.disabled=disabled||solved&&b.matches('[data-sequence-add],[data-sequence-remove],[data-sequence-check],[data-sequence-undo]')})}
 }
 dialog.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(!b.hasAttribute('data-sequence-play'))player.stop();if(c.getSaving())return;
  if(owner!==c.getStudent().id||token!==c.getToken()){if(Object.keys(b.dataset).some(key=>key.startsWith('sequence'))){selected=[];owner=null;token=null;open('다시 수첩을 펼쳐 주세요','계정이 바뀌었어요. 새 계정의 기록을 확인해요.',button('map','탐험 지도 펼치기'));return}}
  if(b.hasAttribute('data-sequence-play')){const order=b.dataset.sequencePlay==='target'?SEQUENCE_STEPS[index]?.order:selected;if(order?.length)player.play(order.map(id=>SEQUENCE_TONES[id]));return}
  if(b.hasAttribute('data-sequence-stop')){player.stop();return}
  if(b.hasAttribute('data-sequence-replay')){const n=Number(b.dataset.sequenceReplay);if(SEQUENCE_STEPS[n]&&done().has(SEQUENCE_STEPS[n].id)){index=n;view()}return}
  if(b.hasAttribute('data-sequence-next')&&solved){index++;view();return}
  if(b.hasAttribute('data-sequence-check')){save();return}
  if(solved)return;
  if(b.hasAttribute('data-sequence-add')){const id=b.dataset.sequenceAdd,step=SEQUENCE_STEPS[index];if(step?.pool.includes(id)&&!selected.includes(id)&&selected.length<step.order.length){selected.push(id);$('sequenceFeedback').textContent='';slots(selected.length-1)}return}
  if(b.hasAttribute('data-sequence-remove')){const n=Number(b.dataset.sequenceRemove);if(Number.isInteger(n)&&selected[n]){const id=selected.splice(n,1)[0];slots();dialog.querySelector('[data-sequence-add="'+id+'"]').focus({preventScroll:true});$('sequenceFeedback').textContent='음표를 빼냈어요. 다시 놓아 보세요.'}return}
  if(b.hasAttribute('data-sequence-undo')){selected.pop();slots();$('sequenceFeedback').textContent='마지막 음표를 빼냈어요.'}
 });
 dialog.addEventListener('input',e=>{if(e.target.id==='sequenceVolume')player.setVolume(e.target.value)});
 dialog.addEventListener('close',()=>player.stop());window.addEventListener('blur',()=>player.stop());window.addEventListener('pagehide',()=>player.stop());doc.addEventListener('visibilitychange',()=>{if(doc.hidden)player.stop()});
 return {start,label,hasStarted,stop:()=>player.stop()};
}
