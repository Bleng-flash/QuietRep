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
Iteration 1 is complete, **iteration 2 is complete** (all six steps done), and **iteration 3 is complete**. The table below details the progress within iteration 2.
| Step | Feature | Status |
| ---- | ----------------------------------------------------------------------- | ----------- |
| 1 | Session types, storage (`sessions.ts`), and utils (`session.ts`) | Done |
| 2 | Active-session context (`ActiveSessionContext`) | Done |
| 3 | Session screen + components (`WorkoutSession`, `SessionExerciseCard`, `LoggedSetRow`) | Done |
| 4 | FAB bottom-sheet menu + three start-session entry points | Done |
| 5 | Cross-tab resume banner | Done |
| 6 | Polish — empty states, confirm dialogs, elapsed timer | Done |

## Current State

Iteration 1 is complete, Iteration 2 is complete (Steps 1-6 done), and Iteration 3 is complete. The following is fully functional:

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

- `src/components/session/LoggedSetRow.tsx` — mirrors `SetRow` for weight/reps logging; local `weightText`/`repsText` buffers; `buildRepsPlaceholder` uses `targetMinReps`/`targetMaxReps` as input placeholder hint; `onChange` emits `LoggedSet` (caller spreads to preserve `localKey`)
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

## Next steps

**Iteration 3 is complete.** Next up is **Iteration 4 (Home tab)**, which consumes the history built here (active split, session history, per-exercise progression).

**Descoped — possible future improvements (not planned features):**
- **PRs section (PR detection + 1RM estimation)** — originally scoped for Iteration 3, deliberately dropped in favour of the By-exercise progression view (the honest no-estimation alternative). If ever revisited: the 1RM estimate must be a single swappable function (e.g. `estimateOneRepMax(weight, reps)`), with the formula choice (Epley/Brzycki/…) surfaced as a Profile-tab user preference.
- **Per-exercise load/rep charts** — a visual layer on top of the existing By-exercise lens and its `ExercisePerformance` data.

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

**Shared screens live on the root stack**
The navigator tree is a root `<Stack>` (`src/app/_layout.tsx`) holding the `(tabs)` tab navigator and root-level screens (`session`, `exercise/new`). The **Plan** tab is itself a nested `<Stack>` (`(tabs)/plan/_layout.tsx`). The rule for where a route file belongs:

> A screen lives at the **lowest navigator that can reach all its entry points.** Reached from one tab only → keep it in that tab's stack (tab bar stays visible; e.g. `WorkoutEditor` at `plan/workout/*`, the exercise library at `plan/exercise/`). Reached from **multiple tabs, or from a root screen like the live session** → put it on the **root** stack as a single route everyone pushes.

`exercise/new` is the canonical example: it is reached from the Plan tab (library "+", WorkoutEditor's `ExercisePicker`) **and** from the root-level session's `ExercisePicker`, so it lives at `src/app/exercise/new.tsx` (root), not `(tabs)/plan/exercise/new.tsx`. Every caller pushes the same `/exercise/new`; no destination prop required.

Why: pushing a *tabs-nested* route from the root `/session` screen is a **cross-navigator push** — React Navigation dives into the tabs navigator and orphans the pushed screen on the Plan tab's stack (its back-relationship is with the root history, not the Plan index), so `router.back()` misfires and the screen gets stuck there permanently, surviving even finishing the session. Promoting the screen to the root stack makes every push same-navigator: from a tab it opens over the tab bar (the standard "screen over the tabs" pattern) and back returns exactly where you were; from the session it is a clean sibling push back to `/session`.

Tradeoff: a root screen sits **above** the tab bar, so it cannot show it — exercise creation from the Plan tab is now a focused full-screen (like the session), while `WorkoutEditor` (tab-local) keeps the tab bar. This is the intended pattern for future cross-navigator screens too (e.g. a session-detail view reachable from both History and Home, a workout-detail view reachable from both Plan and Home) — one root route each, no per-navigator duplication.

Consequence — **a promoted screen must paint its own background.** The Plan stack's `_layout.tsx` sets `contentStyle: { backgroundColor: colors.dark.background }`, so any screen *under* the Plan stack inherits a dark background for free. The root `<Stack>` sets **no** `contentStyle`, so a screen moved to the root renders on the default (white) background unless it paints its own. Every root-level screen must therefore apply `layout.screen` (`{ flex: 1, backgroundColor: colors.dark.background }`) to its own root view — as `WorkoutSession` and `exercise/new` do. (This surfaced as a white-flash bug the moment `exercise/new` was promoted to the root and lost the inherited Plan-stack background.) The root `contentStyle` is deliberately left unset for now rather than hardcoding a base colour there — see "Theming is a future colour-consumption refactor" below.

**Theming is a future colour-consumption refactor (single global theme, whole app switches at once)**
The app is single-theme dark today: components read a fixed palette via `import { colors } from '@/styles'` → `colors.dark.*`, and `StyleSheet.create` bakes those values in at module load. A planned **dark/light toggle** — with possibly multiple variants per mode, switching the **entire app at once** (never per-route) — is therefore **not a colour-values task but a colour-consumption refactor**: static import → reactive source. Nothing re-runs on a runtime toggle while colours are static reads, so this is deferred and done as **one focused pass** (Iteration 5, alongside the units preference — the same "global preference propagated everywhere" shape). A half-migrated theme is the worst state: components still holding static `colors.dark` won't repaint, so the app looks broken mid-switch. Intended shape when built:

- A root **`ThemeProvider`** (beside `ActiveSessionProvider` in `src/app/_layout.tsx`) holds the active theme, persists the choice to AsyncStorage, and exposes `{ colors, mode }` via a `useTheme()` hook.
- A **theme registry** expresses mode × variant: every palette has an identical key set (`background`, `surface`, `text`, `primary`, …). Today's `colors.dark` and `colors.darkPurple` are the seed of this.
- Colour-referencing `StyleSheet.create` blocks migrate to `useMemo(() => StyleSheet.create(...), [colors])` (or a `makeStyles(theme)` helper) so styles rebuild on toggle.
- The **app base background moves to the root `<Stack>` `contentStyle`, driven reactively by `useTheme()`** — so a toggle repaints the base in one place. This is why the root `contentStyle` is deliberately **not** hardcoded now (see "Shared screens live on the root stack"): a static `colors.dark.background` there would just be one more static reference to convert, and current root screens already own their background via `layout.screen`.

Until then, the existing Styles rules stand: import the static `colors` from `@/styles`, no inline hex. Those references become the migration surface when theming lands — do not pre-emptively scatter half-measures.

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

When a list-item component holds local state derived from props (e.g., `SetRow`'s `minRepsText`/`maxRepsText` buffers, seeded once at mount via `useState` and never re-synced — see `src/components/plan/SetRow.tsx`), keying the list by array index breaks under insertion, removal, or reorder. React reuses component instances by *position*: removing item 0 shifts items 1..n into slots 0..n-1, but each reused instance keeps its stale local state, which now describes the wrong logical item. The underlying data is correct (verified by saving and reopening) — only the display is wrong, and a row appears to vanish from the wrong end of the list.

Fix: give each item a stable, client-generated `localKey` (via `uuid()`) and key the list by it instead of by array index, so each component instance stays bound to the same logical item across any reordering operation. `localKey` is a render-only identity — generated when editor state is seeded or created, and stripped before the data reaches storage, so persisted entities keep their canonical `{ minReps, maxReps }` shape.

This is implemented via frontend-only view models — `EditablePlannedSet`, `EditableWorkoutExercise`, and `ResolvedEditableWorkoutExercise` in `src/types/index.ts` — following the exact "frontend view model, no DB counterpart" framing as `ResolvedWorkoutExercise` above (do not add `localKey` directly to `PlannedSet`; that would blur the "types mirror the backend shape" contract — see Types are designed for backend transition below). See `WorkoutEditor` → `WorkoutExerciseCard` → `SetRow` for the canonical example. The session view (`EditableLoggedSet` → `EditableSessionExercise` → `ResolvedEditableSessionExercise`) follows the exact same pattern for Iteration 2.

**PlannedSet vs LoggedSet — plan template vs runtime record**
`PlannedSet` (`minReps`, `maxReps`) belongs to the plan layer and lives on `WorkoutExercise`. It is a rep-range target, set when building a workout template, never modified during a session. `LoggedSet` (`weight`, `reps`) belongs to the session layer and lives on `SessionExercise`. It is what the user actually lifted. The two must never be conflated: load is a runtime value and has no place in the plan schema.

When a session is seeded from a plan, each `PlannedSet` becomes an `EditableLoggedSet` (blank `weight: 0, reps: 0`) carrying the planned range as optional `targetMinReps`/`targetMaxReps` hint fields for the session UI. These hint fields are frontend view-model only — stripped by `stripToCanonicalExercises` before any write to storage.

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

The other util files are per-domain helpers: `split.ts`, `workout.ts`, `search.ts`. Dependencies stay **acyclic** — `datetime.ts`, `session.ts`, and `sessionStats.ts` each import only from `@/types`; no util imports another util. (Earlier iteration-log entries in this file reference `src/utils/session.ts` for functions such as `formatElapsed`, `formatSessionDate`, `formatSessionDuration`, `summarizeExerciseHistory`, and `collectExercisePerformances` that now live in `datetime.ts` or `sessionStats.ts` — those mentions are a historical record, mirroring the components-reorg note above.)

**ActiveSessionContext — React Context as subscription layer over AsyncStorage**
AsyncStorage has no subscriptions: when one component writes, nothing else is notified. `ActiveSessionContext` solves this by holding the live session in React state — updating the provider's state re-renders all `useActiveSession()` consumers (session screen, resume banner) automatically. No component ever reads `@quietrep/activeSession` from AsyncStorage directly; all reads and mutations go through the four context actions.

`SessionBuffer` (the in-memory working shape) is defined and exported from the context file, not from `src/types/index.ts`. It is a context-state shape (a UI concern), not a data-model type — it belongs with the context that owns it. Components that need to reference it import from `@/context/ActiveSessionContext`.

`updateActiveSession` uses a `latestSessionRef` (kept in sync with state via a `useEffect`) so the 500ms debounced timeout closure always writes the freshest session. `debounceTimer` is a `useRef` (not state) because changing a timer ID must not trigger re-renders.

Backend transition: the four-action API surface (`startSession` / `updateActiveSession` / `finishActiveSession` / `discardActiveSession`) is the stable contract for all consumers. When the real backend arrives, only the internals of `ActiveSessionProvider` change (storage calls → API calls); the session screen, resume banner, and FAB menu change nothing.

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

- Always use global styles from `@/styles` first. Only create inline styles or a local `StyleSheet` entry if no global token covers it
- Never hardcode color hex values, font sizes, spacing numbers, or layout patterns inline
- Single import for all styles: `import { colors, layout, spacing, typography } from "@/styles"` — never import from individual style files like `@/styles/colors`
- `StyleSheet.create` runs at module load time — never put runtime values like `useSafeAreaInsets` inside it. Apply those inline

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
- Follow the existing pattern: SectionHeader, WorkoutCard, SplitCard, SetRow, ExercisePicker are all good examples of the right level of abstraction
- `src/components/` is split into four subdirectories:
  - `plan/` — components owned by the Plan tab: DayCircle, DayWorkoutList, EditorHeader, SetRow, SplitCard, WorkoutEditor, WorkoutExerciseCard, WorkoutPicker
  - `session/` — components owned by the live session flow: WorkoutFabMenu, WorkoutSession, SessionExerciseCard, LoggedSetRow, ResumeSessionBanner
  - `history/` — components owned by the History tab, split into one subdirectory per lens: `byWorkout/` (PastSessionsList, PastSessionCard, SessionDetail, ReadOnlySessionExerciseCard) and `byExercise/` (PastExercisesList, PastExerciseCard, ExerciseHistory, ExercisePerformanceCard)
  - `shared/` — cross-tab primitives and components expected to be reused across tabs: ExercisePicker, ListEmptyText, NamePromptModal, PickerModal, SectionHeader, SegmentedControl, TabBar, WorkoutCard

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
