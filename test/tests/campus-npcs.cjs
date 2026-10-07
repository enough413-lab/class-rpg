const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),sharp=require('sharp');
const {chromium}=require('playwright');const {server,shots}=require('./student-fixture.cjs');
(async()=>{
 // Foreground files must contain real transparency, not a painted background rectangle.
 for(const id of ['teacher','shopkeeper','wardrobe','titles','records']){const stats=await sharp(path.join(__dirname,'../maps/npcs/'+id+'-v1.webp')).stats();assert.equal(stats.channels.length,4);assert.equal(stats.channels[3].min,0);assert.equal(stats.channels[3].max,255)}
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  fs.mkdirSync(shots,{recursive:true});const page=await browser.newPage({viewport:{width:1440,height:1050},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());await page.goto('http://127.0.0.1:'+server.address().port);
  const f=page.frames().find(f=>f.url().includes('app-core.html'));await f.waitForFunction(()=>window.studentCampus);await f.evaluate(()=>enterHubScene('classroom'));await f.locator('.campus-scene-status').waitFor({state:'hidden'});
  await f.waitForFunction(()=>[...document.querySelectorAll('.campus-sprite-art')].length===6&&[...document.querySelectorAll('.campus-sprite-art')].every(i=>i.complete&&i.naturalWidth>0));
  const pos=()=>f.locator('#hubPlayer').getAttribute('style');const start=await pos();
  await f.locator('[data-place=quests]').focus();await page.keyboard.press('Enter');await f.locator('#campusNpcDialog[open]').waitFor();assert.match(await f.locator('#campusNpcName').textContent(),/새봄/);
  await page.keyboard.press('ArrowRight');assert.equal(await pos(),start);
  await f.locator('[data-npc-action=quests]').click();await f.locator('#questCenterModal').waitFor();assert(!(await f.locator('#campusNpcDialog').isVisible()));await page.keyboard.press('Escape');assert.equal(await pos(),start);
  await f.locator('[data-place=quests]').click();await f.locator('[data-npc-action=teacher]').click();assert(await f.locator('#completedQuestHistory').isVisible());await page.keyboard.press('Escape');
  await f.locator('[data-place=shop]').click();await page.screenshot({path:path.join(shots,'desktop-npc-shop-dialog.png'),fullPage:true});await f.locator('[data-npc-action=shop]').click();await f.locator('#shopModal').waitFor();assert(await f.locator('#shopModal').evaluate(el=>el.contains(document.activeElement)));await page.keyboard.press('Escape');assert.equal(await pos(),start);
  await f.locator('[data-place=quests]').click();await page.keyboard.press('Escape');assert(await f.locator('#classroomHub').isVisible());assert.equal(await f.evaluate(()=>document.activeElement.dataset.place),'quests');
  await f.locator('#campusTitle').focus();await page.screenshot({path:path.join(shots,'desktop-npc-classroom.png'),fullPage:true});
  await page.setViewportSize({width:1366,height:768});await page.screenshot({path:path.join(shots,'laptop-npc-classroom.png'),fullPage:true});assert(await f.locator('[data-campus=use]').evaluate(el=>el.getBoundingClientRect().bottom<innerHeight));
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});await f.locator('[data-place=quests]').tap();assert(await f.locator('#campusNpcDialog').isVisible());
   assert(await f.locator('#campusNpcDialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
   for(const b of await f.locator('#campusNpcDialog button').all()){const r=await b.boundingBox();assert(r.height>=44&&r.width>=44)}
   await page.screenshot({path:path.join(shots,`mobile-${width}-npc-dialog.png`),fullPage:true});await f.locator('[data-npc-close]').last().tap();assert.equal(await pos(),start);
   await page.screenshot({path:path.join(shots,`mobile-${width}-npc-classroom.png`),fullPage:true});
  }
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await f.locator('.campus-npc .campus-sprite-art').first().evaluate(el=>getComputedStyle(el).animationName),'none');
  // Even if an individual sprite fails, its named action remains usable.
  const failed=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});await failed.route('https://**',r=>r.abort());await failed.route('**/maps/npcs/teacher-v1.webp',r=>r.abort());await failed.goto('http://127.0.0.1:'+server.address().port);const ff=failed.frames().find(f=>f.url().includes('app-core.html'));await ff.waitForFunction(()=>window.studentCampus);await ff.evaluate(()=>enterHubScene('classroom'));await ff.locator('[data-place=quests].art-missing').waitFor();await ff.locator('[data-place=quests]').tap();assert(await ff.locator('#campusNpcDialog').isVisible());await failed.close();
  assert.deepEqual(await f.evaluate(()=>[mockRpg.student.xp,mockRpg.student.gold]),[260,180]);assert.deepEqual(errors,[]);
  console.log('PASS: true alpha sprites, teacher/record/shop actions, modal movement guard, focus return, touch and 1440/1366/390/320 views, reduced motion, failed-art fallback, unchanged XP/gold.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
