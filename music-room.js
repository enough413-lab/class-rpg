export const MUSIC_MILESTONE={level:13,label:'🎵 음악실 소리 탐험',activity:'music-room',description:'높낮이·길이·쉼표를 발견하고 나만의 소리 배지를 모아요.'};
// Visual clues and optional audio describe the same sequence. The RPC validates answers.
export const MUSIC_STEPS=[
 {id:'music-room-1',title:'통통! 소리의 높낮이',question:'가장 높은 소리는 몇 번일까요?',kind:'pitch',labels:['낮은 소리','높은 소리','가운데 소리'],values:[25,85,55],notes:[{hz:261.63,duration:.45},{hz:392,duration:.45},{hz:329.63,duration:.45}],hint:'그림에서 음표가 가장 위에 있는 소리를 찾아봐요. 높은 소리는 더 가늘고 맑게 들려요.',explanation:'2번 소리가 가장 높아요. 소리의 높낮이와 소리의 크기는 서로 달라요.',real:'음악 시간에 높은 소리와 낮은 소리를 찾아보세요. 크게 지르지 않아도 높게 소리 낼 수 있어요.'},
 {id:'music-room-2',title:'쭈욱! 소리의 길이',question:'가장 오래 이어진 소리는 몇 번일까요?',kind:'length',labels:['긴 소리','짧은 소리','중간 길이 소리'],values:[90,32,51],notes:[{hz:329.63,duration:.7},{hz:329.63,duration:.25},{hz:329.63,duration:.4}],hint:'소리가 이어진 만큼 막대가 길어요. 가장 긴 막대를 찾아봐요.',explanation:'1번 소리가 가장 길어요. 높이가 같은 소리도 길게, 짧게 낼 수 있어요.',real:'선생님이 들려주는 소리를 따라 “라—”, “라” 하고 길고 짧게 표현해 보세요.'},
 {id:'music-room-3',title:'쉿! 쉬는 자리도 음악',question:'네 자리 중 소리가 쉬는 곳은 몇 번일까요?',kind:'rest',labels:['소리','소리','쉼','소리'],values:[1,1,0,1],notes:[{hz:329.63,duration:.22},{hz:329.63,duration:.22},{hz:0,duration:.22},{hz:329.63,duration:.22}],hint:'동그란 점 대신 빈 자리가 있는 곳을 찾아봐요. 쉼도 같은 길이로 지나가요.',explanation:'3번 자리에서 쉬었어요. 음악에는 소리를 내는 시간과 조용히 기다리는 시간이 함께 있어요.',real:'친구와 “짝, 짝, 쉼, 짝”을 천천히 해 보세요. 쉬는 자리에서는 손뼉을 치지 않고 함께 기다려요.'}
];
export function musicView(step,index,esc){
 const clue=(value)=>step.kind==='pitch'?'<span class="sa-note-staff"><i style="bottom:'+value+'%">♪</i></span>':step.kind==='length'?'<span class="sa-note-length"><i style="width:'+value+'%"></i></span>':'<span class="sa-note-beat">'+(value?'●':'○')+'</span>';
 return '<div class="sa-music-hero"><img src="maps/music-room-v1.webp" alt="햇살 드는 음악실의 피아노와 작은 악기들"><div><span class="sa-eyebrow">음악실의 작은 발견</span><h3>'+esc(step.title)+'</h3><p>귀로 듣거나 그림으로 살펴봐요.</p></div></div>'+
 '<div class="sa-music-progress" aria-label="세 발견 중 '+(index+1)+'번째">'+MUSIC_STEPS.map((_,i)=>'<span class="'+(i===index?'current':'')+'">'+(i<index?'✓':i+1)+'</span>').join('')+'<b>소리 탐험 '+(index+1)+' / 3</b></div>'+
 '<div class="sa-music-player"><div class="sa-music-controls"><button class="sa-button" data-music-play>▶ 소리 듣기</button><button class="sa-button" data-music-stop disabled>■ 멈추기</button></div><label class="sa-music-volume" for="saMusicVolume">소리 크기 <input id="saMusicVolume" type="range" min="0" max="100" value="30" aria-label="음악실 소리 크기"></label><p id="saMusicAudioStatus" role="status">소리는 버튼을 누를 때만 나요. 그림만 보고 해도 괜찮아요.</p></div>'+
 '<h3 class="sa-question" id="saMusicQuestion">'+esc(step.question)+'</h3><p class="sa-note">왼쪽부터 차례로 살펴보고, 답 하나를 골라요.</p><div class="sa-music-choices" data-kind="'+step.kind+'" role="group" aria-labelledby="saMusicQuestion">'+step.labels.map((label,i)=>'<button class="sa-music-choice" data-music-choice="'+i+'" aria-pressed="false"><b>'+(i+1)+'번</b><span aria-hidden="true">'+clue(step.values[i])+'</span><span>'+esc(label)+'</span><small>이 소리 고르기</small></button>').join('')+'</div>'+
 '<p id="saMusicSelection" class="sa-small" role="status">아직 고르지 않았어요.</p><button class="sa-button primary" data-sa="check-music">발견한 소리 확인하기</button><div id="saMusicFeedback" class="sa-feedback" role="status" aria-live="polite"></div>';
}
export function musicBadgeView(esc){
 return '<div class="sa-library-finish sa-music-finish"><svg class="sa-music-badge" viewBox="0 0 180 180" role="img" aria-label="음표와 작은 별이 있는 소리 발견 배지"><path d="M47 105L35 167L77 144L97 172L124 111" fill="#98bdb0" stroke="#52796c" stroke-width="3"/><circle cx="90" cy="77" r="62" fill="#f3d28e" stroke="#b4884c" stroke-width="4"/><circle cx="90" cy="77" r="50" fill="#fff4d2" stroke="#dfb971" stroke-width="2"/><path d="M83 93V52L114 44V85" fill="none" stroke="#527b73" stroke-width="9" stroke-linejoin="round"/><ellipse cx="73" cy="96" rx="15" ry="11" fill="#527b73"/><ellipse cx="104" cy="87" rx="15" ry="11" fill="#527b73"/><path d="M52 52L56 61L66 64L56 68L52 78L48 68L38 64L48 61Z" fill="#cf9261"/></svg><span class="sa-eyebrow">음악실 소리 탐험 완료</span><h3>소리 발견 배지를 모았어요!</h3><p>높낮이, 길이, 쉬는 자리를 살펴봤어요.<br>음악 시간에도 오늘의 발견을 떠올려 보세요.</p></div><h3>다시 만나고 싶은 소리</h3><div class="sa-evidence-replay">'+MUSIC_STEPS.map((s,i)=>'<button class="sa-destination" data-music-replay="'+i+'"><b>'+esc(s.title)+'</b><small>✓ 발견 완료 · 다시 해 보기</small></button>').join('')+'</div><p class="sa-note">배지는 이 계정의 탐험 수첩에 남아요. 다시 해도 경험치와 골드는 늘어나지 않아요.</p>';
}
// One quiet, user-started voice sequence at a time; no microphone or downloaded audio.
export function createMusicPlayer(onState,host=window){
 let context=null,voices=[],timer=null,revision=0,volume=.3,master=null;
 function stop(){
  revision++;host.clearTimeout(timer);timer=null;
  for(const [osc,gain] of voices){try{osc.stop();osc.disconnect();gain.disconnect()}catch{}}
  voices=[];if(master){master.disconnect();master=null}
  if(context?.state==='running')context.suspend().catch(()=>{});
  onState('stopped');
 }
 async function play(notes){
  stop();const request=revision;
  try{
   const Audio=host.AudioContext||host.webkitAudioContext;if(!Audio)throw Error('No audio');
   context??=new Audio();await context.resume();if(request!==revision)return;
   master=context.createGain();master.gain.value=.18*volume;master.connect(context.destination);
   let at=context.currentTime+.06;
   for(const note of notes){
    if(note.hz){const osc=context.createOscillator(),gain=context.createGain();osc.type='sine';osc.frequency.setValueAtTime(note.hz,at);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(1,at+.025);gain.gain.setValueAtTime(1,at+note.duration-.04);gain.gain.linearRampToValueAtTime(0,at+note.duration);osc.connect(gain);gain.connect(master);osc.start(at);osc.stop(at+note.duration+.01);voices.push([osc,gain])}
    at+=note.duration+.32;
   }
   onState('playing');timer=host.setTimeout(stop,(at-context.currentTime)*1000);
  }catch{if(request===revision){stop();onState('unavailable')}}
 }
 function setVolume(value){volume=Math.min(1,Math.max(0,Number(value)/100||0));if(master)master.gain.setTargetAtTime(.18*volume,context.currentTime,.02)}
 return {play,stop,setVolume};
}
