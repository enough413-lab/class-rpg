# Staging-first workflow
User instruction: all changes are developed and tested here first. Production release requires the user's explicit "공개해줘" instruction.
Production URL: https://enough413-lab.github.io/class-rpg/
Test URL: https://enough413-lab.github.io/class-rpg/test/
Test DB: gcgjpfidppaioambcatq. Production DB: dgqtxavsymvwjeyyyjle.
Never mutate production DB while developing. Never copy real student records into staging.
To publish a test revision, update only the test/ subtree on main with the reviewed staging tree. All other main paths must retain their exact blob SHAs. Do not merge staging into main: it contains test connection settings.
On an explicitly approved production release: port only reviewed feature changes, retain production connection settings, omit test-environment.js and test banners. Review DB migrations separately; never copy test rows. Record previous main SHA and verify deployment.
Test credentials are stored locally, never commit them.
