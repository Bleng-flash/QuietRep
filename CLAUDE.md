# QuietRep — CLAUDE.md

## What is QuietRep

A gym workout logger for mobile, built with React Native and Expo (Expo Router, EAS). Users keep a library of exercises, build workout templates, organise them into weekly splits, log live workout sessions, and review their history and bodyweight trend.

**The frontend is complete.** It runs entirely on AsyncStorage, which stands in for a real backend: the storage layer is deliberately shaped like a REST API so the transition is mostly swapping internals. That backend transition is the next phase of work.

The app requires a **dev build** (`eas build --profile development`) — `react-native-keyboard-controller`, `reanimated`, `gesture-handler`, `svg` and `reorderable-list` all carry native code, so Expo Go will not run it.

---

## Project Map

**Layering, outermost last:** `types → storage → utils → context → components → screens`. Dependencies run inward only. `src/utils/` are leaves (they import `@/types` and `@/constants`, never each other); `src/storage/` may call utils; components and screens call storage and context, never AsyncStorage directly.

### Directories

| Directory | What lives there |
|---|---|
| `src/app/` | Expo Router route files only — thin wiring (route params, a storage call, navigation). See Routes below. |
| `src/components/shared/` | Cross-tab primitives: pickers, headers, empty states, segmented control, draggable list, tab bar, splash gate. |
| `src/components/plan/` | Plan tab: split cards, day circles, the workout editor and its exercise/set rows, workout picker. |
| `src/components/session/` | The live-workout flow: FAB start menu, session screen and header, exercise/set rows, elapsed timer, cross-tab resume banner, notification bridge, recent-performances sheet. |
| `src/components/history/byWorkout/` | The "By workout" lens: session list, list card, detail screen, read-only exercise card. |
| `src/components/history/byExercise/` | The "By exercise" lens: same four-part shape, per-exercise progression across sessions. |
| `src/components/home/` | Home tab: stat tiles, monthly stats card, recent workouts strip, bodyweight logging card. |
| `src/components/profile/` | The bodyweight trend flow: the hand-built SVG chart and its entry row. |
| `src/context/` | React providers — theme, weight unit, active session. Each owns its own hydration and exposes a hook. |
| `src/storage/` | AsyncStorage access for **domain data**, one module per entity, each function mirroring a future REST endpoint. |
| `src/utils/` | Pure helpers grouped by concern: `session` (lifecycle transforms), `datetime` (formatting), `sessionStats` (aggregations), `units` (weight conversion), `inputs` (text sanitisers), plus `split`, `workout`, `search`. |
| `src/notifications/` | The only module importing `expo-notifications`. Post/dismiss/permission/tap-listener for the ongoing-session notification. |
| `src/styles/` | `spacing`/`radius` (colour-free, static) and the `palettes` registry plus `makeLayout`/`makeTypography`/`makePicker` factories. |
| `src/constants/` | `DEFAULT_EXERCISES` (161 seeded exercises), `MUSCLE_GROUPS`, `DAY_KEYS`/labels, `MAX_REPS` (100) / `MAX_WEIGHT` (1500). |
| `src/types/` | One `index.ts`: canonical entities, editor/session view models, history and stats view models. |

### Routes

Three layouts: the root `<Stack>` (`app/_layout.tsx`, holds every provider), the tab navigator (`app/(tabs)/_layout.tsx`), and the Plan tab's own nested `<Stack>` (`app/(tabs)/plan/_layout.tsx`).

| Route | File | Navigator |
|---|---|---|
| `/` `/history` `/profile` `/plan` | `(tabs)/index`, `history`, `profile`, `plan/index` | tabs |
| `/plan/exercise` | `(tabs)/plan/exercise/index` | Plan stack (tab bar visible) |
| `/plan/workout/new` (`?splitId=&day=`) | `(tabs)/plan/workout/new` | Plan stack |
| `/plan/workout/[workoutId]` | `(tabs)/plan/workout/[workoutId]` | Plan stack |
| `/session` | `session.tsx` | **root** (live session) |
| `/session/[sessionId]` | `session/[sessionId].tsx` | **root** (past-session detail) |
| `/exercise/new` | `exercise/new.tsx` | **root** |
| `/exercise/[exerciseId]` | `exercise/[exerciseId].tsx` | **root** (exercise history) |
| `/bodyweight` | `bodyweight.tsx` | **root** (trend chart) |
| `/bodyweight/entries` | `bodyweight/entries.tsx` | **root** (manage/delete) |
| `/monthly-stats` | `monthly-stats.tsx` | **root** |

Two file + same-named-folder pairs (`session.tsx` + `session/`, `bodyweight.tsx` + `bodyweight/`) — supported by Expo Router. `exercise/` holds both a static `new.tsx` and a dynamic `[exerciseId].tsx`; static wins. There is no `/exercise` index — the exercise **library** is at `/plan/exercise`.

### AsyncStorage keys

| Key | Owner |
|---|---|
| `@quietrep/defaultExercises`, `@quietrep/userExercises` | `storage/exercises.ts` |
| `@quietrep/workouts` | `storage/workouts.ts` |
| `@quietrep/splits`, `@quietrep/activeSplit` | `storage/splits.ts` |
| `@quietrep/sessions`, `@quietrep/activeSession` | `storage/sessions.ts` |
| `@quietrep/bodyweight` | `storage/bodyweight.ts` |
| `@quietrep/themeMode` | `context/ThemeContext.tsx` |
| `@quietrep/weightUnit` | `context/UnitContext.tsx` |

The last two are the **documented exception** to "AsyncStorage lives in `src/storage/`" — see "Scalar preferences own their key".

---

## Current State

**Plan tab.** Three sections on one screen. *Splits* are edited inline (no editor screen): rename, set active, delete, and add/remove a day's workouts all write immediately. *Workouts* are created and edited in `WorkoutEditor` — name, add/remove/reorder exercises, configure sets as rep ranges, with an exercise picker offering live search and a create-new escape hatch. *Exercises* live in a searchable library at `/plan/exercise`; 161 defaults seed on first launch and user-created ones can be added and deleted.

**Live session.** The centre-tab FAB is the single entry point, opening a bottom sheet with three starts: today's workout (resolved from the active split), any workout, or an empty "Quick Workout". The session screen logs weight and reps per set, supports mid-session add/remove/reorder/swap of exercises, and can be **minimised** — it keeps running behind a resume banner docked above the tab bar on every tab. An info button on each exercise card opens a sheet showing the last 3 sessions that included it, without leaving the session. While backgrounded, a sticky notification names the session and its start time and taps back into it. The session survives a full app kill: every mutation debounce-persists, and the provider rehydrates on cold launch. Finish validates and writes to history; Discard is a footer danger button.

**History tab.** A pinned segmented control over two lenses. *By workout* lists past sessions newest-first, drilling into a read-only detail with a delete action. *By exercise* lists every exercise ever logged with its session count and last-performed date, drilling into every set performed across all sessions. Both detail screens sit on the root stack.

**Home tab.** The QuietRep wordmark, a current-month stats card (workouts, sets, total duration) with an "All months" link to a monthly-history drill-down, a self-contained bodyweight logging card, and the five most recent sessions.

**Profile tab.** Appearance (Dark/Light), Units (kg/lbs, locked while a session is live), a nav row to the bodyweight trend, and an About row showing the app version from `expo-constants`.

**Bodyweight.** Logging happens on Home (the "today" surface); reviewing happens on a chart-first trend screen reached from Profile, with All/1M/3M/1Y ranges and a hand-built `react-native-svg` line chart. A subscreen lists every entry for deletion.

**Cross-cutting.** The whole app is theme-reactive with a working Dark/Light toggle defaulting to dark. Weights are stored in the unit they were logged in and converted on read. A splash gate holds the launch screen until all three providers hydrate, so there is no wrong-theme flash. Nine first-run surfaces use a shared `EmptyState`. Brand assets (icon, adaptive icon, monochrome, notification glyph, splash, favicon) are generated from two SVG sources by `npm run brand`.

### Explicitly out of scope

Do not build these without being asked — each was considered and dropped:

- **Rest timer** — deferred indefinitely.
- **Data export / import** — deferred to the backend transition, deliberately (see Next Steps).
- **Animations and transitions** — descoped. The app ships with *zero* custom animation; every moving thing is a platform default. Reanimated remains available as a transitive dependency if this is ever revisited, so it would need no new package and no build.
- **Onboarding flow** — deferred.
- **PR detection and 1RM estimation** — dropped in favour of the honest By-exercise progression lens, which commits to no estimation formula. If ever revisited, the estimate must be a single swappable function with the formula (Epley/Brzycki/…) exposed as a user preference.
- **Today's workout card on Home** — deliberately absent; the FAB is the single start entry point and a second one added nothing.

Possible future improvements, not planned: per-exercise load/rep charts on top of the existing By-exercise data, and an `isBodyweight`/`loadType` flag on `Exercise` (see "Blank load persists as 0").

---

## Next Steps

1. **Preview build for real-world testing** — `eas build --profile preview --platform android`. Unlike `development`, this embeds the JS bundle, so it runs with no Metro server and can be handed to other Android testers via the EAS internal-distribution link. (`production` is the wrong profile: it emits an `.aab` for the Play Store, which cannot be sideloaded.) This is the full-frontend dogfooding pass.
2. **Fix what dogfooding surfaces** — bugs and UI rough edges found in real gym use.
3. **README polish** — `README.md` is already substantially written user-facing prose; what remains is screenshots (there is a placeholder comment) and a final pass.
4. **Backend transition.** Carries the deferred items with it:
   - **Data export *and* import/restore, built together.** Export alone produces a backup with no consumer. Deferring it means the format is derived from the API schema rather than guessed at now, and the "read every key and assemble structured data" logic is exactly the read side of the migration. Accepted risk meanwhile: dev-device data has no in-app backup.
   - **Auth tokens in `expo-secure-store`**, never AsyncStorage — the latter is unencrypted (plain SQLite on Android, a plaintext sandbox file on iOS). Fine for workout data, not for credentials.

Build notes: WSL2 here has no JDK and `ANDROID_HOME` points at the Windows SDK, so local Gradle builds are impractical — use EAS.

---

## Key Design Decisions

### Data model & storage

**Types are designed for the backend transition.** Every entity keeps `id: string` as its primary key even though AsyncStorage needs none, because a real database will have one and removing it now would be fully reversed later. Relationships always use ID references (`exerciseId`, workout IDs in `Split.days`), never embedded objects or name lookups. Exercise name uniqueness is enforced in `addExercise` as a constraint mirroring a future `UNIQUE`, alongside the id rather than replacing it.

**Frontend-only view models never touch the canonical types.** `Editable*`, `Resolved*`, `ExerciseHistorySummary`, `ExercisePerformance` and `MonthlyStatsEntry` exist only in the frontend and have no DB counterpart. Render-only fields (notably `localKey`) go on these siblings — adding one to `PlannedSet` or `LoggedSet` would blur the "types mirror the backend shape" contract.

**Additive intersections only — never `Omit` to subtract a field.** Both chains build by adding: `PlannedSet → EditablePlannedSet` (adds `localKey`) `→ EditableWorkoutExercise` (replaces `sets`) `→ ResolvedEditableWorkoutExercise` (adds the `exercise` join); and `LoggedSet → EditableLoggedSet → EditableSessionExercise → ResolvedEditableSessionExercise`.

**Pre-join normalized data in the parent — the `Resolved*` pattern.** When a child needs fields from two entities, do not pass two props and `.find()` in the render loop (O(n²)). Build an id→entity `Map` with `useMemo`, derive a `Resolved*[]` with a second `useMemo`, pass one prop. The `| undefined` on the joined entity is intentional and covers a dangling FK (an exercise deleted while still referenced); children fall back to "Unknown exercise". `WorkoutEditor → WorkoutExerciseCard` is the canonical example.

**Stable identity keys for stateful list rows — the `localKey` pattern.** A row component holding local state seeded from props (`PlannedSetRow`'s text buffers) breaks when keyed by array index: React reuses instances by *position*, so removing item 0 shifts the rest up and each reused instance keeps state describing the wrong item. The data stays correct while the display lies. Fix: a client-generated `localKey` via `uuid()`, keyed on instead of the index, stripped before anything reaches storage.

**Multiple workouts per day.** `Split.days` is `Record<DayKey, string[]>`. An empty array is a rest day. Zero-to-many per day.

**Sets and rep ranges belong to `WorkoutExercise`, not `Exercise`.** An `Exercise` is a name and a muscle group. `minReps`/`maxReps` are the *plan template*, so the same exercise can appear in two workouts with different schemes. **Load is a runtime value** and exists only on the session — never in the plan schema. Hence `PlannedSet` (`minReps`, `maxReps`) vs `LoggedSet` (`weight`, `reps`); the two must never be conflated. Seeding a session turns each `PlannedSet` into a blank `EditableLoggedSet` carrying the range as optional `targetMinReps`/`targetMaxReps` display hints, which are stripped before persisting.

**Standalone vs embedded workouts.** `Workout.isStandalone` distinguishes them. Assigning a standalone workout to a split day **deep-copies** it with a fresh id and `isStandalone: false`; the original is untouched and later edits do not propagate — splits are fixed snapshots. Creating a workout directly for a day round-trips through `plan/workout/new?splitId=&day=`, and on save calls `addWorkoutToSplit(splitId, day, {name, exercises})`. That helper takes a `splitId` rather than a `Split` object on purpose: it re-reads the freshest stored split before appending, avoiding a stale-snapshot lost update.

**Cascade delete on split deletion.** Embedded workouts are referenced only by their split, so deleting the split alone orphans them. Correct order: `deleteWorkoutsByIds(embeddedIds)` then `deleteSplit`. **This lives in `SplitCard.handleDeleteSplit`, not in `deleteSplit`** — the component owns its own mutations, so the cascade sits with the action that triggers it.

**Exercise storage is split across two keys.** `@quietrep/defaultExercises` and `@quietrep/userExercises`. This makes seeding trivial — compare names against the defaults key with no `isDefault` filtering at query time. `seedDefaultExercises` diffs against **both** keys, so a user-created exercise sharing a name with a new default is not duplicated. `deleteExercise` only touches the user key; defaults are not deletable. `updateExercise` is intentionally absent (see the comment in `exercises.ts`).

**Session storage is two keys.** `@quietrep/activeSession` holds the single in-progress buffer; `@quietrep/sessions` holds completed sessions newest-first. `finishSession` stamps `finishedAt`, prepends to history, and clears the active key. **A consequence worth relying on: the live session can never appear in its own history** — "past sessions" needs no filtering because the two live under different keys.

**A live session survives app close and reopen.** Every mutation debounce-persists (500 ms) the active buffer; on cold launch the provider hydrates it and re-attaches fresh `localKey`s. `startSession` deliberately awaits its first persist, so a session started and immediately killed is still recoverable. Accepted: the last <500 ms of edits before a hard kill can be lost.

**Derived reads live behind storage endpoint mirrors.** Aggregations are exposed as storage functions named for the endpoint they will become — `getExerciseHistorySummaries()`, `getExercisePerformances(exerciseId, limit?)`, `getCurrentMonthSummary()`, `getMonthlyStatsHistory()`. Each reads raw data and delegates to a **pure util** (`summarizeExerciseHistory`, `collectExercisePerformances`, `summarizeMonth`, `summarizeAllMonths`), today's stand-ins for `GROUP BY`/`WHERE`. **Components call only the storage wrappers, never the utils**, so at backend time only the wrapper internals change. Naming encodes the layering: `get*` is a storage read, `summarize*`/`collect*` are pure.

The same principle draws the line for single-entity lookups: a component may join collections it legitimately consumes wholesale, but must **not scan a collection to emulate a narrower endpoint** — a `.find`-by-id over `getAllExercises()` is a `GET /exercises/:id` in disguise and belongs in storage (`getExerciseById`).

Query-shaping also belongs at the seam, not the component: `getExercisePerformances` takes the optional `limit` and slices there, mirroring a future `?limit=`. The pure util has no `limit` parameter.

**`src/utils/` is organised by concern, not one file per feature.** `session.ts` holds lifecycle transforms between canonical and editable shapes; `datetime.ts` holds domain-agnostic ISO formatting used by session, history and home; `sessionStats.ts` holds the derived-read aggregations; `units.ts` holds weight conversion; `inputs.ts` holds text-input sanitisers; `split.ts`, `workout.ts`, `search.ts` are per-domain helpers. **Dependencies stay acyclic — no util imports another util.**

**Scalar preferences own their AsyncStorage key directly — no settings object, no storage file.** Theme mode and weight unit are held by their provider, which reads and writes its key inline as a **bare string** (no `JSON.stringify`). `src/storage/` exists to mirror future REST endpoints for *domain data*; there is no preferences endpoint, so a storage module would be a seam with nothing behind it — a file, a type, serialisation and a defaults-merge to express `getItem(KEY)`. It would also *lose* safety, since `JSON.parse` returns `any` whereas an inline read narrows the union at the point of the read (`if (stored === 'kg' || stored === 'lbs')`).

This defers the backend question rather than settling it: **the provider is the abstraction boundary**, so `getItem` → `GET /me/preferences` changes provider internals only and no consumer is touched. Expect the two to diverge — theme is plausibly device-local forever (dark on a phone, light on a tablet), units plausibly account-level. Syncing units is convenience, not correctness: every session carries its own unit, so history renders correctly on a fresh device regardless.

The provider template is fixed — own key constant + `DEFAULT_*`, hydrate-once `useEffect`, union-validate before `setState`, `useCallback`'d setter that sets state then fire-and-forget persists, `useMemo`'d value, throw-outside-provider hook. Copy it for the next scalar preference. A preference that grows into a *collection* (bodyweight) is domain data and does get a storage file.

**Weight units — stored as typed, converted on read.** Weights persist in **whichever unit they were logged in**, never normalised. Each `WorkoutSession` carries its own `unit`, stamped once at `startSession`, so stored data is self-describing. Storing canonical kg was explicitly rejected: it makes every logged number a lossy round-trip of what the user typed.

**One name per concept.** Binding, because the first attempt at this feature was abandoned with four names for one idea:

| Name | Meaning | Where |
| --- | --- | --- |
| `WeightUnit` | the type, singular (matches `MuscleGroup`, `DayKey`, `ThemeMode`) | `src/types/index.ts` |
| `unit` | the field on a stored entity, and on the setting | `WorkoutSession.unit`, `ExercisePerformance.unit`, `useUnit().unit` |
| `loggedUnit` | prop: "the unit these numbers were logged in" | all three weight-rendering cards |
| `displayUnit` | local alias for the current setting inside a converting card | the two read-only cards only |

The type carries the dimension, so the field stays `unit`. A non-mass unit would get `DistanceUnit` + `distanceUnit`, making this a mechanical rename.

**The setting is read exactly once per session, at creation.** `useUnit().unit` answers "what unit should new logging use?"; `session.unit` answers "what unit was this logged in?". `startSession` is the only place the first is right, because no session exists yet. Everywhere after reads the session — `finishActiveSession()` stays param-less and passes `activeSession.unit`. This is not merely tidy: on cold launch the providers hydrate in independent effects with no ordering guarantee, so there is a window where the setting still reads its `'kg'` default while a restored lbs session is live. Reading the setting at finish would stamp `kg` onto lbs data; reading the session cannot.

**The live path never converts.** The Profile toggle is disabled while a session is active, guaranteeing one unit per session, so `SessionExerciseCard` takes `loggedUnit` as a prop, makes no `useUnit()` call, and stores exactly what was typed. Only the two **read-only** history cards convert, and they do it **inside the card** — taking `loggedUnit` from the record and calling `useUnit()` themselves — mirroring the theming rule that a component rendering a settings-driven value subscribes to that setting itself. `convertWeight` short-circuits when units match, so a user who never switches never touches conversion arithmetic. Validation stays unit-agnostic: one `MAX_WEIGHT` covers both.

If the unit lock is ever relaxed, the in-session history sheet becomes wrong — it currently relies on display unit ≡ session unit — and must take `activeSession.unit` explicitly.

**Bodyweight is "now"-only logging.** `recordedAt` is stamped at add time; there is no UI to back-date or edit an entry. A mistake is fixed by deleting and re-logging. Two consequences depend on this holding:
- **Storage is newest-first with no sort.** `addBodyweightEntry` prepends and `getBodyweightEntries` returns raw, because insertion order *is* reverse-chronological order. **If back-dating is ever added this breaks** — the write must become insertion-sorted or the read must sort.
- **Accidental saves are guarded by a confirm, since there is no undo.** Logging uses a disabled-until-valid button; delete confirms via `Alert` and names the entry.

Because logging is a present-moment *action* and the trend is *review*, they are split by surface — the same separation as the FAB starting a workout while History reviews it.

**Blank load persists as 0 — "lazy" bodyweight logging is allowed (accepted tradeoff).** `isLoggedSetValid` accepts `weight === 0`; only `reps` must be ≥ 1. The `0` is the model's initial value, not the placeholder — an untouched field never fires `onChange`. So `weight 0` is **ambiguous**: a genuine bodyweight exercise or a forgotten entry, and nothing distinguishes them because `Exercise` carries no such flag. Accepted deliberately — fast logging outweighs an ambiguity nothing currently consumes quantitatively. **Do not enforce `weight > 0` before an `isBodyweight`/`loadType` flag exists**; it would make bodyweight exercises unloggable.

### Navigation & screens

**Thin screens, fat components.** Screen files are wiring only — route params, storage calls, navigation. UI and logic live in components. *Exception:* a screen that does **no** wiring (no route params) **and** has a single consumer may hold its body directly, since the component would be pure indirection. `monthly-stats.tsx` is the canonical case. Its sibling detail screens keep the split because they wire a route param. If a second consumer appears, extract.

**Shared screens live on the root stack.** A screen belongs at the **lowest navigator that reaches all its entry points**: reached from one tab → that tab's stack (tab bar stays visible); reached from multiple tabs or from the root-level session → the **root** stack.

Why it matters: pushing a *tabs-nested* route from the root `/session` screen is a **cross-navigator push** — React Navigation dives into the tabs navigator and orphans the pushed screen on the Plan stack, so `router.back()` misfires and the screen is stuck there permanently, surviving even finishing the session. `exercise/new` is the canonical root screen: reached from the Plan library, from `WorkoutEditor`'s picker, **and** from the session's picker.

Two deliberate exceptions, both for **twin symmetry** — do not "correct" them. `exercise/[exerciseId]` is reached only from History but stays at root to match `session/[sessionId]`, which Home also opens and so is root-pinned; a tab-local twin would keep the tab bar while its sibling hid it. `monthly-stats` is the same case on Home, and additionally would force `(tabs)/index.tsx` to become a `(tabs)/home/` stack, renaming the route `TabBar` references by name.

Tradeoff: a root screen sits **above** the tab bar and cannot show it, so exercise creation is a focused full-screen while `WorkoutEditor` (tab-local) keeps the bar.

**Consequence — a root screen must paint its own background.** The Plan stack's `_layout` sets `contentStyle`, so screens under it inherit it; root-level screens must apply `layout.screen` themselves. (This surfaced as a white-flash bug the moment `exercise/new` was promoted.) The root `<Stack>` also sets a reactive `contentStyle` so the base repaints on a theme toggle, but the per-screen `layout.screen` still stands.

**Always use `useFocusEffect` for data loading in navigation screens** — not `useEffect`. Tab screens stay mounted when switching tabs, and stack parents stay mounted while a child is pushed, so `useEffect` with empty deps silently serves stale data on return. With AsyncStorage the reload cost is negligible; when the API layer arrives, add a stale-time/cache-first flag at the data layer rather than reverting screens to `useEffect`.

Two exceptions, each documented in-file: the **root layout** (layouts have no focus lifecycle, so startup work belongs in `useEffect`) and **non-screen components** reacting to prop changes. Whenever `useEffect` is used instead, add a brief comment explaining why unless it is self-evident from the deps.

**Safe-area insets are applied at component level.** Any component rendering its own top bar calls `useSafeAreaInsets`; do not rely on the navigator when `headerShown: false`. **Two distinct top gaps:** *chrome* (back-chevron bars, `SessionHeader`, `EditorHeader`, and `TabBar`'s bottom) uses `insets.top + spacing.s`; a *tab index screen*, where the first thing under the inset is page content rather than chrome, uses `insets.top + SCREEN_TOP_GAP` — content flush against the status bar reads cramped in a way a compact bar does not. All four tab screens share the one constant so they stay aligned and the gap is tuned in one place. Both forms stay **inline, never in `StyleSheet.create`**, since insets are runtime values.

**A full-screen `Modal` is a chrome-bearing surface and applies its own insets — the same `useSafeAreaInsets()` pattern as a screen.** A RN `<Modal>` is a **separate native window** (Android: a `Dialog`; iOS: a separately-presented view controller) drawn edge-to-edge, so the navigator's insets never reach it. `PickerModal` shipped without them and its header landed under the status bar on Android — the bug that established this rule; it now owns the insets for both `WorkoutPicker` and `ExercisePicker`.

**Corollary — do not set `presentationStyle` to `pageSheet`/`formSheet`.** The prop is **iOS-only**: its type lives in `ModalPropsIOS`, and Android's `ReactModalHostManager` declares `setPresentationStyle(...): Unit = Unit`, an explicitly empty body, then renders every Modal full-screen regardless. Unset, RN defaults to `fullScreen`, and `transparent` short-circuits to `overFullScreen` before the prop is read — so every Modal in this app has a **screen-sized** window on both platforms, which is exactly what makes `useSafeAreaInsets()` correct inside one. A sheet presentation would give iOS a window *smaller* than the screen, at which point the hook (measured by the root provider in the host window) reports the wrong numbers and the fix needs a native `SafeAreaView` instead. One prop, one pattern everywhere; the value of the prohibition is that it keeps the mechanism unconditional.

**Own behaviour at the right level — don't over-prop or over-drill.** If a prop receives the same value at every call site it is not a prop: move it inside the component (`onCreateExercise` and `onCreateNew` were removed once every caller passed `router.push('/exercise/new')`; `RecentWorkouts` and `LogBodyweightCard` own their single-destination navigation and writes). When a prop *is* genuinely variable, pass it from the **closest** ancestor with enough context — threading through layers that don't use it means the handler belongs lower down.

**Inline split editing — immediate writes, no editor screen.** Splits are edited in place on the Plan screen (fewer taps). With no Cancel/Save screen, every action writes immediately: creating (only after a name is confirmed, so no empty splits persist), renaming, setting active, deleting, adding/removing a day's workouts. A `SplitEditor` with a deferred-write buffer was designed and deliberately rejected; none of that machinery exists.

**Inline mutations refresh via a single `onChanged` callback.** `SplitCard` and `DayWorkoutList` own their own writes and take one callback — the Plan screen's `load`, lifted to a `useCallback` so it serves as both the `useFocusEffect` loader and the `onChanged` prop. Chosen over a fistful of bespoke handler props because day-level handlers need day context that lives in `DayWorkoutList`; threading them from the screen would be the exact over-prop smell above. Navigable editor screens differ — there the screen does the write on save.

### State & theming

**`ActiveSessionContext` — React Context as a subscription layer over AsyncStorage.** AsyncStorage has no subscriptions: when one component writes, nothing else is notified. The context holds the live session in React state so updating it re-renders every consumer (session screen, resume banner, notification bridge) automatically. **No component reads `@quietrep/activeSession` directly.**

`SessionBuffer` (the in-memory working shape) is exported from the context file, not `types/index.ts` — it is context state, a UI concern, not a data-model type. `updateActiveSession` uses a `latestSessionRef` kept in sync via `useEffect` so the debounced closure always writes the freshest session; the debounce timer is a `useRef`, not state, because changing a timer id must not re-render.

The four-action surface — `startSession` / `updateActiveSession` / `finishActiveSession` / `discardActiveSession` — is the stable contract. At backend time only the provider internals change.

**Context value memoisation — memoise, but be honest about what it buys.** React compares the `value` prop by **reference identity**, so an inline object re-renders every consumer with no field-level granularity, **bypassing `React.memo` entirely**. So wrap every context value in `useMemo` and `useCallback` its functions — and never silently omit a recreated function from the deps, which would leave the memo holding a stale closure.

The principle: **a memo pays off only if the provider can re-render while its data is unchanged.** `ThemeProvider` and `UnitProvider` each hold `hasHydrated` alongside their preference, so both genuinely can — `ThemeProvider`'s memo avoids rebuilding three `StyleSheet`s on the hydration render. `ActiveSessionContext` deliberately has **no** value memo: `startSession` closes over `unit` and the other three close over `activeSession`, so every path that re-renders it also invalidates something in the value; a memo would cost four `useCallback`s to skip nothing. `hasHydrated` does not change that — it flips once at startup.

**Theming — a colour-consumption refactor, not a colour-values task.** One global theme; the whole app switches at once, never per-route. The shape: a root `ThemeProvider` holds `mode`, persists it, and exposes `{ mode, setMode, colors, layout, typography, picker }`; `palettes` in `colors.ts` is a registry whose entries share an identical key set; colour-referencing style objects are **factories** (`makeLayout`/`makeTypography`/`makePicker`, and per-component `makeStyles(colors)`). `colors = palettes[mode]` is a stable module-level reference per mode, so `useMemo(() => makeX(colors), [colors])` rebuilds only on an actual toggle — indexing, not cloning, is what preserves identity.

Rules to keep following:
- **Read `colors`/`layout`/`typography`/`picker` from `useTheme()`, never from `@/styles`** (the barrel no longer exports them). Only the colour-free `spacing`/`radius` come from `@/styles`. No inline hex.
- **Every component that renders colour calls `useTheme()` itself** — memoised list rows and module-level sub-components included. `React.memo` blocks re-renders from unchanged *props*, but a **context** change re-renders subscribers regardless, so calling the hook is what makes a memoised leaf repaint. Threading styles down as props would defeat primitive-prop memoisation.
- A colour-bearing local `StyleSheet` becomes a module-level `makeStyles(colors: Palette)` consumed via `useMemo`. Colour-free StyleSheets stay static.
- Add a themed token to a `useCallback`/`useMemo` dep array **only if the body directly uses it**. A callback that merely renders a self-theming child needs none.

**Single green identity — exactly two palettes, no third.** `palettes` holds `dark` and `light` only. An unused third variant previously caused a real bug: `app.json`'s splash `backgroundColor` was set from a palette the app never rendered. A palette that cannot be selected offers nothing and invites exactly that. If another theme is ever wanted, add it **and** wire it into `ThemeMode` and the Appearance toggle in the same change.

### Input & validation

**Two layers, applied identically on both surfaces.**

*Layer 1 — sanitise at input.* Every keystroke routes through a shared sanitiser in `src/utils/inputs.ts` (`sanitizeReps`: digits only; `sanitizeWeight`: digits plus at most one decimal point, preserving a trailing `"53."` so mid-typing works), plus a `maxLength`. This makes negatives, decimals in a reps field, and pasted letters impossible **by construction** rather than merely blocked by the keyboard, which paste and external keyboards bypass. **This layer never clamps magnitude** — a too-large number is a real value the user typed and may want to correct, so silently rewriting it would be wrong.

*Layer 2 — validate and highlight at save/finish.* `isPlannedSetValid` (both reps whole numbers in `[1, MAX_REPS]` and `minReps <= maxReps`; **equal is valid**, the fixed-rep target) and `isLoggedSetValid` (`reps` in `[1, MAX_REPS]`, `weight` in `[0, MAX_WEIGHT]`) block the write. On a blocked save a `showErrors` flag flips, and a `useMemo` derives `invalidSetKeys` (a `Set` of offending `localKey`s) from live state, passed down so each row tints red. Because the set recomputes from live state, **the red clears live** as rows are fixed. The predicate is the single source of truth for both the block and the highlight.

`handleFinish` also blocks a 0-exercise session and trims the session name. A newly added set starts **blank**, not copied from the previous one — loads change set to set, and a blank set stays invalid so it cannot be finished unperformed. Finish is an instant single tap (a positive action with no un-finish); removing a *set* needs no confirm (low-stakes, frequent, last-set already guarded); removing an *exercise* confirms **only when it has logged data**.

**Every single-line `TextInput` carries vertical slack — `paddingVertical: 0`, a `minHeight` floor, and `textAlignVertical: 'center'`.** A field must never size itself from padding alone. RN measures a `TextInput`'s box with `Typeface.DEFAULT` (`TextLayoutManager.kt:619-625`) while the native `EditText` draws with the **theme's** typeface (`ReactEditText.kt:597`); on a device where those differ — a vendor font picker (Xiaomi/Samsung), a CJK UI font, the Bold-text accessibility adjustment — the drawn line is taller than the measured box, the widget scrolls it up to keep the caret visible, and the glyph tops are **clipped**. Every input shipped with zero slack, so a tester's Redmi clipped all 12 of them while the developer's phone and the emulator showed nothing. Full narrative in [docs/android-textinput-font-metrics.md](docs/android-textinput-font-metrics.md).

- Two tiers in `spacing.ts`, both multiplied by a clamped `PixelRatio.getFontScale()` so the slack stays proportional as text scales: **`INPUT_MIN_HEIGHT`** (40) for standard bordered fields, **`COMPACT_INPUT_MIN_HEIGHT`** (32) for the dense set rows and the session title. A new input picks one. That scale is a launch-time snapshot and the clamp is load-bearing — `getFontScale()` falls back to the pixel *density* if the native value is missing, which would make a 40dp field 110dp.
- Pinning the floor at the height the field already had means **converting padding into interior room, not adding height** — the layout is unchanged and the line simply gains somewhere to grow.
- **Padding on a wrapper is not slack for the input inside it.** The `EditText`'s own box is what clips, so the floor goes on the field; the search bars' wrappers carry `paddingVertical: 0` for exactly this reason.
- **Never `includeFontPadding: false`** to "fix" input alignment — the most-copied online remedy is backwards here, since it shrinks the measured box and makes clipping more likely.
- `fontFamily` would also close the gap (both halves would resolve one family through the same `ReactFontManager` entry) and is deliberately **not** used: it can stop honouring the user's chosen system font and silently disables the Bold-text adjustment inside fields.
- iOS cannot hit this — measurement and rendering share one `UIFont` and one layout path there.

### Keyboard, gesture & scroll

**Three axes are independent, and a screen can satisfy two while failing the third:** `keyboardShouldPersistTaps` governs *tap delivery* (one tap vs two), `KeyboardAvoidingView` governs *scroll reach* (can you get to content under the IME), and the responder rules govern *dismissal* (can you close the keyboard). Gesture arbitration and flex sizing are two further, separate reasons a scrollable may not scroll.

**Tap delivery — the `keyboardShouldPersistTaps` convention (binding).** With the prop unset/`"never"`, a focused `TextInput`, and an open keyboard, a ScrollView claims any tap on a non-TextInput target during the responder **capture** phase and blurs on release — that *is* the swallowed first tap. `"handled"` passes taps on interactive children through while empty space still dismisses (hence `"handled"`, never `"always"`).

Three mechanics make this non-obvious:
- **The responder walk follows the React tree, not the native view tree, so it crosses `Modal` boundaries.** A Modal is a separate native window but its content is still a React descendant of its host, so a *host screen's* scrollable governs taps inside the modal. The swallower is often not in the file you are reading — audit the React ancestor chain.
- **Capture runs outer→inner, so every scrollable on the path must be `"handled"`; one `"never"` anywhere swallows.** A `"handled"` outer container cannot protect content under an inner list that lacks it. This includes `scrollEnabled={false}` lists — FlatList/SectionList are ScrollViews underneath and disabling scroll does not disable tap interception.
- **It needs both a `"never"` scrollable ancestor and a focused input at tap time.** Kill either and it cannot occur — `exercise/new`'s dropdown is immune by design because its trigger calls `Keyboard.dismiss()` before the options open.

Every `ScrollView`/`FlatList`/`SectionList` whose subtree can hold tappable content while a keyboard is open sets `"handled"`. **Checklist when adding a `TextInput`, an input-bearing Modal, or a new list:** walk the React ancestor chain from every element tappable with the keyboard up; every scrollable on the way needs the prop.

**Dismissal — the principle.** Under `"handled"` a button tap fires but does **not** blur the input. Keep the keyboard when the likely next action is more typing (add-set in a live session, the high-frequency flow this protects); call `Keyboard.dismiss()` only when a button **completes** its typing flow (`LogBodyweightCard.handleLog` is the one case); flow-ending buttons that navigate need nothing, since unmounting the focused input dismisses implicitly.

**Dismissal — the tap-away rule (binding).** Tap-to-dismiss is delivered by the ScrollView's `onResponderRelease`, so it fires only when the ScrollView **won** the touch — and exactly one view wins any touch (the responder is exclusive and does not bubble). Any descendant that claims the touch is a **dismissal dead zone**, and a `Pressable` claims the touch start **even with no `onPress`** (RN's `Pressability` returns `true` unconditionally). So an interaction-less wrapper — a drag handle, a card shell — silently removes its area from tap-to-dismiss while looking inert in source. **Any such wrapper on a keyboard surface must carry `onPress={Keyboard.dismiss}` itself.** Nested inputs and buttons are deeper in the tree and win outright, so the wrapper's handler never fires for them. Deliberately not done: `keyboardDismissMode="on-drag"` (scrolling to the next set row would reflow the avoider constantly) and header dismissal (a thin strip flanked by actions; the body covers it).

**The same claim breaks SCROLLING, which is worse than a dead zone.** A `Pressable` ancestor claims the touch **start**, so a ScrollView beneath one scrolls only if it wins the responder back on move — unreliable, and while a JS responder is held the native scroll view is blocked outright. It presents as **intermittent** scrolling that works only after the screen has been idle, reading like a performance problem rather than a structural one.

**The rule: never wrap a scrollable in a `Pressable`, and never use the "stop taps bubbling to the backdrop" idiom.** That idiom is only needed because the backdrop is an *ancestor*. Render the backdrop as an absolutely-positioned **sibling** underneath the sheet instead (container `flex: 1, justifyContent: 'flex-end'`; backdrop `StyleSheet.absoluteFillObject`; sheet a plain `View` after it). Taps on the sheet then never reach the backdrop **because responder negotiation walks ancestors, not siblings** — a structural guarantee replacing a swallow-the-touch workaround, with no Pressable left to contest the scroll. `NamePromptModal` deliberately keeps the nested form: it holds no scrollable, and swallowing taps is the intended dialog behaviour.

**Scroll reach — standardized on `react-native-keyboard-controller`.** RN's own `KeyboardAvoidingView` does not make hidden content visible; with `behavior="padding"` it only shrinks its frame so inner content becomes *reachable by scrolling*. Worse, **on Android it did nothing at all here**, because every usage was gated `Platform.OS === 'ios' ? 'padding' : undefined` on the assumption the OS would `adjustResize`. That assumption never held: this app has had `edgeToEdgeEnabled: true` from the first commit, where the app draws full-screen and must consume window insets itself, so the IME **overlays** content. Nothing consumed the inset, so the scroll region never shrank — a latent bug from day one, unnoticed until screens put critical buttons below the fold. Full narrative in [docs/android-edge-to-edge-keyboard.md](docs/android-edge-to-edge-keyboard.md).

The convention: a single `<KeyboardProvider>` wraps the tree in `_layout.tsx`; every avoiding surface imports `KeyboardAvoidingView` from **`react-native-keyboard-controller`** (not `react-native`) with **`behavior="padding"` on both platforms** — the `Platform` gate is gone, it was the literal reason Android did nothing.
- **Apply selectively.** Wrap only where the keyboard can cover an input or the button tapped right after typing. **Top-pinned search bars stay unwrapped** — wrapping adds a reactive relayout for no benefit.
- **That exemption covers the *input*, not the surface.** If a **scrollable list sits below** the top-pinned search bar, the surface still needs a KAV — for the list, not the field. The list's frame runs to the bottom of the window, under the IME, and a scroll can only travel `contentHeight - frameHeight`, so its tail and any footer can never be pulled above the keyboard: unreachable exactly while the user is typing to filter. `PickerModal` shipped this way and is the case that established the rule. The tell is that a *fixed* `paddingBottom` looks like it should cover it and cannot — the padding has to come from the keyboard's real height.
- **RN `<Modal>` caveat.** The library's context does **not** cross a native Modal boundary, so a KAV inside one needs its **own nested `<KeyboardProvider>`** (`NamePromptModal` does this). A *centered* dialog additionally needs a `keyboardVerticalOffset` so it clears the keyboard with a visible gap.

**Gesture arbitration — the reorderable pan must defer to scroll.** `DraggableCardList` renders `NestedReorderableList`, which layers an RNGH pan gesture *over* a FlatList whose own scroll is disabled; the actual scroller is the outer `ScrollViewContainer`. A default `Gesture.Pan()` arms on ~10dp of movement in any direction and claims the touch — then does nothing, because a card only moves once its long-press flips it to `DRAGGED`. So a plain swipe was captured by an **armed-but-inert** pan: no drag and no scroll.

Fix, in one place: `panGesture={Gesture.Pan().activateAfterLongPress(220)}`. A swipe now moves long before 220 ms of stillness, so the pan never arms and the outer scroller wins uncontested from anywhere on a card. All three consumers inherit it. **The binding rule: pan activation must be >= the drag `Pressable`'s `delayLongPress`.** All drag surfaces use the exported `DRAG_LONG_PRESS_DELAY_MS` (200), and the 20 ms margin means the drag arms just before the pan. Any future drag surface must keep its `delayLongPress` <= 220.

**Takeaway:** when a gesture library "swallows" scroll, the culprit is usually an **eager pan with no activation threshold** competing with an outer scroll; the RNGH remedies are `activateAfterLongPress` / `activeOffset` / `hitSlop`.

**Flex sizing — a `ScrollView` bounded by an ancestor needs `flexShrink: 1`.** **React Native defaults `flexShrink` to 0, where web CSS defaults to 1.** With the `maxHeight` on the *parent* and no flex style on the ScrollView, the ScrollView lays out at its full **content** height; content size equals its frame, so the scroll range is zero and it correctly refuses to scroll, while the parent clips the overflow. Nothing about the symptom points at flexbox. The in-repo counter-example isolates it: the muscle-group dropdown caps the **ScrollView itself**, so it scrolls fine.

Use **`flexShrink: 1`, never `flex: 1`** — the latter also sets `flexGrow: 1` and `flexBasis: 0%`, pinning a sheet at its full height even when showing one card. Sibling chrome keeps the default `flexShrink: 0` so only the scroll region gives.

**Debugging lessons worth keeping.**
- Runtime observation on a device outranks static analysis — a clean-looking file proves nothing when the mechanism lives in an ancestor or in a library.
- When a mechanism is in doubt, read the actual source in `node_modules` rather than trusting docs.
- Retest after a **full reload** before distrusting a mechanism-backed fix (one "failed" fix was a stale bundle).
- **When a fix changes a symptom instead of clearing it, that is evidence of a second cause, not a wrong diagnosis** — do not revert the first fix while hunting the second. The sheet-scroll bug had exactly two independent causes and needed both fixes.
- A *time-dependent* touch failure ("works if I wait, not if I keep tapping") is a contested-responder signature, never a layout one. Layout bugs like a zero scroll range fail identically every time.

### Platform integration

**Notifications are contained in `src/notifications/sessionNotification.ts`** — the only module importing `expo-notifications`, mirroring how `src/storage/` contains AsyncStorage for domain data. It is a leaf: it imports the library, `Platform`, and one formatter, nothing from `@/context` or `@/components`, which is why `postActiveSessionNotification` takes a small `{ name, startedAt }` object rather than a `SessionBuffer`. A null-rendering `SessionNotificationBridge` mounted inside `ActiveSessionProvider` drives it from `AppState` — mounting it there rather than inside the provider's own JSX avoids a circular import. It holds its own `latestSessionRef` and `currentPathnameRef`, because the once-registered listeners would otherwise close over stale values; `pathname` is deliberately *not* an effect dep, since that would re-register the subscription on every navigation and a tap landing in the gap would be lost.

**Every export swallows its errors**, logging via a helper guarded by `if (__DEV__)`. Swallowing is right because notifications are ancillary and every caller is fire-and-forget, so a rejection has nowhere to go — but a *fully silent* catch cost real debugging time, hence the dev logging. `__DEV__` is inlined as `false` in release bundles and the branch is folded away, so nothing ships. (Storage needs no such catches: its callers await inside effects that own the outcome.)

The rules, all verified against the library's source rather than its docs:

- **Post and dismiss are asymmetric, and that erases the hydration race.** Dismiss is **unconditional** (at mount, and on every transition into `active`); post is **conditional** (only into `background`, only with a live session). On cold launch the session provider hydrates asynchronously, so `activeSession` is `null` for the first frames even when a session exists — if dismissal had to know whether one was live it would read the wrong answer and strand a stale notification. Making it unconditional means the question is never asked. Corollary: **finish/discard need no dismiss call**, both being foreground-only where `active` already cleared it.
- **Never act on `inactive`.** It fires for transient interruptions (shade, app switcher, permission dialog, call) where the user has not left. Only `background` means genuinely backgrounded. This is the one rule only exercisable on iOS — Android never emits `inactive`.
- **A fixed notification identifier.** On Android it becomes the notification *tag* while the numeric id is a library constant, so a repeat post **replaces** rather than stacks and cancel-by-id works across a process restart — which is what lets the mount-time dismiss clear a notification left by a force-killed session. iOS replaces a request with a matching identifier the same way.
- **`channelId` belongs on the TRIGGER, not the content.** It maps to a native `ChannelAwareTrigger` on Android and to `null` elsewhere, and that trigger is deliberately not *schedulable*, so both deliver immediately — one trigger shape, correct cross-platform. Symptom of getting it wrong: the notification lands in a generic "Miscellaneous" channel. The channel is created inside the post (idempotent) rather than at startup, because a session restored on cold launch never passes through `startSession`.
- **A module-scope `setNotificationHandler` is REQUIRED even though we only post from the background.** The library presents directly only when the app is not `RESUMED` — and "RESUMED" is `ProcessLifecycleOwner`, which **debounces its pause dispatch by 700 ms**, whereas RN's `AppState` emits `background` immediately. So the post reliably lands inside that window, takes the foreground branch, finds no handler, and is discarded after a 3 s timeout. **General lesson: `AppState` and `ProcessLifecycleOwner` are two different clocks, and any library gating on "is the app foregrounded" reads the slower one.** Cost: routing through the handler adds a JS round trip, which is what makes the Recents-kill limitation reachable.
- **Channel importance is `LOW`, and Android FREEZES importance at creation.** `DEFAULT` plays a sound, so every backgrounding mid-workout would chime; `LOW` is silent and shade-only, the convention for ongoing status notifications. The trap: once a channel exists only its name and description can change, so editing that line does nothing on a device that already created it — it needs a reinstall or a new channel id. Verify with `adb shell dumpsys notification --noredact | grep -A1 active-session` and read `mImportance` (native scale: 2 = LOW, 3 = DEFAULT).
- **`sticky: true`** maps to Android's `setOngoing`. On **Android 14+** that no longer means undismissable — the OS made ongoing notifications swipeable — but it still excludes them from "Clear all". A user swiping it away is harmless; it returns on the next backgrounding.
- **Navigate with `router.push`, not `router.navigate`.** `navigate` resolves to a `NAVIGATE` action, which *returns to* an existing route of that name rather than pushing, and silently did nothing from a tab. A `currentPathnameRef` guard (skip the push when already on `/session`) is what keeps repeated taps from stacking screens.
- **A denied permission does NOT reject the post.** Android silently drops `notify()` without the permission and iOS resolves without presenting, so neither throws. Graceful behaviour comes from the OS, not from the `catch` — what reaches that catch is a missing native module or a native scheduling failure.
- **Tap-to-resume is warm-only, deliberately.** On a cold launch the native side emits the response before any JS listener exists. Reading it back would need `getLastNotificationResponse()` plus a hydration gate, a once-ref and a reload guard — roughly 3x the code — to save **one tap**, because a cold launch always lands on Home where the resume banner already shows the session. **A cold tap landing on Home is intended, not a gap to fill.**
- The notification shows a **static start time**, not an elapsed count: a "started at" stamp stays true for as long as it is up, while a count would freeze at whatever it read when posted.
- Permission is requested contextually in `startSession` (fire-and-forget, so it never delays a workout) rather than at launch. A durable "already asked" flag was built and **reverted as unnecessary machinery**; do not re-add it without evidence of actual repeat-prompting on a device.
- **Only two lines are platform-conditional and neither gates functionality:** the `Platform.OS !== 'android'` guard wraps *only* channel creation (an Android-only concept whose stub elsewhere merely logs). The two one-sided *content* fields are paired so each platform gets an equivalent — `sticky` (Android) and `interruptionLevel: 'passive'` (iOS).

**Accepted limitations (device-observed — do not re-litigate):** backgrounding and then killing from Recents *within a second* leaves no notification, because the JS→native→JS→native round trip does not finish before the process dies (the only robust cure is a foreground service, i.e. native code, for a case where the user explicitly killed the app). Opening the Recents overview does **not** post — Android separates window focus from lifecycle pause, and the overview appears to take focus without pausing the Activity; same reason the notification shade does nothing. **iOS has never been run**; the code is cross-platform by construction but that branch has never executed.

**The splash gate holds the launch screen until all three providers hydrate.** Without it, a Light-mode user saw the first frames painted dark and then snap, because `ThemeProvider` defaults to dark and reads storage asynchronously. Each provider exposes `hasHydrated`, set inside its hydrate effect's **`finally`** — load-bearing, because a storage read that throws must still release the cover or the app hangs behind it permanently. Note the flag is not a "no session" signal: `activeSession` is `null` while it is false even when a session exists.

**Two mechanisms, both required — do not "simplify" to one.** (1) `SplashScreen.preventAutoHideAsync()` at **module scope** (not in an effect — the splash auto-hides at first paint, before any effect runs), with `hideAsync()` once ready. (2) **A JS overlay** in the device-scheme background colour painted over `children`. Mechanism 1 alone works only in a **production** build; in a **dev build** the client fetches the bundle from Metro first, so the native splash is already dismissed by the time `_layout.tsx` evaluates and both calls are no-ops. The overlay is plain React and behaves identically in both. **General lesson: anything depending on native-splash timing is unverifiable in a dev build.**

**`SplashGate` is the one component that must NOT read colours from `useTheme()`** — that hook can only report the default until `ThemeProvider` hydrates, which is precisely the wrong-theme frame it exists to hide. It indexes `palettes` by `useColorScheme()` (the *device* scheme), the same signal the native splash uses, so the handoff is invisible. This only works because `app.json` sets `userInterfaceStyle: "automatic"`; forcing `"dark"` would make the hook return dark unconditionally. That setting also stops `Alert.alert()` — an OS dialog no theme token reaches — rendering black for a Light-mode user.

**`children` render throughout**, so the tree mounts and hydrates *behind* the overlay rather than being delayed by it, and React commits the correct theme and the cover's removal in the same pass. **Residual, unfixable:** a device-dark user who selects Light still gets a dark splash before a light app; nothing drawn before JavaScript runs can know an in-app preference.

**Brand assets** are generated from two SVG sources by `npm run brand` (`sharp` is a build-time-only devDependency, never imported by the app).
- **Source marks from an icon library; do not draw them.** Hand-authoring the SVG was tried and abandoned — writing coordinates without seeing them render cannot produce a figure that *looks right*. The mark is MDI `dumbbell`; licence and provenance are in the file header.
- **A second, simplified source feeds the notification glyph.** The detailed mark sits on a thin diagonal and dissolves into an ambiguous squiggle at 24dp. A detailed mark plus a simplified glyph is the normal split; they need only be the same *idea*.
- **Sentinel ink.** Both sources are authored in magenta, substituted at build time for brand green or opaque white (the alpha-only outputs). Deliberately garish: an escaped substitution screams instead of shipping a plausible green.
- **Coverage is per-output, and a diagonal mark constrains it.** A launcher shows only the central 72dp of the 108dp adaptive layer, and a diagonal shape's extreme points are its bounding-box **corners**, not its edge midpoints — hence dividing the safe fraction by √2 (~0.43, versus the ~0.62 a centre-massed mark could afford).
- **Two `sharp` gotchas.** `density` is DPI applied to the SVG's *own* intrinsic size, so one value across differently-scaled sources silently under-renders one and exceeds sharp's input limit on another — override the root `width`/`height` instead. And **sharp applies operations in a fixed pipeline order regardless of call order, with resize before composite**, so magnifying a composited image needs a second pass.
- **Previews exist because some outputs cannot be judged by opening them** — the tile preview crops to the launcher's real visible fraction *before* masking (masking the full canvas flatters the art and hides the clipping it should catch), the notification preview renders at true 24px then magnifies nearest-neighbour, and the splash previews check one image against both backdrops at the real `imageWidth`. They are gitignored and never shipped.
- **The Android 12+ splash needs `dark.image`, not just `dark.backgroundColor` — and a small `imageWidth`.** Expo bakes `backgroundColor` into the splash logo PNG itself and only emits the night-variant drawables when **`dark.image`** is set, so a `dark` block carrying only a colour leaves the light-baked logo in use — and since Android 12 masks the splash icon to a circle, that renders as a **white disc** (invisible in light mode only because the disc matched the background). Separately, Android shows only the inner **2/3** of the 288dp canvas (a 192dp circle), so the same √2 diagonal constraint applies: `imageWidth: 140` keeps the art inside it where 200 reached 127dp against a 96dp radius and sliced the plates off. Verify by prebuilding and measuring the generated drawables.
- **Install a native dependency and add its plugin entry in the same step, never the config first.** Expo resolves every plugin entry at startup, so a config-only commit makes `npx expo start` fail outright.

### UI conventions

**The list separator is the single source of a card gap.** `layout.card` carries no margin. A card rendered by a list must **not** set `marginBottom` — the separator alone owns the gap, at `spacing.m` on editable surfaces and `spacing.s` on view-only browse surfaces. Otherwise the rendered gap is the sum of both, which is how five different card gaps came to exist.

**The corollary that caused a real bug: a separator renders *between* items only, never after the last one, so whatever follows a card list must own its top gap.** Card margins had been masking that, leaving a trailing button flush against the last card once they were removed.

Deliberate exception: `ReadOnlySessionExerciseCard` keeps its own margin, because its single consumer maps it directly with no separator mechanism, so there is no second source to conflict with.

**Icon sizes follow the visual role**, not the file. Card-header and dashed-danger-button trash icons are 20; a top-bar back chevron and its trash counterpart are 24 (which is what makes a 24px loading spacer keep the centred title from shifting); compact list-row trash icons are 18 and dense inline chevrons 16.

**Set-row column widths are named constants** — `SET_LABEL_COLUMN_WIDTH` (48) and `SET_REMOVE_COLUMN_WIDTH` (32) in `spacing.ts`, since the same two numbers repeat across three component directories and each card's header reserves them with spacer `View`s. They are fixed element **widths**, not part of the spacing scale.

**A set row's `paddingVertical` is not row separation.** The row *is* the error-highlight box, so its padding is what keeps the error tint off the inputs' own borders, and the container `gap` is what stops two adjacent error boxes merging. **Both must stay non-zero.**

**`EmptyState` vs `ListEmptyText`.** `EmptyState` (a muted icon glyph, title, and message) is for a **screen-level surface that is genuinely empty until the user creates something**. `ListEmptyText` (one muted line) is for a **transient or nested "nothing matched"** — search no-results, a hint inside an expanded card, a bottom sheet, or an *error* state like "Workout not found."

**No empty state carries a CTA**, because the resolving action already exists on the surrounding screen — a section header button one line away, a persistent "Add exercise" below, or the FAB as the single start entry point. `EmptyState` was built with optional action props and they were removed once no call site supplied them (a prop no call site supplies is not a prop). If a future surface genuinely lacks a nearby action, re-add them there rather than assuming the component should own a button.

**Illustrations are large muted `Ionicons` glyphs**, chosen over hand-drawn SVG and raster assets: icons are already the app's visual language, they inherit `colors.*` so they stay theme-reactive with **no light/dark asset pair**, and they add no dependency or bundle weight.

**`WorkoutCard` is the single source of truth for workout appearance** — used identically in the Workouts section and inside expanded split days.

**`TabBar` is self-contained but still draws from the `spacing` scale.** Its floating FAB, slot sizing and pressed states have unique geometry that maps to no shared token, but its safe-area padding uses `insets.bottom + spacing.s` inline, mirroring every top bar. `minHeight` (not `height`) lets it grow to clear the gesture bar without clipping.

---

## Code Rules — Must Follow in Every Generation

### Naming

- No single-letter or abbreviated variable names. `s, w, e, a` are forbidden. Use `splits, workouts, exercises, activeSplitId`.
- Every name must clearly communicate its purpose, and be unambiguous **relative to the other names in scope** — qualify with `all`, `selected`, `active` when similar concepts coexist.

### Comments

- Comments are welcome and encouraged — but keep them concise and value-adding.
- Do not delete or suggest removing comments during cleanup or code generation, unless they are extremely verbose and add no value whatsoever.
- "Self-documenting code" here means well-chosen names, not the absence of comments.

### Styles

- Always use the shared style tokens first. Only write an inline style or a local `StyleSheet` entry if no token covers it.
- Never hardcode colour hex values, font sizes, spacing numbers, or layout patterns inline.
- **Colour-bearing tokens are theme-reactive:** read `colors`, `layout`, `typography`, `picker` from `useTheme()` (`@/context/ThemeContext`), **not** from `@/styles`. Only the colour-free `spacing` and `radius` come from `@/styles`. A colour-bearing local `StyleSheet` becomes a module-level `makeStyles(colors: Palette)` consumed via `useMemo(() => makeStyles(colors), [colors])`; colour-free ones stay static.
- `StyleSheet.create` runs at module load — never put runtime values like `useSafeAreaInsets` inside it. Apply those inline.
- State treatments have shared tokens — `layout.pressedButton` (0.6), `layout.pressedCard` (0.75), `layout.disabled` (0.4). Compose them into a style array (`isDisabled && layout.disabled`); never re-declare an `opacity` for these locally.
- Never use en/em dash literals in source strings; use a plain hyphen (e.g. rep ranges: `${min}-${max}`).

### TypeScript

- `interface` for component props.
- `type` for unions and aliases.

### Imports

| Hook | Import from |
| ---------------------- | ----------- |
| `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef` | react |
| `useFocusEffect`, `useRouter`, `useLocalSearchParams` | expo-router |

### Components

- Use abstraction — split into child components, do not generate monolithic files. Each component in its own file.
- `SectionHeader`, `WorkoutCard`, `SplitCard`, `PlannedSetRow` and `ExercisePicker` are good examples of the right level of abstraction.
- **Placement rule:** a component owned by exactly one tab lives in that tab's subdirectory; one that is (or is clearly about to be) reused across tabs lives in `shared/`. History is further split by lens (`byWorkout/`, `byExercise/`), matching the `HistoryLens` keys. See the Project Map for what each directory holds.

### Code generation

- Never mutate arrays or objects directly — always spread to produce new copies (important!).
- All async functions inside `useEffect`/`useFocusEffect` must be defined inside the callback and called immediately, not passed directly.

### Storage

- `addX` functions take `Omit<X, "id">` — never pass an id manually.

### Performance — Large Lists

For any `FlatList`/`SectionList` over ~20 items, apply this chain so items don't all re-render on every parent render:

1. **`memo` the item component** — bails out when props are unchanged.
2. **`useCallback` `renderItem`/`renderSectionHeader`** — a stable reference is what lets `memo` work.
3. **`useCallback` handlers passed as item props** — a new `onDelete` reference means `memo` never bails.
4. **`useMemo` derived list data** — filtered/grouped arrays.
5. **Id-based callback props** — type them `(id: string) => void`, so `renderItem` passes the stable handler directly instead of wrapping it in a per-item arrow (a new reference every render).
6. **Stabilise every dep of `renderItem`'s `useCallback`** — a plain `new Set(...)` at the parent is a new reference every render.
7. **Pass primitive item props, not the whole entity.** After a storage reload every object is a new reference, so `memo`'s shallow compare re-renders every row; passing `id`/`name`/`isDefault` lets unchanged rows bail out by value.
8. **Set `windowSize={5}`** — the default 21 keeps ~10 viewport-heights rendered each side, so a ~100-item list stays entirely in the render tree.

`plan/exercise/index.tsx` is the canonical example.

---

## How to Behave

- Always read this file at the start of every session before doing anything.
- Before building a new step, read the relevant existing components to understand current patterns.
- Before building a new step, always plan and confirm the plan with me first, before making any writes.
- If uncertain about scope or approach, ask before acting.
- After completing a task, briefly summarise what changed and flag anything that needs attention.
- When uncertain between two valid approaches, pick the one most consistent with existing code in the project.

---

## Technical Notes

- `@/` aliases `src/` via `tsconfig.json`. Expo Router **typed routes** are enabled, so a route file must exist before navigating to it. `reactCompiler` is also enabled — it is additive, and the manual memoisation guidance above still stands.
- **There is no test framework.** Verification is `npx tsc --noEmit` plus `npm run lint`; `npm run format:check` is informative but the repo is not currently Prettier-clean.
- `react-native-get-random-values` must be the absolute first import in `src/app/_layout.tsx`.
- **Timestamps are stored as UTC ISO strings and every display renders in the device's timezone** via `toLocaleString`/`toLocaleDateString`. This is correct and portable — do not "fix" it. `getTodayKey()` and the monthly-stats grouping follow the device timezone too, so all surfaces stay mutually consistent.
- **Emulator clock skew is not an app bug.** Bodyweight times have twice appeared 8 hours off in testing, from two different causes: the emulator defaulting to GMT, and a correct timezone with `auto_time` disabled and the clock never re-synced. The tell is that the emulator's own status-bar clock is wrong too. **Diagnosis order: `adb shell date` and `adb shell settings get global auto_time`, not just the timezone.** A non-issue on a physical phone, which carries network time.
- Never use `sudo` with npm.
- **`.gitignore` ignores `.env*`** (with `!.env.example`), not the Expo template's `.env*.local` — that default encodes a Next.js/CRA convention where only `*.local` holds secrets, which would have silently committed a plain `.env` holding an API base URL. Caveat if revisited: a `!` negation cannot re-include a file whose parent directory is ignored.
- The `@quietrep/*` key *names* are not secrets — they ship inside the JS bundle and anyone with sandbox access can enumerate keys — so there is no need to hide them in docs.
