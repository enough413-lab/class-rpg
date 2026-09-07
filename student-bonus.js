(()=>{
const appFrame=document.getElementById('app');
function core(){try{return appFrame.contentDocument?.getElementById('core')?.contentWindow||null}catch{return null}}
async function decorateBonusPopup(){const w=core(),d=w?.document;if(!w||!d||!w.db?.rpc)return;const popup=d.querySelector('.reward-notice-card');if(!popup||popup.dataset.bonusChecked==='1')return;popup.dataset.bonusChecked='1';const token=localStorage.getItem('classRpgStudentToken')||'';if(!token)return;try{const{data,error}=await w.db.rpc('student_dashboard',{p_token:token});if(error)return;const first=(data?.reward_notifications||[])[0];if(first?.kind!=='bonus')return;popup.querySelector('.reward-notice-icon').textContent='🎁';popup.querySelector('h2').textContent='선생님 보너스!';popup.querySelector('p').textContent=`${first.reason||'멋진 활동을 해서 보너스를 받았어요!'}\n경험치와 골드가 지급됐어요.`;const btn=popup.querySelector('.reward-confirm');if(btn)btn.textContent='보너스 확인!' }catch{}}
function install(){const w=core(),d=w?.document;if(!d||d.__bonusObserver)return;d.__bonusObserver=true;new MutationObserver(()=>setTimeout(decorateBonusPopup,20)).observe(d.body,{childList:true,subtree:true});setTimeout(decorateBonusPopup,100)}
appFrame.addEventListener('load',()=>setTimeout(install,700));setInterval(install,3000);
})();
