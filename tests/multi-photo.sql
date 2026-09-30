-- Staging only. All synthetic submissions, session changes and quest rows roll back.
begin;
do $test$
declare
 sid bigint; tid uuid; qid bigint; kind text; t text:=gen_random_uuid()::text;
 r record; before_time timestamptz; blocked boolean; image text; photos text;
begin
 select id,teacher_id into sid,tid from public.students order by id limit 1;
 if sid is null then raise exception 'Test student missing'; end if;
 update public.students set session_hash=encode(extensions.digest(convert_to(t,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '1 hour' where id=sid;
 image:='data:image/jpeg;base64,'||repeat('A',359976);
 photos:=jsonb_build_array(image,image,image,image,image)::text;
 foreach kind in array array['daily','weekly','main'] loop
  insert into public.quests(teacher_id,title,quest_type) values(tid,'Temporary multi-photo regression',kind) returning id into qid;
  if kind='main' then perform public.student_accept_quest(t,qid); end if;
  perform public.student_submit_quest_evidence(t,qid,'사진 5장',photos);
  select * into r from public.quest_submissions where student_id=sid and quest_id=qid;
  if r.evidence_image<>photos or r.status<>'submitted' then raise exception 'Five-photo save failed: %',kind; end if;
  before_time:=r.submitted_at;
  if kind<>'main' then
   if public.student_repeat_quest_record(t,qid)->>'evidence_image'<>photos then raise exception 'Reload failed'; end if;
   perform public.student_submit_quest_evidence(t,qid,'사진 2장',jsonb_build_array(image,image)::text);
   select * into r from public.quest_submissions where student_id=sid and quest_id=qid;
   if jsonb_array_length(r.evidence_image::jsonb)<>2 or r.submitted_at<>before_time or r.status<>'submitted' then raise exception 'Amendment failed'; end if;
   perform public.student_submit_quest_evidence(t,qid,'기존 한 장',image);
   if public.student_repeat_quest_record(t,qid)->>'evidence_image'<>image then raise exception 'Legacy format failed'; end if;
  end if;
  update public.quest_submissions set status='approved' where id=r.id;
  if public.student_quest_evidence(t,qid)->>'evidence_image'<>(case when kind='main' then photos else image end) then raise exception 'Completed read failed'; end if;
  blocked:=false;
  begin perform public.student_submit_quest_evidence(t,qid,'overwrite',photos); exception when others then blocked:=true; end;
  if not blocked then raise exception 'Approved record overwritten'; end if;
 end loop;
 blocked:=false;
 begin perform public.student_submit_quest_evidence('invalid-token',qid,'x',photos); exception when others then blocked:=true; end;
 if not blocked then raise exception 'Invalid session accepted'; end if;
end $test$;
rollback;
select 'PASS: five-photo payload within existing limit; daily/weekly/main save; pending edit/reload; legacy and completed reads; approved/session guards; all test changes rolled back' as result;
