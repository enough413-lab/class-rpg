const assert=require('node:assert/strict');const {chromium}=require('playwright');const {server}=require('./student-fixture.cjs');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());await page.goto(base);
  const f=page.frames().find(f=>f.url().includes('app-core.html'));await f.waitForFunction(()=>window.studentCampus);
  // Parent timers from the first load run while the replacement frame is still in its head.
  await page.route('**/test-environment.js',async r=>{await new Promise(resolve=>setTimeout(resolve,1400));await r.continue()});
  await f.goto(base+'/app-core.html?cold-reload');await f.waitForFunction(()=>window.studentCampus);await f.waitForFunction(()=>document.__studentEnhancementsFast&&document.__levelObserver);
  assert.deepEqual(errors,[]);await f.evaluate(()=>openClassroomHub());assert(await f.locator('.campus-side').isVisible());
  console.log('PASS: delayed head and iframe replacement do not observe a missing body; helpers recover on loaded document; walking entry remains available');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
