-- Test project only. PIN-token ownership is checked explicitly; no client table writes.
create or replace function public.student_music_room(p_token text, p_step text, p_choice integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare sid bigint; lv integer; step_position integer; expected integer; choice_count integer; inserted integer;
begin
 sid := public.student_for_token(p_token);
 if sid is null then raise exception '다시 로그인한 뒤 음악실에 와 주세요.'; end if;
 select v.position,v.answer,v.choices into step_position,expected,choice_count
 from (values ('music-room-1',1,1,3),('music-room-2',2,0,3),('music-room-3',3,2,4)) as v(id,position,answer,choices)
 where v.id=p_step;
 if step_position is null or p_choice is null or p_choice<0 or p_choice>=choice_count then
  raise exception '활동과 고른 소리를 다시 확인해 주세요.';
 end if;
 -- Serialize saves for this student, including duplicate requests and XP corrections.
 select public.rpg_level_for_xp(s.xp) into lv from public.students s where s.id=sid for update;
 if lv<13 and not exists(select 1 from rpg_private.school_exploration e where e.student_id=sid and e.step_id in ('music-room-1','music-room-2','music-room-3')) then
  raise exception '음악실 소리 탐험은 Lv. 13부터 만날 수 있어요.';
 end if;
 if exists(select 1 from generate_series(1,step_position-1) n where not exists(
  select 1 from rpg_private.school_exploration e where e.student_id=sid and e.step_id='music-room-'||n::text
 )) then raise exception '앞의 소리를 발견한 뒤 차례로 만나 주세요.'; end if;
 if p_choice<>expected then return jsonb_build_object('correct',false); end if;
 insert into rpg_private.school_exploration(student_id,step_id) values(sid,p_step) on conflict do nothing;
 get diagnostics inserted = row_count;
 return jsonb_build_object('correct',true,'new',inserted=1,'step_id',p_step);
end $$;
revoke all on function public.student_music_room(text,text,integer) from public;
grant execute on function public.student_music_room(text,text,integer) to anon,authenticated;
comment on function public.student_music_room(text,text,integer) is 'Lv13 music discoveries. Token ownership, level and ordered answers checked; no XP/gold grants.';
