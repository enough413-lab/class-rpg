const assert=require('node:assert/strict'),crypto=require('node:crypto');
(async()=>{
 const {levelInfo,experienceUntil}=await import('../rpg-progression.js');
 // Independent reference: staging public.rpg_level_for_xp over XP 0..3305,
 // queried 2026-09-30. Includes every level boundary and cap overflow.
 const levels=Array.from({length:3306},(_,xp)=>levelInfo(xp).level).join(',');
 assert.equal(crypto.createHash('md5').update(levels).digest('hex'),'632ffad0fd1635a5b3a3c499a9e7b10b');
 for(const [xp,level,left] of [[0,1,50],[49,1,1],[50,2,60],[259,4,1],[260,5,90],[3154,29,1],[3155,30,0]]){
  const info=levelInfo(xp);assert.equal(info.level,level);assert.equal(info.max?0:info.need-info.cur,left);
 }
 assert.equal(experienceUntil(260,6),90);assert.equal(experienceUntil(350,6),0);
 for(const invalid of [-10,NaN,Infinity,'oops'])assert.equal(levelInfo(invalid).level,1);
 console.log('PASS: all 3,306 XP values match the staging server; boundaries, remaining XP and Lv.30 cap.');
})().catch(e=>{console.error(e);process.exitCode=1});
