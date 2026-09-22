-- 우리반 RPG 기능 공개 설정
create table if not exists public.class_rpg_settings (
  id integer primary key default 1 check (id=1),
  explorer_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
insert into public.class_rpg_settings(id, explorer_enabled) values (1,false) on conflict(id) do nothing;
alter table public.class_rpg_settings enable row level security;
revoke all on public.class_rpg_settings from anon, authenticated;

create or replace function public.student_explorer_access(p_token text)
returns boolean language plpgsql security definer set search_path=public stable as $$
declare v_student_id bigint; v_enabled boolean;
begin
  v_student_id:=public.student_for_token(p_token);
  if v_student_id is null then return false; end if;
  select explorer_enabled into v_enabled from public.class_rpg_settings where id=1;
  return coalesce(v_enabled,false);
end; $$;
revoke all on function public.student_explorer_access(text) from public;
grant execute on function public.student_explorer_access(text) to anon, authenticated;

create or replace function public.teacher_feature_settings()
returns jsonb language sql security definer set search_path=public stable as $$
  select case when auth.uid() is null then null else jsonb_build_object('explorer_enabled',explorer_enabled,'updated_at',updated_at) end
  from public.class_rpg_settings where id=1;
$$;
revoke all on function public.teacher_feature_settings() from public;
grant execute on function public.teacher_feature_settings() to authenticated;

create or replace function public.teacher_set_explorer_enabled(p_enabled boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  update public.class_rpg_settings set explorer_enabled=p_enabled,updated_at=now(),updated_by=auth.uid() where id=1;
end; $$;
revoke all on function public.teacher_set_explorer_enabled(boolean) from public;
grant execute on function public.teacher_set_explorer_enabled(boolean) to authenticated;
