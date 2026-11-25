// Facility use is a view of the existing completed projects, never saved progress.
export function residentUse(state,repairing=null,daylight=null){
 const settled=state?.opening?.legacy||state?.opening?.step>=7;
 const completed=id=>settled&&state.projects.includes(id)&&repairing?.id!==id;
 return {
  saessak:daylight==='morning'&&completed('garden')?{activity:'garden',x:802,y:517,depth:517,w:69,h:103,target:{x:803,y:533}}:completed('bench')?{activity:'bench',x:986,y:580,depth:596,w:57,h:102,target:{x:997,y:616}}:null,
  tori:daylight!=='evening'&&completed('library')?{activity:'reading',x:1097,y:803,depth:801,w:75,h:100,target:{x:1097,y:824}}:null
 };
}

export function paintResidentActivity(g, resident, time, reducedMotion, can) {
 if(resident?.activity==='garden'){
  const cycle=(time%5200)/5200;
  const pour=reducedMotion?0:Math.max(0,Math.sin((cycle-.13)*Math.PI*2));
  const x=resident.x+24,y=resident.y-42;
  g.save();g.translate(x,y);g.rotate(pour*.36);
  if(can?.naturalWidth)g.drawImage(can,-8,-10,34,25);
  g.restore();
  if(pour>.35){
   g.save();g.fillStyle='#9dd7df';
   for(let i=0;i<4;i++){
    const drift=(time/150+i*.27)%1;
    const dropX=x+23+drift*25,dropY=y+7+drift*31;
    g.fillRect(Math.round(dropX),Math.round(dropY),3,4);
   }
   g.restore();
  }
 }
 if(resident?.activity==='reading'){
  const cycle=reducedMotion?0:(time%6700)/6700;
  const turn=cycle>.78?Math.sin((cycle-.78)/.22*Math.PI):0;
  g.save();g.translate(resident.x,resident.y-33);
  g.fillStyle='#634d42';g.fillRect(-15,-1,30,13);
  g.fillStyle='#f0d9a3';g.fillRect(-13,0,12,10);g.fillRect(1,0,12,10);
  g.fillStyle='#9a7557';g.fillRect(-1,1,2,10);
  if(turn>0){
   g.fillStyle='#fff2cf';
   g.beginPath();g.moveTo(0,1);g.lineTo(13-26*turn,-9*turn);
   g.lineTo(13-26*turn,9-9*turn);g.lineTo(0,10);g.closePath();g.fill();
  }
  g.restore();
 }
}
