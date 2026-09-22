-- 메인 퀘스트의 '진행 중' 상태를 허용합니다.
begin;
alter table public.quest_submissions drop constraint if exists quest_submissions_status_check;
alter table public.quest_submissions add constraint quest_submissions_status_check
  check (status in ('accepted','submitted','approved','rejected'));
commit;
