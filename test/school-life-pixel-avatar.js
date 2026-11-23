import {createLifeAvatar as createSourceAvatar,SLOTS} from './school-life-avatar.js?v=20261112-door';
// Render the student's existing layered avatar on one fixed pixel grid.
// Identity, equipment, directions, expressions, motion and hand anchors stay owned by the source rig.
export function createLifeAvatar(){
 const source=createSourceAvatar(),width=64,height=80;
 const buffers=Object.fromEntries(['body','grip'].map(key=>{const canvas=document.createElement('canvas'),sourceCanvas=document.createElement('canvas');canvas.width=width;canvas.height=height;sourceCanvas.width=256;sourceCanvas.height=320;return [key,{canvas,g:canvas.getContext('2d'),sourceCanvas,sourceG:sourceCanvas.getContext('2d')}];}));
 function paint(target,key,draw){
  const {canvas,g,sourceCanvas,sourceG}=buffers[key];sourceG.setTransform(1,0,0,1,0,0);sourceG.clearRect(0,0,256,320);sourceG.imageSmoothingEnabled=true;sourceG.scale(2,2);sourceG.translate(64,145);const result=draw(sourceG);
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,width,height);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(sourceCanvas,0,0,width,height);
  // Sample the same source rig, then enlarge on a fixed pixel grid without smoothing.
  target.save();target.imageSmoothingEnabled=false;target.drawImage(canvas,-64,-145,128,160);target.restore();return result;
 }
 return {update:(...args)=>source.update(...args),reset(){source.reset();for(const {g,canvas}of Object.values(buffers)){g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,canvas.width,canvas.height);}},
 draw:(g,d,m)=>paint(g,'body',inner=>source.draw(inner,d,m)),
 hand:(...args)=>source.hand(...args),
 drawGrip:(g,d,f,m)=>paint(g,'grip',inner=>source.drawGrip(inner,d,f,m)),
 snapshot:()=>({...source.snapshot(),renderer:'pixel',pixelGrid:[width,height]})};
}
export {SLOTS};

