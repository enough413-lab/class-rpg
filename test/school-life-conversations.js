// Temporary staging of the existing first request and reunion. Only the final response can save.
export function createSchoolConversations({overlay,hide,reduced,assets}){
 let current=null,epoch=0,lastView=null,returning=null;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const scripts={
  wish:[{text:'저 교실에서 토리랑 두리랑\n다시 책을 읽고 싶어.',next:'계속'},{text:'열쇠가 저 화단 어딘가에 있을 텐데…',next:'같이 찾자'}],
  reunion:[{text:'불빛이 보여서 돌아왔어.\n이 교실이 그리웠거든.',next:'다시 만나서 반가워!'},{text:'책 사이에 이게 끼어 있었어.',next:'쪽지를 본다'},{text:'여기 둘게.',next:'고마워'}]
 };
 function stop(immediate=false){if(immediate)returning=null;else if(current)returning={kind:current.kind,offset:offset(),elapsed:0,last:0};current=null;lastView=null;epoch++;overlay.classList.remove('life-conversation-overlay');delete overlay.dataset.conversation;}
 const allowed=()=>!!current&&current.guard()&&!overlay.hidden;
 function render(){
  const s=current,phase=scripts[s.kind][s.index],token=++epoch;overlay.replaceChildren();overlay.dataset.conversation=s.kind+'-'+s.index;
  const box=document.createElement('section');box.className='life-conversation-panel';box.setAttribute('role','dialog');box.setAttribute('aria-label',s.kind==='wish'?'새싹의 이야기':'토리의 이야기');
  const name=document.createElement('h2');name.textContent=s.kind==='wish'?'새싹':'토리';const text=document.createElement('p');text.textContent=phase.text;box.append(name,text);
  const actions=document.createElement('div');actions.className='life-conversation-actions';
  for(const[caption,primary]of [[phase.next,true],[s.kind==='wish'?'나중에':'대화 마치기',false]]){const b=document.createElement('button');b.type='button';b.className='life-conversation-button'+(primary?' life-conversation-primary':'');b.textContent=caption;b.disabled=primary&&!reduced();b.onclick=()=>{if(token!==epoch||!allowed()||!overlay.contains(b)||s.paused||performance.now()-s.changedAt<250)return;if(!primary){hide();return;}if(s.elapsed<750&&!reduced())return;if(s.index<scripts[s.kind].length-1){s.index++;s.from=lastView;s.elapsed=0;s.last=0;s.changedAt=performance.now();render();}else{const finish=s.finish;hide();finish();}};actions.append(b);}
  box.append(actions);box.addEventListener('keydown',e=>{if(e.repeat&&['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();}});overlay.append(box);box.setAttribute('tabindex','-1');box.focus({preventScroll:true});
 }
 function start(kind,guard,finish){stop(true);current={kind,index:0,actorElapsed:0,guard,finish,elapsed:0,last:0,changedAt:performance.now(),from:null,paused:false};overlay.hidden=false;overlay.classList.add('life-conversation-overlay');render();}
 function tick(t,paused){if(returning){if(!paused&&returning.last)returning.elapsed+=Math.min(50,t-returning.last);returning.last=t;if(reduced()||returning.elapsed>=600)returning=null;}if(!current)return;if(!allowed()){hide();return;}const s=current;s.paused=paused;if(!paused&&s.last){const dt=Math.min(50,t-s.last);s.elapsed+=dt;s.actorElapsed+=dt;}s.last=t;const b=overlay.querySelector('.life-conversation-primary');if(b?.disabled&&(reduced()||s.elapsed>=750)){b.disabled=false;if(document.activeElement===overlay.firstElementChild)b.focus({preventScroll:true});}}
 function view(W,H,normalScale,normalCamera,pos){
  if(!current)return null;const s=current,panel=overlay.firstElementChild?.getBoundingClientRect().height||180,available=Math.max(110,H-panel-26);
  let bounds=s.kind==='wish'?(s.index===0?{l:395,r:900,t:265,b:575}:{l:395,r:860,t:425,b:720}):{l:Math.min(910,pos.x-55),r:Math.max(1135,pos.x+55),t:475,b:s.index===2?766:Math.max(640,pos.y+18)};
  bounds={l:Math.min(bounds.l,pos.x-55),r:Math.max(bounds.r,pos.x+55),t:Math.min(bounds.t,pos.y-135),b:Math.max(bounds.b,pos.y+20)};
  const scale=Math.min(normalScale,(W-32)/(bounds.r-bounds.l),available/(bounds.b-bounds.t+20)),target={scale,x:clamp((bounds.l+bounds.r)/2-W/(2*scale),0,Math.max(0,1600-W/scale)),y:clamp((bounds.t+bounds.b)/2-available/(2*scale),0,1067-available/scale)};
  if(!s.from||s.viewport!==W+'x'+H){s.from={scale:normalScale,...normalCamera};s.viewport=W+'x'+H;if(s.elapsed>750)s.from=target;}
  const p=reduced()?1:clamp(s.elapsed/650,0,1),e=(1-Math.cos(p*Math.PI))/2;lastView={scale:s.from.scale+(target.scale-s.from.scale)*e,x:s.from.x+(target.x-s.from.x)*e,y:s.from.y+(target.y-s.from.y)*e};return lastView;
 }
 function offset(){if(current){const p=reduced()?1:clamp(current.actorElapsed/650,0,1);return -105*(1-Math.cos(p*Math.PI))/2;}if(returning)return returning.offset*(1-(1-Math.cos(clamp(returning.elapsed/600,0,1)*Math.PI))/2);return 0;}
 function actor(name){const kind=current?.kind||returning?.kind;return {x:(name==='saessak'?540:1060)+((name==='saessak'&&kind==='wish'||name==='tori'&&kind==='reunion')?offset():0),y:name==='saessak'?540:615};}
 function pose(name){if(!current)return null;const a=assets();if(name==='saessak'&&current.kind==='wish'&&current.index===1)return a.saessakPoint;if(name==='tori'&&current.kind==='reunion'&&current.index>=1)return a.toriNote;return null;}
 function draw(g){
  if(!current)return;const s=current,a=assets(),p=reduced()?1:clamp(s.elapsed/650,0,1),ease=(1-Math.cos(p*Math.PI))/2;
  if(s.kind==='wish'){
   const x=s.index===0?815:740,y=s.index===0?438:682;g.save();g.strokeStyle='#f6dfa4';g.lineWidth=3;g.beginPath();g.ellipse(x,y+6,s.index===0?43:89,s.index===0?13:24,0,0,Math.PI*2);g.stroke();g.restore();
  }else if(s.index>=1&&a.invitation){
   const dx=offset(),start=s.index===1?{x:1078+dx,y:585}:{x:1098+dx,y:555},end=s.index===1?{x:1098+dx,y:555}:{x:950,y:725};
   const x=start.x+(end.x-start.x)*ease,y=start.y+(end.y-start.y)*ease-(s.index===2&&!reduced()?Math.sin(p*Math.PI)*15:0);g.save();g.translate(x,y);g.rotate(s.index===2?-.12*Math.sin(p*Math.PI):-.1);g.drawImage(a.invitation,-25,-14,50,29);g.restore();
  }
 }
 return {start,stop,tick,view,pose,actor,draw,active:()=>!!current,snapshot:()=>current?{kind:current.kind,index:current.index,elapsed:current.elapsed,paused:current.paused,actor:actor(current.kind==='wish'?'saessak':'tori'),view:lastView}:null};
}
