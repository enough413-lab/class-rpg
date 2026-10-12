-- Test-only second story ending. This records cosmetic choices, never reward grants.
create table rpg_private.school_finale (
 student_id bigint primary key references public.students(id) on delete cascade,
 memories text[] not null check(cardinality(memories)=3 and array_ndims(memories)=1 and array_lower(memories,1)=1 and memories <@ array['melody','kindness','parcel','art','letter']::text[]),
 ribbon text not null check(ribbon in ('meadow','sunset','sky')),
 wearing boolean not null default true,
 completed_at timestamptz not null default now()
);
alter table rpg_private.school_finale enable row level security;
revoke all on rpg_private.school_finale from public,anon,authenticated;
create or replace function rpg_private.finale_state(p_student bigint)
returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('earned',array_remove(array[
  case when exists(select 1 from rpg_private.school_exploration where student_id=p_student and step_id='music-sequence-3')then 'melody' end,
  case when exists(select 1 from rpg_private.school_kindness where student_id=p_student and phase=4)then 'kindness' end,
  case when exists(select 1 from rpg_private.school_exploration where student_id=p_student and step_id='parcel-3')then 'parcel' end,
  case when exists(select 1 from rpg_private.school_art where student_id=p_student and phase=2 and decorated_at is not null)then 'art' end,
  case when exists(select 1 from rpg_private.school_exploration where student_id=p_student and step_id='letter-3')then 'letter' end
 ]::text[],null))||coalesce((select jsonb_build_object('memories',memories,'ribbon',ribbon,'wearing',wearing,'completed_at',completed_at)from rpg_private.school_finale where student_id=p_student),jsonb_build_object('memories','[]'::jsonb,'ribbon','meadow','wearing',false,'completed_at',null));
$$;
revoke all on function rpg_private.finale_state(bigint)from public,anon,authenticated;
create or replace function public.student_school_finale(p_token text,p_action text,p_memories text[] default null,p_ribbon text default null,p_wearing boolean default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare sid bigint; lv integer; state jsonb; earned text[];
begin
 sid:=public.student_for_token(p_token);if sid is null then raise exception '다시 로그인한 뒤 기억을 펼쳐 주세요.';end if;
 if p_action is null or p_action not in ('read','save','wear')then raise exception '다시 수첩을 펼쳐 주세요.';end if;
 if p_action='read' then return rpg_private.finale_state(sid);end if;
 select public.rpg_level_for_xp(s.xp)into lv from public.students s where s.id=sid for update;
 state:=rpg_private.finale_state(sid);
 if p_action='wear' then
  if state->>'completed_at' is null or p_wearing is null then raise exception '먼저 기억의 가랜드를 완성해 주세요.';end if;
  update rpg_private.school_finale set wearing=p_wearing where student_id=sid;
  return rpg_private.finale_state(sid);
 end if;
 if state->>'completed_at' is null and lv<20 then raise exception '기억의 가랜드는 Lv.20에 열려요.';end if;
 if p_memories is null or array_ndims(p_memories)is distinct from 1 or array_lower(p_memories,1)is distinct from 1 or cardinality(p_memories)<>3
 or exists(select 1 from unnest(p_memories)v where v is null or v not in ('melody','kindness','parcel','art','letter'))
 or (select count(distinct v)from unnest(p_memories)v)<>3 or p_ribbon is null or p_ribbon not in ('meadow','sunset','sky')then raise exception '서로 다른 기억 세 가지와 리본을 골라 주세요.';end if;
 select array_agg(v)into earned from jsonb_array_elements_text(state->'earned')v;
 if earned is null or not(p_memories <@ earned)then raise exception '수첩에 남긴 기억부터 걸어 주세요.';end if;
 insert into rpg_private.school_finale(student_id,memories,ribbon)values(sid,p_memories,p_ribbon)
 on conflict(student_id)do update set memories=excluded.memories,ribbon=excluded.ribbon;
 return rpg_private.finale_state(sid);
end $$;
revoke all on function public.student_school_finale(text,text,text[],text,boolean)from public;
grant execute on function public.student_school_finale(text,text,text[],text,boolean)to anon,authenticated;
notify pgrst,'reload schema';
