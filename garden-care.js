// A small personal garden toy. Only a device-local watered flag is saved.
const CAN='<svg viewBox="0 0 104 72" aria-hidden="true"><path d="M24 26C-2 11-3 64 26 55" fill="none" stroke="#536f60" stroke-width="7"/><path d="M24 26C2 16 2 60 26 52" fill="none" stroke="#a4c1a3" stroke-width="3"/><path d="M57 43 84 17 96 23 65 58" fill="#9fbea1" stroke="#536f60" stroke-width="3"/><path d="m85 15 14 7-4 7-14-8Z" fill="#dbcf99" stroke="#637b61" stroke-width="2"/><path d="M23 24Q43 16 64 25L66 58Q43 72 21 57Z" fill="#90b897" stroke="#536f60" stroke-width="3"/><ellipse cx="43" cy="25" rx="20" ry="7" fill="#d4dcc0" stroke="#536f60" stroke-width="3"/><path d="M31 25Q43 21 55 25" fill="none" stroke="#5b8068" stroke-width="4"/><path d="M28 36V53" stroke="#c3dbb8" stroke-width="4" stroke-linecap="round"/><path d="M41 42q11-10 16-2-2 12-15 12 4-3 7-9" fill="#e6eac7" stroke="#668462" stroke-width="1.5"/></svg>';
export function installGardenCare(c){
 const doc=c.hub.ownerDocument,status=doc.createElement('p');status.className='garden-care-status';status.setAttribute('role','status');c.hub.querySelector('.hub-help').append(status);
 let owner=null,watered=false,storageOk=true,message='',run=null,sway=null;
 const key=id=>'classRpgGardenCare_v1_'+id;
 function cancel(){sway?.cancel();sway=null;if(!run)return;const old=run;run=null;old.animations.forEach(a=>a.cancel());old.prop.classList.remove('garden-pouring');message='물뿌리개를 내려놓았어요. 다시 해도 좋아요.'}
 function activate(){const id=c.getStudent()?.id;if(owner===id)return;cancel();owner=id;watered=false;storageOk=true;message='';try{const s=JSON.parse(localStorage.getItem(key(id))||'null');watered=s?.v===1&&s.watered===true}catch{storageOk=false}}
 function save(){if(owner==null)return;try{localStorage.setItem(key(owner),JSON.stringify({v:1,watered}))}catch{storageOk=false}}
 function label(kind){activate();if(c.getScene()!=='garden'||kind!=='look-1')return null;return run?'물 주는 중…':watered?'꽃잎 살랑이기':'꽃에 물 주기'}
 function sync(){
  activate();const here=c.getScene()==='garden',prop=here&&c.objects.querySelector('[data-place=look-1]');
  if(run&&(!here||!run.prop.isConnected||c.hub.classList.contains('hidden')||Math.abs(c.getPosition().x-run.x)>.2))cancel();
  status.hidden=!here||!message;const text=message+(storageOk?'':' 이 기기에 저장하지 못했어요.');if(status.textContent!==text)status.textContent=text;
  if(!prop)return;
  if(!prop.querySelector('.garden-care-art')){const art=doc.createElement('span');art.className='garden-care-art';art.setAttribute('aria-hidden','true');art.innerHTML='<span class="garden-can-side"><span class="garden-can">'+CAN+'</span><span class="garden-pour"><i></i><i></i><i></i></span></span><span class="garden-dew"><i></i><i></i><i></i></span><span class="garden-care-memory">물 준 꽃</span>';prop.append(art)}
  prop.classList.toggle('garden-watered',watered);const textLabel=label('look-1');prop.dataset.action=textLabel;prop.setAttribute('aria-label','꽃의 자리 · '+textLabel);const hint=prop.querySelector('.campus-object-action');if(hint.textContent!==textLabel)hint.textContent=textLabel;
 }
 function interact(kind){
  if(c.getScene()!=='garden'||kind!=='look-1')return false;activate();if(run)return true;c.stop();
  if(c.walk.nearby()?.kind!==kind){c.walk.goTo(kind);message='꽃 곁에 도착하면 물 주기를 눌러요.';sync();return true}
  if(doc.getElementById('hubPlayer').hasAttribute('data-jumping')){message='땅에 내려오면 물을 줄 수 있어요.';sync();return true}
  sync();const prop=c.objects.querySelector('[data-place=look-1]');if(!prop)return true;
  if(watered){sway?.cancel();const art=prop.querySelector('.campus-sprite-art');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)sway=art.animate([{rotate:'0deg'},{rotate:'1deg'},{rotate:'-1deg'},{rotate:'0deg'}],{duration:650,iterations:1});message='살랑살랑! 물방울이 꽃잎에서 반짝여요.';sync();return true}
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,duration=reduce?160:1150;
  prop.dataset.careSide=c.getPosition().x<=53?'left':'right';prop.classList.add('garden-pouring');message='졸졸졸… 꽃 아래 흙에 물을 주고 있어요.';
  const can=prop.querySelector('.garden-can'),animations=[can.animate(reduce?[{transform:'none'},{transform:'none'}]:[{offset:0,transform:'translate(0,0) rotate(0deg)'},{offset:.25,transform:'translate(-30%,-45%) rotate(24deg)'},{offset:.8,transform:'translate(-30%,-45%) rotate(24deg)'},{offset:1,transform:'translate(0,0) rotate(0deg)'}],{duration,iterations:1})];
  const upper=doc.querySelector('#hubPlayer .campus-upper');if(!reduce&&upper)animations.push(upper.animate([{rotate:'0deg'},{rotate:'4deg'},{rotate:'4deg'},{rotate:'0deg'}],{duration,iterations:1}));
  if(!reduce)for(const [i,drop]of [...prop.querySelectorAll('.garden-pour i')].entries())animations.push(drop.animate([{offset:0,opacity:0,transform:'translateY(-7px)'},{offset:.25,opacity:0},{offset:.35,opacity:1,transform:'translateY(-7px)'},{offset:.72,opacity:1,transform:'translateY(15px)'},{offset:1,opacity:0,transform:'translateY(20px)'}],{duration:duration-150,delay:i*50,iterations:1}));
  const current={prop,animations,owner,x:c.getPosition().x};run=current;sync();c.refresh();
  animations[0].finished.then(()=>{if(run!==current||owner!==current.owner)return;run=null;prop.classList.remove('garden-pouring');animations.forEach(a=>a.cancel());watered=true;save();message='촉촉해졌어요! 네가 돌본 꽃에 물방울이 남았어요.';sync();c.refresh()}).catch(()=>{});
  return true;
 }
 new MutationObserver(sync).observe(c.objects,{childList:true});
 new MutationObserver(()=>{if(run&&doc.getElementById('hubPlayer').hasAttribute('data-jumping')){cancel();sync()}}).observe(doc.getElementById('hubPlayer'),{attributes:true,attributeFilter:['data-jumping']});
 new MutationObserver(sync).observe(c.hub,{attributes:true,attributeFilter:['class']});
 doc.addEventListener('student-dashboard-updated',()=>{activate();sync()});
 for(const name of ['blur','pagehide'])window.addEventListener(name,()=>{cancel();sync()});doc.addEventListener('visibilitychange',()=>{if(doc.hidden){cancel();sync()}});
 sync();return {interact,label,sync};
}
