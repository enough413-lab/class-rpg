const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright'),{server,shots}=require('./student-fixture.cjs');
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:1366,height:900},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://**',r=>r.abort());await p.goto('http://127.0.0.1:'+server.address().port);let f;fs.mkdirSync(shots,{recursive:true});
 const ready=async()=>{f=p.frames().find(x=>x.url().includes('app-core'));await f.waitForFunction(()=>window.studentCampus?.parcel.snapshot().loaded)};await ready();
 const scene=async room=>{await f.evaluate(room=>enterHubScene(room),room);await f.locator('.campus-scene-status').waitFor({state:'hidden'})};
 const account=async id=>f.evaluate(async id=>{mockRpg.student.id=id;await loadDashboard()},id);
 const raw=()=>f.evaluate(()=>localStorage.getItem('classRpgNpcTrio_v1_'+mockRpg.student.id));
 const saved=async()=>JSON.parse(await raw());
 const seed=async(id,s)=>{await f.evaluate(({id,s})=>localStorage.setItem('classRpgNpcTrio_v1_'+id,JSON.stringify(s)),{id,s});await account(id);await scene('library')};
 const go=async kind=>{await p.emulateMedia({reducedMotion:'reduce'});if(kind.startsWith('trio-')){await f.evaluate(kind=>{const x=parseFloat(document.querySelector('[data-place="'+kind+'"]').style.left);for(let i=0;i<50;i++){const n=parseFloat(document.getElementById('hubPlayer').style.left);if(Math.abs(n-x)<1.6)break;moveHub(Math.sign(x-n),0)}},kind)}else{await f.locator('[data-campus=find]').tap();await f.locator('[data-finder-place='+kind+']').tap();await f.locator('.campus-waypoint[data-state=arrived]').waitFor()}};
 const use=async kind=>{await go(kind);await f.locator('#campusTitle').focus();await p.keyboard.press('ArrowUp');await f.locator('#npcTrio').waitFor()};
 const act=async a=>f.locator('[data-trio='+a+']').first().tap();
 const book=()=>f.locator('[data-place=trio-shelf]>.trio-returned-book');
 const name=round=>['초록','파랑','분홍'][Math.floor(round%6/2)]+' 표지·'+['달','잎','별'][(Math.floor(round%6/2)+round%2+round)%3]+' 무늬 책';
 const fit=async selector=>{const v=p.viewportSize(),b=await f.locator(selector).boundingBox();assert(b&&b.x>=-1&&b.x+b.width<=v.width+1&&b.y>=-1&&b.y+b.height<=v.height+1,selector+' fits '+JSON.stringify({b,v}))};
 const shown=async round=>{assert.equal(await book().count(),1);assert.equal(await book().getAttribute('data-returned'),String(round));assert.equal(await book().getAttribute('aria-label'),'토리에게 돌려준 '+name(round));assert.equal(await book().locator('svg>rect').first().getAttribute('fill'),['#739d63','#6c9fbd','#c48392'][Math.floor(round%6/2)])};
 const other={garden:{phase:3,round:2,wins:4},duri:{phase:3,round:3,wins:5,attempts:2,best:[1,2,3,4]},link:{step:5,round:1,wins:2,attempts:3,decor:2}};
 // Old completed records have exact evidence; display all six variants without rewriting storage.
 for(let round=0;round<6;round++){
  const s={v:1,...other,tori:{phase:3,round,wins:7,clues:3}};await seed(31000+round,s);await go('tori');await shown(round);await use('tori');assert((await f.locator('.trio-content').textContent()).includes(name(round)));assert.equal(await raw(),JSON.stringify(s));await act('close');
 }
 // Old in-progress saves never fabricate the previous cover, nor rewrite on read/reload.
 for(const returnedRound of [undefined,-1,1000000,'2']){
  const s={v:1,...other,tori:{phase:1,round:4,wins:9,clues:1,...(returnedRound===undefined?{}:{returnedRound})}},id=32000+[undefined,-1,1000000,'2'].indexOf(returnedRound);
  await seed(id,s);await use('tori');assert.equal(await book().getAttribute('data-returned'),'unknown');assert.match(await f.locator('.trio-content').textContent(),/전에 찾아준 책은 잘 있어/);assert.equal(await raw(),JSON.stringify(s));await act('close');
 }
 await p.reload();await ready();await account(32000);await scene('library');assert.equal(await book().getAttribute('data-returned'),'unknown');
 for(const [width,height]of [[1366,900],[390,844],[320,640]]){
  await p.setViewportSize({width,height});const cdp=await p.context().newCDPSession(p);if(width===390)await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const id=33000+width,initial={v:1,...other,tori:{phase:3,round:1,wins:7,clues:3}};await seed(id,initial);await use('tori');await shown(1);const standing=await f.locator('#hubPlayer').getAttribute('style');await act('accept');assert.equal(await f.locator('#hubPlayer').getAttribute('style'),standing);assert.equal((await saved()).tori.returnedRound,1);await shown(1);
  for(const k of ['trio-clue-color','trio-clue-motif']){await use(k);await act('note')}await use('trio-books');await f.locator('[data-book="2"]').focus();await p.keyboard.press('Enter');assert.equal((await saved()).tori.phase,2);assert(await f.locator('.trio-held-book').isVisible());await shown(1);
  // The first book remains during a new carry, doorway trip and reload.
  await scene('garden');assert.equal(await book().count(),0);assert(await f.locator('.trio-held-book').isVisible());await scene('library');await go('tori');await shown(1);await p.screenshot({path:path.join(shots,'tori-previous-book-carry-'+width+'.png'),fullPage:true});
  const heldSave=await saved();await p.reload();await ready();await account(id);await scene('library');await shown(1);assert.deepEqual(await saved(),heldSave);await use('tori');await f.evaluate(()=>window.oldReturn=document.querySelector('[data-trio=return]'));await act('close');await go('nook');await f.evaluate(()=>{document.getElementById('npcTrio').showModal();oldReturn.click()});assert.equal((await saved()).tori.phase,2);await shown(1);assert(await f.locator('#npcTrio').isHidden());
  await use('tori');await act('return');await shown(2);assert.equal((await saved()).tori.returnedRound,2);assert.equal((await saved()).tori.wins,8);assert((await f.locator('.trio-content').textContent()).includes(name(2)));assert.match(await f.locator('.trio-feedback').textContent(),/고마워.*한 권 더 모았어/);assert(await f.locator('.trio-held-book').isHidden());await fit('#npcTrio');assert.equal(await f.locator('.trio-choices>button').count(),2);await p.screenshot({path:path.join(shots,'tori-return-memory-'+width+'.png'),fullPage:true});await act('close');await p.screenshot({path:path.join(shots,'tori-returned-book-'+width+'.png'),fullPage:true});
  const result=await saved();for(const k of Object.keys(other))assert.deepEqual(result[k],other[k]);await f.evaluate(()=>oldReturn.click());assert.deepEqual(await saved(),result,'Old return cannot duplicate completion');await scene('classroom');await scene('library');await shown(2);await use('tori');await act('accept');assert.equal((await saved()).tori.round,3);await shown(2);await use('tori');assert((await f.locator('.trio-content').textContent()).includes(name(2)));await act('close');
  await account(id+10000);await scene('library');assert.equal(await book().count(),0);assert.equal(await saved(),null);await f.evaluate(()=>oldReturn.click());assert.equal(await saved(),null);await account(id);await scene('library');await shown(2);
  if(width===390)await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
 }
 // Return save failure shows the real in-session result with retry, never extra wins.
 await seed(49000,{v:1,...other,tori:{phase:2,round:5,wins:8,clues:3,returnedRound:4}});await use('tori');await f.evaluate(()=>{window.realSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.includes('NpcTrio'))throw Error('quota');return realSet.call(this,k,v)}});await act('return');await shown(5);assert.equal((await saved()).tori.phase,2);assert.equal((await saved()).tori.returnedRound,4);assert(await f.locator('[data-trio=save]').isVisible());await f.evaluate(()=>Storage.prototype.setItem=realSet);await act('save');assert.equal((await saved()).tori.returnedRound,5);assert.equal((await saved()).tori.wins,9);await act('close');await p.reload();await ready();await account(49000);await scene('library');await shown(5);
 // Round rollover preserves the actual prior return, not an inferred round minus one.
 await seed(49001,{v:1,...other,tori:{phase:3,round:999998,wins:999999,clues:3}});await use('tori');await act('accept');assert.equal((await saved()).tori.round,0);await shown(999998);
 assert.deepEqual(await f.evaluate(()=>[mockRpg.student.xp,mockRpg.student.gold]),[260,180]);assert.deepEqual(errors,[]);console.log('PASS returned-book cover/motif and short Tori memory; legacy no-write/unknown fallback; new request/carry keeps prior return; actual handoff updates once; reload/accounts/stale-distance/save retry/rollover; 1366/390/320 keyboard/browser touch/4xCPU; unchanged other records and economy');
}finally{await browser.close();server.closeAllConnections();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
