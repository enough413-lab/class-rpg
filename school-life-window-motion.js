const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const front=[[160,188],[168,182],[416,182],[426,188],[426,350],[420,370],[164,370],[159,350]],side=[[0,272],[75,209],[86,210],[88,441],[76,462],[0,483]];
const outlines=[front,side,side.map(([x,y])=>[1536-x,y])];
function outline(g,index){g.beginPath();outlines[index].forEach(([x,y],i)=>g[i?'lineTo':'moveTo'](x,y));g.closePath();}
export function windowFrame(phase,reduced=false){return {phase:clamp(phase),curtain:reduced?1:ease((phase-.28)/.5),light:reduced?1:ease((phase-.48)/.36)};}
export function drawWindow(g,assets,index,amount=1){
 g.save();g.scale(1600/1536,1067/1024);outline(g,index);g.clip();
 if(amount<=0){g.drawImage(assets.classroomClosed,0,0);g.restore();return;}
 g.drawImage(assets.classroom,0,0);
 if(amount<1){
  const squeeze=1-amount;g.save();
  if(index===0){
   // The original two curtain panels gather at their own ends of the rail.
   g.drawImage(assets.classroomClosed,171,191,121,178,171,191,121*squeeze,178);
   g.drawImage(assets.classroomClosed,292,191,121,178,413-121*squeeze,191,121*squeeze,178);
  }else{
   // Preserve the side-wall perspective while gathering along its slanted rail.
   if(index===2){g.translate(1536,0);g.scale(-1,1);}
   g.transform(squeeze,.8*amount,0,1,88*amount,-70.4*amount);
   if(index===2){g.translate(1536,0);g.scale(-1,1);}
   outline(g,index);g.clip();g.drawImage(assets.classroomClosed,0,0);
  }
  g.restore();
 }
 g.restore();
}
