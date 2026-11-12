const clamp=x=>Math.max(0,Math.min(1,x));
export const REPAIR_MS=2600;
export const REPAIR_PLACES={bench:{scene:'campus',x:945,y:610},school:{scene:'campus',x:1020,y:465},garden:{scene:'campus',x:805,y:620},library:{scene:'classroom',x:1160,y:800},lights:{scene:'campus',x:1005,y:941}};
export function repairFrame(id,phase,reduced=false){
 const p=clamp(phase);return {id,phase:p,stage:p<.3?'materials':p<.86?'work':'complete',work:reduced?(p<.3?0:p<.86?.5:1):clamp((p-.3)/.56),fade:p<.86?1:1-(p-.86)/.14,reduced};
}
function plank(g,x,y,w,h,angle=0){g.save();g.translate(x,y);g.rotate(angle);g.fillStyle='#c39b61';g.strokeStyle='#70573b';g.lineWidth=2;g.beginPath();g.roundRect(-w/2,-h/2,w,h,2);g.fill();g.stroke();g.strokeStyle='#947448';g.lineWidth=1;g.beginPath();g.moveTo(-w*.35,-h*.15);g.lineTo(w*.32,-h*.15);g.stroke();g.restore();}
function crate(g,x,y){plank(g,x,y,54,29);plank(g,x,y-10,58,7);plank(g,x,y+11,58,7);for(const dx of[-20,20])plank(g,x+dx,y,7,28);}
function parts(g,assets,id,wood,work){
 const {x,y}=REPAIR_PLACES[id];g.save();g.globalAlpha*=1-work*.75;
 if(wood){for(let i=1;i<wood;i++)g.drawImage(assets.branch,x+45+(i%2)*10,y-32-Math.floor(i/2)*8,48,33);}
 else if(id==='library'){g.drawImage(assets.readingNook,55,201,142,79,x-65,y-29,65,36);g.drawImage(assets.readingNook,63,277,286,120,x+10,y-33,77,33);}
 else if(id==='garden'){for(let i=0;i<4;i++)plank(g,x+49,y+24-i*7,67,6,-.09);g.strokeStyle='#ad8a58';g.lineWidth=3;g.beginPath();g.ellipse(x+75,y+32,15,6,0,0,Math.PI*2);g.stroke();}
 else if(id==='lights'){crate(g,x+55,y-8);g.save();g.filter='saturate(.45) brightness(.85)';g.translate(x+43,y-19);g.rotate(-.36);g.drawImage(assets.lantern,-15,-54,30,54);g.restore();}
 g.restore();
}
function scaffold(g){
 for(const x of[498,690,1050,1200])plank(g,x,310,9,286);for(const y of[225,342])plank(g,849,y,730,12);
 for(const [x,a]of[[591,.62],[1125,-.62]])plank(g,x,300,222,7,a);
}
function workScene(g,assets,view){
 const {id,work}=view,{x,y}=REPAIR_PLACES[id];
 if(id==='bench'){
  g.save();g.beginPath();g.rect(870,485,150*work,120);g.clip();g.drawImage(assets.bench,870,490,150,105);g.restore();
  plank(g,946,570,112,11,-.035);
 }else if(id==='school'){scaffold(g);}
 else if(id==='garden'){
  g.strokeStyle='#c6b484';g.lineWidth=2;g.setLineDash([7,6]);g.strokeRect(566,588,202,50);g.setLineDash([]);
  for(let i=0;i<3;i++){plank(g,568+i*99,615,5,37);if(work>(i+1)*.24)g.drawImage(assets.soil,570+i*70,597,54,30);}
 }else if(id==='library'){
  g.save();g.beginPath();g.rect(1069,800-150*work,182,150*work);g.clip();g.drawImage(assets.readingNook,1069,650,182,150);g.restore();
  for(const dx of[-67,67])plank(g,x+dx,y-40,7,68);plank(g,x,y-70,141,8);
 }else if(id==='lights'){
  for(let i=0;i<5;i++){const lx=630+i*105,ly=931;plank(g,lx,ly,5,25);if(work>(i+1)*.14){g.save();g.filter='saturate(.45) brightness(.85)';g.drawImage(assets.lantern,lx-32,ly-103,64,110);g.restore();}}
 }
}
export function createFacilityRepair(){
 let current=null;
 function view(time=performance.now(),reduced=false){if(!current)return null;const duration=reduced?1000:REPAIR_MS,p=(time-current.at)/duration;if(p>=1){current=null;return null;}return {...repairFrame(current.id,p,reduced),wood:current.wood};}
 return {
  start(project,time=performance.now()){if(!REPAIR_PLACES[project.id])return false;current={id:project.id,wood:project.wood,at:time};return true;},stop(){current=null;},view,active:(t,r)=>!!view(t,r),
  visible(id,projects,time,reduced){const a=view(time,reduced);return projects.includes(id)&&(!a||a.id!==id||a.stage==='complete');},
  layers(scene,assets,level,projects,time,reduced){
   const a=view(time,reduced),layers=[];
   for(const id of['garden','library','lights']){const place=REPAIR_PLACES[id],required={garden:7,library:10,lights:15}[id];if(place.scene!==scene||projects.includes(id)||level<required||a?.id===id)continue;
    layers.push({id:'unfinished-'+id,y:place.y,draw(g){if(id==='library'){plank(g,place.x,place.y-10,100,9,-.14);plank(g,place.x+5,place.y-4,95,9,.1);}else if(id==='garden'){for(const x of[571,767])plank(g,x,621,5,27);}else{crate(g,place.x+55,place.y-8);}}});
   }
   if(a&&REPAIR_PLACES[a.id].scene===scene)layers.push({id:'repair-'+a.id,y:REPAIR_PLACES[a.id].y+16,draw(g){g.save();g.globalAlpha=a.fade;parts(g,assets,a.id,a.wood,a.work);if(a.stage!=='materials')workScene(g,assets,a);g.restore();}});
   return layers;
  }
 };
}
