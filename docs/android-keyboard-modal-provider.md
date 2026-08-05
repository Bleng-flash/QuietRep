# Why a second `KeyboardProvider` killed keyboard tracking across the whole app

This documents a bug fixed in `956384b`, on the `bugfix` branch: with the keyboard open, the bottom
actions in `WorkoutEditor` and `WorkoutSession` could not be scrolled into view.

It is a sequel to [android-edge-to-edge-keyboard.md](android-edge-to-edge-keyboard.md), and its
cause was an instruction written *in that document*. It also took a wrong fix and a revert before
the real mechanism was found, and that detour is the most transferable part — it has its own section
at the end.

Every claim below cites the file and lines it came from in `node_modules`, deliberately: this bug
was caused by a confident, uncited assertion.

---

## 1. The symptom, and the pattern that identified it

With the keyboard up, "Add exercise" / "Delete Workout" / "Discard session" could not be reached by
scrolling. Testing on a physical phone produced this table:

| Flow | Result |
|---|---|
| Plan → Create new workout | broken |
| Plan → Edit existing workout | broken |
| Session → Quick (empty) session | broken |
| Session → from a workout | **works** |
| Session → from the split's today workout | **works** |
| …either of those, *after adding an exercise mid-session* | **breaks** |

That last row is what cracked it. The failure does not track the screen; it tracks **"has a picker
modal been opened yet"**. Flows that start empty must open the exercise picker to add anything, so
they always failed. Pre-populated sessions never needed the picker — until you added an exercise,
at which point they joined the broken set and stayed there.

A per-screen bug cannot behave like that. Something global was being broken by opening a modal.

## 2. Why nesting a provider looked correct

`PickerModal` and `NamePromptModal` each wrapped their contents in a second `<KeyboardProvider>`,
with a comment explaining that a React Native `<Modal>` is a separate native window that the root
provider's context cannot reach.

The premise is half-true, which is what made it durable. A `<Modal>` genuinely *is* a separate
native window — an Android `Dialog` — and that genuinely does matter for some things. It is why
`PickerModal` must apply its own `useSafeAreaInsets()`: the navigator's insets really do not reach
it. That earlier, correct lesson got generalised into a second one that was not.

## 3. What `KeyboardProvider` actually is

Not a context provider with some values in it. Its body is a `<KeyboardContext.Provider>` wrapping a
**native view**, `KeyboardControllerViewAnimated`, which emits `onKeyboardMoveStart` / `Move` /
`Interactive` / `End` (`react-native-keyboard-controller/src/animated.tsx:242-245`). That native
view is the measurement engine: it subscribes to `WindowInsets.Type.ime()` and streams the
keyboard's live position into the shared values every hook reads.

So there are two separable questions, and the old comment answered only one:

- Does the **React context** reach modal content? Yes. A Modal's children are ordinary React
  descendants; context does not care about native windows. (CLAUDE.md already said as much about the
  responder walk, which follows the same React tree.)
- Does the **native view** observe the Dialog's window? No — a view only sees the window it lives
  in. But that is not the end of the story, which is where the reasoning stopped.

## 4. The library already bridges Modals

`ModalAttachedWatcher` exists for exactly this. Each `KeyboardProvider` constructs one
(`views/EdgeToEdgeReactViewGroup.kt:217-224`) and enables it on attach, registered on the **global**
event dispatcher — so it reacts to `topShow` from *any* `<Modal>` in the app. On that event
(`modal/ModalAttachedWatcher.kt:38-98`) it resolves the Modal, reaches into
`dialog.window.decorView.rootView`, and attaches a fresh `KeyboardAnimationCallback` to the
**Dialog's own window**.

The decisive detail is how that callback reports:

```kotlin
KeyboardAnimationCallback(
  view = rootView,              // the Dialog's window
  eventPropagationView = view,  // the ROOT provider's view
  …
)
```

Every event it dispatches carries `eventPropagationView.id` (`listeners/KeyboardAnimationCallback.kt`,
throughout). Keyboard events originating in the Dialog's window are therefore delivered **through the
root provider's channel**. A nested provider was never needed. The library had already solved it.

## 5. The actual defect: setters, and a boolean that is not a refcount

With two providers mounted there are two watchers, both subscribed to the same global dispatcher,
both handling the same `topShow`. Look at what each one does (`ModalAttachedWatcher.kt:69-98`):

```kotlin
this.callback()?.suspend(true)                                     // suspends its OWN provider
ViewCompat.setWindowInsetsAnimationCallback(rootView, callback)    // SETTER — overwrites
dialog?.setOnDismissListener { … this.callback()?.suspend(false) } // SETTER — overwrites
```

Both registrations are **setters, not add-listeners**. The second watcher to run overwrites the
first's animation callback *and* its dismiss listener. Each watcher suspended its own provider's
callback on the way in, but only one dismiss listener survives to resume anything.

The other provider's callback is then suspended permanently, because suspension is a plain flag
rather than a count (`listeners/KeyboardAnimationCallback.kt:41-44, 68`):

```kotlin
interface Suspendable {
  var isSuspended: Boolean
  fun suspend(suspended: Boolean) { isSuspended = suspended }
}
```

and every emission path is gated on it (lines 174, 234, 292). When the stranded provider is the
**root** one, the entire app's keyboard tracking goes silent for the rest of the process.

This fires on any modern device: the suspending branch is gated on
`areEventsComingFromOwnWindow = !IS_ANIMATION_EMULATED`, and `IS_ANIMATION_EMULATED = SDK_INT < R`
(`constants/Keyboard.kt:6`) — so Android 11 and up.

## 6. Why it looked like "some screens" rather than "everything"

Because a `KeyboardAvoidingView` that receives no updates does not visibly break. It keeps its last
computed padding, which is usually zero, and simply stops avoiding. There is no error, no crash, and
nothing in the JS logs. A screen whose buttons sit above the keyboard looks perfectly fine; only a
screen with actions below the fold shows the damage. So the app appeared to have a scroll bug on two
screens, when it actually had a dead keyboard subsystem.

## 7. The wrong fix, and why it was wrong (the useful part)

The first attempt (`a37cfad`, reverted in `2eb25c3`) removed **every** `KeyboardAvoidingView` in the
app and replaced them with a `KeyboardSpacer` — a zero-height view that grows to the keyboard's
height at the bottom of each scrollable — driven by `useGenericKeyboardHandler`.

The theory was that `KeyboardAvoidingView`'s internal `useResizeMode()` mutates the Activity-wide
soft-input mode on mount and resets it on unmount, so a modal's avoider unmounting clobbered the
mode a still-mounted screen relied on. That mechanism is **real** — it is in
`hooks/index.ts` and `modules/KeyboardControllerModuleImpl.kt:15,68-74` — and it also correctly
predicted the "has a picker been opened" pattern. It was simply not what was happening.

On device it made things **worse**: every keyboard screen in the app stopped avoiding, not just two.
That outcome was the diagnosis. The spacers all read the root provider's event stream; the leak
kills that stream; so a change that put *more* surfaces on the stream converted a two-screen failure
into a total one.

Three lessons, in descending order of how much they would have saved:

- **A fix that makes a symptom worse — especially wider — means the diagnosis was wrong, not that
  the fix was incomplete.** This is the opposite of the existing lesson that a fix which *changes* a
  symptom implies a second cause. Widening is the tell.
- **Verify the mechanism before changing eight files.** The `useResizeMode` theory was plausible and
  cited real code, but it was never confirmed to be firing. The corrective change touched two files
  and deleted four lines.
- **Check whether the library already handles the primitive.** `ModalAttachedWatcher` was two
  directories away from the files being read the whole time. Grep the library for the primitive's
  name — `Modal`, here — before writing a workaround for it.

## 8. The contradiction was already in our own docs

Both documents that should have prevented this contained the correct statement **and** the wrong one:

- `CLAUDE.md` said the responder walk "follows the React tree, not the native view tree, so it
  crosses `Modal` boundaries" — and, nineteen lines later in the same section, that "the library's
  context does **not** cross a native Modal boundary, so a KAV inside one needs its own nested
  `<KeyboardProvider>`."
- `android-edge-to-edge-keyboard.md` said "a single `<KeyboardProvider>` at the app root feeds every
  screen" — and, seven lines later, to nest a second one inside `NamePromptModal`.

In both cases the wrong version won, because it was the one attached to an instruction. A statement
of fact is easy to skim past; a bullet telling you what to write gets followed.

**Two lines of your own documentation disagreeing about a mechanism is a defect, not a nuance.**
Reconcile it the moment you notice, even when neither line is the thing you came to read.

---

## The rule

**Exactly one `KeyboardProvider`, at the root in `_layout.tsx`. Never nest a second one, inside a
`<Modal>` or anywhere else.** A `KeyboardAvoidingView` inside a Modal is served by the root provider
and needs nothing added.

Across a `<Modal>` boundary: safe-area insets do **not** cross (own them yourself); React context
and the responder walk **do** cross; native IME measurement is **bridged** by the library. Those are
three separate mechanisms and reasoning from one to another is how this happened.
