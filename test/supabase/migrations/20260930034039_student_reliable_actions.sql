-- Test-server development. A retry must replay the receipt, never charge or submit twice.
create table rpg_private.student_action_receipts (
 student_id bigint not null references public.students(id) on delete cascade,
 request_id uuid not null,
 action text not null check (action in ('reading_add','reading_retry','shop_buy')),
 payload_hash text not null,
 response jsonb not null,
 created_at timestamptz not null default now(),
 primary key(student_id,request_id)
);
alter table rpg_private.student_action_receipts enable row level security;
revoke all on rpg_private.student_action_receipts from public,anon,authenticated;

create or replace function public.student_safe_action(p_token text,p_request_id uuid,p_action text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare sid bigint; fingerprint text; receipt rpg_private.student_action_receipts%rowtype; result jsonb; current_price integer;
begin
 sid:=public.student_for_token(p_token);
 if sid is null then raise exception '다시 로그인해 주세요.'; end if;
 if p_request_id is null or p_action is null or p_action not in ('reading_add','reading_retry','shop_buy')
  or p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>65536 then
  raise exception '보낼 내용을 다시 확인해 주세요.';
 end if;
 fingerprint:=encode(extensions.digest(convert_to(p_payload::text,'UTF8'),'sha256'),'hex');
 -- Serializes distinct submissions too, preserving the existing three-per-week cap.
 perform 1 from public.students where id=sid for update;
 select * into receipt from rpg_private.student_action_receipts where student_id=sid and request_id=p_request_id;
 if found then
  if receipt.action<>p_action or receipt.payload_hash<>fingerprint then
   raise exception '이전 요청과 내용이 달라요. 창을 다시 열어 주세요.';
  end if;
  return receipt.response;
 end if;
 if p_action='shop_buy' then
  if nullif(p_payload->>'product_id','') is null then raise exception '상품을 다시 골라 주세요.'; end if;
  select price into current_price from public.shop_products where id=p_payload->>'product_id' for update;
  if (p_payload->>'expected_price')::integer is distinct from current_price or current_price is null then
   raise exception '상품 가격이 바뀌었어요. 새 가격을 확인하고 다시 골라 주세요.';
  end if;
  result:=public.student_buy_product(p_token,p_payload->>'product_id');
 else
  if coalesce(length(p_payload->>'book_title'),0)>80
   or coalesce(length(p_payload->>'summary'),0)>3000
   or coalesce(length(p_payload->>'thoughts'),0)>3000
   or coalesce(length(p_payload->>'recommendation_reason'),0)>1500
   or nullif(p_payload->>'read_date','') is null
   or coalesce((p_payload->>'recommendation_rating')::smallint,0) not between 1 and 5 then
   raise exception '날짜, 별점, 글의 길이를 다시 확인해 주세요.';
  end if;
  if p_action='reading_add' then
   result:=public.student_add_reading_review(p_token,p_payload->>'book_title',(p_payload->>'read_date')::date,
    p_payload->>'summary',p_payload->>'thoughts',(p_payload->>'recommendation_rating')::smallint,p_payload->>'recommendation_reason');
  else
   result:=public.student_retry_reading_review(p_token,(p_payload->>'review_id')::bigint,p_payload->>'book_title',(p_payload->>'read_date')::date,
    p_payload->>'summary',p_payload->>'thoughts',(p_payload->>'recommendation_rating')::smallint,p_payload->>'recommendation_reason');
  end if;
 end if;
 insert into rpg_private.student_action_receipts(student_id,request_id,action,payload_hash,response)
 values(sid,p_request_id,p_action,fingerprint,result);
 return result;
end $$;
revoke all on function public.student_safe_action(text,uuid,text,jsonb) from public;
grant execute on function public.student_safe_action(text,uuid,text,jsonb) to anon,authenticated;

create or replace function public.student_reading_journal(p_token text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare sid bigint; result jsonb;
begin
 sid:=public.student_for_token(p_token);
 if sid is null then raise exception '다시 로그인해 주세요.'; end if;
 select jsonb_build_object(
  'weekly_count',count(*) filter(where r.created_at>=date_trunc('week',now())),
  'reviews',coalesce(jsonb_agg(jsonb_build_object(
   'review_id',r.id,'book_title',r.book_title,'read_date',r.read_date,'summary',r.summary,'thoughts',r.thoughts,
   'recommendation_rating',r.recommendation_rating,'recommendation_reason',r.recommendation_reason,
   'status',r.status,'created_at',r.created_at,'rejection_reason',r.rejection_reason
  ) order by r.created_at desc,r.id desc),'[]'::jsonb)
 ) into result from public.reading_reviews r where r.student_id=sid;
 return result;
end $$;
revoke all on function public.student_reading_journal(text) from public;
grant execute on function public.student_reading_journal(text) to anon,authenticated;
