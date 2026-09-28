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
  if q.id is null then raise exception '이 퀘스트를 찾을 수 없어요.'; end if;
  if q.quest_type='main' and length(trim(coalesce(p_report,'')))=0 then raise exception '수행한 내용을 입력해 주세요.'; end if;
  if length(coalesce(p_image,''))>2000000 then raise exception '사진 파일이 너무 커요.'; end if;
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
revoke all on function public.student_submit_quest_evidence(text,bigint,text,text) from public;
grant execute on function public.student_submit_quest_evidence(text,bigint,text,text) to anon,authenticated;


create or replace function public.student_repeat_quest_record(p_token text,p_quest_id bigint)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare sid bigint; result jsonb;
begin
 sid:=public.student_for_token(p_token);
 if sid is null then raise exception '다시 로그인해 주세요.'; end if;
 select jsonb_build_object('status',s.status,'report_text',s.report_text,'evidence_image',s.evidence_image)
 into result from public.quest_submissions s join public.quests q on q.id=s.quest_id
 join public.students st on st.id=s.student_id and st.teacher_id=q.teacher_id
 where s.student_id=sid and q.id=p_quest_id and q.active and q.quest_type in ('daily','weekly')
 and s.period_key=public.quest_period_key(q.quest_type);
 return result;
end; $$;
revoke all on function public.student_repeat_quest_record(text,bigint) from public;
grant execute on function public.student_repeat_quest_record(text,bigint) to anon,authenticated;
