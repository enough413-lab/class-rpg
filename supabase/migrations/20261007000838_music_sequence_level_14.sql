-- Test-only release. Independent chapter progress; no XP, gold or reward writes.
create or replace function public.student_music_sequence(p_token text,p_step text,p_order text[])
returns jsonb language plpgsql security definer set search_path='' as $$
declare sid bigint; lv integer; step_position integer; expected text[]; inserted integer;
begin
 sid:=public.student_for_token(p_token);
 if sid is null then raise exception '다시 로그인한 뒤 루미를 만나 주세요.'; end if;
 select v.position,v.answer into step_position,expected from (values
  ('music-sequence-1',1,array['low','middle','high']::text[]),
  ('music-sequence-2',2,array['short','rest','long']::text[]),
  ('music-sequence-3',3,array['low','high','rest','middle']::text[])
 ) v(id,position,answer) where v.id=p_step;
 if step_position is null or p_order is null or array_ndims(p_order) is distinct from 1
  or array_lower(p_order,1) is distinct from 1 or cardinality(p_order)<>cardinality(expected)
  or exists(select 1 from unnest(p_order) v where v is null or v not in ('low','middle','high','short','rest','long'))
  or (select count(distinct v) from unnest(p_order) v)<>cardinality(expected) then
  raise exception '음표를 한 자리씩 다시 확인해 주세요.';
 end if;
 select public.rpg_level_for_xp(s.xp) into lv from public.students s where s.id=sid for update;
 if not exists(select 1 from rpg_private.school_exploration e where e.student_id=sid and e.step_id in ('music-sequence-1','music-sequence-2','music-sequence-3')) then
  if lv<14 then raise exception '루미의 잃어버린 멜로디는 Lv.14에 열려요.'; end if;
  if exists(select 1 from (values ('music-room-1'),('music-room-2'),('music-room-3')) v(id)
   where not exists(select 1 from rpg_private.school_exploration e where e.student_id=sid and e.step_id=v.id)) then
   raise exception '음악실에서 높낮이, 길이, 쉼을 먼저 발견해 주세요.';
  end if;
 end if;
 if exists(select 1 from generate_series(1,step_position-1) n where not exists(
  select 1 from rpg_private.school_exploration e where e.student_id=sid and e.step_id='music-sequence-'||n::text
 )) then raise exception '앞의 악보부터 함께 찾아 주세요.'; end if;
 if p_order<>expected then return jsonb_build_object('correct',false); end if;
 insert into rpg_private.school_exploration(student_id,step_id) values(sid,p_step) on conflict do nothing;
 get diagnostics inserted=row_count;
 return jsonb_build_object('correct',true,'new',inserted=1,'step_id',p_step);
end $$;
revoke all on function public.student_music_sequence(text,text,text[]) from public;
grant execute on function public.student_music_sequence(text,text,text[]) to anon,authenticated;
comment on function public.student_music_sequence(text,text,text[]) is 'Lv14 token-owned melody ordering. Level, prerequisites and order checked; replay is idempotent and no XP/gold are granted.';
