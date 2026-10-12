const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright'),{server,shots}=require('./student-fixture.cjs');
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1366,height:768},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());const base='http://127.0.0.1:'+server.address().port;await page.goto(base);let f;
 const ready=async()=>{f=page.frames().find(x=>x.url().includes('app-core.html'));await f.waitForFunction(()=>window.studentCampus);await f.evaluate(()=>document.fonts.ready)};await ready();fs.mkdirSync(shots,{recursive:true});
 const settle=()=>f.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const enter=async room=>{await f.evaluate(room=>{enterHubScene(room==='library'?'hallway':'library');enterHubScene(room)},room);await f.locator('.campus-scene-status').waitFor({state:'hidden'});await settle()};
 const edge=async dx=>{await f.evaluate(dx=>{for(let i=0;i<35;i++)moveHub(dx,0)},dx);await settle()};
 const go=async kind=>{await f.locator('[data-campus=find]').tap();await f.locator('[data-finder-place='+kind+']').tap()};
 const arrived=async()=>{await f.locator('[data-campus=use][data-state=arrived]').waitFor();await f.waitForFunction(()=>!document.getElementById('hubPlayer').classList.contains('walking'));await settle()};
 const check=async(kind,from,checkFacing=true)=>{
  const g=await f.evaluate(kind=>{const rect=e=>e.getBoundingClientRect().toJSON(),p=document.getElementById('hubPlayer'),n=document.querySelector('[data-place='+kind+']');return{p:rect(p),n:rect(n),name:rect(p.querySelector('.campus-player-name')),view:rect(document.querySelector('.campus-viewport')),stage:rect(document.querySelector('.hub-stage')),x:parseFloat(p.style.left),facing:p.dataset.facing,selected:document.querySelector('.campus-npc.is-near')?.dataset.place}},kind);
  const left=g.p.right<=g.n.left,gap=left?g.n.left-g.p.right:g.p.left-g.n.right;
  assert(gap>=8.5,kind+' bodies overlap or crowd: '+gap);assert(gap<=12,kind+' conversation gap too wide: '+gap);
  if(checkFacing)assert.equal(g.facing,left?'right':'left');assert.equal(g.selected,kind,'Arrival action belongs to the selected NPC');assert(g.name.top>g.p.bottom,'Name stays below feet');
  assert(g.p.left>=g.view.left-1&&g.p.right<=g.view.right+1&&g.n.left>=g.view.left-1&&g.n.right<=g.view.right+1,'Both characters visible');
  if(from<0)assert(left,'Approach from left stays left');
  if(from>0&&kind!=='shop')assert(!left,'Approach from right stays right');
  return g;
 };
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const [width,height]of [[1366,768],[390,844],[320,640]]){
  await page.setViewportSize({width,height});
  for(const [room,kind]of [['classroom','quests'],['classroom','shop'],['library','tori']])for(const from of [-1,1]){
   await enter(room);await edge(from);await go(kind);await arrived();await check(kind,from);
   await page.screenshot({path:path.join(shots,'approach-'+kind+'-'+(from<0?'left':'right')+'-'+width+'.png'),fullPage:true});
   assert.equal(await f.locator('dialog[open]').count(),0,'Guidance does not automatically open dialogue');
   if(from<0)await f.locator('[data-campus=use]').tap();else{await f.locator('#campusTitle').focus();await page.keyboard.press('e')}
   assert(await f.locator(kind==='tori'?'#campusGuide':'#campusNpcDialog').isVisible());await page.keyboard.press('Escape');await check(kind,from);
  }
 }
 // Reconnect selects the same resident beside the saved position, not nearby furniture.
 await enter('classroom');await edge(1);await go('quests');await arrived();const saved=await check('quests',1),savedX=Number(saved.x.toFixed(2));await f.evaluate(()=>closeClassroomHub());await page.reload();await ready();await f.evaluate(()=>openClassroomHub());await settle();assert.equal(await f.locator('#hubPlayer').evaluate(e=>parseFloat(e.style.left)),savedX);await check('quests',1,false);
 await f.evaluate(async()=>{mockRpg.student.id=988;await loadDashboard()});await f.waitForFunction(()=>parseFloat(document.getElementById('hubPlayer').style.left)===44);await f.evaluate(async()=>{mockRpg.student.id=987;await loadDashboard()});await f.waitForFunction(x=>parseFloat(document.getElementById('hubPlayer').style.left)===x,savedX);await check('quests',1,false);
 // Real guided travel retains 100px/s under 4x CPU, and resize retargets without a teleport.
 await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:390,height:844});await enter('library');await edge(-1);const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await go('tori');await f.locator('[data-campus=use][data-state=walking]').waitFor();
 const travel=await f.evaluate(()=>new Promise(resolve=>{const samples=[];function sample(t){const p=document.getElementById('hubPlayer'),s=document.querySelector('.hub-stage');samples.push({t,x:parseFloat(p.style.left)*s.clientWidth/100});if(samples.length<30)requestAnimationFrame(sample);else resolve(samples)}requestAnimationFrame(sample)}));
 const speed=(travel.at(-1).x-travel[0].x)/(travel.at(-1).t-travel[0].t)*1000;assert(speed>80&&speed<117,'Guided CPU-throttled speed '+speed);await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
 await page.setViewportSize({width:320,height:640});await arrived();await check('tori',-1);
 // A second guide from the same side does not shuffle the player across the NPC.
 const same=await f.locator('#hubPlayer').getAttribute('style');await go('tori');await arrived();assert.equal(await f.locator('#hubPlayer').getAttribute('style'),same);
 // Manual movement cancels guidance; missing resident artwork still has a usable arrival.
 await edge(1);await go('tori');await f.locator('[data-campus=use][data-state=walking]').waitFor();await page.keyboard.press('ArrowLeft');const stopped=await f.locator('#hubPlayer').getAttribute('style');await page.waitForTimeout(180);assert.equal(await f.locator('#hubPlayer').getAttribute('style'),stopped);
 await page.route('**/maps/npcs/tori-v1.webp',r=>r.abort());await page.reload();await ready();await page.emulateMedia({reducedMotion:'reduce'});await enter('library');await f.locator('[data-place=tori].art-missing').waitFor();await edge(-1);await go('tori');await arrived();await check('tori',-1);await f.locator('[data-campus=use]').tap();assert(await f.locator('#campusGuide').isVisible());
 assert.deepEqual(await f.evaluate(()=>[mockRpg.student.xp,mockRpg.student.gold]),[260,180]);assert.deepEqual(errors,[]);console.log('PASS: separated/facing NPC arrival from both sides at 1366/390/320, correct native touch/keyboard conversation, no auto-open, reconnect/account isolation, resize during 100px/s 4x CPU travel, cancellation and missing-art fallback.');
}finally{await browser.close();server.closeAllConnections();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
