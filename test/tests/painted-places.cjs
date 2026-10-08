const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),sharp=require('sharp');
const {chromium}=require('playwright'),{server,shots}=require('./student-fixture.cjs');
(async()=>{
 const props={cafeteria:['sink','table','trays'],playground:['mat','bench','balls']};
 for(const room of Object.keys(props)){
  const image=await sharp(path.join(__dirname,'../maps/'+room+'-panorama-v1.webp')).metadata();assert.equal(image.width/image.height,3);assert(image.width>=2000);assert(fs.statSync(path.join(__dirname,'../maps/'+room+'-panorama-v1.webp')).size<700000);
  for(const name of props[room]){const p=path.join(__dirname,'../maps/props/'+room+'-'+name+'-v1.webp'),meta=await sharp(p).metadata();assert(meta.hasAlpha);assert(meta.width<=600&&meta.height<=600);const stats=await sharp(p).stats();assert.equal(stats.channels[3].min,0);assert.equal(stats.channels[3].max,255)}
 }
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());await page.goto('http://127.0.0.1:'+server.address().port);
  let f=page.frames().find(x=>x.url().includes('app-core.html'));await f.waitForFunction(()=>window.studentCampus);await f.evaluate(()=>document.fonts.ready);fs.mkdirSync(shots,{recursive:true});
  const ready=()=>f.locator('.campus-scene-status').waitFor({state:'hidden'});
  const navigate=async kind=>{await page.emulateMedia({reducedMotion:'reduce'});await f.locator('[data-campus=find]').click();await f.locator('[data-finder-place='+kind+']').click();await f.waitForFunction(k=>document.querySelector('[data-campus=use]').textContent.includes(document.querySelector('[data-place='+k+'] b').textContent),kind)};
  for(const [width,height] of [[1366,768],[390,844],[320,640]]){
   await page.setViewportSize({width,height});
   for(const room of Object.keys(props)){
    await f.evaluate(room=>enterHubScene(room),room);await ready();await f.waitForFunction(()=>[...document.querySelectorAll('.campus-painted-prop img')].every(i=>i.complete&&i.naturalWidth));
    assert.equal(await f.locator('.campus-painted-prop').count(),3);assert.match(await f.locator('.hub-stage').evaluate(e=>e.style.backgroundImage),new RegExp(room+'-panorama'));
    const stage=await f.locator('.hub-stage').boundingBox();assert.equal(stage.width/stage.height,3);assert(await f.locator('.hub-stage').evaluate(e=>e.clientWidth>e.parentElement.clientWidth+500));
    const positions=[];
    for(let i=0;i<3;i++){
     await navigate('look-'+i);const target=f.locator('[data-place=look-'+i+']');const bounds=await target.boundingBox();assert(bounds.width>=44&&bounds.height>=44);assert(Math.abs(bounds.y+bounds.height-(stage.y+stage.height*.8))<2);
     positions.push(await f.locator('.hub-stage').evaluate(e=>e.getBoundingClientRect().x));
     const overlaps=await f.locator('#hubSceneObjects').evaluate(e=>{const labels=[...e.querySelectorAll('.campus-object-caption,[data-place=story]')].map(e=>({text:e.textContent,r:e.getBoundingClientRect()}));return labels.flatMap((a,i)=>labels.slice(i+1).filter(b=>Math.min(a.r.right,b.r.right)>Math.max(a.r.left,b.r.left)&&Math.min(a.r.bottom,b.r.bottom)>Math.max(a.r.top,b.r.top)).map(b=>[a.text,b.text]))});assert.deepEqual(overlaps,[],'No prop, door or story label overlap');
     // Walk a little clear of the prop to review separate silhouettes and labels.
     await f.evaluate(()=>moveHub(-1,0));await page.waitForTimeout(200);assert((await target.locator('.campus-object-caption').boundingBox()).y+(await target.locator('.campus-object-caption').boundingBox()).height<=(await f.locator('#hubPlayer').boundingBox()).y,'Prop label stays clear above player head');await page.screenshot({path:path.join(shots,'painted-'+room+'-'+i+'-'+width+'.png'),fullPage:true});
     if(i===1)await target.tap();else{await target.focus();await page.keyboard.press('Enter')}
     assert(await f.locator('#campusGuide').isVisible());assert.equal(await f.locator('#campusGuide').getAttribute('data-inspection'),'true');assert(await f.locator('.campus-guide-choices').isHidden());assert(await f.locator('#campusGuideTitle').isVisible());assert.match(await f.locator('#campusGuide .campus-return').textContent(),/계속 둘러보기/);assert(await f.locator('#campusGuide').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await page.keyboard.press('Escape');
    }
    assert(positions[0]-positions[2]>500,'Different art is revealed by camera travel');assert(await f.locator('[data-campus=use]').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight+1));assert(await f.locator('#classroomHub').evaluate(e=>e.scrollWidth<=e.clientWidth+1));assert(await f.locator('.campus-player-name').evaluate(e=>e.getBoundingClientRect().top>e.parentElement.getBoundingClientRect().bottom));
   }
   // The renovated places still connect physically in both directions.
   await f.evaluate(()=>enterHubScene('cafeteria'));await ready();await navigate('playground');await page.keyboard.press('e');await ready();assert.equal(await f.locator('#classroomHub').getAttribute('data-scene'),'playground');await navigate('cafeteria');await f.locator('[data-campus=use]').tap();await ready();assert.equal(await f.locator('#classroomHub').getAttribute('data-scene'),'cafeteria');
  }
  // Existing story levels stay intact; walking itself does not acquire a new gate.
  await f.evaluate(()=>{mockRpg.student.xp=3155;dispatchEvent(new CustomEvent('student-dashboard-updated'))});for(const room of Object.keys(props)){await f.evaluate(room=>enterHubScene(room),room);await ready();await f.locator('[data-route=story]').click();assert(await f.locator('#saQuestion').isVisible());await page.keyboard.press('Escape')}
  // Load failure leaves a usable name/interaction; failed scenery has a working retry.
  await page.route('**/maps/props/cafeteria-sink-v1.webp',r=>r.abort());await page.route('**/maps/cafeteria-panorama-v1.webp',r=>r.abort());await page.reload();f=page.frames().find(x=>x.url().includes('app-core.html'));await f.waitForFunction(()=>window.studentCampus);await f.evaluate(()=>enterHubScene('cafeteria'));await f.locator('.campus-scene-status button').waitFor();await page.unroute('**/maps/cafeteria-panorama-v1.webp');await f.locator('.campus-scene-status button').click();await ready();await f.locator('.campus-painted-prop.art-missing').waitFor();await navigate('look-0');await f.locator('[data-campus=use]').tap();assert(await f.locator('#campusGuide').isVisible());await page.keyboard.press('Escape');await page.unroute('**/maps/props/cafeteria-sink-v1.webp');await f.evaluate(()=>{enterHubScene('playground');enterHubScene('cafeteria')});await ready();await f.waitForFunction(()=>document.querySelector('[data-place=look-0] img').naturalWidth>0);
  assert.deepEqual(await f.evaluate(()=>[mockRpg.student.xp,mockRpg.student.gold]),[260,180]);assert.deepEqual(errors,[]);console.log('PASS: two original panoramas + six alpha props, three camera views at 1366/390/320, same floor baseline, touch/keyboard inspections, two-way doors, existing story access, art fallback/retry and unchanged economy.');
 }finally{await browser.close();server.closeAllConnections();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
