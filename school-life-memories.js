// Environmental memories are observations, not quests, inventory or saved progress.
export function createSchoolMemories(api){
 const targets=[
  {id:'oldClock',x:800,y:485,label:'멈춘 시계',action:'살펴보기',kind:'memory'},
  {id:'oldPhoto',x:1240,y:485,label:'먼지 쌓인 사진',action:'살펴보기',kind:'memory'},
  {id:'waitingBook',x:1150,y:545,label:'책갈피가 꽂힌 책',action:'살펴보기',kind:'memory'}
 ];
 function photo(g,assets,w,h){
  g.save();g.fillStyle='#785c40';g.strokeStyle='#5f4b36';g.lineWidth=w*.015;g.beginPath();g.roundRect(0,0,w,h,w*.025);g.fill();g.stroke();
  g.fillStyle='#eadbb2';g.fillRect(w*.055,h*.07,w*.89,h*.86);
  g.save();g.beginPath();g.rect(w*.1,h*.13,w*.8,h*.68);g.clip();g.filter='sepia(.32) saturate(.65)';
  g.drawImage(assets.campus,w*.10,h*.13,w*.8,h*.68);
  for(const [key,x]of [['saessak',.29],['tori',.50],['duri',.71]]){const image=assets[key];if(!image?.naturalWidth)continue;const ph=h*.53,pw=ph*image.naturalWidth/image.naturalHeight;g.drawImage(image,w*x-pw/2,h*.81-ph,pw,ph);}
  g.restore();g.fillStyle='#bca87977';for(const[x,y]of [[.12,.10],[.86,.14],[.2,.85],[.78,.87],[.91,.75]]){g.beginPath();g.ellipse(w*x,h*y,w*.045,h*.018,0,0,Math.PI*2);g.fill();}
  g.restore();
 }
 function book(g,w,h){
  g.save();g.fillStyle='#527866';g.strokeStyle='#5b5940';g.lineWidth=w*.03;g.beginPath();g.roundRect(0,0,w,h,w*.06);g.fill();g.stroke();g.fillStyle='#e6d5a8';g.fillRect(w*.10,h*.15,w*.79,h*.75);g.fillStyle='#658b70';g.fillRect(0,0,w,h*.8);g.strokeRect(0,0,w,h*.8);g.strokeStyle='#bcd0a0';g.lineWidth=w*.02;g.strokeRect(w*.2,h*.15,w*.60,h*.48);
  g.fillStyle='#d5b26b';g.beginPath();g.moveTo(w*.65,h*.1);g.lineTo(w*.8,h*.1);g.lineTo(w*.8,h*1.08);g.lineTo(w*.725,h*.99);g.lineTo(w*.65,h*1.08);g.closePath();g.fill();g.restore();
 }
 function draw(g,scene,assets){
  if(scene!=='classroom')return;
  g.save();g.translate(1170,190);photo(g,assets,104,78);g.restore();
  g.save();g.translate(1053,425);g.rotate(-.08);book(g,44,32);g.restore();
 }
 function handle(e,assets){
  if(e.kind!=='memory')return false;
  if(e.id==='oldClock')api.talk('멈춘 시계','종이 울리던 시각에 멈춘 시계.\n초침은 움직이지 않는다.',[{label:'조용히 바라보기'}]);
  else if(e.id==='oldPhoto'){
   api.book('먼지 쌓인 사진','<canvas class="life-memory-picture" width="480" height="360" aria-label="학교 앞에 함께 선 새싹, 토리, 두리의 오래된 사진" role="img"></canvas><p class="life-memory-note">학교 앞에 선 새싹, 토리, 두리.<br>사진 아래 작은 글씨가 남아 있다.<br>“우리, 다음 봄에도 여기서 만나자.”</p>');
   const canvas=api.overlay().querySelector('canvas');photo(canvas.getContext('2d'),assets,480,360);
  }else if(e.id==='waitingBook'){
   api.book('책갈피가 꽂힌 책','<canvas class="life-memory-book" width="220" height="170" aria-label="금빛 책갈피가 꽂힌 초록색 책" role="img"></canvas><p class="life-memory-note">반쯤 읽다 만 책.<br>책갈피에 한 문장이 적혀 있다.<br>“다음 이야기는 친구들과 함께.”</p>');
   const canvas=api.overlay().querySelector('canvas');book(canvas.getContext('2d'),200,145);
  }else return false;
  return true;
 }
 return {entities:scene=>scene==='classroom'?targets.map(t=>({...t})):[],draw,handle};
}

