-- Generated staging fixtures only. No production access; every fixture change rolls back.
begin;
do $test$
declare sid bigint; other_sid bigint; token text:=gen_random_uuid()::text; other_token text:=gen_random_uuid()::text;
 blocked boolean; r jsonb; stamp timestamptz; old_gold integer;
begin
 select id,gold into sid,old_gold from public.students order by id limit 1;
 select id into other_sid from public.students where id<>sid order by id limit 1;
 if other_sid is null then raise exception 'Need two staging fixtures'; end if;
 delete from rpg_private.school_exploration where student_id in (sid,other_sid);
 delete from rpg_private.school_workshop where student_id in (sid,other_sid);
 update public.students set xp=1034,session_hash=encode(extensions.digest(convert_to(token,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '1 hour' where id=sid;
 update public.students set xp=0,session_hash=encode(extensions.digest(convert_to(other_token,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '1 hour' where id=other_sid;
 blocked:=false;begin perform public.student_music_room('invalid','music-room-1',1);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Invalid token accepted'; end if;
 blocked:=false;begin perform public.student_music_room(null,'music-room-1',1);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Null token accepted'; end if;
 blocked:=false;begin perform public.student_music_room(token,'music-room-1',1);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Lv12 bypassed Lv13'; end if;
 update public.students set xp=1035,session_expires_at=now()-interval '1 second' where id=sid;
 blocked:=false;begin perform public.student_music_room(token,'music-room-1',1);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Expired token accepted'; end if;
 update public.students set session_expires_at=now()+interval '1 hour' where id=sid;
 blocked:=false;begin perform public.student_music_room(token,'music-room-2',0);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Sequence bypassed'; end if;
 blocked:=false;begin perform public.student_music_room(token,'invented',1);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Invented step allowed'; end if;
 blocked:=false;begin perform public.student_music_room(token,'music-room-1',null);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Null choice allowed'; end if;
 blocked:=false;begin perform public.student_music_room(token,'music-room-1',3);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Out-of-bounds choice allowed'; end if;
 blocked:=false;begin perform public.student_music_room(token,'music-room-1',-1);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Negative choice allowed'; end if;
 r:=public.student_music_room(token,'music-room-1',0);
 if (r->>'correct')::boolean then raise exception 'Wrong choice accepted'; end if;
 if exists(select 1 from rpg_private.school_exploration where student_id=sid) then raise exception 'Incorrect response saved'; end if;
 r:=public.student_music_room(token,'music-room-1',1);
 if not (r->>'correct')::boolean or not (r->>'new')::boolean then raise exception 'Valid choice rejected'; end if;
 select completed_at into stamp from rpg_private.school_exploration where student_id=sid and step_id='music-room-1';
 r:=public.student_music_room(token,'music-room-1',1);
 if (r->>'new')::boolean or (select completed_at from rpg_private.school_exploration where student_id=sid and step_id='music-room-1')<>stamp then raise exception 'Replay rewrote completion'; end if;
 if jsonb_array_length(public.student_learning_journal(other_token)->'exploration')<>0 then raise exception 'Progress leaked'; end if;
 blocked:=false;begin perform public.student_music_room(other_token,'music-room-1',1);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Another student borrowed unlock'; end if;
 update public.students set xp=0 where id=sid;
 perform public.student_music_room(token,'music-room-2',0);
 r:=public.student_music_room(token,'music-room-3',3);
 if (r->>'correct')::boolean then raise exception 'Wrong rest accepted'; end if;
 perform public.student_music_room(token,'music-room-3',2);
 if jsonb_array_length(public.student_learning_journal(token)->'exploration')<>3 then raise exception 'Journal did not restore music'; end if;
 if (select gold<>old_gold or xp<>0 from public.students where id=sid) then raise exception 'Music changed economy'; end if;
 update public.students set xp=1035 where id=sid;
 blocked:=false;begin perform public.student_school_workshop(token,'cover','sprout');exception when others then blocked:=true;end;
 if not blocked then raise exception 'Music counted as location stamps'; end if;
 blocked:=false;begin perform public.student_complete_school_chapter(token,'reading',true);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Music bypassed first chapter'; end if;
 perform set_config('rpg.music_test_token',token,true);
end $test$;
set local role anon;
do $role_test$
declare blocked boolean:=false;
begin
 if not (public.student_music_room(current_setting('rpg.music_test_token'),'music-room-3',2)->>'correct')::boolean then raise exception 'Anon RPC failed'; end if;
 begin perform 1 from rpg_private.school_exploration;exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception 'Private progress exposed'; end if;
end $role_test$;
reset role;
set local role authenticated;
do $role_test$
begin
 if not (public.student_music_room(current_setting('rpg.music_test_token'),'music-room-1',1)->>'correct')::boolean then raise exception 'Authenticated RPC failed'; end if;
end $role_test$;
reset role;
rollback;
select 'PASS: Lv13 boundary, invalid/expired tokens and choices, ordered answers, replay, account isolation, journal, XP correction continuity, unchanged XP/gold, no inflated stamps, real anon/authenticated access' as result;
