// A picture book in the existing window seat. Saves only this device's bookmark.
const PAGES=[
 {title:'작은 씨앗',art:'<circle cx="31" cy="23" r="9" fill="#efce77"/><path d="M12 44Q31 35 50 44V57H12Z" fill="#c8d5a2"/><path d="M22 49Q29 35 36 43Q38 53 22 49Z" fill="#9d7653"/><path d="M81 36v16m0-11q-16-18-17-2 7 8 17 2m0-4q13-17 16-5-3 10-16 5" fill="#91b58a" stroke="#567e61" stroke-width="2"/>'},
 {title:'비를 만나요',art:'<path d="M13 23q-3-12 9-12 8-12 16 0 16-3 15 12Z" fill="#b1cfca"/><path d="m21 30-3 7m17-7-3 7m16-7-3 7" stroke="#6fadb3" stroke-width="3" stroke-linecap="round"/><path d="M80 48V24m0 12q-20-19-20-4 9 10 20 4m0-8q18-18 19-4-8 11-19 4" fill="#89b781" stroke="#567e61" stroke-width="2"/><path d="M64 52q17-8 34 0" fill="none" stroke="#b19770" stroke-width="3"/>'},
 {title:'꽃이 피었어요',art:'<path d="M31 53V29m0 14q-17-15-16-3 7 8 16 3m0-4q17-15 16-2-7 8-16 2" fill="#8cad78" stroke="#567e61" stroke-width="2"/><path d="M31 29C11 31 12 12 26 19 17 3 40 2 36 18 49 6 58 26 40 28 47 44 25 45 31 29Z" fill="#e6a087"/><circle cx="34" cy="26" r="6" fill="#ebcc78"/><path d="M80 28C52 5 57 40 78 34 65 52 98 57 83 32 109 39 105 7 80 28Z" fill="#d6b4ca" stroke="#927c91" stroke-width="1.5"/><path d="m79 26 4 16m-4-16-5-5m5 5 5-7" fill="none" stroke="#71645d" stroke-width="2"/>'}
];
const CLOSED='<svg viewBox="0 0 120 76" aria-hidden="true"><path d="m24 21 65-8 11 42-65 9Q23 59 24 51Z" fill="#efe5c2" stroke="#765e46" stroke-width="2"/><path d="m22 16 65-8 12 42-65 9Z" fill="#819d79" stroke="#4e6c59" stroke-width="3"/><path d="m29 16 12 40" stroke="#c9d5a6" stroke-width="2"/><path d="M64 27Q43 13 46 33 52 39 64 27Q71 9 78 23 78 30 64 27Z" fill="#d9deaa"/><path d="m61 33 4 8" stroke="#d9deaa" stroke-width="2"/><path d="m72 55 2 15 6-4 6 3-4-16" fill="#cf9879" stroke="#947055" stroke-width="1.5"/></svg>';
function opened(page){return '<svg viewBox="0 0 120 76" aria-hidden="true"><path d="M3 15Q32 3 60 14 88 3 117 15V66Q87 57 60 68 32 57 3 66Z" fill="#8ba280" stroke="#4e6c59" stroke-width="3"/><path d="M7 11Q33 1 59 13V63Q33 53 7 62ZM61 13Q87 1 113 11V62Q87 53 61 63Z" fill="#fff4d8" stroke="#c5b793" stroke-width="1.5"/><g class="nook-picture">'+PAGES[page].art+'</g><path d="M60 14v50" stroke="#a59271" stroke-width="2"/><path class="nook-page-leaf" d="M62 14Q87 2 113 11V62Q87 53 62 63Z" fill="#fff7e0" opacity="0"/></svg>'}
export function installLibraryNook(c){
 const doc=c.hub.ownerDocument,player=doc.getElementById('hubPlayer');
 const book=doc.createElement('button');book.type='button';book.className='nook-book';c.stage.append(book);
 const help=doc.createElement('div');help.className='nook-help';help.hidden=true;
 const status=doc.createElement('span');status.setAttribute('role','status');help.append(status);
 const close=doc.createElement('button');close.type='button';close.className='nook-close';close.textContent='책 덮기';help.append(close);c.hub.querySelector('.hub-help').append(help);
 let owner=null,page=0,seen=false,reading=false,at=0,message='',storageOk=true,paint='',animations=[];
 const key=id=>'classRpgLibraryNook_v1_'+id;
 function stopAnimation(){animations.forEach(a=>a.cancel());animations=[]}
 function shut(){stopAnimation();reading=false;message=seen?'책갈피를 꽂아 두었어요.':''}
 function activate(){
  const id=c.getStudent()?.id;if(id===owner)return;shut();owner=id;page=0;seen=false;storageOk=true;message='';
  if(id==null)return;
  try{const s=JSON.parse(localStorage.getItem(key(id))||'null');if(s?.v===1&&Number.isInteger(s.page)&&s.page>=0&&s.page<PAGES.length){page=s.page;seen=s.seen===true}}catch{storageOk=false}
 }
 function save(){if(owner==null)return;try{localStorage.setItem(key(owner),JSON.stringify({v:1,page,seen:true}))}catch{storageOk=false}}
 function label(kind){activate();return c.getScene()==='library'&&kind==='nook'?(reading?(page===2?'첫 장 다시 보기':'그림책 장 넘기기'):(seen?'보던 그림책 펼치기':'그림책 펼치기')):null}
 function sync(){
  activate();const here=c.getScene()==='library'&&!c.hub.classList.contains('hidden');
  if(reading&&(!here||Math.abs(c.getPosition().x-at)>.15||player.hasAttribute('data-jumping')))shut();
  book.hidden=!here;help.hidden=!here||!message;close.hidden=!reading;
  book.classList.toggle('is-open',reading);book.classList.toggle('has-bookmark',seen);
  const nextPaint=reading?'open-'+page:'closed-'+seen;
  if(paint!==nextPaint){paint=nextPaint;book.innerHTML='<svg class="nook-stand" viewBox="0 0 90 46" aria-hidden="true"><path d="M19 5 10 43m61-38 9 38M14 32h62" fill="none" stroke="#795c42" stroke-width="6" stroke-linecap="round"/><path d="M7 6Q44 0 83 6v8H7Z" fill="#c19a64" stroke="#795c42" stroke-width="2"/></svg><span class="nook-pages">'+(reading?opened(page):CLOSED)+'</span>'+(seen&&!reading?'<span class="nook-bookmark">책갈피</span>':'');book.setAttribute('aria-label',reading?'그림책 · '+PAGES[page].title:seen?'책갈피가 꽂힌 그림책':'창가에 놓인 그림책')}
  book.setAttribute('aria-label',(reading?PAGES[page].title+' · ':'창가 그림책 · ')+(label('nook')||'그림책 펼치기'));
  const text=message+(storageOk?'':' 이 기기에 책갈피를 저장하지 못했어요.');if(status.textContent!==text)status.textContent=text;
  const prop=here&&c.objects.querySelector('[data-place=nook]');if(prop){const action=label('nook');prop.dataset.action=action;prop.setAttribute('aria-label','창가 쉼터 · '+action);const hint=prop.querySelector('.campus-object-action');if(hint.textContent!==action)hint.textContent=action}
 }
 function interact(kind){
  if(c.getScene()!=='library'||kind!=='nook')return false;activate();c.stop();
  // The book is a fixed world object, so approach the seat before touching it.
  if(Math.abs(c.getPosition().x-79)>1){c.walk.goTo(kind);message='창가에 도착하면 그림책을 펼쳐요.';sync();return true}
  if(player.hasAttribute('data-jumping')){message='땅에 내려오면 책을 펼칠 수 있어요.';sync();return true}
  stopAnimation();page=reading?(page+1)%PAGES.length:page;reading=true;seen=true;at=c.getPosition().x;player.dataset.facing='right';save();
  message=PAGES[page].title+' · '+(page+1)+' / '+PAGES.length;sync();
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
   const leaf=book.querySelector('.nook-page-leaf');animations.push(leaf.animate([{opacity:.95,transform:'scaleX(1)'},{opacity:.8,transform:'scaleX(.06)'},{opacity:0,transform:'scaleX(0)'}],{duration:360,easing:'ease-out'}));
   const upper=player.querySelector('.campus-upper');if(upper)animations.push(upper.animate([{rotate:'0deg'},{rotate:'3deg'},{rotate:'0deg'}],{duration:360}));
  }
  c.refresh();return true;
 }
 book.onclick=()=>interact('nook');
 close.onclick=()=>{shut();sync();c.refresh();c.hub.querySelector('[data-campus=use]').focus({preventScroll:true})};
 new MutationObserver(sync).observe(c.objects,{childList:true});
 new MutationObserver(sync).observe(player,{attributes:true,attributeFilter:['data-jumping']});
 new MutationObserver(sync).observe(c.hub,{attributes:true,attributeFilter:['class']});
 doc.addEventListener('student-dashboard-updated',()=>{activate();sync()});
 for(const name of ['blur','pagehide'])window.addEventListener(name,()=>{shut();sync()});
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden){shut();sync()}});
 sync();return{interact,label,sync};
}
