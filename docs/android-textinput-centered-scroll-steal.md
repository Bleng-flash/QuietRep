# Why a centred `TextInput` swallows scroll gestures on Android

This documents **Bug 2** from the August 2026 dogfooding pass, investigated and **deliberately not
fixed** on 2026-08-08. It is a sibling of
[android-textinput-font-metrics.md](android-textinput-font-metrics.md) — same widget, different
native behaviour.

Every claim about React Native internals below cites the file and line it came from in
`node_modules`, following the convention set by
[android-keyboard-modal-provider.md](android-keyboard-modal-provider.md).

---

## 1. The symptom

Scrolling the exercise list during a live workout frequently fails: the gesture lands on a Load or
Reps field and the list does not move. The visible tell is that the field's **placeholder
disappears** — `0` for load, the target rep range for reps — and stays gone until the screen is
rebuilt (minimise the session and resume, and the hints are back).

Two symptoms, one cause. The placeholder is the *evidence*; the stolen scroll is the *damage*.

## 2. The mechanism

`ReactEditText.onTouchEvent` (`views/textinput/ReactEditText.kt:295-316`):

```kotlin
MotionEvent.ACTION_DOWN -> {
  detectScrollMovement = true
  // Disallow parent views to intercept touch events, until we can detect if we should be
  // capturing these touches or not.
  this.parent.requestDisallowInterceptTouchEvent(true)
}
MotionEvent.ACTION_MOVE ->
    if (detectScrollMovement) {
      if (!canScrollVertically(-1) && !canScrollVertically(1) &&
          !canScrollHorizontally(-1) && !canScrollHorizontally(1)) {
        // We cannot scroll, let parent views take care of these touches.
        this.parent.requestDisallowInterceptTouchEvent(false)
      }
      detectScrollMovement = false
    }
```

Every `TextInput` blocks its parent ScrollView on touch-**down**, unconditionally. On the first
touch-**move** it releases that block *only if it cannot scroll itself in any direction*.

`textAlign: 'center'` maps to `Gravity.CENTER_HORIZONTAL`
(`views/textinput/ReactTextInputManager.kt:567`). A centred single-line `EditText` reports a
non-zero horizontal scroll range where a left-aligned one reports none — so a centred field never
releases the block. It keeps the touch, scrolls its own content instead of the list, and the
placeholder rides that scroll offset out of the visible box. The offset persists because nothing
resets it; a remount cures it because the new view starts at offset 0.

This is **not** about text overflowing the field. A single `"0"` in a wide box cannot overflow, and
it breaks anyway.

## 3. The device evidence

A deterministic repro, far more reliable than trying to provoke it by scrolling: **type a character
into the field, delete it, then swipe across the field.** The hint does not come back.

Applied across every text field in the app, the split was unanimous:

| Field | Alignment | Hint survives a swipe? |
|---|---|---|
| Session Load / Reps (`LoggedSetRow`) | centre | **no** |
| Rep range min / max (`PlannedSetRow`) | centre | **no** |
| Bodyweight card (`LogBodyweightCard`) | centre | **no** |
| Session name (`SessionHeader`) | centre | **no** |
| Exercise picker search | left | yes |
| Exercise name (`/exercise/new`) | left | yes |
| Workout name (`WorkoutEditor`) | left | yes |

Four for four against three for three, keyed on exactly one style property.

## 4. The decision: not fixed

Removing `textAlign: 'center'` is the only known complete fix, and it was **rejected**: centred
values in the set-row boxes are a deliberate visual choice, and the loss is not worth it for a bug
whose practical cost is an occasional failed scroll. The column headers (`Load (kg)`, `Reps`) are
separately-centred `Text` elements, so left-aligning the values alone would also leave a centred
header over a left-aligned number.

Scope note if this is ever revisited: only fields **inside a scrollable** have a touch to steal —
`LoggedSetRow`, `PlannedSetRow`, `LogBodyweightCard`. `SessionHeader`'s title sits in pinned chrome
with nothing scrolling behind it, so its centring is harmless.

## 5. If it is ever fixed, the two candidates and what each actually buys

**Drop `textAlign: 'center'`** — the complete fix. Removes the scroll theft and the vanishing
placeholder together, because a left-aligned field releases the touch on the first move. Cost is
the visual regression above. One line per field, no new machinery.

**Render our own placeholder** — a `Text` behind the input, shown while the buffer is empty, with
the native `placeholder` prop dropped. Preserves centring. **Cosmetic only:** `textAlign: 'center'`
stays, so the field still swallows scroll gestures exactly as it does now.

That second option carries a trap worth stating plainly. **The vanishing placeholder is currently
the only visible signal that a scroll was stolen.** Drawing our own would leave the touch-stealing
in place with nothing on screen to reveal it — trading a visible minor bug for an invisible one,
and removing the thread that this entire investigation was pulled from. Do not reach for it as
"the safe option"; it is the option that hides the problem.

No known approach fixes the scroll theft *while* keeping centred text, short of patching React
Native itself to make the disallow-intercept conditional. `ReactTextInputManager` exposes no
`scrollEnabled` prop for Android single-line inputs — the only scroll-related prop is `onScroll`
(`ReactTextInputManager.kt:321`) — so there is no JS lever.

## 6. The transferable lesson: a flaky provocation manufactures false discriminators

Before the type-then-delete repro was found, the bug was provoked by scroll-swiping and it appeared
to depend on a long chain of things. Each looked like a real discriminator and **every one of them
was an artefact**:

| Believed | Reality |
|---|---|
| Breaks in `WorkoutSession`, not `WorkoutEditor` | Both break |
| Needs a session seeded from a workout template | Irrelevant |
| `targetMinReps`/`targetMaxReps` are the difference | Irrelevant |
| Only on the session's first open | Irrelevant |
| Persists after resume only via the "Any workout" path | Irrelevant |

All of it came from one unreliable gesture succeeding at different rates across runs. A failure to
reproduce was read as a negative result, and negatives are what build a matrix.

**When a bug is provoked by an unreliable gesture, a non-reproduction is not evidence of absence,
and any table built from such negatives is fiction.** Find a deterministic trigger *first*; every
discriminator recorded before one exists should be treated as unverified. Here the deterministic
repro arrived by accident — the tester happened to type a value and delete it — and it collapsed
five "findings" in a single step.

Related, and consistent with the existing rule that runtime observation outranks static analysis:
the analysis that survived was the one making a *falsifiable* claim about React state
(`value` stays `''`, `placeholder` is constant, so React sends nothing). On-screen instrumentation
confirmed it (`[][]` with the hint gone) and that reading stayed true through every later
correction, while everything inferred from the provocation matrix did not.
