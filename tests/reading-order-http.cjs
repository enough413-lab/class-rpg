// Actual development HTTP smoke check without creating or renewing any account.
// Valid-session sorting and access rules are tested by the rollback SQL suite.
const fs=require('fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('app-core.html','utf8'),config=source.match(/createClient\('(https:\/\/gcgjpfidppaioambcatq.supabase.co)','([^']+)'/);assert(config,'Development API required');
(async()=>{for(const mode of ['newest','oldest','title']){
 const r=await fetch(config[1]+'/rest/v1/rpc/student_reading_shelf_ordered',{method:'POST',signal:AbortSignal.timeout(15000),headers:{apikey:config[2],'Content-Type':'application/json'},body:JSON.stringify({p_token:'invalid-audit15-smoke',p_scope:'mine',p_author:'',p_title:'',p_sort:mode,p_after:null})});
 const result=await r.json();assert(!r.ok);assert.equal(result.code,'P0001');assert.match(result.message,/다시 로그인/);assert(!result.reviews);
}console.log('PASS actual development HTTP: ordered RPC registered for all three modes and rejects invalid sessions. Valid-session paging covered by rollback SQL, not this HTTP smoke test. No accounts created or changed.');})().catch(e=>{console.error(e);process.exitCode=1});
