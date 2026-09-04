-- 교사용 독후감 확인 목록을 5개씩 페이지로 나눕니다.
-- Supabase SQL Editor에서 이 파일 전체를 한 번 실행하세요.

create or replace function public.teacher_reading_reviews_v2(p_page integer default 1,p_page_size integer default 5)
returns table(review_id bigint,student_number integer,student_name text,book_title text,read_date date,summary text,thoughts text,recommendation_rating smallint,recommendation_reason text,status text,created_at timestamptz,total_count bigint)
language sql security definer set search_path=public stable as $$
  select r.id,s.student_number,s.nickname,r.book_title,r.read_date,r.summary,r.thoughts,r.recommendation_rating,r.recommendation_reason,r.status,r.created_at,count(*) over()
  from public.reading_reviews r join public.students s on s.id=r.student_id
  where s.teacher_id=auth.uid() and r.status='submitted'
  order by r.created_at desc
  limit least(greatest(coalesce(p_page_size,5),1),20)
  offset (greatest(coalesce(p_page,1),1)-1)*least(greatest(coalesce(p_page_size,5),1),20);
$$;
revoke all on function public.teacher_reading_reviews_v2(integer,integer) from public;
grant execute on function public.teacher_reading_reviews_v2(integer,integer) to authenticated;
