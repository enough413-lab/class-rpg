-- Synthetic staging-only fixtures; every mutation rolls back.
begin;
do $test$
declare sid bigint; other_sid bigint; t text:=gen_random_uuid()::text; t2 text:=gen_random_uuid()::text; blocked boolean; r jsonb; first_at timestamptz; old_gold integer; old_stamps integer;
begin
 select id,gold into sid,old_gold from public.students order by id limit 1;
 select id into other_sid from public.students where id<>sid order by id limit 1;
 if other_sid is null then raise exception 'Need two fixtures'; end if;
 delete from rpg_private.school_kindness where student_id in (sid,other_sid);
 select count(*) into old_stamps from rpg_private.school_exploration where student_id=sid;
 update public.students set xp=1249,session_hash=encode(extensions.digest(convert_to(t,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '1 hour' where id=sid;
 update public.students set xp=1250,session_hash=encode(extensions.digest(convert_to(t2,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '1 hour' where id=other_sid;
 blocked:=false;begin perform public.student_kindness_chapter('invalid','kindness-1','listen');exception when others then blocked:=true;end;if not blocked then raise exception 'Invalid token allowed';end if;
 blocked:=false;begin perform public.student_kindness_chapter(null,'kindness-1','listen');exception when others then blocked:=true;end;if not blocked then raise exception 'Null token allowed';end if;
 blocked:=false;begin perform public.student_kindness_chapter(t,'kindness-1','listen');exception when others then blocked:=true;end;if not blocked then raise exception 'Lv14 bypassed Lv15';end if;
 update public.students set xp=1250,session_expires_at=now()-interval '1 second' where id=sid;
 blocked:=false;begin perform public.student_kindness_chapter(t,'kindness-1','listen');exception when others then blocked:=true;end;if not blocked then raise exception 'Expired token allowed';end if;
 update public.students set session_expires_at=now()+interval '1 hour' where id=sid;
 blocked:=false;begin perform public.student_kindness_chapter(t,'kindness-2','library');exception when others then blocked:=true;end;if not blocked then raise exception 'Sequence bypassed';end if;
 blocked:=false;begin perform public.student_kindness_chapter(t,'kindness-1','invented');exception when others then blocked:=true;end;if not blocked then raise exception 'Invalid choice allowed';end if;
 blocked:=false;begin perform public.student_kindness_chapter(t,null,'listen');exception when others then blocked:=true;end;if not blocked then raise exception 'Null step allowed';end if;
 blocked:=false;begin perform public.student_kindness_chapter(t,'kindness-1',null);exception when others then blocked:=true;end;if not blocked then raise exception 'Null choice allowed';end if;
 blocked:=false;begin perform public.student_kindness_chapter(t,'invented','listen');exception when others then blocked:=true;end;if not blocked then raise exception 'Invalid step allowed';end if;
 blocked:=false;begin perform public.student_kindness_chapter(t,'wear','show');exception when others then blocked:=true;end;if not blocked then raise exception 'Unearned pin worn';end if;
 r:=public.student_kindness_chapter(t,'kindness-1','ask');if (r->>'phase')::integer<>1 then raise exception 'First phase not saved';end if;
 r:=public.student_kindness_chapter(t,'kindness-1','ask');if jsonb_array_length(r->'choices')<>1 then raise exception 'Retry duplicated choice';end if;
 blocked:=false;begin perform public.student_kindness_chapter(t,'kindness-1','listen');exception when others then blocked:=true;end;if not blocked then raise exception 'Recorded branch rewritten';end if;
 if (public.student_learning_journal(t2)->'kindness'->>'phase')::integer<>0 then raise exception 'Progress leaked to another student';end if;
 update public.students set xp=0 where id=sid;
 r:=public.student_kindness_chapter(t,'kindness-2','shop');if (r->>'correct')::boolean then raise exception 'Wrong route accepted';end if;
 if (public.student_learning_journal(t)->'kindness'->>'phase')::integer<>1 then raise exception 'Wrong route saved';end if;
 perform public.student_kindness_chapter(t,'kindness-2','library');
 perform public.student_kindness_chapter(t,'kindness-3','introduce');
 r:=public.student_kindness_chapter(t,'kindness-4','leaf');if (r->>'phase')::integer<>4 or not (r->>'wearing')::boolean or r->>'pin'<>'leaf' then raise exception 'Pin missing';end if;
 first_at:=(r->>'completed_at')::timestamptz;
 r:=public.student_kindness_chapter(t,'kindness-4','leaf');if (r->>'completed_at')::timestamptz<>first_at then raise exception 'Completion timestamp rewritten';end if;
 r:=public.student_kindness_chapter(t,'pin','star');if r->>'pin'<>'star' or r->'choices'->>3<>'leaf' or (r->>'completed_at')::timestamptz<>first_at then raise exception 'Cosmetic edit rewrote story';end if;
 r:=public.student_kindness_chapter(t,'wear','hide');if (r->>'wearing')::boolean then raise exception 'Pin hide failed';end if;
 perform public.student_kindness_chapter(t,'wear','show');
 blocked:=false;begin perform public.student_kindness_chapter(t,'pin','invented');exception when others then blocked:=true;end;if not blocked then raise exception 'Invalid pin allowed';end if;
 blocked:=false;begin perform public.student_kindness_chapter(t,'wear','invented');exception when others then blocked:=true;end;if not blocked then raise exception 'Invalid wear setting allowed';end if;
 if (select gold<>old_gold or xp<>0 from public.students where id=sid) then raise exception 'Economy changed';end if;
 if (select count(*) from rpg_private.school_exploration where student_id=sid)<>old_stamps then raise exception 'Story inflated school stamps';end if;
 perform public.student_kindness_chapter(t2,'kindness-1','listen');perform public.student_kindness_chapter(t2,'kindness-2','library');perform public.student_kindness_chapter(t2,'kindness-3','walk');r:=public.student_kindness_chapter(t2,'kindness-4','sun');
 if r->'choices'->>0<>'listen' or r->'choices'->>2<>'walk' then raise exception 'Alternate safe branch not saved';end if;
 perform set_config('rpg.kindness_test_token',t,true);
end $test$;
set local role anon;
do $roles$
declare blocked boolean:=false;
begin
 if not (public.student_kindness_chapter(current_setting('rpg.kindness_test_token'),'wear','show')->>'wearing')::boolean then raise exception 'Anon RPC failed';end if;
 begin perform 1 from rpg_private.school_kindness;exception when insufficient_privilege then blocked:=true;end;if not blocked then raise exception 'Private table exposed';end if;
 blocked:=false;begin perform rpg_private.kindness_state(1);exception when insufficient_privilege then blocked:=true;end;if not blocked then raise exception 'Private helper exposed';end if;
end $roles$;
reset role;
set local role authenticated;
do $roles$ begin
 if (public.student_learning_journal(current_setting('rpg.kindness_test_token'))->'kindness'->>'phase')::integer<>4 then raise exception 'Authenticated journal failed';end if;
end $roles$;
reset role;
rollback;
select 'PASS: Lv15/token gates, ordered and alternative branches, wrong route, retry timestamp, cosmetics, XP continuity, ownership, unchanged economy/stamps and actual roles' result;
