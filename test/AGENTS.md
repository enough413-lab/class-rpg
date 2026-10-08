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
