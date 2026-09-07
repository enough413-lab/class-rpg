const frame=document.getElementById('app');
const IDLE_LIMIT=30*60*1000;
const AUTO_REFRESH_MS=90*1000;
const APP_VERSION='v0.9.8';
let idleTimer,refreshTimer;

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

async function autoRefresh(){
  const core=getCore();
  const d=core?.document;
  if(!core||!d||document.hidden)return;
  const dashboard=d.getElementById('dashboard');
  if(!dashboard||dashboard.classList.contains('hidden'))return;
  if(d.querySelector('.modal-backdrop:not(.hidden)'))return;
  if(['INPUT','TEXTAREA','SELECT'].includes(d.activeElement?.tagName))return;
  if(typeof core.loadDashboard!=='function')return;
  try{await core.loadDashboard()}catch{}
}

function install(){
  try{
    installNetworkBanner();
    const coreFrame=frame.contentDocument?.getElementById('core');
    if(coreFrame&&!coreFrame.__runtimeHooked){
      coreFrame.__runtimeHooked=true;
      coreFrame.addEventListener('load',()=>setTimeout(()=>{installCorePolish();installBusyGuard()},150));
    }
    setTimeout(()=>{installCorePolish();installBusyGuard()},500);
  }catch(e){console.error(e)}
}

['click','keydown','pointerdown','touchstart'].forEach(type=>window.addEventListener(type,resetIdle,{passive:true}));
frame.addEventListener('load',install);
window.addEventListener('focus',()=>setTimeout(autoRefresh,300));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(autoRefresh,300)});
resetIdle();
clearInterval(refreshTimer);
refreshTimer=setInterval(autoRefresh,AUTO_REFRESH_MS);
