import {createLifeStorage} from './school-life-storage.js?v=20261109-cloud';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createSchoolLifeSync({host,getIdentity,rpc,onChange}){
 const panel=document.createElement('section');panel.id='lifeSyncPanel';panel.className='life-sync-panel';panel.hidden=true;panel.setAttribute('aria-label','내 이야기 저장');panel.setAttribute('role','region');
 const badge=document.createElement('button');badge.id='lifeSyncStatus';badge.className='life-sync-status';badge.hidden=true;
 host.append(panel,badge);
 let dismissed='',rendered='',latest=null;
 const store=createLifeStorage({storage:localStorage,rpc,getIdentity,onChange:s=>{latest=s;render(s);onChange(s);}});
 const key=s=>[s.owner,s.status,s.revision,s.pending?.p_request_id||'',s.error||''].join(':');
 const summary=s=>{const places={room:'내 방',campus:'학교 마당',classroom:'교실'};return (places[s?.scene]||'학교')+' · 잡초 '+(s?.weeds?.length||0)+'곳 · 청소 '+(s?.dust?.length||0)+'곳';};
 const info={
  import:['이 기기에 남은 이야기','처음 한 번, 이 기기의 이야기를 내 계정에 옮겨요. 원래 기록도 그대로 남겨 둬요.','이 기기 이야기로 이어가기','import'],
  pending:['아직 확인하지 못한 저장','지난 저장의 결과를 확인할게요. 했던 행동을 다시 하지는 않아요.','저장 확인하기','retry'],
  error:['저장을 마치지 못했어요','지금 모습은 보관 중이에요. 연결이 돌아오면 같은 이야기를 다시 저장할 수 있어요.','다시 저장','retry'],
  offline:['이야기를 불러오지 못했어요','연결을 확인한 뒤 다시 불러와 주세요. 원래 기록은 그대로 두었어요.','다시 불러오기','retry'],
  'storage-error':['이 기기에 임시 기록을 남기지 못했어요','이 창에 지금 모습을 보관하고 있어요. 창을 닫기 전에 저장을 다시 시도해 주세요.','다시 저장','retry'],
  'local-conflict':['다른 창의 이야기가 있어요','이 창에서 하던 이야기를 따로 보관하고 다른 창의 기록을 확인해요. 두 기록을 합치지는 않아요.','다른 창 기록 확인','reload'],
  conflict:['다른 기기에서 이야기가 이어졌어요','이 창의 진행을 따로 보관한 뒤, 계정의 최신 이야기로 이어갈 수 있어요.','계정 이야기로 이어가기','server'],
  unreadable:['기록을 읽을 수 없어요','원래 기록을 그대로 보관하고 있어요. 기록을 지우거나 처음부터 시작하지 않아요.','다시 읽기','read'],
  recovery:['저장 확인이 필요한 이야기가 있어요','어느 이야기를 확인할지 골라 주세요. 각각 따로 보관하며 합치거나 덮어쓰지 않아요.','','']
 };
 function render(s){
  if(!s)return;const k=key(s),ready=s.status==='ready',busy=s.status==='saving'||s.status==='loading';
  badge.hidden=ready;badge.disabled=busy;badge.textContent=s.status==='saving'?'이야기 저장 중…':s.status==='loading'?'이야기 불러오는 중…':'저장 확인';
  panel.hidden=ready||busy||dismissed===k;
  if(k===rendered)return;rendered=k;
  const v=info[s.status];if(!v){panel.replaceChildren();return;}
  const token=String(getIdentity()?.token||''),owner=s.owner;
  panel.innerHTML='<h2>'+v[0]+'</h2><p>'+v[1]+'</p>'+
    (s.status==='conflict'?'<p class="life-sync-compare">이 창: '+esc(summary(s.state))+'<br>계정: '+esc(summary(s.server?.state))+'</p>':'')+
    '<div class="life-sync-actions"></div>';
  const choices=panel.querySelector('.life-sync-actions');
  const button=(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>{if(!host.open||String(getIdentity()?.id||'')!==owner||String(getIdentity()?.token||'')!==token||!panel.contains(b)||key(store.snapshot())!==k)return;dismissed='';fn();};choices.append(b);};
  const handlers={import:()=>store.importLocal(),retry:()=>store.retry(),reload:()=>store.reloadLocal(),server:()=>store.acceptServer(),read:()=>store.activate(owner,token)};
  if(v[3])button(v[2],handlers[v[3]]);
  if(s.status==='recovery')for(const [i,c]of store.pendingCopies().entries())button('보관한 이야기 '+(i+1)+' · '+summary(c.pending.p_state),()=>store.choosePending(c.pending.p_request_id));
  button('잠깐 닫기',()=>{dismissed=k;panel.hidden=true;badge.focus({preventScroll:true});});
 }
 badge.onclick=()=>show();
 function show(){if(!latest)return;dismissed='';render(latest);panel.querySelector('button')?.focus({preventScroll:true});}
 return {store,show,dismiss(){if(latest)dismissed=key(latest);panel.hidden=true;badge.focus({preventScroll:true});},reset(){dismissed='';rendered='';latest=null;panel.hidden=true;badge.hidden=true;}};
}

