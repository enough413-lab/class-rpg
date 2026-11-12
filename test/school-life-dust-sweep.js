const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const directions={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]};
// Ground-space dust and the broom share one sweep front. Nothing here saves.
export function dustFrame(phase,direction='d',reduced=false){
 const p=clamp(phase),v=directions[direction]||directions.d,t=[-v[1],v[0]],extent=v[1]?18:32,progress=reduced?0:ease((p-.2)/.58),front=reduced?0:-extent+extent*2*progress,alpha=1-ease((p-.8)/.2);
 const piles=Array.from({length:5},(_,n)=>{
  const x=(n-2)*9,y=Math.sin(n)*6,along=x*v[0]+y*v[1],across=x*t[0]+y*t[1],caught=reduced?0:clamp((front-along+12)/12),moved=along+Math.max(0,front+8-along)*caught,side=across*(1-.65*progress*caught),size=1-.35*caught;
  return {x:v[0]*moved+t[0]*side,y:v[1]*moved+t[1]*side,rx:12*size,ry:6*size,caught};
 });
 return {phase:p,direction,vector:v,tangent:t,progress,front,alpha,piles,head:{x:v[0]*front,y:v[1]*front}};
}
export function drawSweptDust(g,action,phase,reduced=false){
 const frame=dustFrame(phase,action.direction,reduced);if(!frame.alpha)return;
 g.save();g.translate(action.x,action.y);g.globalAlpha=frame.alpha;g.fillStyle='#b5a38399';
 for(const p of frame.piles){g.beginPath();g.ellipse(p.x,p.y,p.rx,p.ry,0,0,Math.PI*2);g.fill();}
 g.restore();
}
export function drawSweepingBroom(g,hand,action,phase,reduced=false){
 const f=dustFrame(phase,action.direction,reduced),v=f.vector,t=f.tangent,head={x:action.x+f.head.x,y:action.y+f.head.y},grip={x:hand.x,y:hand.y},dx=head.x-hand.x,dy=head.y-hand.y,len=Math.hypot(dx,dy)||1;
 g.save();g.lineCap='round';g.lineJoin='round';g.strokeStyle='#6a503a';g.lineWidth=6;
 g.beginPath();g.moveTo(hand.x-dx/len*12,hand.y-dy/len*12);g.lineTo(head.x-v[0]*5,head.y-v[1]*5);g.stroke();g.strokeStyle='#cba771';g.lineWidth=2.5;g.stroke();
 g.translate(head.x,head.y);g.transform(t[0],t[1]*.55,v[0],v[1]*.55,0,0);
 g.fillStyle='#dec281';g.strokeStyle='#79633e';g.lineWidth=1.8;g.beginPath();g.moveTo(-17,-7);g.lineTo(17,-7);g.lineTo(29,8);g.quadraticCurveTo(0,15,-29,8);g.closePath();g.fill();g.stroke();
 g.strokeStyle='#aa8b56';g.lineWidth=1.2;for(let n=0;n<9;n++){g.beginPath();g.moveTo(-16+n*4,-4);g.lineTo(-25+n*6.25,9);g.stroke();}
 g.strokeStyle='#63836a';g.lineWidth=4;g.beginPath();g.moveTo(-18,-5);g.lineTo(18,-5);g.stroke();g.restore();return {grip,head,front:f.front,direction:f.direction};
}
