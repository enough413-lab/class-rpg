-- Development database only; all fixture sessions and play changes roll back.
begin;
do $test$
declare sid bigint; other_sid bigint; t text:=gen_random_uuid()::text; t2 text:=gen_random_uuid()::text;
 request uuid:=gen_random_uuid(); blocked boolean; r jsonb; bad jsonb; tab record; digest text; before_tables jsonb:='{}';
 carry jsonb:='{"v":1,"mode":"carrying","bites":1,"meals":2,"washed":true}';
begin
 -- Insert isolated synthetic fixtures; do not rotate any existing student's session.
 for tab in select teacher.user_id as teacher_id,n from public.teacher_profiles teacher cross join generate_series(1,99)n where not exists(select 1 from public.students s where s.teacher_id=teacher.user_id and s.student_number=n) order by n desc limit 2 loop
  insert into public.students(teacher_id,student_number,login_id,pin_hash,nickname,session_hash,session_expires_at)
   values(tab.teacher_id,tab.n,'meal-audit-'||gen_random_uuid()::text,'not-a-login','식판검증'||substr(gen_random_uuid()::text,1,8),encode(extensions.digest(convert_to(case when sid is null then t else t2 end,'UTF8'),'sha256'),'hex'),now()+interval '1 hour') returning id into other_sid;
  if sid is null then sid:=other_sid;end if;
 end loop;
 if sid is null or other_sid=sid then raise exception 'Need two free synthetic fixture slots';end if;
 for tab in select schemaname,tablename from pg_tables where schemaname in('public','rpg_private') and tablename<>'cafeteria_play' loop
  execute format('select md5(coalesce(string_agg(to_jsonb(t)::text, E''\n'' order by to_jsonb(t)::text),'''')) from %I.%I t',tab.schemaname,tab.tablename) into digest;
  before_tables:=before_tables||jsonb_build_object(tab.schemaname||'.'||tab.tablename,digest);
 end loop;
 if public.student_cafeteria_play(t)->>'revision'<>'0' then raise exception 'Fresh state';end if;
 r:=public.student_cafeteria_play(t,carry,0,request);
 if r->>'revision'<>'1' or r->'state'<>carry then raise exception 'First save';end if;
 if public.student_cafeteria_play(t,carry,0,request)<>r then raise exception 'Lost reply replay increments state';end if;
 if public.student_cafeteria_play(t)->'state'<>carry then raise exception 'Second device read';end if;
 if public.student_cafeteria_play(t2)->>'revision'<>'0' then raise exception 'Other account leak';end if;
 r:=public.student_cafeteria_play(t,carry||'{"bites":2}',0,gen_random_uuid());
 if not (r->>'conflict')::boolean or r->'state'<>carry then raise exception 'Stale device overwrote state';end if;
 blocked:=false;begin perform public.student_cafeteria_play(t,carry||'{"bites":2}',1,request);exception when others then blocked:=true;end;if not blocked then raise exception 'Changed replay accepted';end if;
 for bad in select value from jsonb_array_elements('[null,{},[],{"v":1,"mode":"finished","bites":0,"meals":1,"washed":false}]') loop
  if bad='null'::jsonb then bad:='{"v":null}';end if;
  blocked:=false;begin perform public.student_cafeteria_play(t,bad,1,gen_random_uuid());exception when others then blocked:=true;end;if not blocked then raise exception 'Malformed accepted';end if;
 end loop;
 for bad in select carry||v from unnest(array['{"bites":-1}','{"bites":4}','{"bites":3}','{"bites":"1"}','{"bites":null}','{"meals":1000}','{"meals":1.2}','{"meals":-1}','{"meals":null}','{"washed":null}','{"student_id":123}','{"gold":100}','{"v":2}','{"mode":"eating"}','{"mode":"free"}']::jsonb[])v loop
  blocked:=false;begin perform public.student_cafeteria_play(t,bad,1,gen_random_uuid());exception when others then blocked:=true;end;if not blocked then raise exception 'Invalid state accepted: %',bad;end if;
 end loop;
 blocked:=false;begin perform public.student_cafeteria_play(null);exception when others then blocked:=true;end;if not blocked then raise exception 'Null token';end if;
 blocked:=false;begin perform public.student_cafeteria_play('invalid');exception when others then blocked:=true;end;if not blocked then raise exception 'Bad token';end if;
 blocked:=false;begin perform public.student_cafeteria_play(t,carry,null,gen_random_uuid());exception when others then blocked:=true;end;if not blocked then raise exception 'Missing revision';end if;
 blocked:=false;begin perform public.student_cafeteria_play(t,carry,1,null);exception when others then blocked:=true;end;if not blocked then raise exception 'Missing request';end if;
 perform public.student_cafeteria_play(t,carry||'{"mode":"finished","bites":3}',1,gen_random_uuid());
 r:=public.student_cafeteria_play(t,'{"v":1,"mode":"free","bites":0,"meals":3,"washed":true}',2,gen_random_uuid());
 if r->>'revision'<>'3' then raise exception 'Eat-return progression';end if;
 for tab in select schemaname,tablename from pg_tables where schemaname in('public','rpg_private') and tablename<>'cafeteria_play' loop
  execute format('select md5(coalesce(string_agg(to_jsonb(t)::text, E''\n'' order by to_jsonb(t)::text),'''')) from %I.%I t',tab.schemaname,tab.tablename) into digest;
  if before_tables->>(tab.schemaname||'.'||tab.tablename)<>digest then raise exception 'Existing table changed: %.%',tab.schemaname,tab.tablename;end if;
 end loop;
 update public.students set session_expires_at=now()-interval '1 second' where id=other_sid;
 blocked:=false;begin perform public.student_cafeteria_play(t2);exception when others then blocked:=true;end;if not blocked then raise exception 'Expired token';end if;
 perform set_config('rpg.meal_test_token',t,true);
end $test$;
set local role anon;
do $test$ declare blocked boolean;begin
 if public.student_cafeteria_play(current_setting('rpg.meal_test_token'))->>'revision'<>'3' then raise exception 'Anon token path';end if;
 blocked:=false;begin perform 1 from rpg_private.cafeteria_play;exception when insufficient_privilege then blocked:=true;end;if not blocked then raise exception 'Private table exposed';end if;
end $test$;
reset role;
set local role authenticated;
do $test$ declare blocked boolean;begin
 perform public.student_cafeteria_play(current_setting('rpg.meal_test_token'));
 blocked:=false;begin perform 1 from rpg_private.cafeteria_play;exception when insufficient_privilege then blocked:=true;end;if not blocked then raise exception 'Private table exposed';end if;
end $test$;
reset role;
rollback;
select 'PASS: meal CAS, replay, two accounts, tokens, malformed input, private grants, all existing table contents unchanged; transaction rolled back' as result;
