const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');const {server,shots}=require('./student-fixture.cjs');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+server.address().port);const f=page.frames().find(f=>f.url().includes('app-core.html'));await f.waitForFunction(()=>window.studentCampus);await f.evaluate(()=>enterHubScene('classroom'));await f.locator('.campus-scene-status').waitFor({state:'hidden'});
  const readable=async()=>{
   assert(await f.locator('.campus-object-caption').evaluateAll(labels=>labels.every(el=>{
    const a=el.querySelector('b').getBoundingClientRect(),b=el.querySelector('small').getBoundingClientRect(),c=el.getBoundingClientRect();
    return a.height>10&&b.height>10&&a.bottom<=b.top+1&&b.bottom<=c.bottom&&c.height>=40;
   })),'Each name and action must occupy its own readable line');
   assert(await f.locator('#classroomHub').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  };
  await readable();
  // The furniture itself, below the floating name, must open the real wardrobe.
  const wardrobe=f.locator('[data-place=inventory]');const w=await wardrobe.boundingBox();await page.mouse.click(w.x+w.width/2,w.y+w.height*.7);
  await f.locator('#inventoryModal').waitFor();await f.waitForFunction(()=>document.getElementById('inventoryModal').getAttribute('aria-busy')==='false');await page.keyboard.press('Escape');
  // Native keyboard activation works on the new object buttons too.
  await f.locator('[data-place=hallway]').focus();await page.keyboard.press('Enter');assert.equal(await f.locator('[data-place=library]').count(),1);
  await f.locator('[data-place=library]').focus();await page.keyboard.press('Enter');await f.locator('.campus-scene-status').waitFor({state:'hidden'});await readable();
  await f.locator('.campus-tori').click();assert(await f.locator('#campusGuide').isVisible());await page.keyboard.press('Escape');
  fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,'desktop-library-objects.png'),fullPage:true});
  await f.evaluate(()=>enterHubScene('classroom'));await f.locator('.campus-scene-status').waitFor({state:'hidden'});await page.screenshot({path:path.join(shots,'desktop-classroom-objects.png'),fullPage:true});
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});await f.evaluate(()=>enterHubScene('classroom'));await readable();
   assert(await f.evaluate(()=>{
    const name=document.querySelector('.campus-player-name').getBoundingClientRect();return [...document.querySelectorAll('.campus-object-caption')].every(el=>{const r=el.getBoundingClientRect();return name.right<=r.left||name.left>=r.right||name.bottom<=r.top||name.top>=r.bottom});
   }),'Avatar name must not obscure an action label');
   await page.screenshot({path:path.join(shots,`mobile-${width}-classroom-objects.png`),fullPage:true});
   await f.locator('[data-campus=find]').click();await f.locator('[data-finder-place=inventory]').click();await f.waitForFunction(()=>Math.abs(parseFloat(document.getElementById('hubPlayer').style.left)-24)<.06);await f.waitForFunction(()=>document.querySelector('[data-campus=use]').dataset.state==='arrived');
   assert(await f.locator('[data-place=inventory]').evaluate(el=>el.classList.contains('is-near')));assert.match(await f.locator('[data-place=inventory] .campus-object-action').textContent(),/✓/);
   await f.evaluate(()=>enterHubScene('library'));await f.locator('.campus-scene-status').waitFor({state:'hidden'});await readable();
  }
  assert.deepEqual(await f.evaluate(()=>[mockRpg.student.xp,mockRpg.student.gold]),[260,180]);assert.deepEqual(errors,[]);
  console.log('PASS: furniture body opens wardrobe, keyboard room links, readable NPC/object captions, avatar-name separation, 1440/390/320px views, nearby feedback, unchanged economy.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
