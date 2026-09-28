# Teacher-selected quest submission requirements

Staging feature: new quests require an explicit selection of `photo`, `text`, or
`both`. Photo mode requires 1–5 photos and omits text; text mode requires text and
omits photos; both requires both. The student dialog shows only permitted fields.
Creation works through both the core page and the outer gameplay enhancement.
The edit dialog supports updating the mode, preserving unsaved edits on failure.

Existing quests retain NULL and their prior behavior. Changing a quest's mode
does not rewrite submissions: the new requirements apply to future submissions
and edits. Approved records retain their existing protections. Student dashboard
RPC includes the mode; evidence RPC validates it server-side. The older no-body
submission RPC rejects mode-configured quests so it cannot bypass requirements.
Teacher ownership policies, student authentication, rewards and period keys are
unchanged.

Verification:
- `NODE_PATH=<playwright packages directory> node tests/submission-modes.cjs`
- `node tests/multi-photo.cjs` with the same NODE_PATH
- On staging only: `tests/submission-modes.sql` and `tests/multi-photo.sql`
  (fixture records and test sessions roll back).

Deployment: apply `supabase/migrations/20260928044824_quest_submission_modes.sql`
once, then deploy the changed student/teacher entrypoints, `teacher-gameplay.js`
and `quest-submission.js` together. Only staging DB and `test/` are authorized
for this feature. Production requires a separate explicit release request.
