-- Test first. Failure is a response row so attempts are committed, not rolled back.
-- Existing successful result shape is retained; client must inspect a missing token.
create or replace function public.student_login(p_login_id text,p_pin text)
returns table(session_token text,student_data jsonb)
language plpgsql security definer set search_path='' as $$
declare s public.students%rowtype; raw_token text; attempts integer; until_time timestamptz;
begin
  select * into s from public.students where lower(login_id)=lower(trim(p_login_id)) for update;
  if not found then
    student_data:=jsonb_build_object('login_error','아이디 또는 비밀번호가 맞지 않아요.');return next;return;
  end if;
  if s.locked_until>now() then
    student_data:=jsonb_build_object('login_error','잠시 후 다시 시도해 주세요.','locked_until',s.locked_until);return next;return;
  end if;
  if p_pin is null or p_pin !~ '^[0-9]{4}$' or s.pin_hash is distinct from extensions.crypt(p_pin,s.pin_hash) then
    attempts:=case when s.locked_until is not null then 1 else least(5,s.failed_attempts+1) end;
    until_time:=case when attempts>=5 then now()+interval '5 minutes' else null end;
    update public.students set failed_attempts=attempts,locked_until=until_time where id=s.id;
    student_data:=jsonb_build_object('login_error','아이디 또는 비밀번호가 맞지 않아요.','locked_until',until_time);return next;return;
  end if;
  raw_token:=encode(extensions.gen_random_bytes(32),'hex');
  update public.students set session_hash=encode(extensions.digest(convert_to(raw_token,'UTF8'),'sha256'),'hex'),session_expires_at=now()+interval '30 days',failed_attempts=0,locked_until=null where id=s.id;
  session_token:=raw_token;
  student_data:=jsonb_build_object('id',s.id,'number',s.student_number,'login_id',s.login_id,'nickname',s.nickname,'gender',s.gender,'setup_complete',s.setup_complete,'xp',s.xp,'gold',s.gold);
  return next;
end; $$;
revoke all on function public.student_login(text,text) from public;
grant execute on function public.student_login(text,text) to anon,authenticated;
