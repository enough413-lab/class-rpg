-- Development only. Synthetic teachers/students/reviews; never rotate an existing session.
begin;
do $test$
declare teacher uuid:=gen_random_uuid(); other_teacher uuid:=gen_random_uuid(); sid bigint; peer bigint; outsider bigint;
 token text:=gen_random_uuid()::text; other_token text:=gen_random_uuid()::text; result jsonb; second jsonb; blocked boolean; i integer;
 tab record; digest text; before_tables jsonb:='{}'; old_id bigint;
begin
 insert into auth.users(id) values(teacher),(other_teacher);
 insert into public.teacher_profiles(user_id) values(teacher),(other_teacher);
 insert into public.students(teacher_id,student_number,login_id,pin_hash,nickname,session_hash,session_expires_at)
 values(teacher,1,'title-test-'||gen_random_uuid(),'not-a-login','검증나래',encode(extensions.digest(convert_to(token,'UTF8'),'sha256'),'hex'),now()+interval '1 hour') returning id into sid;
 insert into public.students(teacher_id,student_number,login_id,pin_hash,nickname,session_hash,session_expires_at)
 values(teacher,2,'title-test-'||gen_random_uuid(),'not-a-login','검증초록',encode(extensions.digest(convert_to(other_token,'UTF8'),'sha256'),'hex'),now()+interval '1 hour') returning id into peer;
 insert into public.students(teacher_id,student_number,login_id,pin_hash,nickname)
 values(other_teacher,1,'title-test-'||gen_random_uuid(),'not-a-login','다른반검증') returning id into outsider;
 insert into rpg_private.reading_share_settings(teacher_id,class_sharing) values(teacher,true),(other_teacher,true);
 insert into public.reading_reviews(student_id,book_title,read_date,summary,thoughts,recommendation_rating,recommendation_reason,status)
 values(sid,'오래된 바람',current_date,'합성 줄거리','합성 생각',4,'합성 추천','submitted') returning id into old_id;
 for i in 1..23 loop
  insert into public.reading_reviews(student_id,book_title,read_date,summary,thoughts,recommendation_rating,recommendation_reason,status)
  values(sid,'찾는 별 '||i,current_date,'합성 줄거리','합성 생각',4,'합성 추천',case i%3 when 0 then 'approved' when 1 then 'submitted' else 'rejected' end);
 end loop;
 for i in 1..35 loop
  insert into public.reading_reviews(student_id,book_title,read_date,summary,thoughts,recommendation_rating,recommendation_reason,status)
  values(sid,'다른 이야기 '||i,current_date,'합성 줄거리','합성 생각',4,'합성 추천','submitted');
 end loop;
 insert into public.reading_reviews(student_id,book_title,read_date,summary,thoughts,recommendation_rating,recommendation_reason,status)
 values(peer,'오래된 바람',current_date,'공개 합성 줄거리','합성 생각',4,'합성 추천','approved'),
 (peer,'오래된 바람 비공개',current_date,'비공개 합성 줄거리','합성 생각',4,'합성 추천','submitted'),
 (peer,'오래된 바람 수정중',current_date,'비공개 합성 줄거리','합성 생각',4,'합성 추천','rejected'),
 (outsider,'오래된 바람 다른반',current_date,'다른반 합성 줄거리','합성 생각',4,'합성 추천','approved'),
 (sid,'100%_별 \ BOOK',current_date,'합성 줄거리','합성 생각',4,'합성 추천','submitted'),
 (sid,U&'\1100\116E\1105\1173\11B7  학교',current_date,'합성 줄거리','합성 생각',4,'합성 추천','submitted');
 for tab in select schemaname,tablename from pg_tables where schemaname in('public','rpg_private') loop
  execute format('select md5(coalesce(string_agg(to_jsonb(t)::text,E''\n'' order by to_jsonb(t)::text),'''')) from %I.%I t',tab.schemaname,tab.tablename) into digest;
  before_tables:=before_tables||jsonb_build_object(tab.schemaname||'.'||tab.tablename,digest);
 end loop;
 result:=public.student_reading_shelf_find(token,'mine','','오래된');
 if jsonb_array_length(result->'reviews')<>1 or (result->'reviews'->0->>'review_id')::bigint<>old_id then raise exception 'Old title beyond initial pages not found';end if;
 result:=public.student_reading_shelf_find(token,'mine','','찾는');
 if jsonb_array_length(result->'reviews')<>20 or not (result->>'has_more')::boolean then raise exception 'Filtered first page';end if;
 second:=public.student_reading_shelf_find(token,'mine','','찾는',(result->>'next_before_id')::bigint);
 if jsonb_array_length(second->'reviews')<>3 or (second->>'has_more')::boolean then raise exception 'Filtered second page';end if;
 if exists(select 1 from jsonb_array_elements(result->'reviews') a join jsonb_array_elements(second->'reviews') b on a->>'review_id'=b->>'review_id') then raise exception 'Overlapping pages';end if;
 if public.student_reading_shelf_find(token,'mine','','')->'reviews'<>public.student_reading_shelf_search(token,'mine')->'reviews' then raise exception 'Blank query compatibility';end if;
 if jsonb_array_length(public.student_reading_shelf_find(token,'mine','','  구름   학교 ')->'reviews')<>1 then raise exception 'NFC and whitespace';end if;
 if jsonb_array_length(public.student_reading_shelf_find(token,'mine','','%_')->'reviews')<>1 then raise exception 'Wildcard must be literal';end if;
 if jsonb_array_length(public.student_reading_shelf_find(token,'mine','','book')->'reviews')<>1 then raise exception 'Case insensitive';end if;
 if jsonb_array_length(public.student_reading_shelf_find(token,'mine','',''' or 1=1 --')->'reviews')<>0 then raise exception 'SQL injection';end if;
 result:=public.student_reading_shelf_find(token,'class','초록','오래된');
 if jsonb_array_length(result->'reviews')<>1 or result->'reviews'->0->>'book_title'<>'오래된 바람' then raise exception 'Class/author/status isolation';end if;
 if result->'reviews'->0 ?| array['student_id','teacher_id','login_id','rejection_reason','session_hash'] then raise exception 'Private field leak';end if;
 if jsonb_array_length(public.student_reading_shelf_find(other_token,'mine','','찾는')->'reviews')<>0 then raise exception 'Account isolation';end if;
 for i in 1..7 loop
  blocked:=false;
  begin
   case i
    when 1 then perform public.student_reading_shelf_find(null);
    when 2 then perform public.student_reading_shelf_find('invalid');
    when 3 then perform public.student_reading_shelf_find(token,null);
    when 4 then perform public.student_reading_shelf_find(token,'invented');
    when 5 then perform public.student_reading_shelf_find(token,'mine',repeat('a',41));
    when 6 then perform public.student_reading_shelf_find(token,'mine','',repeat('a',201));
    when 7 then perform public.student_reading_shelf_find(token,'mine','','',0);
   end case;
  exception when others then blocked:=true;end;
  if not blocked then raise exception 'Invalid parameter accepted: %',i;end if;
 end loop;
 for tab in select schemaname,tablename from pg_tables where schemaname in('public','rpg_private') loop
  execute format('select md5(coalesce(string_agg(to_jsonb(t)::text,E''\n'' order by to_jsonb(t)::text),'''')) from %I.%I t',tab.schemaname,tab.tablename) into digest;
  if before_tables->>(tab.schemaname||'.'||tab.tablename)<>digest then raise exception 'Search changed table: %.%',tab.schemaname,tab.tablename;end if;
 end loop;
 update rpg_private.reading_share_settings set class_sharing=false where teacher_id=teacher;
 if jsonb_array_length(public.student_reading_shelf_find(token,'class','','오래된')->'reviews')<>0 then raise exception 'Sharing off leak';end if;
 if jsonb_array_length(public.student_reading_shelf_find(token,'mine','','오래된')->'reviews')<>1 then raise exception 'Own record hidden';end if;
 update public.students set session_expires_at=now()-interval '1 second' where id=peer;
 blocked:=false;begin perform public.student_reading_shelf_find(other_token);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Expired token';end if;
 perform set_config('rpg.title_test_token',token,true);
end $test$;
set local role anon;
do $role$ begin
 if jsonb_array_length(public.student_reading_shelf_find(current_setting('rpg.title_test_token'),'mine','','오래된')->'reviews')<>1 then raise exception 'Anon valid-token path';end if;
end $role$;
reset role;
set local role authenticated;
do $role$ begin
 if jsonb_array_length(public.student_reading_shelf_find(current_setting('rpg.title_test_token'),'mine','','오래된')->'reviews')<>1 then raise exception 'Authenticated valid-token path';end if;
end $role$;
reset role;
rollback;
select 'PASS: title before pagination, combined author, scopes/status/sharing isolation, literal wildcards/NFC/whitespace/case, invalid/expired tokens and parameters, client roles, unchanged public/private table hashes; all synthetic data rolled back' as result;
