const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const PLANT_MS=1800;
export function plantingFrame(phase,reduced=false){
 const p=clamp(phase),step=p<.22?'reach':p<.42?'seed':p<.64?'cover':p<.91?'water':'finish';
 const contact=smooth(p/.23)*(1-smooth((p-.5)/.17));
 return {phase:p,step,seedPlaced:p>=.42,watering:step==='water',reach:reduced?0:contact,seedDrop:reduced?1:smooth((p-.30)/.12),cover:step==='cover'?(reduced?.5:smooth((p-.42)/.22)):null,water:step==='water'?(reduced?.5:(p-.64)/.27):null};
}
// This is the presentation of one explicit seed action. It never grows,
// saves, consumes or grants an inventory item on its own.
export function drawPlanting(g,action,frame,attachment,reduced=false){
 if(!attachment)return;
 const hand=attachment.hand,target={x:action.x,y:action.y};g.save();
 if(!frame.seedPlaced&&frame.phase>=.1){const q=frame.seedDrop,x=reduced?target.x:hand.x+(target.x-hand.x)*q,y=reduced?target.y:hand.y+(target.y-hand.y)*q;g.fillStyle='#e9cc83';g.strokeStyle='#8f6c3e';g.lineWidth=1.2;g.beginPath();g.ellipse(x,y,3,4,-.3,0,Math.PI*2);g.fill();g.stroke();}
 if(frame.cover!==null){g.fillStyle='#967052';for(let i=0;i<6;i++){const side=i%2?1:-1,q=frame.cover,x=target.x+side*(15-i)*(1-q),y=target.y-3-Math.sin(q*Math.PI)*3;g.beginPath();g.ellipse(x,y,2.8,1.7,0,0,Math.PI*2);g.fill();}}
 if(frame.watering&&attachment.spout){const from=attachment.spout;g.fillStyle='#c6e9eb';g.strokeStyle='#c6e9eb';g.lineWidth=1.5;for(let i=0;i<7;i++){const q=reduced?(i+1)/8:(frame.water*2.4+i/7)%1;g.beginPath();g.ellipse(from.x+(target.x-from.x)*q,from.y+(target.y-from.y)*q-10*Math.sin(q*Math.PI),1.8,3,0,0,Math.PI*2);g.fill();}g.beginPath();g.ellipse(target.x,target.y,12,4,0,0,Math.PI*2);g.stroke();}
 g.restore();
}
