export const NOTEBOOK_COVERS=[
 {id:'paper',name:'첫걸음 수첩',icon:'✦',stamps:0},
 {id:'sprout',name:'초록 새싹',icon:'🌱',stamps:1},
 {id:'story',name:'이야기 책장',icon:'📚',stamps:3},
 {id:'star',name:'별빛 모험',icon:'🌙',stamps:6}
];
export const WORKSHOP_MILESTONES=[
 {level:7,label:'🌿 관찰정원 변화 찾기',activity:'garden',description:'두 장의 그림을 비교하고 달라진 곳을 찾아요.'},
 {level:8,label:'🎨 나의 탐험 수첩 꾸미기',activity:'covers',description:'모은 탐험 도장으로 새로운 표지를 골라요.'}
];
export const GARDEN_OBJECTS=[['leaves','🌱','잎의 개수'],['flower','🌼','꽃의 모습'],['can','💧','물뿌리개의 자리'],['bench','🪑','벤치의 색'],['sign','🏷️','이름표의 모양']];
function gardenPicture(after){
 const leaves=(after?[[0,0],[0,23],[-26,13],[-26,-13]]:[[0,0],[-26,13]]).map(([x,y])=>'<ellipse cx="'+(88+x)+'" cy="'+(97+y)+'" rx="21" ry="10" transform="rotate('+(x?-30:30)+' '+(88+x)+' '+(97+y)+')" fill="'+(x?'#699458':'#93b66c')+'"/>').join('');
 const petals=after?Array.from({length:6},(_,i)=>'<ellipse cx="207" cy="68" rx="12" ry="22" transform="rotate('+(i*60)+' 207 87)" fill="#f3b669"/>').join(''):'<path d="M194 83Q194 55 207 65Q222 56 220 82Q207 100 194 83" fill="#e1a46a"/>';
 return '<svg viewBox="0 0 400 240" role="img" aria-label="'+(after?'이번 주 정원. 잎 네 장, 활짝 핀 꽃, 오른쪽 물뿌리개, 갈색 벤치, 네모 이름표.':'지난주 정원. 잎 두 장, 꽃봉오리, 왼쪽 물뿌리개, 갈색 벤치, 네모 이름표.')+'"><rect width="400" height="240" rx="24" fill="#e9f2df"/><path d="M0 172Q100 130 202 162T400 154V240H0" fill="#d0dfb6"/><ellipse cx="325" cy="41" rx="25" ry="25" fill="#f4d77f"/><path d="M27 40Q38 19 49 37Q70 30 75 49H25" fill="#fffef4"/><path d="M73 139V82" stroke="#537e4f" stroke-width="7" stroke-linecap="round"/>'+leaves+'<path d="M47 141H105L97 183H55Z" fill="#c88365"/><path d="M44 139H108V151H44Z" fill="#dfaa86"/><path d="M207 90V150" stroke="#537e4f" stroke-width="6"/>'+petals+(after?'<circle cx="207" cy="87" r="12" fill="#b78349"/>':'')+'<path d="M181 147H233L225 186H188Z" fill="#c88365"/><path d="M290 110H360V128H290ZM291 137H360V150H291Z" fill="#af8060"/><path d="M298 150V178M352 150V178" stroke="#80694e" stroke-width="9"/><path d="M244 167V203" stroke="#877349" stroke-width="5"/><rect x="228" y="153" width="40" height="22" rx="2" fill="#fff6da" stroke="#bba575" stroke-width="3"/><g transform="translate('+(after?296:113)+' 192)"><rect width="29" height="22" rx="7" fill="#75a8b0"/><path d="M27 13L43 1L47 7L28 22M1 7Q-15-5-10 13L1 18" fill="none" stroke="#75a8b0" stroke-width="6"/></g></svg>';
}
export function gardenView(selected=new Set(),finished=false){
 return '<div class="sa-guide"><span class="sa-guide-icon">🌿</span><p><b>새싹의 관찰 부탁</b>지난주와 이번 주의 정원을 살펴봐요. 달라진 것을 세 가지 골라 주세요. 시간제한은 없어요.</p></div>'+
 '<div class="sa-compare"><figure><figcaption>지난주</figcaption>'+gardenPicture(false)+'</figure><figure><figcaption>이번 주</figcaption>'+gardenPicture(true)+'</figure></div>'+
 '<details class="sa-picture-description"><summary>그림을 글로 살펴보기</summary><p>지난주: 잎 두 장, 꽃봉오리, 왼쪽에 놓인 물뿌리개, 갈색 벤치, 네모 이름표.</p><p>이번 주: 잎 네 장, 활짝 핀 꽃, 오른쪽에 놓인 물뿌리개, 갈색 벤치, 네모 이름표.</p></details>'+
 '<div class="sa-observations" aria-label="달라진 것 고르기">'+GARDEN_OBJECTS.map(([id,icon,label])=>'<button class="sa-choice" data-garden="'+id+'" aria-pressed="'+selected.has(id)+'">'+icon+' '+label+'</button>').join('')+'</div>'+
 '<p id="saGardenSelection" class="sa-small" role="status">'+selected.size+' / 3개 골랐어요.</p><button class="sa-button primary" data-sa="check-garden">발견한 변화 확인하기</button><div id="saWorkshopFeedback" class="sa-feedback" role="status" aria-live="polite">'+(finished?'✓ 이 관찰은 이미 마쳤어요. 다시 살펴봐도 좋아요.':'')+'</div>';
}
export function coverView({cover,stamps,nickname},esc){
 const chosen=NOTEBOOK_COVERS.find(c=>c.id===cover)||NOTEBOOK_COVERS[0];
 return '<div class="sa-notebook" data-cover="'+chosen.id+'"><span>'+chosen.icon+'</span><h3>'+esc(nickname)+'의<br>모험 수첩</h3><p>탐험 도장 '+stamps+'개 · '+chosen.name+'</p></div><p class="sa-note">탐험 이야기를 마치면 도장이 생겨요. 골드 없이 표지를 고르고, 언제든 다시 바꿀 수 있어요.</p><div class="sa-cover-grid">'+NOTEBOOK_COVERS.map(c=>'<button class="sa-cover-option" data-cover-choice="'+c.id+'" data-cover="'+c.id+'" aria-pressed="'+(c.id===chosen.id)+'" '+(stamps<c.stamps?'disabled':'')+'><span>'+c.icon+'</span><b>'+c.name+'</b><small>'+(stamps<c.stamps?'🔒 탐험 도장 '+c.stamps+'개 필요':c.id===chosen.id?'✓ 사용 중':'이 표지로 바꾸기')+'</small></button>').join('')+'</div><div id="saWorkshopFeedback" class="sa-feedback" role="status" aria-live="polite"></div>';
}
