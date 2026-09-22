create or replace function public.teacher_activity_log_page(p_student_id bigint default null, p_page integer default 1)
returns jsonb language sql stable security definer set search_path=public as $function$
  with events as (
    select 'quest:'||qs.id event_key,qs.reviewed_at event_time,s.id student_id,s.student_number,s.nickname student_name,
      case qs.status when 'approved' then 'quest_approved' else 'quest_rejected' end event_type,
      q.title,case when qs.status='rejected' then qs.rejection_reason else '퀘스트 승인' end detail,
      case when qs.status='approved' then q.xp_reward else 0 end xp_delta,
      case when qs.status='approved' then q.gold_reward else 0 end gold_delta
    from public.quest_submissions qs join public.students s on s.id=qs.student_id join public.quests q on q.id=qs.quest_id
    where s.teacher_id=auth.uid() and qs.reviewed_at is not null and qs.status in ('approved','rejected')
    union all
    select 'reading:'||r.id,r.reviewed_at,s.id,s.student_number,s.nickname,
      case r.status when 'approved' then 'reading_approved' else 'reading_rejected' end,
      r.book_title,case when r.status='rejected' then r.rejection_reason else '독후감 승인' end,
      case when r.status='approved' then 10 else 0 end,case when r.status='approved' then 30 else 0 end
    from public.reading_reviews r join public.students s on s.id=r.student_id
    where s.teacher_id=auth.uid() and r.reviewed_at is not null and r.status in ('approved','rejected')
    union all
    select 'shop:'||o.id,o.created_at,s.id,s.student_number,s.nickname,'shop_purchase',p.name,
      case o.status when 'pending' then '교환 대기' when 'used' then '교환 완료' else '취소·환불' end,
      0,-o.price
    from public.shop_orders o join public.students s on s.id=o.student_id join public.shop_products p on p.id=o.product_id
    where s.teacher_id=auth.uid()
    union all
    select 'manual:'||e.id,e.created_at,s.id,s.student_number,s.nickname,e.event_type,e.title,e.detail,e.xp_delta,e.gold_delta
    from public.teacher_activity_events e join public.students s on s.id=e.student_id
    where e.teacher_id=auth.uid()
  ), filtered as (
  select * from events where p_student_id is null or student_id=p_student_id
), counts as (
  select count(*) total, greatest(1,ceil(count(*)/10.0)::integer) pages from filtered
), paging as (
  select *, least(greatest(coalesce(p_page,1),1),pages) page from counts
), selected as (
  select * from filtered order by event_time desc,event_key desc
  limit 10 offset (select (page-1)*10 from paging)
)
select jsonb_build_object('total',total,'page',page,'pages',pages,'page_size',10,
 'rows',(select coalesce(jsonb_agg(to_jsonb(s) order by event_time desc,event_key desc),'[]'::jsonb) from selected s)) from paging;
$function$;
revoke all on function public.teacher_activity_log_page(bigint,integer) from public,anon;
grant execute on function public.teacher_activity_log_page(bigint,integer) to authenticated;

