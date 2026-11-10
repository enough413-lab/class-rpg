// Picking up and opening are temporary. Only the final explicit choice advances the story.
export function createInvitationAction({overlay,hide,reduced}){
 let current=null,epoch=0,anchor=null;
 const allowed=()=>!!current&&current.guard()&&!overlay.hidden;
 function stop(){current=null;anchor=null;epoch++;overlay.classList.remove('life-invitation-overlay');delete overlay.dataset.letter;}
 function cancel(){if(!current)return;hide();}
 function button(label,fn,{primary=false,disabled=false}={}){
  const b=document.createElement('button'),token=epoch;b.type='button';b.className='life-letter-button'+(primary?' life-letter-primary':'');b.textContent=label;b.disabled=disabled;
  b.onclick=()=>{if(token!==epoch||!allowed()||!overlay.contains(b)||performance.now()-current.changedAt<280)return;fn();};return b;
 }
 function render(){
  if(!current)return;const phase=current.phase;overlay.dataset.letter=phase;overlay.replaceChildren();
  const section=document.createElement('section');section.className='life-invitation-panel';section.setAttribute('role','dialog');section.setAttribute('aria-label','잎사귀 초대장');
  const title=document.createElement('h2');title.textContent=phase==='lift'?'초대장':'잎사귀 초대장';section.append(title);
  if(phase!=='lift'){
   const canvas=document.createElement('canvas');canvas.className='life-letter-envelope';canvas.width=600;canvas.height=330;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',phase==='closed'?'잎사귀 봉인이 붙은 봉투':'열린 봉투와 편지');section.append(canvas);
   if(phase==='read'){const p=document.createElement('p');p.className='life-letter-message';p.textContent='이 학교에서 다시 웃음소리가 나면 좋겠어.\n마당에서 기다릴게.\n— 새싹';section.append(p);}
   else{const p=document.createElement('p');p.className='life-letter-hint';p.setAttribute('role','status');p.textContent=phase==='closed'?'잎사귀 봉인.':'편지를 펼치는 중…';section.append(p);}
  }
  const controls=document.createElement('div');controls.className='life-letter-actions';
  if(phase==='closed')controls.append(button('봉투 열기',()=>change('opening'),{primary:true}));
  if(phase==='opening')controls.append(button('편지를 펼치는 중…',()=>{},{disabled:true}));
  if(phase==='read')controls.append(button('초대장 챙기기',()=>{const done=current.done;hide();done();},{primary:true}));
  controls.append(button('잠깐 내려놓기',cancel));section.append(controls);overlay.append(section);
  section.addEventListener('keydown',e=>{if(e.repeat&&['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();}});
  controls.querySelector('button:not(:disabled)')?.focus({preventScroll:true});
 }
 function change(phase){current.phase=phase;current.elapsed=0;current.last=0;current.changedAt=performance.now();render();}
 function start({source,image,done,guard}){
  stop();current={phase:'lift',elapsed:0,last:0,changedAt:performance.now(),source,image,done,guard};anchor={...source};overlay.hidden=false;overlay.classList.add('life-invitation-overlay');render();
 }
 function tick(t,paused){
  if(!current)return;
  if(!allowed()){cancel();return;}
  if(!paused&&current.last)current.elapsed+=Math.min(50,t-current.last);current.last=t;
  if(current.phase==='lift'&&(reduced()||current.elapsed>=750))change('closed');
  else if(current.phase==='opening'&&(reduced()||current.elapsed>=850))change('read');
  drawEnvelope();
 }
 function drawEnvelope(){
  const c=overlay.querySelector('.life-letter-envelope');if(!c||!current)return;const g=c.getContext('2d');g.clearRect(0,0,600,330);
  if(current.phase==='closed'){g.drawImage(current.image,116,72,368,199);return;}
  const p=reduced()||current.phase==='read'?1:Math.min(1,current.elapsed/850);
  g.save();g.translate(300,205);g.lineJoin='round';g.lineWidth=5;g.strokeStyle='#866244';
  // The back flap opens first, then the letter rises out of the pocket.
  const fold=Math.min(1,p/.45),top=70-185*fold;
  g.fillStyle='#ead1a6';g.beginPath();g.moveTo(-175,-40);g.lineTo(0,top);g.lineTo(175,-40);g.closePath();g.fill();g.stroke();
  const lift=Math.max(0,(p-.35)/.65)*90;
  g.fillStyle='#fff5dc';g.strokeStyle='#b29872';g.lineWidth=3;g.beginPath();g.roundRect(-148,-37-lift,296,120,8);g.fill();g.stroke();
  g.strokeStyle='#a9b18a';g.lineWidth=4;for(let n=0;n<3;n++){g.beginPath();g.moveTo(-110,-10-lift+n*22);g.lineTo(n===2?30:110,-10-lift+n*22);g.stroke();}
  g.fillStyle='#f1dcb8';g.strokeStyle='#866244';g.lineWidth=5;g.beginPath();g.moveTo(-175,-40);g.lineTo(0,38);g.lineTo(175,-40);g.lineTo(175,85);g.lineTo(-175,85);g.closePath();g.fill();g.stroke();
  g.strokeStyle='#bc9670';g.lineWidth=3;g.beginPath();g.moveTo(-175,85);g.lineTo(-45,10);g.moveTo(175,85);g.lineTo(45,10);g.stroke();g.restore();
 }
 function drawWorld(g){
  if(!current||!anchor)return;const p=reduced()||current.phase!=='lift'?1:Math.min(1,current.elapsed/750),ease=.5-Math.cos(p*Math.PI)/2;
  const x=current.source.x+(anchor.x-current.source.x)*ease,y=current.source.y+(anchor.y-current.source.y)*ease;
  g.save();g.translate(x,y);if(!reduced())g.rotate(-.08*Math.sin(p*Math.PI));g.drawImage(current.image,-24,-13,48,26);g.restore();
 }
 return {start,stop,tick,drawWorld,hand:p=>{anchor=p;},active:()=>!!current,snapshot:()=>current?{phase:current.phase,elapsed:current.elapsed}:null};
}

