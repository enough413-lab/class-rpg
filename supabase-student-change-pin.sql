-- Students may change their own four-digit PIN after verifying their current PIN.
create or replace function public.student_change_pin(p_token text, p_current_pin text, p_new_pin text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  s public.students%rowtype;
  raw_token text;
begin
  if p_current_pin is null or p_current_pin !~ '^[0-9]{4}$'
     or p_new_pin is null or p_new_pin !~ '^[0-9]{4}$' then
    return jsonb_build_object('ok',false,'message','비밀번호는 숫자 4자리로 입력해 주세요.');
  end if;
  select * into s from public.students
  where session_hash=encode(extensions.digest(convert_to(p_token,'UTF8'),'sha256'),'hex')
    and session_expires_at>now() for update;
  if not found then
    return jsonb_build_object('ok',false,'message','로그인이 만료됐어요. 다시 로그인해 주세요.');
  end if;
  if s.locked_until>now() then
    return jsonb_build_object('ok',false,'message','잠시 후 다시 시도해 주세요.');
  end if;
  if s.pin_hash is distinct from extensions.crypt(p_current_pin,s.pin_hash) then
    update public.students set
      failed_attempts=case when s.locked_until is not null then 1 else s.failed_attempts+1 end,
      locked_until=case when s.locked_until is null and s.failed_attempts+1>=5 then now()+interval '5 minutes' else null end
    where id=s.id;
    return jsonb_build_object('ok',false,'message','현재 비밀번호가 맞지 않아요.');
  end if;
  if p_current_pin=p_new_pin then
    return jsonb_build_object('ok',false,'message','현재 비밀번호와 다른 새 비밀번호를 입력해 주세요.');
  end if;
  raw_token:=encode(extensions.gen_random_bytes(32),'hex');
  update public.students set
    pin_hash=extensions.crypt(p_new_pin,extensions.gen_salt('bf')),
    session_hash=encode(extensions.digest(convert_to(raw_token,'UTF8'),'sha256'),'hex'),
    failed_attempts=0,locked_until=null
  where id=s.id;
  return jsonb_build_object('ok',true,'session_token',raw_token);
end;
$$;
revoke all on function public.student_change_pin(text,text,text) from public;
grant execute on function public.student_change_pin(text,text,text) to anon,authenticated;
