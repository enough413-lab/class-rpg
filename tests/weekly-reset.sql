-- Staging only; fixture records and session changes are rolled back.
begin;
do $test$
declare sid bigint; tid uuid; qid bigint; t text:=gen_random_uuid()::text;
  p text; before_key text; d integer; day_offset integer; stamp timestamptz; actual text; row_data jsonb; blocked boolean;
begin
 if public.quest_period_key_at('weekly',2,'2026-09-28 14:59:59+00') <> '2026-09-22'
 or public.quest_period_key_at('weekly',2,'2026-09-28 15:00:00+00') <> '2026-09-29'
 or public.quest_period_key_at('weekly',7,'2026-01-03 15:00:00+00') <> '2026-01-04'
 or public.quest_period_key_at('weekly',2,'2026-01-01 00:00:00+00') <> '2025-12-30'
 or public.quest_period_key_at('daily',2,'2026-09-28 15:00:00+00') <> '2026-09-29'
 or public.quest_period_key_at('main',2,now()) <> 'once'
 or public.quest_current_period_key('weekly',1) <> public.quest_period_key('weekly')
 then raise exception 'Boundary regression'; end if;
 for d in 1..7 loop
  for day_offset in 0..13 loop
   stamp:=timestamptz '2026-09-28 00:00:00+09'+make_interval(days=>day_offset);
   actual:=public.quest_period_key_at('weekly',d,stamp);
   if extract(isodow from actual::date)::integer<>d
    or actual::date>timezone('Asia/Seoul',stamp)::date
    or timezone('Asia/Seoul',stamp)::date-actual::date not between 0 and 6
   then raise exception 'Invalid weekly bucket'; end if;
  end loop;
 end loop;
 select id,teacher_id into sid,tid from public.students order by id limit 1;
 if sid is null then raise exception 'Missing staging student'; end if;
 update public.students set session_hash=encode(extensions.digest(convert_to(t,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '1 hour' where id=sid;
 insert into public.quests(teacher_id,title,quest_type,submission_mode,weekly_reset_day)
 values(tid,'Temporary weekly weekday test','weekly','text',2) returning id into qid;
 p:=public.quest_current_period_key('weekly',2);
 before_key:=(p::date-7)::text;
 insert into public.quest_submissions(student_id,quest_id,period_key,status,report_text) values(sid,qid,before_key,'approved','Previous report');
 select x into row_data from jsonb_array_elements(public.student_dashboard(t)->'quests') x where (x->>'id')::bigint=qid;
 if row_data->>'status'<>'available' or row_data->>'weekly_reset_day'<>'2' then raise exception 'Dashboard reset failed'; end if;
 perform public.student_submit_quest_evidence(t,qid,'Current report',null);
 if not exists(select 1 from public.quest_submissions where quest_id=qid and period_key=p and status='submitted') then raise exception 'Wrong submission period'; end if;
 if public.student_repeat_quest_record(t,qid)->>'report_text'<>'Current report' then raise exception 'Record lookup wrong period'; end if;
 perform public.student_submit_quest_evidence(t,qid,'Amended report',null);
 if (select count(*) from public.quest_submissions where quest_id=qid)<>2 then raise exception 'Duplicate report'; end if;
 update public.quest_submissions set status='approved' where quest_id=qid and period_key=p;
 blocked:=false;
 begin perform public.student_submit_quest_evidence(t,qid,'Duplicate completion',null); exception when others then blocked:=true; end;
 if not blocked then raise exception 'Approved quest repeated'; end if;
 if not exists(select 1 from public.quest_submissions where quest_id=qid and period_key=before_key and report_text='Previous report') then raise exception 'History changed'; end if;
 blocked:=false;
 begin update public.quests set weekly_reset_day=8 where id=qid; exception when check_violation then blocked:=true; end;
 if not blocked then raise exception 'Invalid weekday allowed'; end if;
 -- Legacy RPC uses the same weekday.
 update public.quests set submission_mode=null,weekly_reset_day=7 where id=qid;
 perform public.student_submit_quest(t,qid);
 if not exists(select 1 from public.quest_submissions where quest_id=qid and period_key=public.quest_current_period_key('weekly',7)) then raise exception 'Legacy period mismatch'; end if;
end $test$;
rollback;
select 'PASS: 98 weekday cases, Seoul midnight/year boundaries, dashboard, submission/amendment, history, duplicate prevention, legacy RPC, invalid weekday' as result;
