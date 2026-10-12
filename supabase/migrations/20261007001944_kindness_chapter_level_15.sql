-- Student test only. Original NPC story; no XP/gold/item writes.
create table rpg_private.school_kindness (
 student_id bigint primary key references public.students(id) on delete cascade,
 phase integer not null default 0 check(phase between 0 and 4),
 choices text[] not null default '{}'::text[] check(cardinality(choices)=phase),
 pin text check(pin in ('leaf','sun','star')),
 wearing boolean not null default false,
 completed_at timestamptz
);
alter table rpg_private.school_kindness enable row level security;
revoke all on rpg_private.school_kindness from public,anon,authenticated;
create or replace function rpg_private.kindness_state(p_student bigint)
returns jsonb language sql stable set search_path='' as $$
 select coalesce((select jsonb_build_object('phase',phase,'choices',choices,'pin',pin,'wearing',wearing,'completed_at',completed_at)
 from rpg_private.school_kindness where student_id=p_student),jsonb_build_object('phase',0,'choices','[]'::jsonb,'pin',null,'wearing',false,'completed_at',null));
$$;
revoke all on function rpg_private.kindness_state(bigint) from public,anon,authenticated;
create or replace function public.student_kindness_chapter(p_token text,p_step text,p_choice text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare sid bigint; lv integer; position integer; w rpg_private.school_kindness%rowtype;
begin
 sid:=public.student_for_token(p_token);
 if sid is null then raise exception '다시 로그인한 뒤 나루를 만나 주세요.'; end if;
 if p_step is null or p_choice is null then raise exception '이야기와 선택을 확인해 주세요.'; end if;
 position:=case p_step when 'kindness-1' then 1 when 'kindness-2' then 2 when 'kindness-3' then 3 when 'kindness-4' then 4 else null end;
 if position is null and p_step not in ('wear','pin') then raise exception '이야기를 다시 펼쳐 주세요.'; end if;
 if (position=1 and p_choice not in ('listen','ask')) or (position=2 and p_choice not in ('library','classroom','shop'))
 or (position=3 and p_choice not in ('walk','introduce')) or (position=4 and p_choice not in ('leaf','sun','star'))
 or (p_step='wear' and p_choice not in ('show','hide')) or (p_step='pin' and p_choice not in ('leaf','sun','star')) then
  raise exception '고른 내용을 다시 확인해 주세요.';
 end if;
 select public.rpg_level_for_xp(s.xp) into lv from public.students s where s.id=sid for update;
 select * into w from rpg_private.school_kindness where student_id=sid;
 if not found then w.phase:=0;w.choices:='{}'::text[]; end if;
 if w.phase=0 and lv<15 then raise exception '나루의 길 안내는 Lv.15에 열려요.'; end if;
 if p_step in ('wear','pin') then
  if w.phase<>4 then raise exception '나루와의 이야기를 먼저 마쳐 주세요.'; end if;
  if p_step='wear' then update rpg_private.school_kindness set wearing=(p_choice='show') where student_id=sid;
  else update rpg_private.school_kindness set pin=p_choice where student_id=sid;end if;
  return rpg_private.kindness_state(sid);
 end if;
 if position>w.phase+1 then raise exception '앞의 이야기부터 나루와 함께해 주세요.'; end if;
 if position=2 and p_choice<>'library' then return jsonb_build_object('correct',false); end if;
 if position<=w.phase then
  if w.choices[position]<>p_choice then raise exception '이미 남긴 발자국이에요. 내 수첩을 다시 펼쳐 주세요.'; end if;
  return rpg_private.kindness_state(sid);
 end if;
 insert into rpg_private.school_kindness(student_id,phase,choices,pin,wearing,completed_at)
 values(sid,position,w.choices||p_choice,case when position=4 then p_choice else null end,position=4,case when position=4 then now() else null end)
 on conflict(student_id) do update set phase=excluded.phase,choices=excluded.choices,pin=excluded.pin,wearing=excluded.wearing,completed_at=excluded.completed_at;
 return rpg_private.kindness_state(sid);
end $$;
revoke all on function public.student_kindness_chapter(text,text,text) from public;
grant execute on function public.student_kindness_chapter(text,text,text) to anon,authenticated;
comment on function public.student_kindness_chapter(text,text,text) is 'Lv15 token-owned Naru story, ordered progress and editable cosmetic pin. No economy changes.';

create or replace function public.student_learning_journal(p_token text)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare sid bigint; result jsonb;
begin
 sid:=public.student_for_token(p_token);
 if sid is null then raise exception '다시 로그인해 주세요.'; end if;
 select jsonb_build_object(
  'kindness',rpg_private.kindness_state(sid),
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
