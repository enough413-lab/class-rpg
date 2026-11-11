// All coordinates belong to the original tool drawing. The grip is the
// transform origin, shared by the hand, tool and its emitted water/line.
export const TOOL_SHAPES={
 can:{width:104,height:72,scale:47/104,grip:[4,40],spout:[96,23]},
 rod:{width:90,height:90,scale:76/90,grip:[24,68],tip:[56,16]},
 spade:{width:56,height:92,scale:.62,grip:[28,24],tip:[28,87]}
};
export const SPADE_SVG='<svg xmlns="http://www.w3.org/2000/svg" width="56" height="92" viewBox="0 0 56 92"><path d="M28 15V63" stroke="#6e5137" stroke-width="9" stroke-linecap="round"/><path d="M28 16V61" stroke="#c9a372" stroke-width="4" stroke-linecap="round"/><path d="M20 7Q28 3 36 7L33 18H23Z" fill="#a0b7a0" stroke="#536f60" stroke-width="3"/><path d="M17 54Q28 49 39 54L40 71Q38 82 28 88 18 82 16 71Z" fill="#b9c9bb" stroke="#536f60" stroke-width="3"/><path d="M28 57V80" stroke="#e8e6c9" stroke-width="3" stroke-linecap="round"/></svg>';
export function toolTransform(kind,direction,facing=1,action=null){
 const mirror=direction==='r'?1:direction==='l'||direction==='u'?-1:-facing;
 const angle=kind==='can'? (direction==='u'?-mirror*.65:direction==='d'?mirror*.65:0)+(action?.kind==='water'?mirror*action.tilt:0):kind==='spade'?-mirror*.12:0;
 return {mirror,angle};
}
function rod(g,fishing){
 g.lineCap='round';g.lineJoin='round';g.strokeStyle='#795744';g.lineWidth=6;g.beginPath();g.moveTo(20,75);g.lineTo(56,16);g.stroke();
 g.strokeStyle='#c6a36a';g.lineWidth=3;g.beginPath();g.moveTo(26,64);g.lineTo(56,16);g.stroke();
 g.fillStyle='#e8ce8d';g.strokeStyle='#795744';g.lineWidth=2;g.beginPath();g.arc(30,59,6,0,Math.PI*2);g.fill();g.stroke();
 if(fishing)return;
 g.strokeStyle='#617d83';g.lineWidth=2;g.beginPath();g.moveTo(56,16);g.quadraticCurveTo(73,20,70,64);g.lineTo(70,74);g.quadraticCurveTo(70,82,63,79);g.stroke();
 g.fillStyle='#d98261';g.strokeStyle='#795744';g.lineWidth=2;g.beginPath();g.ellipse(70,59,5,8,0,0,Math.PI*2);g.fill();g.stroke();
}
export function drawHeldTool(g,{kind,asset,direction='d',facing=1,action=null,fishing=false}){
 const shape=TOOL_SHAPES[kind];if(!shape||kind!=='rod'&&(!asset?.complete||!asset.naturalWidth))return null;
 const pose=toolTransform(kind,direction,facing,action);g.save();g.rotate(pose.angle);g.scale(pose.mirror*shape.scale,shape.scale);g.translate(-shape.grip[0],-shape.grip[1]);
 if(kind==='rod')rod(g,fishing);else g.drawImage(asset,0,0,shape.width,shape.height);
 const matrix=g.getTransform(),point=([x,y])=>{const p=matrix.transformPoint({x,y});return {x:p.x,y:p.y};};
 const result={kind,grip:point(shape.grip),tip:shape.tip&&point(shape.tip),spout:shape.spout&&point(shape.spout)};g.restore();return result;
}
