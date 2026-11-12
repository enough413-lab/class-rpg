const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);},mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
export const WORKER_SCALE=.2;
// Measured source-atlas foot and working-paw points; rows share their four poses.
export const WORKER_FRAMES=[
 {rect:[0,0,444,444],foot:[240,422],hand:[317,288]},
 {rect:[444,0,443,444],foot:[683,424],hand:[759,288]},
 {rect:[887,0,444,444],foot:[1121,420],hand:[1090,139]},
 {rect:[1331,0,443,444],foot:[1563,420],hand:[1644,289]}
];
export const WORK_SITES={bench:{x:850,y:644},school:{x:1014,y:452},garden:{x:731,y:650},library:{x:1060,y:820},lights:{x:1016,y:964}};
const SUPPORT_SITES={bench:{x:1055,y:650},school:{x:1125,y:475},garden:{x:845,y:680},library:{x:1260,y:840},lights:{x:1115,y:990}};
export function workerHand(worker){const a=WORKER_FRAMES[worker.pose];return {x:worker.x+(a.hand[0]-a.foot[0])*WORKER_SCALE*worker.facing,y:worker.y+(a.hand[1]-a.foot[1])*WORKER_SCALE};}
export function workerScene(view){
 if(!view||!WORK_SITES[view.id])return null;
 const p=view.phase,home=WORK_SITES[view.id],lead=(317-240)*WORKER_SCALE,meet={x:home.x+2*lead,y:home.y},support=SUPPORT_SITES[view.id];
 let a={...home},b={...meet},poseA=0,poseB=0,faceA=1,faceB=-1;
 const arrival=ease(p/.27),depart=ease((p-.86)/.14),walkPose=Math.floor(p*18)%2;
 if(!view.reduced){
  if(p<.27){a=mix({x:home.x-75,y:home.y+7},home,arrival);b=mix({x:meet.x+75,y:meet.y+7},meet,arrival);poseA=poseB=walkPose;}
  else if(p>=.43&&p<.86){b=mix(meet,support,ease((p-.43)/.27));poseB=p<.7?walkPose:0;faceB=p<.7?1:-1;poseA=((p-.43)/.43*3)%1<.52?2:3;}
  else if(p>=.86){a=mix(home,{x:home.x-55,y:home.y+8},depart);b=mix(support,{x:support.x+55,y:support.y+8},depart);poseA=poseB=walkPose;faceA=-1;faceB=1;}
 }else{b=support;poseA=3;}
 const workers=[{id:'green',row:0,...a,pose:poseA,facing:faceA},{id:'blue',row:1,...b,pose:poseB,facing:faceB}];for(const w of workers)w.hand=workerHand(w);
 const owner=view.reduced||p>=.36?0:1,hammer= p<.86?{owner:workers[owner].id,grip:{...workers[owner].hand},raised:workers[owner].pose===2,passing:!view.reduced&&p>=.27&&p<.43}:null;
 const carried=p<.27||view.reduced&&p<.86?{owner:view.reduced?'blue':'green',kind:view.id==='library'?'book':view.id==='lights'?'lantern':view.wood?'branch':'plank'}:null;
 return {phase:p,stage:p<.27?'carry':p<.43?'handoff':p<.86?'work':'leave',workers,hammer,carried,alpha:p<.86?1:1-depart,reduced:view.reduced};
}
function sprite(g,image,w){const a=WORKER_FRAMES[w.pose],r=a.rect,dy=w.row*444;g.save();g.translate(w.x,w.y);g.scale(w.facing*WORKER_SCALE,WORKER_SCALE);g.drawImage(image,r[0],r[1]+dy,r[2],w.row?443:444,r[0]-a.foot[0],-a.foot[1],r[2],w.row?443:444);g.restore();}
function grip(g,image,w){const a=WORKER_FRAMES[w.pose],x=a.hand[0]-17,y=a.hand[1]-17;g.save();g.translate(w.x,w.y);g.scale(w.facing*WORKER_SCALE,WORKER_SCALE);g.drawImage(image,x,y+w.row*444,34,34,x-a.foot[0],y-a.foot[1],34,34);g.restore();}
function hammer(g,tool,facing){
 const angle=tool.passing?Math.PI/2:tool.raised?-1.05:.06;g.save();g.translate(tool.grip.x,tool.grip.y);g.scale(facing,1);g.rotate(angle);g.lineCap='round';g.strokeStyle='#70543b';g.lineWidth=5;g.beginPath();g.moveTo(-3,0);g.lineTo(18,0);g.stroke();g.strokeStyle='#c19962';g.lineWidth=2;g.stroke();g.fillStyle='#7b8580';g.strokeStyle='#45574d';g.lineWidth=1.5;g.beginPath();g.roundRect(13,-8,11,16,2);g.fill();g.stroke();g.restore();
}
function carry(g,assets,w,kind){const h=w.hand;g.save();g.translate(h.x,h.y);g.scale(w.facing,1);
 if(kind==='branch')g.drawImage(assets.branch,-10,-25,48,33);
 else if(kind==='book')g.drawImage(assets.readingNook,55,201,142,79,-15,-14,30,17);
 else if(kind==='lantern')g.drawImage(assets.lantern,-12,-35,24,36);
 else{g.fillStyle='#c39b61';g.strokeStyle='#70573b';g.lineWidth=1.5;g.beginPath();g.roundRect(-25,-7,50,10,2);g.fill();g.stroke();}g.restore();}
export function workerLayers(view,assets){
 const scene=workerScene(view);if(!scene||!assets.workers?.naturalWidth)return [];
 const layers=scene.workers.map(w=>({id:'repair-worker-'+w.id,y:w.y,actor:{left:w.x-47,right:w.x+47,top:w.y-90,bottom:w.y+5},draw(g){
  g.save();g.globalAlpha=scene.alpha;g.fillStyle='#314b3b35';g.beginPath();g.ellipse(w.x,w.y+2,16,5,0,0,Math.PI*2);g.fill();sprite(g,assets.workers,w);
  if(scene.carried?.owner===w.id){carry(g,assets,w,scene.carried.kind);grip(g,assets.workers,w);}
  if(scene.hammer?.owner===w.id&&!scene.hammer.passing){hammer(g,scene.hammer,w.facing);grip(g,assets.workers,w);}g.restore();
 }}));
 if(scene.hammer?.passing)layers.push({id:'repair-worker-tool',y:Math.max(...scene.workers.map(w=>w.y))+.1,draw(g){g.save();g.globalAlpha=scene.alpha;const owner=scene.workers.find(w=>w.id===scene.hammer.owner);hammer(g,scene.hammer,owner.facing);for(const w of scene.workers)grip(g,assets.workers,w);g.restore();}});
 return layers;
}
