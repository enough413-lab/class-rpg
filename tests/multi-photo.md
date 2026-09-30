# Quest evidence photos

Student main/daily/weekly reports now accept up to five photos, including adding
more to a pending daily/weekly report. Selection is additive; each preview has a
remove button. Drafts, submitted-record reloads, completed records and teacher
review/zoom all use `quest-photos.js`.

The existing `evidence_image` text field and RPC remain unchanged. A single
image retains its legacy URL format; multiple images use a JSON array of URLs.
New uploads are decoded and resized in the browser (longest edge at most 1600px,
JPEG, at most 360,000 characters per photo). Five photos therefore stay below
the existing 2,000,000-character server limit. Original files up to 15MiB are
accepted. An invalid image rejects the new batch without losing existing photos.

Validation:

- `NODE_PATH=<directory containing playwright> node tests/multi-photo.cjs`
  (Microsoft Edge by default; `TEST_BROWSER_CHANNEL` overrides the channel).
- Run `tests/multi-photo.sql` on staging only. All fixtures roll back.

Release together: `quest-photos.js`, student and teacher HTML entrypoints,
`app-core.html`, and `teacher-quest-reviews.js`. Old clients cannot interpret a
multi-photo JSON value; the HTML/module version strings were bumped together.

The staging SQL regression exposed a pre-existing completed-record RPC error:
`quests` has `xp_reward`/`gold_reward`, not `xp`/`gold`. The
`student_quest_evidence` function in `supabase-quest-evidence.sql` is corrected.
On an authorized production release, apply **only that function definition**
after reviewing it; do not rerun the entire historical SQL file, which contains
an older submit RPC. The staging database has the corrected function; production
is unchanged. No table or data-format migration is needed for multiple photos.
