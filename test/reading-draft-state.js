const context=v=>v==='new'||/^\d+$/.test(String(v));
const strings=['book_title','read_date','summary','thoughts','recommendation_reason'];
function fields(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const draft={};for(const key of strings){if(value[key]!=null&&typeof value[key]!=='string')return null;if(typeof value[key]==='string')draft[key]=value[key]}
 const rating=Number(value.recommendation_rating??5);draft.recommendation_rating=Number.isInteger(rating)&&rating>=1&&rating<=5?rating:5;
 if(Number.isFinite(value.savedAt))draft.savedAt=value.savedAt;return draft;
}
export function normalizeReadingDraft(value){
 const state={active:'new',drafts:{},pending:null};let repaired=false;
 if(!value||typeof value!=='object'||Array.isArray(value))return{state,repaired:!!value};
 if(value.drafts&&typeof value.drafts==='object'&&!Array.isArray(value.drafts)){
  for(const [key,data]of Object.entries(value.drafts)){const draft=context(key)&&fields(data);if(draft)state.drafts[key]=draft;else repaired=true}
 }else repaired=true;
 if(context(value.active))state.active=String(value.active);else if(value.active!=null)repaired=true;
 const pending=value.pending;
 if(pending){
  const payload=fields(pending.payload),c=String(pending.context),action=c==='new'?'reading_add':'reading_retry';
  const valid=context(c)&&typeof pending.id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(pending.id)&&pending.action===action&&payload&&strings.every(k=>typeof payload[k]==='string'&&payload[k].trim())&&/^\d{4}-\d{2}-\d{2}$/.test(payload.read_date)&&Number(pending.payload.recommendation_rating)===payload.recommendation_rating&&(c==='new'||Number(pending.payload.review_id)===Number(c));
  if(valid){delete payload.savedAt;if(c!=='new')payload.review_id=Number(c);state.pending={id:pending.id,context:c,action,payload};state.active=c}else repaired=true;
 }
 return{state,repaired};
}
