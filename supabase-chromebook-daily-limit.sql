-- 크롬북 이용권: 학생 1명당 하루 1회만 구매 가능
-- Supabase SQL Editor에서 이 파일 전체를 실행하세요.

update public.shop_products
set description='정해진 시간에 크롬북을 이용해요. 하루에 1번만 구매할 수 있어요.'
where id='chromebook-pass';

create or replace function public.student_buy_product(p_token text,p_product_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_student public.students%rowtype; v_student_id bigint; v_product public.shop_products%rowtype; v_order_id bigint;
begin
  v_student_id:=public.student_for_token(p_token);
  if v_student_id is null then raise exception '로그인이 만료됐어요. 다시 로그인해 주세요.'; end if;
  select * into v_student from public.students where id=v_student_id;
  select * into v_product from public.shop_products where id=p_product_id and active for update;
  if v_product.id is null then raise exception '판매하지 않는 상품이에요.'; end if;
  if v_product.gender is not null and v_product.gender<>v_student.gender then raise exception '내 캐릭터에게 맞지 않는 옷이에요.'; end if;
  if v_product.stock is not null and v_product.stock<1 then raise exception '상품이 품절됐어요.'; end if;
  if v_product.kind='wearable' and (v_product.item_id is null or v_product.item_id='') then raise exception '이 옷의 아이템 정보가 없어요.'; end if;
  if v_product.kind='wearable' and exists(select 1 from public.student_items where student_id=v_student.id and item_id=v_product.item_id) then raise exception '이미 가지고 있는 옷이에요.'; end if;
  if v_product.kind='coupon' and exists(select 1 from public.shop_orders where student_id=v_student.id and product_id=v_product.id and status='pending') then raise exception '이미 교환을 요청한 상품이에요.'; end if;
  if v_product.id='chromebook-pass' and exists(
    select 1 from public.shop_orders
    where student_id=v_student.id and product_id='chromebook-pass'
      and created_at >= date_trunc('day',now())
  ) then raise exception '크롬북 이용권은 하루에 1개만 구매할 수 있어요. 내일 다시 도전해요!'; end if;
  if v_product.kind='coupon' and v_product.per_student_limit is not null and (select count(*) from public.shop_orders where student_id=v_student.id and product_id=v_product.id and status<>'cancelled')>=v_product.per_student_limit then raise exception '구매 가능 횟수를 모두 사용했어요.'; end if;
  update public.students set gold=gold-v_product.price where id=v_student.id and gold>=v_product.price;
  if not found then raise exception '골드가 부족해요.'; end if;
  if v_product.kind='wearable' then
    insert into public.student_items(student_id,item_id) values(v_student.id,v_product.item_id);
    if v_product.stock is not null then update public.shop_products set stock=stock-1 where id=v_product.id; end if;
    return jsonb_build_object('ok',true,'item_id',v_product.item_id,'price',v_product.price);
  end if;
  insert into public.shop_orders(student_id,product_id,price) values(v_student.id,v_product.id,v_product.price) returning id into v_order_id;
  if v_product.stock is not null then update public.shop_products set stock=stock-1 where id=v_product.id; end if;
  return jsonb_build_object('ok',true,'order_id',v_order_id,'price',v_product.price);
end; $$;

revoke all on function public.student_buy_product(text,text) from public;
grant execute on function public.student_buy_product(text,text) to anon,authenticated;
