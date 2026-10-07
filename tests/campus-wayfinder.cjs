const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');const {server,shots}=require('./student-fixture.cjs');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 fs.mkdirSync(shots,{recursive:true});const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());await page.goto(base);
  const f=page.frames().find(f=>f.url().includes('app-core.html'));await f.waitForFunction(()=>document.getElementById('saProfileTitle')?.textContent.includes('별나래'));
  await f.evaluate(async()=>{mockRpg.student.xp=0;await loadDashboard();enterHubScene('classroom')});
  const position=()=>f.locator('#hubPlayer').evaluate(el=>parseFloat(el.style.left));
  const arrive=async x=>{await f.waitForFunction(x=>Math.abs(parseFloat(document.getElementById('hubPlayer').style.left)-x)<.06,x);await f.waitForFunction(()=>document.querySelector('[data-campus=use]').dataset.state==='arrived')};
  await f.locator('[data-campus=find]').click();assert(await f.locator('#campusWayfinder').isVisible());assert.equal(await f.locator('[data-finder-place]').count(),7);
  await page.screenshot({path:path.join(shots,'desktop-wayfinder.png'),fullPage:true});
  // The real keyboard keeps focus in the directory and leaves the room stationary.
  const held=await position();await page.keyboard.press('ArrowLeft');assert.equal(await position(),held);
  await f.locator('[data-finder-close]').focus();await page.keyboard.press('Shift+Tab');assert.equal(await f.evaluate(()=>document.activeElement.dataset.finderPlace),'hallway');
  await page.keyboard.press('Escape');assert.equal(await f.evaluate(()=>document.activeElement.dataset.campus),'find');
  await f.locator('[data-campus=find]').click();await f.locator('[data-finder-place=inventory]').click();await arrive(24);
  assert(!(await f.locator('#inventoryModal').isVisible()),'Arrival must not unexpectedly open an activity');
  await f.locator('[data-campus=use]').click();assert(await f.locator('#inventoryModal').isVisible());await f.waitForFunction(()=>document.getElementById('inventoryModal').getAttribute('aria-busy')==='false');await page.keyboard.press('Escape');assert.equal(await position(),24);
  // Cross-room guidance only lists implemented walking rooms, including Lv.1 reading.
  await f.locator('[data-campus=find]').click();await f.locator('[data-finder-room=library]').click();assert.equal(await f.locator('[data-finder-place]').count(),4);
  await f.locator('[data-finder-place=reading]').click();await arrive(28);assert.match(await f.locator('#campusTitle').textContent(),/도서관/);await f.locator('[data-campus=use]').click();assert(await f.locator('#readingPortfolioModal').isVisible());await page.keyboard.press('Escape');assert.equal(await position(),28);
  // The notebook and locked story feedback return to the same room, position and map button.
  await f.locator('[data-campus=map]').click();await f.locator('.sa-world').waitFor();assert(await f.locator('#classroomHub').isVisible());
  await f.locator('.sa-map-pin[data-chapter=library]').click();assert.match(await f.locator('#saDialogBody').textContent(),/110 경험치/);await page.keyboard.press('Escape');
  assert.equal(await position(),28);assert.match(await f.locator('#campusTitle').textContent(),/도서관/);assert.equal(await f.evaluate(()=>document.activeElement.dataset.campus),'map');
  // Cancel, manual direction, floor clicks and overlay interruption all stop the guided destination.
  await f.locator('[data-campus=find]').click();await f.locator('[data-finder-place=portfolio]').click();await f.waitForFunction(()=>document.querySelector('[data-campus=use]').dataset.state==='walking');
  await f.locator('[data-campus=use]').click();const cancelled=await position();await page.waitForTimeout(200);assert.equal(await position(),cancelled);
  await f.locator('[data-campus=find]').click();await f.locator('[data-finder-place=portfolio]').click();await f.waitForFunction(()=>document.querySelector('[data-campus=use]').dataset.state==='walking');await f.locator('#campusTitle').press('ArrowLeft');const manual=await position();await page.waitForTimeout(220);assert.equal(await position(),manual);assert.equal(await f.locator('.is-destination').count(),0);
  await f.locator('[data-campus=find]').click();await f.locator('[data-finder-place=portfolio]').click();await f.waitForFunction(()=>document.querySelector('[data-campus=use]').dataset.state==='walking');await f.evaluate(()=>openReadingPortfolio());await page.waitForTimeout(100);const paused=await position();await page.waitForTimeout(200);assert.equal(await position(),paused);await page.keyboard.press('Escape');assert.notEqual(await f.locator('[data-campus=use]').getAttribute('data-state'),'walking');
  // Far from an object, the nearest direction is actionable instead of disabled.
  await f.evaluate(()=>enterHubScene('hallway'));await f.locator('[data-place=notice]').waitFor();await f.evaluate(()=>{for(let i=0;i<5;i++)moveHub(-1,0)});await f.locator('[data-campus=use][data-state=guide]').waitFor();assert.match(await f.locator('#campusNear').textContent(),/왼쪽/);await f.locator('[data-campus=use]').click();await arrive(16);
  await page.setViewportSize({width:1366,height:768});assert(await f.locator('[data-campus=use]').evaluate(el=>el.getBoundingClientRect().bottom<innerHeight));
  await page.setViewportSize({width:390,height:844});await f.locator('[data-campus=find]').click();await f.locator('[data-finder-room=classroom]').click();await page.screenshot({path:path.join(shots,'mobile-wayfinder.png'),fullPage:true});
  assert(await f.locator('#campusWayfinder').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  for(const b of await f.locator('#campusWayfinder button:visible').all()){const r=await b.boundingBox();assert(r.width>=44&&r.height>=44)}
  await f.locator('[data-finder-place=shop]').click();await arrive(81);await f.locator('.campus-scene-status').waitFor({state:'hidden'});await page.screenshot({path:path.join(shots,'mobile-guided-arrival.png'),fullPage:true});
  assert(await f.locator('#classroomHub').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  assert(await f.locator('.campus-viewport').evaluate(el=>el.scrollLeft===0));
  await page.setViewportSize({width:320,height:640});await f.locator('[data-campus=find]').click();await f.locator('[data-finder-place=hallway]').scrollIntoViewIfNeeded();assert(await f.locator('[data-finder-close]').evaluate(el=>el.getBoundingClientRect().top>=0));assert(await f.locator('#campusWayfinder').evaluate(el=>el.scrollWidth<=el.clientWidth+1));await page.keyboard.press('Escape');
  await page.emulateMedia({reducedMotion:'reduce'});await f.locator('[data-campus=find]').click();await f.locator('[data-finder-place=inventory]').click();await arrive(24);assert.equal(await f.locator('#hubPlayer').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
  // Touch activation runs once; close/reopen does not restart an old route.
  const touch=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await touch.route('https://**',r=>r.abort());await touch.goto(base);const tf=touch.frames().find(f=>f.url().includes('app-core.html'));await tf.waitForFunction(()=>window.studentCampus);await tf.evaluate(()=>enterHubScene('library'));await tf.locator('[data-campus=find]').tap();await tf.locator('[data-finder-place=tori]').tap();await tf.waitForFunction(()=>document.querySelector('[data-campus=use]').dataset.state==='arrived');await tf.locator('[data-campus=use]').tap();assert(await tf.locator('#campusGuide').isVisible());await touch.close();
  assert.deepEqual(await f.evaluate(()=>[mockRpg.student.xp,mockRpg.student.gold]),[0,180]);assert.deepEqual(errors,[]);
  console.log('PASS: directory keyboard/touch, guided arrival, cancel/manual/overlay stop, nearest direction, Lv1 reading, notebook return and gates, desktop/laptop/390px/320px, reduced motion and unchanged economy.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exit(1)});
