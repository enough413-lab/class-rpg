-- Existing quests retain NULL (legacy behavior). No records are rewritten.
alter table public.quests add column submission_mode text
  constraint quests_submission_mode_check check (submission_mode in ('photo','text','both'));
comment on column public.quests.submission_mode is 'NULL: legacy; photo: photo required; text: text required; both: both required';

create or replace function public.student_submit_quest_evidence(p_token text,p_quest_id bigint,p_report text,p_image text)
returns void language plpgsql security definer set search_path=public as $$
declare
  sid bigint;
  q public.quests%rowtype;
  pkey text;
  photos jsonb;
begin
  sid:=public.student_for_token(p_token);
  if sid is null then raise exception '다시 로그인해 주세요.'; end if;
  select x.* into q from public.quests x join public.students s on s.teacher_id=x.teacher_id
    where x.id=p_quest_id and s.id=sid and x.active;
  if q.id is null then raise exception '이 퀘스트를 찾을 수 없어요.'; end if;
  if q.submission_mode is null and q.quest_type='main' and length(trim(coalesce(p_report,'')))=0 then raise exception '수행한 내용을 입력해 주세요.'; end if;
  if length(coalesce(p_image,''))>2000000 then raise exception '사진 파일이 너무 커요.'; end if;

  if q.submission_mode in ('text','both') and coalesce(p_report,'') !~ '[^[:space:]]' then
    raise exception '수행한 내용을 한 줄 이상 적어 주세요.';
  end if;
  if q.submission_mode='photo' and coalesce(p_report,'') ~ '[^[:space:]]' then
    raise exception '사진만 제출하는 퀘스트예요. 새로고침 후 다시 제출해 주세요.';
  end if;
  if q.submission_mode='text' and nullif(p_image,'') is not null then
    raise exception '글만 제출하는 퀘스트예요. 새로고침 후 다시 제출해 주세요.';
  end if;
  if q.submission_mode in ('photo','both') then
    if nullif(p_image,'') is null then raise exception '사진을 1장 이상 첨부해 주세요.'; end if;
    begin
      photos:=case when left(p_image,1)='[' then p_image::jsonb else jsonb_build_array(p_image) end;
    exception when invalid_text_representation then
      raise exception '사진을 읽지 못했어요. 다시 첨부해 주세요.';
    end;
    if jsonb_typeof(photos)<>'array' or jsonb_array_length(photos) not between 1 and 5 then
      raise exception '사진을 1장 이상, 최대 5장까지 첨부해 주세요.';
    end if;
    if exists(select 1 from jsonb_array_elements(photos) item
      where jsonb_typeof(item)<>'string' or not (
        (item #>> '{}') ~* '^data:image/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$'
        or (item #>> '{}') ~ '^https?://[^[:space:]]+$')) then
      raise exception '사진을 읽지 못했어요. 다시 첨부해 주세요.';
    end if;
  end if;

  pkey:=public.quest_period_key(q.quest_type);
  if q.quest_type='main' then
    update public.quest_submissions set status='submitted',submitted_at=now(),report_text=trim(p_report),evidence_image=nullif(p_image,'')
      where student_id=sid and quest_id=q.id and period_key=pkey and status='accepted';
    if not found then raise exception '먼저 이 의뢰를 맡아 주세요.'; end if;
  elsif q.quest_type in ('daily','weekly') then
    -- Amend a pending report without changing review state, submission time or rewards.
    update public.quest_submissions set report_text=nullif(trim(p_report),''),evidence_image=nullif(p_image,'')
      where student_id=sid and quest_id=q.id and period_key=pkey and status='submitted';
    if found then return; end if;
    insert into public.quest_submissions(student_id,quest_id,period_key,status,submitted_at,report_text,evidence_image)
      values(sid,q.id,pkey,'submitted',now(),nullif(trim(p_report),''),nullif(p_image,''))
    on conflict (student_id,quest_id,period_key) do update
      set status='submitted',submitted_at=now(),reviewed_at=null,rejection_reason=null,
          report_text=excluded.report_text,evidence_image=excluded.evidence_image
      where quest_submissions.status in ('available','accepted','rejected');
    if not found then raise exception '이미 제출하거나 완료한 퀘스트예요.'; end if;
  else
    raise exception '지원하지 않는 퀘스트예요.';
  end if;
end; $$;

CREATE OR REPLACE FUNCTION public.student_dashboard(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare sid bigint; s students%rowtype; q jsonb; inv jsonb; notices jsonb;
begin
  sid:=student_for_token(p_token); if sid is null then raise exception '다시 로그인해 주세요.'; end if; select * into s from students where id=sid;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',x.id,'title',x.title,'description',x.description,'xp',x.xp_reward,'gold',x.gold_reward,'quest_type',x.quest_type,
    'submission_mode',x.submission_mode,'dialogue',coalesce(x.dialogue,'[]'::jsonb),'status',coalesce(y.status,'available'),'retry_count',coalesce(y.retry_count,0),
    'rejection_reason',y.rejection_reason,'difficulty',x.difficulty,'category',x.category,'personal',x.target_student_ids is not null
  ) order by case x.quest_type when 'daily' then 1 when 'weekly' then 2 else 3 end,x.created_at desc),'[]'::jsonb) into q
  from quests x left join quest_submissions y on y.quest_id=x.id and y.student_id=sid and y.period_key=quest_period_key(x.quest_type)
  where x.teacher_id=s.teacher_id and x.active and (x.target_student_ids is null or sid=any(x.target_student_ids));
  select coalesce(jsonb_agg(jsonb_build_object('item_id',i.id,'name',i.name,'slot',i.slot,'image',case when s.gender='girl' then i.girl_image else i.boy_image end,'equipped',(e.item_id=i.id)) order by case i.slot when 'top' then 1 when 'bottom' then 2 else 3 end,i.created_at),'[]'::jsonb) into inv
  from student_items si join item_catalog i on i.id=si.item_id and i.active left join student_equipment e on e.student_id=si.student_id and e.slot=i.slot where si.student_id=sid;
  select coalesce(jsonb_agg(n.obj order by n.sort_at asc),'[]'::jsonb) into notices from (
    select qs.reviewed_at sort_at,jsonb_build_object('kind','quest','id',qs.id,'submission_id',qs.id,'status',qs.status,'title',x.title,'xp',case when qs.status='approved' then x.xp_reward else 0 end,'gold',case when qs.status='approved' then x.gold_reward else 0 end,'reason',qs.rejection_reason,'retry_count',qs.retry_count) obj
    from quest_submissions qs join quests x on x.id=qs.quest_id where qs.student_id=sid and qs.status in ('approved','rejected') and qs.reviewed_at is not null and qs.notified_at is null
    union all
    select r.reviewed_at sort_at,jsonb_build_object('kind','reading','id',r.id,'status',r.status,'title',r.book_title,'xp',case when r.status='approved' then 10 else 0 end,'gold',case when r.status='approved' then 30 else 0 end,'reason',r.rejection_reason,'retry_count',r.retry_count) obj
    from reading_reviews r where r.student_id=sid and r.status in ('approved','rejected') and r.reviewed_at is not null and r.notified_at is null
    order by sort_at asc limit 20) n;
  return jsonb_build_object('student',jsonb_build_object('id',s.id,'number',s.student_number,'login_id',s.login_id,'nickname',s.nickname,'gender',s.gender,'setup_complete',s.setup_complete,'xp',s.xp,'gold',s.gold,'equipped_title',s.equipped_title),'quests',q,'inventory',inv,'reward_notifications',notices);
end; $function$;


CREATE OR REPLACE FUNCTION public.student_submit_quest(p_token text, p_quest_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare sid bigint; tid uuid; qtype text; pkey text;
begin
  sid:=student_for_token(p_token);
  if sid is null then raise exception '다시 로그인해 주세요.'; end if;
  select teacher_id into tid from students where id=sid;
  select quest_type into qtype from quests
    where id=p_quest_id and teacher_id=tid and active;
  if qtype is null then raise exception '퀘스트를 찾을 수 없어요.'; end if;
  if exists(select 1 from public.quests where id=p_quest_id and submission_mode is not null) then
    raise exception '선생님이 정한 제출방식에 맞춰 수행기록을 작성해 주세요.';
  end if;
  pkey:=quest_period_key(qtype);
  insert into quest_submissions(quest_id,student_id,period_key)
    values(p_quest_id,sid,pkey)
  on conflict(quest_id,student_id,period_key)
    do update set status='submitted',submitted_at=now(),reviewed_at=null;
  return true;
end; $function$;


