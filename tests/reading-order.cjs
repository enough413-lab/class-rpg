const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright'),{server,shots}=require('./student-fixture.cjs');
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 const page=await browser.newPage({viewport:{width:1366,height:900},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());let f;
 const boot=async()=>{await page.goto('http://127.0.0.1:'+server.address().port);f=page.frames().find(x=>x.url().includes('app-core'));await f.waitForFunction(()=>window.openReadingShelf);await f.evaluate(()=>{
  enterHubScene('library');const make=(id,title,author='초록별')=>({review_id:id,book_title:title,author_nickname:author,read_date:'2026-10-19',summary:'정렬 검증 이야기',thoughts:'합성 생각',recommendation_rating:4,recommendation_reason:'합성 추천',mine:false,status:'approved'});
  window.orderRows=[...Array.from({length:31},(_,i)=>make(101+i,'하 책 '+String(30-i).padStart(2,'0'))),...Array.from({length:24},(_,i)=>make(201+i,'가 같은 제목',i%2?'꽃별':'초록별')),...['다 별','나 이야기','BOOK','book','구름 학교'.normalize('NFD'),'구름 학교','😀','\uE000'].map((t,i)=>make(300+i,t))];
  window.orderCalls=[];window.orderReplies=[];window.orderShared=true;window.orderFail=false;window.orderDelay=false;
  const normal=s=>s.normalize('NFC').replace(/\s+/gu,' ').trim().toLowerCase();
  const bytes=s=>new TextEncoder().encode(normal(s));const compare=(a,b)=>{a=bytes(a);b=bytes(b);for(let i=0;i<Math.min(a.length,b.length);i++)if(a[i]!==b[i])return a[i]-b[i];return a.length-b.length};
  const base=db.rpc.bind(db);db.rpc=async(n,a)=>{if(!['student_reading_shelf_ordered','student_reading_shelf_find','student_reading_shelf_search','student_reading_bookmarks'].includes(n))return base(n,a);orderCalls.push({n,a});if(orderFail)return {error:{message:'offline'}};
   let rows=mockRpg.student.id===987?orderRows.slice():[make(900,'다른 계정 글')],mode=a.p_sort||'newest';
   if(n==='student_reading_bookmarks')rows=orderShared?rows.filter(r=>a.p_ids.includes(r.review_id)):[];
   if(a.p_scope==='class'&&!orderShared)rows=[];if(a.p_title)rows=rows.filter(r=>normal(r.book_title).includes(normal(a.p_title)));if(a.p_author)rows=rows.filter(r=>r.author_nickname.includes(a.p_author));
   rows.sort((a,b)=>mode==='title'?(compare(a.book_title,b.book_title)||a.review_id-b.review_id):mode==='oldest'?a.review_id-b.review_id:b.review_id-a.review_id);
   if(a.p_before_id)rows=rows.filter(r=>r.review_id<a.p_before_id);if(a.p_after)rows=rows.filter(r=>mode==='oldest'?r.review_id>a.p_after.id:mode==='newest'?r.review_id<a.p_after.id:compare(r.book_title,a.p_after.key)>0||(compare(r.book_title,a.p_after.key)===0&&r.review_id>a.p_after.id));
   const items=n==='student_reading_bookmarks'?rows:rows.slice(0,20),last=items.at(-1),result={data:{reviews:items,has_more:n!=='student_reading_bookmarks'&&rows.length>20,next_before_id:last?.review_id||null,next_cursor:last?{sort:mode,id:last.review_id,key:mode==='title'?normal(last.book_title):null}:null,class_sharing:orderShared}};
   if(orderDelay)return new Promise(resolve=>orderReplies.push(()=>resolve(result)));return result;
  };openReadingShelf();
 });await ready(20)};
 const ready=n=>f.waitForFunction(n=>document.querySelectorAll('.shelf-book').length===n&&document.querySelector('#shelfStatus').textContent.includes('편을 펼쳤어요'),n);
 const ids=()=>f.locator('[data-shelf-pin]').evaluateAll(es=>es.map(e=>Number(e.dataset.shelfPin)));
 const select=async(mode,n=20)=>{await f.locator('#shelfOrder').selectOption(mode);await ready(n)};
 const all=async()=>{for(let n=0;n<5&&!await f.locator('[data-shelf-more]').isHidden();n++){const count=await f.locator('.shelf-book').count();await f.locator('[data-shelf-more]').tap();await f.waitForFunction(count=>document.querySelectorAll('.shelf-book').length>count,count)}};
 await boot();assert.equal(await f.locator('#shelfOrder').inputValue(),'newest');assert.equal((await ids())[0],307);
 // Native keyboard selection changes the whole query, not only the first visible page.
 await f.locator('#shelfOrder').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await ready(20);assert.equal(await f.locator('#shelfOrder').inputValue(),'oldest');assert.deepEqual(await ids(),Array.from({length:20},(_,i)=>101+i));await all();
 const oldest=[...Array.from({length:31},(_,i)=>101+i),...Array.from({length:24},(_,i)=>201+i),...Array.from({length:8},(_,i)=>300+i)];assert.deepEqual(await ids(),oldest);
 await select('title');await all();const titleIds=[302,303,...Array.from({length:24},(_,i)=>201+i),304,305,301,300,...Array.from({length:31},(_,i)=>131-i),307,306];assert.deepEqual(await ids(),titleIds);
 await f.locator('#shelfTitleQuery').fill('가 같은');await f.locator('#shelfAuthorForm [type=submit]').tap();await ready(20);await f.locator('[data-shelf-more]').tap();await ready(24);assert.deepEqual(await ids(),Array.from({length:24},(_,i)=>201+i));assert.equal(await f.evaluate(()=>orderCalls.at(-1).a.p_after.id),220);
 await f.locator('#shelfAuthorQuery').fill('꽃별');await select('oldest',12);assert.deepEqual(await ids(),Array.from({length:12},(_,i)=>202+2*i));assert.equal(await f.evaluate(()=>orderCalls.at(-1).a.p_after),null);
 await f.locator('[data-shelf-scope=class]').tap();await ready(12);assert.equal(await f.locator('#shelfOrder').inputValue(),'oldest');assert.equal(await f.locator('#shelfTitleQuery').inputValue(),'가 같은');
 await f.locator('[data-shelf-clear]').tap();await ready(20);assert.equal(await f.locator('#shelfOrder').inputValue(),'oldest');
 await f.evaluate(()=>window.orderFail=true);await f.locator('#shelfOrder').selectOption('title');await f.locator('[data-shelf-retry]').waitFor();assert.equal(await f.locator('#shelfOrder').inputValue(),'title');await f.evaluate(()=>window.orderFail=false);await f.locator('[data-shelf-retry]').tap();await ready(20);
 await f.evaluate(()=>window.orderFail=true);await f.locator('[data-shelf-more]').tap();await f.locator('[data-shelf-retry]').waitFor();const saved=await ids();await f.evaluate(()=>window.orderFail=false);await f.locator('[data-shelf-retry]').tap();await ready(40);assert.deepEqual((await ids()).slice(0,20),saved);assert.equal(new Set(await ids()).size,40);
 await f.evaluate(()=>{window.orderDelay=true;orderReplies=[]});await f.locator('#shelfOrder').selectOption('newest');await f.locator('#shelfOrder').selectOption('oldest');await f.waitForFunction(()=>orderReplies.length===2);await f.evaluate(()=>{orderReplies[1]();orderReplies[0]();orderDelay=false});await ready(20);assert.equal((await ids())[0],101);
 // Bookmarks use the same three orders and preserve their existing jackets and read controls.
 await f.evaluate(()=>{localStorage.setItem('classRpgReadingBookmarks:v1:'+location.pathname+':987',JSON.stringify([306,301,307,302,304,305]));openReadingShelf()});await ready(20);await f.locator('[data-shelf-scope=pins]').tap();await ready(6);assert.deepEqual(await ids(),[307,306,305,304,302,301]);
 await select('title',6);assert.deepEqual(await ids(),[302,304,305,301,307,306]);const jacket=await f.locator('.shelf-book-cover').first().evaluate(e=>e.outerHTML);await select('oldest',6);assert.deepEqual(await ids(),[301,302,304,305,306,307]);await select('title',6);assert.equal(await f.locator('.shelf-book-cover').first().evaluate(e=>e.outerHTML),jacket);
 await f.evaluate(()=>window.orderShared=false);await select('oldest',0);assert.match(await f.locator('.shelf-note').textContent(),/공개가 취소/);await page.keyboard.press('Escape');
 await boot();assert.equal(await f.locator('#shelfOrder').inputValue(),'newest');await f.locator('[data-shelf-scope=pins]').tap();await ready(6);
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});fs.mkdirSync(shots,{recursive:true});
 for(const [width,height] of [[1366,900],[390,844],[320,640]]){
  await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:width===320?'reduce':'no-preference'});await f.evaluate(()=>openReadingShelf());await ready(20);
  await f.locator('#shelfOrder').tap();await page.keyboard.press('End');await page.keyboard.press('Enter');await ready(20);assert.equal(await f.locator('#shelfOrder').inputValue(),'title');
  await f.locator('#shelfTitleQuery').fill('나 이야기');await f.locator('#shelfAuthorForm [type=submit]').tap();await ready(1);await f.evaluate(()=>document.fonts.ready);
  assert(await f.locator('#readingShelf').evaluate(e=>e.scrollWidth<=e.clientWidth+1));for(const control of await f.locator('#readingShelf button,#readingShelf input,#readingShelf select').all()){if(await control.isVisible()){const r=await control.boundingBox();assert(r.width>=44&&r.height>=44)}}
  await f.locator('.shelf-search-actions').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'reading-order-'+width+'.png'),fullPage:true});await f.locator('.shelf-book summary').tap();assert(await f.locator('.shelf-review').isVisible());if(width===320){await f.locator('.shelf-review').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'reading-order-read-320.png'),fullPage:true})}await page.keyboard.press('Escape');
 }
 await f.evaluate(()=>{orderDelay=true;orderReplies=[];openReadingShelf()});await f.waitForFunction(()=>orderReplies.length===1);await f.evaluate(()=>{mockRpg.student.id=988;document.dispatchEvent(new Event('student-dashboard-updated'));orderReplies[0]();orderDelay=false});await page.waitForTimeout(50);assert(!await f.locator('#readingShelf').isVisible());assert.equal(await f.locator('.shelf-book').count(),0);
 await f.evaluate(()=>openReadingShelf());await ready(1);assert.equal(await f.locator('#shelfOrder').inputValue(),'newest');assert.equal(await f.locator('.shelf-book h3').textContent(),'다른 계정 글');await f.locator('[data-shelf-scope=pins]').tap();await ready(0);
 assert.deepEqual(await f.evaluate(()=>[mockRpg.student.xp,mockRpg.student.gold]),[260,180]);assert.deepEqual(errors,[]);
 console.log('PASS audit15: whole-shelf newest/oldest/title order, same-title page boundary, normalized Unicode/ties, search+author+scope/clear/reset, stable bookmarks/covers, first/next-page retry, stale order/account responses, reconnect, native keyboard/touch,1366/390/320,4x CPU/reduced motion. Synthetic UI data; physical device/student observation untested.');
}finally{await browser.close();server.closeAllConnections();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
