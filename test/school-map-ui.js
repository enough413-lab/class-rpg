const SHORT_NAMES={classroom:'우리 교실',hallway:'별빛 복도',library:'도서관',garden:'관찰정원',pond:'연못',playground:'운동장',cafeteria:'급식실'};
const POSITIONS={classroom:[50,27],hallway:[50,51],library:[18,37],garden:[18,73],pond:[82,73],playground:[82,37],cafeteria:[50,85]};
export function schoolMapView({chapters,level,completed,stamps,current,label}){
 return '<section class="sa-map-canvas"><div class="sa-map-compass" aria-hidden="true">✥<small>N</small></div><div class="sa-world" aria-label="학교 탐험 지도">'+
  '<svg class="sa-map-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 27 Q56 37 50 51 Q28 50 18 37 Q8 52 18 73 Q50 63 82 73 Q94 51 82 37 Q66 58 50 85"/></svg>'+
  chapters.map(c=>{const done=c.steps.every(s=>completed.has(s.id)),locked=level<c.level,p=POSITIONS[c.id];return '<button class="sa-map-pin '+(locked?'locked ':'')+(done?'stamped ':'')+(current===c.id?'current':'')+'" data-chapter="'+c.id+'" style="--map-x:'+p[0]+'%;--map-y:'+p[1]+'%" aria-label="'+c.name+', '+label(c)+(current===c.id?', 지금 있는 곳':'')+'"'+(current===c.id?' aria-current="location"':'')+'><span class="sa-pin-emblem" aria-hidden="true"><i>'+(locked?'🔒':done?'★':'')+'</i></span><b>'+SHORT_NAMES[c.id]+'</b><span class="sa-pin-state">'+(locked?'Lv. '+c.level:current===c.id?'내가 있는 곳':done?'★ 도장 획득':'')+'</span></button>'}).join('')+
  '</div><div class="sa-passport"><span class="sa-map-stamp" aria-hidden="true">✿</span><div><b>탐험 도장 '+stamps+' / '+chapters.length+'</b><span>Lv. '+level+' · 나의 속도로 한 걸음</span></div></div><p class="sa-map-hint">가고 싶은 장소를 콕 눌러 봐!</p></section>';
}
