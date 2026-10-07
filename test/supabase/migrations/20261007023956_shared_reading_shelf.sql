-- Same-teacher approved sharing; unfinished reviews stay visible only to their author.
create or replace function public.student_reading_shelf(p_token text,p_scope text default 'mine',p_before_id bigint default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare sid bigint;tid uuid;result jsonb;
begin
 sid:=public.student_for_token(p_token);if sid is null then raise exception '다시 로그인한 뒤 책장을 펼쳐 주세요.';end if;
 if p_scope is null or p_scope not in ('mine','class') or (p_before_id is not null and p_before_id<=0) then raise exception '책장을 다시 선택해 주세요.';end if;
 select teacher_id into tid from public.students where id=sid;
 with candidates as (
  select r.id as review_id,r.book_title,r.read_date,r.summary,r.thoughts,r.recommendation_rating,r.recommendation_reason,r.status,
   coalesce(s.nickname,'우리 반 친구') as author_nickname,(r.student_id=sid) as mine
  from public.reading_reviews r join public.students s on s.id=r.student_id
  where (p_before_id is null or r.id<p_before_id) and
   ((p_scope='mine' and r.student_id=sid) or (p_scope='class' and tid is not null and s.teacher_id=tid and r.status='approved'))
  order by r.id desc limit 21
 ), page as (select * from candidates order by review_id desc limit 20)
 select jsonb_build_object('reviews',coalesce((select jsonb_agg(to_jsonb(p) order by review_id desc) from page p),'[]'::jsonb),'has_more',(select count(*)>20 from candidates),'next_before_id',(select min(review_id) from page)) into result;
 return result;
end $$;
revoke all on function public.student_reading_shelf(text,text,bigint) from public;
grant execute on function public.student_reading_shelf(text,text,bigint) to anon,authenticated;
comment on function public.student_reading_shelf(text,text,bigint) is 'Token-owned reading shelf. Own all statuses; same-teacher classmates approved only. No feedback, login IDs or private credentials. Bounded keyset pages, no writes.';
notify pgrst,'reload schema';
