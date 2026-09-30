const assert=require('node:assert/strict'),path=require('path'),fs=require('fs');
const {chromium}=require('playwright');const {server,shots}=require('./student-fixture.cjs');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 fs.mkdirSync(shots,{recursive:true});const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());await page.goto(base);
  let f=page.frames().find(f=>f.url().includes('app-core.html'));await f.waitForFunction(()=>document.getElementById('saProfileTitle')?.textContent.includes('별나래'));
  await f.evaluate(async()=>{mockRpg.student.xp=729;await loadDashboard()});await f.locator('.sa-hero [data-sa=map]').click();await f.locator('[data-workshop=chapter-one]').click();
  assert.match(await f.locator('#saDialogBody').textContent(),/1 경험치/);assert.equal(await f.locator('[data-sa=finish-chapter]').count(),0);
  await f.locator('#studentAdventureDialog [data-sa=close]').click();await f.evaluate(async()=>{mockRpg.student.xp=730;await loadDashboard()});
  await f.locator('.sa-hero [data-sa=map]').click();await f.locator('[data-workshop=chapter-one]').click();
  assert(await f.locator('[data-sa=finish-chapter]').isDisabled());assert.equal(await f.locator('.sa-ceremony-checklist [data-chapter]').count(),7);
  await f.locator('#studentAdventureDialog [data-sa=map]').click();await f.locator('.sa-passport').waitFor();
  await f.evaluate(()=>{mockRpg.exploration=['classroom','hallway','library','garden','playground','pond','cafeteria'].flatMap(c=>[1,2,3].map(n=>c+'-'+n));mockRpg.workshop.garden_complete=true;localStorage.setItem('fixtureExploration',JSON.stringify(mockRpg.exploration));localStorage.setItem('fixtureWorkshop',JSON.stringify(mockRpg.workshop))});
  // Reload to verify the ceremony is driven by restored account progress.
  await page.reload();f=page.frames().find(f=>f.url().includes('app-core.html'));await f.waitForFunction(()=>document.getElementById('saProfileTitle')?.textContent.includes('별나래'));
  await f.evaluate(async()=>{mockRpg.student.xp=730;await loadDashboard()});await f.locator('.sa-hero [data-sa=map]').click();await f.locator('[data-workshop=chapter-one]').click();
  await f.locator('[data-sa=finish-chapter]').click();assert.match(await f.locator('#saChapterFeedback').textContent(),/하나 골라/);
  await f.locator('[data-promise=kindness]').click();await f.evaluate(()=>mockRpg.failChapter=true);await f.locator('[data-sa=finish-chapter]').click();assert.match(await f.locator('#saChapterFeedback').textContent(),/아직 저장하지 못/);assert.equal(await f.locator('[data-promise=kindness]').getAttribute('aria-pressed'),'true');
  assert.equal(await f.locator('.sa-profile-memento').count(),0);
  await f.evaluate(()=>mockRpg.failChapter=false);await f.locator('[data-sa=finish-chapter]').click();await f.locator('.sa-memento-earned').waitFor();assert.equal(await f.locator('.sa-profile-memento').count(),1);
  assert.deepEqual(await f.evaluate(()=>({xp:mockRpg.student.xp,gold:mockRpg.student.gold})),{xp:730,gold:180});
  await f.locator('#studentAdventureDialog').evaluate(el=>el.scrollTop=0);await page.screenshot({path:path.join(shots,'desktop-chapter-one.png'),fullPage:true});
  await f.locator('[data-chapter-badge=false]').click();assert.equal(await f.locator('.sa-profile-memento').count(),0);
  await page.reload();f=page.frames().find(f=>f.url().includes('app-core.html'));await f.waitForFunction(()=>document.getElementById('saProfileTitle')?.textContent.includes('별나래'));
  assert.equal(await f.locator('.sa-profile-memento').count(),0);
  await f.locator('.sa-hero [data-sa=map]').click();assert.match(await f.locator('[data-workshop=chapter-one]').textContent(),/첫 모험 완료/);await f.locator('[data-workshop=chapter-one]').click();
  assert.equal(await f.locator('[data-promise=kindness]').getAttribute('aria-pressed'),'true');await f.locator('[data-chapter-badge=true]').click();assert.equal(await f.locator('.sa-profile-memento').count(),1);
  await page.setViewportSize({width:390,height:844});await f.locator('#studentAdventureDialog').evaluate(el=>el.scrollTop=0);await page.screenshot({path:path.join(shots,'mobile-chapter-one.png'),fullPage:true});
  assert(await f.evaluate(()=>{const d=document.getElementById('studentAdventureDialog');return d.scrollWidth<=d.clientWidth+1}));
  await f.locator('#studentAdventureDialog [data-sa=close]').click();await f.locator('.sa-profile-memento').click();assert(await f.locator('.sa-memento-earned').isVisible());assert.deepEqual(errors,[]);
  console.log('PASS: Lv10 boundary, missing stamp checklist, saved progress unlock, promise choice, failed save retention, cosmetic reward, unchanged economy, hide/show/reload, retained earned badge below Lv10, mobile layout');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
