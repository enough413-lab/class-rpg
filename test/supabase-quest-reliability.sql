-- TEST ONLY gcgjpfidppaioambcatq. New token-scoped reads and guarded receipt submission.
create or replace function public.student_quest_schedule(p_token text)
returns jsonb language plpgsql security definer stable set search_path='' as $$
declare sid bigint; rows jsonb;
begin
 sid:=public.student_for_token(p_token);if sid is null then raise exception '다시 로그인해 주세요.';end if;
 select coalesce(jsonb_agg(jsonb_build_object('quest_id',q.id,'period_key',public.quest_current_period_key(q.quest_type,q.weekly_reset_day),'next_reset_at',case when q.quest_type in('daily','weekly') then ((public.quest_current_period_key(q.quest_type,q.weekly_reset_day)::date+case when q.quest_type='weekly' then 7 else 1 end)::timestamp at time zone 'Asia/Seoul') else null end)),'[]'::jsonb)
 into rows from public.quests q join public.students s on s.teacher_id=q.teacher_id where s.id=sid and q.active and (q.target_student_ids is null or sid=any(q.target_student_ids));
 return jsonb_build_object('server_now',now(),'quests',rows);
end; $$;
revoke all on function public.student_quest_schedule(text) from public;
grant execute on function public.student_quest_schedule(text) to anon,authenticated;
create or replace function public.student_quest_context(p_token text,p_quest_id bigint)
returns jsonb language plpgsql security definer stable set search_path='' as $$
declare sid bigint; q public.quests%rowtype; pkey text; record jsonb;
begin
 sid:=public.student_for_token(p_token);if sid is null then raise exception '다시 로그인해 주세요.';end if;
 select x.* into q from public.quests x join public.students s on s.teacher_id=x.teacher_id where x.id=p_quest_id and s.id=sid and x.active and (x.target_student_ids is null or sid=any(x.target_student_ids));
 if q.id is null then raise exception '지금 작성할 수 없는 퀘스트예요.';end if;
 pkey:=public.quest_current_period_key(q.quest_type,q.weekly_reset_day);
 select jsonb_build_object('status',status,'report_text',report_text,'evidence_image',evidence_image,'evidence_captions',evidence_captions,'rejection_reason',rejection_reason,'submitted_at',submitted_at,'reviewed_at',reviewed_at) into record from public.quest_submissions where student_id=sid and quest_id=q.id and period_key=pkey;
 return jsonb_build_object('server_now',now(),'quest_id',q.id,'title',q.title,'quest_type',q.quest_type,'submission_mode',q.submission_mode,'period_key',pkey,'record',record);
end; $$;
revoke all on function public.student_quest_context(text,bigint) from public;
grant execute on function public.student_quest_context(text,bigint) to anon,authenticated;
create table if not exists rpg_private.quest_submission_receipts(
 student_id bigint not null references public.students(id) on delete cascade,
 request_id uuid not null,payload_hash text not null,response jsonb not null,created_at timestamptz not null default now(),primary key(student_id,request_id)
);
alter table rpg_private.quest_submission_receipts enable row level security;
revoke all on rpg_private.quest_submission_receipts from public,anon,authenticated;
create or replace function public.student_submit_quest_guarded(p_token text,p_request_id uuid,p_quest_id bigint,p_expected_period text,p_expected_mode text,p_report text,p_image text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare sid bigint; q public.quests%rowtype; pkey text; fingerprint text; cached rpg_private.quest_submission_receipts%rowtype; result jsonb;
begin
 sid:=public.student_for_token(p_token);if sid is null then raise exception '다시 로그인해 주세요.';end if;
 if p_request_id is null then raise exception '제출 준비를 다시 확인해 주세요.';end if;
 if length(coalesce(p_report,''))>10000 or length(coalesce(p_image,''))>2000000 then raise exception '글 또는 사진이 너무 커요.';end if;
 fingerprint:=encode(extensions.digest(convert_to(jsonb_build_object('quest',p_quest_id,'period',p_expected_period,'mode',p_expected_mode,'report',p_report,'image',p_image)::text,'UTF8'),'sha256'),'hex');
 perform 1 from public.students where id=sid for update;
 select * into cached from rpg_private.quest_submission_receipts where student_id=sid and request_id=p_request_id;
 if found then if cached.payload_hash<>fingerprint then raise exception '이전 제출 준비와 내용이 달라요. 먼저 결과를 확인해 주세요.';end if;return cached.response;end if;
 select x.* into q from public.quests x join public.students s on s.teacher_id=x.teacher_id where x.id=p_quest_id and s.id=sid and x.active and (x.target_student_ids is null or sid=any(x.target_student_ids)) for share of x;
 if q.id is null then raise exception '지금 제출할 수 없는 퀘스트예요.';end if;
 pkey:=public.quest_current_period_key(q.quest_type,q.weekly_reset_day);
 if p_expected_period is distinct from pkey then raise exception '회차가 바뀌었어요. 작성한 초안을 보관하고 새 회차를 다시 확인해 주세요.';end if;
 if p_expected_mode is distinct from q.submission_mode then raise exception '제출방식이 바뀌었어요. 작성한 초안을 보관하고 다시 열어 주세요.';end if;
 perform public.student_submit_quest_evidence(p_token,p_quest_id,p_report,p_image);
 select jsonb_build_object('ok',true,'submission_id',id,'quest_id',quest_id,'period_key',period_key,'submitted_at',submitted_at) into result from public.quest_submissions where student_id=sid and quest_id=q.id and period_key=pkey;
 insert into rpg_private.quest_submission_receipts(student_id,request_id,payload_hash,response) values(sid,p_request_id,fingerprint,result);
 return result;
end; $$;
revoke all on function public.student_submit_quest_guarded(text,uuid,bigint,text,text,text,text) from public;
grant execute on function public.student_submit_quest_guarded(text,uuid,bigint,text,text,text,text) to anon,authenticated;
create or replace function public.student_quest_history(p_token text,p_before_id bigint default null)
returns jsonb language plpgsql security definer stable set search_path='' as $$
declare sid bigint; rows jsonb; cursor_id bigint;
begin
 sid:=public.student_for_token(p_token);if sid is null then raise exception '다시 로그인해 주세요.';end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.id desc),'[]'::jsonb),min(x.id) into rows,cursor_id
 from(select s.id,s.quest_id,q.title,q.quest_type,s.period_key,s.status,s.submitted_at,s.reviewed_at,s.rejection_reason,s.report_text,(nullif(s.evidence_image,'') is not null) as has_photos,public.quest_current_period_key(q.quest_type,q.weekly_reset_day) as current_period from public.quest_submissions s join public.quests q on q.id=s.quest_id where s.student_id=sid and (p_before_id is null or s.id<p_before_id) and s.status in('submitted','approved','rejected') order by s.id desc limit 20)x;
 return jsonb_build_object('records',rows,'next_before_id',cursor_id,'has_more',exists(select 1 from public.quest_submissions s where s.student_id=sid and s.id<cursor_id and s.status in('submitted','approved','rejected')));
end; $$;
revoke all on function public.student_quest_history(text,bigint) from public;
grant execute on function public.student_quest_history(text,bigint) to anon,authenticated;

create or replace function public.student_quest_history_detail(p_token text,p_submission_id bigint)
returns jsonb language plpgsql security definer stable set search_path='' as $$
declare sid bigint; result jsonb;
begin
 sid:=public.student_for_token(p_token);if sid is null then raise exception '다시 로그인해 주세요.';end if;
 select jsonb_build_object('id',s.id,'title',q.title,'period_key',s.period_key,'status',s.status,'report_text',s.report_text,'evidence_image',s.evidence_image,'evidence_captions',s.evidence_captions,'submitted_at',s.submitted_at,'reviewed_at',s.reviewed_at) into result from public.quest_submissions s join public.quests q on q.id=s.quest_id where s.id=p_submission_id and s.student_id=sid and s.status in('submitted','approved','rejected');
 if result is null then raise exception '내 제출 기록을 다시 확인해 주세요.';end if;return result;
end; $$;
revoke all on function public.student_quest_history_detail(text,bigint) from public;
grant execute on function public.student_quest_history_detail(text,bigint) to anon,authenticated;
