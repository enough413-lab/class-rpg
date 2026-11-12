const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
export const ACTION_MS=950;
// Visual phases only. The explicit game action owns the single state change.
export function actionFrame(kind,phase,reduced=false){
 const p=clamp(phase),stage=p<.32?'prepare':p<.68?'execute':'recover';
 const reach=ease(p/.32),release=1-ease((p-.68)/.32),work=ease((p-.32)/.36);
 if(kind==='window'){const hold=reach*release;return {kind,phase:p,stage,contact:p>=.28,impact:p>=.4,lean:reduced?0:.35*hold,arm:reduced?0:2.1*hold,sideArm:reduced?0:2.1*hold,lift:0,tilt:0,stream:false,sweep:0};}
 const pull=kind==='weed'||kind==='branch'||kind==='invitation'||kind==='plant';
 const tug=ease((p-.32)/.2);
 const sweep=kind==='dust'?Math.sin(work*Math.PI*2):0;
 return {kind,phase:p,stage,contact:p>=.32,impact:p>=.44,
  lean:reduced?0:reach*release*(pull?1-.42*work:.6),
  arm:reduced?0:release*(pull?reach*.28-tug*1.35:kind==='dust'?reach*.3+sweep*.28:reach*.48),
  sideArm:reduced?0:release*(pull?reach*.28+tug*.85:kind==='dust'?reach*.3+sweep*.28:reach*.48),
  lift:0,
  tilt:reduced?0:reach*release*.48,
  stream:reduced||p>=.32&&p<.68,
  sweep:reduced?0:sweep};
}
export function actionPose(direction,frame,facing=1){
 const side=direction==='l'||direction==='r',sign=direction==='r'?-1:1;
 const working=side?1:direction==='u'?0:facing>0?0:1;
 const arms=[-1,1].map((n,i)=>{
  const pivot=[side?6*sign:n*12,-66],active=frame.kind==='window'||i===working;
  const arm=side?frame.sideArm:frame.arm;
  return {pivot,x:pivot[0],y:pivot[1],angle:(active?arm:arm*.12)*(side?sign:-n)};
 });
 return {arms,working};
}
