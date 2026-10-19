-- Development only. Synthetic teachers/students/reviews; never rotate an existing session.
begin;
do $test$
declare teacher uuid:=gen_random_uuid(); other_teacher uuid:=gen_random_uuid(); sid bigint; peer bigint; outsider bigint;
 token text:=gen_random_uuid()::text; other_token text:=gen_random_uuid()::text; result jsonb; second jsonb; blocked boolean; i integer;
 tab record; digest text; before_tables jsonb:='{}'; old_id bigint; mode text; cursor_value jsonb; all_ids jsonb; expected jsonb; round integer; entry jsonb;
begin
 insert into auth.users(id) values(teacher),(other_teacher);
 insert into public.teacher_profiles(user_id) values(teacher),(other_teacher);
 insert into public.students(teacher_id,student_number,login_id,pin_hash,nickname,session_hash,session_expires_at)
 values(teacher,1,'order-test-'||gen_random_uuid(),'not-a-login','검증나래',encode(extensions.digest(convert_to(token,'UTF8'),'sha256'),'hex'),now()+interval '1 hour') returning id into sid;
 insert into public.students(teacher_id,student_number,login_id,pin_hash,nickname,session_hash,session_expires_at)
 values(teacher,2,'order-test-'||gen_random_uuid(),'not-a-login','검증초록',encode(extensions.digest(convert_to(other_token,'UTF8'),'sha256'),'hex'),now()+interval '1 hour') returning id into peer;
 insert into public.students(teacher_id,student_number,login_id,pin_hash,nickname)
 values(other_teacher,1,'order-test-'||gen_random_uuid(),'not-a-login','다른반검증') returning id into outsider;
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
 for i in 1..24 loop
  insert into public.reading_reviews(student_id,book_title,read_date,summary,thoughts,recommendation_rating,recommendation_reason,status)
  values(sid,'가 같은 제목',current_date,'합성 줄거리','합성 생각',4,'합성 추천','submitted');
 end loop;
 insert into public.reading_reviews(student_id,book_title,read_date,summary,thoughts,recommendation_rating,recommendation_reason,status)
 values(sid,'BOOK',current_date,'합성 줄거리','합성 생각',4,'합성 추천','submitted'),
 (sid,'book',current_date,'합성 줄거리','합성 생각',4,'합성 추천','submitted'),
 (sid,'🌱 씨앗',current_date,'합성 줄거리','합성 생각',4,'합성 추천','submitted');
 for tab in select schemaname,tablename from pg_tables where schemaname in('public','rpg_private') loop
  execute format('select md5(coalesce(string_agg(to_jsonb(t)::text,E''\n'' order by to_jsonb(t)::text),'''')) from %I.%I t',tab.schemaname,tab.tablename) into digest;
  before_tables:=before_tables||jsonb_build_object(tab.schemaname||'.'||tab.tablename,digest);
 end loop;
 foreach mode in array array['newest','oldest','title'] loop
  cursor_value:=null; all_ids:='[]';round:=0;
  loop
   round:=round+1;if round>10 then raise exception 'Non-terminating cursor';end if;
   result:=public.student_reading_shelf_ordered(token,'mine','','',mode,cursor_value);
   if jsonb_array_length(result->'reviews')>20 then raise exception 'Page too large';end if;
   for entry in select value from jsonb_array_elements(result->'reviews') loop
    if entry ?| array['student_id','teacher_id','login_id','session_hash','title_key','pos','rejection_reason'] then raise exception 'Private/internal field leak';end if;
    all_ids:=all_ids||jsonb_build_array(entry->'review_id');
   end loop;
   exit when not (result->>'has_more')::boolean;
   if result->'next_cursor'=cursor_value then raise exception 'Cursor did not advance';end if;
   cursor_value:=result->'next_cursor';
  end loop;
  if mode='newest' then select jsonb_agg(id order by id desc) into expected from public.reading_reviews where student_id=sid;
  elsif mode='oldest' then select jsonb_agg(id order by id) into expected from public.reading_reviews where student_id=sid;
  else select jsonb_agg(id order by lower(btrim(regexp_replace(normalize(book_title,NFC),'[[:space:]]+',' ','g'))) collate "C",id) into expected from public.reading_reviews where student_id=sid;end if;
  if all_ids<>expected then raise exception 'Whole shelf order/missing/duplicates: %',mode;end if;
  if jsonb_array_length(all_ids)<>(select count(distinct value) from jsonb_array_elements(all_ids)) then raise exception 'Duplicate review';end if;
  result:=public.student_reading_shelf_ordered(token,'class','검증초록','오래된',mode);
  if jsonb_array_length(result->'reviews')<>1 or result->'reviews'->0->>'book_title'<>'오래된 바람' then raise exception 'Class/title/author/status filter: %',mode;end if;
  if jsonb_array_length(public.student_reading_shelf_ordered(other_token,'mine','','가 같은',mode)->'reviews')<>0 then raise exception 'Other account leak';end if;
 end loop;
 result:=public.student_reading_shelf_ordered(token,'mine','','가 같은','title');
 second:=public.student_reading_shelf_ordered(token,'mine','','가 같은','title',result->'next_cursor');
 if jsonb_array_length(result->'reviews')<>20 or jsonb_array_length(second->'reviews')<>4 or (second->>'has_more')::boolean then raise exception 'Same title at page boundary';end if;
 if public.student_reading_shelf_ordered(token,'mine','','','newest')->'reviews'<>public.student_reading_shelf_search(token,'mine')->'reviews' then raise exception 'Newest compatibility';end if;
 if jsonb_array_length(public.student_reading_shelf_ordered(token,'mine','','%_','oldest')->'reviews')<>1 then raise exception 'Literal wildcard';end if;
 if jsonb_array_length(public.student_reading_shelf_ordered(token,'mine','','  구름   학교 ','title')->'reviews')<>1 then raise exception 'Normalized title';end if;
 if jsonb_array_length(public.student_reading_shelf_ordered(token,'mine','','없는 책','oldest')->'reviews')<>0 then raise exception 'No results';end if;
 for i in 1..17 loop
  blocked:=false;
  begin
   case i
    when 1 then perform public.student_reading_shelf_ordered(null);
    when 2 then perform public.student_reading_shelf_ordered('invalid');
    when 3 then perform public.student_reading_shelf_ordered(token,null);
    when 4 then perform public.student_reading_shelf_ordered(token,'mine','','','invalid');
    when 5 then perform public.student_reading_shelf_ordered(token,'mine','','',null);
    when 6 then perform public.student_reading_shelf_ordered(token,'mine','','','title','{}');
    when 7 then perform public.student_reading_shelf_ordered(token,'mine','','','title','{"id":1,"sort":"oldest","key":"a"}');
    when 8 then perform public.student_reading_shelf_ordered(token,'mine','','','title','{"id":1,"sort":"title"}');
    when 9 then perform public.student_reading_shelf_ordered(token,'mine','','','oldest','{"id":-1,"sort":"oldest"}');
    when 10 then perform public.student_reading_shelf_ordered(token,'mine','','','oldest','{"id":1.5,"sort":"oldest"}');
    when 11 then perform public.student_reading_shelf_ordered(token,'mine','','','oldest','{"id":"1","sort":"oldest"}');
    when 12 then perform public.student_reading_shelf_ordered(token,'mine','','','oldest','{"id":9999999999999999999,"sort":"oldest"}');
    when 13 then perform public.student_reading_shelf_ordered(token,'mine','','','oldest','[]');
    when 14 then perform public.student_reading_shelf_ordered(token,'mine','','','oldest','{"id":1,"sort":"oldest","extra":1}');
    when 15 then perform public.student_reading_shelf_ordered(token,'mine',repeat('a',41));
    when 16 then perform public.student_reading_shelf_ordered(token,'mine','',repeat('a',201));
    when 17 then perform public.student_reading_shelf_ordered(token,'mine','','','title',jsonb_build_object('id',1,'sort','title','key',repeat('a',2001)));
   end case;
  exception when others then blocked:=true;end;
  if not blocked then raise exception 'Invalid input accepted: %',i;end if;
 end loop;
 for tab in select schemaname,tablename from pg_tables where schemaname in('public','rpg_private') loop
  execute format('select md5(coalesce(string_agg(to_jsonb(t)::text,E''\n'' order by to_jsonb(t)::text),'''')) from %I.%I t',tab.schemaname,tab.tablename) into digest;
  if before_tables->>(tab.schemaname||'.'||tab.tablename)<>digest then raise exception 'Sorting changed table: %.%',tab.schemaname,tab.tablename;end if;
 end loop;
 update rpg_private.reading_share_settings set class_sharing=false where teacher_id=teacher;
 foreach mode in array array['newest','oldest','title'] loop
  if jsonb_array_length(public.student_reading_shelf_ordered(token,'class','','',mode)->'reviews')<>0 then raise exception 'Sharing off leak';end if;
  if jsonb_array_length(public.student_reading_shelf_ordered(token,'mine','','오래된',mode)->'reviews')<>1 then raise exception 'Own records hidden';end if;
 end loop;
 update public.students set session_expires_at=now()-interval '1 second' where id=peer;
 blocked:=false;begin perform public.student_reading_shelf_ordered(other_token);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Expired token';end if;
 perform set_config('rpg.order_test_token',token,true);
end $test$;
set local role anon;
do $role$ begin
 if jsonb_array_length(public.student_reading_shelf_ordered(current_setting('rpg.order_test_token'),'mine','','오래된','oldest')->'reviews')<>1 then raise exception 'Anon valid-token path';end if;
end $role$;
reset role;
set local role authenticated;
do $role$ begin
 if jsonb_array_length(public.student_reading_shelf_ordered(current_setting('rpg.order_test_token'),'mine','','오래된','title')->'reviews')<>1 then raise exception 'Authenticated valid-token path';end if;
end $role$;
reset role;
rollback;
select 'PASS: all three whole-shelf orders, stable same-title20+4 cursor, search before pagination, invalid cursor/order/token rejection, class/account/status/sharing isolation, client roles, no internal fields, all public/private hashes unchanged; synthetic fixtures rolled back' as result;
