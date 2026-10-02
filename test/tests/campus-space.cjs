const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),sharp=require('sharp');
const {chromium}=require('playwright');const {server,shots}=require('./student-fixture.cjs');
(async()=>{
 for(const room of ['classroom','hallway','library']){const m=await sharp(path.join(__dirname,'../maps/'+room+'-tall-v1.webp')).metadata();assert.equal(m.width,1440);assert.equal(m.height,1080)}
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());await page.goto('http://127.0.0.1:'+server.address().port);
  const f=page.frames().find(f=>f.url().includes('app-core.html'));await f.waitForFunction(()=>window.studentCampus);fs.mkdirSync(shots,{recursive:true});
  const settled=async()=>{await f.locator('.campus-scene-status').waitFor({state:'hidden'});await f.waitForFunction(()=>[...document.querySelectorAll('.hub-stage,#hubPlayer')].every(el=>el.getAnimations().every(a=>a.playState!=='running')))};
  for(const [width,height] of [[1440,1050],[1366,768],[700,900],[390,844],[320,640]]){
   await page.setViewportSize({width,height});
   for(const room of ['classroom','library','hallway']){
    await f.evaluate(room=>enterHubScene(room),room);await settled();
    const box=await f.evaluate(()=>{const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height,bottom:b.bottom}};return{stage:r('.hub-stage'),view:r('.campus-viewport'),player:r('#hubPlayer'),use:r('[data-campus=use]'),screen:innerHeight,overflow:document.getElementById('classroomHub').scrollWidth>innerWidth+1}});
    assert(Math.abs(box.stage.w/box.stage.h-4/3)<.002);assert(Math.abs(box.view.h-box.stage.h)<1);assert(Math.abs(box.view.y-box.stage.y)<1,'Never crop the ceiling with a negative margin');assert(!box.overflow);assert(box.use.bottom<=box.screen+1,`Movement/use controls must stay visible: ${width}x${height} ${room} ${JSON.stringify(box)}`);
    assert(Math.abs(box.player.bottom-(box.stage.y+box.stage.h*.8))<1,'Feet stay on the new floor');
    if(width===390)assert(box.view.h>=520,'Phone scene must be taller than the previous 350px viewport');
    if(width<850)assert(Math.abs(box.player.w-163)<1);else assert(box.player.w>=188);
    await page.screenshot({path:path.join(shots,`space-${room}-${width}.png`),fullPage:true});
   }
  }
  await page.setViewportSize({width:390,height:844});await f.evaluate(()=>enterHubScene('library'));await settled();
  const stage=await f.locator('.hub-stage').boundingBox(),x=()=>f.locator('#hubPlayer').evaluate(el=>parseFloat(el.style.left));const start=await x();
  await page.mouse.click(stage.x+stage.width*.4,stage.y+stage.height*.25);assert.equal(await x(),start,'Looking at the upper wall should not start walking');
  const floorX=Math.round(stage.x+stage.width*.38),target=(floorX-stage.x)/stage.width*100;
  await page.mouse.click(floorX,stage.y+stage.height*.795);await f.waitForFunction(target=>Math.abs(parseFloat(document.getElementById('hubPlayer').style.left)-target)<.06,target);
  const arrived=await x();await f.locator('[data-place=reading]').click();assert(await f.locator('#readingPortfolioModal').isVisible());await page.keyboard.press('Escape');assert.equal(await x(),arrived);
  await f.locator('.campus-tori').click();assert(await f.locator('#campusGuide').isVisible());await page.keyboard.press('Escape');
  assert.deepEqual(await f.evaluate(()=>[mockRpg.student.xp,mockRpg.student.gold]),[260,180]);assert.deepEqual(errors,[]);
  console.log('PASS: 4:3 native art, uncropped rooms, stable avatar size/floor, visible controls at desktop/laptop/tablet/390/320, wall versus floor input, reading/NPC return and unchanged economy.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
