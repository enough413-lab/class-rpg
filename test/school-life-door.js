const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
export const DOOR_MS=2200,DOOR_LOCK={x:815,y:315};
export function doorFrame(phase,origin,reduced=false){
 const p=clamp(phase),reach=reduced?0:ease(p/.3)*(1-ease((p-.72)/.28));
 return {phase:p,reduced,position:{x:origin.x+(844-origin.x)*reach,y:origin.y+(410-origin.y)*reach},walking:!reduced&&(p<.3||p>.72),walkPhase:p*5*Math.PI*2,keyPhase:clamp((p-.3)/.42),keyTurn:reduced?0:ease((p-.42)/.13),keyActive:reduced||p>=.3&&p<.6,release:reduced?1:ease((p-.5)/.13),open:reduced?1:ease((p-.56)/.2)};
}
export function createDoorAction(){
 let current=null;
 function view(time=performance.now(),reduced=false){if(!current)return null;const age=time-current.at,duration=reduced?350:DOOR_MS;if(age>=duration){current=null;return null;}return doorFrame(Math.max(0,age)/duration,current.origin,reduced);}
 return {start(origin,time=performance.now()){current={origin:{x:origin.x,y:origin.y},at:time};},stop(){current=null;},view,active:(t,r)=>!!view(t,r)};
}
export function drawSchoolDoor(g,image,opened,view=null){
 const amount=view?view.open:opened?1:0;
 if(amount>0&&image?.naturalWidth){
  g.save();g.scale(1600/1536,1067/1024);g.beginPath();g.rect(734,244,101,94);g.clip();
  const shade=g.createLinearGradient(0,244,0,338);shade.addColorStop(0,'#34443f');shade.addColorStop(.65,'#576150');shade.addColorStop(1,'#9c8257');g.fillStyle=shade;g.fillRect(734,244,101,94);
  const k=1-.78*amount;g.drawImage(image,734,244,49,94,734,244,49*k,94);g.drawImage(image,783,244,52,94,835-52*k,244,52*k,94);
  g.strokeStyle='#5e4934';g.lineWidth=1.2;for(const x of[734+49*k,835-52*k]){g.beginPath();g.moveTo(x,244);g.lineTo(x,338);g.stroke();}g.restore();
 }
 const release=view?view.release:opened?1:0;if(release>=1)return;
 g.save();g.translate(815,330);g.globalAlpha=1-release;g.lineWidth=2;g.strokeStyle='#6d5137';g.fillStyle='#a88757';
 for(const [i,[y,a]]of [[-40,-.12],[-17,.12]].entries()){g.save();g.translate((i?1:-1)*release*35,release*20);g.rotate(a+(i?1:-1)*release*.55);g.beginPath();g.roundRect(-49,y,98,16,3);g.fill();g.stroke();g.beginPath();g.moveTo(-38,y+6);g.lineTo(32,y+5);g.moveTo(-24,y+11);g.lineTo(39,y+10);g.stroke();for(const x of[-42,42]){g.fillStyle='#665b49';g.fillRect(x,y+6,3,3);}g.restore();}
 g.fillStyle='#e4bd68';g.fillRect(-8,-22+release*12,16,19);g.strokeRect(-8,-22+release*12,16,19);g.strokeStyle='#71583b';g.beginPath();g.arc(0,-22+release*12,6,Math.PI,Math.PI*2+release*.8);g.stroke();g.restore();
}
export function drawDoorKey(g,hand,view){
 const turning=view.keyActive&&!view.reduced,dx=DOOR_LOCK.x-hand.x,dy=DOOR_LOCK.y-hand.y,angle=turning?Math.atan2(dy,dx):-Math.PI/3,length=turning?Math.max(9,Math.min(35,Math.hypot(dx,dy))):19;
 g.save();g.translate(hand.x,hand.y);g.rotate(angle);g.scale(1,turning?Math.cos(view.keyTurn*Math.PI*.72):1);g.strokeStyle='#745b36';g.lineWidth=4;g.lineCap='round';g.beginPath();g.arc(-4,0,4,0,Math.PI*2);g.moveTo(0,0);g.lineTo(length,0);g.lineTo(length,-5);g.moveTo(length-5,0);g.lineTo(length-5,-4);g.stroke();g.strokeStyle='#e6c579';g.lineWidth=2;g.stroke();g.restore();return {grip:{x:hand.x,y:hand.y},tip:{x:hand.x+Math.cos(angle)*length,y:hand.y+Math.sin(angle)*length},lock:{...DOOR_LOCK}};
}
