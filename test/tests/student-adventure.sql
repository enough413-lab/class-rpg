-- Staging only: all fixture changes are rolled back.
begin;
do $test$
declare sid bigint; other_sid bigint; t text:=gen_random_uuid()::text; t2 text:=gen_random_uuid()::text; r jsonb; blocked boolean; n integer; gold_before integer;
begin
 select id,gold into sid,gold_before from public.students order by id limit 1;
 select id into other_sid from public.students where id<>sid order by id limit 1;
 if other_sid is null then raise exception 'Need two staging fixtures'; end if;
 update public.students set xp=0,session_hash=encode(extensions.digest(convert_to(t,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '1 hour' where id=sid;
 update public.students set session_hash=encode(extensions.digest(convert_to(t2,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '1 hour' where id=other_sid;
 blocked:=false;begin perform public.student_learning_journal('invalid');exception when others then blocked:=true;end;
 if not blocked then raise exception 'Invalid token allowed'; end if;
 blocked:=false;begin perform public.student_explore_school(t,'pond-1',0);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Locked area allowed'; end if;
 blocked:=false;begin perform public.student_explore_school(t,'classroom-2',1);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Out of order step allowed'; end if;
 r:=public.student_explore_school(t,'classroom-1',2);
 if (r->>'correct')::boolean then raise exception 'Wrong answer accepted'; end if;
 select count(*) into n from rpg_private.school_exploration where student_id=sid;
 if n<>0 then raise exception 'Wrong answer saved'; end if;
 r:=public.student_explore_school(t,'classroom-1',0);
 if not (r->>'correct')::boolean or not (r->>'new')::boolean then raise exception 'Correct answer failed'; end if;
 r:=public.student_explore_school(t,'classroom-1',0);
 if (r->>'new')::boolean then raise exception 'Duplicate answer awarded'; end if;
 perform public.student_explore_school(t,'classroom-2',1);
 perform public.student_explore_school(t,'classroom-3',2);
 if jsonb_array_length(public.student_learning_journal(t)->'exploration')<>3 then raise exception 'Progress not persisted'; end if;
 if jsonb_array_length(public.student_learning_journal(t2)->'exploration')<>0 then raise exception 'Cross student leakage'; end if;
 if (select xp<>0 or gold<>gold_before from public.students where id=sid) then raise exception 'Exploration changed real rewards'; end if;
 if has_table_privilege('anon','rpg_private.school_exploration','INSERT') or has_table_privilege('authenticated','rpg_private.school_exploration','SELECT') then raise exception 'Direct table exposed'; end if;
end $test$;
rollback;
select 'PASS: token isolation, level and sequence gates, wrong answer, idempotency, journal, no XP/gold changes, no direct table access' as result;
