-- 메인 퀘스트 수락 → 수행 기록 제출 흐름
begin;

alter table public.quest_submissions add column if not exists report_text text;
alter table public.quest_submissions add column if not exists evidence_image text;

create or replace function public.student_accept_quest(p_token text,p_quest_id bigint)
returns void language plpgsql security definer set search_path=public as $$
declare
  sid bigint;
  q public.quests%rowtype;
  pkey text;
begin
  sid:=public.student_for_token(p_token);
  if sid is null then raise exception '다시 로그인해 주세요.'; end if;
  select x.* into q from public.quests x join public.students s on s.teacher_id=x.teacher_id
    where x.id=p_quest_id and s.id=sid and x.active;
  if q.id is null then raise exception '이 퀘스트를 찾을 수 없어요.'; end if;
  if q.quest_type<>'main' then raise exception '메인 퀘스트만 의뢰를 맡을 수 있어요.'; end if;
  pkey:=public.quest_period_key(q.quest_type);
  update public.quest_submissions set status='accepted',submitted_at=null,report_text=null,evidence_image=null
    where student_id=sid and quest_id=q.id and period_key=pkey and status in ('available','rejected');
  if not found then
    insert into public.quest_submissions(student_id,quest_id,period_key,status) values(sid,q.id,pkey,'accepted')
    on conflict (student_id,quest_id,period_key) do nothing;
  end if;
end; $$;

create or replace function public.student_submit_quest_evidence(p_token text,p_quest_id bigint,p_report text,p_image text)
returns void language plpgsql security definer set search_path=public as $$
declare
  sid bigint;
  q public.quests%rowtype;
  pkey text;
begin
  sid:=public.student_for_token(p_token);
  if sid is null then raise exception '다시 로그인해 주세요.'; end if;
  select x.* into q from public.quests x join public.students s on s.teacher_id=x.teacher_id
    where x.id=p_quest_id and s.id=sid and x.active;
  if q.id is null or q.quest_type<>'main' then raise exception '메인 퀘스트를 찾을 수 없어요.'; end if;
  if length(trim(coalesce(p_report,'')))=0 then raise exception '수행한 내용을 입력해 주세요.'; end if;
  if length(coalesce(p_image,''))>2000000 then raise exception '사진 파일이 너무 커요.'; end if;
  pkey:=public.quest_period_key(q.quest_type);
  update public.quest_submissions set status='submitted',submitted_at=now(),report_text=trim(p_report),evidence_image=nullif(p_image,'')
    where student_id=sid and quest_id=q.id and period_key=pkey and status='accepted';
  if not found then raise exception '먼저 이 의뢰를 맡아 주세요.'; end if;
end; $$;

-- 학생 본인의 승인 완료 기록만 다시 보여 줍니다.
create or replace function public.student_quest_evidence(p_token text,p_quest_id bigint)
returns jsonb language plpgsql security definer set search_path=public stable as $$
declare
  sid bigint;
  result jsonb;
begin
  sid:=public.student_for_token(p_token);
  if sid is null then raise exception '다시 로그인해 주세요.'; end if;
  select jsonb_build_object(
    'quest_id',q.id,
    'title',q.title,
    'description',q.description,
    'xp',q.xp,
    'gold',q.gold,
    'report_text',s.report_text,
    'evidence_image',s.evidence_image,
    'submitted_at',s.submitted_at
  ) into result
  from public.quest_submissions s
  join public.quests q on q.id=s.quest_id
  where s.student_id=sid and s.quest_id=p_quest_id and s.status='approved'
  order by s.submitted_at desc nulls last
  limit 1;
  if result is null then raise exception '완료한 퀘스트 기록을 찾을 수 없어요.'; end if;
  return result;
end; $$;

grant execute on function public.student_accept_quest(text,bigint) to anon,authenticated;
grant execute on function public.student_submit_quest_evidence(text,bigint,text,text) to anon,authenticated;
grant execute on function public.student_quest_evidence(text,bigint) to anon,authenticated;

commit;
