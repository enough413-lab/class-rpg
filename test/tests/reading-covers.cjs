const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright'),{server,shots}=require('./student-fixture.cjs');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:900},hasTouch:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());
  let f;const boot=async()=>{
   await page.goto('http://127.0.0.1:'+server.address().port);f=page.frames().find(x=>x.url().includes('app-core'));
   await f.waitForFunction(()=>window.studentCampus&&window.openReadingShelf);await f.evaluate(()=>enterHubScene('library'));
   await f.evaluate(()=>{
    const titles=['구름 학교','작은 정원','바람 우체국','숲이 건네는 인사','별빛 바다','우리 동네 산책','아주 긴 제목을 가진 책도 끝까지 읽을 수 있어요'.repeat(4),'<img src=x onerror="window.coverXss=1">','👩‍🌾🌱 씨앗의 하루',...Array.from({length:16},(_,i)=>'함께 읽는 이야기 '+i)];
    window.coverRows=titles.map((book_title,i)=>({review_id:240-i,book_title,author_nickname:i%2?'초록별':'꽃나래',read_date:'2026-10-15',summary:'함께 읽은 이야기',thoughts:'마음에 남은 장면',recommendation_rating:4,recommendation_reason:'친구와 나누고 싶어요',status:'approved',mine:false}));
    const base=db.rpc.bind(db);window.coverReads=[];
    db.rpc=async(n,a)=>{
     if(!['student_reading_shelf_search','student_reading_bookmarks'].includes(n))return base(n,a);
     coverReads.push({n,a});if(window.coverFail)return{error:{message:'offline'}};
     let rows=a.p_scope==='mine'?[{...coverRows[0],review_id:200,mine:true,author_nickname:mockRpg.student.nickname}]:coverRows;
     if(n==='student_reading_bookmarks')rows=rows.filter(r=>a.p_ids.includes(r.review_id));
     if(a.p_author)rows=rows.filter(r=>r.author_nickname.includes(a.p_author));
     if(a.p_before_id)rows=rows.filter(r=>r.review_id<a.p_before_id);
     const result={data:{reviews:rows.slice(0,20),next_before_id:rows[19]?.review_id||null,has_more:rows.length>20,class_sharing:true}};
     if(window.coverDelay)return new Promise(r=>window.coverReply=()=>r(result));return result;
    };
   });
  };
  const ready=async(count)=>{await f.waitForFunction(n=>document.querySelectorAll('.shelf-book').length===n&&!document.querySelector('#shelfStatus').textContent.includes('중이에요'),count)};
  const covers=()=>f.locator('.shelf-book').evaluateAll(rows=>Object.fromEntries(rows.map(r=>[r.querySelector('h3').textContent,r.querySelector('.shelf-book-cover').outerHTML])));
  await boot();await f.evaluate(()=>openReadingShelf());await ready(1);const own=(await covers())['구름 학교'];
  await f.locator('[data-shelf-scope=class]').tap();await ready(20);const initial=await covers();assert.equal(initial['구름 학교'],own);
  assert.equal(await f.locator('.shelf-book-cover svg').count(),20);assert.equal(await f.locator('.shelf-book-cover img').count(),0);
  assert.equal(await f.evaluate(()=>window.coverXss),undefined);assert.equal(await f.locator('#shelfRows img').count(),0);
  assert.equal(await f.locator('.shelf-book-cover[aria-hidden=true]').count(),20);
  const motifCount=await f.locator('.shelf-book-cover svg').evaluateAll(els=>new Set(els.map(e=>e.innerHTML)).size);assert(motifCount>=5,'Covers differ by shape as well as colour');
  assert.equal(await f.locator('.shelf-cover-title').nth(8).textContent(),'👩‍🌾🌱씨앗');
  const contrast=await f.locator('.shelf-book-cover').evaluateAll(els=>els.map(el=>{
   const luminance=v=>{const a=v.match(/\d+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return a[0]*.2126+a[1]*.7152+a[2]*.0722};
   const s=getComputedStyle(el),a=luminance(s.color),b=luminance(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  }));assert(contrast.every(n=>n>=4.5),'Cover letters meet normal-text contrast');
  await f.locator('[data-shelf-more]').focus();await page.keyboard.press('Enter');await ready(25);
  const all=await covers();for(const [title,cover] of Object.entries(initial))assert.equal(all[title],cover);
  await f.locator('[data-shelf-pin="240"]').tap();await f.locator('[data-shelf-scope=pins]').tap();await ready(1);assert.equal((await covers())['구름 학교'],own);
  await f.locator('.shelf-book summary').focus();await page.keyboard.press('Enter');assert(await f.locator('.shelf-review').isVisible());
  await f.locator('[data-shelf-scope=class]').tap();await ready(20);await f.locator('#shelfAuthorQuery').fill('초록별');await f.locator('#shelfAuthorForm button').tap();await ready(12);
  for(const [title,cover] of Object.entries(await covers()))assert.equal(all[title],cover,'Filter must not recolour or reshape covers');
  const pure=await f.evaluate(async()=>{const {readingCover}=await import('./reading-shelf.js?v=20261015-covers');return {a:readingCover('구름 학교'),nfd:readingCover('구름 학교'.normalize('NFD')),spaced:readingCover('  구름  학교\n'),blank:readingCover(null)}});
  assert.equal(pure.a,pure.nfd);assert.equal(pure.a,pure.spaced);assert.match(pure.blank,/제목없음/);
  await page.keyboard.press('Escape');await boot();await f.evaluate(()=>openReadingShelf());await ready(1);assert.equal((await covers())['구름 학교'],own);
  await f.locator('[data-shelf-scope=pins]').tap();await ready(1);assert.equal((await covers())['구름 학교'],own);
  await page.keyboard.press('Escape');await f.evaluate(()=>{mockRpg.student.id=988;document.dispatchEvent(new Event('student-dashboard-updated'));openReadingShelf()});await ready(1);
  await f.locator('[data-shelf-scope=pins]').tap();await ready(0);await page.keyboard.press('Escape');
  await f.evaluate(()=>{mockRpg.student.id=987;document.dispatchEvent(new Event('student-dashboard-updated'));openReadingShelf()});await ready(1);
  await f.evaluate(()=>window.coverFail=true);await f.locator('[data-shelf-scope=class]').tap();await f.locator('[data-shelf-retry]').waitFor();
  await f.evaluate(()=>window.coverFail=false);await f.locator('[data-shelf-retry]').focus();await page.keyboard.press('Enter');await ready(20);assert.equal((await covers())['구름 학교'],own);
  const session=await page.context().newCDPSession(page);await session.send('Emulation.setCPUThrottlingRate',{rate:4});fs.mkdirSync(shots,{recursive:true});
  // Native touch tap plus a real browser touch scroll; snapshots cover standard and reduced motion.
  for(const [width,height] of [[1366,900],[390,844],[320,640]]){
   await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:width===320?'reduce':'no-preference'});
   await f.evaluate(()=>{openReadingShelf()});await ready(1);await f.locator('[data-shelf-scope=class]').tap();await ready(20);
   await f.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);
   assert(await f.locator('#readingShelf').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
   const first=f.locator('.shelf-book').first();await first.scrollIntoViewIfNeeded();
   assert(await first.locator('h3').isVisible());const art=await first.locator('svg').boundingBox();assert(art.width>=32&&art.height>=32);
   for(const b of await f.locator('#readingShelf button').all()){if(await b.isVisible()){const rect=await b.boundingBox();assert(rect.width>=44&&rect.height>=44)}}
   await page.screenshot({path:path.join(shots,'reading-covers-'+width+'.png'),fullPage:true});
   if(width===320){await f.locator('.shelf-book').nth(6).scrollIntoViewIfNeeded();assert(await f.locator('#readingShelf').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await page.screenshot({path:path.join(shots,'reading-covers-long-320.png'),fullPage:true})}await first.locator('summary').tap();assert(await first.locator('.shelf-review').isVisible());
   const box=await f.locator('#readingShelf').boundingBox(),x=box.x+box.width-20,y=Math.min(height-90,box.y+box.height-60);
   await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
   for(let i=1;i<=5;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*20,id:1}]});
   await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.keyboard.press('Escape');
  }
  await f.evaluate(()=>{window.coverDelay=true;openReadingShelf()});await f.waitForFunction(()=>window.coverReply);
  await f.evaluate(()=>{mockRpg.student.id=988;document.dispatchEvent(new Event('student-dashboard-updated'));coverReply()});await page.waitForTimeout(100);
  assert(!await f.locator('#readingShelf').isVisible());assert.equal(await f.locator('.shelf-book-cover').count(),0);
  assert.deepEqual(await f.evaluate(()=>[mockRpg.student.xp,mockRpg.student.gold]),[260,180]);
  assert.equal(await f.evaluate(()=>mockRpg.actionCalls?.length||0),0);assert.deepEqual(errors,[]);
  console.log('PASS audit13: title-stable original motifs/colour/letters; same title across authors/scopes/order/pages/reload; grapheme/NFC/whitespace and XSS; 4.5 contrast; bookmarks/account isolation/late replies/retry; native keyboard/touch/scroll,1366/390/320,4x CPU/reduced motion; no reading writes or economy changes. Browser emulation only, no physical Chromebook/student observation.');
 }finally{await browser.close();server.closeAllConnections();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
