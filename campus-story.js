// Read-only reactions to the parcel's server-confirmed progress.
export function installCampusStory({objects,guide}){
 const title=guide.querySelector('#campusGuideTitle'),speech=guide.querySelector('.campus-greeting p'),choice=guide.querySelector('[data-guide=parcel]');
 const original={title:title.textContent,speech:speech.innerHTML,label:choice.querySelector('b').textContent,note:choice.querySelector('span').textContent};
 function render({loaded=false,phase=0}={}){
  const state=loaded&&phase===3?'complete':loaded&&phase===2?'delivery':'none';
  guide.dataset.parcelStory=state;
  title.textContent=state==='complete'?'다시 와 줬구나!':state==='delivery'?'내 책 꾸러미를 찾았구나!':original.title;
  speech.innerHTML=state==='complete'?'네가 가져온 꾸러미로 책 나눔 준비를 마쳤어.<br>다음 친구에게 소개할 책을 함께 골라 볼까?':state==='delivery'?'책 봉인과 잎 장식을 따라 여기까지 왔네.<br>가져온 꾸러미를 내게 건네줄래?':original.speech;
  choice.querySelector('b').textContent=state==='complete'?'🌿 책 나눔 기념 책갈피':state==='delivery'?'📦 토리에게 꾸러미 전해 주기':original.label;
  choice.querySelector('span').textContent=state==='complete'?'함께 준비한 날의 기억을 다시 펼쳐요.':state==='delivery'?'직접 찾아온 마지막 발자국을 남겨요.':original.note;
  const tori=objects.querySelector('[data-place=tori]');if(!tori)return;
  tori.dataset.parcelStory=state;
  let bubble=tori.querySelector('.campus-story-bubble');
  if(state==='none'){bubble?.remove();tori.setAttribute('aria-label','책지기 토리 · 이야기하기');return}
  if(!bubble){bubble=objects.ownerDocument.createElement('span');bubble.className='campus-story-bubble';bubble.setAttribute('aria-hidden','true');tori.append(bubble)}
  bubble.textContent=state==='complete'?'🌿 책 나눔 준비 완료':'📦 꾸러미를 기다려요';
  tori.setAttribute('aria-label','책지기 토리 · '+(state==='complete'?'책 나눔 준비 완료': '꾸러미 전달하기'));
 }
 return {render};
}
