const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
const {server,shots}=require('./student-fixture.cjs');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 fs.mkdirSync(shots,{recursive:true});const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**',r=>r.abort());
  async function ready(){const f=page.frames().find(f=>f.url().includes('app-core.html'));await f.waitForFunction(()=>document.querySelector('#saProfileTitle')?.textContent.includes('별나래'));await page.waitForTimeout(700);return f}
  await page.goto(base);let f=await ready();
  async function open(){await f.evaluate(()=>openReadingPortfolio());await f.locator('#readingSubmit').waitFor()}
  await open();assert.equal(await f.locator('[data-reading-retry]').count(),1);
  await f.locator('#readingBookTitle').fill('내가 쓰던 책');await f.locator('#readingSummary').fill('첫 장에서 친구를 만났어요.');
  await f.locator('#readingThought').fill('함께하면 용기가 나요.');await f.locator('#readingRecommendation').fill('친구를 사귀고 싶은 사람에게 추천해요.');
  await f.locator('#readingRating').selectOption('4');
  await f.evaluate(()=>closeReadingPortfolio());await open();assert.equal(await f.locator('#readingBookTitle').inputValue(),'내가 쓰던 책');
  await page.reload();f=await ready();await open();assert.equal(await f.locator('#readingThought').inputValue(),'함께하면 용기가 나요.');
  assert.equal(await f.locator('#readingRating').inputValue(),'4');
  // Retry drafts and new drafts remain separate, including across reload.
  await f.locator('[data-reading-retry="47"]').click();assert.match(await f.locator('#readingTeacherNote').textContent(),/한 가지 더/);
  await f.locator('#readingThought').fill('구름이 먼저 손을 내밀었어요.');
  await f.locator('#readingNew').click();assert.equal(await f.locator('#readingBookTitle').inputValue(),'내가 쓰던 책');
  await f.locator('[data-reading-retry="47"]').click();
  await page.reload();f=await ready();await open();assert.equal(await f.locator('#readingThought').inputValue(),'구름이 먼저 손을 내밀었어요.');
  await page.screenshot({path:path.join(shots,'desktop-reading.png'),fullPage:true});
  // A committed retry with a lost response survives reload and cannot become a new submission.
  await f.evaluate(()=>{mockRpg.dropActionReply=true;saveReadingEntry();saveReadingEntry()});
  await f.waitForFunction(()=>document.querySelector('#readingSubmit').textContent==='제출 결과 확인하기');
  assert.equal(await f.evaluate(()=>mockRpg.actionCalls.length),1);assert.equal(await f.evaluate(()=>mockRpg.reviews.length),2);
  const retryId=await f.evaluate(()=>mockRpg.actionCalls[0].p_request_id);
  await page.reload();f=await ready();await open();assert(await f.locator('#readingBookTitle').isDisabled());
  await f.locator('#readingSubmit').click();await f.waitForFunction(()=>document.querySelector('#readingPortfolioMsg').textContent.includes('선생님께 보냈어요'));
  assert.equal(await f.evaluate(()=>mockRpg.actionCalls[0].p_request_id),retryId);
  assert.equal(await f.evaluate(()=>mockRpg.actionCalls[0].p_action),'reading_retry');assert.equal(await f.evaluate(()=>mockRpg.reviews.length),2);
  assert.equal(await f.locator('#readingBookTitle').inputValue(),'내가 쓰던 책');
  // Successful submission followed by failed history fetch clears only that draft.
  await f.waitForFunction(()=>!document.querySelector('#readingSubmit').disabled);await f.evaluate(()=>mockRpg.failReadingHistory=true);await f.locator('#readingSubmit').click();
  await f.waitForFunction(()=>document.querySelector('#readingPortfolioMsg').textContent.includes('선생님께 보냈어요'));
  await f.waitForFunction(()=>document.querySelector('#readingBookTitle').value==='');assert.equal(await f.locator('#readingBookTitle').inputValue(),'');assert.match(await f.locator('#readingHistory').textContent(),/기록 다시/);
  await f.evaluate(()=>mockRpg.failReadingHistory=false);await f.locator('[data-reading-reload]').click();await f.waitForFunction(()=>document.querySelectorAll('.reading-entry').length===3);
  await f.locator('#readingBookTitle').fill('다음 책');await f.locator('#readingSummary').fill('다음 이야기');await f.locator('#readingThought').fill('내 생각');await f.locator('#readingRecommendation').fill('재미있어서');
  await f.evaluate(()=>mockRpg.actionError=true);await f.locator('#readingSubmit').click();await f.waitForFunction(()=>document.querySelector('#readingPortfolioMsg').textContent.includes('3편'));
  assert.equal(await f.locator('#readingBookTitle').inputValue(),'다음 책');assert(!(await f.locator('#readingBookTitle').isDisabled()));
  // A different student must not see this device's prior student's draft or retry context.
  await f.evaluate(()=>{closeReadingPortfolio();mockRpg.student.id=988});await open();assert.equal(await f.locator('#readingBookTitle').inputValue(),'');
  await f.evaluate(()=>{closeReadingPortfolio();mockRpg.student.id=987;mockRpg.actionError=false});await open();assert.equal(await f.locator('#readingBookTitle').inputValue(),'다음 책');
  await page.setViewportSize({width:390,height:844});await f.locator('#readingPortfolioModal .inventory-modal').evaluate(el=>el.scrollTop=0);assert(await f.locator('.sa-mobile-nav').isHidden());
  await page.screenshot({path:path.join(shots,'mobile-reading.png'),fullPage:true});
  assert(await f.evaluate(()=>document.getElementById('readingPortfolioModal').querySelector('section').scrollWidth<=document.getElementById('readingPortfolioModal').querySelector('section').clientWidth+1));
  await f.locator('#readingBookTitle').press('Escape');assert(await f.locator('#readingPortfolioModal').isHidden());
  await f.evaluate(async()=>{await openShop();chooseShopCategory('misc')});await f.locator('#shopGrid button').click();
  assert.match(await f.locator('#purchaseBalance').textContent(),/40 골드/);assert.match(await f.locator('#purchaseBalance').textContent(),/140 골드/);
  assert.equal(await f.evaluate(()=>document.activeElement.id),'purchaseCancel');
  await page.screenshot({path:path.join(shots,'mobile-purchase.png'),fullPage:true});
  await f.locator('#purchaseCancel').click();assert.equal(await f.evaluate(()=>mockRpg.purchases),0);
  await f.locator('#shopGrid button').click();
  await f.evaluate(()=>mockRpg.dropActionReply=true);await f.locator('#purchaseConfirm').click();
  assert(await f.locator('#purchaseConfirm').isDisabled());await f.waitForFunction(()=>!document.getElementById('shopRecovery').hidden);
  assert.equal(await f.evaluate(()=>mockRpg.purchases),1);assert.equal(await f.evaluate(()=>mockRpg.student.gold),140);
  const buyId=await f.evaluate(()=>mockRpg.actionCalls.at(-1).p_request_id);
  await page.reload();f=await ready();await f.evaluate(async()=>{await openShop();chooseShopCategory('misc')});
  assert(await f.locator('#shopRecover').isVisible());await f.locator('#shopRecover').click();await f.waitForFunction(()=>document.getElementById('shopMsg').textContent.includes('교환 요청을 보냈어요'));
  assert.equal(await f.evaluate(()=>mockRpg.purchases),1);assert.equal(await f.evaluate(()=>mockRpg.student.gold),140);assert.equal(await f.evaluate(()=>mockRpg.actionCalls[0].p_request_id),buyId);
  assert(await f.locator('#shopGrid button').isDisabled());assert(await f.locator('#shopRecovery').isHidden());
  assert.deepEqual(errors,[]);console.log('PASS: draft reopen/reload/account isolation, separate rejected revision, teacher feedback, double submit, lost receipt recovery, history failure, validation recovery, mobile layout, shop cancel/confirmation/one charge after reload');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
