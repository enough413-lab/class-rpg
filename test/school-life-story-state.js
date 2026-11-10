// Narrative checkpoints only. These objects are never inventory or currency.
export const freshStory=()=>({v:1,phase:0,bridge:0,route:null,layout:null});
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
const exact=(x,keys)=>plain(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const permutation=x=>Array.isArray(x)&&x.length===3&&x.every(n=>Number.isInteger(n)&&n>=0&&n<=2)&&new Set(x).size===3;
export function validStory(s){
 if(!exact(s,['v','phase','bridge','route','layout'])||s.v!==1||!Number.isInteger(s.phase)||s.phase<0||s.phase>13||!Number.isInteger(s.bridge)||s.bridge<0||s.bridge>7)return false;
 if(s.phase<5&&s.bridge!==0||s.phase===5&&s.bridge===7||s.phase>=6&&s.bridge!==7)return false;
 if(s.phase<9?s.route!==null:!['flowers','books'].includes(s.route))return false;
 return s.phase<10?s.layout===null:permutation(s.layout);
}
export function validStoryAction(action,payload){
 if(['begin','take_books','deliver_books','accept_gate','take_clapper','return_clapper','fit_clapper','ring'].includes(action))return exact(payload,[]);
 if(action==='unlock_gate')return exact(payload,['symbols'])&&Array.isArray(payload.symbols)&&payload.symbols.length===3&&payload.symbols.every(x=>['leaf','book','bell'].includes(x));
 if(action==='place_plank')return exact(payload,['slot'])&&Number.isInteger(payload.slot)&&payload.slot>=0&&payload.slot<=2;
 if(action==='choose_display')return exact(payload,['route'])&&['flowers','books'].includes(payload.route);
 const key=action==='place_display'?'layout':action==='thread_rope'?'eyes':null;
 return !!key&&exact(payload,[key])&&Array.isArray(payload[key])&&payload[key].length===3&&payload[key].every(n=>Number.isInteger(n)&&n>=0&&n<=2);
}
export const STORY_GOALS=['','교실에서 책꾸러미 챙기기','마당의 두리에게 책 전하기','토리에게 뒤숲 이야기 듣기','뒤숲 문에 새겨진 기호 맞추기','뒤숲의 다리 놓기','빈 나무에서 종의 추 찾기','토리에게 종의 추 가져가기','새싹과 재개교 준비하기','학교 앞 전시 꾸미기','학교 종에 추 달기','종의 줄 잇기','학교 종 울리기',''];
export const storyChapter=s=>s.phase<3?2:s.phase<8?3:s.phase<10?4:5;
