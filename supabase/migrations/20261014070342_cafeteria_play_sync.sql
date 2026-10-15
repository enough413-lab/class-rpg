-- Personal meal play only. No school progress, inventory or reward writes.
create table rpg_private.cafeteria_play (
 student_id bigint primary key references public.students(id) on delete cascade,
 state jsonb not null,
 revision bigint not null check (revision between 1 and 9007199254740991),
 request_id uuid not null,
 updated_at timestamptz not null default now()
);
alter table rpg_private.cafeteria_play enable row level security;
revoke all on rpg_private.cafeteria_play from public, anon, authenticated;

create function public.student_cafeteria_play(p_token text, p_state jsonb default null,
 p_expected_revision bigint default null, p_request_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare sid bigint; saved rpg_private.cafeteria_play%rowtype;
 blank constant jsonb := '{"v":1,"mode":"free","bites":0,"meals":0,"washed":false}';
begin
 sid:=public.student_for_token(p_token);
 if sid is null then raise exception '다시 로그인한 뒤 식판을 이어 주세요.'; end if;
 if p_state is not null then
  if jsonb_typeof(p_state) is distinct from 'object'
   or p_state - array['v','mode','bites','meals','washed'] <> '{}'::jsonb
   or p_state->'v' is distinct from '1'::jsonb
   or coalesce(p_state->>'mode','') not in ('free','carrying','finished')
   or jsonb_typeof(p_state->'washed') is distinct from 'boolean'
   or jsonb_typeof(p_state->'meals') is distinct from 'number'
   or coalesce(p_state->>'meals','') !~ '^(0|[1-9][0-9]{0,2})$'
   or coalesce(p_state->'bites','null'::jsonb) not in ('0'::jsonb,'1'::jsonb,'2'::jsonb,'3'::jsonb)
   or (p_state->>'mode'='free' and p_state->'bites'<>'0'::jsonb)
   or (p_state->>'mode'='finished' and p_state->'bites'<>'3'::jsonb)
   or (p_state->>'mode'='carrying' and p_state->'bites'='3'::jsonb)
   or p_expected_revision is null or p_expected_revision<0 or p_request_id is null
  then raise exception '식판 상태를 다시 확인해 주세요.'; end if;
  -- Serialize even the first write; the student row is only locked, never changed.
  perform 1 from public.students where id=sid for update;
  if public.student_for_token(p_token) is distinct from sid then
   raise exception '다시 로그인한 뒤 식판을 이어 주세요.';
  end if;
 end if;
 select * into saved from rpg_private.cafeteria_play where student_id=sid;
 if p_state is not null then
  if saved.request_id=p_request_id then
   if saved.state<>p_state then raise exception '식판 상태를 다시 확인해 주세요.'; end if;
  elsif coalesce(saved.revision,0)<>p_expected_revision then
   return jsonb_build_object('state',coalesce(saved.state,blank),'revision',coalesce(saved.revision,0),'conflict',true);
  else
   insert into rpg_private.cafeteria_play(student_id,state,revision,request_id)
    values(sid,p_state,coalesce(saved.revision,0)+1,p_request_id)
   on conflict(student_id) do update set state=excluded.state,revision=excluded.revision,
    request_id=excluded.request_id,updated_at=now()
   returning * into saved;
  end if;
 end if;
 return jsonb_build_object('state',coalesce(saved.state,blank),'revision',coalesce(saved.revision,0),'conflict',false);
end $$;
revoke all on function public.student_cafeteria_play(text,jsonb,bigint,uuid) from public;
grant execute on function public.student_cafeteria_play(text,jsonb,bigint,uuid) to anon,authenticated;
comment on function public.student_cafeteria_play(text,jsonb,bigint,uuid) is
 'Custom student bearer session checked by student_for_token. Private per-student cosmetic meal state; bounded CAS writes, no rewards.';
notify pgrst,'reload schema';
