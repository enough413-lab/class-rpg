// A local camera/walking preference only. Quest progress is still server-owned.
const ROOMS=new Set(['classroom','hallway','library','garden','playground','pond','cafeteria']);
export function installCampusMemory({getStudent,getSpot,restore,onStatus=()=>{},doc=document}){
 let owner='',ready=false,restoring=false,timer=0,pending=null,lastSpot=null,status='idle';
 // Keep only unsaved positions for this session, separately for each account.
 const unsaved=new Map();
 const id=()=>String(getStudent()?.id??getStudent()?.student_id??'');
 const key=who=>'classRpgCampusSpot_v1_'+encodeURIComponent(who);
 const valid=spot=>spot?.v===1&&ROOMS.has(spot.room)&&Number.isFinite(spot.x)&&spot.x>=4&&spot.x<=96;
 const same=(a,b)=>a?.room===b?.room&&a?.x===b?.x;
 function report(next){if(status===next)return;status=next;onStatus(next)}
 function flush(){
  clearTimeout(timer);timer=0;
  const write=pending||(unsaved.has(owner)?{owner,spot:unsaved.get(owner)}:null);pending=null;if(!write)return;
  const current=write.owner===owner&&owner===id();
  try{doc.defaultView.localStorage.setItem(key(write.owner),JSON.stringify(write.spot));unsaved.delete(write.owner);if(current&&status.endsWith('error'))report('saved')}
  catch{unsaved.set(write.owner,write.spot);if(current)report('save-error')}
 }
 function activate(){const next=id();if(next===owner)return;flush();owner=next;ready=false;lastSpot=null;report('idle')}
 function resume(restoreSaved=true,force=false){
  activate();if(!owner||ready&&!force)return false;ready=true;
  if(!restoreSaved){capture();return true}
  clearTimeout(timer);timer=0;pending=null;
  let spot=unsaved.get(owner)||{v:1,room:'classroom',x:44},readFailed=false;
  if(unsaved.has(owner))report('save-error');
  else{
   let raw=null;try{raw=doc.defaultView.localStorage.getItem(key(owner))}catch{readFailed=true;report('load-error')}
   try{const value=JSON.parse(raw);if(valid(value))spot=value}catch{}
  }
  restoring=true;try{restore(spot)}finally{restoring=false}
  // A failed read must not silently overwrite an unread position with the default.
  lastSpot=readFailed?{room:getSpot().room,x:Math.round(getSpot().x*100)/100}:null;
  if(!readFailed)capture();return true;
 }
 function capture(){
  if(!ready||restoring||!owner||owner!==id())return;
  const {room,x}=getSpot();if(!ROOMS.has(room)||!Number.isFinite(x)||x<4||x>96)return;
  const spot={v:1,room,x:Math.round(x*100)/100};
  if(same(lastSpot,spot))return;lastSpot=spot;
  pending={owner,spot};clearTimeout(timer);timer=setTimeout(flush,350);
 }
 function retry(){activate();if(!ready||!owner)return;if(status==='load-error'&&!pending&&!unsaved.has(owner))resume(true,true);else capture();flush()}
 doc.defaultView.addEventListener('pagehide',flush);
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden)flush()});
 return {activate,resume,capture,flush,retry};
}
