const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright'),{server,shots}=require('./student-fixture.cjs');
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({headless:true,channel:'msedge'});
 try{
 const p=await b.newPage({viewport:{width:1366,height:900},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://**',r=>r.abort());let f;
 const boot=async()=>{await p.goto('http://127.0.0.1:'+server.address().port);f=p.frames().find(x=>x.url().includes('app-core'));await f.waitForFunction(()=>window.openReadingShelf&&window.studentCampus);await f.evaluate(()=>{enterHubScene('library');
  const make=(id,title,author='초록별')=>({review_id:id,book_title:title,author_nickname:author,read_date:'2026-10-15',summary:'합성 이야기',thoughts:'합성 생각',recommendation_rating:4,recommendation_reason:'합성 추천',mine:false,status:'approved'});
  window.searchRows=[...Array.from({length:35},(_,i)=>make(400-i,'다른 이야기 '+i)),...Array.from({length:23},(_,i)=>make(300-i,'찾는 바람 '+i,i%2?'꽃나래':'초록별')),make(250,'오래된 구름 학교'),make(249,'100%_별 BOOK'),make(248,'<img src=x onerror="window.searchXss=1">')];
  const base=db.rpc.bind(db);window.searchCalls=[];window.searchReplies=[];window.searchShared=true;
  const normal=s=>s.normalize('NFC').replace(/\s+/gu,' ').trim().toLowerCase();
  db.rpc=async(n,a)=>{if(!['student_reading_shelf_find','student_reading_shelf_search','student_reading_bookmarks'].includes(n))return base(n,a);
   searchCalls.push({n,a});if(window.searchFail)return {error:{message:'offline'}};
   let rows=searchRows;if(n==='student_reading_bookmarks')rows=searchShared?rows.filter(r=>a.p_ids.includes(r.review_id)):[];
   if(a.p_scope==='class'&&!searchShared)rows=[];if(a.p_title)rows=rows.filter(r=>normal(r.book_title).includes(normal(a.p_title)));if(a.p_author)rows=rows.filter(r=>r.author_nickname.includes(a.p_author));if(a.p_before_id)rows=rows.filter(r=>r.review_id<a.p_before_id);
   const result={data:{reviews:n==='student_reading_bookmarks'?rows:rows.slice(0,20),has_more:n!=='student_reading_bookmarks'&&rows.length>20,next_before_id:rows[19]?.review_id||null,class_sharing:searchShared}};
   if(window.searchDelay)return new Promise(resolve=>searchReplies.push({title:a.p_title,resolve:()=>resolve(result)}));return result;
  };
 })};
 const ready=async(count)=>f.waitForFunction(n=>document.querySelectorAll('.shelf-book').length===n&&!document.querySelector('#shelfStatus').textContent.includes('중이에요'),count);
 const submit=()=>f.locator('#shelfAuthorForm [type=submit]').tap();const title=()=>f.locator('#shelfTitleQuery');
 await boot();await f.evaluate(()=>openReadingShelf());await ready(20);assert(!(await f.locator('#shelfRows').textContent()).includes('오래된'));
 await title().fill('  구름   학교  '.normalize('NFD'));await title().press('Enter');await ready(1);assert.equal(await f.locator('.shelf-book h3').textContent(),'오래된 구름 학교');assert.equal(await f.evaluate(()=>searchCalls.at(-1).a.p_title),'구름 학교');
 const jacket=await f.locator('.shelf-book-cover').evaluate(e=>e.outerHTML);await f.locator('[data-shelf-pin="250"]').tap();
 await f.locator('[data-shelf-scope=pins]').tap();await ready(1);assert.equal(await f.locator('.shelf-book-cover').evaluate(e=>e.outerHTML),jacket);
 await title().fill('없는 제목');await submit();await ready(0);assert.match(await f.locator('.shelf-empty').textContent(),/찾는 글이 없어요/);
 await f.locator('[data-shelf-clear]').tap();await ready(1);assert.equal(await title().inputValue(),'');assert(await title().evaluate(e=>document.activeElement===e));
 await f.locator('[data-shelf-scope=class]').tap();await ready(20);await title().fill('찾는');await submit();await ready(20);
 await f.locator('[data-shelf-more]').tap();await ready(23);assert.equal(new Set(await f.locator('.shelf-book h3').allTextContents()).size,23);assert(await f.locator('[data-shelf-more]').isHidden());
 assert.equal(await f.evaluate(()=>searchCalls.at(-1).a.p_title),'찾는');assert.equal(await f.evaluate(()=>searchCalls.at(-1).a.p_before_id),281);
 await f.locator('#shelfAuthorQuery').fill('꽃나래');await submit();await ready(11);assert((await f.locator('.shelf-author').allTextContents()).every(s=>s.includes('꽃나래')));assert.equal(await f.evaluate(()=>searchCalls.at(-1).a.p_before_id),null);
 await f.locator('[data-shelf-clear]').tap();await ready(20);await title().fill('%_');await submit();await ready(1);assert.match(await f.locator('.shelf-book h3').textContent(),/100%_/);
 await title().fill('book');await submit();await ready(1);await title().fill('<img');await submit();await ready(1);assert.equal(await f.locator('#shelfRows img').count(),0);assert.equal(await f.evaluate(()=>window.searchXss),undefined);
 await title().fill('구름');await title().dispatchEvent('compositionstart');const before=await f.evaluate(()=>searchCalls.length);await f.evaluate(()=>document.getElementById('shelfAuthorForm').requestSubmit());assert.equal(await f.evaluate(()=>searchCalls.length),before);await title().dispatchEvent('compositionend');await title().press('Enter');await ready(1);
 await f.evaluate(()=>window.searchDelay=true);await title().fill('찾는');await submit();await f.waitForFunction(()=>searchReplies.length===1);await title().fill('구름');await submit();await f.waitForFunction(()=>searchReplies.length===2);
 await f.evaluate(()=>{searchReplies[1].resolve();searchReplies[0].resolve();window.searchDelay=false});await ready(1);assert.equal(await f.locator('.shelf-book h3').textContent(),'오래된 구름 학교');
 await f.evaluate(()=>window.searchFail=true);await title().fill('찾는');await submit();await f.locator('[data-shelf-retry]').waitFor();assert.equal(await title().inputValue(),'찾는');await f.evaluate(()=>window.searchFail=false);await f.locator('[data-shelf-retry]').tap();await ready(20);
 await f.evaluate(()=>window.searchFail=true);await f.locator('[data-shelf-more]').tap();await f.locator('[data-shelf-retry]').waitFor();await f.evaluate(()=>window.searchFail=false);await f.locator('[data-shelf-retry]').tap();await ready(23);
 await p.keyboard.press('Escape');await boot();await f.evaluate(()=>openReadingShelf());await ready(20);assert.equal(await title().inputValue(),'');await f.locator('[data-shelf-scope=pins]').tap();await ready(1);
 await f.evaluate(()=>window.searchShared=false);await title().fill('구름');await submit();await ready(0);assert.match(await f.locator('.shelf-note').textContent(),/공개가 취소/);
 await p.keyboard.press('Escape');await f.evaluate(()=>{mockRpg.student.id=988;document.dispatchEvent(new Event('student-dashboard-updated'));openReadingShelf()});await ready(20);await f.locator('[data-shelf-scope=pins]').tap();await ready(0);
 await p.keyboard.press('Escape');await f.evaluate(()=>{mockRpg.student.id=987;document.dispatchEvent(new Event('student-dashboard-updated'));window.searchShared=true;openReadingShelf()});await ready(20);
 const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});fs.mkdirSync(shots,{recursive:true});
 for(const [width,height] of [[1366,900],[390,844],[320,640]]){
  await p.setViewportSize({width,height});await p.emulateMedia({reducedMotion:width===320?'reduce':'no-preference'});await f.evaluate(()=>openReadingShelf());await ready(20);
  await title().fill('구름');await submit();await ready(1);await f.evaluate(()=>document.fonts.ready);
  assert(await f.locator('#readingShelf').evaluate(e=>e.scrollWidth<=e.clientWidth+1));for(const control of await f.locator('#readingShelf button,#readingShelf input').all()){if(await control.isVisible()){const r=await control.boundingBox();assert(r.width>=44&&r.height>=44)}}
  await f.locator('.shelf-search').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(shots,'reading-title-search-'+width+'.png'),fullPage:true});
  await f.locator('.shelf-book summary').focus();await p.keyboard.press('Enter');assert(await f.locator('.shelf-review').isVisible());await p.keyboard.press('Escape');
 }
 await f.evaluate(()=>{window.searchDelay=true;openReadingShelf()});await f.waitForFunction(()=>searchReplies.length>0);await f.evaluate(()=>{mockRpg.student.id=988;document.dispatchEvent(new Event('student-dashboard-updated'));searchReplies.at(-1).resolve()});await p.waitForTimeout(100);assert(!await f.locator('#readingShelf').isVisible());assert.equal(await f.locator('.shelf-book').count(),0);
 assert.deepEqual(await f.evaluate(()=>[mockRpg.student.xp,mockRpg.student.gold]),[260,180]);assert.deepEqual(errors,[]);
 console.log('PASS audit14 UI: old title outside first page, combined author, filtered pages, clear/no results, normalized literal input, IME submit, stale search/account responses, retry first/next page, bookmarks/sharing/reconnect, title-stable jackets, native keyboard/touch/1366/390/320/4x CPU/reduced motion. Synthetic browser data only.');
 }finally{await b.close();server.closeAllConnections();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
