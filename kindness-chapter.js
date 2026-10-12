export const KINDNESS_MILESTONE={level:15,label:'🤝 새 친구 나루의 길 안내',activity:'kindness-chapter',description:'나루의 이야기를 듣고 도서관 길을 함께 찾아요. 다정한 길잡이 핀이 남아요.'};
export const KINDNESS_PINS={leaf:{name:'새싹 핀',symbol:'🌱'},sun:{name:'햇살 핀',symbol:'☀️'},star:{name:'별빛 핀',symbol:'⭐'}};
const MEMORY={listen:'나루의 말을 끝까지 들었어요.',ask:'어떤 도움이 필요한지 먼저 물었어요.',library:'책 모양의 파란 도서관 표지판을 찾았어요.',walk:'나루와 천천히 함께 걸었어요.',introduce:'책지기 토리에게 나루를 소개했어요.'};
export function kindnessProfile(state){if(state?.phase!==4||!state.wearing||!KINDNESS_PINS[state.pin])return '';const pin=KINDNESS_PINS[state.pin];return '<button class="sa-profile-memento kindness-profile" data-workshop="kindness-chapter" aria-label="다정한 길잡이 핀과 나루 이야기 보기"><span aria-hidden="true">'+pin.symbol+'</span><span>다정한 길잡이<br><small>'+pin.name+' · 나루와의 학교 기억</small></span></button>'}
export function installKindnessChapter(c){
 const {dialog,esc,open,button}=c,$=id=>dialog.ownerDocument.getElementById(id);let owner=null,token=null,phase=0,chosen=null,confirmed=false;
 const state=()=>c.getJournal()?.kindness||{phase:0,choices:[],pin:null,wearing:false};const hasStarted=()=>state().phase>0;
 const label=level=>state().phase===4?'✓ 나루와의 기억 · 핀 꾸미기':hasStarted()?'이야기 '+state().phase+' / 4 완료 · 이어 가기':level<15?'🔒 Lv. 15에 만나요':'담임선생님의 부탁 받기';
 function start(){owner=c.getStudent().id;token=c.getToken();phase=state().phase+1;view()}
 const option=(id,title,text,art='')=>'<button class="kindness-choice" data-kind-choice="'+id+'" aria-pressed="false">'+art+'<strong>'+title+'</strong><span>'+text+'</span></button>';
 const door=(color,icon)=>'<svg class="kindness-door" viewBox="0 0 110 120" aria-hidden="true"><path d="M14 116V20Q55-4 96 20V116" fill="'+color+'" stroke="#6b7055" stroke-width="4"/><path d="M26 116V31H84V116" fill="#fff9e4"/><circle cx="75" cy="79" r="4" fill="#907854"/><text x="55" y="67" font-size="32" text-anchor="middle">'+icon+'</text></svg>';
 function view(){chosen=null;confirmed=false;const s=state();
  if(phase>4){finish();return}
  const story=[null,
   ['담임선생님의 부탁','담임선생님: “새 친구 나루가 도서관에서 열리는 책 나눔에 가고 싶대. 처음 온 길이라 조금 막막한가 봐. 무엇이 필요한지 먼저 들어 줄래?”','나루: “책은 가져왔는데… 어느 문으로 가야 할지 잘 모르겠어.”'],
   ['표지판 속 작은 단서',s.choices[0]==='ask'?'나루: “먼저 물어봐 줘서 고마워! 책지기 토리가 있는 곳으로 가고 싶어.”':'나루: “천천히 들어 줘서 고마워. 책지기 토리를 만나고 싶어.”','나루의 메모: “책 그림이 있는 파란 표지판을 따라가면 도서관이 보여.” 메모와 같은 문을 찾아요.'],
   ['함께 갈 방법을 물어봐요','나루: “이제 어느 문인지 알겠어. 그래도 처음 만나는 사람에게 인사하려니 살짝 떨려.”','어떤 도움을 주고 싶은지 물어보고, 나루가 고른 속도에 맞춰 함께해요. 두 방법 모두 괜찮아요.'],
   ['나루와 함께 남기는 학교 기억',s.choices[2]==='introduce'?'토리: “나루구나! 가져온 책 이야기를 들려줄래?” 나루가 웃으며 책을 펼쳤어요.':'나루와 천천히 걸어 도서관에 도착했어요. 토리가 먼저 인사하자 나루도 웃으며 책을 펼쳤어요.','나루: “혼자 헤매지 않도록 함께해 줘서 고마워. 오늘 기억을 작은 핀으로 남기자!”']
  ][phase];
  const opts=phase===1?option('listen','천천히 이야기 듣기','나루가 말할 수 있도록 내 차례를 기다려요.')+option('ask','필요한 도움부터 물어보기','“어디에 가고 싶어? 함께 찾아볼까?”'):
   phase===2?option('classroom','주황 교실 문','담임선생님의 교실이에요.',door('#dda16c','🏫'))+option('library','파란 도서관 문','책지기 토리가 있는 곳이에요.',door('#86b7c9','📖'))+option('shop','초록 문구 상점','모모의 문구 상점이에요.',door('#abc59c','✏️')):
   phase===3?option('walk','같이 걸어갈까?','나루: “응! 천천히 같이 가고 싶어.”')+option('introduce','토리에게 함께 인사할까?','나루: “좋아! 처음 인사를 함께 해 줘.”'):
   Object.entries(KINDNESS_PINS).map(([id,p])=>option(id,p.symbol+' '+p.name,'능력치가 없는 학교 기억 장식이에요.')).join('');
  open('🤝 새 친구 나루의 길 안내',story[0]+' · 이야기 '+phase+' / 4',
   '<section class="kindness-scene"><img src="maps/npcs/teacher-v1.webp" alt="의뢰를 맡긴 담임선생님"><div><span class="sa-eyebrow">다정한 길잡이 · 학교 의뢰</span><h3>'+esc(story[0])+'</h3><p>'+esc(story[1])+'</p></div></section><div class="kindness-dialogue"><span aria-hidden="true">💬</span><p>'+esc(story[2])+'</p></div><ol class="kindness-progress" aria-label="이야기 네 단계">'+['마음 듣기','길 찾기','함께 가기','기억 남기기'].map((t,i)=>'<li class="'+(i+1===phase?'current':'')+'">'+(i+1<phase?'✓':i+1)+' '+t+'</li>').join('')+'</ol><div class="kindness-choices" role="group" aria-label="나루와 함께 할 선택">'+opts+'</div><p id="kindnessSelection" class="sa-small" role="status">아직 고르지 않았어요.</p><button class="sa-button primary" data-kind-save>이 선택으로 이어 가기</button><div id="kindnessFeedback" class="sa-feedback" role="status" aria-live="polite"></div><p class="sa-note">대화와 탐험은 연습 이야기예요. 한 단계를 마칠 때 수첩에 저장돼요. 시간제한·감점·추가 경험치는 없어요.</p><p>'+button('map','← 탐험 지도')+'</p>');
 }
 function finish(){const s=state(),pin=KINDNESS_PINS[s.pin];
  open('나루와의 소중한 학교 기억','다정한 길잡이 · 의뢰 완료',
   '<section class="kindness-finish"><span class="kindness-big-pin" aria-hidden="true">'+(pin?.symbol||'🤝')+'</span><h3>나루와 도서관 길을 찾았어요!</h3><p>친구가 필요한 것을 듣고, 함께 갈 방법을 물어봤어요.<br>나루가 학교에서 첫 책 나눔 친구를 만났어요.</p><strong>✓ 다정한 길잡이 핀을 모았어요</strong></section><h3>우리의 발자국</h3><ol class="kindness-memory">'+s.choices.slice(0,3).map(id=>'<li>'+esc(MEMORY[id])+'</li>').join('')+'</ol><h3>오늘 기억의 핀 꾸미기</h3><div class="kindness-pin-options">'+Object.entries(KINDNESS_PINS).map(([id,p])=>'<button class="kindness-choice" data-kind-pin="'+id+'" aria-pressed="'+(s.pin===id)+'"><span class="kindness-pin-icon" aria-hidden="true">'+p.symbol+'</span><strong>'+p.name+'</strong><span>'+(s.pin===id?'✓ 지금 고른 핀':'이 모양으로 바꾸기')+'</span></button>').join('')+'</div><button class="sa-button" data-kind-wear="'+(!s.wearing)+'">'+(s.wearing?'핀을 수첩에 보관하기':'프로필에 핀 달기')+'</button><div id="kindnessFeedback" class="sa-feedback" role="status" aria-live="polite"></div><div class="sa-real-mission"><strong>진짜 학교에서도 함께해 볼까요?</strong><p>친구에게 어떤 도움이 필요한지 먼저 물어보세요. 도와줄 때에도 친구의 선택과 속도를 존중해요.</p></div><p class="sa-note">핀은 내 프로필의 기념 장식이에요. 다시 보거나 바꿔도 경험치·골드·아이템은 늘어나지 않아요. Lv.15의 50 골드는 기존 레벨 달성 선물에서 한 번 받아요.</p><p>'+button('map','← 탐험 지도')+'</p>');
 }
 async function save(step,value){if(c.getSaving())return;const feedback=$('kindnessFeedback');if(!feedback)return;if(!value){feedback.textContent='함께 할 선택 하나를 먼저 골라 주세요.';return}
  const requestedOwner=c.getStudent().id,requestedToken=c.getToken();c.setSaving(true);const buttons=[...dialog.querySelectorAll('button')].map(b=>[b,b.disabled]);buttons.forEach(([b])=>b.disabled=true);feedback.textContent='나루와의 발자국을 수첩에 담고 있어요…';
  try{const {data,error}=await c.db.rpc('student_kindness_chapter',{p_token:requestedToken,p_step:step,p_choice:value});if(error||!data)throw error||Error('Missing chapter result');if(requestedOwner!==c.getStudent().id||requestedToken!==c.getToken())return;
   if(data.correct===false){feedback.textContent='메모를 다시 살펴볼까요? 책 그림과 파란 표지판이 있는 도서관 문을 찾아요.';return}
   if(!Number.isInteger(data.phase)||data.phase<0||data.phase>4||!Array.isArray(data.choices)||step.startsWith('kindness-')&&data.phase<phase||data.phase===4&&!KINDNESS_PINS[data.pin])throw Error('Unconfirmed chapter');
   c.getJournal().kindness=data;c.markLoaded();c.render();
   if(step==='pin'||step==='wear'){finish();$('kindnessFeedback').textContent='✓ 핀 모양과 착용 상태를 저장했어요.';return}
   confirmed=true;feedback.innerHTML='<b>✓ 이야기 '+phase+' / 4를 저장했어요.</b><p>'+esc(phase===1?(value==='ask'?'나루: “먼저 물어봐 줘서 마음이 놓였어.”':'나루: “내 이야기를 천천히 들어 줘서 고마워.”'):phase===2?'나루: “메모와 같은 문이야! 길을 찾았어.”':phase===3?(value==='walk'?'나루: “우리 천천히 같이 걸어가자.”':'나루: “토리에게 함께 인사하면 덜 떨릴 것 같아.”'):'나루: “오늘의 기억이 우리 수첩에 남았어!”')+'</p><button class="sa-button primary" data-kind-next>'+(phase===4?'나루와의 기억 보기':'다음 이야기 →')+'</button>';feedback.querySelector('button').focus({preventScroll:true});
  }catch{if(requestedOwner===c.getStudent().id&&requestedToken===c.getToken())feedback.textContent='아직 저장을 확인하지 못했어요. 선택은 그대로예요. 연결을 확인하고 다시 눌러 주세요.'}
  finally{c.setSaving(false);buttons.forEach(([b,disabled])=>{if(b.isConnected)b.disabled=disabled||confirmed&&b.matches('[data-kind-choice],[data-kind-save]')})}
 }
 dialog.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!Object.keys(b.dataset).some(k=>k.startsWith('kind'))||c.getSaving())return;
  if(owner!==c.getStudent().id||token!==c.getToken()){owner=null;chosen=null;open('새 계정의 수첩을 펼쳐 주세요','계정이 바뀌었어요.',button('map','탐험 지도 펼치기'));return}
  if(b.hasAttribute('data-kind-next')&&confirmed){phase++;view();return}
  if(b.hasAttribute('data-kind-save')){save('kindness-'+phase,chosen);return}
  if(b.hasAttribute('data-kind-pin')){save('pin',b.dataset.kindPin);return}
  if(b.hasAttribute('data-kind-wear')){save('wear',b.dataset.kindWear==='true'?'show':'hide');return}
  if(!confirmed&&b.hasAttribute('data-kind-choice')){chosen=b.dataset.kindChoice;dialog.querySelectorAll('[data-kind-choice]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('kindnessSelection').textContent=b.querySelector('strong').textContent+'를 골랐어요.';$('kindnessFeedback').textContent=''}
 });
 return {start,hasStarted,label};
}
