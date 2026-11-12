export const LIFE_VERSION=1;
export const PROJECTS=[
 {id:'bench',name:'나무 벤치',level:3,wood:3,description:'나뭇가지로 벤치 수리'},
 {id:'school',name:'학교에 새 봄빛',level:5,wood:5,description:'낡은 지붕과 벽 수리'},
 {id:'garden',name:'넓어진 꽃밭',level:7,wood:0,description:'꽃자리 6곳으로 확장'},
 {id:'library',name:'교실의 작은 책쉼터',level:10,wood:0,description:'교실에 책과 방석 배치'},
 {id:'lights',name:'반짝이는 등굣길',level:15,wood:0,description:'등굣길에 꽃등 설치'}
];
export const WEEDS=[[620,650],[688,690],[790,678],[852,731],[716,796],[955,807]];
export const BRANCHES=[[475,655],[520,787],[970,538],[1015,698],[1110,825],[410,875],[1045,910],[650,928]];
export const FLOWERS=[[597,560],[667,560],[737,560],[597,616],[667,616],[737,616]];
export const DUST=[[620,650],[860,640],[750,810],[560,790]];
export const FLOWER_NAMES=['햇살꽃','분홍 코스모스','푸른 수레국화'];
export const FISH_NAMES=['송사리','붕어','블루길'];
const uniq=(a,max)=>Array.isArray(a)?[...new Set(a.filter(n=>Number.isInteger(n)&&n>=0&&n<max))]:[];
export function freshLife(){return {v:1,started:false,intro:false,opening:{step:0,legacy:false},scene:'room',position:{x:800,y:725},weeds:[],branches:[],dust:[],wood:0,flowers:Array.from({length:6},()=>({kind:0,stage:0})),projects:[],fish:[0,0,0],seed:0,roomPlant:-1,savedAt:null};}
export function readLife(raw){
 if(!raw)return freshLife();
 const d=JSON.parse(raw);if(!d||d.v!==1)throw new Error('unknown save');
 const state=freshLife();
 if(d.opening!==undefined&&(!d.opening||!Number.isInteger(d.opening.step)||d.opening.step<0||d.opening.step>7||typeof d.opening.legacy!=='boolean'))throw new Error('invalid opening');
 if(d.opening?.windows!==undefined){const w=d.opening.windows,n=d.opening.step;if(!Array.isArray(w)||w.length>3||w.some((v,i)=>!Number.isInteger(v)||v<0||v>2||(i>0&&w[i-1]>=v))||(d.opening.legacy?w.length!==3:n<4?w.length!==0:n===4?w.length===3:w.length!==3)||(!d.opening.legacy&&w.length>0&&uniq(d.dust,4).length!==4))throw new Error('invalid windows');}
 state.opening=d.opening?{step:d.opening.step,legacy:d.opening.legacy}:{step:0,legacy:!!d.started};
 if(d.opening?.windows!==undefined)state.opening.windows=[...d.opening.windows];
 Object.assign(state,{started:!!d.started,intro:!!d.intro,scene:['room','campus','classroom'].includes(d.scene)?d.scene:'room',weeds:uniq(d.weeds,6),branches:uniq(d.branches,8),dust:uniq(d.dust,4),projects:Array.isArray(d.projects)?[...new Set(d.projects.filter(id=>PROJECTS.some(p=>p.id===id)))]:[],wood:Number.isInteger(d.wood)?Math.max(0,Math.min(8,d.wood)):0,seed:[0,1,2].includes(d.seed)?d.seed:0,roomPlant:[0,1,2].includes(d.roomPlant)?d.roomPlant:-1,savedAt:typeof d.savedAt==='string'?d.savedAt:null});
 if(d.position&&Number.isFinite(d.position.x)&&Number.isFinite(d.position.y))state.position={x:Math.max(80,Math.min(1520,d.position.x)),y:Math.max(430,Math.min(990,d.position.y))};
 state.flowers=state.flowers.map((f,i)=>({kind:[0,1,2].includes(d.flowers?.[i]?.kind)?d.flowers[i].kind:0,stage:[0,1,2,3].includes(d.flowers?.[i]?.stage)?d.flowers[i].stage:0}));
 state.fish=state.fish.map((_,i)=>Number.isInteger(d.fish?.[i])?Math.max(0,Math.min(999,d.fish[i])):0);
 return state;
}
export function projectRequirement(state,id,level){
 const p=PROJECTS.find(p=>p.id===id);if(!p)return '수리할 대상 없음';
 if(state.projects.includes(id))return '수리 완료';
 if(level<p.level)return `학교생활로 Lv. ${p.level} 필요`;
 if(state.wood<p.wood)return `마당의 나뭇가지를 ${p.wood-state.wood}개 부족`;
 if(id==='garden'&&state.flowers.slice(0,3).some(f=>f.stage!==3))return '작은 화단의 꽃 3송이 개화 필요';
 if(id==='library'&&state.dust.length<4)return '교실 먼지 4곳 청소 필요';
 if(id==='lights'&&!state.projects.includes('school'))return '학교 외관 수리 필요';
 return '';
}
