-- Boy hairstyle; original PNGs preserved.
begin;
insert into public.item_catalog(id,name,slot,boy_image,girl_image,price,active,default_owned,default_equipped)
values ('hanbok-hair-boy','전통 모자와 댕기머리','hair','2.hair/hair_boy_hanbok_show.png','2.hair/hair_boy_hanbok_show.png',100,true,false,false)
on conflict(id) do update set name=excluded.name,slot=excluded.slot,boy_image=excluded.boy_image,girl_image=excluded.girl_image,price=excluded.price,active=true;
insert into public.shop_products(id,category,kind,name,description,icon,image,price,item_id,sort_order,gender)
values ('hanbok-hair-boy','hair','wearable','전통 모자와 댕기머리','금빛 무늬 모자와 단정하게 땋은 머리예요. 내 아이템에서 착용해 보세요.','🎀','2.hair/hair_boy_hanbok_show.png',100,'hanbok-hair-boy',80,'boy')
on conflict(id) do update set category=excluded.category,kind=excluded.kind,name=excluded.name,description=excluded.description,icon=excluded.icon,image=excluded.image,price=excluded.price,item_id=excluded.item_id,sort_order=excluded.sort_order,gender=excluded.gender,active=true;
commit;
