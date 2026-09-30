-- Test students only, all fixture changes roll back.
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
 update public.students set xp=829,session_hash=encode(extensions.digest(convert_to(token,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '1 hour' where id=sid;
 update public.students set session_hash=encode(extensions.digest(convert_to(other_token,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '1 hour' where id=other_sid;
 blocked:=false;begin perform public.student_library_evidence('invalid','library-evidence-1',1,1);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Invalid token accepted'; end if;
 blocked:=false;begin perform public.student_library_evidence(token,'library-evidence-1',1,1);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Lv10 bypassed Lv11'; end if;
 update public.students set xp=830 where id=sid;
 blocked:=false;begin perform public.student_library_evidence(token,'library-evidence-2',0,2);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Sequence bypassed'; end if;
 blocked:=false;begin perform public.student_library_evidence(token,'invented',1,1);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Invented case allowed'; end if;
 blocked:=false;begin perform public.student_library_evidence(token,'library-evidence-1',null,1);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Null claim allowed'; end if;
 blocked:=false;begin perform public.student_library_evidence(token,'library-evidence-1',1,3);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Invalid evidence allowed'; end if;
 r:=public.student_library_evidence(token,'library-evidence-1',0,1);
 if (r->>'correct')::boolean or r->>'reason'<>'claim' then raise exception 'Wrong claim accepted'; end if;
 r:=public.student_library_evidence(token,'library-evidence-1',1,2);
 if (r->>'correct')::boolean or r->>'reason'<>'evidence' then raise exception 'Wrong evidence accepted'; end if;
 if exists(select 1 from rpg_private.school_exploration where student_id=sid) then raise exception 'Incorrect response saved'; end if;
 r:=public.student_library_evidence(token,'library-evidence-1',1,1);
 if not (r->>'correct')::boolean then raise exception 'Valid pair rejected'; end if;
 select completed_at into stamp from rpg_private.school_exploration where student_id=sid and step_id='library-evidence-1';
 perform public.student_library_evidence(token,'library-evidence-1',1,1);
 if (select completed_at from rpg_private.school_exploration where student_id=sid and step_id='library-evidence-1')<>stamp then raise exception 'Replay rewrote first completion'; end if;
 if jsonb_array_length(public.student_learning_journal(other_token)->'exploration')<>0 then raise exception 'Progress leaked'; end if;
 -- Keep a started activity available if XP is corrected after entry.
 update public.students set xp=0 where id=sid;
 perform public.student_library_evidence(token,'library-evidence-2',0,2);
 perform public.student_library_evidence(token,'library-evidence-3',2,0);
 if jsonb_array_length(public.student_learning_journal(token)->'exploration')<>3 then raise exception 'Journal did not restore cases'; end if;
 if (select gold<>old_gold or xp<>0 from public.students where id=sid) then raise exception 'Reading practice changed economy'; end if;
 update public.students set xp=830 where id=sid;
 blocked:=false;begin perform public.student_school_workshop(token,'cover','sprout');exception when others then blocked:=true;end;
 if not blocked then raise exception 'Evidence cases counted as location stamps'; end if;
 blocked:=false;begin perform public.student_complete_school_chapter(token,'reading',true);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Evidence cases bypassed first chapter'; end if;
 perform set_config('rpg.evidence_test_token',token,true);
end $test$;
set local role anon;
do $role_test$
declare blocked boolean:=false;
begin
 if not (public.student_library_evidence(current_setting('rpg.evidence_test_token'),'library-evidence-3',2,0)->>'correct')::boolean then raise exception 'Anon RPC failed'; end if;
 begin perform 1 from rpg_private.school_exploration;exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception 'Private progress exposed'; end if;
end $role_test$;
reset role;
set local role authenticated;
do $role_test$
begin
 if not (public.student_library_evidence(current_setting('rpg.evidence_test_token'),'library-evidence-1',1,1)->>'correct')::boolean then raise exception 'Authenticated RPC failed'; end if;
end $role_test$;
reset role;
rollback;
select 'PASS: Lv11 boundary, invalid inputs, sequence, claim+evidence pairs, replay, restored progress, student isolation, unchanged XP/gold, no inflated stamps, retained unlock after XP correction, real role access' as result;
