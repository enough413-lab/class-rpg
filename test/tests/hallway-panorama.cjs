const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),sharp=require('sharp');
const {chromium}=require('playwright'),{server,shots}=require('./student-fixture.cjs');
(async()=>{
 const assets=JSON.parse(fs.readFileSync(path.join(__dirname,'../maps/hallway-panorama-art.json'),'utf8')).assets;
 for(const a of assets){const file=path.join(__dirname,'..',a.game),m=await sharp(file).metadata();assert(fs.statSync(file).size<(a.key==='panorama'?400000:80000));if(a.key==='panorama'){assert(m.width>=2000&&Math.abs(m.width/m.height-3)<.005);assert(!m.hasAlpha)}else{assert(m.hasAlpha);const s=await sharp(file).stats();assert(s.channels[3].min===0&&s.channels[3].max>240,'True alpha silhouette');assert(m.width<=600&&m.height<=600)}}
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1366,height:768},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());const base='http://127.0.0.1:'+server.address().port;await page.goto(base);let f;
 const ready=async()=>{f=page.frames().find(x=>x.url().includes('app-core.html'));await f.waitForFunction(()=>window.studentCampus);await f.evaluate(()=>document.fonts.ready)};await ready();fs.mkdirSync(shots,{recursive:true});
 const enter=async()=>{await f.evaluate(()=>{enterHubScene('classroom');enterHubScene('hallway')});await f.locator('.campus-scene-status').waitFor({state:'hidden'})};
 const go=async kind=>{await f.locator('[data-campus=find]').tap();await f.locator('[data-finder-place='+kind+']').tap();await f.locator('.campus-waypoint[data-state=arrived]').waitFor()};
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const [width,height]of [[1366,768],[390,844],[320,640]]){
  await page.setViewportSize({width,height});await enter();const dims=await f.locator('.hub-stage').evaluate(e=>({width:e.clientWidth,height:e.clientHeight,view:e.parentElement.clientWidth}));assert.equal(dims.width/dims.height,3);assert(dims.width-dims.view>500);
  const views=[];for(const kind of ['classroom','notice','library']){
   await go(kind);await f.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const g=await f.evaluate(kind=>{const r=e=>e.getBoundingClientRect().toJSON(),obj=document.querySelector('[data-place='+kind+']');return{stage:r(document.querySelector('.hub-stage')),obj:r(obj),label:r(obj.querySelector('.campus-object-caption')),player:r(document.getElementById('hubPlayer')),view:r(document.querySelector('.campus-viewport')),tracker:r(document.querySelector('.parcel-tracker')),name:r(document.querySelector('.campus-player-name'))}},kind);
   views.push(g.stage.left);assert(g.obj.width>=44&&g.obj.height>=44);assert(g.label.left>=g.view.left-1&&g.label.right<=g.view.right+1,'Visible label');assert(g.label.bottom<g.player.top-2||g.label.left>=g.player.right||g.label.right<=g.player.left,'Sign clears avatar');if(kind==='notice')assert(g.player.right<g.obj.left||g.player.left>g.obj.right,'Player stands beside the visible clue drawing');
   assert(g.label.top>=g.tracker.bottom||g.label.right<=g.tracker.left||g.label.left>=g.tracker.right,'Tracker must not cover door/clue labels');assert(g.name.top>g.player.bottom);
   assert(Math.abs(g.obj.bottom-(g.stage.top+g.stage.height*.8))<1,'Object baseline');await page.screenshot({path:path.join(shots,'hallway-'+kind+'-'+width+'.png'),fullPage:true});
   if(kind==='notice'){await f.locator('[data-campus=use]').tap();assert(await f.locator('#parcelAdventureDialog').isVisible());await page.keyboard.press('Escape')}
  }
  assert(views[0]-views[2]>500,'Walking reveals continuous additional scenery');assert(await f.locator('#classroomHub').evaluate(e=>e.scrollWidth<=e.clientWidth+1));assert(await f.locator('[data-campus=use]').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight+1));
  // Existing doors retain physical two-way passage, keyboard/touch and inward arrivals.
  for(const [kind,expected]of [['classroom',88],['library',12]]){await go(kind);await f.locator('[data-campus=use]').tap();await f.waitForFunction(k=>document.getElementById('classroomHub').dataset.scene===k,kind);assert.equal(await f.locator('#hubPlayer').evaluate(e=>parseFloat(e.style.left)),expected);await go('hallway');await page.keyboard.press('e');await f.waitForFunction(()=>document.getElementById('classroomHub').dataset.scene==='hallway');assert.equal(await f.locator('#hubPlayer').evaluate(e=>parseFloat(e.style.left)),kind==='classroom'?14:84)}
 }
 // Panorama retry and missing independent art still allow the existing route.
 await page.route('**/maps/hallway-panorama-v1.webp',r=>r.abort());await page.reload();await ready();await f.evaluate(()=>enterHubScene('hallway'));await f.locator('.campus-scene-status button').waitFor();await page.unroute('**/maps/hallway-panorama-v1.webp');await f.locator('.campus-scene-status button').tap();await f.locator('.campus-scene-status').waitFor({state:'hidden'});
 await page.route('**/maps/props/hallway-library-door-v1.webp',r=>r.abort());await page.reload();await ready();await enter();await f.locator('[data-place=library].art-missing').waitFor();await go('library');await f.locator('[data-campus=use]').tap();assert.equal(await f.locator('#classroomHub').getAttribute('data-scene'),'library');await page.unroute('**/maps/props/hallway-library-door-v1.webp');await enter();assert(!await f.locator('[data-place=library]').evaluate(e=>e.classList.contains('art-missing')));
 assert.deepEqual(await f.evaluate(()=>[mockRpg.student.xp,mockRpg.student.gold]),[260,180]);assert.deepEqual(errors,[]);console.log('PASS: original panorama/alpha assets and budgets, camera reveal, independent door/clue sprites, 1366/390/320 labels/ground/HUD, native touch and keyboard two-way routes, unchanged parcel entry/economy, background retry and missing-door recovery.');
 }finally{await browser.close();server.closeAllConnections();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
