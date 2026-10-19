# 2026-10-19 map label review

User feedback: object and doorway labels still appeared above the objects although NPC names had moved below. Test-only changes; no database or school record changes.

## Fixed

1. Object/doorway labels above the scene props: unified below-object anchor across all seven rooms.
2. Object labels colliding with player/NPC names: common layout, with lower rows or free horizontal space. Low-priority scenery labels may hide when crowded; nearby/focused labels retain priority.
3. Labels clipping at camera edges: horizontal camera bounds apply to all grounded captions.
4. Avatar covering furniture when arriving: stand beside the record stand, wardrobe, shelves and notice objects.
5. Ambiguous action button: explicitly says talk to Momo, view records or move, according to the target.
6. Inconsistent emoji, sizing and tag treatment: shared name tag typography and styling.

## Further improvements, not implemented in this revision

7. Dedicated directional walk frames would improve the front-view layered avatar's sideways motion. Facing is already corrected; this is animation quality work.
8. Flowerbed and play records remain device/account-local. Cross-device continuation needs server storage and conflict handling.
9. First-time requests and replayable requests could have distinct markers to reduce repeated exclamation marks.
10. The completed quest ledger could use chapter/filter navigation as histories grow. No performance defect was established.

## Verification

Browser tests: campus-ground-labels, campus-controls-polish, campus-smooth-walk, campus-nameplates. Desktop 1366, mobile 390/320, native browser touch, 4x CPU where specified. Seven-room label geometry, long names, camera bounds, unchanged fixture XP/gold, controls and walking regressions. Synthetic browser tests are not physical student-device observation.

Implementation: campus-ground-labels.css, campus-nameplates.js, campus-objects.js, school-walk.js, student-campus.js. Existing local play saves and all school economy/reading/quest records remain intact. Production root requires fresh release approval.
