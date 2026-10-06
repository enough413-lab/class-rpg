-- Staging fixture mutations only; always roll back.
begin;
do $test$
declare sid bigint; other_sid bigint; token text:=gen_random_uuid()::text; other_token text:=gen_random_uuid()::text;
 req uuid:=gen_random_uuid(); buy_req uuid:=gen_random_uuid(); retry_req uuid:=gen_random_uuid(); p jsonb;
 product text:='test-idempotent-'||gen_random_uuid()::text; review bigint; r jsonb; blocked boolean;
begin
 select id into sid from public.students order by id limit 1;
 select id into other_sid from public.students where id<>sid order by id limit 1;
 if other_sid is null then raise exception 'Need two staging fixtures'; end if;
 update public.students set session_hash=encode(extensions.digest(convert_to(token,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '1 hour',gold=100 where id=sid;
 update public.students set session_hash=encode(extensions.digest(convert_to(other_token,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '1 hour' where id=other_sid;
 delete from public.reading_reviews where student_id in (sid,other_sid);
 p:=jsonb_build_object('book_title','테스트 책','read_date',current_date,'summary','줄거리','thoughts','내 생각','recommendation_rating',5,'recommendation_reason','추천하는 까닭');
 blocked:=false;begin perform public.student_safe_action('invalid',req,'reading_add',p);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Invalid token accepted'; end if;
 perform public.student_safe_action(token,req,'reading_add',p);
 perform public.student_safe_action(token,req,'reading_add',p);
 if (select count(*) from public.reading_reviews where student_id=sid)<>1 then raise exception 'Duplicate reading submission'; end if;
 blocked:=false;begin perform public.student_safe_action(token,req,'reading_add',p||'{"summary":"changed"}');exception when others then blocked:=true;end;
 if not blocked then raise exception 'Request identity accepted changed content'; end if;
 if jsonb_array_length(public.student_reading_journal(other_token)->'reviews')<>0 then raise exception 'Reading journal leaked'; end if;
 select id into review from public.reading_reviews where student_id=sid;
 update public.reading_reviews set status='rejected',rejection_reason='생각을 한 가지 더 적어요.' where id=review;
 if public.student_reading_journal(token)->'reviews'->0->>'rejection_reason'<>'생각을 한 가지 더 적어요.' then raise exception 'Teacher feedback missing'; end if;
 blocked:=false;begin perform public.student_safe_action(other_token,retry_req,'reading_retry',p||jsonb_build_object('review_id',review));exception when others then blocked:=true;end;
 if not blocked then raise exception 'Another student retried a review'; end if;
 perform public.student_safe_action(token,retry_req,'reading_retry',p||jsonb_build_object('review_id',review));
 perform public.student_safe_action(token,retry_req,'reading_retry',p||jsonb_build_object('review_id',review));
 if (select retry_count from public.reading_reviews where id=review)<>1 then raise exception 'Retry incremented twice'; end if;
 perform public.student_safe_action(token,gen_random_uuid(),'reading_add',p);
 perform public.student_safe_action(token,gen_random_uuid(),'reading_add',p);
 blocked:=false;begin perform public.student_safe_action(token,gen_random_uuid(),'reading_add',p);exception when others then blocked:=true;end;
 if not blocked then raise exception 'Weekly cap bypassed'; end if;
 if (public.student_reading_journal(token)->>'weekly_count')::integer<>3 then raise exception 'Weekly counter mismatch'; end if;
 -- A replay still succeeds after reaching the cap.
 perform public.student_safe_action(token,req,'reading_add',p);
 insert into public.shop_products(id,category,kind,name,price,stock) values(product,'misc','coupon','테스트 교환권',40,2);
 blocked:=false;begin perform public.student_safe_action(token,gen_random_uuid(),'shop_buy',jsonb_build_object('product_id',product,'expected_price',30));exception when others then blocked:=true;end;
 if not blocked or (select gold from public.students where id=sid)<>100 then raise exception 'Price changed without new confirmation'; end if;
 p:=jsonb_build_object('product_id',product,'expected_price',40);
 r:=public.student_safe_action(token,buy_req,'shop_buy',p);
 if public.student_safe_action(token,buy_req,'shop_buy',p)<>r then raise exception 'Receipt changed on replay'; end if;
 if (select gold from public.students where id=sid)<>60 then raise exception 'Duplicate debit'; end if;
 if (select stock from public.shop_products where id=product)<>1 then raise exception 'Duplicate stock decrement'; end if;
 if (select count(*) from public.shop_orders where student_id=sid and product_id=product)<>1 then raise exception 'Duplicate order'; end if;
 update public.shop_products set price=50,stock=0 where id=product;
 if public.student_safe_action(token,buy_req,'shop_buy',p)<>r then raise exception 'Replay failed after price/stock changed'; end if;
 if has_table_privilege('anon','rpg_private.student_action_receipts','SELECT') or has_table_privilege('authenticated','rpg_private.student_action_receipts','INSERT') then raise exception 'Receipts publicly accessible'; end if;
 perform set_config('rpg.test_action_token',token,true);perform set_config('rpg.test_action_request',buy_req::text,true);perform set_config('rpg.test_action_payload',p::text,true);
end $test$;
set local role anon;
do $role_test$
declare blocked boolean:=false;
begin
 if not (public.student_safe_action(current_setting('rpg.test_action_token'),current_setting('rpg.test_action_request')::uuid,'shop_buy',current_setting('rpg.test_action_payload')::jsonb)->>'ok')::boolean then raise exception 'Anon RPC failed'; end if;
 begin perform 1 from rpg_private.student_action_receipts;exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception 'Anon can read receipts'; end if;
end $role_test$;
reset role;
set local role authenticated;
do $role_test$
begin
 if (public.student_reading_journal(current_setting('rpg.test_action_token'))->>'weekly_count')::integer<>3 then raise exception 'Authenticated journal failed'; end if;
end $role_test$;
reset role;
rollback;
select 'PASS: authenticated receipts, replay, payload binding, reading cap, feedback, token/record isolation, retry count, exact debit/order/stock, price confirmation and private grants' as result;
