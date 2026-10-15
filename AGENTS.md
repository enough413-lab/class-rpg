# Staging-first workflow
User instruction: all changes are developed and tested here first. Production release requires the user's explicit "공개해줘" instruction.
Production URL: https://enough413-lab.github.io/class-rpg/
Test URL: https://enough413-lab.github.io/class-rpg/test/
Test DB: gcgjpfidppaioambcatq. Production DB: dgqtxavsymvwjeyyyjle.
Never mutate production DB while developing. Never copy real student records into staging.
To publish a test revision, update only the test/ subtree on main with the reviewed staging tree. All other main paths must retain their exact blob SHAs. Do not merge staging into main: it contains test connection settings.
On an explicitly approved production release: port only reviewed feature changes, retain production connection settings, omit test-environment.js and test banners. Review DB migrations separately; never copy test rows. Record previous main SHA and verify deployment.
Test credentials are stored locally, never commit them.
Latest user direction (2026-10-08): pause new level activities and chapters. Improve the graphics, environment, walking space and physical connections of already-open places first. Preserve constant 100 CSS px/s held movement, below-feet player names and existing earned content. Resume the level backlog only when the user changes this direction.
UI direction (2026-10-08): the user rejected website-style stacked cards for map/NPC interactions. Favor scenery-visible character dialogue with short response choices, illustrated maps with compact place markers, and a separate notebook for records. Preserve readable child-sized controls and keyboard/touch access; do not replace the scene with a long generic menu modal.

Latest user direction (2026-10-12): make the existing world playable, with the character directly acting on objects and NPCs rather than receiving educational explanations only. Hands-on in-world interactions within existing places are authorized. Prioritize coherent carry/use/place/eat/return and visible results; keep new level/chapter expansion secondary, school rewards server-owned, test-only deployment and existing earned content. Do not claim shared multiplayer presence or completed combat without implementing and verifying it.

Latest UI feedback (2026-10-12): NPCs should offer a short quest and concrete action, not a catalog of level activities. First conversations should present at most two primary responses; move optional records/crafting into an explicitly opened notebook. Avoid grids of unearned activities; reveal earned choices when usable. Preserve all earned records and server validation. This is the start of a broader game UX improvement, not a completed metaverse redesign.

2026-10-12 user explicitly requested resolving AUDIT_100.json in ascending order. Existing-world play and required improvements in that list are authorized in test. Record evidence before closing an item; preserve already completed concurrent improvements instead of rewriting them. Do not count synthetic tests as physical Chromebook or real student observation. Additional production release requires fresh explicit approval.

AUDIT_100 #12 deployment confirmed (2026-10-15): personal meal continuation uses the development-only token-gated cafeteria_play RPC with CAS/idempotent retry. Item12 resolved after actual two-context RPC, SQL isolation/economy tests and test-only Pages verification. Item13 reading-cover distinction is next; do not redo items1–12. Preserve all existing meal/jump/movement behavior and require fresh approval for production. Evidence: outputs/student-meal-sync-feature-deployment.json and student-meal-sync-deployment.json under 2026-09-30/a.
