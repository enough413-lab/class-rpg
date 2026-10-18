// Optional live-development test. Credentials live only in an untracked temporary file outside the repo.
const assert=require('node:assert/strict'),fs=require('fs'),{chromium}=require('playwright'),{server}=require('./student-fixture.cjs');
if(!process.env.TITLE_HTTP_FIXTURE)throw Error('Provide a newly created synthetic development fixture');
const fixture=JSON.parse(fs.readFileSync(process.env.TITLE_HTTP_FIXTURE,'utf8'));
const source=fs.readFileSync('app-core.html','utf8'),config=source.match(/createClient\('(https:\/\/gcgjpfidppaioambcatq.supabase.co)','([^']+)'/);assert(config,'Development-only API required');
const rpc=async(args,token=fixture.token)=>{const r=await fetch(config[1]+'/rest/v1/rpc/student_reading_shelf_find',{method:'POST',headers:{apikey:config[2],'Content-Type':'application/json'},body:JSON.stringify({...args,p_token:token})});const data=await r.json();return r.ok?{data}:{error:data}};
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({headless:true,channel:'msedge'});
try{
 const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true});await p.route('https://**',r=>r.abort());await p.exposeFunction('titleHttp',rpc);let f;
 const boot=async()=>{await p.goto('http://127.0.0.1:'+server.address().port);f=p.frames().find(f=>f.url().includes('app-core'));await f.waitForFunction(()=>window.openReadingShelf);await f.evaluate(()=>{const base=db.rpc.bind(db);db.rpc=(n,a)=>n==='student_reading_shelf_find'?window.titleHttp(a):base(n,a);openReadingShelf()});await f.locator('.shelf-book').first().waitFor()};
 const search=async(q,n)=>{await f.locator('#shelfTitleQuery').fill(q);await f.locator('#shelfAuthorForm [type=submit]').tap();await f.waitForFunction(n=>document.querySelectorAll('.shelf-book').length===n&&document.querySelector('#shelfStatus').textContent.startsWith('찾은 글'),n)};
 await boot();await search('API 구름',1);assert.equal(await f.locator('.shelf-book h3').textContent(),'오래된 API 구름 학교');
 await search('다른 API',20);await f.locator('[data-shelf-more]').tap();await f.waitForFunction(()=>document.querySelectorAll('.shelf-book').length===25);assert.equal(new Set(await f.locator('.shelf-book h3').allTextContents()).size,25);
 await boot();await search('API 구름',1);await f.locator('.shelf-book summary').tap();assert.match(await f.locator('.shelf-review').textContent(),/합성 API 줄거리/);
 const bad=await rpc({p_scope:'mine',p_title:'API'},'invalid-title-test-token');assert(bad.error);assert.equal(bad.error.code,'P0001');
 const valid=await rpc({p_scope:'mine',p_title:'API 구름'});assert.equal(valid.data.reviews.length,1);assert.deepEqual(Object.keys(valid.data.reviews[0]).sort(),['author_nickname','book_title','mine','read_date','recommendation_rating','recommendation_reason','review_id','status','summary','thoughts'].sort());
 console.log('PASS actual development HTTP RPC through reading-shelf UI: old title, filtered 20+5 pages without duplicates, native mobile touch, reopen/reload/read details, invalid session denied and private fields absent. Synthetic data only; fixture cleanup required.');
}finally{await b.close();server.closeAllConnections();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
