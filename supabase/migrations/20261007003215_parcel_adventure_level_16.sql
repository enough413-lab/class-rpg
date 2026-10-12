-- Staging-only spatial school quest. UI room navigation is client-owned;
-- server owns level gates, ordered progress, clue validation and token ownership.
create or replace function public.student_parcel_adventure(p_token text,p_step text,p_clues text[])
returns jsonb language plpgsql security definer set search_path='' as $$
declare sid bigint; lv integer; position integer; expected text[]; inserted integer;
begin
 sid:=public.student_for_token(p_token);if sid is null then raise exception '다시 로그인한 뒤 꾸러미를 살펴봐 주세요.';end if;
 select v.position,v.clues into position,expected from (values
  ('parcel-1',1,array['book','leaf']::text[]),('parcel-2',2,array['library']::text[]),('parcel-3',3,array['tori']::text[])
 ) v(id,position,clues) where v.id=p_step;
 if position is null or p_clues is null or array_ndims(p_clues) is distinct from 1 or array_lower(p_clues,1) is distinct from 1
  or cardinality(p_clues)<>cardinality(expected) or exists(select 1 from unnest(p_clues) v where v is null or v not in ('book','leaf','library','shop','classroom','tori'))
  or (select count(distinct v) from unnest(p_clues) v)<>cardinality(expected) then raise exception '발견한 단서를 다시 확인해 주세요.';end if;
 select public.rpg_level_for_xp(s.xp) into lv from public.students s where s.id=sid for update;
 if lv<16 and not exists(select 1 from rpg_private.school_exploration where student_id=sid and step_id in ('parcel-1','parcel-2','parcel-3')) then
  raise exception '꾸러미 산책 의뢰는 Lv.16에 시작해요.';
 end if;
 if exists(select 1 from generate_series(1,position-1) n where not exists(select 1 from rpg_private.school_exploration where student_id=sid and step_id='parcel-'||n::text)) then
  raise exception '앞의 단서부터 차근차근 찾아 주세요.';
 end if;
 if not p_clues @> expected then return jsonb_build_object('correct',false);end if;
 insert into rpg_private.school_exploration(student_id,step_id) values(sid,p_step) on conflict do nothing;get diagnostics inserted=row_count;
 return jsonb_build_object('correct',true,'new',inserted=1,'step_id',p_step);
end $$;
revoke all on function public.student_parcel_adventure(text,text,text[]) from public;
grant execute on function public.student_parcel_adventure(text,text,text[]) to anon,authenticated;
comment on function public.student_parcel_adventure(text,text,text[]) is 'Lv16 parcel clues and delivery. Token-owned ordered progress; no XP, gold, inventory or gift writes. Does not assert server-verified physical movement.';
