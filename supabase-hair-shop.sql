-- One hairstyle owns both hair layers; show is only the shop/inventory preview.
begin;
alter table public.item_catalog drop constraint item_catalog_slot_check;
alter table public.item_catalog add constraint item_catalog_slot_check check (slot in ('equipment','top','bottom','shoes','hat','accessory','hair'));
alter table public.student_equipment drop constraint student_equipment_slot_check;
alter table public.student_equipment add constraint student_equipment_slot_check check (slot in ('equipment','top','bottom','shoes','hat','accessory','hair'));
alter table public.shop_products drop constraint shop_products_category_check;
alter table public.shop_products add constraint shop_products_category_check check (category in ('weapon','armor','top','bottom','shoes','misc','hair'));
insert into public.item_catalog(id,name,slot,boy_image,girl_image,price,active,default_owned,default_equipped)
values ('hanbok-hair-girl','댕기머리','hair','2.hair/hair_girl_hanbok_show.png','2.hair/hair_girl_hanbok_show.png',100,true,false,false)
on conflict(id) do update set name=excluded.name,slot=excluded.slot,boy_image=excluded.boy_image,girl_image=excluded.girl_image,price=excluded.price,active=true;
insert into public.shop_products(id,category,kind,name,description,icon,image,price,item_id,sort_order,gender)
values ('hanbok-hair-girl','hair','wearable','댕기머리','붉은 댕기로 곱게 묶은 머리예요. 내 아이템에서 착용해 보세요.','🎀','2.hair/hair_girl_hanbok_show.png',100,'hanbok-hair-girl',80,'girl')
on conflict(id) do update set category=excluded.category,kind=excluded.kind,name=excluded.name,description=excluded.description,icon=excluded.icon,image=excluded.image,price=excluded.price,item_id=excluded.item_id,sort_order=excluded.sort_order,gender=excluded.gender,active=true;
commit;
