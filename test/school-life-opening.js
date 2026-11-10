// The opening is optional for existing saves; only explicit actions advance it.
export function installSchoolOpening(api){
 const step=()=>api.state().opening.step;
 const old=()=>api.state().opening.legacy;
 const keyReady=()=>[0,1,2].every(i=>api.state().weeds.includes(i));
 const goal=()=>['','새싹에게 초대장 보여 주기','화단 아래에서 열쇠 찾기','찾은 열쇠로 교실 열기','교실에 햇살 들이기','돌아온 토리 만나기','토리가 놓은 쪽지 읽기',''][step()];
 const enterable=()=>old()||step()>=4;
 const toriVisible=()=>old()||step()>=5;
 function advance(from,to,message){
  if(step()!==from)return false;
  if(!api.mutate(s=>s.opening.step=to))return false;
  if(message)api.toast(message);
  return true;
 }
 function entities(scene){
  const n=step(),items=[];
  if(scene==='room'&&n===0)items.push({id:'invitation',x:920,y:700,label:'잎사귀 초대장',action:'읽기',kind:'opening'});
  if(scene==='campus'&&n===2&&keyReady())items.push({id:'schoolKey',x:790,y:678,label:'풀 아래 작은 열쇠',action:'줍기',kind:'opening'});
  if(scene==='classroom'&&n===4)items.push({id:'firstWindow',x:400,y:470,label:'굳게 닫힌 창문',action:'열기',kind:'opening'});
  if(scene==='classroom'&&n===6)items.push({id:'bellNote',x:950,y:740,label:'토리가 놓은 쪽지',action:'읽기',kind:'opening'});
  return items;
 }
 function handle(e){
  if(e.id==='schoolDoor'&&!enterable()&&step()!==3){api.talk('잠긴 교실','오랫동안 닫혀 있던 문이에요.\n새싹이라면 열쇠를 알지도 몰라요.');return true;}
  if(e.id==='invitation'){
   api.talk('새싹의 초대장','이 학교에서 다시 웃음소리가 나면 좋겠어.\n마당에서 기다릴게. — 새싹',[{label:'초대장 챙기기',run:()=>advance(0,1,'초대장을 주머니에 넣었어요.')},{label:'잠깐 내려놓기'}]);return true;
  }
  if(e.id==='schoolKey'){
   if(step()===2&&keyReady()&&advance(2,3,'잎사귀 무늬 열쇠를 찾았어요!'))api.burst(e.x,e.y);return true;
  }
  if(e.id==='firstWindow'){
   if(api.state().dust.length<4){api.talk('닫힌 창문','바닥에 먼지가 남아 있어요.\n깨끗이 쓴 뒤 창문을 열어 볼까요?');return true;}
   api.talk('첫 햇살','먼지를 다 쓸었어요.\n이제 창문을 활짝 열어 볼까요?',[{label:'두 손으로 열기',run:()=>{if(api.state().dust.length===4&&advance(4,5,'햇살이 들어오자, 문밖에서 발소리가 들려요.')){api.burst(e.x,e.y);api.tone(784,.4);}}},{label:'잠깐 둘러보기'}]);return true;
  }
  if(e.id==='bellNote'){
   api.talk('종 아래의 글귀','“학교의 종이 잠든 날,\n우리는 작은 씨앗을 남겼다.”',[{label:'수첩에 간직하기',run:()=>advance(6,7,'첫 햇살과 토리의 귀환을 수첩에 남겼어요.')},{label:'조금 더 바라보기'}]);return true;
  }
  if(e.id==='saessak'){
   if(step()===0)api.talk('새싹','와 줬구나! 네 방에 초대장을 남겼어.\n잎사귀가 붙은 편지를 읽어 줄래?',[{label:'읽고 올게!'}],'saessak');
   else if(step()===1)api.talk('새싹','학교가 오래 잠들어 있었어.\n화단 아래 잡초 세 곳에서 열쇠를 찾아 줄래?',[{label:'함께 찾아보자!',run:()=>advance(1,2)},{label:'조금 이따가'}],'saessak');
   else if(step()===2)api.talk('새싹',keyReady()?'잡초 아래에서 반짝이는 게 보여!\n직접 가까이 가서 살펴봐.':'꽃을 심는 흙 바로 아래를 살펴봐.\n나란히 난 잡초 세 곳을 뽑아 보자.',[{label:'찾아볼게!'}],'saessak');
   else if(step()===3)api.talk('새싹','그 잎사귀 무늬, 교실 열쇠가 맞아!\n학교 문에 한번 맞춰 볼래?',[{label:'문을 열어 볼게!'}],'saessak');
   else if(step()===4)api.talk('새싹','교실을 다시 쓸 수 있으면 좋겠어.\n먼지를 쓸고 창문을 열어 보자.',[{label:'다녀올게!'}],'saessak');
   else return false;
   return true;
  }
  if(e.id==='tori'&&step()===5){api.talk('토리',old()?'창문을 열어 줬구나! 교실이 더 환해졌어.\n고마워. 책을 읽다가 이 쪽지를 찾았어.':'불빛이 보여서 돌아왔어. 이 교실이 그리웠거든.\n고마워! 책 사이에 있던 쪽지를 놓아둘게.',[{label:'다시 만나서 반가워!',run:()=>advance(5,6)}],'tori');return true;}
  return false;
 }
 function memory(){return step()===7?'교실에 첫 햇살이 들어왔고, 토리와 만났어요.\n종 아래 글귀: “학교의 종이 잠든 날, 우리는 작은 씨앗을 남겼다.”':goal();}
 function draw(g,scene,assets,time=0,reduced=false){
  const glow=(x,y)=>{const pulse=reduced?0.5:(Math.sin(time*.002)+1)/2;g.save();g.translate(x,y);g.scale(1,.38);const light=g.createRadialGradient(0,0,6,0,0,57);light.addColorStop(0,'#fffbdccc');light.addColorStop(.42,'#ffe8a18c');light.addColorStop(1,'#f3c96b00');g.fillStyle=light;g.beginPath();g.ellipse(0,0,53+pulse*4,53+pulse*4,0,0,Math.PI*2);g.fill();g.strokeStyle='#fff8d2';g.globalAlpha=.65+pulse*.2;g.lineWidth=2.5;g.beginPath();g.ellipse(0,0,37+pulse*3,34+pulse*3,0,0,Math.PI*2);g.stroke();g.restore();
   for(const [dx,dy,size]of [[-35,-31,4],[32,-15,3]]){g.save();g.translate(x+dx,y+dy);const r=size+(reduced?0:pulse);g.fillStyle='#fff6cf';g.strokeStyle='#b58b43';g.lineWidth=1;g.beginPath();g.moveTo(0,-r*1.7);g.lineTo(r*.45,-r*.45);g.lineTo(r*1.3,0);g.lineTo(r*.45,r*.45);g.lineTo(0,r*1.7);g.lineTo(-r*.45,r*.45);g.lineTo(-r*1.3,0);g.lineTo(-r*.45,-r*.45);g.closePath();g.fill();g.stroke();g.restore();}
  };
  g.save();
  const note=(x,y)=>{glow(x,y+1);g.drawImage(assets.invitation,x-30,y-30,60,34);};
  if(scene==='room'&&step()===0)note(920,700);
  if(scene==='campus'){
   if(!enterable()){
    g.translate(815,330);g.lineWidth=2;g.strokeStyle='#6d5137';g.fillStyle='#a88757';
    for(const [y,a]of [[-40,-.12],[-17,.12]]){g.save();g.rotate(a);g.beginPath();g.roundRect(-49,y,98,16,3);g.fill();g.stroke();g.beginPath();g.moveTo(-38,y+6);g.lineTo(32,y+5);g.moveTo(-24,y+11);g.lineTo(39,y+10);g.stroke();for(const x of [-42,42]){g.fillStyle='#665b49';g.fillRect(x,y+6,3,3);}g.restore();}
    g.fillStyle='#e4bd68';g.fillRect(-8,-22,16,19);g.strokeRect(-8,-22,16,19);g.translate(-815,-330);
   }
   if(step()===2&&keyReady()){
    glow(793,689);
    g.strokeStyle='#fff3bf';g.lineWidth=9;g.beginPath();g.arc(780,670,8,0,Math.PI*2);g.moveTo(787,676);g.lineTo(805,691);g.stroke();
    g.strokeStyle='#b48c48';g.lineWidth=4;g.beginPath();g.arc(780,670,8,0,Math.PI*2);g.moveTo(787,676);g.lineTo(805,691);g.lineTo(811,685);g.moveTo(798,685);g.lineTo(804,679);g.stroke();
   }
   if(step()>=5)g.drawImage(assets.lantern,730,266,40,65);
  }
  if(scene==='classroom'){
   if(step()===6)note(950,740);
  }
  g.restore();
 }
 return {goal,enterable,toriVisible,entities,handle,memory,draw};
}
