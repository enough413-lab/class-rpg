begin;
do $test$
declare sid bigint; other_sid bigint; token text:=gen_random_uuid()::text; other_token text:=gen_random_uuid()::text;
 blocked boolean; stamp timestamptz; old_gold integer; r jsonb;
begin
 select id,gold into sid,old_gold from public.students order by id limit 1;
 select id into other_sid from public.students where id<>sid order by id limit 1;
 if other_sid is null then raise exception 'Need two staging fixtures'; end if;
 delete from rpg_private.school_workshop where student_id in (sid,other_sid);
 delete from rpg_private.school_exploration where student_id in (sid,other_sid);
 update public.students set xp=729,session_hash=encode(extensions.digest(convert_to(token,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '1 hour' where id=sid;
 update public.students set session_hash=encode(extensions.digest(convert_to(other_token,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '1 hour' where id=other_sid;
 blocked:=false;begin perform public.student_complete_school_chapter('invalid','reading',true);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Invalid token accepted'; end if;
 blocked:=false;begin perform public.student_complete_school_chapter(token,'reading',true);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Lv9 bypassed memento gate'; end if;
 update public.students set xp=730 where id=sid;
 blocked:=false;begin perform public.student_complete_school_chapter(token,'reading',true);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Missing stamps allowed'; end if;
 insert into rpg_private.school_exploration(student_id,step_id)
 select sid,c.name||'-'||n from (values('classroom'),('hallway'),('library'),('garden'),('playground'),('pond'),('cafeteria')) c(name) cross join generate_series(1,3) n;
 blocked:=false;begin perform public.student_complete_school_chapter(token,'reading',true);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Missing observation allowed'; end if;
 perform public.student_school_workshop(token,'garden','["can","flower","leaves"]');
 blocked:=false;begin perform public.student_complete_school_chapter(token,'invented',true);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Invalid promise allowed'; end if;
 blocked:=false;begin perform public.student_complete_school_chapter(token,'reading',null);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Null badge allowed'; end if;
 r:=public.student_complete_school_chapter(token,'reading',true);
 if not (r->>'chapter_one_complete')::boolean or r->>'chapter_one_promise'<>'reading' then raise exception 'Valid chapter did not complete'; end if;
 select chapter_one_completed_at into stamp from rpg_private.school_workshop where student_id=sid;
 perform public.student_complete_school_chapter(token,'reading',true);
 if (select chapter_one_completed_at from rpg_private.school_workshop where student_id=sid)<>stamp then raise exception 'Replay replaced first completion'; end if;
 r:=public.student_learning_journal(other_token);
 if (r->'workshop'->>'chapter_one_complete')::boolean then raise exception 'Chapter leaked to other student'; end if;
 if (select gold<>old_gold or xp<>730 from public.students where id=sid) then raise exception 'Memento changed economy'; end if;
 -- Preserve the earned cosmetic when a teacher corrects XP later.
 update public.students set xp=0 where id=sid;
 perform public.student_complete_school_chapter(token,'kindness',false);
 r:=public.student_learning_journal(token);
 if (r->'workshop'->>'chapter_one_badge')::boolean or r->'workshop'->>'chapter_one_promise'<>'kindness' then raise exception 'Earned memento could not be edited'; end if;
 perform set_config('rpg.test_chapter_token',token,true);
end $test$;
set local role anon;
do $role_test$
begin
 if not (public.student_complete_school_chapter(current_setting('rpg.test_chapter_token'),'observation',true)->>'chapter_one_badge')::boolean then raise exception 'Anon RPC failed'; end if;
end $role_test$;
reset role;
set local role authenticated;
do $role_test$
declare blocked boolean:=false;
begin
 if not (public.student_learning_journal(current_setting('rpg.test_chapter_token'))->'workshop'->>'chapter_one_complete')::boolean then raise exception 'Authenticated journal failed'; end if;
 begin perform 1 from rpg_private.school_workshop;exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception 'Private progress readable'; end if;
end $role_test$;
reset role;
rollback;
select 'PASS: Lv10/stamp/observation gates, valid promise, receipt replay, no XP/gold change, token isolation, saved cosmetic, retained earned memento after XP correction, anon/authenticated RPC and denied table access' as result;
