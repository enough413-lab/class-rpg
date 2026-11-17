import {WEEDS,BRANCHES,FLOWERS} from './school-life-state.js?v=20261112-windows';
export const GROUND_MAP='campus-lawn-20261117-v1',CELL_SIZE=56;
// World coordinates of the two retained 1600x1067 campus backdrops.
// Soil footprint, not just its centre, must fit inside an authored lawn polygon.
export const LAWN_POLYGONS=[
 [[176,598],[430,598],[480,535],[765,535],[870,483],[870,400],[1135,400],[1135,475],[1090,530],[1080,620],[1128,680],[1120,760],[1170,822],[1260,850],[1430,850],[1430,872],[180,872]],
 [[475,402],[755,402],[755,452],[475,452]],
 [[880,402],[1360,402],[1360,430],[1190,450],[1150,480],[880,480]],
 [[215,947],[690,947],[690,1000],[215,1000]],
 [[860,947],[1350,947],[1350,1000],[860,1000]]
];
export const RESERVED_RECTS=[
 [845,480,1055,665], // bench, resident and approach
 [290,670,420,800], // retained story exhibition
 [1050,590,1118,665], // Duri
 [495,505,575,575], // Saessak before completion
 [100,840,250,950], // back gate
 [1105,835,1220,995], // school bell
 ...[630,735,840,945,1050].map(x=>[x-38,910,x+38,967]),
 ...FLOWERS.map(([x,y])=>[x-34,y-22,x+34,y+24])
];
const inside=(x,y,p)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
export function groundCell(id){if(!Number.isInteger(id)||id<0||id>=28*20)return null;const col=id%28,row=Math.floor(id/28);return {id,col,row,x:col*56+28,y:row*56+28};}
function fits(c){return LAWN_POLYGONS.some(p=>[[-26,-16],[26,-16],[-26,18],[26,18]].every(([dx,dy])=>inside(c.x+dx,c.y+dy,p)))&&!RESERVED_RECTS.some(([l,t,r,b])=>c.x+26>l&&c.x-26<r&&c.y+18>t&&c.y-16<b);}
export const GROUND_CELLS=Object.freeze(Array.from({length:560},(_,i)=>groundCell(i)).filter(fits).map(c=>c.id));
const allowed=new Set(GROUND_CELLS);
export function groundAllowed(id){return allowed.has(id);}
export function selectedGround(pos,look){const vector={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]}[look]||[0,1],col=Math.floor(pos.x/56)+vector[0],row=Math.floor(pos.y/56)+vector[1];if(col<0||col>=28||row<0||row>=20)return null;return groundCell(row*28+col);}
export function groundObstructed(id,state){const c=groundCell(id);if(!c||!groundAllowed(id))return true;return [[WEEDS,state.weeds],[BRANCHES,state.branches]].some(([points,cleared])=>points.some(([x,y],i)=>!cleared.includes(i)&&Math.abs(x-c.x)<50&&Math.abs(y-c.y)<40));}
