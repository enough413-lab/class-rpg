(()=>{
const outer=document.getElementById('app');
const BACKUP_KEY='classRpgStudentTokenBackup';
function core(){try{return outer?.contentDocument?.getElementById('core')?.contentWindow||null}catch{return null}}
function isAuthError(msg){return /다시 로그인|로그인이 만료|session|expired|invalid token/i.test(String(msg||''))}
function showTransient(d,text){let el=d.getElementById('sessionHotfixNotice');if(!el){el=d.createElement('div');el.id='sessionHotfixNotice';el.style.cssText='position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:15000;padding:10px 14px;border-radius:999px;background:#fff3d5;color:#755300;font:900 13px system-ui,-apple-system,"Noto Sans KR",sans-serif;box-shadow:0 5px 16px #0002';d.body.appendChild(el)}el.textContent=text;clearTimeout(el._t);el._t=setTimeout(()=>el.remove(),2600)}
function install(){const w=core(),d=w?.document;if(!w||!d||!w.db?.rpc||w.__safeDashboardInstalled)return;const base=w.loadDashboard;if(typeof base!=='function')return;w.__safeDashboardInstalled=true;
  w.loadDashboard=async(...args)=>{
    let token=localStorage.getItem('classRpgStudentToken')||sessionStorage.getItem(BACKUP_KEY)||'';
    if(token){localStorage.setItem('classRpgStudentToken',token);sessionStorage.setItem(BACKUP_KEY,token)}
    if(token){
      try{
        const check=await Promise.race([
          w.db.rpc('student_dashboard',{p_token:token}),
          new Promise(resolve=>setTimeout(()=>resolve({__timeout:true}),5000))
        ]);
        if(check?.__timeout){showTransient(d,'📶 연결이 잠깐 느려요. 로그인은 유지할게요.');return}
        if(check?.error){
          if(isAuthError(check.error.message)){localStorage.removeItem('classRpgStudentToken');sessionStorage.removeItem(BACKUP_KEY);return base(...args)}
          showTransient(d,'📶 데이터를 불러오지 못했어요. 잠시 후 자동으로 다시 시도할게요.');return
        }
      }catch(e){showTransient(d,'📶 인터넷 연결이 불안정해요. 로그인은 유지할게요.');return}
    }
    const result=await base(...args);
    const after=localStorage.getItem('classRpgStudentToken');
    if(after)sessionStorage.setItem(BACKUP_KEY,after);
    return result
  };
  const baseLogout=w.logout;if(typeof baseLogout==='function')w.logout=(...args)=>{sessionStorage.removeItem(BACKUP_KEY);return baseLogout(...args)};
  const current=localStorage.getItem('classRpgStudentToken');if(current)sessionStorage.setItem(BACKUP_KEY,current)
}
outer?.addEventListener('load',()=>setTimeout(install,900));
setInterval(install,2000);
})();