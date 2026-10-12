-- Student test only: bounded private picture data, no economy writes.
create table rpg_private.school_art (
 student_id bigint primary key references public.students(id) on delete cascade,
 phase integer not null default 1 check(phase between 1 and 2),
 cells text[] not null default array_fill('empty'::text,array[25]) check(cardinality(cells)=25),
 stamp text not null default 'leaf' check(stamp in ('leaf','heart','star')),
 completed_at timestamptz
);
alter table rpg_private.school_art enable row level security;
revoke all on rpg_private.school_art from public,anon,authenticated;
create or replace function rpg_private.art_state(p_student bigint)
returns jsonb language sql stable set search_path='' as $$
 select coalesce((select jsonb_build_object('phase',phase,'cells',cells,'stamp',stamp,'completed_at',completed_at) from rpg_private.school_art where student_id=p_student),
 jsonb_build_object('phase',0,'cells',array_fill('empty'::text,array[25]),'stamp','leaf','completed_at',null));
$$;
revoke all on function rpg_private.art_state(bigint) from public,anon,authenticated;
create or replace function public.student_art_postcard(p_token text,p_action text,p_cells text[],p_stamp text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare sid bigint; lv integer; started boolean;
begin
 sid:=public.student_for_token(p_token);if sid is null then raise exception '다시 로그인한 뒤 그림 수첩을 펼쳐 주세요.';end if;
 if p_action is null or p_action not in ('mix','save') or p_cells is null or array_ndims(p_cells) is distinct from 1 or array_lower(p_cells,1) is distinct from 1 then raise exception '물감과 그림을 다시 확인해 주세요.';end if;
 if p_action='mix' then
  if cardinality(p_cells)<>2 or not p_cells @> array['blue','yellow']::text[] then raise exception '초록이 만들어진 물감을 다시 확인해 주세요.';end if;
 else
  if cardinality(p_cells)<>25 or p_stamp is null or p_stamp not in ('leaf','heart','star')
   or exists(select 1 from unnest(p_cells) v where v is null or v not in ('empty','red','yellow','blue','green','orange','purple'))
   or not exists(select 1 from unnest(p_cells) v where v<>'empty') then raise exception '색을 칠한 그림과 도장을 다시 확인해 주세요.';end if;
 end if;
 select public.rpg_level_for_xp(s.xp) into lv from public.students s where s.id=sid for update;
 select exists(select 1 from rpg_private.school_art where student_id=sid) into started;
 if not started and lv<17 then raise exception '물감 놀이와 그림 엽서는 Lv.17에 열려요.';end if;
 if p_action='mix' then insert into rpg_private.school_art(student_id) values(sid) on conflict do nothing;
 else
  if not started then raise exception '노랑과 파랑을 섞어 초록부터 발견해 주세요.';end if;
  update rpg_private.school_art set phase=2,cells=p_cells,stamp=p_stamp,completed_at=coalesce(completed_at,now()) where student_id=sid;
 end if;
 return rpg_private.art_state(sid);
end $$;
revoke all on function public.student_art_postcard(text,text,text[],text) from public;
grant execute on function public.student_art_postcard(text,text,text[],text) to anon,authenticated;
comment on function public.student_art_postcard(text,text,text[],text) is 'Lv17 token-owned green discovery and editable 25-cell postcard. Ordered access, bounded palette, replay preserves first completion; no XP/gold/item writes.';

create or replace function public.student_learning_journal(p_token text)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare sid bigint; result jsonb;
begin
 sid:=public.student_for_token(p_token);
 if sid is null then raise exception '다시 로그인해 주세요.'; end if;
 select jsonb_build_object(
  'kindness',rpg_private.kindness_state(sid),
  'art',rpg_private.art_state(sid),
  'workshop',coalesce((select jsonb_build_object('cover',w.cover,'garden_complete',w.garden_completed_at is not null,'chapter_one_complete',w.chapter_one_completed_at is not null,'chapter_one_promise',w.chapter_one_promise,'chapter_one_badge',w.chapter_one_badge) from rpg_private.school_workshop w where w.student_id=sid),jsonb_build_object('cover','paper','garden_complete',false,'chapter_one_complete',false,'chapter_one_promise',null,'chapter_one_badge',true)),
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
