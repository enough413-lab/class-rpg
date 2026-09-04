-- 마법학교 의상 4종을 상점에 추가합니다.
-- Supabase SQL Editor에서 이 파일 전체를 한 번 실행하세요.

begin;

insert into public.item_catalog(id,name,slot,boy_image,girl_image,price,active,default_owned,default_equipped) values
  ('magic-top-boy','남자 마법학교 상의','top','3.top/top_boy_magic.png','3.top/top_girl_magic.png',150,true,false,false),
  ('magic-top-girl','여자 마법학교 상의','top','3.top/top_boy_magic.png','3.top/top_girl_magic.png',150,true,false,false),
  ('magic-bottom-boy','남자 마법학교 하의','bottom','4.bottom/bottom_boy_magic.png','4.bottom/bottom_girl_magic.png',120,true,false,false),
  ('magic-bottom-girl','여자 마법학교 하의','bottom','4.bottom/bottom_boy_magic.png','4.bottom/bottom_girl_magic.png',120,true,false,false)
on conflict(id) do update set
  name=excluded.name,slot=excluded.slot,boy_image=excluded.boy_image,girl_image=excluded.girl_image,
  price=excluded.price,active=true,default_owned=false,default_equipped=false;

insert into public.shop_products(id,category,kind,name,description,icon,image,price,item_id,sort_order,gender) values
  ('magic-top-boy','top','wearable','남자 마법학교 상의','별빛 마법학교의 남색 반팔 상의예요.','🪄','3.top/top_boy_magic.png',150,'magic-top-boy',30,'boy'),
  ('magic-top-girl','top','wearable','여자 마법학교 상의','별빛 마법학교의 리본 반팔 상의예요.','🪄','3.top/top_girl_magic.png',150,'magic-top-girl',40,'girl'),
  ('magic-bottom-boy','bottom','wearable','남자 마법학교 하의','금빛 장식이 반짝이는 마법학교 하의예요.','🌙','4.bottom/bottom_boy_magic.png',120,'magic-bottom-boy',30,'boy'),
  ('magic-bottom-girl','bottom','wearable','여자 마법학교 하의','금빛 장식이 반짝이는 마법학교 하의예요.','🌙','4.bottom/bottom_girl_magic.png',120,'magic-bottom-girl',40,'girl')
on conflict(id) do update set
  category=excluded.category,kind=excluded.kind,name=excluded.name,description=excluded.description,
  icon=excluded.icon,image=excluded.image,price=excluded.price,item_id=excluded.item_id,
  sort_order=excluded.sort_order,gender=excluded.gender,active=true;

commit;
