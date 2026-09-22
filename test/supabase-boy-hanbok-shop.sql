-- 남학생 한복 3종. 원본 PNG의 크기와 위치를 유지합니다.
begin;
insert into public.item_catalog(id,name,slot,boy_image,girl_image,price,active,default_owned,default_equipped) values
('hanbok-top-boy','남자 한복 저고리','top','3.top/top_boy_hanbok.png','3.top/top_boy_hanbok.png',100,true,false,false),
('hanbok-bottom-boy','남자 한복 바지','bottom','4.bottom/bottom_boy_hanbok.png','4.bottom/bottom_boy_hanbok.png',100,true,false,false),
('hanbok-shoes-boy','남자 버선과 전통 신발','shoes','7.shoes/shoes_boy_hanbok.png','7.shoes/shoes_boy_hanbok.png',100,true,false,false)
on conflict(id) do update set name=excluded.name,slot=excluded.slot,boy_image=excluded.boy_image,girl_image=excluded.girl_image,price=excluded.price,active=true;
insert into public.shop_products(id,category,kind,name,description,icon,image,price,item_id,sort_order,gender) values
('hanbok-top-boy','top','wearable','남자 한복 저고리','고운 연하늘색 한복 저고리예요.','🎀','3.top/top_boy_hanbok.png',100,'hanbok-top-boy',80,'boy'),
('hanbok-bottom-boy','bottom','wearable','남자 한복 바지','아이보리색의 편안하고 멋스러운 한복 바지예요.','🌿','4.bottom/bottom_boy_hanbok.png',100,'hanbok-bottom-boy',80,'boy'),
('hanbok-shoes-boy','shoes','wearable','남자 버선과 전통 신발','흰 버선과 남색 전통 신발이에요.','🌸','7.shoes/shoes_boy_hanbok.png',100,'hanbok-shoes-boy',80,'boy')
on conflict(id) do update set category=excluded.category,kind=excluded.kind,name=excluded.name,description=excluded.description,icon=excluded.icon,image=excluded.image,price=excluded.price,item_id=excluded.item_id,sort_order=excluded.sort_order,gender=excluded.gender,active=true;
commit;

