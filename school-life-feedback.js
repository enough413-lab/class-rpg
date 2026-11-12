import {actionFrame,ACTION_MS} from './school-life-action.js?v=20261112-door';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const VECTORS={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]};
export function lookDirection(dx,dy,previous='d'){
 if(!dx&&!dy)return previous;
 return Math.abs(dx)>Math.abs(dy)?(dx<0?'l':'r'):(dy<0?'u':'d');
}
export function waterTarget(pos,dir,plots){
 const [dx,dy]=VECTORS[dir]||VECTORS.d;
 const column=Math.round((pos.x-597)/70)+dx,row=Math.round((pos.y-560)/56)+dy;
 const x=597+column*70,y=560+row*56;
 const index=plots.findIndex(([px,py])=>px===x&&py===y);
 return {x,y,index};
}
export function drawTarget(g,target){
 g.save();g.translate(target.x,target.y);g.fillStyle='#e5f7ec40';g.strokeStyle='#fdf8d8';g.lineWidth=3;
 g.beginPath();g.roundRect(-31,-24,62,48,9);g.fill();g.stroke();g.strokeStyle='#467d82';g.lineWidth=1.5;g.stroke();
 g.fillStyle='#4e8f9b';g.beginPath();g.moveTo(0,-18);g.quadraticCurveTo(-7,-8,0,-6);g.quadraticCurveTo(7,-8,0,-18);g.fill();g.restore();
}
export function drawWater(g,action,time,reduced){
 if(action?.kind!=='water')return;
 const age=time-action.at;if(age<0||age>950)return;
 const phase=age/ACTION_MS,frame=actionFrame('water',phase,reduced);if(!frame.stream)return;const alpha=Math.min(1,phase*7,(1-phase)*5);
 g.save();g.globalAlpha=alpha;g.strokeStyle='#d6f2ee';g.fillStyle='#c0e4e6';g.lineWidth=2.5;
 const from=action.spout||{x:action.from.x,y:action.from.y-45};
 for(let i=0;i<7;i++){
  const t=reduced?.65:((phase*2.4+i/7)%1),x=from.x+(action.x-from.x)*t+(i%3-1)*3*t,y=from.y+(action.y-from.y)*t-14*Math.sin(t*Math.PI);
  g.beginPath();g.ellipse(x,y,2,3.8,0,0,Math.PI*2);g.fill();
 }
 const spread=reduced?.5:phase;g.beginPath();g.ellipse(action.x,action.y,11+spread*12,4+spread*3,0,0,Math.PI*2);g.stroke();g.restore();
}
export function drawBroom(g,phase,reduced){
 const swing=actionFrame('dust',phase,reduced).sweep*.26;
 g.save();g.translate(-22,-41);g.rotate(-.3+swing);g.lineCap='round';g.strokeStyle='#6a503a';g.lineWidth=7;
 g.beginPath();g.moveTo(0,-18);g.lineTo(-12,32);g.stroke();g.strokeStyle='#cba771';g.lineWidth=3;g.stroke();
 g.fillStyle='#dec281';g.strokeStyle='#79633e';g.lineWidth=2;g.beginPath();g.moveTo(-20,24);g.lineTo(-4,28);g.lineTo(-1,55);g.quadraticCurveTo(-20,61,-32,47);g.closePath();g.fill();g.stroke();
 g.strokeStyle='#aa8b56';g.lineWidth=1.5;for(let i=0;i<5;i++){g.beginPath();g.moveTo(-19+i*3,29);g.lineTo(-27+i*6,49+i%2*6);g.stroke();}
 g.strokeStyle='#63836a';g.lineWidth=5;g.beginPath();g.moveTo(-21,29);g.lineTo(-5,33);g.stroke();g.restore();
}
export function createLifeFeedback(){
 let door=null,thought=null;
 const notice=(mark='!',time=performance.now())=>{thought={mark,at:time};};
 return {
  reset(){door=null;thought=null;},
  notice,
  unlock(time=performance.now(),reduced=false){door={at:time};notice('!',time+(reduced?350:2200));},
  busy(time,reduced){return !!door&&time-door.at<(reduced?350:1600);},
  cancel(){door=null;},
  draw(g,scene,pos,time,reduced){
   if(door&&scene==='campus'){
    const age=time-door.at,p=clamp(age/2200,0,1);if(p===1)door=null;
    else{g.save();g.globalAlpha=reduced?.2:p<.5?0:.3*Math.sin((p-.5)*Math.PI*2);const light=g.createRadialGradient(815,340,4,815,365,180);light.addColorStop(0,'#fff3bdcc');light.addColorStop(.5,'#ffe9a660');light.addColorStop(1,'#ffe9a600');g.fillStyle=light;g.fillRect(615,200,400,340);
     g.restore();}
   }
   if(thought){const age=time-thought.at;if(age>3200)thought=null;else if(age>=0){
    const lift=reduced?0:Math.sin(Math.min(age/350,1)*Math.PI)*5;
    g.save();g.translate(pos.x+24,pos.y-151-lift);g.globalAlpha=clamp((3200-age)/400,0,1);g.fillStyle='#fff2cf';g.strokeStyle='#846d48';g.lineWidth=2;
    g.beginPath();g.ellipse(0,0,19,22,0,0,Math.PI*2);g.fill();g.stroke();g.beginPath();g.moveTo(-5,20);g.lineTo(-11,27);g.lineTo(2,21);g.fill();g.stroke();
    g.font='30px SchoolLife';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#7a5835';g.fillText(thought.mark,0,1);g.restore();
   }}
  }
 };
}
