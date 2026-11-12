import {drawWindow,windowFrame} from './school-life-window-motion.js?v=20261112-curtains';
// The opening is optional for existing saves; only explicit actions advance it.
export function installSchoolOpening(api){
 const step=()=>api.state().opening.step;
 const old=()=>api.state().opening.legacy;
 const windows=[{id:'firstWindow',index:0,x:305,y:480,face:{x:305,y:300},label:'칠판 옆 창문',rect:[158,178,273,202]},{id:'leftWindow',index:1,x:120,y:535,face:{x:35,y:375},label:'왼쪽 벽 창문',rect:[0,200,104,286]},{id:'rightWindow',index:2,x:1480,y:535,face:{x:1560,y:375},label:'오른쪽 벽 창문',rect:[1448,200,88,286]}];
 const opened=()=>old()||step()>=5?[0,1,2]:api.state().opening.windows||[];
 const keyReady=()=>[0,1,2].every(i=>api.state().weeds.includes(i));
 const goal=()=>['','새싹에게 초대장 보여 주기','화단 아래에서 열쇠 찾기','찾은 열쇠로 교실 열기','교실에 햇살 들이기','돌아온 토리 만나기','토리가 놓은 쪽지 읽기',''][step()];
 const enterable=()=>old()||step()>=4;
 const toriVisible=()=>old()||step()>=5&&!api.windowMotion?.();
 function advance(from,to,message){
  if(step()!==from)return false;
  if(!api.mutate(s=>s.opening.step=to))return false;
  if(message){api.toast(message);api.thought?.('!');}
  return true;
 }
 function entities(scene){
  const n=step(),items=[];
  if(scene==='room'&&n===0)items.push({id:'invitation',x:920,y:700,label:'잎사귀 초대장',action:'집기',kind:'opening'});
  if(scene==='campus'&&n===2&&keyReady())items.push({id:'schoolKey',x:790,y:678,label:'풀 아래 작은 열쇠',action:'줍기',kind:'opening'});
  if(scene==='classroom'&&n===4&&!old())items.push(...windows.filter(w=>!opened().includes(w.index)).map(w=>({...w,action:'열기',kind:'opening'})));
  if(scene==='classroom'&&n===6)items.push({id:'bellNote',x:950,y:740,label:'토리가 놓은 쪽지',action:'읽기',kind:'opening'});
  return items;
 }
 function handle(e){
  if(e.id==='schoolDoor'&&step()===3&&!old()){
   if(advance(3,4,''))api.unlock?.();
   return true;
  }
  if(e.id==='schoolDoor'&&!enterable()&&step()!==3){api.talk('잠긴 교실','문이 잠겨 있다.\n새싹이 열쇠의 행방을 알지도 모른다.');return true;}
  if(e.id==='invitation'){
   api.invitation(e,()=>advance(0,1,'초대장을 챙겼다.'));return true;
  }
  if(e.id==='schoolKey'){
   if(step()===2&&keyReady()&&advance(2,3,'잎사귀 무늬 열쇠를 찾았다.')){api.burst(e.x,e.y);api.react?.('surprise');}return true;
  }
  if(windows.some(w=>w.id===e.id)){
   const window=windows.find(w=>w.id===e.id);
   if(step()!==4||old()||opened().includes(window.index))return true;
   if(api.state().dust.length<4){api.talk(window.label,'먼지가 날려 창문을 열 수 없다.\n먼저 바닥을 쓸어야 한다.');return true;}
   api.talk(window.label,'굳은 손잡이 너머로 바람 소리가 들린다.',[{label:'두 손으로 열기',run:()=>{
    if(step()!==4||old()||api.state().dust.length!==4||opened().includes(window.index))return;
    const previous=[...opened()],next=[...previous,window.index].sort((a,b)=>a-b),last=next.length===3;
    if(api.mutate(s=>{s.opening.windows=next;if(last)s.opening.step=5;})){
     api.windowOpened(window,previous,last,last?'세 창문이 열렸다. 문밖에서 발소리가 들린다.':window.label+'을 열었다.');
    }
   }},{label:'돌아가기'}]);return true;
  }
  if(e.id==='bellNote'){
   api.talk('종 아래의 글귀','“학교의 종이 잠든 날,\n우리는 작은 씨앗을 남겼다.”',[{label:'수첩에 간직하기',run:()=>advance(6,7,'수첩에 기록했다.')},{label:'조금 더 바라보기'}]);return true;
  }
  if(e.id==='saessak'){
   if(step()===0)api.talk('새싹','네 방에 편지를 두고 왔는데.\n아직 못 봤어?',[{label:'읽고 올게!'}],'saessak');
   else if(step()===1)api.conversation('wish',()=>advance(1,2));
   else if(step()===2)api.talk('새싹',keyReady()?'잡초 아래에서 반짝이는 게 보여!\n직접 가까이 가서 살펴봐.':'꽃을 심는 흙 바로 아래를 살펴봐.\n나란히 난 잡초 세 곳을 뽑아 보자.',[{label:'찾아볼게!'},api.wishChoice()],'saessak');
   else if(step()===3)api.talk('새싹','찾았다! 그게 교실 열쇠야.',[{label:'문을 열어 볼게!'},api.wishChoice()],'saessak');
   else if(step()===4)api.talk('새싹','문이 열렸네!\n안은 먼지투성이야. 바닥을 쓸고 창문부터 열자.',[{label:'다녀올게!'},api.wishChoice()],'saessak');
   else if(step()===5&&!old())api.talk('새싹','방금 누가 교실로 들어갔어.\n저 뒷모습… 토리인가?',[{label:'가서 볼게'},api.wishChoice()],'saessak');
   else if(step()>=6&&!old())api.talk('새싹',api.remember('saessak','토리가 돌아왔다고?\n그럼 그 책, 끝까지 읽을 수 있겠네.'),[{label:'교실에서 만나자'},api.wishChoice()],'saessak');
   else return false;
   return true;
  }
  if(e.id==='tori'&&step()===5&&!old()){api.conversation('reunion',()=>advance(5,6));return true;}
  if(e.id==='tori'&&step()===5){api.talk('토리',old()?'창문을 열어 줬구나! 교실이 더 환해졌어.\n고마워. 책을 읽다가 이 쪽지를 찾았어.':'불빛이 보여서 돌아왔어. 이 교실이 그리웠거든.\n고마워! 책 사이에 있던 쪽지를 놓아둘게.',[{label:'다시 만나서 반가워!',run:()=>advance(5,6)}],'tori');return true;}
  return false;
 }
 function memory(){return step()===7?'교실에 햇살이 들고 토리가 돌아왔다.\n종 아래 글귀: “학교의 종이 잠든 날, 우리는 작은 씨앗을 남겼다.”':goal();}
 function draw(g,scene,assets,time=0,reduced=false){
  const glow=(x,y)=>{const pulse=reduced?0.5:(Math.sin(time*.002)+1)/2;g.save();g.translate(x,y);g.scale(1,.38);const light=g.createRadialGradient(0,0,6,0,0,57);light.addColorStop(0,'#fffbdccc');light.addColorStop(.42,'#ffe8a18c');light.addColorStop(1,'#f3c96b00');g.fillStyle=light;g.beginPath();g.ellipse(0,0,53+pulse*4,53+pulse*4,0,0,Math.PI*2);g.fill();g.strokeStyle='#fff8d2';g.globalAlpha=.65+pulse*.2;g.lineWidth=2.5;g.beginPath();g.ellipse(0,0,37+pulse*3,34+pulse*3,0,0,Math.PI*2);g.stroke();g.restore();
   for(const [dx,dy,size]of [[-35,-31,4],[32,-15,3]]){g.save();g.translate(x+dx,y+dy);const r=size+(reduced?0:pulse);g.fillStyle='#fff6cf';g.strokeStyle='#b58b43';g.lineWidth=1;g.beginPath();g.moveTo(0,-r*1.7);g.lineTo(r*.45,-r*.45);g.lineTo(r*1.3,0);g.lineTo(r*.45,r*.45);g.lineTo(0,r*1.7);g.lineTo(-r*.45,r*.45);g.lineTo(-r*1.3,0);g.lineTo(-r*.45,-r*.45);g.closePath();g.fill();g.stroke();g.restore();}
  };
  g.save();
  const note=(x,y)=>{glow(x,y+1);g.drawImage(assets.invitation,x-30,y-30,60,34);};
  if(scene==='room'&&step()===0&&!api.invitationActive())note(920,700);
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
 function drawClassroom(g,assets){
  const done=opened(),motion=api.windowMotion?.(),view=motion&&windowFrame(motion.phase,motion.reduced);
  if(done.length===3&&!motion){g.drawImage(assets.classroom,0,0,1600,1067);return;}
  g.drawImage(assets.classroomClosed,0,0,1600,1067);
  if(motion?.last&&view.light){g.save();g.globalAlpha=view.light;g.drawImage(assets.classroom,0,0,1600,1067);g.restore();}
  for(const index of done)drawWindow(g,assets,index,motion?.index===index?view.curtain:1);
 }

 return {goal,enterable,toriVisible,entities,handle,memory,draw,drawClassroom,opened};
}
