-- STAGING ONLY. Synthetic fixtures and session changes are rolled back.
begin;
create function pg_temp.expect_submission_rejected(t text,q bigint,report text,image text)
returns void language plpgsql as $$
declare blocked boolean:=false;
begin
 begin perform public.student_submit_quest_evidence(t,q,report,image);
 exception when others then blocked:=true; end;
 if not blocked then raise exception 'Invalid submission accepted for quest %',q; end if;
end; $$;
do $test$
declare sid bigint; tid uuid; qid bigint; kind text; mode text; t text:=gen_random_uuid()::text;
 pic text:='data:image/png;base64,aGVsbG8='; photos text; r record; blocked boolean; before_time timestamptz;
begin
 select id,teacher_id into sid,tid from public.students order by id limit 1;
 if sid is null then raise exception 'Missing staging student'; end if;
 update public.students set session_hash=encode(extensions.digest(convert_to(t,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '1 hour' where id=sid;
 photos:=jsonb_build_array(pic,pic)::text;
 foreach kind in array array['daily','weekly','main'] loop
  foreach mode in array array['photo','text','both'] loop
   insert into public.quests(teacher_id,title,quest_type,submission_mode) values(tid,'Temporary submission mode test',kind,mode) returning id into qid;
   if not exists(select 1 from jsonb_array_elements(public.student_dashboard(t)->'quests') q where (q->>'id')::bigint=qid and q->>'submission_mode'=mode) then raise exception 'Dashboard missing mode'; end if;
   if kind='main' then perform public.student_accept_quest(t,qid); end if;
   perform pg_temp.expect_submission_rejected(t,qid,'',null);
   perform pg_temp.expect_submission_rejected(t,qid,E' \t\n',null);
   if mode='text' then
    perform pg_temp.expect_submission_rejected(t,qid,'내용',photos);
   elsif mode='photo' then
    perform pg_temp.expect_submission_rejected(t,qid,'내용',photos);
   else
    perform pg_temp.expect_submission_rejected(t,qid,'내용',null);
    perform pg_temp.expect_submission_rejected(t,qid,'',photos);
   end if;
   if mode<>'text' then
    perform pg_temp.expect_submission_rejected(t,qid,case when mode='both' then '내용' else '' end,'[]');
    perform pg_temp.expect_submission_rejected(t,qid,case when mode='both' then '내용' else '' end,'[null]');
    perform pg_temp.expect_submission_rejected(t,qid,case when mode='both' then '내용' else '' end,'["javascript:bad"]');
    perform pg_temp.expect_submission_rejected(t,qid,case when mode='both' then '내용' else '' end,'[bad');
    perform pg_temp.expect_submission_rejected(t,qid,case when mode='both' then '내용' else '' end,jsonb_build_array(pic,pic,pic,pic,pic,pic)::text);
   end if;
   blocked:=false;
   begin perform public.student_submit_quest(t,qid); exception when others then blocked:=true; end;
   if not blocked then raise exception 'Legacy RPC bypassed mode'; end if;
   perform public.student_submit_quest_evidence(t,qid,case when mode='photo' then '' else '수행한 내용' end,case when mode='text' then null else photos end);
   select * into r from public.quest_submissions where student_id=sid and quest_id=qid;
   if r.status<>'submitted' then raise exception 'Valid submission failed'; end if;
   before_time:=r.submitted_at;
   if kind<>'main' then
    perform public.student_submit_quest_evidence(t,qid,case when mode='photo' then '' else '수정한 내용' end,case when mode='text' then null else pic end);
    if (select submitted_at from public.quest_submissions where id=r.id)<>before_time then raise exception 'Amendment reset submission time'; end if;
   end if;
   update public.quest_submissions set status='approved' where id=r.id;
   perform pg_temp.expect_submission_rejected(t,qid,case when mode='photo' then '' else '수행한 내용' end,case when mode='text' then null else photos end);
   perform pg_temp.expect_submission_rejected('invalid-session',qid,'내용',photos);
  end loop;
 end loop;
 -- A rule change affects future submissions, without rewriting a submitted record.
 insert into public.quests(teacher_id,title,quest_type,submission_mode) values(tid,'Temporary changed mode','daily','photo') returning id into qid;
 perform public.student_submit_quest_evidence(t,qid,'',pic);
 update public.quests set submission_mode='text' where id=qid;
 if public.student_repeat_quest_record(t,qid)->>'evidence_image'<>pic then raise exception 'Existing evidence changed'; end if;
 perform pg_temp.expect_submission_rejected(t,qid,'',pic);
 perform public.student_submit_quest_evidence(t,qid,'새 방식',null);
 if public.student_repeat_quest_record(t,qid)->>'evidence_image' is not null then raise exception 'Text-only kept a hidden photo'; end if;
 blocked:=false;
 begin update public.quests set submission_mode='invalid' where id=qid; exception when check_violation then blocked:=true; end;
 if not blocked then raise exception 'Mode constraint missing'; end if;
end $test$;
rollback;
select 'PASS: 3 modes x daily/weekly/main; dashboard; required/forbidden fields; photo format/count; legacy bypass blocked; amend/approved/session guards; mode changes; fixtures rolled back' as result;
