const fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=path.resolve(root,'../student-screenshots');
const mock=String.raw`
window.mockRpg={calls:[],failSave:false,failJournal:false,failDashboard:false,student:{id:987,number:1,nickname:'별나래',gender:'girl',xp:260,gold:180,setup_complete:true},exploration:JSON.parse(localStorage.getItem('fixtureExploration')||'[]'),workshop:JSON.parse(localStorage.getItem('fixtureWorkshop')||'{"cover":"paper","garden_complete":false}')};
localStorage.setItem('classRpgStudentToken','fixture');
mockRpg.kindness=JSON.parse(localStorage.getItem('fixtureKindness')||'{"phase":0,"choices":[],"pin":null,"wearing":false}');
mockRpg.reviews=JSON.parse(localStorage.getItem('fixtureReviews')||'null')||[{review_id:47,book_title:'구름 학교',read_date:'2026-09-28',summary:'구름이 친구를 만나요.',thoughts:'서로 도우면 좋겠어요.',recommendation_rating:5,recommendation_reason:'따뜻한 이야기예요.',status:'rejected',rejection_reason:'친구를 도운 장면을 한 가지 더 적어 볼까요?'},{review_id:48,book_title:'작은 정원',read_date:'2026-09-27',summary:'씨앗이 자랐어요.',thoughts:'매일 돌봐 주고 싶어요.',recommendation_rating:4,recommendation_reason:'식물을 좋아하는 친구에게 추천해요.',status:'approved'}];
mockRpg.receipts=JSON.parse(localStorage.getItem('fixtureReceipts')||'{}');mockRpg.purchases=Number(localStorage.getItem('fixturePurchases')||0);mockRpg.student.gold=180-mockRpg.purchases*40;
mockRpg.inventory=[{item_id:'shirt',slot:'top',name:'교복 상의',image:'3.top/top_girl_basic.png',equipped:true},{item_id:'skirt',slot:'bottom',name:'교복 치마',image:'4.bottom/bottom_girl_basic.png',equipped:true},{item_id:'shoes',slot:'shoes',name:'운동화',image:'7.shoes/shoes_girl_basic.png',equipped:true}];
const createClient=()=>({
 rpc:async(name,args)=>{
 const m=window.mockRpg;m.calls.push(name);
 if(name==='student_login_options')return {data:[{student_number:1,login_id:'ym01',nickname:'별나래'}]};
 if(name==='student_dashboard')return m.failDashboard?{error:{message:'Network request failed'}}:{data:{student:m.student,inventory:m.inventory,reward_notifications:m.rewardNotifications||[],quests:[
 {id:11,title:'내 책상은 내가 정리해요',description:'책과 필통을 가지런히 두고, 내 주변을 살펴봐요.',quest_type:'daily',category:'organizing',difficulty:'easy',submission_mode:'photo',status:'available',xp:10,gold:10},
 {id:12,title:'받아쓰기, 한 번 더 도전!',description:'틀린 낱말을 살펴보고 바르게 다시 써 보세요.',quest_type:'weekly',weekly_reset_day:2,category:'learning',difficulty:'normal',submission_mode:'both',status:'available',xp:20,gold:15},
 {id:13,title:'친구에게 건네는 따뜻한 말',description:'도움이 필요한 친구에게 먼저 다가가 보세요.',quest_type:'main',category:'kindness',difficulty:'easy',submission_mode:'text',status:'accepted',xp:15,gold:10},
 {id:14,title:'매일 10분 책 읽기',description:'좋아하는 책을 읽고 마음에 남는 장면을 적어요.',quest_type:'daily',category:'reading',submission_mode:'text',status:'submitted',xp:10,gold:10},
 {id:15,title:'함께 꾸민 우리 교실',description:'서로 도와 교실을 꾸몄어요.',quest_type:'main',category:'helper',status:'approved',xp:20,gold:20}
 ]}};
 if(name==='student_toggle_item'){
  await new Promise(r=>setTimeout(r,m.outfitDelay||100));
  if(m.failOutfit)return {error:{message:'Offline'}};
  const item=m.inventory.find(i=>i.item_id===args.p_item_id);
  if(!item)return {error:{message:'Missing item'}};
  const equip=!item.equipped;m.inventory.forEach(i=>{if(i.slot===item.slot)i.equipped=i.item_id===item.item_id&&equip});
  if(m.dropOutfitReply){m.dropOutfitReply=false;return {error:{message:'Network request failed'}}}
  return {data:null};
 }
 if(name==='student_learning_journal')return m.failJournal?{error:{message:'Offline'}}:{data:{kindness:{...m.kindness},exploration:m.exploration,workshop:{...m.workshop},areas:{learning:5,reading:8,kindness:3,life:7,organizing:6,helper:2},recent:[{title:'함께 꾸민 우리 교실',at:'2026-09-28T10:00:00Z'},{title:'친구에게 건넨 응원 한마디',at:'2026-09-27T10:00:00Z'}]}};
 if(name==='student_kindness_chapter'){
  m.kindnessSaves=(m.kindnessSaves||0)+1;await new Promise(r=>setTimeout(r,m.kindnessDelay||30));if(m.failKindness)return {error:{message:'Offline'}};
  if(args.p_step==='pin')m.kindness.pin=args.p_choice;
  else if(args.p_step==='wear')m.kindness.wearing=args.p_choice==='show';
  else {const n=Number(args.p_step.split('-')[1]);if(n===2&&args.p_choice!=='library')return {data:{correct:false}};if(n>m.kindness.phase){m.kindness.choices.push(args.p_choice);m.kindness.phase=n;if(n===4){m.kindness.pin=args.p_choice;m.kindness.wearing=true}}}
  localStorage.setItem('fixtureKindness',JSON.stringify(m.kindness));if(m.dropKindnessReply){m.dropKindnessReply=false;return {error:{message:'Network request failed'}}}return {data:{...m.kindness}};
 }
 if(name==='student_parcel_adventure'){
  m.parcelSaves=(m.parcelSaves||0)+1;await new Promise(r=>setTimeout(r,m.parcelDelay||30));if(m.failParcel)return {error:{message:'Offline'}};
  const expected={'parcel-1':['book','leaf'],'parcel-2':['library'],'parcel-3':['tori']}[args.p_step];
  if(JSON.stringify([...args.p_clues].sort())!==JSON.stringify(expected))return {data:{correct:false}};
  m.exploration=[...new Set([...m.exploration,args.p_step])];localStorage.setItem('fixtureExploration',JSON.stringify(m.exploration));if(m.dropParcelReply){m.dropParcelReply=false;return {error:{message:'Network request failed'}}}return {data:{correct:true,step_id:args.p_step}};
 }
 if(name==='student_music_sequence'){
  m.sequenceSaves=(m.sequenceSaves||0)+1;await new Promise(r=>setTimeout(r,m.sequenceDelay||30));
  if(m.failSequence)return {error:{message:'Offline'}};
  const expected={'music-sequence-1':['low','middle','high'],'music-sequence-2':['short','rest','long'],'music-sequence-3':['low','high','rest','middle']}[args.p_step];
  if(JSON.stringify(args.p_order)!==JSON.stringify(expected))return {data:{correct:false}};
  m.exploration=[...new Set([...m.exploration,args.p_step])];localStorage.setItem('fixtureExploration',JSON.stringify(m.exploration));
  if(m.dropSequenceReply){m.dropSequenceReply=false;return {error:{message:'Network request failed'}}}
  return {data:{correct:true,step_id:args.p_step}};
 }
 if(name==='student_music_room'){
  m.musicSaves=(m.musicSaves||0)+1;await new Promise(r=>setTimeout(r,m.musicDelay||30));
  if(m.failMusic)return {error:{message:'Offline'}};
  if(args.p_choice!=={'music-room-1':1,'music-room-2':0,'music-room-3':2}[args.p_step])return {data:{correct:false}};
  m.exploration=[...new Set([...m.exploration,args.p_step])];localStorage.setItem('fixtureExploration',JSON.stringify(m.exploration));
  if(m.dropMusicReply){m.dropMusicReply=false;return {error:{message:'Network request failed'}}}
  return {data:{correct:true,step_id:args.p_step}};
 }
 if(name==='student_library_evidence'){
  if(m.failEvidence)return {error:{message:'Offline'}};
  const expected={'library-evidence-1':[1,1],'library-evidence-2':[0,2],'library-evidence-3':[2,0]}[args.p_case];
  if(args.p_claim!==expected[0])return {data:{correct:false,reason:'claim'}};
  if(args.p_evidence!==expected[1])return {data:{correct:false,reason:'evidence'}};
  m.exploration=[...new Set([...m.exploration,args.p_case])];localStorage.setItem('fixtureExploration',JSON.stringify(m.exploration));
  return {data:{correct:true,step_id:args.p_case}};
 }
 if(name==='student_complete_school_chapter'){
  if(m.failChapter)return {error:{message:'Offline'}};
  m.workshop={...m.workshop,chapter_one_complete:true,chapter_one_promise:args.p_promise,chapter_one_badge:args.p_badge};localStorage.setItem('fixtureWorkshop',JSON.stringify(m.workshop));return {data:{...m.workshop}};
 }
 if(name==='student_school_workshop'){
  if(m.failWorkshop)return {error:{message:'Offline'}};
  if(args.p_action==='garden'){
   const correct=args.p_choice==='["can","flower","leaves"]';if(!correct)return {data:{correct:false}};
   m.workshop.garden_complete=true;localStorage.setItem('fixtureWorkshop',JSON.stringify(m.workshop));return {data:{correct:true,garden_complete:true}};
  }
  m.workshop.cover=args.p_choice;localStorage.setItem('fixtureWorkshop',JSON.stringify(m.workshop));return {data:{cover:args.p_choice}};
 }
 if(name==='student_reading_journal')return m.failReadingHistory?{error:{message:'Offline'}}:{data:{reviews:m.reviews,weekly_count:m.reviews.length}};
 if(name==='student_safe_action'){
  m.actionCalls=(m.actionCalls||[]).concat([{...args}]);await new Promise(r=>setTimeout(r,m.actionDelay||300));
  if(m.actionError)return {error:{code:'P0001',message:'이번 주에는 독후감을 3편까지 기록할 수 있어요.'}};
  if(m.receipts[args.p_request_id])return {data:m.receipts[args.p_request_id]};
  const p=args.p_payload;
  if(args.p_action==='shop_buy'){m.student.gold-=p.expected_price;m.purchases++;localStorage.setItem('fixturePurchases',m.purchases)}
  else if(args.p_action==='reading_retry'){const row=m.reviews.find(r=>r.review_id===p.review_id);Object.assign(row,p,{status:'submitted',rejection_reason:null})}
  else m.reviews.unshift({...p,review_id:Date.now(),status:'submitted'});
  localStorage.setItem('fixtureReviews',JSON.stringify(m.reviews));m.receipts[args.p_request_id]={ok:true,status:'submitted'};localStorage.setItem('fixtureReceipts',JSON.stringify(m.receipts));
  if(m.dropActionReply){m.dropActionReply=false;return {error:{message:'Network request failed'}}}return {data:m.receipts[args.p_request_id]};
 }
 if(name==='student_shop')return m.failShop?{error:{message:'Offline'}}:{data:[{product_id:'reading-chair',category:'misc',kind:'coupon',name:'도서관 특별 자리',description:'선생님께 확인받고 좋아하는 자리에서 책을 읽어요.',price:40,stock:2-m.purchases,owned:m.purchases>0,icon:'📖'}]};
 if(name==='student_explore_school'){
 if(m.failSave)return {error:{message:'Offline'}};
 const correct={'classroom-1':0,'classroom-2':1,'classroom-3':2,'cafeteria-1':1,'cafeteria-2':2,'cafeteria-3':0}[args.p_step]===args.p_choice;
 if(correct){m.exploration=[...new Set([...m.exploration,args.p_step])];localStorage.setItem('fixtureExploration',JSON.stringify(m.exploration))}
 return {data:{correct}};
 }
 if(name==='student_repeat_quest_record')return {data:{status:'submitted',report_text:'책을 읽었어요.',evidence_image:null}};
 if(name==='student_achievements')return {data:{items:[],notifications:[]}};
 if(name==='student_claim_class_goal_reward'||name==='student_claim_level_rewards')return {data:{gold:0,levels:[]}};
 if(name==='student_titles')return {data:{titles:[]}};
 if(name==='student_ack_notification'){m.rewardNotifications=(m.rewardNotifications||[]).filter(n=>n.id!==args.p_id||n.kind!==args.p_kind);return {data:null}};
 return {data:[],error:null};
 },
 from(){const q={select(){return q},eq(){return q},order(){return q},then(resolve){return resolve({data:[]})}};return q}
});`;
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const file=path.resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end()}
 try{
 let content=fs.readFileSync(file);
 if(file.endsWith('app-core.html'))content=content.toString().replace(/import\{createClient\}from'[^']+';/,mock);
 const ext=path.extname(file),mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
 res.setHeader('Content-Type',mime[ext]||'application/octet-stream');res.end(content);
 }catch{res.statusCode=404;res.end()}
});
module.exports={server,shots};
