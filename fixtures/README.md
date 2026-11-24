# Migration fixtures

Small apps on older Mapbox SDKs that the migration skills are run against end to end. Each fixture has a `fixture.json` with the skill to use, the prompt, the build command, the checks and the report expectations.

```bash
npm run eval:fixture android-maps-v10                 # Claude Code, one run
npm run eval:fixture android-maps-v10 -- --runs 3     # three runs
npm run eval:fixture android-maps-v10 -- --agent codex
npm run eval:fixture android-maps-v10 -- --no-hint    # don't name the skill in the prompt
npm run eval:fixture android-maps-v10 -- --agent none   # baseline: score the untouched fixture
```

Each run copies the fixture into a temp directory, installs the skill in `.claude/skills/` and `.agents/skills/`, runs the agent headless, then scores the result:

| Check       | How                                                                    |
| ----------- | ---------------------------------------------------------------------- |
| Build       | The fixture's build command exits 0                                    |
| Required    | Each pattern appears in the source                                     |
| Forbidden   | No pattern appears in the source (APIs removed in the target version)  |
| Discouraged | Patterns that compile but aren't the current API. Reported, not failed |
| Preserve    | Each pattern still appears (style URL, the app's analytics events)     |
| Report      | A judge model scores the migration report against `reportExpectations` |

Results go to `fixtures/results/` (not committed). Pass `--keep` to keep the migrated workspace for inspection.

## Requirements

- Android fixtures: JDK 17+, the Android SDK (`ANDROID_HOME`, or `~/Library/Android/sdk` on macOS), and `MAPBOX_DOWNLOADS_TOKEN` in `~/.gradle/gradle.properties` to download the Mapbox artifacts
- `ANTHROPIC_API_KEY` for the report judge
- The agent CLI: `claude`, or `codex` for `--agent codex`

These runs change code and take several minutes each, so they don't run in CI on every PR.
