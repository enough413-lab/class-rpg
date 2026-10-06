const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');const {server,shots}=require('./student-fixture.cjs');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 fs.mkdirSync(shots,{recursive:true});const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warning'&&m.text().includes('TypeError'))errors.push(m.text())});await page.route('https://**',r=>r.abort());
  const ready=async()=>{const f=page.frames().find(f=>f.url().includes('app-core.html'));await f.waitForFunction(()=>document.getElementById('saProfileTitle')?.textContent.includes('별나래'));return f};
  await page.goto(base);let f=await ready();await f.evaluate(async()=>{mockRpg.student.xp=0;await loadDashboard();enterHubScene('classroom')});
  assert.match(await f.locator('#campusTitle').textContent(),/우리 교실/);
  await f.locator('.campus-scene-status').waitFor({state:'hidden'});await page.screenshot({path:path.join(shots,'desktop-side-classroom.png'),fullPage:true});
  assert.equal(await f.locator('.campus-rig .campus-part').count(),3);await f.waitForFunction(()=>document.__busyGuard);
  // A floor destination moves over time on the shared ground, clamps at room ends and stops under dialogs.
  const ground=await f.locator('.hub-stage').boundingBox();await page.mouse.click(ground.x+ground.width*.61,ground.y+ground.height*.79);
  await f.waitForFunction(()=>parseFloat(document.getElementById('hubPlayer').style.left)>55);assert.equal(await f.locator('#hubPlayer').evaluate(el=>parseFloat(el.style.top)),80);
  await f.evaluate(()=>openReadingPortfolio());const paused=await f.locator('#hubPlayer').getAttribute('style');await page.waitForTimeout(230);assert.equal(await f.locator('#hubPlayer').getAttribute('style'),paused);await page.keyboard.press('Escape');
  await f.evaluate(()=>{for(let i=0;i<50;i++)moveHub(-1,0)});assert.equal(await f.locator('#hubPlayer').evaluate(el=>parseFloat(el.style.left)),4);assert.equal(await f.locator('#hubPlayer').getAttribute('data-facing'),'left');
  await f.evaluate(()=>{for(let i=0;i<50;i++)moveHub(1,0)});assert.equal(await f.locator('#hubPlayer').evaluate(el=>parseFloat(el.style.left)),96);assert.equal(await f.locator('#hubPlayer').getAttribute('data-facing'),'right');
  await f.locator('[data-route=hallway]').focus();await page.keyboard.press('Enter');await f.locator('[data-route=library]').waitFor();
  await f.locator('[data-route=library]').click();assert.equal(await f.locator('.campus-tori').count(),1);
  await f.locator('.campus-scene-status').waitFor({state:'hidden'});
  assert.match(await f.locator('#campusTitle').textContent(),/도서관/);
  const pos=()=>f.locator('#hubPlayer').evaluate(el=>[parseFloat(el.style.left),parseFloat(el.style.top)]);
  await f.locator('#campusTitle').focus();const before=await pos();await page.keyboard.press('ArrowLeft');assert.deepEqual(await pos(),[before[0]-3,80]);
  // Holding, releasing and cancelling must not leave movement running.
  const up=f.locator('[data-move="-1,0"]'),box=await up.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(310);await page.mouse.up();
  const released=await pos();assert(released[0]<before[0]-6);assert.equal(released[1],80);await page.waitForTimeout(220);assert.deepEqual(await pos(),released);
  await page.mouse.down();await up.dispatchEvent('pointercancel',{pointerId:1});const cancelled=await pos();await page.waitForTimeout(200);assert.deepEqual(await pos(),cancelled);await page.mouse.up();
  // Near-NPC keyboard interaction and native dialog buttons are distinct actions.
  await f.evaluate(()=>{enterHubScene('library')});await f.locator('.campus-tori').waitFor();await f.evaluate(()=>{for(let i=0;i<3;i++)moveHub(1,0)});await f.locator('#campusTitle').focus();await page.keyboard.press('e');assert(await f.locator('#campusGuide').isVisible());
  const frozen=await pos();await page.keyboard.press('ArrowDown');assert.deepEqual(await pos(),frozen);
  await f.locator('[data-guide=reading]').focus();await page.keyboard.press('Enter');assert(await f.locator('#readingPortfolioModal').isVisible());
  await page.keyboard.press('Escape');assert(!(await f.locator('#readingPortfolioModal').isVisible()));assert.deepEqual(await pos(),frozen);assert.match(await f.locator('#campusTitle').textContent(),/도서관/);
  await f.locator('.campus-tori').click();await f.locator('[data-guide=evidence]').click();assert.match(await f.locator('#saDialogBody').textContent(),/Lv|경험치/);assert.equal(await f.locator('[data-sa=check-evidence]').count(),0);await page.keyboard.press('Escape');
  // Started evidence remains available when a teacher corrects XP, without opening the map first.
  await f.evaluate(()=>localStorage.setItem('fixtureExploration',JSON.stringify(['library-evidence-1'])));await page.reload();f=await ready();await f.evaluate(()=>enterHubScene('library'));await f.locator('.campus-tori').click();await f.locator('[data-guide=evidence]').click();assert.match(await f.locator('#saEvidenceTitle').textContent(),/책 추천/);await page.keyboard.press('Escape');
  await page.screenshot({path:path.join(shots,'desktop-campus-library.png'),fullPage:true});
  await page.setViewportSize({width:1366,height:768});await f.locator('#classroomHub').evaluate(el=>el.scrollTop=0);await page.screenshot({path:path.join(shots,'laptop-campus-library.png'),fullPage:true});
  assert(await f.locator('[data-campus=use]').evaluate(el=>el.getBoundingClientRect().bottom<innerHeight));assert(await f.locator('#campusTitle').evaluate(el=>el.getBoundingClientRect().top>=0));
  await page.setViewportSize({width:1440,height:1100});
  await f.locator('.campus-tori').click();await page.screenshot({path:path.join(shots,'desktop-campus-tori.png'),fullPage:true});await page.keyboard.press('Escape');
  await f.locator('[data-route=reading]').click();await page.keyboard.press('Escape');
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(shots,'mobile-campus-library.png'),fullPage:true});
  assert(await f.locator('.campus-viewport').evaluate(el=>el.scrollWidth>el.clientWidth));
  const cameraBefore=await f.locator('.hub-stage').evaluate(el=>el.style.transform);await f.evaluate(()=>moveHub(1,0));assert.notEqual(await f.locator('.hub-stage').evaluate(el=>el.style.transform),cameraBefore);assert.equal((await pos())[1],80);
  for(const selector of ['.campus-pad button','.campus-menu button','.campus-routes button'])for(const b of await f.locator(selector).all()){const rect=await b.boundingBox();assert(rect.width>=44&&rect.height>=44)}
  assert(await f.locator('#classroomHub').evaluate(el=>el.scrollWidth<=el.clientWidth+1));assert.equal(await f.locator('.sa-mobile-nav').evaluate(el=>getComputedStyle(el).visibility),'hidden');
  await f.locator('.campus-tori').click();await page.screenshot({path:path.join(shots,'mobile-campus-tori.png'),fullPage:true});assert(await f.locator('#campusGuide').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  await page.keyboard.press('Escape');assert(await f.locator('#classroomHub').isVisible());
  await f.locator('[data-campus=home]').focus();await page.keyboard.press('Enter');assert(!(await f.locator('#classroomHub').isVisible()));
  await f.evaluate(()=>enterHubScene('library'));await f.locator('[data-campus=map]').click();assert(await f.locator('#studentAdventureDialog').isVisible());assert(await f.locator('#classroomHub').isVisible());
  await page.keyboard.press('Escape');await f.evaluate(()=>enterHubScene('classroom'));
  await f.locator('#campusTitle').focus();await page.keyboard.press('Shift+Tab');assert.equal(await f.evaluate(()=>document.activeElement.dataset.campus),'use');
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await f.locator('#hubPlayer').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
  assert.equal(await f.locator('.campus-viewport').evaluate(el=>el.scrollLeft),0);
  await f.evaluate(()=>moveHub(1,0));assert(await f.evaluate(()=>{const a=document.getElementById('hubPlayer').getBoundingClientRect(),v=document.querySelector('.campus-viewport').getBoundingClientRect();return Math.abs(a.x+a.width/2-v.x-v.width/2)<3}));
  await f.locator('.campus-scene-status').waitFor({state:'hidden'});await page.screenshot({path:path.join(shots,'mobile-side-classroom.png'),fullPage:true});
  const touchPage=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await touchPage.route('https://**',r=>r.abort());await touchPage.route('**/maps/library-tall-v2.webp',r=>r.abort());touchPage.on('pageerror',e=>errors.push(e.message));await touchPage.goto(base);
  const touchFrame=touchPage.frames().find(f=>f.url().includes('app-core.html'));await touchFrame.waitForFunction(()=>window.studentCampus);await touchFrame.evaluate(()=>enterHubScene('library'));
  await touchFrame.locator('.campus-scene-status button').waitFor();await touchPage.unroute('**/maps/library-tall-v2.webp');await touchFrame.locator('.campus-scene-status button').tap();await touchFrame.locator('.campus-scene-status').waitFor({state:'hidden'});
  const touchPos=()=>touchFrame.locator('#hubPlayer').evaluate(el=>parseFloat(el.style.left));const originalX=await touchPos();await touchFrame.locator('[data-move="-1,0"]').tap();assert.equal(await touchPos(),originalX-3);await page.waitForTimeout(220);assert.equal(await touchPos(),originalX-3);await touchFrame.locator('.campus-tori').tap();assert(await touchFrame.locator('#campusGuide').isVisible());await touchPage.close();
  assert.deepEqual(await f.evaluate(()=>({xp:mockRpg.student.xp,gold:mockRpg.student.gold})),{xp:260,gold:180});assert.deepEqual(errors,[]);
  console.log('PASS: scene routes, focused-button Enter, one-step keyboard movement, hold/release/cancel, NPC E, dialog movement guard, reading return position, level gate/retained evidence, 390px touch/layout, map/home return, focus containment, reduced motion, no XP/gold changes');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
