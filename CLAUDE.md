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
| 8 | SplitEditor — create and edit splits | Done |
| 9 | Exercise screens — new exercise, view all exercises | Not started |

## Current State

Steps 1–8 are complete. The following is fully functional:

- Plan index screen with Splits, Workouts, and Exercises sections
- Full WorkoutEditor flow — create and edit workouts, add/remove/reorder exercises, configure sets and reps, exercise picker modal with live search
- Full SplitEditor flow — create and edit splits, assign workouts to days via WorkoutPicker, create new embedded workouts via round-trip to WorkoutEditor, active split toggle, cascade delete
- All storage operations for exercises, workouts, splits, and active split
- 24 default exercises seeded on first launch via `seedDefaultExercises` in `src/storage/exercises.ts`
- Safe area insets applied correctly throughout

**New in Step 8:**

- `src/storage/pendingNewWorkout.ts` — in-memory module for the WorkoutEditor round-trip (see Key Design Decisions)
- `src/components/WorkoutPicker.tsx` — pageSheet modal for selecting/creating workouts; mirrors ExercisePicker
- `src/components/SplitDayRow.tsx` — per-day row in SplitEditor showing assigned workouts with add/remove buttons
- `src/components/SplitEditor.tsx` — main split editor component
- `plan/split/new.tsx` and `plan/split/[splitId].tsx` — replaced placeholder screens

**Known issues in SplitEditor (to be fixed before Step 9):**

1. **Cannot edit an embedded workout from SplitEditor.** In `SplitDayRow`, the `WorkoutCard` has `onPress={() => {}}` (deliberate noop). Tapping an assigned workout does nothing — the user can only remove it. The fix requires wiring `onPress` to navigate to `plan/workout/[workoutId]`, but this is blocked by the design issue below.

2. **Bifurcated state with fake id (design smell).** SplitEditor maintains two separate state records per day — `dayWorkouts` (already in storage) and `pendingDayWorkouts` (local-only, not yet saved). These are merged into a single display array via `buildDisplayWorkouts`, which requires casting pending entries into the `Workout` shape using a `localKey` UUID as a fake `id` field. This makes it impossible to cleanly distinguish a real storage workout from a pending one by id alone — which is exactly what the edit fix needs to do. The fix is to refactor `SplitEditor` and `SplitDayRow` to use a discriminated union (see Next Steps). The edit bug is unblocked once the refactor is done.

Step 9 currently navigates to a placeholder screen.

## Next steps in current iteration

### Pre-Step-9 refactor — SplitEditor DayEntry discriminated union (Next)

The current `SplitEditor` state is bifurcated into `dayWorkouts` (persisted) and `pendingDayWorkouts` (local-only), merged at render time via `buildDisplayWorkouts`. This requires casting pending entries into the `Workout` shape with a fake `id`. Replace both state records with a single discriminated union per day:

```ts
type DayEntry =
  | { kind: 'persisted'; workout: Workout }
  | {
      kind: 'pending';
      localKey: string;
      name: string;
      exercises: WorkoutExercise[];
    };
```

- `SplitEditor` — replace `dayWorkouts` + `pendingDayWorkouts` with `dayEntries: Record<DayKey, DayEntry[]>`; remove `buildDisplayWorkouts`; update all handlers (add, remove, save) to switch on `kind`
- `SplitDayRow` — accept `DayEntry[]` instead of `Workout[]`; render `WorkoutCard` for `persisted` entries, a simpler display for `pending` entries; `onEdit` only fires for `persisted` entries (no fake id needed)

This also unblocks the open bug: **tapping a WorkoutCard in SplitDayRow should navigate to `plan/workout/[workoutId]` to edit it** — currently a noop. With the discriminated union, `persisted` entries have a real `workout.id` and `onEdit` can be wired cleanly. `pending` entries simply don't provide an edit action.

### Step 9 — Exercise screens

- `plan/exercise/index.tsx` — full catalog of all exercises (default + user-created), with a delete button on user-created ones and an "Add exercise" button that pushes to `plan/exercise/new.tsx`
- `plan/exercise/new.tsx` — two fields: name and muscle group chip selector

---

## Key Design Decisions

**Multiple workouts per day**
`Split.days` is `Record<DayKey, string[]>` — an array of workout IDs per day. Empty array means rest day. Supports zero to many workouts per day.

**Sets and reps belong to WorkoutExercise, not Exercise**
An Exercise is just a name and muscle group. Sets, reps, and load live on WorkoutExercise (plan template) and on the live session (runtime). This means the same exercise can appear in multiple workouts with different schemes.

**WorkoutCard is the single source of truth for workout appearance**
Used identically in the Workouts section and inside expanded split day views. One component, consistent appearance everywhere.

**Tab bar is self-contained**
The custom tab bar does not use global style tokens. It has unique geometry — floating FAB, slot sizing, pressed states — that does not map to general-purpose tokens.

**Tab screens use useFocusEffect, stack screens use useEffect**
Tab screens stay mounted when you switch tabs so plain `useEffect` with empty deps only runs once and will not reload data when you return. Stack screens unmount when popped so plain `useEffect` is correct there.

**Safe area insets applied at component level**
Any component or screen that renders its own top bar must apply `useSafeAreaInsets` to push content below the camera cutout and status bar. Do not rely on the navigator to handle this when `headerShown: false`.

**Thin screens, fat components**
Screen files are wiring only — route params, storage calls, navigation. All UI and logic live in shared components. As much as possible, try to abstract out child components.

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
Embedded workouts are referenced only by their split. Deleting a split without its embedded workouts creates orphan records. Correct flow: call `deleteWorkoutsByIds(allEmbeddedWorkoutIds)` first, then `deleteSplit`. The `deleteWorkoutsByIds(ids: string[])` helper in workout storage handles batch deletion. Handled at the screen level (not inside the storage function) so the intent is explicit and visible.

**Deferred write — nothing reaches storage until split Save**
When a user assigns a standalone workout to a day, SplitEditor does NOT call `addWorkout` immediately. Instead it stores the workout data as a `PendingDayWorkout` entry (`{ localKey, name, exercises }`) in local state. `addWorkout` is called for every pending entry only when the split's Save button is pressed, at which point embedded copies are created and their real ids are collected to build `finalDays`. Cancel requires no cleanup because nothing was ever written.

**Embedded workout creation round-trip via in-memory module**
When the user taps "Create new workout" in WorkoutPicker, SplitEditor records the target day in a `useRef` (`pendingEmbeddedDayRef`) and navigates to `plan/workout/new?embedded=true`. The `?embedded=true` query param tells that screen NOT to call `addWorkout`; instead it stores `{ name, exercises }` in a module-level in-memory variable (`src/storage/pendingNewWorkout.ts` — three functions: `set`, `get`, `clear`; no AsyncStorage). On return, SplitEditor's `useFocusEffect` reads the module variable, creates a `PendingDayWorkout` entry, clears the variable, and resets the ref. The workout is only saved to storage when the split is saved. `useRef` is used instead of `useState` for `pendingEmbeddedDayRef` so it can be read inside `useFocusEffect`'s empty-deps callback without stale closure issues.

## Code Rules — Must Follow in Every Generation

### Naming

- No single-letter or abbreviated variable names. For example, `s, w, e, a` are forbidden. Use `splits, workouts, exercises, activeSplitId` instead.
- Every variable name must clearly communicate its purpose to the reader

### Comments

- Comments are welcome and encouraged — but make sure they are concise and value-adding
- Do not delete or suggest removing comments during cleanup or code generation, unless they are extremely verbose and add no value whatsoever
- "Self-documenting code" here means well-chosen variable and function names, not the absence of comments

### Styles

- Always use global styles from `@/styles` first. Only create a local `StyleSheet` entry if no global token covers it
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
