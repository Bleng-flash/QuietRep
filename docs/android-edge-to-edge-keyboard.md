# Why the keyboard broke the bottom of our scroll screens — and why fixing it needed a dev build

This documents the root cause of a bug fixed on the `bugfix` branch: in `WorkoutEditor` and
`WorkoutSession`, once the keyboard opened you could no longer scroll the exercise-card list far
enough to reach the bottom actions ("Add exercise", "Delete workout" / "Discard session"). They
stayed hidden behind the keyboard, on Android.

Android changed how it hands the keyboard to apps, and our old approach had been quietly
relying on the *old* behaviour. Fixing it properly pulled in a native library, and a native library
is what forced the move off Expo Go to a development build. This is the whole causal chain.

---

## 1. The old world: Android resized the window for you (`adjustResize`)

Historically, an Android app declared `windowSoftInputMode="adjustResize"`. When the keyboard (the
"IME" — Input Method Editor) appeared, **the operating system shrank the app's window** so the
remaining content sat in the space *above* the keyboard.

For a scrolling screen this was effortless: a `ScrollView` inside a shrunken window simply had less
height, so its scrollable region grew and you could scroll down to anything the keyboard covered.

This is why our code looked the way it did. Every `KeyboardAvoidingView` in the app used:

```tsx
behavior={Platform.OS === 'ios' ? 'padding' : undefined}
```

On **iOS** the keyboard *overlays* the app and never resizes the window, so iOS genuinely needs
`KeyboardAvoidingView` to do the work (`behavior="padding"` shrinks the view manually). On
**Android**, `behavior` was `undefined` — i.e. `KeyboardAvoidingView` did *nothing* — the intent
being to lean on the OS's `adjustResize` window shrink instead. That split is a widely-copied
convention from the **pre-edge-to-edge** era, where it genuinely worked. The catch — see the next
section — is that this app never ran in that era.

## 2. The world we actually built in: edge-to-edge was already the default

This is the key correction to any "the ground shifted under us" instinct: **it didn't.** The
`adjustResize` assumption was already outdated *before this project began*. Two platform changes —
both already in effect when we started — made it so:

- **Android 15 (API level 35) enforces edge-to-edge display.** Apps targeting SDK 35 draw across the
  *entire* screen — behind the status bar at the top and the navigation bar at the bottom — instead
  of being letterboxed inside a "safe" content area.
- **Expo enabled edge-to-edge by default from SDK 52 onward.** Our app opts in explicitly:
  `android.edgeToEdgeEnabled: true` in `app.json` (we're on SDK 54, RN 0.81, New Architecture).

So this app has been edge-to-edge from its first commit. Nothing about the platform changed *during*
the project — we simply wrote the Android keyboard path against a pre-edge-to-edge mental model that
never matched how this app actually runs.

**Edge-to-edge fundamentally changes who is responsible for insets.** In the old model the OS carved
out a safe region and resized it for you. In edge-to-edge, the app owns the full screen and must
*itself* read the system "insets" — the status bar, the navigation bar, **and the keyboard** — and
lay its content out around them. The keyboard is no longer a window-resize event; it is just another
**inset** (`WindowInsets.ime`) that the app is expected to consume.

The consequence: under edge-to-edge, `adjustResize` does not produce the automatic content-shrink
the old model gave you. If nothing in the app consumes the IME inset, **the keyboard simply overlays
the content.**

## 3. Why it was broken here from the first commit — and why we only just noticed

Put the two together and the bug was baked in from the start:

- On Android, our `KeyboardAvoidingView` did nothing (`behavior: undefined`).
- It assumed the OS would shrink the window for the keyboard.
- But this app has always been edge-to-edge, where the OS does *not* do that automatically — and
  nothing else consumed the IME inset.
- So the scroll region **never shrank** on Android, ever. The content behind the keyboard was
  unreachable and the bottom buttons hidden — that was true from day one, not something that started
  working and then broke.

**Why it went unnoticed for so long:** the failure is silent (no error, just missing behaviour), and
it only *matters* when a critical control sits below the fold *and* the keyboard is open. Most of the
app's keyboard surfaces don't — their inputs and buttons sit high, above where the keyboard lands.
The two reorderable screens are the first place important actions ("Add exercise", "Delete workout"
/ "Discard session") live at the very bottom of a long, keyboard-driven list, so they're where the
long-standing gap finally became visible.

**iOS was never affected**, because iOS keyboards always overlay the window and our iOS path
(`behavior="padding"`) was already doing the shrinking itself — it never depended on an OS resize.
That's why the bug was Android-only.

It surfaced first on the two reorderable screens (not, say, Home) partly for the below-the-fold
reason above, and partly because they scroll through `ScrollViewContainer` — a Reanimated
`Animated.ScrollView` from `react-native-reorderable-list` — which reflows far less forgivingly than
a plain `ScrollView`. But the root cause was the same everywhere; the other screens were just closer
to the edge of "still works".

### A subtlety worth keeping straight

`KeyboardAvoidingView` never *reveals* hidden content. Even when it works perfectly, all it does is
make the scroll view **shorter** so the off-screen content becomes **reachable by scrolling** — the
buttons are still hidden the instant the keyboard opens; you scroll to them. "Reachable by
scrolling" is not the same as "visible". The bug was that on Android we didn't even get the
"reachable by scrolling" guarantee, because the view never shrank at all.

## 4. The fix: consume the IME inset correctly — which means a native library

The correct modern fix is to actually consume the IME inset in the app, on both platforms and
including edge-to-edge. React Native's built-in `KeyboardAvoidingView` was designed around the old
iOS-plus-`adjustResize` world; its Android measurement is unreliable under edge-to-edge, so simply
changing `behavior` to `"padding"` on RN's own component would *not* have made Android dependable.

We standardized on **`react-native-keyboard-controller`**, the de-facto community solution. It
ships a drop-in `KeyboardAvoidingView` with the same API, but its engine is different: a **native
module** reads the *actual* keyboard/IME inset from the OS (Android `WindowInsets`, iOS keyboard
frame) and streams it through Reanimated, giving a frame-accurate keyboard height on both platforms,
edge-to-edge included. A single `<KeyboardProvider>` at the app root feeds every screen.

The change across the app was therefore:

- swap the `KeyboardAvoidingView` import from `react-native` to `react-native-keyboard-controller`,
- use `behavior="padding"` on **both** platforms (delete the `Platform.OS === 'ios' ? … : undefined`
  gate — that gate was the literal reason Android did nothing),
- wrap the root in `<KeyboardProvider>` (and nest a second one inside `NamePromptModal`, because a
  React Native `<Modal>` is a separate native window that the root provider's context can't reach).

## 5. Why the fix forced a development build (off Expo Go)

`react-native-keyboard-controller` contains **native code** (Kotlin / Swift), and that is the link
to the whole dev-build detour:

- **Expo Go is a single pre-compiled app** with a *fixed* set of native modules baked in by Expo.
  You cannot add native code to an already-compiled app at runtime, so any native library that
  Expo didn't pre-bundle simply cannot load in Expo Go. Everything we used *before* was either
  pure JavaScript or already in Expo Go's set (including `reanimated` / `gesture-handler`, which is
  why `react-native-reorderable-list` — pure JS on top of them — worked). `keyboard-controller` is
  the first dependency we've added that Expo Go doesn't ship.
- **A development build** is our *own* compiled version of the app (`expo-dev-client` + our exact
  native dependencies), installed alongside Expo Go as a separate app. It behaves like Expo Go for
  our project — launches, connects to Metro, fast-refresh, dev menu — but because it was compiled
  with *our* native module set, `keyboard-controller` works. We build it via **EAS Build** (Expo's
  cloud build service; see `eas.json`, `development` profile), which runs the native Gradle compile
  on a server and hands back an installable APK.
- **The release path is unchanged.** Production was always going to be a native EAS build (we
  already ship native deps like `reanimated`, `gesture-handler`, `svg`, `reorderable-list`); this
  library bundles into that binary exactly like they do. Real users never used Expo Go anyway.

So the causal chain, end to end:

> This app is edge-to-edge (Android 15's default; Expo SDK 52+'s default) → under edge-to-edge the OS
> does not auto-resize the window for the keyboard → our Android `KeyboardAvoidingView` did nothing
> and assumed an OS resize that never happened here → so bottom-of-scroll content was unreachable on
> Android from the start (we only noticed on the reorderable screens) → the correct fix is to consume
> the IME inset via `react-native-keyboard-controller` → that library has native code → native code
> can't load in Expo Go → we needed a development build.

---

## Takeaways

- **A latent bug is not a new bug.** This was broken on Android from the first commit — our Android
  code assumed a pre-edge-to-edge world this app never actually ran in. It appeared "suddenly" only
  because we reached the first screen where it *mattered* (critical buttons below the fold with the
  keyboard open), not because anything shifted underneath us.
- **`behavior: undefined` on Android was a hidden dependency on `adjustResize`.** Relying on implicit
  OS behaviour is fragile precisely because it fails *silently* — no error, just missing behaviour
  you can go a long time without noticing, especially if it never matched your platform to begin with.
- **Edge-to-edge means the app owns its insets** — status bar, navigation bar, and keyboard. Any
  future "content hidden behind a system UI element" bug on Android should be read through this lens
  first.
- **Native dependency ⇒ development build.** Adding any library with native code takes you off Expo
  Go. That's a one-time build cost, not a change to how you ship.
