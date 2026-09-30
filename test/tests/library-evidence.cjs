const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');const {server,shots}=require('./student-fixture.cjs');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 fs.mkdirSync(shots,{recursive:true});const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());
  async function ready(){const f=page.frames().find(f=>f.url().includes('app-core.html'));await f.waitForFunction(()=>document.getElementById('saProfileTitle')?.textContent.includes('별나래'));return f}
  await page.goto(base);let f=await ready();
  await f.evaluate(async()=>{mockRpg.student.xp=829;await loadDashboard()});assert.match(await f.locator('#saNextGoal').textContent(),/Lv. 11[\s\S]*도서관[\s\S]*1 경험치/);
  await f.locator('.sa-hero [data-sa=map]').click();await f.locator('[data-workshop=library-evidence]').click();assert.match(await f.locator('#saDialogBody').textContent(),/1 경험치/);assert.equal(await f.locator('[data-sa=check-evidence]').count(),0);
  await f.locator('#studentAdventureDialog [data-sa=close]').click();await f.evaluate(async()=>{mockRpg.student.xp=830;await loadDashboard()});await f.locator('.sa-hero [data-sa=map]').click();await f.locator('[data-workshop=library-evidence]').click();
  assert.match(await f.locator('#saEvidenceTitle').textContent(),/민지/);await f.locator('[data-sa=check-evidence]').click();assert.match(await f.locator('#saEvidenceFeedback').textContent(),/하나를 골라/);
  await f.locator('[data-evidence-claim="0"]').click();await f.locator('[data-evidence-line="1"]').click();await f.locator('[data-sa=check-evidence]').click();assert.match(await f.locator('#saEvidenceFeedback').textContent(),/날씨/);assert.equal(await f.evaluate(()=>mockRpg.exploration.length),0);
  await f.locator('[data-evidence-claim="1"]').click();await f.locator('[data-evidence-line="2"]').click();await f.locator('[data-sa=check-evidence]').click();assert.match(await f.locator('#saEvidenceFeedback').textContent(),/문장을 찾아/);
  await f.locator('[data-evidence-line="1"]').click();await f.evaluate(()=>mockRpg.failEvidence=true);await f.locator('[data-sa=check-evidence]').click();assert.match(await f.locator('#saEvidenceFeedback').textContent(),/아직 저장하지 못/);assert.equal(await f.locator('[data-evidence-line="1"]').getAttribute('aria-pressed'),'true');assert.equal(await f.locator('[data-evidence-claim="1"]').getAttribute('aria-pressed'),'true');
  await f.evaluate(()=>mockRpg.failEvidence=false);await f.locator('[data-sa=check-evidence]').click();assert.equal(await f.evaluate(()=>mockRpg.exploration.length),1);assert(await f.locator('[data-sa=check-evidence]').isDisabled());await f.locator('[data-sa=next-evidence]').click();
  assert.match(await f.locator('#saEvidenceTitle').textContent(),/책 추천/);await page.screenshot({path:path.join(shots,'desktop-library-evidence.png'),fullPage:true});
  await page.reload();f=await ready();await f.locator('.sa-hero [data-sa=map]').click();assert.match(await f.locator('[data-workshop=library-evidence]').textContent(),/1 \/ 3 완료/);await f.locator('[data-workshop=library-evidence]').click();assert.match(await f.locator('#saEvidenceTitle').textContent(),/책 추천/);
  await page.setViewportSize({width:390,height:844});await f.locator('#studentAdventureDialog').evaluate(el=>el.scrollTop=0);await page.screenshot({path:path.join(shots,'mobile-library-evidence.png'),fullPage:true});
  assert(await f.evaluate(()=>{const d=document.getElementById('studentAdventureDialog');return d.scrollWidth<=d.clientWidth+1}));
  await f.locator('[data-evidence-claim="0"]').click();await f.locator('[data-evidence-line="2"]').click();await f.locator('[data-sa=check-evidence]').click();await f.locator('[data-sa=next-evidence]').click();
  await f.locator('[data-evidence-claim="2"]').click();await f.locator('[data-evidence-line="0"]').click();await f.locator('[data-sa=check-evidence]').click();await f.locator('[data-sa=next-evidence]').click();
  assert(await f.locator('.sa-library-finish').isVisible());assert.equal(await f.locator('[data-evidence-replay]').count(),3);assert.equal(await f.evaluate(()=>mockRpg.exploration.length),3);assert.deepEqual(await f.evaluate(()=>({xp:mockRpg.student.xp,gold:mockRpg.student.gold})),{xp:260,gold:180});
  await page.screenshot({path:path.join(shots,'mobile-library-bookmark.png'),fullPage:true});
  await f.locator('[data-evidence-replay="0"]').click();await f.locator('[data-evidence-claim="1"]').click();await f.locator('[data-evidence-line="1"]').click();await f.locator('[data-sa=check-evidence]').click();assert.equal(await f.evaluate(()=>mockRpg.exploration.length),3);
  await f.locator('#studentAdventureDialog [data-sa=map]').click();assert.match(await f.locator('.sa-passport').textContent(),/0 \/ 7/);await f.locator('[data-workshop=library-evidence]').click();await f.locator('#studentAdventureDialog [data-sa=reading]').click();assert(await f.locator('#readingPortfolioModal').isVisible());
  assert.deepEqual(errors,[]);console.log('PASS: Lv11 goal and boundary, claim/evidence hints, failed-save choice retention, persisted sequential resume, bookmark/replay, preserved unlock after XP correction, no extra location stamps or XP/gold, reading link, mobile layout');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
