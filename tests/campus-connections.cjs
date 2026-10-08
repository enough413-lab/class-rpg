const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),sharp=require('sharp');
const {chromium}=require('playwright'),{server,shots}=require('./student-fixture.cjs');
(async()=>{
 const art=await sharp(path.join(__dirname,'../maps/library-panorama-v1.webp')).metadata();assert.equal(art.width/art.height,3);assert(art.width>=2000);
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());await page.goto('http://127.0.0.1:'+server.address().port);
  let f=page.frames().find(x=>x.url().includes('app-core.html'));await f.waitForFunction(()=>window.studentCampus&&document.getElementById('saProfileTitle')?.textContent.includes('별나래'));await f.evaluate(()=>document.fonts.ready);fs.mkdirSync(shots,{recursive:true});
  const ready=()=>f.locator('.campus-scene-status').waitFor({state:'hidden'}),pos=()=>f.locator('#hubPlayer').evaluate(e=>parseFloat(e.style.left));
  const navigate=async kind=>{await page.emulateMedia({reducedMotion:'reduce'});await f.locator('[data-campus=find]').click();await f.locator('[data-finder-place='+kind+']').click();await f.waitForFunction(k=>document.querySelector('[data-campus=use]').textContent.includes(document.querySelector('[data-place='+k+']').querySelector('b').textContent),kind)};
  const frozen=async()=>{const x=await pos();await page.waitForTimeout(160);assert.equal(await pos(),x)};
  // Six physical links are usable in both directions, arriving beside the matching doorway.
  const chain=['classroom','hallway','library','garden','pond','playground','cafeteria'];
  for(let i=0;i<chain.length-1;i++)for(const [from,to] of [[chain[i],chain[i+1]],[chain[i+1],chain[i]]]){
   await f.evaluate(room=>enterHubScene(room),from);await ready();await navigate(to);await page.keyboard.press('e');await f.waitForFunction(room=>document.getElementById('classroomHub').dataset.scene===room,to);await ready();
   const door=await f.locator('[data-place='+from+']').getAttribute('data-walk-x'),expected=Number(door)+(Number(door)<50?6:-6);assert.equal(await pos(),expected,from+' to '+to+' arrival');assert.equal(await f.locator('#hubPlayer').getAttribute('data-facing'),Number(door)<50?'right':'left');await frozen();
   assert(await f.locator('[data-place='+from+']').isVisible());
   await f.evaluate(()=>{for(const key of ['e','Enter','ArrowUp'])document.getElementById('campusTitle').dispatchEvent(new KeyboardEvent('keydown',{key,repeat:true,bubbles:true}))});assert.equal(await f.locator('#classroomHub').getAttribute('data-scene'),to,'Holding an interaction key must not bounce through the return door');
  }
  for(const [width,height] of [[1366,768],[390,844],[320,640]]){
   await page.setViewportSize({width,height});await f.evaluate(()=>{enterHubScene('hallway');enterHubScene('library')});await ready();
   assert(await f.locator('.hub-stage').evaluate(el=>el.clientWidth>el.parentElement.clientWidth*1.9));
   await navigate('hallway');await page.screenshot({path:path.join(shots,'paths-library-left-'+width+'.png'),fullPage:true});
   const left=await f.locator('.hub-stage').evaluate(el=>el.getBoundingClientRect().left);await navigate('nook');const right=await f.locator('.hub-stage').evaluate(el=>el.getBoundingClientRect().left);assert(left-right>450,'Walking reveals a different portion of one continuous room');
   await f.locator('[data-campus=use]').tap();assert.match(await f.locator('#campusGuide').textContent(),/학교 정원/);assert(!await f.locator('.campus-guide-choices').isVisible());await page.keyboard.press('Escape');
   await page.screenshot({path:path.join(shots,'paths-library-right-'+width+'.png'),fullPage:true});
   assert(await f.locator('[data-campus=use]').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight+1));assert(await f.locator('#classroomHub').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
   assert(await f.locator('.campus-player-name').evaluate(el=>el.getBoundingClientRect().top>el.parentElement.getBoundingClientRect().bottom));
   // Actual held input moves at the same rate on the longer panorama and stops at the door.
   await page.emulateMedia({reducedMotion:'no-preference'});await f.locator('#campusTitle').focus();const x=await pos(),w=await f.locator('.hub-stage').evaluate(el=>el.clientWidth);const t=Date.now();await page.keyboard.down('ArrowRight');await page.waitForTimeout(520);await page.keyboard.up('ArrowRight');const rate=(await pos()-x)*w/100/((Date.now()-t)/1000);assert(rate>75&&rate<120,'Panorama speed stays near 100px/s: '+rate);await frozen();
   await navigate('garden');await f.locator('[data-campus=use]').tap();await ready();assert.equal(await f.locator('#classroomHub').getAttribute('data-scene'),'garden');assert.equal(await pos(),12);await frozen();
   await navigate('library');await page.keyboard.press('ArrowUp');await ready();assert.equal(await f.locator('#classroomHub').getAttribute('data-scene'),'library');assert.equal(await pos(),88);
   await page.screenshot({path:path.join(shots,'paths-library-door-'+width+'.png'),fullPage:true});
  }
  // Existing book writing / reading are separate, and no new level gate is introduced.
  await f.evaluate(async()=>{mockRpg.student.xp=0;await loadDashboard()});await f.evaluate(()=>enterHubScene('library'));await ready();
  for(const [kind,id] of [['reading','#readingPortfolioModal'],['portfolio','#readingShelf']]){await navigate(kind);await f.locator('[data-campus=use]').tap();assert(await f.locator(id).isVisible());await page.keyboard.press('Escape')}
  await navigate('tori');await page.keyboard.press('e');assert(await f.locator('#campusGuide').isVisible());await page.keyboard.press('Escape');
  // A failed panorama is recoverable without changing room or progression.
  await f.evaluate(()=>enterHubScene('hallway'));await page.route('**/maps/library-panorama-v1.webp',r=>r.abort());await page.reload();f=page.frames().find(x=>x.url().includes('app-core.html'));await f.waitForFunction(()=>window.studentCampus);await f.evaluate(()=>enterHubScene('library'));await f.locator('.campus-scene-status button').waitFor();await page.unroute('**/maps/library-panorama-v1.webp');await f.locator('.campus-scene-status button').click();await ready();assert.match(await f.locator('.hub-stage').evaluate(el=>el.style.backgroundImage),/library-panorama/);
  assert.deepEqual(await f.evaluate(()=>[mockRpg.student.xp,mockRpg.student.gold]),[260,180]);assert.deepEqual(errors,[]);
  console.log('PASS: original 3:1 art, six bidirectional links, door-side arrivals/facing/stops, left-to-right camera reveal, nook, native keyboard/touch, 1366/390/320 controls and feet labels, constant movement, Lv1 desk/shelf/NPC, image retry and unchanged economy');
 }finally{await browser.close();server.closeAllConnections();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
