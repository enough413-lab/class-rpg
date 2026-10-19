-- Development only. A separate endpoint preserves already-open title-search clients.
create or replace function public.student_reading_shelf_ordered(
 p_token text, p_scope text default 'mine', p_author text default '',
 p_title text default '', p_sort text default 'newest', p_after jsonb default null
)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
 sid bigint; tid uuid; shared boolean; result jsonb;
 title_query text; author_query text; after_id bigint; after_key text;
begin
 sid:=public.student_for_token(p_token);
 if sid is null then raise exception '다시 로그인해 주세요.'; end if;
 if p_scope is null or p_scope not in ('mine','class')
    or p_sort is null or p_sort not in ('newest','oldest','title')
    or length(coalesce(p_author,''))>40 or length(coalesce(p_title,''))>200 then
  raise exception '책장의 검색 순서를 다시 확인해 주세요.';
 end if;
 if p_after is not null then
  if jsonb_typeof(p_after) is distinct from 'object'
     or jsonb_typeof(p_after->'id') is distinct from 'number'
     or coalesce(p_after->>'id','') !~ '^[1-9][0-9]{0,18}$'
     or p_after->>'sort' is distinct from p_sort
     or p_after - array['id','sort','key'] <> '{}'::jsonb then
   raise exception '책장을 처음부터 다시 펼쳐 주세요.';
  end if;
  begin after_id:=(p_after->>'id')::bigint;
  exception when numeric_value_out_of_range then raise exception '책장을 처음부터 다시 펼쳐 주세요.';end;
  if p_sort='title' then
   if jsonb_typeof(p_after->'key') is distinct from 'string' or length(p_after->>'key')>2000 then
    raise exception '책장을 처음부터 다시 펼쳐 주세요.';
   end if;
   after_key:=p_after->>'key';
  end if;
 end if;
 title_query:=lower(btrim(regexp_replace(normalize(coalesce(p_title,''),NFC),'[[:space:]]+',' ','g')));
 author_query:=lower(btrim(coalesce(p_author,'')));
 select teacher_id into tid from public.students where id=sid;
 shared:=coalesce((select class_sharing from rpg_private.reading_share_settings where teacher_id=tid),false);
 with eligible as (
  select r.id as review_id,r.book_title,r.read_date,r.summary,r.thoughts,
   r.recommendation_rating,r.recommendation_reason,r.status,
   coalesce(s.nickname,'우리 반 친구') as author_nickname,(r.student_id=sid) as mine,
   lower(btrim(regexp_replace(normalize(r.book_title,NFC),'[[:space:]]+',' ','g'))) as title_key
  from public.reading_reviews r join public.students s on s.id=r.student_id
  where ((p_scope='mine' and r.student_id=sid)
     or (p_scope='class' and shared and tid is not null and s.teacher_id=tid and r.status='approved'))
   and position(author_query in lower(coalesce(s.nickname,'우리 반 친구')))>0
 ), candidates as (
  select * from eligible e where position(title_query in title_key)>0
   and (after_id is null or (p_sort='newest' and review_id<after_id)
     or (p_sort='oldest' and review_id>after_id)
     or (p_sort='title' and (title_key collate "C",review_id)>(after_key collate "C",after_id)))
  order by case when p_sort='title' then title_key end collate "C" asc,
   case when p_sort='newest' then review_id end desc,
   case when p_sort<>'newest' then review_id end asc
  limit 21
 ), page as (
  select *,row_number() over(order by case when p_sort='title' then title_key end collate "C" asc,
   case when p_sort='newest' then review_id end desc,
   case when p_sort<>'newest' then review_id end asc) as pos
  from candidates order by pos limit 20
 )
 select jsonb_build_object(
  'reviews',coalesce((select jsonb_agg(to_jsonb(p)-'title_key'-'pos' order by pos) from page p),'[]'::jsonb),
  'has_more',(select count(*)>20 from candidates),
  'next_cursor',(select jsonb_build_object('sort',p_sort,'id',review_id,'key',case when p_sort='title' then title_key end) from page order by pos desc limit 1),
  'class_sharing',shared
 ) into result;
 return result;
end;
$$;
revoke all on function public.student_reading_shelf_ordered(text,text,text,text,text,jsonb) from public;
grant execute on function public.student_reading_shelf_ordered(text,text,text,text,text,jsonb) to anon,authenticated;
