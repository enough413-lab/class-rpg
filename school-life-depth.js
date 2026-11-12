// Native background coordinates. Only furniture surfaces are re-painted;
// the openings between legs keep showing the character behind them.
const desk=[[[151,545],[230,545],[233,550],[223,583],[139,583],[138,576]],[[141,582],[222,582],[220,590],[142,590]],[[144,588],[154,588],[154,642],[145,642]],[[208,588],[218,588],[218,642],[208,642]],[[154,618],[208,618],[208,626],[154,626]]];
const chair=[[[98,550],[113,532],[122,529],[127,533],[124,557],[109,578],[103,577]],[[111,582],[141,577],[145,595],[139,602],[115,602]],[[107,568],[114,570],[119,640],[109,640]],[[132,599],[141,599],[142,637],[132,637]]];
const shift=(polys,x,y,mirror=false)=>polys.map(p=>p.map(([a,b])=>[mirror?1533-(a+x):a+x,b+y]));
export const FURNITURE_MASKS={
 classroom:[
  {id:'teacherDesk',foot:505,polygons:[[[972,407],[1116,407],[1128,433],[1125,445],[974,445]],[[977,445],[994,445],[995,504],[979,504]],[[1108,445],[1120,445],[1120,503],[1107,504]],[[994,446],[1107,446],[1107,492],[994,492]],[[1010,378],[1018,373],[1067,374],[1075,378],[1074,393],[1010,394]],[[1017,394],[1024,394],[1024,406],[1017,406]],[[1038,394],[1044,394],[1044,406],[1038,406]],[[1060,394],[1067,394],[1067,406],[1060,406]]]},
  {id:'deskLeftTop',foot:643,polygons:[...desk,...chair]},
  {id:'deskRightTop',foot:643,polygons:shift([...desk,...chair],0,0,true)},
  {id:'deskLeftBottom',foot:800,polygons:shift([...desk,...chair],-24,155)},
  {id:'deskRightBottom',foot:800,polygons:shift([...desk,...chair],-24,155,true)},
  {id:'wallCushion',foot:468,polygons:[[[1323,429],[1355,418],[1382,421],[1408,438],[1414,449],[1384,467],[1352,464],[1324,450],[1319,439]]]}
 ],
 room:[{id:'smallStool',foot:583,polygons:[[[1355,503],[1418,503],[1433,531],[1427,539],[1356,538],[1350,509]],[[1358,537],[1368,538],[1368,582],[1359,582]],[[1417,538],[1427,538],[1427,579],[1417,579]],[[1368,557],[1417,557],[1417,565],[1368,565]]]}]
};
export function createFurnitureDepth(){
 const paths=new Map(),sx=1600/1536,sy=1067/1024;
 function outline(entry){
  if(paths.has(entry))return paths.get(entry);const p=new Path2D();
  for(const polygon of entry.polygons){polygon.forEach(([x,y],i)=>i?p.lineTo(x*sx,y*sy):p.moveTo(x*sx,y*sy));p.closePath();}
  paths.set(entry,p);return p;
 }
 return {layers(scene,image){if(!image?.naturalWidth)return [];return(FURNITURE_MASKS[scene]||[]).map(entry=>{const points=entry.polygons.flat(),bounds={left:Math.min(...points.map(p=>p[0]))*sx,right:Math.max(...points.map(p=>p[0]))*sx,top:Math.min(...points.map(p=>p[1]))*sy,bottom:Math.max(...points.map(p=>p[1]))*sy};return{id:entry.id,y:entry.foot*sy,bounds,draw(g){g.save();g.clip(outline(entry));g.drawImage(image,0,0,1600,1067);g.restore();}};});}};
}
