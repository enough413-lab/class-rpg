const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright'),{server,shots}=require('./student-fixture.cjs');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768},hasTouch:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());await page.goto('http://127.0.0.1:'+server.address().port);
  let f=page.frames().find(x=>x.url().includes('app-core'));await f.waitForFunction(()=>window.studentCampus);fs.mkdirSync(shots,{recursive:true});
  const ready=async room=>{await f.evaluate(room=>enterHubScene(room),room);await f.locator('.campus-scene-status').waitFor({state:'hidden'});await f.waitForFunction(()=>[...document.querySelectorAll('.campus-painted-prop img')].every(e=>e.complete&&e.naturalWidth))};
  const go=async()=>{await page.emulateMedia({reducedMotion:'reduce'});await f.locator('[data-campus=find]').tap();await f.locator('[data-finder-place=look-1]').tap();await f.locator('.campus-waypoint[data-state=arrived]').waitFor();await f.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))};
  const animations=()=>f.locator('.campus-nature-effect').evaluate(e=>e.getAnimations({subtree:true}).map(a=>({state:a.playState,iterations:a.effect.getTiming().iterations,duration:a.effect.getTiming().duration})));
  for(const [width,height]of[[1366,768],[390,844],[320,640]]){
   await page.setViewportSize({width,height});
   for(const room of ['garden','pond']){
    await ready(room);await go();const target=f.locator('[data-place=look-1]'),effect=target.locator('.campus-nature-effect');
    assert.equal(await f.locator('.campus-nature-effect').count(),1);assert.equal(await effect.getAttribute('aria-hidden'),'true');assert.equal(await effect.evaluate(e=>getComputedStyle(e).pointerEvents),'none');
    assert.equal(await effect.evaluate(e=>getComputedStyle(e).display),'none','Reduced motion keeps static existing proximity/focus cues');assert.deepEqual(await animations(),[]);
    const player=await f.locator('#hubPlayer').boundingBox(),prop=await target.boundingBox();assert(player.x+player.width<=prop.x-8||prop.x+prop.width<=player.x-8,'Avatar stands beside the painted prop');
    const before=await target.boundingBox(),label=await target.locator('.campus-object-caption').boundingBox();assert(before.width>=44&&before.height>=44);assert(label.x>=0&&label.x+label.width<=width+1,JSON.stringify({room,width,label,prop,player}));
    await page.emulateMedia({reducedMotion:'no-preference'});await f.waitForFunction(()=>document.querySelector('.campus-nature-effect').getAnimations({subtree:true}).some(a=>a.playState==='running'));
    const a=await animations();assert.equal(a.length,room==='garden'?3:2);assert(a.every(a=>a.iterations===1&&a.duration<=2400));
    // Freeze the actual production animation midway to inspect the decorative layer.
    await effect.evaluate(e=>e.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=850}));
    assert.deepEqual(await target.boundingBox(),before,'Effect must not move the target');assert.deepEqual(await target.locator('.campus-object-caption').boundingBox(),label,'Effect must not move its label');
    assert(await effect.evaluate(e=>[...e.children].some(e=>Number(getComputedStyle(e).opacity)>.1)));
    await page.screenshot({path:path.join(shots,'nature-light-'+room+'-'+width+'.png'),fullPage:true});
    await effect.evaluate(e=>e.getAnimations({subtree:true}).forEach(a=>a.play()));
    await f.waitForFunction(()=>document.querySelector('.campus-nature-effect').getAnimations({subtree:true}).every(a=>a.playState==='finished'));
    assert(await effect.evaluate(e=>[...e.children].every(e=>getComputedStyle(e).opacity==='0')),'No lingering glow or continuous idle animation');
    await f.evaluate(()=>{moveHub(1,0);moveHub(-1,0)});assert((await animations()).every(a=>a.state==='finished'),'Movement within proximity does not restart the effect');
    await target.focus();await page.keyboard.press('Enter');if(room==='garden'){await f.locator('.garden-watered').waitFor();assert(!await f.locator('#campusGuide').isVisible())}else{assert(await f.locator('#campusGuide').isVisible());await page.keyboard.press('Escape')}
    await f.locator('[data-campus=use]').tap();if(room==='garden'){assert(await f.locator('.garden-watered').isVisible())}else{assert(await f.locator('#campusGuide').isVisible());await page.keyboard.press('Escape')}
    assert(await f.locator('[data-campus=use]').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight+1));assert(await f.locator('#classroomHub').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
    await f.evaluate(()=>{document.activeElement.blur();for(let i=0;i<30;i++)moveHub(1,0)});await go();
    const rightPlayer=await f.locator('#hubPlayer').boundingBox(),rightProp=await target.boundingBox(),view=await f.locator('.campus-viewport').boundingBox();
    assert(rightPlayer.x>=rightProp.x+rightProp.width+8,'Approaching from the right also stands beside the prop');
    assert(rightProp.x>=view.x-1&&rightPlayer.x+rightPlayer.width<=view.x+view.width+1,'Narrow camera shows both full silhouettes');
    assert.equal(await f.locator('#hubPlayer').getAttribute('data-facing'),'left');
   }
  }
  // Native key movement into range starts the one-shot feedback, even at 4x CPU.
  await page.setViewportSize({width:1366,height:768});await ready('garden');await go();await page.emulateMedia({reducedMotion:'no-preference'});
  await f.evaluate(()=>{document.activeElement.blur();for(let i=0;i<4;i++)moveHub(-1,0)});
  assert(!await f.locator('[data-place=look-1]').evaluate(e=>e.classList.contains('is-near')));
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.keyboard.down('ArrowRight');try{await f.waitForFunction(()=>document.querySelector('[data-place=look-1]').classList.contains('is-near'),null,{timeout:5000})}finally{await page.keyboard.up('ArrowRight')}
  assert(await f.locator('[data-place=look-1]').evaluate(e=>e.classList.contains('is-near')));assert((await animations()).some(a=>a.state==='running'));
  await f.waitForFunction(()=>document.querySelector('.campus-nature-effect').getAnimations({subtree:true}).every(a=>a.playState==='finished'));await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  // Keyboard focus can discover the same detail without moving the character.
  await f.evaluate(()=>{document.activeElement.blur();for(let i=0;i<5;i++)moveHub(-1,0)});await f.locator('[data-place=look-1]').focus();assert((await animations()).some(a=>a.state==='running'));
  await f.evaluate(()=>closeClassroomHub());assert.deepEqual(await animations(),[],'Closing the world stops decoration');
  await page.reload();f=page.frames().find(x=>x.url().includes('app-core'));await f.waitForFunction(()=>window.studentCampus);await ready('pond');assert.equal(await f.locator('.campus-nature-effect').count(),1,'Reconnect does not duplicate layers');
  await f.evaluate(async()=>{mockRpg.student.id=988;await loadDashboard()});await ready('garden');assert.equal(await f.locator('.campus-nature-effect').count(),1,'Account changes recreate only the current scene');
  // Missing art suppresses unattached glints but retains a working named action.
  await page.route('**/maps/props/pond-viewer-v1.webp',r=>r.abort());await page.reload();f=page.frames().find(x=>x.url().includes('app-core'));await f.waitForFunction(()=>window.studentCampus);await f.evaluate(()=>enterHubScene('pond'));await f.locator('[data-place=look-1].art-missing').waitFor();await go();assert.equal(await f.locator('.campus-nature-effect').evaluate(e=>getComputedStyle(e).display),'none');
  await f.locator('[data-campus=use]').tap();assert(await f.locator('#campusGuide').isVisible());await page.keyboard.press('Escape');await page.unroute('**/maps/props/pond-viewer-v1.webp');await ready('garden');await ready('pond');assert(!await f.locator('[data-place=look-1]').evaluate(e=>e.classList.contains('art-missing')));
  assert.deepEqual(await f.evaluate(()=>[mockRpg.student.xp,mockRpg.student.gold]),[260,180]);assert.deepEqual(errors,[]);
  console.log('PASS: bounded garden/pond light, no idle replay or geometry change, motion preference, native touch/keyboard, 1366/390/320, 4x CPU, reconnect/accounts, art recovery and unchanged economy.');
 }finally{await browser.close();server.closeAllConnections();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
