-- TEST ONLY gcgjpfidppaioambcatq. Keep legacy evidence_image URL/string-array format.
alter table public.quest_submissions add column if not exists evidence_captions jsonb not null default '[]'::jsonb;
create table if not exists rpg_private.quest_photo_caption_receipts(
 student_id bigint not null references public.students(id) on delete cascade,
 request_id uuid not null,caption_hash text not null,primary key(student_id,request_id)
);
alter table rpg_private.quest_photo_caption_receipts enable row level security;
revoke all on rpg_private.quest_photo_caption_receipts from public,anon,authenticated;
create or replace function public.student_submit_quest_with_captions(p_token text,p_request_id uuid,p_quest_id bigint,p_expected_period text,p_expected_mode text,p_report text,p_image text,p_captions jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare sid bigint; photos jsonb; count_photos integer; fingerprint text; saved_hash text; result jsonb; had_caption boolean;
begin
 sid:=public.student_for_token(p_token);if sid is null then raise exception '다시 로그인해 주세요.';end if;
 if p_captions is null or jsonb_typeof(p_captions)<>'array' then raise exception '사진 설명을 다시 확인해 주세요.';end if;
 if jsonb_array_length(p_captions)>5 or exists(select 1 from jsonb_array_elements(p_captions)c where jsonb_typeof(c)<>'string' or length(c#>>'{}')>180)then raise exception '사진 설명은 장당 180자까지 적어 주세요.';end if;
 begin photos:=case when nullif(p_image,'') is null then '[]'::jsonb when left(p_image,1)='[' then p_image::jsonb else jsonb_build_array(p_image)end;exception when invalid_text_representation then raise exception '사진을 다시 확인해 주세요.';end;
 if jsonb_typeof(photos)<>'array' then raise exception '사진을 다시 확인해 주세요.';end if;
 count_photos:=jsonb_array_length(photos);if count_photos<>jsonb_array_length(p_captions)then raise exception '사진 순서와 설명을 다시 확인해 주세요.';end if;
 fingerprint:=encode(extensions.digest(convert_to(p_captions::text,'UTF8'),'sha256'),'hex');
 perform 1 from public.students where id=sid for update;
 select caption_hash into saved_hash from rpg_private.quest_photo_caption_receipts where student_id=sid and request_id=p_request_id;had_caption:=found;
 if had_caption and saved_hash<>fingerprint then raise exception '이전 제출의 사진 설명과 달라요. 먼저 결과를 확인해 주세요.';end if;
 if not had_caption and exists(select 1 from rpg_private.quest_submission_receipts where student_id=sid and request_id=p_request_id)then raise exception '예전 제출의 결과 확인 버튼을 사용해 주세요.';end if;
 result:=public.student_submit_quest_guarded(p_token,p_request_id,p_quest_id,p_expected_period,p_expected_mode,p_report,p_image);
 if had_caption then return result;end if;
 update public.quest_submissions set evidence_captions=p_captions where id=(result->>'submission_id')::bigint and student_id=sid and status='submitted';
 if not found then raise exception '제출 상태를 다시 확인해 주세요.';end if;
 insert into rpg_private.quest_photo_caption_receipts(student_id,request_id,caption_hash) values(sid,p_request_id,fingerprint);
 return result;
end; $$;
revoke all on function public.student_submit_quest_with_captions(text,uuid,bigint,text,text,text,text,jsonb) from public;
grant execute on function public.student_submit_quest_with_captions(text,uuid,bigint,text,text,text,text,jsonb) to anon,authenticated;
create or replace function public.student_quest_evidence(p_token text,p_quest_id bigint)
returns jsonb language plpgsql security definer stable set search_path='' as $$
declare sid bigint; result jsonb;
begin
 sid:=public.student_for_token(p_token);if sid is null then raise exception '다시 로그인해 주세요.';end if;
 select jsonb_build_object('quest_id',q.id,'title',q.title,'description',q.description,'xp',q.xp_reward,'gold',q.gold_reward,'report_text',s.report_text,'evidence_image',s.evidence_image,'evidence_captions',s.evidence_captions,'submitted_at',s.submitted_at,'reviewed_at',s.reviewed_at)into result from public.quest_submissions s join public.quests q on q.id=s.quest_id where s.student_id=sid and s.quest_id=p_quest_id and s.status='approved' order by s.submitted_at desc nulls last limit 1;
 if result is null then raise exception '완료한 퀘스트 기록을 찾을 수 없어요.';end if;return result;
end; $$;
revoke all on function public.student_quest_evidence(text,bigint) from public;
grant execute on function public.student_quest_evidence(text,bigint) to anon,authenticated;
-- An older browser can edit only image URLs. Drop stale descriptions on image change;
-- the caption-aware RPC writes the matching descriptions in the same transaction.
create or replace function rpg_private.clear_stale_photo_captions()
returns trigger language plpgsql set search_path='' as $$
begin new.evidence_captions:='[]'::jsonb;return new;end; $$;
revoke all on function rpg_private.clear_stale_photo_captions() from public,anon,authenticated;
drop trigger if exists clear_stale_photo_captions on public.quest_submissions;
create trigger clear_stale_photo_captions before update of evidence_image on public.quest_submissions
for each row when(old.evidence_image is distinct from new.evidence_image) execute function rpg_private.clear_stale_photo_captions();
