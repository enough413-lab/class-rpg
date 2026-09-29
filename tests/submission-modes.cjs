const fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');const root=path.resolve(__dirname,'..');
const studentMock=`const createClient=()=>({rpc:async(name,args)=>{if(name==='student_submit_quest_evidence'){window.calls.push(args);return {error:null}}return {data:[],error:null}}});window.calls=[];`;
const studentFixture=`current={id:987,nickname:'테스트'};token='fixture';dashboardQuests=[];for(const kind of ['daily','weekly','main'])for(const mode of ['photo','text','both'])dashboardQuests.push({id:101+dashboardQuests.length,title:kind+' '+mode,quest_type:kind,submission_mode:mode,status:kind==='main'?'accepted':'available'});loadDashboard=async()=>{};window.fixtureQuests=dashboardQuests;window.testReady=true;`;
const teacherMock=`window.questRows=[];window.writes=[];window.failSave=false;
const createClient=()=>({
 auth:{getUser:async()=>({data:{user:{id:'teacher-fixture'}}}),getSession:async()=>({data:{session:null}})},
 channel(){const c={on(){return c},subscribe(){return c}};return c},rpc:async()=>({data:[],error:null}),
 from(table){let op='select',payload=null,id=null;const q={select(){return q},eq(k,v){if(k==='id')id=v;return q},order(){return q},range(){return q},insert(v){op='insert';payload=v;return q},update(v){op='update';payload=v;return q},single(){return Promise.resolve({data:window.questRows.find(r=>r.id===id),error:null})},then(resolve){if(op!=='select'){if(window.failSave)return resolve({error:{message:'테스트 저장 실패'}});window.writes.push({op,payload,id});if(op==='insert')window.questRows.push({id:window.questRows.length+1,active:true,...payload});else Object.assign(window.questRows.find(r=>r.id===id),payload);}return resolve({data:table==='quests'?window.questRows:[],error:null})}};return q}
});`;
const teacherFixture=`loadSubmissions=async()=>{};$('authCard').classList.add('hidden');$('app').classList.remove('hidden');window.testReady=true;`;
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/teacher-test'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end('<iframe id="core" src="teacher-core.html" style="width:100%;height:95vh;border:0"></iframe><script src="teacher-gameplay.js"></script>');}
 const file=path.resolve(root,'.'+decodeURIComponent(pathname));if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end()}
 try{let content=fs.readFileSync(file);if(/(?:app|teacher)-core\.html$/.test(file)){
  const teacher=file.endsWith('teacher-core.html');content=content.toString().replace(/import\{createClient\}from'[^']+';/,()=>teacher?teacherMock:studentMock);
  if(teacher)content=content.replace(/<script src="teacher-(?:dashboard|refinements)\.js[^>]*><\/script>/g,'');
  const pos=content.lastIndexOf('</script>');content=content.slice(0,pos)+(teacher?teacherFixture:studentFixture)+content.slice(pos);
 }res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(content);
 }catch{res.statusCode=404;res.end()}
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:process.env.TEST_BROWSER_CHANNEL||'msedge'});
 try{const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());const base=`http://127.0.0.1:${server.address().port}`;
  await page.goto(base+'/app-core.html');await page.waitForFunction(()=>window.testReady);
  const pic=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=80;c.getContext('2d').fillRect(0,0,80,80);return c.toDataURL('image/png')});const image={name:'photo.png',mimeType:'image/png',buffer:Buffer.from(pic.split(',')[1],'base64')};
  const quests=await page.evaluate(()=>window.fixtureQuests);
  for(const q of quests){
   await page.evaluate(id=>openProgressQuest(id),q.id);
   assert.equal(await page.locator('#progressQuestText').isVisible(),q.submission_mode!=='photo');assert.equal(await page.locator('#progressQuestPhoto').isVisible(),q.submission_mode!=='text');
   const before=await page.evaluate(()=>calls.length);await page.locator('#progressQuestSubmit').click();assert.equal(await page.evaluate(()=>calls.length),before);
   if(q.submission_mode!=='photo')await page.locator('#progressQuestText').fill('수행한 내용');else await page.evaluate(()=>document.querySelector('#progressQuestText').value='이전 방식의 숨겨진 글');
   if(q.submission_mode==='both'){await page.locator('#progressQuestSubmit').click();assert.equal(await page.evaluate(()=>calls.length),before);assert.match(await page.locator('#progressQuestMsg').textContent(),/사진을 1장/);}
   if(q.submission_mode!=='text'){await page.locator('#progressQuestPhoto').setInputFiles([image,image]);await page.waitForFunction(()=>!document.querySelector('#progressQuestSubmit').disabled);}
   await page.locator('#progressQuestSubmit').click();const call=await page.evaluate(()=>calls.at(-1));assert.equal(call.p_quest_id,q.id);assert.equal(call.p_report,q.submission_mode==='photo'?'':'수행한 내용');
   if(q.submission_mode==='text')assert.equal(call.p_image,null);else assert.equal(JSON.parse(call.p_image).length,2);
  }
  await page.goto(base+'/teacher-test');const frame=page.frames().find(f=>f.url().includes('teacher-core.html'));await frame.waitForFunction(()=>window.testReady&&window.__directQuestAddInstalled);
  await frame.locator('#questTitle').fill('방식 선택 검사');await frame.evaluate(()=>addQuest());assert.equal(await frame.evaluate(()=>writes.length),0);assert.match(await frame.locator('#questMsg').textContent(),/제출방식/);
  for(const mode of ['photo','text','both']){
   await frame.locator('#questTitle').fill('퀘스트 '+mode);await frame.locator('#questSubmissionMode').selectOption(mode);await frame.evaluate(()=>addQuest());
   assert.equal(await frame.evaluate(()=>writes.at(-1).payload.submission_mode),mode);assert.equal(await frame.locator('#questSubmissionMode').inputValue(),'');
  }
  assert.match(await frame.locator('#quests').textContent(),/사진만/);assert.match(await frame.locator('#quests').textContent(),/글만/);assert.match(await frame.locator('#quests').textContent(),/글과 사진 둘 다/);
  await frame.evaluate(()=>editQuest(1));await frame.locator('#editQuestSubmissionMode').selectOption('both');await frame.locator('#editQuestDetails [data-save]').click();await frame.locator('#editQuestDetails').waitFor({state:'detached'});assert.equal(await frame.evaluate(()=>questRows[0].submission_mode),'both');
  await frame.evaluate(()=>editQuest(2));await frame.locator('#editQuestSubmissionMode').selectOption('photo');await frame.locator('#editQuestDetails [data-cancel]').click();assert.equal(await frame.evaluate(()=>questRows[1].submission_mode),'text');
  await frame.evaluate(()=>editQuest(2));await frame.locator('#editQuestSubmissionMode').selectOption('photo');await frame.evaluate(()=>window.failSave=true);await frame.locator('#editQuestDetails [data-save]').click();await frame.waitForFunction(()=>document.querySelector('#editQuestMessage').textContent.includes('테스트 저장 실패'));assert(await frame.locator('#editQuestDetails').isVisible());assert.equal(await frame.locator('#editQuestSubmissionMode').inputValue(),'photo');await frame.evaluate(()=>window.failSave=false);await frame.locator('#editQuestDetails [data-save]').click();await frame.locator('#editQuestDetails').waitFor({state:'detached'});
  await frame.evaluate(()=>{questRows.push({id:4,title:'기존 퀘스트',description:'기존 설명',submission_mode:null});});await frame.evaluate(()=>editQuest(4));assert.equal(await frame.locator('#editQuestSubmissionMode').inputValue(),'');await frame.locator('#editQuestDetails [data-save]').click();await frame.locator('#editQuestDetails').waitFor({state:'detached'});assert.equal(await frame.evaluate(()=>questRows[3].submission_mode),null);

  assert.equal(await frame.locator('#weeklyResetField').isVisible(),false);
  await frame.locator('#questType').selectOption('weekly');
  assert.equal(await frame.locator('#weeklyResetField').isVisible(),true);
  assert.equal(await frame.locator('#questWeeklyResetDay').inputValue(),'1');
  await frame.locator('#questWeeklyResetDay').selectOption('2');
  await frame.locator('#questTitle').fill('화요일 받아쓰기');
  await frame.locator('#questSubmissionMode').selectOption('text');
  await frame.evaluate(()=>addQuest());
  assert.equal(await frame.evaluate(()=>writes.at(-1).payload.weekly_reset_day),2);
  assert.match(await frame.locator('#quests').textContent(),/매주 화요일 0시/);
  await frame.evaluate(()=>editQuest(5));
  assert.equal(await frame.locator('#editQuestWeeklyResetDay').inputValue(),'2');
  await frame.locator('#editQuestWeeklyResetDay').selectOption('7');
  await frame.locator('#editQuestDetails [data-save]').click();
  await frame.locator('#editQuestDetails').waitFor({state:'detached'});
  assert.equal(await frame.evaluate(()=>questRows[4].weekly_reset_day),7);
  await frame.evaluate(()=>editQuest(5));
  assert.equal(await frame.locator('#editQuestWeeklyResetDay').inputValue(),'7');
  await frame.locator('#editQuestWeeklyResetDay').selectOption('3');
  await frame.locator('#editQuestDetails [data-cancel]').click();
  assert.equal(await frame.evaluate(()=>questRows[4].weekly_reset_day),7);
  await frame.evaluate(()=>editQuest(1));
  assert.equal(await frame.locator('#editQuestWeeklyResetDay').count(),0);
  await frame.locator('#editQuestDetails [data-cancel]').click();
  await frame.locator('#questType').selectOption('daily');
  assert.equal(await frame.locator('#weeklyResetField').isVisible(),false);
  const schedule=await page.evaluate(async()=>{
   const m=await import('/quest-schedule.js');
   return [m.questPeriod('weekly',2,new Date('2026-09-28T14:59:59Z')),m.questPeriod('weekly',2,new Date('2026-09-28T15:00:00Z')),m.questPeriod('weekly',1,new Date('2026-09-28T14:59:59Z')),m.questPeriod('weekly',7,new Date('2026-01-03T15:00:00Z')),m.questPeriod('daily',2,new Date('2026-09-28T15:00:00Z'))];
  });
  assert.deepEqual(schedule,['2026-09-22','2026-09-29','2026-09-28','2026-01-04','2026-09-29']);
  console.log('PASS: weekly create Tuesday; edit Sunday; cancel; daily hidden; Seoul midnight boundaries; year rollover.');
  assert.equal(errors.length,0,errors.join('\n'));console.log('PASS: 9 student mode/type combinations; visibility/required fields; photo-only omits stale text; multiple photos; teacher creation through gameplay override; edit/cancel/save failure; legacy mode preserved.');
 }finally{await browser.close();server.closeAllConnections();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
