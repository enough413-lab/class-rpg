const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),sharp=require('sharp');
const {chromium}=require('playwright'),{server,shots}=require('./student-fixture.cjs');
(async()=>{
 const art=JSON.parse(fs.readFileSync(path.join(__dirname,'../maps/classroom-graphics-art.json'),'utf8')),file=path.join(__dirname,'..',art.game),m=await sharp(file).metadata();
 assert.equal(m.width/m.height,3);assert(m.width>=2000&&!m.hasAlpha);assert(fs.statSync(file).size<400000);assert(art.finalSource&&art.generationPrompt&&art.tool.includes('built-in'));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1366,height:768},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());const base='http://127.0.0.1:'+server.address().port;await page.goto(base);let f;
 const ready=async()=>{f=page.frames().find(x=>x.url().includes('app-core.html'));await f.waitForFunction(()=>window.studentCampus);await f.evaluate(()=>document.fonts.ready)};await ready();await page.emulateMedia({reducedMotion:'reduce'});fs.mkdirSync(shots,{recursive:true});
 const settle=()=>f.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const enter=async()=>{await f.evaluate(()=>{enterHubScene('hallway');enterHubScene('classroom')});await f.locator('.campus-scene-status').waitFor({state:'hidden'})};
 const go=async kind=>{await f.locator('[data-campus=find]').tap();await f.locator('[data-finder-place='+kind+']').tap();await f.locator('.campus-waypoint[data-state=arrived]').waitFor();await settle()};
 const open=async(kind,modal)=>{await go(kind);await f.locator('[data-campus=use]').tap();await f.locator(modal).waitFor();await page.keyboard.press('Escape')};
 const disjoint=(a,b)=>a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom;
 for(const [width,height]of [[1366,768],[390,844],[320,640]]){
  await page.setViewportSize({width,height});await enter();const cameras=[];
  for(const kind of ['titles','inventory','parcel','quests','teacher','shop','hallway']){
   await go(kind);
   if(kind==='hallway')assert.equal(await f.locator('[data-place=hallway] .campus-prop-outline').evaluate(e=>getComputedStyle(e).opacity),'0','Door stays unboxed on arrival');
   const g=await f.evaluate(kind=>{const r=e=>e.getBoundingClientRect().toJSON(),obj=document.querySelector('[data-place='+kind+']');return{stage:r(document.querySelector('.hub-stage')),obj:r(obj),label:r(obj.querySelector('.campus-object-caption')),p:r(document.getElementById('hubPlayer')),name:r(document.querySelector('.campus-player-name')),view:r(document.querySelector('.campus-viewport')),tracker:r(document.querySelector('.parcel-tracker')),near:document.querySelector('[data-place].is-near')?.dataset.place,bodyImage:obj.querySelector('img')?.naturalWidth||getComputedStyle(obj.querySelector('.campus-prop-art')).backgroundImage.includes('classroom-panorama-v1.webp'),walkX:Number(obj.dataset.walkX),center:parseFloat(obj.style.left),sprite:obj.classList.contains('campus-sprite')}},kind);
   assert.equal(g.stage.width/g.stage.height,3);assert(g.stage.width-g.view.width>500);assert(g.bodyImage);if(g.sprite)assert.equal(g.walkX,g.center,'Walking/focus destination matches drawn object '+kind);assert(g.obj.width>=44&&g.obj.height>=44);assert(Math.abs(g.obj.bottom-(g.stage.top+g.stage.height*.8))<1);assert(g.name.top>g.p.bottom);assert.equal(g.near,kind);
   assert(g.label.left>=g.view.left-1&&g.label.right<=g.view.right+1,kind+' label visible '+width);assert(disjoint(g.label,g.tracker),kind+' tracker overlap '+width+' '+JSON.stringify({label:g.label,tracker:g.tracker}));assert(disjoint(g.label,g.name),kind+' name overlap');
   if(kind==='quests'||kind==='shop')assert(disjoint(g.obj,g.p),'Side approach remains clear');
   assert(g.p.width>=99.9&&g.p.width<=128.1);cameras.push(g.stage.left);
   await page.screenshot({path:path.join(shots,'classroom-integrated-'+kind+'-'+width+'.png'),fullPage:true});
  }
  assert(cameras[0]-cameras.at(-1)>500,'Walking exposes different classroom scenery');
  // Foreground destinations still reach their real existing feature.
  await open('inventory','#inventoryModal');await open('titles','#titleCollectionModal');await open('teacher','#completedQuestHistory');await open('parcel','#parcelAdventureDialog');
  for(const kind of ['quests','shop']){await go(kind);await f.locator('#campusTitle').focus();await page.keyboard.press('e');await f.locator('#campusNpcDialog').waitFor();await f.locator('[data-npc-action='+kind+']').tap();await f.locator(kind==='quests'?'#questCenterModal':'#shopModal').waitFor();await page.keyboard.press('Escape')}
  await go('hallway');await f.locator('[data-campus=use]').tap();assert.equal(await f.locator('#classroomHub').getAttribute('data-scene'),'hallway');assert.equal(await f.locator('#hubPlayer').evaluate(e=>parseFloat(e.style.left)),14);await go('classroom');await f.locator('#campusTitle').focus();await page.keyboard.press('e');assert.equal(await f.locator('#classroomHub').getAttribute('data-scene'),'classroom');assert.equal(await f.locator('#hubPlayer').evaluate(e=>parseFloat(e.style.left)),88);
  assert(await f.locator('[data-campus=use]').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight+1));assert(await f.locator('#classroomHub').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
 }
 // Collected-parcel tracker text can wrap differently from the initial low-level hint.
 for(const phase of [1,2,3]){
  await f.evaluate(n=>localStorage.setItem('fixtureExploration',JSON.stringify(['parcel-1','parcel-2','parcel-3'].slice(0,n))),phase);await page.reload();await ready();await enter();
  await f.waitForFunction(n=>(document.querySelector('.parcel-tracker i')?.textContent.match(/●/g)||[]).length===n,phase);
  if(phase===1)assert.match(await f.locator('.parcel-tracker').getAttribute('aria-label'),/복도의 꾸러미 표식 안내판 살펴보기/);
  for(const kind of ['titles','inventory','teacher','hallway']){await go(kind);const boxes=await f.evaluate(k=>[document.querySelector('[data-place='+k+'] .campus-object-caption'),document.querySelector('.parcel-tracker')].map(e=>e.getBoundingClientRect().toJSON()),kind);assert(disjoint(...boxes),kind+' overlaps phase '+phase+' tracker');if(kind==='titles')await page.screenshot({path:path.join(shots,'classroom-tracker-phase-'+phase+'-320.png'),fullPage:true});}
 }
 await f.evaluate(()=>localStorage.setItem('fixtureExploration','[]'));await page.reload();await ready();
 // An earned private garland remains on the chalkboard area and cannot intercept walking.
 await f.evaluate(async()=>{mockRpg.finale={memories:['melody','parcel','letter'],ribbon:'sky',wearing:true,completed_at:'2026-10-01T00:00:00Z'};localStorage.setItem('fixtureFinale',JSON.stringify(mockRpg.finale));await studentAdventure.workshop('school-finale')});await f.locator('[data-final=close]').first().tap();await enter();await go('quests');await f.locator('.finale-world').waitFor();assert.equal(await f.locator('.finale-world i').count(),3);assert.equal(await f.locator('.finale-world').evaluate(e=>getComputedStyle(e).pointerEvents),'none');await page.screenshot({path:path.join(shots,'classroom-integrated-garland-320.png'),fullPage:true});
 await f.evaluate(()=>closeClassroomHub());await page.reload();await ready();await f.evaluate(()=>openClassroomHub());await f.locator('.finale-world').waitFor();assert.equal(await f.locator('.finale-world').getAttribute('data-ribbon'),'sky');
 // The retained background retry recovers the scenery and its cropped doorway together.
 await page.route('**/maps/classroom-panorama-v1.webp',r=>r.abort());await page.reload();await ready();await f.evaluate(()=>enterHubScene('classroom'));await f.locator('.campus-scene-status button').waitFor();assert(await f.locator('[data-place=hallway]').getAttribute('aria-label'));await page.unroute('**/maps/classroom-panorama-v1.webp');await f.locator('.campus-scene-status button').tap();await f.locator('.campus-scene-status').waitFor({state:'hidden'});

 assert.deepEqual(await f.evaluate(()=>[mockRpg.student.xp,mockRpg.student.gold]),[260,180]);assert.deepEqual(errors,[]);console.log('PASS: retained classroom art/budget and ground, aligned object destinations, all seven destinations, >500px camera reveal, native touch/E interactions, 1366/390/320 readable labels/HUD, two-way hallway arrival, private garland/reload, background retry and named doorway, unchanged economy.');
 }finally{await browser.close();server.closeAllConnections();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
