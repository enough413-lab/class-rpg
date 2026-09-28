-- Run only on the staging database; all fixture changes roll back.
begin;
do $test$
declare sid bigint; tid uuid; qid bigint; kind text; t text:=gen_random_uuid()::text; blocked boolean; r record;
begin
 select id,teacher_id into sid,tid from public.students order by id limit 1;
 if sid is null then raise exception 'Test student missing'; end if;
 update public.students set session_hash=encode(extensions.digest(convert_to(t,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '1 hour' where id=sid;
 foreach kind in array array['daily','weekly','main'] loop
  insert into public.quests(teacher_id,title,quest_type) values(tid,'Temporary evidence regression',kind) returning id into qid;
  if kind='main' then perform public.student_accept_quest(t,qid); end if;
  perform public.student_submit_quest_evidence(t,qid,'설명 저장 검사','data:image/png;base64,aGVsbG8=');
  select * into r from public.quest_submissions where student_id=sid and quest_id=qid;
  if r.status<>'submitted' or r.report_text<>'설명 저장 검사' or r.evidence_image is null or r.period_key<>public.quest_period_key(kind) then raise exception 'Save failed: %',kind; end if;
  blocked:=false;
  begin perform public.student_submit_quest_evidence(t,qid,'overwrite',null); exception when others then blocked:=true; end;
  if not blocked then raise exception 'Duplicate allowed: %',kind; end if;
  if kind<>'main' then
   update public.quest_submissions set status='rejected',rejection_reason='retry' where id=r.id;
   perform public.student_submit_quest_evidence(t,qid,'',null);
   select * into r from public.quest_submissions where id=r.id;
   if r.report_text is not null or r.evidence_image is not null or r.rejection_reason is not null or r.status<>'submitted' then raise exception 'Optional/retry failed'; end if;
   update public.quest_submissions set status='approved' where id=r.id;
   blocked:=false;
   begin perform public.student_submit_quest_evidence(t,qid,'overwrite',null); exception when others then blocked:=true; end;
   if not blocked then raise exception 'Approved overwritten'; end if;
  end if;
 end loop;
 blocked:=false;
 begin perform public.student_submit_quest_evidence('invalid-token',qid,'x',null); exception when others then blocked:=true; end;
 if not blocked then raise exception 'Invalid token allowed'; end if;
end $test$;
rollback;
select 'PASS: daily/weekly/main save, period keys, optional fields, rejected retry, duplicate/approved guard, invalid token; test data rolled back' as result;
