const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
export function weedMotion(phase,reduced=false){
 const p=clamp(phase),reach=ease(p/.24),pull=ease((p-.45)/.065),release=1-ease((p-.72)/.28),resist=p>=.24&&p<.45;
 return {phase:p,resisting:resist,contact:p>=.24,impact:p>=.58,lean:reduced?0:reach*release*(1-.72*pull),arm:reduced||!release?0:release*(reach*.3-pull*1.35),sideArm:reduced||!release?0:release*(reach*.3+pull*.95),rootAngle:reduced?0:resist?Math.sin((p-.24)/.21*Math.PI*3)*.055:0,rootLift:reduced?0:6*pull,transfer:ease((p-.58)/.14),scatter:reduced?0:clamp((p-.58)/.42)};
}
export function drawWeedRoot(g,asset,action,phase,reduced){
 const a=weedMotion(phase,reduced);if(reduced||a.impact)return;
 g.save();g.translate(action.x,action.y-a.rootLift);g.rotate(a.rootAngle);g.drawImage(asset,-25,-40,50,52);g.restore();
}
export function drawHeldWeed(g,asset,phase,root,hand,reduced){
 const a=weedMotion(phase,reduced);if(reduced||!a.impact||phase>=1)return;
 const k=a.transfer,x=root.x+(hand.x-root.x)*k,y=root.y-6+(hand.y-root.y+6)*k,w=50-18*k,h=52-18*k;
 g.save();g.globalAlpha=phase>.82?(1-phase)/.18:1;g.drawImage(asset,x-w/2,y-h*.77,w,h);g.restore();
}
export function drawWeedFragments(g,action,phase,reduced){
 const a=weedMotion(phase,reduced),u=a.scatter;if(reduced||!a.impact||u<=0||u>=1)return;
 g.save();g.globalAlpha=(1-u)*(1-u);g.translate(action.x,action.y-3);
 for(let i=0;i<9;i++){
  const sign=i%2?1:-1,x=sign*(14+i*5)*u,y=-(22+(i%3)*13)*Math.sin(u*Math.PI)+15*u*u;
  g.save();g.translate(x,y);g.rotate(sign*u*(2+i*.3));
  if(i<3){g.fillStyle=i%2?'#aabb66':'#879b51';g.strokeStyle='#64733d';g.lineWidth=.8;g.beginPath();g.moveTo(-5,0);g.quadraticCurveTo(0,-5,6,0);g.quadraticCurveTo(0,4,-5,0);g.fill();g.stroke();}
  else{g.fillStyle=i%2?'#977b4e':'#715a3c';g.beginPath();g.ellipse(0,0,1.7+(i%2),1.4,0,0,Math.PI*2);g.fill();}
  g.restore();
 }
 g.restore();
}
