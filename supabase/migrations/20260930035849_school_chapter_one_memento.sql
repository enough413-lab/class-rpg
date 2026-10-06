-- A cosmetic memento for the first school chapter. No XP, gold or item advantage.
alter table rpg_private.school_workshop
 add column chapter_one_completed_at timestamptz,
 add column chapter_one_promise text check(chapter_one_promise in ('kindness','reading','observation')),
 add column chapter_one_badge boolean not null default true;

create or replace function public.student_complete_school_chapter(p_token text,p_promise text,p_badge boolean default true)
returns jsonb language plpgsql security definer set search_path='' as $$
declare sid bigint; lv integer; stamps integer; w rpg_private.school_workshop%rowtype;
begin
 sid:=public.student_for_token(p_token);
 if sid is null then raise exception '다시 로그인해 주세요.'; end if;
 if p_promise is null or p_promise not in ('kindness','reading','observation') or p_badge is null then
  raise exception '학교에서 실천할 약속을 하나 골라 주세요.';
 end if;
 select public.rpg_level_for_xp(s.xp) into lv from public.students s where s.id=sid for update;
 select * into w from rpg_private.school_workshop where student_id=sid;
 -- Already earned mementos remain editable if a teacher later corrects XP.
 if w.chapter_one_completed_at is null then
  if lv<10 then raise exception '첫 모험 기념식은 Lv.10에 열려요.'; end if;
  select count(*) into stamps from (
   select split_part(e.step_id,'-',1) from rpg_private.school_exploration e where e.student_id=sid
    and split_part(e.step_id,'-',1) in ('classroom','hallway','library','garden','playground','pond','cafeteria')
    and split_part(e.step_id,'-',2) in ('1','2','3')
   group by split_part(e.step_id,'-',1) having count(*)=3
  ) completed;
  if stamps<7 then raise exception '일곱 장소의 탐험 도장을 모두 모아 주세요.'; end if;
  if w.garden_completed_at is null then raise exception '정원의 변화 찾기도 마쳐 주세요.'; end if;
 end if;
 update rpg_private.school_workshop set chapter_one_completed_at=coalesce(chapter_one_completed_at,now()),
  chapter_one_promise=p_promise,chapter_one_badge=p_badge where student_id=sid returning * into w;
 return jsonb_build_object('chapter_one_complete',true,'chapter_one_promise',w.chapter_one_promise,'chapter_one_badge',w.chapter_one_badge);
end $$;
revoke all on function public.student_complete_school_chapter(text,text,boolean) from public;
grant execute on function public.student_complete_school_chapter(text,text,boolean) to anon,authenticated;

create or replace function public.student_learning_journal(p_token text)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare sid bigint; result jsonb;
begin
 sid:=public.student_for_token(p_token);
 if sid is null then raise exception '다시 로그인해 주세요.'; end if;
 select jsonb_build_object(
  'workshop',coalesce((select jsonb_build_object('cover',w.cover,'garden_complete',w.garden_completed_at is not null,'chapter_one_complete',w.chapter_one_completed_at is not null,'chapter_one_promise',w.chapter_one_promise,'chapter_one_badge',w.chapter_one_badge) from rpg_private.school_workshop w where w.student_id=sid),jsonb_build_object('cover','paper','garden_complete',false,'chapter_one_complete',false,'chapter_one_promise',null,'chapter_one_badge',true)),
  'exploration',coalesce((select jsonb_agg(e.step_id order by e.step_id) from rpg_private.school_exploration e where e.student_id=sid),'[]'::jsonb),
  'areas',coalesce((select jsonb_object_agg(category,n) from (
    select category,count(*) n from (
      select coalesce(q.category,'life') category from public.quest_submissions s join public.quests q on q.id=s.quest_id
      where s.student_id=sid and s.status='approved'
      union all select 'reading' from public.reading_reviews where student_id=sid and status='approved'
    ) activities group by category) counts),'{}'::jsonb),
  'recent',coalesce((select jsonb_agg(to_jsonb(recent) order by at desc) from (
    select * from (
     select q.title,coalesce(s.reviewed_at,s.submitted_at) at from public.quest_submissions s join public.quests q on q.id=s.quest_id
      where s.student_id=sid and s.status='approved'
     union all select book_title title,coalesce(reviewed_at,created_at) at from public.reading_reviews where student_id=sid and status='approved'
    ) activities order by at desc limit 6
  ) recent),'[]'::jsonb)
 ) into result;
 return result;
end $$;
revoke all on function public.student_learning_journal(text) from public;
grant execute on function public.student_learning_journal(text) to anon,authenticated;
