const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');const {server,shots}=require('./student-fixture.cjs');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 fs.mkdirSync(shots,{recursive:true});const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());
  await page.goto(base);const f=page.frames().find(f=>f.url().includes('app-core.html'));
  await f.waitForFunction(()=>document.getElementById('saProfileTitle')?.textContent.includes('별나래'));
  await f.evaluate(async()=>{
   mockRpg.inventory.push({item_id:'school',slot:'top',name:'산뜻한 학교 셔츠',image:'3.top/top_girl_school.png',equipped:false},{item_id:'magic',slot:'top',name:'별빛 마법사 옷',image:'3.top/top_girl_magic.png',equipped:false},{item_id:'hanbok-hair-girl',slot:'hair',name:'단정한 댕기 머리',image:'2.hair/hair_girl_hanbok_show.png',equipped:false});
   await loadDashboard();enterHubScene('classroom');moveHub(-1,0);
  });
  const pos=await f.locator('#hubPlayer').getAttribute('style');await f.locator('[data-place=inventory]').click();
  const settled=()=>f.waitForFunction(()=>document.getElementById('inventoryModal').getAttribute('aria-busy')==='false');await settled();
  const count=()=>f.evaluate(()=>mockRpg.calls.filter(n=>n==='student_toggle_item').length);
  await f.locator('[data-item=school]').click();assert.equal(await count(),0);assert.match(await f.locator('#wardrobeMode').textContent(),/미리/);
  assert(await f.locator('#wardrobeAvatar img[src*="top_girl_school"]').count());assert.match(await f.locator('#avatarTop').getAttribute('src'),/basic/);
  await page.screenshot({path:path.join(shots,'desktop-wardrobe.png'),fullPage:true});
  // Rapid double clicks send exactly one toggle; authoritative outfit updates both renders without moving the player.
  await f.evaluate(()=>{mockRpg.outfitDelay=300;document.getElementById('wardrobeApply').click();document.getElementById('wardrobeApply').click()});await settled();assert.equal(await count(),1);
  assert.match(await f.locator('#avatarTop').getAttribute('src'),/school/);assert(await f.locator('#hubPlayer .slot-top[src*="top_girl_school"]').count());assert.equal(await f.locator('#hubPlayer').getAttribute('style'),pos);
  assert.match(await f.locator('#inventoryMsg').textContent(),/저장했어요/);await page.keyboard.press('Escape');assert(!(await f.locator('#inventoryModal').isVisible()));assert(await f.locator('#classroomHub').isVisible());
  assert.equal(await f.evaluate(()=>document.activeElement.dataset.place),'inventory');await page.keyboard.press('Enter');await settled();
  // Hair uses separate front/back layers; losing the acknowledgement never replays a toggle.
  await f.locator('[data-slot=hair]').click();await f.locator('[data-item=hanbok-hair-girl]').click();await f.evaluate(()=>mockRpg.dropOutfitReply=true);await f.locator('#wardrobeApply').click();await settled();
  assert.equal(await count(),2);assert.match(await f.locator('#avatarHairBack').getAttribute('src'),/hanbok_back/);assert.match(await f.locator('#avatarHairFront').getAttribute('src'),/hanbok_front/);
  await f.locator('#wardrobeApply').click();await settled();assert.equal(await count(),3);assert.match(await f.locator('#avatarHairFront').getAttribute('src'),/default/);
  // A failed read after a successful mutation blocks subsequent writes; recovery is read-only.
  await f.locator('[data-slot=top]').click();await f.locator('[data-item=magic]').click();await f.evaluate(()=>mockRpg.failDashboard=true);await f.locator('#wardrobeApply').click();await settled();
  assert(await f.locator('#wardrobeApply').isDisabled());assert(await f.locator('#wardrobeCheck').isVisible());assert.equal(await count(),4);
  await f.evaluate(()=>mockRpg.failDashboard=false);await f.locator('#wardrobeCheck').click();await settled();assert.equal(await count(),4);assert.match(await f.locator('#avatarTop').getAttribute('src'),/magic/);
  // A rejected mutation retains the old outfit, and preview reset/closing never writes.
  await f.locator('[data-item=school]').click();await f.evaluate(()=>mockRpg.failOutfit=true);await f.locator('#wardrobeApply').click();await settled();assert.match(await f.locator('#avatarTop').getAttribute('src'),/magic/);assert.match(await f.locator('#inventoryMsg').textContent(),/다시 골라/);
  await f.locator('#wardrobeReset').click();assert(await f.locator('#wardrobeApply').isDisabled());assert.equal(await count(),5);await f.evaluate(()=>mockRpg.failOutfit=false);
  // Touch-sized cards, horizontal category strip and mirror fit on a small phone.
  await page.setViewportSize({width:390,height:844});await f.locator('[data-slot=all]').click();await f.locator('[data-item=school]').click();await page.screenshot({path:path.join(shots,'mobile-wardrobe.png'),fullPage:true});
  assert(await f.locator('.wardrobe').evaluate(el=>el.scrollWidth<=el.clientWidth+1));assert(await f.locator('#wardrobeApply').evaluate(el=>el.getBoundingClientRect().bottom<innerHeight));
  for(const b of await f.locator('.wardrobe button:visible').all()){const r=await b.boundingBox();assert(r.width>=44&&r.height>=44,JSON.stringify(r))}
  await f.locator('[data-slot=equipment]').click();assert.match(await f.locator('.wardrobe-empty').textContent(),/아직/);await f.locator('#wardrobeShop').click();assert(await f.locator('#shopModal').isVisible());await page.keyboard.press('Escape');
  await f.evaluate(()=>openInventory());await settled();await f.locator('[data-slot=all]').click();
  await page.setViewportSize({width:320,height:640});await page.screenshot({path:path.join(shots,'small-wardrobe.png'),fullPage:true});assert(await f.locator('.wardrobe').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  await f.locator('#wardrobeApply').scrollIntoViewIfNeeded();assert(await f.locator('#wardrobeApply').evaluate(el=>el.getBoundingClientRect().bottom<innerHeight));assert(await f.locator('[aria-label="옷장 닫기"]').evaluate(el=>el.getBoundingClientRect().top>=0));
  // Account switches during a delayed mutation must not apply a previous student's wardrobe.
  await f.locator('[data-item=school]').click();await f.evaluate(()=>{mockRpg.outfitDelay=500;document.getElementById('wardrobeApply').click()});
  await f.evaluate(async()=>{mockRpg.student={...mockRpg.student,id:988,nickname:'새친구',gender:'boy'};mockRpg.inventory=[{item_id:'boy-shirt',slot:'top',name:'학교 셔츠',image:'3.top/top_boy_school.png',equipped:true}];await loadDashboard();closeInventory();openInventory()});await settled();await page.waitForTimeout(600);
  assert.equal(await f.locator('#wardrobeName').textContent(),'새친구');assert.equal(await f.locator('[data-item=school]').count(),0);assert.match(await f.locator('#avatarTop').getAttribute('src'),/boy_school/);
  assert.equal(await f.locator('#wardrobeAvatar img[src*="hair_boy_default"]').count(),1);assert.equal(await f.locator('#wardrobeAvatar img[src*="hair_girl"]').count(),0);
  assert.deepEqual(await f.evaluate(()=>[mockRpg.student.xp,mockRpg.student.gold]),[260,180]);assert.deepEqual(errors,[]);
  console.log('Wardrobe preview, filters, explicit save, double click, lost reply, read recovery, hair, account isolation, room position and mobile checks passed.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exit(1)});
