const fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=path.resolve(root,'../student-screenshots');
const mock=String.raw`
window.mockRpg={calls:[],failSave:false,failJournal:false,failDashboard:false,student:{id:987,number:1,nickname:'별나래',gender:'girl',xp:260,gold:180,setup_complete:true},exploration:JSON.parse(localStorage.getItem('fixtureExploration')||'[]'),workshop:JSON.parse(localStorage.getItem('fixtureWorkshop')||'{"cover":"paper","garden_complete":false}')};
localStorage.setItem('classRpgStudentToken','fixture');
const createClient=()=>({
 rpc:async(name,args)=>{
 const m=window.mockRpg;m.calls.push(name);
 if(name==='student_login_options')return {data:[{student_number:1,login_id:'ym01',nickname:'별나래'}]};
 if(name==='student_dashboard')return m.failDashboard?{error:{message:'Network request failed'}}:{data:{student:m.student,inventory:[{item_id:'shirt',slot:'top',name:'교복 상의',image:'3.top/top_girl_basic.png',equipped:true},{item_id:'skirt',slot:'bottom',name:'교복 치마',image:'4.bottom/bottom_girl_basic.png',equipped:true},{item_id:'shoes',slot:'shoes',name:'운동화',image:'7.shoes/shoes_girl_basic.png',equipped:true}],reward_notifications:m.rewardNotifications||[],quests:[
 {id:11,title:'내 책상은 내가 정리해요',description:'책과 필통을 가지런히 두고, 내 주변을 살펴봐요.',quest_type:'daily',category:'organizing',difficulty:'easy',submission_mode:'photo',status:'available',xp:10,gold:10},
 {id:12,title:'받아쓰기, 한 번 더 도전!',description:'틀린 낱말을 살펴보고 바르게 다시 써 보세요.',quest_type:'weekly',weekly_reset_day:2,category:'learning',difficulty:'normal',submission_mode:'both',status:'available',xp:20,gold:15},
 {id:13,title:'친구에게 건네는 따뜻한 말',description:'도움이 필요한 친구에게 먼저 다가가 보세요.',quest_type:'main',category:'kindness',difficulty:'easy',submission_mode:'text',status:'accepted',xp:15,gold:10},
 {id:14,title:'매일 10분 책 읽기',description:'좋아하는 책을 읽고 마음에 남는 장면을 적어요.',quest_type:'daily',category:'reading',submission_mode:'text',status:'submitted',xp:10,gold:10},
 {id:15,title:'함께 꾸민 우리 교실',description:'서로 도와 교실을 꾸몄어요.',quest_type:'main',category:'helper',status:'approved',xp:20,gold:20}
 ]}};
 if(name==='student_learning_journal')return m.failJournal?{error:{message:'Offline'}}:{data:{exploration:m.exploration,workshop:{...m.workshop},areas:{learning:5,reading:8,kindness:3,life:7,organizing:6,helper:2},recent:[{title:'함께 꾸민 우리 교실',at:'2026-09-28T10:00:00Z'},{title:'친구에게 건넨 응원 한마디',at:'2026-09-27T10:00:00Z'}]}};
 if(name==='student_school_workshop'){
  if(m.failWorkshop)return {error:{message:'Offline'}};
  if(args.p_action==='garden'){
   const correct=args.p_choice==='["can","flower","leaves"]';if(!correct)return {data:{correct:false}};
   m.workshop.garden_complete=true;localStorage.setItem('fixtureWorkshop',JSON.stringify(m.workshop));return {data:{correct:true,garden_complete:true}};
  }
  m.workshop.cover=args.p_choice;localStorage.setItem('fixtureWorkshop',JSON.stringify(m.workshop));return {data:{cover:args.p_choice}};
 }
 if(name==='student_shop'&&m.failShop)return {error:{message:'Offline'}};
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
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 if(process.env.PREVIEW_ONLY){console.log(base);return}
 fs.mkdirSync(shots,{recursive:true});
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());
 await page.goto(base);let f=page.frames().find(f=>f.url().includes('app-core.html'));
 await f.waitForFunction(()=>document.querySelector('#saProfileTitle')?.textContent.includes('별나래'));
 await page.waitForTimeout(1200);
 assert(await f.locator('#studentAdventureHome').isVisible());
 assert.match(await f.locator('#saQuestList').textContent(),/매주 화요일 0시/);
 assert.match(await f.locator('#saNextGoal').textContent(),/Lv. 6[\s\S]*호기심 연못[\s\S]*90 경험치/);
 await f.locator('#saNextGoal [data-sa=roadmap]').click();
 assert.equal(await f.locator('.sa-milestone[aria-current=step]').count(),1);
 assert.match(await f.locator('.sa-milestone[aria-current=step]').textContent(),/Lv. 6/);
 assert.match(await f.locator('.sa-roadmap').textContent(),/Lv. 30/);
 assert.equal(await f.locator('.sa-milestone:not(.reached) [data-go-chapter]').count(),0);
 await page.screenshot({path:path.join(shots,'desktop-roadmap.png'),fullPage:true});
 await f.locator('[data-go-chapter=classroom]').click();
 await f.locator('#saQuestion').waitFor();
 assert(await f.evaluate(()=>mockRpg.calls.includes('student_learning_journal')));
 await f.locator('#studentAdventureDialog [data-sa=close]').click();
 await page.screenshot({path:path.join(shots,'desktop-home.png'),fullPage:true});
 await f.locator('.sa-hero [data-sa=map]').click();
 await f.locator('.sa-world').waitFor();
 await page.screenshot({path:path.join(shots,'desktop-map.png'),fullPage:true});
 await f.locator('.sa-map-pin[data-chapter=pond]').click();
 assert.match(await f.locator('#saDialogSubtitle').textContent(),/Lv. 6/);
 assert.match(await f.locator('#saDialogBody').textContent(),/90 경험치/);
 await f.locator('#saDialogBody [data-sa=map]').click();await f.locator('.sa-world').waitFor();
 await f.locator('.sa-map-pin[data-chapter=classroom]').click();
 await f.locator('[data-choice="1"]').click();assert.match(await f.locator('#saFeedback').textContent(),/다시 생각/);
 assert.equal(await f.evaluate(()=>mockRpg.exploration.length),0);
 await f.evaluate(()=>mockRpg.failSave=true);
 await f.locator('[data-choice="0"]').click();assert.match(await f.locator('#saFeedback').textContent(),/저장하지 못/);
 assert.equal(await f.evaluate(()=>mockRpg.exploration.length),0);
 await f.evaluate(()=>mockRpg.failSave=false);
 await f.locator('[data-choice="0"]').click();await f.locator('[data-sa=next]').click();
 await f.locator('[data-choice="1"]').click();await f.locator('[data-sa=next]').click();
 await f.locator('[data-choice="2"]').click();await f.locator('[data-sa=next]').click();
 assert.match(await f.locator('#saDialogBody').textContent(),/탐험 도장을 모았어요/);
 assert.equal(await f.evaluate(()=>mockRpg.exploration.length),3);
 await f.locator('#studentAdventureDialog [data-sa=close]').click();
 await page.reload();f=page.frames().find(f=>f.url().includes('app-core.html'));await f.waitForFunction(()=>document.querySelector('#saProfileTitle')?.textContent.includes('별나래'));
 await f.locator('.sa-hero [data-sa=map]').click();await f.locator('.sa-world').waitFor();
 assert.match(await f.locator('.sa-passport').textContent(),/1 \/ 7/);
 await f.locator('#studentAdventureDialog [data-sa=close]').click();
 await f.locator('.sa-shortcuts [data-sa=growth]').click();
 assert.equal(await f.locator('.sa-growth-card').count(),6);
 await page.screenshot({path:path.join(shots,'desktop-growth.png'),fullPage:true});
 await f.locator('#studentAdventureDialog [data-sa=close]').click();
 await f.evaluate(()=>enterHubScene('library'));
 assert(await f.locator('#classroomHub').isVisible());
 assert.match(await f.locator('#classroomHub .hub-stage').evaluate(el=>el.style.backgroundImage),/library.webp/);
 await f.evaluate(()=>openProgressQuest(13));
 await f.locator('#progressQuestText').fill('배려하고 서로 도와요');
 const positionBefore=await f.locator('#hubPlayer').getAttribute('style');
 await f.locator('#progressQuestText').press('ArrowLeft');
 await f.locator('#progressQuestText').press('e');
 assert.equal(await f.locator('#hubPlayer').getAttribute('style'),positionBefore);
 assert.match(await f.locator('#progressQuestText').inputValue(),/e/);
 await f.evaluate(()=>{closeProgressQuest();closeClassroomHub()});
 await f.evaluate(()=>mockRpg.failDashboard=true);
 await f.evaluate(()=>loadDashboard());
 assert.equal(await f.evaluate(()=>localStorage.getItem('classRpgStudentToken')),'fixture');
 assert(await f.locator('#saNetwork').isVisible());
 await f.evaluate(()=>mockRpg.failDashboard=false);
 await f.evaluate(()=>loadDashboard());
 for(const [xp,expected] of [[0,/Lv. 2[\s\S]*별빛 복도[\s\S]*50 경험치/],[349,/호기심 연못[\s\S]*1 경험치/],[350,/Lv. 7[\s\S]*변화 찾기/],[440,/Lv. 8[\s\S]*수첩 꾸미기/],[535,/Lv. 9[\s\S]*급식실/],[3155,/나의 배움은 계속돼요/]]){
  await f.evaluate(async xp=>{mockRpg.student.xp=xp;await loadDashboard()},xp);
  assert.match(await f.locator('#saNextGoal').textContent(),expected);
 }
 await f.evaluate(async()=>{mockRpg.student.xp=260;await loadDashboard()});
 // Exercise the real reward observer across a multi-level jump, not just a helper.
 const callsBefore=await f.evaluate(()=>mockRpg.calls.filter(x=>x==='student_dashboard').length);
 await f.evaluate(()=>{mockRpg.rewardNotifications=[{status:'approved',xp:211}];const reward=document.createElement('div');reward.id='fixtureReward';reward.className='reward-notice-backdrop';document.body.append(reward)});
 await f.waitForFunction(before=>mockRpg.calls.filter(x=>x==='student_dashboard').length>before,callsBefore);
 await f.evaluate(()=>document.getElementById('fixtureReward').remove());
 await f.locator('.levelup-news').waitFor();
 assert.equal(await f.locator('.levelup-news li').count(),5);
 assert.match(await f.locator('.levelup-news').textContent(),/별빛 복도[\s\S]*운동장[\s\S]*50 골드/);
 await f.locator('#levelupBackdrop button').click();
 await f.evaluate(()=>mockRpg.rewardNotifications=[]);
 await f.locator('.sa-shortcuts [data-sa=inventory]').click();
 await f.waitForFunction(()=>document.querySelector('#inventoryModal').contains(document.activeElement));
 const inventoryItems=f.locator('#inventoryModal button:not([disabled])');
 await inventoryItems.first().focus();await inventoryItems.first().press('Shift+Tab');
 assert(await inventoryItems.last().evaluate(el=>el===document.activeElement));
 await inventoryItems.last().press('Escape');
 assert.equal(await f.locator('#inventoryModal').isVisible(),false);
 assert(await f.locator('.sa-shortcuts [data-sa=inventory]').evaluate(el=>el===document.activeElement));
 await f.evaluate(()=>mockRpg.failShop=true);await f.locator('.sa-shortcuts [data-sa=shop]').click();
 await f.waitForFunction(()=>document.getElementById('shopMsg').textContent.includes('불러오지 못'));
 assert.match(await f.locator('#shopMsg').textContent(),/불러오지 못/);assert.doesNotMatch(await f.locator('#shopMsg').textContent(),/Supabase/);
 await f.locator('#shopModal button[aria-label="상점 닫기"]').press('Escape');await f.evaluate(()=>mockRpg.failShop=false);
 await f.locator('.sa-hero [data-sa=map]').click();await f.locator('[data-workshop=garden]').click();
 assert.match(await f.locator('#saDialogSubtitle').textContent(),/Lv. 7/);
 await f.locator('#studentAdventureDialog [data-sa=close]').click();
 await f.evaluate(async()=>{mockRpg.student.xp=440;await loadDashboard()});
 await f.locator('.sa-hero [data-sa=map]').click();await f.locator('[data-workshop=garden]').click();
 await page.screenshot({path:path.join(shots,'desktop-garden.png'),fullPage:true});
 for(const id of ['leaves','flower','bench'])await f.locator('[data-garden='+id+']').click();
 await f.locator('[data-sa=check-garden]').click();assert.match(await f.locator('#saWorkshopFeedback').textContent(),/다시 살펴/);
 await f.locator('[data-garden=bench]').click();await f.locator('[data-garden=can]').click();await f.evaluate(()=>mockRpg.failWorkshop=true);
 await f.locator('[data-sa=check-garden]').click();assert.match(await f.locator('#saWorkshopFeedback').textContent(),/아직 저장하지/);
 assert.equal(await f.locator('[data-garden][aria-pressed=true]').count(),3);
 await f.evaluate(()=>mockRpg.failWorkshop=false);await f.locator('[data-sa=check-garden]').click();
 assert.match(await f.locator('#saWorkshopFeedback').textContent(),/세 가지 변화를 모두/);
 await f.locator('#studentAdventureDialog [data-sa=close]').click();
 await f.evaluate(async()=>{mockRpg.student.xp=535;await loadDashboard()});
 await f.locator('.sa-hero [data-sa=map]').click();await f.locator('[data-workshop=covers]').click();
 assert.equal(await f.locator('[data-cover-choice=story]').isDisabled(),true);
 await f.evaluate(()=>mockRpg.failWorkshop=true);await f.locator('[data-cover-choice=sprout]').click();
 assert.equal(await f.locator('[data-cover-choice=paper]').getAttribute('aria-pressed'),'true');
 await f.evaluate(()=>mockRpg.failWorkshop=false);await f.locator('[data-cover-choice=sprout]').click();
 assert.match(await f.locator('#saWorkshopFeedback').textContent(),/표지를 저장/);
 await page.screenshot({path:path.join(shots,'desktop-covers.png'),fullPage:true});
 await f.locator('#studentAdventureDialog [data-sa=close]').click();
 await f.evaluate(async()=>{mockRpg.student.xp=630;await loadDashboard()});
 await f.locator('.sa-hero [data-sa=map]').click();await f.locator('[data-chapter=cafeteria]').first().click();
 for(const i of [1,2,0]){await f.locator('[data-choice="'+i+'"]').click();await f.locator('[data-sa=next]').click()}
 assert.match(await f.locator('#saDialogBody').textContent(),/탐험 도장을 모았어요/);
 await page.reload();f=page.frames().find(f=>f.url().includes('app-core.html'));
 await f.waitForFunction(()=>document.querySelector('#studentAdventureHome')?.dataset.cover==='sprout');
 assert.equal(await f.evaluate(()=>mockRpg.workshop.garden_complete),true);
 await f.evaluate(async()=>{mockRpg.student.xp=535;await loadDashboard()});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:path.join(shots,'mobile-home.png'),fullPage:true});
 assert.equal(await f.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await f.locator('#saNextGoal [data-sa=roadmap]').click();
 await page.screenshot({path:path.join(shots,'mobile-roadmap.png'),fullPage:true});
 assert.equal(await f.locator('#studentAdventureDialog').evaluate(el=>el.scrollWidth>el.clientWidth),false);
 await f.locator('#studentAdventureDialog [data-sa=close]').click();
 await f.locator('.sa-mobile-nav [data-sa=map]').click();await f.locator('[data-workshop=garden]').click();
 await page.screenshot({path:path.join(shots,'mobile-garden.png'),fullPage:true});
 assert.equal(await f.locator('#studentAdventureDialog').evaluate(el=>el.scrollWidth>el.clientWidth),false);
 await f.locator('#studentAdventureDialog [data-sa=close]').click();
 await f.locator('.sa-mobile-nav [data-sa=map]').click();await f.locator('[data-workshop=covers]').click();
 await page.screenshot({path:path.join(shots,'mobile-covers.png'),fullPage:true});
 assert.equal(await f.locator('#studentAdventureDialog').evaluate(el=>el.scrollWidth>el.clientWidth),false);
 await f.locator('#studentAdventureDialog [data-sa=close]').click();
 await f.locator('.sa-mobile-nav [data-sa=map]').click();await f.locator('.sa-world').waitFor();
 await page.screenshot({path:path.join(shots,'mobile-map.png'),fullPage:true});
 const overlappingPins=await f.locator('.sa-map-pin').evaluateAll(pins=>{const r=pins.map(p=>({id:p.dataset.chapter,b:p.getBoundingClientRect()}));return r.flatMap((a,i)=>r.slice(i+1).filter(c=>a.b.left<c.b.right&&a.b.right>c.b.left&&a.b.top<c.b.bottom&&a.b.bottom>c.b.top).map(c=>a.id+'/'+c.id))});
 assert.deepEqual(overlappingPins,[],'Mobile map labels overlap');
 assert.equal(await f.locator('#studentAdventureDialog').evaluate(el=>el.scrollWidth>el.clientWidth),false);
 await f.locator('.sa-map-pin[data-chapter=classroom]').click();
 await f.locator('[data-sa=replay]').click();
 await page.screenshot({path:path.join(shots,'mobile-story.png'),fullPage:true});
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS: Lv7 observation/wrong answer/retry; Lv8 stamp-gated cover/save failure/reload; Lv9 cafeteria; dialog focus/Tab/Escape; friendly shop error; mobile labels/layout; growth boundaries and cap; multi-level celebration; existing quests/stamps/scene/typing/network. Screenshots: '+shots);
 }finally{await browser.close();server.closeAllConnections();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});

