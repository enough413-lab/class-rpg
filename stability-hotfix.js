(()=>{
const app=document.getElementById('app');
function core(){try{return app.contentDocument?.getElementById('core')?.contentWindow||null}catch{return null}}
function stabilize(){const w=core(),d=w?.document;if(!d)return;
  if(d.__extraMutation?.disconnect&&!d.__extraMutationStopped){d.__extraMutation.disconnect();d.__extraMutationStopped=true}
  // Keep the reward popup observer; it is event-specific and needed for level-up sequencing.
}
app?.addEventListener('load',()=>setTimeout(stabilize,1200));
setInterval(stabilize,2500);
})();
