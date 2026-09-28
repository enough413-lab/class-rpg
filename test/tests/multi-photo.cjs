// Run: NODE_PATH=<directory containing playwright> node tests/multi-photo.cjs
// Uses only synthetic records and a mocked RPC; no remote requests are allowed.
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const fixture=`
current={id:987,nickname:'테스트',xp:0,gold:0};token='fixture';
dashboardQuests=[{id:11,title:'매일 책 읽기',quest_type:'daily',status:'available'},{id:12,title:'주간 기록',quest_type:'weekly',status:'submitted'},{id:13,title:'메인 모험',quest_type:'main',status:'accepted'}];
loadDashboard=async()=>{};window.loadDashboard=loadDashboard;window.testReady=true;
`;
const mock=`const createClient=()=>({rpc:async(name,args)=>{
 if(name==='student_repeat_quest_record')return {data:{status:'submitted',report_text:'기존 제출 기록',evidence_image:window.savedImage||null},error:null};
 if(name==='student_quest_evidence')return {data:{report_text:'완료',evidence_image:window.savedImage},error:null};
 if(name==='student_submit_quest_evidence'){window.calls.push(args);if(window.failSubmit)return {error:{message:'테스트 연결 오류'}};window.savedImage=args.p_image;}
 return {data:[],error:null};}});window.calls=[];`;
const teacher=`<!doctype html><html lang="ko"><meta charset="utf-8"><div id="reviews"></div><script type="module">
import {createQuestReviews,currentQuestPeriod} from '/teacher-quest-reviews.js';
window.initReviews=async image=>{
 const rows=[{id:1,student_id:1,quest_id:1,status:'submitted',period_key:currentQuestPeriod('daily'),report_text:'사진 다섯 장',evidence_image:image}];
 const data={quests:[{id:1,title:'매일 책 읽기',quest_type:'daily',active:true}],students:[{id:1,student_number:1,nickname:'테스트'}],quest_submissions:rows};
 const db={from(table){const q={select(){return q},eq(){return q},order(){return q},async range(a,b){return {data:data[table].slice(a,b+1)}}};return q},async rpc(){return {data:[],error:null}}};
 const ui=createQuestReviews({root:document.querySelector('#reviews'),db,refresh:()=>ui.load(),onCount:()=>{}});await ui.load();
};</script></html>`;
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/teacher-photo-test'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(teacher);}
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
 if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end();}
 try{let content=fs.readFileSync(file);if(file.endsWith('app-core.html')){
  content=content.toString().replace(/import\{createClient\}from'[^']+';/,mock);
  const pos=content.lastIndexOf('</script>');content=content.slice(0,pos)+fixture+content.slice(pos);
 }res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(content);
 }catch{res.statusCode=404;res.end();}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:process.env.TEST_BROWSER_CHANNEL||'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());
  const base=`http://127.0.0.1:${server.address().port}`;
  await page.goto(base+'/app-core.html');await page.waitForFunction(()=>window.testReady);
  // Distinct, valid pictures exercise real decoding, orientation and compression.
  const pics=await page.evaluate(()=>['#ed7565','#568d67','#5a7dcd','#e5b651','#9266a3'].map((color,i)=>{
   const c=document.createElement('canvas');c.width=900;c.height=600;const x=c.getContext('2d');x.fillStyle=color;x.fillRect(0,0,900,600);x.fillStyle='white';x.font='100px sans-serif';x.fillText('PHOTO '+(i+1),80,320);return c.toDataURL('image/png');
  }));
  const files=pics.map((pic,i)=>({name:`photo${i+1}.png`,mimeType:'image/png',buffer:Buffer.from(pic.split(',')[1],'base64')}));
  const upload=async list=>{await page.locator('#progressQuestPhoto').setInputFiles(list);await page.waitForFunction(()=>!document.querySelector('#progressQuestSubmit').disabled);};
  const count=async n=>assert.equal(await page.locator('#progressQuestPreview img').count(),n);
  await page.evaluate(()=>submitQuest(11));await page.locator('#progressQuestText').fill('오늘 책을 읽었어요.');
  await upload(files.slice(0,2));await count(2);await upload(files.slice(2,4));await count(4);
  await page.getByRole('button',{name:'사진 2 삭제',exact:true}).click();await count(3);
  await upload([files[1],files[4]]);await count(5);
  await upload([files[0]]);await count(5);assert.match(await page.locator('#progressQuestMsg').textContent(),/최대 5장/);
  await page.evaluate(()=>closeProgressQuest());await page.reload();await page.waitForFunction(()=>window.testReady);await page.evaluate(()=>submitQuest(11));await count(5);
  assert.equal(await page.locator('#progressQuestText').inputValue(),'오늘 책을 읽었어요.');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.evaluate(()=>window.failSubmit=true);await page.locator('#progressQuestSubmit').click();await count(5);
  assert.match(await page.locator('#progressQuestMsg').textContent(),/테스트 연결 오류/);
  await page.evaluate(()=>window.failSubmit=false);await page.locator('#progressQuestSubmit').click();
  const payload=await page.evaluate(()=>window.calls.at(-1).p_image);assert.equal(JSON.parse(payload).length,5);assert(payload.length<2000000);
  assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('classRpgQuestDraft:')).length),0);
  await page.evaluate(()=>openProgressQuest(12));await count(5);await page.getByRole('button',{name:'사진 3 삭제',exact:true}).click();await count(4);
  await page.locator('#progressQuestSubmit').click();assert.equal(await page.evaluate(()=>JSON.parse(window.calls.at(-1).p_image).length),4);
  await page.evaluate(()=>openCompletedQuest(13));assert.equal(await page.locator('#completedRecordBody img').count(),4);await page.evaluate(()=>closeCompletedQuest());
  await page.evaluate(pic=>window.savedImage=pic,pics[0]);await page.evaluate(()=>openProgressQuest(12));await count(1);
  await upload([{name:'bad.jpg',mimeType:'image/jpeg',buffer:Buffer.from('not an image')}]);await count(1);
  assert.match(await page.locator('#progressQuestMsg').textContent(),/読み|읽을 수 없는/);
  await upload([{name:'bad.txt',mimeType:'text/plain',buffer:Buffer.from('text')}]);await count(1);assert.match(await page.locator('#progressQuestMsg').textContent(),/사진 파일만/);
  await page.getByRole('button',{name:'사진 1 삭제',exact:true}).click();await page.locator('#progressQuestText').fill('');await page.locator('#progressQuestSubmit').click();
  assert.equal(await page.evaluate(()=>window.calls.at(-1).p_image),null);
  await page.evaluate(()=>openProgressQuest(13));await page.locator('#progressQuestSubmit').click();assert.match(await page.locator('#progressQuestMsg').textContent(),/한 줄/);
  await page.locator('#progressQuestText').fill('메인 완료');await upload(files.slice(0,2));await page.locator('#progressQuestSubmit').click();
  assert.equal(await page.evaluate(()=>JSON.parse(window.calls.at(-1).p_image).length),2);
  // Large existing photos are resized when adding more, preserving compatibility.
  const helpers=await page.evaluate(async()=>{
   const m=await import('/quest-photos.js');const c=document.createElement('canvas');c.width=c.height=1800;
   const ctx=c.getContext('2d'),pixels=ctx.createImageData(1800,1800);for(let i=0;i<pixels.data.length;i+=4){pixels.data[i]=i%251;pixels.data[i+1]=(i*17)%253;pixels.data[i+2]=(i*37)%255;pixels.data[i+3]=255;}ctx.putImageData(pixels,0,0);
   const old=c.toDataURL('image/png');const prepared=await m.prepareEvidencePhotos([old],[]);
   return {oldSize:old.length,newSize:prepared.length,bad:m.readEvidenceImages('["javascript:alert(1)",null,{}]'),legacy:m.readEvidenceImages(old).length};
  });assert(helpers.oldSize>360000);assert(helpers.newSize<=360000);assert.equal(helpers.legacy,1);assert.deepEqual(helpers.bad,[]);
  await page.goto(base+'/teacher-photo-test');await page.waitForFunction(()=>window.initReviews);await page.evaluate(image=>initReviews(image),payload);
  await page.locator('[data-quest="1"]').click();await page.locator('[data-open-student="1"]').click();assert.equal(await page.locator('.qr-photos img').count(),5);
  for(let i=0;i<5;i++){
   const expected=await page.locator(`[data-photo-index="${i}"] img`).getAttribute('src');
   await page.locator(`[data-photo-index="${i}"]`).click();assert.equal(await page.locator('.qr-zoom img').getAttribute('src'),expected);await page.locator('.qr-zoom button').click();
  }
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS: 5-photo selection/append/delete/limit, reload drafts, failed-submit retention, daily/weekly/main submission, completed gallery, legacy single-photo, invalid files, compression/payload bound, teacher gallery and each zoom; no runtime errors.');
 }finally{await browser.close();server.closeAllConnections();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
