// A presentation of an explicit, saved room exit. It never accepts a request or moves a player.
export function createSchoolArrival({overlay,hide,reduced,tone,toggleSound,soundEnabled}){
 let current=null,epoch=0;
 function stop(){current=null;epoch++;overlay.classList.remove('life-arrival-overlay');delete overlay.dataset.arrival;}
 function allowed(){return !!current&&current.guard()&&!overlay.hidden;}
 function button(text,fn,primary=false){const b=document.createElement('button'),token=epoch;b.type='button';b.className='life-arrival-button'+(primary?' life-arrival-primary':'');b.textContent=text;b.onclick=()=>{if(token!==epoch||!allowed()||!overlay.contains(b)||performance.now()-current.changedAt<300)return;fn();};return b;}
 function render(){
  if(!current)return;const welcome=current.phase==='welcome';overlay.dataset.arrival=current.phase;overlay.replaceChildren();
  const section=document.createElement('section');section.className='life-arrival-panel';section.setAttribute('role','dialog');section.setAttribute('aria-label',welcome?'새싹의 인사':'첫 등교');
  const title=document.createElement('h2');title.textContent=welcome?'새싹':'봄빛 학교';section.append(title);
  if(welcome){const p=document.createElement('p');p.textContent='어? 초대장 받았구나.\n이쪽이야!';section.append(p);}
  const controls=document.createElement('div');controls.className='life-arrival-actions';
  controls.append(button(welcome?'둘러보기':'계속',()=>{if(welcome)hide();else{current.phase='welcome';current.elapsed=0;current.last=0;current.changedAt=performance.now();render();}},true));
  controls.append(button('건너뛰기',hide));
  const sound=button(soundEnabled()?'소리 끄기':'소리 켜기',()=>{toggleSound();sound.textContent=soundEnabled()?'소리 끄기':'소리 켜기';sound.setAttribute('aria-pressed',String(soundEnabled()));});sound.setAttribute('aria-pressed',String(soundEnabled()));controls.append(sound);
  section.append(controls);overlay.append(section);section.addEventListener('keydown',e=>{if(e.repeat&&['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();}});controls.firstElementChild.focus({preventScroll:true});
 }
 function start(guard){stop();current={guard,phase:'view',elapsed:0,last:0,changedAt:performance.now(),notes:0};overlay.hidden=false;overlay.classList.add('life-arrival-overlay');render();}
 function tick(t,paused){if(!current)return;if(!allowed()){hide();return;}if(!paused&&current.last)current.elapsed+=Math.min(50,t-current.last);current.last=t;if(!paused&&current.phase==='view'&&current.notes<6&&current.elapsed>=current.notes*360){tone([523,659,784,659,587,523][current.notes++],.55);}}
 function view(W,H,normalScale){
  if(!current)return null;const wide=Math.max(W/1600,H/1067),wideCamera={x:Math.max(0,800-W/(2*wide)),y:0};
  const p=current.phase==='view'?0:reduced()?1:Math.min(1,current.elapsed/800),e=.5-Math.cos(p*Math.PI)/2;
  const scale=wide+(normalScale-wide)*e,closeX=Math.max(0,417-W/(2*normalScale)),closeY=Math.max(0,Math.min(330,540-Math.max(100,H-230)*.52/normalScale));
  return {scale,x:wideCamera.x+(closeX-wideCamera.x)*e,y:wideCamera.y+(closeY-wideCamera.y)*e};
 }
 function reaction(g,draw){
  if(!current||current.phase!=='welcome'){draw(0);return;}
  const p=Math.min(1,current.elapsed/900),bob=reduced()?0:-Math.sin(p*Math.PI)*5;draw(bob);
  g.save();g.fillStyle='#fff1b9';g.strokeStyle='#745539';g.lineWidth=2;g.beginPath();g.roundRect(525,399+bob,30,31,10);g.fill();g.stroke();g.fillStyle='#694c34';g.font='24px SchoolLife';g.textAlign='center';g.fillText('!',540,423+bob);g.restore();
 }
 return {start,stop,tick,view,reaction,active:()=>!!current,snapshot:()=>current?{phase:current.phase,elapsed:current.elapsed}:null};
}
