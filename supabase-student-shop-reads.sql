create or replace function public.student_shop_wallet(p_token text,p_before_id bigint default null)
returns jsonb language plpgsql security definer stable set search_path='' as $$
declare sid bigint; rows jsonb; cursor_id bigint;
begin
  sid:=public.student_for_token(p_token);if sid is null then raise exception '로그인이 만료됐어요. 다시 로그인해 주세요.';end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.order_id desc),'[]'::jsonb),min(x.order_id) into rows,cursor_id
  from (select o.id as order_id,o.product_id,p.name,p.icon,o.price,o.status,o.created_at,o.resolved_at
        from public.shop_orders o join public.shop_products p on p.id=o.product_id
        where o.student_id=sid and (p_before_id is null or o.id<p_before_id) order by o.id desc limit 30) x;
  return jsonb_build_object('orders',rows,'next_before_id',cursor_id,'has_more',exists(select 1 from public.shop_orders o where o.student_id=sid and o.id<cursor_id));
end; $$;
revoke all on function public.student_shop_wallet(text,bigint) from public;
grant execute on function public.student_shop_wallet(text,bigint) to anon,authenticated;

create or replace function public.student_shop_product_detail(p_token text,p_product_id text)
returns jsonb language plpgsql security definer stable set search_path='' as $$
declare sid bigint; s public.students%rowtype; result jsonb;
begin
  sid:=public.student_for_token(p_token);if sid is null then raise exception '로그인이 만료됐어요. 다시 로그인해 주세요.';end if;
  select * into s from public.students where id=sid;
  select jsonb_build_object('product_id',p.id,'name',p.name,'description',p.description,'kind',p.kind,'price',p.price,'stock',p.stock,'image',p.image,'icon',p.icon,'item_id',p.item_id,'slot',i.slot,'outfit_image',case when s.gender='girl' then i.girl_image else i.boy_image end)
  into result from public.shop_products p left join public.item_catalog i on i.id=p.item_id
  where p.id=p_product_id and p.active and (p.gender is null or p.gender=s.gender);
  if result is null then raise exception '지금 볼 수 없는 상품이에요. 상점을 다시 확인해 주세요.';end if;
  return result;
end; $$;
revoke all on function public.student_shop_product_detail(text,text) from public;
grant execute on function public.student_shop_product_detail(text,text) to anon,authenticated;
