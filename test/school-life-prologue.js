// Read-only prologue. The caller owns the single explicit start save.
export function createLifePrologue({host,valid,finish,cancel,tone,toggleSound,soundEnabled}){
 const panel=document.createElement('section');
 panel.id='lifePrologue';panel.className='life-prologue';panel.hidden=true;
 panel.setAttribute('aria-label','학교에서 온 초대장');
 panel.innerHTML='<div class="life-prologue-top"><span>우리학교, 다시 봄</span><div><button type="button" data-intro="sound" aria-pressed="false">소리 켜기</button><button type="button" data-intro="cancel">타이틀로</button></div></div><div class="life-prologue-bottom"><div class="life-prologue-copy" aria-live="polite" aria-atomic="true"><p class="life-prologue-kicker"></p><p class="life-prologue-caption"></p></div><div class="life-prologue-actions"><span class="life-prologue-count" aria-label="이야기 장면"></span><button type="button" data-intro="skip">건너뛰기</button><button type="button" data-intro="next">다음 장면</button></div></div>';
 host.append(panel);
 const captions=[
  ['오래전, 이 학교에서','마지막 종소리가 운동장에 퍼졌어요.'],
  ['그리고 시간이 흘러','교실은 조용해지고,\n책들은 친구들을 기다렸어요.'],
  ['닫힌 문 너머에는','다시 웃음소리가 나길 바라는\n작은 마음이 남아 있었어요.'],
  ['어느 봄날, 너에게','잎사귀 초대장 한 통이 도착했어요.\n이 학교의 다음 이야기는, 너와 함께.']
 ];
 let active=false,index=0,elapsed=0,last=0,advancedAt=0,ending=false;
 const nextButton=panel.querySelector('[data-intro=next]');
 function syncSound(){const b=panel.querySelector('[data-intro=sound]');b.textContent=soundEnabled()?'소리 끄기':'소리 켜기';b.setAttribute('aria-pressed',String(soundEnabled()));}
 function ring(){if(index!==0)return;tone(523.25,1.7);tone(1046.5,1.1);}
 function show(){elapsed=0;last=0;advancedAt=performance.now();panel.dataset.scene=String(index);panel.querySelector('.life-prologue-kicker').textContent=captions[index][0];panel.querySelector('.life-prologue-caption').textContent=captions[index][1];panel.querySelector('.life-prologue-count').textContent=(index+1)+' / '+captions.length;nextButton.textContent=index===3?'내 방으로':'다음 장면';nextButton.focus({preventScroll:true});ring();}
 function stop(){active=false;ending=false;last=0;panel.hidden=true;host.removeAttribute('data-prologue');}
 function end(){if(!active||ending||!valid())return;ending=true;finish();}
 function next(){if(!active||ending||!valid()||performance.now()-advancedAt<300)return;if(index===3)end();else{index++;show();}}
 panel.querySelector('[data-intro=next]').onclick=next;
 panel.querySelector('[data-intro=skip]').onclick=()=>{if(active&&performance.now()-advancedAt>=300)end();};
 panel.querySelector('[data-intro=cancel]').onclick=()=>{if(active&&valid()){stop();cancel();}};
 panel.querySelector('[data-intro=sound]').onclick=()=>{if(!active||!valid())return;toggleSound();syncSound();if(soundEnabled())ring();};
 function start(){index=0;active=true;ending=false;panel.hidden=false;host.dataset.prologue='true';syncSound();show();}
 function draw(g,assets,W,H,t,reduced,paused){
  if(!active)return;
  if(!paused&&last)elapsed+=Math.min(50,t-last);last=t;
  const p=reduced?1:Math.min(1,elapsed/5000),fade=reduced?1:Math.min(1,elapsed/650);
  const image=index===0?assets.prologueBell:index===1?assets.classroomClosed:index===3?assets.room:assets.campus;
  g.fillStyle='#1c302a';g.fillRect(0,0,W,H);
  const focus=index===0?[.50,.40]:index===1?[.50,.40]:index===2?[.51,.30]:[.50,.57];
  const zoom=index===0?1.04-p*.02:index===2?1.08-p*.05:1.04;
  const scale=Math.max(W/image.naturalWidth,H/image.naturalHeight)*zoom;
  const iw=image.naturalWidth*scale,ih=image.naturalHeight*scale;
  const x=Math.min(0,Math.max(W-iw,W*.5-iw*focus[0])),y=Math.min(0,Math.max(H-ih,H*.43-ih*focus[1]));
  g.save();g.globalAlpha=fade;g.drawImage(image,x,y,iw,ih);
  g.fillStyle=index===1?'#1c343644':'#223d2d22';g.fillRect(0,0,W,H);
  if(index===1&&!reduced){g.fillStyle='#e9dcb966';for(let i=0;i<12;i++){const dx=(i*97+elapsed*.007)%W,dy=H*.24+(i*47+elapsed*.003)%(H*.37);g.beginPath();g.arc(dx,dy,1.5,0,Math.PI*2);g.fill();}}
  if(index===2){
   g.save();g.translate(x+815/1600*iw,y+309/1067*ih);const k=iw/1600;g.scale(k,k);
   g.fillStyle='#a88960';g.strokeStyle='#6e563b';g.lineWidth=2;
   for(const [dy,angle]of [[-15,-.09],[11,.09]]){g.save();g.rotate(angle);g.fillRect(-44,dy,88,13);g.strokeRect(-44,dy,88,13);g.restore();}g.restore();
  }
  if(index===3){
   const width=Math.min(W*.65,380),height=width*assets.invitation.naturalHeight/assets.invitation.naturalWidth;
   const float=reduced?0:Math.sin(elapsed*.0012)*3;
   const glow=g.createRadialGradient(W*.5,H*.38,5,W*.5,H*.38,width*.7);glow.addColorStop(0,'#fff8c199');glow.addColorStop(1,'#fff8c100');g.fillStyle=glow;g.fillRect(0,0,W,H);
   g.save();g.translate(W*.5,H*.38+float);if(!reduced)g.rotate((1-p)*-.035);g.shadowColor='#263c3544';g.shadowBlur=18;g.shadowOffsetY=12;g.drawImage(assets.invitation,-width/2,-height/2,width,height);g.restore();
  }
  const shade=g.createLinearGradient(0,0,0,H);shade.addColorStop(0,'#122d3877');shade.addColorStop(.25,'#122d3800');shade.addColorStop(.48,'#122d3800');shade.addColorStop(.73,'#152d3299');shade.addColorStop(1,'#152d32f2');g.fillStyle=shade;g.fillRect(0,0,W,H);g.restore();
 }
 return {start,stop,next,draw,snapshot:()=>active?{scene:index,elapsed}:null};
}

