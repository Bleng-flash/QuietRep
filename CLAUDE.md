# QuietRep — CLAUDE.md

## What is QuietRep

A gym workout logger mobile app built with React Native and Expo (Expo Router, EAS). Users create a library of exercises, build workout templates, organise them into weekly splits, and log live workout sessions.

## Overall Iteration Plan

We will build the frontend first, using a local storage with React's AsyncStorage as the temporary makeshift backend.

Iteration sequence for the frontend:

- Iteration 1: Data model + Plan tab \
  Get the storage schema right first. Define and implement the local storage layer for exercises, workouts, and splits. Build the full Plan tab — all three sections (Exercises, Workouts, Splits) with create, edit, delete, and active split selection. No home screen context, no session, no log yet — just the ability to build out your gym plan in full.
- Iteration 2: Start workout session \
  Build the FAB flow and full session view. Bottom sheet entry point, the three start options, the in-session exercise/set/rep logging, mid-session modifications (reorder, swap, add, remove), and the finish + save to history. The persistent in-progress banner across tabs. At the end of this iteration the core loop — plan a workout, execute it, save it — is fully functional.
- Iteration 3: History tab \
  Build the Past Workouts list pulling from saved session history. Session detail view. Per-exercise progression view (the "By exercise" lens), calculated from the history built up in iteration 2.
- Iteration 4: Home tab \
  Now that all the data exists (active split, session history, per-exercise progression), the home screen can be built meaningfully. Today's workout card, the start CTA, the monthly dashboard, and the recent workouts strip.
- Iteration 5: Profile tab \
  Bodyweight log, units preference (propagated back through earlier screens), rest timer settings wired into the session view, data export. Polish pass on everything.
- Iteration 6: Polish + predefined content \
  Predefined exercise library. Animations and transitions. Empty state illustrations. Onboarding flow for first-time users. Any UX rough edges surfaced from using the app.

\
Iteration 1 is complete, **iteration 2 is complete** (all six steps done), **iteration 3 is complete**, and **iteration 4 (Home tab) is complete**. The table below details the progress within iteration 2.
| Step | Feature | Status |
| ---- | ----------------------------------------------------------------------- | ----------- |
| 1 | Session types, storage (`sessions.ts`), and utils (`session.ts`) | Done |
| 2 | Active-session context (`ActiveSessionContext`) | Done |
| 3 | Session screen + components (`WorkoutSession`, `SessionExerciseCard`, `LoggedSetRow`) | Done |
| 4 | FAB bottom-sheet menu + three start-session entry points | Done |
| 5 | Cross-tab resume banner | Done |
| 6 | Polish — empty states, confirm dialogs, elapsed timer | Done |

## Current State

Iteration 1 is complete, Iteration 2 is complete (Steps 1-6 done), Iteration 3 is complete, and Iteration 4 (Home tab) is complete. The following is fully functional:

**Iteration 1 (complete):**
- Plan index screen with Splits, Workouts, and Exercises sections
- Full WorkoutEditor flow — create and edit workouts, add/remove/reorder exercises, configure sets and reps, exercise picker modal with live search
- All storage operations for exercises, workouts, splits, and active split
- All default exercises seeded on first launch via `seedDefaultExercises` in `src/storage/exercises.ts`
- Safe area insets applied correctly throughout

**New in Iteration 2, Step 1:**

- `SetScheme` renamed to `PlannedSet`; `EditableSet` renamed to `EditablePlannedSet` throughout
- `EditableWorkoutExercise` promoted from a private type in `WorkoutEditor` to an exported type in `src/types/index.ts`; `ResolvedEditableWorkoutExercise` rewritten as a purely additive intersection on top of it
- New canonical session types in `src/types/index.ts`: `LoggedSet`, `SessionExercise`, `WorkoutSession`
- New session view-model types: `EditableLoggedSet` (adds `localKey` + optional `targetMinReps`/`targetMaxReps`), `EditableSessionExercise`, `ResolvedEditableSessionExercise`
- `src/storage/sessions.ts` — `getSessions`, `getActiveSession`, `setActiveSession`, `clearActiveSession`, `finishSession` across two AsyncStorage keys (active buffer + history)
- `src/utils/session.ts` — `getTodayKey`, `seedSessionExercises`, `stripToCanonicalExercises`, `toCanonicalSession`

**New in Iteration 2, Step 2:**

- `src/context/ActiveSessionContext.tsx` — `ActiveSessionProvider` (mounts at root, hydrates from `getActiveSession()` on cold launch) and `useActiveSession()` hook
- `SessionBuffer` — the in-memory working shape (`id`, `name`, `startedAt`, `exercises: EditableSessionExercise[]`), exported from the context file; never written to storage directly
- Four actions on the context: `startSession` (async, awaited before navigation), `updateActiveSession` (debounced 500ms persist via `latestSessionRef`), `finishActiveSession` (cancels debounce, stamps `finishedAt`, writes to history), `discardActiveSession` (cancels debounce, clears active buffer)
- `hydrateSessionExercises` added to `src/utils/session.ts` — re-attaches fresh `localKey`s to stored `SessionExercise[]` on cold restart
- `ActiveSessionProvider` wraps `<Stack>` in `src/app/_layout.tsx`

**New in Iteration 2, Step 3:**

- `src/components/session/LoggedSetRow.tsx` — mirrors `PlannedSetRow` for weight/reps logging; local `weightText`/`repsText` buffers; `buildRepsPlaceholder` uses `targetMinReps`/`targetMaxReps` as input placeholder hint; `onChange` emits `LoggedSet` (caller spreads to preserve `localKey`)
- `src/components/session/SessionExerciseCard.tsx` — mirrors `WorkoutExerciseCard`; `handleSetChange` spreads `currentSet` first so `localKey` + target hints survive; `handleAddSet` copies last set's weight/reps with fresh `localKey`, no target hints; column headers "Load (kg)" / "Reps"; sets keyed by `set.localKey`
- `src/components/session/SessionHeader.tsx` — session-specific top bar ("Discard" / editable centered title / "Finish"); `useSafeAreaInsets` applied inline; spinner when `isFinishing` (superseded by Step 5: left slot is now a **minimise** button and Discard moved to a footer danger button)
- `src/components/session/WorkoutSession.tsx` — fat component consuming `useActiveSession()`; `useFocusEffect` → `getAllExercises()`; `exerciseMap` + `resolvedSessionExercises` + `alreadyAddedIds` via `useMemo`; all mutations via `updateActiveSession`; discard confirm alert; `DraggableCardList` + `ExercisePicker` overlay
- `src/app/session.tsx` — thin screen; renders null if `activeSession` is null (covers the brief mount window before context commits), otherwise renders `WorkoutSession`; back-navigation is owned by `WorkoutSession` via explicit `router.back()` in finish/discard handlers

**New in Iteration 2, Step 4:**

- `src/components/session/WorkoutFabMenu.tsx` — single `Modal` (transparent, slide) with swappable `SheetView` content (`'menu' | 'pickToday' | 'pickWorkout'`); loads data on `visible` via `useEffect`; three entry points: today's workout (subtitle reflects active split / rest day / N workouts; disabled when none), from a workout (searchable standalone list via `matchesSearchQuery`), empty session ("Quick Workout"); if `activeSession` exists shows "Resume {name}" row instead; internal components `SheetOptionRow`, `WorkoutOptionRow`, `SheetBackHeader`
- `src/components/shared/TabBar.tsx` — extended with `onFabPress: () => void` prop; FAB calls it instead of navigating; center slot still renders the empty gap
- `src/app/(tabs)/_layout.tsx` — owns `isFabMenuOpen` state; injects `onFabPress`; renders `WorkoutFabMenu` as sibling of `<Tabs>`
- `src/components/session/SessionHeader.tsx` — updated: title is now an editable `TextInput` (local-state + callback pattern); `onNameChange: (name: string) => void` prop added
- `src/components/session/WorkoutSession.tsx` — updated: wires `onNameChange` to `updateActiveSession`; `handleFinish` guards against empty name before writing to history

**New in Iteration 2, Step 5:**

- `src/components/session/ResumeSessionBanner.tsx` — persistent "now-playing"-style strip; pure consumer of `useActiveSession()` (no storage of its own); renders `null` when `activeSession` is null so it occupies zero space; left group (accent `barbell` icon + name + live elapsed timer as the caption, added in Step 6), left-aligned to clear the protruding FAB; taps run `router.push('/session')`.
- `src/app/(tabs)/_layout.tsx` — updated: the `tabBar` render callback now wraps `<ResumeSessionBanner />` above `<TabBar />` in a single `View`, so the two dock as one unit and React Navigation measures their combined height (screen content stays clear of both). `WorkoutFabMenu` and `TabBar.tsx` are unchanged — the banner is a peer of `TabBar`, not a child
- `src/components/session/SessionHeader.tsx` + `WorkoutSession.tsx` — updated: the header's left slot is now a **minimise** button (MaterialIcons `close-fullscreen`, `onMinimise` → `router.back()` with `ActiveSessionContext` left intact, so the session keeps running and the banner appears); Discard relocated from the header to a dashed `layout.dangerButton` at the bottom of the session content. Minimise is what makes the resume banner reachable at all — without it the session screen was a dead end (Discard/Finish both end the session). Android hardware-back and iOS swipe-back already pop the stack without ending the session, so they now read as "minimise" too and need no special handling

**New in Iteration 2, Step 6 (polish — Iteration 2 complete):**

- `src/utils/session.ts` — `formatElapsed(startedAtIso, now)`: pure clock formatter; `mm:ss` under an hour, then unpadded hours for over an hour (`h:mm:ss` for 1-9, `hh:mm:ss` for 10-99). `Math.max(0, …)` guards clock skew (never negative); total seconds clamped to `MAX_ELAPSED_SECONDS` (99:59:59) so the display freezes there rather than widening to three-digit hours
- `src/components/session/ElapsedTimer.tsx` — tiny ticking leaf: owns a `now` state + 1s `setInterval` (`useEffect`, torn down on unmount), renders `formatElapsed`. Deliberately its own component so the once-per-second re-render is isolated to this leaf — the header's name `TextInput` and the session's exercise cards do not re-render every tick. Props: `startedAt`, optional `textStyle` (default `typography.caption`); used by both `SessionHeader` and `ResumeSessionBanner`
- `src/components/session/SessionHeader.tsx` — updated: takes a `startedAt` prop; the centre slot is now a column (editable title `TextInput` on top, `<ElapsedTimer />` as a subtitle below). Stale header comment corrected (Discard lives in the footer, not the header)
- `src/components/session/WorkoutSession.tsx` — updated: passes `startedAt` to the header; renders `<ListEmptyText>` when `resolvedSessionExercises` is empty (Quick/Empty session or all exercises removed) instead of a bare "Add exercise" button; `handleRemoveExercise` now confirms via `Alert` **only when the exercise has logged data** (`weight > 0 || reps > 0`) — a blank just-added exercise is removed without nagging. The actual removal is factored into a private `removeExercise` helper called by both paths
- Finish stays an instant single tap (no confirm — positive action, no un-finish) and remove-*set* stays confirm-free (low-stakes, frequent, last-set already guarded)

**New in Iteration 3 (History tab — Past Workouts list + Session detail):**

- `src/storage/sessions.ts` — `getSessionById(sessionId)` added (reads `getSessions()`, `.find` by id; mirrors a future `GET /sessions/:id`) and `deleteSession(sessionId)` (reads `getSessions()`, `.filter` out the id, writes back; mirrors a future `DELETE /sessions/:id`; same read-all/modify/write-all shape as `deleteWorkout`). Detail screen has no direct AsyncStorage access — it calls these helpers.
- `src/utils/session.ts` — two formatters added: `formatSessionDate(iso)` (calendar date via `toLocaleDateString`, e.g. "Mon, Jul 14, 2026") and `formatSessionDuration(startedAt, finishedAt)` (session length, reuses `formatElapsed`; returns `''` when `finishedAt` is null). These are the calendar/date helpers the history rows and detail need — `formatElapsed` alone is a duration formatter.
- New `src/components/history/` subdirectory (the History tab's own components):
  - `SessionCard.tsx` — memoised list row; **primitive props** (`sessionId, name, startedAt, finishedAt, exerciseCount, setCount`) so unchanged rows bail out of re-render on focus reload; `layout.card`; press → `onPress(sessionId)`.
  - `PastSessionsList.tsx` — the "By workout" body: `FlatList` of `SessionCard`s (newest-first straight from `getSessions()`), `windowSize={5}`, `ListEmptyText` empty state. Derives exercise/set counts inline off the canonical session — **no exercise resolution in the list** (only the detail resolves names). (Originally `PastWorkoutsList`; renamed when the By-exercise lens landed — it renders `SessionCard`s, so "sessions" is the accurate noun, and it pairs with `PastExercisesList`.)
  - `ByExercisePlaceholder.tsx` — coming-soon stub for the future "By exercise" progression lens. (Superseded: replaced by the real `PastExercisesList` lens and deleted — see the By-exercise section below.)
  - `SessionDetail.tsx` — fat detail component; `useFocusEffect` → `Promise.all([getSessionById, getAllExercises])`; `exerciseMap` + resolved exercises via `useMemo`; back-chevron top bar; summary line (date • duration • N exercises • M sets); one `ReadOnlySessionExerciseCard` per exercise. `hasLoaded` flag distinguishes loading from not-found so it never flashes "Workout not found." during the initial read. The top bar's right slot is a **delete (trash) action** — `Alert` destructive confirm → `deleteSession(sessionId)` → `router.back()`, landing on History whose `useFocusEffect` reload drops the now-missing row (no extra plumbing). The trash button renders only once `session` is loaded (falls back to a width-24 spacer while loading/not-found, so the centred title never shifts). This is the app's only entry point for removing a past session — deliberately in the detail view rather than a list-row swipe, which would need gesture-handler and complicate `SessionCard`'s primitive-prop memoisation.
  - `ReadOnlySessionExerciseCard.tsx` — **read-only** counterpart to `SessionExerciseCard` (the name mirrors the editable original): renders logged sets as plain `Text` (no `TextInput`, no add/remove), reusing the `layout.card` shell and column layout. Tolerates a dangling FK (`exercise?.name ?? 'Unknown exercise'`). The editable session components were deliberately **not** forced into a read-only mode — they are built around `TextInput` + the `Editable*` view models; the detail reads the simpler canonical `SessionExercise`/`LoggedSet` shapes.
- `src/components/shared/SegmentedControl.tsx` — generic iOS-style pinned toggle (`{ options, value, onChange }`), kept in `shared/` since it's reusable beyond History.
- `src/app/session/[sessionId].tsx` — new **root-stack** route (`/session/[sessionId]`), the read-only session-detail screen. Thin screen: `useLocalSearchParams` → `<SessionDetail />`. Lives at the root (not under the History tab) per "Shared screens live on the root stack" — reachable from History now and Home later without a cross-navigator push. Coexists with the live-session route `session.tsx` (`/session`); the file + same-named folder is supported by Expo Router (verified in the generated route types). Owns its background via `layout.screen`.
- `src/app/(tabs)/history.tsx` — replaces the placeholder. **Pinned segmented control** landing: a static header (title + `SegmentedControl` for `[ By workout | By exercise ]`) stays put while only the list below scrolls. `byWorkout` → `PastSessionsList`; `byExercise` → `PastExercisesList` (originally `ByExercisePlaceholder`). `useFocusEffect` → `Promise.all([getSessions(), getExerciseHistorySummaries()])` so both lenses load in parallel. Chosen over a hub-of-buttons so the primary content (past workouts) is immediate — no extra tap, no empty landing.

**New in Iteration 3 (By-exercise progression view — replaces the placeholder):**

Deliberately built **instead of** the originally-scoped 1RM-estimation-based PRs (since descoped entirely — see Next steps): an honest progression lens — pick a logged exercise, see every set you actually lifted across all past sessions with dates. No estimation formula committed to.

- `src/types/index.ts` — history view models (frontend only, no DB counterpart): `ExerciseHistorySummary` (one By-exercise list row: `exerciseId, name, muscleGroup, sessionCount, lastPerformedAt`) and `ExercisePerformance` (one session's logged sets for one exercise: `sessionId, sessionName, performedAt, sets`).
- `src/utils/session.ts` — pure aggregations: `summarizeExerciseHistory(sessions, allExercises)` (one summary per distinct logged exercise; duplicate entries in a session count once; dangling FK → "Unknown exercise"/"Other"; sorted most-recently-trained first) and `collectExercisePerformances(sessions, exerciseId)` (one entry per session containing the exercise, newest-first preserved from `getSessions()`; duplicate entries' sets concatenated). **Components must not call these directly** — they are the client-side stand-ins for future server queries (see "Derived reads live behind storage endpoint mirrors" below).
- `src/storage/sessions.ts` — endpoint mirrors: `getExerciseHistorySummaries()` (mirrors a future `GET /exercises/history-summary`) and `getExercisePerformances(exerciseId)` (mirrors `GET /exercises/:id/performances`). Both read raw sessions and delegate to the pure utils.
- `src/components/history/PastExercisesList.tsx` — the "By exercise" lens body: `FlatList` of `ExerciseHistoryCard`s, same memo chain + `windowSize={5}` + `ListEmptyText` shape as `PastSessionsList`. Summaries arrive pre-joined from storage — no exercise resolution here.
- `src/components/history/ExerciseHistoryCard.tsx` — memoised primitive-prop row (mirrors `SessionCard`): name / muscle group / `"N sessions  •  Last performed: {date}"` as three lines; id-based `onPress(exerciseId)`.
- `src/components/history/ExerciseHistory.tsx` — fat detail component: `useFocusEffect` → `Promise.all([getExercisePerformances(exerciseId), getExerciseById(exerciseId)])`; back-chevron top bar (SessionDetail's recipe, no trash — nothing to delete); `hasLoaded` flag against not-found flash; `FlatList` (`windowSize={5}`) of `ExercisePerformanceCard`s with a `ListHeaderComponent` summary caption (`{muscleGroup}  •  {N} sessions`). A dangling FK still shows its history under "Unknown exercise". `layout.screen` on the root view (root routes paint their own background).
- `src/components/history/ExercisePerformanceCard.tsx` — one past session's block: date-led header (`formatSessionDate`) with session name as caption, then the `Load (kg)` / `Reps` column layout mirroring `ReadOnlySessionExerciseCard`. Memoised for the detail's FlatList.
- `src/app/exercise/[exerciseId].tsx` — new **root-stack** route, thin screen → `<ExerciseHistory />`. Sits beside the static `exercise/new` in the same folder (Expo Router resolves static segments before dynamic ones). Root-level per "Shared screens live on the root stack" — reachable from History now, Home/Plan later.
- `src/app/(tabs)/history.tsx` — `handleOpenExercise` mirrors `handleOpenSession` (`useCallback`, id-based `router.push`); the `byExercise` lens renders `PastExercisesList`. `ByExercisePlaceholder.tsx` deleted; `PastWorkoutsList` renamed to `PastSessionsList`.

**History components reorganised into per-lens subdirectories (post-Iteration 3):**

`src/components/history/` is now split by lens: `byWorkout/` (PastSessionsList, PastSessionCard, SessionDetail, ReadOnlySessionExerciseCard) and `byExercise/` (PastExercisesList, PastExerciseCard, ExerciseHistory, ExercisePerformanceCard). The subdirectory names match the `HistoryLens` keys in `history.tsx`. Two card renames landed with the move, giving each lens a symmetric List + Card pair: `SessionCard` → **`PastSessionCard`** (also disambiguates from the live session's `SessionExerciseCard`) and `ExerciseHistoryCard` → **`PastExerciseCard`**. Mentions earlier in this file use the original flat paths/names as a historical record.

**New in Iteration 4 (Home tab):**

Scope was **deliberately reduced** from the original plan (Today's workout card, start CTA, monthly dashboard, recent workouts strip) to two pieces plus a drill-down:
- **No workout-starting on Home** — the centre-tab FAB (`WorkoutFabMenu`) is already the single prominent entry point; duplicating it on Home added no value. So there is no start CTA and no "today's workout" resolver on Home.
- **Today's workout card deferred** — dropped for now to first get a feel for Home with just the dashboard + recent list; can be added later.

Data layer (pure reads/aggregations, mirrors future endpoints — see "Derived reads live behind storage endpoint mirrors" and "`src/utils/` is organised by concern"):
- `src/types/index.ts` — `MonthlyStatsEntry` (one **frontend-only** view model: `year, month` (0-11 JS index) `+ workoutCount, totalSets, totalDurationMs`). One comprehensive type serves both the current-month dashboard and each history row — `summarizeMonth` tags its result with the reference month, so no separate untagged "just the metrics" type is needed (which would have forced `Omit`-subtraction, against the additive-intersections rule).
- `src/utils/sessionStats.ts` — pure aggregations: `summarizeMonth(sessions, referenceDate?)` (current month) and `summarizeAllMonths(sessions)` (one entry per month with sessions, newest-first, gap months skipped), both keyed off **`startedAt`** (a session is attributed to the month it was *performed*, so a cross-midnight session counts in its start month), sharing a private `buildMonthlyStatsEntry(sessions, year, month)` reducer.
- `src/utils/datetime.ts` — `formatTotalDuration(totalMs)` compact formatter (`"12h 30m"`/`"45m"`/`"0m"`), sharing a private `msToHoursMinutes` with `formatSessionDuration`.
- `src/storage/sessions.ts` — endpoint mirrors `getCurrentMonthSummary()` (`GET /sessions/monthly-summary`) and `getMonthlyStatsHistory()` (`GET /sessions/monthly-stats`), each delegating to the pure util.

New `src/components/home/` subdirectory (the Home tab's own components):
- `StatTile.tsx` — one stat cell: a prominent value over a caption label; layout-neutral (`flex: 1`, centred) so three compose into a row. `adjustsFontSizeToFit` lets a long value shrink rather than truncate. The value colour lives on the value **`Text`** (RN ignores `color` on a `View`, and `Text` doesn't inherit it from a `View` parent).
- `MonthlyStatsCard.tsx` — memoised, **primitive-prop** card: a month label header (`"July 2026"`, from `year`+`month`) over three `StatTile`s. Used **both** for the current month on Home and once per past month on the drill-down. (An earlier thinner `MonthlyDashboard` variant without the month label was consolidated away in favour of this richer card.)
- `RecentWorkouts.tsx` — the "Recent workouts" section: a `SectionHeader` + the newest few finished sessions (`RECENT_LIMIT = 5`) as `PastSessionCard`s reused from History, each tapping into `/session/[sessionId]`. A plain `.map` (not a `FlatList`) — the list is capped and lives inside the Home screen's `ScrollView`, so virtualization would only fight the outer scroll. Owns its single-destination navigation internally via `useRouter` (per the over-prop rule).
- `src/app/(tabs)/index.tsx` — replaces the placeholder. Thin screen: `useFocusEffect` → `Promise.all([getCurrentMonthSummary(), getSessions()])` (two reads mirroring two future endpoints). Renders a **QuietRep wordmark** (plain-text branding via the new `typography.appTitle` token; "Rep" carries the primary accent), then a "This month" header row with an **"All months" link** → `/monthly-stats`, the current-month `MonthlyStatsCard` (`{...currentMonth}` spread — its props mirror `MonthlyStatsEntry` exactly), and `RecentWorkouts`. Initial state is a zeroed `MonthlyStatsEntry` for the current month so the first paint needs no null guard.
- `src/app/monthly-stats.tsx` — new **root-stack** route (`/monthly-stats`), the monthly-history drill-down reached from the Home "All months" link. Back-chevron top bar (the `ExerciseHistory`/`SessionDetail` recipe, no trash), `FlatList` of `MonthlyStatsCard`s, `hasLoaded` guard against an empty-state flash. Deliberately kept as a **self-contained screen** (not the usual thin-screen + fat-component split) because it takes no route params and has a single consumer — an extracted component would wire nothing; see "Thin screens, fat components".
- `src/components/shared/SectionHeader.tsx` — added an opt-in `flushTop` prop that drops the leading `marginTop: spacing.l` for a section that heads a screen. Applied to the Plan tab's first "Splits" header, which sat `spacing.l` lower than Home/History's top content; the two other Plan sections keep their inter-section spacing.
- `src/styles/typography.ts` — new `appTitle` token (30/800) for the QuietRep wordmark.

**New in Iteration 5, Step 1 (Dark/Light theming — the colour-consumption refactor, now implemented):**

The deferred theming refactor landed as the first Profile-tab step. The app is now fully theme-reactive with a working Dark/Light toggle and still defaults to dark. See "Theming — reactive colour-consumption refactor" in Key Design Decisions for the rationale and the rules to keep following.

- `src/styles/colors.ts` — restructured from the static `colors` object into a `palettes` **registry**: `palettes.dark`, `palettes.light` (newly authored light mode, identical key set), and `palettes.darkPurple` (unused seed variant). Exports `type ThemeMode = 'dark' | 'light'` and `type Palette = { [Key in keyof typeof palettes.dark]: string }` (keys derived from the dark palette; values widened to `string` so every palette — each with its own hex literals under `as const` — is assignable to the one shared type).
- `src/styles/layout.ts`, `typography.ts`, `picker.ts` — converted from static `StyleSheet.create` objects to **factories** `makeLayout(palette)` / `makeTypography(palette)` / `makePicker(palette)`, each returning a `StyleSheet.create(...)` and exporting `Layout`/`Typography`/`Picker` = `ReturnType<typeof makeX>`. `spacing.ts` and `radius.ts` are colour-free and stay static.
- `src/context/ThemeContext.tsx` (new) — `ThemeProvider` + `useTheme()` hook (throws outside the provider). Holds `mode` state, persists to the `@quietrep/themeMode` AsyncStorage key, hydrates once on cold launch (mount-once `useEffect`, like the root seed). Exposes `{ mode, setMode, colors, layout, typography, picker }` — the resolved palette plus memoised factory outputs for the active mode. `colors = palettes[mode]` is a **stable module-level reference per mode**, so `useMemo(() => makeX(colors), [colors])` only rebuilds stylesheets on an actual toggle (indexing, not cloning, is what preserves reference identity across renders).
- `src/styles/index.ts` — barrel now exports **only** the colour-free `spacing`/`radius` plus `palettes` and the `Palette`/`ThemeMode` types. `colors`, `layout`, `typography`, `picker` are **no longer exported from `@/styles`** — they are read from `useTheme()`.
- `src/app/_layout.tsx` — `ThemeProvider` wraps `ActiveSessionProvider`; an inner `ThemedStack` component (a `useTheme()` consumer, since `RootLayout` sits above the provider) drives the root `<Stack>` `contentStyle` background **reactively** and renders `<StatusBar style={mode === 'dark' ? 'light' : 'dark'}>`. (`style` is the status-bar *content* colour, so it reads inverted vs the mode; not `"auto"`, which follows the device scheme and would desync from the app-controlled toggle.)
- **~40 components/screens migrated** across `shared/`, `plan/`, `session/`, `history/`, `home/`, and the tab + root screens: static `colors`/`layout`/`typography`/`picker` imports replaced with `const { ... } = useTheme()`; colour-bearing local `StyleSheet.create` blocks became module-level `makeStyles(colors)` factories consumed via `const styles = useMemo(() => makeStyles(colors), [colors])`; colour-free local StyleSheets stay static; inline `colors.dark.X` reads became `colors.X`. (All the `colors.dark.error`/`errorSubtle`/etc. references *earlier* in this file are historical — they now read `colors.X` off the hook.)
- `src/app/(tabs)/profile.tsx` — the placeholder colour-swatch demo is replaced by the real Profile settings screen: a title + an **Appearance** section with a `SegmentedControl` (Dark / Light) wired to `setMode`. This is the only Profile section so far — units, bodyweight, and data export land in Steps 2-4.

Correctness rules that emerged (audited across the whole tree; `tsc` + `expo lint` clean):
- **Any component that renders colour must call `useTheme()` itself** — including memoised list rows (`PastSessionCard`, `PastExerciseCard`, `ExercisePerformanceCard`, `MonthlyStatsCard`, `PickerRow`, `ExerciseEntry`) and module-level sub-components (`WorkoutFabMenu`'s `SheetOptionRow`/`WorkoutOptionRow`/`SheetBackHeader`, `exercise/new`'s `MuscleGroupDropdown`, `plan/index`'s `EmptyState`). `React.memo` blocks re-renders from unchanged *props*, but a **context** change re-renders subscribers regardless — so calling the hook is what makes a memoised leaf repaint on toggle. Threading styles down as props would defeat primitive-prop memoisation.
- **A `useCallback`/`useMemo` must list a themed token in its deps only if its body directly uses it.** `ExercisePicker.renderExerciseContent` deps are `[layout, typography, styles]`; `WorkoutPicker.renderWorkoutContent` uses only `typography`, so `[allExercises, typography]`. A render callback that merely renders a self-theming child (`renderItem` → `<PastSessionCard>`, etc.) needs **no** theme deps — the child repaints via its own subscription.

**New in Iteration 5, Step 2, commit 1 of 3 (the units setting — no weight display changes yet):**

Step 2 is being landed as three reviewable commits. This one is self-contained and demonstrable on its own: the toggle works, persists across relaunch, and locks during a session, but nothing reads the unit yet.

- `src/types/index.ts` — `export type WeightUnit = 'kg' | 'lbs'` (singular, matching `MuscleGroup`/`DayKey`/`ThemeMode`), placed with the other unions at the top of the file.
- `src/context/UnitContext.tsx` (new) — `UnitProvider` + `useUnit()`, exposing `{ unit, setUnit }`. A template-copy of `ThemeContext`: own key `@quietrep/weightUnit`, `DEFAULT_UNIT = 'kg'`, hydrate-once `useEffect`, union-validated before `setState`, fire-and-forget persist. **No storage file** — a scalar preference does not need one (see "Scalar preferences own their AsyncStorage key" below).
- `src/app/_layout.tsx` — nesting is now `ThemeProvider > UnitProvider > ActiveSessionProvider > ThemedStack`. The order is load-bearing: commit 2 has `ActiveSessionProvider` consume `useUnit()` to stamp each new session.
- `src/styles/layout.ts` — new shared `disabled: { opacity: 0.4 }` token beside `pressedButton` (0.6) / `pressedCard` (0.75). Those two are element-suffixed because they hold *different* values; `disabled` is one value for any element, so it takes the bare noun. The two pre-existing hand-rolled copies were folded into it: `PickerModal`'s local `disabledItem` (its module `StyleSheet` disappeared entirely, along with the now-unused `StyleSheet` import) and `WorkoutFabMenu`'s `disabledRow`. `NamePromptModal.disabledAction` is deliberately untouched — it is a muted-*colour* treatment, not opacity.
- `src/components/shared/SegmentedControl.tsx` — optional `disabled?: boolean`; applies `layout.disabled` to the container and forwards `disabled` to each `Pressable`. Stays purely presentational: the rule for *when* to disable lives in the caller.
- `src/app/(tabs)/profile.tsx` — a **Units** section (`UNIT_OPTIONS` → `SegmentedControl` → `setUnit`), disabled while `activeSession !== null` with an explanatory caption rendered **only while locked**. The `section` style gained `marginTop: spacing.l` and the title's `marginBottom` was dropped so every section owns its leading gap uniformly — RN does not collapse margins, so pairing the two would have doubled the first gap.
- `src/context/ThemeContext.tsx` — `setMode` wrapped in `useCallback` and listed in the value memo's deps (it was silently omitted while being recreated every render), and the memo comment corrected — it claimed a saving the memo does not currently make. See "Context value memoisation" below.

**New in Iteration 5, Step 2, commit 2 of 3 (sessions record their unit — pure plumbing, no visible change):**

Every session now carries the unit it was logged in, end to end. Nothing reads the field yet; commit 3 consumes it.

- `src/types/index.ts` — `WorkoutSession.unit: WeightUnit` and `ExercisePerformance.unit: WeightUnit`, both **required** (pre-release, 0 users, so no optional-then-migrate dance). `LoggedSet.weight`'s stale `// in kg - units preference deferred` comment now points at the parent session's unit.
- `src/utils/session.ts` — `toCanonicalSession(id, name, startedAt, unit, exercises)` takes `unit` in 4th position (positionally beside the other session-level scalars, before the exercise payload). Because it is the single assembly point for every canonical write, adding the parameter here guarantees no persist path can omit the field — `tsc` flags any caller that tries.
- `src/context/ActiveSessionContext.tsx` — `SessionBuffer` gains `unit`; the provider reads `const { unit } = useUnit()` **only** to stamp a new buffer in `startSession`. The four-action API surface is unchanged: `finishActiveSession()` stays param-less and passes `activeSession.unit`, so a finished session records what it was logged in rather than whatever the setting reads at Finish. Hydration restores `stored.unit` alongside the other scalars.
- `src/utils/sessionStats.ts` — `collectExercisePerformances` copies `unit: session.unit` onto each record. Necessary because the record is **flat**: it lifts `sessionId`/`sessionName`/`performedAt`/`sets` out of the session and drops the session itself, so a consuming card cannot reach `session.unit`. Same reason `sessionName` is already copied.
- `src/constants/inputLimits.ts` — `MAX_WEIGHT` 1000 → 1500, and its comment is now unit-agnostic. One cap deliberately covers both kg and lbs rather than converting at validation time; 1000 lbs was too tight for a cap that used to mean kg. `isLoggedSetValid` is untouched and stays unit-agnostic.

Note for testing: a session stored **before** this commit has no `unit`, so it hydrates as `undefined` despite the type. There is no migration by design — clear `@quietrep/sessions` and `@quietrep/activeSession` (or reinstall) on any dev device carrying pre-Step-2 data.

## Next steps

**Iteration 5 (Profile tab) is in progress**, built as independently-committable steps (the user reviews + commits each one separately). Confirmed scope after discussion: **theming + units preference + bodyweight log**; **rest timer is deferred**; **data export** is a decision point pending the user's go-ahead.

- **Step 1 — Dark/Light theming — DONE** (see Current State above).
- **Step 2 — Units preference (kg / lbs) — IN PROGRESS (commits 1 and 2 of 3 done).** Weights are **stored as typed**, in the unit selected at log time (the user's explicit choice — *not* canonical-kg-with-display-conversion). Pre-release with 0 users, so there is no migration and every new field is required. Naming is fixed and binding: the type is `WeightUnit`, the field on a stored entity and on the setting is `unit`, the prop meaning "the unit these numbers were logged in" is `loggedUnit`, and the local alias for the current setting inside a converting card is `displayUnit`. No other name for a unit appears anywhere. Commits 1 and 2 are described under Current State above. Remaining:
  - **Commit 3 — display**: new `src/utils/units.ts` (per-domain helper beside `split.ts`/`workout.ts`/`search.ts`; pure, imports only `@/types`) with module-private `KG_PER_LB = 0.45359237` and `WEIGHT_DISPLAY_DECIMALS = 2`, exporting `convertWeight(weight, loggedUnit, displayUnit)` and `formatWeight(weight, loggedUnit, displayUnit)`. `convertWeight` **short-circuits when the units match**, so a user who never switches sees exactly their typed numbers with zero float drift. `formatWeight` renders `String(Number(converted.toFixed(2)))` — caps at 2 dp, drops trailing zeros. The live `SessionExerciseCard` takes `loggedUnit` as a **prop from the session** and does **no** conversion and **no** `useUnit()` call (the session is the single source of truth for its own unit); the two read-only cards take `loggedUnit` and call `useUnit()` themselves for `displayUnit`, converting **inside the card** per the theming precedent.
  - The originally-planned `src/storage/settings.ts` + `AppSettings` settings object + `getSettings`/`updateSettings` were **dropped**: a one-field wrapper does not survive scrutiny, and `ThemeContext` had already set the precedent for a scalar preference owning its own key directly. `SettingsContext` was renamed `UnitContext` to match what it actually holds.
- **Step 3 — Bodyweight log — TODO.** `BodyweightEntry = { id, weight, unit: WeightUnits, recordedAt }` (unit tagged per entry — logged over time, setting may change between entries). New `src/storage/bodyweight.ts`, key `@quietrep/bodyweight`, array pattern mirroring `addWorkout`: `getBodyweightEntries()` (newest-first), `addBodyweightEntry(Omit<BodyweightEntry,'id'>)`, `deleteBodyweightEntry(id)`; export from the barrel. UI: a Profile section or a root drill-down screen `src/app/bodyweight.tsx` (root screen → paints own `layout.screen` background) — add via a numeric input (reuse `LoggedSetRow`'s `sanitizeWeight`), list rows show weight + unit + `formatSessionDate(recordedAt)`, delete with a confirm `Alert`. A progression chart is out of scope (future polish).
- **Step 4 — Data export — DECISION POINT.** Optional, independent. Purpose: device-local data has no backup today; export dumps all AsyncStorage source keys to a shareable JSON file (manual backup + seed for a future import/restore + backend migration). If built: an "Export data" button reads all source keys via `AsyncStorage.getAllKeys()` + `multiGet`, assembles a versioned JSON object, and shares it. **Likely needs `expo-sharing` + `expo-file-system`** (not currently installed — the user installs deps; flag the exact command rather than run it).
- **Step 5 — Polish pass — TODO.** Rough edges surfaced from using Profile end-to-end (empty states, spacing, safe-area, a possible "About/version" row).

Approved plan file for this iteration: `/home/bryan/.claude/plans/we-have-1-tab-serene-ladybug.md`.

**Descoped — possible future improvements (not planned features):**
- **PRs section (PR detection + 1RM estimation)** — originally scoped for Iteration 3, deliberately dropped in favour of the By-exercise progression view (the honest no-estimation alternative). If ever revisited: the 1RM estimate must be a single swappable function (e.g. `estimateOneRepMax(weight, reps)`), with the formula choice (Epley/Brzycki/…) surfaced as a Profile-tab user preference.
- **Per-exercise load/rep charts** — a visual layer on top of the existing By-exercise lens and its `ExercisePerformance` data.
- **`isBodyweight`/`loadType` flag on `Exercise`** — would disambiguate a genuine bodyweight `weight 0` from a forgotten load entry, letting weighted exercises require `weight > 0` while bodyweight ones skip the load field. See "Blank load persists as 0" — until this exists, the lazy-0 behaviour stands. Iteration 5/6 scope, pairs with the units preference.

---

## Key Design Decisions

**Multiple workouts per day**
`Split.days` is `Record<DayKey, string[]>` — an array of workout IDs per day. Empty array means rest day. Supports zero to many workouts per day.

**Sets and rep ranges belong to WorkoutExercise, not Exercise**
An Exercise is just a name and muscle group. Sets and rep ranges (`minReps`, `maxReps`) live on WorkoutExercise as the **plan template**. Load is a *runtime* value — what you actually lift in a live session — and belongs exclusively on the live session (Iteration 2), not on the plan. This means the same exercise can appear in multiple workouts with different rep range schemes.

**WorkoutCard is the single source of truth for workout appearance**
Used identically in the Workouts section and inside expanded split day views. One component, consistent appearance everywhere.

**Tab bar is self-contained, but still draws from the `spacing` scale for safe-area padding**
The custom tab bar does not use `layout`/`typography` style tokens — its floating FAB, slot sizing, and pressed states have unique geometry that doesn't map to general-purpose style objects. It does, however, use the numeric `spacing` scale for safe-area-aware padding: `paddingBottom: insets.bottom + spacing.s`, applied inline (not in `StyleSheet.create`, since `useSafeAreaInsets` is a runtime value), mirroring the `insets.top + spacing.s` convention used by every top bar in the app. `minHeight: 70` (not `height`) lets the bar grow to clear the device's home indicator / gesture bar without clipping its content.

**Always use `useFocusEffect` for data loading in navigation screens**
Both tab screens and stack screens should use `useFocusEffect` for loading data, not `useEffect`. Tab screens stay mounted when switching tabs, so `useEffect` with empty deps only fires once and won't reload on return. Stack parent screens also stay mounted while a child is pushed on top, so the same problem applies when returning from a child — `useEffect` serves stale data silently.

With AsyncStorage the cost of re-running a load on focus is negligible. When the real API layer arrives, introduce a stale-time / cache-first flag (e.g. via React Query's `staleTime` or a manual `lastFetchedAt` check) at the data-fetching layer — not by reverting individual screens to `useEffect`.

Exceptions (both are documented with a comment in-file explaining why):
- **Root layout (`src/app/_layout.tsx`)** — layouts have no navigation focus lifecycle; one-time startup work belongs in `useEffect`.
- **Non-screen components** — components that use `useEffect` to react to prop changes (e.g. `NamePromptModal` reseeding its input when `visible` flips) are not navigation screens; `useFocusEffect` is meaningless there.

Whenever `useEffect` is used instead of `useFocusEffect`, add a concise comment explaining why — unless the reason is self-evidently obvious from the surrounding code (e.g. a dep array that clearly has nothing to do with navigation).

**Safe area insets applied at component level**
Any component or screen that renders its own top bar must apply `useSafeAreaInsets` to push content below the camera cutout and status bar. Do not rely on the navigator to handle this when `headerShown: false`.

**Thin screens, fat components**
Screen files are wiring only — route params, storage calls, navigation. All UI and logic live in shared components. As much as possible, try to abstract out child components.

Exception — a screen that does **no wiring** (no route params) **and** has a single consumer may hold its body directly rather than delegating to a fat component, since the component would be pure indirection. `src/app/monthly-stats.tsx` is the canonical example: it takes no params and is the only thing that renders the monthly-history list, so the `useFocusEffect` load + list live in the screen. The sibling detail screens (`session/[sessionId]`, `exercise/[exerciseId]`) keep the split because they genuinely wire a route param into their fat component. If a second consumer appears, extract the body back into a component.

**Shared screens live on the root stack**
The navigator tree is a root `<Stack>` (`src/app/_layout.tsx`) holding the `(tabs)` tab navigator and root-level screens (`session`, `exercise/new`). The **Plan** tab is itself a nested `<Stack>` (`(tabs)/plan/_layout.tsx`). The rule for where a route file belongs:

> A screen lives at the **lowest navigator that can reach all its entry points.** Reached from one tab only → keep it in that tab's stack (tab bar stays visible; e.g. `WorkoutEditor` at `plan/workout/*`, the exercise library at `plan/exercise/`). Reached from **multiple tabs, or from a root screen like the live session** → put it on the **root** stack as a single route everyone pushes.

`exercise/new` is the canonical example: it is reached from the Plan tab (library "+", WorkoutEditor's `ExercisePicker`) **and** from the root-level session's `ExercisePicker`, so it lives at `src/app/exercise/new.tsx` (root), not `(tabs)/plan/exercise/new.tsx`. Every caller pushes the same `/exercise/new`; no destination prop required.

Deliberate exception — `exercise/[exerciseId]` (the read-only per-exercise history screen) is reached from **only** the History tab ("By exercise" lens), so the rule above would place it tab-local. It is kept on the **root** stack anyway, for symmetry with its twin `session/[sessionId]` (session-detail), which *is* root-pinned because Home also opens it. The two History-lens detail screens (By workout → `session/[sessionId]`, By exercise → `exercise/[exerciseId]`) thus live in the same navigator and drill down with identical chrome (both cover the tab bar). A tab-local `exercise/[exerciseId]` would keep the tab bar visible while its twin hid it — an asymmetry that can't be fixed by moving `session/[sessionId]` too, since Home nails it to root. Do not "correct" this by relocating it under a History nested stack.

`monthly-stats` is the **same exception on the Home tab**: reached only from Home's "All months" link, but kept on the root stack for symmetry with `session/[sessionId]`, which Home also opens (via `RecentWorkouts`) and is root-pinned by History. Moving it tab-local would give Home's two drill-downs mismatched chrome, and additionally would force `(tabs)/index.tsx` to become a `(tabs)/home/` nested stack — renaming the tabs `index` route (which `TabBar` references by name) and needing an `initialRouteName`. Likewise do not relocate it.

Why: pushing a *tabs-nested* route from the root `/session` screen is a **cross-navigator push** — React Navigation dives into the tabs navigator and orphans the pushed screen on the Plan tab's stack (its back-relationship is with the root history, not the Plan index), so `router.back()` misfires and the screen gets stuck there permanently, surviving even finishing the session. Promoting the screen to the root stack makes every push same-navigator: from a tab it opens over the tab bar (the standard "screen over the tabs" pattern) and back returns exactly where you were; from the session it is a clean sibling push back to `/session`.

Tradeoff: a root screen sits **above** the tab bar, so it cannot show it — exercise creation from the Plan tab is now a focused full-screen (like the session), while `WorkoutEditor` (tab-local) keeps the tab bar. This is the intended pattern for future cross-navigator screens too (e.g. a session-detail view reachable from both History and Home, a workout-detail view reachable from both Plan and Home) — one root route each, no per-navigator duplication.

Consequence — **a promoted screen must paint its own background.** The Plan stack's `_layout.tsx` sets `contentStyle` to the themed background, so any screen *under* the Plan stack inherits it for free. Every root-level screen must apply `layout.screen` (`{ flex: 1, backgroundColor: colors.background }`, from `useTheme()`) to its own root view — as `WorkoutSession` and `exercise/new` do. (This surfaced as a white-flash bug the moment `exercise/new` was promoted to the root.) As of the theming refactor the root `<Stack>` **also** sets a reactive `contentStyle` background (via `ThemedStack` in `_layout.tsx`, driven by `useTheme()`), so the base repaints in one place on a toggle; the per-screen `layout.screen` still stands as the belt-and-suspenders each root screen owns. See "Theming — reactive colour-consumption refactor" below.

**Theming — reactive colour-consumption refactor (implemented; single global theme, whole app switches at once)**
The app supports a **Dark/Light toggle** (Profile → Appearance) that switches the **entire app at once** (never per-route), and still defaults to dark. This was **not a colour-values task but a colour-consumption refactor**: static imports → a reactive source, because nothing re-runs on a runtime toggle while colours are static reads. It was done as **one focused pass** (Iteration 5, Step 1) — a half-migrated theme is the worst state (components still holding static `colors.dark` wouldn't repaint), so it is all-or-nothing. The implemented shape:

- A root **`ThemeProvider`** (`src/context/ThemeContext.tsx`, wrapping `ActiveSessionProvider` in `src/app/_layout.tsx`) holds the active `mode`, persists it to `@quietrep/themeMode`, hydrates once on cold launch, and exposes `{ mode, setMode, colors, layout, typography, picker }` via a `useTheme()` hook.
- A **theme registry** `palettes` in `src/styles/colors.ts` expresses each mode: `dark`, `light`, `darkPurple` (seed variant) all share an identical key set. `type Palette` widens the values to `string`; `type ThemeMode = 'dark' | 'light'`.
- Colour-referencing style objects are **factories** — `makeLayout`/`makeTypography`/`makePicker` in `src/styles/*` and per-component module-level `makeStyles(colors)` — consumed via `const styles = useMemo(() => makeStyles(colors), [colors])` so styles rebuild only on toggle.
- The **app base background lives on the root `<Stack>` `contentStyle`, driven reactively** by `ThemedStack` (a `useTheme()` consumer in `_layout.tsx`), so a toggle repaints the base in one place. Root-level screens still also own their background via `layout.screen`.

**Rules to keep following now that it's live:**
- **Read colours/`layout`/`typography`/`picker` from `useTheme()`, never from `@/styles`** (the barrel no longer exports them). Only `spacing`/`radius` (colour-free) come from `@/styles`. No inline hex.
- **Every component that renders colour calls `useTheme()` itself** — memoised rows and module-level sub-components included (context bypasses `memo`; props-threading would defeat memoisation). See the Iteration 5 Step 1 correctness rules above.
- A colour-bearing local `StyleSheet` becomes a module-level `const makeStyles = (colors: Palette) => StyleSheet.create({...})` + a `useMemo(() => makeStyles(colors), [colors])` inside the component. Colour-free StyleSheets stay static (module scope).
- Add a themed token to a `useCallback`/`useMemo` dep array **only if the callback body directly uses it** (a callback that just renders a self-theming child needs none).

**Own behaviour at the right level — don't over-prop or over-drill**
Two related rules:
1. If a prop always receives the same value at every call site, it is not a prop — move it inside the component. Examples: `onCreateExercise` was removed from `WorkoutEditorProps`, and `onCreateNew` was removed from `ExercisePickerProps`, because every caller passed `() => router.push('/exercise/new')`; the navigation now lives inside each component via `useRouter`. (This holds even more firmly now that New Exercise is a single root route — see "Shared screens live on the root stack" below — so there is exactly one destination for every caller.)
2. When a prop IS genuinely variable, pass it from the *closest* ancestor that has all the context needed to implement the handler — not from further up the tree than necessary. Threading a prop through layers that don't use it is a sign the handler belongs lower down.

**Standalone vs Embedded Workouts**
`Workout.isStandalone` distinguishes two types. `true` means created in the Workouts section and shown there. `false` means embedded inside a specific split, never shown in the Workouts section. When a user assigns a standalone workout to a split day, a new copy is created with `isStandalone: false` and a fresh id — the original standalone is untouched. This fully decouples the two sections. Edits to a standalone workout after copying do not propagate to the split's embedded copy — splits are fixed snapshots.

**Exercise storage split into two AsyncStorage keys**
Default and user-created exercises are stored under separate keys — `@quietrep/defaultExercises` and `@quietrep/userExercises`. This makes `seedDefaultExercises` trivial: it reads only `DEFAULTS_KEY` and compares names, with no need to filter by `isDefault` flag at query time. The public API in `src/storage/exercises.ts` is:

- `getDefaultExercises()` — reads `DEFAULTS_KEY` only
- `getUserExercises()` — reads `USER_KEY` only
- `getAllExercises()` — parallel read of both, returns defaults first then user exercises
- `getExerciseById(exerciseId)` — single-exercise lookup, `null` if not found; mirrors a future `GET /exercises/:id` (see "Derived reads live behind storage endpoint mirrors")
- `addExercise(data)` — writes to `USER_KEY`; enforces name uniqueness across both keys via Alert
- `deleteExercise(id)` — removes from `USER_KEY` only; default exercises are not deletable
- `seedDefaultExercises()` — diffs `DEFAULT_EXERCISES` against both keys (not just `DEFAULTS_KEY`) before writing, so a user-created exercise that shares a name with a newly added default is not duplicated. If the user later deletes their custom version, the next launch seeds the default correctly.
- `updateExercise` is intentionally omitted — see comment in `exercises.ts` for the reason.

**Types are designed for backend transition**
All entity types (`Exercise`, `Workout`, `Split`) keep `id: string` as their primary key, even though AsyncStorage is the current backend. When the real backend arrives, every database entity will have a surrogate UUID PK — removing `id` now would need to be fully reversed. Relationships between entities always use ID references (`exerciseId: string` → `Exercise.id`, workout IDs in `Split.days`), never embedded objects or name-based references. Name uniqueness for exercises is enforced as a constraint in `addExercise` (mirroring a future UNIQUE DB constraint) alongside the ID — not as a replacement for it. This means the type definitions closely mirror what a REST API would return, making the transition minimal.

**Cascade delete on split deletion**
Embedded workouts are referenced only by their split. Deleting a split without its embedded workouts creates orphan records. Correct flow: call `deleteWorkoutsByIds(allEmbeddedWorkoutIds)` first, then `deleteSplit`. The `deleteWorkoutsByIds(ids: string[])` helper in workout storage handles batch deletion. Handled inside `SplitCard.handleDeleteSplit` — the component owns its own mutations (see "Inline split editing" below) so the cascade is co-located with the delete action that triggers it.

**Inline split editing — immediate writes, no SplitEditor screen**
Splits are edited inline on the Plan screen via `SplitCard`, not in a dedicated editor screen (fewer taps, more intuitive). Because there is no Cancel/Save screen, every action writes to storage immediately: creating a split (only after a name is confirmed in `NamePromptModal`, so no empty/abandoned splits are ever persisted), renaming, setting active, deleting, and adding/removing a day's workouts. A dedicated `SplitEditor` with a deferred-write buffer (a `PendingDayWorkout` type, an in-memory hand-off module) was designed and then deliberately rejected when the UX moved to inline editing — none of that machinery exists.

**Inline mutations refresh via a single `onChanged` callback**
`SplitCard` and `DayWorkoutList` are "fat components" that own their own storage writes (rename, set active, cascade delete, `addWorkoutToSplit`, `deleteWorkout`) and take one `onChanged` callback — the Plan screen's `load` — which they call after a mutation that doesn't navigate away. This was chosen over passing a fistful of bespoke handler props because the day-level handlers need day context that lives in `DayWorkoutList`; threading them down from the screen through `SplitCard` would be the exact "prop through layers that don't use it" smell from the over-prop rule above. The Plan screen's `load` is lifted to a component-scope `useCallback` so it can serve as both the `useFocusEffect` loader and the `onChanged` prop. (This differs from the navigable editor screens, where the screen does the write on save — a different interaction model.)

**Creating an embedded workout for a day — query-param round-trip via `addWorkoutToSplit`**
"Create new workout" from a day's `WorkoutPicker` navigates to `plan/workout/new?splitId=<id>&day=<day>`. That screen detects the params and, on save, calls `addWorkoutToSplit(splitId, day, { name, exercises })` instead of creating a standalone — a single storage helper in `src/storage/splits.ts` creates the embedded copy (`isStandalone: false`, fresh id) and appends its id to that day. Returning to the Plan screen triggers its `useFocusEffect` reload, so this path needs no `onChanged`. Assigning an *existing* standalone workout to a day uses the same helper with a deep-copied `{ name, exercises }` (fully decoupled copy). `addWorkoutToSplit` takes `splitId` rather than a `Split` object on purpose: it re-reads the freshest stored split before appending (avoiding a stale-snapshot lost update), and the new-workout screen — which only holds the id — doesn't have to re-fetch.

**Pre-joining normalized data — ResolvedX view model pattern**
When a child component needs fields from two normalized entities (e.g., `WorkoutExercise` for sets data + `Exercise` for display data), do not pass two separate props and resolve the join inline in the render loop — that produces O(n²) `.find()` calls. Instead, pre-join in the parent:

1. Build an id → entity `Map` with `useMemo` (O(n), recomputes only when the source list changes).
2. Derive a `ResolvedX[]` array with a second `useMemo` that spreads each base entity and attaches the looked-up related entity (O(n)).
3. Pass the single `resolvedX` prop to the child.

When the same joined shape is consumed by more than one component, define `type ResolvedX = BaseEntity & { relatedEntity: RelatedEntity | undefined }` in `src/types/index.ts`. For a one-off join used in a single spot, a named type is optional.

`ResolvedX` types are **frontend view models only** — they do not correspond to database tables. They represent what the UI needs after joining storage entities. When the real backend arrives, the API may return pre-expanded data that maps directly to this shape, or the join may still happen on the frontend after separate fetches. Either way, the type lives only in the frontend layer.

The `| undefined` on the related entity is intentional — it covers dangling FK references (e.g., a user-created exercise deleted from the catalog while still present in a workout). The child handles this gracefully with a fallback. See `ResolvedWorkoutExercise` in `src/types/index.ts` and `WorkoutEditor` → `WorkoutExerciseCard` for the canonical example.

**Stable identity keys for stateful list rows — `localKey` pattern**

When a list-item component holds local state derived from props (e.g., `PlannedSetRow`'s `minRepsText`/`maxRepsText` buffers, seeded once at mount via `useState` and never re-synced — see `src/components/plan/PlannedSetRow.tsx`), keying the list by array index breaks under insertion, removal, or reorder. React reuses component instances by *position*: removing item 0 shifts items 1..n into slots 0..n-1, but each reused instance keeps its stale local state, which now describes the wrong logical item. The underlying data is correct (verified by saving and reopening) — only the display is wrong, and a row appears to vanish from the wrong end of the list.

Fix: give each item a stable, client-generated `localKey` (via `uuid()`) and key the list by it instead of by array index, so each component instance stays bound to the same logical item across any reordering operation. `localKey` is a render-only identity — generated when editor state is seeded or created, and stripped before the data reaches storage, so persisted entities keep their canonical `{ minReps, maxReps }` shape.

This is implemented via frontend-only view models — `EditablePlannedSet`, `EditableWorkoutExercise`, and `ResolvedEditableWorkoutExercise` in `src/types/index.ts` — following the exact "frontend view model, no DB counterpart" framing as `ResolvedWorkoutExercise` above (do not add `localKey` directly to `PlannedSet`; that would blur the "types mirror the backend shape" contract — see Types are designed for backend transition below). See `WorkoutEditor` → `WorkoutExerciseCard` → `PlannedSetRow` for the canonical example. The session view (`EditableLoggedSet` → `EditableSessionExercise` → `ResolvedEditableSessionExercise`) follows the exact same pattern for Iteration 2.

**PlannedSet vs LoggedSet — plan template vs runtime record**
`PlannedSet` (`minReps`, `maxReps`) belongs to the plan layer and lives on `WorkoutExercise`. It is a rep-range target, set when building a workout template, never modified during a session. `LoggedSet` (`weight`, `reps`) belongs to the session layer and lives on `SessionExercise`. It is what the user actually lifted. The two must never be conflated: load is a runtime value and has no place in the plan schema.

When a session is seeded from a plan, each `PlannedSet` becomes an `EditableLoggedSet` (blank `weight: 0, reps: 0`) carrying the planned range as optional `targetMinReps`/`targetMaxReps` hint fields for the session UI. These hint fields are frontend view-model only — stripped by `stripToCanonicalExercises` before any write to storage.

**Rep-range input validation (WorkoutEditor) — two layers**
Planned-set rep inputs are validated in two complementary layers (phase 1 of 2; the live-session cousin — `LoggedSetRow` + `isLoggedSetValid` — has since landed as phase 2, reusing the same constant and highlight pattern; see "Logged-set input validation (WorkoutSession)" below):

- **Sanitise at input** — `PlannedSetRow` routes every keystroke through `sanitizeReps` (strip to **digits-only**) plus `maxLength={3}`. This makes negatives, decimals, and pasted non-digits impossible *by construction* — not merely blocked by the `number-pad` keyboard (which was fragile: paste/external keyboards bypassed it) — and keeps the displayed text in lockstep with the emitted number. The input layer deliberately does **only** character-class sanitisation; it does **not** clamp magnitude. A too-large value (e.g. `101`) is a legitimate integer the user typed, so — like `low > high` — it is surfaced as a save-time highlighted error, not silently rewritten to `100`.
- **Validate + highlight at save** — `WorkoutEditor.handleSave` blocks the write via `isPlannedSetValid` (`src/utils/workout.ts`: both reps whole numbers in `[1, MAX_REPS]` (the `MAX_REPS` cap from `src/constants/inputLimits.ts` lives here as its single enforcement point) and `minReps <= maxReps`; **`minReps === maxReps` stays valid** — the fixed-rep target). On a blocked save it flips a `showErrors` flag; a `useMemo` then derives `invalidSetKeys` (a `Set` of offending `localKey`s) from live state and passes it down so each `PlannedSetRow` tints red (`hasError` → `colors.dark.error`/`errorSubtle`). Because the set recomputes from `workoutExercises`, the red **clears live** as rows are fixed. The predicate is the single source of truth for both the blocking check and the per-row highlight.

**Logged-set input validation (WorkoutSession) — the session cousin**
The live session mirrors the WorkoutEditor two-layer pattern above, with two deliberate differences: reps are an **absolute count** (not a range), and load allows **decimals**.

- **Sanitise at input** (`LoggedSetRow`) — reps route through `sanitizeReps` (digits-only, `maxLength={3}`), identical to `PlannedSetRow`. Load routes through `sanitizeWeight` (digits + at most one decimal point, e.g. `53.75`, `maxLength={6}`), keeping a trailing `"53."` so mid-typing works. As on the plan side, the input layer does **only** character-class sanitisation — it never clamps magnitude; the `MAX_WEIGHT`/`MAX_REPS` caps are save-time errors.
- **Validate + highlight at finish** — `WorkoutSession.handleFinish` blocks the write via `isLoggedSetValid` (`src/utils/session.ts`, the session-domain sibling of `isPlannedSetValid`): `reps` a whole number in `[1, MAX_REPS]` and `weight` a non-negative number in `[0, MAX_WEIGHT]` (`MAX_WEIGHT` added to `src/constants/inputLimits.ts` beside `MAX_REPS`). It flips a `showErrors` flag; a `useMemo` derives `invalidSetKeys` (offending `localKey`s) from live session state and threads it through `SessionExerciseCard` so each `LoggedSetRow` tints red (`hasError` → `colors.dark.error`/`errorSubtle`), clearing live as rows are fixed — the same machinery as the editor. `handleFinish` also blocks a **0-exercise** session, and `finishActiveSession` trims the session name before writing to history.
- A newly added set starts **blank** (`weight: 0, reps: 0`), not copied from the previous set — loads/reps commonly change set to set in a live session, and a blank set stays invalid (`reps 0`) so it can't be Finished unperformed.

**Blank load persists as 0 — "lazy" bodyweight logging is allowed (accepted tradeoff)**
`isLoggedSetValid` intentionally accepts `weight === 0` (only `reps` must be ≥ 1), so leaving the load field untouched saves the set with `weight: 0`. That `0` is the model's **initial value**, not the placeholder — the grey `"0"` placeholder is a visual hint shown when the buffer is empty and is never itself a value; an untouched field simply never fires `onChange`, so the seeded `0` persists. The tradeoff: `weight 0` is **ambiguous** — it can mean a genuine bodyweight exercise (pull-ups, dips) *or* a forgotten entry, and the app can't distinguish them because an `Exercise` carries no bodyweight/weighted distinction (only `name` + `muscleGroup`). This is accepted deliberately: fast live logging outweighs the ambiguity, which is currently low-harm (nothing consumes load quantitatively yet — the descoped 1RM/PR work would have been the first). The clean long-term fix is a future `isBodyweight`/`loadType` flag on `Exercise` (Iteration 5/6 scope, alongside the units preference): a bodyweight exercise would hide/skip the load field and treat `0` as meaningful, while a weighted exercise would require `weight > 0` and block a blank field the way `reps 0` already does. Do **not** enforce `weight > 0` before that flag exists — it would make bodyweight exercises unloggable.

**Session storage — two AsyncStorage keys**
`@quietrep/activeSession` holds the single in-progress session buffer (a canonical `WorkoutSession` with `finishedAt: null`). `@quietrep/sessions` holds the array of completed sessions (newest-first), used by the History tab in Iteration 3. The active buffer is always written with view-model fields stripped — only the context layer (`ActiveSessionContext`, Iteration 2 Step 2) performs that strip before calling `setActiveSession`. `finishSession` stamps `finishedAt`, prepends to history, and clears the active key atomically.

**Derived reads live behind storage endpoint mirrors — pure aggregation utils underneath**
When the UI needs *derived* history data (aggregations/filters over sessions), the read is exposed as a storage function that mirrors the future REST endpoint — `getExerciseHistorySummaries()` (`GET /exercises/history-summary`) and `getExercisePerformances(exerciseId)` (`GET /exercises/:id/performances`) in `src/storage/sessions.ts`. Internally each reads the raw data and delegates to a **pure util** in `src/utils/sessionStats.ts` (`summarizeExerciseHistory`, `collectExercisePerformances`) — today's client-side stand-ins for the `GROUP BY` / `WHERE` queries a backend database would run. Components call **only the storage wrappers, never the utils**, so at backend transition only the wrapper internals change (read-all-and-compute → one fetch) and no component is touched. Naming rule that encodes the layering: `get*` signals a storage read; the pure utils use `summarize*`/`collect*` instead.

The same principle draws the line for **single-entity lookups**: a component may join or derive view models from collections it legitimately consumes wholesale (e.g. the full exercise catalog for a picker, or an `exerciseMap` join per the ResolvedX pattern), but it must **not scan a collection to emulate a more specific endpoint** — a `.find`-by-id over `getAllExercises()` is a `GET /exercises/:id` in disguise and belongs in storage (`getExerciseById`, sibling of `getSessionById`).

**`src/utils/` is organised by concern, not one file per feature**
The session-related utilities live in three cohesive files rather than one grab-bag (they were split out of an original monolithic `session.ts`):

- `src/utils/session.ts` — session **lifecycle transforms** between the canonical and editable view-model shapes: `seedSessionExercises`, `stripToCanonicalExercises`, `hydrateSessionExercises`, `toCanonicalSession` (plus the private set-level helpers). Tightly coupled to the `Editable*` session types.
- `src/utils/datetime.ts` — pure **date/time formatting**, domain-agnostic over ISO strings: `getTodayKey`, `formatElapsed`, `formatSessionDate`, `formatSessionDuration`, `formatTotalDuration` (the private `msToHoursMinutes` is shared by the two duration formatters). Consumed across the session, History, and Home surfaces — which is exactly why it is not under `session.ts`.
- `src/utils/sessionStats.ts` — pure **derived-read aggregations** over session history (the `summarize*`/`collect*` stand-ins behind the storage endpoint mirrors): `summarizeExerciseHistory`, `collectExercisePerformances`, `summarizeMonth`, `summarizeAllMonths` (private `buildMonthlyStatsEntry`). See "Derived reads live behind storage endpoint mirrors" above.

The other util files are per-domain helpers: `split.ts`, `workout.ts`, `search.ts`. Dependencies stay **acyclic** — `datetime.ts`, `session.ts`, and `sessionStats.ts` import only from `@/types` and `@/constants` (a leaf module with no util deps); no util imports another util. (`session.ts` imports `MAX_REPS`/`MAX_WEIGHT` for `isLoggedSetValid`, mirroring `workout.ts`'s `isPlannedSetValid`.) (Earlier iteration-log entries in this file reference `src/utils/session.ts` for functions such as `formatElapsed`, `formatSessionDate`, `formatSessionDuration`, `summarizeExerciseHistory`, and `collectExercisePerformances` that now live in `datetime.ts` or `sessionStats.ts` — those mentions are a historical record, mirroring the components-reorg note above.)

**ActiveSessionContext — React Context as subscription layer over AsyncStorage**
AsyncStorage has no subscriptions: when one component writes, nothing else is notified. `ActiveSessionContext` solves this by holding the live session in React state — updating the provider's state re-renders all `useActiveSession()` consumers (session screen, resume banner) automatically. No component ever reads `@quietrep/activeSession` from AsyncStorage directly; all reads and mutations go through the four context actions.

`SessionBuffer` (the in-memory working shape) is defined and exported from the context file, not from `src/types/index.ts`. It is a context-state shape (a UI concern), not a data-model type — it belongs with the context that owns it. Components that need to reference it import from `@/context/ActiveSessionContext`.

`updateActiveSession` uses a `latestSessionRef` (kept in sync with state via a `useEffect`) so the 500ms debounced timeout closure always writes the freshest session. `debounceTimer` is a `useRef` (not state) because changing a timer ID must not trigger re-renders.

Backend transition: the four-action API surface (`startSession` / `updateActiveSession` / `finishActiveSession` / `discardActiveSession`) is the stable contract for all consumers. When the real backend arrives, only the internals of `ActiveSessionProvider` change (storage calls → API calls); the session screen, resume banner, and FAB menu change nothing.

**Scalar preferences own their AsyncStorage key directly — no settings object, no storage file (for now)**
A single-scalar user preference (theme mode, weight unit) is held by its own provider, which reads and writes its own AsyncStorage key inline as a **bare string** (no `JSON.stringify`/`parse` — the `activeSplit` pattern, not the `activeSession` one). It does **not** get a `src/storage/*.ts` module and is **not** folded into a shared `AppSettings` object. `ThemeContext` set this precedent (`@quietrep/themeMode`) and `UnitContext` follows it (`@quietrep/weightUnit`).

Why this differs from the entity storage layer: `src/storage/` exists to mirror future REST endpoints for *domain data* (exercises, workouts, splits, sessions), so a storage module is a **seam** standing in for an endpoint. There is no preferences endpoint today, so a `getSettings()`/`updateSettings(partial)` module would be a seam with nothing on the far side — a file, a type, JSON serialisation, a defaults-merge and a read-modify-write API, all to express `AsyncStorage.getItem(KEY)`. It would also *lose* safety: `JSON.parse` returns `any`, so the settings object would be trusted-but-unchecked, whereas the inline read narrows the union at the point of the read (`if (stored === 'kg' || stored === 'lbs')`).

This defers the backend question rather than settling it. Where a preference lives today is orthogonal to whether it eventually syncs: the **provider is the abstraction boundary**, so `AsyncStorage.getItem` → `GET /me/preferences` and `setItem` → `PATCH /me/preferences` changes provider internals only, and every `useUnit()`/`useTheme()` consumer is untouched — the same property `ActiveSessionContext`'s four-action surface has. If such an endpoint ever appears, a settings object becomes the *correct* shape and a `src/storage/preferences.ts` mirroring it follows the normal rule; the objection here is to building the wrapper before the thing it wraps exists, not to the shape itself.

Expect the two preferences to diverge when that day comes. Theme is plausibly device-local forever (dark on a phone, light on a tablet — syncing it would be a misfeature); units are plausibly account-level. Note also that syncing units is a convenience, not a correctness requirement: every session carries its own `unit`, so history is self-describing and renders correctly on a fresh device regardless of whether the setting travelled with it.

The provider template is fixed: own key constant + `DEFAULT_*`, hydrate-once `useEffect` (with the "a provider has no navigation focus lifecycle" comment), union-validate before `setState`, `useCallback`'d setter that sets state then fire-and-forget persists, `useMemo`'d value, throw-outside-provider hook. Copy it for the next scalar preference. A preference that grows into a *collection* (bodyweight entries, Step 3) is domain data and does get a storage file.

**Context value memoisation — memoise, but be honest about what it buys**
Every context provider wraps its `value` in a `useMemo`, and every function in that value is `useCallback`'d so it can be listed in the deps. React compares the `value` prop by **reference identity** (`Object.is`), not contents, so an inline `{ ... }` object is a new reference on every provider render and re-renders every consumer — with no field-level granularity (a consumer reading only `setUnit` still re-renders when `unit` changes) and **bypassing `React.memo`** entirely, which is the same mechanism that makes memoised rows repaint on a theme toggle.

The honest caveat, recorded because it looks like the memos are doing more than they are: **a memo only pays off if the provider can re-render while its underlying data is unchanged.** `ThemeProvider` and `UnitProvider` currently have exactly one re-render trigger each — their own `mode`/`unit` state — because they consume no context and `RootLayout` holds no state (and a `ThemeProvider` re-render does not reach `UnitProvider`: `children` is the same element object created by `RootLayout`, so React bails out before descending). Every render they experience therefore also invalidates every dep, and the memos skip no work today.

`ActiveSessionContext` deliberately has **no** value memo, and it is worth being precise about why, because it is *not* quite the same case. Since it consumes `useUnit()` (to stamp `startSession`), so it genuinely does have a second re-render trigger: a unit change re-renders it while `activeSession` is untouched — exactly the situation where a memo would normally pay off. It still would not help here, because `startSession` closes over `unit`, so a `useCallback`'d version would invalidate on precisely those renders anyway; the other three actions close over `activeSession` and invalidate whenever that changes. Every path that re-renders this provider also invalidates something in the value, so the memo would skip nothing while costing four `useCallback`s. The re-render is also free in practice: `unit` can only change from Profile, which is disabled while a session is live, so at that moment `activeSession` is `null` and every consumer renders nothing or near-nothing.

The memos are kept in the two preference providers anyway, as insurance that costs a line: the moment either gains a second piece of state (a `'system'` theme mode, a hydration flag), renders decouple from the data and the memos become load-bearing immediately. The rule going forward: **memoise the value and `useCallback` the setters, and never silently omit a recreated function from the dep array** — a setter left out of the deps means the memo holds a stale closure, which is harmless only while that function reads no state and is a real trap the moment it does.

**Session survives app close + reopen — already achieved**
A live session persists across a full app kill and relaunch; this is done, not pending. The mechanism: every mutation debounce-persists the active buffer to `@quietrep/activeSession`, and on cold launch `ActiveSessionProvider` hydrates from `getActiveSession()` in a mount-once `useEffect`, running the stored exercises through `hydrateSessionExercises` to re-attach fresh `localKey`s (which are stripped before every write). So relaunching mid-session restores the buffer into context, and because every consumer subscribes via `useActiveSession()`, the resume banner reappears automatically across the tabs. Note the last <500ms of edits before a hard kill can be lost to the debounce window — an accepted trade-off for not hammering storage on every keystroke; `startSession` deliberately awaits its first persist so a session started and immediately killed is still recoverable.

**Additive type intersections — plan and session view-model chains**
Both the plan-editor and session view-model type chains are built purely by adding fields, never by subtracting them (no `Omit` used to remove a field from a "bigger" type):
- Plan: `PlannedSet` → `EditablePlannedSet` (adds `localKey`) → `EditableWorkoutExercise` (replaces `sets`) → `ResolvedEditableWorkoutExercise` (adds `exercise` join)
- Session: `LoggedSet` → `EditableLoggedSet` (adds `localKey` + target hints) → `EditableSessionExercise` (replaces `sets`) → `ResolvedEditableSessionExercise` (adds `exercise` join)

## Code Rules — Must Follow in Every Generation

### Naming

- No single-letter or abbreviated variable names. For example, `s, w, e, a` are forbidden. Use `splits, workouts, exercises, activeSplitId` instead.
- Every variable name must clearly communicate its purpose to the reader

### Comments

- Comments are welcome and encouraged — but make sure they are concise and value-adding
- Do not delete or suggest removing comments during cleanup or code generation, unless they are extremely verbose and add no value whatsoever
- "Self-documenting code" here means well-chosen variable and function names, not the absence of comments

### Styles

- Always use the shared style tokens first. Only create inline styles or a local `StyleSheet` entry if no token covers it
- Never hardcode color hex values, font sizes, spacing numbers, or layout patterns inline
- **Colour-bearing tokens are theme-reactive (see "Theming" in Key Design Decisions):** read `colors`, `layout`, `typography`, `picker` from `const { ... } = useTheme()` (`@/context/ThemeContext`), **not** from `@/styles`. Only the colour-free `spacing` and `radius` are imported from `@/styles`. A colour-bearing local `StyleSheet` becomes a module-level `makeStyles(colors: Palette)` factory consumed via `useMemo(() => makeStyles(colors), [colors])`; colour-free local StyleSheets stay static
- `StyleSheet.create` runs at module load time — never put runtime values like `useSafeAreaInsets` inside it. Apply those inline
- State treatments have shared tokens — `layout.pressedButton` (0.6), `layout.pressedCard` (0.75), `layout.disabled` (0.4). Compose them into a style array (`isDisabled && layout.disabled`); never re-declare an `opacity` for these states locally

### TypeScript

- `interface` for component props
- `type` for unions and aliases

### Imports

| Hook                   | Import from |
| ---------------------- | ----------- |
| `useState`             | react       |
| `useEffect`            | react       |
| `useCallback`          | react       |
| `useMemo`              | react       |
| `useRef`               | react       |
| `useFocusEffect`       | expo-router |
| `useRouter`            | expo-router |
| `useLocalSearchParams` | expo-router |

### Components

- Use abstraction — split into child components, do not generate monolithic files
- Each component in its own file
- Follow the existing pattern: SectionHeader, WorkoutCard, SplitCard, PlannedSetRow, ExercisePicker are all good examples of the right level of abstraction
- `src/components/` is split into four subdirectories:
  - `plan/` — components owned by the Plan tab: DayCircle, DayWorkoutList, PlannedSetRow, SplitCard, WorkoutEditor, WorkoutExerciseCard, WorkoutPicker
  - `session/` — components owned by the live session flow: WorkoutFabMenu, WorkoutSession, SessionExerciseCard, LoggedSetRow, ResumeSessionBanner
  - `history/` — components owned by the History tab, split into one subdirectory per lens: `byWorkout/` (PastSessionsList, PastSessionCard, SessionDetail, ReadOnlySessionExerciseCard) and `byExercise/` (PastExercisesList, PastExerciseCard, ExerciseHistory, ExercisePerformanceCard)
  - `home/` — components owned by the Home tab: StatTile, MonthlyStatsCard, RecentWorkouts
  - `shared/` — cross-tab primitives and components expected to be reused across tabs: EditorHeader, ExercisePicker, ListEmptyText, NamePromptModal, PickerModal, SectionHeader, SegmentedControl, TabBar, WorkoutCard

### Code generation

- Never mutate arrays or objects directly — always spread to produce new copies (important!)
- All async functions inside `useEffect` or `useFocusEffect` must be defined inside the callback and called immediately, not passed directly

### Storage

- `addX` functions take `Omit<X, "id">` — never pass an id manually

### Performance — Large Lists

For any `FlatList` or `SectionList` rendering more than ~20 items, apply this memoisation chain to prevent every item re-rendering on every parent re-render:

1. **`memo` on the item component** — bails out of re-render when all props are the same reference
2. **`useCallback` on `renderItem` / `renderSectionHeader`** — keeps the function reference stable so `memo` can do its job; deps are the handlers passed into it
3. **`useCallback` on handlers passed as item props** — e.g. `onDelete`; a new function reference here means `memo` always sees changed props and never bails out
4. **`useMemo` on derived list data** — e.g. filtered/grouped arrays; avoids recomputing on renders unrelated to search or data changes
5. **Id-based callback props** — type item handler props as `(id: string) => void` rather than `() => void`; this lets `renderItem` pass the stable handler directly instead of wrapping it in a per-item arrow (`() => handleDelete(item.id)`), which would be a new reference every render
6. **Stabilise all deps of `renderItem`'s `useCallback` at the parent** — any value used inside `renderItem` (e.g. a `Set` for deduplication like `alreadyAddedIds`) must itself be `useMemo`-wrapped at the parent level; a plain `new Set(...)` creates a new reference every render, causing `renderItem` to recompute on every parent render regardless of whether the data changed
7. **Pass primitive item props, not the whole entity object** — when storage reloads return a fresh array of new object references (after create/delete), `memo`'s shallow compare sees a new reference for every row and re-renders all of them. Pass only the primitive fields the row needs (e.g. `id: string`, `name: string`, `isDefault: boolean` instead of `exercise: Exercise`) so unchanged rows bail out via value equality, not reference equality. Only the changed row re-renders.
8. **Set `windowSize` to cap the render tree** — the default `windowSize: 21` keeps 10 viewport-heights of content rendered above and below the visible area. For a ~100-item list this means the entire list stays in the render tree, requiring ~100 memo checks per update. `windowSize={5}` (2 viewport-heights of buffer each side) cuts this to ~20–30 items without causing blank cells during normal browse/search use.

See `plan/exercise/index.tsx` for the canonical example of this pattern.

## How to Behave

- Always read this file at the start of every session before doing anything
- Before building a new step, read the relevant existing components to understand current patterns
- Before building a new step, always plan and confirm with me the plan first, before making any writes.
- If uncertain about scope or approach, ask before acting.
- After completing a task, briefly summarise what was created or changed and flag anything that needs attention
- When uncertain between two valid approaches, pick the one most consistent with existing code in the project

---

## Technical Notes

- `@/` alias points to `src/` via `tsconfig.json`
- `react-native-get-random-values` must be the absolute first import in `src/app/_layout.tsx`
- Expo Router typed routes are enabled — all route files must exist before navigating to them
- Never use `sudo` with npm
