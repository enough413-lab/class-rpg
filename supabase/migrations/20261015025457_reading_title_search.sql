-- Development only. Add a separate RPC so already-open clients keep the old signature.
-- Student bearer tokens are validated by the existing custom session model (not auth.uid()).
create or replace function public.student_reading_shelf_find(
 p_token text, p_scope text default 'mine', p_author text default '',
 p_title text default '', p_before_id bigint default null
)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
 sid bigint; tid uuid; shared boolean; result jsonb;
 title_query text; author_query text;
begin
 sid:=public.student_for_token(p_token);
 if sid is null then raise exception '다시 로그인해 주세요.'; end if;
 if p_scope is null or p_scope not in ('mine','class')
    or length(coalesce(p_author,''))>40 or length(coalesce(p_title,''))>200
    or (p_before_id is not null and p_before_id<=0) then
  raise exception '책장의 검색어를 다시 확인해 주세요.';
 end if;
 title_query:=lower(btrim(regexp_replace(normalize(coalesce(p_title,''),NFC),'[[:space:]]+',' ','g')));
 author_query:=lower(btrim(coalesce(p_author,'')));
 select teacher_id into tid from public.students where id=sid;
 shared:=coalesce((select class_sharing from rpg_private.reading_share_settings where teacher_id=tid),false);
 with candidates as (
  select r.id as review_id,r.book_title,r.read_date,r.summary,r.thoughts,
   r.recommendation_rating,r.recommendation_reason,r.status,
   coalesce(s.nickname,'우리 반 친구') as author_nickname,(r.student_id=sid) as mine
  from public.reading_reviews r join public.students s on s.id=r.student_id
  where (p_before_id is null or r.id<p_before_id)
   and ((p_scope='mine' and r.student_id=sid)
     or (p_scope='class' and shared and tid is not null and s.teacher_id=tid and r.status='approved'))
   and position(author_query in lower(coalesce(s.nickname,'우리 반 친구')))>0
   and position(title_query in lower(btrim(regexp_replace(normalize(r.book_title,NFC),'[[:space:]]+',' ','g'))))>0
  order by r.id desc limit 21
 ), page as (select * from candidates order by review_id desc limit 20)
 select jsonb_build_object(
  'reviews',coalesce((select jsonb_agg(to_jsonb(p) order by review_id desc) from page p),'[]'::jsonb),
  'has_more',(select count(*)>20 from candidates),
  'next_before_id',(select min(review_id) from page),'class_sharing',shared
 ) into result;
 return result;
end;
$$;
revoke all on function public.student_reading_shelf_find(text,text,text,text,bigint) from public;
grant execute on function public.student_reading_shelf_find(text,text,text,text,bigint) to anon,authenticated;
