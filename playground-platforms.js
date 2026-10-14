// Optional local terrain; existing room access, school records and rewards are unchanged.
export function installPlaygroundPlatforms(c){
 const doc=c.hub.ownerDocument,player=doc.getElementById('hubPlayer'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const course=doc.createElement('div');course.className='playground-platforms';course.hidden=true;course.setAttribute('aria-hidden','true');
 course.innerHTML='<i class="jump-beam"><b></b></i><i class="jump-bar"><b></b></i>';c.stage.append(course);
 const help=doc.createElement('div');help.className='platform-help';help.hidden=true;
 const status=doc.createElement('span');status.setAttribute('role','status');const action=doc.createElement('button');action.type='button';action.className='platform-action';const fold=doc.createElement('button');fold.type='button';fold.className='platform-fold';fold.textContent='길 접기';help.append(status,action,fold);c.stage.parentElement.append(help);
 let owner=null,active=false,visited=new Set(),stored=true,base=0,flight=null,fall=0,falling=false,width=0,blocks=[],lastScene='',message='';
 const here=()=>c.getScene()==='playground'&&!c.hub.classList.contains('hidden'),x=()=>c.getPosition().x*width/100;
 const key=id=>'classRpgJumpPath_v1_'+id;
 const support=(at=x())=>blocks.find(b=>at>=b.left&&at<=b.right);
 function lift(value){const next=Math.max(0,value);if(base!==next)base=next;const v=next>.01?'0 '+(-next)+'px':'';if(player.style.translate!==v)player.style.translate=v;player.dataset.platformHeight=String(Math.round(next*100)/100)}
 function cancelFall(){cancelAnimationFrame(fall);fall=0;falling=false;delete player.dataset.platformFalling}
 function reset(){cancelFall();active=false;flight=null;lift(0);course.hidden=true;message='';}
 function activate(){const id=c.getStudent()?.id;if(id===owner)return;reset();owner=id;visited=new Set();stored=true;try{const s=JSON.parse(localStorage.getItem(key(id))||'null');if(id!=null&&s?.v===1&&Array.isArray(s.landed)&&s.landed.length<=2&&s.landed.every(n=>n===0||n===1))visited=new Set(s.landed)}catch{stored=false}}
 function measure(){width=c.stage.clientWidth;const mat=c.stage.querySelector('[data-art=playground-mat]'),bench=c.stage.querySelector('[data-art=playground-bench]'),left=width*.27+(mat?.offsetWidth||122)/2+12,right=width*.53-(bench?.offsetWidth||154)/2-20,beam=Math.max(40,Math.min(112,right-left-40));blocks=[{id:0,left,right:left+beam,height:reduce.matches?6:16},{id:1,left:left+beam+18,right:left+beam+40,height:reduce.matches?10:24}];course.style.left=left+'px';course.style.width=(beam+40)+'px';course.style.setProperty('--beam-width',beam+'px');course.style.setProperty('--bar-left',(beam+18)+'px');course.style.setProperty('--beam-height',blocks[0].height+'px');course.style.setProperty('--bar-height',blocks[1].height+'px')}
 function remember(block){if(!block)return;visited.add(block.id);try{localStorage.setItem(key(owner),JSON.stringify({v:1,landed:[...visited]}));stored=true}catch{stored=false}message='발판 위에 사뿐! 걸어서 내려가도 좋아요.';sync()}
 function drop(){
  if(!active||flight||falling||base<=0)return;const from=base,start=performance.now(),id=owner;falling=true;player.dataset.platformFalling='true';
  function step(now){if(!active||!here()||id!==c.getStudent()?.id){cancelFall();lift(0);return}const below=support(),floor=below&&below.height<=base?below.height:0,next=Math.max(floor,from-900*((now-start)/1000)**2);lift(next);if(next<=floor){cancelFall();if(below)remember(below);sync();return}fall=requestAnimationFrame(step)}fall=requestAnimationFrame(step);
 }
 function sync(){
  activate();const scene=c.getScene();if(!here()||scene!==lastScene){if(active)reset();lastScene=scene}course.hidden=!active;
  help.hidden=!here()||owner==null||!active&&c.walk.nearby()?.kind!=='look-0';fold.hidden=!active;
  if(active&&!flight&&!falling){const under=support();if(base>0&&(!under||Math.abs(under.height-base)>.5))drop()}
  action.disabled=!!flight||falling||player.hasAttribute('data-jumping');action.textContent=!active?'점프 길 펼치기':'발판으로 폴짝';
  const text=(message||(!active?'낮은 발판 위로 폴짝 올라가 볼까?':'← →와 점프 · 버튼 하나로도 올라가요.'))+(stored?'':' 이 기기의 발자국을 저장하지 못했어요.');if(status.textContent!==text)status.textContent=text;
  for(const b of blocks)course.children[b.id].classList.toggle('has-footprints',visited.has(b.id));
 }
 function constrain(from,to){
  if(!active||!here()||owner!==c.getStudent()?.id)return to;
  const a=from*width/100,b=to*width/100,height=flight?flight.landed?.height??flight.origin+flight.lift:base;let next=b;
  for(const block of blocks){if(height+.5>=block.height)continue;if(b>a&&a<=block.left&&b>block.left-3)next=Math.min(next,Math.max(a,block.left-3));if(b<a&&a>=block.right&&b<block.right+3)next=Math.max(next,Math.min(a,block.right+3))}
  if(flight?.landed)next=Math.max(flight.landed.left,Math.min(flight.landed.right,next));
  if(next!==b)message='나무 발판 앞이에요. 점프로 올라가요.';return next/width*100;
 }
 function takeoff(){if(!active)return true;if(falling)return false;flight={origin:base,lift:0,previous:base,airborne:false,landed:null};return true}
 function frame(height){
  if(!active||!flight||!here()||owner!==c.getStudent()?.id)return;
  flight.lift=height;const feet=flight.origin+height,b=support();
  if(height>1)flight.airborne=true;
  if(flight.airborne&&!flight.landed&&b&&flight.previous>=b.height-.5&&feet<=b.height&&feet<flight.previous)flight.landed=b;
  if(flight.landed)lift(Math.max(0,flight.landed.height-height));else lift(flight.origin);
  flight.previous=feet;
 }
 function end(completed){
  if(!flight)return;const landed=flight.landed,origin=flight.origin;flight=null;
  if(!active||!here()||owner!==c.getStudent()?.id){reset();sync();return}
  const under=support();lift(landed?.height??(under&&under.height<=origin?under.height:origin));if(completed&&landed)remember(landed);if(!under||under.height!==base)drop();sync();
 }
 action.onclick=()=>{
  activate();if(!here()||owner==null||flight||falling||player.hasAttribute('data-jumping')||doc.querySelector('dialog[open]'))return;c.stop();message='';
  if(!active){active=true;measure();course.hidden=false;c.walk.goToPoint((blocks[0].left-12)/width*100,'점프 길');sync();return}
  const at=x(),dir=player.dataset.facing==='left'?-1:1,block=dir>0?blocks.find(b=>b.right>at+2):[...blocks].reverse().find(b=>b.left<at-2);
  if(!block){message='점프 길을 건넜어요. 돌아서 다시 놀아도 좋아요.';sync();return}
  const edge=dir>0?block.left:block.right,inside=at>=block.left&&at<=block.right;
  const approach=inside?(dir>0?block.right-4:block.left+4):edge-dir*12;
  if(Math.abs(approach-at)>20){c.walk.goToPoint(approach/width*100,'발판 곁');message='발판 곁으로 걸어가요. 도착하면 다시 폴짝!';sync();return}
  if(c.jump()){const target=inside?approach+dir*27:edge+dir*16;c.walk.goToPoint(target/width*100,'폴짝',{continuous:true});}sync();
 };
 fold.onclick=()=>{c.stop();c.cancelJump();reset();sync();c.refresh()};
 const pause=()=>{if(active||flight||falling){c.stop();c.cancelJump();reset()}sync()};
 new ResizeObserver(()=>{if(active)pause();measure()}).observe(c.stage);
 reduce.addEventListener('change',()=>{pause();measure()});
 doc.addEventListener('student-dashboard-updated',()=>{if(owner!==c.getStudent()?.id)pause();sync()});
 new MutationObserver(()=>{if(active&&!here())pause();else sync()}).observe(c.hub,{attributes:true,attributeFilter:['class']});
 for(const type of ['blur','pagehide'])window.addEventListener(type,pause);doc.addEventListener('visibilitychange',()=>{if(doc.hidden)pause()});
 c.hub.addEventListener('click',e=>{if(e.target.closest('[data-campus=map],[data-campus=find],[data-campus=home],[data-route],[data-place=story]')&&active)pause()},true);
 measure();sync();return {sync,constrain,takeoff,frame,end};
}
