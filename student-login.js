const SESSION_KEY='classRpgStudentToken';
let memoryToken='';
export function readStudentSession(){
 for(const name of ['localStorage','sessionStorage'])try{const value=window[name].getItem(SESSION_KEY);if(value)return value}catch{}
 return memoryToken;
}
export function writeStudentSession(value){
 memoryToken=value||'';
 let saved=false;
 for(const name of ['localStorage','sessionStorage'])try{if(value)window[name].setItem(SESSION_KEY,value);else window[name].removeItem(SESSION_KEY);saved=true}catch{}
 return saved;
}
export function installStudentLogin(ctx){
 const doc=ctx.doc||document,$=id=>doc.getElementById(id),select=$('number'),pin=$('pin'),panel=$('login'),start=panel.querySelector('button.primary');
 let busy=false,loading=false,listVersion=0,lockedUntil=null,unlockTimer=0;
 $('loginMsg').setAttribute('role','alert');$('loginMsg').setAttribute('aria-live','polite');
 for(const el of [select,pin])el.setAttribute('aria-describedby','loginMsg');
 const retry=doc.createElement('button');retry.type='button';retry.id='loginListRetry';retry.className='btn';retry.textContent='학생 목록 다시 불러오기';retry.hidden=true;$('loginMsg').after(retry);
 retry.onclick=()=>loadOptions();
 const reveal=doc.createElement('button');reveal.type='button';reveal.id='loginPinPeek';reveal.className='btn';reveal.textContent='누르는 동안 비밀번호 보기';reveal.setAttribute('aria-label','누르는 동안 비밀번호 보기');pin.after(reveal);
 const conceal=()=>{pin.type='password';reveal.setAttribute('aria-pressed','false')};
 const peek=()=>{if(!busy){pin.type='text';reveal.setAttribute('aria-pressed','true')}};
 reveal.addEventListener('pointerdown',event=>{event.preventDefault();peek();try{reveal.setPointerCapture(event.pointerId)}catch{}});
 for(const type of ['pointerup','pointercancel','lostpointercapture','blur'])reveal.addEventListener(type,conceal);
 reveal.addEventListener('keydown',event=>{if(event.code==='Space'||event.key==='Enter'){event.preventDefault();peek()}});
 reveal.addEventListener('keyup',conceal);doc.defaultView.addEventListener('blur',conceal);doc.addEventListener('visibilitychange',()=>{if(doc.hidden)conceal()});pin.addEventListener('blur',conceal);conceal();
 const help=doc.createElement('details');help.id='loginHelp';help.innerHTML='<summary>비밀번호가 기억나지 않아요</summary><p>비밀번호를 계속 찍어 보기보다 선생님께 내 번호를 말하고 비밀번호를 다시 정해 달라고 부탁해 주세요. 친구에게 비밀번호를 알려 주지 않아도 돼요.</p>';panel.append(help);
 const setup=$('setup'),nickname=$('nickname');
 if(setup&&nickname){
  const preview=doc.createElement('section');preview.id='setupPreview';preview.setAttribute('aria-label','확정 전 캐릭터와 이름 미리보기');preview.style.cssText='display:grid;justify-items:center;gap:6px;margin:16px 0;padding:12px;border:1px solid #dbe5de;border-radius:16px';
  const image=doc.createElement('img');image.alt='미리 선택한 캐릭터';image.hidden=true;image.style.cssText='width:90px;height:130px;object-fit:contain';
  const name=doc.createElement('strong'),note=doc.createElement('p');note.textContent='아직 확정하지 않았어요. 이름과 캐릭터를 다시 골라도 좋아요.';note.style.cssText='margin:0;font-size:13px';preview.append(image,name,note);nickname.closest('.field').after(preview);
  const render=()=>{name.textContent=nickname.value.trim()||'내 닉네임을 적어 주세요';const chosen=setup.querySelector('.gender.selected img');image.hidden=!chosen;if(chosen)image.src=chosen.src};
  nickname.addEventListener('input',render);setup.addEventListener('click',()=>queueMicrotask(render));render();
 }
 const style=doc.createElement('style');style.textContent='#loginPinPeek{margin-top:8px;width:100%;font-size:13px;min-height:44px}#loginHelp{text-align:left;margin-top:14px;font-size:14px}#loginHelp summary{cursor:pointer;min-height:44px;display:flex;align-items:center}#loginListRetry{margin:4px 0 12px;width:100%;min-height:44px}';doc.head.append(style);
 function message(text,ok=false){const el=$('loginMsg');el.textContent=text;el.className='message '+(ok?'ok':'error')}
 function invalid(el,text){message(text);el.setAttribute('aria-invalid','true');el.focus()}
 for(const el of [select,pin])el.addEventListener('input',()=>el.removeAttribute('aria-invalid'));
 function sync(){start.disabled=busy||loading;select.disabled=busy||loading||!select.querySelector('option[value]:not([value=""])');pin.disabled=busy;reveal.disabled=busy;retry.disabled=busy||loading;panel.setAttribute('aria-busy',String(busy||loading));start.textContent=busy?'입장 확인 중…':'게임 시작!'}
 function showLock(){
  clearTimeout(unlockTimer);if(!lockedUntil)return;
  const time=Date.parse(lockedUntil);if(!Number.isFinite(time)){lockedUntil=null;return}
  const formatted=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(time));
  message('잠시 쉬었다가 '+formatted+' 이후에 다시 시도해 주세요. (한국시간)');
  // The server always enforces the lock; this timer only refreshes the message.
  unlockTimer=setTimeout(()=>{lockedUntil=null;message('이제 다시 비밀번호를 입력해 볼 수 있어요. 선생님께 도움을 받아도 좋아요.')},Math.max(0,time-Date.now()));
 }
 async function loadOptions(){
  if(loading||busy)return;const version=++listVersion;loading=true;retry.hidden=true;select.replaceChildren(new Option('계정을 불러오는 중…',''));sync();
  try{
   const {data,error}=await ctx.db.rpc('student_login_options');if(error)throw error;if(!Array.isArray(data))throw Error('missing options');if(version!==listVersion)return;
   select.replaceChildren(new Option('번호와 이름을 골라요',''));
   const studentGroup=doc.createElement('optgroup');studentGroup.label='학생 계정';const testGroup=doc.createElement('optgroup');testGroup.label='선생님 테스트 계정';
   for(const row of data){const testing=[97,98,99].includes(Number(row.student_number));const option=new Option(row.student_number+'번'+(row.nickname?' · '+row.nickname:'')+(testing?' · 선생님 테스트':''),row.login_id);(testing?testGroup:studentGroup).append(option)}
   if(studentGroup.children.length)select.append(studentGroup);if(testGroup.children.length)select.append(testGroup);
   message(data.length?'':'아직 학생 계정이 없어요. 선생님께 내 계정을 만들어 달라고 부탁해 주세요.');
  }catch{if(version===listVersion){select.replaceChildren(new Option('학생 목록을 아직 불러오지 못했어요',''));message('연결이 잠깐 끊겼어요. 아래 버튼으로 학생 목록을 다시 불러와 주세요.');retry.hidden=false}}
  finally{if(version===listVersion){loading=false;sync()}}
 }
 async function login(){
  if(busy||loading)return;
  if(!select.value)return invalid(select,'내 번호를 골라 주세요.');
  if(!/^\d{4}$/.test(pin.value))return invalid(pin,'비밀번호 숫자 4자리를 입력해 주세요.');
  conceal();busy=true;sync();message('입장하는 중…',true);
  try{
   const {data,error}=await ctx.db.rpc('student_login',{p_login_id:select.value,p_pin:pin.value});if(error)throw error;
   const result=Array.isArray(data)?data[0]:null;
   if(!result?.session_token||!result?.student_data?.id){
    const failure=result?.student_data;lockedUntil=failure?.locked_until||null;
    if(lockedUntil)showLock();else invalid(pin,failure?.login_error||'입장을 확인하지 못했어요. 번호와 비밀번호를 다시 확인해 주세요.');return;
   }
   clearTimeout(unlockTimer);lockedUntil=null;
   const durable=writeStudentSession(result.session_token);ctx.setToken(result.session_token);
   pin.value='';await ctx.enter(result.student_data);
   if(!durable)ctx.storageNotice?.('이 기기에서는 로그인을 보관하지 못해요. 창을 새로 열면 다시 들어와 주세요.');
  }catch(error){message(error?.code==='P0001'?error.message:'연결이 잠깐 끊겼어요. 다시 입장해 주세요.');}
  finally{busy=false;sync();if(!ctx.getToken())pin.focus()}
 }
 sync();return {login,loadOptions,conceal};
}
