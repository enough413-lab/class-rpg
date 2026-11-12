import {windowFrame} from './school-life-window-motion.js?v=20261112-curtains';
// World coordinates: soft wall spill and the patch of floor below each window.
const pools=[
 [{x:305,y:404,rx:185,ry:135,angle:0,strength:.3},{x:385,y:605,rx:285,ry:175,angle:.2,strength:.42}],
 [{x:80,y:420,rx:130,ry:190,angle:.2,strength:.3},{x:225,y:630,rx:290,ry:180,angle:.3,strength:.42}],
 [{x:1520,y:420,rx:130,ry:190,angle:-.2,strength:.3},{x:1375,y:630,rx:290,ry:180,angle:-.3,strength:.42}]
];
export function windowLights(opened,motion=null){return opened.map(index=>({index,amount:motion?.index===index?windowFrame(motion.phase,motion.reduced).light:1}));}
export function createWindowLight(){
 let stamp;
 function prepare(){
  if(stamp)return stamp;stamp=document.createElement('canvas');stamp.width=stamp.height=256;
  const c=stamp.getContext('2d'),a=c.createRadialGradient(128,128,0,128,128,127);
  a.addColorStop(0,'rgba(255,239,190,.55)');a.addColorStop(.32,'rgba(255,234,178,.36)');a.addColorStop(.72,'rgba(255,229,167,.13)');a.addColorStop(1,'rgba(255,229,167,0)');
  c.fillStyle=a;c.fillRect(0,0,256,256);return stamp;
 }
 return {draw(g,lights){
  if(!lights.some(l=>l.amount>0))return;
  const source=prepare();g.save();g.globalCompositeOperation='screen';
  for(const {index,amount}of lights)if(amount>0&&pools[index])for(const p of pools[index]){g.save();g.globalAlpha=amount*p.strength;g.translate(p.x,p.y);g.rotate(p.angle);g.drawImage(source,-p.rx,-p.ry,p.rx*2,p.ry*2);g.restore();}
  g.restore();
 }};
}
