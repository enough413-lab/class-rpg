-- Test-first Lv19 story. PIN-token ownership and student lock follow the existing journal API.
create or replace function public.student_garden_letter(p_token text,p_step text,p_clues text[])
returns jsonb language plpgsql security definer set search_path='' as $$
declare sid bigint; lv integer; position integer; expected text[]; inserted integer;
begin
 sid:=public.student_for_token(p_token);
 if sid is null then raise exception '다시 로그인하고 편지를 펼쳐 주세요.';end if;
 select v.position,v.clues into position,expected from(values
 ('letter-1',1,array['leaf','stem','light']::text[]),
 ('letter-2',2,array['leaf','light','grow']::text[]),
 ('letter-3',3,array['tori']::text[]))v(id,position,clues)where v.id=p_step;
 if position is null or p_clues is null or array_ndims(p_clues) is distinct from 1
 or array_lower(p_clues,1) is distinct from 1 or cardinality(p_clues)<>cardinality(expected)
 or exists(select 1 from unnest(p_clues)v where v is null or v not in ('leaf','stem','light','grow','tori'))
 or (select count(distinct v)from unnest(p_clues)v)<>cardinality(expected)
 then raise exception '편지 조각을 다시 확인해 주세요.';end if;
 select public.rpg_level_for_xp(s.xp) into lv from public.students s where s.id=sid for update;
 if lv<19 and not exists(select 1 from rpg_private.school_exploration where student_id=sid and step_id='letter-1')then raise exception 'Lv.19부터 초록 편지를 만들 수 있어요.';end if;
 if exists(select 1 from generate_series(1,position-1)n where not exists(select 1 from rpg_private.school_exploration where student_id=sid and step_id='letter-'||n))then raise exception '앞의 발자국부터 이어 주세요.';end if;
 if not(p_clues @> expected) or position=2 and p_clues<>expected then return jsonb_build_object('correct',false);end if;
 insert into rpg_private.school_exploration(student_id,step_id)values(sid,p_step)on conflict do nothing;
 get diagnostics inserted=row_count;
 return jsonb_build_object('correct',true,'new',inserted=1,'step_id',p_step);
end $$;
revoke all on function public.student_garden_letter(text,text,text[])from public;
grant execute on function public.student_garden_letter(text,text,text[])to anon,authenticated;
