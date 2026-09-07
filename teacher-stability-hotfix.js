(()=>{
const frame=document.getElementById('core');
function stabilize(){let w,d;try{w=frame?.contentWindow;d=w?.document}catch{return}if(!d)return;
  for(const key of ['__questExtraObs','__adminObserver','__teacherEnhanceObserver']){
    const obs=d[key];
    if(obs?.disconnect&&!d[key+'Stopped']){obs.disconnect();d[key+'Stopped']=true}
  }
}
frame?.addEventListener('load',()=>setTimeout(stabilize,1200));
setInterval(stabilize,2000);
})();
