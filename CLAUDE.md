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
| 8 | SplitEditor — create and edit splits | Not started |
| 9 | Exercise screens — new exercise, view all exercises | Not started |

## Current State

Steps 1–7 are complete. The app has a working Plan tab where users can create and edit workouts with exercises, sets, and reps. The following is fully functional:

- Plan index screen with Splits, Workouts, and Exercises sections
- Full WorkoutEditor flow — create and edit workouts, add/remove/reorder exercises, configure sets and reps, exercise picker modal with live search
- All storage operations for exercises, workouts, splits, and active split
- 24 default exercises seeded on first launch
- Safe area insets applied correctly throughout

A cleanup pass was also completed covering: `app.json` dark mode and splash color fixes, style imports consolidated to the `@/styles` barrel everywhere, `console.log` statements removed, abbreviated variable names corrected, duplicate set labels removed from `SetRow`, `DayCircle` given an overridable `disabled` prop, `ExerciseRow` renamed to `ExerciseCard`, column header alignment fixed in `ExerciseCard`/`SetRow`, and controlled `TextInput` decimal handling fixed in `SetRow`.

Steps 8 and 9 currently navigate to placeholder screens.

## Next steps in current iteration

### Step 8 — SplitEditor (Next)

Shared between `plan/split/new.tsx` and `plan/split/[splitId].tsx`. Features:

- Split name input
- Seven day rows each showing assigned workouts
- Tapping a day opens a picker modal to assign workouts
- Picker supports selecting existing workouts or creating a new one on the fly — pushes `plan/workout/new` with query params `?context=split&day=mon` so on save it returns to SplitEditor and auto-assigns the workout to the correct day
- Toggle to set as active split

### Step 9 — Exercise screens

- `plan/exercise/new.tsx` — two fields: name and muscle group chip selector
- `plan/exercise/index.tsx` — full list of all exercises with delete button on user-created ones

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

## Code Rules — Must Follow in Every Generation

### Naming

- No single-letter or abbreviated variable names. For example, `s, w, e, a` are forbidden. Use `splits, workouts, exercises, activeSplitId` instead.
- Every variable name must clearly communicate its purpose to the reader

### Comments

- Comments are welcome and encouraged — this is a personal learning project
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
- `react-native-get-random-values` must be the absolute first import in `_layout.tsx`
- Expo Router typed routes are enabled — all route files must exist before navigating to them
- Never use `sudo` with npm
