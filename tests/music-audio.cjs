const assert=require('node:assert/strict');const {chromium}=require('playwright');const {server}=require('./student-fixture.cjs');
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{const page=await browser.newPage();await page.route('https://**',r=>r.abort());await page.goto('http://127.0.0.1:'+server.address().port);
 const results=await page.evaluate(async()=>{
  const {MUSIC_STEPS,createMusicPlayer}=await import('/music-room.js');const results=[];
  for(const step of MUSIC_STEPS){
   let ctx,stopped=false;const player=createMusicPlayer(()=>{}, {AudioContext:class {constructor(){ctx=new OfflineAudioContext(1,4*48000,48000);ctx.resume=async()=>{};return ctx}},clearTimeout(){},setTimeout(){return 1}});
   await player.play(step.notes);const buffer=await ctx.startRendering(),wave=buffer.getChannelData(0);let at=.06;const notes=[];
   for(const note of step.notes){const first=Math.floor((at+.06)*48000),last=Math.floor((at+note.duration-.06)*48000);let energy=0,cross=0;for(let i=first;i<last;i++){energy+=wave[i]*wave[i];if(wave[i]<=0&&wave[i+1]>0)cross++}notes.push({hz:cross/((last-first)/48000),rms:Math.sqrt(energy/(last-first)),expected:note.hz});at+=note.duration+.32}
   player.stop();results.push({id:step.id,notes,peak:Math.max(...wave.subarray(0,48000).map(Math.abs))});
  }
  // A stop while AudioContext.resume is pending must not create a late sound.
  let resume,started=0;const states=[];const pending=createMusicPlayer(x=>states.push(x),{AudioContext:class{resume(){return new Promise(r=>resume=r)}createGain(){started++;throw Error('late gain')}},clearTimeout(){},setTimeout(){}});const p=pending.play(MUSIC_STEPS[0].notes);pending.stop();resume();await p;
  return {results,started,states};
 });
 for(const result of results.results){assert(result.peak<.06);for(const n of result.notes){if(n.expected){assert(Math.abs(n.hz-n.expected)<8);assert(n.rms>.03&&n.rms<.045)}else assert.equal(n.rms,0)}}assert.equal(results.started,0);assert(!results.states.includes('playing'));
 console.log('PASS: real OfflineAudioContext renders planned pitches, quiet equal volume, silent rest, and cancellation before delayed resume; no human listening claim');
 }finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
