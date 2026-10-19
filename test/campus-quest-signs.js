// State comes from existing personal requests and confirmed server parcel progress.
export function installQuestSigns(c){
 const doc=c.hub.ownerDocument;
 function sync(){const r=c.requests(),get=id=>r.find(x=>x.id===id),m=get('momo'),p=c.parcel(),g=c.trio();
  const states={quests:!p.loaded?'none':p.phase===0&&c.level()>=16?'available':p.phase>0&&p.phase<3?'active':m?.active?'active':c.momoPhase()===0?'available':'none',shop:m?.active?(m.text.includes('건네')?'ready':'active'):c.momoPhase()===0?'available':'none',...g};
  const tori=c.objects.querySelector('[data-place=tori]');if(p.loaded&&p.phase===2||tori?.dataset.leafFavor==='2')states.tori='ready';
  for(const [kind,state]of Object.entries(states)){const b=c.objects.querySelector('[data-place="'+kind+'"]');if(!b)continue;let sign=b.querySelector('.campus-quest-sign');if(!sign){sign=doc.createElement('span');sign.className='campus-quest-sign';sign.id='questSign-'+kind;b.setAttribute('aria-describedby',sign.id);sign.setAttribute('role','img');b.append(sign)}const label={available:'받을 부탁이 있어요',active:'부탁을 진행하고 있어요',ready:'건네거나 완료할 수 있어요',none:''}[state];sign.hidden=state==='none';if(sign.dataset.state!==state){sign.dataset.state=state;sign.textContent={available:'!',active:'…',ready:'?'}[state]||'';sign.setAttribute('aria-label',label);sign.title=label}b.dataset.questSign=state;
  }
 }
 doc.addEventListener('student-dashboard-updated',sync);return {sync};
}
