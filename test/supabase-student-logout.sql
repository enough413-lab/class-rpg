create or replace function public.student_logout(p_token text)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if p_token is not null and length(p_token)>0 then
    update public.students set session_hash=null,session_expires_at=now()
    where session_hash=encode(extensions.digest(convert_to(p_token,'UTF8'),'sha256'),'hex');
  end if;
  return jsonb_build_object('ok',true);
end; $$;
revoke all on function public.student_logout(text) from public;
grant execute on function public.student_logout(text) to anon,authenticated;
