-- Two synthetic development fixtures; every change below is rolled back.
begin;
do $test$
declare sid bigint;other_sid bigint;t text:=gen_random_uuid()::text;t2 text:=gen_random_uuid()::text;blocked boolean;bad record;r jsonb;old jsonb;first_at text;picture jsonb;
begin
 select id into sid from public.students order by id limit 1;select id into other_sid from public.students where id<>sid order by id limit 1;if other_sid is null then raise exception 'Need two synthetic fixtures';end if;
 delete from rpg_private.school_finale where student_id in(sid,other_sid);
 delete from rpg_private.school_kindness where student_id in(sid,other_sid);
 delete from rpg_private.school_art where student_id in(sid,other_sid);
 delete from rpg_private.school_exploration where student_id in(sid,other_sid)and step_id in('music-sequence-3','parcel-3','letter-3');
 update public.students set xp=1819,session_hash=encode(extensions.digest(convert_to(t,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '1 hour'where id=sid;
 update public.students set xp=1820,session_hash=encode(extensions.digest(convert_to(t2,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '1 hour'where id=other_sid;
 blocked:=false;begin perform public.student_school_finale(null,'read');exception when others then blocked:=true;end;if not blocked then raise exception 'Null token';end if;
 blocked:=false;begin perform public.student_school_finale('invalid','read');exception when others then blocked:=true;end;if not blocked then raise exception 'Invalid token';end if;
 update public.students set session_expires_at=now()-interval '1 second'where id=sid;
 blocked:=false;begin perform public.student_school_finale(t,'read');exception when others then blocked:=true;end;if not blocked then raise exception 'Expired token';end if;
 update public.students set session_expires_at=now()+interval '1 hour'where id=sid;
 blocked:=false;begin perform public.student_school_finale(t,null);exception when others then blocked:=true;end;if not blocked then raise exception 'Null action';end if;
 blocked:=false;begin perform public.student_school_finale(t,'invented');exception when others then blocked:=true;end;if not blocked then raise exception 'Unknown action';end if;
 r:=public.student_school_finale(t,'read');if jsonb_array_length(r->'earned')<>0 or r->>'completed_at' is not null then raise exception 'Unearned memory exposed';end if;
 blocked:=false;begin perform public.student_school_finale(t2,'save',array['melody','parcel','letter'],'meadow');exception when others then blocked:=true;end;if not blocked then raise exception 'Unfinished memories accepted';end if;
 blocked:=false;begin perform public.student_school_finale(t2,'wear',null,null,true);exception when others then blocked:=true;end;if not blocked then raise exception 'Unearned ribbon';end if;
 insert into rpg_private.school_exploration(student_id,step_id)select sid,id from unnest(array['music-sequence-3','parcel-3','letter-3'])id;
 blocked:=false;begin perform public.student_school_finale(t,'save',array['melody','parcel','letter'],'meadow');exception when others then blocked:=true;end;if not blocked then raise exception 'Lv19 bypass';end if;
 update public.students set xp=1820 where id=sid;
 for bad in select value from(values(null::text[]),(array[]::text[]),(array['melody','parcel']),(array['melody','parcel',null]),(array['melody','melody','letter']),(array['melody','parcel','invented']),(array[['melody','parcel','letter']]),('[0:2]={melody,parcel,letter}'::text[]))v(value)loop
  blocked:=false;begin perform public.student_school_finale(t,'save',bad.value,'meadow');exception when others then blocked:=true;end;if not blocked then raise exception 'Invalid memory array accepted: %',bad.value;end if;
 end loop;
 blocked:=false;begin perform public.student_school_finale(t,'save',array['melody','parcel','letter'],null);exception when others then blocked:=true;end;if not blocked then raise exception 'Null ribbon';end if;
 blocked:=false;begin perform public.student_school_finale(t,'save',array['melody','parcel','letter'],'invented');exception when others then blocked:=true;end;if not blocked then raise exception 'Unknown ribbon';end if;
 old:=jsonb_build_object('gold',(select gold from public.students where id=sid),'items',(select count(*)from public.student_items where student_id=sid),'stamps',(select count(*)from rpg_private.school_exploration where student_id=sid),'gifts',(select count(*)from public.level_reward_claims where student_id=sid));
 r:=public.student_school_finale(t,'save',array['letter','melody','parcel'],'sky');first_at:=r->>'completed_at';if first_at is null or not(r->>'wearing')::boolean or r->'memories'<>'["letter","melody","parcel"]'::jsonb then raise exception 'Choice not preserved';end if;
 r:=public.student_school_finale(t,'save',array['letter','melody','parcel'],'sky');if r->>'completed_at'<>first_at then raise exception 'Replay changed first completion';end if;
 r:=public.student_school_finale(t2,'read');if jsonb_array_length(r->'earned')<>0 or r->>'completed_at' is not null then raise exception 'Cross-account leak';end if;
 blocked:=false;begin perform public.student_school_finale(t2,'save',array['letter','melody','parcel'],'sky');exception when others then blocked:=true;end;if not blocked then raise exception 'Borrowed memory';end if;
 insert into rpg_private.school_kindness(student_id,phase,choices,pin,wearing,completed_at)values(sid,4,array['listen','library','walk','leaf'],'leaf',true,now());
 insert into rpg_private.school_art(student_id,phase,cells,stamp,completed_at,decorated_at)values(sid,2,array_fill('green'::text,array[25]),'heart',now(),now());
 picture:=rpg_private.art_state(sid);r:=public.student_school_finale(t,'read');if jsonb_array_length(r->'earned')<>5 then raise exception 'Missing earned choices';end if;
 update public.students set xp=0 where id=sid;
 r:=public.student_school_finale(t,'wear',null,null,false);if(r->>'wearing')::boolean then raise exception 'Hide failed';end if;
 r:=public.student_school_finale(t,'save',array['kindness','art','letter'],'sunset');if r->>'completed_at'<>first_at or(r->>'wearing')::boolean then raise exception 'Edit reset completion/wearing';end if;
 if picture<>rpg_private.art_state(sid)then raise exception 'Original artwork changed';end if;
 blocked:=false;begin perform public.student_school_finale(t,'wear');exception when others then blocked:=true;end;if not blocked then raise exception 'Null wearing';end if;
 if old<>jsonb_build_object('gold',(select gold from public.students where id=sid),'items',(select count(*)from public.student_items where student_id=sid),'stamps',(select count(*)from rpg_private.school_exploration where student_id=sid),'gifts',(select count(*)from public.level_reward_claims where student_id=sid))or(select xp from public.students where id=sid)<>0 then raise exception 'Economy/stamps/gifts changed';end if;
 perform set_config('rpg.finale_test_token',t,true);
end $test$;
set local role anon;
do $role$ declare blocked boolean;begin
 if public.student_school_finale(current_setting('rpg.finale_test_token'),'read')->>'completed_at' is null then raise exception 'Anon read';end if;
 perform public.student_school_finale(current_setting('rpg.finale_test_token'),'wear',null,null,true);
 blocked:=false;begin perform 1 from rpg_private.school_finale;exception when insufficient_privilege then blocked:=true;end;if not blocked then raise exception 'Private table exposed';end if;
 blocked:=false;begin perform rpg_private.finale_state(1);exception when insufficient_privilege then blocked:=true;end;if not blocked then raise exception 'Private helper exposed';end if;
end $role$;
reset role;
set local role authenticated;
do $role$ begin perform public.student_school_finale(current_setting('rpg.finale_test_token'),'save',array['art','letter','kindness'],'meadow');end $role$;
reset role;
rollback;
select 'PASS: Lv20/token/earned memory gates, bounded arrays/enums, 3 of 5 choices, replay/edit timestamp, account isolation, wear/XP correction, original art and economy/items/stamps/level gifts, actual roles/private denial' result;
