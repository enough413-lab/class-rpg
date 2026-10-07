// A local camera/walking preference only. Quest progress is still server-owned.
const ROOMS=new Set(['classroom','hallway','library']);
export function installCampusMemory({getStudent,getSpot,restore,doc=document}){
 let owner='',ready=false,restoring=false,timer=0,pending=null;
 const id=()=>String(getStudent()?.id??getStudent()?.student_id??'');
 const key=who=>'classRpgCampusSpot_v1_'+encodeURIComponent(who);
 function flush(){clearTimeout(timer);timer=0;if(!pending)return;const write=pending;pending=null;try{localStorage.setItem(key(write.owner),JSON.stringify(write.spot))}catch{}}
 function activate(){const next=id();if(next===owner)return;flush();owner=next;ready=false}
 function resume(restoreSaved=true,force=false){
  activate();if(!owner||ready&&!force)return false;ready=true;
  if(!restoreSaved){capture();return true}
  clearTimeout(timer);timer=0;pending=null;
  let spot={v:1,room:'classroom',x:44};
  try{const value=JSON.parse(localStorage.getItem(key(owner))||'null');if(value?.v===1&&ROOMS.has(value.room)&&Number.isFinite(value.x)&&value.x>=4&&value.x<=96)spot=value}catch{}
  restoring=true;try{restore(spot)}finally{restoring=false}capture();return true;
 }
 function capture(){
  if(!ready||restoring||!owner||owner!==id())return;
  const {room,x}=getSpot();if(!ROOMS.has(room)||!Number.isFinite(x)||x<4||x>96)return;
  const spot={v:1,room,x:Math.round(x*100)/100};
  if(pending?.owner===owner&&pending.spot.room===spot.room&&pending.spot.x===spot.x)return;
  pending={owner,spot};clearTimeout(timer);timer=setTimeout(flush,350);
 }
 doc.defaultView.addEventListener('pagehide',flush);
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden)flush()});
 return {activate,resume,capture,flush};
}
