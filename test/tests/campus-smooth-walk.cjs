const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright'),{server,shots}=require('./student-fixture.cjs');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768},hasTouch:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());await page.goto('http://127.0.0.1:'+server.address().port);
  const f=page.frames().find(x=>x.url().includes('app-core.html'));await f.waitForFunction(()=>window.studentCampus?.keyDown&&document.getElementById('saProfileTitle')?.textContent.includes('별나래'));
  await f.waitForFunction(()=>document.__busyGuard);await f.evaluate(()=>document.fonts.ready);
  const enter=async room=>{await f.evaluate(room=>{enterHubScene(room==='library'?'hallway':'library');enterHubScene(room)},room);await f.locator('.campus-scene-status').waitFor({state:'hidden'});await f.waitForFunction(()=>document.querySelector('.hub-stage').getAnimations().every(a=>a.playState!=='running'));await f.locator('#campusTitle').focus()};
  const pos=()=>f.locator('#hubPlayer').evaluate(el=>parseFloat(el.style.left));
  const frozen=async()=>{const x=await pos();await page.waitForTimeout(170);assert.equal(await pos(),x,'Released/canceled movement must not drift')};
  // Sample actual rendered coordinates and actual frame time. OS repeat rate must not matter.
  const startSamples=()=>f.evaluate(()=>{window.walkSamples=[];window.samplingWalk=true;const stage=document.querySelector('.hub-stage'),player=document.getElementById('hubPlayer');function sample(t){const a=player.getBoundingClientRect(),b=stage.getBoundingClientRect();walkSamples.push({t,x:(a.left+a.width/2)-b.left,screen:a.left+a.width/2,camera:b.left});if(samplingWalk)requestAnimationFrame(sample)}requestAnimationFrame(sample)});
  const speeds=async()=>f.evaluate(()=>{samplingWalk=false;const start=walkSamples[0].t,result=[];for(let i=0;i<3;i++){const a=walkSamples.find(p=>p.t>=start+60+i*250),b=walkSamples.find(p=>p.t>=start+260+i*250);if(a&&b)result.push(Math.abs(b.x-a.x)/(b.t-a.t)*1000)}return result});
  const repeat=()=>f.evaluate(()=>{for(let i=0;i<50;i++)document.getElementById('campusTitle').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',code:'ArrowRight',repeat:true,bubbles:true}))});
  for(const width of [1366,390,320]){
   await page.setViewportSize({width,height:width===1366?768:width===390?844:640});
   for(const room of ['classroom','garden']){
    await enter(room);const before=await pos();await page.keyboard.down('ArrowRight');await startSamples();await page.waitForTimeout(120);assert(await pos()>before,'First press must start before OS auto-repeat');
    await repeat();await page.waitForTimeout(320);await repeat();await page.waitForTimeout(500);await page.keyboard.up('ArrowRight');const rates=await speeds();assert.equal(rates.length,3);for(const rate of rates)assert(rate>87&&rate<113,'Constant 100px/s despite repeats, room width and screen size: '+rate);await frozen();
    assert.equal(await f.locator('.hub-stage').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');assert.equal(await f.locator('#hubPlayer').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
    assert(await f.locator('#classroomHub').evaluate(el=>el.scrollWidth<=el.clientWidth+1));assert(await f.locator('[data-campus=use]').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight+1));
    fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,'smooth-'+room+'-'+width+'.png'),fullPage:true});
   }
  }
  // Opposite direction takes over immediately; releasing it resumes the still-held key.
  await enter('hallway');await page.keyboard.down('ArrowLeft');await page.waitForTimeout(150);const left=await pos();await page.keyboard.down('ArrowRight');await page.waitForTimeout(180);assert(await pos()>left);await page.keyboard.up('ArrowRight');const right=await pos();await page.waitForTimeout(180);assert(await pos()<right);await page.keyboard.up('ArrowLeft');await frozen();
  // Two aliases for one direction do not double speed or prematurely stop each other.
  await page.keyboard.down('a');await page.keyboard.down('ArrowLeft');await page.keyboard.up('a');const alias=await pos();await page.waitForTimeout(140);assert(await pos()<alias);await page.keyboard.up('ArrowLeft');await frozen();
  // Native press/release touch input uses the same clock, not a repeated-click timer.
  const cdp=await page.context().newCDPSession(page);
  for(const width of [390,320]){
   await page.setViewportSize({width,height:width===390?844:640});await enter('classroom');const box=await f.locator('[data-move="-1,0"]').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:4}]});await startSamples();await page.waitForTimeout(940);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});for(const rate of await speeds())assert(rate>87&&rate<113,'Touch speed '+rate);await frozen();
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:4}]});await page.waitForTimeout(80);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await frozen();
  }
  // Blur, hidden-page simulation, account/scene changes and nested dialogs cannot retain held input.
  for(const event of ['blur','pagehide','visibilitychange']){
   await enter('classroom');await page.keyboard.down('ArrowLeft');await page.waitForTimeout(100);await f.evaluate(name=>(name==='visibilitychange'?document:window).dispatchEvent(new Event(name)),event);await frozen();await repeat();await frozen();await page.keyboard.up('ArrowLeft');
  }
  await enter('library');await page.keyboard.down('ArrowRight');await page.waitForTimeout(120);const movingTori=await f.locator('.campus-tori').boundingBox();await page.mouse.click(movingTori.x+movingTori.width/2,movingTori.y+movingTori.height/2);await frozen();await page.keyboard.up('ArrowRight');await f.locator('[data-guide=close]').first().click();await frozen();
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(80);await f.evaluate(()=>enterHubScene('hallway'));await frozen();await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(80);await f.evaluate(()=>{mockRpg.student.id=999;document.dispatchEvent(new Event('student-dashboard-updated'))});await frozen();await page.keyboard.up('ArrowRight');
  // Editing keys and modified shortcuts remain local to their controls.
  await f.evaluate(()=>openReadingDesk());
  const input=f.locator('#readingPortfolioModal textarea').first();await input.fill('abc');await input.focus();const still=await pos();await page.keyboard.press('ArrowLeft');assert.equal(await pos(),still);await page.keyboard.press('Escape');
  await enter('hallway');const modified=await pos();await page.keyboard.press('Control+ArrowLeft');assert.equal(await pos(),modified);
  // Explicit accessible activation is a smooth small step, still supported without pointer events.
  await f.locator('[data-move="1,0"]').focus();const nudge=await pos();await page.keyboard.press('Enter');await page.waitForTimeout(220);assert(await pos()>nudge);await frozen();
  // Boundaries stop the loop and walking pose; releasing and reversing works immediately.
  await f.evaluate(()=>{for(let i=0;i<35;i++)moveHub(-1,0)});await page.keyboard.down('ArrowLeft');await page.waitForTimeout(120);assert.equal(await pos(),4);assert(!await f.locator('#hubPlayer').evaluate(el=>el.classList.contains('walking')));await page.keyboard.up('ArrowLeft');await page.keyboard.down('ArrowRight');await page.waitForTimeout(120);assert(await pos()>4);await page.keyboard.up('ArrowRight');
  // Low-powered-device emulation: measured speed remains steady; storage stays debounced.
  await enter('hallway');await page.emulateMedia({reducedMotion:'reduce'});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await page.keyboard.down('ArrowRight');await startSamples();await page.waitForTimeout(940);await page.keyboard.up('ArrowRight');for(const rate of await speeds())assert(rate>80&&rate<117,'Throttled speed '+rate);await frozen();assert.equal(await f.locator('.campus-upper').evaluate(el=>getComputedStyle(el).animationName),'none');await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  assert.deepEqual(await f.evaluate(()=>[mockRpg.student.xp,mockRpg.student.gold]),[260,180]);assert.deepEqual(errors,[]);
  console.log('PASS: immediate constant 100px/s keyboard and native touch holds, repeat bursts, 1366/390/320 rooms/panoramas, reversal/aliases, release/cancel/blur/pagehide/account/dialog safety, typing/shortcuts, accessible step, boundaries, 4x CPU/reduced motion and unchanged economy');
 }finally{await browser.close();server.closeAllConnections();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
