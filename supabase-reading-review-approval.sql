-- 독후감 교사 승인·반려 기능입니다.
-- Supabase SQL Editor에서 이 파일 전체를 한 번 실행하세요.

begin;

alter table public.reading_reviews
  add column if not exists status text not null default 'approved' check(status in ('submitted','approved','rejected')),
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id);
-- 예전 기록은 기존 방식에서 이미 보상을 받았으므로 승인 완료로 보존합니다.
alter table public.reading_reviews alter column status set default 'submitted';

create index if not exists reading_reviews_status_created_idx on public.reading_reviews(status,created_at desc);

create or replace function public.student_reading_reviews_v2(p_token text)
returns table(review_id bigint,book_title text,read_date date,summary text,thoughts text,recommendation_rating smallint,recommendation_reason text,status text,created_at timestamptz)
language plpgsql security definer set search_path=public stable as $$
declare v_student_id bigint;
begin
  v_student_id:=public.student_for_token(p_token);
  if v_student_id is null then raise exception '로그인이 만료됐어요. 다시 로그인해 주세요.'; end if;
  return query select r.id,r.book_title,r.read_date,r.summary,r.thoughts,r.recommendation_rating,r.recommendation_reason,r.status,r.created_at
  from public.reading_reviews r where r.student_id=v_student_id order by r.created_at desc;
end; $$;
revoke all on function public.student_reading_reviews_v2(text) from public;
grant execute on function public.student_reading_reviews_v2(text) to anon,authenticated;

create or replace function public.student_add_reading_review(
  p_token text,p_book_title text,p_read_date date,p_summary text,p_thoughts text,
  p_recommendation_rating smallint,p_recommendation_reason text
)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_student_id bigint; v_week_count integer;
begin
  v_student_id:=public.student_for_token(p_token);
  if v_student_id is null then raise exception '로그인이 만료됐어요. 다시 로그인해 주세요.'; end if;
  if coalesce(length(trim(p_book_title)),0)=0 or coalesce(length(trim(p_summary)),0)=0 or coalesce(length(trim(p_thoughts)),0)=0 or coalesce(length(trim(p_recommendation_reason)),0)=0 then
    raise exception '모든 독후감 항목을 적어 주세요.';
  end if;
  if p_recommendation_rating not between 1 and 5 then raise exception '추천 별점을 골라 주세요.'; end if;
  select count(*) into v_week_count from public.reading_reviews where student_id=v_student_id and created_at>=date_trunc('week',now());
  if v_week_count>=3 then raise exception '이번 주에는 독후감을 3편까지 기록했어요. 다음 주에 다시 도전해요!'; end if;
  insert into public.reading_reviews(student_id,book_title,read_date,summary,thoughts,recommendation_rating,recommendation_reason,status)
    values(v_student_id,trim(p_book_title),p_read_date,trim(p_summary),trim(p_thoughts),p_recommendation_rating,trim(p_recommendation_reason),'submitted');
  return jsonb_build_object('ok',true,'status','submitted');
end; $$;
revoke all on function public.student_add_reading_review(text,text,date,text,text,smallint,text) from public;
grant execute on function public.student_add_reading_review(text,text,date,text,text,smallint,text) to anon,authenticated;

create or replace function public.teacher_reading_reviews()
returns table(review_id bigint,student_number integer,student_name text,book_title text,read_date date,summary text,thoughts text,recommendation_rating smallint,recommendation_reason text,status text,created_at timestamptz)
language sql security definer set search_path=public stable as $$
  select r.id,s.student_number,s.nickname,r.book_title,r.read_date,r.summary,r.thoughts,r.recommendation_rating,r.recommendation_reason,r.status,r.created_at
  from public.reading_reviews r join public.students s on s.id=r.student_id
  where s.teacher_id=auth.uid() and r.status='submitted'
  order by r.created_at desc;
$$;
revoke all on function public.teacher_reading_reviews() from public;
grant execute on function public.teacher_reading_reviews() to authenticated;

create or replace function public.teacher_review_reading_review(p_review_id bigint,p_approve boolean)
returns void language plpgsql security definer set search_path=public as $$
declare v_review public.reading_reviews%rowtype;
begin
  if auth.uid() is null then raise exception '교사 로그인이 필요해요.'; end if;
  select r.* into v_review from public.reading_reviews r join public.students s on s.id=r.student_id
  where r.id=p_review_id and s.teacher_id=auth.uid() for update;
  if v_review.id is null then raise exception '확인할 독후감을 찾을 수 없어요.'; end if;
  if v_review.status<>'submitted' then raise exception '이미 처리한 독후감이에요.'; end if;
  update public.reading_reviews set status=case when p_approve then 'approved' else 'rejected' end,reviewed_at=now(),reviewed_by=auth.uid() where id=v_review.id;
  if p_approve then update public.students set xp=xp+10,gold=gold+30 where id=v_review.student_id; end if;
end; $$;
revoke all on function public.teacher_review_reading_review(bigint,boolean) from public;
grant execute on function public.teacher_review_reading_review(bigint,boolean) to authenticated;

commit;
