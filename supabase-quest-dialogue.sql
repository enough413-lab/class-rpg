-- 메인 퀘스트의 장면별 대화를 저장하고 학생 화면에 전달합니다.
begin;

alter table public.quests
  add column if not exists dialogue jsonb not null default '[]'::jsonb;

create or replace function public.student_dashboard(p_token text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare sid bigint; s students%rowtype; q jsonb; inv jsonb;
begin
  sid:=student_for_token(p_token);
  if sid is null then raise exception '다시 로그인해 주세요.'; end if;
  select * into s from students where id=sid;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',x.id,'title',x.title,'description',x.description,
    'xp',x.xp_reward,'gold',x.gold_reward,'quest_type',x.quest_type,
    'dialogue',coalesce(x.dialogue,'[]'::jsonb),
    'status',coalesce(y.status,'available')
  ) order by case x.quest_type when 'daily' then 1 when 'weekly' then 2 else 3 end,x.created_at desc),'[]'::jsonb)
  into q
  from quests x left join quest_submissions y on y.quest_id=x.id and y.student_id=sid and y.period_key=quest_period_key(x.quest_type)
  where x.teacher_id=s.teacher_id and x.active;
  select coalesce(jsonb_agg(jsonb_build_object(
    'item_id',i.id,'name',i.name,'slot',i.slot,
    'image',case when s.gender='girl' then i.girl_image else i.boy_image end,
    'equipped',(e.item_id=i.id)
  ) order by case i.slot when 'top' then 1 when 'bottom' then 2 else 3 end,i.created_at),'[]'::jsonb)
  into inv
  from student_items si join item_catalog i on i.id=si.item_id and i.active
  left join student_equipment e on e.student_id=si.student_id and e.slot=i.slot
  where si.student_id=sid;
  return jsonb_build_object(
    'student',jsonb_build_object('id',s.id,'number',s.student_number,'login_id',s.login_id,'nickname',s.nickname,'gender',s.gender,'setup_complete',s.setup_complete,'xp',s.xp,'gold',s.gold),
    'quests',q,'inventory',inv
  );
end; $$;

commit;
