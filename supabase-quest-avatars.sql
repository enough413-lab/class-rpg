create or replace function public.teacher_student_appearances()
returns table(student_id bigint,slot text,item_id text,image text)
language sql stable security definer set search_path=public as $$
 select s.id,e.slot,e.item_id,case when s.gender='girl' then i.girl_image else i.boy_image end
 from public.students s join public.student_equipment e on e.student_id=s.id
 join public.item_catalog i on i.id=e.item_id and i.active
 where s.teacher_id=auth.uid();
$$;
revoke all on function public.teacher_student_appearances() from public,anon;
grant execute on function public.teacher_student_appearances() to authenticated;

