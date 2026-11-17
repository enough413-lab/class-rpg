const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
export const HARVEST_MS=1450;
export function harvestFrame(phase,reduced=false){
 const p=clamp(phase);
 return {phase:p,step:p<.32?'reach':p<.5?'pick':p<.68?'hold':p<.94?'pocket':'finish',
 contact:p>=.32,reach:reduced?0:ease(p/.27)*(1-ease((p-.34)/.3)),
 transfer:reduced?1:ease((p-.32)/.18),pocket:reduced?0:ease((p-.68)/.26),
 visible:p<.94,static:reduced};
}
// Same bag outline as the existing toolbar. The original flower asset is reused.
// This renderer cannot save, harvest or grant anything.
export function drawHarvest(g,image,action,frame,attachment){
 if(!attachment||!frame.visible)return;
 const {hand,pocket}=attachment;g.save();
 if(frame.contact||frame.static){
  g.save();g.translate(pocket.x-11,pocket.y-7);g.scale(.7,.7);const bag=new Path2D('M10 10V8a6 6 0 0 1 12 0v2M8 10h16l3 19H5zM6 17h20M12 19v4h8v-4');
  g.fillStyle='#e8d5a2';g.strokeStyle='#735f43';g.lineWidth=2;g.lineJoin='round';g.fill(bag);g.stroke(bag);g.restore();
  const q=frame.transfer,r=frame.pocket,origin={x:action.x,y:action.y-10};
  const held={x:origin.x+(hand.x-origin.x)*q,y:origin.y+(hand.y-origin.y)*q};
  const x=held.x+(pocket.x-held.x)*r,y=held.y+(pocket.y-held.y)*r,scale=(1-q*.55)*(1-r*.85);
  g.globalAlpha=1-r;g.drawImage(image,x-28*scale,y-51*scale,56*scale,69*scale);
 }
 g.restore();
}

