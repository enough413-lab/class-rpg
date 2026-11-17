import {selectedGround} from './school-life-ground-map.js?v=20261117-boundary';
import {waterTarget,VECTORS} from './school-life-feedback.js?v=20261112-door';
// The six retained flower anchors belong to the original 70x56 bed.
// All tools share this compatibility selection; the surrounding lawn stays on
// its persisted 56x56 ground grid. No old flower or dug plot is moved.
export function selectedToolTarget(pos,direction,flowers=[]){
 const flower=waterTarget(pos,direction,flowers);
 if(flower.index>=0)return {...flower,id:'flower'+flower.index,kind:'flower'};
 const cell=selectedGround(pos,direction);
 if(cell)return {...cell,index:-1,kind:'ground'};
 const [dx,dy]=VECTORS[direction]||VECTORS.d;
 return {id:null,index:-1,kind:'outside',x:pos.x+dx*56,y:pos.y+dy*56};
}
export function drawToolTarget(g,target,allowed=true){
 if(!target)return;g.save();g.strokeStyle=allowed?'#fff4b7':'#715c4b';g.lineWidth=2;g.setLineDash(allowed?[]:[5,4]);g.strokeRect(target.x-26,target.y-16,52,34);g.setLineDash([]);
 if(!allowed){g.beginPath();g.moveTo(target.x-6,target.y-5);g.lineTo(target.x+6,target.y+7);g.moveTo(target.x+6,target.y-5);g.lineTo(target.x-6,target.y+7);g.stroke();}g.restore();
}
