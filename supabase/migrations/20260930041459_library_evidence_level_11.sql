-- Lv.11 reading practice: token-owned progress, no XP/gold writes.
-- Existing journal includes these distinct step IDs; ordinary location stamps stay unchanged.
create or replace function public.student_library_evidence(p_token text,p_case text,p_claim integer,p_evidence integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare sid bigint; lv integer; position integer; expected_claim integer; expected_evidence integer; prior integer; inserted integer;
begin
 sid:=public.student_for_token(p_token);
 if sid is null then raise exception '다시 로그인해 주세요.'; end if;
 select a.position,a.claim,a.evidence into position,expected_claim,expected_evidence from (values
  ('library-evidence-1',1,1,1),
  ('library-evidence-2',2,0,2),
  ('library-evidence-3',3,2,0)
 ) a(id,position,claim,evidence) where a.id=p_case;
 if position is null or p_claim is null or p_claim not between 0 and 2 or p_evidence is null or p_evidence not between 0 and 2 then
  raise exception '생각과 단서를 하나씩 골라 주세요.';
 end if;
 select public.rpg_level_for_xp(s.xp) into lv from public.students s where s.id=sid for update;
 -- Once started, keep this unlocked if a teacher subsequently corrects XP.
 if lv<11 and not exists(select 1 from rpg_private.school_exploration where student_id=sid
  and step_id in ('library-evidence-1','library-evidence-2','library-evidence-3')) then
  raise exception '도서관 단서 탐험은 Lv.11에 열려요.';
 end if;
 select count(*) into prior from rpg_private.school_exploration where student_id=sid
  and step_id=any(select 'library-evidence-'||n from generate_series(1,position-1) n);
 if prior<position-1 then raise exception '앞의 이야기부터 천천히 읽어 주세요.'; end if;
 if p_claim<>expected_claim then return jsonb_build_object('correct',false,'reason','claim'); end if;
 if p_evidence<>expected_evidence then return jsonb_build_object('correct',false,'reason','evidence'); end if;
 insert into rpg_private.school_exploration(student_id,step_id) values(sid,p_case) on conflict do nothing;
 get diagnostics inserted=row_count;
 return jsonb_build_object('correct',true,'new',inserted=1,'step_id',p_case);
end $$;
revoke all on function public.student_library_evidence(text,text,integer,integer) from public;
grant execute on function public.student_library_evidence(text,text,integer,integer) to anon,authenticated;
