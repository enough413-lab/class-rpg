-- 여학생 한복 3종. 원본 PNG의 크기와 위치를 유지합니다.
begin;
insert into public.item_catalog(id,name,slot,boy_image,girl_image,price,active,default_owned,default_equipped) values
('hanbok-top-girl','여자 한복 저고리','top','3.top/top_girl_hanbok.png','3.top/top_girl_hanbok.png',100,true,false,false),
('hanbok-bottom-girl','여자 한복 치마','bottom','4.bottom/bottom_girl_hanbok.png','4.bottom/bottom_girl_hanbok.png',100,true,false,false),
('hanbok-shoes-girl','여자 버선과 꽃신','shoes','7.shoes/shoes_girl_hanbok.png','7.shoes/shoes_girl_hanbok.png',100,true,false,false)
on conflict(id) do update set name=excluded.name,slot=excluded.slot,boy_image=excluded.boy_image,girl_image=excluded.girl_image,price=excluded.price,active=true;
insert into public.shop_products(id,category,kind,name,description,icon,image,price,item_id,sort_order,gender) values
('hanbok-top-girl','top','wearable','여자 한복 저고리','고운 연분홍색 한복 저고리예요.','🎀','3.top/top_girl_hanbok.png',100,'hanbok-top-girl',80,'girl'),
('hanbok-bottom-girl','bottom','wearable','여자 한복 치마','연민트색 주름이 아름다운 한복 치마예요.','🌿','4.bottom/bottom_girl_hanbok.png',100,'hanbok-bottom-girl',80,'girl'),
('hanbok-shoes-girl','shoes','wearable','여자 버선과 꽃신','흰 버선과 꽃무늬 연분홍 꽃신이에요.','🌸','7.shoes/shoes_girl_hanbok.png',100,'hanbok-shoes-girl',80,'girl')
on conflict(id) do update set category=excluded.category,kind=excluded.kind,name=excluded.name,description=excluded.description,icon=excluded.icon,image=excluded.image,price=excluded.price,item_id=excluded.item_id,sort_order=excluded.sort_order,gender=excluded.gender,active=true;
commit;
