const frame=document.getElementById('app');
const IDLE_LIMIT=30*60*1000;
const AUTO_REFRESH_MS=90*1000;
const NOTICE_POLL_MS=20*1000;
const APP_VERSION='v0.9.11';
let idleTimer,refreshTimer,noticeTimer,noticeShowing=false,retryReviewId=null;

function resetIdle(){
  clearTimeout(idleTimer);
  idleTimer=setTimeout(()=>{
    try{frame.contentWindow.localStorage.removeItem('classRpgStudentToken')}catch{}
    location.reload();
  },IDLE_LIMIT);
}

function getCore(){
  try{
    const appDoc=frame.contentDocument;
    const coreFrame=appDoc?.getElementById('core');
    return coreFrame?.contentWindow||null;
  }catch{return null}
}

function installCorePolish(){
  const core=getCore();
  const d=core?.document;
  if(!d||d.getElementById('runtimePolish'))return;
  const s=d.createElement('style');
  s.id='runtimePolish';
  s.textContent=`
    .profile{grid-template-columns:280px minmax(0,1fr)!important}
    .avatar-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}
    .avatar-actions .btn{width:100%!important;min-width:0!important;white-space:nowrap!important;word-break:keep-all!important;font-size:13px!important;letter-spacing:-.2px!important;padding:10px 4px!important}
    .avatar-actions .map-btn{grid-column:1/-1!important;font-size:13px!important;padding:11px 6px!important}
    .quest-head>button[onclick="loadDashboard()"]{display:none!important}
    .rpg-version{position:fixed;right:10px;bottom:8px;z-index:60;padding:4px 7px;border-radius:999px;background:#ffffffcc;border:1px solid #eadfd5;color:#9a8d84;font-size:10px;font-weight:800;pointer-events:none}
    .reward-notice-backdrop{position:fixed;inset:0;z-index:13000;display:grid;place-items:center;padding:18px;background:#2d254b99}
    .reward-notice-card{position:relative;width:min(430px,100%);padding:24px;border:3px solid #f1c15c;border-radius:26px;background:linear-gradient(145deg,#fffdf6,#f4f0ff);box-shadow:0 24px 70px #251a3b66;text-align:center;animation:rewardNoticePop .35s cubic-bezier(.2,1.25,.45,1)}
    .reward-notice-card.rejected{border-color:#ee9aa7;background:linear-gradient(145deg,#fff7f8,#f7f2ff)}
    .reward-notice-close{position:absolute;right:13px;top:11px;width:34px;height:34px!important;min-width:34px!important;padding:0!important;border-radius:50%!important;background:#eee8ff!important;color:#5b50bd!important;font-size:18px!important;line-height:34px!important}
    .reward-notice-icon{font-size:58px}.reward-notice-card h2{margin:8px 0 6px}.reward-notice-card p{margin:0;color:#6f625a;line-height:1.6}.reward-chips{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin:16px 0}.reward-chip{padding:8px 11px;border-radius:999px;background:#fff3d5;color:#946000;font-weight:900}.reward-notice-card .reward-confirm{border:0;border-radius:13px;padding:11px 18px;background:#e4f7ed;color:#18784c;font:900 15px system-ui,-apple-system,"Noto Sans KR",sans-serif;cursor:pointer}.reward-notice-card.rejected .reward-confirm{background:#ffe8ec;color:#a72e44}
    .reading-retry-btn{margin-top:9px;border:0;border-radius:11px;padding:8px 11px;background:#fff0f3;color:#a33650;font-weight:900;cursor:pointer}
    .reading-entry.retrying{outline:2px solid #ee9aa7;outline-offset:2px}
    @keyframes rewardNoticePop{from{opacity:0;transform:scale(.76)}to{opacity:1;transform:scale(1)}}
    @media(max-width:650px){.profile{grid-template-columns:1fr!important}}
    @media(max-width:520px){.avatar-actions{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
  `;
  d.head.appendChild(s);
  const version=d.createElement('div');
  version.className='rpg-version';
  version.textContent=APP_VERSION;
  d.body.appendChild(version);
}

function installNetworkBanner(){
  const appDoc=frame.contentDocument;
  if(!appDoc||appDoc.querySelector('.network-banner'))return;
  const s=appDoc.createElement('style');
  s.textContent='.network-banner{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:9999;padding:9px 14px;border-radius:999px;background:#fff3d5;color:#7a5600;font-weight:900;box-shadow:0 5px 16px #0002}.network-banner.hidden{display:none!important}';
  appDoc.head.appendChild(s);
  const banner=appDoc.createElement('div');
  banner.className='network-banner hidden';
  banner.textContent='📶 인터넷 연결이 불안정해요. 연결되면 자동으로 다시 이용할 수 있어요.';
  appDoc.body.appendChild(banner);
  const sync=()=>banner.classList.toggle('hidden',frame.contentWindow.navigator.onLine);
  frame.contentWindow.addEventListener('online',sync);
  frame.contentWindow.addEventListener('offline',sync);
  sync();
}

function installBusyGuard(){
  const core=getCore();
  const d=core?.document;
  if(!d||d.__busyGuard)return;
  d.__busyGuard=true;
  d.addEventListener('click',e=>{
    const btn=e.target.closest('button');
    if(!btn||btn.disabled||btn.dataset.busy==='1')return;
    if(btn.matches('.shop-item .btn,.quest .btn.good,.reading-form .btn.good')){
      btn.dataset.busy='1';
      const old=btn.textContent;
      btn.disabled=true;
      setTimeout(()=>{btn.dataset.busy='0';btn.disabled=false;btn.textContent=old},1800);
    }
  },true);
}

function noticeView(notice){
  const approved=notice.status==='approved';
  const reading=notice.kind==='reading';
  if(approved&&reading)return{icon:'📚',title:'독후감 승인!',text:`“${notice.title||'독후감'}”이 선생님 승인을 받았어요!\n경험치와 골드가 지급됐어요.`,button:'보상 확인!'};
  if(approved)return{icon:'🏆',title:'퀘스트 완료!',text:`“${notice.title||'퀘스트'}”가 선생님 승인을 받았어요!\n경험치와 골드가 지급됐어요.`,button:'보상 확인!'};
  if(reading)return{icon:'📝',title:'독후감이 반려됐어요',text:`“${notice.title||'독후감'}”을 조금 고쳐서 다시 제출해 주세요.\n반려된 독후감은 다시 도전할 수 있어요!`,button:'확인하고 다시 도전!'};
  return{icon:'↩️',title:'퀘스트가 반려됐어요',text:`“${notice.title||'퀘스트'}”를 다시 확인해 주세요.\n반려된 퀘스트는 바로 다시 도전할 수 있어요!`,button:'확인하고 다시 도전!'};
}

async function showRewardQueue(notices){
  if(noticeShowing||!Array.isArray(notices)||!notices.length)return;
  const core=getCore();
  const d=core?.document;
  if(!core||!d)return;
  noticeShowing=true;
  try{
    for(const notice of notices){
      const approved=notice.status==='approved';
      const view=noticeView(notice);
      d.getElementById('rewardNoticeBackdrop')?.remove();
      const back=d.createElement('div');
      back.id='rewardNoticeBackdrop';
      back.className='reward-notice-backdrop';
      back.innerHTML=`<section class="reward-notice-card ${approved?'':'rejected'}" role="dialog" aria-modal="true"><button class="reward-notice-close" aria-label="닫기">✕</button><div class="reward-notice-icon">${view.icon}</div><h2>${view.title}</h2><p></p>${approved?`<div class="reward-chips"><span class="reward-chip">✨ +${Number(notice.xp||0)} XP</span><span class="reward-chip">🪙 +${Number(notice.gold||0)} G</span></div>`:'<div style="height:12px"></div>'}<button class="reward-confirm">${view.button}</button></section>`;
      back.querySelector('p').textContent=view.text;
      d.body.appendChild(back);
      await new Promise(resolve=>{
        const close=()=>resolve();
        back.querySelector('.reward-notice-close').onclick=close;
        back.querySelector('.reward-confirm').onclick=close;
      });
      try{
        const token=localStorage.getItem('classRpgStudentToken')||'';
        if(token&&core.db?.rpc){
          const id=Number(notice.id||notice.submission_id);
          const kind=notice.kind||'quest';
          const{error}=await core.db.rpc('student_ack_notification',{p_token:token,p_kind:kind,p_id:id});
          if(error&&kind==='quest'&&notice.submission_id)await core.db.rpc('student_ack_reward_notification',{p_token:token,p_submission_id:notice.submission_id});
        }
      }catch{}
      back.remove();
    }
  }finally{
    d.getElementById('rewardNoticeBackdrop')?.remove();
    noticeShowing=false;
  }
  try{if(typeof core.loadDashboard==='function')await core.loadDashboard()}catch{}
  setTimeout(()=>{pollRewardNotices();decorateReadingRetries()},50);
}

async function pollRewardNotices(){
  if(noticeShowing||document.hidden)return;
  const core=getCore();
  const d=core?.document;
  if(!core||!d||!core.db?.rpc)return;
  const dashboard=d.getElementById('dashboard');
  if(!dashboard||dashboard.classList.contains('hidden'))return;
  if(d.querySelector('.modal-backdrop:not(.hidden),.reward-notice-backdrop'))return;
  const token=localStorage.getItem('classRpgStudentToken')||'';
  if(!token)return;
  try{
    const{data,error}=await core.db.rpc('student_dashboard',{p_token:token});
    if(error)return;
    const notices=Array.isArray(data?.reward_notifications)?data.reward_notifications:[];
    if(notices.length)await showRewardQueue(notices);
  }catch{}
}

async function decorateReadingRetries(){
  const core=getCore();
  const d=core?.document;
  if(!core||!d||!core.db?.rpc)return;
  const history=d.getElementById('readingHistory');
  if(!history||!d.getElementById('readingPortfolioModal')||d.getElementById('readingPortfolioModal').classList.contains('hidden'))return;
  const token=localStorage.getItem('classRpgStudentToken')||'';
  if(!token)return;
  try{
    const{data,error}=await core.db.rpc('student_reading_reviews_v2',{p_token:token});
    if(error||!Array.isArray(data))return;
    const entries=[...history.querySelectorAll('.reading-entry')];
    entries.forEach((entry,i)=>{
      const r=data[i];
      if(!r||r.status!=='rejected'||entry.querySelector('.reading-retry-btn'))return;
      const btn=d.createElement('button');
      btn.className='reading-retry-btn';
      btn.textContent='↩️ 수정해서 다시 제출하기';
      btn.onclick=()=>{
        retryReviewId=r.review_id;
        entries.forEach(x=>x.classList.remove('retrying'));
        entry.classList.add('retrying');
        d.getElementById('readingBookTitle').value=r.book_title||'';
        d.getElementById('readingDate').value=r.read_date||'';
        d.getElementById('readingSummary').value=r.summary||'';
        d.getElementById('readingThought').value=r.thoughts||'';
        d.getElementById('readingRating').value=String(r.recommendation_rating||5);
        d.getElementById('readingRecommendation').value=r.recommendation_reason||'';
        const msg=d.getElementById('readingPortfolioMsg');
        if(msg){msg.className='message ok';msg.textContent='반려된 독후감을 수정해서 다시 제출해 주세요. 다시 제출해도 이번 주 3편 제한에 새로 추가되지 않아요.'}
        d.querySelector('.reading-form')?.scrollIntoView({behavior:'smooth',block:'start'});
      };
      entry.appendChild(btn);
    });
  }catch{}
}

function installReadingRetry(){
  const core=getCore();
  const d=core?.document;
  if(!core||!d||core.__readingRetryInstalled)return;
  core.__readingRetryInstalled=true;
  const baseOpen=core.openReadingPortfolio;
  if(typeof baseOpen==='function')core.openReadingPortfolio=async(...args)=>{
    retryReviewId=null;
    const out=await baseOpen(...args);
    setTimeout(decorateReadingRetries,120);
    return out;
  };
  const baseSave=core.saveReadingEntry;
  if(typeof baseSave==='function')core.saveReadingEntry=async(...args)=>{
    if(!retryReviewId)return baseSave(...args);
    const title=d.getElementById('readingBookTitle')?.value?.trim()||'';
    const date=d.getElementById('readingDate')?.value||'';
    const summary=d.getElementById('readingSummary')?.value?.trim()||'';
    const thoughts=d.getElementById('readingThought')?.value?.trim()||'';
    const rating=Number(d.getElementById('readingRating')?.value||5);
    const reason=d.getElementById('readingRecommendation')?.value?.trim()||'';
    const msg=d.getElementById('readingPortfolioMsg');
    if(!title||!date||!summary||!thoughts||!reason){if(msg){msg.className='message error';msg.textContent='모든 항목을 적어 주세요.'}return}
    if(msg){msg.className='message ok';msg.textContent='수정한 독후감을 다시 제출하는 중...'}
    const token=localStorage.getItem('classRpgStudentToken')||'';
    const{error}=await core.db.rpc('student_retry_reading_review',{p_token:token,p_review_id:retryReviewId,p_book_title:title,p_read_date:date,p_summary:summary,p_thoughts:thoughts,p_recommendation_rating:rating,p_recommendation_reason:reason});
    if(error){if(msg){msg.className='message error';msg.textContent=error.message}return}
    retryReviewId=null;
    if(msg){msg.className='message ok';msg.textContent='다시 제출했어요! 선생님 확인을 기다려 주세요.'}
    setTimeout(()=>core.openReadingPortfolio(),450);
  };
  const history=d.getElementById('readingHistory');
  if(history)new MutationObserver(()=>setTimeout(decorateReadingRetries,30)).observe(history,{childList:true,subtree:true});
}

async function autoRefresh(){
  const core=getCore();
  const d=core?.document;
  if(!core||!d||document.hidden)return;
  const dashboard=d.getElementById('dashboard');
  if(!dashboard||dashboard.classList.contains('hidden'))return;
  if(d.querySelector('.modal-backdrop:not(.hidden),.reward-notice-backdrop'))return;
  if(['INPUT','TEXTAREA','SELECT'].includes(d.activeElement?.tagName))return;
  if(typeof core.loadDashboard!=='function')return;
  try{await core.loadDashboard();await pollRewardNotices()}catch{}
}

function install(){
  try{
    installNetworkBanner();
    const coreFrame=frame.contentDocument?.getElementById('core');
    if(coreFrame&&!coreFrame.__runtimeHooked){
      coreFrame.__runtimeHooked=true;
      coreFrame.addEventListener('load',()=>setTimeout(()=>{installCorePolish();installBusyGuard();installReadingRetry();pollRewardNotices()},150));
    }
    setTimeout(()=>{installCorePolish();installBusyGuard();installReadingRetry();pollRewardNotices()},500);
  }catch(e){console.error(e)}
}

['click','keydown','pointerdown','touchstart'].forEach(type=>window.addEventListener(type,resetIdle,{passive:true}));
frame.addEventListener('load',install);
window.addEventListener('focus',()=>setTimeout(()=>{autoRefresh();pollRewardNotices()},300));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>{autoRefresh();pollRewardNotices()},300)});
resetIdle();
clearInterval(refreshTimer);
clearInterval(noticeTimer);
refreshTimer=setInterval(autoRefresh,AUTO_REFRESH_MS);
noticeTimer=setInterval(pollRewardNotices,NOTICE_POLL_MS);
