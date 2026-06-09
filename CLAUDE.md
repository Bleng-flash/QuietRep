# QuietRep — CLAUDE.md

## What is QuietRep

A dark-mode-only gym workout logger mobile app built with React Native and Expo (Expo Router, EAS). Users create a library of exercises, build workout templates, organise them into weekly splits, and log live workout sessions.

## Overall Iteration Plan

We will build the frontend first, using a local storage with React's AsyncStorage as the temporary makeshift backend.

Iteration sequence for the frontend:

- Iteration 1: Data model + Plan tab \
  Get the storage schema right first. Define and implement the local storage layer for exercises, workouts, and splits. Build the full Plan tab — all three sections (Exercises, Workouts, Splits) with create, edit, delete, and active split selection. No home screen context, no session, no log yet — just the ability to build out your gym plan in full.
- Iteration 2: Start workout session \
  Build the FAB flow and full session view. Bottom sheet entry point, the three start options, the in-session exercise/set/rep logging, mid-session modifications (reorder, swap, add, remove), and the finish + save to history. The persistent in-progress banner across tabs. At the end of this iteration the core loop — plan a workout, execute it, save it — is fully functional.
- Iteration 3: Log tab \
  Build the Past Workouts list pulling from saved session history. Session detail view. PR detection and the PRs section, calculated from the history built up in iteration 2.
- Iteration 4: Home tab \
  Now that all the data exists (active split, session history, PRs), the home screen can be built meaningfully. Today's workout card, the start CTA, the monthly dashboard, and the recent workouts strip.
- Iteration 5: Profile tab \
  Bodyweight log, units preference (propagated back through earlier screens), rest timer settings wired into the session view, 1RM formula preference, data export. Polish pass on everything.
- Iteration 6: Polish + predefined content \
  Predefined exercise library. Animations and transitions. Empty state illustrations. Onboarding flow for first-time users. Any UX rough edges surfaced from using the app.

\
Now, we are in iteration 1. The table below details our progress within iteration 1.
| Step | Feature | Status |
| ---- | ----------------------------------------------------------------------- | ----------- |
| 1 | Project setup, global styles, color system, spacing, typography, layout | Done |
| 2 | Data model and types | Done |
| 3 | Storage layer (AsyncStorage) | Done |
| 4 | Root layout, tab bar, default exercise seeding | Done |
| 5 | Shared components — DayCircle, SectionHeader, WorkoutCard, SplitCard | Done |
| 6 | Plan index screen | Done |
| 7 | WorkoutEditor — create and edit workouts | Done |
| 8 | Split section — inline split create/edit/delete on the Plan screen | Done |
| 9 | Exercise screens — new exercise, view all exercises | Done |

## Current State

Steps 1–9 are complete — **iteration 1 is feature-complete**. The following is fully functional:

- Plan index screen with Splits, Workouts, and Exercises sections
- Full WorkoutEditor flow — create and edit workouts, add/remove/reorder exercises, configure sets and reps, exercise picker modal with live search
- All storage operations for exercises, workouts, splits, and active split
- 97 default exercises seeded on first launch via `seedDefaultExercises` in `src/storage/exercises.ts`
- Safe area insets applied correctly throughout
- `darkGreen` color theme added to `src/styles/colors.ts` alongside `dark` (purple)

**New in Step 9:**

- `plan/exercise/index.tsx` — full exercise catalog grouped by muscle group via `SectionList`, with live search (collapses empty sections), delete button on user-created exercises (with confirmation Alert), and a "Create new exercise" footer CTA
- `plan/exercise/new.tsx` — create exercise form with name `TextInput` and inline muscle group dropdown; trims name, validates both fields, calls `addExercise` (which enforces name uniqueness), navigates back on success

**New in Step 8 (Split section — all inline on the Plan screen):**

- `SplitCard` rewritten as a fully interactive inline surface: tap-to-rename name, "Set active"/"Active" toggle, delete (single confirm), a row of 7 `DayCircle`s, and an expandable selected-day section
- `DayWorkoutList` — the expanded day section: lists that day's workouts (tap → edit, ✕ → remove), an "Add workout" button opening `WorkoutPicker`
- `DayCircle` reworked to `{ label, isSelected, isRest, onPress }`
- `NamePromptModal` — reusable cross-platform name-entry dialog (create + rename a split)
- `EditorHeader` — shared `Cancel / Title / Save` bar extracted from `WorkoutEditor` and `plan/exercise/new.tsx` (both refactored onto it)
- `addWorkoutToSplit(splitId, day, { name, exercises })` in `src/storage/splits.ts`; `createEmptyDays()` in `src/utils/split.ts`
- The three former known bugs (New Split noop, SplitCard noops, CardList stub) are all resolved.

## Next steps

Iteration 1 is complete. Next is **Iteration 2: Start workout session** (FAB flow, full
session view, in-session logging, mid-session modifications, finish + save to history, and the
persistent in-progress banner). To be planned when ready.

---

## Key Design Decisions

**Multiple workouts per day**
`Split.days` is `Record<DayKey, string[]>` — an array of workout IDs per day. Empty array means rest day. Supports zero to many workouts per day.

**Sets and reps belong to WorkoutExercise, not Exercise**
An Exercise is just a name and muscle group. Sets, reps, and load live on WorkoutExercise (plan template) and on the live session (runtime). This means the same exercise can appear in multiple workouts with different schemes.

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

**Own behaviour at the right level — don't over-prop or over-drill**
Two related rules:
1. If a prop always receives the same value at every call site, it is not a prop — move it inside the component. Examples: `onCreateExercise` was removed from `WorkoutEditorProps`, and `onCreateNew` was removed from `ExercisePickerProps`, because every caller passed `() => router.push('/plan/exercise/new')`; the navigation now lives inside each component via `useRouter`.
2. When a prop IS genuinely variable, pass it from the *closest* ancestor that has all the context needed to implement the handler — not from further up the tree than necessary. Threading a prop through layers that don't use it is a sign the handler belongs lower down.

**Standalone vs Embedded Workouts**
`Workout.isStandalone` distinguishes two types. `true` means created in the Workouts section and shown there. `false` means embedded inside a specific split, never shown in the Workouts section. When a user assigns a standalone workout to a split day, a new copy is created with `isStandalone: false` and a fresh id — the original standalone is untouched. This fully decouples the two sections. Edits to a standalone workout after copying do not propagate to the split's embedded copy — splits are fixed snapshots.

**Exercise storage split into two AsyncStorage keys**
Default and user-created exercises are stored under separate keys — `@quietrep/defaultExercises` and `@quietrep/userExercises`. This makes `seedDefaultExercises` trivial: it reads only `DEFAULTS_KEY` and compares names, with no need to filter by `isDefault` flag at query time. The public API in `src/storage/exercises.ts` is:

- `getDefaultExercises()` — reads `DEFAULTS_KEY` only
- `getUserExercises()` — reads `USER_KEY` only
- `getAllExercises()` — parallel read of both, returns defaults first then user exercises
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

When a list-item component holds local state derived from props (e.g., `SetRow`'s `repsText`/`loadText` buffers, seeded once at mount via `useState` and never re-synced — see `src/components/SetRow.tsx`), keying the list by array index breaks under insertion, removal, or reorder. React reuses component instances by *position*: removing item 0 shifts items 1..n into slots 0..n-1, but each reused instance keeps its stale local state, which now describes the wrong logical item. The underlying data is correct (verified by saving and reopening) — only the display is wrong, and a row appears to vanish from the wrong end of the list.

Fix: give each item a stable, client-generated `localKey` (via `uuid()`) and key the list by it instead of by array index, so each component instance stays bound to the same logical item across any reordering operation. `localKey` is a render-only identity — generated when editor state is seeded or created, and stripped before the data reaches storage, so persisted entities keep their canonical `{ reps, load }` shape.

This is implemented as a pair of frontend-only view models — `EditableSet` and `ResolvedEditableWorkoutExercise` in `src/types/index.ts` — following the exact "frontend view model, no DB counterpart" framing as `ResolvedWorkoutExercise` above (do not add `localKey` directly to `SetScheme`; that would blur the "types mirror the backend shape" contract — see Types are designed for backend transition below). See `WorkoutEditor` → `WorkoutExerciseCard` → `SetRow` for the canonical example, and apply the same approach anywhere else a list of stateful rows can be reordered or have items removed (e.g., the live session view in Iteration 2).

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
- Follow the existing pattern: SectionHeader, WorkoutCard, SplitCard, SetRow, ExerciseCard, ExercisePicker are all good examples of the right level of abstraction \
  (though we may have to organise the components directory into subdirectories in the future if it gets too large)

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
