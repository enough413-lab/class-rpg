// Personal play memory only. No school rewards, purchases or server records.
const PENCIL='<svg viewBox="0 0 100 34" aria-hidden="true"><path d="M8 17 25 6H83Q93 6 93 17T83 28H25Z" fill="#edc86f" stroke="#795c39" stroke-width="2"/><path d="M25 6V28M78 6V28M83 6V28" stroke="#a88448" stroke-width="2"/><path d="M8 17 25 6V28Z" fill="#f4dfb8"/><path d="m8 17 8-5v10Z" fill="#535d4b"/><path d="M83 7H87Q92 7 92 17T87 27H83Z" fill="#db9c8b"/><path d="M30 12H72" stroke="#fff1bf" stroke-width="3" stroke-linecap="round"/></svg>';
export function installMomoFavor(c){
 const doc=c.hub.ownerDocument,player=doc.getElementById('hubPlayer'),status=doc.createElement('p');status.className='momo-favor-status';status.setAttribute('role','status');c.hub.querySelector('.hub-help').append(status);
 let owner=null,phase=0,storageOk=true;
 const key=id=>'classRpgMomoFavor_v1_'+id;
 function activate(){const next=c.getStudent()?.id;if(next===owner)return;owner=next;phase=0;storageOk=true;try{const s=JSON.parse(localStorage.getItem(key(owner))||'null');if(s?.v===1&&Number.isInteger(s.phase)&&s.phase>=0&&s.phase<=3)phase=s.phase}catch{}}
 function save(){try{localStorage.setItem(key(owner),JSON.stringify({v:1,phase}))}catch{storageOk=false}}
 function sync(){activate();const floor=c.hub.querySelector('[data-place=pencil]');if(floor&&floor.hidden!==(phase!==1))floor.hidden=phase!==1;
  let held=player.querySelector('.momo-held');if(phase===2&&!held){held=doc.createElement('span');held.className='momo-held';held.setAttribute('aria-hidden','true');held.innerHTML=PENCIL;player.append(held)}if(held&&held.hidden!==(phase!==2))held.hidden=phase!==2;
  const shop=c.hub.querySelector('[data-place=shop]');if(shop){let returned=shop.querySelector('.momo-returned');if(phase===3&&!returned){returned=doc.createElement('span');returned.className='momo-returned';returned.setAttribute('aria-hidden','true');returned.innerHTML=PENCIL;shop.append(returned)}if(returned&&returned.hidden!==(phase!==3))returned.hidden=phase!==3;}
  status.hidden=phase===0||c.getScene()!=='classroom';let message=phase===1?'모모의 부탁 · 옷장 왼쪽에서 연필을 찾아요.':phase===2?'모모의 부탁 · 들고 있는 연필을 모모에게 돌려줘요.':'모모가 네 도움을 기억하고 있어요.';if(!storageOk)message+=' 이 기기에는 기억을 저장하지 못했어요.';if(status.textContent!==message)status.textContent=message;
 }
 function dialogue(){activate();return phase===0?{text:'앗, 내 연필이 없어졌네! 옷장 왼쪽에 떨어진 것 같아. 찾아줄래?',action:'momo-accept',label:'내가 찾아줄게요'}:phase===1?{text:'옷장 왼쪽 바닥을 살펴봐 줄래? 노란 연필이 있을 거야.',action:'momo-go',label:'연필을 찾으러 갈게요'}:phase===2?{text:'내 연필을 찾았구나! 여기로 가져와 줄래?',action:'momo-return',label:'모모에게 연필 건네기'}:{text:'네가 찾아준 연필로 오늘도 가격표를 썼어. 도와줘서 고마워!',action:'momo-thanks',label:'찾아서 다행이야!'};}
 function action(a){activate();if(a==='momo-accept'&&phase===0){phase=1;save();sync();c.refresh()}else if(a==='momo-go'&&phase===1)c.walk.goTo('pencil');else if(a==='momo-return'&&phase===2){if(c.walk.nearby()?.kind!=='shop'){c.walk.goTo('shop');return false}phase=3;save();sync();c.refresh();return true}return false}
 function inspect(){activate();if(phase!==1)return;if(c.walk.nearby()?.kind!=='pencil'){c.walk.goTo('pencil');return}phase=2;save();sync();c.refresh()}
 new MutationObserver(sync).observe(c.objects,{childList:true});new MutationObserver(sync).observe(player,{childList:true});doc.addEventListener('student-dashboard-updated',sync);sync();
 return{dialogue,action,inspect,sync,goal:()=>{activate();return c.getScene()!=='classroom'?null:phase===1?{kind:'pencil',x:16,label:'모모의 연필'}:phase===2?{kind:'shop',x:82,label:'모모'}:null},visible:()=>{activate();return phase===1}};
}
export function decorateMomoPencil(b){b.classList.add('momo-pencil');b.dataset.walkX='16';b.setAttribute('aria-label','모모의 노란 연필 · 줍기');b.innerHTML=PENCIL+'<span class="campus-object-caption"><b>모모의 연필</b><small>줍기</small></span>'}
