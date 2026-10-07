-- Test-only Lv18 cosmetic frame; the original picture and economy are preserved.
alter table rpg_private.school_art
 add column background text not null default 'cream' check(background in ('cream','meadow','night','sunset')),
 add column frame text not null default 'wood' check(frame in ('wood','leaf','star')),
 add column ornament text not null default 'leaf' check(ornament in ('leaf','flower','star','none')),
 add column placement text not null default 'bottom-right' check(placement in ('top-left','top-right','bottom-right')),
 add column decorated_at timestamptz;
create or replace function rpg_private.art_state(p_student bigint)
returns jsonb language sql stable set search_path='' as $$
 select coalesce((select jsonb_build_object('phase',phase,'cells',cells,'stamp',stamp,'completed_at',completed_at,'background',background,'frame',frame,'ornament',ornament,'placement',placement,'decorated_at',decorated_at) from rpg_private.school_art where student_id=p_student),
 jsonb_build_object('phase',0,'cells',array_fill('empty'::text,array[25]),'stamp','leaf','completed_at',null,'background','cream','frame','wood','ornament','leaf','placement','bottom-right','decorated_at',null));
$$;
revoke all on function rpg_private.art_state(bigint) from public,anon,authenticated;
create or replace function public.student_art_frame(p_token text,p_background text,p_frame text,p_ornament text,p_placement text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare sid bigint; lv integer; art rpg_private.school_art%rowtype;
begin
 sid:=public.student_for_token(p_token);if sid is null then raise exception '다시 로그인한 뒤 내 그림을 펼쳐 주세요.';end if;
 if p_background is null or p_background not in ('cream','meadow','night','sunset') or p_frame is null or p_frame not in ('wood','leaf','star') or p_ornament is null or p_ornament not in ('leaf','flower','star','none') or p_placement is null or p_placement not in ('top-left','top-right','bottom-right') then raise exception '배경과 액자, 장식을 다시 골라 주세요.';end if;
 select public.rpg_level_for_xp(s.xp) into lv from public.students s where s.id=sid for update;
 select * into art from rpg_private.school_art where student_id=sid;
 if art.student_id is null or art.phase<>2 then raise exception '그림 엽서를 먼저 완성해 주세요.';end if;
 if art.decorated_at is null and lv<18 then raise exception '그림 액자 꾸미기는 Lv.18에 열려요.';end if;
 update rpg_private.school_art set background=p_background,frame=p_frame,ornament=p_ornament,placement=p_placement,decorated_at=coalesce(decorated_at,now()) where student_id=sid;
 return rpg_private.art_state(sid);
end $$;
revoke all on function public.student_art_frame(text,text,text,text,text) from public;
grant execute on function public.student_art_frame(text,text,text,text,text) to anon,authenticated;
comment on function public.student_art_frame(text,text,text,text,text) is 'Lv18 token-owned cosmetic frame for a completed Lv17 postcard. Bounded enums, first completion preserved, no economy writes.';
notify pgrst,'reload schema';
