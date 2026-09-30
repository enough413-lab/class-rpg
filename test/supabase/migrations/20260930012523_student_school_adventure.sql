-- Staging-first school adventure. No XP, gold, quest rewards, or existing records are modified.
create schema if not exists rpg_private;
revoke all on schema rpg_private from public,anon,authenticated;
create table rpg_private.school_exploration (
 student_id bigint not null references public.students(id) on delete cascade,
 step_id text not null,
 completed_at timestamptz not null default now(),
 primary key(student_id,step_id)
);
alter table rpg_private.school_exploration enable row level security;
revoke all on rpg_private.school_exploration from public,anon,authenticated;

create or replace function public.student_learning_journal(p_token text)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare sid bigint; result jsonb;
begin
 sid:=public.student_for_token(p_token);
 if sid is null then raise exception '다시 로그인해 주세요.'; end if;
 select jsonb_build_object(
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
      ('pond-3',2,6,'pond',3)
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
