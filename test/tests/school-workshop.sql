-- Staging fixtures only; every change rolls back.
begin;
do $test$
declare sid bigint; other_sid bigint; t text:=gen_random_uuid()::text; t2 text:=gen_random_uuid()::text; r jsonb; blocked boolean; old_gold integer; stamp_time timestamptz;
begin
 select id,gold into sid,old_gold from public.students order by id limit 1;
 select id into other_sid from public.students where id<>sid order by id limit 1;
 if other_sid is null then raise exception 'Need two staging fixtures'; end if;
 delete from rpg_private.school_exploration where student_id in (sid,other_sid);
 delete from rpg_private.school_workshop where student_id in (sid,other_sid);
 update public.students set xp=439,session_hash=encode(extensions.digest(convert_to(t,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '1 hour' where id=sid;
 update public.students set session_hash=encode(extensions.digest(convert_to(t2,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '1 hour' where id=other_sid;
 blocked:=false;begin perform public.student_school_workshop('invalid','cover','paper');exception when others then blocked:=true;end;
 if not blocked then raise exception 'Invalid token accepted'; end if;
 blocked:=false;begin perform public.student_school_workshop(t,'garden','["leaves","flower","can"]');exception when others then blocked:=true;end;
 if not blocked then raise exception 'Lv6 bypassed Lv7 gate'; end if;
 update public.students set xp=440 where id=sid;
 r:=public.student_school_workshop(t,'garden','["leaves","flower","bench"]');
 if (r->>'correct')::boolean or exists(select 1 from rpg_private.school_workshop where student_id=sid) then raise exception 'Wrong observation saved'; end if;
 r:=public.student_school_workshop(t,'garden','["leaves","flower","can","bench"]');
 if (r->>'correct')::boolean then raise exception 'Too many choices accepted'; end if;
 r:=public.student_school_workshop(t,'garden','["can","flower","leaves"]');
 if not (r->>'correct')::boolean then raise exception 'Correct observation rejected'; end if;
 select garden_completed_at into stamp_time from rpg_private.school_workshop where student_id=sid;
 perform public.student_school_workshop(t,'garden','["leaves","flower","can"]');
 if (select garden_completed_at<>stamp_time from rpg_private.school_workshop where student_id=sid) then raise exception 'Replay rewrote first completion'; end if;
 blocked:=false;begin perform public.student_school_workshop(t,'cover','paper');exception when others then blocked:=true;end;
 if not blocked then raise exception 'Lv7 bypassed Lv8 cover gate'; end if;
 update public.students set xp=535 where id=sid;
 blocked:=false;begin perform public.student_school_workshop(t,'cover','sprout');exception when others then blocked:=true;end;
 if not blocked then raise exception 'Cover stamp gate bypassed'; end if;
 perform public.student_explore_school(t,'classroom-1',0);
 perform public.student_explore_school(t,'classroom-2',1);
 perform public.student_explore_school(t,'classroom-3',2);
 perform public.student_school_workshop(t,'cover','sprout');
 r:=public.student_learning_journal(t);
 if r->'workshop'->>'cover'<>'sprout' or not (r->'workshop'->>'garden_complete')::boolean then raise exception 'Workshop not restored in journal'; end if;
 r:=public.student_learning_journal(t2);
 if r->'workshop'->>'cover'<>'paper' or (r->'workshop'->>'garden_complete')::boolean then raise exception 'Student data leaked'; end if;
 blocked:=false;begin perform public.student_school_workshop(t,'cover','unknown');exception when others then blocked:=true;end;
 if not blocked then raise exception 'Unknown cover accepted'; end if;
 blocked:=false;begin perform public.student_explore_school(t,'cafeteria-1',1);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Lv8 bypassed cafeteria gate'; end if;
 update public.students set xp=630 where id=sid;
 blocked:=false;begin perform public.student_explore_school(t,'cafeteria-3',0);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Cafeteria sequence bypassed'; end if;
 perform public.student_explore_school(t,'cafeteria-1',1);
 perform public.student_explore_school(t,'cafeteria-2',2);
 perform public.student_explore_school(t,'cafeteria-3',0);
 if jsonb_array_length(public.student_learning_journal(t)->'exploration')<>6 then raise exception 'Cafeteria stamp not saved'; end if;
 if (select gold<>old_gold or xp<>630 from public.students where id=sid) then raise exception 'Cosmetics changed economy'; end if;
 if has_table_privilege('anon','rpg_private.school_workshop','INSERT') or has_table_privilege('authenticated','rpg_private.school_workshop','SELECT') then raise exception 'Private table exposed'; end if;
 perform set_config('rpg.test_workshop_token',t,true);
end $test$;
set local role anon;
do $role_test$
declare blocked boolean:=false;
begin
 if public.student_school_workshop(current_setting('rpg.test_workshop_token'),'cover','paper')->>'cover'<>'paper' then raise exception 'Anon RPC failed'; end if;
 begin perform 1 from rpg_private.school_workshop;exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception 'Anon can read private records'; end if;
end $role_test$;
reset role;
set local role authenticated;
do $role_test$
declare blocked boolean:=false;
begin
 if public.student_school_workshop(current_setting('rpg.test_workshop_token'),'cover','sprout')->>'cover'<>'sprout' then raise exception 'Authenticated RPC failed'; end if;
 begin perform 1 from rpg_private.school_workshop;exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception 'Authenticated can read private records'; end if;
end $role_test$;
reset role;
rollback;
select 'PASS: Lv7/8/9 boundaries, token isolation, invalid/extra choices, saved/replayed observation, stamp-gated covers, cafeteria sequence, no economy writes, private table grants' as result;
