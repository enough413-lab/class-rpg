-- Staging-only expansion: cosmetic progress, no XP or currency writes.
create table rpg_private.school_workshop (
 student_id bigint primary key references public.students(id) on delete cascade,
 cover text not null default 'paper' check (cover in ('paper','sprout','story','star')),
 garden_completed_at timestamptz
);
alter table rpg_private.school_workshop enable row level security;
revoke all on rpg_private.school_workshop from public,anon,authenticated;

create or replace function public.student_school_workshop(p_token text,p_action text,p_choice text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare sid bigint; lv integer; required_stamps integer; stamps integer; choice jsonb;
begin
 sid:=public.student_for_token(p_token);
 if sid is null then raise exception '다시 로그인해 주세요.'; end if;
 select public.rpg_level_for_xp(s.xp) into lv from public.students s where s.id=sid for update;
 if p_action='garden' then
  if lv<7 then raise exception 'Lv.7부터 관찰 놀이가 열려요.'; end if;
  if p_choice is null or length(p_choice)>200 then raise exception '선택을 다시 확인해 주세요.'; end if;
  begin choice:=p_choice::jsonb; exception when others then raise exception '선택을 다시 확인해 주세요.'; end;
  if jsonb_typeof(choice)<>'array' then raise exception '선택을 다시 확인해 주세요.'; end if;
  if jsonb_array_length(choice)<>3 or not choice @> '["leaves","flower","can"]'::jsonb then
   return jsonb_build_object('correct',false);
  end if;
  insert into rpg_private.school_workshop(student_id,garden_completed_at) values(sid,now())
   on conflict(student_id) do update set garden_completed_at=coalesce(rpg_private.school_workshop.garden_completed_at,excluded.garden_completed_at);
  return jsonb_build_object('correct',true,'garden_complete',true);
 elsif p_action='cover' then
  if lv<8 then raise exception 'Lv.8부터 수첩 표지를 고를 수 있어요.'; end if;
  required_stamps:=case p_choice when 'paper' then 0 when 'sprout' then 1 when 'story' then 3 when 'star' then 6 else null end;
  if required_stamps is null then raise exception '표지를 다시 골라 주세요.'; end if;
  select count(*) into stamps from (
   select split_part(e.step_id,'-',1) from rpg_private.school_exploration e where e.student_id=sid
    and split_part(e.step_id,'-',1) in ('classroom','hallway','library','garden','playground','pond','cafeteria')
    and split_part(e.step_id,'-',2) in ('1','2','3')
   group by split_part(e.step_id,'-',1) having count(*)=3
  ) completed;
  if stamps<required_stamps then raise exception '탐험 도장을 조금 더 모으면 열리는 표지예요.'; end if;
  insert into rpg_private.school_workshop(student_id,cover) values(sid,p_choice)
   on conflict(student_id) do update set cover=excluded.cover;
  return jsonb_build_object('cover',p_choice);
 else raise exception '놀이를 다시 열어 주세요.';
 end if;
end $$;
revoke all on function public.student_school_workshop(text,text,text) from public;
grant execute on function public.student_school_workshop(text,text,text) to anon,authenticated;

create or replace function public.student_learning_journal(p_token text)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare sid bigint; result jsonb;
begin
 sid:=public.student_for_token(p_token);
 if sid is null then raise exception '다시 로그인해 주세요.'; end if;
 select jsonb_build_object(
  'workshop',coalesce((select jsonb_build_object('cover',w.cover,'garden_complete',w.garden_completed_at is not null) from rpg_private.school_workshop w where w.student_id=sid),jsonb_build_object('cover','paper','garden_complete',false)),
  'exploration',coalesce((select jsonb_agg(e.step_id order by e.step_id) from rpg_private.school_exploration e where e.student_id=sid),'[]'::jsonb),
  'areas',coalesce((select jsonb_object_agg(category,n) from (
    select category,count(*) n from (
      select coalesce(q.category,'life') category from public.quest_submissions s join public.quests q on q.id=s.quest_id
      where s.student_id=sid and s.status='approved'
      union all select 'reading' from public.reading_reviews where student_id=sid and status='approved'
    ) activities group by category) counts),'{}'::jsonb),
  'recent',coalesce((select jsonb_agg(to_jsonb(recent) order by at desc) from (
    select * from (
     select q.title,coalesce(s.reviewed_at,s.submitted_at) at from public.quest_submissions s join public.quests q on q.id=s.quest_id
      where s.student_id=sid and s.status='approved'
     union all select book_title title,coalesce(reviewed_at,created_at) at from public.reading_reviews where student_id=sid and status='approved'
    ) activities order by at desc limit 6
  ) recent),'[]'::jsonb)
 ) into result;
 return result;
end $$;
revoke all on function public.student_learning_journal(text) from public;
grant execute on function public.student_learning_journal(text) to anon,authenticated;


create or replace function public.student_explore_school(p_token text,p_step text,p_choice integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare sid bigint; xp integer; expected integer; min_level integer; chapter text; position integer; count_before integer; inserted integer;
begin
 sid:=public.student_for_token(p_token);
 if sid is null then raise exception '다시 로그인해 주세요.'; end if;
 select a.answer,a.level,a.chapter,a.position into expected,min_level,chapter,position from (values
      ('classroom-1',0,1,'classroom',1),
      ('classroom-2',1,1,'classroom',2),
      ('classroom-3',2,1,'classroom',3),
      ('hallway-1',1,2,'hallway',1),
      ('hallway-2',0,2,'hallway',2),
      ('hallway-3',2,2,'hallway',3),
      ('library-1',1,3,'library',1),
      ('library-2',0,3,'library',2),
      ('library-3',2,3,'library',3),
      ('garden-1',0,4,'garden',1),
      ('garden-2',1,4,'garden',2),
      ('garden-3',2,4,'garden',3),
      ('playground-1',1,5,'playground',1),
      ('playground-2',0,5,'playground',2),
      ('playground-3',2,5,'playground',3),
      ('pond-1',0,6,'pond',1),
      ('pond-2',1,6,'pond',2),
      ('pond-3',2,6,'pond',3),
      ('cafeteria-1',1,9,'cafeteria',1),
      ('cafeteria-2',2,9,'cafeteria',2),
      ('cafeteria-3',0,9,'cafeteria',3)
 ) a(step,answer,level,chapter,position) where a.step=p_step;
 if expected is null or p_choice is null or p_choice not between 0 and 2 then raise exception '이야기를 다시 열어 주세요.'; end if;
 select s.xp into xp from public.students s where s.id=sid;
 if public.rpg_level_for_xp(xp)<min_level then raise exception '조금 더 성장하면 열리는 장소예요.'; end if;
 select count(*) into count_before from rpg_private.school_exploration e
  where e.student_id=sid and e.step_id=any(select chapter||'-'||n from generate_series(1,position-1) n);
 if count_before<position-1 then raise exception '앞의 이야기부터 만나 주세요.'; end if;
 if p_choice<>expected then return jsonb_build_object('correct',false); end if;
 insert into rpg_private.school_exploration(student_id,step_id) values(sid,p_step) on conflict do nothing;
 get diagnostics inserted = row_count;
 return jsonb_build_object('correct',true,'new',inserted=1);
end $$;
revoke all on function public.student_explore_school(text,text,integer) from public;
grant execute on function public.student_explore_school(text,text,integer) to anon,authenticated;
